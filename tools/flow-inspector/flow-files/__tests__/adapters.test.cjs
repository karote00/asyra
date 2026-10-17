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

for (const producer of ['vitest', 'playwright']) {
  test(
    producer + ' reporter leaves unexecuted sibling criteria unchanged',
    (t) => {
      const project = initialize(directory(t), producer)
      const file = path.join(project.directory, 'checkout.flow.json')
      const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
      const sibling = structuredClone(doc.definition.nodes[0].criteria[0])
      sibling.id = 'sibling'
      const identity = JSON.parse(sibling.selector.identity)
      identity.title = 'another case'
      sibling.selector.identity = JSON.stringify(identity)
      doc.definition.nodes[0].criteria.push(sibling)
      fs.writeFileSync(file, JSON.stringify(doc))
      const receipt = capture(project)
      publish(
        project,
        receipt,
        receipt.cases.map((c) => ({
          selector: c.selector,
          status: 'passed',
          details: []
        }))
      )
      const before = openProject(project.directory)
        .snapshot()
        .documents[0].current.observations.find(
          (o) => o.criterionId === 'sibling'
        )
      const Reporter = require('../reporters/' + producer + '.cjs')
      const reporter = new Reporter({ project: project.root })
      const selected = receipt.cases[0].selector
      const absoluteFile = path.join(project.root, selected.file)
      if (producer === 'vitest') {
        reporter.onInit({
          vite: {
            config: { configFile: path.join(project.root, selected.config) }
          },
          config: { root: project.root }
        })
        reporter.onTestRunStart([{ moduleId: absoluteFile }])
        reporter.onTestCaseResult({
          name: selected.title,
          parent: { type: 'module' },
          module: { moduleId: absoluteFile },
          project: { name: selected.project },
          result: () => ({ state: 'passed', errors: [] })
        })
        reporter.onTestRunEnd([], [], 'passed')
      } else {
        const selectedTest = {
          location: { file: absoluteFile },
          titlePath: () => [
            '',
            selected.project,
            selected.file,
            selected.title
          ],
          parent: { project: () => ({ name: selected.project }) }
        }
        reporter.onBegin(
          { configFile: path.join(project.root, selected.config) },
          { allTests: () => [selectedTest] }
        )
        reporter.onTestEnd(selectedTest, { status: 'passed', errors: [] })
        reporter.onEnd({ status: 'passed' })
      }
      const after = openProject(project.directory).snapshot()
      assert.deepEqual(
        after.documents[0].current.observations.find(
          (o) => o.criterionId === 'sibling'
        ),
        before
      )
      assert.deepEqual(after.documents[0].current.warnings, [])
      assert.equal(after.evaluation.flows[0].nodes[0].status, 'done')
    }
  )
}

test('a selected node cannot bypass duplicate portable mapping admission', (t) => {
  const project = initialize(directory(t), 'vitest')
  const file = path.join(project.directory, 'checkout.flow.json')
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  const sibling = structuredClone(doc.definition.nodes[0])
  sibling.id = 'duplicate'
  doc.definition.nodes.push(sibling)
  fs.writeFileSync(file, JSON.stringify(doc))
  assert.throws(
    () =>
      capture(project, {
        flowId: 'checkout',
        nodeId: 'review',
        criterionId: 'check'
      }),
    /Ambiguous portable selector/
  )
})

test('Playwright retries retain failure without collapsing distinct repeated cases', (t) => {
  const project = initialize(directory(t), 'playwright')
  const selected = capture(project).cases[0].selector
  const Reporter = require('../reporters/playwright.cjs')
  const testcase = () => ({
    location: { file: path.join(project.root, selected.file) },
    titlePath: () => ['', selected.project, selected.file, selected.title],
    parent: { project: () => ({ name: selected.project }) }
  })
  const first = testcase(),
    second = testcase()
  const reporter = new Reporter({ project: project.root })
  reporter.onBegin(
    { configFile: path.join(project.root, selected.config) },
    { allTests: () => [first, second] }
  )
  reporter.onTestEnd(first, { status: 'passed', errors: [] })
  reporter.onTestEnd(second, { status: 'passed', errors: [] })
  reporter.onEnd({ status: 'passed' })
  const store = openProject(project.directory)
  assert.equal(store.snapshot().documents[0].current.observations.length, 0)
  assert.match(
    store.snapshot().documents[0].current.warnings[0].summary,
    /Ambiguous/
  )
  const retry = new Reporter({ project: project.root })
  retry.onBegin(
    { configFile: path.join(project.root, selected.config) },
    { allTests: () => [first] }
  )
  retry.onTestEnd(first, {
    status: 'failed',
    errors: [{ message: 'Real failure' }]
  })
  retry.onTestEnd(first, { status: 'passed', errors: [] })
  retry.onEnd({ status: 'passed' })
  assert.equal(store.snapshot().evaluation.flows[0].nodes[0].status, 'failed')
  assert.equal(store.snapshot().documents[0].current.warnings.length, 0)
})

test('native watch admits an unmapped file without inventing mapped test results', (t) => {
  const project = initialize(directory(t), 'vitest')
  const receipt = capture(project)
  publish(project, receipt, [record(receipt, 'passed')])
  const selected = receipt.cases[0].selector
  const Reporter = require('../reporters/vitest.cjs')
  const reporter = new Reporter({ project: project.root })
  reporter.onInit({
    vite: { config: { configFile: path.join(project.root, selected.config) } },
    config: { root: project.root }
  })
  const moduleId = path.join(project.root, 'flow-example/unmapped.test.mjs')
  fs.writeFileSync(moduleId, '// Unmapped product test\n')
  const store = openProject(project.directory)
  const before = store.snapshot().documents[0].current.observations
  for (const status of ['passed', 'failed']) {
    reporter.onTestRunStart([{ moduleId }])
    reporter.onTestCaseResult({
      name: 'unmapped',
      parent: { type: 'module' },
      module: { moduleId },
      project: { name: selected.project },
      result: () => ({
        state: status,
        errors: status === 'failed' ? [{ message: 'Unmapped failure' }] : []
      })
    })
    reporter.onTestRunEnd([], [], 'passed')
    assert.deepEqual(store.snapshot().documents[0].current.observations, before)
    const warnings = store.snapshot().documents[0].current.warnings
    if (status === 'passed') assert.deepEqual(warnings, [])
    else {
      assert.equal(warnings.length, 1)
      assert.equal(warnings[0].kind, 'unmapped')
      assert.equal(warnings[0].nodeId, 'integration')
    }
  }
})
