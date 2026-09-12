/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { createService, LOCAL_ACTOR } = require('../service.cjs')
const root = path.resolve(__dirname, '../../../..')
function directory(t) {
  const parent = path.join(root, 'tmp/flow-inspector/operations-tests')
  fs.mkdirSync(parent, { recursive: true })
  const dir = fs.mkdtempSync(path.join(parent, 'store-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}
test('provider capability is service-owned and state reports the same retained request observations', async (t) => {
  const authorization = {
    id: randomUUID(),
    actor: LOCAL_ACTOR.id,
    adapter: 'codex-app-server',
    model: 'gpt-5.6-sol',
    billing: 'chatgpt-subscription',
    maxRequests: 1,
    expiresAt: '2099-01-01T00:00:00.000Z'
  }
  const service = createService(root, {
    directory: directory(t),
    agentOptions: {
      available: () => true,
      providerAuthorization: authorization,
      providerComplete: async () => ({
        text: '{"tool":"shell"}',
        terminal: true,
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
      })
    }
  })
  try {
    assert.deepEqual(service.state().tasks.providerAuthorization, authorization)
    const contract = service.contract()
    const id = service.startTask(
      {
        requestId: randomUUID(),
        stepId: 'finalize-transaction-state',
        objective: 'Bounded offline adapter contract case',
        allowedFiles: ['packages/factory/src/data-transact.ts'],
        adapter: 'provider',
        scenario: 'task',
        providerAuthorizationId: authorization.id,
        budgets: { elapsedMs: 60000, toolCalls: 3, attempts: 2 },
        contractDigest: contract.digest,
        revision: 1
      },
      LOCAL_ACTOR
    )
    await service.waitTask(id)
    assert.deepEqual(
      service.state().tasks.records[0].providerRequests,
      service.getTask(id).providerRequests
    )
    assert.equal(service.getTask(id).deliveryStatus, 'not-delivered')
  } finally {
    await service.close()
  }
})
test(
  'candidate proof, explicit evolution acceptance, retained versions and shared reads survive restart',
  { timeout: 30000 },
  async (t) => {
    const dir = directory(t)
    let service = createService(root, { directory: dir })
    try {
      const id = service.start({ mode: 'candidate' }, LOCAL_ACTOR)
      const result = await service.wait(id)
      assert.equal(result.evidence.status, 'passed')
      assert.equal(service.get(id).matchesCurrentContract, false)
      const review = service.prepareEvolution({ attemptId: id }, LOCAL_ACTOR)
      assert.equal(review.blockers.length, 0)
      const request = {
        id: review.id,
        decision: 'accept',
        reason: 'Admit reviewed baseline'
      }
      service.decideEvolution(request, LOCAL_ACTOR)
      assert.equal(service.state().evolution.revision, 2)
      const shared = service.shared()
      assert.equal(shared.workStatus, 'untracked')
      assert.equal(shared.deliveryStatus, 'not-assessed')
      assert.equal(shared.verificationStatus, 'unknown')
      const original = fs.readFileSync
      let reads = 0
      fs.readFileSync = (...args) => {
        reads++
        return original(...args)
      }
      try {
        for (let i = 0; i < 10; i++) {
          assert.strictEqual(service.shared(), shared)
          service.state()
        }
      } finally {
        fs.readFileSync = original
      }
      assert.equal(reads, 0)
      await service.close()
      service = createService(root, { directory: dir })
      assert.equal(service.state().evolution.revision, 2)
      assert.equal(service.state().evolution.versions.length, 2)
      assert.equal(
        service.state().evolution.decisions[0].reason,
        request.reason
      )
    } finally {
      await service.close()
    }
  }
)
for (const [githubActions, provider] of [
  ['false', 'local-ci-trial'],
  ['true', 'github-actions']
])
  test(
    'CI uses all flows, retains raw report and explicit external blockers, and request retry never executes twice - ' +
      provider,
    { timeout: 30000 },
    async (t) => {
      const previous = process.env.GITHUB_ACTIONS
      process.env.GITHUB_ACTIONS = githubActions
      t.after(() => {
        if (previous === undefined) delete process.env.GITHUB_ACTIONS
        else process.env.GITHUB_ACTIONS = previous
      })
      const service = createService(root, { directory: directory(t) })
      try {
        assert.throws(
          () =>
            service.start(
              { mode: 'ci' },
              { id: 'viewer', capabilities: ['verify'] }
            ),
          /authorized/
        )
        assert.throws(
          () =>
            service.start(
              { mode: 'ci', flowIds: ['deferred-publication'] },
              LOCAL_ACTOR
            ),
          /all/
        )
        const request = { mode: 'ci', requestId: randomUUID() }
        const id = service.start(request, LOCAL_ACTOR),
          record = await service.wait(id)
        assert.equal(record.evidence.cases.length, 6)
        assert.ok(record.ci.blockers.length)
        assert.equal(record.ci.deliveryStatus, 'blocked')
        assert.equal(service.start(request, LOCAL_ACTOR), id)
        assert.equal(service.state().runs.length, 1)
        assert.equal(
          JSON.parse(service.readArtifact(id, 'ci-envelope')).provider,
          provider
        )
        assert.equal(service.shared().deliveryStatus, 'blocked')
      } finally {
        await service.close()
      }
    }
  )
test('unknown or denied evolution decisions have no version side effects', async (t) => {
  const service = createService(root, { directory: directory(t) })
  try {
    assert.throws(
      () =>
        service.prepareEvolution(
          { attemptId: randomUUID() },
          { id: 'viewer', capabilities: [] }
        ),
      /authorized/
    )
    assert.throws(
      () =>
        service.decideEvolution(
          { id: 'missing', decision: 'accept', reason: 'x' },
          LOCAL_ACTOR
        ),
      /review/i
    )
    assert.equal(service.state().evolution.revision, 1)
  } finally {
    await service.close()
  }
})

test(
  'registered CI ingestion deduplicates exact deliveries, rejects conflicts, and survives restart',
  { timeout: 30000 },
  async (t) => {
    const local = createService(root, { directory: directory(t) })
    let envelope
    try {
      const record = await local.wait(local.start({ mode: 'ci' }, LOCAL_ACTOR))
      envelope = JSON.parse(local.readArtifact(record.id, 'ci-envelope'))
    } finally {
      await local.close()
    }
    envelope.provider = 'github-actions'
    envelope.runId = '100'
    const expected = Object.fromEntries(
      [
        'repository',
        'base',
        'head',
        'integration',
        'runId',
        'attempt',
        'sourceDigest',
        'configurationDigest',
        'lockfileDigest',
        'policyDigest'
      ].map((key) => [key, envelope[key]])
    )
    expected.policyDigest = '0'.repeat(64)
    const dir = directory(t)
    let service = createService(root, {
      directory: dir,
      ciAdmission: { expected }
    })
    try {
      assert.throws(
        () =>
          service.ingestCI({ envelope }, { id: 'viewer', capabilities: [] }),
        /authorized/
      )
      const imported = service.ingestCI({ envelope }, LOCAL_ACTOR)
      assert.equal(imported.result.evidence.cases.length, 6)
      assert.equal(service.shared().verificationStatus, 'unknown')
      assert.equal(service.shared().remaining.length, 6)
      assert.deepEqual(service.ingestCI({ envelope }, LOCAL_ACTOR), imported)
      assert.equal(service.state().ci.deliveries.length, 1)
      const conflict = structuredClone(envelope)
      conflict.providerConclusion = 'failure'
      assert.throws(
        () => service.ingestCI({ envelope: conflict }, LOCAL_ACTOR),
        /conflict/
      )
      await service.close()
      service = createService(root, {
        directory: dir,
        ciAdmission: { expected }
      })
      assert.equal(service.state().ci.deliveries.length, 1)
      assert.equal(service.shared().deliveryStatus, 'blocked')
      assert.equal(
        JSON.parse(service.readCIArtifact(imported.id, 'envelope')).runId,
        envelope.runId
      )
      const preview = await service.wait(
        service.start({ mode: 'candidate' }, LOCAL_ACTOR)
      )
      const review = service.prepareEvolution(
        { attemptId: preview.id },
        LOCAL_ACTOR
      )
      service.decideEvolution(
        { id: review.id, decision: 'accept', reason: 'New accepted version' },
        LOCAL_ACTOR
      )
      assert.equal(service.shared().verificationStatus, 'unknown')
      assert.equal(service.shared().deliveryStatus, 'not-assessed')
      await service.close()
      const older = { ...envelope, runId: '99' }
      service = createService(root, {
        directory: dir,
        ciAdmission: { expected: { ...expected, runId: '99' } }
      })
      assert.throws(
        () => service.ingestCI({ envelope: older }, LOCAL_ACTOR),
        /stale/
      )
      assert.equal(service.state().ci.deliveries.length, 1)
    } finally {
      await service.close()
    }
  }
)

test('reported work completion is independent of verification and shared snapshots cannot be mutated by readers', async (t) => {
  const service = createService(root, { directory: directory(t) })
  try {
    const steps = [
      ...new Set(service.contract().cases.map((item) => item.stepId))
    ]
    assert.throws(
      () =>
        service.setWork(
          { stepId: steps[0], status: 'complete', reason: 'done' },
          { id: 'viewer', capabilities: [] }
        ),
      /authorized/
    )
    for (const stepId of steps)
      service.setWork(
        { stepId, status: 'complete', reason: 'Implementation reviewed' },
        LOCAL_ACTOR
      )
    assert.equal(service.shared().workStatus, 'reported-complete')
    assert.equal(service.shared().verificationStatus, 'unknown')
    assert.equal(service.shared().deliveryStatus, 'not-assessed')
    const shared = service.shared(),
      goal = shared.goals[0].goal
    assert.equal(Reflect.set(shared.goals[0], 'goal', 'forged'), false)
    assert.equal(service.shared().goals[0].goal, goal)
    assert.equal(service.shared().remainingWork.length, 0)
  } finally {
    await service.close()
  }
})

test(
  'actual runtime violation is rejected by CI and a baseline correction restores all six obligations',
  { timeout: 30000 },
  async (t) => {
    const service = createService(root, { directory: directory(t) })
    try {
      const negative = await service.wait(
        service.start(
          { mode: 'ci-demo', scenario: 'inverse-regression' },
          LOCAL_ACTOR
        )
      )
      assert.equal(negative.ci.evidence.status, 'failed')
      assert.equal(negative.ci.deliveryStatus, 'blocked')
      assert.equal(negative.deliveryStatus, negative.ci.deliveryStatus)
      assert.deepEqual(service.get(negative.id), negative)
      assert.deepEqual(
        negative.ci.evidence.cases
          .filter((c) => c.status === 'failed')
          .map((c) => c.id)
          .sort(),
        ['cancel.delivery', 'cancel.outcome']
      )
      assert.equal(negative.evidence.flows[0].status, 'passed')
      assert.deepEqual(negative.evidence.issues, [])
      const corrected = await service.wait(
        service.start({ mode: 'ci' }, LOCAL_ACTOR)
      )
      assert.equal(corrected.ci.evidence.status, 'passed')
      assert.equal(corrected.ci.evidence.passedCount, 6)
      assert.equal(corrected.snapshot.digest, negative.snapshot.digest)
      assert.notEqual(corrected.id, negative.id)
    } finally {
      await service.close()
    }
  }
)

test('agent actions share capability, task identity, all-flow policy and mutual exclusion', async (t) => {
  const dir = directory(t)
  const service = createService(root, {
    directory: dir,
    agentOptions: {
      available: () => true,
      verify: async () => ({ evidence: { status: 'unknown' } })
    }
  })
  try {
    const state = service.state()
    const request = {
      requestId: randomUUID(),
      stepId: 'finalize-transaction-state',
      objective: 'Review isolated source',
      allowedFiles: ['packages/factory/src/data-transact.ts'],
      adapter: 'demonstration',
      scenario: 'stall',
      contractDigest: state.contract.digest,
      revision: state.mapping.revision,
      budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 }
    }
    assert.throws(
      () => service.startTask(request, { id: 'agent', capabilities: [] }),
      /authorized/
    )
    assert.equal(service.state().tasks.records.length, 0)
    const id = service.startTask(request, LOCAL_ACTOR)
    assert.equal(service.startTask(request, LOCAL_ACTOR), id)
    assert.throws(() => service.start({}, LOCAL_ACTOR), /running/)
    assert.throws(() => service.prepareMapping({}, LOCAL_ACTOR), /running/)
    const stopped = await service.controlTask(
      id,
      { action: 'handoff' },
      LOCAL_ACTOR
    )
    assert.equal(stopped.phase, 'handed-off')
    assert.equal(service.state().mapping.revision, state.mapping.revision)
    assert.equal(service.state().tasks.records[0].id, id)
  } finally {
    await service.close()
  }
})

test(
  'PR review broker binds real candidate evidence, API and CLI to one durable review record',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const { startServer } = require('../server.cjs')
    const { main } = require('../cli.cjs')
    let effects = 0
    const adapter = {
      repository: 'owner/repo',
      base: 'main',
      inspect: async () => ({
        baseSha: 'a'.repeat(40),
        baseTree: 'b'.repeat(40)
      }),
      deliver: async (p, checkpoint) => {
        effects++
        await checkpoint('create-pr', { expectedHead: 'c'.repeat(40) })
        return {
          number: 1,
          state: 'open',
          headSha: 'c'.repeat(40),
          draft: true
        }
      },
      observe: async () => ({
        number: 1,
        state: 'merged',
        headSha: 'd'.repeat(40),
        checks: { headSha: 'd'.repeat(40), status: 'passed' }
      })
    }
    const server = await startServer(root, {
      serviceOptions: { directory: directory(t), deliveryAdapter: adapter },
      url: 'http://127.0.0.1:0'
    })
    try {
      const service = server.service
      const initial = service.state().mapping.revision
      const id = service.startTask(
        {
          requestId: randomUUID(),
          stepId: 'finalize-transaction-state',
          objective:
            'Offline PR review transport with real local candidate verification',
          allowedFiles: ['packages/factory/src/data-transact.ts'],
          adapter: 'demonstration',
          scenario: 'repair',
          contractDigest: service.contract().digest,
          revision: initial,
          budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 }
        },
        LOCAL_ACTOR
      )
      assert.equal((await service.waitTask(id)).verificationStatus, 'passed')
      await assert.rejects(
        () =>
          service.reviewTask(
            id,
            { action: 'prepare' },
            { id: LOCAL_ACTOR.id, capabilities: [] }
          ),
        /authorized/
      )
      const lines = []
      assert.equal(
        await main(['--url', server.origin, 'pr-prepare', id], {
          repositoryRoot: root,
          write: (x) => lines.push(x)
        }),
        0
      )
      const prepared = JSON.parse(lines.pop())
      assert.equal(prepared.preview.taskId, id)
      assert.equal(prepared.preview.metadata.packageName, '@asyra/factory')
      assert.equal(prepared.preview.metadata.validation.status, 'passed')
      assert.deepEqual(prepared.preview.deliveryFiles, [
        'packages/factory/src/data-transact.ts',
        prepared.preview.metadata.path
      ])
      const read = await fetch(
        server.origin + '/api/tasks/' + id + '/review'
      ).then((r) => r.json())
      assert.deepEqual(read, prepared)
      assert.equal(effects, 0)
      await assert.rejects(
        () =>
          service.reviewTask(
            id,
            {
              action: 'confirm',
              confirm: true,
              previewDigest: prepared.previewDigest,
              repository: 'evil/repo'
            },
            LOCAL_ACTOR
          ),
        /Invalid/
      )
      assert.equal(
        await main(
          [
            '--url',
            server.origin,
            'pr-confirm',
            id,
            prepared.previewDigest,
            'confirm'
          ],
          { repositoryRoot: root, write: (x) => lines.push(x) }
        ),
        0
      )
      const submitted = JSON.parse(lines.pop())
      assert.equal(submitted.state, 'submitted-for-review')
      assert.deepEqual(submitted.preview, prepared.preview)
      assert.ok(
        submitted.audit.some((item) => item.event === 'human-confirmed')
      )
      assert.equal(effects, 1)
      await main(['--url', server.origin, 'pr-refresh', id], {
        repositoryRoot: root,
        write: (x) => lines.push(x)
      })
      assert.equal(JSON.parse(lines.pop()).observation.state, 'merged')
      assert.equal(service.state().mapping.revision, initial)
      assert.equal(service.getTask(id).deliveryStatus, 'not-delivered')
      assert.equal(service.getTask(id).verificationStatus, 'passed')
    } finally {
      await server.close()
    }
  }
)

test(
  'delivery preparation excludes competing proof and task mutations and publishes review revision',
  { skip: process.platform !== 'darwin', timeout: 15000 },
  async (t) => {
    let release, entered
    const ready = new Promise((resolve) => (entered = resolve))
    const service = createService(root, {
      directory: directory(t),
      deliveryAdapter: {
        repository: 'owner/repo',
        base: 'main',
        inspect: async () => {
          entered()
          await new Promise((resolve) => (release = resolve))
          return { baseSha: 'a'.repeat(40), baseTree: 'b'.repeat(40) }
        }
      }
    })
    try {
      const request = {
        requestId: randomUUID(),
        stepId: 'finalize-transaction-state',
        objective: 'Offline concurrency boundary',
        allowedFiles: ['packages/factory/src/data-transact.ts'],
        adapter: 'demonstration',
        scenario: 'repair',
        contractDigest: service.contract().digest,
        revision: 1,
        budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 }
      }
      const id = service.startTask(request, LOCAL_ACTOR)
      await service.waitTask(id)
      const preparing = service.reviewTask(
        id,
        { action: 'prepare' },
        LOCAL_ACTOR
      )
      await ready
      try {
        assert.throws(() => service.start({}, LOCAL_ACTOR), /review|delivery/)
        assert.throws(
          () =>
            service.startTask(
              { ...request, requestId: randomUUID() },
              LOCAL_ACTOR
            ),
          /review|delivery/
        )
      } finally {
        release()
        await preparing
      }
      assert.ok(service.state().tasks.records[0].reviewRevision > 0)
    } finally {
      await service.close()
    }
  }
)

test('invalid retained delivery refuses startup without leaking the exclusive store lock', (t) => {
  const dir = directory(t)
  const service = createService(root, { directory: dir })
  return service.close().then(() => {
    fs.writeFileSync(path.join(dir, 'reviews', randomUUID() + '.json'), '{}')
    assert.throws(
      () => createService(root, { directory: dir }),
      /retained delivery/
    )
    assert.throws(
      () => createService(root, { directory: dir }),
      /retained delivery/
    )
  })
})

test(
  'admitted work retains real Factory failure and correction without accepting target or baseline',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const service = createService(root, { directory: directory(t) })
    try {
      const baseline = await service.wait(service.start({}, LOCAL_ACTOR))
      assert.equal(baseline.evidence.status, 'passed')
      const contract = service.contract()
      const work = {
        id: randomUUID(),
        title: 'Cancellation outcome',
        scope: 'Retain inverse restoration',
        stepId: 'finalize-transaction-state',
        obligationIds: ['cancel.outcome'],
        allowedFiles: ['packages/factory/src/data-transact.ts'],
        prerequisites: []
      }
      const target = service.decideTarget(
        {
          action: 'create',
          requestId: randomUUID(),
          expectedRevision: 0,
          reason: 'Real offline source proof',
          flowId: 'immediate-cancellation',
          targetRevision: contract.digest,
          acceptedBaseline: { revision: 1, contractDigest: contract.digest },
          objective: 'Develop cancellation',
          works: [work],
          pending: ['cancel.snapshot', 'cancel.delivery']
        },
        LOCAL_ACTOR
      )
      const admission = {
        action: 'admit',
        targetId: target.id,
        requestId: randomUUID(),
        expectedRevision: 1,
        reason: 'Freeze cancellation work',
        workId: work.id,
        taskId: randomUUID(),
        sourceAttemptId: baseline.id
      }
      service.decideTarget(admission, LOCAL_ACTOR)
      const id = service.startTask(
        {
          requestId: admission.taskId,
          stepId: work.stepId,
          objective: work.scope,
          allowedFiles: work.allowedFiles,
          adapter: 'demonstration',
          scenario: 'regression',
          contractDigest: contract.digest,
          revision: 1,
          budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 },
          workBinding: {
            targetId: target.id,
            workId: work.id,
            admissionId: admission.requestId
          }
        },
        LOCAL_ACTOR
      )
      const failed = await service.waitTask(id)
      assert.equal(failed.verificationStatus, 'failed')
      assert.equal(
        service.getTarget(target.id).works[0].assessment.status,
        'failed'
      )
      await service.controlTask(
        id,
        { action: 'resume', scenario: 'repair' },
        LOCAL_ACTOR
      )
      const corrected = await service.waitTask(id)
      assert.equal(corrected.verificationStatus, 'passed')
      assert.equal(corrected.attempts.at(-1).verdict.evidence.cases.length, 6)
      assert.equal(corrected.attempts[0].verdict.evidence.status, 'failed')
      const result = service.getTarget(target.id)
      assert.equal(result.works[0].assessment.status, 'passed')
      assert.equal(result.status, 'pending')
      assert.deepEqual(result.pending, ['cancel.snapshot', 'cancel.delivery'])
      assert.equal(service.state().mapping.revision, 1)
    } finally {
      await service.close()
    }
  }
)
