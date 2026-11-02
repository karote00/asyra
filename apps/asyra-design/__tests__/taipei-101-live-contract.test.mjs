import { URL } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  readTaipei101Prompt,
  readTaipei101Deadline,
  assertTaipei101Submission,
  TAIPEI_101_DEADLINE_MS
} from '../test-data/ai-drawing/taipei-101-live-contract.mjs'

test('fixed benchmark removes only the fixture final newline and keeps the ten minute recording guard', () => {
  const fixture = readFileSync(
    new URL(
      '../test-data/ai-drawing/taipei-101-full-building-prompt.txt',
      import.meta.url
    ),
    'utf8'
  )
  const { prompt, sha256 } = readTaipei101Prompt()

  assert.equal(prompt + '\n', fixture)
  assert.match(sha256, /^[a-f0-9]{64}$/)
  assert.equal(TAIPEI_101_DEADLINE_MS, 600000)
  assert.doesNotThrow(() =>
    assertTaipei101Submission({ intent: prompt, metadata: {} }, prompt)
  )
  for (const request of [
    { intent: prompt + ' Do not ask questions.' },
    { intent: prompt, metadata: { imageAttachments: [{}] } },
    { intent: prompt, metadata: { conversationContext: { turns: [{}] } } }
  ]) {
    assert.throws(
      () => assertTaipei101Submission(request, prompt),
      /exact prompt/
    )
  }
})

test('tool receipts on the same endpoint do not become user prompt submissions', async () => {
  const { AI_BATCH_RECEIPT_HEADER } =
    await import('../src/ai/action-batch-endpoint.ts')
  const { prompt } = readTaipei101Prompt()

  assert.equal(
    assertTaipei101Submission({ batchId: 'b', actionResults: [] }, prompt, {
      [AI_BATCH_RECEIPT_HEADER]: 'owned-token'
    }),
    false
  )
  assert.equal(assertTaipei101Submission({ intent: prompt }, prompt, {}), true)
})

test('a connected socket cannot certify an empty or partially loaded drawing', async () => {
  const { recordedDocumentReady } =
    await import('../test-data/ai-drawing/taipei-101-live-contract.mjs')

  assert.equal(
    recordedDocumentReady(
      { connected: true, workspaceId: null, elementCount: 0 },
      20920
    ),
    false
  )
  assert.equal(
    recordedDocumentReady(
      { connected: true, workspaceId: 'w', elementCount: 100 },
      20920
    ),
    false
  )
  assert.equal(
    recordedDocumentReady(
      { connected: false, workspaceId: 'w', elementCount: 20920 },
      20920
    ),
    false
  )
  assert.equal(
    recordedDocumentReady(
      { connected: true, workspaceId: 'w', elementCount: 20920 },
      20920
    ),
    true
  )
})

test('explicit benchmark duration preserves the default and rejects unsafe or ambiguous overrides', () => {
  assert.equal(readTaipei101Deadline([]), 600000)
  assert.equal(readTaipei101Deadline(['--minutes=12']), 720000)
  assert.equal(readTaipei101Deadline(['--minutes=15']), 900000)
  for (const args of [
    ['--minutes=0'],
    ['--minutes=16'],
    ['--minutes=1.5'],
    ['--minutes=NaN'],
    ['--minutes=12', '--minutes=10'],
    ['--prompt=changed']
  ]) {
    assert.throws(() => readTaipei101Deadline(args), /duration/)
  }
})
