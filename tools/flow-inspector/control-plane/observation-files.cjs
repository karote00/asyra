/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createHash, randomUUID } = require('node:crypto')
const { safePath } = require('./snapshot.cjs')
const { writeAtomic } = require('./store.cjs')
const localization = require('./localization.cjs')
const lifecycle = require('./observation-lifecycle.cjs')
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const prefix = 'tmp/flow-inspector/test-results/'
const maximum = 256 * 1024 * 1024
function readBytes(root, relative, limit = 32 * 1024 * 1024) {
  const file = safePath(root, relative)
  const stat = fs.lstatSync(file)
  if (!stat.isFile() || stat.size > limit)
    throw new Error('Invalid evidence file: ' + relative)
  return fs.readFileSync(file)
}
function put(root, relative, bytes) {
  const file = safePath(root, relative)
  if (fs.existsSync(file)) {
    if (!fs.readFileSync(file).equals(bytes))
      throw new Error('Conflicting evidence: ' + relative)
    return
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const temporary = file + '.publish-' + randomUUID()
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx', mode: 0o600 })
    fs.linkSync(temporary, file)
  } finally {
    fs.rmSync(temporary, { force: true })
  }
}
function associate(root, predecessorId, successorId, request) {
  const directory = localization.observationDirectory(root)
  const reader = localization.createObservationReader(directory)
  const previous = reader.get(predecessorId),
    next = reader.get(successorId)
  const relation = {
    version: 1,
    successorId,
    successorDigest: lifecycle.recordDigest(next),
    correction: {
      version: 1,
      predecessorId,
      predecessorDigest: lifecycle.recordDigest(previous),
      reason: request.reason
    },
    intent: lifecycle.resolveIntent(next.contracts, request)
  }
  if (
    !lifecycle.canSupersede(
      previous,
      next,
      relation.correction,
      relation.intent
    )
  )
    throw new Error('Correction does not establish discovery recovery')
  put(
    root,
    prefix + 'corrections/' + predecessorId + '.json',
    Buffer.from(JSON.stringify(relation))
  )
  return relation
}
function exportBundle(root, destination, executionIdentity) {
  const target = safePath(root, destination)
  if (fs.existsSync(target))
    throw new Error('Use a fresh observation bundle directory')
  const reader = localization.createObservationReader(
    localization.observationDirectory(root)
  )
  const state = reader.list()
  if (state.issues.length) throw new Error(state.issues.join('\n'))
  const records = state.runs
    .map((run) => reader.get(run.id))
    .filter(
      (record) =>
        !executionIdentity ||
        lifecycle.matchesExecution(record, executionIdentity)
    )
  if (!records.length) throw new Error('No matching observation evidence')
  const files = new Map()
  for (const record of records) {
    if (record.phase !== 'completed')
      throw new Error('Incomplete observation: ' + record.id)
    files.set(
      prefix + record.id + '.json',
      readBytes(root, prefix + record.id + '.json')
    )
    for (const artifact of record.retainedArtifacts ?? []) {
      if (
        !new RegExp('^' + prefix + record.id + '/attachments/[0-9]+$').test(
          artifact.retainedPath
        )
      )
        throw new Error('Invalid retained artifact path')
      const bytes = readBytes(root, artifact.retainedPath, 64 * 1024 * 1024)
      if (bytes.length !== artifact.size || digest(bytes) !== artifact.digest)
        throw new Error('Corrupt retained artifact')
      files.set(artifact.retainedPath, bytes)
    }
  }
  for (const relation of reader.associations()) {
    if (records.some((r) => r.id === relation.correction.predecessorId)) {
      if (!records.some((r) => r.id === relation.successorId))
        throw new Error('Missing correction successor')
      files.set(
        prefix + 'corrections/' + relation.correction.predecessorId + '.json',
        Buffer.from(JSON.stringify(relation))
      )
    }
  }
  if (
    files.size > 10000 ||
    [...files.values()].reduce((size, bytes) => size + bytes.length, 0) >
      maximum
  )
    throw new Error('Observation bundle exceeds budget')
  const manifest = {
    version: 1,
    files: [...files].map(([file, bytes]) => ({
      path: file,
      size: bytes.length,
      digest: digest(bytes)
    }))
  }
  fs.mkdirSync(target, { recursive: true })
  for (const [file, bytes] of files) put(target, file, bytes)
  writeAtomic(path.join(target, 'bundle.json'), manifest)
  return manifest
}
function readBundle(root, source, executionIdentity) {
  const directory = safePath(root, source)
  const manifest = JSON.parse(
    readBytes(directory, 'bundle.json', 2 * 1024 * 1024)
  )
  if (
    manifest?.version !== 1 ||
    !Array.isArray(manifest.files) ||
    !manifest.files.length ||
    manifest.files.length > 10000
  )
    throw new Error('Invalid observation bundle')
  const files = new Map()
  let size = 0
  for (const entry of manifest.files) {
    if (
      typeof entry.path !== 'string' ||
      !entry.path.startsWith(prefix) ||
      entry.path
        .split('/')
        .some((part) => !part || part === '.' || part === '..') ||
      entry.path.includes('\\') ||
      files.has(entry.path)
    )
      throw new Error('Invalid bundle path')
    const bytes = readBytes(directory, entry.path, 64 * 1024 * 1024)
    size += bytes.length
    if (
      size > maximum ||
      bytes.length !== entry.size ||
      digest(bytes) !== entry.digest
    )
      throw new Error('Invalid bundle integrity')
    files.set(entry.path, bytes)
  }
  const reader = localization.createObservationReader(
    localization.observationDirectory(directory),
    { executionIdentity }
  )
  const state = reader.list()
  if (state.issues.length || !state.runs.length)
    throw new Error('Invalid bundled observations: ' + state.issues.join('; '))
  const required = new Set()
  for (const run of state.runs) {
    const record = reader.get(run.id)
    if (
      record.phase !== 'completed' ||
      (executionIdentity &&
        !lifecycle.matchesExecution(record, executionIdentity))
    )
      throw new Error(
        'Observation execution identity is incomplete or mismatched'
      )
    required.add(prefix + record.id + '.json')
    for (const artifact of record.retainedArtifacts ?? []) {
      if (
        !new RegExp('^' + prefix + record.id + '/attachments/[0-9]+$').test(
          artifact.retainedPath
        )
      )
        throw new Error('Invalid retained artifact path')
      const bytes = files.get(artifact.retainedPath)
      if (
        !bytes ||
        bytes.length !== artifact.size ||
        digest(bytes) !== artifact.digest
      )
        throw new Error('Missing or corrupt retained artifact')
      required.add(artifact.retainedPath)
    }
  }
  for (const relation of reader.associations()) {
    const previous = reader.get(relation.correction.predecessorId),
      next = reader.get(relation.successorId)
    if (
      lifecycle.recordDigest(next) !== relation.successorDigest ||
      !lifecycle.canSupersede(
        previous,
        next,
        relation.correction,
        relation.intent
      )
    )
      throw new Error('Invalid bundled correction')
    required.add(
      prefix + 'corrections/' + relation.correction.predecessorId + '.json'
    )
  }
  if (
    required.size !== files.size ||
    [...required].some((file) => !files.has(file))
  )
    throw new Error('Unexpected or missing bundle file')
  return { state, files, records: state.runs.map((run) => reader.get(run.id)) }
}
function importBundle(root, source) {
  const { state, files } = readBundle(root, source)
  // Validate every conflict before publishing any evidence. Completed originals
  // remain byte-for-byte immutable, including when an import is repeated.
  for (const [relative, bytes] of files) {
    const target = safePath(root, relative)
    if (fs.existsSync(target) && !fs.readFileSync(target).equals(bytes))
      throw new Error('Conflicting evidence: ' + relative)
  }
  for (const [relative, bytes] of files) put(root, relative, bytes)
  return state
}
if (require.main === module) {
  try {
    const [command, source, successor, requestFile] = process.argv.slice(2)
    const root = path.resolve(__dirname, '../../..')
    let result
    const executionIdentity = lifecycle.executionIdentity({
      command: { environment: process.env }
    })
    if (executionIdentity === false)
      throw new Error('Incomplete execution identity')
    if (command === 'export')
      result = exportBundle(
        root,
        source,
        lifecycle.executionIdentity({
          command: { environment: process.env }
        }) || undefined
      )
    else if (command === 'import') result = importBundle(root, source)
    else if (command === 'inspect')
      result = readBundle(root, source, executionIdentity ?? undefined).state
    else if (command === 'associate')
      result = associate(
        root,
        source,
        successor,
        JSON.parse(readBytes(root, requestFile, 1024 * 1024))
      )
    else throw new Error('Expected export, import, inspect or associate')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
module.exports = { exportBundle, readBundle, importBundle, associate }
