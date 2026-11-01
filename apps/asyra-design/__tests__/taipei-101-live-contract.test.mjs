import { URL } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  readTaipei101Prompt,
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
  ])
    assert.throws(
      () => assertTaipei101Submission(request, prompt),
      /exact prompt/
    )
})
