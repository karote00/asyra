/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict')
const { document } = require('./fixtures.cjs')
const { admitProject } = require('../schema.cjs')
const { gateSummary, evaluateProject } = require('../policy.cjs')
const summary = (documents, policy) =>
  gateSummary(
    { documents, evaluation: evaluateProject(admitProject(documents)) },
    policy
  )
test('manual policy changes only the exit code, never missing automatic evidence', () => {
  const doc = document()
  assert.equal(summary([doc]).exitCode, 3)
  assert.equal(summary([doc], 'nonblocking').status, 'awaiting-manual')
  assert.equal(summary([doc], 'nonblocking').exitCode, 0)
  doc.definition.nodes[0].criteria.push({
    id: 'check',
    title: 'Check',
    kind: 'automated',
    selector: { producer: 'custom', identity: 'check' }
  })
  assert.equal(summary([doc], 'nonblocking').status, 'unsatisfied')
  assert.equal(summary([doc], 'nonblocking').exitCode, 1)
})
test('optional nodes affect the gate only through required prerequisites', () => {
  const doc = document(),
    optional = structuredClone(doc.definition.nodes[0])
  optional.id = 'optional'
  optional.required = false
  optional.criteria = [
    {
      id: 'check',
      title: 'Check',
      kind: 'automated',
      selector: { producer: 'custom', identity: 'check' }
    }
  ]
  doc.definition.nodes.push(optional)
  assert.equal(summary([doc]).status, 'awaiting-manual')
  doc.definition.nodes[0].dependsOn.push({
    flowId: doc.flowId,
    nodeId: 'optional'
  })
  assert.equal(summary([doc]).status, 'unsatisfied')
  optional.applicable = false
  assert.equal(summary([doc], 'nonblocking').status, 'unsatisfied')
})
test('integration and task blockers cannot be exempted as manual pending', () => {
  const doc = document()
  for (const nodeId of ['review', 'integration']) {
    doc.current.progress = [
      { nodeId, status: 'blocked', reason: 'External prerequisite' }
    ]
    assert.equal(summary([doc], 'nonblocking').exitCode, 1)
  }
  assert.throws(() => summary([doc], 'ignore'), /policy/)
})
