import { designReportPolicy } from '../design-profiler-policy'
import { describe, expect, it, vi } from 'vitest'
import { parseExecutionRecord } from '@asyra/ai-agent-runtime/node'
import { createAiExecutionProfiler } from '@asyra/ai-agent-runtime'
import { localToolFailureReply } from '../local-tool-invocation'
import {
  evaluateExecution as evaluate,
  createExecutionPeriodReport as periodReport
} from '@asyra/ai-agent-runtime'

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
  it('groups investigation evidence by tool and phase within configuration, not generic failure labels', () => {
    const failure = (tool: string, phase: string) => [
      {
        stage: 'tool_started',
        tool,
        callId: 'call',
        elapsedMs: 1,
        evidence: { arguments: { phase } }
      },
      {
        stage: 'tool_failed',
        tool,
        callId: 'call',
        elapsedMs: 2,
        evidence: { code: 'INPUT_INVALID' }
      }
    ]

    const period = createExecutionPeriodReport(
      [
        run('plan', failure('read_design_context', 'plan')),
        run('plan-again', failure('read_design_context', 'plan')),
        run('visual', failure('read_design_context', 'visual')),
        run('prepare', failure('prepare_design', ''))
      ],
      { from: '2026-10-01', to: '2026-10-03' }
    )

    expect(period.investigationTargets).toHaveLength(3)
    const target = period.investigationTargets.find(
      (target) => target.phase === 'plan'
    )

    expect(target).toMatchObject({
      tool: 'read_design_context',
      code: 'INPUT_INVALID',
      occurrences: 2,
      requestIds: ['plan', 'plan-again'],
      confidence: 'observed'
    })
    expect(target?.evidence).toHaveLength(2)
    expect(target?.evidence[0]).toMatchObject({
      requestId: 'plan',
      callId: 'call',
      sequence: 1
    })
    expect(
      createExecutionPeriodReport([], { from: '2026-10-01', to: '2026-10-03' })
        .investigationTargets
    ).toEqual([])
  })
  it('keeps child handler timings separate from the parent tool count and duration', () => {
    const report = evaluateExecution(
      run('nested', [
        {
          stage: 'tool_started',
          tool: 'execute_design',
          callId: 'outer',
          elapsedMs: 10
        },
        {
          stage: 'action_started',
          tool: 'edit',
          callId: 'inner',
          elapsedMs: 15
        },
        {
          stage: 'action_completed',
          tool: 'edit',
          callId: 'inner',
          elapsedMs: 35,
          diagnostic: {
            output: { summary: { actionObservation: { handlerMs: 7 } } }
          }
        },
        {
          stage: 'tool_completed',
          tool: 'execute_design',
          callId: 'outer',
          elapsedMs: 40
        }
      ])
    )

    expect(report.toolCalls).toHaveLength(1)
    expect(report.actions).toMatchObject([{ callId: 'inner', handlerMs: 7 }])
  })
  it('projects actual retained batch selectors without mutation values', () => {
    const lines: string[] = []
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    try {
      const usage = createAiExecutionProfiler(
        { intent: 'private', context: {}, actions: [], attempt: 1 },
        'gpt-6-astra',
        {
          sink: {
            write: (entry) => {
              lines.push(JSON.stringify(entry))
            },

            flush: async () => ({ status: 'saved', path: null })
          }
        }
      )

      usage.trace('tool_started', {
        tool: 'execute_design',
        callId: 'batch',
        arguments: {
          operations: [
            {
              name: 'read_design_context',
              arguments: {
                scope: 'children',
                parentId: 'parent',
                offset: 20,
                limit: 10,
                fields: ['x'],
                fillColor: 'PRIVATE_VALUE'
              }
            }
          ]
        }
      })
      usage.trace('tool_completed', {
        tool: 'execute_design',
        callId: 'batch'
      })
      usage.finish('completed')
      const report = evaluateExecution(parseExecutionRecord(lines.join('\n')))

      expect(report.toolCalls[0]).toMatchObject({
        selectors: {
          operations: [
            {
              name: 'read_design_context',
              arguments: {
                scope: 'children',
                parentId: 'parent',
                offset: 20,
                limit: 10,
                fields: ['x']
              }
            }
          ]
        }
      })
      expect(JSON.stringify(report.toolCalls)).not.toContain('PRIVATE_VALUE')
    } finally {
      log.mockRestore()
    }
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
              available: true,
              toolOutcome: { status: 'unavailable', issues: [] },
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
  it('keeps overlap, unavailable usage and unknown time distinct from reasoning', () => {
    const result = evaluateExecution(
      run('a', [
        ...query('a', { fields: ['id'] }),
        ...query('b', { fields: ['name'] })
      ])
    )

    expect(result.timing).toMatchObject({
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
    ].map((event) => ({ ...event, tool: 'execute_design' }))

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

  it('keeps native turn and program observations distinct from unavailable model rounds and child links', () => {
    const events = ['exec', 'wait'].flatMap((tool, index) => [
      {
        stage: 'provider_item_started',
        tool,
        callId: `item:${tool}`,
        elapsedMs: index * 20,
        evidence: { nativeTurnId: 'native-turn', nativeItemId: tool }
      },
      {
        stage: 'provider_item_completed',
        tool,
        callId: `item:${tool}`,
        elapsedMs: index * 20 + 10,
        evidence: { nativeTurnId: 'native-turn', nativeItemId: tool }
      }
    ])
    const report = evaluateExecution(
      run('programs', [...events, ...query('child', {})])
    )

    expect(report.orchestration).toMatchObject({
      nativeTurnIds: ['native-turn'],
      modelRoundCount: null,
      programChildLinks: 'unavailable',
      programs: [
        { tool: 'exec', startedMs: 0, endedMs: 10 },
        { tool: 'wait', startedMs: 20, endedMs: 30 }
      ]
    })
    expect(report.toolCalls).toHaveLength(1)
    expect(evaluateExecution(run()).orchestration).toMatchObject({
      nativeTurnIds: [],
      modelRoundCount: null
    })
  })

  it('rejects incomplete review reuse instead of treating it as accepted', () => {
    const result = evaluateExecution(
      run('a', [
        {
          stage: 'tool_started',
          tool: 'read_design_context',
          callId: 'review',
          elapsedMs: 1,
          evidence: {
            arguments: { phase: 'visual', checks: [{ status: 'pass' }] }
          }
        },
        {
          stage: 'tool_failed',
          tool: 'read_design_context',
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

it('counts receipt outcomes separately from completed transport and nested action failures', () => {
  const receipts = [
    {
      stage: 'admission',
      settlement: 'not-started',
      code: 'PREPARATION_REJECTED',
      available: false,
      toolOutcome: { status: 'unavailable' }
    },
    {
      stage: 'execution',
      settlement: 'partial',
      toolOutcome: { status: 'partial' }
    },
    { toolOutcome: { status: 'usable' } },
    {}
  ]
  const events = receipts.flatMap((result, i) => [
    {
      stage: 'tool_started',
      tool: 'read_design_context',
      callId: `tool-${i}`,
      elapsedMs: i * 2
    },
    {
      stage: 'tool_completed',
      tool: 'read_design_context',
      callId: `tool-${i}`,
      elapsedMs: i * 2 + 1,
      evidence: { result }
    }
  ])

  events.push(
    {
      stage: 'tool_started',
      tool: 'import_reference_image',
      callId: 'transport',
      elapsedMs: 10
    },
    {
      stage: 'tool_failed',
      tool: 'import_reference_image',
      callId: 'transport',
      elapsedMs: 11
    } as never,
    {
      stage: 'action_started',
      tool: 'download_reference',
      callId: 'leaf',
      elapsedMs: 10
    } as never,
    {
      stage: 'action_failed',
      tool: 'download_reference',
      callId: 'leaf',
      elapsedMs: 11
    } as never
  )
  const report = evaluateExecution(run('outcomes', events))
  const progress = evaluateExecution(
    run('outcomes', events, '2026-10-02T00:00:00Z', false)
  )

  expect(progress.complete).toBe(false)
  expect(report.complete).toBe(true)
  expect(progress.toolOutcomes).toEqual(report.toolOutcomes)
  expect(progress.toolCalls.map((call) => call.execution)).toEqual(
    report.toolCalls.map((call) => call.execution)
  )

  expect(report.toolCalls.map((call) => call.execution.status)).toEqual([
    'rejected',
    'partial',
    'usable',
    'unknown',
    'failed'
  ])
  expect(report.toolOutcomes).toEqual({
    usable: 1,
    partial: 1,
    rejected: 1,
    failed: 1,
    unknown: 1
  })
  expect(report.toolCalls[0].execution).toMatchObject({
    stage: 'admission',
    code: 'PREPARATION_REJECTED',
    settlement: 'not-started'
  })
  expect(report.actions.filter((a) => a.status === 'failed')).toHaveLength(1)
})

it('preserves acknowledged partial work from the actual recoverable failure envelope', () => {
  const reply = localToolFailureReply(
    'A later action failed',
    'AI_EXECUTION_FAILED',
    {
      stage: 'execution',
      settlement: 'partial',
      executionResult: {
        actionResults: [{ actionId: 'created', result: { id: 'element' } }]
      }
    }
  )
  const result = JSON.parse(reply.text)

  expect(result).toMatchObject({
    available: false,
    toolOutcome: { status: 'partial' }
  })
  const report = evaluateExecution(
    run('partial-envelope', [
      {
        stage: 'tool_started',
        tool: 'prepare_and_apply_design',
        callId: 'batch',
        elapsedMs: 0
      },
      {
        stage: 'tool_completed',
        tool: 'prepare_and_apply_design',
        callId: 'batch',
        elapsedMs: 1,
        evidence: { result }
      }
    ])
  )

  expect(report.toolCalls[0].execution).toMatchObject({
    status: 'partial',
    recoverable: true,
    settlement: 'partial'
  })
  expect(report.toolOutcomes.partial).toBe(1)
  expect(report.toolOutcomes.failed).toBe(0)
})

function evaluateExecution(...[run, options]: Parameters<typeof evaluate>) {
  return evaluate(run, { ...options, policy: designReportPolicy })
}

function createExecutionPeriodReport(
  ...[runs, options]: Parameters<typeof periodReport>
) {
  return periodReport(runs, { ...options, policy: designReportPolicy })
}
