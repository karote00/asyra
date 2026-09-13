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

async function assessmentFixture(distinct = true, agentOptions = {}) {
  const f = referenceFixture()
  const service = createService(f.repository, {
    directory: f.runs,
    agentOptions
  })
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

function captureDerivedSource(...args) {
  const snapshot = sourceOwner.captureSource(...args)
  const generated = sourceOwner.createDerivedExecution({
    sourceRoot: snapshot.sourceRoot,
    verificationSource: snapshot.verificationSource
  })
  for (const file of generated.files) {
    const destination = path.join(snapshot.sourceRoot, file.path)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, file.content, { flag: 'wx', mode: 0o444 })
  }
  const files = [...snapshot.files, ...generated.executionSource.files].sort(
    (a, b) => a.path.localeCompare(b.path)
  )
  const bytes = JSON.stringify(files)
  fs.rmSync(path.join(root, snapshot.manifestPath))
  fs.writeFileSync(path.join(root, snapshot.manifestPath), bytes, {
    flag: 'wx',
    mode: 0o444
  })
  return {
    ...snapshot,
    files,
    fileCount: files.length,
    digest: require('node:crypto')
      .createHash('sha256')
      .update(bytes)
      .digest('hex'),
    executionSource: generated.executionSource,
    configurationDigest: generated.executionSource.digest
  }
}
async function runDerivedSource(options) {
  const { containedProcess } = require('../agent-verifier.cjs')
  return require('../runner.cjs').runVerification({
    ...options,
    contract: {
      ...options.contract,
      configFile: options.snapshot.executionSource.roles.configuration
    },
    processRunner: (input) =>
      containedProcess(
        {
          ...input,
          cwd: options.snapshot.sourceRoot,
          args: [
            path.join(
              options.snapshot.sourceRoot,
              options.snapshot.executionSource.roles.bootstrap
            ),
            String(process.pid),
            ...input.args.slice(3),
            '--configLoader',
            'native'
          ]
        },
        {
          repositoryRoot: root,
          readRoots: [options.snapshot.sourceRoot],
          writeRoot: options.runDirectory
        }
      )
  })
}

test(
  'service admits complete derived source once per live and restart lifetime with actual bytes and cached reads',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const dir = directory()
    let service = createService(root, {
      directory: dir,
      capture: captureDerivedSource,
      runner: runDerivedSource
    })
    const combined = t.mock.method(sourceOwner, 'validateSourceSnapshot')
    const bytes = t.mock.method(sourceOwner, 'verifyRetainedSnapshotBytes')
    const read = t.mock.method(fs, 'readFileSync')
    const assess = t.mock.method(evidenceOwner, 'assessEvidence')
    const requestId = randomUUID()
    try {
      const id = service.start({ requestId }, LOCAL_ACTOR)
      const record = await service.wait(id)
      assert.equal(
        record.evidence?.status,
        'passed',
        JSON.stringify({
          phase: record.phase,
          error: record.error,
          issues: record.evidence?.issues
        })
      )
      assert.equal(record.format, 3)
      const sourceRoot = path.join(dir, id, 'source')
      const sourceReads = () =>
        read.mock.calls.filter((call) =>
          String(call.arguments[0]).startsWith(sourceRoot + path.sep)
        ).length
      assert.equal(combined.mock.callCount(), 1)
      assert.equal(bytes.mock.callCount(), 1)
      assert.equal(sourceReads(), record.snapshot.fileCount)
      assert.deepEqual(combined.mock.calls[0].arguments[3], { sourceRoot })
      const artifact = assess.mock.calls[0].arguments[5]
      assert.deepEqual(
        artifact.executionSource,
        record.snapshot.executionSource
      )
      assert.equal(
        artifact.configurationDigest,
        artifact.executionSource.digest
      )
      assert.ok(Object.isFrozen(artifact.executionSource))
      await service.close()
      service = createService(root, { directory: dir })
      assert.equal(combined.mock.callCount(), 2)
      assert.equal(bytes.mock.callCount(), 2)
      assert.equal(sourceReads(), record.snapshot.fileCount * 2)
      const count = read.mock.callCount()
      for (let index = 0; index < 10; index++) {
        assert.equal(service.get(id).evidence.status, 'passed')
        service.state()
        assert.equal(service.start({ requestId }, LOCAL_ACTOR), id)
      }
      assert.equal(read.mock.callCount(), count)
      assert.equal(combined.mock.callCount(), 2)
      assert.equal(bytes.mock.callCount(), 2)
    } finally {
      await service.close()
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }
)

test('derived service admission rejects missing authority and actual bytes before dispatch', async () => {
  for (const [label, mutate] of [
    [
      'missing runtime',
      (snapshot) => Reflect.deleteProperty(snapshot, 'runtimeSource')
    ],
    [
      'missing verification',
      (snapshot) => Reflect.deleteProperty(snapshot, 'verificationSource')
    ],
    [
      'null execution',
      (snapshot) => {
        snapshot.executionSource = null
      }
    ],
    [
      'wrong live location',
      (snapshot) => {
        snapshot.sourceRoot = path.join(root, 'other/source')
      }
    ],
    [
      'changed bytes',
      (snapshot) => {
        const file = path.join(
          snapshot.sourceRoot,
          snapshot.executionSource.roles.bootstrap
        )
        fs.chmodSync(file, 0o644)
        fs.appendFileSync(file, '\n// changed\n')
      }
    ],
    [
      'missing bytes',
      (snapshot) =>
        fs.rmSync(
          path.join(snapshot.sourceRoot, snapshot.runtimeSource.files[0].path)
        )
    ]
  ]) {
    const dir = directory()
    let executions = 0
    const service = createService(root, {
      directory: dir,
      capture: (...args) => {
        const snapshot = captureDerivedSource(...args)
        mutate(snapshot)
        return snapshot
      },
      runner: async () => {
        executions++
        throw new Error('Must not dispatch')
      }
    })
    try {
      const record = await service.wait(service.start({}, LOCAL_ACTOR))
      assert.equal(record.phase, 'error', label)
      assert.equal(executions, 0, label)
    } finally {
      await service.close()
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }
})

test(
  'retained derived source requires exact contract and actual fixed-tree bytes on restart',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async () => {
    const dir = directory()
    let service = createService(root, {
      directory: dir,
      capture: captureDerivedSource,
      runner: runDerivedSource
    })
    try {
      const record = await service.wait(service.start({}, LOCAL_ACTOR))
      assert.equal(record.evidence?.status, 'passed', record.error)
      await service.close()
      const recordPath = path.join(dir, record.id, 'record.json')
      const saved = fs.readFileSync(recordPath)
      const bootstrap = path.join(
        dir,
        record.id,
        'source',
        record.snapshot.executionSource.roles.bootstrap
      )
      const original = fs.readFileSync(bootstrap)
      for (const [label, mutate] of [
        [
          'removed execution and source contract with tampered generated bytes',
          (value) => {
            Reflect.deleteProperty(value, 'sourceContract')
            Reflect.deleteProperty(value.snapshot, 'executionSource')
            fs.chmodSync(bootstrap, 0o644)
            fs.appendFileSync(
              bootstrap,
              '\n// tampered after removing authority\n'
            )
          }
        ],
        [
          'missing source contract',
          (value) => Reflect.deleteProperty(value, 'sourceContract')
        ],
        [
          'missing execution',
          (value) => Reflect.deleteProperty(value.snapshot, 'executionSource')
        ],
        [
          'null execution',
          (value) => {
            value.snapshot.executionSource = null
          }
        ],
        [
          'unsupported execution',
          (value) => {
            value.snapshot.executionSource.format = 2
          }
        ],
        [
          'missing runtime',
          (value) => Reflect.deleteProperty(value.snapshot, 'runtimeSource')
        ],
        [
          'missing verifier',
          (value) =>
            Reflect.deleteProperty(value.snapshot, 'verificationSource')
        ],
        [
          'tampered bytes',
          () => {
            fs.chmodSync(bootstrap, 0o644)
            fs.appendFileSync(bootstrap, '\n// tampered\n')
          }
        ],
        ['missing bytes', () => fs.rmSync(bootstrap)]
      ]) {
        const value = JSON.parse(saved)
        mutate(value)
        fs.writeFileSync(recordPath, JSON.stringify(value))
        assert.throws(
          () => {
            service = createService(root, { directory: dir })
          },
          /source|execution|configuration|ENOENT|fingerprint/i,
          label
        )
        fs.writeFileSync(recordPath, saved)
        fs.rmSync(bootstrap, { force: true })
        fs.writeFileSync(bootstrap, original, { flag: 'wx', mode: 0o444 })
      }
      const stale = JSON.parse(saved)
      stale.mappingRevision++
      fs.writeFileSync(recordPath, JSON.stringify(stale))
      service = createService(root, { directory: dir })
      assert.equal(service.get(record.id).evidence.status, 'passed')
      assert.equal(service.get(record.id).format, 3)
      assert.equal(service.get(record.id).matchesCurrentContract, false)
    } finally {
      await service.close()
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }
)

test(
  'derived service cannot retain a passing result when live execution presence or complete descriptors change',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async () => {
    for (const mutate of [
      (snapshot) => Reflect.deleteProperty(snapshot, 'executionSource'),
      (snapshot) => {
        snapshot.runtimeSource.files[0].size++
      },
      (snapshot) => {
        snapshot.executionSource.files[0].size++
      }
    ]) {
      const dir = directory()
      const service = createService(root, {
        directory: dir,
        capture: (...args) => structuredClone(captureDerivedSource(...args)),
        runner: async (options) => {
          const result = await runDerivedSource(options)
          assert.equal(result.code, 0, result.output)
          mutate(options.snapshot)
          return result
        }
      })
      try {
        const record = await service.wait(service.start({}, LOCAL_ACTOR))
        assert.equal(record.phase, 'error')
        assert.match(record.error, /source|identity|provenance/i)
        assert.notEqual(record.evidence?.status, 'passed')
        assert.throws(
          () => service.prepareEvolution({ attemptId: record.id }, LOCAL_ACTOR),
          /source|completed|unavailable|evidence/i
        )
      } finally {
        await service.close()
        fs.rmSync(dir, { recursive: true, force: true })
      }
    }
  }
)

test(
  'ordinary verification references cannot consume a service-admitted derived configuration',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const dir = directory()
    const service = createService(root, {
      directory: dir,
      capture: captureDerivedSource,
      runner: runDerivedSource
    })
    const verify = t.mock.method(sourceOwner, 'verifyRetainedSource')
    try {
      const record = await service.wait(
        service.start({ mode: 'candidate' }, LOCAL_ACTOR)
      )
      assert.equal(record.evidence?.status, 'passed', record.error)
      assert.throws(
        () => service.prepareEvolution({ attemptId: record.id }, LOCAL_ACTOR),
        /unavailable|source|verification/i
      )
      assert.equal(
        verify.mock.callCount(),
        0,
        'ordinary reference rejects the derived authority before byte verification'
      )
    } finally {
      await service.close()
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }
)

async function candidateTargetFixture(distinct = 'failure', agentOptions = {}) {
  const f = await assessmentFixture(distinct, agentOptions)
  // The captured repository needs an installed dependency root for OS containment;
  // ordinary Vitest created only its local cache while resolving ancestor packages.
  const dependencies = path.join(f.repository, 'node_modules')
  fs.rmSync(dependencies, { recursive: true, force: true })
  fs.symlinkSync(path.join(root, 'node_modules'), dependencies, 'dir')
  const task = await f.service.waitTask(
    f.service.startTask(
      {
        requestId: randomUUID(),
        stepId: 'finalize-transaction-state',
        objective:
          'Produce an exact candidate runtime for independent frozen verifiers',
        allowedFiles: ['packages/factory/src/data-transact.ts'],
        adapter: 'demonstration',
        scenario: 'repair',
        contractDigest: f.service.contract().digest,
        revision: f.service.state().mapping.revision,
        budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 }
      },
      LOCAL_ACTOR
    )
  )
  return {
    ...f,
    task,
    proofRequest: {
      ...f.request,
      sourceTaskId: task.id,
      sourceAttemptId: task.attempts.at(-1).id,
      role: 'target'
    }
  }
}

test(
  'task source target production separates exact frozen verifier outcomes and survives source retirement without new authority',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const f = await candidateTargetFixture()
    let service = f.service
    try {
      assert.equal(
        f.task.verificationStatus,
        'failed',
        JSON.stringify({
          error: f.task.error,
          issues: f.task.attempts.at(-1).verdict?.evidence.issues,
          runner: f.task.attempts.at(-1).verdict?.runner
        })
      )
      const baseline = service.state().shared
      const compose = t.mock.method(sourceOwner, 'composeDerivedSource')
      const accepted = await service.wait(
        service.startTargetProof(
          { ...f.proofRequest, requestId: randomUUID(), role: 'accepted' },
          LOCAL_ACTOR
        )
      )
      const target = await service.wait(
        service.startTargetProof(f.proofRequest, LOCAL_ACTOR)
      )
      assert.equal(accepted.evidence?.status, 'passed', accepted.error)
      assert.equal(target.evidence?.status, 'failed', target.error)
      assert.equal(accepted.format, 3)
      assert.equal(target.format, 3)
      assert.equal(compose.mock.callCount(), 2)
      assert.equal(target.targetProof.runtime.taskId, f.task.id)
      assert.equal(
        target.targetProof.runtime.attemptId,
        f.task.attempts.at(-1).id
      )
      assert.equal(
        target.snapshot.runtimeSource.digest,
        accepted.snapshot.runtimeSource.digest
      )
      assert.notEqual(
        target.snapshot.verificationSource.digest,
        accepted.snapshot.verificationSource.digest
      )
      assert.equal(
        target.snapshot.configurationDigest,
        target.snapshot.executionSource.digest
      )
      assert.notEqual(
        target.snapshot.configurationDigest,
        target.targetProof.verificationSource.configurationDigest
      )
      const {
        observedAt: previousObserved,
        fingerprint: previousFingerprint,
        ...previousShared
      } = baseline
      const {
        observedAt: currentObserved,
        fingerprint: currentFingerprint,
        ...currentShared
      } = service.state().shared
      assert.ok(
        previousObserved &&
          currentObserved &&
          previousFingerprint &&
          currentFingerprint
      )
      assert.deepEqual(currentShared, previousShared)
      await service.close()
      service = createService(f.repository, {
        directory: f.runs,
        runner: () => {
          throw new Error('ordinary runner forbidden')
        }
      })
      assert.equal(service.get(target.id).evidence.status, 'failed')
      await service.controlTask(
        f.task.id,
        { action: 'resume', scenario: 'repair' },
        LOCAL_ACTOR
      )
      const successor = await service.waitTask(f.task.id)
      assert.notEqual(
        successor.attempts.at(-1).id,
        f.proofRequest.sourceAttemptId
      )
      assert.throws(
        () =>
          service.startTargetProof(
            { ...f.proofRequest, requestId: randomUUID() },
            LOCAL_ACTOR
          ),
        /unavailable/
      )
      await service.controlTask(f.task.id, { action: 'revoke' }, LOCAL_ACTOR)
      const reads = t.mock.method(fs, 'readFileSync')
      const count = compose.mock.callCount()
      assert.equal(
        service.startTargetProof(f.proofRequest, LOCAL_ACTOR),
        target.id
      )
      service.get(target.id)
      assert.equal(reads.mock.callCount(), 0)
      assert.equal(compose.mock.callCount(), count)
      reads.mock.restore()
      assert.throws(
        () =>
          service.startTargetProof(
            { ...f.proofRequest, requestId: randomUUID() },
            LOCAL_ACTOR
          ),
        /unavailable/
      )
      assert.throws(
        () =>
          service.startTargetProof(
            { ...f.proofRequest, sourceTaskId: undefined },
            LOCAL_ACTOR
          ),
        /Invalid/
      )
      assert.throws(
        () =>
          service.startTargetProof(
            { ...f.proofRequest, sourceTaskId: randomUUID() },
            LOCAL_ACTOR
          ),
        /conflict/
      )
      await service.close()
      service = createService(f.repository, { directory: f.runs })
      assert.equal(service.get(target.id).evidence.status, 'failed')
      assert.equal(
        service.startTargetProof(f.proofRequest, LOCAL_ACTOR),
        target.id
      )
      await service.close()
      const recordFile = path.join(f.runs, target.id, 'record.json')
      const originalRecord = JSON.parse(fs.readFileSync(recordFile))
      for (const alter of [
        (value) => {
          delete value.targetProof.runtime.taskId
        },
        (value) => {
          value.targetProof.runtime.configurationDigest = '0'.repeat(64)
        },
        (value) => {
          value.targetProof.request.sourceAttemptId =
            successor.attempts.at(-1).id
        }
      ]) {
        const changed = structuredClone(originalRecord)
        alter(changed)
        fs.writeFileSync(recordFile, JSON.stringify(changed))
        assert.throws(
          () => createService(f.repository, { directory: f.runs }),
          /target proof selection|task source|target proof/i
        )
      }
      const taskFile = path.join(f.runs, 'tasks', f.task.id, 'task.json')
      const originalTask = JSON.parse(fs.readFileSync(taskFile))
      const incompleteTask = structuredClone(originalTask)
      const oldVerdict = incompleteTask.attempts.find(
        (attempt) => attempt.id === f.proofRequest.sourceAttemptId
      ).verdict
      delete oldVerdict.configurationDigest
      delete oldVerdict.executionSource.digest
      delete oldVerdict.verificationSource.digest
      delete oldVerdict.executionSource.verificationSourceDigest
      fs.writeFileSync(taskFile, JSON.stringify(incompleteTask))
      const acceptedFile = path.join(f.runs, accepted.id, 'record.json')
      const originalAccepted = JSON.parse(fs.readFileSync(acceptedFile))
      const referringRecords = [
        [recordFile, originalRecord],
        [acceptedFile, originalAccepted]
      ]
      for (const omitSavedScalars of [false, true]) {
        for (const [file, original] of referringRecords) {
          const changed = structuredClone(original)
          assert.equal(changed.targetProof.runtime.taskId, f.task.id)
          assert.equal(
            changed.targetProof.runtime.attemptId,
            f.proofRequest.sourceAttemptId
          )
          if (omitSavedScalars) {
            delete changed.targetProof.runtime.configurationDigest
            delete changed.targetProof.runtime.executionSourceDigest
            delete changed.targetProof.runtime.verificationSourceDigest
          }
          fs.writeFileSync(file, JSON.stringify(changed))
        }
        let unexpected
        try {
          assert.throws(() => {
            unexpected = createService(f.repository, { directory: f.runs })
          }, /target proof selection/)
        } finally {
          await unexpected?.close()
        }
      }
      fs.writeFileSync(taskFile, JSON.stringify(originalTask))
      for (const [file, original] of referringRecords)
        fs.writeFileSync(file, JSON.stringify(original))
    } finally {
      await service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'task target post-run source corruption retains the actual runner and readable unavailable error after restart',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const f = await candidateTargetFixture(false)
    let service = f.service
    try {
      assert.equal(
        f.task.verificationStatus,
        'passed',
        JSON.stringify({
          error: f.task.error,
          issues: f.task.attempts.at(-1).verdict?.evidence.issues,
          runner: f.task.attempts.at(-1).verdict?.runner
        })
      )
      await service.close()
      const runnerOwner = require('../runner.cjs')
      const original = runnerOwner.runContainedVerification
      const contained = t.mock.method(
        runnerOwner,
        'runContainedVerification',
        async (options) => {
          const result = await original(options)
          const file = path.join(
            options.snapshot.sourceRoot,
            options.snapshot.executionSource.roles.bootstrap
          )
          fs.chmodSync(file, 0o600)
          fs.appendFileSync(file, '\n// post-run corruption\n')
          return result
        }
      )
      const modulePath = require.resolve('../service.cjs'),
        saved = require.cache[modulePath]
      Reflect.deleteProperty(require.cache, modulePath)
      const isolated = require('../service.cjs').createService
      require.cache[modulePath] = saved
      service = isolated(f.repository, {
        directory: f.runs,
        runner: () => {
          throw new Error('ordinary runner forbidden')
        }
      })
      const bytes = t.mock.method(sourceOwner, 'verifyRetainedSnapshotBytes')
      const record = await service.wait(
        service.startTargetProof(f.proofRequest, LOCAL_ACTOR)
      )
      assert.equal(contained.mock.callCount(), 1)
      assert.equal(bytes.mock.callCount(), 2)
      assert.equal(record.phase, 'error')
      assert.match(record.error, /source|fingerprint|integrity/i)
      assert.equal(record.runner.code, 0)
      assert.equal(record.evidence, undefined)
      const report = JSON.parse(
        fs.readFileSync(path.join(f.repository, record.runner.reportPath))
      )
      assert.ok(report.numPassedTests > 0)
      await service.close()
      service = isolated(f.repository, { directory: f.runs })
      assert.equal(service.get(record.id).phase, 'error')
      assert.equal(
        service.startTargetProof(f.proofRequest, LOCAL_ACTOR),
        record.id
      )
      const ordinary = {
        ...f.proofRequest,
        requestId: randomUUID(),
        sourceAttemptId: record.id
      }
      delete ordinary.sourceTaskId
      assert.throws(
        () => service.startTargetProof(ordinary, LOCAL_ACTOR),
        /unavailable/
      )
      await service.close()
      const manifest = path.join(f.runs, record.id, 'source-manifest.json')
      fs.chmodSync(manifest, 0o600)
      fs.writeFileSync(manifest, '[]')
      assert.throws(
        () => isolated(f.repository, { directory: f.runs }),
        /manifest.*fingerprint/i
      )
    } finally {
      await service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'task assessments register all derived producers and retain independent outcomes through exact source retirement',
  { skip: process.platform !== 'darwin', timeout: 40000 },
  async (t) => {
    let notifications = 0
    const f = await candidateTargetFixture('failure', {
      onChange: () => notifications++
    })
    let service = f.service
    const { role, ...request } = f.proofRequest
    assert.equal(role, 'target')
    const assessor = require('../target-evidence.cjs')
    const assess = t.mock.method(assessor, 'assessTargetSource')
    const project = t.mock.method(
      assessor,
      'projectTargetAssessmentCurrentness'
    )
    try {
      const selectionLookups = t.mock.method(Map.prototype, 'get')
      const id = service.startTargetAssessment(request, LOCAL_ACTOR)
      const sourceCache = selectionLookups.mock.calls.find(
        (call) => call.result?.taskId === f.task.id && call.result?.admission
      )?.this
      assert.ok(sourceCache)
      selectionLookups.mock.restore()
      const registered = service.getTargetAssessment(id)
      assert.equal(registered.runtime.taskId, f.task.id)
      assert.equal(registered.slots.length, 2)
      assert.equal(registered.result.accepted.status, 'unknown')
      assert.equal(assess.mock.callCount(), 1)
      assert.equal(
        Object.hasOwn(assess.mock.calls[0].arguments[0], 'sourceAdmission'),
        false
      )
      assert.deepEqual(assess.mock.calls[0].arguments[0].sourceIdentity, {
        repository: registered.runtime.repository,
        head: registered.runtime.head,
        runtimeSourceDigest: registered.runtime.runtimeSourceDigest
      })
      const before = service.getTask(f.task.id)
      await assert.rejects(
        service.controlTask(f.task.id, { action: 'revoke' }, LOCAL_ACTOR),
        /assessment|active|running/i
      )
      assert.deepEqual(service.getTask(f.task.id), before)
      const result = await service.waitTargetAssessment(id)
      assert.equal(result.phase, 'completed')
      assert.equal(result.result.accepted.status, 'passed')
      assert.equal(result.result.integration.status, 'failed')
      assert.equal(assess.mock.callCount(), 3)
      for (const slot of result.slots) {
        const producer = service.get(slot.id)
        assert.equal(producer.format, 3)
        assert.equal(producer.targetProof.runtime.taskId, f.task.id)
        assert.equal(producer.targetAssessmentId, id)
      }
      const verdict = result.result
      const evaluated = result.evaluatedCurrent
      const beforeNotifications = notifications
      const beforeRetirementProjects = project.mock.callCount()
      await service.controlTask(f.task.id, { action: 'revoke' }, LOCAL_ACTOR)
      assert.equal(notifications, beforeNotifications + 1)
      assert.equal(project.mock.callCount(), beforeRetirementProjects + 1)
      assert.equal(assess.mock.callCount(), 3)
      assert.equal(service.getTargetAssessment(id).projection.current, false)
      assert.strictEqual(service.getTargetAssessment(id).result, verdict)
      assert.deepEqual(
        service.getTargetAssessment(id).evaluatedCurrent,
        evaluated
      )
      await service.controlTask(f.task.id, { action: 'revoke' }, LOCAL_ACTOR)
      assert.equal(notifications, beforeNotifications + 2)
      assert.equal(project.mock.callCount(), beforeRetirementProjects + 1)
      assert.equal(assess.mock.callCount(), 3)
      const counts = [assess.mock.callCount(), project.mock.callCount()]
      const lookups = t.mock.method(Map.prototype, 'get')
      const reads = t.mock.method(fs, 'readFileSync')
      for (let i = 0; i < 3; i++) {
        service.getTargetAssessment(id)
        service.targetAssessments()
        assert.equal(service.startTargetAssessment(request, LOCAL_ACTOR), id)
      }
      assert.equal(reads.mock.callCount(), 0)
      assert.deepEqual(
        [assess.mock.callCount(), project.mock.callCount()],
        counts
      )
      assert.equal(
        lookups.mock.calls.filter((call) => call.this === sourceCache).length,
        0
      )
      lookups.mock.restore()
      reads.mock.restore()
      assert.throws(
        () =>
          service.startTargetAssessment(
            { ...request, requestId: randomUUID() },
            LOCAL_ACTOR
          ),
        /unavailable/
      )
      await service.close()
      service = createService(f.repository, { directory: f.runs })
      assert.deepEqual(service.getTargetAssessment(id).result, verdict)
      assert.deepEqual(
        service.getTargetAssessment(id).evaluatedCurrent,
        evaluated
      )
      assert.equal(service.getTargetAssessment(id).projection.current, false)
      assert.equal(service.startTargetAssessment(request, LOCAL_ACTOR), id)
    } finally {
      await service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'task assessment sharing and pre-dispatch cancellation retain complete requested authority without fallback',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const f = await candidateTargetFixture(false)
    let service = f.service
    const { role, ...request } = f.proofRequest
    assert.equal(role, 'target')
    try {
      const runs = service.state().runs.length
      for (const sourceTaskId of [null, '', undefined, randomUUID()]) {
        assert.throws(() =>
          service.startTargetAssessment(
            { ...request, requestId: randomUUID(), sourceTaskId },
            LOCAL_ACTOR
          )
        )
        assert.equal(service.state().runs.length, runs)
        assert.equal(service.targetAssessments().length, 0)
      }
      const completed = await service.waitTargetAssessment(
        service.startTargetAssessment(request, LOCAL_ACTOR)
      )
      assert.equal(completed.slots.length, 1)
      assert.equal(
        completed.roles.accepted.slotId,
        completed.roles.target.slotId
      )
      assert.equal(completed.result.accepted.status, 'passed')
      assert.equal(completed.result.integration.status, 'passed')
      assert.equal(completed.projection.eligible, true)
      const producer = service.get(completed.slots[0].id)
      assert.equal(
        producer.snapshot.configurationDigest,
        producer.snapshot.executionSource.digest
      )
      assert.notEqual(
        producer.snapshot.configurationDigest,
        completed.roles.target.reference.configurationDigest
      )
      const pendingRequest = { ...request, requestId: randomUUID() }
      const pendingId = service.startTargetAssessment(
        pendingRequest,
        LOCAL_ACTOR
      )
      const cancelled = await service.cancelTargetAssessment(
        pendingId,
        LOCAL_ACTOR
      )
      assert.equal(cancelled.phase, 'cancelled')
      assert.equal(cancelled.slots.length, 1)
      assert.equal(cancelled.slots[0].phase, 'cancelled')
      assert.ok(cancelled.slots[0].reason)
      assert.throws(() => service.get(cancelled.slots[0].id), /not found/)
      assert.equal(cancelled.result.integration.status, 'unknown')
      await service.controlTask(f.task.id, { action: 'revoke' }, LOCAL_ACTOR)
      await service.close()
      service = createService(f.repository, { directory: f.runs })
      assert.deepEqual(
        service.getTargetAssessment(pendingId).result,
        cancelled.result
      )
      assert.equal(
        service.startTargetAssessment(pendingRequest, LOCAL_ACTOR),
        pendingId
      )
      const read = t.mock.method(fs, 'readFileSync')
      assert.equal(
        service.getTargetAssessment(pendingId).projection.current,
        false
      )
      assert.equal(read.mock.callCount(), 0)
      read.mock.restore()
    } finally {
      await service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

async function scopedWorkFixture(failure = null, deliveryAdapter = {}) {
  const f = referenceFixture()
  const service = createService(f.repository, {
    directory: f.runs,
    deliveryAdapter,
    agentOptions: {
      adapterFactory(task) {
        let turn = 0
        return {
          async next(observation) {
            if (++turn === 1)
              return { tool: 'read', path: task.allowedFiles[0] }
            if (turn > 2) return { tool: 'finish' }
            return {
              tool: 'replace',
              path: task.allowedFiles[0],
              digest: observation.digest,
              before: observation.content,
              after:
                failure === 'preservation'
                  ? observation.content.replace(
                      f.contract.definition.scenarios.find(
                        (item) => item.id === 'inverse-regression'
                      ).mutation.from,
                      f.contract.definition.scenarios.find(
                        (item) => item.id === 'inverse-regression'
                      ).mutation.to
                    )
                  : observation.content.replaceAll(
                      'DataTransact',
                      'CandidateTransaction'
                    )
            }
          }
        }
      }
    }
  })
  const accepted = await service.wait(
    service.start({ mode: 'candidate' }, LOCAL_ACTOR)
  )
  const first = service.prepareEvolution(
    { attemptId: accepted.id },
    LOCAL_ACTOR
  )
  service.decideEvolution(
    {
      id: first.id,
      decision: 'accept',
      reason: 'Preserve original runtime behavior'
    },
    LOCAL_ACTOR
  )
  const file = path.join(f.repository, f.contract.testFile)
  const bytes = fs.readFileSync(file, 'utf8')
  fs.chmodSync(file, 0o600)
  fs.writeFileSync(
    file,
    failure === 'shared'
      ? bytes
      : "import DataTransact from '../data-transact.js'\n" +
          bytes.replace(
            'expect(deferred.history).toBe(1)',
            "expect(deferred.history).toBe(1)\n      expect(DataTransact.name).toBe('DataTransact')"
          )
  )
  const baseline = await service.wait(
    service.start({ mode: 'candidate' }, LOCAL_ACTOR)
  )
  assert.equal(baseline.evidence.status, 'passed', baseline.error)
  const review = service.prepareEvolution(
    { attemptId: baseline.id },
    LOCAL_ACTOR
  )
  const request = pinnedTargetRequest(
    service,
    failure === null ? first : review
  )
  const obligation = review.candidate.contract.cases.find(
    (item) =>
      item.id === (failure === 'own' ? 'deferred.outcome' : 'deferred.snapshot')
  )
  assert.ok(obligation)
  const work = {
    id: randomUUID(),
    title: 'Preserve starting state',
    stepId: obligation.stepId,
    obligationIds: [obligation.id],
    scope: 'Preserve the captured starting state',
    allowedFiles: ['packages/factory/src/data-transact.ts'],
    prerequisites: []
  }
  request.works = [work]
  request.pending = request.pending.filter((id) => id !== obligation.id)
  const target = service.decideTarget(request, LOCAL_ACTOR)
  const sourceProof = await service.wait(service.start({}, LOCAL_ACTOR))
  const taskId = randomUUID(),
    admissionId = randomUUID()
  const admitted = service.decideTarget(
    {
      action: 'admit',
      targetId: target.id,
      expectedRevision: target.revision,
      requestId: admissionId,
      reason: 'Admit exact independent work',
      workId: work.id,
      taskId,
      sourceAttemptId: sourceProof.id
    },
    LOCAL_ACTOR
  )
  const dependencies = path.join(f.repository, 'node_modules')
  fs.rmSync(dependencies, { recursive: true, force: true })
  fs.symlinkSync(path.join(root, 'node_modules'), dependencies, 'dir')
  const task = await service.waitTask(
    service.startTask(
      {
        requestId: taskId,
        stepId: work.stepId,
        objective: work.scope,
        allowedFiles: work.allowedFiles,
        workBinding: { targetId: target.id, workId: work.id, admissionId },
        adapter: 'demonstration',
        scenario: 'repair',
        contractDigest: service.contract().digest,
        revision: service.state().mapping.revision,
        budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 }
      },
      LOCAL_ACTOR
    )
  )
  assert.equal(
    task.attempts.at(-1).verdict.evidence.status,
    failure === 'shared' ? 'passed' : 'failed'
  )
  const assessmentRequest = {
    requestId: randomUUID(),
    targetId: target.id,
    allocationRevision: admitted.revision,
    sourceTaskId: task.id,
    sourceAttemptId: task.attempts.at(-1).id
  }
  const assessment = await service.waitTargetAssessment(
    service.startTargetAssessment(assessmentRequest, LOCAL_ACTOR)
  )
  assert.equal(
    assessment.result.accepted.status,
    failure === 'preservation' ? 'failed' : 'passed'
  )
  assert.equal(
    assessment.result.works[0].status,
    ['preservation', 'own'].includes(failure) ? 'failed' : 'passed'
  )
  assert.equal(
    assessment.result.integration.status,
    ['preservation', 'own'].includes(failure) ? 'failed' : 'pending'
  )
  assert.equal(assessment.projection.eligible, false)
  return {
    ...f,
    service,
    task,
    work,
    assessment,
    assessmentRequest,
    targetRequest: request
  }
}

test(
  'scoped work handoff preserves failed candidate and incomplete integration using exact current admitted work',
  { skip: process.platform !== 'darwin', timeout: 40000 },
  async (t) => {
    const f = await scopedWorkFixture()
    const service = f.service
    try {
      const attemptId = f.task.attempts.at(-1).id
      const result = service.scopedWorkFor(
        f.task.id,
        attemptId,
        f.assessment.id,
        LOCAL_ACTOR
      )
      assert.equal(result.taskId, f.task.id)
      assert.equal(result.attemptId, attemptId)
      assert.equal(result.assessmentId, f.assessment.id)
      assert.equal(result.workId, f.work.id)
      assert.deepEqual(result.workBinding, f.task.task.workBinding)
      assert.deepEqual(result.runtime, f.assessment.runtime)
      assert.equal(result.work.status, 'passed')
      assert.equal(result.producers.length, 1)
      assert.ok(Object.isFrozen(result))
      assert.deepEqual(
        service.scopedWorkFor(
          f.task.id,
          attemptId,
          f.assessment.id,
          LOCAL_ACTOR
        ),
        result
      )
      assert.equal(
        service.getTask(f.task.id).attempts.at(-1).verdict.evidence.status,
        'failed'
      )
      const maps = t.mock.method(Map.prototype, 'get')
      service.scopedWorkFor(f.task.id, attemptId, f.assessment.id, LOCAL_ACTOR)
      const sourceCache = maps.mock.calls.find(
        (call) => call.result?.taskId === f.task.id && call.result?.admission
      )?.this
      assert.ok(sourceCache)
      maps.mock.resetCalls()
      const reads = t.mock.method(fs, 'readFileSync')
      const hashPrototype = Object.getPrototypeOf(
        require('node:crypto').createHash('sha256')
      )
      const hashes = t.mock.method(hashPrototype, 'update')
      const assessor = require('../target-evidence.cjs')
      const assess = t.mock.method(assessor, 'assessTargetSource')
      const validate = t.mock.method(sourceOwner, 'validateSourceSnapshot')
      const next = service.scopedWorkFor(
        f.task.id,
        attemptId,
        f.assessment.id,
        LOCAL_ACTOR
      )
      assert.strictEqual(next.work, f.assessment.result.works[0])
      assert.strictEqual(next.runtime, f.assessment.runtime)
      assert.equal(
        maps.mock.calls.filter((call) => call.this === sourceCache).length,
        1
      )
      assert.deepEqual(
        [
          reads.mock.callCount(),
          hashes.mock.callCount(),
          assess.mock.callCount(),
          validate.mock.callCount()
        ],
        [0, 0, 0, 0]
      )
      maps.mock.resetCalls()
      for (let i = 0; i < 3; i++) {
        service.getTargetAssessment(f.assessment.id)
        service.targetAssessments()
        service.getTask(f.task.id)
      }
      assert.equal(
        maps.mock.calls.filter((call) => call.this === sourceCache).length,
        0
      )
      maps.mock.restore()
      reads.mock.restore()
      hashes.mock.restore()
      for (const args of [
        [randomUUID(), attemptId, f.assessment.id, LOCAL_ACTOR],
        [f.task.id, randomUUID(), f.assessment.id, LOCAL_ACTOR],
        [f.task.id, attemptId, randomUUID(), LOCAL_ACTOR],
        [
          f.task.id,
          attemptId,
          f.assessment.id,
          { id: 'another-actor', capabilities: LOCAL_ACTOR.capabilities }
        ],
        [
          f.task.id,
          attemptId,
          f.assessment.id,
          { id: LOCAL_ACTOR.id, capabilities: [] }
        ]
      ])
        assert.throws(
          () => service.scopedWorkFor(...args),
          /unavailable|stale|found|authorized/i
        )
      // A completed observation without its private producer authority cannot be
      // promoted, even while the cached assessed work result remains passing.
      const originalGet = Map.prototype.get
      for (const slot of f.assessment.slots) {
        Map.prototype.get = function (key) {
          const value = originalGet.call(this, key)
          return key === slot.id && value?.admission ? undefined : value
        }
        try {
          assert.throws(
            () =>
              service.scopedWorkFor(
                f.task.id,
                attemptId,
                f.assessment.id,
                LOCAL_ACTOR
              ),
            /producer authority/
          )
        } finally {
          Map.prototype.get = originalGet
        }
      }
      Map.prototype.get = function (key) {
        return this === sourceCache && key === f.task.id
          ? undefined
          : originalGet.call(this, key)
      }
      try {
        assert.throws(
          () =>
            service.scopedWorkFor(
              f.task.id,
              attemptId,
              f.assessment.id,
              LOCAL_ACTOR
            ),
          /source authority/
        )
      } finally {
        Map.prototype.get = originalGet
      }
      const taskSource = sourceCache.get(f.task.id)
      assert.ok(taskSource)
      for (const field of ['head', 'sourceDigest', 'configurationDigest']) {
        Map.prototype.get = function (key) {
          const value = originalGet.call(this, key)
          return this === sourceCache && key === f.task.id
            ? {
                ...value,
                admission: { ...value.admission, [field]: 'a'.repeat(64) }
              }
            : value
        }
        try {
          assert.throws(
            () =>
              service.scopedWorkFor(
                f.task.id,
                attemptId,
                f.assessment.id,
                LOCAL_ACTOR
              ),
            /source identity/
          )
        } finally {
          Map.prototype.get = originalGet
        }
      }
      const deniedReview = service.reviewTask(
        f.task.id,
        { action: 'prepare' },
        LOCAL_ACTOR
      )
      // Existing review serial owns a live promise before its candidate check;
      // the private callback must not reject its consuming review lifetime.
      deniedReview.catch(() => undefined)
      assert.deepEqual(
        service.scopedWorkFor(
          f.task.id,
          attemptId,
          f.assessment.id,
          LOCAL_ACTOR
        ),
        result
      )
      await assert.rejects(deniedReview, /verified/)
      const cancelRequest = { ...f.assessmentRequest, requestId: randomUUID() }
      const cancelId = service.startTargetAssessment(cancelRequest, LOCAL_ACTOR)
      assert.throws(
        () =>
          service.scopedWorkFor(
            f.task.id,
            attemptId,
            f.assessment.id,
            LOCAL_ACTOR
          ),
        /running/
      )
      await service.cancelTargetAssessment(cancelId, LOCAL_ACTOR)
      assert.throws(
        () =>
          service.scopedWorkFor(f.task.id, attemptId, cancelId, LOCAL_ACTOR),
        /unavailable/
      )
      service.decideTarget(
        {
          action: 'revise',
          targetId: f.assessment.request.targetId,
          requestId: randomUUID(),
          expectedRevision: f.assessment.request.allocationRevision,
          reason: 'Explicit next allocation review',
          objective: 'Revised target objective',
          works: f.targetRequest.works,
          pending: f.targetRequest.pending
        },
        LOCAL_ACTOR
      )
      assert.equal(
        service.getTargetAssessment(f.assessment.id).projection.current,
        false
      )
      assert.throws(
        () =>
          service.scopedWorkFor(
            f.task.id,
            attemptId,
            f.assessment.id,
            LOCAL_ACTOR
          ),
        /stale/
      )
      await service.controlTask(f.task.id, { action: 'revoke' }, LOCAL_ACTOR)
      assert.throws(
        () =>
          service.scopedWorkFor(
            f.task.id,
            attemptId,
            f.assessment.id,
            LOCAL_ACTOR
          ),
        /unavailable|stale/
      )
      assert.strictEqual(
        service.getTargetAssessment(f.assessment.id).result,
        f.assessment.result
      )
      assert.strictEqual(result.work, f.assessment.result.works[0])
    } finally {
      await service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'scoped work handoff rejects real accepted regression and failed own commitment',
  { skip: process.platform !== 'darwin', timeout: 40000 },
  async () => {
    for (const failure of ['preservation', 'own']) {
      const f = await scopedWorkFixture(failure)
      try {
        assert.throws(
          () =>
            f.service.scopedWorkFor(
              f.task.id,
              f.task.attempts.at(-1).id,
              f.assessment.id,
              LOCAL_ACTOR
            ),
          /preservation|commitment/
        )
      } finally {
        await f.service.close()
        fs.rmSync(f.dir, { recursive: true, force: true })
      }
    }
  }
)

test(
  'scoped work handoff retains one exact producer for identical accepted and target verification roles',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async () => {
    const f = await scopedWorkFixture('shared')
    try {
      const handoff = f.service.scopedWorkFor(
        f.task.id,
        f.task.attempts.at(-1).id,
        f.assessment.id,
        LOCAL_ACTOR
      )
      assert.equal(handoff.producers.length, 1)
      assert.notEqual(
        f.assessment.roles.accepted.reference.attemptId,
        f.assessment.roles.target.reference.attemptId
      )
      assert.strictEqual(handoff.roles, f.assessment.roles)
      assert.deepEqual(
        handoff.targetVerification,
        f.assessment.pins.targetVerification
      )
      assert.deepEqual(handoff.producers[0].roles, ['accepted', 'target'])
      const producer = f.service.get(handoff.producers[0].id)
      assert.equal(handoff.producers[0].sourceDigest, producer.snapshot.digest)
      assert.equal(
        handoff.producers[0].configurationDigest,
        producer.snapshot.executionSource.digest
      )
      assert.equal(
        handoff.producers[0].runtimeSourceDigest,
        producer.snapshot.runtimeSource.digest
      )
      assert.equal(
        handoff.producers[0].verificationSourceDigest,
        producer.snapshot.verificationSource.digest
      )
      assert.equal(
        handoff.producers[0].executionSourceDigest,
        producer.snapshot.executionSource.digest
      )
      assert.strictEqual(handoff.work, f.assessment.result.works[0])
      assert.strictEqual(handoff.integration, f.assessment.result.integration)
    } finally {
      await f.service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'scoped review prepares and confirms exact real bounded evidence without changing the failed candidate or baseline',
  { skip: process.platform !== 'darwin', timeout: 40000 },
  async (t) => {
    const counts = { inspect: 0, deliver: 0 }
    const adapter = {
      repository: 'offline/scoped-review',
      base: 'main',
      async inspect() {
        counts.inspect++
        return { baseSha: 'b'.repeat(40), baseTree: 'c'.repeat(40) }
      },
      async deliver(preview, checkpoint) {
        counts.deliver++
        await checkpoint('create-branch')
        return {
          number: 1,
          state: 'open',
          headSha: 'd'.repeat(40),
          draft: false
        }
      }
    }
    const f = await scopedWorkFixture(null, adapter)
    let service = f.service
    const attemptId = f.task.attempts.at(-1).id
    const selection = { attemptId, assessmentId: f.assessment.id }
    const baseline = service.state().mapping
    try {
      await assert.rejects(
        service.reviewTask(f.task.id, { action: 'prepare' }, LOCAL_ACTOR),
        /verified/
      )
      let preview = await service.prepareScopedReview(
        f.task.id,
        selection,
        LOCAL_ACTOR
      )
      assert.equal(preview.format, 2)
      assert.equal(preview.preview.candidateVerification, 'failed')
      assert.deepEqual(
        preview.preview.scopedWork,
        service.scopedWorkFor(
          f.task.id,
          attemptId,
          f.assessment.id,
          LOCAL_ACTOR
        )
      )
      assert.match(preview.preview.title, /bounded work/i)
      assert.match(preview.preview.body, /Candidate verification: failed/)
      assert.match(preview.preview.body, /Target integration: pending/)
      assert.doesNotMatch(
        preview.preview.body,
        /Local verification passed the retained obligations/
      )
      assert.equal(counts.deliver, 0)
      const firstPreview = preview
      const secondAssessment = await service.waitTargetAssessment(
        service.startTargetAssessment(
          { ...f.assessmentRequest, requestId: randomUUID() },
          LOCAL_ACTOR
        )
      )
      preview = await service.prepareScopedReview(
        f.task.id,
        { ...selection, assessmentId: secondAssessment.id },
        LOCAL_ACTOR
      )
      assert.notEqual(preview.previewDigest, firstPreview.previewDigest)
      assert.equal(preview.preview.scopedWork.assessmentId, secondAssessment.id)
      await assert.rejects(
        service.reviewTask(
          f.task.id,
          {
            action: 'confirm',
            confirm: true,
            previewDigest: firstPreview.previewDigest
          },
          LOCAL_ACTOR
        ),
        /exact preview/
      )
      assert.equal(counts.deliver, 0)
      const saved = service.getReview(f.task.id)
      const reads = t.mock.method(fs, 'readFileSync')
      assert.strictEqual(service.getReview(f.task.id), saved)
      assert.equal(reads.mock.callCount(), 0)
      reads.mock.restore()
      await service.close()
      service = createService(f.repository, {
        directory: f.runs,
        deliveryAdapter: adapter
      })
      assert.deepEqual(service.getReview(f.task.id), preview)
      const maps = t.mock.method(Map.prototype, 'get')
      const result = await service.reviewTask(
        f.task.id,
        {
          action: 'confirm',
          confirm: true,
          previewDigest: preview.previewDigest
        },
        LOCAL_ACTOR
      )
      assert.equal(
        maps.mock.calls.filter(
          (call) => call.result?.taskId === f.task.id && call.result?.admission
        ).length,
        1
      )
      maps.mock.restore()
      assert.equal(result.state, 'submitted-for-review')
      assert.equal(counts.deliver, 1)
      await assert.rejects(
        service.prepareScopedReview(f.task.id, selection, LOCAL_ACTOR),
        /another scope/
      )
      assert.equal(counts.deliver, 1)
      assert.deepEqual(service.state().mapping, baseline)
      assert.equal(
        service.getTask(f.task.id).attempts.at(-1).verdict.evidence.status,
        'failed'
      )
    } finally {
      await service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'scoped review selector is detached before asynchronous preparation begins',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async () => {
    const adapter = {
      repository: 'offline/scoped',
      base: 'main',
      async inspect() {
        return { baseSha: 'b'.repeat(40), baseTree: 'c'.repeat(40) }
      }
    }
    const f = await scopedWorkFixture(null, adapter)
    try {
      const selection = {
        attemptId: f.task.attempts.at(-1).id,
        assessmentId: f.assessment.id
      }
      const preparing = f.service.prepareScopedReview(
        f.task.id,
        selection,
        LOCAL_ACTOR
      )
      selection.assessmentId = randomUUID()
      const preview = await preparing
      assert.equal(preview.preview.scopedWork.assessmentId, f.assessment.id)
      const reads = { attemptId: 0, assessmentId: 0 }
      const accessorPreview = await f.service.prepareScopedReview(
        f.task.id,
        {
          get attemptId() {
            reads.attemptId++
            return reads.attemptId === 1 ? selection.attemptId : 'invalid'
          },
          get assessmentId() {
            reads.assessmentId++
            return reads.assessmentId === 1 ? f.assessment.id : randomUUID()
          }
        },
        LOCAL_ACTOR
      )
      assert.deepEqual(reads, { attemptId: 1, assessmentId: 1 })
      assert.equal(accessorPreview.preview.attemptId, selection.attemptId)
      assert.equal(
        accessorPreview.preview.scopedWork.assessmentId,
        f.assessment.id
      )
    } finally {
      await f.service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'scoped review durable format rejects removed and partial source identities without legacy downgrade',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async () => {
    const adapter = {
      repository: 'offline/scoped',
      base: 'main',
      async inspect() {
        return { baseSha: 'b'.repeat(40), baseTree: 'c'.repeat(40) }
      }
    }
    const f = await scopedWorkFixture(null, adapter)
    let service = f.service
    try {
      const preview = await service.prepareScopedReview(
        f.task.id,
        { attemptId: f.task.attempts.at(-1).id, assessmentId: f.assessment.id },
        LOCAL_ACTOR
      )
      await service.close()
      const file = path.join(f.runs, 'reviews', f.task.id + '.json')
      const mutations = [
        (p) => {
          p.preview.scopedWork.roles.accepted.reference.descriptor.format = 99
        },
        (p) => {
          p.preview.scopedWork.roles.accepted.reference.descriptor.files.pop()
        },
        (p) => {
          const producer = p.preview.scopedWork.producers[0]
          producer.reference = {
            ...producer.reference,
            attemptId: randomUUID()
          }
        },

        (p) => {
          delete p.preview.scopedWork.runtime.sourceDigest
        },
        (p) => {
          p.preview.scopedWork.runtime = {}
        },
        (p) => {
          delete p.preview.scopedWork.acceptedVersion.revision
        },
        (p) => {
          p.preview.scopedWork.roles.target.reference = {}
        },
        (p) => {
          p.preview.scopedWork.workBinding.workId = randomUUID()
        },
        (p) => {
          p.preview.scopedWork.runtime.taskId = randomUUID()
        },
        (p) => {
          p.preview.scopedWork.producers = []
        },
        (p) => {
          delete p.preview.scopedWork
        },
        (p) => {
          p.preview.scopedWork = null
        },
        (p) => {
          p.format = 1
        },
        (p) => {
          p.format = null
        },
        (p) => {
          p.format = 99
        }
      ]
      const required = [
        ...[
          'assessmentId',
          'taskId',
          'attemptId',
          'targetId',
          'allocationRevision',
          'workId',
          'workBinding',
          'acceptedBaseline',
          'acceptedVersion',
          'targetVerification',
          'roles',
          'runtime',
          'work',
          'integration',
          'producers'
        ].map((key) => [key]),
        ...[
          'taskId',
          'attemptId',
          'repository',
          'head',
          'sourceDigest',
          'runtimeSourceDigest',
          'configurationDigest',
          'verificationSourceDigest',
          'executionSourceDigest',
          'contractDigest',
          'mappingVersion',
          'architectureVersion',
          'lockfileDigest'
        ].map((key) => ['runtime', key]),
        ...['revision', 'contractDigest'].flatMap((key) => [
          ['acceptedBaseline', key],
          ['acceptedVersion', key]
        ]),
        ...['targetId', 'workId', 'admissionId'].map((key) => [
          'workBinding',
          key
        ]),
        ...['reviewId', 'candidateDigest'].map((key) => [
          'targetVerification',
          key
        ]),
        ...['accepted', 'target'].flatMap((role) => [
          ...[
            'slotId',
            'contractDigest',
            'verificationSourceDigest',
            'reference'
          ].map((key) => ['roles', role, key]),
          ...[
            'attemptId',
            'repository',
            'head',
            'sourceDigest',
            'configurationDigest',
            'descriptor'
          ].map((key) => ['roles', role, 'reference', key]),
          ...[
            'format',
            'contractDigest',
            'mappingVersion',
            'architectureVersion',
            'roles',
            'files',
            'digest'
          ].map((key) => ['roles', role, 'reference', 'descriptor', key]),
          ...['manifest', 'architecture', 'spec', 'test', 'configuration'].map(
            (key) => ['roles', role, 'reference', 'descriptor', 'roles', key]
          )
        ]),
        ...[
          'id',
          'roles',
          'contractDigest',
          'verificationSourceDigest',
          'reference',
          'sourceDigest',
          'configurationDigest',
          'runtimeSourceDigest',
          'executionSourceDigest'
        ].map((key) => ['producers', 0, key])
      ]
      const changes = mutations.map((mutate, index) => ({
        name: 'identity mutation ' + index,
        mutate
      }))
      for (const keys of required)
        changes.push({
          name: keys.join('.'),
          mutate(value) {
            let parent = value.preview.scopedWork
            for (const key of keys.slice(0, -1)) parent = parent[key]
            Reflect.deleteProperty(parent, keys.at(-1))
          }
        })
      changes.push({
        name: 'aliased role paths',
        mutate(value) {
          const roles =
            value.preview.scopedWork.roles.accepted.reference.descriptor.roles
          roles.test = roles.configuration
        }
      })
      changes.push({
        name: 'uncanonical producer roles',
        mutate(value) {
          value.preview.scopedWork.producers[0].roles.reverse()
        }
      })
      const { createReviewOwner } = require('../pr-review.cjs')
      for (const { name, mutate } of changes) {
        const value = structuredClone(preview)
        mutate(value)
        value.previewDigest = sourceOwner.sha256(JSON.stringify(value.preview))
        fs.writeFileSync(file, JSON.stringify(value))
        assert.throws(
          () =>
            createReviewOwner(f.repository, { directory: path.dirname(file) }),
          /scoped|format|identity/i,
          name
        )
      }
      fs.writeFileSync(file, JSON.stringify(preview))
      service = createService(f.repository, {
        directory: f.runs,
        deliveryAdapter: adapter
      })
      assert.deepEqual(service.getReview(f.task.id), preview)
    } finally {
      await service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'scoped review serial lifetime blocks different scope and source mutation while preparation is pending',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    let release,
      entered,
      inspections = 0
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const started = new Promise((resolve) => {
      entered = resolve
    })
    const adapter = {
      repository: 'offline/scoped',
      base: 'main',
      async inspect() {
        inspections++
        entered()
        await gate
        return { baseSha: 'b'.repeat(40), baseTree: 'c'.repeat(40) }
      }
    }
    const f = await scopedWorkFixture(null, adapter)
    try {
      const selection = {
        attemptId: f.task.attempts.at(-1).id,
        assessmentId: f.assessment.id
      }
      for (const invalid of [
        null,
        {},
        { ...selection, extra: true },
        { ...selection, attemptId: null }
      ])
        await assert.rejects(
          f.service.prepareScopedReview(f.task.id, invalid, LOCAL_ACTOR),
          /selection/
        )
      const reads = t.mock.method(fs, 'readFileSync')
      const hashPrototype = Object.getPrototypeOf(
        require('node:crypto').createHash('sha256')
      )
      const hashes = t.mock.method(hashPrototype, 'update')
      const maps = t.mock.method(Map.prototype, 'get')
      const preparing = f.service.prepareScopedReview(
        f.task.id,
        selection,
        LOCAL_ACTOR
      )
      await started
      const sourceCalls = maps.mock.calls.filter(
        (call) => call.result?.taskId === f.task.id && call.result?.admission
      )
      assert.equal(sourceCalls.length, 1)
      const same = f.service.prepareScopedReview(
        f.task.id,
        { ...selection },
        LOCAL_ACTOR
      )
      await assert.rejects(
        f.service.prepareScopedReview(
          f.task.id,
          { ...selection, assessmentId: randomUUID() },
          LOCAL_ACTOR
        ),
        /different review/
      )
      await assert.rejects(
        f.service.controlTask(f.task.id, { action: 'revoke' }, LOCAL_ACTOR),
        /review is active/
      )
      assert.throws(
        () => f.service.decideTarget({}, LOCAL_ACTOR),
        /review is active/
      )
      assert.throws(
        () =>
          f.service.startTargetAssessment(
            { ...f.assessmentRequest, requestId: randomUUID() },
            LOCAL_ACTOR
          ),
        /review is active/
      )
      assert.equal(inspections, 1)
      const manifest = path.join(
        f.task.snapshot.sourceRoot,
        'packages/factory/package.json'
      )
      assert.equal(
        reads.mock.calls.filter((call) => call.arguments[0] === manifest)
          .length,
        1
      )
      const manifestIdentity = JSON.stringify(
        f.task.attempts.at(-1).verdict.files
      )
      assert.equal(
        hashes.mock.calls.filter(
          (call) => call.arguments[0] === manifestIdentity
        ).length,
        0
      )
      maps.mock.restore()
      reads.mock.restore()
      hashes.mock.restore()
      release()
      assert.strictEqual(await same, await preparing)
      const preview = f.service.getReview(f.task.id)
      await f.service.controlTask(f.task.id, { action: 'revoke' }, LOCAL_ACTOR)
      await assert.rejects(
        f.service.reviewTask(
          f.task.id,
          {
            action: 'confirm',
            confirm: true,
            previewDigest: preview.previewDigest
          },
          LOCAL_ACTOR
        ),
        /unavailable|stale/
      )
      const historyLookups = t.mock.method(Map.prototype, 'get')
      const historyReads = t.mock.method(fs, 'readFileSync')
      for (let i = 0; i < 3; i++) f.service.getReview(f.task.id)
      assert.equal(
        historyLookups.mock.calls.filter(
          (call) => call.this === sourceCalls[0].this
        ).length,
        0
      )
      assert.equal(historyReads.mock.callCount(), 0)
      historyLookups.mock.restore()
      historyReads.mock.restore()
      assert.strictEqual(f.service.getReview(f.task.id), preview)
      assert.equal(inspections, 1)
    } finally {
      release()
      await f.service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)

test(
  'scoped review rejects a non-passing task report redirected outside its fixed attempt location',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async () => {
    let inspections = 0
    const adapter = {
      repository: 'offline/scoped',
      base: 'main',
      async inspect() {
        inspections++
        return { baseSha: 'b'.repeat(40), baseTree: 'c'.repeat(40) }
      }
    }
    const f = await scopedWorkFixture(null, adapter)
    let service = f.service
    try {
      await service.close()
      const file = path.join(f.runs, 'tasks', f.task.id, 'task.json')
      const record = JSON.parse(fs.readFileSync(file, 'utf8'))
      const verdict = record.attempts.at(-1).verdict
      const substitute = path.join(f.runs, 'substitute-report.json')
      fs.writeFileSync(substitute, fs.readFileSync(verdict.runner.reportPath))
      verdict.runner.reportPath = substitute
      fs.writeFileSync(file, JSON.stringify(record))
      service = createService(f.repository, {
        directory: f.runs,
        deliveryAdapter: adapter
      })
      await assert.rejects(
        service.prepareScopedReview(
          f.task.id,
          {
            attemptId: record.attempts.at(-1).id,
            assessmentId: f.assessment.id
          },
          LOCAL_ACTOR
        ),
        /report location/
      )
      assert.equal(inspections, 0)
    } finally {
      await service.close()
      fs.rmSync(f.dir, { recursive: true, force: true })
    }
  }
)
