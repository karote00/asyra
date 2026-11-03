import { AiActionNames } from '../constants/ai-actions'

export const evaluationReportExplanation =
  'Evaluation self-report - not artwork acceptance'

const reportRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

/** Project existing settled evidence; never retain another copy or certify artwork. */
export const projectEvaluationReport = (turn: {
  readonly turnId: string
  readonly outcome: string
  readonly result: unknown
}) => {
  const result = reportRecord(turn.result)
  const preview = reportRecord(result?.preview)
  const transaction = reportRecord(result?.transaction)

  if (
    turn.outcome === 'failed' ||
    turn.outcome === 'cancelled' ||
    !turn.turnId ||
    result?.status !== 'executed' ||
    transaction?.status !== 'committed' ||
    typeof result.recordingId !== 'string' ||
    !result.recordingId.trim() ||
    preview?.batchId !== result.batchId ||
    preview?.explanation !== evaluationReportExplanation ||
    !Array.isArray(preview.actions) ||
    preview.actions.length !== 1 ||
    !Array.isArray(result.actionResults)
  ) {
    return
  }

  const action = reportRecord(preview.actions[0])

  if (
    action?.name !== AiActionNames.REPORT_OUTCOME ||
    typeof action.id !== 'string'
  ) {
    return
  }

  // Runtime appends the final batch receipts after all earlier acknowledged work.
  const receipt = reportRecord(result.actionResults.at(-1))
  const value = reportRecord(receipt?.result)
  const outcome = reportRecord(value?.toolOutcome)

  if (
    receipt?.actionId !== action.id ||
    receipt?.actionName !== action.name ||
    value?.action !== action.name ||
    value.status !== 'no-change' ||
    value.outcome !== 'unsupported' ||
    (outcome &&
      (outcome.status !== 'success' || outcome.settlement !== 'completed')) ||
    typeof value.message !== 'string' ||
    !value.message.trim() ||
    value.message.length > 1000
  ) {
    return
  }

  return {
    attribution: 'model-self-report' as const,
    sourceRequestId: result.recordingId,
    turnId: turn.turnId,
    text: value.message
  }
}

/** Explicit local evaluation policy; absent configuration leaves ordinary work unchanged. */
export interface EvaluationWindow {
  readonly workDeadlineAt: number
  /** Null waits for native report completion without a duration limit. */
  readonly reportTimeoutMs: number | null
  readonly expandedNodeLimit?: 2000
  readonly announceWorkDeadline?: boolean
  readonly reportInstructions?: string
}

export const readEvaluationWindow = (
  value: unknown
): EvaluationWindow | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid evaluation window')
  }

  const {
    workDeadlineAt,
    reportTimeoutMs,
    expandedNodeLimit,
    announceWorkDeadline,
    reportInstructions
  } = value as EvaluationWindow

  if (
    (announceWorkDeadline !== undefined &&
      typeof announceWorkDeadline !== 'boolean') ||
    (reportInstructions !== undefined &&
      (typeof reportInstructions !== 'string' ||
        !reportInstructions.trim() ||
        reportInstructions.length > 8000)) ||
    (expandedNodeLimit !== undefined && expandedNodeLimit !== 2000) ||
    !Number.isSafeInteger(workDeadlineAt) ||
    workDeadlineAt <= 0 ||
    (reportTimeoutMs !== null &&
      (!Number.isSafeInteger(reportTimeoutMs) ||
        reportTimeoutMs <= 0 ||
        reportTimeoutMs > 300000)) ||
    workDeadlineAt > Date.now() + 900000
  ) {
    throw new Error('Invalid evaluation window')
  }

  return {
    workDeadlineAt,
    reportTimeoutMs,
    ...(announceWorkDeadline === undefined ? {} : { announceWorkDeadline }),
    ...(reportInstructions === undefined ? {} : { reportInstructions }),
    ...(expandedNodeLimit === undefined ? {} : { expandedNodeLimit })
  }
}
