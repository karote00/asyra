/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const vm = require('node:vm')
const { pathToFileURL } = require('node:url')
const { admitContract } = require('./contracts.cjs')

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const sourcePackages = ['factory', 'reactive-events', 'utils', 'persistence']

const runtimeMetadata = [
  'package.json',
  'yarn.lock',
  ...sourcePackages.map((name) => 'packages/' + name + '/package.json')
]
const runtimePath = (file) =>
  runtimeMetadata.includes(file) ||
  (sourcePackages.some((name) =>
    file.startsWith('packages/' + name + '/src/')
  ) &&
    !file.split('/').includes('__tests__'))

function createRuntimeSource(fullFiles) {
  const files = Object.freeze(
    fullFiles
      .filter((entry) => runtimePath(entry.path))
      .sort((a, b) => (a.path < b.path ? -1 : Number(a.path > b.path)))
      .map(({ path, size, digest }) => Object.freeze({ path, size, digest }))
  )
  return Object.freeze({
    format: 1,
    files,
    digest: sha256(JSON.stringify(files))
  })
}

function createVerificationSource(fullFiles, contract) {
  const roles = {
    manifest: contract.manifestPath,
    architecture: contract.architecturePath,
    spec: contract.specPath,
    test: contract.testFile,
    configuration: contract.configFile
  }
  const paths = Object.values(roles)
  if (
    new Set(paths).size !== paths.length ||
    paths.some(
      (file) =>
        typeof file !== 'string' ||
        file.includes('\\') ||
        file.includes('\0') ||
        file
          .split('/')
          .some((part) => !part || part === '.' || part === '..') ||
        runtimePath(file)
    )
  )
    throw new Error('Verification source: invalid or overlapping role path')
  const files = paths.sort().map((file) => {
    const entries = fullFiles.filter((entry) => entry.path === file)
    if (entries.length !== 1)
      throw new Error('Verification source: missing or duplicate role entry')
    const { path, size, digest } = entries[0]
    return Object.freeze({ path, size, digest })
  })
  const payload = {
    format: 1,
    contractDigest: contract.digest,
    mappingVersion: contract.mappingVersion,
    architectureVersion: contract.architectureVersion,
    roles: Object.freeze(roles),
    files: Object.freeze(files)
  }
  return Object.freeze({ ...payload, digest: sha256(JSON.stringify(payload)) })
}

function createDerivedExecution(input) {
  const requireValue = (condition, message) => {
    if (!condition) throw new Error('Execution source: ' + message)
  }
  requireValue(
    input &&
      typeof input === 'object' &&
      !Array.isArray(input) &&
      Object.keys(input).length === 2 &&
      Object.hasOwn(input, 'sourceRoot') &&
      Object.hasOwn(input, 'verificationSource'),
    'only trusted source location and verification descriptor are accepted'
  )
  const { sourceRoot, verificationSource } = input
  requireValue(
    typeof sourceRoot === 'string' &&
      path.isAbsolute(sourceRoot) &&
      sourceRoot === path.resolve(sourceRoot) &&
      !sourceRoot.includes('\\') &&
      !sourceRoot.includes('\0') &&
      path.basename(sourceRoot) === 'source',
    'trusted canonical source root required'
  )
  const configurationFile =
    'tools/flow-inspector/control-plane/candidate-config.mjs'
  const bootstrapFile =
    'tools/flow-inspector/control-plane/candidate-bootstrap.cjs'
  const original = verificationSource?.roles?.configuration
  requireValue(
    verificationSource?.format === 1 &&
      /^[a-f0-9]{64}$/.test(verificationSource.digest ?? '') &&
      typeof original === 'string' &&
      !original.includes('\\') &&
      !original.includes('\0') &&
      !original
        .split('/')
        .some((part) => !part || part === '.' || part === '..'),
    'original verification descriptor required'
  )
  requireValue(
    ![configurationFile, bootstrapFile].some(
      (file) =>
        runtimePath(file) ||
        Object.values(verificationSource.roles).includes(file)
    ),
    'generated paths overlap original source roles'
  )
  const configuration = `import original from ${JSON.stringify(pathToFileURL(path.join(sourceRoot, original)).href)};
import { stripTypeScriptTypes } from 'node:module';
export default {
  ...original, esbuild: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [...(original.plugins ?? []), {
    name: 'contained-native-typescript', enforce: 'pre',
    transform(code, id) {
      if (!id.split('?')[0].endsWith('.ts') || id.includes('/node_modules/')) return;
      return { code: stripTypeScriptTypes(code, { mode: 'transform', sourceMap: false }), map: null };
    }
  }],
  test: { ...original.test, pool: 'threads', maxWorkers: 1, minWorkers: 1,
    deps: { optimizer: { ssr: { enabled: false }, web: { enabled: false } } }
  }
};`
  const bootstrap = `const { pathToFileURL } = require('node:url');
const [, , owner, runner, ...args] = process.argv;
setInterval(() => {
  if (process.ppid !== Number(owner)) process.kill(-process.pid, 'SIGKILL');
}, 100).unref();
process.argv = [process.execPath, runner, ...args];
import(pathToFileURL(runner).href).catch(() => process.exit(2));`
  const files = Object.freeze([
    Object.freeze({ path: bootstrapFile, content: bootstrap }),
    Object.freeze({ path: configurationFile, content: configuration })
  ])
  const payload = {
    format: 1,
    policy: 'contained-native-typescript-v1',
    verificationSourceDigest: verificationSource.digest,
    roles: Object.freeze({
      configuration: configurationFile,
      bootstrap: bootstrapFile
    }),
    files: Object.freeze(
      files.map(({ path, content }) =>
        Object.freeze({
          path,
          size: Buffer.byteLength(content),
          digest: sha256(content)
        })
      )
    )
  }
  return Object.freeze({
    files,
    executionSource: Object.freeze({
      ...payload,
      digest: sha256(JSON.stringify(payload))
    })
  })
}

function validateSourceSnapshot(
  snapshot,
  contract,
  fullFiles = snapshot.files,
  executionContext
) {
  const present = Object.hasOwn(snapshot, 'verificationSource')
  const executionPresent = Object.hasOwn(snapshot, 'executionSource')
  if (executionPresent && !present)
    throw new Error('Execution source: original verification identity required')
  if (present && !Object.hasOwn(snapshot, 'runtimeSource'))
    throw new Error('Verification source: runtime identity required')
  const runtimeSource = validateRuntimeSource(snapshot, fullFiles)
  if (!present) return Object.freeze({ runtimeSource })
  if (
    !runtimeSource ||
    snapshot.contractDigest !== contract.digest ||
    snapshot.mappingVersion !== contract.mappingVersion ||
    snapshot.architectureVersion !== contract.architectureVersion
  )
    throw new Error('Verification source: admitted contract mismatch')
  const verificationSource = createVerificationSource(fullFiles, contract)
  if (
    JSON.stringify(snapshot.verificationSource) !==
    JSON.stringify(verificationSource)
  )
    throw new Error(
      'Verification source: descriptor does not bind captured role bytes'
    )
  if (!executionPresent)
    return Object.freeze({ runtimeSource, verificationSource })
  const { executionSource } = createDerivedExecution({
    sourceRoot: executionContext?.sourceRoot,
    verificationSource
  })
  const paths = new Set(
    [
      ...runtimeSource.files,
      ...verificationSource.files,
      ...executionSource.files
    ].map((entry) => entry.path)
  )
  if (
    fullFiles.length !== paths.size ||
    fullFiles.some((entry) => !paths.has(entry.path)) ||
    executionSource.files.some((entry) => {
      const captured = fullFiles.find((file) => file.path === entry.path)
      return (
        !captured ||
        captured.size !== entry.size ||
        captured.digest !== entry.digest
      )
    }) ||
    JSON.stringify(snapshot.executionSource) !==
      JSON.stringify(executionSource) ||
    snapshot.configurationDigest !== executionSource.digest
  )
    throw new Error(
      'Execution source: generated bytes, full inventory or configuration identity mismatch'
    )
  return Object.freeze({ runtimeSource, verificationSource, executionSource })
}

function safePath(root, relative) {
  const resolved = path.resolve(root, relative)
  if (!resolved.startsWith(path.resolve(root) + path.sep))
    throw new Error('Source path escapes repository')
  let current = path.resolve(root)
  for (const part of path.relative(root, resolved).split(path.sep)) {
    current = path.join(current, part)
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink())
      throw new Error('Symlinked proof path: ' + relative)
  }
  return resolved
}

function validateRuntimeSource(snapshot, fullFiles = snapshot.files) {
  if (!Object.hasOwn(snapshot, 'runtimeSource')) return
  const requireValue = (condition, message) => {
    if (!condition) throw new Error('Runtime source: ' + message)
  }
  const object = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
  const fingerprint = (value) =>
    typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
  requireValue(
    Array.isArray(fullFiles) && fullFiles.length > 0,
    'full snapshot manifest required'
  )
  const paths = new Set()
  for (const entry of fullFiles) {
    requireValue(
      object(entry) &&
        Object.keys(entry).length === 3 &&
        ['path', 'size', 'digest'].every((key) => Object.hasOwn(entry, key)) &&
        typeof entry.path === 'string' &&
        !entry.path.includes('\\') &&
        !entry.path.includes('\0') &&
        entry.path
          .split('/')
          .every((part) => part && part !== '.' && part !== '..') &&
        !paths.has(entry.path) &&
        Number.isSafeInteger(entry.size) &&
        entry.size >= 0 &&
        fingerprint(entry.digest),
      'invalid full manifest entry'
    )
    paths.add(entry.path)
  }
  requireValue(
    fingerprint(snapshot.digest) &&
      sha256(JSON.stringify(fullFiles)) === snapshot.digest,
    'full manifest does not bind snapshot digest'
  )
  requireValue(
    runtimeMetadata.every((file) => paths.has(file)),
    'required runtime metadata missing'
  )
  const runtime = snapshot.runtimeSource
  requireValue(
    object(runtime) &&
      Object.keys(runtime).length === 3 &&
      ['format', 'files', 'digest'].every((key) =>
        Object.hasOwn(runtime, key)
      ) &&
      runtime.format === 1 &&
      Array.isArray(runtime.files) &&
      fingerprint(runtime.digest),
    'invalid runtime identity'
  )
  const expected = createRuntimeSource(fullFiles)
  requireValue(
    JSON.stringify(runtime.files) === JSON.stringify(expected.files) &&
      expected.digest === runtime.digest,
    'runtime inventory differs from full manifest'
  )
  requireValue(
    fingerprint(snapshot.lockfileDigest) &&
      fullFiles.find((entry) => entry.path === 'yarn.lock').digest ===
        snapshot.lockfileDigest,
    'lockfile identity mismatch'
  )
  return Object.freeze({
    format: 1,
    files: expected.files,
    digest: runtime.digest
  })
}

function selectSourceEntries(
  repositoryRoot,
  runtimeInput,
  verificationInput,
  contract
) {
  const repository = fs.realpathSync(repositoryRoot)
  for (const input of [runtimeInput, verificationInput]) {
    if (
      !input?.admission ||
      input.admission.repository !== repository ||
      !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(
        input.admission.attemptId ?? ''
      ) ||
      path.basename(input.sourceRoot ?? '') !== 'source' ||
      path.basename(path.dirname(input.sourceRoot ?? '')) !==
        input.admission.attemptId
    )
      throw new Error('Source composition repository or attempt mismatch')
    if (
      input.sourceRoot !==
      safePath(repository, path.relative(repository, input.sourceRoot))
    )
      throw new Error('Source composition requires canonical source roots')
  }
  const runtime = runtimeInput.admission.runtimeSource
  const verification = verificationInput.admission.verificationSource
  if (
    !runtime ||
    !verification ||
    verificationInput.admission.contractDigest !== contract.digest ||
    verificationInput.admission.mappingVersion !== contract.mappingVersion ||
    verificationInput.admission.architectureVersion !==
      contract.architectureVersion ||
    verificationInput.admission.configurationDigest !==
      verification.files.find((entry) => entry.path === contract.configFile)
        ?.digest
  )
    throw new Error(
      'Source composition requires exact ordinary verification configuration'
    )
  const selected = [
    ...runtime.files.map((entry) => ({ entry, root: runtimeInput.sourceRoot })),
    ...verification.files.map((entry) => ({
      entry,
      root: verificationInput.sourceRoot
    }))
  ].sort((a, b) =>
    a.entry.path < b.entry.path ? -1 : Number(a.entry.path > b.entry.path)
  )
  if (new Set(selected.map((item) => item.entry.path)).size !== selected.length)
    throw new Error('Source composition inventories overlap')
  return { repository, runtime, verification, selected }
}

function readSourceEntries(selected, consume) {
  const files = []
  for (const { entry, root } of selected) {
    const input = safePath(root, entry.path)
    if (!fs.lstatSync(input).isFile())
      throw new Error('Source composition requires regular source files')
    const bytes = fs.readFileSync(input)
    if (bytes.length !== entry.size || sha256(bytes) !== entry.digest)
      throw new Error('Source composition byte fingerprint mismatch')
    consume?.(entry, bytes)
    files.push(
      Object.freeze({
        path: entry.path,
        digest: entry.digest,
        size: entry.size
      })
    )
  }
  return files
}

function verifySourceDescriptors(files, runtime, verification, contract) {
  const runtimeSource = createRuntimeSource(files)
  const verificationSource = createVerificationSource(files, contract)
  if (
    runtimeSource.digest !== runtime.digest ||
    verificationSource.digest !== verification.digest
  )
    throw new Error('Source composition descriptor mismatch')
  return { runtimeSource, verificationSource }
}

function verifyRetainedSnapshotBytes(repositoryRoot, sourceRoot, fullFiles) {
  const repository = fs.realpathSync(repositoryRoot)
  if (typeof sourceRoot !== 'string' || path.basename(sourceRoot) !== 'source')
    throw new Error('Retained snapshot requires a source root')
  if (
    sourceRoot !== safePath(repository, path.relative(repository, sourceRoot))
  )
    throw new Error('Retained snapshot requires a canonical source root')
  if (!Array.isArray(fullFiles) || !fullFiles.length)
    throw new Error('Retained snapshot requires a full manifest')
  readSourceEntries(fullFiles.map((entry) => ({ entry, root: sourceRoot })))
}

function verifyRetainedSource(repositoryRoot, input, contract) {
  const { runtime, verification, selected } = selectSourceEntries(
    repositoryRoot,
    input,
    input,
    contract
  )
  const files = readSourceEntries(selected)
  verifySourceDescriptors(files, runtime, verification, contract)
}

function composeSource(
  repositoryRoot,
  runDirectory,
  runtimeInput,
  verificationInput,
  contract
) {
  const { repository, runtime, verification, selected } = selectSourceEntries(
    repositoryRoot,
    runtimeInput,
    verificationInput,
    contract
  )
  const sourceRoot = safePath(
    repository,
    path.relative(repository, path.join(runDirectory, 'source'))
  )
  const manifestPath = safePath(
    repository,
    path.relative(repository, path.join(runDirectory, 'source-manifest.json'))
  )
  if (fs.existsSync(sourceRoot) || fs.existsSync(manifestPath))
    throw new Error('Immutable source snapshot already exists')
  for (const input of [runtimeInput, verificationInput]) {
    if (
      sourceRoot === input.sourceRoot ||
      sourceRoot.startsWith(input.sourceRoot + path.sep) ||
      input.sourceRoot.startsWith(sourceRoot + path.sep)
    )
      throw new Error('Source composition destination overlaps retained source')
  }
  const files = readSourceEntries(selected, (entry, bytes) => {
    const output = safePath(sourceRoot, entry.path)
    fs.mkdirSync(path.dirname(output), { recursive: true })
    fs.writeFileSync(output, bytes, { flag: 'wx', mode: 0o444 })
  })
  const { runtimeSource, verificationSource } = verifySourceDescriptors(
    files,
    runtime,
    verification,
    contract
  )
  const manifest = JSON.stringify(files)
  fs.writeFileSync(manifestPath, manifest, { flag: 'wx', mode: 0o444 })
  return Object.freeze({
    kind: 'worktree-snapshot',
    runtimeSource,
    verificationSource,
    sourceRoot,
    digest: sha256(manifest),
    contractDigest: contract.digest,
    mappingVersion: contract.mappingVersion,
    architectureVersion: contract.architectureVersion,
    configurationDigest: verificationInput.admission.configurationDigest,
    lockfileDigest: files.find((entry) => entry.path === 'yarn.lock').digest,
    manifestPath: path.relative(repository, manifestPath),
    head: runtimeInput.admission.head,
    files: Object.freeze(files),
    fileCount: files.length,
    readCount: files.length
  })
}

function captureSource(repositoryRoot, runDirectory, contract) {
  const sourceRoot = safePath(
    repositoryRoot,
    path.relative(repositoryRoot, path.join(runDirectory, 'source'))
  )
  if (fs.existsSync(sourceRoot)) throw new Error('Snapshot already exists')
  const paths = new Set()
  const walk = (relative) => {
    const absolute = safePath(repositoryRoot, relative)
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      if (entry.isSymbolicLink())
        throw new Error(
          'Symlinked proof source: ' + relative + '/' + entry.name
        )
      if (entry.name === '__tests__') continue
      const child = relative + '/' + entry.name
      if (entry.isDirectory()) walk(child)
      else if (entry.isFile()) paths.add(child)
      else throw new Error('Unsupported source file: ' + child)
    }
  }
  for (const name of sourcePackages) {
    walk('packages/' + name + '/src')
    paths.add('packages/' + name + '/package.json')
  }
  paths.add('package.json')
  paths.add('yarn.lock')
  const runtimePaths = new Set(paths)
  for (const relative of [
    contract.manifestPath,
    contract.architecturePath,
    contract.specPath,
    contract.testFile,
    contract.configFile
  ]) {
    if (runtimePaths.has(relative))
      throw new Error('Verification input overlaps runtime source: ' + relative)
    paths.add(relative)
  }
  fs.mkdirSync(sourceRoot, { recursive: true })
  const files = []
  const captured = new Map()
  for (const relative of [...paths].sort()) {
    const input = safePath(repositoryRoot, relative)
    if (!fs.lstatSync(input).isFile())
      throw new Error('Expected a regular source file')
    const bytes = fs.readFileSync(input)
    const output = path.join(sourceRoot, relative)
    fs.mkdirSync(path.dirname(output), { recursive: true })
    fs.writeFileSync(output, bytes, { flag: 'wx', mode: 0o444 })
    files.push({ path: relative, digest: sha256(bytes), size: bytes.length })
    captured.set(relative, bytes)
  }
  const manifest = JSON.parse(captured.get(contract.manifestPath).toString())
  for (const name of sourcePackages) {
    const metadata = JSON.parse(
      captured.get('packages/' + name + '/package.json').toString()
    )
    for (const dependency of Object.keys(metadata.dependencies ?? {})) {
      if (
        dependency.startsWith('@asyra/') &&
        !sourcePackages.includes(dependency.slice('@asyra/'.length))
      )
        throw new Error('Undeclared source dependency: ' + dependency)
    }
  }
  const sandbox = { module: { exports: {} }, globalThis: {} }
  vm.runInNewContext(
    captured.get(contract.architecturePath).toString(),
    sandbox,
    { timeout: 1000 }
  )
  const capturedContract = admitContract(manifest, sandbox.module.exports)
  if (capturedContract.digest !== contract.digest)
    throw new Error(
      'Contract changed during capture; retry with current contract'
    )
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  }).trim()
  const manifestPath = path.join(runDirectory, 'source-manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(files), {
    flag: 'wx',
    mode: 0o444
  })
  const runtimeSource = createRuntimeSource(files)
  return {
    kind: 'worktree-snapshot',
    runtimeSource,
    verificationSource: createVerificationSource(files, contract),
    sourceRoot,
    digest: sha256(JSON.stringify(files)),
    contractDigest: contract.digest,
    mappingVersion: contract.mappingVersion,
    architectureVersion: contract.architectureVersion,
    configurationDigest: files.find((item) => item.path === contract.configFile)
      .digest,
    lockfileDigest: files.find((item) => item.path === 'yarn.lock').digest,
    manifestPath: path.relative(repositoryRoot, manifestPath),
    head,
    files,
    fileCount: files.length,
    readCount: files.length
  }
}

module.exports = {
  verifyRetainedSnapshotBytes,
  createDerivedExecution,
  verifyRetainedSource,
  composeSource,
  captureSource,
  createRuntimeSource,
  createVerificationSource,
  validateRuntimeSource,
  validateSourceSnapshot,
  safePath,
  sha256
}
