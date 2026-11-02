import type { AiImageAttachment, AiSettledTurn } from './conversation'
import { projectAiQuestion, summarizeAiTurn } from './presentation'
import {
  ConversationContextError,
  ConversationContextLimits,
  conversationTextBytes,
  type ConversationContextTurn
} from './conversation-context'

/** One bounded projection at submission; progress and presentation never rebuild it. */
export const projectConversationContext = (
  turns: readonly AiSettledTurn[],
  intent: string,
  submitted: readonly AiImageAttachment[]
) => {
  if (turns.length > ConversationContextLimits.turns) {
    throw new ConversationContextError()
  }

  const attachments: AiImageAttachment[] = []
  const indexes = new Map<string, number>()
  let attachmentBytes = 2

  const retain = (sources: readonly AiImageAttachment[]) =>
    Object.freeze(
      sources.map((source) => {
        const key = source.mediaType + ':' + source.dataUrl
        const known = indexes.get(key)

        if (known !== undefined) {
          return known
        }

        attachmentBytes +=
          conversationTextBytes(source) + (attachments.length > 0 ? 1 : 0)
        if (attachmentBytes > ConversationContextLimits.attachmentBytes) {
          throw new ConversationContextError()
        }

        const index = attachments.length

        indexes.set(key, index)
        attachments.push(source)

        return index
      })
    )

  const history = turns.map((turn) => {
    const question = projectAiQuestion(turn)

    return Object.freeze({
      turnId: turn.turnId,
      intent: turn.intent,
      message: summarizeAiTurn(turn).message,
      outcome: turn.outcome,
      ...(turn.replyToTurnId ? { replyToTurnId: turn.replyToTurnId } : {}),
      ...(turn.retryOfTurnId ? { retryOfTurnId: turn.retryOfTurnId } : {}),
      attachmentIndexes: retain(turn.attachments),
      ...(question
        ? {
            question: Object.freeze({
              message: question.message,
              choices: Object.freeze(
                question.choices.map((choice) => Object.freeze({ ...choice }))
              )
            })
          }
        : {})
    } satisfies ConversationContextTurn)
  })
  const context = Object.freeze({
    turns: Object.freeze(history),
    attachmentIndexes: retain(submitted)
  })

  if (
    conversationTextBytes({ intent, context }) >
    ConversationContextLimits.textBytes
  ) {
    throw new ConversationContextError()
  }

  return Object.freeze({ context, attachments: Object.freeze(attachments) })
}
