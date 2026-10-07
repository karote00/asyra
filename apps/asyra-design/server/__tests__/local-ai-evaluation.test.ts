import { describe, expect, it, vi } from 'vitest'
import { parseExecutionRecord } from '../local-ai-records'
import { createLocalAiUsage } from '../local-ai-usage'
import { localToolFailureReply } from '../local-tool-invocation'
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
  const planEcho = (
    callId: string,
    method: unknown,
    output: unknown = method
  ) => [
    {
      stage: 'tool_started',
      tool: 'record_design_review',
      callId,
      elapsedMs: 10,
      evidence: { arguments: { phase: 'plan', method } }
    },
    {
      stage: 'tool_completed',
      tool: 'record_design_review',
      callId,
      elapsedMs: 12,
      evidence: { result: { phase: 'plan', method: output } }
    }
  ]
  it('reports exact retained plan echoes without exposing narrative or inferring model delay', () => {
    const report = evaluateExecution(
      run('echo', planEcho('plan', 'Private construction method'))
    )
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        kind: 'input-echo-candidate',
        callId: 'plan',
        confidence: 'candidate',
        repeatedFields: ['method']
      })
    )
    expect(JSON.stringify(report.findings)).not.toContain(
      'Private construction method'
    )
    for (const [input, output] of [
      ['changed', 'new'],
      ['[truncated]', '[truncated]'],
      ['', '']
    ]) {
      expect(
        evaluateExecution(run('no-echo', planEcho('plan', input, output)))
          .findings
      ).not.toContainEqual(
        expect.objectContaining({ kind: 'input-echo-candidate' })
      )
    }
  })
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
        run('plan', failure('record_design_review', 'plan')),
        run('plan-again', failure('record_design_review', 'plan')),
        run('visual', failure('record_design_review', 'visual')),
        run('prepare', failure('prepare_design', ''))
      ],
      { from: '2026-10-01', to: '2026-10-03' }
    )
    expect(period.investigationTargets).toHaveLength(3)
    const target = period.investigationTargets.find(
      (target) => target.phase === 'plan'
    )
    expect(target).toMatchObject({
      tool: 'record_design_review',
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
  it('does not pool new revisions with historical failures or turn partial summaries into echo evidence', () => {
    const before = run('before', planEcho('plan', 'Use the supplied outline'))
    const after = run('after', planEcho('plan', 'Use the supplied outline'))
    after.metadata.sourceRevision = 'candidate'
    const period = createExecutionPeriodReport([before, after], {
      from: '2026-10-01',
      to: '2026-10-03'
    })
    expect(period.investigationTargets).toHaveLength(2)
    expect(
      period.investigationTargets.map(
        (target) => target.configuration.sourceRevision
      )
    ).toEqual(['abc123', 'candidate'])
    const partial = { count: 2, items: ['one'], truncated: true }
    expect(
      evaluateExecution(run('partial', planEcho('plan', partial))).findings
    ).toEqual([])
  })
  it('keeps child handler timings separate from the parent tool count and duration', () => {
    const report = evaluateExecution(
      run('nested', [
        {
          stage: 'tool_started',
          tool: 'execute_design_batch',
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
          tool: 'execute_design_batch',
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
      const usage = createLocalAiUsage(
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
        tool: 'execute_design_batch',
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
        tool: 'execute_design_batch',
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

  it.each([false, true])(
    'ignores settlement envelopes but retains later App work as review invalidation (%s)',
    (laterEdit) => {
      const events = [
        { stage: 'lifecycle_started', callId: 'provider-turn', elapsedMs: 0 },
        {
          stage: 'tool_started',
          tool: 'record_design_review',
          callId: 'review',
          elapsedMs: 10,
          evidence: {
            arguments: { phase: 'visual', checks: [{ status: 'pass' }] }
          }
        },
        {
          stage: 'tool_completed',
          tool: 'record_design_review',
          callId: 'review',
          elapsedMs: 20,
          evidence: { result: { accepted: true } }
        },
        ...(laterEdit
          ? [
              {
                stage: 'action_started',
                tool: 'edit',
                callId: 'edit',
                elapsedMs: 30
              },
              {
                stage: 'action_completed',
                tool: 'edit',
                callId: 'edit',
                elapsedMs: 40
              }
            ]
          : []),
        { stage: 'lifecycle_completed', callId: 'provider-turn', elapsedMs: 90 }
      ]
      expect(
        evaluateExecution(run('settled', events)).modelReview.current
      ).toBe(!laterEdit)
      expect(
        evaluateExecution(run('unfinished', events, undefined, false))
          .modelReview.current
      ).toBe(false)
    }
  )

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

  it.each([true, false, undefined])(
    'retains and interprets the final canonical freshness receipt (%s)',
    (current) => {
      const lines: string[] = []
      const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
      try {
        const usage = createLocalAiUsage(
          { actions: [], context: {}, intent: 'Draw', attempt: 1 },
          'selected-model',
          {
            sink: {
              write: (record) => lines.push(JSON.stringify(record)),
              flush: async () => ({ status: 'saved', path: null })
            }
          }
        )
        usage.trace('tool_started', {
          tool: 'record_design_review',
          callId: 'review',
          arguments: { phase: 'visual', checks: [{ status: 'pass' }] }
        })
        usage.trace('tool_completed', {
          tool: 'record_design_review',
          callId: 'review',
          result: { accepted: true }
        })
        usage.trace('action_started', {
          tool: 'validate_inspection_evidence',
          callId: 'freshness',
          arguments: {}
        })
        usage.trace('action_completed', {
          tool: 'validate_inspection_evidence',
          callId: 'freshness',
          result: { current }
        })
        usage.finish('completed')
        const parsed = parseExecutionRecord(lines.join('\n'))
        expect(parsed.issues).toEqual([])
        expect(parsed.complete).toBe(true)
        const receipt = parsed.records.find(
          (entry) => entry.stage === 'action_completed'
        )
        expect(
          (receipt?.evidence as { result: { current?: boolean } }).result
            .current
        ).toBe(current)
        expect(evaluateExecution(parsed).modelReview.current).toBe(
          current === true
        )
      } finally {
        log.mockRestore()
      }
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
