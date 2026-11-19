/** App-owned, request-local conversation transport; never canonical document data. */
export const ConversationContextLimits = Object.freeze({
  turns: 128,
  textBytes: 128 * 1024,
  attachmentBytes: 8 * 1024 * 1024
})

export interface ConversationContextTurn {
  readonly turnId: string
  readonly intent: string
  readonly message: string
  readonly outcome: string
  readonly replyToTurnId?: string
  readonly retryOfTurnId?: string
  readonly attachmentIndexes: readonly number[]
  readonly question?: {
    readonly message: string
    readonly choices: readonly {
      readonly id: string
      readonly label: string
      readonly description: string
      readonly resourceWarning: string | null
    }[]
  }
}

export interface ConversationContext {
  readonly turns: readonly ConversationContextTurn[]
  readonly attachmentIndexes: readonly number[]
}

export class ConversationContextError extends Error {
  readonly code = 'AI_CONVERSATION_CONTEXT_LIMIT'

  constructor() {
    super(
      'This conversation exceeds the request context limit. Start a new conversation with the needed brief and references. No changes were made.'
    )
    this.name = 'ConversationContextError'
  }
}

export const conversationTextBytes = (value: unknown): number =>
  new TextEncoder().encode(JSON.stringify(value)).byteLength

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const keysWithin = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).every((key) => keys.includes(key))

/** The server admits public history, never arbitrary historic execution output. */
export const admitsConversationContext = (
  intent: string,
  metadata: unknown
): boolean => {
  if (!record(metadata) || metadata.conversationContext === undefined) {
    return true
  }

  const context = metadata.conversationContext

  if (
    !record(context) ||
    !keysWithin(context, ['turns', 'attachmentIndexes']) ||
    !Array.isArray(context.turns) ||
    context.turns.length > ConversationContextLimits.turns
  ) {
    return false
  }

  const attachments = metadata.imageAttachments ?? []

  if (
    !Array.isArray(attachments) ||
    conversationTextBytes(attachments) >
      ConversationContextLimits.attachmentBytes ||
    conversationTextBytes({ intent, context }) >
      ConversationContextLimits.textBytes
  ) {
    return false
  }

  const validIndexes = (value: unknown) =>
    Array.isArray(value) &&
    value.every(
      (index) =>
        Number.isSafeInteger(index) && index >= 0 && index < attachments.length
    )

  if (!validIndexes(context.attachmentIndexes)) {
    return false
  }

  const turnIds = new Set<string>()

  for (const turn of context.turns) {
    if (
      !record(turn) ||
      !keysWithin(turn, [
        'turnId',
        'intent',
        'message',
        'outcome',
        'replyToTurnId',
        'retryOfTurnId',
        'attachmentIndexes',
        'question'
      ]) ||
      typeof turn.turnId !== 'string' ||
      !turn.turnId ||
      turnIds.has(turn.turnId) ||
      typeof turn.intent !== 'string' ||
      !turn.intent.trim() ||
      typeof turn.message !== 'string' ||
      !['cancelled', 'failed', 'no-change', 'partial', 'success'].includes(
        String(turn.outcome)
      ) ||
      !validIndexes(turn.attachmentIndexes)
    ) {
      return false
    }

    for (const key of ['replyToTurnId', 'retryOfTurnId']) {
      if (
        turn[key] !== undefined &&
        (typeof turn[key] !== 'string' || !turnIds.has(turn[key] as string))
      ) {
        return false
      }
    }

    turnIds.add(turn.turnId)
    if (turn.question !== undefined) {
      const question = turn.question

      if (
        !record(question) ||
        !keysWithin(question, ['message', 'choices']) ||
        typeof question.message !== 'string' ||
        !question.message.trim() ||
        !Array.isArray(question.choices) ||
        !question.choices.every(
          (choice) =>
            record(choice) &&
            keysWithin(choice, [
              'id',
              'label',
              'description',
              'resourceWarning'
            ]) &&
            typeof choice.id === 'string' &&
            typeof choice.label === 'string' &&
            typeof choice.description === 'string' &&
            (choice.resourceWarning === null ||
              typeof choice.resourceWarning === 'string')
        )
      ) {
        return false
      }
    }
  }

  return true
}
