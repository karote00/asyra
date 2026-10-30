import test, { before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { URL, fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { restorePublicActivity } from '../public-activity.mjs'

const root = fileURLToPath(new URL('../../../../../', import.meta.url))

before(() => {
  fs.mkdirSync(path.join(root, 'tmp'), { recursive: true })
})

test('temporary evidence fixtures stay inside their owning checkout', () => {
  assert.equal(
    path.join(
      root,
      'apps/asyra-design/test-data/knowledge-evaluation/__tests__/native-boundaries.test.mjs'
    ),
    fileURLToPath(import.meta.url)
  )
})

const hash = (value) => createHash('sha256').update(value).digest('hex')
const pending = {
  status: 'available',
  threadId: 'thread',
  processId: 'process',
  startMs: 1000,
  endMs: 3000,
  argumentProgress: 'unavailable',
  boundaries: [
    {
      source: 'native-diagnostic',
      stage: 'native-output-item-started',
      elapsedMs: 100,
      threadId: 'thread',
      processId: 'process',
      turnId: 'turn',
      itemId: 'ctc_item',
      logId: 1,
      bodySha256: hash('source'),
      completion: 'unavailable'
    }
  ]
}

test('activity timeline preserves pending native boundaries without inventing completion or argument progress', () => {
  const rows = [
    {
      elapsedMs: 0,
      stage: 'provider_started',
      evidence: { nativeThreadId: 'thread' }
    },
    { elapsedMs: 2000, stage: 'tool_started', tool: 'draw' }
  ]
  const timeline = restorePublicActivity(rows, () => null, pending)
  assert.equal(timeline.nativeDiagnostics.status, 'available')
  assert.equal(timeline.events[1].stage, 'native-output-item-started')
  assert.equal(timeline.events[1].completion, 'unavailable')
  assert.equal(timeline.gaps.at(-1).durationMs, 1900)
  assert.equal(timeline.nativeDiagnostics.argumentProgress, 'unavailable')
  assert.throws(
    () =>
      restorePublicActivity(rows, () => null, {
        ...pending,
        threadId: 'foreign'
      }),
    /provenance/
  )
})

async function databaseCase(run) {
  const directory = fs.mkdtempSync(path.join(root, 'tmp/native-boundary-test-'))
  const filename = path.join(directory, 'diagnostics.sqlite')
  const db = new DatabaseSync(filename)
  try {
    db.exec(
      'CREATE TABLE logs(id INTEGER PRIMARY KEY, ts INTEGER, ts_nanos INTEGER, target TEXT, thread_id TEXT, process_uuid TEXT, feedback_log_body TEXT)'
    )
    const insert = (
      id,
      seconds,
      target,
      body,
      thread = 'thread',
      process = 'process'
    ) =>
      db
        .prepare('INSERT INTO logs VALUES (?, ?, 0, ?, ?, ?, ?)')
        .run(id, seconds, target, thread, process, body)
    await run({ db, insert, filename, directory })
  } finally {
    db.close()
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

test('read-only native extraction isolates process and window and saves only boundary facts', async () => {
  const { collectNativeBoundaries } = await import('../native-boundaries.mjs')
  await databaseCase(async ({ insert, filename }) => {
    const started =
      'PRIVATE prefix try_run_sampling_request{turn_id=turn}: Output item item_type="function_call" item_id="ctc_item" PRIVATE suffix'
    insert(1, 1, 'codex_core::stream_events_utils', started)
    insert(
      2,
      2,
      'codex_core::stream_events_utils',
      'turn.id=turn handle_output_item_done: ToolCall: fixture.draw thread_id=thread'
    )
    insert(
      3,
      3,
      'codex_core::stream_events_utils',
      'turn_id=turn handle_output_item_done: Output item item_type="function_call" item_id="ctc_item"'
    )
    insert(
      4,
      2,
      'codex_core::stream_events_utils',
      started,
      'foreign',
      'foreign-process'
    )
    insert(
      5,
      5,
      'codex_core::stream_events_utils',
      started,
      'thread',
      'later-process'
    )
    insert(
      6,
      2,
      'codex_core::stream_events_utils',
      'Unsupported private diagnostic text'
    )
    const before = hash(fs.readFileSync(filename))
    const result = collectNativeBoundaries({
      databasePath: filename,
      threadId: 'thread',
      startMs: 1000,
      endMs: 4000
    })
    assert.equal(hash(fs.readFileSync(filename)), before)
    assert.equal(result.status, 'available')
    assert.deepEqual(
      result.boundaries.map((b) => b.stage),
      [
        'native-output-item-started',
        'native-tool-dispatched',
        'native-output-item-completed'
      ]
    )
    assert.equal(result.boundaries[0].bodySha256, hash(started))
    assert.equal(result.boundaries[0].completion, 'unavailable')
    assert.equal(result.boundaries[1].itemId, undefined)
    assert.equal(result.boundaries[2].itemId, 'ctc_item')
    assert.equal(result.boundaries[2].durationMs, undefined)
    assert.equal(result.argumentProgress, 'unavailable')
    assert.equal(JSON.stringify(result).includes('PRIVATE'), false)
    assert.equal(JSON.stringify(result).includes('Unsupported private'), false)
    insert(
      7,
      2,
      'codex_core::stream_events_utils',
      started,
      'thread',
      'ambiguous-process'
    )
    assert.equal(
      collectNativeBoundaries({
        databasePath: filename,
        threadId: 'thread',
        startMs: 1000,
        endMs: 4000
      }).reason,
      'ambiguous-process'
    )
    const exact = collectNativeBoundaries({
      databasePath: filename,
      threadId: 'thread',
      processId: 'process',
      startMs: 1000,
      endMs: 4000
    })
    assert.equal(exact.boundaries.length, 3)
  })
})

test('missing database, unsupported schema and no boundary evidence remain unavailable', async () => {
  const { collectNativeBoundaries } = await import('../native-boundaries.mjs')
  await databaseCase(async ({ filename, directory, db }) => {
    const options = {
      databasePath: filename,
      threadId: 'thread',
      startMs: 1000,
      endMs: 4000
    }
    assert.equal(collectNativeBoundaries(options).status, 'unavailable')
    const missing = path.join(directory, 'missing.sqlite')
    assert.equal(
      collectNativeBoundaries({ ...options, databasePath: missing }).status,
      'unavailable'
    )
    assert.equal(fs.existsSync(missing), false)
    db.exec('DROP TABLE logs')
    assert.equal(
      collectNativeBoundaries(options).reason,
      'diagnostics-unavailable'
    )
    assert.throws(
      () => collectNativeBoundaries({ ...options, endMs: 0 }),
      /window/
    )
  })
})

test('evaluation capture follows exact recorded requests and the analyzer consumes retained provenance', async () => {
  const { captureNativeBoundaries } = await import('../native-boundaries.mjs')
  const { readPayload } = await import('../analyze.mjs')
  await databaseCase(async ({ insert, filename, directory }) => {
    insert(
      1,
      1,
      'codex_core::stream_events_utils',
      'try_run_sampling_request{turn_id=turn}: Output item item_type="function_call" item_id="ctc_item"'
    )
    const recordingDirectory = path.join(directory, 'provider')
    fs.mkdirSync(recordingDirectory)
    const rows = [
      {
        requestId: 'provider',
        sourceRequestId: 'app',
        provider: 'local-codex',
        startedAt: new Date(1000).toISOString()
      },
      {
        elapsedMs: 0,
        stage: 'provider_started',
        evidence: { nativeThreadId: 'thread' }
      },
      { elapsedMs: 2000, stage: 'tool_started', tool: 'draw' }
    ]
    fs.writeFileSync(
      path.join(recordingDirectory, 'provider.jsonl'),
      rows.map(JSON.stringify).join('\n')
    )
    fs.writeFileSync(
      path.join(recordingDirectory, 'foreign.jsonl'),
      JSON.stringify({
        ...rows[0],
        requestId: 'foreign',
        sourceRequestId: 'other'
      })
    )
    const run = { sourceRequestIds: ['app'], recordingDirectory }
    const reference = captureNativeBoundaries(run, directory, {
      databasePath: filename,
      endMs: 4000
    })
    const saved = readPayload(directory, reference)
    assert.deepEqual(
      saved.streams.map((s) => s.requestId),
      ['provider']
    )
    const timeline = restorePublicActivity(
      rows.slice(1),
      () => null,
      saved.streams[0].diagnostics[0]
    )
    assert.equal(
      timeline.events.filter((e) => e.source === 'native-diagnostic').length,
      1
    )
    assert.equal(timeline.nativeDiagnostics.argumentProgress, 'unavailable')
    fs.appendFileSync(path.join(directory, reference.path), ' ')
    assert.throws(
      () => readPayload(directory, reference),
      /digest|hash|SHA|byte/i
    )
  })
})

test('fractional window excludes other processes and unknown item formats do not claim starts', async () => {
  const { collectNativeBoundaries } = await import('../native-boundaries.mjs')
  await databaseCase(async ({ insert, db, filename }) => {
    insert(
      1,
      1,
      'codex_core::stream_events_utils',
      'try_run_sampling_request{turn_id=turn}: Output item item_type="function_call" item_id="outside"',
      'thread',
      'outside'
    )
    insert(
      2,
      2,
      'codex_core::stream_events_utils',
      'Unknown origin turn_id=turn Output item item_type="function_call" item_id="unsupported"'
    )
    insert(
      3,
      3,
      'codex_core::stream_events_utils',
      'handle_output_item_done turn_id=turn Output item item_type="function_call" item_id="completed"'
    )
    db.prepare('UPDATE logs SET ts_nanos=500000000 WHERE id=1').run()
    const result = collectNativeBoundaries({
      databasePath: filename,
      threadId: 'thread',
      startMs: 1501,
      endMs: 4000
    })
    assert.equal(result.status, 'available')
    assert.deepEqual(
      result.boundaries.map((value) => value.stage),
      ['native-output-item-completed']
    )
    assert.equal(result.processId, 'process')
  })
})
