/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'),
  path = require('node:path')
const { admitProject } = require('./schema.cjs')
const {
  evaluateProject,
  nodeBinding,
  criterionBinding,
  digest
} = require('./policy.cjs')
const { writeAtomic } = require('../control-plane/store.cjs')
const artifacts = require('./artifacts.cjs')
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
function openProject(
  directory,
  {
    onWork = () => {
      /* Optional work-count instrumentation. */
    }
  } = {}
) {
  const root = fs.realpathSync(directory)
  let previous = null,
    ownsLock = false
  function snapshot() {
    if (!ownsLock && fs.existsSync(path.join(root, '.writer-lock'))) {
      throw new Error('Another writer owns this project')
    }
    const names = fs
      .readdirSync(root)
      .filter((n) => n.endsWith('.flow.json'))
      .sort()
    if (names.length > 1000) {
      throw new Error('Too many flow files')
    }
    const stamps = names.map((name) => {
      const stat = fs.lstatSync(path.join(root, name))
      if (!stat.isFile() || stat.size > 4 * 1024 * 1024) {
        throw new Error(name + ': Invalid file or size')
      }
      return [name, stat.ino, stat.mtimeMs, stat.ctimeMs, stat.size]
    })
    if (stamps.reduce((sum, stamp) => sum + stamp[4], 0) > 32 * 1024 * 1024) {
      throw new Error('Project flow files exceed 32 MiB')
    }
    const signature = JSON.stringify(stamps)
    if (previous?.signature === signature) {
      return previous.value
    }
    previous = null
    const documents = names.map((name) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'))
      } catch (error) {
        throw new Error(name + ': ' + error.message)
      }
    })
    if (!ownsLock && fs.existsSync(path.join(root, '.writer-lock'))) {
      throw new Error('Another writer owns this project')
    }
    const after = fs
      .readdirSync(root)
      .filter((n) => n.endsWith('.flow.json'))
      .sort()
      .map((name) => {
        const stat = fs.lstatSync(path.join(root, name))
        return [name, stat.ino, stat.mtimeMs, stat.ctimeMs, stat.size]
      })
    if (JSON.stringify(after) !== signature) {
      throw new Error('Flow files changed during snapshot')
    }
    onWork('admit')
    const project = admitProject(documents)
    onWork('evaluate')
    const evaluation = evaluateProject(project)
    const value = freeze({
      documents,
      evaluation,
      files: Object.fromEntries(
        documents.map((doc, i) => [doc.flowId, names[i]])
      )
    })
    previous = { signature, value }
    return value
  }
  function update(flowId, request) {
    const lock = path.join(root, '.writer-lock')
    try {
      fs.mkdirSync(lock)
      ownsLock = true
    } catch (error) {
      if (error.code === 'EEXIST') {
        throw new Error('Another writer owns this project')
      }
      throw error
    }
    try {
      const loaded = snapshot(),
        documents = structuredClone(loaded.documents),
        doc = documents.find((d) => d.flowId === flowId)
      if (!doc) {
        throw new Error('Unknown flow')
      }
      if (!request || !Number.isSafeInteger(request.expectedRevision)) {
        throw new Error('Expected revision required')
      }
      const project = admitProject(loaded.documents)
      const replace = (collection, value, key) => {
        const index = collection.findIndex((item) => key(item) === key(value))
        if (index < 0) {
          collection.push(structuredClone(value))
        } else {
          collection[index] = structuredClone(value)
        }
      }
      const observation = (value) => {
        if (
          !value ||
          value.binding !==
            criterionBinding(project, flowId, value.nodeId, value.criterionId)
        ) {
          throw new Error('Stale observation binding')
        }
        const old = doc.current.observations.find(
          (o) =>
            o.nodeId === value.nodeId && o.criterionId === value.criterionId
        )
        if (
          old &&
          ['failed', 'rejected'].includes(old.status) &&
          value.status === 'incomplete'
        ) {
          throw new Error('Incomplete result cannot clear failure')
        }
        replace(
          doc.current.observations,
          value,
          (o) => o.nodeId + '/' + o.criterionId
        )
      }
      if (request.kind === 'observation') {
        observation(request.value)
      } else if (request.kind === 'observations') {
        if (!Array.isArray(request.values) || !request.values.length) {
          throw new Error('Expected observations')
        }
        request.values.forEach(observation)
      } else if (request.kind === 'producer') {
        if (
          !Array.isArray(request.values) ||
          !Array.isArray(request.warnings)
        ) {
          throw new Error('Expected producer observations and warnings')
        }
        request.values.forEach(observation)
        for (const id of request.resolvedWarnings ?? []) {
          const warning = doc.current.warnings.find((w) => w.id === id)
          if (
            !warning ||
            !['producer', 'discovery'].includes(warning.kind) ||
            !warning.criterionIds.length ||
            !warning.criterionIds.every((criterion) =>
              request.values.some(
                (o) =>
                  o.nodeId === warning.nodeId &&
                  o.criterionId === criterion &&
                  o.kind === 'automated' &&
                  ['passed', 'failed'].includes(o.status)
              )
            )
          ) {
            throw new Error('Incomplete warning replacement coverage')
          }
          doc.current.warnings = doc.current.warnings.filter((w) => w.id !== id)
        }
        for (const warning of request.warnings) {
          if (
            warning.binding !== nodeBinding(project, flowId, warning.nodeId)
          ) {
            throw new Error('Stale warning binding')
          }
          replace(doc.current.warnings, warning, (w) => w.id)
        }
      } else if (request.kind === 'note') {
        replace(doc.current.notes, request.value, (n) => n.id)
      } else if (request.kind === 'note-delete') {
        const index = doc.current.notes.findIndex((n) => n.id === request.id)
        if (index >= 0) {
          doc.current.notes.splice(index, 1)
        }
      } else if (request.kind === 'progress') {
        replace(doc.current.progress, request.value, (n) => n.nodeId)
      } else if (request.kind === 'source') {
        replace(doc.current.sources, request.value, (n) => n.nodeId)
      } else if (request.kind === 'warning') {
        if (
          request.value?.binding !==
          nodeBinding(project, flowId, request.value.nodeId)
        ) {
          throw new Error('Stale warning binding')
        }
        replace(doc.current.warnings, request.value, (w) => w.id)
      } else if (request.kind === 'correction') {
        const warning = doc.current.warnings.find((w) => w.id === request.id)
        const observations = request.observations
        if (
          !warning ||
          !['discovery', 'producer'].includes(warning.kind) ||
          !Array.isArray(observations) ||
          !observations.length ||
          warning.criterionIds.length !== observations.length ||
          observations.some(
            (o) =>
              o.nodeId !== warning.nodeId ||
              !warning.criterionIds.includes(o.criterionId) ||
              o.kind !== 'automated' ||
              !['passed', 'failed'].includes(o.status)
          ) ||
          new Set(observations.map((o) => o.criterionId)).size !==
            observations.length
        ) {
          throw new Error('Correction requires exact completed coverage')
        }
        observations.forEach(observation)
        doc.current.warnings = doc.current.warnings.filter(
          (w) => w.id !== request.id
        )
      } else {
        throw new Error('Unknown current update kind')
      }
      admitProject(documents)
      const original = loaded.documents.find((d) => d.flowId === flowId)
      if (digest(doc) === digest(original)) {
        return original
      }
      if (request.expectedRevision !== original.revision) {
        throw new Error('Document revision conflict')
      }
      doc.revision++
      const file = path.join(root, loaded.files[flowId])
      if (fs.lstatSync(file).isSymbolicLink()) {
        throw new Error('Flow symlink is forbidden')
      }
      if (
        Buffer.byteLength(JSON.stringify(doc, null, 2)) + 1 >
        4 * 1024 * 1024
      ) {
        throw new Error('Flow document exceeds 4 MiB')
      }
      const total = Object.entries(loaded.files).reduce(
        (size, [id, name]) =>
          size +
          (id === flowId
            ? Buffer.byteLength(JSON.stringify(doc, null, 2)) + 1
            : fs.statSync(path.join(root, name)).size),
        0
      )
      if (total > 32 * 1024 * 1024) {
        throw new Error('Project flow files exceed 32 MiB')
      }
      writeAtomic(file, doc)
      previous = null
      try {
        artifacts.prune(root, artifacts.references(loaded.documents), documents)
      } catch (error) {
        throw new Error(
          'Current update saved; attachment cleanup failed: ' + error.message
        )
      }
      return freeze(doc)
    } finally {
      ownsLock = false
      fs.rmdirSync(lock)
    }
  }
  return { snapshot, update }
}
module.exports = { openProject }
