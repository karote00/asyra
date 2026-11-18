import { isRecord } from '@asyra/utils'
import { AiActionNames, AiDrawingDetailOptionIds } from '../constants'

/** Read the terminal control result, independently of earlier canvas work. */
export const readConversationQuestion = (
  result: unknown,
  interrupted = false
) => {
  if (
    interrupted ||
    !isRecord(result) ||
    result.status !== 'executed' ||
    !Array.isArray(result.actionResults)
  ) {
    return null
  }

  const terminals = result.actionResults.filter(
    (entry: unknown) =>
      isRecord(entry) &&
      [
        AiActionNames.REQUEST_CLARIFICATION,
        AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
        AiActionNames.REPORT_OUTCOME
      ].some((name) => name === entry.actionName)
  )
  const entry: unknown = terminals[0]

  if (
    terminals.length !== 1 ||
    entry !== result.actionResults.at(-1) ||
    !isRecord(entry) ||
    !isRecord(entry.result)
  ) {
    return null
  }

  const value = entry.result

  if (
    value.action !== entry.actionName ||
    value.status !== 'no-change' ||
    !isRecord(value.clarification)
  ) {
    return null
  }

  const clarification = value.clarification

  if (
    entry.actionName === AiActionNames.REQUEST_CLARIFICATION &&
    clarification.kind === 'question' &&
    typeof clarification.question === 'string' &&
    clarification.question.trim() &&
    Array.from(clarification.question).length <= 1000
  ) {
    return Object.freeze({
      kind: 'question' as const,
      message: clarification.question
    })
  }

  if (
    entry.actionName === AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE &&
    clarification.kind === 'drawing-detail' &&
    Array.isArray(clarification.optionIds) &&
    clarification.optionIds.length === 2 &&
    clarification.optionIds[0] === AiDrawingDetailOptionIds.BALANCED &&
    clarification.optionIds[1] === AiDrawingDetailOptionIds.MAXIMUM
  ) {
    return Object.freeze({
      kind: 'drawing-detail' as const,
      message: 'Choose a drawing detail level.'
    })
  }

  return null
}
