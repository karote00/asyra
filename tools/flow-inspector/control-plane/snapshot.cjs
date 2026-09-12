/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const vm = require('node:vm')
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
  captureSource,
  createRuntimeSource,
  validateRuntimeSource,
  safePath,
  sha256
}
