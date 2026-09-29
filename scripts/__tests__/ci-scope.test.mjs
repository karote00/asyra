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
import { executeSelectedChecks } from '../run-ci-checks.mjs'

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
    ['collaboration', 'flow-inspector-board', 'functional', 'render-contracts']
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
  const shared = classifyChanges(['yarn.lock'], manifests)
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

test('repository scripts tests follow declared repository input roots', () => {
  const appChange = classifyChanges(['apps/fieldscope/src/main.tsx'], manifests)
  assert.equal(
    appChange.relationshipMap.executionPlan.checks.repositoryScripts.mode,
    'full'
  )
  const helperChange = classifyChanges(['scripts/ci-scope.mjs'], manifests)
  assert.equal(
    helperChange.relationshipMap.executionPlan.checks.repositoryScripts.mode,
    'full'
  )
})

test('repository scripts suite follows repository data read by its formal tests', () => {
  for (const input of [
    '.github/dependabot.yml',
    'apps/asyra-design/vite.config.ts',
    'apps/asyra-design/src/index.css',
    'apps/asyra-design/docs/development.md'
  ]) {
    const scope = classifyChanges([input], manifests)
    assert.equal(
      scope.relationshipMap.executionPlan.checks.repositoryScripts.mode,
      'full',
      input
    )
  }

  const unknown = classifyChanges(
    ['new-root/consumer-contract.json'],
    manifests
  )
  assert.equal(
    unknown.relationshipMap.executionPlan.checks.repositoryScripts.mode,
    'full'
  )
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

test('shared build and workflow inputs select every discovered workspace', () => {
  for (const input of [
    'turbo.base.json',
    '.github/workflows/main.yml',
    'scripts/run-ci-checks.mjs'
  ]) {
    const result = classifyChanges([input], manifests)
    assert.deepEqual(names(result), [...manifests.keys()].sort(), input)
    assert.equal(result.frameworkReleaseRequired, true, input)
    assert.deepEqual(result.unknownPaths, [], input)
  }
})

test('explicit documentation relationships select their actual workspace consumers', () => {
  const website = classifyChanges(['docs/public/guide.mdx'], manifests)
  assert.deepEqual(names(website), ['@asyra/asyra-framework-site'])

  const appDocs = classifyChanges(
    ['docs/ai/apps/fieldscope/PLANS.md'],
    manifests
  )
  assert.deepEqual(names(appDocs), ['@asyra/fieldscope'])

  const toolDocs = classifyChanges(
    ['docs/ai/tools/flow-inspector/CORE_PROOF.md'],
    manifests
  )
  assert.deepEqual(names(toolDocs), ['@asyra/flow-inspector'])

  const packageDocs = classifyChanges(
    ['docs/ai/packages/core/README.md'],
    manifests
  )
  assert.ok(names(packageDocs).includes('@asyra/core'))
  assert.ok(names(packageDocs).includes('@asyra/asyra-design'))
  assert.ok(names(packageDocs).includes('@asyra/fieldscope'))
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
  assert.deepEqual(names(script), ['@asyra/flow-inspector'])

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

test('empty changed-path evidence conservatively selects all workspaces', () => {
  assert.deepEqual(
    names(classifyChanges([], manifests)),
    [...manifests.keys()].sort()
  )
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
