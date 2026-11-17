import { activityToolLabels } from './activity-state'
export { createAiActivityProjection, projectAiActivity } from './activity-state'
import type { AiConversationOutcome, AiSettledTurn } from './conversation'
import { AiActionNames, AiDrawingDetailOptionIds } from '../constants'

export interface AiTurnSummary {
  readonly storageNotice?: string
  readonly durationLabel: string
  readonly message: string
  readonly outcome: AiConversationOutcome
}

export type AiDrawingDetailOptionId =
  (typeof AiDrawingDetailOptionIds)[keyof typeof AiDrawingDetailOptionIds]

export interface AiDrawingDetailChoice {
  readonly description: string
  readonly id: AiDrawingDetailOptionId
  readonly label: string
  readonly resourceWarning: string | null
}

export interface AiDrawingDetailChoiceProjection {
  readonly choices: readonly AiDrawingDetailChoice[]
  readonly kind: 'drawing-detail'
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const DRAWING_DETAIL_CHOICE_PROJECTION: AiDrawingDetailChoiceProjection =
  Object.freeze({
    choices: Object.freeze([
      Object.freeze({
        description: 'Faster and lighter for editing.',
        id: AiDrawingDetailOptionIds.BALANCED,
        label: 'Balanced detail',
        resourceWarning: null
      }),
      Object.freeze({
        description:
          'Preserves more detail with potentially more editable shapes.',
        id: AiDrawingDetailOptionIds.MAXIMUM,
        label: 'Maximum detail',
        resourceWarning:
          'May temporarily use much more memory and reduce app responsiveness.'
      })
    ]),
    kind: 'drawing-detail'
  })

export const projectAiDrawingDetailChoice = (
  turn: AiSettledTurn
): AiDrawingDetailChoiceProjection | null => {
  return turn.question?.kind === 'drawing-detail'
    ? DRAWING_DETAIL_CHOICE_PROJECTION
    : null
}

const partialCounts = (
  result: unknown
): {
  applied: number
  skipped: number
} => {
  if (!isPlainObject(result) || !Array.isArray(result.actionResults)) {
    return {
      applied: 0,
      skipped: 0
    }
  }
  return result.actionResults.reduce(
    (counts, action) => {
      if (!isPlainObject(action) || !isPlainObject(action.result)) {
        return counts
      }
      return {
        applied:
          counts.applied +
          (Array.isArray(action.result.appliedElementIds)
            ? action.result.appliedElementIds.length
            : 0),
        skipped:
          counts.skipped +
          (Array.isArray(action.result.skipped)
            ? action.result.skipped.length
            : 0)
      }
    },
    {
      applied: 0,
      skipped: 0
    }
  )
}

export const formatElapsedTime = (durationMs: number): string => {
  const seconds = Math.max(0, durationMs) / 1_000
  if (seconds < 0.05) return '0s'
  if (seconds < 10) {
    return `${seconds.toFixed(1)}s`
  }

  const roundedSeconds = Math.round(seconds)
  if (roundedSeconds < 60) {
    return `${roundedSeconds}s`
  }

  const minutes = Math.floor(roundedSeconds / 60)
  const remainingSeconds = roundedSeconds % 60
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`
  }

  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m ${remainingSeconds}s`
}

export const summarizeAiTurn = (turn: AiSettledTurn): AiTurnSummary => {
  if (turn.protocolDiagnostic)
    return Object.freeze({
      message: turn.protocolDiagnostic,
      durationLabel: formatElapsedTime(turn.durationMs),
      outcome: turn.outcome
    })
  const executionReason =
    isPlainObject(turn.result) &&
    turn.result.stage === 'execution' &&
    turn.result.code === 'AI_EXECUTION_FAILED' &&
    typeof turn.result.message === 'string' &&
    turn.result.message.length <= 1000 &&
    turn.result.message !== 'AI action execution failed.'
      ? ` ${turn.result.message}`
      : ''
  let message = 'The request failed. Review the canvas before trying again.'
  if (isPlainObject(turn.result) && turn.result.stage === 'provider') {
    message = 'Could not complete the AI request. Your drawing is unchanged.'
    if (turn.result.code === 'AI_PROVIDER_INVALID_CONFIGURATION')
      message =
        'The AI provider is unavailable or not configured. Your drawing is unchanged.'
    if (
      turn.result.message ===
      'Image conversion failed. Your drawing is unchanged.'
    )
      message = turn.result.message
    if (turn.result.code === 'AI_PROVIDER_TIMEOUT')
      message = 'The request timed out before any changes were applied.'
    if (turn.result.code === 'AI_PROVIDER_TRANSPORT_FAILED')
      message = 'The AI connection was interrupted. Your drawing is unchanged.'
    if (turn.result.code === 'AI_PROVIDER_MALFORMED_RESPONSE')
      message =
        'The AI returned an invalid drawing response. Your drawing is unchanged.'
  }
  if (
    isPlainObject(turn.result) &&
    isPlainObject(turn.result.transaction) &&
    turn.result.transaction.status === 'unknown'
  ) {
    return Object.freeze({
      durationLabel: formatElapsedTime(turn.durationMs),
      message:
        'The request stopped, but its final change state could not be confirmed. Review the canvas before continuing.',
      outcome: turn.outcome
    })
  }
  if (
    isPlainObject(turn.result) &&
    isPlainObject(turn.result.transaction) &&
    turn.result.transaction.status === 'rolled-back'
  ) {
    return Object.freeze({
      durationLabel: formatElapsedTime(turn.durationMs),
      message:
        turn.outcome === 'cancelled'
          ? 'The request was stopped. All changes from this request were rolled back.'
          : `The request could not be completed.${executionReason} All changes from this request were rolled back.`,
      outcome: turn.outcome
    })
  }
  if (
    isPlainObject(turn.result) &&
    turn.result.status === 'failed' &&
    isPlainObject(turn.result.transaction) &&
    turn.result.transaction.status === 'committed'
  ) {
    const label =
      typeof turn.result.failedAction === 'string' &&
      Object.hasOwn(activityToolLabels, turn.result.failedAction)
        ? activityToolLabels[turn.result.failedAction]
        : 'The remaining work'
    return Object.freeze({
      durationLabel: formatElapsedTime(turn.durationMs),
      outcome: turn.outcome,
      message: `${label} could not be completed.${executionReason} Changes already applied have been kept.`
    })
  }
  if (
    isPlainObject(turn.result) &&
    turn.result.status === 'cancelled' &&
    isPlainObject(turn.result.transaction) &&
    turn.result.transaction.status === 'committed'
  ) {
    return Object.freeze({
      durationLabel: formatElapsedTime(turn.durationMs),
      outcome: turn.outcome,
      message:
        'The request was stopped. Changes already applied have been kept.'
    })
  }
  const reported =
    isPlainObject(turn.result) &&
    turn.result.status === 'executed' &&
    Array.isArray(turn.result.actionResults)
      ? turn.result.actionResults.findLast(
          (entry: unknown) =>
            isPlainObject(entry) &&
            entry.actionName === AiActionNames.REPORT_OUTCOME
        )
      : undefined
  if (
    isPlainObject(reported) &&
    isPlainObject(reported.result) &&
    typeof reported.result.message === 'string' &&
    reported.result.message.length <= 1000
  ) {
    let storageNotice: string | undefined
    if (
      reported.result.outcome === 'completed' &&
      isPlainObject(reported.result.persistence)
    ) {
      const status = reported.result.persistence.status
      if (status === 'unavailable')
        storageNotice =
          'Saving could not be confirmed. Resolve document storage before closing.'
      if (status === 'local-only')
        storageNotice = 'Durable document storage is not connected.'
    }
    let disposition = ''
    if (reported.result.outcome === 'unsupported') {
      disposition =
        turn.outcome === 'partial' ? '' : '\n\nNo canvas changes were made.'
    }
    return Object.freeze({
      durationLabel: formatElapsedTime(turn.durationMs),
      message: reported.result.message + disposition,
      ...(storageNotice ? { storageNotice } : {}),
      outcome: turn.outcome
    })
  }
  const question = projectAiQuestion(turn)
  if (question) {
    message = question.message
  } else if (turn.outcome === 'success') {
    const counts = partialCounts(turn.result)
    message =
      counts.applied > 0
        ? `Updated ${counts.applied} editable element${counts.applied === 1 ? '' : 's'}.`
        : 'The requested changes are complete.'
    if (
      isPlainObject(turn.result) &&
      isPlainObject(turn.result.preview) &&
      typeof turn.result.preview.explanation === 'string' &&
      turn.result.preview.explanation.length <= 1000
    ) {
      message = `${turn.result.preview.explanation}\n\n${message}`
    }
  } else if (turn.outcome === 'partial') {
    const counts = partialCounts(turn.result)
    message = `Partially updated the drawing: ${counts.applied} applied, ${counts.skipped} skipped.`
  } else if (turn.outcome === 'no-change') {
    message = 'No canvas changes were needed.'
  } else if (turn.outcome === 'cancelled') {
    message = 'The request was cancelled.'
  }
  return Object.freeze({
    durationLabel: formatElapsedTime(turn.durationMs),
    message,
    outcome: turn.outcome
  })
}

export const projectAiQuestion = (
  turn: AiSettledTurn
): {
  readonly message: string
  readonly choices: readonly AiDrawingDetailChoice[]
} | null => {
  if (!turn.question) return null
  return {
    message: turn.question.message,
    choices:
      turn.question.kind === 'drawing-detail'
        ? DRAWING_DETAIL_CHOICE_PROJECTION.choices
        : []
  }
}
