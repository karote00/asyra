import type { AiActionBatch, AiProvider, AiProviderInput } from '../provider.js'
import { AiProviderError } from '../provider.js'
import { createNativeProviderConfig } from './native-provider-config.js'
import {
  createNativeRpcTransport,
  startNativeProcess
} from './native-rpc-transport.js'
import {
  createNativeConversations,
  createNativeSession,
  type NativeConversations,
  type NativeTurnResult
} from './native-session.js'
import type { ProviderContentItem } from './provider-content.js'
type AiProviderRequestOptions = Parameters<AiProvider['requestActionBatch']>[1]

export interface NativeToolCall {
  readonly namespace: string
  readonly name: string
  readonly callId: string
  readonly arguments: unknown
}
export interface NativeTurnBinding {
  /** App-owned native declarations, instructions and configuration. No request state here. */
  readonly thread: Readonly<Record<string, unknown>>
  /** Only this turn's input when resumed; the App owns projection of new state and attachments. */
  readonly turn?: Readonly<Record<string, unknown>>
  input(resumed: boolean): readonly unknown[]
  invoke(
    call: NativeToolCall
  ): Promise<{ success: boolean; contentItems: readonly ProviderContentItem[] }>
  decode(result: NativeTurnResult): AiActionBatch | Promise<AiActionBatch>
  dispose?(): void | Promise<void>
}

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** Optional native AiProvider. Domain execution/validation and transaction policy are injected. */
export const createNativeAiProvider = (options: {
  executable: string
  model: string
  directory: string
  configuration?: Readonly<Record<string, unknown>>
  environment?: NodeJS.ProcessEnv
  cwd?: string
  conversations?: NativeConversations
  prepare(
    input: AiProviderInput,
    context: AiProviderRequestOptions
  ): Promise<NativeTurnBinding>
}): AiProvider => {
  const conversations = options.conversations ?? createNativeConversations()
  const active = new Set<AbortController>()
  const running = new Set<Promise<AiActionBatch>>()
  let disposed = false

  const run = async (
    input: AiProviderInput,
    context: AiProviderRequestOptions
  ) => {
    if (disposed) {
      throw Error('Native provider is disposed')
    }

    const controller = new AbortController()

    active.add(controller)

    const abort = () => controller.abort(context.signal.reason)

    context.signal.addEventListener('abort', abort, { once: true })
    if (context.signal.aborted) {
      abort()
    }

    let binding: NativeTurnBinding | undefined
    let config:
      Awaited<ReturnType<typeof createNativeProviderConfig>> | undefined
    let lease: ReturnType<NativeConversations['acquire']> | undefined
    let connection: ReturnType<typeof startNativeProcess> | undefined
    let closed: Promise<void> | undefined
    let stopped = false
    const tools = new Set<Promise<void>>()
    let closeOnAbort: (() => void) | undefined

    try {
      controller.signal.throwIfAborted()
      binding = await options.prepare(input, {
        ...context,
        signal: controller.signal
      })
      controller.signal.throwIfAborted()
      const turnBinding = binding
      const key =
        record(input.metadata) &&
        typeof input.metadata.conversationId === 'string'
          ? input.metadata.conversationId
          : undefined

      if (key) {
        lease = conversations.acquire(key, {
          executable: options.executable,
          model: options.model,
          configuration: options.configuration ?? {},
          thread: binding.thread
        })
      }

      config = await createNativeProviderConfig({
        executable: options.executable,
        model: options.model,
        directory: options.directory,
        signal: controller.signal
      })
      connection = startNativeProcess(
        options.executable,
        [
          'app-server',
          '--listen',
          'stdio://',
          ...config.arguments,
          ...Object.entries(options.configuration ?? {}).flatMap(
            ([key, value]) => ['-c', `${key}=${JSON.stringify(value)}`]
          )
        ],
        { env: options.environment, cwd: options.cwd }
      )
      const child = connection

      closed = new Promise<void>((resolve) =>
        child.once('close', () => resolve())
      )
      let terminal: Error | undefined

      const fail = (error: Error) => {
        terminal ??= error
        session?.fail(terminal)
        transport.abortPending(terminal)
        if (!stopped) {
          stopped = true
          controller.abort(terminal)
          child.kill('SIGTERM')
        }
      }

      const calls = new Set<string>()
      const transport = createNativeRpcTransport({
        child,
        maximumFrameBytes: 32 * 1024 * 1024,

        error: (kind) => Error('Native ' + kind + ' failure'),

        rpcError: (value) =>
          Error('Native RPC failed: ' + JSON.stringify(value)),

        fail,

        isStopped: () => stopped,

        isRetained: () => true,

        isComplete: () => false,

        closed() {
          /* Process closure is awaited separately. */
        },

        receive(packet) {
          if (!record(packet)) {
            throw Error('Invalid native packet')
          }

          if (packet.id !== undefined && !packet.method) {
            transport.receiveResponse(packet)

            return
          }

          session?.observe(packet)
          if (packet.method !== 'item/tool/call') {
            return
          }

          const p = packet.params

          if (
            (typeof packet.id !== 'number' && typeof packet.id !== 'string') ||
            !record(p) ||
            typeof p.namespace !== 'string' ||
            typeof p.tool !== 'string' ||
            typeof p.callId !== 'string' ||
            calls.has(p.callId)
          ) {
            throw Error('Invalid native tool call')
          }

          const id = packet.id

          calls.add(p.callId)
          const task = turnBinding
            .invoke({
              namespace: p.namespace,
              name: p.tool,
              callId: p.callId,
              arguments: p.arguments
            })
            .then((reply) => {
              if (!terminal) {
                session?.reply(id, reply)
              }
            })
            .catch(fail)
            .finally(() => tools.delete(task))

          tools.add(task)
        }
      })

      const session = createNativeSession(transport)

      closeOnAbort = () =>
        fail(
          new AiProviderError({
            code: 'AI_PROVIDER_ABORTED',
            message: 'Native request cancelled'
          })
        )
      controller.signal.addEventListener('abort', closeOnAbort, { once: true })
      if (controller.signal.aborted) {
        closeOnAbort()
      }

      await transport.request('initialize', {
        clientInfo: { name: 'native-ai-provider', version: '1' },
        capabilities: { experimentalApi: true }
      })
      transport.write(JSON.stringify({ method: 'initialized' }) + '\n')
      const resumed = lease?.threadId !== undefined

      await session.open({ ...binding.thread, model: options.model }, lease)
      await session.startTurn({
        ...binding.turn,
        input: binding.input(resumed)
      })
      const result = await session.completed()

      await Promise.all(tools)
      controller.signal.throwIfAborted()
      if (result.status !== 'completed') {
        throw Error('Native turn ' + result.status)
      }

      const value = await binding.decode(result)

      if (lease) {
        await session.unload()
      }

      return value
    } finally {
      context.signal.removeEventListener('abort', abort)
      if (closeOnAbort) {
        controller.signal.removeEventListener('abort', closeOnAbort)
      }

      stopped = true
      controller.abort()
      connection?.kill('SIGTERM')
      await closed
      await Promise.allSettled(tools)
      try {
        await binding?.dispose?.()
      } finally {
        try {
          await config?.dispose()
        } finally {
          lease?.release()
          active.delete(controller)
        }
      }
    }
  }

  return {
    requestActionBatch(input, context) {
      const task = run(input, context)

      running.add(task)
      void task
        .finally(() => running.delete(task))
        .catch(() => {
          /* The request caller observes rejection. */
        })

      return task
    },

    async dispose() {
      disposed = true
      for (const controller of active) {
        controller.abort()
      }

      await Promise.allSettled(running)
      if (!options.conversations) {
        conversations.dispose()
      }
    }
  }
}
