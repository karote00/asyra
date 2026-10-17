/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  { createHash } = require('node:crypto')
const { directory } = require('./fixtures.cjs')
const { initialize } = require('../project.cjs')
const { exportCurrent, importCurrent } = require('../bundles.cjs')
const { openProject } = require('../store.cjs')
const { nodeBinding } = require('../policy.cjs')
const { admitProject } = require('../schema.cjs')
test('bundles retain current evidence and notes, reject divergent revisions, and are idempotent', (t) => {
  const source = initialize(directory(t)),
    target = initialize(directory(t))
  const store = openProject(source.directory)
  store.update('checkout', {
    expectedRevision: 0,
    kind: 'note',
    value: {
      id: 'note',
      nodeId: 'review',
      actor: 'human',
      text: 'Ready for review'
    }
  })
  const bundle = exportCurrent(source)
  importCurrent(target, bundle)
  assert.deepEqual(exportCurrent(target), bundle)
  importCurrent(target, bundle)
  const corrupted = structuredClone(bundle)
  corrupted.documents[0].current.notes[0].text = 'Different'
  assert.throws(() => importCurrent(target, corrupted), /conflicts/)
  corrupted.documents[0].revision--
  assert.throws(() => importCurrent(target, corrupted), /conflicts/)
  assert.throws(
    () => importCurrent({ ...target, projectId: 'other' }, bundle),
    /identity/
  )
})
test('bundle attachments require exact bytes, references and safe destinations', (t) => {
  const source = initialize(directory(t)),
    target = initialize(directory(t)),
    store = openProject(source.directory)
  const bytes = Buffer.from('proof'),
    hash = createHash('sha256').update(bytes).digest('hex')
  fs.mkdirSync(path.join(source.directory, '.attachments'))
  fs.writeFileSync(path.join(source.directory, '.attachments', hash), bytes)
  const doc = store.snapshot().documents[0]
  store.update('checkout', {
    expectedRevision: 0,
    kind: 'observation',
    value: {
      nodeId: 'review',
      criterionId: 'accepted',
      kind: 'manual',
      status: 'accepted',
      binding: nodeBinding(admitProject([doc]), 'checkout', 'review'),
      actor: 'human',
      summary: 'Reviewed',
      at: 'now',
      attachments: [
        {
          name: 'Proof',
          ownership: 'tool',
          path: '.attachments/' + hash,
          digest: hash,
          size: bytes.length
        }
      ]
    }
  })
  const bundle = exportCurrent(source)
  const bad = structuredClone(bundle)
  bad.attachments[0].base64 = 'AAAA'
  assert.throws(() => importCurrent(target, bad), /integrity/)
  bad.attachments = []
  assert.throws(() => importCurrent(target, bad), /Missing/)
  bad.attachments = [...bundle.attachments, ...bundle.attachments]
  assert.throws(() => importCurrent(target, bad), /duplicate/)
  fs.symlinkSync(source.directory, path.join(target.directory, '.attachments'))
  assert.throws(() => importCurrent(target, bundle), /Symlink/)
})
test('cached snapshots reject a writer lock instead of exposing partial imports', (t) => {
  const project = initialize(directory(t)),
    store = openProject(project.directory)
  store.snapshot()
  fs.mkdirSync(path.join(project.directory, '.writer-lock'))
  assert.throws(() => store.snapshot(), /writer/)
})

test('import rejects a revision changed between snapshot and backup capture', (t) => {
  const source = initialize(directory(t)),
    target = initialize(directory(t))
  const bundle = exportCurrent(source)
  bundle.documents[0].revision = 1
  const file = path.join(target.directory, 'checkout.flow.json')
  const newer = JSON.parse(fs.readFileSync(file))
  newer.revision = 9
  const original = fs.readFileSync
  let reads = 0
  fs.readFileSync = function (name, ...args) {
    if (name === file && ++reads === 2)
      fs.writeFileSync(file, JSON.stringify(newer))
    return original.call(this, name, ...args)
  }
  try {
    assert.throws(() => importCurrent(target, bundle), /Concurrent/)
  } finally {
    fs.readFileSync = original
  }
  assert.equal(JSON.parse(fs.readFileSync(file)).revision, 9)
})
test('snapshot rejects a flow replacement during its read instead of caching mixed data', (t) => {
  const project = initialize(directory(t)),
    file = path.join(project.directory, 'checkout.flow.json')
  const newer = JSON.parse(fs.readFileSync(file))
  newer.revision = 1
  const original = fs.readFileSync
  fs.readFileSync = function (name, ...args) {
    const value = original.call(this, name, ...args)
    if (name === file) fs.writeFileSync(file, JSON.stringify(newer))
    return value
  }
  try {
    assert.throws(
      () => openProject(project.directory).snapshot(),
      /changed|writer/
    )
  } finally {
    fs.readFileSync = original
  }
})

test('replacing imported evidence removes only superseded tool attachments', (t) => {
  const source = initialize(directory(t)),
    target = initialize(directory(t))
  const bundle = structuredClone(exportCurrent(source))
  const bytes = Buffer.from('old evidence')
  const hash = createHash('sha256').update(bytes).digest('hex')
  bundle.documents[0].revision = 1
  bundle.documents[0].current.observations = [
    {
      nodeId: 'review',
      criterionId: 'accepted',
      kind: 'manual',
      status: 'accepted',
      binding: nodeBinding(
        admitProject(bundle.documents),
        'checkout',
        'review'
      ),
      actor: 'human',
      summary: 'Reviewed',
      at: 'now',
      attachments: [
        {
          name: 'Proof',
          ownership: 'tool',
          path: '.attachments/' + hash,
          digest: hash,
          size: bytes.length
        }
      ]
    }
  ]
  bundle.attachments = [
    { path: '.attachments/' + hash, base64: bytes.toString('base64') }
  ]
  importCurrent(target, bundle)
  const old = path.join(target.directory, '.attachments', hash)
  const unrelated = path.join(target.directory, '.attachments', 'unrelated.txt')
  fs.writeFileSync(unrelated, 'Project-owned evidence')
  assert.equal(fs.existsSync(old), true)
  bundle.documents[0].revision++
  bundle.documents[0].current.observations[0].attachments = []
  bundle.attachments = []
  const before = exportCurrent(target)
  const unlink = fs.unlinkSync
  fs.unlinkSync = function (file, ...args) {
    if (file === old) throw new Error('Injected cleanup failure')
    return unlink.call(this, file, ...args)
  }
  try {
    assert.throws(
      () => importCurrent(target, bundle),
      /Injected cleanup failure/
    )
  } finally {
    fs.unlinkSync = unlink
  }
  assert.deepEqual(exportCurrent(target), before)
  importCurrent(target, bundle)
  assert.equal(fs.existsSync(old), false)
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'Project-owned evidence')
  assert.deepEqual(exportCurrent(target), bundle)
})
