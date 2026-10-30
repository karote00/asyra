import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { builtinModules } from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const appDirectory = path.resolve(testDirectory, '..')
const sourceDirectory = path.join(appDirectory, 'src')
const serverDirectory = path.join(appDirectory, 'server')
const packageJson = JSON.parse(
  readFileSync(path.join(appDirectory, 'package.json'), 'utf8')
)

const sourceFiles = []
const visit = (directory, files = sourceFiles) => {
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry)
    if (statSync(absolutePath).isDirectory()) {
      if (entry !== '__tests__') {
        visit(absolutePath, files)
      }
      continue
    }
    if (/\.(?:ts|tsx|mjs)$/.test(entry)) {
      files.push(absolutePath)
    }
  }
}
visit(sourceDirectory)
const backendSourceFiles = []
visit(serverDirectory, backendSourceFiles)
backendSourceFiles.push(path.join(appDirectory, 'collaboration-server.ts'))

const runtimePackagesOwnedByCore = [
  'factory',
  'feature-system',
  'input-system',
  'reactive-events',
  'render'
]

const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`)
])
const externalPackageName = (specifier) =>
  specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0]
const collectExternalImports = (absolutePath) => {
  const source = readFileSync(absolutePath, 'utf8')
  const imports = new Set()
  const pattern =
    /(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/gu

  for (const match of source.matchAll(pattern)) {
    const specifier = match[1] ?? match[2] ?? match[3]
    if (
      specifier.startsWith('.') ||
      specifier.startsWith('/') ||
      nodeBuiltins.has(specifier)
    ) {
      continue
    }
    imports.add(specifier)
  }
  return imports
}

test('Asyra Design production code uses Core for framework-owned runtime capabilities', () => {
  const failures = []
  for (const absolutePath of sourceFiles) {
    const source = readFileSync(absolutePath, 'utf8')
    if (/\bcore\.deps\b/.test(source)) {
      failures.push(
        `${path.relative(appDirectory, absolutePath)} accesses core.deps`
      )
    }
    for (const packageName of runtimePackagesOwnedByCore) {
      if (
        new RegExp(`['"]@asyra/${packageName.replaceAll('-', '\\-')}['"]`).test(
          source
        )
      ) {
        failures.push(
          `${path.relative(appDirectory, absolutePath)} imports @asyra/${packageName}`
        )
      }
    }
  }
  assert.deepEqual(failures, [])
})

test('Asyra Design declares only independently composed framework packages', () => {
  for (const packageName of runtimePackagesOwnedByCore) {
    assert.equal(
      packageJson.dependencies[`@asyra/${packageName}`],
      undefined,
      `@asyra/${packageName} must be consumed through @asyra/core`
    )
  }
  assert.equal(typeof packageJson.dependencies['@asyra/core'], 'string')
  assert.equal(
    typeof packageJson.dependencies['@asyra/collaboration'],
    'string',
    'Provider and wire adapters remain independently composed'
  )
  assert.equal(packageJson.scripts.start, 'vite dev')
  assert.equal(packageJson.scripts['react:start'], undefined)
})

test('Asyra Design declares every production import as a direct runtime dependency', () => {
  const missingDependencies = new Map()
  for (const absolutePath of [...sourceFiles, ...backendSourceFiles]) {
    for (const specifier of collectExternalImports(absolutePath)) {
      const packageName = externalPackageName(specifier)
      if (packageJson.dependencies[packageName] !== undefined) {
        continue
      }
      const consumers = missingDependencies.get(packageName) ?? []
      consumers.push(path.relative(appDirectory, absolutePath))
      missingDependencies.set(packageName, consumers)
    }
  }

  assert.deepEqual(
    Object.fromEntries(
      [...missingDependencies]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([packageName, consumers]) => [
          packageName,
          [...new Set(consumers)].sort()
        ])
    ),
    {},
    'production imports must not rely on a hoisted or transitive dependency'
  )
})

test('Asyra Design declares the browser-like test environment used by Vitest', () => {
  assert.match(packageJson.scripts['test:ai'], /--environment jsdom/)
  assert.match(packageJson.scripts['test:local'], /--environment jsdom/)
  assert.equal(typeof packageJson.devDependencies.jsdom, 'string')
  assert.equal(
    typeof packageJson.devDependencies['@testing-library/dom'],
    'string',
    '@testing-library/user-event must not rely on a transitive DOM test peer'
  )
})

const independentBackendEntries = new Set([
  '@asyra/preset/group-bounds',
  '@asyra/ai-agent-runtime',
  '@asyra/ai-agent-runtime/node'
])

test('Asyra Design backend uses App protocols and independent public capabilities', () => {
  const failures = []
  for (const absolutePath of backendSourceFiles) {
    for (const specifier of collectExternalImports(absolutePath)) {
      if (
        specifier.startsWith('@asyra/') &&
        !independentBackendEntries.has(specifier)
      ) {
        failures.push(
          `${path.relative(appDirectory, absolutePath)} imports ${specifier}`
        )
      }
    }
  }
  assert.deepEqual(failures, [])
})

for (const specifier of [
  '@asyra/ai-agent-runtime',
  '@asyra/ai-agent-runtime/node'
]) {
  test(`${specifier} does not pull other framework execution owners into the backend`, async () => {
    const entry = fileURLToPath(import.meta.resolve(specifier))
    const runtimeDirectory = path.resolve(
      path.dirname(
        fileURLToPath(import.meta.resolve('@asyra/ai-agent-runtime'))
      ),
      '..'
    )
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      ssr: { noExternal: true },
      build: { ssr: entry, write: false, minify: false }
    })
    const chunks = (Array.isArray(result) ? result : [result])
      .flatMap((item) => item.output)
      .filter((item) => item.type === 'chunk')
    const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules))
    assert.ok(modules.includes(entry))
    assert.deepEqual(
      modules.filter((file) => !file.startsWith(runtimeDirectory + path.sep)),
      [],
      'Runtime must not bundle Core, renderer, Design or another execution owner'
    )
    assert.deepEqual(
      chunks
        .flatMap((chunk) => [...chunk.imports, ...chunk.dynamicImports])
        .filter((name) => !nodeBuiltins.has(name)),
      [],
      'Only the Node entry may retain built-in I/O dependencies'
    )
    if (specifier === '@asyra/ai-agent-runtime') {
      assert.deepEqual(
        chunks.flatMap((chunk) => chunk.imports),
        []
      )
    }
  })
}

test('the public Group bounds entrypoint loads only its canonical pure geometry dependency', async () => {
  const entry = fileURLToPath(import.meta.resolve('@asyra/preset/group-bounds'))
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    ssr: { noExternal: true },
    build: {
      ssr: entry,
      write: false,
      minify: false
    }
  })
  const results = Array.isArray(result) ? result : [result]
  const chunks = results
    .flatMap((item) => item.output)
    .filter((item) => item.type === 'chunk')
  const utilsDirectory = path.dirname(
    fileURLToPath(import.meta.resolve('@asyra/utils'))
  )
  const geometryEntry = path.join(utilsDirectory, 'render/geometry-bounds.js')
  // Exact owner closure: a new dependency must be reviewed, not silently allowed
  // merely because it lives somewhere in Utils. The unused point transform
  // is tree-shaken from this consumer; the ellipse calculation remains shared.
  assert.deepEqual(
    chunks.flatMap((chunk) => Object.keys(chunk.modules)).sort(),
    [entry, geometryEntry].sort()
  )
  assert.equal(
    fileURLToPath(import.meta.resolve('@asyra/utils/geometry-bounds')),
    geometryEntry
  )
  const rootGeometry = await import('@asyra/utils')
  const narrowGeometry = await import('@asyra/utils/geometry-bounds')
  assert.equal(
    narrowGeometry.calculateEllipseBounds,
    rootGeometry.calculateEllipseBounds,
    'Public entries must share one calculation owner'
  )
  assert.deepEqual(
    chunks.flatMap((chunk) => [...chunk.imports, ...chunk.dynamicImports]),
    []
  )
  assert.equal(chunks.length, 1)
  const { deriveGroupBounds } = await import(
    `data:text/javascript;base64,${Buffer.from(chunks[0].code).toString('base64')}`
  )
  assert.deepEqual(deriveGroupBounds([]), { x: 0, y: 0, width: 0, height: 0 })
  assert.deepEqual(
    deriveGroupBounds([{ x: 10, y: 20, width: -15, height: 10 }]),
    { x: -5, y: 20, width: 15, height: 10 }
  )
  assert.throws(
    () => deriveGroupBounds([{ x: 0, y: NaN, width: 5, height: 5 }]),
    /finite/
  )
  const oval = Object.freeze({
    type: 'oval',
    x: 10,
    y: 20,
    width: 20,
    height: 10,
    rotation: Math.PI / 4
  })
  const bounds = deriveGroupBounds([oval])
  const radius = Math.sqrt(62.5)
  for (const [key, expected] of Object.entries({
    x: 10 + 5 / Math.sqrt(2) - radius,
    y: 20 + 15 / Math.sqrt(2) - radius,
    width: 2 * radius,
    height: 2 * radius
  })) {
    assert.ok(Math.abs(bounds[key] - expected) < 1e-10, key)
  }
})

for (const configFileName of [
  'vite.collaboration-server.config.ts',
  'vite.document-backend.config.ts'
]) {
  test(`${configFileName} restricts the backend graph to its independent diagnostic capabilities`, async () => {
    const result = await build({
      root: appDirectory,
      configFile: path.join(appDirectory, configFileName),
      logLevel: 'silent',
      build: {
        emptyOutDir: false,
        write: false
      }
    })
    const buildResults = Array.isArray(result) ? result : [result]
    const chunks = buildResults
      .flatMap((buildResult) => buildResult.output)
      .filter((output) => output.type === 'chunk')
    const moduleIds = chunks.flatMap((chunk) => Object.keys(chunk.modules))
    const frameworkModules = moduleIds
      .filter(
        (moduleId) =>
          /[/\\]packages[/\\][^/\\]+[/\\](?:src|dist)[/\\]/.test(moduleId) ||
          /[/\\]node_modules[/\\]@asyra[/\\]/.test(moduleId)
      )
      .map((moduleId) => path.relative(appDirectory, moduleId))
    let allowedDiagnosticModules = new Set()
    if (configFileName === 'vite.document-backend.config.ts') {
      const diagnosticBuild = await build({
        root: appDirectory,
        configFile: false,
        logLevel: 'silent',
        ssr: { noExternal: true },
        build: {
          ssr: path.join(
            testDirectory,
            'fixtures/backend-diagnostics-entry.mjs'
          ),
          write: false,
          minify: false
        }
      })
      allowedDiagnosticModules = new Set(
        (Array.isArray(diagnosticBuild) ? diagnosticBuild : [diagnosticBuild])
          .flatMap((item) => item.output)
          .filter((item) => item.type === 'chunk')
          .flatMap((chunk) => Object.keys(chunk.modules))
          .map((id) => path.relative(appDirectory, id))
      )
      assert.ok(
        frameworkModules.length > 0,
        'Persistence diagnostics must be included'
      )
    }
    assert.deepEqual(
      frameworkModules.filter((id) => !allowedDiagnosticModules.has(id)),
      [],
      'Backend may only compose the dependency graph of its public diagnostic functions'
    )

    const frameworkTerms = chunks.flatMap((chunk) =>
      ['@asyra/', 'Factory', 'Core'].filter((term) => chunk.code.includes(term))
    )
    assert.deepEqual(
      frameworkTerms,
      [],
      'backend bundles must not expose framework package or runtime terminology'
    )
  })
}

test('ordinary AI validation includes structural delivery regressions', () => {
  assert.match(
    packageJson.scripts['test:ai'],
    /src\/ai\/__tests__\/structural-delivery\.test\.ts(?:\s|$)/
  )
})

test('ordinary validation includes every maintained server regression suite', () => {
  const commands = [
    packageJson.scripts['test:server-response-harness'],
    packageJson.scripts['test:local']
  ].join(' ')
  const missing = readdirSync(path.join(serverDirectory, '__tests__'))
    .filter((file) => file.endsWith('.test.ts'))
    .filter(
      (file) => !commands.split(/\s+/).includes(`server/__tests__/${file}`)
    )
  assert.deepEqual(
    missing,
    [],
    'Maintained server regressions must be in ordinary package validation'
  )
})

test('formal AI suites do not enable live model inference', () => {
  const directories = [
    path.join(appDirectory, 'server/__tests__'),
    path.join(appDirectory, 'e2e'),
    path.resolve(appDirectory, '../../scripts/__tests__')
  ]
  const failures = []
  for (const directory of directories) {
    for (const name of readdirSync(directory)) {
      if (!/\.(test|spec)\.(ts|tsx|mjs)$/.test(name)) {
        continue
      }
      const source = readFileSync(path.join(directory, name), 'utf8')
      if (
        /process\.env\.(E2E_LOCAL_AI|LOCAL_AI_DISCOVERY_PROBE)\b/.test(source)
      ) {
        failures.push(path.relative(appDirectory, path.join(directory, name)))
      }
    }
  }
  assert.deepEqual(
    failures,
    [],
    'Model inference belongs to explicit manual evaluation, not formal tests'
  )
})
