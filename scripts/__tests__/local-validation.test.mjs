import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import {
  collectLocalInputs,
  selectLocalValidation,
  localCheckCommands
} from '../local-validation.mjs'
import { classifyChanges, readWorkspaceManifests } from '../ci-scope.mjs'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
function fixture(t) {
  const parent = path.join(repositoryRoot, 'tmp/local-validation-fixtures')
  fs.mkdirSync(parent, { recursive: true })
  const root = fs.mkdtempSync(path.join(parent, 'git-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  const write = (name, content) =>
    fs.writeFileSync(path.join(root, name), content)
  git('init', '-q')
  git('config', 'user.name', 'Local validation fixture')
  git('config', 'user.email', 'fixture@example.invalid')
  write('.gitignore', '.env\n')
  for (const name of [
    'committed.txt',
    'staged.txt',
    'unstaged.txt',
    'cancelled.txt',
    'removed.txt',
    'old name.txt'
  ])
    write(name, 'original')
  git('add', '.')
  git('commit', '-qm', 'initial')
  const base = git('rev-parse', 'HEAD')
  git('update-ref', 'refs/remotes/origin/main', base)
  return { root, git, write, base }
}

test('local inputs union commit, index, working tree and untracked paths without ignoring staged reversals', (t) => {
  const { root, git, write, base } = fixture(t)
  write('committed.txt', 'committed')
  git('add', 'committed.txt')
  git('commit', '-qm', 'change')
  write('staged.txt', 'staged')
  write('cancelled.txt', 'staged')
  git('add', 'staged.txt', 'cancelled.txt')
  write('cancelled.txt', 'original')
  write('unstaged.txt', 'working')
  git('mv', 'old name.txt', 'new name.txt')
  fs.unlinkSync(path.join(root, 'removed.txt'))
  write('new\nfile.txt', 'untracked')
  write('.env', 'secret not recorded')
  const result = collectLocalInputs({ repositoryRoot: root })
  assert.equal(result.baseRevision, base)
  assert.deepEqual(
    result.changedPaths,
    [
      'cancelled.txt',
      'committed.txt',
      'new\nfile.txt',
      'new name.txt',
      'old name.txt',
      'removed.txt',
      'staged.txt',
      'unstaged.txt'
    ].sort()
  )
  assert.equal(JSON.stringify(result).includes('secret not recorded'), false)
  assert.equal(
    result.files.find(({ path }) => path === 'removed.txt').kind,
    'missing'
  )
  assert.equal(
    result.identity,
    collectLocalInputs({ repositoryRoot: root, base }).identity
  )
})

test('local identity changes for working content and index content even when paths remain identical', (t) => {
  const { root, git, write, base } = fixture(t)
  write('staged.txt', 'one')
  git('add', 'staged.txt')
  write('staged.txt', 'working')
  const first = collectLocalInputs({ repositoryRoot: root, base })
  write('staged.txt', 'two')
  git('add', 'staged.txt')
  write('staged.txt', 'working')
  const second = collectLocalInputs({ repositoryRoot: root, base })
  assert.deepEqual(first.changedPaths, second.changedPaths)
  assert.notEqual(first.identity, second.identity)
  write('staged.txt', 'other working')
  assert.notEqual(
    second.identity,
    collectLocalInputs({ repositoryRoot: root, base }).identity
  )
})

test('invalid base fails and clean checkout has explicit empty inputs', (t) => {
  const { root, base } = fixture(t)
  assert.deepEqual(
    collectLocalInputs({ repositoryRoot: root, base }).changedPaths,
    []
  )
  assert.throws(
    () => collectLocalInputs({ repositoryRoot: root, base: 'missing-ref' }),
    /Git input/
  )
})

test('fingerprinting a symlink does not read its target', (t) => {
  const { root, base } = fixture(t)
  fs.symlinkSync('/nonexistent/private-file', path.join(root, 'linked'))
  const result = collectLocalInputs({ repositoryRoot: root, base })
  assert.equal(result.files[0].kind, 'symlink')
  assert.match(result.files[0].digest, /^[a-f0-9]{64}$/)
})

function workspaceFixture(t) {
  const repo = fixture(t)
  const addWorkspace = (directory, name, dependencies = {}) => {
    fs.mkdirSync(path.join(repo.root, directory, 'src'), { recursive: true })
    repo.write(
      `${directory}/package.json`,
      JSON.stringify({
        name,
        scripts: { build: 'tsc', 'test:ci': 'vitest run', lint: 'eslint .' },
        dependencies
      })
    )
    repo.write(`${directory}/src/index.ts`, 'export const initial = 1')
  }
  addWorkspace('packages/example', '@fixture/example')
  addWorkspace('packages/consumer', '@fixture/consumer', {
    '@fixture/example': 'workspace:*'
  })
  addWorkspace('apps/client', '@fixture/client', {
    '@fixture/consumer': 'workspace:*'
  })
  addWorkspace('tools/helper', '@fixture/helper', {
    '@fixture/example': 'workspace:*'
  })
  repo.git('add', '.')
  repo.git('commit', '-qm', 'workspaces')
  return { ...repo, base: repo.git('rev-parse', 'HEAD'), addWorkspace }
}

test('local selection reuses CI owner closure for packages, downstream packages, apps and tools', (t) => {
  const { root, base, write } = workspaceFixture(t)
  write('packages/example/src/index.ts', 'export const changed = 2')
  const inputs = collectLocalInputs({ repositoryRoot: root, base })
  const plan = selectLocalValidation({ repositoryRoot: root, inputs })
  const manifests = readWorkspaceManifests(root)
  const expected = classifyChanges(
    inputs.changedPaths,
    manifests,
    manifests,
    new Map(),
    new Map(),
    [],
    [],
    { repositoryRoot: root, baseRevision: base }
  )
  assert.deepEqual(plan.executionPlan, expected.relationshipMap.executionPlan)
  assert.deepEqual(plan.workspaceMatrix.map(({ name }) => name).sort(), [
    '@fixture/client',
    '@fixture/consumer',
    '@fixture/example',
    '@fixture/helper'
  ])
  assert.equal(
    plan.e2eOwners.every(({ status }) => status === 'not-defined'),
    true
  )
  assert.deepEqual(plan.unresolved, [])
  assert.equal(fs.existsSync(path.join(root, 'tmp/local-validation')), false)
})

test('new workspaces are automatically selected and unknown inputs remain unresolved', (t) => {
  const { root, base, addWorkspace, write } = workspaceFixture(t)
  addWorkspace('apps/new-client', '@fixture/new-client')
  let plan = selectLocalValidation({
    repositoryRoot: root,
    inputs: collectLocalInputs({ repositoryRoot: root, base })
  })
  assert.equal(
    plan.workspaceMatrix.some(({ name }) => name === '@fixture/new-client'),
    true
  )
  write('unknown-file.weird', 'unknown')
  plan = selectLocalValidation({
    repositoryRoot: root,
    inputs: collectLocalInputs({ repositoryRoot: root, base })
  })
  assert.ok(plan.unresolved.length > 0)
})

test('documentation-only selection does not run application E2E', (t) => {
  const { root, base, write } = workspaceFixture(t)
  write('apps/client/README.md', '# Client')
  const plan = selectLocalValidation({
    repositoryRoot: root,
    inputs: collectLocalInputs({ repositoryRoot: root, base })
  })
  assert.deepEqual(plan.executionPlan.checks.e2e.selected, [])
  assert.equal(plan.workspaceMatrix.length, 0)
})

test('full validation resolves declaration task records to executable task names', (t) => {
  const { root, base } = workspaceFixture(t)
  const plan = selectLocalValidation({
    repositoryRoot: root,
    inputs: collectLocalInputs({ repositoryRoot: root, base }),
    full: true
  })
  // This fixture has no control-plane owner source; test the declaration handoff.
  plan.executionPlan.checks.controlPlane.mode = 'not-selected'
  const commands = localCheckCommands(plan, path.join(root, 'tmp/result'), root)
  assert.equal(commands[0].id, 'security-audit')
  const declarations = commands.find(({ id }) => id === 'declarations')
  assert.ok(declarations)
  assert.ok(declarations.args.every((value) => typeof value === 'string'))
  for (const { task } of plan.executionPlan.checks.frameworkDeclarations.tasks)
    assert.ok(declarations.args.includes(task))
})

test('existing separately owned E2E groups declare local argv and result evidence', () => {
  const policy = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, 'scripts/ci-relationships.json'),
      'utf8'
    )
  )
  for (const suite of policy.e2eSuites) {
    assert.ok(['yarn', 'node'].includes(suite.localCommand.executable))
    assert.ok(suite.localCommand.args.length > 0)
    assert.ok(['playwright', 'tap'].includes(suite.localCommand.evidence))
    if (suite.localCommand.evidence === 'playwright')
      assert.ok(suite.localCommand.args.includes('--max-failures=1'))
    assert.equal(suite.localCommand.args.includes('scripts/run-e2e.sh'), false)
  }
})

test('selected security audit runs before local builds and shared checks', (t) => {
  const { root, git, write } = workspaceFixture(t)
  write('package.json', JSON.stringify({ private: true, scripts: {} }))
  write('yarn.lock', '__metadata:\n  version: 8\n')
  git('add', 'package.json', 'yarn.lock')
  git('commit', '-qm', 'root manifest')
  const base = git('rev-parse', 'HEAD')
  write(
    'yarn.lock',
    '__metadata:\n  version: 8\n# changed dependency resolution'
  )
  const plan = selectLocalValidation({
    repositoryRoot: root,
    inputs: collectLocalInputs({ repositoryRoot: root, base })
  })
  plan.executionPlan.checks.controlPlane.mode = 'not-selected'
  assert.equal(plan.executionPlan.checks.securityAudit.mode, 'full')
  const commands = localCheckCommands(plan, path.join(root, 'tmp/result'), root)
  assert.deepEqual(commands[0], {
    id: 'security-audit',
    executable: 'yarn',
    args: ['security:audit'],
    env: {},
    evidence: { type: 'exit' }
  })
  assert.equal(commands.filter(({ id }) => id === 'security-audit').length, 1)
})

test('unselected security audit does not query the registry for documentation edits', (t) => {
  const { root, base, write } = workspaceFixture(t)
  write('apps/client/README.md', '# Client')
  const plan = selectLocalValidation({
    repositoryRoot: root,
    inputs: collectLocalInputs({ repositoryRoot: root, base })
  })
  assert.equal(plan.executionPlan.checks.securityAudit.mode, 'not-selected')
  const commands = localCheckCommands(plan, path.join(root, 'tmp/result'), root)
  assert.equal(
    commands.some(({ id }) => id === 'security-audit'),
    false
  )
})

for (const paths of [
  ['apps/fieldscope/src/domain/kinematic-trigonometry.ts'],
  ['packages/render-engine-pixi/src/mesh-material-shader.ts'],
  [
    'packages/render-engine/src/index.ts',
    'packages/preset/src/components/vector-native-fill.ts',
    'packages/preset/coverage-flow-contracts.json'
  ]
])
  test(`local profile commands consume exactly the same selection as CI for ${paths.join(', ')}`, () => {
    const inputs = {
      changedPaths: paths,
      baseRevision: 'a'.repeat(40),
      headRevision: 'b'.repeat(40)
    }
    const ci = classifyChanges(paths, readWorkspaceManifests(repositoryRoot))
    // Omit fictional revisions so manifest reads use the live checkout only.
    const local = selectLocalValidation({
      repositoryRoot,
      inputs: { ...inputs, baseRevision: null }
    })
    assert.deepEqual(
      local.profileFiles,
      ci.relationshipMap.fieldscopeProfileFiles
    )
    const command = localCheckCommands(
      local,
      path.join(repositoryRoot, 'tmp/selection-test')
    ).find((c) => c.id === 'fieldscope-profiles')
    assert.ok(command)
    assert.deepEqual(
      command.args.slice(1),
      local.profileFiles.flatMap((file) => ['--file', file])
    )
  })
