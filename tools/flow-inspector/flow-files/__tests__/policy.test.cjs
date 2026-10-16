/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const { document } = require('./fixtures.cjs')
const { admitProject } = require('../schema.cjs')
const { evaluateProject, criterionBinding } = require('../policy.cjs')
const accept = (
  docs,
  flow,
  node,
  criterion,
  kind = 'manual',
  status = 'accepted'
) => {
  const admitted = admitProject(docs)
  flow.current.observations.push({
    nodeId: node,
    criterionId: criterion,
    kind,
    status,
    binding: criterionBinding(admitted, flow.flowId, node, criterion),
    actor: 'reviewer',
    summary: 'Verified requirement',
    at: '2026-10-17T00:00:00Z',
    ...(kind === 'automated' ? { executionId: 'run-1', caseId: criterion } : {})
  })
}
test('manual-only file is usable without source, tests, Git or reports', () => {
  const flow = document()
  let project = admitProject([flow])
  assert.equal(evaluateProject(project).flows[0].status, 'awaiting-manual')
  accept([flow], flow, 'review', 'accepted')
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  flow.current.observations[0].status = 'reopened'
  assert.notEqual(evaluateProject(admitProject([flow])).flows[0].status, 'done')
})
test('mixed criteria cannot be completed by a test or an unrelated manual decision', () => {
  const flow = document()
  flow.definition.nodes[0].criteria.push({
    id: 'check',
    title: 'Custom check',
    kind: 'automated'
  })
  accept([flow], flow, 'review', 'accepted')
  accept([flow], flow, 'review', 'check', 'automated', 'failed')
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'failed')
  flow.current.observations[1].status = 'passed'
  assert.notEqual(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  flow.current.observations[0].binding = criterionBinding(
    admitProject([flow]),
    flow.flowId,
    'review',
    'accepted'
  )
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  flow.current.observations[1].kind = 'manual'
  assert.throws(() => admitProject([flow]), /kind/)
})
test('downstream acceptance expires on prerequisite changes but unrelated edits do not reset it', () => {
  const flow = document()
  const other = structuredClone(flow.definition.nodes[0])
  other.id = 'ship'
  other.dependsOn = [{ flowId: 'checkout', nodeId: 'review' }]
  flow.definition.nodes.push(other)
  accept([flow], flow, 'review', 'accepted')
  accept([flow], flow, 'ship', 'accepted')
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  const unrelated = structuredClone(other)
  unrelated.id = 'optional'
  unrelated.required = false
  unrelated.dependsOn = []
  flow.definition.nodes.push(unrelated)
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  flow.definition.nodes[0].objective = 'Require revised acceptance'
  const result = evaluateProject(admitProject([flow]))
  assert.notEqual(result.flows[0].status, 'done')
  assert.equal(
    result.flows[0].nodes.find((n) => n.id === 'ship').evidence,
    'stale'
  )
})
test('flow-level integration acceptance is mandatory and bound to its required nodes', () => {
  const flow = document()
  flow.definition.criteria = [
    { id: 'integration', title: 'Whole feature', kind: 'manual' }
  ]
  accept([flow], flow, 'review', 'accepted')
  assert.notEqual(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  accept([flow], flow, 'integration', 'integration')
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  flow.current.observations[0].status = 'rejected'
  assert.notEqual(evaluateProject(admitProject([flow])).flows[0].status, 'done')
})
test('invalid schema, duplicate IDs, missing references and dependency cycles fail admission', () => {
  const flow = document()
  flow.unexpected = true
  assert.throws(() => admitProject([flow]), /unexpected/)
  delete flow.unexpected
  assert.throws(() => admitProject([flow, flow]), /Duplicate/)
  flow.definition.nodes[0].dependsOn = [
    { flowId: 'checkout', nodeId: 'review' }
  ]
  assert.throws(() => admitProject([flow]), /cycle/)
  flow.definition.nodes[0].dependsOn = [{ flowId: 'missing', nodeId: 'review' }]
  assert.throws(() => admitProject([flow]), /reference/)
})
test('conditional routes, blocked prerequisites and unknown applicability never silently pass', () => {
  const flow = document()
  flow.definition.nodes[0].applicable = null
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'blocked')
  flow.definition.nodes[0].applicable = false
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  const next = structuredClone(flow.definition.nodes[0])
  next.id = 'next'
  next.applicable = true
  next.dependsOn = [{ flowId: 'checkout', nodeId: 'review' }]
  flow.definition.nodes.push(next)
  accept([flow], flow, 'next', 'accepted')
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'blocked')
})
test('compact context identifies exact current error, declared owner and configured action', () => {
  const flow = document()
  const n = flow.definition.nodes[0]
  n.criteria[0].kind = 'automated'
  n.specRefs = ['docs/order.md']
  n.implementationRefs = ['src/order.js']
  n.actions = [
    {
      id: 'check',
      kind: 'command',
      label: 'Check order',
      argv: ['node', 'check.cjs'],
      cwd: '.',
      criterionIds: ['accepted']
    }
  ]
  accept([flow], flow, 'review', 'accepted', 'automated', 'failed')
  const result = evaluateProject(admitProject([flow]))
  const context = result.flows[0].nodes[0].context
  assert.equal(context.nodeId, 'review')
  assert.equal(context.failureOwner, 'review')
  assert.equal(context.errors[0].summary, 'Verified requirement')
  assert.deepEqual(context.actions[0].argv, ['node', 'check.cjs'])
  assert.deepEqual(context.specRefs, ['docs/order.md'])
})
test('new automated evidence invalidates same-node manual acceptance until reviewed again', () => {
  const flow = document()
  flow.definition.nodes[0].criteria.push({
    id: 'check',
    title: 'Check',
    kind: 'automated'
  })
  accept([flow], flow, 'review', 'check', 'automated', 'passed')
  accept([flow], flow, 'review', 'accepted')
  assert.equal(evaluateProject(admitProject([flow])).flows[0].status, 'done')
  flow.current.observations[0].status = 'failed'
  let result = evaluateProject(admitProject([flow]))
  assert.equal(
    result.flows[0].nodes[0].criteria.find((c) => c.id === 'accepted').status,
    'stale'
  )
  assert.equal(result.flows[0].status, 'failed')
})

test('documented feature covers failure, recovery, dependencies and integration before completion', () => {
  const flow = structuredClone(require('../examples/feature.flow.json'))
  const docs = [flow],
    verdict = () => evaluateProject(admitProject(docs)).flows[0]
  accept(docs, flow, 'review', 'check', 'automated', 'failed')
  assert.equal(verdict().status, 'failed')
  flow.current.observations = []
  accept(docs, flow, 'review', 'check', 'automated', 'passed')
  accept(docs, flow, 'review', 'accepted')
  assert.notEqual(verdict().status, 'done')
  accept(docs, flow, 'delivery', 'ready')
  assert.notEqual(verdict().status, 'done')
  accept(docs, flow, 'integration', 'release')
  assert.equal(verdict().status, 'done')
  flow.current.sources.push({ nodeId: 'review', revision: 'new-source' })
  assert.notEqual(verdict().status, 'done')
  assert.equal(verdict().nodes[1].evidence, 'stale')
})
test('explicit cross-flow prerequisites invalidate dependents while unrelated flows remain accepted', () => {
  const first = document(),
    second = document()
  second.flowId = 'delivery'
  second.definition.nodes[0].dependsOn = [
    { flowId: 'checkout', nodeId: 'review' }
  ]
  const docs = [first, second]
  accept(docs, first, 'review', 'accepted')
  accept(docs, second, 'review', 'accepted')
  assert.ok(
    evaluateProject(admitProject(docs)).flows.every((f) => f.status === 'done')
  )
  first.current.observations[0].status = 'reopened'
  assert.equal(
    evaluateProject(admitProject(docs)).flows[1].nodes[0].evidence,
    'stale'
  )
})

test('an explicit current blocker cannot be erased by otherwise accepted criteria', () => {
  const flow = document()
  accept([flow], flow, 'review', 'accepted')
  flow.current.progress.push({
    nodeId: 'review',
    status: 'blocked',
    reason: 'Awaiting delivery approval'
  })
  const result = evaluateProject(admitProject([flow])).flows[0]
  assert.equal(result.nodes[0].status, 'blocked')
  assert.notEqual(result.status, 'done')
  assert.equal(
    result.nodes[0].context.blockers[0],
    'Awaiting delivery approval'
  )
})

test('architecture artifact outputs and route ownership must resolve on admission', () => {
  const flow = document(),
    { architectureFor } = require('../view.cjs')
  flow.definition.architecture = architectureFor(flow)
  flow.definition.architecture.steps[0].outputs = ['artifact:missing']
  assert.throws(() => admitProject([flow]), /reference/)
})

test('compact context keeps exact repair scope and provenance while folding bulk evidence', () => {
  const { compactContext } = require('../context.cjs')
  const flow = document(),
    node = flow.definition.nodes[0]
  node.criteria[0].kind = 'automated'
  node.actions = [
    {
      id: 'test',
      label: 'Check',
      kind: 'command',
      argv: ['node', 'check.cjs'],
      cwd: '.',
      criterionIds: ['accepted'],
      inputs: ['large-source-directory']
    }
  ]
  accept([flow], flow, 'review', 'accepted', 'automated', 'failed')
  flow.current.observations[0].details = ['Long original stack']
  const full = evaluateProject(admitProject([flow])).flows[0].nodes[0].context,
    compact = compactContext(full)
  assert.equal(compact.criteria[0].executionId, 'run-1')
  assert.equal(compact.errors[0].detailsAvailable, true)
  assert.equal(compact.observations, undefined)
  assert.equal(compact.actions[0].inputs, undefined)
  assert.deepEqual(compact.actions[0].argv, ['node', 'check.cjs'])
  assert.equal(full.observations[0].details[0], 'Long original stack')
})

test('failed integration remains visible while required tasks await acceptance', () => {
  for (const [kind, status] of [
    ['manual', 'rejected'],
    ['automated', 'failed']
  ]) {
    const flow = document()
    flow.definition.criteria = [{ id: 'release', title: 'Release check', kind }]
    accept([flow], flow, 'integration', 'release', kind, status)
    const result = evaluateProject(admitProject([flow])).flows[0]
    assert.equal(result.nodes[0].status, 'awaiting-manual')
    assert.equal(result.integration.status, 'failed')
    assert.equal(result.status, 'failed')
  }
})
