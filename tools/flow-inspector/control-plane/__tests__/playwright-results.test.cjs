/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const path = require('node:path')
const test = require('node:test')
const { setImmediate } = require('node:timers')
const { loadContract } = require('../contracts.cjs')
const { localizeReport } = require('../localization.cjs')
const { normalizeReport } = require('../playwright-results.cjs')
const {
  verifyOriginalFunctionalOutcomes,
  verifyDeclaredFunctionalCases
} = require('./playwright-results-fixture.cjs')
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

      if (change === 'file') {
        changed.file = 'selection.spec.ts'
      }

      if (change === 'title') {
        changed.title += ' renamed'
      }

      if (change === 'project') {
        changed.tests[0].projectName = 'firefox'
      }

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
    for (const record of failures) {
      assert.deepEqual(reader.get(record.id), record)
    }

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

    for (const { artifact, bytes } of retained) {
      assert.deepEqual(
        fs.readFileSync(path.join(fixture.repository, artifact.retainedPath)),
        bytes
      )
    }

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

test('large file evidence survives report ingestion and aggregate verification without inflating the report', (t) => {
  const fs = require('node:fs')
  const { exportBundle } = require('../observation-files.cjs')
  const { collect, projectObservations } = require('../workflow-results.cjs')
  const bytes = Buffer.from(
    JSON.stringify({ profile: 'retained detail '.repeat(350000) })
  )

  assert.ok(bytes.length > 4 * 1024 * 1024)

  const passingReport = (attachment) => {
    const value = report([
      {
        status: 'passed',
        retry: 0,
        errors: [],
        attachments: [attachment]
      }
    ])

    value.suites[0].suites[0].specs[0].tests[0].status = 'expected'

    return value
  }

  const inline = observationFixture(t)
    .start()
    .finish(
      passingReport({
        name: 'profile',
        contentType: 'application/json',
        body: bytes.toString('base64')
      })
    )

  assert.equal(inline.report, null)
  assert.ok(
    inline.issues.some((issue) => issue.includes('4 MiB observation limit'))
  )

  const fixture = observationFixture(t)
  const revision = require('node:child_process')
    .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
    .trim()
  const identity = {
    repository: 'example/repository',
    base: 'a'.repeat(40),
    head: revision,
    integration: revision,
    run: '123',
    attempt: '1'
  }
  const invocation = fixture.start(
    Object.fromEntries(
      Object.entries(identity).map(([key, value]) => [
        'FLOW_RESULT_' + key.toUpperCase(),
        value
      ])
    )
  )
  const originalPath = path.join(
    fixture.repository,
    'apps/asyra-design/test-results/profile.json'
  )

  fs.mkdirSync(path.dirname(originalPath), { recursive: true })
  fs.writeFileSync(originalPath, bytes)
  const observation = invocation.finish(
    passingReport({
      name: 'profile',
      contentType: 'application/json',
      path: originalPath
    })
  )

  assert.deepEqual(observation.issues, [])
  assert.equal(observation.cases[0].status, 'passed')
  assert.ok(
    fs.statSync(path.join(fixture.repository, invocation.reportPath)).size <
      4 * 1024 * 1024
  )
  const retained = observation.retainedArtifacts[0]

  assert.equal(retained.size, bytes.length)
  assert.deepEqual(
    fs.readFileSync(path.join(fixture.repository, retained.retainedPath)),
    bytes
  )
  const directory = path.join(fixture.repository, 'tmp/bundles')
  const bundle = path.join(directory, 'flow-observations-design-123-1')

  exportBundle(fixture.repository, bundle, identity)
  const envelope = collect(observation.report, 'design', identity)

  const verify = () =>
    projectObservations(
      fixture.repository,
      directory,
      identity,
      ['functional'],
      [envelope]
    )

  assert.deepEqual(verify().blockers, [])
  assert.equal(verify().producers.design.status, 'observed')
  fs.unlinkSync(originalPath)
  assert.deepEqual(verify().blockers, [])
  const archived = path.join(bundle, retained.retainedPath)

  assert.deepEqual(fs.readFileSync(archived), bytes)
  fs.writeFileSync(archived, 'corrupt')
  assert.equal(verify().producers.design.status, 'unverified')
  assert.ok(verify().blockers.length)
  fs.unlinkSync(archived)
  assert.equal(verify().producers.design.status, 'unverified')
  assert.ok(verify().blockers.length)
})

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

      if (damage === 'suite') {
        insert(input.suites, null)
      }

      if (damage === 'spec') {
        insert(suite.specs, { ...spec, tests: null })
      }

      if (damage === 'empty-spec') {
        insert(suite.specs, { ...spec, tests: [] })
      }

      if (damage === 'case') {
        insert(spec.tests, { ...spec.tests[0], results: null })
      }

      if (damage === 'children') {
        suite.suites = {}
      }

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
  for (const source of ['', 'unknown-producer', '../other', null]) {
    assert.throws(() => sourceManifestPaths(source), /source/)
  }
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

test('selected rerun config admission requires the exact original mapping and retained wrapper bytes', (t) => {
  const fs = require('node:fs')
  const { createHash } = require('node:crypto')
  const directory = path.join(
    root,
    'tmp/flow-inspector/config-binding-' + require('node:crypto').randomUUID()
  )

  fs.mkdirSync(directory, { recursive: true })
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const file = path.join(directory, 'selected.config.ts')

  fs.writeFileSync(file, 'export default {}')
  const bound = context()

  bound.executionConfig = {
    path: path.relative(root, file),
    originalConfigFile: contract.configFile,
    digest: createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  }
  const original = report()

  original.config.configFile = file
  assert.equal(normalizeReport(root, bound, original).options.stale, false)
  assert.equal(normalizeReport(root, context(), original).options.stale, true)
  const changed = structuredClone(bound)

  changed.executionConfig.originalConfigFile = 'unrelated.config.ts'
  assert.equal(normalizeReport(root, changed, original).options.stale, true)
  fs.appendFileSync(file, '\n// changed')
  assert.equal(normalizeReport(root, bound, original).options.stale, true)
  fs.unlinkSync(file)
  assert.equal(normalizeReport(root, bound, original).options.stale, true)
})

test('current flow publication retains Playwright attachments without an observation archive', (t) => {
  const fs = require('node:fs')
  const { fromContracts } = require('../../flow-files/producers.cjs')
  const { openProject } = require('../../flow-files/store.cjs')
  const fixture = observationFixture(t)
  const selected = require('../playwright-results.cjs')
    .sourceManifestPaths()
    .map((manifest) => loadContract(fixture.repository, undefined, manifest))
  const directory = path.join(fixture.repository, 'flows')

  fs.mkdirSync(directory)
  for (const doc of fromContracts(selected, 'example')) {
    fs.writeFileSync(
      path.join(directory, doc.flowId + '.flow.json'),
      JSON.stringify(doc)
    )
  }

  const prior = process.env.FLOW_FILE_DIRECTORY

  process.env.FLOW_FILE_DIRECTORY = directory
  t.after(() => {
    if (prior === undefined) {
      delete process.env.FLOW_FILE_DIRECTORY
    } else {
      process.env.FLOW_FILE_DIRECTORY = prior
    }
  })
  const invocation = fixture.start()
  const input = report()
  const attachment = path.join(
    fixture.repository,
    'apps/asyra-design/test-results/failure.txt'
  )

  fs.mkdirSync(path.dirname(attachment), { recursive: true })
  fs.writeFileSync(attachment, 'Original attachment bytes')
  input.suites[0].suites[0].specs[0].tests[0].results[0].attachments = [
    { name: 'failure', contentType: 'text/plain', path: attachment }
  ]
  invocation.finish(input)
  const current = openProject(directory).snapshot()
  const observation = current.documents
    .flatMap((d) => d.current.observations)
    .find((o) => o.status === 'failed')

  assert.ok(observation)
  assert.equal(
    fs.readFileSync(
      path.join(directory, observation.attachments[0].path),
      'utf8'
    ),
    'Original attachment bytes'
  )
  assert.equal(
    fs.existsSync(
      path.join(fixture.repository, 'tmp/flow-inspector/test-results')
    ),
    false
  )
  fs.unlinkSync(attachment)
  assert.equal(
    openProject(directory)
      .snapshot()
      .documents.flatMap((d) => d.current.observations)
      .some((o) => o.status === 'failed'),
    true
  )
})

test('fixture settlement awaits all owned services and reports denied cleanup', async () => {
  const { settleFixtureProcesses } = require('./playwright-results-fixture.cjs')
  const aborted = []
  let release
  const pending = new Promise((resolve) => {
    release = resolve
  })
  let settled = false
  const work = settleFixtureProcesses([
    {
      controller: { abort: () => aborted.push('vite') },
      promise: Promise.resolve({ reason: 'cancelled', error: 'kill EPERM' })
    },
    { controller: { abort: () => aborted.push('backend') }, promise: pending }
  ]).finally(() => {
    settled = true
  })
  const rejected = assert.rejects(work, /kill EPERM/)

  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(aborted, ['vite', 'backend'])
  assert.equal(settled, false)
  release({ reason: 'cancelled' })
  await rejected
})

test('fixture settlement preserves successful service cancellation', async () => {
  const { settleFixtureProcesses } = require('./playwright-results-fixture.cjs')
  let aborted = false

  await settleFixtureProcesses([
    {
      controller: {
        abort: () => {
          aborted = true
        }
      },
      promise: Promise.resolve({ reason: 'cancelled' })
    }
  ])
  assert.equal(aborted, true)
})

test('whole-App proof identities reject omissions, duplicates and substitutions even at equal counts', () => {
  const { sourceManifestPaths } = require('../playwright-results.cjs')
  const cases = sourceManifestPaths('functional').flatMap((file) =>
    loadContract(root, undefined, file).cases.map((item) => ({
      file: item.testFile,
      projectName: item.projectName ?? '',
      testName: item.testName
    }))
  )

  verifyDeclaredFunctionalCases({ cases }, 'functional')
  assert.throws(() =>
    verifyDeclaredFunctionalCases({ cases: cases.slice(1) }, 'functional')
  )
  assert.throws(() =>
    verifyDeclaredFunctionalCases({ cases: [...cases, cases[0]] }, 'functional')
  )
  const substituted = [...cases]

  substituted[0] = cases[1]
  assert.throws(() =>
    verifyDeclaredFunctionalCases({ cases: substituted }, 'functional')
  )
  assert.throws(() => verifyDeclaredFunctionalCases({ cases }, 'status'))
})
