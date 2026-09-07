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
