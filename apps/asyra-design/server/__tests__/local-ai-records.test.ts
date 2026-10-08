import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  createExecutionRecordSink,
  parseExecutionRecord
} from '../local-ai-records'
import {
  partitionExecutionTime,
  summarizeAppCallGaps
} from '../local-execution-timing'
import { createLocalAiUsage } from '../local-ai-usage'

const workspace = async () => {
  const root = join(process.cwd(), 'tmp')
  await mkdir(root, { recursive: true })
  return mkdtemp(join(root, 'execution-record-test-'))
}

describe('local execution records', () => {
  it('retains ordered workflow part correlation on the existing owner spans', () => {
    const records: Record<string, unknown>[] = []
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    try {
      const usage = createLocalAiUsage(
        { intent: 'private', context: {}, actions: [], attempt: 1 },
        'gpt-6-astra',
        {
          sink: {
            write: (record) => records.push(record),
            flush: async () => ({ status: 'saved', path: null })
          }
        }
      )
      for (const index of [0, 1]) {
        const part = { key: `part-${index}`, index, secret: 'PRIVATE_VALUE' }
        usage.trace('action_started', {
          tool: 'prepare_design',
          callId: `part-${index}`,
          parentCallId: 'sequence',
          part,
          arguments: { draft: {} }
        })
        usage.trace('action_completed', {
          tool: 'prepare_design',
          callId: `part-${index}`,
          part,
          result: { available: true }
        })
      }
      const actions = records.filter((entry) =>
        String(entry.stage).startsWith('action_')
      )
      expect(actions).toHaveLength(4)
      expect(
        actions.map((entry) => (entry.evidence as Record<string, unknown>).part)
      ).toEqual([
        { key: 'part-0', index: 0 },
        { key: 'part-0', index: 0 },
        { key: 'part-1', index: 1 },
        { key: 'part-1', index: 1 }
      ])
      expect(JSON.stringify(records)).not.toContain('PRIVATE_VALUE')
    } finally {
      log.mockRestore()
    }
  })
  it('retains bounded batched query selectors and discovery counts without geometry', () => {
    const retained: Record<string, unknown>[] = []
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    try {
      const usage = createLocalAiUsage(
        { intent: 'private', context: {}, actions: [], attempt: 1 },
        'gpt-6-astra',
        {
          sink: {
            write: (record) => retained.push(record),
            flush: async () => ({ status: 'saved', path: null })
          }
        }
      )
      usage.trace('tool_started', {
        tool: 'execute_design_batch',
        callId: 'batch',
        arguments: {
          operations: Array.from({ length: 20 }, (_, index) => ({
            name: 'read_design_context',
            arguments: {
              scope: 'ids',
              elementIds: [`item-${index}`],
              fields: ['x'],
              points: 'PRIVATE_GEOMETRY'
            }
          }))
        }
      })
      usage.trace('tool_completed', {
        tool: 'describe_design_apis',
        callId: 'discovery',
        result: { complete: true, count: 0, catalogSize: 100 }
      })
      expect(retained[1]).toMatchObject({
        evidence: {
          arguments: {
            operations: {
              count: 20,
              truncated: true,
              items: expect.arrayContaining([
                expect.objectContaining({
                  name: 'read_design_context',
                  arguments: {
                    scope: 'ids',
                    elementIds: {
                      count: 1,
                      items: ['item-0'],
                      truncated: false
                    },
                    fields: { count: 1, items: ['x'], truncated: false }
                  }
                })
              ])
            }
          }
        }
      })
      expect(retained[2]).toMatchObject({
        evidence: { result: { complete: true, count: 0, catalogSize: 100 } }
      })
      expect(JSON.stringify(retained)).not.toContain('PRIVATE_GEOMETRY')
    } finally {
      log.mockRestore()
    }
  })
  it('takes diagnostic purpose from the recorder owner rather than user request metadata', () => {
    const retained: unknown[] = []
    createLocalAiUsage(
      {
        intent: 'private',
        context: {},
        actions: [],
        attempt: 1,
        metadata: {
          purpose: 'execution-assessment',
          sourceRequestId: 'other-request'
        }
      },
      'gpt-6-astra',
      {
        sink: {
          write: (record) => retained.push(record),
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    )
    expect(retained[0]).toMatchObject({
      purpose: 'drawing',
      sourceRequestId: null
    })
  })
  it('persists ordered isolated requests and drains the terminal outcome', async () => {
    const directory = await workspace()
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    try {
      const sinks = [
        createExecutionRecordSink(directory),
        createExecutionRecordSink(directory)
      ]
      for (const [index, sink] of sinks.entries()) {
        let time = 0
        const usage = createLocalAiUsage(
          { actions: [], context: {}, intent: 'private prompt', attempt: 1 },
          'gpt-6-astra',
          { sink, now: () => time, sourceRevision: 'abc123' }
        )
        time = 10
        usage.trace('tool_started', {
          tool: 'describe_design_apis',
          callId: 'a',
          arguments: {
            names: ['api_core_getElementComputedData'],
            brief: 'private prompt',
            error: 'private secret',
            sourceUrl: 'https://user:password@example.test/photo?token=secret'
          }
        })
        time = 20
        usage.trace('tool_completed', {
          tool: 'describe_design_apis',
          callId: 'a',
          result: { password: 'private secret' }
        })
        time = 30
        usage.finish(index === 0 ? 'completed' : 'cancelled')
      }
      expect(await Promise.all(sinks.map((sink) => sink.flush()))).toEqual([
        expect.objectContaining({ status: 'saved' }),
        expect.objectContaining({ status: 'saved' })
      ])
      const files = (await readdir(directory)).filter((name) =>
        name.endsWith('.jsonl')
      )
      expect(files).toHaveLength(2)
      const runs = await Promise.all(
        files.map(async (file) => {
          const content = await readFile(join(directory, file), 'utf8')
          expect(content).not.toContain('private prompt')
          expect(content).not.toContain('private secret')
          expect(content).not.toContain('user:password')
          expect(content).not.toContain('token=secret')
          return parseExecutionRecord(content)
        })
      )
      expect(runs.map((run) => run.outcome).sort()).toEqual([
        'cancelled',
        'completed'
      ])
      for (const run of runs) {
        expect(run.issues).toEqual([])
        expect(run.metadata).toMatchObject({
          model: 'gpt-6-astra',
          effort: 'medium',
          sourceRevision: 'abc123'
        })
        expect(run.steps).toEqual([
          expect.objectContaining({
            callId: 'a',
            status: 'completed',
            startedMs: 10,
            endedMs: 20
          })
        ])
        expect(run.timing).toMatchObject({
          durationMs: 30,
          observedToolAndResearchMs: 10,
          unattributedMs: 20
        })
      }
    } finally {
      log.mockRestore()
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('contains write failure without changing drawing settlement', async () => {
    const directory = await workspace()
    const errors: string[] = []
    try {
      const sink = createExecutionRecordSink(
        join(directory, 'missing', '..', 'blocked'),
        (code) => errors.push(code)
      )
      // A real filesystem error, not a successful mocked writer.
      await mkdir(join(directory, 'blocked', 'request.jsonl'), {
        recursive: true
      })
      sink.write({
        event: 'ai_request_usage',
        schemaVersion: 2,
        requestId: 'request',
        sequence: 1,
        outcome: 'completed',
        durationMs: 0
      })
      expect(await sink.flush()).toMatchObject({ status: 'failed' })
      expect(errors).toHaveLength(1)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('retains malformed and unfinished evidence without inventing completion', () => {
    const record = parseExecutionRecord(
      [
        JSON.stringify({
          event: 'ai_request_trace',
          schemaVersion: 1,
          requestId: 'old',
          sequence: 1,
          elapsedMs: 10,
          stage: 'tool_started',
          tool: 'prepare_design',
          callId: 'a'
        }),
        '{interrupted'
      ].join('\n')
    )
    expect(record.outcome).toBe('incomplete')
    expect(record.steps[0]).toMatchObject({
      status: 'incomplete',
      endedMs: null
    })
    expect(record.issues).toContain('Malformed record at line 2')
    expect(record.metadata.sourceRevision).toBeNull()
  })

  it('does not certify a record with missing sequence entries', () => {
    const record = parseExecutionRecord(
      [
        {
          event: 'ai_request_started',
          schemaVersion: 2,
          requestId: 'r',
          sequence: 0
        },
        {
          event: 'ai_request_usage',
          schemaVersion: 2,
          requestId: 'r',
          sequence: 2,
          outcome: 'completed',
          durationMs: 10
        }
      ]
        .map((entry) => JSON.stringify(entry))
        .join('\n')
    )
    expect(record.complete).toBe(false)
    expect(record.issues).toContain('Missing sequence before line 2')
  })

  it('counts concurrent spans once and exposes missing starts and foreign requests', () => {
    const event = (
      sequence: number,
      stage: string,
      callId: string,
      elapsedMs: number
    ) => ({
      event: 'ai_request_trace',
      schemaVersion: 2,
      requestId: 'r',
      sequence,
      stage,
      callId,
      elapsedMs,
      tool: 'prepare_design'
    })
    const record = parseExecutionRecord(
      [
        event(1, 'tool_started', 'a', 10),
        event(2, 'tool_started', 'b', 20),
        event(3, 'tool_completed', 'a', 40),
        event(4, 'tool_completed', 'b', 50),
        event(5, 'tool_failed', 'missing', 55),
        { ...event(6, 'tool_completed', 'x', 60), requestId: 'foreign' },
        {
          event: 'ai_request_usage',
          schemaVersion: 2,
          requestId: 'r',
          sequence: 6,
          outcome: 'completed',
          durationMs: 100
        }
      ]
        .map((entry) => JSON.stringify(entry))
        .join('\n')
    )
    expect(record.timing).toMatchObject({
      durationMs: 100,
      observedToolAndResearchMs: 40,
      unattributedMs: 60
    })
    expect(record.issues).toEqual(
      expect.arrayContaining([
        'Missing start for tool:missing',
        'Mixed request at line 6'
      ])
    )
    expect(record.complete).toBe(false)
  })
})

it('retains bounded source-fact provenance and invalidation evidence', () => {
  const records: unknown[] = []
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    const usage = createLocalAiUsage(
      { intent: 'private', context: {}, actions: [], attempt: 1 },
      'gpt-6-astra',
      {
        sink: {
          write: (record) => records.push(record),
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    )
    usage.trace('tool_completed', {
      tool: 'record_design_review',
      result: {
        phase: 'facts',
        facts: [
          {
            id: 'axis',
            statement: 'Source axis retained',
            scope: 'Source coordinates',
            sources: ['reference:1'],
            verification: 'Checked original source',
            status: 'invalidated',
            dependencies: [{ key: 'source', version: '1' }],
            invalidatedBy: [
              {
                key: 'source',
                version: '2',
                reason: 'source_changed',
                evidence: 'Corrected source'
              }
            ],
            rawDocument: 'PRIVATE_DOCUMENT'
          }
        ]
      }
    })
    const serialized = JSON.stringify(records)
    for (const expected of [
      'Source axis retained',
      'Checked original source',
      'source_changed',
      'Corrected source',
      'dependencies',
      'invalidatedBy'
    ])
      expect(serialized).toContain(expected)
    expect(serialized).not.toContain('PRIVATE_DOCUMENT')
  } finally {
    log.mockRestore()
  }
})

it('joins call inputs, rejection feedback, output utility and exclusive observed time', () => {
  const records: unknown[] = []
  let now = 0
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    const usage = createLocalAiUsage(
      { intent: 'private', context: {}, actions: [], attempt: 1 },
      'test',
      {
        now: () => now,
        sink: {
          write: (r) => records.push(r),
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    )
    usage.trace('provider_item_started', { callId: 'r', kind: 'reasoning' })
    now = 10
    usage.trace('tool_started', {
      callId: 'a',
      tool: 'prepare_design',
      arguments: { draft: { type: 'group', rings: 'PRIVATE_GEOMETRY' } }
    })
    now = 20
    usage.trace('tool_execution_started', {
      callId: 'a',
      tool: 'prepare_design',
      queueMs: 10
    })
    now = 30
    usage.trace('tool_completed', {
      callId: 'a',
      tool: 'prepare_design',
      queueMs: 10,
      executionMs: 10,
      result: {
        available: false,
        recovery: 'correct_input',
        message: 'arguments.draft.width: expected number'
      }
    })
    now = 40
    usage.trace('provider_item_completed', { callId: 'r', kind: 'reasoning' })
    now = 50
    usage.finish('completed')
    const serialized = records.map((r) => JSON.stringify(r)).join('\n')
    const report = parseExecutionRecord(serialized)
    const call = report.steps.find((s) => s.callId === 'a')
    expect(call).toMatchObject({
      diagnostics: {
        input: { shape: 'object', summary: { draft: { type: 'group' } } },
        output: {
          usability: 'unusable',
          feedback: 'arguments.draft.width: expected number'
        }
      }
    })
    expect(report.timing).toMatchObject({
      breakdown: {
        toolQueueMs: 10,
        toolExecutionMs: 10,
        providerReasoningEventMs: 20,
        unattributedMs: 10
      }
    })
    expect(serialized).not.toContain('PRIVATE_GEOMETRY')
  } finally {
    log.mockRestore()
  }
})

it.each([
  [
    {
      available: true,
      toolOutcome: {
        status: 'unavailable',
        issues: [{ code: 'PREPARATION_REJECTED', message: 'Missing target' }]
      }
    },
    'unusable'
  ],
  [
    { accepted: false, toolOutcome: { status: 'usable', issues: [] } },
    'usable'
  ],
  [
    {
      actionResults: [{ result: { available: false } }],
      toolOutcome: { status: 'partial', issues: [] }
    },
    'partial'
  ],
  [{ available: true }, 'usable'],
  [{ available: true, partial: true }, 'partial'],
  [{ actionResults: [{ result: { available: false } }] }, 'unusable'],
  [{ status: 'something-new' }, 'unknown'],
  [{ batchSummary: { actionCount: 12 } }, 'usable']
])(
  'keeps output usability distinct from completed transport: %j',
  (result, expected) => {
    const records: unknown[] = []
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    try {
      const usage = createLocalAiUsage(
        { intent: '', context: {}, actions: [], attempt: 1 },
        'test',
        {
          sink: {
            write: (r) => records.push(r),
            flush: async () => ({ status: 'saved', path: null })
          }
        }
      )
      usage.trace('tool_started', {
        callId: 'call',
        tool: 'test',
        arguments: {}
      })
      usage.trace('tool_completed', { callId: 'call', tool: 'test', result })
      usage.finish('completed')
      expect(
        parseExecutionRecord(records.map((r) => JSON.stringify(r)).join('\n'))
          .steps[0]
      ).toMatchObject({
        status: 'completed',
        diagnostics: { output: { usability: expected } }
      })
    } finally {
      log.mockRestore()
    }
  }
)

it('retains detached complete tool payloads locally with explicit redactions and no console payloads', async () => {
  const directory = await workspace()
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    const sink = createExecutionRecordSink(directory)
    const usage = createLocalAiUsage(
      { intent: 'PRIVATE_REQUEST', context: {}, actions: [], attempt: 1 },
      'test',
      { sink }
    )
    const points = Array.from({ length: 30 }, (_, x) => ({ x, y: x * 2 }))
    usage.trace('tool_started', {
      callId: 'a',
      tool: 'prepare_design',
      arguments: {
        draft: { rings: points },
        apiKey: 'PRIVATE_KEY',
        image: 'data:image/png;base64,PRIVATE_BITMAP'
      }
    })
    points[0].x = 99
    usage.trace('tool_completed', {
      callId: 'a',
      tool: 'prepare_design',
      result: {
        available: false,
        message: 'draft.rings: expected closed rings',
        customFeedback: { attempt: 1, detail: 'FULL_FEEDBACK_ONLY' }
      }
    })
    usage.finish('completed')
    const saved = await sink.flush()
    expect(saved.status).toBe('saved')
    if (!saved.path) throw new Error('Missing saved record')
    const report = parseExecutionRecord(await readFile(saved.path, 'utf8'))
    const diagnostic = report.steps[0].diagnostics as {
      input: { payload: { path: string } }
      output: { payload: { path: string } }
    }
    expect(diagnostic.input.payload).toMatchObject({
      status: 'queued',
      redactions: ['$.apiKey', '$.image']
    })
    const input = JSON.parse(
      await readFile(join(directory, diagnostic.input.payload.path), 'utf8')
    )
    expect(input.draft.rings).toHaveLength(30)
    expect(input.draft.rings[0]).toEqual({ x: 0, y: 0 })
    const output = JSON.parse(
      await readFile(join(directory, diagnostic.output.payload.path), 'utf8')
    )
    expect(output.customFeedback).toEqual({
      attempt: 1,
      detail: 'FULL_FEEDBACK_ONLY'
    })
    expect(JSON.stringify(input)).not.toMatch(
      /PRIVATE_KEY|PRIVATE_BITMAP|PRIVATE_REQUEST/
    )
    expect(JSON.stringify(log.mock.calls)).not.toContain('FULL_FEEDBACK_ONLY')
  } finally {
    log.mockRestore()
    await rm(directory, { recursive: true, force: true })
  }
})

it('partitions overlap and incomplete native/tool spans without inventing compute time', () => {
  const spans = [
    {
      callId: 'a',
      kind: 'tool' as const,
      tool: 'a',
      startedMs: 5,
      endedMs: 20,
      executionStartedMs: 10,
      status: 'completed' as const,
      evidence: []
    },
    {
      callId: 'b',
      kind: 'tool' as const,
      tool: 'b',
      startedMs: 15,
      endedMs: 30,
      executionStartedMs: 25,
      status: 'completed' as const,
      evidence: []
    },
    {
      callId: 'old',
      kind: 'tool' as const,
      tool: 'old',
      startedMs: 30,
      endedMs: 35,
      status: 'completed' as const,
      evidence: []
    },
    {
      callId: 'wait',
      kind: 'provider' as const,
      tool: null,
      startedMs: 0,
      endedMs: null,
      status: 'incomplete' as const,
      evidence: [{ kind: 'sleep' }]
    }
  ]
  const result = partitionExecutionTime(spans, 40)
  expect(result).toMatchObject({
    toolExecutionMs: 15,
    toolQueueMs: 10,
    toolUnsplitMs: 5,
    nativeWaitMs: 10,
    unattributedMs: 0
  })
  expect(Object.values(result).reduce((sum, value) => sum + value, 0)).toBe(40)
  expect(partitionExecutionTime([], 50).unattributedMs).toBe(50)
})

it('reports named App-call gaps and exclusive native orchestration coverage', () => {
  const records = [
    { event: 'ai_request_started', elapsedMs: 0 },
    {
      stage: 'provider_item_started',
      callId: 'exec',
      tool: 'exec',
      evidence: { kind: 'functionCallOutput' },
      elapsedMs: 10
    },
    {
      stage: 'tool_started',
      callId: 'a',
      tool: 'prepare_design',
      elapsedMs: 20
    },
    {
      stage: 'tool_execution_started',
      callId: 'a',
      tool: 'prepare_design',
      elapsedMs: 25
    },
    {
      stage: 'tool_completed',
      callId: 'a',
      tool: 'prepare_design',
      elapsedMs: 30
    },
    {
      stage: 'provider_item_completed',
      callId: 'exec',
      tool: 'exec',
      evidence: { kind: 'functionCallOutput' },
      elapsedMs: 50
    },
    {
      stage: 'tool_started',
      callId: 'b',
      tool: 'inspect_drawing',
      elapsedMs: 70
    },
    {
      stage: 'tool_completed',
      callId: 'b',
      tool: 'inspect_drawing',
      elapsedMs: 80
    },
    { event: 'ai_request_usage', durationMs: 100, outcome: 'completed' }
  ].map((entry, sequence) => ({
    schemaVersion: 2,
    event: 'ai_request_trace',
    requestId: 'gap',
    sequence,
    ...entry
  }))
  const report = parseExecutionRecord(
    records.map((entry) => JSON.stringify(entry)).join('\n')
  )
  expect(report.timing.breakdown).toMatchObject({
    providerOrchestrationEventMs: 30,
    toolExecutionMs: 5,
    toolQueueMs: 5,
    toolUnsplitMs: 10,
    unattributedMs: 50
  })
  expect(report.timing.appCallGaps[0]).toMatchObject({
    startMs: 30,
    endMs: 70,
    durationMs: 40,
    beforeTool: 'prepare_design',
    afterTool: 'inspect_drawing',
    breakdown: { providerOrchestrationEventMs: 20, unattributedMs: 20 }
  })
})

it('merges concurrent App intervals and does not invent a start for native output', () => {
  const steps = [
    {
      callId: 'a',
      kind: 'tool' as const,
      tool: 'prepare_design',
      startedMs: 10,
      endedMs: 40,
      status: 'completed' as const,
      evidence: []
    },
    {
      callId: 'b',
      kind: 'tool' as const,
      tool: 'read_design_context',
      startedMs: 20,
      endedMs: 30,
      status: 'completed' as const,
      evidence: []
    },
    {
      callId: 'native',
      kind: 'provider' as const,
      tool: 'exec',
      startedMs: null,
      endedMs: 45,
      status: 'completed' as const,
      evidence: [{ kind: 'functionCallOutput' }]
    }
  ]
  expect(
    summarizeAppCallGaps(steps, 50).map(
      ({ startMs, endMs, beforeTool, afterTool }) => ({
        startMs,
        endMs,
        beforeTool,
        afterTool
      })
    )
  ).toEqual([
    { startMs: 0, endMs: 10, beforeTool: null, afterTool: 'prepare_design' },
    { startMs: 40, endMs: 50, beforeTool: 'prepare_design', afterTool: null }
  ])
  expect(partitionExecutionTime(steps, 50)).toMatchObject({
    toolUnsplitMs: 30,
    providerOrchestrationEventMs: 0,
    unattributedMs: 20
  })
})

it('retains action attribution and separates negative judgment from usable review execution', () => {
  const records: unknown[] = []
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    const usage = createLocalAiUsage(
      { intent: '', context: {}, actions: [], attempt: 1 },
      'test',
      {
        sink: {
          write: (record) => records.push(record),
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    )
    usage.trace('action_started', {
      callId: 'action:a',
      tool: 'review',
      actor: 'app-server',
      executor: 'app-browser',
      parentCallId: 'call',
      purpose: 'Check the requested detail',
      expectedResult: 'Evidence-backed visual judgment',
      contractDigest: 'abc',
      timingScope: 'batch-exchange',
      arguments: { elementId: 'root' }
    })
    usage.trace('action_completed', {
      callId: 'action:a',
      tool: 'review',
      result: {
        accepted: false,
        checks: [{ status: 'fail', evidence: 'Missing the requested detail' }],
        toolOutcome: { status: 'usable', issues: [] }
      }
    })
    usage.finish('completed')
    const run = parseExecutionRecord(
      records.map((record) => JSON.stringify(record)).join('\n')
    )
    expect(run.steps).toHaveLength(1)
    expect(run.steps[0]).toMatchObject({
      kind: 'action',
      diagnostics: {
        attribution: {
          actor: 'app-server',
          executor: 'app-browser',
          parentCallId: 'call',
          purpose: 'Check the requested detail',
          expectedResult: 'Evidence-backed visual judgment',
          contractDigest: 'abc',
          timingScope: 'batch-exchange'
        },
        output: {
          usability: 'usable',
          correctness: { status: 'failed', source: 'model-review' }
        }
      }
    })
    expect(run.steps[0].diagnostics?.input).toBeDefined()
  } finally {
    log.mockRestore()
  }
})

it.each([
  [{ accepted: false }, 'unverified'],
  [
    {
      phase: 'structure',
      accepted: false,
      readyForDetail: true,
      checks: [{ status: 'pass', evidence: 'Structure matches' }]
    },
    'passed'
  ],
  [
    {
      accepted: false,
      checks: [{ status: 'unverified', evidence: 'Missing inspection' }]
    },
    'unverified'
  ]
])(
  'does not confuse admission or incomplete review with a failed visual judgment: %j',
  (result, expected) => {
    const records: unknown[] = []
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    try {
      const usage = createLocalAiUsage(
        { intent: '', context: {}, actions: [], attempt: 1 },
        'test',
        {
          sink: {
            write: (record) => records.push(record),
            flush: async () => ({ status: 'saved', path: null })
          }
        }
      )
      usage.trace('tool_started', { callId: 'c', tool: 'review' })
      usage.trace('tool_completed', { callId: 'c', tool: 'review', result })
      usage.finish('completed')
      expect(
        parseExecutionRecord(
          records.map((record) => JSON.stringify(record)).join('\n')
        ).steps[0].diagnostics?.output
      ).toMatchObject({ correctness: { status: expected } })
    } finally {
      log.mockRestore()
    }
  }
)

it('retains independent visual evidence identifiers without recording provider prompts', () => {
  const records: Record<string, unknown>[] = []
  const writePayload = vi.fn(() => ({
    status: 'queued' as const,
    path: 'visual-input.json'
  }))
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    const usage = createLocalAiUsage(
      { intent: 'private', context: {}, actions: [], attempt: 1 },
      'model',
      {
        sink: {
          write: (record) => records.push(record),
          writePayload,
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    )
    usage.trace('visual_assessment_context', {
      callId: 'visual',
      arguments: {
        phase: 'structure',
        criteria: { view: { requirement: 'solid tower' } },
        images: [{ role: 'overview', sha256: 'image-digest' }]
      }
    })
    expect(writePayload).toHaveBeenCalledTimes(1)
    expect(records[1]).toMatchObject({
      diagnostic: { input: { payload: { path: 'visual-input.json' } } }
    })
    expect(JSON.stringify(records)).not.toContain('private')
  } finally {
    log.mockRestore()
  }
})

it('records continuous ownership and attributes a nested AI wait outside tool own time', () => {
  const records: unknown[] = []
  let now = 0
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    const usage = createLocalAiUsage(
      { intent: 'private', context: {}, actions: [], attempt: 1 },
      'gpt-6-astra',
      {
        lifecycle: true,
        now: () => now,
        sink: {
          write: (record) => records.push(record),
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    )
    now = 10
    const provider = usage.span({
      callId: 'turn-wait',
      owner: 'provider',
      purpose: 'Await delegated turn'
    })
    now = 30
    usage.trace('tool_started', {
      callId: 'review',
      tool: 'record_design_review'
    })
    usage.trace('tool_execution_started', { callId: 'review' })
    now = 35
    const child = usage.span({
      callId: 'visual-wait',
      parentCallId: 'review',
      owner: 'provider',
      purpose: 'Await visual assessment'
    })
    now = 65
    child()
    now = 70
    usage.trace('tool_completed', { callId: 'review' })
    now = 90
    provider()
    now = 100
    usage.finish('completed')
    const run = parseExecutionRecord(
      records.map((entry) => JSON.stringify(entry)).join('\n')
    )
    expect(run.complete).toBe(true)
    expect(run.timing.breakdown).toMatchObject({
      appOrchestrationMs: 20,
      providerWaitMs: 40,
      childProviderMs: 30,
      toolExecutionMs: 10,
      unattributedMs: 0
    })
    expect(
      Object.values(run.timing.breakdown).reduce((sum, time) => sum + time, 0)
    ).toBe(100)
    expect(run.timing.unattributedMs).toBe(0)
    expect(
      run.timing.callDurations.find((call) => call.callId === 'review')
    ).toMatchObject({ inclusiveMs: 40, ownMs: 10 })
    expect(
      run.steps.find((step) => step.callId === 'visual-wait')?.evidence[0]
    ).toMatchObject({ owner: 'provider', parentCallId: 'review' })
  } finally {
    log.mockRestore()
  }
})

it('reports missing lifecycle completion as a recording defect rather than success', () => {
  const entries = [
    {
      event: 'ai_request_started',
      schemaVersion: 2,
      requestId: 'r',
      sequence: 0,
      lifecycleVersion: 1
    },
    {
      event: 'ai_request_trace',
      schemaVersion: 2,
      requestId: 'r',
      sequence: 1,
      stage: 'lifecycle_started',
      callId: 'request-lifecycle',
      elapsedMs: 0,
      evidence: { owner: 'app' }
    },
    {
      event: 'ai_request_usage',
      schemaVersion: 2,
      requestId: 'r',
      sequence: 2,
      durationMs: 100,
      outcome: 'completed'
    }
  ]
  const run = parseExecutionRecord(
    entries.map((entry) => JSON.stringify(entry)).join('\n')
  )
  expect(run.complete).toBe(false)
  expect(run.issues.join(' ')).toContain('lifecycle')
})

it('attributes internal server handoffs to tool work instead of browser exchanges', () => {
  const records: unknown[] = []
  let now = 0
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    const usage = createLocalAiUsage(
      { intent: '', context: {}, actions: [], attempt: 1 },
      'test',
      {
        now: () => now,
        sink: {
          write: (entry) => records.push(entry),
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    )
    usage.trace('action_started', {
      callId: 'internal',
      tool: 'prepare_design',
      executor: 'app-server',
      parentCallId: 'native',
      timingScope: 'owner-handoff',
      arguments: { draft: { type: 'group' } }
    })
    now = 10
    usage.trace('action_completed', {
      callId: 'internal',
      result: { available: true }
    })
    usage.finish('completed')
    const run = parseExecutionRecord(
      records.map((entry) => JSON.stringify(entry)).join('\n')
    )
    expect(partitionExecutionTime(run.steps, 10)).toMatchObject({
      toolExecutionMs: 10,
      appExchangeMs: 0
    })
  } finally {
    log.mockRestore()
  }
})
