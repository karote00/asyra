import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  collectLocalInputs,
  selectLocalValidation,
  localCheckCommands
} from '../local-validation.mjs'
import { classifyChanges, readWorkspaceManifests } from '../ci-scope.mjs'
import * as localValidation from '../local-validation.mjs'

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
  ]) {
    write(name, 'original')
  }
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
  for (const { task } of plan.executionPlan.checks.frameworkDeclarations
    .tasks) {
    assert.ok(declarations.args.includes(task))
  }
})

test('local shared checks consume file evidence and reject a mismatched execution identity', (t) => {
  const { root, base } = workspaceFixture(t)
  const plan = selectLocalValidation({
    repositoryRoot: root,
    inputs: collectLocalInputs({ repositoryRoot: root, base }),
    full: true
  })
  plan.executionPlan.checks.controlPlane.mode = 'not-selected'
  const outputDirectory = path.join(root, 'tmp/result')
  const commands = localCheckCommands(plan, outputDirectory, root)
  const shared = commands.find(({ id }) => id === 'shared')

  assert.equal(typeof shared.env.CI_SCOPE_EVIDENCE_FILE, 'string')
  assert.equal(fs.existsSync(outputDirectory), false)
  assert.equal('CI_EXECUTION_PLAN' in shared.env, false)
  localValidation.writeLocalValidationEvidence(plan, commands, outputDirectory)

  const bin = path.join(root, 'bin')
  const trace = path.join(root, 'commands.log')
  fs.mkdirSync(bin)
  fs.writeFileSync(
    path.join(bin, 'yarn'),
    '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CHECK_TRACE"\n',
    { mode: 0o700 }
  )
  const env = {
    ...process.env,
    ...shared.env,
    PATH: bin + path.delimiter + process.env.PATH,
    CHECK_TRACE: trace
  }
  const run = () =>
    spawnSync(shared.executable, shared.args, {
      cwd: repositoryRoot,
      env,
      encoding: 'utf8',
      timeout: 10000
    })
  const result = run()

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(fs.readFileSync(trace, 'utf8').trim().split('\n'), [
    'lint',
    'test:scripts',
    'lint:naming'
  ])
  const report = JSON.parse(fs.readFileSync(shared.evidence.path, 'utf8'))
  assert.equal(report.identity.run, path.basename(outputDirectory))
  assert.equal(report.relationshipMapDigest, plan.relationshipMapDigest)
  assert.ok(
    Object.values(report.checks).every(({ status }) => status === 'passed')
  )

  const evidence = JSON.parse(
    fs.readFileSync(env.CI_SCOPE_EVIDENCE_FILE, 'utf8')
  )
  evidence.identity.head = '0'.repeat(40)
  fs.writeFileSync(env.CI_SCOPE_EVIDENCE_FILE, JSON.stringify(evidence))
  fs.unlinkSync(trace)
  fs.unlinkSync(shared.evidence.path)
  const rejected = run()

  assert.equal(rejected.status, 1)
  assert.match(rejected.stderr, /CI scope evidence does not match/)
  assert.equal(fs.existsSync(trace), false)
  assert.equal(fs.existsSync(shared.evidence.path), false)
})

test('local validation CLI writes evidence only on execution and completes shared checks', (t) => {
  const { root, git, write } = workspaceFixture(t)
  write('.gitignore', '.env\ntmp/\n')
  fs.mkdirSync(path.join(root, 'scripts'))
  write(
    'scripts/run-ci-checks.mjs',
    [
      "import { execFileSync } from 'node:child_process'",
      `execFileSync(process.execPath, [${JSON.stringify(path.join(repositoryRoot, 'scripts/run-ci-checks.mjs'))}], { stdio: 'inherit' })`
    ].join('\n')
  )
  git('add', '.')
  git('commit', '-qm', 'local runner fixture')
  const base = git('rev-parse', 'HEAD')
  write('apps/client/README.md', '# Client documentation')
  const bin = path.join(root, 'tmp/bin')
  const trace = path.join(root, 'tmp/commands.log')
  fs.mkdirSync(bin, { recursive: true })
  fs.writeFileSync(
    path.join(bin, 'yarn'),
    '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CHECK_TRACE"\n',
    { mode: 0o700 }
  )
  const run = (args) =>
    spawnSync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts/local-validation.mjs'),
        '--base',
        base,
        ...args
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          PATH: bin + path.delimiter + process.env.PATH,
          CHECK_TRACE: trace
        },
        encoding: 'utf8',
        timeout: 20000
      }
    )
  const preview = run([])

  assert.equal(preview.status, 0, preview.stderr)
  assert.equal(fs.existsSync(path.join(root, 'tmp/local-validation')), false)
  assert.equal(fs.existsSync(trace), false)
  const execution = run(['--run'])

  const [directory] = fs.readdirSync(path.join(root, 'tmp/local-validation'))
  const log = fs.readFileSync(
    path.join(root, 'tmp/local-validation', directory, '1.log'),
    'utf8'
  )
  assert.equal(execution.status, 0, execution.stdout + execution.stderr + log)
  assert.match(execution.stdout, /Local validation passed/)
  const result = JSON.parse(
    fs.readFileSync(
      path.join(root, 'tmp/local-validation', directory, 'result.json'),
      'utf8'
    )
  )
  assert.equal(result.status, 'passed')
  assert.equal(result.sourceVerified, true)
  assert.equal(result.checks.find(({ id }) => id === 'shared').status, 'passed')
  assert.equal(fs.readFileSync(trace, 'utf8'), 'lint\n')
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
    if (suite.localCommand.evidence === 'playwright') {
      assert.ok(suite.localCommand.args.includes('--max-failures=1'))
    }
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
  ['apps/asyra-fieldscope/src/domain/kinematic-trigonometry.ts'],
  ['packages/render-engine-pixi/src/mesh-material-shader.ts'],
  [
    'packages/render-engine/src/index.ts',
    'packages/preset/src/components/vector-native-fill.ts',
    'packages/preset/coverage-flow-contracts.json'
  ]
]) {
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
}

test('local plan Flow admission uses the same repository test selection as CI', (t) => {
  const { root } = fixture(t)
  const paths = ['docs/ai/framework/plans/example/example.flow.json']
  const ci = classifyChanges(paths, readWorkspaceManifests(repositoryRoot))
  const plan = selectLocalValidation({
    repositoryRoot,
    inputs: {
      changedPaths: paths,
      baseRevision: null,
      headRevision: 'a'.repeat(40)
    }
  })
  assert.deepEqual(plan.unresolved, [])
  assert.deepEqual(
    plan.executionPlan.checks.repositoryScripts,
    ci.executionPlan.checks.repositoryScripts
  )
  const outputDirectory = path.join(root, 'tmp/flow-admission')
  const commands = localCheckCommands(plan, outputDirectory)
  localValidation.writeLocalValidationEvidence(plan, commands, outputDirectory)
  const shared = commands.find(({ id }) => id === 'shared')
  assert.ok(shared)
  assert.ok(
    JSON.parse(
      fs.readFileSync(shared.env.CI_SCOPE_EVIDENCE_FILE, 'utf8')
    ).executionPlan.checks.repositoryScripts.tests.includes(
      'scripts/__tests__/plan-flow-documents.test.mjs'
    )
  )
  assert.equal(
    commands.some(({ id }) => id === 'control-plane-tests'),
    false
  )
})

test('local flow validation executes existing suites and stops before proof on consumer failure', (t) => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  const appManifest = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, 'apps/asyra-design/package.json'),
      'utf8'
    )
  )
  assert.equal(
    Object.values(appManifest.scripts).some((script) =>
      script.includes('tools/flow-inspector/control-plane/')
    ),
    false
  )
  const command = manifest.scripts['test:design-execution-flow']
  assert.equal(typeof command, 'string', 'Missing local flow validation entry')
  fs.mkdirSync(path.join(repositoryRoot, 'tmp'), { recursive: true })
  const directory = fs.mkdtempSync(
    path.join(repositoryRoot, 'tmp/execution-gate-')
  )
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  // Exercise the actual shell chain. Replace only external commands, not its control flow.
  for (const executable of ['yarn', 'node']) {
    const file = path.join(directory, executable)
    fs.writeFileSync(
      file,
      `#!/bin/sh\nprintf '%s\\n' '${executable}'" $*" >> "$GATE_TRACE"\ncase "$*" in *"$GATE_FAILURE"*) exit 23;; esac\nexit 0\n`
    )
    fs.chmodSync(file, 0o755)
  }
  const expected = [
    'yarn workspace @asyra/ai-agent-runtime build:ai-agent-runtime',
    'yarn workspace @asyra/ai-agent-runtime test:local',
    'yarn workspace @asyra/preset build:preset',
    'yarn workspace @asyra/preset exec vitest run src/__tests__/selection-subscriptions.test.ts',
    'yarn workspace @asyra/asyra-design test:server-response-harness',
    'node tools/flow-inspector/control-plane/cli.cjs --manifest apps/asyra-design/flow-contracts.json verify'
  ]
  for (const [failure, count] of [
    ['never-matches', 6],
    ['build:ai-agent-runtime', 1],
    ['test:local', 2],
    ['build:preset', 3],
    ['selection-subscriptions.test.ts', 4],
    ['test:server-response-harness', 5],
    ['verify', 6]
  ]) {
    const trace = path.join(directory, 'trace')
    fs.writeFileSync(trace, '')
    const result = spawnSync('/bin/sh', ['-c', command], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      timeout: 5000,
      env: {
        ...process.env,
        PATH: directory + path.delimiter + process.env.PATH,
        GATE_TRACE: trace,
        GATE_FAILURE: failure
      }
    })
    assert.equal(
      result.status,
      failure === 'never-matches' ? 0 : 23,
      result.stderr
    )
    assert.deepEqual(
      fs.readFileSync(trace, 'utf8').trim().split('\n'),
      expected.slice(0, count)
    )
  }
})
