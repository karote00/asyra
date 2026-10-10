/** Invocation does not grant execution authority. The host supplies its existing
 * admission/permission/transaction-enforced executor. */
export interface AiInvocation {
  readonly name: string
  readonly input: unknown
  readonly callId?: string
  readonly parentCallId?: string
  readonly retryOf?: string
  readonly actor?: string
  readonly purpose?: string
  readonly purposeSource?: string
  readonly expectedResult?: string
  readonly signal?: AbortSignal
}
export type AiInvocationContext = AiInvocation & { readonly callId: string }
export type AiInvocationMiddleware<T> = (
  call: AiInvocationContext,
  next: () => Promise<T>
) => Promise<T>
type AiInvocationOutcome<T> =
  | {
      readonly phase: 'started'
      readonly output?: never
      readonly error?: never
    }
  | { readonly phase: 'completed'; readonly output: T; readonly error?: never }
  | {
      readonly phase: 'failed' | 'cancelled'
      readonly error: unknown
      readonly output?: never
    }
export type AiInvocationEvent<T> = AiInvocationOutcome<T> & {
  readonly call: AiInvocationContext
  readonly durationMs: number
}

/** One dispatch boundary for all operations; middleware is instance-scoped. */
export const createAiInvoker = <T>(options: {
  execute: (call: AiInvocationContext) => Promise<T>
  middleware?: readonly AiInvocationMiddleware<T>[]
  observe?: (event: AiInvocationEvent<T>) => void | Promise<void>
  now?: () => number
}) => {
  const middleware = [...(options.middleware ?? [])]
  const now = options.now ?? (() => performance.now())
  const emit = (event: AiInvocationEvent<T>) => {
    try {
      // Even an async observer failure cannot alter execution or become unhandled.
      void Promise.resolve(options.observe?.(event)).catch(() => undefined)
    } catch {
      /* Diagnostic isolation. */
    }
  }
  return {
    async invoke(input: AiInvocation): Promise<T> {
      const call = Object.freeze({
        ...input,
        callId: input.callId ?? globalThis.crypto.randomUUID()
      })
      const started = now()
      let active = true
      const event = (detail: AiInvocationOutcome<T>) =>
        emit({ call, durationMs: Math.max(0, now() - started), ...detail })
      event({ phase: 'started' })
      const dispatch = async (index: number): Promise<T> => {
        call.signal?.throwIfAborted()
        const handler = middleware[index]
        if (!handler) return options.execute(call)
        let used = false
        let open = true
        let downstream: Promise<T> | undefined
        let output: T
        try {
          output = await handler(call, () => {
            if (used || !active || !open)
              return Promise.reject(
                new Error('Invocation next must run at most once while active')
              )
            used = true
            downstream = dispatch(index + 1)
            void downstream.catch(() => undefined)
            return downstream
          })
        } catch (error) {
          await downstream?.catch(() => undefined)
          throw error
        } finally {
          open = false
        }
        // An observer cannot report settlement while started canonical work runs.
        await downstream
        return output
      }
      try {
        const output = await dispatch(0)
        event({ phase: 'completed', output })
        return output
      } catch (error) {
        event({ phase: call.signal?.aborted ? 'cancelled' : 'failed', error })
        throw error
      } finally {
        active = false
      }
    }
  }
}
