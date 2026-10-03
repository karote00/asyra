/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const {
  canonicalRelativePath,
  workspaceName,
  matchesSourceInput,
  validateWorkspaceSources
} = require('./contracts.cjs')

const fingerprint = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
const requireValue = (condition, message) => {
  if (!condition) throw new Error('Runtime authority: ' + message)
}

function workspacePatterns(manifest) {
  const patterns = manifest.workspaces
  requireValue(
    Array.isArray(patterns) &&
      patterns.length > 0 &&
      new Set(patterns).size === patterns.length &&
      patterns.every(
        (pattern) =>
          canonicalRelativePath(pattern) &&
          pattern
            .split('/')
            .every((part) => part === '*' || /^[a-zA-Z0-9_-]+$/.test(part))
      ),
    'unsupported workspace layout'
  )
  return patterns
}

function discoverWorkspaceManifests(root, manifest, safePath) {
  const files = new Set()
  for (const pattern of workspacePatterns(manifest)) {
    for (const directory of fs.globSync(pattern, { cwd: root })) {
      const absolute = safePath(root, directory)
      if (!fs.lstatSync(absolute).isDirectory()) continue
      const file = directory + '/package.json'
      if (!fs.existsSync(safePath(root, file))) continue
      requireValue(!files.has(file), 'overlapping workspace declarations')
      files.add(file)
    }
  }
  return [...files].sort()
}

function workspaceDependencies(metadata, names) {
  const dependencies = new Set()
  for (const kind of [
    'dependencies',
    'optionalDependencies',
    'peerDependencies'
  ]) {
    for (const [name, range] of Object.entries(metadata[kind] ?? {})) {
      const workspace =
        typeof range === 'string' && range.startsWith('workspace:')
      if (!workspace && !names.has(name)) continue
      requireValue(
        workspace && range.length > 'workspace:'.length && names.has(name),
        'unbound workspace dependency ' + name
      )
      dependencies.add(name)
    }
  }
  return [...dependencies].sort()
}

function sourceInputPath(file, entry) {
  const prefix = entry.repositoryDirectory + '/'
  if (!file.startsWith(prefix)) return false
  const relative = file.slice(prefix.length)
  return (
    !relative
      .split('/')
      .some((part) => part.startsWith('.') || part === '__tests__') &&
    !/\.(test|spec)\.[cm]?[jt]sx?$/.test(relative) &&
    entry.sourceInputs.some((input) => matchesSourceInput(relative, input))
  )
}

function resolveWorkspaceAuthority(contract, read, discover) {
  const scope = contract.runtimeScope
  const { digest, ...scopePayload } = scope
  requireValue(
    scope.format === 2 &&
      digest === fingerprint(scopePayload) &&
      Array.isArray(scope.steps) &&
      scope.steps.length > 0,
    'invalid workspace scope'
  )
  const declarations = validateWorkspaceSources(scope.workspaceSources)
  const rootManifest = JSON.parse(read('package.json').bytes)
  const patterns = workspacePatterns(rootManifest)
  requireValue(
    typeof discover === 'function',
    'trusted workspace discovery required'
  )
  const records = new Map()
  for (const file of discover(rootManifest)) {
    const captured = read(file)
    const metadata = JSON.parse(captured.bytes)
    const directory = file.slice(0, -'/package.json'.length)
    requireValue(
      canonicalRelativePath(directory) &&
        workspaceName(metadata.name) &&
        patterns.some((pattern) => path.posix.matchesGlob(directory, pattern)),
      'invalid workspace identity'
    )
    requireValue(
      !records.has(metadata.name),
      'duplicate workspace name ' + metadata.name
    )
    requireValue(
      metadata.repository?.directory === undefined ||
        metadata.repository.directory === directory,
      'workspace repository directory mismatch'
    )
    records.set(metadata.name, { metadata, captured, directory })
  }
  const overrides = new Map(declarations.map((entry) => [entry.name, entry]))
  const packages = new Map(),
    closures = new Map(),
    visiting = new Set()
  const visit = (name) => {
    if (closures.has(name)) return closures.get(name)
    requireValue(!visiting.has(name), 'cyclic workspace dependency')
    const record = records.get(name)
    requireValue(record, 'unknown workspace owner ' + name)
    visiting.add(name)
    const source = overrides.get(name) ?? {
      inputs: ['src/**'],
      entry: 'src/index.ts'
    }
    const entryPath =
      source.entry === null ? null : record.directory + '/' + source.entry
    if (entryPath) read(entryPath)
    const directWorkspaceDependencies = workspaceDependencies(
      record.metadata,
      records
    )
    const members = new Set([name])
    for (const dependency of directWorkspaceDependencies)
      for (const member of visit(dependency)) members.add(member)
    packages.set(name, {
      name,
      repositoryDirectory: record.directory,
      manifestPath: record.directory + '/package.json',
      entryPath,
      sourceInputs: [...source.inputs],
      manifestDigest: record.captured.digest,
      directWorkspaceDependencies
    })
    visiting.delete(name)
    const closure = [...members].sort()
    closures.set(name, closure)
    return closure
  }
  const stepClosures = scope.steps.map((step) => ({
    stepId: step.stepId,
    ownerPackage: step.ownerPackage,
    packageNames: [...visit(step.ownerPackage)]
  }))
  requireValue(
    [...overrides.keys()].every((name) => packages.has(name)),
    'unused workspace source declaration'
  )
  const packageNames = [...packages.keys()].sort()
  const payload = {
    format: 2,
    contractScopeDigest: scope.digest,
    stepClosures,
    packages: packageNames.map((name) => packages.get(name)),
    packageNames
  }
  return { ...payload, digest: fingerprint(payload) }
}

function verifyWorkspaceManifests(authority, bytesByPath) {
  const root = JSON.parse(bytesByPath.get('package.json'))
  const patterns = workspacePatterns(root)
  const names = new Set(authority.packageNames)
  for (const entry of authority.packages) {
    const metadata = JSON.parse(bytesByPath.get(entry.manifestPath))
    requireValue(
      patterns.filter((pattern) =>
        path.posix.matchesGlob(entry.repositoryDirectory, pattern)
      ).length === 1 &&
        metadata.name === entry.name &&
        (metadata.repository?.directory === undefined ||
          metadata.repository.directory === entry.repositoryDirectory) &&
        (entry.entryPath === null || bytesByPath.has(entry.entryPath)) &&
        JSON.stringify(workspaceDependencies(metadata, names)) ===
          JSON.stringify(entry.directWorkspaceDependencies),
      'captured workspace manifest graph mismatch for ' + entry.name
    )
  }
}

module.exports = {
  discoverWorkspaceManifests,
  resolveWorkspaceAuthority,
  sourceInputPath,
  verifyWorkspaceManifests
}
