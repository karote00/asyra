/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { directory } = require('./fixtures.cjs')
const { fromContracts, capture, publish } = require('../producers.cjs')
const { loadContract } = require('../../control-plane/contracts.cjs')
const { openProject } = require('../store.cjs')
const root = path.resolve(__dirname, '../../../..')
test('architecture conversion preserves exact owners, routes, artifacts and all mapped cases', () => {
  const contract = loadContract(root),
    docs = fromContracts([contract], 'project')
  assert.deepEqual(
    docs[0].definition.architecture,
    contract.architectureDefinition
  )
  assert.equal(
    docs[0].definition.nodes
      .flatMap((n) => n.criteria)
      .filter((c) => c.kind === 'automated').length,
    contract.cases.length
  )
})
test('offline localized publication writes current flow files and preserves unmapped warnings', (t) => {
  const contract = loadContract(root),
    docs = fromContracts([contract], 'project'),
    dir = directory(t)
  fs.writeFileSync(
    path.join(dir, docs[0].flowId + '.flow.json'),
    JSON.stringify(docs[0])
  )
  const captured = capture(dir),
    candidate = contract.cases[0]
  const item = {
    id: 'run:0',
    file: contract.testFile,
    projectName: '',
    testName: candidate.testName,
    status: 'failed',
    failures: ['Original assertion'],
    resolution: 'mapped',
    locations: [
      {
        targetId: contract.targetId,
        stepId: candidate.stepId,
        caseId: candidate.id,
        contractDigest: contract.digest
      }
    ]
  }
  const record = {
    id: 'run',
    startedAt: new Date().toISOString(),
    cases: [item],
    contracts: [contract],
    issues: []
  }
  publish(record, captured)
  const state = openProject(dir).snapshot()
  assert.equal(state.documents[0].current.observations[0].status, 'failed')
  assert.equal(
    state.documents[0].current.observations[0].summary,
    'Original assertion'
  )
  assert.equal(fs.readdirSync(dir).length, 1)
  assert.throws(
    () =>
      publish(
        { ...record, id: 'old', cases: [{ ...item, status: 'passed' }] },
        captured
      ),
    /revision/
  )
})
test('a known no-tests selection is replaced by its complete failed assertion without hiding failure', (t) => {
  const contract = loadContract(root),
    docs = fromContracts([contract], 'project'),
    dir = directory(t)
  fs.writeFileSync(
    path.join(dir, docs[0].flowId + '.flow.json'),
    JSON.stringify(docs[0])
  )
  const candidate = contract.cases[0],
    identity = {
      file: contract.testFile,
      testName: candidate.testName,
      projectName: ''
    }
  const record = {
    id: 'missing',
    startedAt: new Date().toISOString(),
    cases: [],
    contracts: [contract],
    issues: ['No tests found'],
    intent: { version: 1, cases: [identity] }
  }
  publish(record, capture(dir))
  openProject(dir).update(docs[0].flowId, {
    expectedRevision: 1,
    kind: 'source',
    value: { nodeId: candidate.stepId, revision: 'corrected-source' }
  })
  publish(
    {
      ...record,
      id: 'corrected',
      issues: [],
      cases: [
        {
          ...identity,
          id: 'corrected:0',
          status: 'failed',
          failures: ['Real failure'],
          resolution: 'mapped',
          locations: [
            {
              targetId: contract.targetId,
              stepId: candidate.stepId,
              caseId: candidate.id,
              contractDigest: contract.digest
            }
          ]
        }
      ]
    },
    capture(dir)
  )
  const current = openProject(dir).snapshot()
  assert.equal(current.documents[0].current.warnings.length, 0)
  assert.equal(current.documents[0].current.observations[0].status, 'failed')
})
test('one-time projection preserves latest mapped failure and leaves archives unchanged', (t) => {
  const { randomUUID } = require('node:crypto'),
    localization = require('../../control-plane/localization.cjs'),
    { migrate } = require('../producers.cjs')
  const oldRoot = directory(t),
    contract = loadContract(root),
    candidate = contract.cases[0],
    id = randomUUID()
  const context = {
    id,
    format: 1,
    startedAt: new Date().toISOString(),
    head: null,
    source: null,
    contracts: [contract],
    issues: [],
    command: null
  }
  const record = localization.localizeReport(root, context, {
    success: false,
    testResults: [
      {
        name: path.join(root, contract.testFile),
        assertionResults: [
          {
            fullName: candidate.testName,
            status: 'failed',
            failureMessages: ['Preserved failure']
          }
        ]
      }
    ]
  })
  const archive = localization.observationDirectory(oldRoot)
  const attachment = path.join(archive, id, 'attachments', '0'),
    attachmentBytes = Buffer.from('Retained current failure')
  fs.mkdirSync(path.dirname(attachment), { recursive: true })
  fs.writeFileSync(attachment, attachmentBytes)
  record.retainedArtifacts = [
    {
      name: 'failure',
      originalPath: 'failure.txt',
      retainedPath: path.relative(oldRoot, attachment),
      size: attachmentBytes.length,
      digest: require('node:crypto')
        .createHash('sha256')
        .update(attachmentBytes)
        .digest('hex')
    }
  ]
  localization.saveObservation(archive, record)
  const bytes = fs.readFileSync(path.join(archive, id + '.json'))
  const projected = migrate(
    oldRoot,
    path.join(oldRoot, 'current'),
    [contract],
    'project'
  )
  assert.equal(
    projected.documents[0].current.observations[0].summary,
    'Preserved failure'
  )
  assert.equal(projected.documents[0].current.observations[0].status, 'failed')
  assert.deepEqual(fs.readFileSync(path.join(archive, id + '.json')), bytes)
  fs.rmSync(archive, { recursive: true })
  assert.equal(
    fs.readFileSync(
      path.join(
        oldRoot,
        'current',
        projected.documents[0].current.observations[0].attachments[0].path
      ),
      'utf8'
    ),
    'Retained current failure'
  )
  assert.equal(
    openProject(path.join(oldRoot, 'current')).snapshot().documents[0].current
      .observations[0].status,
    'failed'
  )
})

test('a retained result cannot acquire a changed architecture authority during projection', (t) => {
  const contract = loadContract(root),
    docs = fromContracts([contract], 'project'),
    dir = directory(t)
  docs[0].definition.architecture.steps[0].purpose += ' Revised responsibility'
  fs.writeFileSync(
    path.join(dir, docs[0].flowId + '.flow.json'),
    JSON.stringify(docs[0])
  )
  const candidate = contract.cases[0]
  const record = {
    id: 'old',
    startedAt: new Date().toISOString(),
    contracts: [contract],
    issues: [],
    cases: [
      {
        id: 'old:0',
        file: contract.testFile,
        projectName: '',
        testName: candidate.testName,
        status: 'passed',
        failures: [],
        resolution: 'mapped',
        locations: [
          {
            targetId: contract.targetId,
            stepId: candidate.stepId,
            caseId: candidate.id,
            contractDigest: contract.digest
          }
        ]
      }
    ]
  }
  assert.throws(() => publish(record, capture(dir)), /architecture/)
  assert.equal(
    openProject(dir).snapshot().documents[0].current.observations.length,
    0
  )
})

test('explicit selection excludes skipped siblings but retains skipped selected and unknown failed evidence', () => {
  const { participatingCases } = require('../producers.cjs')
  const identity = { file: 'test.js', testName: 'selected', projectName: '' }
  const record = {
    intent: { cases: [identity] },
    cases: [
      { ...identity, status: 'skipped' },
      { ...identity, testName: 'sibling', status: 'pending' },
      { ...identity, testName: 'unknown', status: 'failed' }
    ]
  }
  assert.deepEqual(
    participatingCases(record).map((c) => c.testName),
    ['selected', 'unknown']
  )
  delete record.intent
  assert.equal(participatingCases(record).length, 3)
})

function publicationFixture(t) {
  const contract = loadContract(root),
    docs = fromContracts([contract], 'project'),
    dir = directory(t)
  fs.writeFileSync(path.join(dir, 'current.flow.json'), JSON.stringify(docs[0]))
  const cases = contract.cases.slice(0, 2).map((candidate, index) => ({
    id: 'run:' + index,
    file: candidate.testFile ?? contract.testFile,
    projectName: candidate.projectName ?? '',
    testName: candidate.testName,
    status: 'passed',
    failures: [],
    resolution: 'mapped',
    locations: [
      {
        targetId: contract.targetId,
        stepId: candidate.stepId,
        caseId: candidate.id,
        contractDigest: contract.digest
      }
    ]
  }))
  return {
    dir,
    docs,
    record: {
      id: 'run',
      startedAt: new Date().toISOString(),
      contracts: [contract],
      cases,
      issues: [],
      intent: {
        version: 1,
        cases: cases.map(({ file, testName, projectName }) => ({
          file,
          testName,
          projectName
        }))
      }
    }
  }
}

test('offline empty and partial selected reports block old passing evidence until complete recovery', (t) => {
  for (const count of [0, 1]) {
    const { dir, record } = publicationFixture(t)
    publish(record, capture(dir))
    publish(
      { ...record, id: 'partial', cases: record.cases.slice(0, count) },
      capture(dir)
    )
    let current = openProject(dir).snapshot()
    assert.ok(current.documents[0].current.warnings.length > 0)
    const omitted = record.cases[count].locations[0].stepId
    assert.notEqual(
      current.evaluation.flows[0].nodes.find((n) => n.id === omitted).status,
      'done'
    )
    publish({ ...record, id: 'recovered' }, capture(dir))
    current = openProject(dir).snapshot()
    assert.deepEqual(current.documents[0].current.warnings, [])
  }
})

test('empty unscoped output remains an explicit unresolved warning', (t) => {
  const { dir, record } = publicationFixture(t)
  publish({ ...record, cases: [], intent: undefined }, capture(dir))
  const current = openProject(dir).snapshot()
  assert.ok(
    current.documents[0].current.warnings.some(
      (w) => w.nodeId === 'integration'
    )
  )
})

test('rejected mapped publication does not leave tool-owned attachments', (t) => {
  const { dir, docs, record } = publicationFixture(t)
  const bytes = Buffer.from('Rejected evidence'),
    digest = require('node:crypto')
      .createHash('sha256')
      .update(bytes)
      .digest('hex')
  fs.writeFileSync(path.join(dir, 'original.txt'), bytes)
  docs[0].definition.architecture.steps[0].purpose += ' Changed'
  fs.writeFileSync(path.join(dir, 'current.flow.json'), JSON.stringify(docs[0]))
  record.retainedArtifacts = [
    {
      name: 'Evidence',
      retainedPath: 'original.txt',
      digest,
      size: bytes.length
    }
  ]
  assert.throws(() => publish(record, capture(dir), dir), /architecture/)
  assert.equal(fs.existsSync(path.join(dir, '.attachments', digest)), false)
  assert.equal(
    fs.readFileSync(path.join(dir, 'original.txt'), 'utf8'),
    'Rejected evidence'
  )
})

test('projection does not turn superseded run selections into missing-result warnings', (t) => {
  const localization = require('../../control-plane/localization.cjs'),
    { migrate } = require('../producers.cjs'),
    { randomUUID } = require('node:crypto'),
    oldRoot = directory(t),
    contract = loadContract(root),
    candidates = contract.cases.slice(0, 2),
    archive = localization.observationDirectory(oldRoot)
  for (const [index, selected] of [
    candidates,
    candidates.slice(0, 1)
  ].entries()) {
    const context = {
      id: randomUUID(),
      format: 1,
      startedAt: '2026-10-17T00:00:0' + index + 'Z',
      head: null,
      source: null,
      contracts: [contract],
      issues: [],
      command: null,
      intent: {
        version: 1,
        cases: selected.map((c) => ({
          file: c.testFile ?? contract.testFile,
          testName: c.testName,
          projectName: c.projectName ?? ''
        }))
      }
    }
    const record = localization.localizeReport(root, context, {
      success: true,
      testResults: [
        {
          name: path.join(root, contract.testFile),
          assertionResults: selected.map((c) => ({
            fullName: c.testName,
            status: 'passed',
            failureMessages: []
          }))
        }
      ]
    })
    record.finishedAt = context.startedAt
    localization.saveObservation(archive, record)
  }
  const projected = migrate(
    oldRoot,
    path.join(oldRoot, 'current'),
    [contract],
    'project'
  )
  assert.equal(projected.documents[0].current.observations.length, 2)
  assert.deepEqual(projected.documents[0].current.warnings, [])
})
