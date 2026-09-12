/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { randomUUID } = require('node:crypto')
const evidenceOwner = require('../evidence.cjs')
const sourceOwner = require('../snapshot.cjs')
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

test('runtime source admission uses captured files once and reloads one server-owned manifest without work on reads or replay', async (t) => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  const validate = t.mock.method(sourceOwner, 'validateRuntimeSource')
  const assess = t.mock.method(evidenceOwner, 'assessEvidence')
  const read = t.mock.method(fs, 'readFileSync')
  const manifestReads = () =>
    read.mock.calls.filter((call) =>
      String(call.arguments[0]).endsWith('/source-manifest.json')
    ).length
  try {
    const requestId = randomUUID()
    const id = service.start({ requestId }, LOCAL_ACTOR)
    const record = await service.wait(id)
    assert.equal(record.evidence.status, 'passed')
    assert.equal(
      validate.mock.callCount(),
      1,
      'live capture has one source admission'
    )
    assert.equal(manifestReads(), 0, 'live admission reuses captured files')
    const admission = assess.mock.calls[0].arguments[5]
    assert.equal(admission.attemptId, id)
    assert.equal(admission.repository, fs.realpathSync(root))
    assert.equal(admission.head, record.snapshot.head)
    assert.equal(admission.sourceDigest, record.snapshot.digest)
    assert.equal(
      admission.runtimeSource.digest,
      record.snapshot.runtimeSource.digest
    )
    assert.ok(Object.isFrozen(admission))
    await service.close()
    service = createService(root, { directory: dir })
    assert.equal(
      validate.mock.callCount(),
      2,
      'startup admits the retained source once'
    )
    assert.equal(manifestReads(), 1)
    for (let i = 0; i < 25; i++) {
      service.state()
      assert.equal(service.get(id).evidence.status, 'passed')
      assert.equal(service.start({ requestId }, LOCAL_ACTOR), id)
    }
    assert.equal(validate.mock.callCount(), 2)
    assert.equal(manifestReads(), 1)
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('invalid live runtime source is rejected before runner dispatch and cannot lend admission to another attempt', async () => {
  const dir = directory()
  let invalid = 'null'
  let runs = 0
  const service = createService(root, {
    directory: dir,
    capture: (...args) => {
      const snapshot = sourceOwner.captureSource(...args)
      if (invalid === 'null') return { ...snapshot, runtimeSource: null }
      if (invalid === 'missing-files') {
        const incomplete = { ...snapshot }
        delete incomplete.files
        return incomplete
      }
      return snapshot
    },
    runner: async () => {
      runs++
      return {
        code: null,
        reason: 'containment-unavailable',
        report: null,
        output: ''
      }
    }
  })
  try {
    const rejected = await service.wait(service.start({}, LOCAL_ACTOR))
    assert.equal(rejected.phase, 'error')
    assert.equal(runs, 0)
    assert.match(rejected.error, /runtime/i)
    invalid = 'missing-files'
    const incomplete = await service.wait(service.start({}, LOCAL_ACTOR))
    assert.equal(
      runs,
      0,
      'incomplete live capture must not reread a manifest and dispatch'
    )
    assert.match(incomplete.error, /manifest/i)
    invalid = false
    const next = await service.wait(service.start({}, LOCAL_ACTOR))
    assert.notEqual(next.id, rejected.id)
    assert.equal(runs, 1)
    assert.equal(next.phase, 'error')
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('retained runtime source admission rejects corrupt or unsafe manifests and recovers without residual ownership', async (t) => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  try {
    const record = await service.wait(service.start({}, LOCAL_ACTOR))
    assert.equal(record.evidence.status, 'passed')
    await service.close()
    const manifest = path.join(dir, record.id, 'source-manifest.json')
    const bytes = fs.readFileSync(manifest)
    const recordFile = path.join(dir, record.id, 'record.json')
    const recordBytes = fs.readFileSync(recordFile)
    const restore = () => {
      fs.rmSync(manifest, { force: true })
      fs.writeFileSync(manifest, bytes)
      fs.writeFileSync(recordFile, recordBytes)
    }
    for (const [name, corrupt] of [
      ['missing manifest', () => fs.rmSync(manifest)],
      [
        'changed artifact bytes',
        () => {
          fs.rmSync(manifest)
          fs.writeFileSync(manifest, Buffer.concat([bytes, Buffer.from('\n')]))
        }
      ],
      [
        'oversized manifest',
        () => {
          fs.rmSync(manifest)
          fs.writeFileSync(manifest, Buffer.alloc(2097153))
        }
      ],
      [
        'symlinked manifest',
        () => {
          fs.rmSync(manifest)
          fs.symlinkSync(path.join(root, 'package.json'), manifest)
        }
      ],
      [
        'present null runtime identity',
        () => {
          const value = JSON.parse(recordBytes)
          value.snapshot.runtimeSource = null
          fs.writeFileSync(recordFile, JSON.stringify(value))
        }
      ],
      [
        'unsupported runtime format',
        () => {
          const value = JSON.parse(recordBytes)
          value.snapshot.runtimeSource.format = 2
          fs.writeFileSync(recordFile, JSON.stringify(value))
        }
      ]
    ]) {
      corrupt()
      assert.throws(
        () => createService(root, { directory: dir }),
        /source|manifest|artifact|symlink|ENOENT|runtime/i,
        name
      )
      assert.equal(
        fs.readdirSync(dir).some((file) => file.startsWith('claim-')),
        false,
        name
      )
      restore()
      service = createService(root, { directory: dir })
      assert.equal(service.get(record.id).evidence.status, 'passed')
      await service.close()
    }
    const forged = JSON.parse(recordBytes)
    forged.snapshot.manifestPath = '../../caller-selected-manifest.json'
    fs.writeFileSync(recordFile, JSON.stringify(forged))
    const read = t.mock.method(fs, 'readFileSync')
    service = createService(root, { directory: dir })
    assert.equal(service.get(record.id).evidence.status, 'passed')
    assert.equal(
      read.mock.calls.some((call) =>
        String(call.arguments[0]).includes('caller-selected-manifest')
      ),
      false
    )
    assert.equal(
      read.mock.calls.filter((call) => String(call.arguments[0]) === manifest)
        .length,
      1
    )
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('historical absence of runtime source never triggers new manifest reads or runtime admission', async (t) => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  try {
    const record = await service.wait(service.start({}, LOCAL_ACTOR))
    await service.close()
    const file = path.join(dir, record.id, 'record.json')
    const historical = JSON.parse(fs.readFileSync(file))
    delete historical.snapshot.runtimeSource
    delete historical.runner.identity.runtimeSourceDigest
    delete historical.evidence.runtimeSourceDigest
    fs.writeFileSync(file, JSON.stringify(historical))
    fs.rmSync(path.join(dir, record.id, 'source-manifest.json'))
    const validate = t.mock.method(sourceOwner, 'validateRuntimeSource')
    const read = t.mock.method(fs, 'readFileSync')
    service = createService(root, { directory: dir })
    assert.equal(service.get(record.id).evidence.status, 'passed')
    assert.equal(
      Object.hasOwn(service.get(record.id).snapshot, 'runtimeSource'),
      false
    )
    assert.equal(validate.mock.callCount(), 0)
    assert.equal(
      read.mock.calls.some((call) =>
        String(call.arguments[0]).endsWith('/source-manifest.json')
      ),
      false
    )
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
