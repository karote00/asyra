'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const VERSION = 1
const CURRENT_REGISTRY_VERSION = 2
const ARCHIVE_SEGMENT_VERSION = 1
const MAXIMUM_REGISTRY_BYTES = 2 * 1024 * 1024
const MAXIMUM_TASKS = 256
const MAXIMUM_TASK_ENTRIES = 2048
const MAXIMUM_GUARDED_FILE_BYTES = 16 * 1024 * 1024
const STATES = new Set([
  'active',
  'paused',
  'awaiting_ci',
  'ready',
  'complete',
  'blocked',
  'retired'
])
const WRITER_STATES = new Set(['active'])
const DEPENDENCY_COMPLETE_STATES = new Set(['complete'])
const ARCHIVABLE_STATES = new Set(['complete', 'retired'])
const SHA_PATTERN = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/
const DIGEST_PATTERN = /^(?:absent|[a-f0-9]{64})$/
const TASK_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const MAIN_BRANCHES = new Set([
  'main',
  'master',
  'refs/heads/main',
  'refs/heads/master'
])
const AUTHORITY_FIELDS = [
  'id',
  'agentId',
  'coordinator',
  'kind',
  'integrationTargetTaskId',
  'worktree',
  'branch',
  'baselineHead',
  'allowedPathPrefixes',
  'allowedExactFiles',
  'protectedContractPaths',
  'allowedContractEdits',
  'approvedCommands',
  'semanticOwners',
  'dependsOn',
  'requiredGates'
]

function response(decision, code, reason, details) {
  const result = { version: VERSION, decision, code, reason }
  if (details !== undefined) result.details = details
  return result
}

function allow(code, reason, details) {
  return response('allow', code, reason, details)
}

function deny(code, reason, details) {
  return response('deny', code, reason, details)
}

function stop(code, reason, details) {
  return response('stop', code, reason, details)
}

function continuation(code, reason, details) {
  return response('continue', code, reason, details)
}

class GuardError extends Error {
  constructor(code, message, details) {
    super(message)
    this.code = code
    this.details = details
  }
}

function fail(code, message, details) {
  throw new GuardError(code, message, details)
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])])
    )
  }
  return value
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value))
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function hashToolInput(toolName, toolInput) {
  return sha256(
    stableStringify({ toolInput, toolName: String(toolName || '') })
  )
}

function sortedUniqueStrings(value, field, { allowEmpty = true } = {}) {
  if (
    !Array.isArray(value) ||
    value.length > MAXIMUM_TASK_ENTRIES ||
    (!allowEmpty && value.length === 0)
  ) {
    fail(
      'invalid_registry',
      `${field} must be ${allowEmpty ? 'an' : 'a non-empty'} array.`
    )
  }
  if (
    value.some(
      (item) =>
        typeof item !== 'string' || item.length === 0 || item.length > 100000
    )
  ) {
    fail('invalid_registry', `${field} must contain non-empty strings.`)
  }
  return [...new Set(value)].sort()
}

function normalizeRelativePath(value, field) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 4096 ||
    [...value].some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    fail('invalid_registry', `${field} contains an invalid path.`)
  }
  if (value.includes('\\') || path.posix.isAbsolute(value)) {
    fail(
      'invalid_registry',
      `${field} must contain repository-relative POSIX paths.`
    )
  }
  const withoutDot = value.replace(/^\.\//, '')
  const normalized = path.posix.normalize(withoutDot)
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized !== withoutDot
  ) {
    fail('invalid_registry', `${field} contains a non-canonical path.`)
  }
  return normalized
}

function normalizePathRules(value, field, { prefixes = false } = {}) {
  return sortedUniqueStrings(value, field).map((item) => {
    const normalized = normalizeRelativePath(item, field)
    if (prefixes && !normalized.endsWith('/')) {
      fail('invalid_registry', `${field} prefixes must end with '/'.`)
    }
    return normalized
  })
}

function normalizeDigestMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('invalid_registry', 'expectedFileDigests must be an object.')
  }
  if (Object.keys(value).length > MAXIMUM_TASK_ENTRIES) {
    fail(
      'invalid_registry',
      'expectedFileDigests exceeds the bounded entry limit.'
    )
  }
  const entries = Object.entries(value).map(([filePath, fileDigest]) => {
    const normalizedPath = normalizeRelativePath(
      filePath,
      'expectedFileDigests'
    )
    if (typeof fileDigest !== 'string' || !DIGEST_PATTERN.test(fileDigest)) {
      fail('invalid_registry', `Invalid expected digest for ${normalizedPath}.`)
    }
    return [normalizedPath, fileDigest]
  })
  return Object.fromEntries(
    entries.sort(([left], [right]) => left.localeCompare(right))
  )
}

function normalizeEvidence(value, requiredGates) {
  if (value === null || value === undefined) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('invalid_registry', 'evidence must be null or an object.')
  }
  if (
    !SHA_PATTERN.test(value.head || '') ||
    !SHA_PATTERN.test(value.tree || '')
  ) {
    fail(
      'invalid_registry',
      'Evidence head and tree must be exact Git object IDs.'
    )
  }
  if (
    !value.gates ||
    typeof value.gates !== 'object' ||
    Array.isArray(value.gates)
  ) {
    fail('invalid_registry', 'evidence.gates must be an object.')
  }
  const gates = {}
  for (const gateName of Object.keys(value.gates).sort()) {
    if (!requiredGates.includes(gateName)) {
      fail('invalid_registry', `Evidence contains undeclared gate ${gateName}.`)
    }
    const gate = value.gates[gateName]
    if (
      !gate ||
      gate.status !== 'passed' ||
      !SHA_PATTERN.test(gate.head || '') ||
      !SHA_PATTERN.test(gate.tree || '')
    ) {
      fail('invalid_registry', `Gate ${gateName} evidence is invalid.`)
    }
    gates[gateName] = { status: 'passed', head: gate.head, tree: gate.tree }
  }
  return { head: value.head, tree: value.tree, gates }
}

function normalizeReview(value) {
  if (value === null || value === undefined) return null
  if (
    !value ||
    value.status !== 'passed' ||
    !SHA_PATTERN.test(value.head || '') ||
    !SHA_PATTERN.test(value.tree || '')
  ) {
    fail(
      'invalid_registry',
      'review must be null or exact passed head/tree evidence.'
    )
  }
  return { status: 'passed', head: value.head, tree: value.tree }
}

function realDirectory(value, field) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    fail('invalid_registry', `${field} must be an absolute directory.`)
  }
  let resolved
  try {
    resolved = fs.realpathSync(value)
  } catch {
    fail('invalid_registry', `${field} does not exist.`)
  }
  if (!fs.statSync(resolved).isDirectory()) {
    fail('invalid_registry', `${field} must be a directory.`)
  }
  return resolved
}

function normalizeHistoricalWorktree(value) {
  if (
    typeof value !== 'string' ||
    !path.isAbsolute(value) ||
    path.resolve(value) !== value
  ) {
    fail('invalid_archive', 'Archived task worktree must be an absolute path.')
  }
  return value
}

function normalizeTask(task, { historical = false } = {}) {
  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    fail('invalid_registry', 'task must be an object.')
  }
  if (!TASK_ID_PATTERN.test(task.id || '')) {
    fail('invalid_registry', 'task.id is invalid.')
  }
  if (
    task.agentId !== null &&
    task.agentId !== undefined &&
    !TASK_ID_PATTERN.test(task.agentId)
  ) {
    fail('invalid_registry', 'task.agentId is invalid.')
  }
  if (typeof task.coordinator !== 'boolean') {
    fail('invalid_registry', 'task.coordinator must be a boolean.')
  }
  if (!['goal', 'subpr', 'local'].includes(task.kind)) {
    fail('invalid_registry', 'task.kind must be goal, subpr, or local.')
  }
  if (task.kind !== 'subpr' && task.integrationTargetTaskId !== null) {
    fail(
      'invalid_registry',
      'Only a subpr task may have an integration target.'
    )
  }
  if (
    task.kind === 'subpr' &&
    !TASK_ID_PATTERN.test(task.integrationTargetTaskId || '')
  ) {
    fail(
      'invalid_registry',
      'A subpr task requires an integration target task ID.'
    )
  }
  if (typeof task.branch !== 'string' || task.branch.length === 0) {
    fail('invalid_registry', 'task.branch is required.')
  }
  if (MAIN_BRANCHES.has(task.branch.toLowerCase())) {
    fail(
      'main_branch_denied',
      'Task write authority cannot target main or master.'
    )
  }
  if (!SHA_PATTERN.test(task.baselineHead || '')) {
    fail(
      'invalid_registry',
      'task.baselineHead must be an exact Git object ID.'
    )
  }
  if (!STATES.has(task.state)) {
    fail('invalid_registry', 'task.state is invalid.')
  }
  if (
    !Number.isInteger(task.continuations) ||
    task.continuations < 0 ||
    task.continuations > 1
  ) {
    fail('invalid_registry', 'task.continuations must be 0 or 1.')
  }
  const requiredGates = sortedUniqueStrings(task.requiredGates, 'requiredGates')
  return {
    id: task.id,
    agentId: task.agentId || null,
    coordinator: task.coordinator,
    kind: task.kind,
    integrationTargetTaskId: task.integrationTargetTaskId,
    worktree: historical
      ? normalizeHistoricalWorktree(task.worktree)
      : realDirectory(task.worktree, 'task.worktree'),
    branch: task.branch,
    baselineHead: task.baselineHead,
    allowedPathPrefixes: normalizePathRules(
      task.allowedPathPrefixes,
      'allowedPathPrefixes',
      { prefixes: true }
    ),
    allowedExactFiles: normalizePathRules(
      task.allowedExactFiles,
      'allowedExactFiles'
    ),
    protectedContractPaths: normalizePathRules(
      task.protectedContractPaths,
      'protectedContractPaths'
    ),
    allowedContractEdits: normalizePathRules(
      task.allowedContractEdits,
      'allowedContractEdits'
    ),
    expectedFileDigests: normalizeDigestMap(task.expectedFileDigests),
    approvedCommands: sortedUniqueStrings(
      task.approvedCommands,
      'approvedCommands'
    ),
    semanticOwners: sortedUniqueStrings(task.semanticOwners, 'semanticOwners', {
      allowEmpty: false
    }),
    dependsOn: sortedUniqueStrings(task.dependsOn, 'dependsOn'),
    state: task.state,
    requiredGates,
    evidence: normalizeEvidence(task.evidence, requiredGates),
    review: normalizeReview(task.review),
    continuations: task.continuations
  }
}

function emptyRegistry() {
  return {
    version: VERSION,
    revision: 0,
    tasks: {},
    archiveSegments: [],
    archivedTasks: {}
  }
}

function validateRegistryPath(registryPath) {
  if (typeof registryPath !== 'string' || !path.isAbsolute(registryPath)) {
    fail('invalid_registry_path', 'Registry path must be absolute.')
  }
  const absolutePath = path.resolve(registryPath)
  const repoRoot = path.dirname(path.dirname(path.dirname(absolutePath)))
  if (
    absolutePath !==
    path.join(repoRoot, 'tmp', 'agent-coordination', 'state.json')
  ) {
    fail(
      'invalid_registry_path',
      'Registry path must use the fixed repo-local location.'
    )
  }
  let realRoot
  try {
    realRoot = fs.realpathSync(repoRoot)
  } catch {
    fail('invalid_registry_path', 'Registry repo root does not exist.')
  }
  const existingParent = nearestExistingPath(path.dirname(absolutePath))
  if (!existingParent) {
    fail(
      'invalid_registry_path',
      'Registry has no existing repo-owned ancestor.'
    )
  }
  const realParent = fs.realpathSync(existingParent)
  if (
    !isWithin(realRoot, realParent) ||
    path.resolve(existingParent) !== realParent
  ) {
    fail(
      'invalid_registry_path',
      'Registry path crosses a symlink or leaves its repo root.'
    )
  }
  if (fs.existsSync(absolutePath)) {
    const stat = fs.lstatSync(absolutePath)
    if (!stat.isFile() || stat.isSymbolicLink()) {
      fail('invalid_registry_path', 'Registry state must be a regular file.')
    }
  }
  return absolutePath
}

function normalizeArchiveSegments(value, registryVersion) {
  if (registryVersion === VERSION) {
    if (value !== undefined && (!Array.isArray(value) || value.length !== 0)) {
      fail('invalid_registry', 'Legacy registries cannot declare archives.')
    }
    return []
  }
  if (!Array.isArray(value) || value.length > MAXIMUM_TASK_ENTRIES) {
    fail('invalid_registry', 'archiveSegments must be a bounded array.')
  }
  if (
    value.some(
      (segment) =>
        typeof segment !== 'string' || !/^[a-f0-9]{64}$/.test(segment)
    )
  ) {
    fail('invalid_registry', 'archiveSegments contains an invalid digest.')
  }
  return [...new Set(value)].sort()
}

function fsyncDirectory(directory) {
  const descriptor = fs.openSync(directory, 'r')
  try {
    fs.fsyncSync(descriptor)
  } finally {
    fs.closeSync(descriptor)
  }
}

function archiveDirectoryFor(registryPath, { create = false } = {}) {
  const directory = path.join(path.dirname(registryPath), 'archive')
  if (fs.existsSync(directory)) {
    const stat = fs.lstatSync(directory)
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      fail('invalid_archive', 'Archive storage must be a regular directory.')
    }
  } else if (create) {
    fs.mkdirSync(directory)
    fsyncDirectory(path.dirname(directory))
  } else {
    fail('invalid_archive', 'Archive storage is missing.')
  }
  const repoRoot = path.dirname(path.dirname(path.dirname(registryPath)))
  const realRoot = fs.realpathSync(repoRoot)
  const realDirectory = fs.realpathSync(directory)
  if (
    !isWithin(realRoot, realDirectory) ||
    path.resolve(directory) !== realDirectory
  ) {
    fail('invalid_archive', 'Archive storage leaves the repository.')
  }
  return directory
}

function archiveFileFor(registryPath, segment, options) {
  return path.join(
    archiveDirectoryFor(registryPath, options),
    segment + '.json'
  )
}

function normalizeArchiveSegment(value) {
  if (
    !value ||
    value.version !== ARCHIVE_SEGMENT_VERSION ||
    !value.task ||
    typeof value.task !== 'object'
  ) {
    fail('invalid_archive', 'Archive segment has an invalid schema.')
  }
  const task = normalizeTask(value.task, { historical: true })
  if (!ARCHIVABLE_STATES.has(task.state)) {
    fail('invalid_archive', 'Archive segment contains a nonterminal task.')
  }
  return task
}

function loadArchiveTasks(registryPath, segments) {
  const tasks = Object.create(null)
  for (const segment of segments) {
    const archivePath = archiveFileFor(registryPath, segment)
    let serialized
    try {
      const stat = fs.lstatSync(archivePath)
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        stat.size > MAXIMUM_REGISTRY_BYTES
      ) {
        fail(
          'invalid_archive',
          'Archive segment is not a bounded regular file.'
        )
      }
      serialized = fs.readFileSync(archivePath, 'utf8')
    } catch (error) {
      if (error instanceof GuardError) throw error
      fail('invalid_archive', 'Archive segment could not be read.')
    }
    if (sha256(serialized) !== segment) {
      fail('invalid_archive', 'Archive segment content hash does not match.')
    }
    let parsed
    try {
      parsed = JSON.parse(serialized)
    } catch {
      fail('invalid_archive', 'Archive segment JSON is invalid.')
    }
    const task = normalizeArchiveSegment(parsed)
    if (Object.prototype.hasOwnProperty.call(tasks, task.id)) {
      fail('invalid_archive', `Archive contains duplicate task ${task.id}.`)
    }
    tasks[task.id] = task
  }
  return tasks
}

function persistedRegistry(registry) {
  const persisted = {
    version: registry.version,
    revision: registry.revision,
    tasks: registry.tasks
  }
  if (registry.version === CURRENT_REGISTRY_VERSION) {
    persisted.archiveSegments = registry.archiveSegments
  }
  return persisted
}

function normalizeRegistry(registry, registryPath) {
  if (
    !registry ||
    ![VERSION, CURRENT_REGISTRY_VERSION].includes(registry.version) ||
    !Number.isInteger(registry.revision)
  ) {
    fail('invalid_registry', 'Registry version or revision is invalid.')
  }
  if (
    !registry.tasks ||
    typeof registry.tasks !== 'object' ||
    Array.isArray(registry.tasks)
  ) {
    fail('invalid_registry', 'Registry tasks must be an object.')
  }
  if (Object.keys(registry.tasks).length > MAXIMUM_TASKS) {
    fail('invalid_registry', 'Registry exceeds the bounded task limit.')
  }
  const tasks = Object.create(null)
  for (const taskId of Object.keys(registry.tasks).sort()) {
    const task = normalizeTask(registry.tasks[taskId])
    if (task.id !== taskId)
      fail('invalid_registry', `Task key ${taskId} does not match its ID.`)
    tasks[taskId] = task
  }
  const archiveSegments = normalizeArchiveSegments(
    registry.archiveSegments,
    registry.version
  )
  if (archiveSegments.length && !registryPath) {
    fail(
      'invalid_archive',
      'Archive-backed registry requires its storage path.'
    )
  }
  const archivedTasks = archiveSegments.length
    ? loadArchiveTasks(registryPath, archiveSegments)
    : {}
  for (const taskId of Object.keys(tasks)) {
    if (Object.prototype.hasOwnProperty.call(archivedTasks, taskId)) {
      fail('invalid_archive', `Task ${taskId} exists live and archived.`)
    }
  }
  validateTaskRelationships(tasks, archivedTasks)
  return {
    version: registry.version,
    revision: registry.revision,
    tasks,
    archiveSegments,
    archivedTasks
  }
}

function validateTaskRelationships(tasks, archivedTasks = {}) {
  const allTasks = { ...archivedTasks, ...tasks }
  for (const task of Object.values(tasks)) {
    if (
      task.kind === 'subpr' &&
      (!tasks[task.integrationTargetTaskId] ||
        tasks[task.integrationTargetTaskId].kind !== 'goal')
    ) {
      const code = archivedTasks[task.integrationTargetTaskId]
        ? 'integration_target_archived'
        : 'invalid_registry'
      fail(code, `${task.id} has no live registered goal integration target.`)
    }
    for (const dependencyId of task.dependsOn) {
      if (!allTasks[dependencyId]) {
        fail(
          'invalid_registry',
          `${task.id} depends on unknown task ${dependencyId}.`
        )
      }
    }
  }
  for (const task of Object.values(archivedTasks)) {
    if (
      task.kind === 'subpr' &&
      (!allTasks[task.integrationTargetTaskId] ||
        allTasks[task.integrationTargetTaskId].kind !== 'goal')
    ) {
      fail(
        'invalid_archive',
        `${task.id} has no historical goal integration target.`
      )
    }
    for (const dependencyId of task.dependsOn) {
      if (!allTasks[dependencyId]) {
        fail(
          'invalid_archive',
          `${task.id} depends on missing historical task ${dependencyId}.`
        )
      }
    }
  }
  const visited = new Set()
  const visiting = new Set()
  function visit(task) {
    if (visiting.has(task.id))
      fail('dependency_cycle', 'Task dependencies contain a cycle.')
    if (visited.has(task.id)) return
    visiting.add(task.id)
    for (const dependencyId of task.dependsOn) visit(allTasks[dependencyId])
    visiting.delete(task.id)
    visited.add(task.id)
  }
  for (const task of Object.values(allTasks)) visit(task)
  const active = Object.values(tasks).filter((task) =>
    WRITER_STATES.has(task.state)
  )
  for (let leftIndex = 0; leftIndex < active.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < active.length;
      rightIndex += 1
    ) {
      const left = active[leftIndex]
      const right = active[rightIndex]
      if (left.worktree === right.worktree) {
        fail(
          'active_writer_conflict',
          `${left.id} and ${right.id} share an active worktree.`
        )
      }
      if (
        left.semanticOwners.some((owner) =>
          right.semanticOwners.includes(owner)
        )
      ) {
        fail(
          'semantic_owner_conflict',
          `${left.id} and ${right.id} have overlapping active semantic owners.`
        )
      }
    }
  }
  for (const task of active) {
    const incomplete = task.dependsOn.find(
      (dependencyId) =>
        !DEPENDENCY_COMPLETE_STATES.has(allTasks[dependencyId].state)
    )
    if (incomplete) {
      fail(
        'dependency_incomplete',
        `${task.id} cannot activate before ${incomplete} completes.`
      )
    }
  }
}

function loadRegistry(registryPath) {
  validateRegistryPath(registryPath)
  if (!fs.existsSync(registryPath)) return emptyRegistry()
  if (fs.statSync(registryPath).size > MAXIMUM_REGISTRY_BYTES) {
    fail('invalid_registry', 'Registry exceeds the bounded file-size limit.')
  }
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  } catch {
    fail('invalid_registry', 'Registry JSON could not be read.')
  }
  return normalizeRegistry(parsed, registryPath)
}

function sameAuthority(left, right) {
  return AUTHORITY_FIELDS.every(
    (field) => stableStringify(left[field]) === stableStringify(right[field])
  )
}

function expectedDigestKeysUnchanged(previousTask, nextTask) {
  return (
    stableStringify(Object.keys(previousTask.expectedFileDigests).sort()) ===
    stableStringify(Object.keys(nextTask.expectedFileDigests).sort())
  )
}

function withRegistryLock(registryPath, expectedRevision, update) {
  validateRegistryPath(registryPath)
  fs.mkdirSync(path.dirname(registryPath), { recursive: true })
  const lockPath = `${registryPath}.lock`
  let lockDescriptor
  try {
    lockDescriptor = fs.openSync(lockPath, 'wx', 0o600)
  } catch (error) {
    if (error.code === 'EEXIST')
      fail('registry_locked', 'Registry update is already in progress.')
    throw error
  }
  let temporaryPath
  try {
    const registry = loadRegistry(registryPath)
    if (registry.revision !== expectedRevision) {
      fail(
        'stale_registry_revision',
        'Registry revision changed before this update.',
        {
          expectedRevision,
          actualRevision: registry.revision
        }
      )
    }
    const nextRegistry = update(registry)
    nextRegistry.revision = registry.revision + 1
    const normalized = normalizeRegistry(nextRegistry, registryPath)
    const serialized = `${stableStringify(persistedRegistry(normalized))}\n`
    if (Buffer.byteLength(serialized) > MAXIMUM_REGISTRY_BYTES) {
      fail(
        'invalid_registry',
        'Registry update exceeds the bounded file-size limit.'
      )
    }
    temporaryPath = `${registryPath}.${process.pid}.${crypto.randomBytes(8).toString('hex')}.tmp`
    const descriptor = fs.openSync(temporaryPath, 'wx', 0o600)
    try {
      fs.writeFileSync(descriptor, serialized, 'utf8')
      fs.fsyncSync(descriptor)
    } finally {
      fs.closeSync(descriptor)
    }
    fs.renameSync(temporaryPath, registryPath)
    fsyncDirectory(path.dirname(registryPath))
    temporaryPath = undefined
    return normalized
  } finally {
    if (temporaryPath) {
      try {
        fs.unlinkSync(temporaryPath)
      } catch {
        // Best-effort cleanup after a failed atomic write.
      }
    }
    if (lockDescriptor !== undefined) fs.closeSync(lockDescriptor)
    try {
      fs.unlinkSync(lockPath)
    } catch {
      // The lock may already be absent after a failed open.
    }
  }
}

function asDecision(action) {
  try {
    return action()
  } catch (error) {
    if (error instanceof GuardError)
      return deny(error.code, error.message, error.details)
    return deny('guard_error', 'Coordination guard failed closed.')
  }
}

function registerTask({ registryPath, expectedRevision, task }) {
  return asDecision(() => {
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
      fail('invalid_input', 'expectedRevision must be a non-negative integer.')
    }
    const candidate = normalizeTask(task)
    const registryRoot = path.dirname(path.dirname(path.dirname(registryPath)))
    if (
      candidate.coordinator &&
      candidate.worktree !== fs.realpathSync(registryRoot)
    ) {
      fail(
        'invalid_coordinator',
        'Coordinator authority is limited to the registry repo root.'
      )
    }
    const registry = withRegistryLock(
      registryPath,
      expectedRevision,
      (current) => {
        const previous = current.tasks[candidate.id]
        if (
          Object.prototype.hasOwnProperty.call(
            current.archivedTasks,
            candidate.id
          )
        ) {
          fail('task_archived', 'Archived task identities cannot be reused.')
        }
        if (previous && !sameAuthority(previous, candidate)) {
          fail(
            'task_authority_immutable',
            'Task authority is immutable; retire it and register a new task instead.'
          )
        }
        if (previous && !expectedDigestKeysUnchanged(previous, candidate)) {
          fail(
            'task_authority_immutable',
            'Expected file membership is immutable; predeclare absent files at registration.'
          )
        }
        return {
          ...current,
          tasks: { ...current.tasks, [candidate.id]: candidate }
        }
      }
    )
    return allow('registered', 'Task registry update committed atomically.', {
      registryRevision: registry.revision
    })
  })
}

function writeArchiveTask(registryPath, task) {
  const serialized = `${stableStringify({
    version: ARCHIVE_SEGMENT_VERSION,
    task
  })}\n`
  if (Buffer.byteLength(serialized) > MAXIMUM_REGISTRY_BYTES) {
    fail('invalid_archive', 'Archive task exceeds the bounded segment size.')
  }
  const segment = sha256(serialized)
  const archivePath = archiveFileFor(registryPath, segment, { create: true })
  if (fs.existsSync(archivePath)) {
    const stat = fs.lstatSync(archivePath)
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      fs.readFileSync(archivePath, 'utf8') !== serialized
    ) {
      fail('invalid_archive', 'Existing archive segment is not identical.')
    }
    return segment
  }
  const temporaryPath = `${archivePath}.${process.pid}.${crypto
    .randomBytes(8)
    .toString('hex')}.tmp`
  let descriptor
  try {
    descriptor = fs.openSync(temporaryPath, 'wx', 0o600)
    fs.writeFileSync(descriptor, serialized, 'utf8')
    fs.fsyncSync(descriptor)
    fs.closeSync(descriptor)
    descriptor = undefined
    try {
      fs.linkSync(temporaryPath, archivePath)
    } catch (error) {
      if (
        error.code !== 'EEXIST' ||
        !fs.lstatSync(archivePath).isFile() ||
        fs.lstatSync(archivePath).isSymbolicLink() ||
        fs.readFileSync(archivePath, 'utf8') !== serialized
      ) {
        throw error
      }
    }
    fsyncDirectory(path.dirname(archivePath))
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor)
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath)
  }
  return segment
}

function retainedTaskIds(tasks) {
  const retained = new Set(
    Object.values(tasks)
      .filter((task) => !ARCHIVABLE_STATES.has(task.state))
      .map((task) => task.id)
  )
  const pending = [...retained]
  while (pending.length) {
    const task = tasks[pending.pop()]
    const references = [
      ...task.dependsOn,
      ...(task.integrationTargetTaskId ? [task.integrationTargetTaskId] : [])
    ]
    for (const reference of references) {
      if (tasks[reference] && !retained.has(reference)) {
        retained.add(reference)
        pending.push(reference)
      }
    }
  }
  return retained
}

function compactRegistry(
  { registryPath, expectedRevision, coordinatorTaskId },
  hooks = {}
) {
  return asDecision(() => {
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
      fail('invalid_input', 'expectedRevision must be a non-negative integer.')
    }
    let archivedCount = 0
    let segmentsWritten = 0
    const registry = withRegistryLock(
      registryPath,
      expectedRevision,
      (current) => {
        const coordinator = taskFor(current, coordinatorTaskId)
        const registryRoot = path.dirname(
          path.dirname(path.dirname(registryPath))
        )
        if (
          !coordinator.coordinator ||
          coordinator.state !== 'active' ||
          coordinator.worktree !== fs.realpathSync(registryRoot)
        ) {
          fail(
            'invalid_coordinator',
            'Only an active repository-root coordinator may compact history.'
          )
        }
        const retained = retainedTaskIds(current.tasks)
        const tasks = {}
        const newSegments = []
        for (const task of Object.values(current.tasks)) {
          if (retained.has(task.id)) {
            tasks[task.id] = task
            continue
          }
          const segment = writeArchiveTask(registryPath, task)
          newSegments.push(segment)
          archivedCount += 1
        }
        segmentsWritten = new Set(newSegments).size
        if (hooks.afterArchiveWrite) hooks.afterArchiveWrite()
        return {
          version: CURRENT_REGISTRY_VERSION,
          revision: current.revision,
          tasks,
          archiveSegments: [...current.archiveSegments, ...newSegments]
        }
      }
    )
    return allow('compacted', 'Terminal task history archived atomically.', {
      registryRevision: registry.revision,
      archivedTasks: archivedCount,
      archiveSegmentsWritten: segmentsWritten,
      liveTasks: Object.keys(registry.tasks).length
    })
  })
}

function readArchivedTask({ registryPath, taskId }) {
  return asDecision(() => {
    if (typeof taskId !== 'string' || !TASK_ID_PATTERN.test(taskId)) {
      fail('invalid_input', 'Archived task ID is invalid.')
    }
    const registry = loadRegistry(registryPath)
    if (!Object.prototype.hasOwnProperty.call(registry.archivedTasks, taskId)) {
      fail('missing_archived_task', 'Archived task was not found.')
    }
    const task = registry.archivedTasks[taskId]
    return allow('archived_task', 'Archived task snapshot is intact.', { task })
  })
}

function taskFor(registry, taskId) {
  if (typeof taskId !== 'string' || !registry.tasks[taskId]) {
    fail(
      'missing_task',
      'An exact registered task ID is required for this operation.'
    )
  }
  return registry.tasks[taskId]
}

function pathMatchesRule(relativePath, rule) {
  return rule.endsWith('/')
    ? relativePath.startsWith(rule)
    : relativePath === rule
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}

function nearestExistingPath(candidate) {
  let current = candidate
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
  return current
}

function resolveTaskPath(task, cwd, requestedPath) {
  if (
    typeof requestedPath !== 'string' ||
    requestedPath.length === 0 ||
    requestedPath.includes('\0')
  ) {
    fail('invalid_path', 'Tool path is missing or invalid.')
  }
  const taskRoot = fs.realpathSync(task.worktree)
  const eventCwd = realDirectory(cwd || taskRoot, 'event.cwd')
  if (eventCwd !== taskRoot)
    fail('worktree_mismatch', 'Write cwd does not match task worktree.')
  const absolute = path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(eventCwd, requestedPath)
  const lexicalRelative = path.relative(taskRoot, absolute)
  if (
    lexicalRelative === '' ||
    lexicalRelative.startsWith('..') ||
    path.isAbsolute(lexicalRelative)
  ) {
    fail('path_traversal', 'Path leaves the registered worktree.')
  }
  const existing = nearestExistingPath(absolute)
  if (!existing)
    fail('path_escapes_worktree', 'Path has no worktree-owned ancestor.')
  const realAncestor = fs.realpathSync(existing)
  if (!isWithin(taskRoot, realAncestor)) {
    fail(
      'path_escapes_worktree',
      'Path crosses a symlink outside the registered worktree.'
    )
  }
  const relativePath = lexicalRelative.split(path.sep).join('/')
  return { absolute, relativePath }
}

function currentDigest(absolutePath) {
  if (!fs.existsSync(absolutePath)) return 'absent'
  const stat = fs.lstatSync(absolutePath)
  if (!stat.isFile())
    fail('unsupported_path_type', 'Only regular files may be guarded writes.')
  if (stat.size > MAXIMUM_GUARDED_FILE_BYTES) {
    fail('file_too_large', 'Guarded file exceeds the bounded digest size.')
  }
  return sha256(fs.readFileSync(absolutePath))
}

function isTestPath(relativePath) {
  return (
    /(?:^|\/)__tests__\//.test(relativePath) ||
    /(?:^|\/)[^/]+\.(?:test|spec)\.[^/]+$/.test(relativePath)
  )
}

function authorizePath(task, cwd, requestedPath, operation) {
  const resolved = resolveTaskPath(task, cwd, requestedPath)
  const { relativePath, absolute } = resolved
  const allowed =
    task.allowedExactFiles.includes(relativePath) ||
    task.allowedPathPrefixes.some((prefix) => relativePath.startsWith(prefix))
  if (!allowed)
    fail(
      'path_out_of_scope',
      `${relativePath} is outside the task write scope.`
    )
  const explicitlyAuthorized = task.allowedContractEdits.some((rule) =>
    pathMatchesRule(relativePath, rule)
  )
  const actualDigest = currentDigest(absolute)
  const isNewFile = actualDigest === 'absent' && operation === 'add'
  if (isTestPath(relativePath) && !isNewFile && !explicitlyAuthorized) {
    fail(
      'existing_test_requires_explicit_authority',
      `${relativePath} is an existing test without explicit edit authority.`
    )
  }
  const protectedPath = task.protectedContractPaths.some((rule) =>
    pathMatchesRule(relativePath, rule)
  )
  if (
    protectedPath &&
    !(isNewFile && isTestPath(relativePath)) &&
    !explicitlyAuthorized
  ) {
    fail(
      'protected_contract_requires_explicit_authority',
      `${relativePath} is a protected contract without explicit edit authority.`
    )
  }
  const expectedDigest = task.expectedFileDigests[relativePath]
  if (!expectedDigest) {
    fail(
      'missing_file_snapshot',
      `${relativePath} has no registered expected digest.`
    )
  }
  if (actualDigest !== expectedDigest) {
    fail(
      'unexpected_file_digest',
      `${relativePath} changed outside the registered task snapshot.`,
      {
        path: relativePath,
        expectedDigest,
        actualDigest
      }
    )
  }
  return { path: relativePath, expectedDigest }
}

function parsePatchPaths(patchText) {
  if (typeof patchText !== 'string')
    fail('ambiguous_write', 'Patch input must be text.')
  const changes = []
  for (const line of patchText.split(/\r?\n/)) {
    const header = /^\*\*\* (Add|Update|Delete) File: (.+)$/.exec(line)
    if (header) {
      changes.push({ operation: header[1].toLowerCase(), path: header[2] })
      continue
    }
    const move = /^\*\*\* Move to: (.+)$/.exec(line)
    if (move) changes.push({ operation: 'add', path: move[1] })
  }
  if (changes.length === 0)
    fail('ambiguous_write', 'Patch does not expose exact affected paths.')
  return changes
}

function toolNameKey(toolName) {
  return String(toolName || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function extractWritePaths(toolName, toolInput) {
  const key = toolNameKey(toolName)
  if (key.includes('applypatch')) return parsePatchPaths(toolInput)
  if (
    key === 'write' ||
    key === 'edit' ||
    key === 'multiedit' ||
    key === 'notebookedit'
  ) {
    const candidate =
      toolInput &&
      (toolInput.path || toolInput.file_path || toolInput.notebook_path)
    return [
      {
        operation: fs.existsSync(String(candidate || '')) ? 'update' : 'add',
        path: candidate
      }
    ]
  }
  if (key === 'delete') {
    return [
      {
        operation: 'delete',
        path: toolInput && (toolInput.path || toolInput.file_path)
      }
    ]
  }
  if (key === 'move') {
    return [
      {
        operation: 'delete',
        path: toolInput && (toolInput.source || toolInput.from)
      },
      {
        operation: 'add',
        path: toolInput && (toolInput.destination || toolInput.to)
      }
    ]
  }
  return null
}

function commandFromInput(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return null
  return toolInput.command || toolInput.cmd || null
}

function destructiveCommandReason(command) {
  if (
    typeof command !== 'string' ||
    command.length === 0 ||
    command.length > 100000
  ) {
    return 'Shell command is missing or exceeds the bounded input size.'
  }
  const patterns = [
    [/\bgit\b[^\n;&|]*\breset\b[^\n;&|]*--hard\b/i, 'git reset --hard'],
    [/\bgit\b[^\n;&|]*\bclean\b/i, 'git clean'],
    [/\bgit\b[^\n;&|]*\bcheckout\b[^\n;&|]*\s--(?:\s|$)/i, 'git checkout --'],
    [/\bgit\b[^\n;&|]*\brestore\b/i, 'git restore'],
    [/\bgit\b[^\n;&|]*\bstash\s+(?:drop|clear)\b/i, 'git stash drop/clear'],
    [
      /\bgit\b[^\n;&|]*\bcommit\b[^\n;&|]*(?:--amend\b|--reuse-message\b|--reedit-message\b|(?:^|\s)-[cC](?:\s|$))/i,
      'commit history rewrite'
    ],
    [
      /\bgit\b[^\n;&|]*\bpush\b[^\n;&|]*(?:--force(?:-with-lease)?\b|(?:^|\s)-f(?:\s|$))/i,
      'forced git push'
    ],
    [
      /\bgit\b[^\n;&|]*\bpush\b[^\n;&|]*(?:--delete\b|(?:^|\s)\+\S+|(?:^|\s):(?:refs\/heads\/)?\S+)/i,
      'forced or deleting git push'
    ],
    [
      /\bgit\b[^\n;&|]*\bbranch\b[^\n;&|]*(?:^|\s)(?:-[dD]|--delete)(?:\s|$)/i,
      'branch deletion'
    ],
    [/\bgit\b[^\n;&|]*\bworktree\s+(?:remove|prune)\b/i, 'worktree deletion'],
    [
      /(?:^|[;&|]\s*|\s)(?:rm|rmdir|unlink|shred|truncate)(?:\s|$)/i,
      'filesystem deletion'
    ],
    [/\bfind\b[^\n;&|]*(?:-exec(?:dir)?\b|-delete\b)/i, 'mutating find'],
    [/\bsed\b[^\n;&|]*(?:\s-i(?:\s|$)|\s--in-place\b)/i, 'in-place sed'],
    [/\brg\b[^\n;&|]*\s--pre(?:=|\s)/i, 'rg preprocessor execution']
  ]
  for (const [pattern, reason] of patterns) {
    if (pattern.test(command)) return reason
  }
  return null
}

function targetsMain(command) {
  return (
    /\bgit\b[^\n;&|]*\bmerge\b[^\n;&|]*(?:^|\s)(?:main|master)(?:\s|$)/i.test(
      command
    ) ||
    /\bgit\b[^\n;&|]*\bpush\b[^\n;&|]*(?::|\s)(?:main|master)(?:\s|$)/i.test(
      command
    ) ||
    /\bgh\s+pr\s+merge\b[^\n;&|]*(?:--base\s+(?:main|master)\b)/i.test(command)
  )
}

function isDirectIntegrationCommand(command) {
  return (
    /\bgh\s+pr\s+merge\b/i.test(command) ||
    /\bgit\b[^\n;&|]*\bmerge\b/i.test(command)
  )
}

function isDirectCommitCommand(command) {
  return /\bgit\b[^\n;&|]*\bcommit\b/i.test(command)
}

function hasUnsafeShellControl(command) {
  let quote = null
  for (let index = 0; index < command.length; index += 1) {
    const character = command[index]
    if (character === '\\' && quote !== "'") {
      index += 1
      continue
    }
    if (quote) {
      if (character === quote) quote = null
      if (quote !== "'" && (character === '`' || character === '$')) return true
      continue
    }
    if (character === "'" || character === '"') {
      quote = character
      continue
    }
    if (
      character === '`' ||
      character === '$' ||
      character === '<' ||
      character === '>'
    ) {
      return true
    }
    if (character === '(' || character === ')') return true
    if (character === '&') {
      if (command[index + 1] === '&') {
        index += 1
        continue
      }
      return true
    }
  }
  return quote !== null
}

function splitShellSegments(command) {
  if (hasUnsafeShellControl(command)) return null
  const segments = []
  let current = ''
  let quote = null
  for (let index = 0; index < command.length; index += 1) {
    const character = command[index]
    if (character === '\\' && quote !== "'") {
      current += character
      if (index + 1 < command.length) {
        index += 1
        current += command[index]
      }
      continue
    }
    if (quote) {
      current += character
      if (character === quote) quote = null
      continue
    }
    if (character === "'" || character === '"') {
      quote = character
      current += character
      continue
    }
    if (character === ';' || character === '\n' || character === '|') {
      if (current.trim()) segments.push(current.trim())
      current = ''
      if (character === '|' && command[index + 1] === '|') index += 1
      continue
    }
    if (character === '&' && command[index + 1] === '&') {
      if (current.trim()) segments.push(current.trim())
      current = ''
      index += 1
      continue
    }
    current += character
  }
  if (current.trim()) segments.push(current.trim())
  return segments
}

function normalizeSafeShellToken(token) {
  if (!/[\\'"]/.test(token)) return token
  if (token.length < 2) return null
  const first = token[0]
  const last = token[token.length - 1]
  if ((first !== "'" && first !== '"') || first !== last) return null
  const interior = token.slice(1, -1)
  if (/[\\'"]/.test(interior)) return null
  return interior
}

function isSupportedCommitCommand(command) {
  const segments = splitShellSegments(command)
  if (!segments || segments.length !== 1) return false
  const tokens = segments[0].match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []
  if (path.basename(tokens[0] || '') !== 'git' || tokens[1] !== 'commit') {
    return false
  }
  for (let index = 2; index < tokens.length; index += 1) {
    const argument = tokens[index]
    if (argument === '-q' || argument === '--quiet') continue
    if (argument.startsWith('--message=') && argument.length > 10) continue
    if (argument === '-m' || argument === '--message') {
      index += 1
      if (!tokens[index]) return false
      continue
    }
    return false
  }
  return true
}

function isCheapReadCommand(command) {
  const segments = splitShellSegments(command)
  if (!segments || segments.length === 0) return false
  const plainReads = new Set([
    'pwd',
    'ls',
    'cat',
    'head',
    'tail',
    'wc',
    'stat',
    'true',
    'false'
  ])
  return segments.every((segment) => {
    const rawTokens = segment.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []
    const tokens = rawTokens.map(normalizeSafeShellToken)
    if (tokens.some((token) => token === null)) return false
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0] || '')) return false
    const executable = path.basename(tokens[0] || '')
    if (plainReads.has(executable)) return true
    if (executable === 'rg') {
      return !tokens
        .slice(1)
        .some((token) => token === '--pre' || token.startsWith('--pre='))
    }
    if (executable === 'find') {
      return !tokens.some((token) =>
        /^(?:-delete|-exec|-execdir|-ok|-okdir|-fprint|-fprint0|-fprintf|-fls)$/.test(
          token
        )
      )
    }
    if (executable === 'sed') {
      if (tokens[1] !== '-n' || tokens.length < 4) return false
      const program = tokens[2]
      if (!/^(?:\d+|\$)(?:,(?:\d+|\$))?p$/.test(program)) return false
      const operands = tokens.slice(3)
      const separatorIndex = operands.indexOf('--')
      if (
        separatorIndex > 0 ||
        operands.filter((token) => token === '--').length > 1
      ) {
        return false
      }
      const fileOperands = separatorIndex === 0 ? operands.slice(1) : operands
      return (
        fileOperands.length > 0 &&
        fileOperands.every((operand) =>
          separatorIndex === 0 ? operand.length > 0 : !operand.startsWith('-')
        )
      )
    }
    if (executable === 'git') {
      let index = 1
      while (tokens[index] === '-C' && tokens[index + 1]) index += 2
      if (tokens[index] === '--no-pager') index += 1
      const subcommand = tokens[index]
      const arguments_ = tokens.slice(index + 1)
      if (
        ['status', 'rev-parse', 'ls-files', 'merge-base'].includes(subcommand)
      ) {
        return true
      }
      if (['diff', 'show', 'log'].includes(subcommand)) {
        return !arguments_.some(
          (argument) =>
            argument === '--ext-diff' ||
            argument === '--textconv' ||
            argument === '--output' ||
            argument.startsWith('--output=')
        )
      }
      if (subcommand === 'branch') {
        if (arguments_.length === 0) return true
        if (arguments_.length === 1 && arguments_[0] === '--show-current')
          return true
        if (arguments_[0] === '--list') {
          return arguments_
            .slice(1)
            .every((argument) => !argument.startsWith('-'))
        }
        if (['--contains', '--no-contains'].includes(arguments_[0])) {
          return arguments_.length === 2 && !arguments_[1].startsWith('-')
        }
      }
    }
    return false
  })
}

function coordinatorRegisterRequest(command, registryPath, task) {
  const match =
    /^node scripts\/agent-coordination\/guard\.cjs register < (tmp\/agent-coordination\/requests\/[A-Za-z0-9._-]+\.json)$/.exec(
      command
    )
  if (!match || !task.coordinator) return false
  const repoRoot = path.dirname(path.dirname(path.dirname(registryPath)))
  if (task.worktree !== fs.realpathSync(repoRoot)) return false
  const requestRoot = path.join(
    repoRoot,
    'tmp',
    'agent-coordination',
    'requests'
  )
  const requestPath = path.resolve(repoRoot, match[1])
  if (!isWithin(requestRoot, requestPath) || !fs.existsSync(requestPath))
    return false
  const stat = fs.lstatSync(requestPath)
  if (!stat.isFile() || stat.isSymbolicLink()) return false
  return fs.realpathSync(requestPath) === requestPath
}

function authorizeCoordinatorRoute(registry, registryPath, event, command) {
  if (!event || !event.taskId) return null
  const task = taskFor(registry, event.taskId)
  if (!coordinatorRegisterRequest(command, registryPath, task)) return null
  if (!['active', 'paused', 'blocked'].includes(task.state)) {
    fail(
      'coordinator_not_available',
      `Coordinator state ${task.state} cannot administer the registry.`
    )
  }
  const effectiveCwd =
    (event.toolInput && (event.toolInput.workdir || event.toolInput.cwd)) ||
    event.cwd
  if (realDirectory(effectiveCwd, 'event.cwd') !== task.worktree) {
    fail('worktree_mismatch', 'Coordinator cwd does not match the repo root.')
  }
  currentGitState(task, task.worktree)
  return task
}

function isCoordinatorAdministrativePatch(
  task,
  registryPath,
  event,
  writePaths
) {
  if (
    !task.coordinator ||
    !['paused', 'blocked'].includes(task.state) ||
    !toolNameKey(event.toolName).includes('applypatch') ||
    !Array.isArray(writePaths) ||
    writePaths.length === 0
  ) {
    return false
  }
  const repoRoot = path.dirname(path.dirname(path.dirname(registryPath)))
  if (task.worktree !== fs.realpathSync(repoRoot)) return false
  return writePaths.every((change) => {
    if (!['add', 'update'].includes(change.operation)) return false
    const resolved = resolveTaskPath(
      task,
      event.cwd || task.worktree,
      change.path
    )
    return /^tmp\/agent-coordination\/requests\/[A-Za-z0-9._-]+\.json$/.test(
      resolved.relativePath
    )
  })
}

function requireWritableTask(
  registry,
  event,
  { registryPath, writePaths } = {}
) {
  const task = taskFor(registry, event.taskId)
  if (
    task.state !== 'active' &&
    !isCoordinatorAdministrativePatch(task, registryPath, event, writePaths)
  ) {
    fail(
      'task_not_active',
      `Task ${task.id} is ${task.state} and cannot write.`
    )
  }
  const effectiveCwd =
    (event.toolInput && (event.toolInput.workdir || event.toolInput.cwd)) ||
    event.cwd
  if (
    realDirectory(effectiveCwd || task.worktree, 'event.cwd') !== task.worktree
  ) {
    fail(
      'worktree_mismatch',
      'Write cwd does not match the registered task worktree.'
    )
  }
  currentGitState(task, task.worktree)
  return { task, cwd: effectiveCwd || task.worktree }
}

function evaluatePreTool({ registryPath, event }) {
  return asDecision(() => {
    const registry = loadRegistry(registryPath)
    const toolName = event && event.toolName
    const toolInput = event && event.toolInput
    const command = commandFromInput(toolInput)
    if (command !== null) {
      const destructive = destructiveCommandReason(command)
      if (destructive)
        fail(
          'destructive_command',
          `Denied destructive command: ${destructive}.`
        )
      if (targetsMain(command))
        fail(
          'main_integration_denied',
          'Integration or push to main/master is denied.'
        )
      if (isDirectIntegrationCommand(command)) {
        fail(
          'integration_required',
          'Direct merge commands must use the reviewed integration wrapper.'
        )
      }
      if (isDirectCommitCommand(command)) {
        if (!isSupportedCommitCommand(command)) {
          fail(
            'commit_command_unsupported',
            'Commit commands may only use an optional exact message and quiet flag.'
          )
        }
        return evaluatePreCommit({
          registryPath,
          event: {
            taskId: event.taskId,
            cwd:
              (event.toolInput &&
                (event.toolInput.workdir || event.toolInput.cwd)) ||
              event.cwd
          }
        })
      }
      const coordinator = authorizeCoordinatorRoute(
        registry,
        registryPath,
        event,
        command
      )
      if (coordinator) {
        return allow(
          'coordinator_register_route',
          'Registered main-worktree coordinator may submit this fixed request file.',
          {
            taskId: coordinator.id,
            registryRevision: registry.revision,
            inputHash: hashToolInput(toolName, toolInput),
            approvedPaths: []
          }
        )
      }
      if (hasUnsafeShellControl(command)) {
        fail(
          'ambiguous_shell_control',
          'Unparsed shell control syntax requires a dedicated reviewed route.'
        )
      }
      if (isCheapReadCommand(command)) {
        return allow('read_only', 'Recognized bounded read-only command.')
      }
      const { task } = requireWritableTask(registry, event)
      if (!task.approvedCommands.includes(command)) {
        fail(
          'opaque_command_requires_approval',
          'Opaque shell or interpreter execution requires an exact registered command.'
        )
      }
      return allow('approved_command', 'Exact registered command approved.', {
        taskId: task.id,
        registryRevision: registry.revision,
        inputHash: hashToolInput(toolName, toolInput),
        approvedPaths: []
      })
    }
    const writePaths = extractWritePaths(toolName, toolInput)
    if (writePaths) {
      const { task, cwd } = requireWritableTask(registry, event, {
        registryPath,
        writePaths
      })
      const approvedPaths = writePaths.map((change) =>
        authorizePath(task, cwd, change.path, change.operation)
      )
      return allow(
        'write_approved',
        'All affected paths match the task authority and snapshot.',
        {
          taskId: task.id,
          registryRevision: registry.revision,
          inputHash: hashToolInput(toolName, toolInput),
          approvedPaths
        }
      )
    }
    if (!event || !event.taskId)
      fail('missing_task', 'Unknown tools require an exact registered task.')
    fail(
      'ambiguous_tool',
      'Unrecognized tool cannot be classified as read-only.'
    )
  })
}

function checkTask({ registryPath, event }) {
  return asDecision(() => {
    const registry = loadRegistry(registryPath)
    const task = taskFor(registry, event && event.taskId)
    if (!event.toolName) {
      return allow(
        'task_registered',
        'Task is present in the valid registry.',
        {
          registryRevision: registry.revision,
          taskId: task.id,
          state: task.state
        }
      )
    }
    const writePaths = extractWritePaths(event.toolName, event.toolInput)
    if (!writePaths)
      fail(
        'ambiguous_tool',
        'Post-tool check requires an exact supported write.'
      )
    if (event.operationSucceeded !== true) {
      return allow(
        'operation_not_successful',
        'No digest update was issued for an unsuccessful operation.',
        {
          registryRevision: registry.revision,
          digestUpdates: []
        }
      )
    }
    const preflight = event.preflight
    if (!preflight || typeof preflight !== 'object') {
      fail(
        'missing_preflight',
        'Successful writes require the matching pre-tool receipt.'
      )
    }
    if (
      preflight.taskId !== task.id ||
      preflight.registryRevision !== registry.revision ||
      preflight.inputHash !== hashToolInput(event.toolName, event.toolInput)
    ) {
      fail(
        'preflight_mismatch',
        'Post-tool input does not match the pre-tool receipt.'
      )
    }
    currentGitState(task, event.cwd || task.worktree)
    const approvedPaths = writePaths.map((change) => {
      const resolved = resolveTaskPath(
        task,
        event.cwd || task.worktree,
        change.path
      )
      return {
        path: resolved.relativePath,
        digest: currentDigest(resolved.absolute)
      }
    })
    const receiptPaths = Array.isArray(preflight.approvedPaths)
      ? preflight.approvedPaths
      : []
    for (const update of approvedPaths) {
      const receipt = receiptPaths.find(
        (item) => item && item.path === update.path
      )
      if (
        !receipt ||
        receipt.expectedDigest !== task.expectedFileDigests[update.path]
      ) {
        fail(
          'preflight_mismatch',
          `${update.path} lacks its registered preimage receipt.`
        )
      }
    }
    if (receiptPaths.length !== approvedPaths.length) {
      fail(
        'preflight_mismatch',
        'Pre-tool and post-tool affected path sets differ.'
      )
    }
    return allow(
      'digest_updates',
      'Successful write produced bounded digest updates.',
      {
        registryRevision: registry.revision,
        digestUpdates: approvedPaths
      }
    )
  })
}

function git(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 1024 * 1024
  })
  if (result.status !== 0)
    fail('git_state_unavailable', 'Required Git state is unavailable.')
  return result.stdout.trim()
}

function assertExactEvidence(task, head, tree) {
  if (
    !task.evidence ||
    task.evidence.head !== head ||
    task.evidence.tree !== tree
  ) {
    fail(
      'evidence_mismatch',
      'Task evidence does not match the exact head and tree.'
    )
  }
  for (const gateName of task.requiredGates) {
    const gate = task.evidence.gates[gateName]
    if (
      !gate ||
      gate.status !== 'passed' ||
      gate.head !== head ||
      gate.tree !== tree
    ) {
      fail('gate_evidence_mismatch', `Gate ${gateName} is missing or stale.`)
    }
  }
  if (!task.review || task.review.head !== head || task.review.tree !== tree) {
    fail('review_evidence_mismatch', 'Independent review is missing or stale.')
  }
}

function currentGitState(task, cwd, { staged = false } = {}) {
  const realCwd = realDirectory(cwd, 'event.cwd')
  if (realCwd !== task.worktree)
    fail('worktree_mismatch', 'Git cwd does not match task worktree.')
  const branch = git(realCwd, ['branch', '--show-current'])
  const head = git(realCwd, ['rev-parse', 'HEAD'])
  if (branch !== task.branch)
    fail('branch_mismatch', 'Current branch does not match the task branch.')
  const ancestor = spawnSync(
    'git',
    ['merge-base', '--is-ancestor', task.baselineHead, head],
    {
      cwd: realCwd,
      timeout: 5000,
      stdio: 'ignore'
    }
  )
  if (ancestor.status !== 0)
    fail(
      'baseline_mismatch',
      'Task baseline is not an ancestor of current HEAD.'
    )
  if (!staged)
    return { branch, head, tree: git(realCwd, ['rev-parse', 'HEAD^{tree}']) }
  const stagedOutput = git(realCwd, [
    'diff',
    '--cached',
    '--name-only',
    '--diff-filter=ACMRD',
    '-z'
  ])
  const stagedPaths = stagedOutput
    ? stagedOutput.split('\0').filter(Boolean)
    : []
  if (stagedPaths.length === 0)
    fail('empty_staged_diff', 'No staged paths are available to commit.')
  return { branch, head, tree: git(realCwd, ['write-tree']), stagedPaths }
}

function authorizeStagedPath(task, relativePath) {
  const normalized = normalizeRelativePath(relativePath, 'stagedPaths')
  const allowed =
    task.allowedExactFiles.includes(normalized) ||
    task.allowedPathPrefixes.some((prefix) => normalized.startsWith(prefix))
  if (!allowed)
    fail('path_out_of_scope', `${normalized} is outside the task write scope.`)
  const explicitlyAuthorized = task.allowedContractEdits.some((rule) =>
    pathMatchesRule(normalized, rule)
  )
  if (isTestPath(normalized) && !explicitlyAuthorized) {
    const baselineEntry = spawnSync(
      'git',
      ['cat-file', '-e', `${task.baselineHead}:${normalized}`],
      {
        cwd: task.worktree,
        timeout: 5000,
        stdio: 'ignore'
      }
    )
    if (baselineEntry.status === 0) {
      fail(
        'existing_test_requires_explicit_authority',
        `${normalized} is an existing test.`
      )
    }
  }
  if (
    task.protectedContractPaths.some((rule) =>
      pathMatchesRule(normalized, rule)
    ) &&
    !explicitlyAuthorized
  ) {
    fail(
      'protected_contract_requires_explicit_authority',
      `${normalized} is a protected contract.`
    )
  }
  const expectedDigest = task.expectedFileDigests[normalized]
  if (!expectedDigest) {
    fail(
      'missing_file_snapshot',
      `${normalized} has no registered expected digest.`
    )
  }
  const stagedEntry = spawnSync('git', ['show', `:${normalized}`], {
    cwd: task.worktree,
    encoding: null,
    timeout: 5000,
    maxBuffer: 16 * 1024 * 1024
  })
  if (stagedEntry.error) {
    fail(
      'git_state_unavailable',
      `Staged content for ${normalized} exceeded the bounded read.`
    )
  }
  const stagedDigest =
    stagedEntry.status === 0 ? sha256(stagedEntry.stdout) : 'absent'
  if (stagedDigest !== expectedDigest) {
    fail(
      'unexpected_file_digest',
      `${normalized} staged content is not the registered snapshot.`
    )
  }
}

function evaluatePreCommit({ registryPath, event }) {
  return asDecision(() => {
    const registry = loadRegistry(registryPath)
    const task = taskFor(registry, event && event.taskId)
    if (!['active', 'ready'].includes(task.state)) {
      fail('task_not_committable', `Task ${task.id} is ${task.state}.`)
    }
    const state = currentGitState(task, event.cwd, { staged: true })
    for (const stagedPath of state.stagedPaths)
      authorizeStagedPath(task, stagedPath)
    assertExactEvidence(task, state.head, state.tree)
    return allow(
      'commit_approved',
      'Staged paths and exact evidence are ready to commit.',
      {
        taskId: task.id,
        registryRevision: registry.revision,
        branch: state.branch,
        head: state.head,
        tree: state.tree,
        stagedPaths: state.stagedPaths
      }
    )
  })
}

function isMainBranch(branch) {
  return MAIN_BRANCHES.has(String(branch || '').toLowerCase())
}

function dependenciesComplete(task, tasks) {
  return task.dependsOn.every((dependencyId) =>
    DEPENDENCY_COMPLETE_STATES.has(tasks[dependencyId].state)
  )
}

function evaluateIntegration({ registryPath, event }) {
  return asDecision(() => {
    if (
      isMainBranch(event && event.sourcePr && event.sourcePr.baseBranch) ||
      isMainBranch(event && event.goal && event.goal.branch)
    ) {
      fail(
        'main_integration_denied',
        'Goal integration into main/master is always denied.'
      )
    }
    const registry = loadRegistry(registryPath)
    const source = taskFor(registry, event && event.sourceTaskId)
    const goal = taskFor(registry, event && event.goalTaskId)
    if (
      source.kind !== 'subpr' ||
      goal.kind !== 'goal' ||
      source.integrationTargetTaskId !== goal.id
    ) {
      fail(
        'integration_target_mismatch',
        'Source task is not linked to the exact goal task.'
      )
    }
    if (
      !['ready', 'complete'].includes(source.state) ||
      !dependenciesComplete(source, {
        ...registry.archivedTasks,
        ...registry.tasks
      })
    ) {
      fail(
        'source_not_ready',
        'Source task or its dependencies are not complete enough to integrate.'
      )
    }
    if (!['active', 'ready'].includes(goal.state)) {
      fail(
        'goal_not_ready',
        'Goal task cannot receive integration in its current state.'
      )
    }
    const sourcePr = event.sourcePr || {}
    const goalInput = event.goal || {}
    if (!Number.isInteger(sourcePr.number) || sourcePr.number <= 0) {
      fail('invalid_input', 'sourcePr.number must be a positive integer.')
    }
    if (
      sourcePr.baseBranch !== goal.branch ||
      goalInput.branch !== goal.branch ||
      sourcePr.headBranch !== source.branch
    ) {
      fail(
        'integration_branch_mismatch',
        'PR base/head branches do not match the registry.'
      )
    }
    if (
      sourcePr.headSha !== source.evidence?.head ||
      sourcePr.headTree !== source.evidence?.tree
    ) {
      fail(
        'source_evidence_mismatch',
        'PR source head/tree do not match registered evidence.'
      )
    }
    assertExactEvidence(source, sourcePr.headSha, sourcePr.headTree)
    const sourceState = currentGitState(source, source.worktree)
    if (
      sourceState.head !== sourcePr.headSha ||
      sourceState.tree !== sourcePr.headTree
    ) {
      fail(
        'source_evidence_mismatch',
        'Source worktree is not at the reviewed PR head/tree.'
      )
    }
    const goalState = currentGitState(goal, event.cwd)
    if (goalInput.headSha !== goalState.head) {
      fail(
        'goal_head_mismatch',
        'Goal worktree HEAD changed from the requested integration base.'
      )
    }
    const goalContainedBySource = spawnSync(
      'git',
      ['merge-base', '--is-ancestor', goalState.head, sourcePr.headSha],
      {
        cwd: goal.worktree,
        timeout: 5000,
        stdio: 'ignore'
      }
    )
    if (goalContainedBySource.status !== 0) {
      fail(
        'goal_advanced_beyond_source',
        'Current goal HEAD is not an ancestor of the reviewed source HEAD.'
      )
    }
    return allow(
      'integration_approved',
      'Exact reviewed sub-PR may integrate into its registered goal.',
      {
        registryRevision: registry.revision,
        sourceTaskId: source.id,
        goalTaskId: goal.id,
        sourcePr,
        goal: { branch: goal.branch, headSha: goalState.head }
      }
    )
  })
}

function evaluateStop({ registryPath, event }) {
  return asDecision(() => {
    const registry = loadRegistry(registryPath)
    const task = taskFor(registry, event && event.taskId)
    if (
      task.agentId &&
      event.eventName === 'SubagentStop' &&
      event.agentId !== task.agentId
    ) {
      return stop(
        'agent_mismatch',
        'SubagentStop agent ID does not match the registered task.'
      )
    }
    if (event.userStop === true) {
      return stop(
        'explicit_user_stop',
        'An explicit user stop is never restarted.'
      )
    }
    if (['paused', 'blocked', 'retired'].includes(task.state)) {
      return stop(
        'task_stopped',
        `Task state ${task.state} forbids continuation.`
      )
    }
    if (task.state === 'complete' && event.pending !== true) {
      return stop('task_complete', 'Task is already complete.')
    }
    if (task.state === 'ready' && event.pending !== true) {
      try {
        const state = currentGitState(task, task.worktree)
        assertExactEvidence(task, state.head, state.tree)
        return stop(
          'task_ready',
          'Ready task has exact successful evidence and review.'
        )
      } catch (error) {
        if (!(error instanceof GuardError)) throw error
      }
    }
    if (task.continuations >= 1) {
      return stop(
        'continuation_exhausted',
        'The single diagnostic continuation was already used.'
      )
    }
    const updated = { ...task, continuations: 1 }
    const registered = registerTask({
      registryPath,
      expectedRevision: registry.revision,
      task: updated
    })
    if (registered.decision !== 'allow') {
      return stop(
        'continuation_cas_failed',
        'Continuation was denied because registry CAS failed.',
        {
          registration: registered
        }
      )
    }
    return continuation(
      event.pending === true ? 'pending_once' : 'invalid_completion_once',
      'One bounded diagnostic continuation was persisted.',
      { registryRevision: registered.details.registryRevision }
    )
  })
}

function registryPathForRepo(repoRoot) {
  const root = realDirectory(repoRoot, 'repoRoot')
  return path.join(root, 'tmp', 'agent-coordination', 'state.json')
}

function dispatch(command, input) {
  const registryPath = registryPathForRepo(input && input.repoRoot)
  switch (command) {
    case 'register':
      return registerTask({
        registryPath,
        expectedRevision: input.expectedRevision,
        task: input.task
      })
    case 'compact':
      return compactRegistry({
        registryPath,
        expectedRevision: input.expectedRevision,
        coordinatorTaskId: input.coordinatorTaskId
      })
    case 'history':
      return readArchivedTask({
        registryPath,
        taskId: input.taskId
      })
    case 'check':
      return checkTask({ registryPath, event: input })
    case 'pre-tool':
      return evaluatePreTool({ registryPath, event: input })
    case 'pre-commit':
      return evaluatePreCommit({ registryPath, event: input })
    case 'integration':
      return evaluateIntegration({ registryPath, event: input })
    case 'stop':
      return evaluateStop({ registryPath, event: input })
    default:
      return deny('invalid_command', 'Unknown coordination guard command.')
  }
}

module.exports = {
  VERSION,
  checkTask,
  compactRegistry,
  dispatch,
  evaluateIntegration,
  evaluatePreCommit,
  evaluatePreTool,
  evaluateStop,
  hashToolInput,
  loadRegistry,
  readArchivedTask,
  registerTask,
  registryPathForRepo
}
