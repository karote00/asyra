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
    delete historical.sourceContract
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
  const validate = t.mock.method(sourceOwner, 'validateSourceSnapshot')
  const runtimeOnly = t.mock.method(sourceOwner, 'validateRuntimeSource')
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
    assert.deepEqual(record.sourceContract, {
      definition: validate.mock.calls[0].arguments[1].definition,
      architectureDefinition:
        validate.mock.calls[0].arguments[1].architectureDefinition
    })
    assert.deepEqual(
      admission.verificationSource,
      record.snapshot.verificationSource
    )
    assert.equal(
      admission.configurationDigest,
      record.snapshot.configurationDigest
    )
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
    assert.equal(
      runtimeOnly.mock.callCount(),
      0,
      'combined admission must not invoke another runtime admission'
    )
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
      if (invalid === 'missing-runtime') {
        const incomplete = { ...snapshot }
        delete incomplete.runtimeSource
        return incomplete
      }
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
    invalid = 'missing-runtime'
    const missingRuntime = await service.wait(service.start({}, LOCAL_ACTOR))
    assert.equal(runs, 0)
    assert.equal(missingRuntime.phase, 'error')
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
    delete historical.sourceContract
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

test('combined source admission rejects conflicting new authority and keeps absent historical authority runtime-only', async (t) => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  try {
    const record = await service.wait(service.start({}, LOCAL_ACTOR))
    await service.close()
    const file = path.join(dir, record.id, 'record.json')
    const original = JSON.parse(fs.readFileSync(file))
    assert.ok(Object.hasOwn(original, 'sourceContract'))
    for (const corrupt of [
      (value) => {
        value.sourceContract = null
      },
      (value) => {
        value.sourceContract.definition = {}
      },
      (value) => {
        value.contractDigest = '0'.repeat(64)
      },
      (value) => {
        delete value.snapshot.verificationSource
      },
      (value) => {
        value.snapshot.verificationSource = null
      },
      (value) => {
        value.snapshot.configurationDigest = '0'.repeat(64)
      }
    ]) {
      const changed = structuredClone(original)
      corrupt(changed)
      fs.writeFileSync(file, JSON.stringify(changed))
      assert.throws(
        () => createService(root, { directory: dir }),
        /contract|source|configuration|provenance/i
      )
    }
    const historical = structuredClone(original)
    delete historical.sourceContract
    historical.snapshot.verificationSource = null
    fs.writeFileSync(file, JSON.stringify(historical))
    const combined = t.mock.method(sourceOwner, 'validateSourceSnapshot')
    const stored = t.mock.method(evidenceOwner, 'validateStoredEvidence')
    service = createService(root, { directory: dir })
    assert.equal(service.get(record.id).evidence.status, 'passed')
    assert.equal(combined.mock.callCount(), 0)
    assert.equal(
      Object.hasOwn(stored.mock.calls[0].arguments[2], 'verificationSource'),
      false
    )
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('failure before capture produces no authority and remains readable after restart', async () => {
  const dir = directory()
  let service = createService(root, {
    directory: dir,
    capture() {
      throw new Error('capture failed before snapshot')
    }
  })
  try {
    const record = await service.wait(service.start({}, LOCAL_ACTOR))
    assert.equal(record.phase, 'error')
    assert.ok(Object.hasOwn(record, 'sourceContract'))
    assert.equal(Object.hasOwn(record, 'snapshot'), false)
    await service.close()
    service = createService(root, { directory: dir })
    assert.equal(service.get(record.id).phase, 'error')
    await service.close()
    const file = path.join(dir, record.id, 'record.json')
    const interrupted = JSON.parse(fs.readFileSync(file))
    interrupted.phase = 'running'
    delete interrupted.finishedAt
    fs.writeFileSync(file, JSON.stringify(interrupted))
    service = createService(root, { directory: dir })
    assert.equal(service.get(record.id).phase, 'interrupted')
    assert.equal(Object.hasOwn(service.get(record.id), 'snapshot'), false)
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

function referenceFixture() {
  const dir = directory()
  const contract = require('../contracts.cjs').loadContract(root)
  const snapshot = sourceOwner.captureSource(
    root,
    path.join(dir, 'initial'),
    contract
  )
  const repository = snapshot.sourceRoot
  return { dir, contract, repository, runs: path.join(repository, 'runs') }
}

test('source-aware version preparation binds retained bytes and exact current base with one reference admission per lifetime', async (t) => {
  const f = referenceFixture()
  let service = createService(f.repository, { directory: f.runs })
  const verify = t.mock.method(sourceOwner, 'verifyRetainedSource')
  try {
    const record = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    assert.equal(record.evidence.status, 'passed')
    const file = path.join(f.repository, f.contract.testFile)
    const original = fs.readFileSync(file)
    fs.chmodSync(file, 0o644)
    fs.writeFileSync(
      file,
      'throw new Error("checkout is not the captured verifier")'
    )
    const review = service.prepareEvolution(
      { attemptId: record.id },
      LOCAL_ACTOR
    )
    assert.equal(
      review.candidate.verificationSource.sourceDigest,
      record.snapshot.digest
    )
    assert.deepEqual(
      review.candidate.verificationSource.descriptor,
      record.snapshot.verificationSource
    )
    assert.equal(verify.mock.callCount(), 1)
    const read = t.mock.method(fs, 'readFileSync')
    for (let i = 0; i < 10; i++) {
      assert.equal(
        service.prepareEvolution({ attemptId: record.id }, LOCAL_ACTOR).id,
        review.id
      )
      service.state()
    }
    assert.equal(read.mock.callCount(), 0)
    read.mock.restore()
    fs.writeFileSync(file, original)
    service.decideEvolution(
      {
        id: review.id,
        decision: 'accept',
        reason: 'Explicit captured version acceptance'
      },
      LOCAL_ACTOR
    )
    const next = service.prepareEvolution({ attemptId: record.id }, LOCAL_ACTOR)
    assert.notEqual(next.id, review.id)
    assert.equal(next.baseRevision, 2)
    assert.equal(verify.mock.callCount(), 1)
    await service.close()
    service = createService(f.repository, { directory: f.runs })
    assert.equal(
      verify.mock.callCount(),
      2,
      'multiple retained version/review references to one attempt read bytes once on restart'
    )
    const resumedRead = t.mock.method(fs, 'readFileSync')
    assert.equal(
      service.prepareEvolution({ attemptId: record.id }, LOCAL_ACTOR).id,
      next.id
    )
    service.state()
    assert.equal(resumedRead.mock.callCount(), 0)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('unavailable retained reference bytes preserve history but cannot authorize a new-base review', async () => {
  const f = referenceFixture()
  let service = createService(f.repository, { directory: f.runs })
  try {
    const record = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const review = service.prepareEvolution(
      { attemptId: record.id },
      LOCAL_ACTOR
    )
    service.decideEvolution(
      {
        id: review.id,
        decision: 'accept',
        reason: 'Explicit reference retention'
      },
      LOCAL_ACTOR
    )
    await service.close()
    fs.rmSync(path.join(f.runs, record.id, 'source', f.contract.configFile))
    service = createService(f.repository, { directory: f.runs })
    assert.equal(service.get(record.id).evidence.status, 'passed')
    assert.equal(service.state().evolution.revision, 2)
    assert.throws(
      () => service.prepareEvolution({ attemptId: record.id }, LOCAL_ACTOR),
      /unavailable|source/i
    )
    assert.equal(service.state().evolution.revision, 2)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('historical candidate preparation remains standalone without a verification reference', async (t) => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  try {
    const record = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    await service.close()
    const file = path.join(dir, record.id, 'record.json')
    const historical = JSON.parse(fs.readFileSync(file))
    delete historical.sourceContract
    fs.writeFileSync(file, JSON.stringify(historical))
    const verify = t.mock.method(sourceOwner, 'verifyRetainedSource')
    service = createService(root, { directory: dir })
    const review = service.prepareEvolution(
      { attemptId: record.id },
      LOCAL_ACTOR
    )
    assert.equal(Object.hasOwn(review.candidate, 'verificationSource'), false)
    assert.equal(verify.mock.callCount(), 0)
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('source-aware attempts with an older no-reference review prepare a new authoritative candidate without rewriting history', async (t) => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  try {
    const record = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const current = service.prepareEvolution(
      { attemptId: record.id },
      LOCAL_ACTOR
    )
    await service.close()
    const file = path.join(dir, 'mapping.json')
    const mapping = JSON.parse(fs.readFileSync(file))
    const candidate = structuredClone(current.candidate)
    delete candidate.verificationSource
    const legacy = {
      ...require('../evolution.cjs').compareVersion(
        mapping.evolution.history,
        candidate
      ),
      candidate,
      attemptId: record.id,
      status: 'pending'
    }
    mapping.evolution.reviews = [legacy]
    fs.writeFileSync(file, JSON.stringify(mapping))
    const verify = t.mock.method(sourceOwner, 'verifyRetainedSource')
    service = createService(root, { directory: dir })
    assert.equal(verify.mock.callCount(), 0)
    const upgraded = service.prepareEvolution(
      { attemptId: record.id },
      LOCAL_ACTOR
    )
    assert.ok(upgraded.candidate.verificationSource)
    assert.notEqual(upgraded.id, legacy.id)
    assert.equal(verify.mock.callCount(), 1)
    const saved = JSON.parse(fs.readFileSync(file))
    assert.deepEqual(saved.evolution.reviews[0], legacy)
    const read = t.mock.method(fs, 'readFileSync')
    assert.equal(
      service.prepareEvolution({ attemptId: record.id }, LOCAL_ACTOR).id,
      upgraded.id
    )
    assert.equal(read.mock.callCount(), 0)
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

function pinnedTargetRequest(service, review, requestId = randomUUID()) {
  const contract = service.contract()
  const flow = contract.flows[0]
  return {
    action: 'create',
    requestId,
    expectedRevision: 0,
    reason: 'Bind the exact reviewed verification source',
    flowId: flow.id,
    targetRevision: contract.digest,
    targetReviewId: review.id,
    acceptedBaseline: {
      revision: service.state().evolution.revision,
      contractDigest: contract.digest
    },
    objective: 'Develop the frozen reviewed flow',
    works: [],
    pending: contract.cases
      .filter((item) => item.flowId === flow.id)
      .map((item) => item.id)
  }
}

test('service supplies exact old-base reviewed pairs and separates historical targets from current byte availability', async (t) => {
  const f = referenceFixture()
  let service = createService(f.repository, { directory: f.runs })
  try {
    const record = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const review = service.prepareEvolution(
      { attemptId: record.id },
      LOCAL_ACTOR
    )
    const publicReview = service
      .state()
      .evolution.reviews.find((item) => item.id === review.id)
    assert.equal(publicReview.candidateDigest, review.candidateDigest)
    assert.equal(
      publicReview.candidateContractDigest,
      review.candidate.contract.digest
    )
    service.decideEvolution(
      {
        id: review.id,
        decision: 'accept',
        reason: 'Explicit initial reference version'
      },
      LOCAL_ACTOR
    )
    const request = pinnedTargetRequest(service, review)
    const created = service.decideTarget(request, LOCAL_ACTOR)
    assert.deepEqual(service.getTarget(created.id).targetVerification, {
      reviewId: review.id,
      candidateDigest: review.candidateDigest
    })
    await service.close()
    fs.rmSync(path.join(f.runs, record.id, 'source', f.contract.configFile))
    const compare = t.mock.method(require('../evolution.cjs'), 'compareVersion')
    const verify = t.mock.method(sourceOwner, 'verifyRetainedSource')
    service = createService(f.repository, { directory: f.runs })
    assert.equal(compare.mock.callCount(), 1)
    assert.equal(verify.mock.callCount(), 1)
    const read = t.mock.method(fs, 'readFileSync')
    for (let i = 0; i < 10; i++) {
      assert.deepEqual(service.decideTarget(request, LOCAL_ACTOR), created)
      service.getTarget(created.id)
      service.targets()
    }
    assert.equal(read.mock.callCount(), 0)
    assert.equal(compare.mock.callCount(), 1)
    assert.equal(verify.mock.callCount(), 1)
    assert.throws(
      () =>
        service.decideTarget(pinnedTargetRequest(service, review), LOCAL_ACTOR),
      /unavailable/i
    )
    assert.equal(service.targets().records.length, 1)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('service re-admits every retained version-review owner field and preserves exact rejected historical pins', async () => {
  const dir = directory()
  let service = createService(root, { directory: dir })
  try {
    const record = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const review = service.prepareEvolution(
      { attemptId: record.id },
      LOCAL_ACTOR
    )
    const created = service.decideTarget(
      pinnedTargetRequest(service, review),
      LOCAL_ACTOR
    )
    service.decideEvolution(
      {
        id: review.id,
        decision: 'reject',
        reason: 'Retain target source without accepting it'
      },
      LOCAL_ACTOR
    )
    await service.close()
    service = createService(root, { directory: dir })
    assert.equal(
      service.getTarget(created.id).targetVerification.reviewId,
      review.id
    )
    await service.close()
    const file = path.join(dir, 'mapping.json')
    const original = JSON.parse(fs.readFileSync(file))
    for (const mutate of [
      (value) => {
        value.candidateDigest = '0'.repeat(64)
      },
      (value) => {
        value.baseRevision = 0
      },
      (value) => {
        value.changes = []
      },
      (value) => {
        value.relations = [{ kind: 'invalid' }]
      },
      (value) => {
        value.status = 'accept'
      },
      (value) => {
        value.attemptId = randomUUID()
      }
    ]) {
      const changed = structuredClone(original)
      mutate(changed.evolution.reviews[0])
      fs.writeFileSync(file, JSON.stringify(changed))
      assert.throws(
        () => createService(root, { directory: dir }),
        /review|relation|attempt|version/i
      )
    }
    fs.writeFileSync(file, JSON.stringify(original))
    service = createService(root, { directory: dir })
    assert.equal(
      service.getTarget(created.id).targetVerification.candidateDigest,
      review.candidateDigest
    )
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('target review admission is detached from the candidate returned to a direct preparation caller', async () => {
  const dir = directory()
  const service = createService(root, { directory: dir })
  try {
    const record = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const review = service.prepareEvolution(
      { attemptId: record.id },
      LOCAL_ACTOR
    )
    const digest = review.candidateDigest
    review.candidate.verificationSource = null
    const created = service.decideTarget(
      pinnedTargetRequest(service, review),
      LOCAL_ACTOR
    )
    assert.equal(
      service.getTarget(created.id).targetVerification.candidateDigest,
      digest
    )
  } finally {
    await service.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('service pins exact accepted history independently of legacy mapping revision and later same-contract configuration versions', async () => {
  const f = referenceFixture()
  let service = createService(f.repository, { directory: f.runs })
  try {
    await service.close()
    const mappingFile = path.join(f.runs, 'mapping.json')
    const legacy = JSON.parse(fs.readFileSync(mappingFile))
    legacy.revision = 5
    delete legacy.evolution
    fs.writeFileSync(mappingFile, JSON.stringify(legacy))
    service = createService(f.repository, { directory: f.runs })
    assert.equal(service.state().evolution.revision, 1)
    const first = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const firstReview = service.prepareEvolution(
      { attemptId: first.id },
      LOCAL_ACTOR
    )
    const firstRequest = {
      ...pinnedTargetRequest(service, firstReview),
      acceptedBaseline: { revision: 5, contractDigest: f.contract.digest }
    }
    const firstTarget = service.decideTarget(firstRequest, LOCAL_ACTOR)
    assert.deepEqual(service.getTarget(firstTarget.id).acceptedVersion, {
      revision: 1,
      contractDigest: f.contract.digest
    })
    assert.equal(service.getTarget(firstTarget.id).acceptedBaseline.revision, 5)

    const config = path.join(f.repository, f.contract.configFile)
    fs.chmodSync(config, 0o644)
    fs.appendFileSync(
      config,
      '\n// explicit new accepted configuration bytes\n'
    )
    const second = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    assert.equal(second.evidence.status, 'passed')
    assert.notEqual(
      first.snapshot.configurationDigest,
      second.snapshot.configurationDigest
    )
    const secondReview = service.prepareEvolution(
      { attemptId: second.id },
      LOCAL_ACTOR
    )
    service.decideEvolution(
      {
        id: secondReview.id,
        decision: 'accept',
        reason: 'Explicit new accepted verifier'
      },
      LOCAL_ACTOR
    )
    const secondRequest = {
      ...pinnedTargetRequest(service, secondReview),
      acceptedBaseline: { revision: 6, contractDigest: f.contract.digest }
    }
    const secondTarget = service.decideTarget(secondRequest, LOCAL_ACTOR)
    assert.equal(service.getTarget(secondTarget.id).acceptedVersion.revision, 2)
    await service.close()
    service = createService(f.repository, { directory: f.runs })
    assert.equal(service.getTarget(firstTarget.id).acceptedVersion.revision, 1)
    assert.equal(service.getTarget(secondTarget.id).acceptedVersion.revision, 2)
    assert.deepEqual(
      service.decideTarget(firstRequest, LOCAL_ACTOR),
      firstTarget
    )
    await service.close()

    // Prior consumers retained neither copy; reopening must not upgrade them.
    const targetsFile = path.join(f.runs, 'targets.json')
    const targets = JSON.parse(fs.readFileSync(targetsFile))
    delete targets.records[0].acceptedVersion
    delete targets.records[0].history[0].acceptedVersion
    fs.writeFileSync(targetsFile, JSON.stringify(targets))
    service = createService(f.repository, { directory: f.runs })
    assert.equal(
      Object.hasOwn(service.getTarget(firstTarget.id), 'acceptedVersion'),
      false
    )
    assert.equal(service.getTarget(secondTarget.id).acceptedVersion.revision, 2)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('target proof production composes exact accepted and developing bundles with own-contract retention and no baseline promotion', async (t) => {
  const f = referenceFixture()
  let service = createService(f.repository, { directory: f.runs })
  try {
    const accepted = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const acceptedReview = service.prepareEvolution(
      { attemptId: accepted.id },
      LOCAL_ACTOR
    )
    service.decideEvolution(
      {
        id: acceptedReview.id,
        decision: 'accept',
        reason: 'Explicit retained accepted verifier'
      },
      LOCAL_ACTOR
    )
    const manifest = path.join(f.repository, f.contract.manifestPath)
    const definition = JSON.parse(fs.readFileSync(manifest))
    definition.flows[0].title += ' - Target proof'
    fs.chmodSync(manifest, 0o600)
    fs.writeFileSync(manifest, JSON.stringify(definition))
    const config = path.join(f.repository, f.contract.configFile)
    fs.chmodSync(config, 0o600)
    fs.appendFileSync(config, '\n// Frozen developing configuration\n')
    const developing = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const review = service.prepareEvolution(
      { attemptId: developing.id },
      LOCAL_ACTOR
    )
    const target = service.decideTarget(
      {
        ...pinnedTargetRequest(service, review),
        targetRevision: review.candidate.contract.digest
      },
      LOCAL_ACTOR
    )
    const request = {
      requestId: randomUUID(),
      targetId: target.id,
      allocationRevision: 1,
      sourceAttemptId: developing.id,
      role: 'target'
    }
    const baseline = service.state().shared
    const testFile = path.join(f.repository, f.contract.testFile)
    fs.chmodSync(testFile, 0o600)
    fs.writeFileSync(
      testFile,
      "throw new Error('mutable checkout is not verification authority')\n"
    )
    const targetProof = await service.wait(
      service.startTargetProof(request, LOCAL_ACTOR)
    )
    const acceptedProof = await service.wait(
      service.startTargetProof(
        { ...request, requestId: randomUUID(), role: 'accepted' },
        LOCAL_ACTOR
      )
    )
    for (const record of [acceptedProof, targetProof]) {
      assert.equal(record.phase, 'completed')
      assert.equal(record.evidence.status, 'passed')
      assert.equal(record.mode, 'target-proof')
      assert.equal(record.matchesCurrentContract, false)
      assert.equal(
        record.snapshot.runtimeSource.digest,
        developing.snapshot.runtimeSource.digest
      )
      assert.throws(() =>
        service.prepareEvolution({ attemptId: record.id }, LOCAL_ACTOR)
      )
    }
    assert.equal(
      acceptedProof.snapshot.verificationSource.digest,
      accepted.snapshot.verificationSource.digest
    )
    assert.equal(
      targetProof.snapshot.verificationSource.digest,
      developing.snapshot.verificationSource.digest
    )
    assert.notEqual(
      acceptedProof.snapshot.contractDigest,
      targetProof.snapshot.contractDigest
    )
    assert.equal(service.state().shared.attemptId, baseline.attemptId)
    assert.equal(
      service.state().shared.verificationStatus,
      baseline.verificationStatus
    )
    await service.close()
    fs.rmSync(path.join(f.runs, developing.id, 'source', f.contract.configFile))
    service = createService(f.repository, { directory: f.runs })
    assert.equal(service.get(targetProof.id).evidence.status, 'passed')
    const reads = t.mock.method(fs, 'readFileSync')
    const compose = t.mock.method(sourceOwner, 'composeSource')
    assert.equal(service.startTargetProof(request, LOCAL_ACTOR), targetProof.id)
    assert.equal(reads.mock.callCount(), 0)
    assert.equal(compose.mock.callCount(), 0)
    assert.throws(
      () =>
        service.startTargetProof({ ...request, role: 'accepted' }, LOCAL_ACTOR),
      /conflict/i
    )
    assert.throws(
      () =>
        service.startTargetProof(request, {
          ...LOCAL_ACTOR,
          id: 'different actor'
        }),
      /conflict/i
    )
    assert.throws(
      () =>
        service.startTargetProof(
          { ...request, requestId: randomUUID() },
          LOCAL_ACTOR
        ),
      /unavailable/i
    )
    assert.equal(reads.mock.callCount(), 0)
    reads.mock.restore()
    compose.mock.restore()
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('target proof lifecycle preserves cancellation interruption errors and retained exact verifier selection', async () => {
  const f = referenceFixture()
  let service = createService(f.repository, { directory: f.runs })
  try {
    const accepted = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const acceptedReview = service.prepareEvolution(
      { attemptId: accepted.id },
      LOCAL_ACTOR
    )
    service.decideEvolution(
      {
        id: acceptedReview.id,
        decision: 'accept',
        reason: 'Explicit accepted verification'
      },
      LOCAL_ACTOR
    )
    const config = path.join(f.repository, f.contract.configFile)
    fs.chmodSync(config, 0o600)
    fs.appendFileSync(config, '\n// Distinct target configuration\n')
    const developing = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const review = service.prepareEvolution(
      { attemptId: developing.id },
      LOCAL_ACTOR
    )
    const target = service.decideTarget(
      pinnedTargetRequest(service, review),
      LOCAL_ACTOR
    )
    const request = {
      requestId: randomUUID(),
      targetId: target.id,
      allocationRevision: 1,
      sourceAttemptId: developing.id,
      role: 'target'
    }
    const completed = await service.wait(
      service.startTargetProof(request, LOCAL_ACTOR)
    )
    assert.equal(completed.evidence.status, 'passed')
    await service.close()
    const file = path.join(f.runs, completed.id, 'record.json')
    const original = fs.readFileSync(file)
    for (const mutate of [
      (value) => (value.targetProof.request.role = 'other'),
      (value) => (value.targetProof.request.unknown = true)
    ]) {
      const malformed = JSON.parse(original)
      mutate(malformed)
      fs.writeFileSync(file, JSON.stringify(malformed))
      assert.throws(
        () => createService(f.repository, { directory: f.runs }),
        /target proof|request/i
      )
    }
    const forged = JSON.parse(original)
    forged.targetProof.request.role = 'accepted'
    forged.targetProof.verificationSource =
      acceptedReview.candidate.verificationSource
    fs.writeFileSync(file, JSON.stringify(forged))
    assert.throws(
      () => createService(f.repository, { directory: f.runs }),
      /target proof.*selection/i
    )
    fs.writeFileSync(file, original)
    let executions = 0
    service = createService(f.repository, {
      directory: f.runs,
      runner: async ({ signal }) => {
        executions++
        if (!signal.aborted)
          await new Promise((resolve) =>
            signal.addEventListener('abort', resolve, { once: true })
          )
        return { code: null, reason: 'cancelled', report: null, output: '' }
      }
    })
    const cancellation = service.startTargetProof(
      { ...request, requestId: randomUUID() },
      LOCAL_ACTOR
    )
    const cancelled = await service.cancel(cancellation, LOCAL_ACTOR)
    assert.equal(cancelled.phase, 'cancelled')
    assert.equal(executions, 1)
    await service.close()
    const interruptedFile = path.join(f.runs, cancellation, 'record.json')
    const interrupted = JSON.parse(fs.readFileSync(interruptedFile))
    interrupted.phase = 'running'
    delete interrupted.finishedAt
    fs.writeFileSync(interruptedFile, JSON.stringify(interrupted))
    service = createService(f.repository, {
      directory: f.runs,
      runner: async () => {
        executions++
        return { code: null, reason: 'timeout', report: null, output: '' }
      }
    })
    assert.equal(service.get(cancellation).phase, 'interrupted')
    assert.equal(executions, 1)
    const timed = await service.wait(
      service.startTargetProof(
        { ...request, requestId: randomUUID() },
        LOCAL_ACTOR
      )
    )
    assert.equal(timed.phase, 'timed-out')
    assert.equal(executions, 2)
    // The reference was available at admission; later composition must check its bytes again.
    const retainedConfig = path.join(
      f.runs,
      developing.id,
      'source',
      f.contract.configFile
    )
    fs.chmodSync(retainedConfig, 0o600)
    fs.appendFileSync(
      retainedConfig,
      '\n// Corrupted after reference admission\n'
    )
    const failed = await service.wait(
      service.startTargetProof(
        { ...request, requestId: randomUUID() },
        LOCAL_ACTOR
      )
    )
    assert.equal(failed.phase, 'error')
    assert.equal(failed.snapshot, undefined)
    assert.equal(executions, 2)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

async function assessmentFixture(distinct = true) {
  const f = referenceFixture()
  const service = createService(f.repository, { directory: f.runs })
  const accepted = await service.wait(
    service.start({ mode: 'candidate' }, LOCAL_ACTOR)
  )
  const acceptedReview = service.prepareEvolution(
    { attemptId: accepted.id },
    LOCAL_ACTOR
  )
  service.decideEvolution(
    {
      id: acceptedReview.id,
      decision: 'accept',
      reason: 'Accept retained assessment fixture'
    },
    LOCAL_ACTOR
  )
  let source = accepted,
    review = acceptedReview
  if (distinct) {
    const config = path.join(f.repository, f.contract.configFile)
    fs.chmodSync(config, 0o600)
    fs.appendFileSync(config, '\n// Distinct assessment verifier\n')
    if (distinct === 'failure') {
      const assertions = path.join(f.repository, f.contract.testFile)
      const bytes = fs.readFileSync(assertions, 'utf8')
      fs.chmodSync(assertions, 0o600)
      fs.writeFileSync(
        assertions,
        bytes.replace(
          'expect(deferred.history).toBe(1)',
          'expect(deferred.history).toBe(2)'
        )
      )
    }
    source = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    review = service.prepareEvolution({ attemptId: source.id }, LOCAL_ACTOR)
  }
  const request = pinnedTargetRequest(service, review)
  const obligations = review.candidate.contract.cases.filter(
    (item) => item.flowId === request.flowId
  )
  request.works = obligations.map((item) => ({
    id: randomUUID(),
    title: item.id,
    stepId: item.stepId,
    obligationIds: [item.id],
    scope: 'Prove assigned obligation',
    allowedFiles: ['packages/factory/src/data-transact.ts'],
    prerequisites: []
  }))
  request.pending = []
  const target = service.decideTarget(request, LOCAL_ACTOR)
  return {
    ...f,
    service,
    targetRequest: request,
    request: {
      requestId: randomUUID(),
      targetId: target.id,
      allocationRevision: 1,
      sourceAttemptId: source.id
    }
  }
}

test('assessment registers complete private inventory before dispatch and retains exact results with zero work on replay or reads', async (t) => {
  const f = await assessmentFixture()
  let service = f.service
  const assessor = require('../target-evidence.cjs')
  const assess = t.mock.method(assessor, 'assessTargetSource')
  const project = t.mock.method(assessor, 'projectTargetAssessmentCurrentness')
  try {
    const id = service.startTargetAssessment(f.request, LOCAL_ACTOR)
    const initial = service.getTargetAssessment(id)
    assert.equal(initial.phase, 'running')
    assert.equal(initial.slots.length, 2)
    assert.equal(initial.result.accepted.status, 'unknown')
    assert.equal(initial.result.integration.status, 'unknown')
    assert.equal(assess.mock.callCount(), 1)
    const saved = JSON.parse(
      fs.readFileSync(path.join(f.runs, 'target-assessments.json'))
    )
    assert.equal(saved.records[0].slots.length, 2)
    assert.throws(() => service.start({}, LOCAL_ACTOR), /running|active/)
    assert.equal(service.startTargetAssessment(f.request, LOCAL_ACTOR), id)
    const completed = await service.waitTargetAssessment(id)
    assert.equal(completed.phase, 'completed')
    assert.equal(completed.result.accepted.status, 'passed')
    assert.equal(completed.result.integration.status, 'passed')
    assert.equal(completed.projection.eligible, true)
    assert.equal(assess.mock.callCount(), 3)
    for (const slot of completed.slots)
      assert.equal(service.get(slot.id).targetAssessmentId, id)
    const counts = [assess.mock.callCount(), project.mock.callCount()]
    const reads = t.mock.method(fs, 'readFileSync')
    for (let i = 0; i < 5; i++) {
      service.getTargetAssessment(id)
      service.targetAssessments()
      assert.equal(service.startTargetAssessment(f.request, LOCAL_ACTOR), id)
    }
    assert.deepEqual(
      [assess.mock.callCount(), project.mock.callCount()],
      counts
    )
    assert.equal(reads.mock.callCount(), 0)
    assert.throws(
      () =>
        service.startTargetAssessment(
          { ...f.request, sourceAttemptId: randomUUID() },
          LOCAL_ACTOR
        ),
      /conflict/i
    )
    reads.mock.restore()
    await service.close()
    service = createService(f.repository, { directory: f.runs })
    const restored = service.getTargetAssessment(id)
    assert.deepEqual(restored.result, completed.result)
    assert.equal(restored.projection.eligible, true)
    assert.equal(assess.mock.callCount(), 4)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('assessment registration write failure leaves no ghost request and equivalent roles share one owned slot', async (t) => {
  const f = await assessmentFixture(false)
  const service = f.service
  const assessor = require('../target-evidence.cjs')
  try {
    const rename = fs.renameSync
    const write = t.mock.method(fs, 'renameSync', (from, to) => {
      if (to === path.join(f.runs, 'target-assessments.json'))
        throw new Error('Simulated inventory write failure')
      return rename(from, to)
    })
    assert.throws(
      () => service.startTargetAssessment(f.request, LOCAL_ACTOR),
      /inventory write failure/
    )
    assert.equal(service.targetAssessments().length, 0)
    assert.throws(
      () => service.getTargetAssessment(f.request.requestId),
      /unavailable/
    )
    write.mock.restore()
    const result = await service.waitTargetAssessment(
      service.startTargetAssessment(f.request, LOCAL_ACTOR)
    )
    assert.equal(result.slots.length, 1)
    assert.equal(result.roles.accepted.slotId, result.roles.target.slotId)
    assert.equal(result.projection.eligible, true)
    const assess = t.mock.method(assessor, 'assessTargetSource')
    const project = t.mock.method(
      assessor,
      'projectTargetAssessmentCurrentness'
    )
    service.decideTarget(
      {
        action: 'revise',
        targetId: f.request.targetId,
        requestId: randomUUID(),
        expectedRevision: 1,
        reason: 'Explicit changed allocation',
        objective: f.targetRequest.objective,
        works: f.targetRequest.works,
        pending: []
      },
      LOCAL_ACTOR
    )
    const stale = service.getTargetAssessment(result.id)
    assert.equal(stale.result, result.result)
    assert.equal(stale.projection.eligible, false)
    assert.deepEqual(stale.projection.staleReasons, [
      'Target allocation changed'
    ])
    assert.equal(assess.mock.callCount(), 0)
    assert.equal(project.mock.callCount(), 1)
    service.getTargetAssessment(result.id)
    assert.equal(project.mock.callCount(), 1)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('assessment cancellation preserves completed observations and restart never dispatches unfinished slots', async () => {
  const f = await assessmentFixture()
  let service = f.service
  await service.close()
  let calls = 0,
    entered
  const secondStarted = new Promise((resolve) => {
    entered = resolve
  })
  service = createService(f.repository, {
    directory: f.runs,
    runner: async (options) => {
      calls++
      if (calls === 1) return require('../runner.cjs').runVerification(options)
      entered()
      if (!options.signal.aborted)
        await new Promise((resolve) =>
          options.signal.addEventListener('abort', resolve, { once: true })
        )
      return { code: null, reason: 'cancelled', report: null, output: '' }
    }
  })
  try {
    const id = service.startTargetAssessment(f.request, LOCAL_ACTOR)
    await secondStarted
    const running = service.getTargetAssessment(id)
    assert.equal(running.result.accepted.status, 'passed')
    assert.equal(running.slots[1].phase, 'running')
    const cancelled = await service.cancelTargetAssessment(id, LOCAL_ACTOR)
    assert.equal(cancelled.phase, 'cancelled')
    assert.equal(cancelled.result.accepted.status, 'passed')
    assert.equal(cancelled.result.integration.status, 'unknown')
    assert.equal(calls, 2)
    await service.close()
    const file = path.join(f.runs, 'target-assessments.json')
    const interrupted = JSON.parse(fs.readFileSync(file))
    interrupted.records[0].phase = 'running'
    delete interrupted.records[0].finishedAt
    interrupted.records[0].slots[1].phase = 'running'
    fs.writeFileSync(file, JSON.stringify(interrupted))
    service = createService(f.repository, {
      directory: f.runs,
      runner: async () => {
        calls++
        throw new Error('Unexpected restart dispatch')
      }
    })
    const restored = service.getTargetAssessment(id)
    assert.equal(restored.phase, 'interrupted')
    assert.equal(restored.result.accepted.status, 'passed')
    assert.equal(restored.result.integration.status, 'unknown')
    assert.equal(calls, 2)
    assert.equal(service.startTargetAssessment(f.request, LOCAL_ACTOR), id)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('assessment retains a real failed target proof and rejects cross-assessment or standalone inventory substitution', async () => {
  const f = await assessmentFixture('failure')
  let service = f.service
  try {
    const result = await service.waitTargetAssessment(
      service.startTargetAssessment(f.request, LOCAL_ACTOR)
    )
    assert.equal(result.phase, 'completed')
    assert.equal(result.result.accepted.status, 'passed')
    assert.equal(result.result.integration.status, 'failed')
    assert.equal(result.slots.length, 2)
    assert.equal(
      service.get(result.roles.target.slotId).evidence.status,
      'failed'
    )
    await service.close()
    const file = path.join(f.runs, 'target-assessments.json')
    const original = fs.readFileSync(file)
    for (const mutate of [
      (saved) =>
        (saved.records[0].roles.accepted.verificationSourceDigest = '0'.repeat(
          64
        )),
      (saved) => {
        const record = structuredClone(saved.records[0])
        record.id = randomUUID()
        saved.records.push(record)
      },
      (saved) => {
        const record = saved.records[0]
        record.roles.target.slotId = f.request.sourceAttemptId
        record.slots[1].id = f.request.sourceAttemptId
      },
      (saved) => (saved.records[0].slots[0].phase = 'requested'),
      (saved) => (saved.records[0].slots[0].phase = 'cancelled'),
      (saved) => (saved.records[0].phase = 'cancelled')
    ]) {
      const saved = JSON.parse(original)
      mutate(saved)
      fs.writeFileSync(file, JSON.stringify(saved))
      assert.throws(
        () => createService(f.repository, { directory: f.runs }),
        /assessment/i
      )
    }
    fs.writeFileSync(file, original)
    service = createService(f.repository, { directory: f.runs })
    assert.equal(
      service.getTargetAssessment(result.id).result.integration.status,
      'failed'
    )
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('assessment cancelled before dispatch retains requested slots with explicit terminal reasons', async () => {
  const f = await assessmentFixture()
  let service = f.service
  try {
    const id = service.startTargetAssessment(f.request, LOCAL_ACTOR)
    const cancelled = await service.cancelTargetAssessment(id, LOCAL_ACTOR)
    assert.equal(cancelled.phase, 'cancelled')
    assert.equal(cancelled.result.accepted.status, 'unknown')
    for (const slot of cancelled.slots) {
      assert.equal(slot.phase, 'cancelled')
      assert.ok(slot.reason)
      assert.throws(() => service.get(slot.id), /not found/i)
    }
    await service.close()
    const file = path.join(f.runs, 'target-assessments.json')
    const saved = JSON.parse(fs.readFileSync(file))
    delete saved.records[0].slots[0].reason
    fs.writeFileSync(file, JSON.stringify(saved))
    assert.throws(
      () => createService(f.repository, { directory: f.runs }),
      /assessment.*reason/i
    )
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('assessment orchestration lock blocks task admission before the first producer microtask', async () => {
  const f = await assessmentFixture(false)
  let service = f.service
  await service.close()
  service = createService(f.repository, {
    directory: f.runs,
    agentOptions: {
      available: () => true,
      verify: async () => ({ evidence: { status: 'unknown' } })
    }
  })
  try {
    const id = service.startTargetAssessment(f.request, LOCAL_ACTOR)
    assert.throws(
      () =>
        service.startTask(
          {
            requestId: randomUUID(),
            stepId: 'finalize-transaction-state',
            objective: 'Test exact idle boundary',
            allowedFiles: ['packages/factory/src/data-transact.ts'],
            adapter: 'demonstration',
            scenario: 'stall',
            contractDigest: service.contract().digest,
            revision: service.state().mapping.revision,
            budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 }
          },
          LOCAL_ACTOR
        ),
      /running|active/
    )
    assert.equal(service.state().tasks.records.length, 0)
    await service.cancelTargetAssessment(id, LOCAL_ACTOR)
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})

test('assessment settlement persistence failure preserves completed producer phase and records a separate orchestration error', async (t) => {
  const f = await assessmentFixture(false)
  let service = f.service
  try {
    const rename = fs.renameSync
    let failed = false
    const write = t.mock.method(fs, 'renameSync', (from, to) => {
      if (!failed && to === path.join(f.runs, 'target-assessments.json')) {
        const saved = JSON.parse(fs.readFileSync(from))
        if (saved.records[0].phase === 'completed') {
          failed = true
          throw new Error('Simulated settlement persistence failure')
        }
      }
      return rename(from, to)
    })
    const result = await service.waitTargetAssessment(
      service.startTargetAssessment(f.request, LOCAL_ACTOR)
    )
    write.mock.restore()
    assert.equal(failed, true)
    assert.equal(result.phase, 'error')
    assert.match(result.orchestrationError, /settlement persistence failure/)
    assert.equal(result.slots[0].phase, 'completed')
    assert.equal(service.get(result.slots[0].id).phase, 'completed')
    assert.equal(result.result.accepted.status, 'passed')
    await service.close()
    service = createService(f.repository, { directory: f.runs })
    assert.equal(
      service.getTargetAssessment(result.id).slots[0].phase,
      'completed'
    )
  } finally {
    await service.close()
    fs.rmSync(f.dir, { recursive: true, force: true })
  }
})
