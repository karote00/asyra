/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { randomUUID } = require('node:crypto')
const evidenceOwner = require('../evidence.cjs')
const { createService, LOCAL_ACTOR } = require('../service.cjs')
const root = path.resolve(__dirname, '../../../..')
const parent = path.join(root, 'tmp/flow-inspector/service-tests')
const directory = () => {
  fs.mkdirSync(parent, { recursive: true })
  return fs.mkdtempSync(path.join(parent, 'store-'))
}

test('denied and invalid actions have zero capture and execution effects', async () => {
  const dir = directory()
  let captures = 0
  let executions = 0
  const service = createService(root, {
    directory: dir,
    capture: () => captures++,
    runner: () => executions++
  })
  try {
    assert.throws(
      () => service.start({}, { id: 'viewer', capabilities: [] }),
      /authorized/
    )
    for (const input of [
      { scenario: 'shell' },
      { command: 'rm' },
      { flowIds: [] },
      { flowIds: ['missing'] }
    ])
      assert.throws(() => service.start(input, LOCAL_ACTOR))
    assert.equal(captures, 0)
    assert.equal(executions, 0)
    assert.deepEqual(service.state().runs, [])
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('real baseline, precise cross-flow regression, and recovery retain separate attempts', async () => {
  const dir = directory()
  const service = createService(root, { directory: dir })
  try {
    const baselineId = service.start({}, LOCAL_ACTOR)
    assert.throws(() => service.start({}, LOCAL_ACTOR), /already running/)
    const baseline = await service.wait(baselineId)
    assert.equal(baseline.evidence.status, 'passed', JSON.stringify(baseline))
    const negative = await service.wait(
      service.start({ scenario: 'inverse-regression' }, LOCAL_ACTOR)
    )
    assert.equal(negative.evidence.flows[0].status, 'passed')
    assert.equal(negative.evidence.flows[1].status, 'failed')
    assert.deepEqual(
      negative.evidence.cases
        .filter((item) => item.status === 'failed')
        .map((item) => item.id)
        .sort(),
      ['cancel.delivery', 'cancel.outcome']
    )
    assert.deepEqual(negative.evidence.issues, [])
    const recovered = await service.wait(service.start({}, LOCAL_ACTOR))
    assert.equal(recovered.evidence.status, 'passed')
    assert.equal(baseline.snapshot.digest, recovered.snapshot.digest)
    assert.notEqual(baseline.id, recovered.id)
    assert.equal(service.get(negative.id).evidence.status, 'failed')
    assert.equal(service.state().runs.length, 3)
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('cancellation settles before a subsequent attempt is admitted', async () => {
  const dir = directory()
  let starts = 0
  const service = createService(root, {
    directory: dir,
    runner: async ({ signal }) => {
      starts++
      if (!signal.aborted)
        await new Promise((resolve) =>
          signal.addEventListener('abort', resolve, { once: true })
        )
      return { code: null, reason: 'cancelled', report: null, output: '' }
    }
  })
  try {
    const id = service.start({}, LOCAL_ACTOR)
    await Promise.resolve()
    const record = await service.cancel(id, LOCAL_ACTOR)
    assert.equal(record.phase, 'cancelled')
    assert.equal(service.state().activeRunId, null)
    assert.equal(starts, 1)
    assert.equal(service.get(id).audit.at(-1).event, 'runner-settled')
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('historical evidence keeps its identity without certifying a different current contract', async () => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  try {
    const record = await service.wait(service.start({}, LOCAL_ACTOR))
    assert.equal(service.get(record.id).matchesCurrentContract, true)
    await service.close()
    const recordPath = path.join(dir, record.id, 'record.json')
    // A fixture representing a valid retained result from an older contract.
    const historical = JSON.parse(fs.readFileSync(recordPath))
    historical.snapshot.contractDigest = '0'.repeat(64)
    historical.contractDigest = historical.snapshot.contractDigest
    historical.runner.identity.contractDigest =
      historical.snapshot.contractDigest
    fs.writeFileSync(recordPath, JSON.stringify(historical))
    service = createService(root, { directory: dir })
    const retained = service.get(record.id)
    assert.equal(retained.matchesCurrentContract, false)
    assert.equal(retained.evidence.status, 'passed')
    assert.equal(retained.snapshot.digest, record.snapshot.digest)
    assert.equal(retained.id, record.id)
    await service.close()
    // A truncated result must not become a smaller, apparently passing proof
    // merely because its counters were also truncated.
    const incomplete = structuredClone(record)
    incomplete.evidence.cases.pop()
    incomplete.evidence.expectedCount--
    incomplete.evidence.passedCount--
    fs.writeFileSync(recordPath, JSON.stringify(incomplete))
    assert.throws(
      () => createService(root, { directory: dir }),
      /Stored evidence inventory/
    )
    for (const invalidRunner of [{ code: 1 }, { reason: 'cancelled' }]) {
      const invalid = structuredClone(record)
      Object.assign(invalid.runner, invalidRunner)
      fs.writeFileSync(recordPath, JSON.stringify(invalid))
      assert.throws(
        () => createService(root, { directory: dir }),
        /Invalid persisted execution provenance/
      )
    }
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('request replay executes once across restart and polling never revalidates admitted evidence', async (t) => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  const requestId = randomUUID()
  try {
    const id = service.start({ requestId }, LOCAL_ACTOR)
    assert.equal(service.start({ requestId }, LOCAL_ACTOR), id)
    const record = await service.wait(id)
    assert.equal(record.evidence.status, 'passed')
    assert.equal(service.start({ requestId }, LOCAL_ACTOR), id)
    assert.equal(service.state().runs.length, 1)
    assert.throws(
      () =>
        service.start(
          { requestId, flowIds: ['deferred-publication'] },
          LOCAL_ACTOR
        ),
      /conflicts/
    )
    await service.close()
    service = createService(root, { directory: dir })
    const validate = t.mock.method(evidenceOwner, 'validateStoredEvidence')
    const read = t.mock.method(fs, 'readFileSync')
    for (let i = 0; i < 25; i++) {
      assert.equal(service.get(id).evidence.status, 'passed')
      service.state()
    }
    assert.equal(validate.mock.callCount(), 0)
    assert.equal(read.mock.callCount(), 0)
    assert.equal(service.start({ requestId }, LOCAL_ACTOR), id)
    assert.equal(service.state().runs.length, 1)
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('admission detaches caller-owned flow selection before asynchronous execution', async () => {
  const dir = directory()
  const service = createService(root, { directory: dir })
  try {
    const flowIds = ['deferred-publication']
    const id = service.start({ flowIds }, LOCAL_ACTOR)
    flowIds.push('immediate-cancellation')
    const record = await service.wait(id)
    assert.equal(record.evidence?.status, 'passed', JSON.stringify(record))
    assert.equal(record.evidence.expectedCount, 3)
    assert.deepEqual(record.runner.identity.flowIds, ['deferred-publication'])
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
