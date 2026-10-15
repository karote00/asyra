/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const path = require('node:path')
const test = require('node:test')
const { loadContract } = require('../contracts.cjs')
const { localizeReport } = require('../localization.cjs')
const { normalizeReport } = require('../playwright-results.cjs')
const root = path.resolve(__dirname, '../../../..')
const contract = loadContract(
  root,
  undefined,
  'apps/asyra-design/playwright-flow-contracts.json'
)
const context = () => ({
  format: 1,
  id: require('node:crypto').randomUUID(),
  startedAt: '2026-01-01T00:00:00.000Z',
  head: 'a'.repeat(40),
  source: null,
  contracts: [contract],
  issues: [],
  command: null
})
function report(
  results = [
    {
      status: 'failed',
      retry: 0,
      errors: [{ message: 'expected 0, received 1', stack: 'original stack' }],
      attachments: []
    }
  ]
) {
  return {
    config: {
      rootDir: path.join(root, 'apps/asyra-design/e2e'),
      configFile: path.join(root, 'apps/asyra-design/playwright.config.ts')
    },
    stats: { startTime: '2026-01-01T00:00:01.000Z' },
    errors: [],
    suites: [
      {
        title: 'delete-element.spec.ts',
        file: 'delete-element.spec.ts',
        specs: [],
        suites: [
          {
            title: 'Delete Selected Element',
            specs: [
              {
                title: 'Delete key removes the single selected element',
                file: 'delete-element.spec.ts',
                id: 'original-spec-id',
                tests: [
                  {
                    projectName: 'chromium',
                    projectId: 'chromium',
                    expectedStatus: 'passed',
                    status: 'unexpected',
                    results
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
function locate(input, ctx = context()) {
  const normalized = normalizeReport(root, ctx, input)
  return localizeReport(root, ctx, normalized.report, normalized.options)
}
test('expanded Design cases require exact file, full title and project while siblings stay unresolved', () => {
  for (const item of contract.cases) {
    const input = report()
    const spec = input.suites[0].suites[0].specs[0]
    spec.title = item.testName.replace('Delete Selected Element ', '')
    const mapped = locate(input).cases[0]
    assert.equal(mapped.resolution, 'mapped', item.id)
    assert.equal(mapped.locations[0].caseId, item.id)
    assert.deepEqual(
      mapped.locations[0].implementationPaths,
      item.implementationPaths
    )
    for (const change of ['file', 'title', 'project']) {
      const other = structuredClone(input)
      const changed = other.suites[0].suites[0].specs[0]
      if (change === 'file') changed.file = 'selection.spec.ts'
      if (change === 'title') changed.title += ' renamed'
      if (change === 'project') changed.tests[0].projectName = 'firefox'
      const unresolved = locate(other)
      assert.equal(
        unresolved.cases[0].resolution,
        'unmapped',
        item.id + ' ' + change
      )
      assert.equal(unresolved.cases[0].status, 'failed')
      assert.deepEqual(unresolved.report, other)
    }
    spec.tests.push(structuredClone(spec.tests[0]))
    assert.ok(
      locate(input).cases.every((entry) => entry.resolution === 'ambiguous')
    )
  }
  const unknown = report()
  unknown.suites[0].suites[0].specs[0].title =
    'delete action supports undo and redo'
  assert.equal(locate(unknown).cases[0].resolution, 'unmapped')
})

test(
  'six unchanged Design cases preserve shared-node failures through partial and complete recovery',
  { timeout: 210000 },
  async (t) => {
    const { playwrightFixture } = require('./playwright-results-fixture.cjs')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const fixture = await playwrightFixture(t)
    const ids = contract.cases.map((item) => item.id)
    const baseline = await fixture.run(ids)
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.deepEqual(
      baseline.record.cases.map((item) => item.locations[0]?.caseId).sort(),
      [...ids].sort()
    )
    assert.ok(
      baseline.record.cases.every(
        (item) => item.status === 'passed' && item.resolution === 'mapped'
      )
    )
    fixture.fault()
    const failures = []
    for (const id of ['design.delete', 'design.backspace']) {
      const observed = await fixture.run([id])
      assert.equal(observed.result.code, 1, observed.result.output)
      assert.equal(observed.record.cases.length, 1)
      assert.equal(observed.record.cases[0].status, 'failed')
      assert.equal(observed.record.cases[0].locations[0].caseId, id)
      failures.push(observed.record)
    }
    const reader = createObservationReader(
      observationDirectory(fixture.repository)
    )
    const failedIds = () =>
      reader
        .list()
        .currentCases.filter((item) => item.status === 'failed')
        .map((item) => item.locations[0].caseId)
        .sort()
    assert.deepEqual(failedIds(), ['design.backspace', 'design.delete'])
    fixture.restore()
    const partial = await fixture.run(['design.backspace'])
    assert.equal(partial.result.code, 0, partial.result.output)
    assert.deepEqual(failedIds(), ['design.delete'])
    fixture.fault('path-mode')
    const guard = await fixture.run(['design.delete-path-mode-without-vector'])
    assert.equal(guard.result.code, 1, guard.result.output)
    assert.equal(guard.record.cases[0].status, 'failed')
    assert.equal(
      guard.record.cases[0].locations[0].caseId,
      'design.delete-path-mode-without-vector'
    )
    failures.push(guard.record)
    assert.deepEqual(failedIds(), [
      'design.delete',
      'design.delete-path-mode-without-vector'
    ])
    fixture.restore()
    const recovery = await fixture.run(ids)
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(recovery.record.cases.length, ids.length)
    assert.deepEqual(failedIds(), [])
    for (const record of failures)
      assert.deepEqual(reader.get(record.id), record)
    t.diagnostic('Expanded Design evidence: ' + fixture.repository)
  }
)

test('Design original report preserves a failed retry, errors and exact node through existing localization', () => {
  const input = report()
  const results = input.suites[0].suites[0].specs[0].tests[0].results
  results.push({ status: 'passed', retry: 1, errors: [], attachments: [] })
  const record = locate(input)
  assert.deepEqual(record.report, input)
  assert.equal(record.cases.length, 1)
  const item = record.cases[0]
  assert.equal(item.status, 'failed')
  assert.equal(item.resolution, 'mapped')
  assert.equal(item.locations[0].stepId, 'delete-selected-element')
  assert.match(item.failures[0], /expected 0, received 1/)
  assert.equal(item.failureDetails[0].stack, 'original stack')
  assert.deepEqual(JSON.parse(item.runnerDetails).results, results)
})
test('missing, malformed, interrupted and skipped output never becomes recovery', () => {
  for (const input of [null, {}, { suites: [] }]) {
    const value = locate(input)
    assert.ok(value.issues.length)
    assert.equal(
      value.cases.some((c) => c.status === 'passed'),
      false
    )
  }
  for (const status of ['interrupted', 'skipped', undefined, 'other']) {
    const value = locate(
      report([{ status, retry: 0, errors: [], attachments: [] }])
    )
    assert.notEqual(value.cases[0].status, 'passed')
  }
  const value = locate(report([]))
  assert.notEqual(value.cases[0].status, 'passed')
})
test('unknown and duplicated exact identities preserve all received failures without guessing', () => {
  const input = report()
  const spec = input.suites[0].suites[0].specs[0]
  spec.tests.push(structuredClone(spec.tests[0]))
  input.suites[0].suites[0].specs.push({
    ...structuredClone(spec),
    title: 'unknown failure'
  })
  const record = locate(input)
  assert.equal(record.cases.length, 4)
  assert.ok(
    record.cases.every(
      (c) => c.status === 'failed' && c.resolution === 'ambiguous'
    )
  )
})
test('runner errors and unexpected passes cannot retire failures, and foreign report paths cannot map', () => {
  const input = report([
    { status: 'passed', retry: 0, errors: [], attachments: [] }
  ])
  input.errors = [{ message: 'global setup failure', stack: 'setup stack' }]
  let record = locate(input)
  assert.notEqual(record.cases[0].status, 'passed')
  assert.equal(record.executionFailureDetails[0].stack, 'setup stack')
  input.errors = []
  input.suites[0].suites[0].specs[0].tests[0].expectedStatus = 'failed'
  record = locate(input)
  assert.notEqual(record.cases[0].status, 'passed')
  input.config.rootDir = '/different/checkout/apps/asyra-design/e2e'
  record = locate(input)
  assert.equal(record.cases[0].resolution, 'stale')
})

test(
  'unchanged Design Playwright assertion records baseline, source fault and recovery',
  { timeout: 210000 },
  async (t) => {
    const { playwrightFixture } = require('./playwright-results-fixture.cjs')
    const fixture = await playwrightFixture(t)
    t.diagnostic('Evidence: ' + fixture.repository)
    const baseline = await fixture.run()
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.equal(
      baseline.record.cases.length,
      1,
      JSON.stringify(baseline.record.issues)
    )
    assert.equal(
      baseline.record.cases[0].status,
      'passed',
      JSON.stringify(baseline.record.issues)
    )
    assert.equal(baseline.record.cases[0].resolution, 'mapped')
    fixture.fault()
    const fault = await fixture.run()
    assert.equal(fault.result.code, 1, fault.result.output)
    assert.equal(fault.record.cases[0].status, 'failed')
    assert.equal(
      fault.record.cases[0].resolution,
      'mapped',
      JSON.stringify(fault.record.issues)
    )
    assert.equal(
      fault.record.cases[0].locations[0].stepId,
      'delete-selected-element'
    )
    assert.ok(fault.record.cases[0].failures.length)
    const fs = require('node:fs')
    assert.ok(fault.record.retainedArtifacts.length > 0)
    const retained = fault.record.retainedArtifacts.map((artifact) => ({
      artifact,
      bytes: fs.readFileSync(
        path.join(fixture.repository, artifact.retainedPath)
      )
    }))
    fixture.restore()
    const recovery = await fixture.run()
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(recovery.record.cases[0].status, 'passed')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const reader = createObservationReader(
      observationDirectory(fixture.repository)
    )
    for (const { artifact, bytes } of retained)
      assert.deepEqual(
        fs.readFileSync(path.join(fixture.repository, artifact.retainedPath)),
        bytes
      )
    assert.deepEqual(reader.get(fault.record.id), fault.record)
    assert.equal(
      reader.list().currentCases.filter((c) => c.status === 'failed').length,
      0
    )
  }
)

test('malformed suite or spec identity retains its failures as unresolved evidence', () => {
  for (const mutate of [
    (input) => {
      input.suites[0].suites[0].title = null
    },
    (input) => {
      input.suites[0].suites[0].specs[0].file = null
    },
    (input) => {
      input.suites[0].suites[0].specs[0].title = null
    }
  ]) {
    const input = report()
    mutate(input)
    const record = locate(input)
    assert.equal(
      record.cases.filter((item) => item.status === 'failed').length,
      1
    )
    assert.notEqual(record.cases[0].resolution, 'mapped')
    assert.ok(record.issues.length)
    assert.deepEqual(record.report, input)
  }
})

function observationFixture(t) {
  const fs = require('node:fs')
  const { begin, complete } = require('../playwright-results.cjs')
  const repository = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/playwright-ingestion-')
  )
  const selectedContracts = require('../playwright-results.cjs')
    .sourceManifestPaths()
    .map((manifest) => loadContract(root, undefined, manifest))
  const files = [
    'package.json',
    'yarn.lock',
    ...selectedContracts.flatMap((selected) => [
      selected.manifestPath,
      selected.architecturePath,
      selected.specPath,
      selected.testFile,
      selected.configFile,
      ...selected.cases.map((item) => item.testFile ?? selected.testFile),
      ...selected.runtimeScope.steps.flatMap(
        (step) => step.implementationBoundary
      )
    ])
  ]
  for (const file of new Set(files)) {
    fs.mkdirSync(path.dirname(path.join(repository, file)), { recursive: true })
    fs.copyFileSync(path.join(root, file), path.join(repository, file))
  }
  t.after(() => fs.rmSync(repository, { recursive: true, force: true }))
  let index = 0
  return {
    repository,
    start(environment) {
      const reportPath = 'tmp/report-' + ++index + '.json'
      const context = begin(repository, reportPath, environment ?? {})
      return {
        context,
        reportPath,
        finish(input) {
          if (input !== undefined) {
            input = structuredClone(input)
            input.config.configFile = path.join(
              repository,
              'apps/asyra-design/playwright.config.ts'
            )
            input.config.rootDir = path.join(
              repository,
              'apps/asyra-design/e2e'
            )
            input.stats.startTime = new Date(
              Date.parse(context.startedAt) + 1
            ).toISOString()
            fs.writeFileSync(
              path.join(repository, reportPath),
              JSON.stringify(input)
            )
          }
          return complete(repository, reportPath)
        }
      }
    }
  }
}

test('new case mappings never retroactively resolve an earlier unmapped observation', (t) => {
  const fs = require('node:fs')
  const fixture = observationFixture(t)
  const manifestPath = path.join(fixture.repository, contract.manifestPath)
  const current = fs.readFileSync(manifestPath, 'utf8')
  const previous = JSON.parse(current)
  previous.flows[0].cases = previous.flows[0].cases.filter(
    (item) => item.id === 'design.delete'
  )
  fs.writeFileSync(manifestPath, JSON.stringify(previous))
  const input = report()
  input.suites[0].suites[0].specs[0].title =
    'Backspace key removes the single selected element'
  const original = fixture.start().finish(input)
  assert.equal(original.cases[0].resolution, 'unmapped')
  fs.writeFileSync(manifestPath, current)
  const next = fixture.start().finish(input)
  assert.equal(next.cases[0].resolution, 'mapped')
  assert.equal(next.cases[0].locations[0].caseId, 'design.backspace')
  const {
    createObservationReader,
    observationDirectory
  } = require('../localization.cjs')
  const reader = createObservationReader(
    observationDirectory(fixture.repository)
  )
  assert.deepEqual(reader.get(original.id), original)
  assert.deepEqual(reader.get(next.id), next)
})

test('structurally incomplete reports cannot retire failures regardless of traversal order', (t) => {
  const fixture = observationFixture(t)
  const {
    createObservationReader,
    observationDirectory
  } = require('../localization.cjs')
  const first = fixture.start().finish(report())
  for (const before of [true, false]) {
    for (const damage of ['suite', 'spec', 'empty-spec', 'case', 'children']) {
      const input = report([
        { status: 'passed', retry: 0, errors: [], attachments: [] }
      ])
      const suite = input.suites[0].suites[0]
      const spec = suite.specs[0]
      spec.tests[0].status = 'expected'
      const insert = (items, value) =>
        before ? items.unshift(value) : items.push(value)
      if (damage === 'suite') insert(input.suites, null)
      if (damage === 'spec') insert(suite.specs, { ...spec, tests: null })
      if (damage === 'empty-spec') insert(suite.specs, { ...spec, tests: [] })
      if (damage === 'case')
        insert(spec.tests, { ...spec.tests[0], results: null })
      if (damage === 'children') suite.suites = {}
      const record = fixture.start().finish(input)
      assert.ok(record.issues.length)
      assert.equal(
        record.cases.some((item) => item.status === 'passed'),
        false,
        damage
      )
      assert.deepEqual(record.report.suites, input.suites)
    }
  }
  const reader = createObservationReader(
    observationDirectory(fixture.repository)
  )
  assert.ok(
    reader.list().currentCases.some((item) => item.id === first.cases[0].id)
  )
  const clean = report([
    { status: 'passed', retry: 0, errors: [], attachments: [] }
  ])
  clean.suites[0].suites[0].specs[0].tests[0].status = 'expected'
  assert.equal(fixture.start().finish(clean).cases[0].status, 'passed')
  assert.equal(
    reader.list().currentCases.some((item) => item.status === 'failed'),
    false
  )
  assert.deepEqual(reader.get(first.id), first)
})

test('missing output, changed source and mismatched CI integration retain prior failures and original history', (t) => {
  const fs = require('node:fs')
  const {
    createObservationReader,
    observationDirectory
  } = require('../localization.cjs')
  const fixture = observationFixture(t)
  const first = fixture.start().finish(report())
  const missing = fixture.start().finish()
  assert.ok(
    missing.issues.some((issue) => issue.includes('report unavailable'))
  )
  const changed = fixture.start()
  fs.appendFileSync(
    path.join(fixture.repository, contract.cases[0].implementationPaths[0]),
    '\n// Changed during execution.\n'
  )
  const passing = report([
    { status: 'passed', retry: 0, errors: [], attachments: [] }
  ])
  passing.suites[0].suites[0].specs[0].tests[0].status = 'expected'
  assert.equal(changed.finish(passing).cases[0].resolution, 'stale')
  const mismatch = fixture
    .start({
      FLOW_RESULT_INTEGRATION: '0'.repeat(40),
      FLOW_RESULT_RUN: '123',
      FLOW_RESULT_ATTEMPT: '2'
    })
    .finish(passing)
  assert.equal(mismatch.cases[0].resolution, 'stale')
  const reader = createObservationReader(
    observationDirectory(fixture.repository)
  )
  assert.ok(
    reader.list().currentCases.some((item) => item.id === first.cases[0].id)
  )
  assert.deepEqual(reader.get(first.id), first)
})

test('finalization refuses reuse and makes missing attachment bytes explicit without dropping the failure', (t) => {
  const { begin, complete } = require('../playwright-results.cjs')
  const fixture = observationFixture(t)
  const invocation = fixture.start()
  assert.throws(
    () => begin(fixture.repository, invocation.reportPath),
    /fresh report path/
  )
  const input = report()
  input.suites[0].suites[0].specs[0].tests[0].results[0].attachments = [
    {
      name: 'missing trace',
      path: '/outside-project/trace.zip',
      contentType: 'application/zip'
    }
  ]
  const record = invocation.finish(input)
  assert.equal(record.cases[0].status, 'failed')
  assert.ok(
    record.issues.some((issue) => issue.includes('attachment unavailable'))
  )
  assert.deepEqual(record.retainedArtifacts, [])
  assert.throws(
    () => complete(fixture.repository, invocation.reportPath),
    /already completed/
  )
})

test('unavailable attachment evidence cannot establish recovery from a passing report', (t) => {
  const fixture = observationFixture(t)
  const {
    createObservationReader,
    observationDirectory
  } = require('../localization.cjs')
  const failure = fixture.start().finish(report())
  const input = report([
    {
      status: 'passed',
      retry: 0,
      errors: [],
      attachments: [
        { name: 'trace', path: 'apps/asyra-design/test-results/missing.zip' }
      ]
    }
  ])
  input.suites[0].suites[0].specs[0].tests[0].status = 'expected'
  const record = fixture.start().finish(input)
  assert.ok(
    record.issues.some((issue) => issue.includes('attachment unavailable'))
  )
  assert.notEqual(record.cases[0].status, 'passed')
  const reader = createObservationReader(
    observationDirectory(fixture.repository)
  )
  assert.ok(
    reader.list().currentCases.some((item) => item.id === failure.cases[0].id)
  )
  assert.deepEqual(reader.get(failure.id), failure)
})

test('Playwright primary error stack survives alongside its formatted JSON error message', () => {
  const input = report()
  const result = input.suites[0].suites[0].specs[0].tests[0].results[0]
  result.error = {
    message: 'raw assertion message',
    stack: 'raw assertion stack'
  }
  result.errors = [
    { message: 'formatted assertion and code frame', location: { line: 1 } }
  ]
  const record = locate(input)
  assert.ok(
    record.cases[0].failureDetails.some(
      (detail) => detail.stack === result.error.stack
    )
  )
  assert.ok(
    record.cases[0].failureDetails.some(
      (detail) => detail.message === result.errors[0].message
    )
  )
  assert.deepEqual(record.report, input)
})

test('an alternate Playwright configuration cannot borrow the ordinary Design source identity', () => {
  const input = report()
  input.config.configFile = path.join(
    root,
    'apps/asyra-design/playwright.collaboration.config.ts'
  )
  const record = locate(input)
  assert.equal(record.cases[0].resolution, 'stale')
  assert.ok(record.issues.some((issue) => issue.includes('configuration')))
})

test('valid CI repository, source and attempt identity remains unchanged in the retained observation', (t) => {
  const fixture = observationFixture(t)
  const head = require('node:child_process')
    .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
    .trim()
  const environment = {
    CI: 'true',
    GITHUB_EVENT_NAME: 'schedule',
    RUN_BALANCED_AI_CORRECTNESS: 'false',
    FLOW_RESULT_REPOSITORY: 'example/design',
    FLOW_RESULT_BASE: 'b'.repeat(40),
    FLOW_RESULT_HEAD: 'c'.repeat(40),
    FLOW_RESULT_INTEGRATION: head,
    FLOW_RESULT_RUN: '1234',
    FLOW_RESULT_ATTEMPT: '2'
  }
  const record = fixture.start(environment).finish(report())
  assert.equal(record.cases[0].resolution, 'mapped')
  assert.deepEqual(record.command.environment, environment)
  assert.equal(record.head, head)
})

test('functional and status producers select their complete exact contracts before execution', () => {
  const { sourceManifestPaths } = require('../playwright-results.cjs')
  assert.deepEqual(sourceManifestPaths('functional'), [
    'apps/asyra-design/playwright-flow-contracts.json',
    'apps/asyra-design/playwright-functional-flow-contracts.json'
  ])
  assert.deepEqual(sourceManifestPaths('status'), [
    'apps/asyra-design/playwright-status-flow-contracts.json'
  ])
  for (const source of ['', 'collaboration', '../other', null])
    assert.throws(() => sourceManifestPaths(source), /source/)
})

test('status reports require the retained status configuration and cannot borrow functional ownership', () => {
  const status = loadContract(
    root,
    undefined,
    'apps/asyra-design/playwright-status-flow-contracts.json'
  )
  const ctx = context()
  ctx.contracts = [status]
  const input = report()
  input.config.configFile = path.join(root, status.configFile)
  input.suites = [
    {
      title: 'status-toast-visual.spec.ts',
      file: 'status-toast-visual.spec.ts',
      specs: [
        {
          title: status.cases[0].testName,
          file: 'status-toast-visual.spec.ts',
          tests: input.suites[0].suites[0].specs[0].tests
        }
      ],
      suites: []
    }
  ]
  const result = locate(input, ctx)
  assert.equal(result.cases[0].resolution, 'mapped')
  assert.equal(result.cases[0].locations[0].stepId, 'show-session-status')
  input.config.configFile = path.join(root, contract.configFile)
  assert.equal(locate(input, ctx).cases[0].resolution, 'stale')
})

function verifyOriginalFunctionalOutcomes(observation) {
  assert.deepEqual(observation.issues, [])
  const expected = []
  const walk = (suite) => {
    for (const spec of suite.specs ?? [])
      for (const item of spec.tests ?? []) {
        assert.ok(['expected', 'skipped'].includes(item.status), spec.title)
        assert.ok(item.results.length > 0)
        const failed = item.results.some((result) =>
          ['failed', 'timedOut', 'interrupted'].includes(result.status)
        )
        if (failed) assert.equal(item.expectedStatus, 'failed', spec.title)
        let status = 'passed'
        if (failed) status = 'failed'
        else if (item.results.every((result) => result.status === 'skipped'))
          status = 'skipped'
        expected.push(status)
      }
    for (const child of suite.suites ?? []) walk(child)
  }
  for (const suite of observation.report.suites) walk(suite)
  assert.deepEqual(
    observation.cases.map((item) => item.status).sort(),
    expected.sort()
  )
  for (const item of observation.cases.filter(
    (item) => item.status === 'failed'
  )) {
    assert.equal(item.resolution, 'mapped')
    assert.ok(item.failures.length)
  }
}

test('original expected failures remain failed observations instead of becoming recovery', () => {
  const input = report()
  const item = input.suites[0].suites[0].specs[0].tests[0]
  item.expectedStatus = 'failed'
  item.status = 'expected'
  const observation = locate(input)
  verifyOriginalFunctionalOutcomes(observation)
  assert.equal(observation.cases[0].status, 'failed')
  observation.cases[0].status = 'passed'
  assert.throws(() => verifyOriginalFunctionalOutcomes(observation))
})

test(
  'the complete functional command retains all Stage A cases and isolated status evidence',
  {
    skip: process.env.FLOW_DESIGN_FUNCTIONAL_PROOF !== 'true',
    timeout: 2700000
  },
  async (t) => {
    const fs = require('node:fs')
    const { runProcess } = require('../runner.cjs')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const evidence = path.join(
      root,
      'tmp/flow-inspector/stage-a/full-' + require('node:crypto').randomUUID()
    )
    fs.mkdirSync(path.join(evidence, 'browser'), { recursive: true })
    const reportPath = path.join(evidence, 'functional.json')
    const result = await runProcess({
      executable: '/bin/bash',
      args: ['scripts/run-e2e.sh'],
      cwd: root,
      env: {
        ...process.env,
        CI: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        E2E_SUITE: 'functional',
        FLOW_CI_REPORT: reportPath,
        APP_URL: process.env.APP_URL || 'http://127.0.0.1:4317',
        COLLABORATION_WS_PORT: process.env.COLLABORATION_WS_PORT || '4318',
        TMPDIR: process.env.RUNNER_TEMP || path.join(evidence, 'browser')
      },
      signal: t.signal,
      timeoutMs: 2640000,
      maxOutputBytes: 2 * 1024 * 1024,
      onSpawn: (pid) =>
        fs.writeFileSync(
          path.join(evidence, 'process.json'),
          JSON.stringify({ pid, reportPath })
        )
    })
    fs.writeFileSync(path.join(evidence, 'run.log'), result.output)
    t.diagnostic('Full functional evidence: ' + evidence)
    assert.equal(result.reason, null, result.output.slice(-4000))
    assert.equal(result.code, 0, result.output.slice(-4000))
    const reader = createObservationReader(observationDirectory(root))
    for (const [file, count] of [
      [reportPath, 411],
      [reportPath.replace(/\.json$/, '-status.json'), 1]
    ]) {
      const { id } = JSON.parse(fs.readFileSync(file + '.context.json', 'utf8'))
      const observation = reader.get(id)
      assert.equal(observation.phase, 'completed')
      assert.equal(observation.cases.length, count)
      assert.ok(
        observation.cases.every((item) => item.resolution === 'mapped'),
        JSON.stringify(observation.issues)
      )
      verifyOriginalFunctionalOutcomes(observation)
      const original = JSON.parse(fs.readFileSync(file, 'utf8'))
      assert.deepEqual(observation.report, original)
      fs.writeFileSync(
        path.join(
          evidence,
          count === 1 ? 'status-summary.json' : 'functional-summary.json'
        ),
        JSON.stringify(
          {
            id,
            cases: count,
            passed: observation.cases.filter((item) => item.status === 'passed')
              .length,
            skipped: observation.cases
              .filter((item) => item.status === 'skipped')
              .map((item) => ({ file: item.file, testName: item.testName })),
            issues: observation.issues
          },
          null,
          2
        )
      )
    }
  }
)

// Faults disable canonical owner operations in an isolated copy. The original
// product cases and their assertions remain unchanged throughout all three runs.
const functionalOwnerProofs = [
  [
    'start-editor',
    'functional.app.0ed5202f90ef',
    'apps/asyra-design/index.html',
    {
      from: '<title>Asyra Design</title>',
      to: '<title>Unavailable editor</title>'
    }
  ],
  [
    'select-elements',
    'functional.selection.6822ac93b278',
    'contents/layer-selection.ts',
    'getVisibleRangeSelection'
  ],
  [
    'edit-fills',
    'functional.fill-patch.d43e8512336a',
    'common-apis/fills.ts',
    'fillApis.updateFillFields'
  ],
  [
    'edit-vector-path',
    'functional.basic-api-actions.11b963104ba2',
    'common-apis/element/vector-apis.ts',
    'vectorApis.updateVectorAnchorPointPosition'
  ],
  [
    'inspect-design',
    'functional.drawing-inspection.be7218fc660c',
    'common-apis/inspection.ts',
    'inspectionApis.inspect'
  ],
  [
    'replay-history',
    'functional.undo-redo.3ef9814e7f9f',
    'features/undo-redo/index.ts',
    'undoRedoFeature.execution'
  ],
  [
    'delete-subtree',
    'functional.delete-element.e873bdf40a7b',
    'features/delete-element/index.ts',
    'deleteElementFeature.execution'
  ],
  [
    'target-hierarchy',
    'functional.group-hierarchy.dc75cefb2ff0',
    'controllers/canvas-hierarchy-target.ts',
    'resolveContainerChildTarget'
  ],
  [
    'project-vector-geometry',
    'functional.vector-render-invariants.2e069d2c2be4',
    'packages/preset/src/components/vector.ts',
    'renderVectorGraphic',
    { isolateWorkspaces: true }
  ],
  [
    'render-material',
    'functional.mesh-material.bf559278744a',
    'packages/render-engine-pixi/src/mesh-material.ts',
    'encodeMeshMaterial',
    { isolateWorkspaces: true }
  ],
  [
    'retain-navigation',
    'functional.retained-navigation.9c63e382e1fe',
    'packages/render-engine-pixi/src/pixi-render-engine.ts',
    {
      from: 'eventFeatures: { wheel: false }',
      to: 'eventFeatures: { wheel: true }'
    },
    { isolateWorkspaces: true }
  ],
  [
    'rollback-transaction',
    'functional.delete-element.05b69c2318a3',
    'packages/factory/src/data-transact.ts',
    'settleRollback',
    { isolateWorkspaces: true }
  ],
  [
    'group-history-members',
    'functional.transaction-history-groups.d56462fd928a',
    'packages/factory/src/data-transact.ts',
    'withHistoryGroup',
    { isolateWorkspaces: true }
  ],
  [
    'show-session-status',
    'functional.session-status',
    'render-app/status-toast-stack.tsx',
    'StatusToastStack',
    { source: 'status' }
  ],
  [
    'present-layer-hierarchy',
    'functional.group-hierarchy.caf2f297812e',
    'contents/GroupDisclosure.tsx',
    'GroupDisclosure.handleClick'
  ],
  [
    'start-editor',
    'functional.app.fb7b866d4b66',
    'render-app/index.tsx',
    'RenderApp'
  ],
  [
    'edit-properties',
    'functional.properties.e79a06577eba',
    'properties/position.tsx',
    {
      from: "updateSelectedElementProperties('x', nextValue)",
      to: 'void nextValue'
    }
  ],
  [
    'edit-fills',
    'functional.properties.ee7ea52ee1d0',
    'common-apis/fills.ts',
    'fillApis.addFills'
  ],
  [
    'present-conversation',
    'functional.ai-composer-layout.8ad3189fe559',
    'app/ai-conversation-panel.tsx',
    'AiConversationPanel'
  ],
  [
    'execute-agent-request',
    'functional.ai-conversation-flow.cdb75707ec99',
    'features/ai-agent/index.ts',
    'registerAiAgentFeature.api.execute'
  ],
  [
    'invoke-basic-api',
    'functional.basic-api-actions.803332ede82f',
    'ai/basic-api-actions.ts',
    'createBasicApiActions.execute'
  ],
  [
    'apply-prepared-design',
    'functional.design-construction.6317e5763e37',
    'ai/design-actions.ts',
    'createPreparedDesignAction.execute'
  ],
  [
    'inspect-design',
    'functional.ai-inspection-evidence.29d7c8fe685d',
    'common-apis/inspection-evidence.ts',
    'createInspectionEvidence.capture'
  ],
  [
    'query-design-context',
    'functional.indexed-design-query.d8098ca29a69',
    'common-apis/design-context.ts',
    {
      from: '(query: DesignContextQuery) => {',
      to: "(query: DesignContextQuery) => { throw new Error('Isolated query fault');"
    }
  ],
  [
    'edit-native-text',
    'functional.native-text.27b2b5daa8f1',
    'properties/text.tsx',
    'TextField.commit'
  ],
  [
    'show-context-menu',
    'functional.context-menu.36c22a73a6c4',
    'app/group-context-menu.tsx',
    'GroupContextMenu'
  ],
  [
    'switch-tool',
    'functional.oval.35187e9c8c85',
    'features/switch-primary-tool/index.ts',
    'api.switch'
  ],
  [
    'create-element',
    'functional.element-creation.972c55b3a8a5',
    'features/create-element/feature.ts',
    'createElementSession.onStart'
  ],
  [
    'select-elements',
    'functional.selection.65d2395ec2dd',
    'features/selection/feature.ts',
    'selectionFeature.session.onUpdate'
  ],
  [
    'hover-elements',
    'functional.selection.2e58d1642f60',
    'features/hover-element/index.ts',
    'publishHoveredElementId'
  ],
  [
    'move-elements',
    'functional.selection.5b2869cee128',
    'features/move-elements/feature.ts',
    'moveElementsSession.onUpdate'
  ],
  [
    'delete-vector-point',
    'functional.delete-element.d754de456719',
    'features/delete-vector-point/index.ts',
    'deleteVectorPointFeature.execution'
  ],
  [
    'replay-history',
    'functional.undo-redo.16e8eb3faacf',
    'features/undo-redo/index.ts',
    'undoRedoFeature.execution'
  ],
  [
    'edit-vector-path',
    'functional.pen-tool.77d70b602c9f',
    'features/pen-tool/feature.ts',
    'penFeature.session.onStart'
  ],
  [
    'drag-gradient-handles',
    'functional.gradient-fill-handles.10fe841ccb7b',
    'features/gradient-fill-handles/feature.ts',
    'dragGradientHandleFeature.session.onUpdate'
  ],
  [
    'group-elements',
    'functional.group-interaction.61aff3d7b873',
    'features/group-elements/index.ts',
    'executeGroupCommandRequest'
  ],
  [
    'move-layer-hierarchy',
    'functional.layer-tree-reparent-reorder.63841ee3ab7a',
    'features/layer-hierarchy-move/index.ts',
    'layerHierarchyMoveSession.onEnd'
  ],
  [
    'navigate-viewport',
    'functional.viewport-navigation.0615b9da5e57',
    'common-apis/viewport.ts',
    'viewportApis.zoomToCenter'
  ]
]
for (const [
  stepId,
  caseId,
  relativeFile,
  operation,
  fixtureOptions
] of functionalOwnerProofs) {
  test(
    'Stage A original owner fault and recovery - ' + stepId + ' - ' + caseId,
    {
      skip: process.env.FLOW_DESIGN_OWNER_PROOF !== 'true',
      timeout: 240000
    },
    async (t) => {
      const fs = require('node:fs')
      const { playwrightFixture } = require('./playwright-results-fixture.cjs')
      const {
        createObservationReader,
        observationDirectory
      } = require('../localization.cjs')
      const fixture = await playwrightFixture(t, fixtureOptions)
      t.diagnostic('Original owner evidence: ' + fixture.repository)
      const item = fixture.cases.find((item) => item.id === caseId)
      assert.equal(item.stepId, stepId)
      const testFile = path.join(fixture.repository, item.testFile)
      const unchangedAssertions = fs.readFileSync(testFile, 'utf8')
      const verify = (run, status, code) => {
        assert.equal(run.result.reason, null, run.result.output.slice(-3000))
        assert.equal(run.result.code, code, run.result.output.slice(-3000))
        assert.equal(
          run.record.cases.length,
          1,
          JSON.stringify(run.record.issues)
        )
        const observed = run.record.cases[0]
        assert.equal(observed.status, status)
        assert.equal(
          observed.resolution,
          'mapped',
          JSON.stringify(run.record.issues)
        )
        assert.equal(observed.locations[0].stepId, stepId)
        assert.equal(observed.locations[0].caseId, caseId)
        assert.equal(fs.readFileSync(testFile, 'utf8'), unchangedAssertions)
        return observed
      }
      verify(await fixture.run([caseId]), 'passed', 0)
      const file = /^(packages|apps)\//.test(relativeFile)
        ? relativeFile
        : 'apps/asyra-design/src/' + relativeFile
      if (typeof operation === 'string')
        fixture.faultOperation(caseId, file, operation)
      else fixture.faultCase(caseId, { file, ...operation })
      const failed = await fixture.run([caseId])
      const observed = verify(failed, 'failed', 1)
      assert.ok(observed.failures.length)
      const originalFailure = JSON.stringify(failed.record)
      fixture.restore()
      verify(await fixture.run([caseId]), 'passed', 0)
      assert.equal(
        JSON.stringify(
          createObservationReader(observationDirectory(fixture.repository)).get(
            failed.record.id
          )
        ),
        originalFailure
      )
    }
  )
}

test('original owner proofs cover every declared functional responsibility', () => {
  const { sourceManifestPaths } = require('../playwright-results.cjs')
  const contracts = ['functional', 'status'].flatMap((source) =>
    sourceManifestPaths(source).map((file) =>
      loadContract(root, undefined, file)
    )
  )
  const functional = contracts.filter(
    (item) => item.targetId === 'design-functional'
  )
  const steps = new Set(
    functional.flatMap((item) => item.cases.map((item) => item.stepId))
  )
  assert.deepEqual(
    [...new Set(functionalOwnerProofs.map(([step]) => step))].sort(),
    [...steps].sort()
  )
  for (const [step, id, relative] of functionalOwnerProofs) {
    const item = functional
      .flatMap((contract) => contract.cases)
      .find((item) => item.id === id)
    assert.equal(item?.stepId, step, id)
    const file = /^(packages|apps)\//.test(relative)
      ? relative
      : 'apps/asyra-design/src/' + relative
    assert.ok(item.implementationPaths.includes(file), file)
  }
})

test(
  'retained complete functional evidence preserves original expected failures',
  {
    skip: !process.env.FLOW_DESIGN_RETAINED_REPORT
  },
  () => {
    const fs = require('node:fs')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const reportPath = path.resolve(
      root,
      process.env.FLOW_DESIGN_RETAINED_REPORT
    )
    assert.ok(reportPath.startsWith(path.join(root, 'tmp') + path.sep))
    const reader = createObservationReader(observationDirectory(root))
    for (const [file, count] of [
      [reportPath, 411],
      [reportPath.replace(/\.json$/, '-status.json'), 1]
    ]) {
      const context = JSON.parse(
        fs.readFileSync(file + '.context.json', 'utf8')
      )
      const observation = reader.get(context.id)
      assert.equal(observation.phase, 'completed')
      assert.equal(observation.cases.length, count)
      assert.ok(observation.cases.every((item) => item.resolution === 'mapped'))
      assert.deepEqual(
        observation.report,
        JSON.parse(fs.readFileSync(file, 'utf8'))
      )
      verifyOriginalFunctionalOutcomes(observation)
    }
  }
)
