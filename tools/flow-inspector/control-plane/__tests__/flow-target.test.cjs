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
