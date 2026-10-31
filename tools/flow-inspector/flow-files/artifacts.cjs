/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'),
  path = require('node:path'),
  { createHash } = require('node:crypto')
const { safePath } = require('../control-plane/snapshot.cjs')
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const owned = (value) =>
  value.ownership === 'tool' && /^\.attachments\/[a-f0-9]{64}$/.test(value.path)
const references = (documents) =>
  new Set(
    documents.flatMap((d) =>
      d.current.observations.flatMap((o) =>
        (o.attachments ?? []).filter(owned).map((a) => a.path)
      )
    )
  )
function retain(directory, root, artifacts) {
  let total = 0
  const retained = []
  const pending = []
  for (const artifact of artifacts) {
    const source = safePath(root, artifact.retainedPath),
      stat = fs.lstatSync(source)
    if (
      !stat.isFile() ||
      stat.size > 64 * 1024 * 1024 ||
      (total += stat.size) > 256 * 1024 * 1024
    ) {
      throw new Error('Current artifact exceeds budget')
    }
    const bytes = fs.readFileSync(source),
      digest = hash(bytes)
    if (digest !== artifact.digest || bytes.length !== artifact.size) {
      throw new Error('Current artifact integrity mismatch')
    }
    const relative = '.attachments/' + digest,
      destination = safePath(directory, relative)
    if (
      fs.existsSync(destination) &&
      hash(fs.readFileSync(destination)) !== digest
    ) {
      throw new Error('Stored current artifact integrity mismatch')
    }
    pending.push({ destination, bytes })
    retained.push({
      name: artifact.name || 'Execution artifact',
      path: relative,
      digest,
      size: bytes.length,
      ownership: 'tool'
    })
  }
  for (const { destination, bytes } of pending) {
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    if (!fs.existsSync(destination)) {
      fs.writeFileSync(destination, bytes, { flag: 'wx', mode: 0o600 })
    }
  }
  return retained
}
function prune(directory, candidates, documents) {
  const used = references(documents)
  for (const relative of candidates) {
    if (!used.has(relative) && /^\.attachments\/[a-f0-9]{64}$/.test(relative)) {
      const file = safePath(directory, relative)
      if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
        fs.unlinkSync(file)
      }
    }
  }
}
module.exports = { retain, prune, references }
