/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const childProcess = require('node:child_process')
const { loadContract } = require('../contracts.cjs')
const {
  localizeReport,
  saveObservation,
  observationDirectory,
  createObservationReader
} = require('../localization.cjs')
const {
  exportBundle,
  importBundle,
  readBundle,
  associate
} = require('../observation-files.cjs')
const root = path.resolve(__dirname, '../../../..')
const contract = loadContract(
  root,
  undefined,
  'apps/asyra-design/undo-redo-flow-contracts.json'
)
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(root, 'tmp/flow-inspector/files-test-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}
function record(status = 'failed', time = 0) {
  const context = {
    format: 1,
    id: randomUUID(),
    startedAt: new Date(1700000000000 + time).toISOString(),
    head: 'a'.repeat(40),
    source: { digest: 'a'.repeat(64), files: [] },
    contracts: [contract],
    issues: [],
    command: { cwd: '.', argv: ['test', String(time)] }
  }
  return localizeReport(
    root,
    context,
    {
      success: status === 'passed',
      testResults: [
        {
          name: path.join(root, contract.testFile),
          message: '',
          assertionResults: [
            {
              fullName: contract.cases[0].testName,
              status,
              failureMessages: status === 'failed' ? ['original failure'] : []
            }
          ]
        }
      ]
    },
    { finishedAt: new Date(1700000000001 + time).toISOString() }
  )
}
test('offline production, refresh, restart and idempotent import consume evidence without runner execution', (t) => {
  const dir = fixture(t),
    destination = fixture(t)
  const failure = record(),
    pass = record('passed', 1000)
  let executions = 0,
    reads = 0
  for (const name of [
    'spawn',
    'spawnSync',
    'exec',
    'execSync',
    'execFile',
    'execFileSync'
  ]) {
    t.mock.method(childProcess, name, () => {
      executions++
      throw new Error('Unexpected execution')
    })
  }
  Reflect.deleteProperty(require.cache, require.resolve('../localization.cjs'))
  Reflect.deleteProperty(
    require.cache,
    require.resolve('../observation-files.cjs')
  )
  const passive = require('../observation-files.cjs')
  saveObservation(observationDirectory(dir), failure)
  const reader = createObservationReader(observationDirectory(dir), {
    readFile(file) {
      reads++
      return fs.readFileSync(file, 'utf8')
    }
  })
  assert.equal(reader.list().currentCases[0].status, 'failed')
  reader.list()
  assert.equal(reads, 1)
  saveObservation(observationDirectory(dir), pass)
  assert.equal(reader.list().currentCases[0].status, 'passed')
  assert.equal(reads, 2)
  reader.list()
  assert.equal(reads, 2)
  passive.exportBundle(dir, 'bundle')
  fs.cpSync(path.join(dir, 'bundle'), path.join(destination, 'bundle'), {
    recursive: true
  })
  passive.importBundle(destination, 'bundle')
  passive.importBundle(destination, 'bundle')
  const restarted = createObservationReader(
    observationDirectory(destination)
  ).list()
  assert.deepEqual(restarted, reader.list())
  assert.equal(restarted.runs.length, 2)
  assert.equal(executions, 0)
})
test('completed discovery warnings gain durable associations without original rewrites', (t) => {
  const dir = fixture(t),
    next = record('failed', 1000),
    previous = record('failed', 0)
  previous.cases = []
  previous.issues = ['No Playwright cases recorded']
  previous.executionFailureDetails = []
  previous.report = {
    config: {},
    suites: [],
    errors: [{ message: 'Error: No tests found.' }],
    stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 }
  }
  previous.finishedAt = new Date(1700000000001).toISOString()
  saveObservation(observationDirectory(dir), previous)
  saveObservation(observationDirectory(dir), next)
  const original = fs.readFileSync(
    path.join(observationDirectory(dir), previous.id + '.json')
  )
  const request = {
    version: 1,
    manifestPath: contract.manifestPath,
    caseIds: [contract.cases[0].id],
    reason: 'Correct exact selector'
  }
  associate(dir, previous.id, next.id, request)
  associate(dir, previous.id, next.id, request)
  let reads = 0
  const reader = createObservationReader(observationDirectory(dir), {
    readFile(file) {
      reads++
      return fs.readFileSync(file, 'utf8')
    }
  })
  const state = reader.list()
  assert.equal(state.warningGroups.current.length, 0)
  assert.equal(state.warningGroups.history[0].supersededBy, next.id)
  assert.equal(state.currentCases[0].status, 'failed')
  reader.list()
  assert.equal(reads, 3)
  assert.deepEqual(
    fs.readFileSync(
      path.join(observationDirectory(dir), previous.id + '.json')
    ),
    original
  )
  exportBundle(dir, 'bundle')
  assert.deepEqual(readBundle(dir, 'bundle').state, state)
})
test('a recovered case summary retains the earlier discovery recovery link', (t) => {
  const dir = fixture(t),
    previous = record('failed', 0),
    failed = record('failed', 1000),
    passed = record('passed', 2000)
  previous.cases = []
  previous.issues = ['No Playwright cases recorded']
  previous.executionFailureDetails = []
  previous.report = {
    config: {},
    suites: [],
    errors: [{ message: 'Error: No tests found.' }],
    stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 }
  }
  previous.finishedAt = new Date(1700000000001).toISOString()
  for (const value of [previous, failed, passed]) {
    saveObservation(observationDirectory(dir), value)
  }
  associate(dir, previous.id, failed.id, {
    version: 1,
    manifestPath: contract.manifestPath,
    caseIds: [contract.cases[0].id],
    reason: 'Correct selection'
  })
  const context = createObservationReader(
    observationDirectory(dir)
  ).warningContext(passed.id)
  assert.equal(context.total, 1)
  assert.equal(context.items[0].supersededBy, failed.id)
  const later = record('failed', 3000)
  saveObservation(observationDirectory(dir), later)
  const state = createObservationReader(observationDirectory(dir)).list()
  assert.equal(state.currentCases[0].runId, later.id)
  assert.equal(state.warningGroups.current.length, 0)
  assert.equal(state.warningGroups.history[0].supersededBy, failed.id)
})
test('corrupt bundles and conflicting completed records are rejected before import', (t) => {
  const dir = fixture(t),
    destination = fixture(t),
    input = record()
  saveObservation(observationDirectory(dir), input)
  exportBundle(dir, 'bundle')
  fs.cpSync(path.join(dir, 'bundle'), path.join(destination, 'bundle'), {
    recursive: true
  })
  saveObservation(observationDirectory(destination), {
    ...input,
    issues: ['different evidence']
  })
  assert.throws(() => importBundle(destination, 'bundle'), /Conflicting/)
  fs.appendFileSync(
    path.join(
      dir,
      'bundle/tmp/flow-inspector/test-results',
      input.id + '.json'
    ),
    'corrupt'
  )
  assert.throws(() => readBundle(dir, 'bundle'), /integrity/)
})
test('CI projects every retained mapped case, isolates identity and never launches runners', (t) => {
  const dir = fixture(t)
  const identity = {
    repository: 'org/repo',
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
    integration: 'c'.repeat(40),
    run: '123',
    attempt: '2'
  }
  const input = record('passed')
  const groupContract = loadContract(
    root,
    undefined,
    'apps/asyra-design/playwright-functional-flow-contracts.json'
  )
  const group = groupContract.cases.find(
    (item) => item.id === 'functional.group-interaction.61aff3d7b873'
  )
  const localized = localizeReport(
    root,
    { ...input, contracts: [groupContract] },
    {
      testResults: [
        {
          name: path.join(root, group.testFile),
          message: '',
          assertionResults: [
            { fullName: group.testName, status: 'passed', failureMessages: [] }
          ]
        }
      ]
    },
    { projects: ['chromium'] }
  )
  localized.command.environment = Object.fromEntries(
    Object.entries(identity).map(([key, value]) => [
      'FLOW_RESULT_' + key.toUpperCase(),
      value
    ])
  )
  saveObservation(observationDirectory(dir), localized)
  exportBundle(dir, 'bundles/flow-observations-design-123-2', identity)
  let executions = 0
  for (const name of ['spawn', 'spawnSync', 'execFile', 'execFileSync']) {
    t.mock.method(childProcess, name, () => {
      executions++
      throw new Error('Unexpected execution')
    })
  }
  const { projectObservations } = require('../workflow-results.cjs')
  const envelopes = [
    {
      producer: 'design',
      identity,
      reportDigest: require('node:crypto')
        .createHash('sha256')
        .update(JSON.stringify(localized.report))
        .digest('hex')
    }
  ]
  const result = projectObservations(
    dir,
    'bundles',
    identity,
    ['functional'],
    envelopes
  )
  assert.deepEqual(result.blockers, [])
  assert.equal(
    result.producers.design.currentCases[0].locations[0].stepId,
    'group-elements'
  )
  assert.equal(result.producers.collaboration.status, 'not-selected')
  assert.equal(
    createObservationReader(observationDirectory(dir)).list().currentCases
      .length,
    0
  )
  assert.ok(
    projectObservations(
      dir,
      'bundles',
      { ...identity, head: 'd'.repeat(40) },
      ['functional'],
      envelopes
    ).blockers.length
  )
  assert.ok(
    projectObservations(dir, 'missing', identity, ['functional'], envelopes)
      .blockers.length
  )
  assert.equal(executions, 0)
})
test('missing attachment and unsafe manifest entries cannot establish imported evidence', (t) => {
  const dir = fixture(t),
    input = record()
  const bytes = Buffer.from('evidence'),
    retainedPath =
      'tmp/flow-inspector/test-results/' + input.id + '/attachments/0'
  fs.mkdirSync(path.dirname(path.join(dir, retainedPath)), { recursive: true })
  fs.writeFileSync(path.join(dir, retainedPath), bytes)
  input.retainedArtifacts = [
    {
      name: 'trace',
      originalPath: 'original.zip',
      retainedPath,
      size: bytes.length,
      digest: require('node:crypto')
        .createHash('sha256')
        .update(bytes)
        .digest('hex')
    }
  ]
  saveObservation(observationDirectory(dir), input)
  exportBundle(dir, 'bundle')
  fs.unlinkSync(path.join(dir, 'bundle', retainedPath))
  assert.throws(() => readBundle(dir, 'bundle'), /ENOENT/)
  const manifest = JSON.parse(
    fs.readFileSync(path.join(dir, 'bundle/bundle.json'))
  )
  manifest.files[0].path = 'tmp/flow-inspector/test-results/../../outside'
  fs.writeFileSync(
    path.join(dir, 'bundle/bundle.json'),
    JSON.stringify(manifest)
  )
  assert.throws(() => readBundle(dir, 'bundle'), /path/)
})
test('a retained failure outside the representative inventory blocks CI projection', (t) => {
  const dir = fixture(t)
  const identity = {
    repository: 'org/repo',
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
    integration: 'c'.repeat(40),
    run: '123',
    attempt: '2'
  }
  const input = record('failed')
  input.command.environment = Object.fromEntries(
    Object.entries(identity).map(([key, value]) => [
      'FLOW_RESULT_' + key.toUpperCase(),
      value
    ])
  )
  saveObservation(observationDirectory(dir), input)
  exportBundle(dir, 'bundles/flow-observations-design-123-2', identity)
  const result = require('../workflow-results.cjs').projectObservations(
    dir,
    'bundles',
    identity,
    ['functional'],
    [
      {
        producer: 'design',
        identity,
        reportDigest: require('node:crypto')
          .createHash('sha256')
          .update(JSON.stringify(input.report))
          .digest('hex')
      }
    ]
  )
  assert.equal(result.producers.design.status, 'failed')
  assert.ok(result.blockers.length)
})
test('equal argv cannot bypass explicit discovery recovery or intended coverage', (t) => {
  const dir = fixture(t),
    previous = record('failed', 0),
    next = record('passed', 1000)
  previous.cases = []
  previous.finishedAt = new Date(1700000000001).toISOString()
  previous.issues = ['No Playwright cases recorded']
  previous.report = {
    config: {},
    suites: [],
    errors: [{ message: 'Error: No tests found.' }],
    stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 }
  }
  next.command = previous.command
  saveObservation(observationDirectory(dir), previous)
  saveObservation(observationDirectory(dir), next)
  assert.equal(
    createObservationReader(observationDirectory(dir)).list().warningGroups
      .current.length,
    1
  )
})
test('refresh and restart expose lost attachments without rewriting evidence or rereading unchanged bytes', (t) => {
  const dir = fixture(t),
    input = record('passed'),
    bytes = Buffer.from('retained trace')
  const retainedPath =
    'tmp/flow-inspector/test-results/' + input.id + '/attachments/0'
  const file = path.join(dir, retainedPath)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, bytes)
  input.retainedArtifacts = [
    {
      name: 'trace',
      originalPath: 'trace.zip',
      retainedPath,
      size: bytes.length,
      digest: require('node:crypto')
        .createHash('sha256')
        .update(bytes)
        .digest('hex')
    }
  ]
  const failure = record('failed', -1000)
  saveObservation(observationDirectory(dir), failure)
  saveObservation(observationDirectory(dir), input)
  let reads = 0
  const reader = createObservationReader(observationDirectory(dir), {
    readArtifact(file) {
      reads++
      return fs.readFileSync(file)
    }
  })
  assert.equal(reader.list().currentCases[0].resolution, 'mapped')
  reader.list()
  assert.equal(reads, 1)
  fs.writeFileSync(file, 'corrupt trace!')
  assert.ok(
    reader.list().currentCases.some((item) => item.resolution === 'stale')
  )
  assert.ok(
    reader
      .list()
      .currentCases.some(
        (item) => item.runId === failure.id && item.status === 'failed'
      )
  )
  assert.ok(reader.list().warningGroups.current.length)
  assert.deepEqual(reader.get(input.id), input)
  fs.unlinkSync(file)
  assert.ok(
    createObservationReader(observationDirectory(dir))
      .list()
      .currentCases.some((item) => item.resolution === 'stale')
  )
  fs.writeFileSync(file, bytes)
  assert.equal(reader.list().currentCases[0].resolution, 'mapped')
})
