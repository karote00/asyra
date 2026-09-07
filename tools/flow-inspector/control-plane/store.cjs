/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

const validId = (value) =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value)
const freeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value))
    return value
  Object.values(value).forEach(freeze)
  return Object.freeze(value)
}
const alive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code !== 'ESRCH'
  }
}
const writeAtomic = (file, value) => {
  const temporary = file + '.' + randomUUID() + '.tmp'
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', {
    flag: 'wx',
    mode: 0o600
  })
  fs.renameSync(temporary, file)
}
function validateRecord(value, id) {
  if (
    !value ||
    ![1, 2].includes(value.format) ||
    value.id !== id ||
    !validId(id) ||
    ![
      'running',
      'completed',
      'cancelled',
      'timed-out',
      'interrupted',
      'error'
    ].includes(value.phase) ||
    typeof value.startedAt !== 'string' ||
    typeof value.actor !== 'string' ||
    typeof value.scenario !== 'string' ||
    !/^[a-z]+(?:-[a-z]+)*$/.test(value.scenario) ||
    !Array.isArray(value.flowIds) ||
    !value.flowIds.length ||
    !Array.isArray(value.audit) ||
    !value.audit.length ||
    value.audit.some(
      (event) => typeof event.event !== 'string' || typeof event.at !== 'string'
    )
  )
    throw new Error('Invalid attempt record: ' + id)
  if (
    value.format === 2 &&
    (!Number.isInteger(value.mappingRevision) ||
      value.mappingRevision < 1 ||
      !/^[a-f0-9]{64}$/.test(value.contractDigest ?? '') ||
      (value.phase !== 'running' &&
        !Number.isFinite(Date.parse(value.finishedAt))))
  )
    throw new Error('Invalid versioned attempt identity: ' + id)
  if (value.phase === 'completed') {
    const evidence = value.evidence
    if (
      !evidence ||
      !['passed', 'failed', 'unknown'].includes(evidence.status) ||
      !Array.isArray(evidence.cases) ||
      !Array.isArray(evidence.flows) ||
      !Array.isArray(evidence.issues) ||
      evidence.cases.some(
        (item) =>
          !['passed', 'failed', 'unknown'].includes(item.status) ||
          typeof item.id !== 'string' ||
          !Array.isArray(item.failures)
      ) ||
      evidence.flows.some(
        (flow) =>
          !value.flowIds.includes(flow.id) ||
          !['passed', 'failed', 'unknown'].includes(flow.status)
      ) ||
      !value.snapshot ||
      !/^[a-f0-9]{64}$/.test(value.snapshot.digest)
    )
      throw new Error('Invalid completed evidence: ' + id)
    if (
      evidence.status === 'passed' &&
      (evidence.issues.length ||
        !evidence.cases.length ||
        evidence.cases.some((item) => item.status !== 'passed') ||
        evidence.expectedCount !== evidence.cases.length ||
        evidence.passedCount !== evidence.cases.length)
    )
      throw new Error('Incomplete persisted pass: ' + id)
    if (value.format === 2) {
      const snapshot = value.snapshot
      const runner = value.runner
      if (
        snapshot.contractDigest !== value.contractDigest ||
        [
          'mappingVersion',
          'architectureVersion',
          'configurationDigest',
          'lockfileDigest'
        ].some((key) => !/^[a-f0-9]{64}$/.test(snapshot[key] ?? '')) ||
        !runner ||
        (evidence.status === 'passed' &&
          (runner.code !== 0 || runner.reason)) ||
        !/^[a-f0-9]{64}$/.test(runner.reportDigest ?? '') ||
        !runner.identity ||
        runner.identity.sourceDigest !== snapshot.digest ||
        runner.identity.contractDigest !== snapshot.contractDigest ||
        ['mappingVersion', 'architectureVersion', 'configurationDigest'].some(
          (key) => runner.identity[key] !== snapshot[key]
        ) ||
        runner.identity.scenario !== value.scenario ||
        JSON.stringify(runner.identity.flowIds) !==
          JSON.stringify(value.flowIds) ||
        !runner.environment ||
        runner.environment.vitest !== runner.version ||
        ['node', 'platform', 'architecture', 'vitest'].some(
          (key) =>
            typeof runner.environment[key] !== 'string' ||
            !runner.environment[key]
        )
      )
        throw new Error('Invalid persisted execution provenance: ' + id)
    }
  }
  return value
}
function validateMapping(value) {
  if (
    !value ||
    value.format !== 1 ||
    !Number.isInteger(value.revision) ||
    value.revision < 1 ||
    !value.accepted?.definition ||
    !/^[a-f0-9]{64}$/.test(value.accepted.digest ?? '') ||
    !Array.isArray(value.reviews) ||
    new Set(value.reviews.map((review) => review.id)).size !==
      value.reviews.length ||
    value.reviews.some(
      (review) =>
        !validId(review.id) ||
        !['pending', 'accepted', 'rejected'].includes(review.status) ||
        !Number.isInteger(review.baseRevision) ||
        !Array.isArray(review.changes) ||
        !/^[a-f0-9]{64}$/.test(review.candidate?.digest ?? '') ||
        typeof review.actor !== 'string'
    )
  )
    throw new Error('Invalid mapping review state')
  return value
}
function openStore(directory) {
  fs.mkdirSync(directory, { recursive: true })
  const claimPath = path.join(directory, 'claim-' + randomUUID() + '.json')
  writeAtomic(claimPath, { pid: process.pid })
  try {
    // Unique claims avoid deleting or replacing another contender's lock.
    // Two simultaneous contenders may both retry, but cannot both acquire.
    for (const name of fs
      .readdirSync(directory)
      .filter((name) => /^claim-.*\.json$/.test(name))) {
      const file = path.join(directory, name)
      if (file === claimPath) continue
      let claim
      try {
        claim = JSON.parse(fs.readFileSync(file, 'utf8'))
      } catch (error) {
        if (error.code === 'ENOENT') continue
        throw new Error('Attempt store has an unreadable ownership claim')
      }
      if (!Number.isInteger(claim.pid) || claim.pid <= 0 || alive(claim.pid))
        throw new Error(
          'Attempt store is already owned; stop the board before using the CLI'
        )
      try {
        fs.unlinkSync(file)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
    const mappingPath = path.join(directory, 'mapping.json')
    let mapping = null
    if (fs.existsSync(mappingPath)) {
      if (fs.lstatSync(mappingPath).isSymbolicLink())
        throw new Error('Symlinked mapping state')
      mapping = freeze(
        validateMapping(JSON.parse(fs.readFileSync(mappingPath, 'utf8')))
      )
    }
    const records = new Map()
    for (const id of fs.readdirSync(directory).filter(validId)) {
      if (fs.lstatSync(path.join(directory, id)).isSymbolicLink())
        throw new Error('Symlinked attempt directory')
      const file = path.join(directory, id, 'record.json')
      if (!fs.existsSync(file)) continue
      if (fs.lstatSync(file).isSymbolicLink())
        throw new Error('Symlinked attempt record')
      const record = validateRecord(
        JSON.parse(fs.readFileSync(file, 'utf8')),
        id
      )
      if (record.phase === 'running') {
        if (
          Number.isInteger(record.runnerPid) &&
          record.runnerPid > 0 &&
          alive(record.runnerPid)
        )
          throw new Error(
            'Interrupted runner is still settling; retry after it exits'
          )
        record.phase = 'interrupted'
        record.finishedAt = new Date().toISOString()
        record.audit.push({
          event: 'interrupted-on-restart',
          at: record.finishedAt
        })
        delete record.evidence
        writeAtomic(file, record)
      }
      records.set(id, freeze(record))
    }
    const orderedIds = [...records.keys()].sort((a, b) =>
      records.get(b).startedAt.localeCompare(records.get(a).startedAt)
    )
    let closed = false
    return {
      directory,
      get: (id) => records.get(id),
      mapping: () => mapping,
      saveMapping(value) {
        if (closed) throw new Error('Attempt store is closed')
        validateMapping(value)
        writeAtomic(mappingPath, value)
        mapping = freeze(structuredClone(value))
      },
      list: (limit = orderedIds.length) =>
        orderedIds.slice(0, limit).map((id) => records.get(id)),
      save(record) {
        if (closed) throw new Error('Attempt store is closed')
        validateRecord(record, record.id)
        const previous = records.get(record.id)
        if (previous && previous.phase !== 'running')
          throw new Error('Final attempt is immutable')
        const dir = path.join(directory, record.id)
        fs.mkdirSync(dir, { recursive: true })
        writeAtomic(path.join(dir, 'record.json'), record)
        records.set(record.id, freeze(structuredClone(record)))
        if (!previous) {
          const index = orderedIds.findIndex(
            (id) => records.get(id).startedAt < record.startedAt
          )
          orderedIds.splice(index < 0 ? orderedIds.length : index, 0, record.id)
        }
      },
      close() {
        if (!closed) {
          closed = true
          fs.unlinkSync(claimPath)
        }
      }
    }
  } catch (error) {
    fs.unlinkSync(claimPath)
    throw error
  }
}
module.exports = { openStore, validateRecord, validId, writeAtomic }
