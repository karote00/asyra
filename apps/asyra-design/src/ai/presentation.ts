import type { AiRuntimeProgressUpdate } from '@asyra/ai-agent-runtime'
import type { AiConversationOutcome, AiSettledTurn } from './conversation'
import { AiActionNames, AiDrawingDetailOptionIds } from '../constants'

export interface AiTurnSummary {
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
  if (
    turn.outcome !== 'no-change' ||
    !isPlainObject(turn.result) ||
    turn.result.status !== 'executed' ||
    !Array.isArray(turn.result.actionResults) ||
    turn.result.actionResults.length !== 1
  ) {
    return null
  }
  const actionResult = turn.result.actionResults[0]
  if (
    !isPlainObject(actionResult) ||
    actionResult.actionName !== AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE ||
    !isPlainObject(actionResult.result)
  ) {
    return null
  }
  const result = actionResult.result
  if (
    result.action !== AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE ||
    result.status !== 'no-change' ||
    !isPlainObject(result.clarification) ||
    result.clarification.kind !== 'drawing-detail' ||
    !Array.isArray(result.clarification.optionIds) ||
    result.clarification.optionIds.length !== 2 ||
    result.clarification.optionIds[0] !== AiDrawingDetailOptionIds.BALANCED ||
    result.clarification.optionIds[1] !== AiDrawingDetailOptionIds.MAXIMUM
  ) {
    return null
  }
  return DRAWING_DETAIL_CHOICE_PROJECTION
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
  if (seconds < 10) {
    return `Elapsed ${Math.max(0.1, seconds).toFixed(1)}s`
  }

  const roundedSeconds = Math.round(seconds)
  if (roundedSeconds < 60) {
    return `Elapsed ${roundedSeconds}s`
  }

  const minutes = Math.floor(roundedSeconds / 60)
  const remainingSeconds = roundedSeconds % 60
  if (minutes < 60) {
    return `Elapsed ${minutes}m ${remainingSeconds}s`
  }

  const hours = Math.floor(minutes / 60)
  return `Elapsed ${hours}h ${minutes % 60}m ${remainingSeconds}s`
}

export const summarizeAiTurn = (turn: AiSettledTurn): AiTurnSummary => {
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
        'The request stopped, but its changes could not be fully rolled back. Review the canvas before continuing.',
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
          : 'The request could not be completed. All changes from this request were rolled back.',
      outcome: turn.outcome
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
    let disposition = ''
    if (reported.result.outcome === 'unsupported') {
      disposition =
        turn.outcome === 'partial'
          ? '\n\nEarlier changes are kept. You can undo this request.'
          : '\n\nNo canvas changes were made.'
    }
    return Object.freeze({
      durationLabel: formatElapsedTime(turn.durationMs),
      message: reported.result.message + disposition,
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

/** Only pre-execution failures are admitted for replay. Unknown transaction state is never guessed. */
export const canRetryAiTurn = (turn: AiSettledTurn): boolean => {
  if (turn.outcome !== 'failed' && turn.outcome !== 'cancelled') return false
  if (!isPlainObject(turn.result)) return false
  if (
    isPlainObject(turn.result.transaction) &&
    turn.result.transaction.status === 'unknown'
  )
    return false
  return [
    'context',
    'provider',
    'resolution',
    'permission',
    'confirmation'
  ].includes(String(turn.result.stage))
}

const activityToolLabels: Readonly<Record<string, string>> = Object.freeze({
  vtracer: 'Converting artwork to vectors',
  [AiActionNames.INSERT_VECTOR_COMPOSITION]: 'Adding the drawing',
  [AiActionNames.REPLACE_VECTOR_COMPOSITION]: 'Replacing the drawing',
  [AiActionNames.REMOVE_AI_COMPOSITION]: 'Removing the drawing',
  [AiActionNames.SET_ELEMENT_VISIBILITY]: 'Adjusting element visibility',
  [AiActionNames.SELECT_ELEMENTS]: 'Selecting elements',
  [AiActionNames.UPDATE_COMPOSITION_ELEMENTS]: 'Refining the drawing'
})

const activityLabel = (update: AiRuntimeProgressUpdate): string => {
  if (update.tool && update.toolStatus) {
    const tool = Object.hasOwn(activityToolLabels, update.tool)
      ? activityToolLabels[update.tool]
      : 'Working on your request'
    return update.toolStatus === 'running' ? tool : 'Reviewing the results'
  }
  switch (update.phase) {
    case 'context':
      return 'Reviewing the drawing'
    case 'provider':
      return 'Working on your request'
    case 'resolution':
      return 'Reviewing the planned changes'
    case 'permission':
      return 'Checking whether changes can be applied'
    case 'confirmation':
      return 'Awaiting approval'
    case 'execution':
      return 'Applying changes'
    case 'settled':
      if (update.outcome === 'failed') return 'Failed'
      if (update.outcome === 'cancelled') return 'Stopped'
      return 'Finished'
  }
}

/** One projection per turn render; the current entry is shared with the history. */
export const projectAiActivity = (
  updates: readonly AiRuntimeProgressUpdate[],
  state: {
    readonly stopping?: boolean
    readonly awaitingApproval?: boolean
    readonly outcome?: AiConversationOutcome
  } = {}
) => {
  const entries: { label: string; message?: string }[] = updates.map(
    (update) => ({
      label: activityLabel(update),
      ...(update.message ? { message: update.message } : {})
    })
  )
  let terminalLabel: string | undefined
  if (state.outcome) {
    terminalLabel = 'Finished'
    if (state.outcome === 'failed') terminalLabel = 'Failed'
    if (state.outcome === 'cancelled') terminalLabel = 'Stopped'
  } else if (state.stopping) {
    terminalLabel = 'Stopping…'
  } else if (state.awaitingApproval) {
    terminalLabel = 'Awaiting approval'
  }
  if (terminalLabel && entries.at(-1)?.label !== terminalLabel)
    entries.push({ label: terminalLabel })
  if (!entries.length) entries.push({ label: 'Starting request' })
  return { entries, current: entries[entries.length - 1] }
}

export const projectAiQuestion = (
  turn: AiSettledTurn
): {
  readonly message: string
  readonly choices: readonly AiDrawingDetailChoice[]
} | null => {
  const detail = projectAiDrawingDetailChoice(turn)
  if (detail)
    return {
      message: 'Choose a drawing detail level.',
      choices: detail.choices
    }
  if (
    turn.outcome !== 'no-change' ||
    !isPlainObject(turn.result) ||
    !Array.isArray(turn.result.actionResults) ||
    turn.result.actionResults.length !== 1
  )
    return null
  const action = turn.result.actionResults[0]
  if (
    !isPlainObject(action) ||
    action.actionName !== AiActionNames.REQUEST_CLARIFICATION ||
    !isPlainObject(action.result) ||
    !isPlainObject(action.result.clarification)
  )
    return null
  const { question, kind } = action.result.clarification
  if (
    kind !== 'question' ||
    typeof question !== 'string' ||
    !question.trim() ||
    question.length > 1000
  )
    return null
  return { message: question, choices: [] }
}
