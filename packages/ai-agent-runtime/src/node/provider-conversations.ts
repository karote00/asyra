import { createHash } from 'node:crypto'

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) {
    return '[' + value.map(canonical).join(',') + ']'
  }

  if (record(value)) {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonical(value[key]))
        .join(',') +
      '}'
    )
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return JSON.stringify(value)
  }

  throw Error('Provider conversation contract must be JSON')
}

export interface ProviderConversationRecord<T> {
  readonly contract: string
  readonly state: T
}
export interface ProviderConversationStorage<T> {
  read(key: string): ProviderConversationRecord<T> | undefined
  write(key: string, record: ProviderConversationRecord<T>): void
}

/** Service-owned continuation only. Turn callbacks and abort signals are never retained. */
export const createProviderConversations = <T>(
  storage?: ProviderConversationStorage<T>
) => {
  const entries = new Map<string, ProviderConversationRecord<T>>()
  const owner = storage ?? {
    read: (key: string) => entries.get(key),

    write: (key: string, value: ProviderConversationRecord<T>) => {
      entries.set(key, value)
    }
  }
  const active = new Set<string>()
  const unavailable = new Set<string>()
  let closed = false

  return {
    acquire(key: string, contract: unknown) {
      if (closed) {
        throw Error('Provider conversation registry is closed')
      }

      if (!key.trim()) {
        throw Error('Provider conversation identity is required')
      }

      if (active.has(key)) {
        throw Error('Provider conversation is busy')
      }

      if (unavailable.has(key)) {
        throw Error(
          'Provider conversation is unavailable; start a new conversation'
        )
      }

      const digest = createHash('sha256')
        .update(canonical(contract))
        .digest('hex')
      const previous = owner.read(key)

      if (previous && previous.contract !== digest) {
        throw Error(
          'Provider conversation contract changed; start a new conversation'
        )
      }

      active.add(key)
      let released = false
      let state = previous?.state

      const assertActive = () => {
        if (released || closed) {
          throw Error('Provider conversation lease is released')
        }

        if (unavailable.has(key)) {
          throw Error('Provider conversation is unavailable')
        }
      }

      return {
        assertActive,

        get state() {
          return state
        },

        checkpoint(value: T) {
          assertActive()
          owner.write(key, Object.freeze({ contract: digest, state: value }))
          state = value
        },

        invalidate() {
          assertActive()
          unavailable.add(key)
        },

        release() {
          if (!released) {
            released = true
            active.delete(key)
          }
        }
      }
    },

    dispose() {
      closed = true
      active.clear()
      unavailable.clear()
      entries.clear()
    }
  }
}

export type ProviderConversations<T> = ReturnType<
  typeof createProviderConversations<T>
>
