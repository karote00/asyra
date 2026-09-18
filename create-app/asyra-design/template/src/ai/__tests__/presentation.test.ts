import { describe, expect, it } from 'vitest'
import { projectAiActivity } from '../presentation'
import {
  canRetryAiTurn,
  formatElapsedTime,
  projectAiDrawingDetailChoice,
  summarizeAiTurn
} from '../presentation'
import { AiActionNames, AiDrawingDetailOptionIds } from '../../constants'

const turn = (
  outcome: 'cancelled' | 'failed' | 'no-change' | 'partial' | 'success'
) => ({
  attachments: [],
  conversationId: 'conversation-a',
  durationMs: 1_250,
  intent: 'request',
  outcome,
  progress: [],
  result: {
    actionResults: [
      {
        actionId: 'secret-action-id',
        actionName: 'secret-action-name',
        result: {
          appliedElementIds: ['secret-canonical-id'],
          skipped: [{ reason: 'secret-reason' }],
          status: outcome === 'partial' ? 'partial' : 'complete'
        }
      }
    ],
    providerBody: 'secret-provider-body',
    status: 'executed'
  },
  turnId: 'conversation-a:turn:1'
})

describe('Asyra Design AI presentation summaries', () => {
  it('never claims an unknown rollback left the canvas unchanged or permits replay', () => {
    const failed = {
      ...turn('failed'),
      result: {
        status: 'failed',
        stage: 'provider',
        transaction: { status: 'unknown' }
      }
    }
    expect(summarizeAiTurn(failed).message).toBe(
      'The request stopped, but its changes could not be fully rolled back. Review the canvas before continuing.'
    )
    expect(canRetryAiTurn(failed)).toBe(false)
  })

  it('uses distinct safe summaries for every terminal outcome', () => {
    const summaries = [
      'success',
      'partial',
      'no-change',
      'cancelled',
      'failed'
    ].map((outcome) =>
      summarizeAiTurn(turn(outcome as Parameters<typeof turn>[0]))
    )

    expect(summaries.map((summary) => summary.message)).toEqual([
      'Updated 1 editable element.',
      'Partially updated the drawing: 1 applied, 1 skipped.',
      'No canvas changes were needed.',
      'The request was cancelled.',
      'The request failed. Review the canvas before trying again.'
    ])
    expect(summaries.map((summary) => summary.durationLabel)).toEqual(
      Array.from({ length: 5 }, () => '1.3s')
    )
    expect(
      summarizeAiTurn({
        ...turn('success'),
        durationMs: 40_500
      }).durationLabel
    ).toBe('41s')
    expect(
      summarizeAiTurn({
        ...turn('success'),
        durationMs: 65_000
      }).durationLabel
    ).toBe('1m 5s')
    expect(new Set(summaries.map((summary) => summary.message))).toHaveProperty(
      'size',
      5
    )
    expect(JSON.stringify(summaries)).not.toMatch(
      /secret-action|secret-canonical|secret-provider|secret-reason/
    )
  })

  it('projects only the exact registered drawing-detail clarification as App-owned choices', () => {
    const clarificationTurn = {
      ...turn('no-change'),
      result: {
        actionResults: [
          {
            actionId: 'provider-action-id-is-not-presented',
            actionName: AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
            result: {
              action: AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
              clarification: {
                kind: 'drawing-detail',
                optionIds: [
                  AiDrawingDetailOptionIds.BALANCED,
                  AiDrawingDetailOptionIds.MAXIMUM
                ]
              },
              status: 'no-change'
            }
          }
        ],
        providerBody: 'provider-detail-wording-is-not-presented',
        status: 'executed'
      }
    }

    const projection = projectAiDrawingDetailChoice(clarificationTurn)

    expect(projection).toEqual({
      choices: [
        {
          description: 'Faster and lighter for editing.',
          id: AiDrawingDetailOptionIds.BALANCED,
          label: 'Balanced detail',
          resourceWarning: null
        },
        {
          description:
            'Preserves more detail with potentially more editable shapes.',
          id: AiDrawingDetailOptionIds.MAXIMUM,
          label: 'Maximum detail',
          resourceWarning:
            'May temporarily use much more memory and reduce app responsiveness.'
        }
      ],
      kind: 'drawing-detail'
    })
    expect(summarizeAiTurn(clarificationTurn).message).toBe(
      'Choose a drawing detail level.'
    )
    expect(JSON.stringify(projection)).not.toMatch(
      /provider-action|provider-detail/
    )
    expect(
      projectAiDrawingDetailChoice({
        ...clarificationTurn,
        result: {
          ...clarificationTurn.result,
          actionResults: [
            {
              ...clarificationTurn.result.actionResults[0],
              actionName: 'unregistered-provider-action'
            }
          ]
        }
      })
    ).toBeNull()
  })
})

describe('capability outcomes', () => {
  it('explains an unsupported remainder after earlier changes without replacing it with success', () => {
    const original = turn('partial')
    const result = {
      ...original,
      result: {
        ...original.result,
        actionResults: [
          ...original.result.actionResults,
          {
            actionId: 'outcome',
            actionName: 'report_outcome',
            result: {
              status: 'no-change',
              outcome: 'unsupported',
              message:
                'I traced the image, but this app cannot cut the connected mark.'
            }
          }
        ]
      }
    }
    expect(summarizeAiTurn(result).message).toContain(
      'cannot cut the connected mark'
    )
    expect(summarizeAiTurn(result).message).toBe(
      'I traced the image, but this app cannot cut the connected mark.'
    )
  })
})

describe('shared current activity and activity history', () => {
  it('collapses only consecutive identical visible activity and preserves distinct messages', () => {
    const completed = {
      attempt: 1,
      phase: 'provider' as const,
      tool: 'vtracer',
      toolStatus: 'completed' as const,
      summary: 'Tool completed'
    }
    const updates = [
      completed,
      { ...completed, tool: 'analyze_vector' },
      { ...completed, message: 'First finding' },
      { ...completed, message: 'First finding' },
      { ...completed, message: 'Second finding' },
      { attempt: 1, phase: 'context' as const, summary: 'Context' },
      completed
    ]
    const projection = projectAiActivity(updates)
    expect(projection.entries).toEqual([
      { label: 'Reviewing the results' },
      { label: 'Reviewing the results', message: 'First finding' },
      { label: 'Reviewing the results', message: 'Second finding' },
      { label: 'Reviewing the drawing' },
      { label: 'Reviewing the results' }
    ])
    expect(projection.current).toBe(projection.entries.at(-1))
    expect(updates).toHaveLength(7)
  })

  it('reuses the latest activity description without exposing tools or AI wait states', () => {
    const projection = projectAiActivity([
      { attempt: 1, phase: 'context', summary: 'legacy context' },
      {
        attempt: 1,
        phase: 'provider',
        tool: 'vtracer',
        toolStatus: 'running',
        summary: 'Running a tool'
      },
      {
        attempt: 1,
        phase: 'provider',
        tool: 'vtracer',
        toolStatus: 'completed',
        summary: 'Tool completed'
      }
    ])
    expect(projection.entries.map((entry) => entry.label)).toEqual([
      'Reviewing the drawing',
      'Converting artwork to vectors',
      'Reviewing the results'
    ])
    expect(projection.current).toBe(projection.entries.at(-1))
  })
  it('keeps backend operation messages attached to their event and projects real control states', () => {
    const updates = [
      {
        attempt: 1,
        phase: 'provider' as const,
        tool: 'set_element_visibility',
        toolStatus: 'running' as const,
        summary: 'Running a tool',
        message: '正在隱藏 TM'
      }
    ]
    const projection = projectAiActivity(updates)
    expect(projection.current).toMatchObject({
      label: 'Adjusting element visibility',
      message: '正在隱藏 TM'
    })
    for (const [state, label] of [
      [{ stopping: true }, 'Stopping…'],
      [{ awaitingApproval: true }, 'Awaiting approval']
    ] as const) {
      const controlled = projectAiActivity(updates, state)
      expect(controlled.current).toBe(controlled.entries.at(-1))
      expect(controlled.current.label).toBe(label)
    }
  })
})

it('ends history with the authoritative result even when cancellation emitted no terminal progress', () => {
  const projection = projectAiActivity(
    [
      {
        attempt: 1,
        phase: 'provider',
        tool: 'vtracer',
        toolStatus: 'running',
        summary: 'Running a tool'
      }
    ],
    { outcome: 'cancelled' }
  )
  expect(projection.entries.at(-1)?.label).toBe('Stopped')
})

it('describes provider work and unknown tools without exposing implementation names', () => {
  for (const update of [
    {
      attempt: 1,
      phase: 'provider' as const,
      summary: 'Waiting for AI response'
    },
    {
      attempt: 1,
      phase: 'provider' as const,
      summary: 'Running a tool',
      tool: 'private_internal_tool',
      toolStatus: 'running' as const
    }
  ]) {
    const projection = projectAiActivity([update])
    expect(projection.current.label).toBe('Working on your request')
    expect(projection.current).toBe(projection.entries.at(-1))
  }
})

it('starts elapsed time at zero without inventing a minimum duration', () => {
  for (const duration of [-1, 0, 1, 24, 49]) {
    expect(formatElapsedTime(duration)).toBe('0s')
  }
  expect(formatElapsedTime(100)).toBe('0.1s')
  expect(formatElapsedTime(1250)).toBe('1.3s')
})
