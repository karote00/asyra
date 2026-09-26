import test from 'node:test'
import assert from 'node:assert/strict'
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
        runTask: async (workspace, task) =>
          commands.push(`${workspace}:${task}`)
      })
    assert.deepEqual(
      commands,
      entries.flatMap(({ name, buildTask, testTask }) => [
        `${name}:${buildTask}`,
        `${name}:${testTask}`
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
    buildTask: 'build:failed-build',
    testTask: 'test:ci',
    artifactId: 'c1ee386690afbe71'
  }
  const record = await executeWorkspaceChecks(entry, {
    relationshipMapDigest: 'a'.repeat(64),
    identity: {},
    runTask: async (_workspace, task) => {
      commands.push(task)
      throw new Error('build failed')
    }
  })
  assert.deepEqual(commands, ['build:failed-build'])
  assert.deepEqual(record.taskSequence, ['build:failed-build'])
  assert.equal(record.testStatus, 'skipped')
  assert.equal(record.status, 'failed')
})

test('shared build and workflow inputs select every discovered workspace', () => {
  const result = classifyChanges(['turbo.base.json'], manifests)
  assert.deepEqual(names(result), [...manifests.keys()].sort())
  assert.equal(result.frameworkReleaseRequired, true)
  assert.deepEqual(result.unknownPaths, [])
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
