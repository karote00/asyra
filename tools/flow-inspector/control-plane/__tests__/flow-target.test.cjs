/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { loadContract, admitContract } = require('../contracts.cjs')
const { createTargetOwner } = require('../flow-target.cjs')
const root = path.resolve(__dirname, '../../../..')
function setup(t) {
  const parent = path.join(root, 'tmp/flow-inspector/target-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'store-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const accepted = loadContract(root)
  const definition = structuredClone(accepted.definition)
  // Structurally admitted offline target; no claim of additional Factory evidence.
  definition.flows[0].cases.push({
    ...definition.flows[0].cases[0],
    id: 'future.obligation',
    testName: 'Future obligation fixture'
  })
  const contract = admitContract(definition, accepted.architectureDefinition)
  const tasks = new Map(),
    reviews = new Map()
  const options = {
    repositoryRoot: root,
    directory,
    getContracts: () => [contract],
    getBaseline: () => ({ revision: 1, contractDigest: contract.digest }),
    getTask: (id) => tasks.get(id),
    getReview: (id) => reviews.get(id) ?? null
  }
  const owner = createTargetOwner(options)
  const flow = contract.flows[0]
  const works = contract.cases
    .filter((c) => c.flowId === flow.id)
    .slice(0, 3)
    .map((c, i) => ({
      id: randomUUID(),
      title: 'Work ' + (i + 1),
      stepId: c.stepId,
      obligationIds: [c.id],
      scope: 'Promise ' + c.id,
      allowedFiles: ['packages/factory/src/data-transact.ts'],
      prerequisites: []
    }))
  const request = {
    action: 'create',
    requestId: randomUUID(),
    expectedRevision: 0,
    reason: 'Explicit target admission',
    flowId: flow.id,
    targetRevision: contract.digest,
    acceptedBaseline: options.getBaseline(),
    objective: 'Develop one flow',
    works,
    pending: ['future.obligation']
  }
  const task = (work, status = 'passed') => {
    const id = randomUUID()
    tasks.set(id, {
      id,
      task: {
        stepId: work.stepId,
        step: structuredClone(
          contract.flows[0].steps.find((s) => s.id === work.stepId)
        ),
        objective: work.scope,
        allowedFiles: work.allowedFiles,
        contractDigest: contract.digest,
        revision: 1,
        obligations: contract.cases
      },
      attempts: [{ id: randomUUID(), verificationStatus: status }],
      verificationStatus: status
    })
    return id
  }
  return { owner, options, request, task, tasks, reviews }
}
const revise = (request, id, revision) => ({
  action: 'revise',
  targetId: id,
  requestId: randomUUID(),
  expectedRevision: revision,
  reason: 'Explicit revised allocation',
  objective: request.objective,
  works: request.works,
  pending: request.pending
})
const link = (id, revision, workId, taskId) => ({
  action: 'link',
  targetId: id,
  requestId: randomUUID(),
  expectedRevision: revision,
  reason: 'Reviewed exact task promise',
  workId,
  taskId
})
test('three work items and pending obligations survive replay and restart with immutable audit', (t) => {
  const { owner, options, request } = setup(t)
  const saved = owner.decide(request, 'local-developer')
  assert.equal(saved.revision, 1)
  assert.equal(owner.get(saved.id).works.length, 3)
  assert.deepEqual(owner.get(saved.id).pending, ['future.obligation'])
  assert.equal(owner.get(saved.id).status, 'pending')
  assert.deepEqual(owner.decide(request, 'local-developer'), saved)
  assert.deepEqual(
    createTargetOwner(options).get(saved.id),
    owner.get(saved.id)
  )
  assert.throws(
    () => owner.decide({ ...request, reason: 'conflict' }, 'local-developer'),
    /conflict/i
  )
  assert.throws(
    () => owner.decide(revise(request, saved.id, 0), 'local-developer'),
    /stale/i
  )
})
for (const [name, edit, error] of [
  [
    'flow',
    (r) => {
      r.flowId = 'missing'
    },
    /flow/i
  ],
  [
    'revision',
    (r) => {
      r.targetRevision = '0'.repeat(64)
    },
    /revision/i
  ],
  [
    'step',
    (r) => {
      r.works[0].stepId = 'missing'
    },
    /step/i
  ],
  [
    'obligation',
    (r) => {
      r.works[0].obligationIds = ['missing']
    },
    /obligation/i
  ],
  [
    'omission',
    (r) => {
      r.pending = []
    },
    /coverage/i
  ],
  [
    'empty scope',
    (r) => {
      r.works[0].scope = ''
    },
    /scope/i
  ],
  [
    'overlap',
    (r) => {
      r.pending.push(r.works[0].obligationIds[0])
    },
    /overlap/i
  ],
  [
    'missing prerequisite',
    (r) => {
      r.works[0].prerequisites = [
        { workId: randomUUID(), handoff: 'Required behavior' }
      ]
    },
    /prerequisite/i
  ],
  [
    'cycle',
    (r) => {
      r.works[0].prerequisites = [{ workId: r.works[1].id, handoff: 'a' }]
      r.works[1].prerequisites = [{ workId: r.works[0].id, handoff: 'b' }]
    },
    /cycle/i
  ],
  [
    'unsafe files',
    (r) => {
      r.works[0].allowedFiles = ['packages/factory/src/__tests__/fake.ts']
    },
    /file/i
  ]
])
  test('rejects ' + name + ' without retaining a target', (t) => {
    const { owner, request } = setup(t)
    edit(request)
    assert.throws(() => owner.decide(request, 'local-developer'), error)
    assert.deepEqual(owner.list(), [])
  })
test('exact task scope, multiple PR records and unknown handoffs never complete target', (t) => {
  const { owner, request, task, reviews, options } = setup(t)
  request.works[1].prerequisites = [
    {
      workId: request.works[0].id,
      handoff: 'Verify behavior in assessed source'
    }
  ]
  const saved = owner.decide(request, 'local-developer')
  const first = task(request.works[0]),
    second = task(request.works[1])
  reviews.set(first, {
    taskId: first,
    observation: { state: 'merged', head: 'a' },
    audit: [{ event: 'fixture' }]
  })
  reviews.set(second, {
    taskId: second,
    observation: { state: 'open', head: 'b' },
    audit: []
  })
  owner.decide(link(saved.id, 1, request.works[0].id, first), 'local-developer')
  owner.decide(
    link(saved.id, 2, request.works[1].id, second),
    'local-developer'
  )
  const value = owner.get(saved.id)
  assert.equal(value.tasks.length, 2)
  assert.equal(value.tasks[0].review.observation.state, 'merged')
  assert.equal(value.works[1].status, 'blocked')
  assert.equal(value.works[1].prerequisites[0].status, 'unconfirmed')
  assert.equal(value.status, 'pending')
  assert.deepEqual(createTargetOwner(options).get(saved.id), value)
  const wrong = task({ ...request.works[2], scope: 'Different scope' })
  assert.throws(
    () =>
      owner.decide(
        link(saved.id, 3, request.works[2].id, wrong),
        'local-developer'
      ),
    /scope/i
  )
})
test('failed commitment cannot be rewritten; explicit successor preserves failure and original obligation inventory', (t) => {
  const { owner, request, task } = setup(t)
  const saved = owner.decide(request, 'local-developer'),
    failed = task(request.works[0], 'failed')
  owner.decide(
    link(saved.id, 1, request.works[0].id, failed),
    'local-developer'
  )
  const changed = structuredClone(request)
  changed.works[0].scope = 'Revised promise'
  assert.throws(
    () => owner.decide(revise(changed, saved.id, 2), 'local-developer'),
    /immutable/i
  )
  changed.works[0].id = randomUUID()
  owner.decide(revise(changed, saved.id, 2), 'local-developer')
  const value = owner.get(saved.id)
  assert.equal(value.history.length, 3)
  assert.equal(value.history[0].state.works[0].scope, request.works[0].scope)
  assert.equal(value.tasks[0].task.verificationStatus, 'failed')
  assert.equal(value.status, 'pending')
})
test('ordinary projections read no files and query each distinct linked task once per target read', (t) => {
  const { owner, request, task, options } = setup(t)
  const saved = owner.decide(request, 'local-developer')
  owner.decide(
    link(saved.id, 1, request.works[0].id, task(request.works[0])),
    'local-developer'
  )
  let reads = 0,
    taskReads = 0
  const original = fs.readFileSync,
    getTask = options.getTask
  const restored = createTargetOwner({
    ...options,
    getTask: (id) => {
      taskReads++
      return getTask(id)
    }
  })
  fs.readFileSync = (...args) => {
    reads++
    return original(...args)
  }
  try {
    for (let i = 0; i < 5; i++) {
      restored.list()
      restored.get(saved.id)
    }
  } finally {
    fs.readFileSync = original
  }
  assert.equal(reads, 0)
  assert.equal(taskReads, 5)
})
test('nonexistent runtime files and tampered retained decisions reject', (t) => {
  const { owner, request, options } = setup(t)
  const invalid = structuredClone(request)
  invalid.works[0].allowedFiles = ['packages/factory/src/absent-target-file.ts']
  assert.throws(() => owner.decide(invalid, 'local-developer'), /file/i)
  owner.decide(request, 'local-developer')
  const file = path.join(options.directory, 'targets.json')
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'))
  saved.records[0].history[0].state.objective = 'Silently changed objective'
  fs.writeFileSync(file, JSON.stringify(saved))
  assert.throws(() => createTargetOwner(options), /decision/i)
})

test('task links cannot substitute a different admitted architecture for the target step', (t) => {
  const { owner, request, task, tasks } = setup(t)
  const saved = owner.decide(request, 'local-developer')
  const taskId = task(request.works[0])
  tasks.get(taskId).task.step.conditions = ['Different architecture promise']
  assert.throws(
    () =>
      owner.decide(
        link(saved.id, 1, request.works[0].id, taskId),
        'local-developer'
      ),
    /step contract/i
  )
})

test('repeated target reads reuse admitted revision history and allocation projections', (t) => {
  const { owner, request } = setup(t)
  const saved = owner.decide(request, 'local-developer')
  const first = owner.get(saved.id)
  const values = Object.values
  let historyTraversals = 0
  Object.values = (value) => {
    if (value === first.history) historyTraversals++
    return values(value)
  }
  try {
    for (let i = 0; i < 5; i++) {
      const next = owner.get(saved.id)
      assert.strictEqual(next.history, first.history)
      assert.strictEqual(next.works, first.works)
    }
  } finally {
    Object.values = values
  }
  assert.equal(
    historyTraversals,
    0,
    'admitted history must not be traversed again on reads'
  )
  const changed = structuredClone(request)
  changed.objective = 'Revised development objective'
  owner.decide(revise(changed, saved.id, 1), 'local-developer')
  const next = owner.get(saved.id)
  assert.notStrictEqual(next.history, first.history)
  assert.equal(next.objective, changed.objective)
  assert.equal(first.history.length, 1)
})

function admissionFixture(t) {
  const f = setup(t)
  const contract = f.options.getContracts()[0]
  const source = {
    id: randomUUID(),
    format: 2,
    phase: 'completed',
    scenario: 'baseline',
    mappingRevision: 1,
    contractDigest: contract.digest,
    snapshot: {
      head: 'a'.repeat(40),
      digest: 'b'.repeat(64),
      contractDigest: contract.digest
    },
    evidence: {
      status: 'passed',
      cases: contract.cases.map((c) => ({ ...c, status: 'passed' })),
      issues: []
    }
  }
  f.options.getSource = (id) => (id === source.id ? source : null)
  const owner = createTargetOwner(f.options)
  const target = owner.decide(f.request, 'local-developer')
  const taskId = randomUUID()
  const admission = {
    action: 'admit',
    targetId: target.id,
    expectedRevision: 1,
    requestId: randomUUID(),
    reason: 'Lock exact source and promise before work',
    workId: f.request.works[0].id,
    taskId,
    sourceAttemptId: source.id
  }
  const work = f.request.works[0]
  const task = {
    requestId: taskId,
    actor: 'local-developer',
    stepId: work.stepId,
    step: contract.flows[0].steps.find((s) => s.id === work.stepId),
    objective: work.scope,
    allowedFiles: work.allowedFiles,
    revision: 1,
    contractDigest: contract.digest,
    obligations: contract.cases,
    workBinding: {
      targetId: target.id,
      workId: work.id,
      admissionId: admission.requestId
    }
  }
  return { ...f, owner, source, admission, task, target }
}

test('admission reserves source and task before execution and survives restart without changing baseline', (t) => {
  const f = admissionFixture(t)
  const before = f.options.getBaseline()
  const result = f.owner.decide(f.admission, 'local-developer')
  assert.equal(result.revision, 2)
  assert.deepEqual(f.owner.decide(f.admission, 'local-developer'), result)
  assert.deepEqual(
    f.owner.checkTask(f.task, f.source.snapshot),
    result.decision.admission
  )
  const restored = createTargetOwner(f.options)
  assert.deepEqual(
    restored.checkTask(f.task, f.source.snapshot),
    result.decision.admission
  )
  assert.equal(restored.get(f.target.id).tasks[0].task, null)
  assert.equal(restored.get(f.target.id).works[0].assessment.status, 'pending')
  assert.deepEqual(f.options.getBaseline(), before)
  const changed = structuredClone(f.request)
  changed.pending.push(...changed.works.shift().obligationIds)
  assert.throws(
    () => restored.decide(revise(changed, f.target.id, 2), 'local-developer'),
    /admitted commitment/i
  )
})

test('admission denies unresolved prerequisites before reserving work', (t) => {
  const f = admissionFixture(t)
  const changed = structuredClone(f.request)
  changed.works[0].id = randomUUID()
  changed.works[0].prerequisites = [
    { workId: changed.works[1].id, handoff: 'Usable behavior' }
  ]
  f.owner.decide(revise(changed, f.target.id, 1), 'local-developer')
  assert.throws(
    () =>
      f.owner.decide(
        { ...f.admission, expectedRevision: 2, workId: changed.works[0].id },
        'local-developer'
      ),
    /prerequisite/i
  )
  assert.equal(f.owner.get(f.target.id).history.length, 2)
})

test('admission checks source, task identity, actor and complete promise; omission cannot bypass reservation', (t) => {
  const f = admissionFixture(t)
  f.owner.decide(f.admission, 'local-developer')
  for (const task of [
    { ...f.task, workBinding: undefined },
    { ...f.task, requestId: randomUUID() },
    { ...f.task, actor: 'another-human' },
    { ...f.task, objective: 'weakened' },
    { ...f.task, obligations: [] },
    { ...f.task, allowedFiles: [] },
    { ...f.task, workBinding: { ...f.task.workBinding, workId: randomUUID() } }
  ])
    assert.throws(
      () => f.owner.checkTask(task, f.source.snapshot),
      /admission|scope|obligation|actor|identity/i
    )
  assert.throws(
    () =>
      f.owner.checkTask(f.task, {
        ...f.source.snapshot,
        digest: 'c'.repeat(64)
      }),
    /source/i
  )
  assert.throws(
    () =>
      f.owner.checkTask(f.task, { ...f.source.snapshot, head: 'c'.repeat(40) }),
    /source/i
  )
  assert.equal(
    f.owner.checkTask({ requestId: randomUUID() }),
    null,
    'unlinked legacy task'
  )
})

for (const field of ['scenario', 'phase', 'contractDigest'])
  test('admission refuses ineligible proof ' + field, (t) => {
    const f = admissionFixture(t)
    f.source[field] = 'invalid'
    assert.throws(
      () => f.owner.decide(f.admission, 'local-developer'),
      /source/i
    )
    assert.equal(f.owner.get(f.target.id).history.length, 1)
  })

test('bounded assessment preserves failed attempts and does not combine work passes into target acceptance', (t) => {
  const f = admissionFixture(t)
  f.owner.decide(f.admission, 'local-developer')
  const record = {
    id: f.task.requestId,
    task: f.task,
    snapshot: f.source.snapshot,
    verificationStatus: 'failed',
    attempts: [
      {
        id: randomUUID(),
        phase: 'completed',
        verdict: {
          sourceDigest: 'c'.repeat(64),
          evidence: {
            status: 'failed',
            cases: [
              { id: f.request.works[0].obligationIds[0], status: 'failed' }
            ]
          }
        }
      }
    ]
  }
  f.tasks.set(record.id, record)
  assert.equal(f.owner.get(f.target.id).works[0].assessment.status, 'failed')
  record.attempts.push({
    id: randomUUID(),
    phase: 'completed',
    verdict: {
      sourceDigest: 'd'.repeat(64),
      evidence: {
        status: 'passed',
        cases: f.task.obligations.map((c) => ({ ...c, status: 'passed' }))
      }
    }
  })
  record.verificationStatus = 'passed'
  const value = f.owner.get(f.target.id)
  assert.equal(value.works[0].assessment.status, 'passed')
  assert.equal(
    value.tasks[0].task.attempts[0].verdict.evidence.status,
    'failed'
  )
  assert.equal(value.works[1].assessment.status, 'pending')
  assert.equal(value.status, 'pending')
  assert.deepEqual(value.pending, ['future.obligation'])
})

test('a second admitted task cannot hide another task failure, and stale baseline cannot remain passed', (t) => {
  const f = admissionFixture(t)
  f.owner.decide(f.admission, 'local-developer')
  const first = {
    id: f.task.requestId,
    task: f.task,
    verificationStatus: 'failed',
    attempts: [
      {
        id: randomUUID(),
        verdict: {
          sourceDigest: 'c'.repeat(64),
          evidence: { status: 'failed', cases: [] }
        }
      }
    ]
  }
  f.tasks.set(first.id, first)
  const secondId = randomUUID()
  f.owner.decide(
    {
      ...f.admission,
      requestId: randomUUID(),
      expectedRevision: 2,
      taskId: secondId
    },
    'local-developer'
  )
  f.tasks.set(secondId, {
    ...first,
    id: secondId,
    verificationStatus: 'passed',
    attempts: [
      {
        id: randomUUID(),
        verdict: {
          sourceDigest: 'd'.repeat(64),
          evidence: {
            status: 'passed',
            cases: f.task.obligations.map((c) => ({ ...c, status: 'passed' }))
          }
        }
      }
    ]
  })
  assert.equal(f.owner.get(f.target.id).works[0].assessment.status, 'failed')
  first.verificationStatus = 'passed'
  assert.equal(f.owner.get(f.target.id).works[0].assessment.status, 'passed')
  f.options.getBaseline = () => ({
    revision: 2,
    contractDigest: f.task.contractDigest
  })
  assert.equal(
    createTargetOwner(f.options).get(f.target.id).works[0].assessment.status,
    'stale'
  )
})

test('work binding identity is independent of JSON property order', (t) => {
  const f = admissionFixture(t)
  const result = f.owner.decide(f.admission, 'local-developer')
  const binding = f.task.workBinding
  assert.deepEqual(
    f.owner.checkTask(
      {
        ...f.task,
        workBinding: {
          admissionId: binding.admissionId,
          workId: binding.workId,
          targetId: binding.targetId
        }
      },
      f.source.snapshot
    ),
    result.decision.admission
  )
})

async function pinnedSetup(t) {
  const value = setup(t)
  const sourceOwner = require('../snapshot.cjs')
  const evidenceOwner = require('../evidence.cjs')
  const { runVerification } = require('../runner.cjs')
  const { createHistory, compareVersion } = require('../evolution.cjs')
  const contract = loadContract(root)
  const baseline = { revision: 1, contractDigest: contract.digest }
  value.options.getContracts = () => [contract]
  value.options.getBaseline = () => baseline
  value.request.targetRevision = contract.digest
  value.request.acceptedBaseline = baseline
  value.request.pending = []
  const id = randomUUID()
  const runDirectory = path.join(value.options.directory, 'pin-proof')
  const snapshot = sourceOwner.captureSource(root, runDirectory, contract)
  const admitted = sourceOwner.validateSourceSnapshot(snapshot, contract)
  const flowIds = contract.flows.map((flow) => flow.id)
  const runner = await runVerification({
    repositoryRoot: root,
    runDirectory,
    snapshot,
    contract,
    flowIds,
    scenario: 'baseline',
    timeoutMs: 15000
  })
  const admission = {
    attemptId: id,
    repository: root,
    head: snapshot.head,
    sourceDigest: snapshot.digest,
    runtimeSource: admitted.runtimeSource
  }
  const evidence = evidenceOwner.assessEvidence(
    contract,
    snapshot,
    runner,
    flowIds,
    'baseline',
    admission
  )
  assert.equal(evidence.status, 'passed', JSON.stringify(evidence.issues))
  evidenceOwner.validateStoredEvidence(
    contract,
    {
      id,
      phase: 'completed',
      snapshot,
      runner,
      flowIds,
      scenario: 'baseline',
      evidence
    },
    admission
  )
  const testDigest = admitted.verificationSource.files.find(
    (file) => file.path === contract.testFile
  ).digest
  const version = {
    contract,
    selectors: runner.report.testResults
      .flatMap((suite) => suite.assertionResults)
      .map((item) => ({
        caseId: contract.cases.find((c) => c.testName === item.fullName).id,
        file: contract.testFile,
        testName: item.fullName,
        contentDigest: testDigest
      })),
    verificationSource: {
      attemptId: id,
      repository: root,
      head: snapshot.head,
      sourceDigest: snapshot.digest,
      configurationDigest: snapshot.configurationDigest,
      descriptor: admitted.verificationSource
    }
  }
  const history = createHistory(version)
  const candidate = history.versions[0]
  const review = Object.freeze({
    ...compareVersion(history, candidate),
    candidate,
    status: 'pending'
  })
  const versions = new Map([[review.id, review]])
  let reads = 0
  value.options.getVersionReview = (key) => {
    reads++
    return versions.get(key) ?? null
  }
  value.owner = createTargetOwner(value.options)
  value.request.targetReviewId = review.id
  return { ...value, review, versions, reads: () => reads }
}

test('a target pins the exact real reviewed verification version through replay and restart without lookup work on projections', async (t) => {
  const value = await pinnedSetup(t)
  const saved = value.owner.decide(value.request, 'local-developer')
  const pin = {
    reviewId: value.review.id,
    candidateDigest: value.review.candidateDigest
  }
  assert.deepEqual(value.owner.get(saved.id).targetVerification, pin)
  assert.equal(value.reads(), 1)
  for (let i = 0; i < 20; i++) {
    value.owner.get(saved.id)
    value.owner.list()
    value.owner.decide(value.request, 'local-developer')
  }
  assert.equal(value.reads(), 1)
  assert.deepEqual(
    createTargetOwner(value.options).get(saved.id).targetVerification,
    pin
  )
  assert.equal(value.reads(), 2)
  assert.deepEqual(
    value.owner.get(saved.id).acceptedBaseline,
    value.request.acceptedBaseline
  )
  assert.ok(Object.isFrozen(value.owner.get(saved.id).targetVerification))
})

test('a missing or conflicting selected version rejects before writing a target revision', async (t) => {
  const value = await pinnedSetup(t)
  const file = path.join(value.options.directory, 'targets.json')
  for (const replacement of [
    null,
    { ...value.review, id: 'a'.repeat(64) },
    { ...value.review, candidateDigest: 'invalid' },
    {
      ...value.review,
      candidate: { ...value.review.candidate, verificationSource: undefined }
    },
    {
      ...value.review,
      candidate: {
        ...value.review.candidate,
        contract: { ...value.review.candidate.contract, digest: 'b'.repeat(64) }
      }
    }
  ]) {
    value.versions.set(value.review.id, replacement)
    assert.throws(
      () => value.owner.decide(value.request, 'local-developer'),
      /version|review|verification/i
    )
    assert.equal(fs.existsSync(file), false)
    assert.equal(value.owner.list().length, 0)
  }
  value.versions.set(value.review.id, value.review)
  assert.equal(value.owner.decide(value.request, 'local-developer').revision, 1)
})

test('target pin survives later review rejection and cannot be changed by another target action or silently recovered on reload', async (t) => {
  const value = await pinnedSetup(t)
  const saved = value.owner.decide(value.request, 'local-developer')
  const before = fs.readFileSync(
    path.join(value.options.directory, 'targets.json'),
    'utf8'
  )
  assert.throws(
    () =>
      value.owner.decide(
        {
          ...revise(value.request, saved.id, 1),
          targetReviewId: value.review.id
        },
        'local-developer'
      ),
    /immutable|creation|review/i
  )
  assert.equal(
    fs.readFileSync(path.join(value.options.directory, 'targets.json'), 'utf8'),
    before
  )
  value.versions.set(value.review.id, { ...value.review, status: 'rejected' })
  const reloaded = createTargetOwner(value.options)
  const revised = reloaded.decide(
    revise(value.request, saved.id, 1),
    'local-developer'
  )
  assert.equal(revised.revision, 2)
  assert.deepEqual(reloaded.get(saved.id).targetVerification, {
    reviewId: value.review.id,
    candidateDigest: value.review.candidateDigest
  })
  value.versions.set(value.review.id, {
    ...value.review,
    candidateDigest: 'c'.repeat(64)
  })
  assert.throws(
    () => createTargetOwner(value.options),
    /version|review|verification/i
  )
  value.versions.delete(value.review.id)
  assert.throws(
    () => createTargetOwner(value.options),
    /version|review|verification/i
  )
})

test('legacy target absence remains unchanged even when an otherwise matching reviewed version exists', async (t) => {
  const value = await pinnedSetup(t)
  delete value.request.targetReviewId
  const saved = value.owner.decide(value.request, 'local-developer')
  const before = fs.readFileSync(
    path.join(value.options.directory, 'targets.json'),
    'utf8'
  )
  assert.equal(
    Object.hasOwn(value.owner.get(saved.id), 'targetVerification'),
    false
  )
  assert.equal(
    Object.hasOwn(
      createTargetOwner(value.options).get(saved.id),
      'targetVerification'
    ),
    false
  )
  assert.equal(value.reads(), 0)
  assert.equal(
    fs.readFileSync(path.join(value.options.directory, 'targets.json'), 'utf8'),
    before
  )
})
