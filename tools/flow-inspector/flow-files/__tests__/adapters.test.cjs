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

test('publication preserves complete long diagnostics without putting them in a summary field', (t) => {
  const project = initialize(directory(t), 'vitest')
  const receipt = capture(project)
  const diagnostic = Array.from(
    { length: 200 },
    (_, index) =>
      'Unsuccessful boundary ' + index + ': ' + 'evidence '.repeat(30)
  ).join('\n')

  publish(project, receipt, [record(receipt, 'passed')], diagnostic)
  const snapshot = openProject(project.directory).snapshot()
  const warning = snapshot.documents[0].current.warnings[0]

  assert.notEqual(snapshot.evaluation.flows[0].nodes[0].status, 'done')
  assert.equal(warning.details.join('\n'), diagnostic)
  assert.ok(warning.summary.length <= 8192)
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

    if (status === 'passed') {
      assert.deepEqual(warnings, [])
    } else {
      assert.equal(warnings.length, 1)
      assert.equal(warnings[0].kind, 'unmapped')
      assert.equal(warnings[0].nodeId, 'integration')
    }
  }
})

for (const field of ['numFailedTests', 'numPendingTests', 'numTodoTests']) {
  test('current flow publication rejects contradictory ' + field, (t) => {
    const { normalize, reportDiagnostic } = require('../adapters.cjs')
    const project = initialize(directory(t), 'vitest')
    const receipt = capture(project)
    const selected = receipt.cases[0].selector
    const report = {
      success: true,
      [field]: 1,
      testResults: [
        {
          name: path.join(project.root, selected.file),
          status: 'passed',
          assertionResults: [
            { fullName: selected.title, status: 'passed', failureMessages: [] }
          ]
        }
      ]
    }
    const records = normalize(project, report, selected)

    publish(project, receipt, records, reportDiagnostic(report, records))
    assert.notEqual(
      openProject(project.directory).snapshot().evaluation.flows[0].nodes[0]
        .status,
      'done'
    )
  })
}

test('Node observations use the same current criterion and source-bound publication', (t) => {
  const { normalize } = require('../adapters.cjs')
  const project = initialize(directory(t), 'vitest')
  const file = path.join(project.directory, 'checkout.flow.json')
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'))

  doc.definition.nodes[0].criteria[0].selector.producer = 'node'
  fs.writeFileSync(file, JSON.stringify(doc))
  const receipt = capture(project)
  const selected = receipt.cases[0].selector
  const records = normalize(
    project,
    {
      success: true,
      testResults: [
        {
          name: path.join(project.root, selected.file),
          assertionResults: [{ fullName: selected.title, status: 'passed' }]
        }
      ]
    },
    selected
  )

  publish(project, receipt, records)
  assert.equal(
    openProject(project.directory).snapshot().evaluation.flows[0].nodes[0]
      .status,
    'done'
  )
})

test('real selected Node execution publishes only the requested criterion', async (t) => {
  const { runSelected } = require('../portable-runner.cjs')
  const repository = path.resolve(__dirname, '../../../..')
  const project = { ...initialize(directory(t), 'vitest'), root: repository }
  const file = path.join(project.directory, 'checkout.flow.json')
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  const criterion = doc.definition.nodes[0].criteria[0]

  criterion.selector = {
    producer: 'node',
    identity: JSON.stringify({
      config: 'tools/flow-inspector/control-plane/node-test-reporter.mjs',
      cwd: '.',
      file: 'scripts/__tests__/domain-knowledge.test.mjs',
      project: '',
      title: 'shared knowledge is a flat data-only root workspace'
    })
  }
  doc.definition.nodes[0].actions = []
  fs.writeFileSync(file, JSON.stringify(doc))
  const result = await runSelected(project, { criterionId: criterion.id })

  assert.equal(result.code, 0, JSON.stringify(result))
  assert.equal(
    openProject(project.directory).snapshot().evaluation.flows[0].nodes[0]
      .status,
    'done'
  )
})

for (const scenario of [
  'passed',
  'failed',
  'skipped',
  'empty',
  'interrupted'
]) {
  test(
    'selected Node evidence preserves real ' + scenario + ' execution',
    async (t) => {
      const { runSelected } = require('../portable-runner.cjs')
      const project = {
        ...initialize(directory(t), 'vitest'),
        root: path.resolve(__dirname, '../../../..')
      }
      const file = path.join(project.directory, 'checkout.flow.json')
      const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
      const criterion = doc.definition.nodes[0].criteria[0]

      criterion.selector = {
        producer: 'node',
        identity: JSON.stringify({
          config: 'tools/flow-inspector/control-plane/node-test-reporter.mjs',
          cwd: '.',
          file: 'tools/flow-inspector/control-plane/__tests__/fixtures/runner-events.mjs',
          project: '',
          title:
            scenario === 'interrupted'
              ? 'process termination'
              : 'first parent same child name'
        })
      }
      doc.definition.nodes[0].actions = []
      fs.writeFileSync(file, JSON.stringify(doc))
      const previous = process.env.FLOW_TEST_SCENARIO

      process.env.FLOW_TEST_SCENARIO = scenario
      t.after(() => {
        if (previous === undefined) {
          delete process.env.FLOW_TEST_SCENARIO
        } else {
          process.env.FLOW_TEST_SCENARIO = previous
        }
      })
      const result = await runSelected(project, { criterionId: criterion.id })
      const state = openProject(project.directory).snapshot()

      assert.equal(
        result.code,
        scenario === 'passed' ? 0 : 1,
        JSON.stringify(state.documents[0].current.warnings)
      )
      if (scenario === 'passed') {
        assert.equal(state.evaluation.flows[0].nodes[0].status, 'done')
      } else {
        assert.notEqual(state.evaluation.flows[0].nodes[0].status, 'done')
      }

      if (scenario === 'failed') {
        assert.ok(
          state.documents[0].current.observations.some(
            (item) => item.status === 'failed'
          )
        )
      }
    }
  )
}

test('whole-run publication cannot hide a missing owner behind a previously passing criterion', (t) => {
  const { publishCompleteReport } = require('../adapters.cjs')
  const project = initialize(directory(t), 'vitest')
  const receipt = capture(project)
  const selected = receipt.cases[0].selector
  const report = {
    success: true,
    testResults: [
      {
        name: path.join(project.root, selected.file),
        assertionResults: [{ fullName: selected.title, status: 'passed' }]
      }
    ]
  }

  publishCompleteReport(
    project,
    receipt,
    report,
    selected,
    [selected.file],
    [selected]
  )
  assert.equal(
    openProject(project.directory).snapshot().evaluation.flows[0].nodes[0]
      .status,
    'done'
  )
  const next = capture(project)

  publishCompleteReport(
    project,
    next,
    report,
    selected,
    [selected.file, 'other-owner.test.ts'],
    [selected, { file: 'other-owner.test.ts', title: 'other behavior' }]
  )
  const current = openProject(project.directory).snapshot()

  assert.notEqual(current.evaluation.flows[0].nodes[0].status, 'done')
  assert.match(
    current.documents[0].current.warnings[0].summary,
    /Missing required test file/
  )
})

test('whole-run publication rejects unselected pending assertions and malformed reports', (t) => {
  const { publishCompleteReport } = require('../adapters.cjs')
  const project = initialize(directory(t), 'vitest')
  const selected = capture(project).cases[0].selector

  for (const report of [
    {
      success: true,
      testResults: [
        {
          name: path.join(project.root, selected.file),
          assertionResults: [
            { fullName: selected.title, status: 'passed' },
            { fullName: 'Unmapped required behavior', status: 'pending' }
          ]
        }
      ]
    },
    {
      success: true,
      testResults: [{ name: path.join(project.root, selected.file) }]
    }
  ]) {
    publishCompleteReport(
      project,
      capture(project),
      report,
      selected,
      [selected.file],
      [selected, { file: selected.file, title: 'Unmapped required behavior' }]
    )
    assert.notEqual(
      openProject(project.directory).snapshot().evaluation.flows[0].nodes[0]
        .status,
      'done'
    )
  }
})

test('whole-run publication retires a prior pass when an unselected case disappears within the same file', (t) => {
  const { publishCompleteReport } = require('../adapters.cjs')
  const project = initialize(directory(t), 'vitest')
  const receipt = capture(project)
  const selected = receipt.cases[0].selector
  const requiredCases = [
    selected,
    { file: selected.file, title: 'independently required sibling' }
  ]
  const report = {
    success: true,
    numTotalTests: 2,
    numPassedTests: 2,
    testResults: [
      {
        name: selected.file,
        assertionResults: requiredCases.map((item) => ({
          fullName: item.title,
          status: 'passed'
        }))
      }
    ]
  }

  publishCompleteReport(
    project,
    receipt,
    report,
    selected,
    [selected.file],
    requiredCases
  )
  assert.equal(
    openProject(project.directory).snapshot().evaluation.flows[0].nodes[0]
      .status,
    'done'
  )
  report.testResults[0].assertionResults.pop()
  report.numTotalTests--
  report.numPassedTests--
  publishCompleteReport(
    project,
    capture(project),
    report,
    selected,
    [selected.file],
    requiredCases
  )
  const current = openProject(project.directory).snapshot()

  assert.notEqual(current.evaluation.flows[0].nodes[0].status, 'done')
  assert.match(
    current.documents[0].current.warnings[0].summary,
    /Missing required test case/
  )
})
