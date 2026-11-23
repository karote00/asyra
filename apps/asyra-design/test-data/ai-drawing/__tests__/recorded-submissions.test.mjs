import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import test from 'node:test'
import {
  describeSubmission,
  describeResponseItem,
  readRecordedSubmissions
} from '../recorded-submissions.mjs'

test('describes outer provider submissions without counting them as applied work', () => {
  const op = { name: 'design_workflow.prepare_and_apply_design', arguments: {} }

  assert.deepEqual(
    describeSubmission('execute_design', { workflow: { operations: [op] } })
      .steps,
    [op.name]
  )
  assert.deepEqual(
    describeSubmission('execute_design', { operations: [op] }).steps,
    [op.name]
  )
  assert.deepEqual(
    describeSubmission('execute_design', {
      workflow: {
        stages: [
          {
            operations: [op],
            iteration: {
              check: { name: 'check' },
              repairs: [{ name: 'repair' }]
            },
            apply: [{ name: 'apply' }]
          }
        ]
      }
    }).steps,
    [op.name, 'check', 'repair', 'apply']
  )
  assert.deepEqual(
    describeSubmission('execute_design', {
      workflow: { retryDelivery: 'one', delivery: 'status' }
    }),
    { kind: 'delivery-correction', steps: [] }
  )
  assert.equal(
    describeSubmission('execute_design', undefined).kind,
    'unavailable'
  )
})

test('retains provider item identity and the submitted actions in an advanced workflow', () => {
  assert.deepEqual(
    describeResponseItem({
      type: 'function_call',
      call_id: 'correct',
      name: 'execute_design',
      arguments: JSON.stringify({
        workflow: {
          operations: [
            { name: 'draw', arguments: { repair: { draftId: 'a' } } }
          ]
        }
      })
    }),
    {
      type: 'function_call',
      callId: 'correct',
      name: 'execute_design',
      kind: 'submission',
      operations: ['draw'],
      draftCorrection: true
    }
  )
  assert.equal(
    describeResponseItem({
      type: 'function_call',
      name: 'execute_design',
      arguments: '{'
    }).kind,
    'unavailable'
  )
})

test('pairs the outer submitted workflow with its actual settlement and excludes nested calls', () => {
  const tmp = fileURLToPath(new URL('../../../../../tmp/', import.meta.url))

  mkdirSync(tmp, { recursive: true })
  const directory = mkdtempSync(resolve(tmp, 'recorded-submissions-'))
  const records = resolve(directory, 'provider-records')

  try {
    const file = resolve(records, 'call.payloads/input.json')

    mkdirSync(dirname(file), { recursive: true })
    const raw = JSON.stringify({
      workflow: { operations: [{ name: 'draw', arguments: {} }] }
    })

    writeFileSync(file, raw)
    const submitted = {
      requestId: 'request',
      callId: 'model',
      stage: 'tool_started',
      tool: 'execute_design',
      recordedAt: '2026-11-23T09:00:00Z',
      diagnostic: {
        attribution: { actor: 'provider', parentCallId: null },
        input: {
          payload: {
            path: 'call.payloads/input.json',
            sha256: createHash('sha256').update(raw).digest('hex'),
            bytes: raw.length
          }
        }
      }
    }
    const events = [
      submitted,
      {
        ...submitted,
        callId: 'child',
        diagnostic: {
          attribution: { actor: 'provider', parentCallId: 'model' }
        }
      },
      {
        requestId: 'request',
        stage: 'provider_notification',
        evidence: {
          activity: {
            callId: 'model',
            outcome: { status: 'failed', settlement: 'not-started' }
          }
        }
      }
    ]

    writeFileSync(
      resolve(records, 'calls.jsonl'),
      events.map((v) => JSON.stringify(v)).join('\n')
    )
    const rows = readRecordedSubmissions(directory)

    assert.equal(rows.length, 1)
    assert.deepEqual(rows[0].steps, ['draw'])
    assert.equal(rows[0].outcome.settlement, 'not-started')
    writeFileSync(file, '{}')
    assert.throws(() => readRecordedSubmissions(directory), /digest mismatch/)
    assert.equal(
      describeSubmission('execute_design', {
        workflow: { operations: 'invalid' }
      }).kind,
      'invalid-submission'
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
