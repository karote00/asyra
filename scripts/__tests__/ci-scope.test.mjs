import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readWorkspaceManifests, classifyChanges } from '../ci-scope.mjs'

const manifests = readWorkspaceManifests(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
)

test('an app-only change selects that app and its declared workspace consumers', () => {
  const result = classifyChanges(['apps/asyra-design/src/main.tsx'], manifests)
  assert.deepEqual(result.categories, ['design'])
  assert.deepEqual(result.affectedWorkspaces, ['@asyra/asyra-design'])
  assert.deepEqual(result.unknownPaths, [])
})

test('Framework changes follow workspace dependency edges to affected apps', () => {
  const result = classifyChanges(['packages/core/src/index.ts'], manifests)
  assert.ok(result.categories.includes('framework'))
  assert.ok(result.categories.includes('design'))
  assert.ok(result.categories.includes('sim'))
  assert.ok(result.affectedWorkspaces.includes('@asyra/asyra-design'))
  assert.ok(result.affectedWorkspaces.includes('@asyra/asyra-sim'))
  assert.ok(result.workspacesByCategory.framework.includes('@asyra/fieldscope'))
  assert.ok(
    result.workspacesByCategory.framework.includes('@asyra/starter-app')
  )
  assert.ok(
    result.buildTasksByCategory.framework.some(
      ({ workspace, task }) =>
        workspace === '@asyra/core' && task === 'build:core'
    )
  )
  assert.ok(
    result.buildTasksByCategory.design.some(
      ({ workspace, task }) =>
        workspace === '@asyra/asyra-design' && task === 'react:build'
    )
  )
  assert.deepEqual(result.unknownPaths, [])
})

for (const appPath of [
  'apps/fieldscope/src/index.ts',
  'apps/starter-app/src/index.ts'
]) {
  test(`${appPath} selects its own Framework workspace gate`, () => {
    const result = classifyChanges([appPath], manifests)
    assert.deepEqual(result.categories, ['framework'])
    assert.ok(
      result.workspacesByCategory.framework.includes(
        appPath.includes('fieldscope')
          ? '@asyra/fieldscope'
          : '@asyra/starter-app'
      )
    )
    assert.deepEqual(result.unknownPaths, [])
  })
}

test('a shared lockfile change selects all validation owners', () => {
  assert.deepEqual(classifyChanges(['yarn.lock'], manifests).categories, [
    'framework',
    'design',
    'sim',
    'website',
    'tools'
  ])
})

test('the Website and tool source changes remain independently scoped', () => {
  const website = classifyChanges(
    ['apps/asyra-framework-site/app/page.tsx'],
    manifests
  )
  assert.deepEqual(website.categories, ['website'])
  assert.ok(
    website.buildTasksByCategory.website.some(
      ({ workspace, task }) =>
        workspace === '@asyra/asyra-framework-site' &&
        task === 'build:asyra-framework-site'
    )
  )
  const tools = classifyChanges(['tools/flow-inspector/viewer.js'], manifests)
  assert.deepEqual(tools.categories, ['tools'])
  assert.ok(
    tools.buildTasksByCategory.tools.some(
      ({ workspace, task }) =>
        workspace === '@asyra/flow-inspector' && task === 'react:build'
    )
  )
})

test('Changesets and tracked root documents select their shared contract checks', () => {
  const changeset = classifyChanges(['.changeset/example.md'], manifests)
  assert.deepEqual(changeset.categories, ['framework', 'tools'])
  assert.deepEqual(changeset.unknownPaths, [])
  assert.deepEqual(changeset.affectedWorkspaces, [])

  for (const document of [
    'README.md',
    'SUPPORT.md',
    'SECURITY.md',
    'LICENSE',
    'CHANGELOG.md',
    'RELEASE_NOTES.md',
    'AGENTS.md'
  ]) {
    const result = classifyChanges([document], manifests)
    assert.deepEqual(result.categories, ['framework'], document)
    assert.deepEqual(result.unknownPaths, [], document)
    assert.deepEqual(result.affectedWorkspaces, [], document)
  }
})

test('create-app package inputs carry a runnable package readiness owner', () => {
  const result = classifyChanges(
    ['create-app/asyra-design/package.json'],
    manifests
  )
  assert.deepEqual(result.categories, ['framework'])
  assert.deepEqual(result.createAppPackages, ['create-app/asyra-design'])
  assert.equal(result.frameworkReleaseRequired, false)
  assert.deepEqual(result.unknownPaths, [])
})

test('Framework release tooling selects release readiness without a workspace', () => {
  const result = classifyChanges(
    ['scripts/release-package-artifacts.js'],
    manifests
  )
  assert.deepEqual(result.categories, ['tools'])
  assert.deepEqual(result.workspacesByCategory.tools, [])
  assert.equal(result.frameworkReleaseRequired, true)
  assert.deepEqual(result.unknownPaths, [])
})

test('contract documentation selects its owner without scheduling app suites', () => {
  const result = classifyChanges(
    ['docs/ai/apps/asyra-design/README.md'],
    manifests
  )
  assert.deepEqual(result.categories, ['design'])
  assert.deepEqual(result.workspacesByCategory.design, [])
})

test('shared workflow guidance selects Framework shared validation', () => {
  const result = classifyChanges(
    ['docs/ai/workflows/package-release-validation.md'],
    manifests
  )
  assert.deepEqual(result.categories, ['framework'])
  assert.deepEqual(result.workspacesByCategory.framework, [])
  assert.equal(result.frameworkReleaseRequired, false)
  assert.deepEqual(result.unknownPaths, [])
})
test('Flow Inspector contract documentation schedules its owner contract suite', () => {
  const result = classifyChanges(
    ['docs/ai/tools/flow-inspector/CORE_PROOF.md'],
    manifests
  )
  assert.deepEqual(result.categories, ['tools'])
  assert.ok(result.workspacesByCategory.tools.includes('@asyra/flow-inspector'))
})

test('an unknown path selects every owner and remains an explicit blocker', () => {
  const result = classifyChanges(['new-unclassified-root/file.txt'], manifests)
  assert.deepEqual(result.categories, [
    'framework',
    'design',
    'sim',
    'website',
    'tools'
  ])
  assert.deepEqual(result.unknownPaths, ['new-unclassified-root/file.txt'])
})

test('empty path evidence conservatively selects every owner', () => {
  assert.deepEqual(classifyChanges([], manifests).categories, [
    'framework',
    'design',
    'sim',
    'website',
    'tools'
  ])
})
