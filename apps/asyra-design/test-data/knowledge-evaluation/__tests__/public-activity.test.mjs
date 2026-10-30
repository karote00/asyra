import { DatabaseSync } from 'node:sqlite'
import { captureNativeBoundaries } from '../native-boundaries.mjs'
import test, { before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  createAiExecutionProfiler,
  parseExecutionRecord
} from '@asyra/ai-agent-runtime'
import { createExecutionRecordSink } from '@asyra/ai-agent-runtime/node'
import { restorePublicActivity } from '../public-activity.mjs'
import { readPayload } from '../analyze.mjs'

const root = fileURLToPath(new URL('../../../../../', import.meta.url))

before(() => {
  fs.mkdirSync(path.join(root, 'tmp'), { recursive: true })
})

test('temporary evidence fixtures stay inside their owning checkout', () => {
  assert.equal(
    path.join(
      root,
      'apps/asyra-design/test-data/knowledge-evaluation/__tests__/public-activity.test.mjs'
    ),
    fileURLToPath(import.meta.url)
  )
})

test('real recording restores public Unicode activity and partial CLI evidence without certifying completion', async () => {
  const directory = fs.mkdtempSync(path.join(root, 'tmp/public-activity-test-'))
  try {
    const sink = createExecutionRecordSink(directory)
    let time = 0
    const profile = createAiExecutionProfiler(
      { intent: '', context: {}, actions: [], attempt: 1 },
      'test-model',
      {
        provider: 'local-codex',
        effort: 'medium',
        purpose: 'drawing',
        sourceRequestId: 'source',
        sink,
        now: () => time
      }
    )
    time = 50
    profile.trace('tool_started', {
      tool: 'draw',
      callId: 'draw',
      arguments: {}
    })
    time = 100
    profile.trace('tool_completed', {
      tool: 'draw',
      callId: 'draw',
      result: { success: true }
    })
    time = 200
    profile.trace('provider_notification', {
      phase: 'public-activity',
      method: 'item/agentMessage/delta',
      nativeThreadId: 'thread',
      nativeTurnId: 'turn',
      callId: 'message',
      nativeOutput: {
        stage: 'native-public-activity',
        method: 'item/agentMessage/delta',
        nativeThreadId: 'thread',
        nativeTurnId: 'turn',
        itemId: 'message',
        status: 'available',
        delta: '先繪製裙樓 🏙️'
      }
    })
    time = 300
    profile.recordTransport('received', 42, 'diagnostic')
    // Close storage without a provider terminal event: an interrupted stream.
    const receipt = await sink.flush()
    assert.equal(receipt.status, 'saved')
    const raw = fs.readFileSync(receipt.path, 'utf8')
    const parsed = parseExecutionRecord(raw)
    assert.equal(parsed.complete, false)
    const timeline = restorePublicActivity(parsed.records, (ref) =>
      readPayload(directory, ref)
    )
    assert.equal(timeline.activities[0].delta, '先繪製裙樓 🏙️')
    assert.equal(timeline.completionInferred, false)
    assert.ok(timeline.events.some((event) => event.stage === 'tool_completed'))
    assert.ok(
      timeline.events.some((event) => event.stage === 'transport_chunk')
    )
    assert.ok(
      timeline.gaps.every(
        (gap) => gap.cause === null && gap.meaning === 'no-recorded-event'
      )
    )
    const reference = timeline.activities[0].payload
    const value = readPayload(directory, reference)
    assert.throws(
      () =>
        restorePublicActivity(parsed.records, () => ({
          ...value,
          nativeTurnId: 'foreign'
        })),
      /provenance/
    )
    assert.throws(
      () =>
        restorePublicActivity(parsed.records, () => ({
          ...value,
          itemId: 'foreign'
        })),
      /provenance/
    )
    const databasePath = path.join(directory, 'native.sqlite')
    const database = new DatabaseSync(databasePath)
    database.exec(
      'CREATE TABLE logs(id INTEGER, ts INTEGER, ts_nanos INTEGER, target TEXT, thread_id TEXT, process_uuid TEXT, feedback_log_body TEXT)'
    )
    const startedMs = Date.parse(parsed.records[0].startedAt)
    const eventMs = startedMs + 150
    database
      .prepare('INSERT INTO logs VALUES (1, ?, ?, ?, ?, ?, ?)')
      .run(
        Math.floor(eventMs / 1000),
        (eventMs % 1000) * 1000000,
        'codex_core::stream_events_utils',
        'thread',
        'process',
        'try_run_sampling_request{turn_id=turn}: Output item item_type="function_call" item_id="ctc_pending"'
      )
    database.close()
    const nativeBoundaryEvidence = captureNativeBoundaries(
      { sourceRequestIds: ['source'], recordingDirectory: directory },
      directory,
      { databasePath, endMs: startedMs + 1000 }
    )
    fs.writeFileSync(
      path.join(directory, 'run.json'),
      JSON.stringify({
        id: 'partial',
        nativeBoundaryEvidence,
        sourceRequestIds: ['source'],
        recordingDirectory: directory,
        expectedModel: { model: 'test-model', effort: 'medium' },
        outcome: 'partial',
        firstContentMs: 100
      })
    )
    const cli = fileURLToPath(new URL('../analyze.mjs', import.meta.url))
    const observed = spawnSync(
      process.execPath,
      [cli, directory, '--activities'],
      { encoding: 'utf8' }
    )
    assert.equal(observed.status, 0, observed.stderr)
    const analysis = JSON.parse(
      fs.readFileSync(path.join(directory, 'activity-analysis.json'))
    )
    assert.equal(analysis.firstContentMs, 100)
    assert.equal(
      analysis.streams[0].activityTimeline.events.some(
        (event) => event.itemId === 'ctc_pending'
      ),
      true
    )
    assert.equal(analysis.streams[0].recordComplete, false)
    assert.deepEqual(analysis.streams[0].recordIssues, parsed.issues)
    const quality = spawnSync(process.execPath, [cli, directory], {
      encoding: 'utf8'
    })
    assert.notEqual(quality.status, 0)
    assert.equal(fs.existsSync(path.join(directory, 'analysis.json')), false)
    fs.appendFileSync(path.join(directory, reference.path), ' ')
    assert.throws(
      () =>
        restorePublicActivity(parsed.records, (ref) =>
          readPayload(directory, ref)
        ),
      /digest/
    )
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('missing and failed activity payloads stay unavailable without a fabricated message', () => {
  const rows = [undefined, { status: 'failed', path: null }].map(
    (payload, sequence) => ({
      elapsedMs: sequence,
      sequence,
      stage: 'provider_notification',
      evidence: { phase: 'public-activity' },
      diagnostic: { output: { payload } }
    })
  )
  const timeline = restorePublicActivity(rows, () => {
    throw new Error('Must not read absent content')
  })
  assert.deepEqual(
    timeline.activities.map((value) => value.status),
    ['unavailable', 'failed']
  )
  assert.ok(
    timeline.activities.every(
      (value) => !('text' in value) && !('delta' in value)
    )
  )
  assert.equal(timeline.contentCoverage, 'unavailable')
  assert.equal(
    restorePublicActivity([], () => undefined).contentCoverage,
    'unavailable'
  )
})
