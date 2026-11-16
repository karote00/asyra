import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { publishConversationGroup } from '../conversation-publication.mjs'

const require = createRequire(import.meta.url)
const {
  directory
} = require('../../../../tools/flow-inspector/flow-files/__tests__/fixtures.cjs')
const {
  initialize
} = require('../../../../tools/flow-inspector/flow-files/project.cjs')
const {
  capture,
  publish
} = require('../../../../tools/flow-inspector/flow-files/adapters.cjs')
const {
  openProject
} = require('../../../../tools/flow-inspector/flow-files/store.cjs')

test('conversation publication rejects passing cases with a failed suite summary', (t) => {
  const project = initialize(directory(t), 'vitest')
  const receipt = capture(project)
  const selected = receipt.cases[0].selector
  const report = {
    success: true,
    numFailedTestSuites: 1,
    testResults: [
      {
        name: selected.file,
        assertionResults: [{ fullName: selected.title, status: 'passed' }]
      }
    ]
  }

  publishConversationGroup({
    project,
    receipt,
    report,
    scope: selected,
    requiredFiles: [selected.file],
    requiredCases: [selected],
    issues: [],
    artifact: join(project.root, 'issues.json')
  })
  assert.notEqual(
    openProject(project.directory).snapshot().evaluation.flows[0].nodes[0]
      .status,
    'done'
  )
})

test('large conversation mismatch evidence retires a prior pass without losing any issue', (t) => {
  const project = initialize(directory(t), 'vitest')
  let receipt = capture(project)
  const records = [
    { selector: receipt.cases[0].selector, status: 'passed', details: [] }
  ]

  publish(project, receipt, records)
  const store = openProject(project.directory)

  assert.equal(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')
  receipt = capture(project)
  const issues = Array.from(
    { length: 1400 },
    (_, i) => 'Missing case ' + i + ': ' + 'nested '.repeat(600)
  )
  const artifact = join(project.root, 'complete-issues.json')
  const selected = receipt.cases[0].selector
  const report = {
    success: true,
    testResults: [
      {
        name: selected.file,
        assertionResults: [{ fullName: selected.title, status: 'passed' }]
      }
    ]
  }
  const input = {
    project,
    report,
    scope: selected,
    requiredFiles: [selected.file],
    requiredCases: [selected],
    artifact
  }

  publishConversationGroup({ ...input, receipt, issues })
  assert.deepEqual(JSON.parse(readFileSync(artifact, 'utf8')), issues)
  const snapshot = store.snapshot()

  assert.notEqual(snapshot.evaluation.flows[0].nodes[0].status, 'done')
  assert.match(
    JSON.stringify(snapshot.documents[0].current.warnings),
    /1400 findings/
  )
  assert.match(
    JSON.stringify(snapshot.documents[0].current.warnings),
    /complete-issues.json/
  )
  publishConversationGroup({
    ...input,
    receipt: capture(project),
    issues: []
  })
  assert.equal(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')
})
