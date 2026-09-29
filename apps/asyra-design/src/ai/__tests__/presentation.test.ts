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
  it('explains a failed refinement with retained changes without offering replay', () => {
    const failed = {
      ...turn('partial'),
      result: {
        status: 'failed',
        stage: 'execution',
        failedAction: AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
        transaction: { status: 'committed' }
      }
    }
    expect(summarizeAiTurn(failed).message).toBe(
      'Refining the drawing could not be completed. Changes already applied have been kept.'
    )
    expect(canRetryAiTurn(failed)).toBe(false)
  })

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
  it('keeps one entry per research or drawing loop and preserves phase transitions', () => {
    const tool = (name: string, toolStatus: 'running' | 'completed') => ({
      attempt: 1,
      phase: 'provider' as const,
      tool: name,
      toolStatus,
      summary: 'Tool'
    })
    const updates = [
      tool('research_design_context', 'running'),
      tool('research_design_context', 'completed'),
      tool('search_reference_images', 'running'),
      tool('search_reference_images', 'completed'),
      tool('import_reference_image', 'running'),
      tool('import_reference_image', 'completed'),
      tool('prepare_design', 'running'),
      tool('prepare_design', 'completed'),
      tool('inspect_drawing', 'running'),
      tool('inspect_drawing', 'completed'),
      { attempt: 1, phase: 'resolution' as const, summary: 'Resolve' },
      { attempt: 1, phase: 'permission' as const, summary: 'Check' },
      tool('update_design_element', 'running'),
      tool('update_design_element', 'completed'),
      tool('review_design', 'running'),
      tool('research_design_context', 'running')
    ]
    expect(projectAiActivity(updates).entries).toEqual([
      { label: 'Researching design context' },
      { label: 'Drawing and refining' },
      { label: 'Researching design context' }
    ])
    expect(updates).toHaveLength(16)
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
      'Converting artwork to vectors'
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
        message: 'Hiding the mark'
      }
    ]
    const projection = projectAiActivity(updates)
    expect(projection.current).toMatchObject({
      label: 'Adjusting element visibility',
      message: 'Hiding the mark'
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
    expect(projection.current.label).toBe('Planning the drawing')
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

it('shows concise execution descriptions instead of Applying changes', () => {
  for (const summary of ['Smoothing the outlines', 'Reshaping the tail']) {
    expect(
      projectAiActivity([
        {
          attempt: 1,
          phase: 'execution',
          summary,
          tool: AiActionNames.UPDATE_COMPOSITION_ELEMENTS
        }
      ]).current.label
    ).toBe(summary)
  }
  for (const summary of [
    'Applying changes',
    'Updating the drawing',
    '調整尾巴'
  ]) {
    expect(
      projectAiActivity([
        {
          attempt: 1,
          phase: 'execution',
          summary,
          tool: AiActionNames.UPDATE_COMPOSITION_ELEMENTS
        }
      ]).current.label
    ).toBe('Refining the drawing')
  }
})

it('names design preparation and application without exposing backend identifiers', () => {
  for (const [tool, label] of [
    ['prepare_design', 'Drawing and refining'],
    ['apply_prepared_design', 'Drawing and refining']
  ]) {
    const projection = projectAiActivity([
      {
        phase: 'provider',
        summary: 'Running a tool',
        tool,
        toolStatus: 'running'
      }
    ])
    expect(projection.current.label).toBe(label)
  }
})

it('preserves model operation messages regardless of language', () => {
  const updates = [
    {
      attempt: 1,
      phase: 'provider' as const,
      tool: 'read_design_context',
      toolStatus: 'running' as const,
      summary: '讀取目前選取',
      message: '讀取目前選取'
    }
  ]
  const result = projectAiActivity(updates)
  expect(result.entries).toEqual([
    { label: 'Reading the design', message: '讀取目前選取' }
  ])
  expect(updates[0].message).toBe('讀取目前選取')
})

it('does not append Finished after a failed execution retained partial progress', () => {
  const result = projectAiActivity(
    [
      {
        attempt: 1,
        phase: 'execution',
        tool: AiActionNames.REPLACE_VECTOR_COMPOSITION,
        summary: 'Replacing the drawing'
      },
      { attempt: 1, phase: 'settled', outcome: 'failed', summary: 'Failed' }
    ],
    { outcome: 'partial' }
  )
  expect(result.entries.map((entry) => entry.label)).toEqual([
    'Replacing the drawing',
    'Failed'
  ])
})

it('explains the actual failed step with the safe public reason and recovery', () => {
  expect(
    summarizeAiTurn({
      ...turn('partial'),
      result: {
        status: 'failed',
        stage: 'execution',
        code: 'AI_EXECUTION_FAILED',
        failedAction: AiActionNames.REPLACE_VECTOR_COMPOSITION,
        message:
          'The revision target no longer exists. Select the drawing again.',
        transaction: { status: 'committed' }
      }
    }).message
  ).toBe(
    'Replacing the drawing could not be completed. The revision target no longer exists. Select the drawing again. Changes already applied have been kept.'
  )
})
