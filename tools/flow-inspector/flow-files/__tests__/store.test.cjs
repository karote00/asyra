/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { document, directory } = require('./fixtures.cjs')
const { openProject } = require('../store.cjs')
function setup(t) {
  const root = directory(t),
    flow = document()
  fs.writeFileSync(path.join(root, 'checkout.flow.json'), JSON.stringify(flow))
  return { root, store: openProject(root) }
}
test('current manual acceptance survives restart and notes never change completion', (t) => {
  const { root, store } = setup(t)
  let current = store.snapshot()
  const binding = current.evaluation.flows[0].nodes[0].binding
  store.update('checkout', {
    expectedRevision: 0,
    kind: 'observation',
    value: {
      nodeId: 'review',
      criterionId: 'accepted',
      kind: 'manual',
      status: 'accepted',
      binding,
      actor: 'owner',
      summary: 'Accepted',
      at: '2026-10-17T00:00:00Z'
    }
  })
  assert.equal(openProject(root).snapshot().evaluation.flows[0].status, 'done')
  store.update('checkout', {
    expectedRevision: 1,
    kind: 'note',
    value: { id: 'note', nodeId: 'review', actor: 'owner', text: 'Investigate' }
  })
  store.update('checkout', {
    expectedRevision: 2,
    kind: 'note-delete',
    id: 'note'
  })
  assert.equal(store.snapshot().evaluation.flows[0].status, 'done')
  assert.deepEqual(fs.readdirSync(root), ['checkout.flow.json'])
})
test('stale and simultaneous writes reject, repeated current updates are idempotent', (t) => {
  const { root, store } = setup(t)
  const request = {
    expectedRevision: 0,
    kind: 'note',
    value: { id: 'note', nodeId: 'review', actor: 'owner', text: 'First' }
  }
  store.update('checkout', request)
  assert.equal(store.update('checkout', request).revision, 1)
  assert.throws(
    () =>
      store.update('checkout', {
        ...request,
        value: { ...request.value, text: 'Old' }
      }),
    /revision/
  )
  fs.mkdirSync(path.join(root, '.writer-lock'))
  assert.throws(
    () =>
      store.update('checkout', {
        ...request,
        expectedRevision: 1,
        value: { ...request.value, text: 'Concurrent' }
      }),
    /writer/
  )
  fs.rmdirSync(path.join(root, '.writer-lock'))
})
test('invalid, deleted and replaced documents invalidate previous green snapshots', (t) => {
  const { root, store } = setup(t)
  const file = path.join(root, 'checkout.flow.json')
  store.snapshot()
  fs.writeFileSync(file, '{')
  assert.throws(() => store.snapshot(), /checkout.flow.json/)
  fs.unlinkSync(file)
  assert.throws(() => store.snapshot(), /nonempty/)
  fs.writeFileSync(file, JSON.stringify(document()))
  assert.equal(store.snapshot().evaluation.flows.length, 1)
})
test('unchanged snapshot consumers reuse admission and evaluation, changed files invalidate once', (t) => {
  const { root } = setup(t)
  const counts = { admit: 0, evaluate: 0 }
  const store = openProject(root, { onWork: (kind) => counts[kind]++ })
  store.snapshot()
  store.snapshot()
  store.snapshot()
  assert.deepEqual(counts, { admit: 1, evaluate: 1 })
  const doc = document()
  doc.definition.title = 'Updated'
  fs.writeFileSync(path.join(root, 'checkout.flow.json'), JSON.stringify(doc))
  store.snapshot()
  store.snapshot()
  assert.deepEqual(counts, { admit: 2, evaluate: 2 })
})
test('incomplete producer results cannot erase failure and discovery correction needs complete exact coverage', (t) => {
  const { root, store } = setup(t)
  const doc = document()
  doc.definition.nodes[0].criteria[0].kind = 'automated'
  fs.writeFileSync(path.join(root, 'checkout.flow.json'), JSON.stringify(doc))
  const binding = store.snapshot().evaluation.flows[0].nodes[0].binding
  const failed = {
    nodeId: 'review',
    criterionId: 'accepted',
    kind: 'automated',
    status: 'failed',
    binding,
    actor: 'custom',
    summary: 'Failure',
    at: '2026-10-17T00:00:00Z',
    executionId: 'run',
    caseId: 'case'
  }
  store.update('checkout', {
    expectedRevision: 0,
    kind: 'observation',
    value: failed
  })
  assert.throws(
    () =>
      store.update('checkout', {
        expectedRevision: 1,
        kind: 'observation',
        value: { ...failed, status: 'incomplete' }
      }),
    /Incomplete/
  )
  store.update('checkout', {
    expectedRevision: 1,
    kind: 'warning',
    value: {
      id: 'discovery',
      nodeId: 'review',
      kind: 'discovery',
      summary: 'No tests found',
      criterionIds: ['accepted'],
      executionId: 'run',
      binding
    }
  })
  assert.throws(
    () =>
      store.update('checkout', {
        expectedRevision: 2,
        kind: 'correction',
        id: 'discovery',
        observations: []
      }),
    /coverage/
  )
  store.update('checkout', {
    expectedRevision: 2,
    kind: 'correction',
    id: 'discovery',
    observations: [{ ...failed, executionId: 'next' }]
  })
  assert.equal(store.snapshot().documents[0].current.warnings.length, 0)
  assert.equal(store.snapshot().evaluation.flows[0].status, 'failed')
})

test('replacing current evidence prunes only unreferenced tool-owned artifacts', (t) => {
  const { root, store } = setup(t)
  const artifacts = require('../artifacts.cjs'),
    { createHash } = require('node:crypto')
  const source = path.join(root, 'project-evidence.txt'),
    bytes = Buffer.from('current evidence')
  fs.writeFileSync(source, bytes)
  const retained = artifacts.retain(root, root, [
    {
      retainedPath: 'project-evidence.txt',
      name: 'Evidence',
      digest: createHash('sha256').update(bytes).digest('hex'),
      size: bytes.length
    }
  ])
  const value = {
    nodeId: 'review',
    criterionId: 'accepted',
    kind: 'manual',
    status: 'accepted',
    binding: store.snapshot().evaluation.flows[0].nodes[0].binding,
    actor: 'owner',
    summary: 'Verified',
    at: '2026-10-17T00:00:00Z',
    attachments: [
      ...retained,
      { name: 'Original', path: 'project-evidence.txt', ownership: 'project' }
    ]
  }
  store.update('checkout', { expectedRevision: 0, kind: 'observation', value })
  assert.equal(
    store.snapshot().evaluation.flows[0].nodes[0].context.observations[0]
      .attachments.length,
    2
  )
  store.update('checkout', {
    expectedRevision: 1,
    kind: 'observation',
    value: { ...value, status: 'reopened', attachments: [] }
  })
  assert.equal(fs.existsSync(path.join(root, retained[0].path)), false)
  assert.equal(fs.readFileSync(source, 'utf8'), 'current evidence')
})
