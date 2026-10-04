import { rootInputImpact } from '../ci-input-impact.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  classifyChanges,
  readCreateAppManifests,
  readDocumentationDirectories,
  readWorkspaceManifests
} from '../ci-scope.mjs'
import { executeWorkspaceChecks } from '../run-workspace-checks.mjs'
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
  assert.deepEqual(source.relationshipMap.executionPlan.checks.lint.inputs, [
    'packages/core/src/index.ts'
  ])
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
  const app = classifyChanges(['apps/fieldscope/src/main.tsx'], manifests)
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
    'docs/ai/apps/fieldscope/plans/completed/example/plan.md',
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
  assert.ok(
    checks.repositoryScripts.tests.every(
      (file) => !file.startsWith('scripts/docs/')
    )
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
  assert.ok(names(result).includes('@asyra/fieldscope'))
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

    for (const entry of entries)
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
      if (task === entry.buildTask) throw new Error('build failed')
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
      if (task === 'has:test') throw new Error('No test files found')
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
      changedPaths: ['apps/fieldscope/src/main.tsx'],
      unknownRelations: [],
      checks: {
        lint: {
          mode: 'files',
          inputs: ['apps/fieldscope/src/main.tsx'],
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
          inputs: ['apps/fieldscope/src/main.tsx'],
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
    assert.deepEqual(names(result), [...manifests.keys()].sort())
    assert.equal(result.frameworkReleaseRequired, true)
  }
})

test('explicit documentation relationships select their actual workspace consumers', () => {
  const website = classifyChanges(['docs/public/guide.mdx'], manifests)
  assert.deepEqual(names(website), ['@asyra/asyra-framework-site'])

  const appDocs = classifyChanges(
    ['docs/ai/apps/fieldscope/PLANS.md'],
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
    '.github/pull_request_template.md',
    '.github/app-production-environment.json'
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
  assert.deepEqual(names(result), [...manifests.keys()].sort())
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
    'docs/ai/apps/fieldscope/PLANS.md'
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
  assert.deepEqual(names(result), [...manifests.keys()].sort())
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
  ])
    assert.equal(checks[name].mode, 'not-selected', name)
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
  assert.deepEqual(names(result), [...manifests.keys()].sort())
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

test('FieldScope profiles follow its selected test owner without activating for unrelated CI or plans', () => {
  for (const [file, expected] of [
    ['apps/fieldscope/src/simulation/walking-motion.ts', true],
    [
      'apps/fieldscope/src/simulation/__tests__/walking-motion-sheet-subdivision.profile.test.ts',
      true
    ],
    ['.github/workflows/fieldscope-profile.yml', true],
    ['docs/ai/apps/fieldscope/plans/harvest-robot/plan.md', false],
    ['scripts/ci-scope.mjs', false],
    ['apps/fieldscope/e2e/panels.spec.ts', false]
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
    'docs/ai/apps/fieldscope/bdd-features/harvest-robot.feature',
    'docs/ai/apps/fieldscope/references/robot-components/01-chassis.png'
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
      ['docs/ai/apps/fieldscope/references/execute.cjs'],
      manifests
    ).unknownPaths,
    ['docs/ai/apps/fieldscope/references/execute.cjs']
  )
})

test('developer Agent inputs select their packaging contract without product builds', () => {
  for (const file of [
    '.agents/plugins/marketplace.json',
    '.claude-plugin/marketplace.json',
    // Git diffs retain the previous identity as deleted paths during the rename.
    'plugins/asyra-developer/.codex-plugin/plugin.json',
    'plugins/asyra-developer/skills/asyra-developer/SKILL.md',
    'plugins/asyra-agent/.codex-plugin/plugin.json',
    'plugins/asyra-agent/skills/asyra-agent/SKILL.md',
    'plugins/asyra-agent/skills/asyra-agent/bundle.json',
    'plugins/asyra-agent/skills/asyra-agent/references/docs/public/index.md',
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
