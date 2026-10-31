/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'),
  path = require('node:path'),
  { createHash } = require('node:crypto')
const { admitProject } = require('./schema.cjs')
const { digest } = require('./policy.cjs')
const { openProject } = require('./store.cjs')
const { dataPath } = require('./project.cjs')
const { references } = require('./artifacts.cjs')
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
function validate(bundle, projectId) {
  if (
    !bundle ||
    bundle.schemaVersion !== 1 ||
    bundle.projectId !== projectId ||
    !Array.isArray(bundle.attachments) ||
    !Array.isArray(bundle.documents) ||
    bundle.documents.some((d) => d.projectId !== projectId)
  ) {
    throw new Error('Invalid bundle identity')
  }
  admitProject(bundle.documents)
  const expected = references(bundle.documents),
    supplied = new Map()
  let total = 0
  for (const artifact of bundle.attachments) {
    if (
      !expected.has(artifact.path) ||
      supplied.has(artifact.path) ||
      typeof artifact.base64 !== 'string'
    ) {
      throw new Error('Unexpected or duplicate bundle artifact')
    }
    if (artifact.base64.length > 90 * 1024 * 1024) {
      throw new Error('Bundle artifact exceeds budget')
    }
    const bytes = Buffer.from(artifact.base64, 'base64')
    if (
      bytes.toString('base64') !== artifact.base64 ||
      bytes.length > 64 * 1024 * 1024 ||
      (total += bytes.length) > 256 * 1024 * 1024 ||
      artifact.path !== '.attachments/' + hash(bytes)
    ) {
      throw new Error('Bundle artifact integrity mismatch')
    }
    supplied.set(artifact.path, bytes)
  }
  if (supplied.size !== expected.size) {
    throw new Error('Missing bundle artifact')
  }
  for (const doc of bundle.documents) {
    if (Buffer.byteLength(JSON.stringify(doc, null, 2)) + 1 > 4 * 1024 * 1024) {
      throw new Error('Bundle document exceeds budget')
    }
    for (const observation of doc.current.observations) {
      for (const a of observation.attachments ?? []) {
        if (a.ownership === 'tool') {
          const bytes = supplied.get(a.path)
          if (!bytes || a.digest !== hash(bytes) || a.size !== bytes.length) {
            throw new Error('Bundle attachment reference mismatch')
          }
        }
      }
    }
  }
  if (
    Buffer.byteLength(JSON.stringify(bundle.documents, null, 2)) >
    32 * 1024 * 1024
  ) {
    throw new Error('Bundle documents exceed budget')
  }
  return supplied
}
function exportCurrent(project) {
  const snapshot = openProject(project.directory).snapshot()
  if (snapshot.evaluation.projectId !== project.projectId) {
    throw new Error('Wrong project identity')
  }
  const bundle = {
    schemaVersion: 1,
    projectId: project.projectId,
    documents: snapshot.documents,
    attachments: [...references(snapshot.documents)].map((relative) => {
      const file = dataPath(project.directory, relative),
        stat = fs.lstatSync(file)
      if (!stat.isFile() || stat.size > 64 * 1024 * 1024) {
        throw new Error('Invalid current artifact')
      }
      return {
        path: relative,
        base64: fs.readFileSync(file).toString('base64')
      }
    })
  }
  validate(bundle, project.projectId)
  return bundle
}
function importCurrent(project, bundle) {
  const supplied = validate(bundle, project.projectId)
  const lock = path.join(project.directory, '.writer-lock')
  if (fs.existsSync(lock)) {
    throw new Error('Another writer owns this project')
  }
  const names = fs
    .readdirSync(project.directory)
    .filter((n) => n.endsWith('.flow.json'))
  const old = names.length
    ? openProject(project.directory).snapshot()
    : { documents: [], files: {} }
  if (old.documents.some((d) => d.projectId !== project.projectId)) {
    throw new Error('Wrong project identity')
  }
  const merged = new Map(old.documents.map((d) => [d.flowId, d]))
  for (const doc of bundle.documents) {
    const previous = merged.get(doc.flowId)
    if (
      previous &&
      (digest(previous.definition) !== digest(doc.definition) ||
        digest(previous.current.sources) !== digest(doc.current.sources) ||
        doc.revision < previous.revision ||
        (doc.revision === previous.revision &&
          digest(doc) !== digest(previous)))
    ) {
      throw new Error(
        'Bundle conflicts with current definition, source or revision'
      )
    }
    merged.set(doc.flowId, doc)
  }
  const documents = [...merged.values()]
  admitProject(documents)
  if (
    Buffer.byteLength(JSON.stringify(documents, null, 2)) >
    32 * 1024 * 1024
  ) {
    throw new Error('Merged project exceeds budget')
  }
  const writes = new Map()
  for (const [relative, bytes] of supplied) {
    writes.set(dataPath(project.directory, relative), bytes)
  }
  for (const doc of bundle.documents) {
    writes.set(
      dataPath(
        project.directory,
        old.files[doc.flowId] ?? doc.flowId + '.flow.json'
      ),
      Buffer.from(JSON.stringify(doc, null, 2) + '\n')
    )
  }
  const retained = references(documents)
  for (const relative of references(old.documents)) {
    if (!retained.has(relative)) {
      writes.set(dataPath(project.directory, relative), null)
    }
  }
  const backups = new Map()
  for (const file of writes.keys()) {
    if (fs.existsSync(file) && !fs.lstatSync(file).isFile()) {
      throw new Error('Invalid import destination')
    }
    backups.set(file, fs.existsSync(file) ? fs.readFileSync(file) : null)
  }
  fs.mkdirSync(lock)
  const written = []
  let rollbackComplete = true
  try {
    const currentNames = fs
      .readdirSync(project.directory)
      .filter((n) => n.endsWith('.flow.json'))
      .sort()
    if (JSON.stringify(currentNames) !== JSON.stringify([...names].sort())) {
      throw new Error('Concurrent import conflict')
    }
    for (const doc of old.documents) {
      const current = JSON.parse(
        fs.readFileSync(
          dataPath(project.directory, old.files[doc.flowId]),
          'utf8'
        )
      )
      if (digest(current) !== digest(doc)) {
        throw new Error('Concurrent import conflict')
      }
    }
    // The snapshot was taken before acquiring the lock; reject intervening writers.
    for (const [file, before] of backups) {
      const now = fs.existsSync(file) ? fs.readFileSync(file) : null
      if (Boolean(before) !== Boolean(now) || (before && !before.equals(now))) {
        throw new Error('Concurrent import conflict')
      }
    }
    for (const [file, bytes] of writes) {
      if (bytes ? backups.get(file)?.equals(bytes) : !backups.get(file)) {
        continue
      }
      written.push(file)
      if (bytes) {
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, bytes)
      } else {
        fs.unlinkSync(file)
      }
    }
  } catch (error) {
    rollbackComplete = false
    for (const file of written.reverse()) {
      const before = backups.get(file)
      if (before) {
        fs.writeFileSync(file, before)
      } else if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
    rollbackComplete = true
    throw error
  } finally {
    if (rollbackComplete) {
      fs.rmdirSync(lock)
    }
  }
  return openProject(project.directory).snapshot()
}
module.exports = { exportCurrent, importCurrent }
