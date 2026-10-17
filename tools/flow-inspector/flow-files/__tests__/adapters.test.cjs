/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { directory } = require('./fixtures.cjs')
const { initialize } = require('../project.cjs')
const { capture, publish } = require('../adapters.cjs')
const { openProject } = require('../store.cjs')
const record = (receipt, status) => ({
  selector: receipt.cases[0].selector,
  status,
  details: status === 'failed' ? ['Expected 5, received 6'] : []
})
test('offline publication preserves failures through empty reports and retires exact warnings on repair', (t) => {
  const project = initialize(directory(t), 'vitest'),
    store = openProject(project.directory)
  let receipt = capture(project)
  publish(project, receipt, [record(receipt, 'failed')])
  receipt = capture(project)
  publish(project, receipt, [])
  assert.equal(store.snapshot().evaluation.flows[0].nodes[0].status, 'failed')
  assert.equal(store.snapshot().documents[0].current.warnings.length, 1)
  receipt = capture(project)
  publish(project, receipt, [record(receipt, 'passed')])
  assert.equal(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')
  assert.equal(store.snapshot().documents[0].current.warnings.length, 0)
  assert.throws(
    () => publish(project, receipt, [record(receipt, 'failed')]),
    /Stale/
  )
})
test('changed source and duplicate results never adopt a passing observation', (t) => {
  const project = initialize(directory(t), 'vitest'),
    store = openProject(project.directory)
  let receipt = capture(project)
  fs.appendFileSync(
    path.join(project.root, 'flow-example/feature.cjs'),
    '\n// Source changed\n'
  )
  publish(project, receipt, [record(receipt, 'passed')])
  assert.equal(store.snapshot().documents[0].current.observations.length, 0)
  assert.match(
    store.snapshot().documents[0].current.warnings[0].summary,
    /Source changed/
  )
  receipt = capture(project)
  publish(project, receipt, [
    record(receipt, 'passed'),
    record(receipt, 'passed')
  ])
  assert.equal(store.snapshot().documents[0].current.observations.length, 0)
  assert.match(
    store.snapshot().documents[0].current.warnings[0].summary,
    /Ambiguous/
  )
})

test('human summaries remove terminal formatting while full diagnostics remain intact', (t) => {
  const project = initialize(directory(t), 'vitest'),
    receipt = capture(project)
  const detail =
    '\u001b[31mExpected: 5\u001b[39m\nReceived: -1\n\n    at implementation:3'
  publish(project, receipt, [
    { ...record(receipt, 'failed'), details: [detail] }
  ])
  const observation = openProject(project.directory).snapshot().documents[0]
    .current.observations[0]
  assert.equal(observation.summary.includes(String.fromCharCode(27)), false)
  assert.doesNotMatch(observation.summary, /at implementation/)
  assert.deepEqual(observation.details, [detail])
})
