import { describe, expect, it } from 'vitest'
import { projectAiDrawingDetailChoice, summarizeAiTurn } from '../presentation'
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
      Array.from({ length: 5 }, () => 'Elapsed 1.3s')
    )
    expect(
      summarizeAiTurn({
        ...turn('success'),
        durationMs: 40_500
      }).durationLabel
    ).toBe('Elapsed 41s')
    expect(
      summarizeAiTurn({
        ...turn('success'),
        durationMs: 65_000
      }).durationLabel
    ).toBe('Elapsed 1m 5s')
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
