/** Supplemental offline diagnostics. Never a product status or model-progress API. */
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import process from 'node:process'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const digest = (value) => createHash('sha256').update(value).digest('hex')
const identity = (body, name) =>
  body.match(
    new RegExp(`\\b${name}="?([a-zA-Z0-9_-]{1,180})(?:["\\s}:]|$)`)
  )?.[1]

export function collectNativeBoundaries({
  databasePath,
  threadId,
  processId,
  startMs,
  endMs
}) {
  if (
    !threadId ||
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs < startMs
  )
    throw new Error('Invalid native diagnostic identity or window')
  const base = {
    threadId,
    startMs,
    endMs,
    source: 'native-diagnostic-database',
    format: 'selected-boundaries-v1',
    argumentProgress: 'unavailable',
    waitCause: null
  }
  const unavailable = (reason) => ({
    ...base,
    status: 'unavailable',
    reason,
    boundaries: []
  })
  let database
  try {
    // Optional evidence must not make older runtimes unable to load the runner.
    const { DatabaseSync } = require('node:sqlite')
    database = new DatabaseSync(databasePath, { readOnly: true })
    database.exec(
      'PRAGMA query_only=ON; PRAGMA temp_store=MEMORY; PRAGMA busy_timeout=1000'
    )
    const processes = database
      .prepare(
        'SELECT DISTINCT process_uuid FROM logs WHERE thread_id = ? AND ts >= ? AND ts <= ? AND ts * 1000 + ts_nanos / 1000000.0 >= ? AND ts * 1000 + ts_nanos / 1000000.0 <= ?'
      )
      .all(
        threadId,
        Math.floor(startMs / 1000),
        Math.floor(endMs / 1000),
        startMs,
        endMs
      )
      .map((row) => row.process_uuid)
      .filter(Boolean)
    if (!processId) {
      if (processes.length !== 1)
        return unavailable(
          processes.length ? 'ambiguous-process' : 'missing-process'
        )
      processId = processes[0]
    }
    if (!processes.includes(processId)) return unavailable('missing-process')
    const boundaries = []
    const rows =
      database.prepare(`SELECT id, ts, ts_nanos, target, feedback_log_body FROM logs
      WHERE thread_id = ? AND process_uuid = ? AND ts >= ? AND ts <= ?
      AND target IN ('codex_core::stream_events_utils', 'codex_code_mode::timing') ORDER BY ts, ts_nanos, id`)
    for (const row of rows.iterate(
      threadId,
      processId,
      Math.floor(startMs / 1000),
      Math.floor(endMs / 1000)
    )) {
      const atMs = row.ts * 1000 + row.ts_nanos / 1000000
      if (!Number.isFinite(atMs) || atMs < startMs || atMs > endMs) continue
      const body = row.feedback_log_body
      if (typeof body !== 'string') continue
      const turnId = identity(body, 'turn(?:_id|\\.id)')
      if (!turnId) continue
      let event
      if (row.target === 'codex_core::stream_events_utils') {
        const itemId = body.match(
          /Output item item_type="custom_tool_call" item_id="([a-zA-Z0-9_-]{1,180})"/
        )?.[1]
        if (
          itemId &&
          body.includes('try_run_sampling_request') &&
          !body.includes('handle_output_item_done')
        )
          event = {
            stage: 'native-output-item-started',
            itemId,
            completion: 'unavailable'
          }
        else if (itemId && body.includes('handle_output_item_done'))
          event = { stage: 'native-output-item-completed', itemId }
        else {
          const tool = body.match(
            /handle_output_item_done: ToolCall: ([a-zA-Z0-9_.-]{1,160})\b/
          )?.[1]
          if (tool) event = { stage: 'native-tool-dispatched', tool }
        }
      } else if (body.includes('code-mode host operation completed')) {
        const callId = identity(body, 'call_id')
        const tool = identity(body, 'tool_name')
        const duration = body.match(/\bcode_mode_host_duration_ns=(\d+)\b/)?.[1]
        if (
          callId &&
          tool &&
          duration &&
          Number.isSafeInteger(Number(duration))
        )
          event = {
            stage: 'native-host-completed',
            callId,
            tool,
            durationMs: Number(duration) / 1000000
          }
      }
      if (event)
        boundaries.push({
          ...event,
          source: 'native-diagnostic',
          threadId,
          processId,
          turnId,
          logId: row.id,
          bodySha256: digest(body),
          elapsedMs: atMs - startMs
        })
    }
    return {
      ...base,
      processId,
      status: boundaries.length ? 'available' : 'unavailable',
      ...(boundaries.length ? {} : { reason: 'no-supported-boundaries' }),
      boundaries
    }
  } catch {
    return unavailable('diagnostics-unavailable')
  } finally {
    database?.close()
  }
}

/** Capture once after work; select only provider records reachable from this run. */
export function captureNativeBoundaries(run, directory, options = {}) {
  const databasePath =
    options.databasePath ??
    path.join(
      process.env.CODEX_HOME || path.join(os.homedir(), '.codex'),
      'logs_2.sqlite'
    )
  const endMs = options.endMs ?? Date.now()
  const records = fs
    .readdirSync(run.recordingDirectory)
    .filter((name) => name.endsWith('.jsonl'))
    .map((name) => {
      let malformedLines = 0
      const rows = fs
        .readFileSync(path.join(run.recordingDirectory, name), 'utf8')
        .split('\n')
        .filter(Boolean)
        .flatMap((line) => {
          try {
            return [JSON.parse(line)]
          } catch {
            malformedLines++
            return []
          }
        })
      return { first: rows[0], rows, malformedLines }
    })
    .filter((record) => record.first?.provider === 'local-codex')
  const reachable = new Set(run.sourceRequestIds)
  let changed = true
  while (changed) {
    changed = false
    for (const { first } of records)
      if (
        reachable.has(first.sourceRequestId) &&
        !reachable.has(first.requestId)
      ) {
        reachable.add(first.requestId)
        changed = true
      }
  }
  const streams = records
    .filter(({ first }) => reachable.has(first.sourceRequestId))
    .map(({ first, rows, malformedLines }) => {
      const threads = [
        ...new Set(
          rows
            .map((row) => row.evidence?.nativeThreadId)
            .filter((value) => typeof value === 'string' && value)
        )
      ]
      const startMs = Date.parse(first.startedAt)
      const diagnostics = threads.map((threadId) =>
        collectNativeBoundaries({ databasePath, threadId, startMs, endMs })
      )
      return {
        requestId: first.requestId,
        sourceRequestId: first.sourceRequestId,
        startedAt: first.startedAt,
        malformedLines,
        diagnostics,
        status: diagnostics.some((value) => value.status === 'available')
          ? 'available'
          : 'unavailable'
      }
    })
  const bytes = Buffer.from(
    JSON.stringify(
      { version: 1, collectedAt: new Date(endMs).toISOString(), streams },
      null,
      2
    )
  )
  const filename = 'native-boundaries.json'
  fs.writeFileSync(path.join(directory, filename), bytes, { flag: 'wx' })
  return {
    path: filename,
    sha256: digest(bytes),
    bytes: bytes.length,
    streams: streams.length,
    availableStreams: streams.filter((stream) => stream.status === 'available')
      .length
  }
}
