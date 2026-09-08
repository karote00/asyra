/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const projectRoot = path.resolve(__dirname, '../../../..')
const workspaceRoot = path.resolve(__dirname, '..')
const catalogPath = path.join(workspaceRoot, 'catalog.cjs')
const generatorPath = path.join(workspaceRoot, 'generate-workspace.cjs')
const bundlePath = path.join(workspaceRoot, 'workspace-bundle.data.js')
const toolPackagePath = path.resolve(workspaceRoot, '../package.json')
const specPath = path.join(
  projectRoot,
  'docs/ai/tools/flow-inspector/STATIC_WORKSPACE.md'
)
const inspectorPath = path.join(
  projectRoot,
  'tools/flow-inspector/inspectors/flow-inspector-static-workspace-flow-inspector.data.cjs'
)

const discoverCandidates = (root) =>
  fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) return discoverCandidates(entryPath)
    return /-flow-inspector\.data\.(?:cjs|js)$/.test(entry.name)
      ? [entryPath]
      : []
  })

const legacyPlanRoots = [
  path.join(projectRoot, 'docs/ai/framework/plans'),
  path.join(projectRoot, 'docs/ai/apps/asyra-design/plans')
]

const discoverLegacyInspectorArtifacts = (root) =>
  fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) return discoverLegacyInspectorArtifacts(entryPath)
    return /(?:flow-inspector\.data\.(?:cjs|js)|flow-inspector\.html|flow-inspector\.contract\.test\.cjs)$/.test(
      entry.name
    )
      ? [entryPath]
      : []
  })

test('Phase 0 authorities and catalog owners exist', () => {
  assert.equal(fs.existsSync(specPath), true, 'product contract must exist')
  assert.equal(
    fs.existsSync(inspectorPath),
    true,
    'workspace Inspector must exist'
  )
  assert.equal(fs.existsSync(catalogPath), true, 'catalog owner must exist')
  assert.equal(
    fs.existsSync(generatorPath),
    true,
    'catalog generator must exist'
  )
  assert.equal(
    fs.existsSync(bundlePath),
    true,
    'generated browser snapshot must exist'
  )
})

test('preview artifact is independently versioned and static-only', () => {
  const toolPackage = JSON.parse(fs.readFileSync(toolPackagePath, 'utf8'))
  assert.equal(toolPackage.name, '@asyra/flow-inspector')
  assert.equal(toolPackage.version, '0.2.0')
  assert.notEqual(toolPackage.private, true)
  assert.equal(fs.existsSync(path.join(workspaceRoot, 'workspace.html')), true)
  assert.equal(toolPackage.publishConfig.access, 'public')
  assert.equal(
    toolPackage.scripts['test:contracts'],
    'node --test __tests__/viewer-entry.test.cjs workspace/__tests__/catalog.contract.test.cjs workspace/__tests__/workspace.test.cjs __tests__/package.test.cjs'
  )
  for (const scriptName of ['test', 'test:local', 'test:ci']) {
    assert.equal(
      toolPackage.scripts[scriptName],
      'yarn test:react && yarn test:contracts'
    )
  }
})

test('React workspace exposes one direct Vite development command', () => {
  const toolPackage = JSON.parse(fs.readFileSync(toolPackagePath, 'utf8'))
  const devEntryPath = path.join(workspaceRoot, 'dev.html')

  assert.equal(
    toolPackage.scripts.dev,
    'node workspace/generate-workspace.cjs && vite --open /workspace/dev.html'
  )
  assert.equal(fs.existsSync(devEntryPath), true)

  const devEntry = fs.readFileSync(devEntryPath, 'utf8')
  assert.match(devEntry, /src="\.\/workspace-bundle\.data\.js"/)
  assert.match(devEntry, /type="module" src="\.\.\/src\/main\.tsx"/)
  assert.doesNotMatch(devEntry, /generated\/flow-inspector-workspace\.js/)
})

test('workspace Inspector resolves the exact static architecture contract', () => {
  const inspector = require(inspectorPath)
  assert.deepEqual(inspector.schema, { id: 'flow-inspector', version: 2 })
  assert.equal(inspector.target.id, 'flow-inspector-static-workspace')
  assert.deepEqual(
    inspector.steps.map((step) => step.id),
    [
      'discover-inspector-sources',
      'classify-workspace-catalog',
      'generate-browser-snapshot',
      'route-workspace-selection',
      'isolate-selected-target',
      'render-selected-contract',
      'preserve-standalone-entries',
      'verify-static-preview'
    ]
  )
})

test('generated catalog classifies every fixed-root candidate exactly once', () => {
  assert.equal(fs.existsSync(catalogPath), true)
  assert.equal(fs.existsSync(bundlePath), true)
  const catalog = require(catalogPath)
  const sandbox = { globalThis: {} }
  vm.runInNewContext(fs.readFileSync(bundlePath, 'utf8'), sandbox)
  const bundle = JSON.parse(
    JSON.stringify(sandbox.globalThis.FLOW_INSPECTOR_WORKSPACE_BUNDLE)
  )
  assert.deepEqual(bundle.schema, {
    id: 'flow-inspector-workspace-bundle',
    version: 1
  })
  assert.deepEqual(catalog.discoveryRoots, ['tools/flow-inspector/inspectors'])
  assert.equal(Array.isArray(catalog.exclusions), true)
  assert.equal(
    new Set(catalog.exclusions.map((item) => item.path)).size,
    catalog.exclusions.length
  )
  assert.equal(
    bundle.entries.length + bundle.exclusions.length,
    bundle.generatedFrom.candidatePaths.length
  )
  assert.equal(
    new Set(bundle.entries.map((entry) => entry.id)).size,
    bundle.entries.length
  )
  const currentCandidates = catalog.discoveryRoots
    .flatMap((root) => discoverCandidates(path.join(projectRoot, root)))
    .map((candidate) =>
      path.relative(projectRoot, candidate).split(path.sep).join('/')
    )
    .sort()
  assert.deepEqual(bundle.generatedFrom.candidatePaths, currentCandidates)
  for (const entry of bundle.entries) {
    assert.equal(fs.existsSync(path.join(projectRoot, entry.sourcePath)), true)
    if (entry.standalonePath) {
      assert.equal(
        fs.existsSync(path.join(projectRoot, entry.standalonePath)),
        true
      )
    }
    const source = require(path.join(projectRoot, entry.sourcePath))
    assert.deepEqual(entry.data, JSON.parse(JSON.stringify(source)))
    if (entry.kind === 'flow-v2') assert.equal(entry.id, entry.data.target.id)
  }
})

test('Inspector artifacts and contract tests are tool-owned, not plan-owned', () => {
  const legacyArtifacts = legacyPlanRoots.flatMap((root) =>
    discoverLegacyInspectorArtifacts(root)
  )
  assert.deepEqual(
    legacyArtifacts.map((artifact) =>
      path.relative(projectRoot, artifact).split(path.sep).join('/')
    ),
    []
  )
})

test('catalog owns unique stable short slugs without changing Inspector identities', () => {
  const sandbox = {}
  vm.runInNewContext(fs.readFileSync(bundlePath, 'utf8'), sandbox)
  const entries = sandbox.FLOW_INSPECTOR_WORKSPACE_BUNDLE.entries
  assert.equal(
    entries.find(
      (entry) =>
        entry.id === 'asyra-design-ai-conversational-drawing-performance'
    ).slug,
    'ai-drawing-performance'
  )
  assert.equal(
    entries.find((entry) => entry.id === 'transaction-atomicity').slug,
    'transaction-atomicity'
  )
  assert.equal(new Set(entries.map((entry) => entry.slug)).size, entries.length)
  const policy = require(catalogPath)
  for (const entry of entries)
    assert.equal(entry.slug, policy.routeSlugs[entry.id] ?? entry.id)
  for (const entry of entries)
    assert.match(entry.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

test('generator rejects colliding, reserved, malformed, and orphaned slug declarations before output', () => {
  const { createRequire } = require('node:module')
  const localRequire = createRequire(generatorPath)
  const original = require(catalogPath)
  const source = fs.readFileSync(generatorPath, 'utf8')
  for (const overrides of [
    { 'transaction-atomicity': 'stroke' },
    { 'transaction-atomicity': 'api' },
    { 'transaction-atomicity': '../private' },
    { 'transaction-atomicity': 'Upper Case' },
    { 'transaction-atomicity': '' },
    { 'transaction-atomicity': 123 },
    { 'transaction-atomicity': null },
    { 'unknown-inspector': 'unknown' }
  ]) {
    let writes = 0
    const policy = {
      ...original,
      routeSlugs: { ...original.routeSlugs, ...overrides }
    }
    assert.throws(
      () =>
        vm.runInNewContext(source, {
          __dirname: workspaceRoot,
          require: Object.assign(
            (name) => {
              if (name === './catalog.cjs') return policy
              if (name === 'node:fs')
                return {
                  ...fs,
                  writeFileSync() {
                    writes++
                  }
                }
              return localRequire(name)
            },
            { resolve: localRequire.resolve, cache: require.cache }
          ),
          console: { log: () => undefined }
        }),
      /slug/i
    )
    assert.equal(writes, 0)
  }
})
