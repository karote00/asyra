import { AiDesignToolIds } from '../constants/ai-design'
import {
  AiReferenceToolIds,
  AiResearchActivityIds
} from '../constants/ai-research'
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
    const reason =
      turn.result.stage === 'execution' &&
      turn.result.code === 'AI_EXECUTION_FAILED' &&
      typeof turn.result.message === 'string' &&
      turn.result.message.length <= 1000 &&
      turn.result.message !== 'AI action execution failed.'
        ? ` ${turn.result.message}`
        : ''
    return Object.freeze({
      durationLabel: formatElapsedTime(turn.durationMs),
      outcome: turn.outcome,
      message: `${label} could not be completed.${reason} Changes already applied have been kept.`
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
        turn.outcome === 'partial' ? '' : '\n\nNo canvas changes were made.'
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
  [AiDesignToolIds.PREPARE_DESIGN]: 'Preparing the design',
  [AiDesignToolIds.RECORD_DESIGN_REVIEW]: 'Checking the requested details',
  [AiActionNames.APPLY_PREPARED_DESIGN]: 'Adding the design',
  [AiResearchActivityIds.RESEARCH_DESIGN_CONTEXT]: 'Researching design context',
  [AiReferenceToolIds.SEARCH_REFERENCE_IMAGES]: 'Finding a reference',
  [AiReferenceToolIds.IMPORT_REFERENCE_IMAGE]: 'Preparing the reference',
  [AiActionNames.ORGANIZE_DESIGN]: 'Organizing layers',
  [AiActionNames.ARRANGE_DESIGN]: 'Arranging the design',
  [AiActionNames.REVIEW_DESIGN]: 'Checking the layout',
  [AiActionNames.UPDATE_DESIGN_ELEMENT]: 'Refining the design',
  [AiActionNames.READ_DESIGN_CONTEXT]: 'Reading the design',
  [AiActionNames.INSPECT_DRAWING]: 'Reviewing the drawing',
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
      : 'Planning the drawing'
    return update.toolStatus === 'running' ? tool : 'Reviewing the results'
  }
  switch (update.phase) {
    case 'context':
      return 'Reviewing the drawing'
    case 'provider':
      return 'Planning the drawing'
    case 'resolution':
      return 'Reviewing the planned changes'
    case 'permission':
      return 'Checking whether changes can be applied'
    case 'confirmation':
      return 'Awaiting approval'
    case 'execution': {
      const summary = update.summary.trim()
      if (
        summary.length <= 100 &&
        /^[\x20-\x7e]+$/.test(summary) &&
        ![
          'Applying changes',
          'Updating the drawing',
          'Preparing the drawing'
        ].includes(summary)
      )
        return summary
      return update.tool && Object.hasOwn(activityToolLabels, update.tool)
        ? activityToolLabels[update.tool]
        : 'Preparing the drawing'
    }
    case 'settled':
      if (update.outcome === 'failed') return 'Failed'
      if (update.outcome === 'cancelled') return 'Stopped'
      return 'Finished'
  }
}

const activityLoopLabel = (tool: string | undefined): string | undefined => {
  if (
    [
      AiResearchActivityIds.RESEARCH_DESIGN_CONTEXT,
      AiReferenceToolIds.SEARCH_REFERENCE_IMAGES,
      AiReferenceToolIds.IMPORT_REFERENCE_IMAGE
    ].includes(tool as never)
  )
    return 'Researching design context'
  if (
    [
      AiDesignToolIds.PREPARE_DESIGN,
      AiDesignToolIds.RECORD_DESIGN_REVIEW,
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
      AiActionNames.INSERT_VECTOR_COMPOSITION,
      AiActionNames.REPLACE_VECTOR_COMPOSITION
    ].includes(tool as never)
  )
    return 'Drawing and refining'
}

/** One projection per turn render; the current entry is shared with the history. */
export const projectAiActivity = (
  updates: readonly AiRuntimeProgressUpdate[],
  state: {
    readonly stopping?: boolean
    readonly awaitingAnswer?: boolean
    readonly awaitingApproval?: boolean
    readonly outcome?: AiConversationOutcome
  } = {}
) => {
  const entries: { label: string; message?: string }[] = []
  let loop: string | undefined
  for (const update of updates) {
    if (state.awaitingAnswer && update.phase === 'settled') continue
    // Preserve model-authored language while keeping status descriptions bounded.
    const message = update.message?.trim()
    const activityMessage =
      message && message.length <= 100 ? message : undefined
    // Completion is an acknowledgement, not a new user-facing work phase.
    if (update.toolStatus === 'completed' && !activityMessage) continue
    if (
      loop &&
      ['resolution', 'permission', 'execution'].includes(update.phase)
    )
      continue
    loop =
      update.phase === 'provider' ? activityLoopLabel(update.tool) : undefined
    const entry = {
      label: loop ?? activityLabel(update),
      ...(!loop && activityMessage ? { message: activityMessage } : {})
    }
    const previous = entries.at(-1)
    if (previous?.label !== entry.label || previous.message !== entry.message) {
      entries.push(entry)
    }
  }
  let terminalLabel: string | undefined
  if (state.awaitingAnswer) {
    terminalLabel = undefined
  } else if (state.outcome) {
    terminalLabel = 'Finished'
    if (state.outcome === 'partial')
      terminalLabel =
        entries.at(-1)?.label === 'Failed' ? 'Failed' : 'Partially completed'
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
