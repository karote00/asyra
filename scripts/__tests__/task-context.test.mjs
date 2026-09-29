import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertPlanSection,
  handoff,
  inheritContext,
  parseContext,
  preflight,
  renderContext,
  validateContext
} from '../task-context.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const planPath = 'docs/ai/framework/plans/example.md'
const context = {
  version: 1,
  mode: 'plan-task',
  objective: 'Implement the selected contract',
  base: { ref: 'origin/main', sha: 'a'.repeat(40) },
  prerequisites: [],
  plan: { path: planPath, section: '## Task 1', closeoutOwner: 'plan-owner' }
}

function fixture(t) {
  mkdirSync(path.join(root, 'tmp'), { recursive: true })
  const cwd = mkdtempSync(path.join(root, 'tmp/task-context-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  git('init', '-q', '-b', 'feature/task')
  git('config', 'user.name', 'Task Context Test')
  git('config', 'user.email', 'task-context@example.test')
  mkdirSync(path.dirname(path.join(cwd, planPath)), { recursive: true })
  writeFileSync(
    path.join(cwd, planPath),
    '# Example\n\n## Task 1\n\nContract\n\n## Task 2\n\nContract\n'
  )
  git('add', '.')
  git('commit', '-qm', 'plan contract')
  const input = structuredClone(context)
  input.base.sha = git('rev-parse', 'HEAD')
  return { cwd, git, input }
}

test('handoff and PR share exactly one explicit context block', () => {
  assert.deepEqual(parseContext(handoff(context)), context)
  assert.throws(() => parseContext('No association supplied'), /Exactly one/)
  assert.throws(
    () => parseContext(`${renderContext(context)}\n${renderContext(context)}`),
    /Exactly one/
  )
  assert.throws(
    () => validateContext({ ...context, mode: undefined }),
    /Explicit mode/
  )
  assert.throws(() => parseContext('```task-context\nnot JSON\n```'))
})

test('standalone is explicit and cannot retain a hidden plan', () => {
  assert.throws(
    () => validateContext({ ...context, mode: 'standalone' }),
    /Standalone/
  )
  const standalone = { ...context }
  delete standalone.plan
  assert.equal(
    validateContext({ ...standalone, mode: 'standalone' }).mode,
    'standalone'
  )
})

test('child carries plan identity, owner and prerequisites but selects its own section', () => {
  const parent = {
    ...context,
    mode: 'plan-closeout',
    prerequisites: ['b'.repeat(40)]
  }
  const child = inheritContext(parent, {
    objective: 'Second task',
    section: '## Task 2'
  })
  assert.equal(child.mode, 'plan-task')
  assert.deepEqual(child.plan, { ...context.plan, section: '## Task 2' })
  assert.deepEqual(child.prerequisites, parent.prerequisites)
  child.plan.closeoutOwner = 'changed'
  assert.equal(parent.plan.closeoutOwner, 'plan-owner')
  for (const selection of [
    { objective: 'Drop plan', section: '## Task 2', mode: 'standalone' },
    { objective: 'Change plan', section: '## Task 2', plan: {} },
    { objective: 'Missing selection' }
  ])
    assert.throws(() => inheritContext(parent, selection))
})

test('plan paths, sections, owners and base SHAs reject incomplete or unsafe values', () => {
  for (const value of [
    '../outside.md',
    'docs/ai/framework/plans/../../outside.md',
    '/absolute.md',
    'docs/ai/framework/plans/completed/old.md'
  ]) {
    assert.throws(() =>
      validateContext({ ...context, plan: { ...context.plan, path: value } })
    )
  }
  assert.throws(() =>
    validateContext({ ...context, base: { ref: 'main', sha: 'HEAD' } })
  )
  assert.throws(() => validateContext({ ...context, prerequisites: undefined }))
  assert.throws(() =>
    validateContext({
      ...context,
      plan: { ...context.plan, closeoutOwner: '' }
    })
  )
  assert.throws(() => assertPlanSection('# Plan\n', context), /exactly once/)
  assert.throws(
    () => assertPlanSection('## Task 1\n## Task 1\n', context),
    /exactly once/
  )
})

test('preflight requires feature branch, selected base and integrated prerequisites', (t) => {
  const { cwd, git, input } = fixture(t)
  assert.deepEqual(preflight(input, cwd), input)
  assert.throws(
    () => preflight({ ...input, prerequisites: ['f'.repeat(40)] }, cwd),
    /not integrated/
  )
  git('branch', '-m', 'main')
  assert.throws(() => preflight(input, cwd), /feature branch/)
})

test('plan must exist in base and selected task must remain present in checkout', (t) => {
  const { cwd, input } = fixture(t)
  writeFileSync(path.join(cwd, planPath), '# Plan\n## Wrong task\n')
  assert.throws(() => preflight(input, cwd), /exactly once/)
  assert.throws(
    () =>
      preflight(
        {
          ...input,
          plan: { ...input.plan, path: 'docs/ai/framework/plans/unmerged.md' }
        },
        cwd
      ),
    /selected base/
  )
})

test('CLI generates a child handoff without dispatching an agent or writing task state', (t) => {
  const { cwd, input } = fixture(t)
  writeFileSync(path.join(cwd, 'parent.json'), JSON.stringify(input))
  writeFileSync(
    path.join(cwd, 'selection.json'),
    JSON.stringify({ objective: 'Implement task two', section: '## Task 2' })
  )
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, 'scripts/task-context.mjs'),
      'child',
      'parent.json',
      'selection.json'
    ],
    { cwd, encoding: 'utf8' }
  )
  assert.equal(result.status, 0, result.stderr)
  assert.equal(parseContext(result.stdout).plan.section, '## Task 2')
})
