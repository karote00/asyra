import { AiActionNames, AiDrawingDetailOptionIds } from '../constants'

export type AiConversationQuestion =
  | { readonly kind: 'question'; readonly message: string }
  | { readonly kind: 'drawing-detail'; readonly message: string }

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Invocation settlement owns question admission; display text never does. */
export const interpretAiConversationResult = (
  result: unknown,
  interrupted = false
) => {
  let authoredReply: string | null = null
  let question: AiConversationQuestion | null = null
  let protocolDiagnostic: string | null = null
  if (
    !interrupted &&
    record(result) &&
    result.status === 'executed' &&
    Array.isArray(result.actionResults)
  ) {
    const terminals = result.actionResults.filter(
      (entry: unknown) =>
        record(entry) &&
        (entry.actionName === AiActionNames.REQUEST_CLARIFICATION ||
          entry.actionName === AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE ||
          entry.actionName === AiActionNames.REPORT_OUTCOME)
    )
    if (terminals.length > 1)
      return Object.freeze({
        question: null,
        authoredReply: null,
        protocolDiagnostic:
          'The AI returned inconsistent terminal replies. Review the result before continuing.'
      })
    const reported = terminals.find(
      (entry: Record<string, unknown>) =>
        entry.actionName === AiActionNames.REPORT_OUTCOME
    )
    if (
      reported &&
      record(reported.result) &&
      typeof reported.result.message === 'string' &&
      reported.result.message.length <= 1000
    )
      authoredReply = reported.result.message
    const entry = terminals.find(
      (entry: Record<string, unknown>) =>
        entry.actionName !== AiActionNames.REPORT_OUTCOME
    )
    if (entry) {
      const value = entry.result
      const clarification = record(value) ? value.clarification : undefined
      if (
        terminals.length === 1 &&
        result.actionResults.at(-1) === entry &&
        record(value) &&
        value.status === 'no-change' &&
        record(clarification)
      ) {
        if (
          entry.actionName === AiActionNames.REQUEST_CLARIFICATION &&
          clarification.kind === 'question' &&
          typeof clarification.question === 'string' &&
          clarification.question.trim() &&
          clarification.question.length <= 1000
        )
          question = Object.freeze({
            kind: 'question',
            message: clarification.question
          })
        if (
          entry.actionName === AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE &&
          value.action === AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE &&
          clarification.kind === 'drawing-detail' &&
          Array.isArray(clarification.optionIds) &&
          clarification.optionIds.length === 2 &&
          clarification.optionIds[0] === AiDrawingDetailOptionIds.BALANCED &&
          clarification.optionIds[1] === AiDrawingDetailOptionIds.MAXIMUM
        )
          question = Object.freeze({
            kind: 'drawing-detail',
            message: 'Choose a drawing detail level.'
          })
      }
      if (!question)
        protocolDiagnostic =
          'The AI returned an inconsistent question. Review the result before continuing.'
    }
  }
  return Object.freeze({ question, protocolDiagnostic, authoredReply })
}
