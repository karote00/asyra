import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  createExecutionRecordSink,
  parseExecutionRecord
} from '../local-ai-records'
import { createLocalAiUsage } from '../local-ai-usage'

const workspace = async () => {
  const root = join(process.cwd(), 'tmp')
  await mkdir(root, { recursive: true })
  return mkdtemp(join(root, 'execution-record-test-'))
}

describe('local execution records', () => {
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
      const files = await readdir(directory)
      expect(files).toHaveLength(2)
      const runs = await Promise.all(
        files.map(async (file) => {
          const content = await readFile(join(directory, file), 'utf8')
          expect(content).not.toContain('private prompt')
          expect(content).not.toContain('private secret')
          expect(content).not.toContain('password')
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
        expect(run.timing).toEqual({
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
    expect(record.timing).toEqual({
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
