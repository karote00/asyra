import { readConversationImage } from './conversation-attachments'
import type {
  AiConversationController,
  AiImageAttachment
} from './conversation'

export interface AiConversationDraft {
  readonly pendingReads: number
  readonly generation: number
  readonly revision: number
  readonly text: string
  readonly attachments: readonly AiImageAttachment[]
  readonly error: string | null
}
const EMPTY_DRAFT: AiConversationDraft = Object.freeze({
  pendingReads: 0,
  generation: 0,
  revision: 0,
  text: '',
  attachments: Object.freeze([]),
  error: null
})

/** Input belongs to the document composition, not a mounted panel. */
export const createAiConversationDrafts = (
  conversation: AiConversationController
) => {
  const drafts = new Map<string, AiConversationDraft>()
  const observers = new Map<string, Set<() => void>>()
  interface Slot {
    readonly abort: AbortController
    pending: boolean
    image?: AiImageAttachment
  }
  const slots = new Map<string, Slot[]>()
  let disposed = false
  const getSnapshot = (id: string) => drafts.get(id) ?? EMPTY_DRAFT
  const update = (id: string, patch: Partial<AiConversationDraft>) => {
    if (disposed) return
    const previous = getSnapshot(id)
    drafts.set(
      id,
      Object.freeze({ ...previous, ...patch, revision: previous.revision + 1 })
    )
    observers.get(id)?.forEach((notify) => {
      try {
        notify()
      } catch {
        /* Observers cannot reject input. */
      }
    })
  }
  const publishImages = (
    id: string,
    patch: Pick<Partial<AiConversationDraft>, 'error'> = {}
  ) => {
    const current = slots.get(id) ?? []
    update(id, {
      ...patch,
      pendingReads: current.filter((slot) => slot.pending).length,
      attachments: Object.freeze(
        current.flatMap((slot) => (slot.image ? [slot.image] : []))
      )
    })
  }
  const retire = (id: string) => {
    const current = slots.get(id)
    slots.delete(id)
    current?.forEach((slot) => slot.abort.abort())
  }
  return Object.freeze({
    getSnapshot,
    subscribe: (id: string, notify: () => void) => {
      if (disposed) return () => undefined
      let listeners = observers.get(id)
      if (!listeners) {
        listeners = new Set()
        observers.set(id, listeners)
      }
      listeners.add(notify)
      return () => {
        listeners.delete(notify)
        if (!listeners.size) observers.delete(id)
      }
    },
    setText: (id: string, text: string) => update(id, { text }),
    setError: (id: string, error: string | null) => update(id, { error }),
    addFiles: async (id: string, files: readonly File[]) => {
      if (disposed || conversation.getSnapshot().activeTurn) return
      const accepted = files.filter((file) =>
        ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
      )
      const generation = getSnapshot(id).generation
      const selected = accepted.map((): Slot => ({
        abort: new AbortController(),
        pending: true
      }))
      slots.set(id, [...(slots.get(id) ?? []), ...selected])
      publishImages(id, {
        error:
          accepted.length === files.length
            ? null
            : 'Choose PNG, JPEG, or WebP images.'
      })
      await Promise.all(
        accepted.map(async (file, index) => {
          const slot = selected[index]
          const live = () =>
            !disposed &&
            getSnapshot(id).generation === generation &&
            slots.get(id)?.includes(slot)
          try {
            const image = await readConversationImage(file, slot.abort.signal)
            if (!live()) return
            slot.image = image
          } catch {
            if (!live()) return
            update(id, {
              error: 'Could not read one or more images. Try adding them again.'
            })
          }
          if (live()) {
            slot.pending = false
            publishImages(id)
          }
        })
      )
    },
    cancelReads: (id: string) => {
      const current = slots.get(id) ?? []
      slots.set(
        id,
        current.filter((slot) => !slot.pending)
      )
      current
        .filter((slot) => slot.pending)
        .forEach((slot) => slot.abort.abort())
      publishImages(id)
    },
    removeAttachment: (id: string, index: number) => {
      const current = slots.get(id) ?? []
      const removed = current.filter((slot) => slot.image)[index]
      slots.set(
        id,
        current.filter((slot) => slot !== removed)
      )
      removed?.abort.abort()
      update(id, { error: null })
      publishImages(id)
    },
    submit: async (id: string, captured: AiConversationDraft) => {
      try {
        if (disposed) throw new Error('Conversation drafts are disposed.')
        if (
          conversation.getSnapshot().conversationId !== id ||
          getSnapshot(id) !== captured
        )
          throw new Error('The draft changed. Review it before sending.')
        if (captured.pendingReads)
          throw new Error(
            'Images are still reading. Wait or cancel image loading before sending.'
          )
        const admission = conversation.admit(
          { intent: captured.text, attachments: captured.attachments },
          () => {
            retire(id)
            update(id, { ...EMPTY_DRAFT, generation: captured.generation + 1 })
          }
        )
        return await admission.settlement
      } catch (error) {
        update(id, {
          error:
            error instanceof Error
              ? error.message
              : 'Could not send the message.'
        })
        throw error
      }
    },
    dispose: () => {
      disposed = true
      for (const id of slots.keys()) retire(id)
      observers.clear()
      drafts.clear()
    }
  })
}
export type AiConversationDrafts = ReturnType<typeof createAiConversationDrafts>
