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

test('fixed benchmark removes only the fixture final newline and keeps the fifteen minute recording guard', () => {
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
  assert.equal(TAIPEI_101_DEADLINE_MS, 900000)
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
  assert.equal(readTaipei101Deadline([]), 900000)
  assert.equal(readTaipei101Deadline(['--minutes=12']), 720000)
  assert.equal(readTaipei101Deadline(['--minutes=15']), 900000)
  assert.equal(readTaipei101Deadline(['--minutes=18']), 1080000)
  assert.equal(readTaipei101Deadline(['--minutes=30']), 1800000)
  for (const args of [
    ['--minutes=0'],
    ['--minutes=31'],
    ['--minutes=1.5'],
    ['--minutes=NaN'],
    ['--minutes=12', '--minutes=10'],
    ['--prompt=changed']
  ]) {
    assert.throws(() => readTaipei101Deadline(args), /duration/)
  }
})

test('fixed benchmark report uses host-only policy without changing the drawing prompt', async () => {
  const { createReportWindow } =
    await import('../test-data/ai-drawing/taipei-101-self-report.mjs')
  const before = readTaipei101Prompt()
  const policy = createReportWindow(1000, 900000)

  assert.equal(policy.keepReportSession, true)
  assert.equal(policy.workDeadlineAt, 901000)
  assert.equal(policy.reportTimeoutMs, null)
  assert.equal(policy.announceWorkDeadline, false)
  assert.match(policy.reportInstructions, /tens of seconds/)
  assert.match(policy.reportInstructions, /same provider thread/)
  assert.match(
    policy.reportInstructions,
    /which operations you delegated together through execute_design/
  )
  assert.match(
    policy.reportInstructions,
    /even when the single host entry was never used/
  )
  assert.match(policy.reportInstructions, /measured response bytes/)
  assert.match(
    policy.reportInstructions,
    /only to transfer an already-produced value/
  )
  assert.doesNotMatch(policy.reportInstructions, /fresh ephemeral session/)
  assert.deepEqual(readTaipei101Prompt(), before)
})

for (const status of ['completed', 'interrupted']) {
  test(`report evidence preserves ${status} work and requires the original native thread`, async () => {
    const { collectSameThreadReport } =
      await import('../test-data/ai-drawing/taipei-101-self-report.mjs')
    const payloads = {
      workInput: { threadId: 'thread', input: [] },
      workOutput: {
        nativeThreadId: 'thread',
        nativeTurnId: 'work',
        status,
        stoppedAtDeadline: status === 'interrupted'
      },
      reportInput: { threadId: 'thread', input: [] },
      reportOutput: {
        nativeThreadId: 'thread',
        nativeTurnId: 'report',
        attribution: 'model-self-report',
        text: '{}'
      },
      public: {
        stage: 'native-public-activity',
        kind: 'agentMessage',
        phase: 'commentary',
        nativeThreadId: 'thread',
        nativeTurnId: 'report',
        text: 'Full report\n| a | b |'
      },
      wrong: {
        stage: 'native-public-activity',
        kind: 'agentMessage',
        phase: 'commentary',
        nativeThreadId: 'thread',
        nativeTurnId: 'work',
        text: 'Drawing commentary'
      }
    }
    const records = ['work', 'report'].flatMap((kind) =>
      ['input', 'output'].map((phase) => ({
        stage: 'host_observation',
        evidence: {
          callId: `evaluation-${kind}`,
          phase,
          status: 'retained',
          path: kind + (phase === 'input' ? 'Input' : 'Output')
        }
      }))
    )

    for (const path of ['public', 'wrong']) {
      records.push({
        stage: 'provider_notification',
        evidence: {
          method: 'item/completed',
          phase: 'public-activity',
          kind: 'agentMessage'
        },
        diagnostic: { output: { payload: { path } } }
      })
    }

    records.push({
      stage: 'provider_notification',
      evidence: {
        method: 'item/completed',
        phase: 'reasoning',
        kind: 'reasoning'
      },
      diagnostic: { output: { payload: { path: 'private' } } }
    })

    const read = (path) => {
      assert.notEqual(path, 'private')

      return payloads[path]
    }

    const report = collectSameThreadReport(records, read)

    assert.equal(report.text, payloads.public.text)
    assert.equal(report.work.status, status)
    assert.equal(report.nativeThreadId, 'thread')
    assert.equal(report.nativeTurnId, 'report')
    payloads.reportOutput.nativeThreadId = 'new-thread'
    assert.throws(
      () => collectSameThreadReport(records, read),
      /same native thread/
    )
    payloads.reportOutput.nativeThreadId = 'thread'
    payloads.reportOutput.nativeTurnId = 'work'
    assert.throws(
      () => collectSameThreadReport(records, read),
      /distinct native turns/
    )
    assert.throws(
      () => collectSameThreadReport(records.slice(1), read),
      /Missing or ambiguous/
    )
  })
}

test('phase observation consumes appended bytes once and waits for complete records', async () => {
  const { createWorkPhaseObserver } =
    await import('../test-data/ai-drawing/taipei-101-self-report.mjs')
  const { mkdirSync, mkdtempSync, appendFileSync, rmSync } =
    await import('node:fs')

  mkdirSync('tmp', { recursive: true })
  const directory = mkdtempSync('tmp/report-observer-')

  try {
    const observer = createWorkPhaseObserver(directory)
    const line = JSON.stringify({
      stage: 'host_observation',
      evidence: { callId: 'evaluation-report', phase: 'input' }
    })

    appendFileSync(directory + '/trace.jsonl', line.slice(0, 20))
    assert.equal(observer.poll(), undefined)
    assert.equal(observer.bytesRead, 20)
    assert.equal(observer.poll(), undefined)
    assert.equal(observer.bytesRead, 20)
    appendFileSync(directory + '/trace.jsonl', line.slice(20) + '\n')
    assert.equal(observer.poll().evidence.callId, 'evaluation-report')
    assert.equal(observer.bytesRead, line.length + 1)
    observer.poll()
    assert.equal(observer.bytesRead, line.length + 1)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('evidence collection retains later artifacts after a failed stage', async () => {
  const { collectEvidenceStages } =
    await import('../test-data/ai-drawing/taipei-101-self-report.mjs')
  const retained = []
  const failures = await collectEvidenceStages([
    [
      'report',
      async () => {
        retained.push('report')
      }
    ],
    [
      'source',
      async () => {
        retained.push('source')
      }
    ],
    [
      'screenshot',
      async () => {
        throw new Error('Browser closed')
      }
    ],
    [
      'checkpoint',
      async () => {
        retained.push('checkpoint')
      }
    ],
    [
      'video',
      async () => {
        throw new Error('Recording unavailable')
      }
    ]
  ])

  assert.deepEqual(retained, ['report', 'source', 'checkpoint'])
  assert.deepEqual(failures, [
    { stage: 'screenshot', error: 'Browser closed' },
    { stage: 'video', error: 'Recording unavailable' }
  ])
})

test('fixed recorder observes framing throughout drawing and disposes it before reload', () => {
  const source = readFileSync(
    new URL('../test-data/ai-drawing/taipei-101-live.mjs', import.meta.url),
    'utf8'
  )

  assert.ok(source.includes('installDrawingFraming'))
  assert.ok(source.includes('fixedDrawingFraming.tick()'))
  assert.ok(source.includes('fixedDrawingFraming.dispose()'))
})

test('requires detail capture except for a proven empty workspace', async () => {
  const { shouldCaptureDrawingDetails } =
    await import('../test-data/ai-drawing/taipei-101-live-contract.mjs')

  assert.equal(shouldCaptureDrawingDetails({ workspace: 1 }), false)
  assert.equal(shouldCaptureDrawingDetails({ workspace: 1, vector: 4 }), true)
  assert.equal(shouldCaptureDrawingDetails({ workspace: 1, group: 1 }), true)
  assert.equal(shouldCaptureDrawingDetails(undefined), true)
  assert.equal(shouldCaptureDrawingDetails({}), true)
})

test('waits for retained report completion after browser loss without a report deadline', async () => {
  const { waitForRecordedReport } =
    await import('../test-data/ai-drawing/taipei-101-self-report.mjs')
  const { mkdtempSync, writeFileSync, appendFileSync, rmSync, mkdirSync } =
    await import('node:fs')

  mkdirSync('tmp', { recursive: true })
  const directory = mkdtempSync('tmp/report-disconnect-')
  const file = directory + '/request.jsonl'

  writeFileSync(
    file,
    JSON.stringify({
      requestId: 'report-owner',
      stage: 'host_observation',
      evidence: { callId: 'evaluation-report', phase: 'input' }
    }) + '\n'
  )
  // An App lifecycle request can settle while the original provider still reports.
  writeFileSync(
    directory + '/000-unrelated.jsonl',
    JSON.stringify({
      requestId: 'app-lifecycle',
      stage: 'settlement',
      evidence: { status: 'completed' }
    }) + '\n'
  )
  let polls = 0

  try {
    const result = await waitForRecordedReport(
      directory,
      () => true,
      'report-owner',
      async () => {
        polls++
        if (polls === 3) {
          appendFileSync(
            file,
            JSON.stringify({
              requestId: 'report-owner',
              stage: 'host_observation',
              evidence: {
                callId: 'evaluation-report',
                phase: 'output',
                path: 'report.json'
              }
            }) + '\n'
          )
        }
      }
    )

    assert.equal(polls, 3)
    assert.equal(result.evidence.path, 'report.json')
    appendFileSync(
      file,
      JSON.stringify({
        requestId: 'report-owner',
        stage: 'settlement',
        evidence: { outcome: 'completed' }
      }) + '\n'
    )
    assert.equal(
      (await waitForRecordedReport(directory, () => false, 'report-owner'))
        .evidence.path,
      'report.json'
    )

    writeFileSync(file, '')
    await assert.rejects(
      waitForRecordedReport(directory, () => false, 'report-owner'),
      /Provider service ended/
    )
    writeFileSync(
      file,
      JSON.stringify({
        requestId: 'report-owner',
        stage: 'settlement',
        evidence: { outcome: 'cancelled' }
      }) + '\n'
    )
    await assert.rejects(
      waitForRecordedReport(directory, () => true, 'report-owner'),
      /before report completion/
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
