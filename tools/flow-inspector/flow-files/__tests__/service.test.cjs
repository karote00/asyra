/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { document, directory } = require('./fixtures.cjs')
const { createFlowService } = require('../service.cjs')
const { openProject } = require('../store.cjs')
function setup(t, execute) {
  const root = directory(t),
    doc = document()
  doc.definition.nodes[0].criteria[0].kind = 'automated'
  doc.definition.nodes[0].actions = [
    {
      id: 'check',
      label: 'Selected check',
      kind: 'command',
      argv: ['node', 'check.cjs'],
      cwd: '.',
      criterionIds: ['accepted']
    }
  ]
  fs.writeFileSync(path.join(root, 'checkout.flow.json'), JSON.stringify(doc))
  const service = createFlowService(root, root, { execute })
  t.after(() => service.close())
  return { root, service }
}
test('read and preview start zero processes; changed preview rejects execution', async (t) => {
  let count = 0
  const { root, service } = setup(t, async () => {
    count++
    return { code: 0 }
  })
  service.snapshot()
  service.context('checkout', 'review')
  const preview = service.preview('checkout', 'review', 'check')
  assert.equal(count, 0)
  const doc = document()
  fs.writeFileSync(path.join(root, 'checkout.flow.json'), JSON.stringify(doc))
  await assert.rejects(
    service.rerun({ ...preview, confirm: true }),
    /executable/
  )
  assert.equal(count, 0)
})
test('one confirmed action publishes actual generic results without history', async (t) => {
  let count = 0
  const { root, service } = setup(t, async ({ env, args }) => {
    count++
    assert.deepEqual(args, ['check.cjs'])
    openProject(env.FLOW_FILE_DIRECTORY).update(env.FLOW_ID, {
      expectedRevision: Number(env.FLOW_EXPECTED_REVISION),
      kind: 'observation',
      value: {
        nodeId: env.FLOW_NODE_ID,
        criterionId: 'accepted',
        kind: 'automated',
        status: 'passed',
        binding: env.FLOW_BINDING,
        actor: 'custom-runner',
        executionId: env.FLOW_EXECUTION_ID,
        caseId: 'accepted',
        summary: 'Executed selected case',
        at: new Date().toISOString()
      }
    })
    return { code: 0 }
  })
  const preview = service.preview('checkout', 'review', 'check')
  const result = await service.rerun({ ...preview, confirm: true })
  assert.equal(count, 1)
  assert.equal(result.coverageComplete, true)
  assert.equal(service.snapshot().evaluation.flows[0].status, 'done')
  assert.deepEqual(fs.readdirSync(root), ['checkout.flow.json'])
})
test('zero exit without a result cannot leave an old passing verdict', async (t) => {
  const { service } = setup(t, async () => ({ code: 0 }))
  const context = service.context('checkout', 'review')
  service.update('checkout', {
    expectedRevision: 0,
    kind: 'observation',
    value: {
      nodeId: 'review',
      criterionId: 'accepted',
      kind: 'automated',
      status: 'passed',
      binding: context.binding,
      actor: 'producer',
      executionId: 'old',
      caseId: 'accepted',
      summary: 'Old pass',
      at: new Date().toISOString()
    }
  })
  const result = await service.rerun({
    ...service.preview('checkout', 'review', 'check'),
    confirm: true
  })
  assert.equal(result.coverageComplete, false)
  assert.equal(result.context.status, 'blocked')
  assert.notEqual(service.snapshot().evaluation.flows[0].status, 'done')
})
test('explicit action input changes invalidate preview without making reads execute work', async (t) => {
  const { root, service } = setup(t, async () => ({ code: 0 }))
  const file = path.join(root, 'checkout.flow.json'),
    doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  doc.definition.nodes[0].actions[0].inputs = ['feature.txt']
  fs.writeFileSync(path.join(root, 'feature.txt'), 'before')
  fs.writeFileSync(file, JSON.stringify(doc))
  const preview = service.preview('checkout', 'review', 'check')
  fs.writeFileSync(path.join(root, 'feature.txt'), 'after')
  await assert.rejects(service.rerun({ ...preview, confirm: true }), /stale/)
  assert.equal(service.context('checkout', 'review').status, 'not-started')
})

test('cancel settles the owned process before another action or close can complete', async (t) => {
  let started
  const ready = new Promise((resolve) => {
    started = resolve
  })
  const { service } = setup(
    t,
    ({ signal, onSpawn }) =>
      new Promise((resolve) => {
        onSpawn(123)
        signal.addEventListener(
          'abort',
          () => resolve({ code: null, reason: 'cancelled' }),
          { once: true }
        )
        started()
      })
  )
  const run = service.rerun({
    ...service.preview('checkout', 'review', 'check'),
    confirm: true
  })
  await ready
  await assert.rejects(
    service.rerun({
      ...service.preview('checkout', 'review', 'check'),
      confirm: true
    }),
    /busy/
  )
  await service.cancel()
  assert.equal((await run).reason, 'cancelled')
  assert.notEqual(service.snapshot().evaluation.flows[0].status, 'done')
  await service.close()
  await assert.rejects(
    service.rerun({
      ...service.preview('checkout', 'review', 'check'),
      confirm: true
    }),
    /unavailable/
  )
})

test('actions with the same local ID on different nodes retain separate warnings', async (t) => {
  const { root, service } = setup(t, async () => ({ code: 0 }))
  const file = path.join(root, 'checkout.flow.json'),
    doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  const second = structuredClone(doc.definition.nodes[0])
  second.id = 'delivery'
  doc.definition.nodes.push(second)
  fs.writeFileSync(file, JSON.stringify(doc))
  await service.rerun({
    ...service.preview('checkout', 'review', 'check'),
    confirm: true
  })
  await service.rerun({
    ...service.preview('checkout', 'delivery', 'check'),
    confirm: true
  })
  assert.equal(service.snapshot().documents[0].current.warnings.length, 2)
})

test('a failed process cannot establish completion by publishing a passing result first', async (t) => {
  const { service } = setup(t, async ({ env }) => {
    openProject(env.FLOW_FILE_DIRECTORY).update(env.FLOW_ID, {
      expectedRevision: Number(env.FLOW_EXPECTED_REVISION),
      kind: 'observation',
      value: {
        nodeId: env.FLOW_NODE_ID,
        criterionId: 'accepted',
        kind: 'automated',
        status: 'passed',
        binding: env.FLOW_BINDING,
        actor: 'producer',
        executionId: env.FLOW_EXECUTION_ID,
        caseId: 'accepted',
        summary: 'Premature success',
        at: new Date().toISOString()
      }
    })
    return { code: 1, reason: null }
  })
  const result = await service.rerun({
    ...service.preview('checkout', 'review', 'check'),
    confirm: true
  })
  assert.equal(result.code, 1)
  assert.equal(result.context.status, 'blocked')
})
