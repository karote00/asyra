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
