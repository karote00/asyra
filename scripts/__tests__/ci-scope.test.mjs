import { spawnSync } from 'node:child_process'
import { rootInputImpact } from '../ci-input-impact.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  selectUpstreamBrowserProofs,
  classifyChanges,
  workflowScheduling,
  readCreateAppManifests,
  readDocumentationDirectories,
  readWorkspaceManifests
} from '../ci-scope.mjs'
import {
  executeWorkspaceChecks,
  resolveWorkspaceEvidence
} from '../run-workspace-checks.mjs'
import {
  executeSelectedChecks,
  runRepositoryScripts
} from '../run-ci-checks.mjs'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const manifests = readWorkspaceManifests(repositoryRoot)
const createAppManifests = readCreateAppManifests(repositoryRoot)
const names = (scope) =>
  scope.relationshipMap.workspaceMatrix.map(({ name }) => name)

test('model reference documents and images are recognized without runtime selection', () => {
  const result = classifyChanges(
    [
      'assets/asyra-office/models/README.md',
      'assets/asyra-office/models/animals/review/01-cat.png',
      'assets/asyra-office/models/architecture/review/reference.jpg',
      'assets/another-app/models/chair/chair-model-spec.json'
    ],
    manifests
  )
  assert.deepEqual(result.unknownPaths, [])
  assert.deepEqual(names(result), [])
  assert.equal(result.designE2ERequired, false)
  assert.equal(result.frameworkReleaseRequired, false)
})

test('large CI plans cross jobs without placing execution inputs in scheduling outputs', () => {
  const scope = classifyChanges(['tsconfig.json'], manifests)
  const inputs = Array.from(
    { length: 20000 },
    (_, i) => `src/changed-file-${i}.ts`
  )
  scope.executionPlan.changedPaths = inputs
  for (const workspace of scope.relationshipMap.workspaceMatrix) {
    workspace.testSelection.inputs = inputs
  }
  const before = JSON.stringify(scope)
  const scheduling = workflowScheduling(scope)
  assert.ok(Buffer.byteLength(before, 'utf16le') > 1048576)
  assert.ok(Buffer.byteLength(JSON.stringify(scheduling), 'utf16le') < 65536)
  assert.equal(JSON.stringify(scope), before)
  assert.equal(scheduling.workspaceMatrix.length, scope.workspaceMatrix.length)
  for (const name of [
    'securityAudit',
    'dependencyValidation',
    'turboValidation',
    'frameworkDeclarations'
  ]) {
    assert.equal(
      scheduling.executionPlan.checks[name].mode,
      scope.executionPlan.checks[name].mode
    )
  }
  const identity = {
    repository: 'local',
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
    integration: 'b'.repeat(40),
    run: '1',
    attempt: '1'
  }
  const mapDigest = createHash('sha256')
    .update(JSON.stringify(scope.relationshipMap))
    .digest('hex')
  const evidence = {
    ...scope,
    version: 2,
    identity,
    relationshipMapDigest: mapDigest
  }
  const selected = scheduling.workspaceMatrix[0]
  const resolved = resolveWorkspaceEvidence(
    selected,
    evidence,
    identity,
    mapDigest
  )
  assert.deepEqual(resolved.testSelection.inputs, inputs)
  assert.deepEqual(resolved, scope.relationshipMap.workspaceMatrix[0])
  assert.throws(
    () =>
      resolveWorkspaceEvidence(
        selected,
        { ...evidence, identity: { ...identity, head: 'c'.repeat(40) } },
        identity,
        mapDigest
      ),
    /identity/
  )
  assert.throws(
    () =>
      resolveWorkspaceEvidence(
        { ...selected, artifactId: '0'.repeat(16) },
        evidence,
        identity,
        mapDigest
      ),
    /workspace/
  )
  assert.throws(
    () =>
      resolveWorkspaceEvidence(
        selected,
        {
          ...evidence,
          relationshipMap: { ...evidence.relationshipMap, workspaceMatrix: [] }
        },
        identity,
        mapDigest
      ),
    /digest/
  )
})

test('model reference measurements and review evidence stay outside runtime selection', () => {
  const inputs = [
    'assets/asyra-office/models/people/man-reference-measurements.json',
    'assets/another-app/models/chair/review/02-floor-v6.json',
    'assets/another-app/models/chair/review/03-partition-v5-side.json',
    'assets/another-app/models/chair/review/bench-reference-layout.json',
    'assets/another-app/models/chair/review/awning-annotation-record.json',
    'assets/another-app/models/chair/review/evidence/comparison.json',
    'assets/another-app/models/chair/review/evidence/comparison-run.json',
    'assets/another-app/models/chair/review/runs/abc/bench-reference-layout.json',
    'assets/another-app/models/chair/review/02-floor-v6.svg'
  ]
  const result = classifyChanges(inputs, manifests)
  assert.deepEqual(result.unknownPaths, [])
  assert.deepEqual(names(result), [])
  assert.equal(result.designE2ERequired, false)
  assert.equal(result.frameworkReleaseRequired, false)
  assert.equal(
    result.relationshipMap.executionPlan.checks.repositoryScripts.mode,
    'not-selected'
  )
})

test('model reference Python drawing helpers and archived source are scoped to review directories', () => {
  const result = classifyChanges(
    [
      'assets/another-app/models/chair/review/draw_reference.py',
      'assets/another-app/models/chair/review/test_reference.py',
      'assets/another-app/models/chair/review/history/run/draw_reference.py.txt'
    ],
    manifests
  )
  assert.deepEqual(result.unknownPaths, [])
  assert.deepEqual(names(result), [])
  assert.equal(result.designE2ERequired, false)
  assert.equal(result.frameworkReleaseRequired, false)
})

test('model reference classification does not admit runtime paths or unrelated assets', () => {
  for (const input of [
    'assets/asyra-office/models/generate.py',
    'assets/asyra-office/models/runtime.js',
    'assets/asyra-office/models/package.json',
    'assets/asyra-office/runtime/config.json',
    'assets/asyra-office/models/scene.glb',
    'assets/asyra-office/models/chair/review/runtime.js',
    'assets/asyra-office/models/chair/review/package.json',
    'assets/asyra-office/models/chair/review/config.json',
    'assets/asyra-office/models/chair/review/scene.glb',
    'assets/asyra-office/models/chair/draw_reference.py',
    'assets/asyra-office/models/chair/draw_reference.py.txt',
    'assets/asyra-office/runtime/review/draw_reference.py',
    'assets/asyra-office/models/chair/preview/draw_reference.py',
    'assets/asyra-office/models/chair/review/notebook.ipynb'
  ]) {
    assert.ok(classifyChanges([input], manifests).unknownPaths.includes(input))
  }
})

test('standalone release consumer inputs select release readiness without unrelated workspaces', () => {
  for (const input of [
    'fixtures/framework-release-consumer/src/__tests__/release-flow.test.ts',
    'fixtures/framework-release-consumer/src/consumer.ts',
    'fixtures/framework-release-consumer/package.json'
  ]) {
    const result = classifyChanges([input], manifests)
    assert.deepEqual(result.unknownPaths, [], input)
    assert.equal(result.frameworkReleaseRequired, true, input)
    assert.deepEqual(names(result), [], input)
    assert.equal(
      result.relationshipMap.fieldscopeProfilesRequired,
      false,
      input
    )
    assert.equal(result.designE2ERequired, false, input)
  }
  assert.deepEqual(
    classifyChanges(['fixtures/unregistered-consumer/run.ts'], manifests)
      .unknownPaths,
    ['fixtures/unregistered-consumer/run.ts']
  )
})

test('App update consumers select retained-artifact validation without unrelated runtime jobs', () => {
  const inputs = spawnSync(
    'git',
    [
      'ls-files',
      'fixtures/app-update-text-consumer',
      'fixtures/app-update-text-subsequent'
    ],
    { cwd: repositoryRoot, encoding: 'utf8' }
  )
  assert.equal(inputs.status, 0)
  const files = inputs.stdout.trim().split('\n')
  assert.ok(files.length > 0)
  const result = classifyChanges(files, manifests)
  assert.deepEqual(result.unknownPaths, [])
  assert.deepEqual(names(result), [])
  assert.equal(result.frameworkReleaseRequired, false)
  assert.equal(result.designE2ERequired, false)
  assert.equal(result.relationshipMap.fieldscopeProfilesRequired, false)
  assert.equal(result.executionPlan.checks.repositoryScripts.mode, 'files')
  assert.deepEqual(result.executionPlan.checks.repositoryScripts.tests, [
    'scripts/__tests__/app-update-fixtures.test.mjs'
  ])
  assert.deepEqual(
    classifyChanges(['fixtures/unregistered-update/runtime.ts'], manifests)
      .unknownPaths,
    ['fixtures/unregistered-update/runtime.ts']
  )
})

test('an app change selects its package scripts and dependent workspace consumers', () => {
  const result = classifyChanges(['apps/asyra-design/src/main.tsx'], manifests)
  assert.deepEqual(names(result), ['@asyra/asyra-design'])
  assert.equal(result.designE2ERequired, true)
  assert.deepEqual(result.unknownPaths, [])
})

test('CI check selection narrows changed test inputs and declares E2E suites', () => {
  const collaboration = classifyChanges(
    ['apps/asyra-design/e2e/collaboration.spec.ts'],
    manifests
  )
  assert.deepEqual(
    collaboration.relationshipMap.executionPlan.checks.e2e.selected,
    ['collaboration']
  )
  assert.deepEqual(
    classifyChanges(
      ['apps/asyra-design/e2e/deep/nested-case.spec.ts'],
      manifests
    ).relationshipMap.executionPlan.checks.e2e.selected,
    ['functional']
  )
  assert.deepEqual(
    classifyChanges(
      ['apps/asyra-design/e2e/helpers/browser-config.ts'],
      manifests
    ).relationshipMap.executionPlan.checks.e2e.selected,
    ['collaboration', 'functional', 'render-contracts']
  )
  assert.deepEqual(
    classifyChanges(['scripts/run-e2e.sh'], manifests).relationshipMap
      .executionPlan.checks.e2e.selected,
    ['collaboration', 'functional', 'render-contracts']
  )

  const source = classifyChanges(['packages/core/src/index.ts'], manifests)
  assert.deepEqual(
    source.relationshipMap.executionPlan.checks.workspaces.find(
      ({ workspace }) => workspace === '@asyra/core'
    ).tests.inputs,
    ['packages/core/src/index.ts']
  )
  assert.deepEqual(source.relationshipMap.executionPlan.checks.lint, {
    mode: 'full',
    inputs: [],
    reason: 'repository-wide-lint-required'
  })
  assert.equal(
    source.relationshipMap.executionPlan.checks.workspaces.find(
      ({ workspace }) => workspace === '@asyra/asyra-design'
    ).tests.mode,
    'full'
  )
  assert.deepEqual(source.relationshipMap.executionPlan.checks.e2e.selected, [
    'collaboration',
    'functional',
    'render-contracts'
  ])
})

test('workspace manifests own independent lint, test, and standard E2E selections', () => {
  const source = classifyChanges(
    ['packages/lumen-core/src/index.ts'],
    new Map([
      [
        '@sample/lumen-core',
        {
          name: '@sample/lumen-core',
          directory: 'packages/lumen-core',
          group: 'packages',
          buildTask: 'build:lumen-core',
          testTask: 'test:ci',
          dependencies: new Set()
        }
      ],
      [
        '@sample/atlas-console',
        {
          name: '@sample/atlas-console',
          directory: 'apps/atlas-console',
          group: 'apps',
          buildTask: 'build:atlas-console',
          testTask: 'test:ci',
          dependencies: new Set(['@sample/lumen-core']),
          lintTask: 'lint',
          e2eTask: 'test:e2e:ci'
        }
      ]
    ])
  )
  const atlas = source.relationshipMap.workspaceMatrix.find(
    ({ name }) => name === '@sample/atlas-console'
  )
  assert.equal(atlas.lintSelection.mode, 'full')
  assert.equal(atlas.lintTask, 'lint')
  assert.equal(atlas.e2eSelection.mode, 'full')
  assert.equal(atlas.e2eTask, 'test:e2e:ci')
  assert.equal(atlas.testSelection.mode, 'full')
  assert.equal(
    source.relationshipMap.executionPlan.checks.workspaces.find(
      ({ workspace }) => workspace === '@sample/atlas-console'
    ).e2e.mode,
    'full'
  )
})

test('formatter ignore changes select lint ownership and its regression tests', () => {
  const result = classifyChanges(['.prettierignore'], manifests)
  assert.deepEqual(result.unknownPaths, [])
  assert.ok(
    result.executionPlan.checks.repositoryScripts.tests.includes(
      'scripts/__tests__/workspace-automation.test.mjs'
    )
  )
})

test('shared setup selects all E2E suites and fixture changes keep full owner tests', () => {
  const shared = classifyChanges(['tsconfig.json'], manifests)
  assert.deepEqual(shared.relationshipMap.executionPlan.checks.e2e.selected, [
    'collaboration',
    'flow-inspector-board',
    'functional',
    'render-contracts'
  ])

  const fixture = classifyChanges(
    ['packages/core/src/__tests__/fixtures/scene.json'],
    manifests
  )
  assert.equal(
    fixture.relationshipMap.executionPlan.checks.workspaces.find(
      ({ workspace }) => workspace === '@asyra/core'
    ).tests.mode,
    'full'
  )
})

test('deleted, renamed, configuration, and fixture inputs keep full test ownership', () => {
  for (const input of [
    'packages/core/src/__tests__/removed-case.test.ts',
    'packages/core/src/renamed-module.ts',
    'packages/core/vitest.config.ts',
    'packages/core/src/__tests__/fixtures/scene.json'
  ]) {
    const scope = classifyChanges([input], manifests)
    const core = scope.relationshipMap.executionPlan.checks.workspaces.find(
      ({ workspace }) => workspace === '@asyra/core'
    )
    assert.equal(core.tests.mode, 'full', input)
  }
})

test('transitive package sources select the consumer owner suite, not Vitest related', async () => {
  const upstreamOnly = classifyChanges(
    ['packages/utils/src/index.ts'],
    manifests
  )
  const mixed = classifyChanges(
    ['packages/core/src/index.ts', 'packages/utils/src/index.ts'],
    manifests
  )
  const coreInputs = [upstreamOnly, mixed].map(
    (scope) =>
      scope.relationshipMap.executionPlan.checks.workspaces.find(
        ({ workspace }) => workspace === '@asyra/core'
      ).tests
  )

  assert.deepEqual(
    coreInputs.map(({ mode }) => mode),
    ['full', 'full']
  )
  const coreWorkspace = upstreamOnly.relationshipMap.workspaceMatrix.find(
    ({ name }) => name === '@asyra/core'
  )
  const runnerCalls = []
  await executeWorkspaceChecks(coreWorkspace, {
    identity: {},
    relationshipMapDigest: 'a'.repeat(64),
    runTask: async (workspace, task, selection) => {
      runnerCalls.push({ workspace, task, selection })
    }
  })
  assert.deepEqual(runnerCalls, [
    {
      workspace: '@asyra/core',
      task: 'eslint',
      selection: coreWorkspace.lintSelection
    },
    {
      workspace: '@asyra/core',
      task: coreWorkspace.buildTask,
      selection: undefined
    },
    {
      workspace: '@asyra/core',
      task: 'has:test',
      selection: undefined
    },
    {
      workspace: '@asyra/core',
      task: 'test:ci',
      selection: coreWorkspace.testSelection
    }
  ])
  assert.ok(
    fs
      .readFileSync(
        path.join(
          repositoryRoot,
          'packages/core/src/__tests__/element-selection-api.test.ts'
        ),
        'utf8'
      )
      .includes("from '@asyra/utils'")
  )
})

test('repository contracts follow their declared inputs without a whole-script fallback', () => {
  const app = classifyChanges(['apps/asyra-fieldscope/src/main.tsx'], manifests)
  assert.equal(app.executionPlan.checks.repositoryScripts.mode, 'not-selected')
  for (const file of [
    'scripts/ci-scope.mjs',
    '.github/dependabot.yml',
    'apps/asyra-design/vite.config.ts',
    'apps/asyra-design/src/index.css'
  ]) {
    assert.equal(
      classifyChanges([file], manifests).executionPlan.checks.repositoryScripts
        .mode,
      'files',
      file
    )
  }
  const unknown = classifyChanges(
    ['new-root/consumer-contract.json'],
    manifests
  )
  assert.ok(unknown.unknownPaths.length)
})

test('plan-only changes select plan checks without API analysis or declaration builds', () => {
  for (const input of [
    'docs/ai/framework/plans/ci-workflow-splitting-plan.md',
    'docs/ai/apps/asyra-fieldscope/plans/completed/example/plan.md',
    'docs/ai/framework/PLANS.md',
    'docs/ai/framework/decisions/releases/unreleased.md'
  ]) {
    const { checks } = classifyChanges([input], manifests).relationshipMap
      .executionPlan
    assert.equal(checks.repositoryScripts.mode, 'files', input)
    assert.deepEqual(checks.repositoryScripts.tests, [
      'scripts/__tests__/plan-closeout.test.mjs',
      'scripts/__tests__/task-context.test.mjs'
    ])
    assert.equal(checks.frameworkDeclarations.mode, 'not-selected', input)
  }
})

test('internal workflow documentation selects contract tests without public API checks', () => {
  const { checks } = classifyChanges(
    ['docs/ai/workflows/package-release-validation.md'],
    manifests
  ).relationshipMap.executionPlan
  assert.equal(checks.repositoryScripts.mode, 'files')
  assert.ok(
    checks.repositoryScripts.tests.includes(
      'scripts/__tests__/workspace-automation.test.mjs'
    )
  )
  assert.ok(
    checks.repositoryScripts.tests.includes(
      'scripts/__tests__/ci-scope.test.mjs'
    )
  )
  assert.deepEqual(
    checks.repositoryScripts.tests.filter((file) =>
      file.startsWith('scripts/docs/')
    ),
    ['scripts/docs/__tests__/release-update-guidance.test.mjs']
  )
  assert.equal(checks.frameworkDeclarations.mode, 'not-selected')
})

test('public docs and mixed plan edits select public checks with their declaration prerequisites', () => {
  const { checks } = classifyChanges(
    [
      'docs/public/start/custom-composition.md',
      'docs/ai/framework/plans/example.md'
    ],
    manifests
  ).relationshipMap.executionPlan
  assert.equal(checks.repositoryScripts.mode, 'files')
  assert.ok(
    checks.repositoryScripts.tests.includes(
      'scripts/docs/__tests__/public-documentation.test.mjs'
    )
  )
  assert.ok(
    checks.repositoryScripts.tests.includes(
      'scripts/__tests__/plan-closeout.test.mjs'
    )
  )
  assert.equal(checks.frameworkDeclarations.mode, 'full')
  assert.ok(
    checks.frameworkDeclarations.tasks.some(
      (task) => task.workspace === '@asyra/persistence'
    )
  )
})

test('API-dependent source checks include declarations while CI contracts do not', () => {
  const source = classifyChanges(['packages/core/src/index.ts'], manifests)
    .executionPlan.checks
  assert.equal(source.repositoryScripts.mode, 'files')
  assert.equal(source.frameworkDeclarations.mode, 'full')
  assert.equal(
    classifyChanges(['scripts/ci-scope.mjs'], manifests).executionPlan.checks
      .frameworkDeclarations.mode,
    'not-selected'
  )
})

test('plans referenced by public pages check source hashes without invoking API analysis', () => {
  const plan =
    'docs/ai/framework/plans/headless-core-and-core-kernel-future-plan.md'
  for (const inputs of [
    [plan],
    [plan, 'docs/public/generated/source-map.json']
  ]) {
    const { checks } = classifyChanges(inputs, manifests).relationshipMap
      .executionPlan
    assert.equal(checks.repositoryScripts.mode, 'files')
    assert.ok(
      checks.repositoryScripts.tests.includes(
        'scripts/docs/__tests__/public-source-map.test.mjs'
      )
    )
    assert.ok(
      !checks.repositoryScripts.tests.includes(
        'scripts/docs/__tests__/public-documentation.test.mjs'
      )
    )
    assert.equal(checks.frameworkDeclarations.mode, 'not-selected')
  }
})

test('executable plan inputs retain full validation while public README inputs retain API checks', () => {
  for (const input of [
    'docs/ai/framework/plans/example/flow.cjs',
    'docs/ai/framework/plans/example/demo.mdx'
  ]) {
    const executable = classifyChanges([input], manifests).relationshipMap
      .executionPlan.checks
    assert.equal(executable.repositoryScripts.mode, 'full', input)
    assert.ok(executable.repositoryScripts.inputs.includes(input))
  }
  const readme = classifyChanges(['apps/asyra-design/README.md'], manifests)
    .relationshipMap.executionPlan.checks
  assert.ok(
    readme.repositoryScripts.tests.includes(
      'scripts/docs/__tests__/public-readme-validation.test.mjs'
    )
  )
  assert.equal(readme.frameworkDeclarations.mode, 'full')
})

test('Framework changes follow declared workspace edges transitively', () => {
  const result = classifyChanges(['packages/core/src/index.ts'], manifests)
  assert.ok(names(result).includes('@asyra/core'))
  assert.ok(names(result).includes('@asyra/asyra-design'))
  assert.ok(names(result).includes('@asyra/asyra-sim'))
  assert.ok(names(result).includes('@asyra/asyra-fieldscope'))
  assert.ok(names(result).includes('@asyra/starter-app'))
  assert.ok(
    result.relationshipMap.dependencyEdges.some(
      ({ dependency, consumer }) =>
        dependency === '@asyra/core' && consumer === '@asyra/asyra-design'
    )
  )
  assert.deepEqual(result.unknownPaths, [])
})

test('first-level apps, packages, and tools are discovered without named owner lists', async () => {
  const fixtureRoot = fs.mkdtempSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '.ci-workspaces-')
  )
  const commands = []
  const writeWorkspace = (group, slug, name, dependencies = {}) => {
    const directory = path.join(fixtureRoot, group, slug)
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name,
        dependencies,
        scripts: { [`build:${slug}`]: 'build', 'test:ci': 'test' }
      })
    )
  }
  try {
    fs.writeFileSync(
      path.join(fixtureRoot, 'package.json'),
      JSON.stringify({
        workspaces: ['apps/*', 'packages/*', 'tools/*', 'create-app/*']
      })
    )
    writeWorkspace('packages', 'lumen-core', '@sample/lumen-core')
    writeWorkspace('packages', 'signal-kit', '@sample/signal-kit', {
      '@sample/lumen-core': 'workspace:*'
    })
    writeWorkspace('apps', 'atlas-console', '@sample/atlas-console', {
      '@sample/lumen-core': 'workspace:*'
    })
    const atlasManifestPath = path.join(
      fixtureRoot,
      'apps/atlas-console/package.json'
    )
    const atlasManifest = JSON.parse(fs.readFileSync(atlasManifestPath, 'utf8'))
    atlasManifest.scripts.lint = 'eslint src'
    atlasManifest.scripts['test:e2e:ci'] = 'playwright test'
    fs.writeFileSync(atlasManifestPath, JSON.stringify(atlasManifest))
    writeWorkspace('tools', 'orbit-inspector', '@sample/orbit-inspector', {
      '@sample/signal-kit': 'workspace:*'
    })
    writeWorkspace(
      'create-app',
      'excluded-generator',
      '@sample/excluded-generator'
    )

    const discovered = readWorkspaceManifests(fixtureRoot)
    assert.deepEqual(
      [...discovered.values()].map(({ directory }) => directory).sort(),
      [
        'apps/atlas-console',
        'packages/lumen-core',
        'packages/signal-kit',
        'tools/orbit-inspector'
      ]
    )
    const scope = classifyChanges(
      ['packages/lumen-core/src/index.ts'],
      discovered
    )
    const entries = scope.relationshipMap.workspaceMatrix
    assert.deepEqual(
      entries.map(({ name }) => name),
      [
        '@sample/atlas-console',
        '@sample/lumen-core',
        '@sample/orbit-inspector',
        '@sample/signal-kit'
      ]
    )
    const atlas = entries.find(({ name }) => name === '@sample/atlas-console')
    assert.equal(atlas.lintTask, 'lint')
    assert.equal(atlas.e2eTask, 'test:e2e:ci')
    assert.equal(atlas.lintSelection.mode, 'full')
    assert.equal(atlas.e2eSelection.mode, 'full')

    for (const entry of entries) {
      await executeWorkspaceChecks(entry, {
        relationshipMapDigest: scope.relationshipMapDigest,
        identity: {
          repository: 'sample/repository',
          base: 'a'.repeat(40),
          head: 'b'.repeat(40),
          integration: 'c'.repeat(40),
          run: '4',
          attempt: '1'
        },
        runTask: async (workspace, task) => (
          commands.push(`${workspace}:${task}`),
          task === 'test:e2e:ci' ? { testCount: 1 } : undefined
        )
      })
    }
    assert.deepEqual(
      commands,
      entries.flatMap(({ name, lintTask, buildTask, testTask, e2eTask }) => [
        `${name}:${lintTask}`,
        `${name}:${buildTask}`,
        `${name}:${testTask}`,
        ...(e2eTask ? [`${name}:${e2eTask}`] : [])
      ])
    )
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

test('deleted and renamed workspace paths preserve base dependency impact', () => {
  const fixtureRoot = fs.mkdtempSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '.ci-workspace-history-'
    )
  )
  const writeWorkspace = (group, slug, name, dependencies = {}) => {
    const directory = path.join(fixtureRoot, group, slug)
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name,
        dependencies,
        scripts: { [`build:${slug}`]: 'build', 'test:ci': 'test' }
      })
    )
  }
  try {
    fs.writeFileSync(
      path.join(fixtureRoot, 'package.json'),
      JSON.stringify({ workspaces: ['apps/*', 'packages/*', 'tools/*'] })
    )
    writeWorkspace('packages', 'former-engine', '@sample/former-engine')
    writeWorkspace('apps', 'dependent-viewer', '@sample/dependent-viewer', {
      '@sample/former-engine': 'workspace:*'
    })
    const base = readWorkspaceManifests(fixtureRoot)

    fs.rmSync(path.join(fixtureRoot, 'packages/former-engine'), {
      recursive: true,
      force: true
    })
    writeWorkspace('packages', 'renamed-engine', '@sample/renamed-engine')
    writeWorkspace('apps', 'dependent-viewer', '@sample/dependent-viewer', {
      '@sample/renamed-engine': 'workspace:*'
    })
    const head = readWorkspaceManifests(fixtureRoot)
    const renamed = classifyChanges(
      [
        'packages/former-engine/src/index.ts',
        'packages/renamed-engine/src/index.ts'
      ],
      head,
      base
    )
    assert.deepEqual(names(renamed), [
      '@sample/dependent-viewer',
      '@sample/renamed-engine'
    ])

    const removed = classifyChanges(
      ['packages/former-engine/src/index.ts'],
      new Map([
        ['@sample/dependent-viewer', head.get('@sample/dependent-viewer')]
      ]),
      base
    )
    assert.deepEqual(names(removed), ['@sample/dependent-viewer'])
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

test('a failed workspace build prevents its test task from running', async () => {
  const commands = []
  const entry = {
    name: '@sample/failed-build',
    directory: 'packages/failed-build',
    lintTask: 'eslint',
    lintSelection: { mode: 'full', inputs: [], reason: 'test fixture' },
    buildTask: 'build:failed-build',
    testTask: 'test:ci',
    hasTestTask: null,
    testSelection: { mode: 'full', inputs: [], reason: 'test fixture' },
    e2eTask: null,
    e2eSelection: { mode: 'not-selected', inputs: [], reason: 'no-e2e-owner' },
    artifactId: 'c1ee386690afbe71'
  }
  const record = await executeWorkspaceChecks(entry, {
    relationshipMapDigest: 'a'.repeat(64),
    identity: {},
    runTask: async (_workspace, task) => {
      commands.push(task)
      if (task === entry.buildTask) {
        throw new Error('build failed')
      }
    }
  })
  assert.deepEqual(commands, ['eslint', 'build:failed-build'])
  assert.deepEqual(record.taskSequence, ['eslint', 'build:failed-build'])
  assert.equal(record.testStatus, 'skipped')
  assert.equal(record.status, 'failed')
})

test('a selected guarded workspace with no tests is recorded as zero-tests', async () => {
  const entry = {
    name: '@sample/empty-tests',
    directory: 'packages/empty-tests',
    lintTask: 'eslint',
    lintSelection: { mode: 'full', inputs: [], reason: 'test fixture' },
    buildTask: 'build:empty-tests',
    testTask: 'test:ci',
    hasTestTask: 'has:test',
    testSelection: { mode: 'full', inputs: [], reason: 'test fixture' },
    testRunner: { command: 'vitest', args: [], hasTestGuard: true },
    e2eSelection: { mode: 'not-selected', inputs: [], reason: 'no E2E owner' },
    artifactId: createHash('sha256')
      .update('@sample/empty-tests')
      .digest('hex')
      .slice(0, 16)
  }
  const calls = []
  const record = await executeWorkspaceChecks(entry, {
    relationshipMapDigest: 'a'.repeat(64),
    identity: {},
    runTask: async (_workspace, task) => {
      calls.push(task)
      if (task === 'has:test') {
        throw new Error('No test files found')
      }
    }
  })
  assert.deepEqual(calls, ['eslint', 'build:empty-tests', 'has:test'])
  assert.equal(record.testStatus, 'zero-tests')
  assert.equal(record.status, 'failed')
})

test('workspace execution preserves the selected Vitest related inputs', async () => {
  const entry = {
    name: '@sample/related-workspace',
    directory: 'packages/related-workspace',
    lintTask: 'eslint',
    lintSelection: { mode: 'full', inputs: [], reason: 'test fixture' },
    buildTask: 'build:related-workspace',
    testTask: 'test:ci',
    hasTestTask: null,
    testSelection: {
      mode: 'related',
      inputs: ['packages/related-workspace/src/index.ts'],
      reason: 'Vitest related-file graph',
      runner: { command: 'vitest', args: [], hasTestGuard: false }
    },
    e2eTask: null,
    e2eSelection: { mode: 'not-selected', inputs: [], reason: 'no-e2e-owner' },
    artifactId: createHash('sha256')
      .update('@sample/related-workspace')
      .digest('hex')
      .slice(0, 16)
  }
  const executed = []
  const record = await executeWorkspaceChecks(entry, {
    relationshipMapDigest: 'a'.repeat(64),
    identity: {},
    runTask: async (workspace, task, selection) => {
      executed.push({ workspace, task, selection })
    }
  })

  assert.equal(executed[2].task, 'test:ci')
  assert.deepEqual(executed[2].selection, entry.testSelection)
  assert.deepEqual(record.testSelection, entry.testSelection)
  assert.equal(record.status, 'success')
})

test('selected CI checks run only planned owners and record declared skips', async () => {
  const calls = []
  const result = await executeSelectedChecks(
    {
      version: 1,
      mode: 'incremental',
      changedPaths: ['apps/asyra-fieldscope/src/main.tsx'],
      unknownRelations: [],
      checks: {
        lint: {
          mode: 'files',
          inputs: ['apps/asyra-fieldscope/src/main.tsx'],
          reason: 'changed-files'
        },
        repositoryScripts: {
          mode: 'not-selected',
          command: 'test:scripts',
          inputs: [],
          reason: 'no-script-owner-inputs'
        },
        naming: {
          mode: 'full',
          command: 'lint:naming',
          inputs: ['apps/asyra-fieldscope/src/main.tsx'],
          reason: 'cross-file-name-and-persisted-identity-contract'
        },
        workspaces: [],
        e2e: { selected: [], notSelected: [] }
      }
    },
    {
      lint: async (plan) => calls.push(['lint', plan]),
      repositoryScripts: async (plan) => calls.push(['scripts', plan]),
      naming: async (plan) => calls.push(['naming', plan])
    }
  )

  assert.deepEqual(
    calls.map(([owner]) => owner),
    ['lint', 'naming']
  )
  assert.equal(result.checks.repositoryScripts.status, 'not-selected')
  assert.equal(result.checks.lint.status, 'passed')
  assert.equal(result.checks.naming.status, 'passed')
})

test('global compiler and package-manager configuration selects every workspace', () => {
  for (const file of ['tsconfig.json', '.yarnrc.yml', 'scripts/gen-turbo.js']) {
    const result = classifyChanges([file], manifests)
    assert.deepEqual(
      names(result),
      [...manifests.values()]
        .filter((workspace) => !workspace.contentOnly)
        .map((workspace) => workspace.name)
        .sort()
    )
    assert.equal(result.frameworkReleaseRequired, true)
  }
})

test('explicit documentation relationships select their actual workspace consumers', () => {
  const website = classifyChanges(['docs/public/guide.mdx'], manifests)
  assert.deepEqual(names(website), ['@asyra/asyra-framework-site'])

  const appDocs = classifyChanges(
    ['docs/ai/apps/asyra-fieldscope/PLANS.md'],
    manifests
  )
  assert.deepEqual(names(appDocs), [])

  const toolDocs = classifyChanges(
    ['docs/ai/tools/flow-inspector/CORE_PROOF.md'],
    manifests
  )
  assert.deepEqual(names(toolDocs), [])

  const packageDocs = classifyChanges(
    ['docs/ai/packages/core/README.md'],
    manifests
  )
  assert.deepEqual(names(packageDocs), [])
})

test('shared contract documents and tracked root documents require shared validation', () => {
  for (const input of [
    'README.md',
    'AGENTS.md',
    'docs/ai/framework/CODING_STANDARDS.md',
    'docs/ai/workflows/package-release-validation.md'
  ]) {
    const result = classifyChanges([input], manifests)
    assert.equal(result.relationshipMap.sharedValidationRequired, true, input)
    assert.deepEqual(names(result), [], input)
    assert.deepEqual(result.unknownPaths, [], input)
  }
})

test('non-workflow GitHub configuration and templates use the shared CI owner', () => {
  for (const input of [
    '.github/dependabot.yml',
    '.github/pull_request_template.md'
  ]) {
    const result = classifyChanges([input], manifests)
    assert.deepEqual(result.workspaceMatrix, [], input)
    assert.equal(result.relationshipMap.sharedValidationRequired, true, input)
    assert.deepEqual(result.unknownPaths, [], input)
  }
})

test('new first-level documentation sections are discovered as shared inputs', () => {
  const fixtureRoot = fs.mkdtempSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '.ci-doc-roots-')
  )
  try {
    fs.mkdirSync(path.join(fixtureRoot, 'docs/field-manuals'), {
      recursive: true
    })
    const documentationRoots = readDocumentationDirectories(fixtureRoot)
    const result = classifyChanges(
      ['docs/field-manuals/guide.md'],
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      documentationRoots,
      documentationRoots
    )
    assert.deepEqual(documentationRoots, ['docs/field-manuals'])
    assert.deepEqual(result.workspaceMatrix, [])
    assert.deepEqual(result.unknownPaths, [])
    assert.ok(
      result.relationshipMap.documentationRoots.includes('docs/field-manuals')
    )
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

test('create-app remains outside the dynamic workspace matrix and keeps archive readiness', () => {
  const result = classifyChanges(
    ['create-app/asyra-design/src/index.js'],
    manifests,
    manifests,
    createAppManifests
  )
  assert.deepEqual(names(result), [])
  assert.deepEqual(result.createAppPackages, ['create-app/asyra-design'])
  assert.deepEqual(result.relationshipMap.excludedRoots, {
    'create-app': 'archive-readiness'
  })
  assert.deepEqual(result.unknownPaths, [])
})

test('release input and affected package changes select Framework release readiness', () => {
  const script = classifyChanges(
    ['scripts/release-package-artifacts.js'],
    manifests
  )
  assert.equal(script.frameworkReleaseRequired, true)
  assert.deepEqual(names(script), [])

  const packageChange = classifyChanges(
    ['packages/core/src/index.ts'],
    manifests
  )
  assert.equal(packageChange.frameworkReleaseRequired, true)
})

test('unknown paths select all workspaces and remain an aggregate blocker', () => {
  const result = classifyChanges(['new-unclassified-root/file.txt'], manifests)
  assert.deepEqual(
    names(result),
    [...manifests.values()]
      .filter((workspace) => !workspace.contentOnly)
      .map((workspace) => workspace.name)
      .sort()
  )
  assert.deepEqual(result.unknownPaths, ['new-unclassified-root/file.txt'])
})

test('empty incremental diff does not create product work', () => {
  assert.deepEqual(names(classifyChanges([], manifests)), [])
})

test('a selected workspace without build or test scripts remains an explicit blocker', () => {
  const invalid = new Map([
    [
      '@sample/missing-tasks',
      {
        name: '@sample/missing-tasks',
        directory: 'apps/missing-tasks',
        group: 'apps',
        dependencies: new Set()
      }
    ]
  ])
  const result = classifyChanges(['apps/missing-tasks/src/index.ts'], invalid)
  assert.deepEqual(result.workspaceMatrix, [])
  assert.deepEqual(result.unknownPaths, [
    'Workspace has no canonical CI test task: @sample/missing-tasks',
    'Workspace has no canonical build task: @sample/missing-tasks'
  ])
})

test('document check execution runs the selected formal files and retains exact execution evidence', () => {
  const { repositoryScripts } = classifyChanges(
    ['docs/ai/framework/PLANS.md'],
    manifests
  ).relationshipMap.executionPlan.checks
  const calls = []
  const result = runRepositoryScripts(repositoryScripts, (command, args) =>
    calls.push({ command, args })
  )
  assert.deepEqual(calls, [
    { command: process.execPath, args: ['--test', ...repositoryScripts.tests] }
  ])
  assert.deepEqual(result.executedTests, repositoryScripts.tests)
  assert.throws(() =>
    runRepositoryScripts(
      { ...repositoryScripts, tests: ['../../unregistered.test.mjs'] },
      () => assert.fail('must not execute')
    )
  )
  assert.throws(
    () =>
      runRepositoryScripts(repositoryScripts, () => {
        throw new Error('assertion failed')
      }),
    /assertion failed/
  )
})

test('Cloudflare workflow selections execute registered GitHub tests and reject arbitrary paths', () => {
  const { repositoryScripts } = classifyChanges(
    ['.github/workflows/app-cloudflare.yml'],
    manifests
  ).relationshipMap.executionPlan.checks
  assert.ok(
    repositoryScripts.tests.includes(
      '.github/__tests__/app-cloudflare.test.mjs'
    )
  )
  const calls = []
  const result = runRepositoryScripts(repositoryScripts, (command, args) =>
    calls.push({ command, args })
  )
  assert.deepEqual(result.executedTests, repositoryScripts.tests)
  assert.deepEqual(calls, [
    { command: process.execPath, args: ['--test', ...repositoryScripts.tests] }
  ])
  for (const file of [
    '.github/__tests__/unknown.test.mjs',
    '.github/../scripts/escape.test.mjs',
    '.github/workflows/app-cloudflare.yml'
  ]) {
    assert.throws(() =>
      runRepositoryScripts({ ...repositoryScripts, tests: [file] }, () =>
        assert.fail('must not execute')
      )
    )
  }
})

test('mixed source and documentation edits combine required repository contracts and declaration build', () => {
  const { checks } = classifyChanges(
    ['docs/ai/framework/PLANS.md', 'packages/core/src/index.ts'],
    manifests
  ).relationshipMap.executionPlan
  assert.equal(checks.repositoryScripts.mode, 'files')
  assert.ok(
    checks.repositoryScripts.tests.includes(
      'scripts/__tests__/plan-closeout.test.mjs'
    )
  )
  assert.equal(checks.frameworkDeclarations.mode, 'full')
})

test('full validation does not lose repository checks on a documentation-only changed path', () => {
  const { checks } = classifyChanges(
    ['docs/ai/framework/PLANS.md'],
    manifests,
    manifests,
    new Map(),
    new Map(),
    ['docs/ai'],
    ['docs/ai'],
    { fullValidation: true }
  ).relationshipMap.executionPlan
  assert.equal(checks.repositoryScripts.mode, 'full')
  assert.equal(checks.frameworkDeclarations.mode, 'full')
})

test('documentation and test-only package edits do not select consumer builds or release readiness', () => {
  for (const input of [
    'packages/core/README.md',
    'docs/ai/apps/asyra-fieldscope/PLANS.md'
  ]) {
    const result = classifyChanges([input], manifests)
    assert.deepEqual(names(result), [], input)
    assert.deepEqual(result.executionPlan.checks.e2e.selected, [], input)
    assert.equal(result.frameworkReleaseRequired, false, input)
  }
  const testOnly = classifyChanges(
    ['packages/core/src/__tests__/element-selection-api.test.ts'],
    manifests
  )
  assert.deepEqual(names(testOnly), ['@asyra/core'])
  assert.deepEqual(testOnly.executionPlan.checks.e2e.selected, [])
  assert.equal(testOnly.frameworkReleaseRequired, false)
})

test('test files outside Design never select Design functional E2E', () => {
  for (const input of [
    'apps/asyra-framework-site/__tests__/routes.test.mjs',
    'scripts/docs/__tests__/public-source-map.test.mjs'
  ]) {
    const result = classifyChanges([input], manifests)
    assert.deepEqual(result.executionPlan.checks.e2e.selected, [], input)
  }
})

test('CI implementation and Changeset inputs select their contracts without product workspaces', () => {
  for (const input of [
    'scripts/ci-scope.mjs',
    'scripts/run-ci-checks.mjs',
    '.github/workflows/main.yml',
    '.changeset/example.md'
  ]) {
    const result = classifyChanges([input], manifests)
    assert.deepEqual(names(result), [], input)
    assert.deepEqual(result.executionPlan.checks.e2e.selected, [], input)
    assert.equal(
      result.executionPlan.checks.repositoryScripts.mode,
      'files',
      input
    )
    assert.equal(
      result.executionPlan.checks.frameworkDeclarations.mode,
      'not-selected',
      input
    )
  }
})

test('explicit full validation selects every workspace even when only one App changed', () => {
  const result = classifyChanges(
    ['apps/asyra-framework-site/app/page.tsx'],
    manifests,
    manifests,
    new Map(),
    new Map(),
    ['docs/ai'],
    ['docs/ai'],
    { fullValidation: true }
  )
  assert.deepEqual(
    names(result),
    [...manifests.values()]
      .filter((workspace) => !workspace.contentOnly)
      .map((workspace) => workspace.name)
      .sort()
  )
})

test('root script edits select script contracts without product builds', () => {
  const result = classifyChanges(
    ['package.json'],
    manifests,
    manifests,
    new Map(),
    new Map(),
    ['docs/ai'],
    ['docs/ai'],
    {
      inputChanges: {
        baseRoot: { scripts: { 'test:scripts': 'old' } },
        headRoot: { scripts: { 'test:scripts': 'new' } }
      }
    }
  )
  assert.deepEqual(names(result), [])
  assert.equal(result.executionPlan.checks.repositoryScripts.mode, 'files')
  assert.deepEqual(result.executionPlan.checks.e2e.selected, [])
})

test('lock resolution edits select only workspaces that consume the changed resolution', () => {
  const lock = (version) =>
    `__metadata:\n  version: 8\n\n"next@npm:^16.3.0":\n  version: ${version}\n  resolution: "next@npm:${version}"\n\n"react@npm:19.2.8":\n  version: 19.2.8\n  resolution: "react@npm:19.2.8"\n\n"@asyra/asyra-framework-site@workspace:apps/asyra-framework-site":\n  resolution: "@asyra/asyra-framework-site@workspace:apps/asyra-framework-site"\n  dependencies:\n    next: "npm:^16.3.0"\n    react: "npm:19.2.8"\n\n"@asyra/asyra-design@workspace:apps/asyra-design":\n  resolution: "@asyra/asyra-design@workspace:apps/asyra-design"\n  dependencies:\n    react: "npm:19.2.8"\n`
  const selectedManifests = new Map(
    [...manifests].filter(([name]) =>
      ['@asyra/asyra-framework-site', '@asyra/asyra-design'].includes(name)
    )
  )
  const result = classifyChanges(
    ['yarn.lock'],
    selectedManifests,
    selectedManifests,
    new Map(),
    new Map(),
    ['docs/ai'],
    ['docs/ai'],
    {
      inputChanges: {
        baseLock: lock('16.3.3'),
        headLock: lock('16.3.6'),
        baseRoot: {},
        headRoot: {}
      }
    }
  )
  assert.deepEqual(names(result), ['@asyra/asyra-framework-site'])
  assert.equal(result.workspaceMatrix[0].e2eSelection.mode, 'full')
  assert.deepEqual(result.executionPlan.checks.e2e.selected, [])
  assert.equal(result.frameworkReleaseRequired, false)
})

test('production artifacts follow the selected runtime Apps and explicit verifier inputs', () => {
  assert.deepEqual(
    classifyChanges(['docs/ai/framework/PLANS.md'], manifests).relationshipMap
      .productionApps,
    []
  )
  assert.deepEqual(
    classifyChanges(['apps/asyra-framework-site/app/page.tsx'], manifests)
      .relationshipMap.productionApps,
    ['asyra-framework']
  )
  assert.deepEqual(
    classifyChanges(['.github/workflows/production-artifacts.yml'], manifests)
      .relationshipMap.productionApps,
    ['asyra-sim', 'asyra-design', 'asyra-framework']
  )
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, '.github/workflows/production-artifacts.yml'),
    'utf8'
  )
  assert.doesNotMatch(workflow, /^ {2}pull_request:/m)
  const main = fs.readFileSync(
    path.join(repositoryRoot, '.github/workflows/main.yml'),
    'utf8'
  )
  assert.match(main, /apps: \$\{\{ needs.scope.outputs.production_apps \}\}/)
})

test('plan documents do not select dependency audits or graph builders', () => {
  const { checks } = classifyChanges(
    ['docs/ai/framework/PLANS.md'],
    manifests
  ).executionPlan
  for (const name of [
    'securityAudit',
    'dependencyValidation',
    'turboValidation'
  ]) {
    assert.equal(checks[name].mode, 'not-selected', name)
  }
})

test('root toolchain changes still select all product owners', () => {
  const result = classifyChanges(
    ['package.json'],
    manifests,
    manifests,
    new Map(),
    new Map(),
    ['docs/ai'],
    ['docs/ai'],
    {
      inputChanges: {
        baseRoot: { engines: { node: '22.x' } },
        headRoot: { engines: { node: '24.x' } }
      }
    }
  )
  assert.deepEqual(
    names(result),
    [...manifests.values()]
      .filter((workspace) => !workspace.contentOnly)
      .map((workspace) => workspace.name)
      .sort()
  )
  assert.equal(result.executionPlan.checks.e2e.selected.length, 4)
})

test('unresolved dependency metadata and unowned Markdown fail classification', () => {
  const lock =
    '__metadata:\n  version: 8\n\n"@asyra/asyra-framework-site@workspace:apps/asyra-framework-site":\n  dependencies:\n    absent: "npm:1.0.0"\n'
  const result = classifyChanges(
    ['yarn.lock'],
    manifests,
    manifests,
    new Map(),
    new Map(),
    ['docs/ai'],
    ['docs/ai'],
    {
      inputChanges: {
        baseRoot: {},
        headRoot: {},
        baseLock: lock,
        headLock: lock
      }
    }
  )
  assert.ok(
    result.unknownPaths.some((message) =>
      message.includes('Unresolved Yarn dependency')
    )
  )
  assert.deepEqual(
    classifyChanges(['unknown-area/readme.md'], manifests).unknownPaths,
    ['unknown-area/readme.md']
  )
})

test('full script command covers every registered contract exactly once and serializes build regressions', () => {
  const policy = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, 'scripts/ci-relationships.json'),
      'utf8'
    )
  )
  const root = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  const commands = root.scripts['test:scripts'].split(' && ')
  const tests = commands[0].split(' ').slice(2)
  assert.equal(commands[1], 'yarn test:workspace-builds')
  const all = [...tests, ...policy.repositoryScriptGroups.buildExecution.tests]
  assert.equal(new Set(all).size, all.length)
  assert.deepEqual(all.sort(), [...policy.registeredScriptTests].sort())
})

test('release artifact inputs select tooling contracts without running generated artifact checks', () => {
  const file = 'scripts/__tests__/release-template-artifacts.test.mjs'
  const scope = classifyChanges([file], manifests)

  assert.deepEqual(scope.unknownPaths, [])
  assert.ok(
    scope.executionPlan.checks.repositoryScripts.tests.includes(
      'scripts/__tests__/release-automation.test.mjs'
    )
  )
  assert.equal(
    scope.executionPlan.checks.repositoryScripts.tests.includes(file),
    false
  )
  const full = classifyChanges(
    [file],
    manifests,
    manifests,
    new Map(),
    new Map(),
    [],
    [],
    { fullValidation: true }
  )
  assert.equal(full.executionPlan.checks.repositoryScripts.mode, 'full')
  assert.equal(
    full.executionPlan.checks.repositoryScripts.command,
    'test:scripts'
  )
  const root = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  assert.equal(root.scripts['test:scripts'].includes(file), false)
})

const dependencyLock = (version, { remove = false, override = false } = {}) => {
  const descriptor = override ? `npm:${version}` : 'npm:^1.0.0'
  return (
    [
      '__metadata:\n  version: 8',
      `"shared@${descriptor}":\n  version: ${version}`,
      ...['alpha', 'beta'].map(
        (name) =>
          `"@sample/${name}@workspace:apps/${name}":\n  resolution: "@sample/${name}@workspace:apps/${name}"` +
          (remove && name === 'alpha'
            ? ''
            : '\n  dependencies:\n    shared: "npm:^1.0.0"')
      )
    ].join('\n\n') + '\n'
  )
}
const dependencyConsumers = new Map(
  ['alpha', 'beta'].map((name) => [
    `@sample/${name}`,
    { name: `@sample/${name}`, directory: `apps/${name}` }
  ])
)

for (const scenario of [
  {
    name: 'shared transitive dependency changes select both consumers',
    base: dependencyLock('1.0.0'),
    head: dependencyLock('1.0.1'),
    expected: ['@sample/alpha', '@sample/beta']
  },
  {
    name: 'removed dependency remains owned through the base snapshot',
    base: dependencyLock('1.0.0'),
    head: dependencyLock('1.0.0', { remove: true }),
    expected: ['@sample/alpha']
  },
  {
    name: 'root resolution overrides follow the actual resolved consumer graph',
    base: dependencyLock('1.0.0', { override: true }),
    head: dependencyLock('1.0.1', { override: true }),
    baseRoot: { resolutions: { shared: '1.0.0' } },
    headRoot: { resolutions: { shared: '1.0.1' } },
    expected: ['@sample/alpha', '@sample/beta']
  }
]) {
  test(scenario.name, () => {
    const impact = rootInputImpact(['yarn.lock'], dependencyConsumers, {
      inputChanges: {
        baseRoot: scenario.baseRoot ?? {},
        headRoot: scenario.headRoot ?? {},
        baseLock: scenario.base,
        headLock: scenario.head
      }
    })
    assert.deepEqual([...impact.workspaces].sort(), scenario.expected)
    assert.equal(impact.all, false)
  })
}

test('a failed classifier cannot launch the control-plane proof workflow', () => {
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, '.github/workflows/main.yml'),
    'utf8'
  )
  const job = workflow
    .split('  flow-inspector-validation:')[1]
    .split('  framework-release-readiness:')[0]
  assert.match(job, /if:.*needs\.scope\.result == 'success'/)
})

test('selected build regression files retain the serial resource boundary', () => {
  const selection = classifyChanges(['scripts/gen-turbo.js'], manifests)
    .executionPlan.checks.repositoryScripts
  const calls = []
  const result = runRepositoryScripts(selection, (command, args) =>
    calls.push({ command, args })
  )
  const builds = selection.tests.filter((file) =>
    file.includes('/workspace-build-')
  )
  assert.ok(builds.length > 0)
  assert.deepEqual(calls.at(-1), {
    command: process.execPath,
    args: ['--test', '--test-concurrency=1', ...builds]
  })
  assert.ok(calls[0].args.every((value) => !builds.includes(value)))
  assert.deepEqual(result.executedTests, selection.tests)
})

test('Asyra FieldScope profiles follow its selected test owner without activating for unrelated CI or plans', () => {
  for (const [file, expected] of [
    ['apps/asyra-fieldscope/src/simulation/walking-motion.ts', true],
    [
      'apps/asyra-fieldscope/src/simulation/__tests__/walking-motion-sheet-subdivision.profile.test.ts',
      true
    ],
    ['.github/workflows/fieldscope-profile.yml', true],
    ['docs/ai/apps/asyra-fieldscope/plans/harvest-robot/plan.md', false],
    ['scripts/ci-scope.mjs', false],
    ['apps/asyra-fieldscope/e2e/panels.spec.ts', false]
  ]) {
    assert.equal(
      classifyChanges([file], manifests).relationshipMap
        .fieldscopeProfilesRequired,
      expected,
      file
    )
  }
})

test('internal BDD specifications and reference images are document inputs, while executable docs remain blocked', () => {
  for (const file of [
    'docs/ai/apps/asyra-fieldscope/bdd-features/harvest-robot.feature',
    'docs/ai/apps/asyra-fieldscope/references/robot-components/01-chassis.png'
  ]) {
    const result = classifyChanges([file], manifests)
    assert.deepEqual(result.unknownPaths, [], file)
    assert.deepEqual(names(result), [], file)
    assert.notEqual(
      result.executionPlan.checks.repositoryScripts.mode,
      'full',
      file
    )
  }
  assert.deepEqual(
    classifyChanges(
      ['docs/ai/apps/asyra-fieldscope/references/execute.cjs'],
      manifests
    ).unknownPaths,
    ['docs/ai/apps/asyra-fieldscope/references/execute.cjs']
  )
})

test('developer Agent inputs select their packaging contract without product builds', () => {
  for (const file of [
    '.agents/plugins/marketplace.json',
    '.claude-plugin/marketplace.json',
    // Git diffs retain the previous identity as deleted paths during the rename.
    'plugins/asyra-agent/.codex-plugin/plugin.json',
    '.claude/skills/git-operations/SKILL.md',
    'plugins/asyra-developer/.codex-plugin/plugin.json',
    'plugins/asyra-developer/skills/asyra-developer/SKILL.md',
    'plugins/asyra-skill/.codex-plugin/plugin.json',
    'plugins/asyra-skill/skills/asyra-skill/SKILL.md',
    'plugins/asyra-skill/skills/asyra-skill/bundle.json',
    'plugins/asyra-skill/skills/asyra-skill/references/docs/public/index.md',
    'docs/ai/tools/developer-agent/baselines/0.1.1.bundle.json',
    'scripts/developer-agent-bundle.mjs'
  ]) {
    const result = classifyChanges([file], manifests)
    assert.deepEqual(result.unknownPaths, [], file)
    assert.deepEqual(names(result), [], file)
    assert.equal(result.frameworkReleaseRequired, false, file)
    assert.equal(
      result.executionPlan.checks.repositoryScripts.mode,
      'files',
      file
    )
    assert.ok(
      result.executionPlan.checks.repositoryScripts.tests.includes(
        'scripts/__tests__/developer-agent-bundle.test.mjs'
      ),
      file
    )
  }
  for (const file of [
    'plugins/unknown-plugin/run.mjs',
    '.agents/unknown.json',
    'docs/ai/tools/developer-agent/baselines/run.mjs'
  ]) {
    assert.deepEqual(classifyChanges([file], manifests).unknownPaths, [file])
  }
})

test('upstream renderer changes retain Asyra FieldScope render consumers without pure numerical profiles', () => {
  const result = classifyChanges(
    ['packages/render-engine-pixi/src/mesh-material-shader.ts'],
    manifests
  )
  const owner = result.relationshipMap.workspaceMatrix.find(
    (w) => w.name === '@asyra/asyra-fieldscope'
  )
  assert.equal(owner.testSelection.mode, 'files')
  assert.ok(
    !owner.profileSelection.files.includes(
      'src/domain/__tests__/kinematic-trigonometry.profile.test.ts'
    )
  )
  assert.ok(
    !owner.profileSelection.files.includes(
      'src/domain/__tests__/walking-constrained-kinematics.profile.test.ts'
    )
  )
  assert.ok(
    owner.profileSelection.files.includes(
      'src/runtime/__tests__/bootstrap.profile.test.ts'
    )
  )
  assert.equal(owner.e2eSelection.mode, 'full')
})

test('upstream validation-only inputs do not broaden unrelated runtime consumers', () => {
  const runtime = 'packages/render-engine-pixi/src/mesh-material-shader.ts'
  const validation = [
    'packages/preset/coverage-flow-contracts.json',
    'packages/preset/navigation-flow-contracts.json',
    'packages/preset/src/__tests__/coverage-flow.config.ts',
    'packages/preset/src/__tests__/vector-compound-fill.test.ts'
  ]
  const select = (paths) => classifyChanges(paths, manifests)
  const fieldscope = (scope) =>
    scope.relationshipMap.workspaceMatrix.find(
      (owner) => owner.name === '@asyra/asyra-fieldscope'
    )
  const mixed = select([runtime, ...validation])
  assert.deepEqual(
    fieldscope(mixed).profileSelection,
    fieldscope(select([runtime])).profileSelection
  )
  assert.deepEqual(
    fieldscope(mixed).testSelection,
    fieldscope(select([runtime])).testSelection
  )
  assert.ok(names(mixed).includes('@asyra/preset'))
  const local = select(validation)
  assert.ok(names(local).includes('@asyra/preset'))
  assert.ok(!names(local).includes('@asyra/asyra-fieldscope'))
  const unknown = fieldscope(
    select([runtime, 'packages/preset/unknown-resource.json'])
  )
  assert.equal(unknown.testSelection.mode, 'full')
})

test('mixed material delivery retains shared spatial consumers without unrelated numerical profiles', () => {
  const result = classifyChanges(
    [
      'packages/core/src/index.ts',
      'packages/render-engine/src/capabilities.ts',
      'packages/render-engine/src/index.ts',
      'packages/render-engine/src/mesh-material.ts',
      'packages/preset/src/components/vector.ts',
      'packages/preset/src/components/vector-native-fill.ts',
      'packages/preset/coverage-flow-contracts.json',
      'packages/preset/navigation-flow-contracts.json',
      'packages/preset/src/__tests__/vector-compound-fill.test.ts',
      'packages/render-engine-pixi/src/mesh-material-shader.ts'
    ],
    manifests
  )
  const owner = result.relationshipMap.workspaceMatrix.find(
    (entry) => entry.name === '@asyra/asyra-fieldscope'
  )
  assert.equal(owner.testSelection.mode, 'files')
  assert.equal(
    owner.profileSelection.reason,
    'source-graph-with-conservative-edges'
  )
  assert.ok(
    owner.profileSelection.files.includes(
      'src/runtime/__tests__/bootstrap.profile.test.ts'
    )
  )
  for (const file of [
    'walking-constrained-kinematics-midpoint-profile-one.profile.test.ts',
    'walking-constrained-kinematics-midpoint-profile-two-phase-zero.profile.test.ts',
    'walking-constrained-kinematics-midpoint-profile-two-phase-one.profile.test.ts'
  ]) {
    assert.ok(
      owner.profileSelection.files.includes('src/domain/__tests__/' + file),
      file
    )
  }
  assert.ok(
    !owner.profileSelection.files.includes(
      'src/domain/__tests__/kinematic-trigonometry.profile.test.ts'
    )
  )
  assert.ok(
    !owner.profileSelection.files.includes(
      'src/domain/__tests__/crop-models.source.profile.test.ts'
    )
  )
  assert.equal(owner.e2eSelection.mode, 'full')
})

test('Asyra FieldScope uses exact supervised selections for ordinary tests and profiles', () => {
  const result = classifyChanges(
    ['apps/asyra-fieldscope/src/ui/walking-runtime-selector.tsx'],
    manifests
  )
  const owner = result.relationshipMap.workspaceMatrix.find(
    (w) => w.name === '@asyra/asyra-fieldscope'
  )
  assert.equal(owner.testSelection.mode, 'files')
  assert.ok(
    owner.testSelection.inputs.includes(
      'src/ui/__tests__/walking-runtime-selector.test.tsx'
    )
  )
  assert.deepEqual(owner.profileSelection.files, [])
  assert.equal(result.relationshipMap.fieldscopeProfilesRequired, false)
  const crop = classifyChanges(
    ['apps/asyra-fieldscope/src/domain/crop-models.ts'],
    manifests
  )
  const profiles = crop.relationshipMap.workspaceMatrix.find(
    (w) => w.name === '@asyra/asyra-fieldscope'
  ).profileSelection.files
  assert.ok(
    profiles.some((f) => f.endsWith('crop-models.source.profile.test.ts'))
  )
  assert.ok(
    !profiles.some((f) => f.endsWith('kinematic-trigonometry.profile.test.ts'))
  )
})

test('profile workflow changes retain full profiles even when accompanied by UI-only changes', () => {
  const workflow = classifyChanges(
    ['.github/workflows/fieldscope-profile.yml'],
    manifests
  )
  const mixed = classifyChanges(
    [
      '.github/workflows/fieldscope-profile.yml',
      'apps/asyra-fieldscope/src/ui/walking-runtime-selector.tsx'
    ],
    manifests
  )
  assert.deepEqual(
    mixed.relationshipMap.fieldscopeProfileFiles,
    workflow.relationshipMap.fieldscopeProfileFiles
  )
})

test('profile workflow ownership supplies local build prerequisites', () => {
  const scope = classifyChanges(
    ['.github/workflows/fieldscope-profile.yml'],
    manifests
  )
  assert.ok(
    scope.relationshipMap.workspaceMatrix.some(
      (w) => w.directory === 'apps/asyra-fieldscope'
    )
  )
})

test('Render changes keep compatibility checks but select Sim source consumers and browser integration separately', () => {
  const scoped = classifyChanges(
    ['packages/render/src/types/render-object.ts'],
    manifests
  )
  const sim = scoped.relationshipMap.workspaceMatrix.find(
    (entry) => entry.directory === 'apps/asyra-sim'
  )
  assert.equal(sim.lintSelection.mode, 'full')
  assert.equal(sim.testSelection.mode, 'files')
  assert.ok(
    sim.testSelection.inputs.some((file) => file.includes('spatial-layer'))
  )
  assert.ok(
    !sim.testSelection.inputs.some((file) =>
      file.includes('representative-resource')
    )
  )
  assert.equal(sim.e2eSelection.mode, 'related')
  assert.ok(
    sim.e2eSelection.inputs.includes(
      'apps/asyra-sim/e2e/__tests__/viewport-navigation.spec.ts'
    )
  )
  assert.ok(
    !sim.e2eSelection.inputs.some((file) =>
      file.includes('representative-resource-candidate')
    )
  )
  for (const input of [
    'apps/asyra-sim/vite.config.ts',
    'packages/render/src/deleted.ts'
  ]) {
    const entry = classifyChanges(
      [input],
      manifests
    ).relationshipMap.workspaceMatrix.find(
      (entry) => entry.directory === 'apps/asyra-sim'
    )
    assert.equal(entry.e2eSelection.mode, 'full')
  }
})

test('supervised positional selections reach execution without bypassing the owner', async () => {
  const entry = classifyChanges(
    ['packages/render/src/types/render-object.ts'],
    manifests
  ).relationshipMap.workspaceMatrix.find(
    (entry) => entry.directory === 'apps/asyra-sim'
  )
  const calls = []
  const record = await executeWorkspaceChecks(entry, {
    relationshipMapDigest: 'a'.repeat(64),
    identity: {},
    runTask: async (_name, task, selection) => {
      calls.push({ task, selection })
      return { testCount: 1, passedCount: 1, failedCount: 0 }
    }
  })
  assert.equal(record.status, 'success')
  assert.deepEqual(
    calls.find((entry) => entry.task === 'test:ci').selection.runner,
    { command: 'test:ci', argumentStyle: 'positional' }
  )
})

test('unregistered browser specs stay selected and unknown proof inputs retain coverage', (t) => {
  const parent = path.join(repositoryRoot, 'tmp/browser-routing-fixtures')
  fs.mkdirSync(parent, { recursive: true })
  const root = fs.mkdtempSync(path.join(parent, 'case-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const directory = 'apps/new-owner'
  for (const folder of [
    'apps/new-owner/src',
    'apps/new-owner/e2e',
    'packages/new-owner/src'
  ]) {
    fs.mkdirSync(path.join(root, folder), { recursive: true })
  }
  fs.writeFileSync(
    path.join(root, directory, 'src/math.ts'),
    'export const x = 1'
  )
  fs.writeFileSync(path.join(root, directory, 'e2e/math.spec.ts'), '')
  fs.writeFileSync(path.join(root, directory, 'e2e/new.spec.ts'), '')
  const input = 'packages/new-owner/src/render.ts'
  fs.writeFileSync(path.join(root, input), 'export const y = 2')
  const workspaces = new Map([
    ['@new/core', { name: '@new/core', directory: 'packages/new-owner' }]
  ])
  const contract = {
    inventoryRoots: ['e2e', 'src'],
    groups: [
      { proofPatterns: ['e2e/math.spec.ts'], sourcePatterns: ['src/math.ts'] }
    ]
  }
  const fallback = { mode: 'full', inputs: [], reason: 'fallback' }
  const select = () =>
    selectUpstreamBrowserProofs(
      directory,
      [input],
      workspaces,
      root,
      fallback,
      contract
    )
  assert.deepEqual(select().inputs, ['apps/new-owner/e2e/new.spec.ts'])
  fs.writeFileSync(
    path.join(root, directory, 'src/math.ts'),
    'export const x = (p: string) => import(p)'
  )
  assert.deepEqual(select().inputs, [
    'apps/new-owner/e2e/math.spec.ts',
    'apps/new-owner/e2e/new.spec.ts'
  ])
  fs.rmSync(path.join(root, directory, 'src/math.ts'))
  assert.deepEqual(select(), fallback)
  fs.rmSync(path.join(root, input))
  assert.deepEqual(select(), fallback)
})

test('owners without a separate profile runner retain profile-named tests in their supervised suite', (t) => {
  const parent = path.join(repositoryRoot, 'tmp/browser-routing-fixtures')
  fs.mkdirSync(parent, { recursive: true })
  const root = fs.mkdtempSync(path.join(parent, 'profile-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const directory = 'apps/asyra-sim'
  fs.mkdirSync(path.join(root, directory, 'src/domain/__tests__'), {
    recursive: true
  })
  fs.writeFileSync(
    path.join(root, directory, 'src/domain/math.ts'),
    'export const x = 1'
  )
  fs.writeFileSync(
    path.join(root, directory, 'src/domain/__tests__/new.profile.test.ts'),
    "import '../math'"
  )
  const result = classifyChanges(
    [`${directory}/src/domain/math.ts`],
    manifests,
    manifests,
    new Map(),
    new Map(),
    [],
    [],
    { repositoryRoot: root }
  )
  const entry = result.relationshipMap.workspaceMatrix.find(
    (entry) => entry.directory === directory
  )
  assert.equal(entry.testSelection.mode, 'files')
  assert.deepEqual(entry.testSelection.inputs, [
    'src/domain/__tests__/new.profile.test.ts'
  ])
  assert.equal(entry.profileSelection, undefined)
})

test('Skill source inputs select packaging checks before merge alongside their existing owners', () => {
  const config = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, 'plugins/asyra-skill/bundle.config.json'),
      'utf8'
    )
  )
  for (const file of [
    ...config.documents,
    'docs/public/generated/package-reference.json'
  ]) {
    const result = classifyChanges([file], manifests)
    assert.ok(
      result.executionPlan.checks.repositoryScripts.tests.includes(
        'scripts/__tests__/developer-agent-bundle.test.mjs'
      ),
      file
    )
  }
  const ordinary = classifyChanges(
    ['apps/asyra-framework-site/components/developer-entry.tsx'],
    manifests
  )
  assert.ok(
    !(ordinary.executionPlan.checks.repositoryScripts.tests ?? []).includes(
      'scripts/__tests__/developer-agent-bundle.test.mjs'
    )
  )
})

test('the original collaboration wrapper selects its own E2E producer', () => {
  const selected = classifyChanges(
    ['scripts/run-collaboration-e2e.sh'],
    manifests
  )
  assert.deepEqual(selected.relationshipMap.executionPlan.checks.e2e.selected, [
    'collaboration'
  ])
  assert.deepEqual(selected.unknownPaths, [])
})

test('independent runtime changes select the installed consumer gate exactly once', () => {
  const packageRoot = path.join(repositoryRoot, 'tools/flow-inspector')
  const manifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
  )
  for (const file of [
    'flow-files/adapters.cjs',
    'bin/flow-inspector.cjs',
    'package.json'
  ]) {
    const scope = classifyChanges(
      ['tools/flow-inspector/' + file],
      readWorkspaceManifests(repositoryRoot)
    )
    const workspace = scope.relationshipMap.workspaceMatrix.find(
      (w) => w.name === manifest.name
    )
    assert.equal(workspace.testSelection.mode, 'full', file)
    assert.equal(workspace.testTask, 'test:ci')
    assert.equal(
      scope.relationshipMap.flowInspectorValidationRequired,
      false,
      'Independent runtime does not require Design product proofs'
    )
  }
  assert.equal(
    manifest.scripts['test:ci']
      .split('&&')
      .filter((command) => command.trim() === 'yarn test:installed').length,
    1,
    'Workspace CI must execute the actual installed package gate'
  )
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, '.github/workflows/main.yml'),
    'utf8'
  )
  assert.doesNotMatch(
    workflow,
    /yarn workspace @asyra\/flow-inspector test:installed/,
    'The legacy control-plane job must not duplicate the workspace gate'
  )
})

test('Flow Inspector archive contracts have one workspace owner in incremental and full CI', () => {
  const archiveTest = 'tools/flow-inspector/__tests__/package.test.cjs'
  const policy = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, 'scripts/ci-relationships.json'),
      'utf8'
    )
  )
  const root = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  assert.equal(policy.registeredScriptTests.includes(archiveTest), false)
  assert.equal(root.scripts['test:scripts'].includes(archiveTest), false)
  for (const group of Object.values(policy.repositoryScriptGroups)) {
    assert.equal(group.tests.includes(archiveTest), false)
  }
  const tool = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, 'tools/flow-inspector/package.json'),
      'utf8'
    )
  )
  assert.equal(
    tool.scripts['test:contracts']
      .split(' ')
      .filter((file) => file === '__tests__/package.test.cjs').length,
    1
  )
  const full = classifyChanges(
    [],
    manifests,
    manifests,
    new Map(),
    new Map(),
    ['docs/ai'],
    ['docs/ai'],
    { fullValidation: true }
  )
  assert.equal(
    full.relationshipMap.workspaceMatrix.find((w) => w.name === tool.name)
      .testSelection.mode,
    'full'
  )
  assert.equal(full.executionPlan.checks.repositoryScripts.mode, 'full')
  for (const input of [
    'tools/flow-inspector/package.json',
    '.github/workflows/main.yml',
    'scripts/ci-scope.mjs',
    'scripts/ci-relationships.json'
  ]) {
    const selected = classifyChanges([input], manifests).executionPlan.checks
      .repositoryScripts
    assert.ok(
      selected.mode === 'full' ||
        selected.tests.includes('scripts/__tests__/ci-scope.test.mjs'),
      input
    )
    assert.equal(selected.tests?.includes(archiveTest) ?? false, false, input)
  }
})

test('data-only root knowledge participates in consumer invalidation without a fake build', () => {
  const discovered = readWorkspaceManifests(repositoryRoot)
  const knowledge = discovered.get('@asyra/domain-knowledge')
  assert.equal(knowledge?.directory, 'domain-knowledge')
  assert.equal(knowledge?.buildTask, undefined)
  const scope = classifyChanges(
    ['domain-knowledge/components.button.md'],
    discovered
  )
  assert.ok(names(scope).includes('@asyra/asyra-design'))
  assert.ok(
    JSON.stringify(scope).includes(
      'scripts/__tests__/domain-knowledge.test.mjs'
    )
  )
  assert.ok(!names(scope).includes('@asyra/domain-knowledge'))
  assert.ok(
    !JSON.stringify(scope).includes(
      'Workspace has no canonical build task: @asyra/domain-knowledge'
    )
  )
})

test('shared-check CLI reads a plan larger than Linux environment limits and rejects stale evidence', (t) => {
  const parent = path.join(repositoryRoot, 'tmp')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'large-ci-plan-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const scope = classifyChanges(['docs/ai/framework/PLANS.md'], manifests)
  const plan = scope.executionPlan
  plan.changedPaths = Array.from(
    { length: 5000 },
    (_, index) => `docs/large-workspace-rename/reference-${index}.md`
  )
  assert.ok(Buffer.byteLength(JSON.stringify(plan)) > 131072)
  const identity = {
    repository: 'local',
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
    integration: 'b'.repeat(40),
    run: '1',
    attempt: '1'
  }
  const evidence = {
    version: 2,
    identity,
    relationshipMapDigest: scope.relationshipMapDigest,
    executionPlan: plan
  }
  const evidenceFile = path.join(directory, 'scope.json')
  const output = path.join(directory, 'result.json')
  const trace = path.join(directory, 'commands.log')
  fs.writeFileSync(
    path.join(directory, 'yarn'),
    '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CHECK_TRACE"\n',
    { mode: 0o700 }
  )
  fs.writeFileSync(evidenceFile, JSON.stringify(evidence))
  const env = {
    ...process.env,
    PATH: directory + path.delimiter + process.env.PATH,
    CHECK_TRACE: trace,
    CI_SCOPE_EVIDENCE_FILE: evidenceFile,
    CI_CHECK_RESULTS_FILE: output,
    CI_RELATIONSHIP_MAP_DIGEST: scope.relationshipMapDigest
  }
  delete env.CI_EXECUTION_PLAN
  for (const [key, value] of Object.entries(identity)) {
    env[`CI_SCOPE_${key.toUpperCase()}`] = value
  }
  const run = () =>
    spawnSync(process.execPath, ['scripts/run-ci-checks.mjs'], {
      cwd: repositoryRoot,
      env,
      encoding: 'utf8',
      timeout: 10000
    })
  const result = run()
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.equal(fs.readFileSync(trace, 'utf8'), 'lint\n')
  const receipt = JSON.parse(fs.readFileSync(output, 'utf8'))
  assert.equal(
    receipt.executionPlanDigest,
    createHash('sha256').update(JSON.stringify(plan)).digest('hex')
  )
  assert.deepEqual(receipt.identity, identity)
  fs.rmSync(output)
  fs.rmSync(trace)
  for (const stale of [
    { ...evidence, identity: { ...identity, head: 'c'.repeat(40) } },
    { ...evidence, relationshipMapDigest: '0'.repeat(64) }
  ]) {
    fs.writeFileSync(evidenceFile, JSON.stringify(stale))
    const rejected = run()
    assert.notEqual(rejected.status, 0)
    assert.match(rejected.stderr, /scope evidence does not match/)
    assert.equal(fs.existsSync(output), false)
    assert.equal(fs.existsSync(trace), false)
  }
})

test('plan flow documents select public Flow admission without runtime or control-plane work', () => {
  for (const input of [
    'docs/ai/framework/plans/preset-3d-foundation/preset-3d-foundation.flow.json',
    'docs/ai/apps/example/plans/review/review.flow.json',
    'docs/ai/tools/example/plans/review.flow.json'
  ]) {
    const scope = classifyChanges([input], manifests)
    assert.deepEqual(scope.unknownPaths, [], input)
    assert.deepEqual(names(scope), [], input)
    const checks = scope.relationshipMap.executionPlan.checks
    assert.equal(checks.repositoryScripts.mode, 'files', input)
    assert.ok(
      checks.repositoryScripts.tests.includes(
        'scripts/__tests__/plan-flow-documents.test.mjs'
      ),
      input
    )
    assert.equal(checks.controlPlane.mode, 'not-selected', input)
    assert.equal(scope.designE2ERequired, false, input)
  }
  for (const input of [
    'docs/ai/framework/plans/review/runtime.json',
    'docs/ai/framework/review.flow.json'
  ]) {
    assert.ok(classifyChanges([input], manifests).unknownPaths.includes(input))
  }
})
