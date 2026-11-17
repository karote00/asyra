import type { AiJsonValue } from '@asyra/ai-agent-runtime'
import type { AiImageAttachment, AiSettledTurn } from './conversation'

/** Public authored history, never progress or raw tool output. Images retain request-local indexes. */
export const createConversationContext = (
  turns: readonly AiSettledTurn[],
  current: {
    readonly turnId: string
    readonly intent: string
    readonly replyToTurnId?: string
    readonly attachments: readonly AiImageAttachment[]
  },
  requestAttachments: readonly AiImageAttachment[]
): AiJsonValue => {
  const attachmentsFor = (attachments: readonly AiImageAttachment[]) =>
    Object.freeze(
      attachments.map((image) => {
        const index = requestAttachments.indexOf(image)
        return Object.freeze({
          name: image.name,
          mediaType: image.mediaType,
          ...(index < 0 ? { available: false } : { available: true, index })
        })
      })
    )
  const messages: AiJsonValue[] = []
  for (const turn of turns) {
    messages.push(
      Object.freeze({
        role: 'user',
        turnId: turn.turnId,
        text: turn.requestIntent ?? turn.intent,
        outcome: turn.outcome,
        ...(turn.replyToTurnId ? { replyToTurnId: turn.replyToTurnId } : {}),
        ...(turn.retryOfTurnId ? { retryOfTurnId: turn.retryOfTurnId } : {}),
        attachments: attachmentsFor(turn.attachments)
      })
    )
    const text = turn.question?.message ?? turn.authoredReply
    if (text)
      messages.push(
        Object.freeze({ role: 'assistant', turnId: turn.turnId, text })
      )
  }
  messages.push(
    Object.freeze({
      role: 'user',
      turnId: current.turnId,
      text: current.intent,
      ...(current.replyToTurnId
        ? { replyToTurnId: current.replyToTurnId }
        : {}),
      attachments: attachmentsFor(current.attachments)
    })
  )
  return Object.freeze({ messages: Object.freeze(messages) })
}
