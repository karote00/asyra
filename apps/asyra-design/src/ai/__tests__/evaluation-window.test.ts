import { describe, expect, it } from 'vitest'
import {
  evaluationReportExplanation,
  projectEvaluationReport
} from '../evaluation-window'

const admitted = () => ({
  turnId: 'conversation:turn:1',
  outcome: 'partial',
  result: {
    status: 'executed',
    recordingId: 'request-1',
    batchId: 'report-batch',
    transaction: { status: 'committed' },
    preview: {
      batchId: 'report-batch',
      explanation: evaluationReportExplanation,
      actions: [{ id: 'report', name: 'report_outcome' }]
    },
    actionResults: [
      {
        actionId: 'draw',
        actionName: 'apply_prepared_design',
        result: { status: 'complete' }
      },
      {
        actionId: 'report',
        actionName: 'report_outcome',
        result: {
          action: 'report_outcome',
          status: 'no-change',
          outcome: 'unsupported',
          message: 'Partial drawing; cause unconfirmed.'
        }
      }
    ]
  }
})

describe('settled evaluation report projection', () => {
  it('uses the final acknowledged report and preserves earlier successful work', () => {
    const turn = admitted()
    const before = structuredClone(turn)
    expect(projectEvaluationReport(turn)).toEqual({
      attribution: 'model-self-report',
      sourceRequestId: 'request-1',
      turnId: turn.turnId,
      text: 'Partial drawing; cause unconfirmed.'
    })
    expect(turn).toEqual(before)
  })

  it('accepts a final report when an earlier batch legally reused the action ID', () => {
    const turn = admitted()
    turn.result.actionResults[0].actionId = 'report'
    expect(projectEvaluationReport(turn)?.text).toBe(
      'Partial drawing; cause unconfirmed.'
    )
  })
  it.each([
    [
      'failed',
      (v: ReturnType<typeof admitted>) => {
        v.result.status = 'failed'
      }
    ],
    [
      'cancelled',
      (v: ReturnType<typeof admitted>) => {
        v.outcome = 'cancelled'
      }
    ],
    [
      'rolled back',
      (v: ReturnType<typeof admitted>) => {
        v.result.transaction.status = 'rolled-back'
      }
    ],
    [
      'ordinary',
      (v: ReturnType<typeof admitted>) => {
        v.result.preview.explanation = 'Ordinary response'
      }
    ],
    [
      'request missing',
      (v: ReturnType<typeof admitted>) => {
        v.result.recordingId = ''
      }
    ],
    [
      'wrong batch',
      (v: ReturnType<typeof admitted>) => {
        v.result.preview.batchId = 'old'
      }
    ],
    [
      'wrong action',
      (v: ReturnType<typeof admitted>) => {
        v.result.preview.actions[0].id = 'missing'
      }
    ],
    [
      'drawing preview',
      (v: ReturnType<typeof admitted>) => {
        v.result.preview.actions[0].name = 'apply_prepared_design'
      }
    ],
    [
      'extra preview',
      (v: ReturnType<typeof admitted>) => {
        v.result.preview.actions.push(v.result.preview.actions[0])
      }
    ],
    [
      'missing receipt',
      (v: ReturnType<typeof admitted>) => {
        v.result.actionResults.pop()
      }
    ],
    [
      'trailing non-report receipt',
      (v: ReturnType<typeof admitted>) => {
        v.result.actionResults.push(v.result.actionResults[0])
      }
    ],
    [
      'failed receipt',
      (v: ReturnType<typeof admitted>) => {
        v.result.actionResults[1].result.status = 'failed'
      }
    ],
    [
      'blank report',
      (v: ReturnType<typeof admitted>) => {
        v.result.actionResults[1].result.message = ' '
      }
    ],
    [
      'oversize report',
      (v: ReturnType<typeof admitted>) => {
        v.result.actionResults[1].result.message = 'x'.repeat(1001)
      }
    ]
  ])('does not certify %s as report evidence', (_name, alter) => {
    const turn = admitted()
    alter(turn)
    expect(projectEvaluationReport(turn)).toBeUndefined()
  })
})
