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

  publishConversationGroup({ project, receipt, records, issues, artifact })
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
    project,
    receipt: capture(project),
    records,
    issues: [],
    artifact
  })
  assert.equal(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')
})
