import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { URL } from 'node:url'
import {
  observeKnowledgeUse,
  observeRepresentation
} from '../representation.mjs'
const saved = JSON.parse(
  fs.readFileSync(
    new URL(
      '../evidence/architecture-2026-10-18/representation-replay.jsonl',
      import.meta.url
    )
  )
)

test('saved material observations distinguish rule geometry from explicit per-cell paints', () => {
  const before = JSON.stringify(saved)
  const result = observeKnowledgeUse(saved.calls)
  assert.equal(result.delivered.length, 2)
  const reflection = result.representations.find(
    (row) => row.inputBytes === 670447
  )
  assert.ok(reflection)
  assert.equal(reflection.surfaceGrids, 32)
  assert.equal(reflection.cellMaterialEntries, 3584)
  assert.equal(reflection.distinctCellMaterials, 1545)
  assert.equal(reflection.cellMaterialBytes, 648704)
  assert.equal(reflection.visualQuality, 'unverified')
  assert.equal(result.adoption, 'not-inferred-from-delivery')
  assert.equal(result.efficacy, 'unverified')
  assert.equal(JSON.stringify(saved), before)
})

test('missing or failed evidence cannot claim delivery, execution success or visual acceptance', () => {
  assert.equal(
    observeRepresentation({ callId: 'missing' }).inputAvailable,
    false
  )
  const knowledge = saved.calls.find((call) => call.tool === 'read_knowledge')
  assert.deepEqual(
    observeKnowledgeUse([{ ...knowledge, status: 'failed' }]).delivered,
    []
  )
  const failed = {
    tool: 'prepare_and_apply_design',
    callId: 'failed',
    status: 'failed',
    inputValue: {
      draft: {
        type: 'group',
        brief: { assumptions: ['Knowledge fully adopted'] },
        children: [
          { type: 'rect', fill: { template: 'paint' } },
          { type: 'rect', fill: { shared: 'paint' } }
        ]
      }
    }
  }
  const row = observeRepresentation(failed)
  assert.equal(row.executionStatus, 'failed')
  assert.equal(row.templateUses, 1)
  assert.equal(row.sharedUses, 1)
  assert.equal(row.visualQuality, 'unverified')
  assert.equal(
    observeKnowledgeUse([failed]).adoption,
    'not-inferred-from-delivery'
  )
})

test('rejected draft shapes and reference-only receipts remain observations, not new deliveries', () => {
  const call = {
    callId: 'rejected-shape',
    status: 'failed',
    inputValue: {
      draft: { type: 'surface-grid', motifs: {}, children: null }
    }
  }
  assert.equal(observeRepresentation(call).executionStatus, 'failed')
  assert.equal(observeRepresentation(call).cellMaterialEntries, 0)
  assert.deepEqual(
    observeKnowledgeUse([
      {
        callId: 'cached',
        tool: 'read_knowledge',
        status: 'usable',
        outputValue: {
          documents: [null, { target: 'advice', status: 'previously-returned' }]
        }
      }
    ]).delivered,
    []
  )
})
