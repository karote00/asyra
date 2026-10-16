/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const {
  localizeReport,
  createObservationReader,
  saveObservation
} = require('../localization.cjs')
const { loadContract } = require('../contracts.cjs')
const root = path.resolve(__dirname, '../../../..')
const contract = loadContract(
  root,
  undefined,
  'apps/asyra-design/undo-redo-flow-contracts.json'
)
fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
const context = () => ({
  format: 1,
  id: require('node:crypto').randomUUID(),
  startedAt: new Date().toISOString(),
  head: 'a'.repeat(40),
  source: { digest: 'b'.repeat(64), files: [] },
  contracts: [contract],
  issues: [],
  command: { cwd: '.', argv: ['yarn', 'test'] }
})
const report = (cases, file = contract.testFile) => ({
  success: false,
  numFailedTests: cases.filter((c) => c.status === 'failed').length,
  testResults: [
    {
      name: path.join(root, file),
      status: 'failed',
      message: '',
      assertionResults: cases
    }
  ]
})
const failure = (fullName = contract.cases[0].testName) => ({
  fullName,
  status: 'failed',
  failureMessages: ['expected Undo to have been called once']
})

test('original failures locate App ownership, preserve same-node cases and unknown observations', () => {
  const result = localizeReport(
    root,
    context(),
    report([
      failure(),
      failure(contract.cases[1].testName),
      failure('unregistered')
    ]),
    {}
  )
  assert.equal(result.cases.length, 3)
  assert.deepEqual(
    result.cases.map((c) => c.resolution),
    ['mapped', 'mapped', 'unmapped']
  )
  assert.equal(result.cases[0].locations[0].ownerPackage, '@asyra/asyra-design')
  assert.equal(
    result.cases[0].locations[0].implementationPaths[0],
    'apps/asyra-design/src/features/undo-redo/index.ts'
  )
  assert.match(result.cases[2].failures[0], /expected Undo/)
  assert.equal(result.authority, 'observation-only')
})
test('file, project and duplicate identity cannot be guessed; stale input never maps', () => {
  for (const [input, options, expected] of [
    [report([failure()], 'other.test.ts'), {}, 'unmapped'],
    [report([failure()]), { projects: ['other'] }, 'unmapped'],
    [report([failure(), failure()]), {}, 'ambiguous'],
    [report([failure()]), { stale: true }, 'stale']
  ])
    assert.equal(
      localizeReport(root, context(), input, options).cases[0].resolution,
      expected
    )
})
test('setup errors and missing reports retain execution failure without an invented node', () => {
  const input = report([])
  input.testResults[0].message = 'setup crashed'
  const result = localizeReport(root, context(), input, {
    errors: ['unhandled rejection']
  })
  assert.equal(result.cases.length, 0)
  assert.match(result.issues.join(' '), /setup crashed/)
  assert.match(result.issues.join(' '), /unhandled rejection/)
  assert.match(
    localizeReport(root, context(), null, {}).issues.join(' '),
    /report/i
  )
})
test('reader retains history and independent failures, and unchanged polling does not reread reports', (t) => {
  const dir = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/localization-')
  )
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const first = localizeReport(
    root,
    context(),
    report([failure(), failure('unknown')]),
    {}
  )
  saveObservation(dir, first)
  let reads = 0
  const reader = createObservationReader(dir, {
    readFile(file) {
      reads++
      return fs.readFileSync(file, 'utf8')
    }
  })
  assert.equal(reader.list().currentCases.length, 2)
  reader.list()
  reader.get(first.id)
  assert.equal(reads, 1)
  const compact = reader.caseContext(first.id, first.cases[0].id)
  assert.equal(compact.record.source.files, undefined)
  assert.equal(compact.record.originalReport, undefined)
  assert.equal(compact.item.runnerDetails, undefined)
  const identities = reader.list({ caseIdentityOnly: true }).currentCases
  assert.deepEqual(
    identities.map((c) => c.id),
    reader.list().currentCases.map((c) => c.id)
  )
  assert.equal(identities[0].failures, undefined)
  reader.caseContext(first.id, first.cases[0].id)
  assert.equal(reads, 1, 'summary reads reuse the admitted record')
  const next = context()
  next.startedAt = new Date(Date.now() + 1000).toISOString()
  saveObservation(
    dir,
    localizeReport(
      root,
      next,
      report([{ ...failure(), status: 'passed', failureMessages: [] }]),
      {}
    )
  )
  const latest = reader.list()
  assert.equal(latest.runs.length, 2)
  assert.equal(
    latest.currentCases.filter((c) => c.status === 'failed').length,
    1
  )
  assert.equal(reader.get(first.id).cases[0].status, 'failed')
  assert.equal(reads, 2)
})

test('malformed suite containers retain raw evidence without crashing localization', () => {
  const input = { success: false, testResults: {} }
  const result = localizeReport(root, context(), input)
  assert.deepEqual(result.report, input)
  assert.match(result.issues.join(' '), /malformed/i)
  const invalid = report([])
  invalid.testResults[0].assertionResults = [null]
  assert.match(
    localizeReport(root, context(), invalid).issues.join(' '),
    /Malformed/
  )
})

test('observation output rejects symlinked directories before writing', () => {
  const { observationDirectory } = require('../localization.cjs')
  const dir = fs.mkdtempSync(path.join(root, 'tmp/flow-inspector/path-check-'))
  const destination = path.join(dir, 'destination')
  fs.mkdirSync(destination)
  fs.symlinkSync(destination, path.join(dir, 'tmp'))
  assert.throws(() => observationDirectory(dir), /Symlink/)
})

test('malformed retained cases are reported and never projected onto the Board', () => {
  const dir = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/invalid-record-')
  )
  const record = localizeReport(root, context(), report([failure()]))
  record.cases[0].locations = null
  saveObservation(dir, record)
  const results = createObservationReader(dir).list()
  assert.equal(results.currentCases.length, 0)
  assert.match(results.issues.join(' '), /Invalid observation/)
})

test('skipped pending and unknown observations cannot retire an executed failure', () => {
  for (const status of ['skipped', 'pending', 'todo', 'unknown']) {
    const dir = fs.mkdtempSync(
      path.join(root, 'tmp/flow-inspector/not-executed-')
    )
    const first = context()
    first.startedAt = '2026-10-14T00:00:00.000Z'
    const failed = localizeReport(root, first, report([failure()]))
    saveObservation(dir, failed)
    const next = context()
    next.startedAt = '2026-10-14T00:00:01.000Z'
    const skipped = localizeReport(
      root,
      next,
      report([{ ...failure(), status, failureMessages: [] }])
    )
    saveObservation(dir, skipped)
    const reader = createObservationReader(dir)
    assert.equal(reader.list().currentCases[0].status, 'failed', status)
    assert.equal(reader.get(skipped.id).cases[0].status, status)
  }
})

test('a partially executed ambiguous group cannot clear its previous failures', () => {
  const dir = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/partial-identity-')
  )
  const first = context()
  first.startedAt = '2026-10-14T00:00:00.000Z'
  saveObservation(
    dir,
    localizeReport(root, first, report([failure(), failure()]))
  )
  const next = context()
  next.startedAt = '2026-10-14T00:00:01.000Z'
  saveObservation(
    dir,
    localizeReport(
      root,
      next,
      report([
        { ...failure(), status: 'passed', failureMessages: [] },
        { ...failure(), status: 'skipped', failureMessages: [] }
      ])
    )
  )
  assert.equal(
    createObservationReader(dir)
      .list()
      .currentCases.filter((item) => item.status === 'failed').length,
    2
  )
})

test('simultaneous runs do not use random UUID ordering to hide a failure', () => {
  const dir = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/concurrent-observations-')
  )
  const first = context()
  first.id = '10000000-0000-4000-8000-000000000000'
  first.startedAt = '2026-10-14T00:00:00.000Z'
  const second = context()
  second.id = '20000000-0000-4000-8000-000000000000'
  second.startedAt = first.startedAt
  saveObservation(dir, localizeReport(root, first, report([failure()])))
  saveObservation(
    dir,
    localizeReport(
      root,
      second,
      report([{ ...failure(), status: 'passed', failureMessages: [] }])
    )
  )
  assert.equal(
    createObservationReader(dir)
      .list()
      .currentCases.filter((item) => item.status === 'failed').length,
    1
  )
})

test('partial duplicate groups retain new failures until complete recovery', () => {
  const dir = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/mixed-identity-')
  )
  const first = context()
  first.startedAt = '2026-10-14T00:00:00.000Z'
  const oldFailure = localizeReport(root, first, report([failure()]))
  saveObservation(dir, oldFailure)
  const next = context()
  next.startedAt = '2026-10-14T00:00:01.000Z'
  const newFailure = localizeReport(
    root,
    next,
    report([
      { ...failure(), failureMessages: ['new failure from the executed case'] },
      { ...failure(), status: 'skipped', failureMessages: [] }
    ])
  )
  saveObservation(dir, newFailure)
  const reader = createObservationReader(dir)
  const failures = () =>
    reader.list().currentCases.filter((item) => item.status === 'failed')
  assert.deepEqual(
    failures().map((item) => item.id),
    [oldFailure.cases[0].id, newFailure.cases[0].id]
  )
  assert.deepEqual(
    failures().flatMap((item) => item.failures),
    [
      'expected Undo to have been called once',
      'new failure from the executed case'
    ]
  )
  assert.equal(failures().length, 2)
  const recovered = context()
  recovered.startedAt = '2026-10-14T00:00:02.000Z'
  saveObservation(
    dir,
    localizeReport(
      root,
      recovered,
      report([
        { ...failure(), status: 'passed', failureMessages: [] },
        { ...failure(), status: 'passed', failureMessages: [] }
      ])
    )
  )
  assert.deepEqual(failures(), [])
  assert.deepEqual(reader.get(first.id), oldFailure)
  assert.deepEqual(reader.get(next.id), newFailure)
})

test('assertion details preserve exact values without changing raw evidence or historical absence', () => {
  const input = report([failure()])
  const details = [
    {
      message: 'mismatch',
      actual: '',
      expected: 'null',
      diff: '- null\n+ empty',
      stack: 'original stack'
    }
  ]
  const result = localizeReport(root, context(), input, {
    failureDetails: [[details]]
  })
  assert.deepEqual(result.cases[0].failureDetails, details)
  assert.deepEqual(result.report, input)
  assert.deepEqual(
    result.cases[0].failures,
    input.testResults[0].assertionResults[0].failureMessages
  )
  details[0].actual = 'changed later'
  assert.equal(result.cases[0].failureDetails[0].actual, '')
  const historical = localizeReport(root, context(), input)
  assert.equal(Object.hasOwn(historical.cases[0], 'failureDetails'), false)
  const dir = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/detail-admission-')
  )
  saveObservation(dir, historical)
  assert.deepEqual(createObservationReader(dir).get(historical.id), historical)
})

test('malformed retained assertion details cannot reach read consumers', () => {
  for (const details of [
    null,
    {},
    [null],
    [{ actual: 42 }],
    [{ expected: {} }],
    [{ arbitrary: 'not a runner field' }]
  ]) {
    const dir = fs.mkdtempSync(
      path.join(root, 'tmp/flow-inspector/invalid-details-')
    )
    const record = localizeReport(root, context(), report([failure()]))
    record.cases[0].failureDetails = details
    saveObservation(dir, record)
    const reader = createObservationReader(dir)
    assert.deepEqual(reader.list().currentCases, [])
    assert.match(reader.list().issues.join(' '), /Invalid observation/)
  }
})

test('run-level assertion details retain context and reject malformed evidence', () => {
  const details = [
    {
      message: 'setup mismatch',
      expected: 'null',
      actual: 'undefined',
      diff: 'original difference',
      file: 'setup.ts',
      projectName: 'browser',
      suiteName: 'setup'
    }
  ]
  const result = localizeReport(root, context(), report([]), {
    executionFailureDetails: details
  })
  assert.deepEqual(result.executionFailureDetails, details)
  const dir = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/execution-details-')
  )
  saveObservation(dir, result)
  const reader = createObservationReader(dir)
  assert.deepEqual(reader.list().runs[0].executionFailureDetails, details)
  assert.deepEqual(reader.get(result.id).executionFailureDetails, details)
  for (const invalid of [null, [{ expected: false }], [{ file: {} }]]) {
    const record = localizeReport(root, context(), report([]))
    record.executionFailureDetails = invalid
    saveObservation(dir, record)
    assert.throws(() => reader.get(record.id), /Invalid observation/)
  }
})

test('a source-stale passing observation cannot retire a recorded failure', (t) => {
  const dir = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/localization-')
  )
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const firstContext = context()
  firstContext.startedAt = '2026-01-01T00:00:00.000Z'
  const first = localizeReport(root, firstContext, report([failure()]))
  saveObservation(dir, first)
  const next = context()
  next.startedAt = '2026-01-01T00:00:01.000Z'
  saveObservation(
    dir,
    localizeReport(
      root,
      next,
      report([{ ...failure(), status: 'passed', failureMessages: [] }]),
      { stale: true }
    )
  )
  const reader = createObservationReader(dir)
  assert.equal(
    reader.list().currentCases.filter((item) => item.status === 'failed')
      .length,
    1
  )
  assert.equal(reader.get(first.id).cases[0].status, 'failed')
})

test('exact per-case files select the recorded location rather than the manifest default', () => {
  const ctx = context()
  const selected = structuredClone(contract)
  selected.cases[0].testFile = 'apps/asyra-design/e2e/selection.spec.ts'
  ctx.contracts = [selected]
  const relocated = localizeReport(
    root,
    ctx,
    report([failure()], selected.cases[0].testFile)
  )
  assert.equal(relocated.cases[0].resolution, 'mapped')
  const wrongFile = localizeReport(root, ctx, report([failure()]))
  assert.equal(wrongFile.cases[0].resolution, 'unmapped')
})

test('source fingerprints include each exact case file once and preserve unmoved suite inputs', () => {
  const selected = structuredClone(contract)
  const extra = 'apps/asyra-design/e2e/selection.spec.ts'
  selected.cases.forEach((item) => {
    item.testFile = extra
  })
  const result = require('../localization.cjs').sourceFingerprint(root, [
    selected
  ])
  assert.equal(result.files.filter((file) => file.path === extra).length, 1)
  assert.equal(
    result.files.filter((file) => file.path === selected.testFile).length,
    1
  )
})

test('a capture reads repeated per-case source inputs only once', () => {
  const selected = structuredClone(contract)
  const extra = 'apps/asyra-design/e2e/selection.spec.ts'
  selected.cases.forEach((item) => {
    item.testFile = extra
  })
  const lstat = fs.lstatSync
  let inspections = 0
  fs.lstatSync = (...args) => {
    if (args[0] === path.join(root, extra)) inspections++
    return lstat(...args)
  }
  try {
    const { sourceFingerprint } = require('../localization.cjs')
    sourceFingerprint(root, [{ ...selected, cases: [selected.cases[0]] }])
    const singleInputWork = inspections
    assert.ok(singleInputWork > 0)
    inspections = 0
    sourceFingerprint(root, [selected, selected])
    assert.equal(inspections, singleInputWork)
  } finally {
    fs.lstatSync = lstat
  }
})

test('warning scopes retire only after a later clean complete matching invocation', (t) => {
  const dir = fs.mkdtempSync(path.join(root, 'tmp/flow-inspector/warnings-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const make = (second, options = {}, cases = [failure()]) => {
    const input = context()
    input.startedAt = new Date(1700000000000 + second * 1000).toISOString()
    const output = report(cases)
    output.success = true
    output.testResults[0].status = cases.some((c) => c.status === 'failed')
      ? 'failed'
      : 'passed'
    const value = localizeReport(root, input, output, options)
    value.finishedAt = new Date(
      1700000000000 + second * 1000 + 100
    ).toISOString()
    return value
  }
  const old = make(0, { errors: ['old runner warning'] })
  saveObservation(dir, old)
  const reader = createObservationReader(dir)
  assert.equal(reader.list().warningGroups.current[0].runId, old.id)
  const skipped = make(1, {}, [{ ...failure(), status: 'skipped' }])
  saveObservation(dir, skipped)
  const unrelated = make(2)
  unrelated.command.argv.push('--other-scope')
  saveObservation(dir, unrelated)
  const stale = make(3, { stale: true })
  saveObservation(dir, stale)
  assert.ok(reader.list().warningGroups.current.some((x) => x.runId === old.id))
  const clean = make(4, {}, [
    { ...failure(), status: 'passed', failureMessages: [] }
  ])
  saveObservation(dir, clean)
  const state = reader.list()
  assert.ok(
    state.warningGroups.history.some(
      (x) => x.runId === old.id && x.supersededBy === clean.id
    )
  )
  assert.ok(!state.warningGroups.current.some((x) => x.runId === old.id))
  assert.equal(reader.get(old.id).issues[0], 'old runner warning')
  const laterSibling = make(5, {}, [
    {
      ...failure(contract.cases[1].testName),
      status: 'passed',
      failureMessages: []
    }
  ])
  saveObservation(dir, laterSibling)
  assert.ok(
    reader.list().warningGroups.history.some((x) => x.runId === old.id),
    'a later sibling cannot undo proven recovery'
  )

  assert.match(
    state.currentCases[0].contextUrl,
    /\/api\/node-context\/.*\/summary$/
  )
})

test('unknown and concurrent warning scope remains current, including unreadable evidence', (t) => {
  const dir = fs.mkdtempSync(path.join(root, 'tmp/flow-inspector/warnings-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const old = localizeReport(root, context(), report([]), {
    errors: ['setup failed']
  })
  const output = report([{ ...failure(), status: 'passed' }])
  output.success = true
  output.testResults[0].status = 'passed'
  const clean = localizeReport(
    root,
    { ...context(), startedAt: old.startedAt },
    output,
    {}
  )
  saveObservation(dir, old)
  saveObservation(dir, clean)
  const unknown = {
    ...old,
    id: require('node:crypto').randomUUID(),
    command: null
  }
  saveObservation(dir, unknown)
  const reader = createObservationReader(dir)
  assert.equal(reader.list().warningGroups.current.length, 2)
  const corrupt = require('node:crypto').randomUUID() + '.json'
  fs.writeFileSync(path.join(dir, corrupt), 'broken')
  assert.equal(reader.list().issues.length, 1)
  assert.equal(reader.list().warningGroups.history.length, 0)
})
