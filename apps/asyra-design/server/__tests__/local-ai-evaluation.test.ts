import { describe, expect, it, vi } from 'vitest'
import { parseExecutionRecord } from '../local-ai-records'
import { createLocalAiUsage } from '../local-ai-usage'
import {
  evaluateExecution,
  createExecutionPeriodReport
} from '../local-ai-evaluation'

const run = (
  id = 'run-1',
  events: Record<string, unknown>[] = [],
  startedAt = '2026-10-02T00:00:00Z',
  complete = true
) =>
  parseExecutionRecord(
    [
      {
        event: 'ai_request_started',
        startedAt,
        model: 'gpt-6-astra',
        effort: 'medium',
        sourceRevision: 'abc123'
      },
      ...events.map((event) => ({ event: 'ai_request_trace', ...event })),
      ...(complete
        ? [{ event: 'ai_request_usage', outcome: 'completed', durationMs: 100 }]
        : [])
    ]
      .map((event, sequence) =>
        JSON.stringify({ ...event, requestId: id, sequence, schemaVersion: 2 })
      )
      .join('\n')
  )

const query = (callId: string, args: unknown, revision?: string) => [
  {
    stage: 'tool_started',
    tool: 'read_design_context',
    callId,
    elapsedMs: 10,
    evidence: { arguments: args }
  },
  {
    stage: 'tool_completed',
    tool: 'read_design_context',
    callId,
    elapsedMs: 30,
    evidence: { result: { revision }, responseTextBytes: 40 }
  }
]

describe('execution evaluation', () => {
  it('keeps an earlier visual opinion but does not reuse it after later tool work', () => {
    const review = [
      {
        stage: 'tool_started',
        tool: 'record_design_review',
        callId: 'review',
        elapsedMs: 1,
        evidence: {
          arguments: {
            phase: 'visual',
            inspectionIds: ['i'],
            checks: [{ requirement: 'Rough', status: 'pass', evidence: 'i' }]
          }
        }
      },
      {
        stage: 'tool_completed',
        tool: 'record_design_review',
        callId: 'review',
        elapsedMs: 2
      }
    ]
    expect(evaluateExecution(run('a', review)).modelReview.current).toBe(true)
    expect(
      evaluateExecution(
        run('a', [...review, ...query('later', { fields: ['id'] })])
      ).modelReview
    ).toMatchObject({ status: 'recorded', current: false })
  })
  it('distinguishes an unavailable tool result from a successful transport call', () => {
    const result = evaluateExecution(
      run('a', [
        {
          stage: 'tool_started',
          tool: 'prepare_and_apply_design',
          callId: 'a',
          elapsedMs: 1
        },
        {
          stage: 'tool_completed',
          tool: 'prepare_and_apply_design',
          callId: 'a',
          elapsedMs: 5,
          evidence: {
            result: {
              available: false,
              recovery: { nextTool: 'prepare_design' }
            }
          }
        }
      ])
    )
    expect(result.findings).toEqual([
      expect.objectContaining({ kind: 'unavailable-result', callId: 'a' })
    ])
    expect(result.toolCalls[0].status).toBe('completed')
  })
  it('reads actual retained array summaries when reusing model review evidence', () => {
    const lines: string[] = []
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    try {
      const usage = createLocalAiUsage(
        { intent: 'private', context: {}, actions: [], attempt: 1 },
        'gpt-6-astra',
        {
          sink: {
            write: (record) => {
              lines.push(JSON.stringify(record))
            },
            flush: async () => ({ status: 'saved', path: null })
          }
        }
      )
      usage.trace('tool_started', {
        tool: 'record_design_review',
        callId: 'review',
        arguments: {
          phase: 'visual',
          inspectionIds: ['i-1'],
          checks: [
            {
              requirement: 'Deliberately rough',
              status: 'pass',
              evidence: 'Inspection i-1'
            }
          ]
        }
      })
      usage.trace('tool_completed', {
        tool: 'record_design_review',
        callId: 'review',
        result: { accepted: true }
      })
      usage.finish('completed')
      const report = evaluateExecution(parseExecutionRecord(lines.join('\n')))
      expect(report.modelReview).toMatchObject({
        status: 'recorded',
        inspectionIds: ['i-1'],
        checks: [
          {
            requirement: 'Deliberately rough',
            status: 'pass',
            evidence: 'Inspection i-1'
          }
        ]
      })
    } finally {
      log.mockRestore()
    }
  })
  it('keeps overlap, unavailable usage and unknown time distinct from reasoning', () => {
    const result = evaluateExecution(
      run('a', [
        ...query('a', { fields: ['id'] }),
        ...query('b', { fields: ['name'] })
      ])
    )
    expect(result.timing).toEqual({
      durationMs: 100,
      observedToolAndResearchMs: 20,
      unattributedMs: 80
    })
    expect(result.usage).toBeNull()
    expect(result.toolCalls).toHaveLength(2)
    expect(result.findings).toEqual([])
    expect(result.modelReview.status).toBe('unavailable')
  })

  it('only flags exact untruncated reads at a known unchanged revision as candidates', () => {
    const events = [
      ...query('a', { fields: ['id'], elementIds: ['x'] }, 'scene-1'),
      ...query('b', { elementIds: ['x'], fields: ['id'] }, 'scene-1'),
      ...query('c', { fields: ['id'], elementIds: ['x'] }, 'scene-2'),
      ...query('d', { fields: ['name'], elementIds: ['x'] }, 'scene-1'),
      ...query('e', { fields: ['id'], elementIds: ['x'] }),
      ...query('f', { fields: ['[truncated]'], elementIds: ['x'] }, 'scene-1'),
      ...query('g', { fields: ['[truncated]'], elementIds: ['x'] }, 'scene-1')
    ]
    const result = evaluateExecution(run('a', events))
    expect(result.findings).toEqual([
      expect.objectContaining({
        kind: 'repeat-query-candidate',
        confidence: 'candidate',
        callId: 'b',
        relatedCallIds: ['a'],
        requestId: 'a',
        sequence: 3
      })
    ])
    expect(result.findings[0].observation).toContain('not proof of waste')
  })

  it('does not confuse similar writes with reusable read work', () => {
    const events = [
      ...query('a', { fields: ['id'] }, 'one'),
      ...query('b', { fields: ['id'] }, 'one')
    ].map((event) => ({ ...event, tool: 'execute_design_batch' }))
    expect(evaluateExecution(run('a', events)).findings).toEqual([])
  })

  it('records failures and unresolved calls without turning partial records into successful work', () => {
    const result = evaluateExecution(
      run(
        'a',
        [
          {
            stage: 'tool_started',
            tool: 'prepare_design',
            callId: 'a',
            elapsedMs: 10
          },
          {
            stage: 'tool_failed',
            tool: 'prepare_design',
            callId: 'a',
            elapsedMs: 20,
            evidence: { code: 'INVALID_INPUT' }
          },
          {
            stage: 'tool_started',
            tool: 'inspect_drawing',
            callId: 'b',
            elapsedMs: 30
          }
        ],
        undefined,
        false
      )
    )
    expect(result.complete).toBe(false)
    expect(result.outcome).toBe('incomplete')
    expect(result.findings.map((finding) => finding.kind)).toEqual([
      'tool-failure',
      'incomplete-step'
    ])
    expect(result.toolCalls[1].durationMs).toBeNull()
  })

  it.each([false, true])(
    'reuses review opinions and criteria without imposing detailRequired=%s',
    (detailRequired) => {
      const result = evaluateExecution(
        run('a', [
          {
            stage: 'tool_started',
            tool: 'record_design_review',
            callId: 'plan',
            elapsedMs: 1,
            evidence: {
              arguments: {
                phase: 'plan',
                detailRequired,
                criteria: ['Match requested style']
              }
            }
          },
          {
            stage: 'tool_completed',
            tool: 'record_design_review',
            callId: 'plan',
            elapsedMs: 2
          },
          {
            stage: 'tool_started',
            tool: 'record_design_review',
            callId: 'review',
            elapsedMs: 90,
            evidence: {
              arguments: {
                phase: 'visual',
                inspectionIds: ['i-1'],
                checks: [
                  {
                    requirement: 'Match requested style',
                    status: 'pass',
                    evidence: 'Inspected i-1'
                  }
                ]
              }
            }
          },
          {
            stage: 'tool_completed',
            tool: 'record_design_review',
            callId: 'review',
            elapsedMs: 91,
            evidence: { result: { accepted: true } }
          }
        ]),
        { feedback: 'The shape is wrong.' }
      )
      expect(result.modelReview).toMatchObject({
        status: 'recorded',
        detailRequired,
        criteria: ['Match requested style'],
        callId: 'review',
        accepted: true
      })
      expect(result.userFeedback).toBe('The shape is wrong.')
      expect(result.findings).toEqual([])
      expect(result.modelReview.certifiesVisuals).toBe(false)
    }
  )

  it('rejects incomplete review reuse instead of treating it as accepted', () => {
    const result = evaluateExecution(
      run('a', [
        {
          stage: 'tool_started',
          tool: 'record_design_review',
          callId: 'review',
          elapsedMs: 1,
          evidence: {
            arguments: { phase: 'visual', checks: [{ status: 'pass' }] }
          }
        },
        {
          stage: 'tool_failed',
          tool: 'record_design_review',
          callId: 'review',
          elapsedMs: 2
        }
      ])
    )
    expect(result.modelReview.status).toBe('unavailable')
  })

  it('selects a half-open period, reports duplicates/unknown dates, and separates metadata groups', () => {
    const runs = [
      run('start', [], '2026-10-01T00:00:00Z'),
      run('end', [], '2026-10-03T00:00:00Z'),
      run('duplicate'),
      run('duplicate'),
      run('unknown', [], 'invalid'),
      run('partial', [], '2026-10-02T00:00:00Z', false)
    ]
    runs[5].metadata.model = 'other-model'
    const report = createExecutionPeriodReport(runs, {
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-03T00:00:00Z'
    })
    expect(report.runs.map((entry) => entry.requestId)).toEqual([
      'start',
      'partial'
    ])
    expect(report.excluded.map((entry) => entry.reason).sort()).toEqual([
      'duplicate-request',
      'unknown-date'
    ])
    expect(report.groups).toHaveLength(2)
    expect(report.partialRuns).toBe(1)
    expect(report.outsidePeriod).toBe(1)
  })

  it('defaults to seven days, handles no data and malformed records, and rejects invalid ranges', () => {
    const report = createExecutionPeriodReport([], {
      now: new Date('2026-10-03T00:00:00Z')
    })
    expect(report.from).toBe('2026-09-26T00:00:00.000Z')
    expect(report.runs).toEqual([])
    expect(report.groups).toEqual([])
    expect(
      createExecutionPeriodReport([parseExecutionRecord('broken')]).excluded
    ).toEqual([expect.objectContaining({ reason: 'unknown-request' })])
    expect(() => createExecutionPeriodReport([], { from: 'bad' })).toThrow(
      'Invalid period'
    )
    expect(() =>
      createExecutionPeriodReport([], { from: '2026-10-04', to: '2026-10-03' })
    ).toThrow('Invalid period')
  })
})
