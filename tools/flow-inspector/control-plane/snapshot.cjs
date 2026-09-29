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

const derivedExecutionPolicy = 'contained-native-typescript-v1'
const scopedDerivedExecutionPolicy = 'contained-native-typescript-v2'
const admittedRuntimeAuthority = Symbol('admitted-runtime-authority')
const admittedRuntimeAuthorities = new WeakSet()
const fingerprint = (value) =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const canonicalPackageName = (value) =>
  typeof value === 'string' && /^@asyra\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
const sameKeys = (value, keys) =>
  object(value) && JSON.stringify(Object.keys(value)) === JSON.stringify(keys)
const usablePackageExport = (value) =>
  (typeof value === 'string' && value.length > 0) ||
  (Array.isArray(value) && value.some(usablePackageExport)) ||
  (object(value) && Object.values(value).some(usablePackageExport))
const hasPublicPackageEntry = (metadata) =>
  object(metadata?.exports) &&
  Object.hasOwn(metadata.exports, '.') &&
  usablePackageExport(metadata.exports['.'])

const runtimeMetadata = [
  'package.json',
  'yarn.lock',
  ...sourcePackages.map((name) => 'packages/' + name + '/package.json')
]
const runtimePath = (file, authority) => {
  if (!authority)
    return (
      runtimeMetadata.includes(file) ||
      (sourcePackages.some((name) =>
        file.startsWith('packages/' + name + '/src/')
      ) &&
        !file.split('/').includes('__tests__'))
    )
  return (
    file === 'package.json' ||
    file === 'yarn.lock' ||
    authority.packages.some(
      (entry) =>
        file === entry.manifestPath ||
        (file.startsWith(entry.repositoryDirectory + '/src/') &&
          !file.split('/').includes('__tests__'))
    )
  )
}

function createRuntimeSource(fullFiles, authority) {
  const files = Object.freeze(
    fullFiles
      .filter((entry) => runtimePath(entry.path, authority))
      .sort((a, b) => (a.path < b.path ? -1 : Number(a.path > b.path)))
      .map(({ path, size, digest }) => Object.freeze({ path, size, digest }))
  )
  return Object.freeze({
    format: 1,
    files,
    digest: sha256(JSON.stringify(files))
  })
}

function freezeAuthority(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeAuthority)
    Object.freeze(value)
  }
  return value
}

function resolveRuntimeAuthority(contract, read) {
  const scope = contract.runtimeScope
  if (!scope) return
  const reject = (condition, message) => {
    if (!condition) throw new Error('Runtime authority: ' + message)
  }
  reject(
    sameKeys(scope, ['format', 'steps', 'digest']) &&
      scope.format === 1 &&
      Array.isArray(scope.steps) &&
      scope.steps.length > 0,
    'unsupported scope'
  )
  reject(
    scope.digest === sha256(JSON.stringify({ format: 1, steps: scope.steps })),
    'contract scope digest mismatch'
  )
  let rootManifest
  try {
    rootManifest = JSON.parse(read('package.json').bytes.toString())
  } catch {
    throw new Error('Runtime authority: invalid root workspace manifest')
  }
  reject(
    Array.isArray(rootManifest.workspaces) &&
      rootManifest.workspaces.filter((entry) => entry === 'packages/*')
        .length === 1,
    'unsupported workspace layout'
  )
  const packages = new Map()
  const closures = new Map()
  const visiting = new Set()
  const visit = (name) => {
    if (closures.has(name)) return closures.get(name)
    reject(canonicalPackageName(name), 'unsupported package owner')
    reject(!visiting.has(name), 'cyclic workspace dependency')
    visiting.add(name)
    const repositoryDirectory = 'packages/' + name.slice('@asyra/'.length)
    const manifestPath = repositoryDirectory + '/package.json'
    let captured
    let metadata
    try {
      captured = read(manifestPath)
      metadata = JSON.parse(captured.bytes.toString())
    } catch (error) {
      throw new Error(
        'Runtime authority: missing or invalid workspace package ' +
          name +
          ': ' +
          error.message
      )
    }
    reject(
      metadata.name === name &&
        metadata.private !== true &&
        metadata.repository?.directory === repositoryDirectory &&
        hasPublicPackageEntry(metadata),
      'missing public canonical package entry'
    )
    for (const kind of ['optionalDependencies', 'peerDependencies'])
      reject(
        !Object.keys(metadata[kind] ?? {}).some((dependency) =>
          dependency.startsWith('@asyra/')
        ),
        'unsupported internal ' + kind
      )
    const directWorkspaceDependencies = Object.keys(metadata.dependencies ?? {})
      .filter((dependency) => dependency.startsWith('@asyra/'))
      .sort()
    const packageNames = new Set([name])
    for (const dependency of directWorkspaceDependencies) {
      reject(
        metadata.dependencies[dependency] === 'workspace:*',
        'unbound workspace dependency'
      )
      for (const member of visit(dependency)) packageNames.add(member)
    }
    const entryPath = repositoryDirectory + '/src/index.ts'
    try {
      read(entryPath)
    } catch (error) {
      throw new Error(
        'Runtime authority: missing public source entry ' +
          name +
          ': ' +
          error.message
      )
    }
    packages.set(name, {
      name,
      repositoryDirectory,
      manifestPath,
      entryPath,
      manifestDigest: captured.digest,
      directWorkspaceDependencies
    })
    visiting.delete(name)
    const closure = [...packageNames].sort()
    closures.set(name, closure)
    return closure
  }
  const stepClosures = scope.steps.map((step) => ({
    stepId: step.stepId,
    ownerPackage: step.ownerPackage,
    packageNames: [...visit(step.ownerPackage)]
  }))
  const packageNames = [...packages.keys()].sort()
  const payload = {
    format: 1,
    contractScopeDigest: scope.digest,
    stepClosures,
    packages: packageNames.map((name) => packages.get(name)),
    packageNames
  }
  return freezeAuthority({
    ...payload,
    digest: sha256(JSON.stringify(payload))
  })
}

function validateRuntimeAuthority(authority, contract, fullFiles) {
  const reject = (condition, message) => {
    if (!condition) throw new Error('Runtime authority: ' + message)
  }
  reject(
    sameKeys(authority, [
      'format',
      'contractScopeDigest',
      'stepClosures',
      'packages',
      'packageNames',
      'digest'
    ]) &&
      authority.format === 1 &&
      fingerprint(authority.contractScopeDigest) &&
      Array.isArray(authority.stepClosures) &&
      authority.stepClosures.length > 0 &&
      Array.isArray(authority.packages) &&
      authority.packages.length > 0 &&
      Array.isArray(authority.packageNames) &&
      authority.packageNames.length > 0 &&
      fingerprint(authority.digest),
    'invalid descriptor'
  )
  const { digest, ...payload } = authority
  reject(digest === sha256(JSON.stringify(payload)), 'digest mismatch')
  const packageNames = authority.packages.map((entry) => entry?.name)
  reject(
    packageNames.every(canonicalPackageName) &&
      JSON.stringify(packageNames) ===
        JSON.stringify([...new Set(packageNames)].sort()) &&
      JSON.stringify(authority.packageNames) === JSON.stringify(packageNames),
    'noncanonical package union'
  )
  const packages = new Map()
  for (const entry of authority.packages) {
    const repositoryDirectory = 'packages/' + entry.name.slice('@asyra/'.length)
    reject(
      sameKeys(entry, [
        'name',
        'repositoryDirectory',
        'manifestPath',
        'entryPath',
        'manifestDigest',
        'directWorkspaceDependencies'
      ]) &&
        entry.repositoryDirectory === repositoryDirectory &&
        entry.manifestPath === repositoryDirectory + '/package.json' &&
        entry.entryPath === repositoryDirectory + '/src/index.ts' &&
        fingerprint(entry.manifestDigest) &&
        Array.isArray(entry.directWorkspaceDependencies) &&
        entry.directWorkspaceDependencies.every(canonicalPackageName) &&
        JSON.stringify(entry.directWorkspaceDependencies) ===
          JSON.stringify(
            [...new Set(entry.directWorkspaceDependencies)].sort()
          ),
      'invalid package descriptor'
    )
    packages.set(entry.name, entry)
  }
  for (const entry of packages.values())
    reject(
      entry.directWorkspaceDependencies.every((name) => packages.has(name)),
      'dependency outside package union'
    )
  const visiting = new Set()
  const closures = new Map()
  const closure = (name) => {
    if (closures.has(name)) return closures.get(name)
    reject(!visiting.has(name), 'cyclic package graph')
    const entry = packages.get(name)
    reject(entry, 'unknown step owner')
    visiting.add(name)
    const result = new Set([name])
    for (const dependency of entry.directWorkspaceDependencies)
      for (const member of closure(dependency)) result.add(member)
    visiting.delete(name)
    const value = [...result].sort()
    closures.set(name, value)
    return value
  }
  const stepIds = new Set()
  for (const [index, step] of authority.stepClosures.entries()) {
    reject(
      sameKeys(step, ['stepId', 'ownerPackage', 'packageNames']) &&
        typeof step.stepId === 'string' &&
        step.stepId.length > 0 &&
        !stepIds.has(step.stepId) &&
        canonicalPackageName(step.ownerPackage) &&
        JSON.stringify(step.packageNames) ===
          JSON.stringify(closure(step.ownerPackage)),
      'invalid step closure at index ' + index
    )
    stepIds.add(step.stepId)
  }
  reject(
    JSON.stringify(
      [
        ...new Set(authority.stepClosures.flatMap((step) => step.packageNames))
      ].sort()
    ) === JSON.stringify(authority.packageNames),
    'package union differs from step closures'
  )
  if (contract) {
    const scope = contract.runtimeScope
    reject(
      scope?.format === 1 &&
        scope.digest === authority.contractScopeDigest &&
        JSON.stringify(
          scope.steps.map((step) => ({
            stepId: step.stepId,
            ownerPackage: step.ownerPackage
          }))
        ) ===
          JSON.stringify(
            authority.stepClosures.map((step) => ({
              stepId: step.stepId,
              ownerPackage: step.ownerPackage
            }))
          ),
      'contract scope mismatch'
    )
  }
  if (fullFiles) {
    const files = new Map(fullFiles.map((entry) => [entry.path, entry]))
    reject(files.size === fullFiles.length, 'duplicate full manifest path')
    for (const entry of authority.packages)
      reject(
        files.get(entry.manifestPath)?.digest === entry.manifestDigest &&
          files.has(entry.entryPath),
        'package manifest or entry is absent from runtime inventory'
      )
  }
  const validated = freezeAuthority(structuredClone(authority))
  if (admittedRuntimeAuthorities.has(authority))
    admittedRuntimeAuthorities.add(validated)
  return validated
}

function createVerificationSource(fullFiles, contract, authority) {
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
        runtimePath(file, authority)
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

function createDerivedExecution(input, authorityAdmission) {
  const requireValue = (condition, message) => {
    if (!condition) throw new Error('Execution source: ' + message)
  }
  const scoped = Object.hasOwn(input ?? {}, 'runtimeAuthority')
  requireValue(
    input &&
      typeof input === 'object' &&
      !Array.isArray(input) &&
      Object.keys(input).length === (scoped ? 3 : 2) &&
      Object.hasOwn(input, 'sourceRoot') &&
      Object.hasOwn(input, 'verificationSource'),
    'only trusted source location and verification descriptor are accepted'
  )
  const { sourceRoot, verificationSource } = input
  const runtimeAuthority = scoped ? input.runtimeAuthority : undefined
  requireValue(
    !scoped ||
      (object(runtimeAuthority) &&
        (authorityAdmission === admittedRuntimeAuthority ||
          admittedRuntimeAuthorities.has(runtimeAuthority))),
    'admitted runtime authority required'
  )
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
        runtimePath(file, runtimeAuthority) ||
        Object.values(verificationSource.roles).includes(file)
    ),
    'generated paths overlap original source roles'
  )
  const aliases = runtimeAuthority
    ? runtimeAuthority.packages.map((entry) => ({
        find: entry.name,
        replacement: path.join(sourceRoot, entry.entryPath)
      }))
    : null
  const configuration = `import original from ${JSON.stringify(pathToFileURL(path.join(sourceRoot, original)).href)};
import { stripTypeScriptTypes } from 'node:module';
export default {
  ...original, esbuild: false,
${runtimeAuthority ? `  resolve: { ...original.resolve, alias: ${JSON.stringify(aliases)} },\n` : ''}  optimizeDeps: { noDiscovery: true, include: [] },
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
    format: runtimeAuthority ? 2 : 1,
    policy: runtimeAuthority
      ? scopedDerivedExecutionPolicy
      : derivedExecutionPolicy,
    verificationSourceDigest: verificationSource.digest,
    ...(runtimeAuthority
      ? { runtimeAuthorityDigest: runtimeAuthority.digest }
      : {}),
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
  const authorityPresent = Object.hasOwn(snapshot, 'runtimeAuthority')
  if (executionPresent && !present)
    throw new Error('Execution source: original verification identity required')
  if (present && !Object.hasOwn(snapshot, 'runtimeSource'))
    throw new Error('Verification source: runtime identity required')
  const runtimeAuthority = authorityPresent
    ? validateRuntimeAuthority(snapshot.runtimeAuthority, contract, fullFiles)
    : undefined
  const runtimeSource = validateRuntimeSourceWithAuthority(
    snapshot,
    fullFiles,
    runtimeAuthority
  )
  if (!present)
    return Object.freeze({
      runtimeSource,
      ...(runtimeAuthority ? { runtimeAuthority } : {})
    })
  if (
    !runtimeSource ||
    snapshot.contractDigest !== contract.digest ||
    snapshot.mappingVersion !== contract.mappingVersion ||
    snapshot.architectureVersion !== contract.architectureVersion
  )
    throw new Error('Verification source: admitted contract mismatch')
  const verificationSource = createVerificationSource(
    fullFiles,
    contract,
    runtimeAuthority
  )
  if (
    JSON.stringify(snapshot.verificationSource) !==
    JSON.stringify(verificationSource)
  )
    throw new Error(
      'Verification source: descriptor does not bind captured role bytes'
    )
  if (!executionPresent)
    return Object.freeze({
      runtimeSource,
      ...(runtimeAuthority ? { runtimeAuthority } : {}),
      verificationSource
    })
  const { executionSource } = createDerivedExecution(
    {
      sourceRoot: executionContext?.sourceRoot,
      verificationSource,
      ...(runtimeAuthority ? { runtimeAuthority } : {})
    },
    admittedRuntimeAuthority
  )
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
  return Object.freeze({
    runtimeSource,
    ...(runtimeAuthority ? { runtimeAuthority } : {}),
    verificationSource,
    executionSource
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

function validateRuntimeSourceWithAuthority(snapshot, fullFiles, authority) {
  if (!Object.hasOwn(snapshot, 'runtimeSource')) return
  const requireValue = (condition, message) => {
    if (!condition) throw new Error('Runtime source: ' + message)
  }
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
    authority
      ? ['package.json', 'yarn.lock'].every((file) => paths.has(file))
      : runtimeMetadata.every((file) => paths.has(file)),
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
  const expected = createRuntimeSource(fullFiles, authority)
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

function validateRuntimeSource(snapshot, fullFiles = snapshot.files, contract) {
  const authority = Object.hasOwn(snapshot, 'runtimeAuthority')
    ? validateRuntimeAuthority(snapshot.runtimeAuthority, contract, fullFiles)
    : undefined
  return validateRuntimeSourceWithAuthority(snapshot, fullFiles, authority)
}

function selectSourceEntries(
  repositoryRoot,
  runtimeInput,
  verificationInput,
  contract,
  deriveExecution = false
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
  const runtimeScoped = Object.hasOwn(
    runtimeInput.admission,
    'runtimeAuthority'
  )
  const verificationScoped = Object.hasOwn(
    verificationInput.admission,
    'runtimeAuthority'
  )
  if (runtimeScoped !== verificationScoped)
    throw new Error(
      'Source composition cannot mix legacy and scoped runtime authority'
    )
  let runtimeAuthority
  if (runtimeScoped) {
    runtimeAuthority = validateRuntimeAuthority(
      runtimeInput.admission.runtimeAuthority,
      contract
    )
    const verificationAuthority = validateRuntimeAuthority(
      verificationInput.admission.runtimeAuthority,
      contract
    )
    if (
      runtimeAuthority.contractScopeDigest !==
        verificationAuthority.contractScopeDigest ||
      JSON.stringify(runtimeAuthority.stepClosures) !==
        JSON.stringify(verificationAuthority.stepClosures) ||
      JSON.stringify(runtimeAuthority.packageNames) !==
        JSON.stringify(verificationAuthority.packageNames)
    )
      throw new Error('Source composition runtime scopes differ')
  }
  const execution = runtimeInput.admission.executionSource
  if (
    Object.hasOwn(runtimeInput.admission, 'executionSource') &&
    (!deriveExecution ||
      execution?.format !== (runtimeAuthority ? 2 : 1) ||
      execution.policy !==
        (runtimeAuthority
          ? scopedDerivedExecutionPolicy
          : derivedExecutionPolicy) ||
      !/^[a-f0-9]{64}$/.test(execution.digest ?? '') ||
      execution.digest !== runtimeInput.admission.configurationDigest ||
      execution.verificationSourceDigest !==
        runtimeInput.admission.verificationSource?.digest ||
      (runtimeAuthority &&
        execution.runtimeAuthorityDigest !== runtimeAuthority.digest))
  )
    throw new Error(
      'Source composition requires ordinary runtime or admitted derived execution'
    )
  if (Object.hasOwn(verificationInput.admission, 'executionSource'))
    throw new Error(
      'Source composition requires ordinary verification without execution wrappers'
    )
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
  return {
    repository,
    runtime,
    runtimeAuthority,
    verification,
    selected
  }
}

function readSourceEntries(selected, bytesByPath) {
  const files = []
  for (const { entry, root } of selected) {
    const input = safePath(root, entry.path)
    if (!fs.lstatSync(input).isFile())
      throw new Error('Source composition requires regular source files')
    const bytes = fs.readFileSync(input)
    if (bytes.length !== entry.size || sha256(bytes) !== entry.digest)
      throw new Error('Source composition byte fingerprint mismatch')
    bytesByPath?.set(entry.path, bytes)
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

function verifyCapturedRuntimeAuthority(
  authority,
  bytesByPath,
  fullFiles,
  fingerprintsVerified = false
) {
  if (!authority) return
  const reject = (condition, message) => {
    if (!condition) throw new Error('Runtime authority: ' + message)
  }
  let rootManifest
  try {
    rootManifest = JSON.parse(bytesByPath.get('package.json'))
  } catch {
    throw new Error('Runtime authority: invalid captured root manifest')
  }
  reject(
    Array.isArray(rootManifest.workspaces) &&
      rootManifest.workspaces.filter((entry) => entry === 'packages/*')
        .length === 1,
    'captured workspace layout mismatch'
  )
  const files = new Map(fullFiles.map((entry) => [entry.path, entry]))
  const runtimeFiles = fullFiles.filter((entry) =>
    runtimePath(entry.path, authority)
  )
  reject(
    files.size === fullFiles.length &&
      runtimeFiles.length > 0 &&
      runtimeFiles.every((entry) => {
        const bytes = bytesByPath.get(entry.path)
        return (
          Buffer.isBuffer(bytes) &&
          bytes.length === entry.size &&
          (fingerprintsVerified || sha256(bytes) === entry.digest)
        )
      }),
    'captured runtime bytes mismatch'
  )
  for (const entry of authority.packages) {
    let metadata
    try {
      metadata = JSON.parse(bytesByPath.get(entry.manifestPath))
    } catch {
      throw new Error(
        'Runtime authority: invalid captured package manifest ' + entry.name
      )
    }
    const dependencies = Object.entries(metadata.dependencies ?? {}).filter(
      ([name]) => name.startsWith('@asyra/')
    )
    reject(
      metadata.name === entry.name &&
        metadata.private !== true &&
        metadata.repository?.directory === entry.repositoryDirectory &&
        hasPublicPackageEntry(metadata) &&
        bytesByPath.has(entry.entryPath) &&
        dependencies.every(([, range]) => range === 'workspace:*') &&
        JSON.stringify(dependencies.map(([name]) => name).sort()) ===
          JSON.stringify(entry.directWorkspaceDependencies) &&
        ['optionalDependencies', 'peerDependencies'].every(
          (kind) =>
            !Object.keys(metadata[kind] ?? {}).some((name) =>
              name.startsWith('@asyra/')
            )
        ),
      'captured package manifest graph mismatch for ' + entry.name
    )
  }
  admittedRuntimeAuthorities.add(authority)
}

function admitRuntimeAuthoritySource(sourceRoot, snapshot, contract) {
  if (
    typeof sourceRoot !== 'string' ||
    !path.isAbsolute(sourceRoot) ||
    sourceRoot !== path.resolve(sourceRoot) ||
    path.basename(sourceRoot) !== 'source'
  )
    throw new Error('Runtime authority: trusted canonical source root required')
  const authority = validateRuntimeAuthority(
    snapshot.runtimeAuthority,
    contract,
    snapshot.files
  )
  const runtimeSource = validateRuntimeSourceWithAuthority(
    snapshot,
    snapshot.files,
    authority
  )
  const bytesByPath = new Map()
  for (const entry of runtimeSource.files) {
    const input = safePath(sourceRoot, entry.path)
    if (!fs.lstatSync(input).isFile())
      throw new Error('Runtime authority: expected a regular source file')
    const bytes = fs.readFileSync(input)
    if (bytes.length !== entry.size || sha256(bytes) !== entry.digest)
      throw new Error('Runtime authority: captured runtime bytes mismatch')
    bytesByPath.set(entry.path, bytes)
  }
  verifyCapturedRuntimeAuthority(authority, bytesByPath, snapshot.files, true)
  return Object.freeze({ runtimeAuthority: authority, bytesByPath })
}

function verifySourceDescriptors(
  files,
  runtime,
  verification,
  contract,
  authority
) {
  const runtimeSource = createRuntimeSource(files, authority)
  const verificationSource = createVerificationSource(
    files,
    contract,
    authority
  )
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
  const { runtime, runtimeAuthority, verification, selected } =
    selectSourceEntries(repositoryRoot, input, input, contract)
  const bytesByPath = new Map()
  const files = readSourceEntries(selected, bytesByPath)
  verifyCapturedRuntimeAuthority(runtimeAuthority, bytesByPath, files, true)
  verifySourceDescriptors(
    files,
    runtime,
    verification,
    contract,
    runtimeAuthority
  )
}

function composeSnapshot(
  repositoryRoot,
  runDirectory,
  runtimeInput,
  verificationInput,
  contract,
  deriveExecution
) {
  const { repository, runtime, runtimeAuthority, verification, selected } =
    selectSourceEntries(
      repositoryRoot,
      runtimeInput,
      verificationInput,
      contract,
      deriveExecution
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
  const bytesByPath = new Map()
  const files = readSourceEntries(selected, bytesByPath)
  verifyCapturedRuntimeAuthority(runtimeAuthority, bytesByPath, files, true)
  const { runtimeSource, verificationSource } = verifySourceDescriptors(
    files,
    runtime,
    verification,
    contract,
    runtimeAuthority
  )
  const generated = deriveExecution
    ? createDerivedExecution({
        sourceRoot,
        verificationSource: verification,
        ...(runtimeAuthority ? { runtimeAuthority } : {})
      })
    : null
  for (const [relative, bytes] of bytesByPath) {
    const output = safePath(sourceRoot, relative)
    fs.mkdirSync(path.dirname(output), { recursive: true })
    fs.writeFileSync(output, bytes, { flag: 'wx', mode: 0o444 })
  }
  const readCount = files.length
  if (generated) {
    for (const file of generated.files) {
      const output = safePath(sourceRoot, file.path)
      fs.mkdirSync(path.dirname(output), { recursive: true })
      fs.writeFileSync(output, file.content, { flag: 'wx', mode: 0o444 })
      files.push(
        Object.freeze({
          ...generated.executionSource.files.find(
            (entry) => entry.path === file.path
          )
        })
      )
    }
    files.sort((a, b) => a.path.localeCompare(b.path))
  }
  const manifest = JSON.stringify(files)
  fs.writeFileSync(manifestPath, manifest, { flag: 'wx', mode: 0o444 })
  return Object.freeze({
    kind: 'worktree-snapshot',
    runtimeSource,
    ...(runtimeAuthority ? { runtimeAuthority } : {}),
    verificationSource,
    sourceRoot,
    digest: sha256(manifest),
    contractDigest: contract.digest,
    mappingVersion: contract.mappingVersion,
    architectureVersion: contract.architectureVersion,
    configurationDigest:
      generated?.executionSource.digest ??
      verificationInput.admission.configurationDigest,
    ...(generated ? { executionSource: generated.executionSource } : {}),
    lockfileDigest: files.find((entry) => entry.path === 'yarn.lock').digest,
    manifestPath: path.relative(repository, manifestPath),
    head: runtimeInput.admission.head,
    files: Object.freeze(files),
    fileCount: files.length,
    readCount
  })
}

function composeSource(
  repositoryRoot,
  runDirectory,
  runtimeInput,
  verificationInput,
  contract
) {
  return composeSnapshot(
    repositoryRoot,
    runDirectory,
    runtimeInput,
    verificationInput,
    contract,
    false
  )
}
function composeDerivedSource(
  repositoryRoot,
  runDirectory,
  runtimeInput,
  verificationInput,
  contract
) {
  return composeSnapshot(
    repositoryRoot,
    runDirectory,
    runtimeInput,
    verificationInput,
    contract,
    true
  )
}

function captureSource(repositoryRoot, runDirectory, contract) {
  const sourceRoot = safePath(
    repositoryRoot,
    path.relative(repositoryRoot, path.join(runDirectory, 'source'))
  )
  const manifestPath = safePath(
    repositoryRoot,
    path.relative(
      repositoryRoot,
      path.join(runDirectory, 'source-manifest.json')
    )
  )
  if (fs.existsSync(sourceRoot) || fs.existsSync(manifestPath))
    throw new Error('Snapshot already exists')
  const captured = new Map()
  const read = (relative) => {
    if (captured.has(relative)) return captured.get(relative)
    const input = safePath(repositoryRoot, relative)
    if (!fs.lstatSync(input).isFile())
      throw new Error('Expected a regular source file')
    const bytes = fs.readFileSync(input)
    const entry = {
      bytes,
      path: relative,
      digest: sha256(bytes),
      size: bytes.length
    }
    captured.set(relative, entry)
    return entry
  }
  const runtimeAuthority = resolveRuntimeAuthority(contract, read)
  const directories = runtimeAuthority
    ? runtimeAuthority.packages.map((entry) => entry.repositoryDirectory)
    : sourcePackages.map((name) => 'packages/' + name)
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
  for (const directory of directories) {
    walk(directory + '/src')
    paths.add(directory + '/package.json')
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
  for (const relative of [...paths].sort()) read(relative)
  const manifest = JSON.parse(
    captured.get(contract.manifestPath).bytes.toString()
  )
  for (const name of runtimeAuthority ? [] : sourcePackages) {
    const metadata = JSON.parse(
      captured.get('packages/' + name + '/package.json').bytes.toString()
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
    captured.get(contract.architecturePath).bytes.toString(),
    sandbox,
    { timeout: 1000 }
  )
  const capturedContract = admitContract(manifest, sandbox.module.exports)
  if (
    capturedContract.digest !== contract.digest ||
    (runtimeAuthority &&
      capturedContract.runtimeScope.digest !==
        runtimeAuthority.contractScopeDigest)
  )
    throw new Error(
      'Contract changed during capture; retry with current contract'
    )
  const orderedPaths = [...paths].sort()
  const discoveredFiles = orderedPaths.map((relative) => {
    const entry = captured.get(relative)
    return { path: relative, digest: entry.digest, size: entry.size }
  })
  verifyCapturedRuntimeAuthority(
    runtimeAuthority,
    new Map(
      orderedPaths.map((relative) => [relative, captured.get(relative).bytes])
    ),
    discoveredFiles,
    true
  )
  const files = []
  fs.mkdirSync(sourceRoot, { recursive: true })
  for (const relative of orderedPaths) {
    const entry = captured.get(relative)
    const output = path.join(sourceRoot, relative)
    fs.mkdirSync(path.dirname(output), { recursive: true })
    fs.writeFileSync(output, entry.bytes, { flag: 'wx', mode: 0o444 })
    files.push({ path: relative, digest: entry.digest, size: entry.size })
  }
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  }).trim()
  fs.writeFileSync(manifestPath, JSON.stringify(files), {
    flag: 'wx',
    mode: 0o444
  })
  const runtimeSource = createRuntimeSource(files, runtimeAuthority)
  return {
    kind: 'worktree-snapshot',
    runtimeSource,
    ...(runtimeAuthority ? { runtimeAuthority } : {}),
    verificationSource: createVerificationSource(
      files,
      contract,
      runtimeAuthority
    ),
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
  admitRuntimeAuthoritySource,
  composeDerivedSource,
  verifyRetainedSnapshotBytes,
  createDerivedExecution,
  verifyRetainedSource,
  composeSource,
  captureSource,
  createRuntimeSource,
  createVerificationSource,
  resolveRuntimeAuthority,
  validateRuntimeAuthority,
  validateRuntimeSource,
  validateSourceSnapshot,
  safePath,
  sha256
}
