import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  checkUpdateGuidance,
  validateUpdateGuidance
} from '../release-update-guidance.mjs'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)
const rule = 'docs/ai/framework/rules/release-update-guidance.md'
const guide = 'docs/public/updates/text-official-fields-example-1-r3.md'
const source = 'packages/preset/src/text.ts'
const notePath = 'RELEASE_NOTES.md'
const note = (overrides = {}) => ({
  change: 'text-fields',
  owner: 'Framework packages',
  summary: 'Official Text adds two fields previously owned by consumers.',
  sources: [source],
  impact: 'integration',
  guides: [guide],
  reason: 'Consumers must compare local field meaning and retain extensions.',
  ...overrides
})
const block = (value) =>
  `\n\`\`\`update-note\n${JSON.stringify(value)}\n\`\`\`\n`
function check({
  notes = [note()],
  changes = [source, notePath],
  before = {},
  files = {}
} = {}) {
  const contents = {
    [source]: 'export const text = {}',
    [notePath]: notes.map(block).join(''),
    [guide]: '# Text\n\n## Canonical sources\n\nReviewed source references.\n',
    'docs/public/content-manifest.json': JSON.stringify({
      pages: [{ path: guide.slice('docs/public/'.length) }]
    }),
    ...files
  }
  return validateUpdateGuidance({
    changes,
    read: (file) => contents[file],
    readBase: (file) => before[file]
  })
}

test('optional features and behavior patches declare integration with a reachable guide', () => {
  for (const summary of [
    'Add optional Text editing.',
    'Fix Text default units in a patch.'
  ]) {
    assert.equal(check({ notes: [note({ summary })] }).notes, 1)
  }
})

test('App and generator releases use their own owners without a Changeset', () => {
  for (const file of [
    'apps/asyra-design/src/text.ts',
    'create-app/starter-app/package.json'
  ]) {
    assert.equal(
      check({
        changes: [file, notePath],
        notes: [
          note({
            owner: file.split('/').slice(0, 2).join('/'),
            sources: [file]
          })
        ],
        files: { [file]: '{}' }
      }).notes,
      1
    )
  }
})

test('internal changes need a no-action reason, not an invented guide', () => {
  assert.equal(
    check({
      notes: [
        note({
          impact: 'no-action',
          guides: [],
          reason: 'Internal test helper only; shipped behavior is unchanged.'
        })
      ]
    }).notes,
    1
  )
  assert.throws(
    () =>
      check({ notes: [note({ impact: 'no-action', guides: [], reason: '' })] }),
    /reason/
  )
})

test('missing notes, omitted files and unchanged old declarations fail', () => {
  assert.throws(() => check({ notes: [] }), /Missing update note.*text.ts/)
  assert.throws(
    () => check({ changes: [source, 'packages/core/src/load.ts', notePath] }),
    /Missing update note.*load.ts/
  )
  assert.throws(
    () => check({ before: { [notePath]: block(note()) } }),
    /Missing update note/
  )
})

test('ordinary Markdown-only changes remain exempt while added notes are still validated', () => {
  assert.equal(
    check({
      changes: ['README.md'],
      notes: [],
      files: { 'README.md': '# Docs' }
    }).mode,
    'documentation-only'
  )
  assert.throws(
    () => check({ changes: [notePath], notes: [note({ owner: '' })] }),
    /owner/
  )
  assert.throws(
    () => check({ notes: [], changes: [source, '.changeset/example.md'] }),
    /Missing update note/
  )
})

test('integration requires registered, present guide content with canonical sources', () => {
  assert.throws(() => check({ notes: [note({ guides: [] })] }), /guide/)
  assert.throws(() => check({ files: { [guide]: undefined } }), /guide/)
  assert.throws(
    () => check({ files: { [guide]: '# Placeholder' } }),
    /Canonical sources/
  )
  assert.throws(
    () =>
      check({ files: { 'docs/public/content-manifest.json': '{"pages":[]}' } }),
    /registered/
  )
  assert.throws(
    () => check({ notes: [note({ guides: ['../private.md'] })] }),
    /guide/
  )
})

test('invalid, incomplete or duplicate declarations fail', () => {
  for (const value of [
    note({ sources: [] }),
    note({ summary: '' }),
    note({ impact: 'unknown' }),
    note({ sources: ['../outside'] })
  ]) {
    assert.throws(() => check({ notes: [value] }))
  }
  assert.throws(() => check({ notes: [note(), note()] }), /Duplicate/)
  assert.throws(
    () => check({ files: { [notePath]: '\n```update-note\n{broken}\n```' } }),
    /Invalid update-note/
  )
})

test('deleted and renamed sources still need a disposition', () => {
  assert.equal(
    check({
      files: { [source]: undefined },
      before: { [source]: 'old definition' }
    }).notes,
    1
  )
  assert.throws(() => check({ files: { [source]: undefined } }), /source/)
  assert.throws(
    () =>
      check({ changes: [source, 'packages/preset/src/new-text.ts', notePath] }),
    /Missing update note/
  )
})

test('normal development and release entries reach one permanent rule without the plan', () => {
  const entries = [
    'AGENTS.md',
    ...[
      'agent-task',
      'feature',
      'framework-api-change',
      'app-feature',
      'bugfix',
      'refactor',
      'package-release-validation',
      'manual-app-release',
      'app-cloudflare'
    ].map((name) => `docs/ai/workflows/${name}.md`)
  ]
  for (const entry of entries) {
    const text = fs.readFileSync(path.join(root, entry), 'utf8')
    assert.ok(
      text.includes(
        entry === 'AGENTS.md'
          ? rule
          : '../framework/rules/release-update-guidance.md'
      ),
      entry
    )
  }
  const text = fs.readFileSync(path.join(root, rule), 'utf8')
  for (const link of text.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
    assert.ok(
      fs.existsSync(path.resolve(root, path.dirname(rule), link[1])),
      link[1]
    )
  }
})

test('PR checks and permanent tests are wired without touching publisher commands', () => {
  const workflow = fs.readFileSync(
    path.join(root, '.github/workflows/main.yml'),
    'utf8'
  )
  assert.match(workflow, /UPDATE_GUIDANCE_BASE_SHA:.*pull_request.base.sha/)
  assert.match(workflow, /UPDATE_GUIDANCE_HEAD_SHA:.*pull_request.head.sha/)
  assert.match(workflow, /run: yarn docs:updates:check/)
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8')
  )
  assert.ok(
    manifest.scripts['test:scripts'].includes(
      'scripts/docs/__tests__/release-update-guidance.test.mjs'
    )
  )
})

test('Git comparisons bind notes to the PR head and include untracked local work', (t) => {
  const parent = path.join(root, 'tmp')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'update-guidance-test-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  const write = (file, contents) => {
    fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true })
    fs.writeFileSync(path.join(directory, file), contents)
  }
  git('init', '-b', 'test-guidance')
  git('config', 'user.email', 'fixture@example.test')
  git('config', 'user.name', 'Guidance fixture')
  write(source, 'before')
  git('add', '.')
  git('commit', '-m', 'Fixture baseline')
  const base = git('rev-parse', 'HEAD')
  write(source, 'after')
  git('add', '.')
  git('commit', '-m', 'Missing declaration')
  const missingHead = git('rev-parse', 'HEAD')
  const internal = note({
    impact: 'no-action',
    guides: [],
    reason: 'Fixture-only change.'
  })
  write(notePath, block(internal))
  assert.throws(
    () =>
      checkUpdateGuidance({
        repositoryRoot: directory,
        base,
        head: missingHead
      }),
    /Missing update note/
  )
  assert.equal(
    checkUpdateGuidance({ repositoryRoot: directory, base }).notes,
    1
  )
  git('add', '.')
  git('commit', '-m', 'Declare fixture impact')
  const head = git('rev-parse', 'HEAD')
  fs.rmSync(path.join(directory, notePath))
  assert.equal(
    checkUpdateGuidance({ repositoryRoot: directory, base, head }).notes,
    1
  )
  write('untracked.js', 'new code')
  assert.throws(
    () => checkUpdateGuidance({ repositoryRoot: directory }),
    /Missing update note.*untracked.js/
  )
  assert.throws(
    () =>
      checkUpdateGuidance({
        repositoryRoot: directory,
        base: 'missing-ref',
        head
      }),
    /Command failed/
  )
})

test('integration guide reads are shared for one invocation and refreshed on the next', () => {
  const files = {
    [source]: 'source',
    [notePath]: block(note()) + block(note({ owner: 'Hosted Design' })),
    [guide]: '# Guide\n\n## Canonical sources\nSource',
    'docs/public/content-manifest.json': JSON.stringify({
      pages: [{ path: guide.slice('docs/public/'.length) }]
    })
  }
  const reads = new Map()
  const read = (file) => {
    reads.set(file, (reads.get(file) ?? 0) + 1)
    return files[file]
  }
  const input = { changes: [source, notePath], read, readBase: () => undefined }
  assert.equal(validateUpdateGuidance(input).notes, 2)
  assert.equal(reads.get(guide), 1)
  assert.equal(reads.get('docs/public/content-manifest.json'), 1)
  files[guide] = '# Broken guide'
  assert.throws(() => validateUpdateGuidance(input), /Canonical sources/)
})
