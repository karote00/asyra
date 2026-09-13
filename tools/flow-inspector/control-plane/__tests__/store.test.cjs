/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const test = require('node:test')
const { openStore } = require('../store.cjs')
const parent = path.resolve(
  __dirname,
  '../../../../tmp/flow-inspector/store-tests'
)
const fixture = (t) => {
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'store-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  return directory
}
const attempt = () => ({
  format: 1,
  id: randomUUID(),
  phase: 'running',
  actor: 'local',
  scenario: 'baseline',
  flowIds: ['deferred-publication'],
  startedAt: new Date().toISOString(),
  audit: [{ event: 'admitted', at: new Date().toISOString() }]
})
test('enforces exclusive ownership and interrupts an unfinished run on restart', (t) => {
  const directory = fixture(t)
  const first = openStore(directory)
  const record = attempt()
  first.save(record)
  assert.throws(() => openStore(directory), /already owned/)
  first.close()
  const second = openStore(directory)
  assert.equal(second.get(record.id).phase, 'interrupted')
  assert.equal(
    second.get(record.id).audit.at(-1).event,
    'interrupted-on-restart'
  )
  assert.throws(() => second.save(record), /immutable/)
  assert.ok(Object.isFrozen(second.get(record.id).audit))
  second.close()
})
test('ignores interrupted temporary writes and rejects malformed durable records', (t) => {
  const directory = fixture(t)
  const store = openStore(directory)
  const record = attempt()
  store.save(record)
  store.close()
  fs.writeFileSync(
    path.join(directory, record.id, 'record.json.partial.tmp'),
    '{'
  )
  const recovered = openStore(directory)
  recovered.close()
  fs.writeFileSync(
    path.join(directory, record.id, 'record.json'),
    JSON.stringify({ ...record, phase: 'made-up-pass' })
  )
  assert.throws(() => openStore(directory), /Invalid attempt/)
})
test('repeated reads use admitted records without rereading source or history files', (t) => {
  const store = openStore(fixture(t))
  const record = attempt()
  store.save(record)
  const original = fs.readFileSync
  const reads = t.mock.method(fs, 'readFileSync', (...args) =>
    original(...args)
  )
  const originalSort = Array.prototype.sort
  let sorts = 0
  Array.prototype.sort = function (...args) {
    sorts++
    return originalSort.apply(this, args)
  }
  t.after(() => {
    Array.prototype.sort = originalSort
  })
  for (let i = 0; i < 25; i++) {
    store.get(record.id)
    store.list()
  }
  assert.equal(reads.mock.callCount(), 0)
  Array.prototype.sort = originalSort
  assert.equal(sorts, 0)
  store.close()
})
test('restart refuses to overlap a still-live interrupted runner', (t) => {
  const directory = fixture(t)
  const store = openStore(directory)
  store.save({ ...attempt(), runnerPid: process.pid })
  store.close()
  assert.throws(() => openStore(directory), /still settling/)
})

test('history ordering remains correct after insertion, settlement and restart', (t) => {
  const directory = fixture(t)
  let store = openStore(directory)
  const records = [1, 3, 2].map((day) => ({
    ...attempt(),
    startedAt: '2026-09-0' + day + 'T00:00:00.000Z'
  }))
  for (const record of records) store.save(record)
  const ids = [records[1].id, records[2].id, records[0].id]
  assert.deepEqual(
    store.list().map((item) => item.id),
    ids
  )
  store.save({ ...records[2], phase: 'cancelled' })
  assert.deepEqual(
    store.list(2).map((item) => item.id),
    ids.slice(0, 2)
  )
  assert.equal(store.list(2)[1].phase, 'cancelled')
  store.close()
  store = openStore(directory)
  assert.deepEqual(
    store.list().map((item) => item.id),
    ids
  )
  assert.equal(store.list()[1].phase, 'cancelled')
  store.close()
})
test('restart rejects symlinked attempt directories before writing recovery', (t) => {
  const directory = fixture(t)
  const target = fixture(t)
  const record = attempt()
  fs.writeFileSync(path.join(target, 'record.json'), JSON.stringify(record))
  fs.symlinkSync(target, path.join(directory, record.id))
  assert.throws(() => openStore(directory), /Symlinked attempt directory/)
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(target, 'record.json'))).phase,
    'running'
  )
})

test('mapping and decision commit together and an interrupted write cannot accept a proposal', (t) => {
  const directory = fixture(t)
  const store = openStore(directory)
  const accepted = require('../contracts.cjs').loadContract(
    path.resolve(__dirname, '../../../..')
  )
  const state = { format: 1, revision: 1, accepted, reviews: [] }
  store.saveMapping(state)
  const rename = t.mock.method(fs, 'renameSync', () => {
    throw new Error('simulated interrupted rename')
  })
  assert.throws(
    () => store.saveMapping({ ...state, revision: 2 }),
    /interrupted/
  )
  assert.equal(store.mapping().revision, 1)
  rename.mock.restore()
  store.close()
  const recovered = openStore(directory)
  assert.equal(recovered.mapping().revision, 1)
  assert.equal(recovered.mapping().accepted.digest, accepted.digest)
  assert.deepEqual(recovered.mapping().reviews, [])
  assert.ok(Object.isFrozen(recovered.mapping().accepted))
  recovered.close()
})

test('derived attempt format three requires source authority and retains versioned lifecycle without upgrading history', (t) => {
  const directory = fixture(t)
  let store = openStore(directory)
  try {
    const record = { ...attempt(), format: 3, mappingRevision: 1 }
    const repository = path.resolve(__dirname, '../../../..')
    const contract = require('../contracts.cjs').loadContract(repository)
    const source = require('../snapshot.cjs')
    const captured = source.captureSource(
      repository,
      path.join(directory, record.id),
      contract
    )
    const generated = source.createDerivedExecution({
      sourceRoot: captured.sourceRoot,
      verificationSource: captured.verificationSource
    })
    Object.assign(record, {
      contractDigest: contract.digest,
      sourceContract: {
        definition: contract.definition,
        architectureDefinition: contract.architectureDefinition
      },
      snapshot: { ...captured, executionSource: generated.executionSource }
    })
    assert.doesNotThrow(
      () => store.save(record),
      'store shape is not full source admission'
    )
    const legacy = {
      ...attempt(),
      format: 2,
      mappingRevision: 1,
      contractDigest: contract.digest
    }
    store.save(legacy)
    for (const [label, mutate] of [
      ['missing format', (value) => Reflect.deleteProperty(value, 'format')],
      [
        'null format',
        (value) => {
          value.format = null
        }
      ],
      [
        'unknown format',
        (value) => {
          value.format = 4
        }
      ],
      [
        'missing contract',
        (value) => Reflect.deleteProperty(value, 'sourceContract')
      ],
      [
        'missing descriptor',
        (value) => Reflect.deleteProperty(value.snapshot, 'executionSource')
      ],
      [
        'invalid mapping revision',
        (value) => {
          value.mappingRevision = 0
        }
      ],
      [
        'invalid contract digest',
        (value) => {
          value.contractDigest = 'wrong'
        }
      ]
    ]) {
      const invalid = structuredClone(record)
      mutate(invalid)
      assert.throws(() => store.save(invalid), /Invalid|source|derived/i, label)
    }
    for (const key of [
      'runtimeSource',
      'verificationSource',
      'executionSource'
    ]) {
      for (const value of [null, [], 'present', true]) {
        const invalid = structuredClone(record)
        invalid.snapshot[key] = value
        assert.throws(() => store.save(invalid), /Invalid|source|derived/i, key)
      }
    }
    for (const key of ['definition', 'architectureDefinition']) {
      const invalid = structuredClone(record)
      invalid.sourceContract[key] = []
      assert.throws(() => store.save(invalid), /Invalid|source|derived/i, key)
    }
    store.close()
    store = openStore(directory)
    assert.equal(store.get(record.id).format, 3)
    assert.equal(store.get(record.id).phase, 'interrupted')
    assert.equal(store.get(legacy.id).format, 2)
  } finally {
    store.close()
  }
})
