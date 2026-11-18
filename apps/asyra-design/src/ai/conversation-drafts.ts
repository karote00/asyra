import { isRecord } from '@asyra/utils'
import type core from '../contexts'
import { SystemPropertyKeys } from '../constants'
import { isAiImageAttachment, type AiImageAttachment } from './conversation'

export interface ConversationDraft {
  readonly text: string
  readonly attachments: readonly AiImageAttachment[]
  readonly error: string | null
  readonly generation: number
}

type ConversationDraftValues = Readonly<Record<string, ConversationDraft>>

export const EMPTY_CONVERSATION_DRAFT: ConversationDraft = Object.freeze({
  text: '',
  attachments: Object.freeze([]),
  error: null,
  generation: 0
})

const validDrafts = (value: unknown): value is ConversationDraftValues =>
  isRecord(value) &&
  Object.entries(value).every(
    ([id, draft]) =>
      id.trim().length > 0 &&
      isRecord(draft) &&
      Object.keys(draft).every((key) =>
        ['text', 'attachments', 'error', 'generation'].includes(key)
      ) &&
      typeof draft.text === 'string' &&
      (draft.error === null || typeof draft.error === 'string') &&
      typeof draft.generation === 'number' &&
      Number.isSafeInteger(draft.generation) &&
      draft.generation >= 0 &&
      Array.isArray(draft.attachments) &&
      draft.attachments.every(isAiImageAttachment)
  )

/** App startup registers private runtime state; Core owns values and observation. */
export const createConversationDrafts = (
  owner: Pick<
    typeof core,
    'defineSystemProperty' | 'getSystemProperty' | 'setSystemProperty'
  >
) => {
  const key = SystemPropertyKeys.CONVERSATION_DRAFTS
  const observable = owner.defineSystemProperty<ConversationDraftValues>(
    key,
    Object.freeze({}),
    { runtime: true, validate: validDrafts }
  )
  const subscriptions = new Set<{ unsubscribe(): void }>()
  let disposed = false

  const values = () => {
    const current = owner.getSystemProperty<ConversationDraftValues>(key)

    if (!current) {
      throw new Error('Conversation draft property is not registered.')
    }

    return current
  }

  const get = (id: string): ConversationDraft => {
    if (disposed) {
      return EMPTY_CONVERSATION_DRAFT
    }

    const current = values()

    return Object.hasOwn(current, id) ? current[id] : EMPTY_CONVERSATION_DRAFT
  }

  return Object.freeze({
    get,

    update: (
      id: string,
      update: (draft: ConversationDraft) => ConversationDraft
    ) => {
      if (disposed) {
        return
      }

      const previous = get(id)
      const next = update(previous)

      if (previous === next) {
        return
      }

      const nextValues = Object.freeze({
        ...values(),
        [id]: Object.freeze({
          ...next,
          attachments: Object.freeze(
            next.attachments.map((attachment) =>
              Object.freeze({ ...attachment })
            )
          )
        })
      })

      owner.setSystemProperty(key, nextValues)
    },

    subscribe: (observer: () => void) => {
      if (disposed) {
        return () => undefined
      }

      const subscription = observable.subscribe(observer)

      subscriptions.add(subscription)

      return () => {
        subscription.unsubscribe()
        subscriptions.delete(subscription)
      }
    },

    dispose: () => {
      if (disposed) {
        return
      }

      disposed = true
      for (const subscription of subscriptions) {
        subscription.unsubscribe()
      }

      subscriptions.clear()
      owner.setSystemProperty(key, Object.freeze({}))
    }
  })
}

export type ConversationDrafts = ReturnType<typeof createConversationDrafts>
