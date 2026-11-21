import type { createNativeRpcTransport } from './native-rpc-transport.js'
import type { ProviderContentItem } from './provider-content.js'
import { createProviderConversations } from './provider-conversations.js'

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export interface NativeConversationRecord {
  readonly threadId: string
  readonly contract: string
}

export interface NativeConversationStorage {
  read(key: string): NativeConversationRecord | undefined
  write(key: string, value: NativeConversationRecord): void
}

export interface NativeConversationLease {
  readonly threadId: string | undefined
  bind(threadId: string): void
  release(): void
}

/** Native identity adapter over the shared service-owned conversation lease. */
export const createNativeConversations = (
  storage?: NativeConversationStorage
) => {
  const registry = createProviderConversations<string>(
    storage
      ? {
          read(key) {
            const value = storage.read(key)

            if (!value) {
              return
            }

            if (!value.threadId?.trim()) {
              throw Error('Native conversation identity is invalid')
            }

            return { contract: value.contract, state: value.threadId }
          },

          write(key, value) {
            storage.write(key, {
              contract: value.contract,
              threadId: value.state
            })
          }
        }
      : undefined
  )

  return {
    acquire(key: string, contract: unknown): NativeConversationLease {
      const lease = registry.acquire(key, contract)

      return {
        get threadId() {
          return lease.state
        },

        bind(id) {
          lease.assertActive()
          if (!id.trim() || (lease.state !== undefined && lease.state !== id)) {
            throw Error('Native conversation identity mismatch')
          }

          lease.checkpoint(id)
        },

        release: lease.release
      }
    },

    dispose: registry.dispose
  }
}

export type NativeConversations = ReturnType<typeof createNativeConversations>

export interface NativeTurnResult {
  readonly threadId: string
  readonly turnId: string
  readonly status: 'completed' | 'interrupted' | 'failed'
  readonly messages: readonly { phase: string; text: string }[]
  readonly error?: unknown
}

/** Native thread/turn protocol; App callbacks retain tool validation and product settlement. */
export const createNativeSession = (
  transport: Pick<
    ReturnType<typeof createNativeRpcTransport>,
    'request' | 'write'
  >,
  options: { error?: (message: string) => Error } = {}
) => {
  const protocolError = options.error ?? ((message: string) => Error(message))
  let threadId: string | undefined
  let turnId: string | undefined
  let pending = false
  let messages: { phase: string; text: string }[] = []

  let resolveTurn: (value: NativeTurnResult) => void = () => {
    /* No turn is active before startTurn. */
  }

  let rejectTurn: (error: Error) => void = () => {
    /* No turn is active before startTurn. */
  }

  let completion: Promise<NativeTurnResult> | undefined

  return {
    get threadId() {
      return threadId
    },

    get turnId() {
      return turnId
    },

    async open(
      parameters: Record<string, unknown>,
      lease?: NativeConversationLease,
      admit?: (value: unknown) => void
    ) {
      if (threadId) {
        throw protocolError('Native thread is already open')
      }

      const previous = lease?.threadId
      const method = previous ? 'thread/resume' : 'thread/start'
      // The pinned protocol restores its persisted tools. Resume cannot replace them.
      const { dynamicTools, ephemeral: _ephemeral, ...resume } = parameters
      const params = previous
        ? { ...resume, threadId: previous, excludeTurns: true }
        : { ...parameters, ephemeral: !lease }

      return transport.request(method, params, (value) => {
        if (
          !record(value) ||
          !record(value.thread) ||
          typeof value.thread.id !== 'string' ||
          !value.thread.id ||
          (previous && value.thread.id !== previous)
        ) {
          throw protocolError('Native thread identity mismatch')
        }

        admit?.(value)
        lease?.bind(value.thread.id)
        threadId = value.thread.id
      })
    },

    async startTurn(
      parameters: Record<string, unknown>,
      admit?: (value: unknown) => void
    ) {
      if (!threadId || pending) {
        throw protocolError('Native thread is unavailable or busy')
      }

      pending = true
      turnId = undefined
      messages = []
      completion = new Promise<NativeTurnResult>((resolve, reject) => {
        resolveTurn = resolve
        rejectTurn = reject
      })
      void completion.catch(() => {
        /* No turn is active before startTurn. */
      })
      try {
        return await transport.request(
          'turn/start',
          { ...parameters, threadId },
          (value) => {
            if (
              !record(value) ||
              !record(value.turn) ||
              typeof value.turn.id !== 'string' ||
              !value.turn.id
            ) {
              throw protocolError('Native turn identity missing')
            }

            admit?.(value)
            turnId = value.turn.id
          }
        )
      } catch (error) {
        pending = false
        rejectTurn(error instanceof Error ? error : Error('Native turn failed'))
        throw error
      }
    },

    unload() {
      if (!threadId || pending) {
        throw protocolError('Cannot unload an active native turn')
      }

      return transport.request('thread/unsubscribe', { threadId })
    },

    completed() {
      if (!completion) {
        throw protocolError('Native turn has not started')
      }

      return completion
    },

    observe(packet: unknown) {
      if (!record(packet) || !record(packet.params)) {
        return
      }

      const params = packet.params

      if (
        packet.method === 'item/tool/call' &&
        (params.threadId !== threadId || params.turnId !== turnId || !pending)
      ) {
        throw protocolError('Native tool call identity mismatch')
      }

      if (params.threadId !== threadId || !pending) {
        return
      }

      if (
        packet.method === 'item/completed' &&
        params.turnId === turnId &&
        record(params.item) &&
        params.item.type === 'agentMessage' &&
        typeof params.item.text === 'string'
      ) {
        messages.push({
          phase:
            typeof params.item.phase === 'string'
              ? params.item.phase
              : 'commentary',
          text: params.item.text
        })
      }

      if (packet.method === 'turn/completed') {
        const turn = params.turn

        if (
          !record(turn) ||
          turn.id !== turnId ||
          !['completed', 'interrupted', 'failed'].includes(String(turn.status))
        ) {
          throw protocolError('Native completion identity or status mismatch')
        }

        pending = false
        // The discriminated terminal status is a protocol value, not App transaction settlement.
        const status = turn.status

        if (
          status !== 'completed' &&
          status !== 'interrupted' &&
          status !== 'failed'
        ) {
          throw protocolError('Invalid native status')
        }

        if (!threadId || !turnId) {
          throw protocolError('Native identity missing')
        }

        resolveTurn({
          threadId,
          turnId,
          status,
          messages: [...messages],
          ...(turn.error ? { error: turn.error } : {})
        })
      }
    },

    reply(
      id: number | string,
      result: { success: boolean; contentItems: readonly ProviderContentItem[] }
    ) {
      return transport.write(JSON.stringify({ id, result }) + '\n')
    },

    interrupt() {
      if (!threadId || !turnId || !pending) {
        throw protocolError('No active native turn')
      }

      return transport.request('turn/interrupt', { threadId, turnId })
    },

    fail(error: Error) {
      pending = false
      rejectTurn(error)
    }
  }
}
