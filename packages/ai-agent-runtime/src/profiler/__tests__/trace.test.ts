import { expect, it } from 'vitest'
import * as runtime from '../../index.js'

it('exports portable causal timelines without inventing hidden provider activity', () => {
  expect(runtime).toHaveProperty('exportExecutionTrace')
  const records: runtime.ExecutionRecord[] = []
  let now = 0
  const profile = runtime.createAiExecutionProfiler(
    { intent: 'private', context: {}, actions: [], attempt: 1 },
    'inventory-model',
    {
      now: () => now,
      lifecycle: true,
      sink: {
        write: (event) => records.push(event),
        flush: async () => ({ status: 'saved', path: null })
      }
    }
  )
  const parent = profile.span({
    callId: 'provider',
    owner: 'provider',
    purpose: 'Run inventory request'
  })
  now = 10
  profile.recordTransport('received', 45)
  now = 20
  profile.trace('tool_started', {
    callId: 'read',
    tool: 'read_inventory',
    actor: 'provider',
    parentCallId: 'provider',
    purpose: 'Check stock',
    purposeSource: 'caller'
  })
  now = 25
  profile.trace('tool_completed', {
    callId: 'read',
    tool: 'read_inventory',
    result: { available: true }
  })
  now = 40
  parent()
  profile.finish('completed')
  const parsed = runtime.parseExecutionRecord(
    records.map((record) => JSON.stringify(record)).join('\n')
  )
  const trace = runtime.exportExecutionTrace(parsed)
  expect(trace.traceEvents).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ph: 'X',
        name: 'read_inventory',
        ts: 20000,
        dur: 5000
      }),
      expect.objectContaining({ ph: 'i', name: 'transport_chunk', ts: 10000 })
    ])
  )
  expect(trace.visibility).toMatchObject({
    transportEvents: 1,
    providerInternalActivity: 'unavailable'
  })
  expect(parsed.complete).toBe(true)
})

it('reports failed recording and unfinished calls separately from ownership accounting', () => {
  const run = runtime.parseExecutionRecord(
    [
      { event: 'ai_request_started', profilerVersion: 1 },
      {
        event: 'ai_request_trace',
        stage: 'tool_started',
        callId: 'one',
        elapsedMs: 1
      },
      {
        event: 'ai_request_usage',
        durationMs: 10,
        outcome: 'completed',
        recordingFailures: 2
      }
    ]
      .map((entry, sequence) =>
        JSON.stringify({ ...entry, requestId: 'r', sequence, schemaVersion: 2 })
      )
      .join('\n')
  )
  expect(run.issues).toEqual(
    expect.arrayContaining([
      'Recording failed for 2 events',
      'Incomplete tool span one'
    ])
  )
  expect(run.complete).toBe(false)
})

it('captures each payload once and reuses retained records across report projections', () => {
  const records: runtime.ExecutionRecord[] = []
  const captured: unknown[] = []
  const profiler = runtime.createAiExecutionProfiler(
    { intent: 'private', context: {}, actions: [], attempt: 1 },
    'test',
    {
      sink: {
        write: (event) => records.push(event),
        writePayload: (_requestId, _callId, phase, value) => {
          captured.push({ phase, value })
          return { status: 'queued', path: `${phase}.json` }
        },
        flush: async () => ({ status: 'saved', path: null })
      }
    }
  )
  const input = { quantity: 3 }
  const output = { available: true, quantity: 3 }
  profiler.trace('tool_started', {
    callId: 'read',
    tool: 'inventory',
    arguments: input
  })
  profiler.trace('tool_completed', {
    callId: 'read',
    tool: 'inventory',
    result: output
  })
  profiler.finish('completed')
  const parsed = runtime.parseExecutionRecord(
    records.map((record) => JSON.stringify(record)).join('\n')
  )
  runtime.evaluateExecution(parsed)
  runtime.exportExecutionTrace(parsed)
  runtime.evaluateExecution(parsed)
  expect(captured).toEqual([
    { phase: 'input', value: input },
    { phase: 'output', value: output }
  ])
})
