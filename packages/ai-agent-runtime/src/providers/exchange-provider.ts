import { AiToolContractError } from '../tool-contract.js'
import {
  isExecutionActivity,
  AiProviderError,
  type AiActionBatch,
  type AiBatchReceipt,
  type AiProviderInput
} from '../provider.js'
import {
  createGenericHttpAiProvider,
  type AiFetchResponse,
  type GenericHttpAiProvider,
  type GenericHttpAiProviderOptions
} from './generic-http.js'
import type {
  ResultContextCommand,
  ConversationResultDescription
} from '../result-context.js'
import type { AiJsonValue } from '../types.js'

export interface AiConversationResultContext {
  names(): readonly string[]
  describe(): readonly ConversationResultDescription[]
  exchange(
    command: ResultContextCommand
  ):
    | Readonly<Record<string, AiJsonValue>>
    | Promise<Readonly<Record<string, AiJsonValue>>>
}
export interface AiConversationResultStore {
  open(conversationId: string): AiConversationResultContext
}
import type {
  AiToolProgress,
  BrowserBatchFailure,
  BrowserBatchFailureEnvelope
} from '../batch-exchange-types.js'

/** App-owned endpoint, budgets and failure policy; portable transport owns only exchange. */
export interface ExchangeAiProviderOptions extends Pick<
  GenericHttpAiProviderOptions,
  'fetch'
> {
  endpoint: string
  executionHeader: string
  receiptHeader: string
  errorHeader: string
  maximumReceiptBytes: number
  maximumFrameBytes: number
  results: AiConversationResultStore
  releaseResults?: () => void
  backendFailure: (code: unknown) => AiProviderError
  contextInputFailureCode: string
  contextExecutionFailureCode: string
  describeBatchFailure: (
    error: unknown,
    batchId: string,
    executionMs: number
  ) => BrowserBatchFailure
  prepareInput?: (input: AiProviderInput) => AiProviderInput
  measure?: <T>(work: () => Promise<T>) => Promise<T>
}

const isResponse = (value: AiFetchResponse): value is Response =>
  'headers' in value && typeof (value.headers as Headers)?.get === 'function'

/** Delivery cannot undo execution or turn missing output into usable data. */
const encodeReceipt = (
  receipt: AiBatchReceipt | BrowserBatchFailureEnvelope,
  options: ExchangeAiProviderOptions
): string => {
  const body = JSON.stringify(receipt)
  const bytes = new TextEncoder().encode(body).byteLength

  if (bytes <= options.maximumReceiptBytes) {
    return body
  }

  if ('batchFailure' in receipt) {
    throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
  }

  const previous = receipt.failure
  let settlement: NonNullable<AiBatchReceipt['failure']>['settlement'] =
    'completed'

  if (previous) {
    settlement = previous.settlement
    if (settlement !== 'unknown' && receipt.actionResults.length) {
      settlement = 'partial'
    }
  }

  const failure: AiBatchReceipt = {
    actionResults: [],
    context: {},
    failure: {
      code: 'ACTION_BATCH_RECEIPT_TOO_LARGE',
      message:
        'Execution returned, but its output exceeds the receipt transport budget. Output is unavailable. Do not replay completed actions.',
      stage: 'delivery',
      actionName:
        previous?.actionName ??
        (receipt.actionResults.length === 1
          ? receipt.actionResults[0].actionName
          : null),
      actionId:
        previous?.actionId ??
        (receipt.actionResults.length === 1
          ? receipt.actionResults[0].actionId
          : null),
      actionExecutionMs: previous?.actionExecutionMs ?? null,
      settlement,
      contextFresh: false,
      observedResult: {
        bytes,
        limit: options.maximumReceiptBytes,
        returnedActionCount: receipt.actionResults.length,
        ...(previous
          ? {
              originalFailure: {
                code: previous.code,
                stage: previous.stage,
                settlement: previous.settlement
              }
            }
          : {})
      }
    }
  }
  const encodedFailure = JSON.stringify(failure)

  if (
    new TextEncoder().encode(encodedFailure).byteLength >
    options.maximumReceiptBytes
  ) {
    throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
  }

  return encodedFailure
}

const readActivityStream = async (
  response: Response,
  signal: AbortSignal,
  options: ExchangeAiProviderOptions,
  onProgress?: (event: AiToolProgress) => void,
  executeBatch?: (batch: AiActionBatch) => Promise<AiBatchReceipt>,
  sendReceipt?: (
    token: string,
    receipt: AiBatchReceipt | BrowserBatchFailureEnvelope
  ) => Promise<void>,
  resultContext?: AiConversationResultContext
): Promise<AiActionBatch> => {
  const reader = response.body?.getReader()

  if (!reader) {
    throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
  }

  const cancel = () => {
    void reader.cancel().catch(() => undefined)
  }

  signal.addEventListener('abort', cancel, { once: true })
  const decoder = new TextDecoder()
  let buffer = ''
  let bytes = 0
  let batch: AiActionBatch | undefined

  const consume = async (line: string) => {
    // Stop can happen between frames already buffered in the same network chunk.
    signal.throwIfAborted()
    let event: Record<string, unknown>

    try {
      event = JSON.parse(line)
    } catch {
      throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    }

    if (
      event &&
      typeof event === 'object' &&
      event.type === 'activity' &&
      batch
    ) {
      return
    }

    if (!event || typeof event !== 'object' || batch) {
      throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    }

    if (event.type === 'conversation-results') {
      if (
        !sendReceipt ||
        typeof event.receiptToken !== 'string' ||
        !/^[a-f0-9-]{36}$/.test(event.receiptToken)
      ) {
        throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
      }

      let context: AiBatchReceipt['context']

      try {
        if (!resultContext) {
          throw Error('No App conversation for result storage')
        }

        context = {
          ok: true,
          values: await resultContext.exchange(
            event.command as ResultContextCommand
          )
        }
      } catch (error) {
        context = {
          ok: false,
          code:
            error instanceof AiToolContractError && error.stage === 'input'
              ? options.contextInputFailureCode
              : options.contextExecutionFailureCode,
          error:
            error instanceof Error
              ? error.message
              : 'Result context unavailable'
        }
      }

      await sendReceipt(event.receiptToken, { context, actionResults: [] })

      return
    }

    if (event.type === 'batch') {
      if (
        !executeBatch ||
        !sendReceipt ||
        typeof event.receiptToken !== 'string' ||
        !/^[a-f0-9-]{36}$/.test(event.receiptToken) ||
        !event.batch ||
        typeof event.batch !== 'object'
      ) {
        throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
      }

      const started = performance.now()
      let receipt: AiBatchReceipt

      try {
        receipt = await executeBatch(event.batch as AiActionBatch)
      } catch (error) {
        signal.throwIfAborted()
        await sendReceipt(event.receiptToken, {
          batchFailure: options.describeBatchFailure(
            error,
            (event.batch as AiActionBatch).batchId,
            Math.max(0, performance.now() - started)
          )
        })

        return
      }

      if (signal.aborted) {
        throw options.backendFailure('ACTION_BATCH_ABORTED')
      }

      await sendReceipt(event.receiptToken, receipt)

      return
    }

    if (event.type === 'error') {
      throw options.backendFailure(event.code)
    }

    if (event.type === 'result') {
      if (!event.batch || typeof event.batch !== 'object') {
        throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
      }

      batch = event.batch as AiActionBatch

      return
    }

    if (event.type !== 'activity') {
      throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    }

    // Progress is observational; a rejected frame cannot retire execution.
    if (
      typeof event.tool !== 'string' ||
      event.tool.length > 256 ||
      !/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*$/.test(event.tool) ||
      (event.status !== 'running' && event.status !== 'completed')
    ) {
      return
    }

    const activity = event.activity as AiToolProgress['activity']

    if (activity !== undefined && !isExecutionActivity(activity)) {
      return
    }

    if (!signal.aborted) {
      try {
        onProgress?.({
          ...(activity ? { activity } : {}),
          tool: event.tool,
          status: event.status,
          ...(typeof event.message === 'string' &&
          Array.from(event.message).length <= 1000
            ? { message: event.message }
            : {})
        })
      } catch {
        /* Observation cannot change execution. */
      }
    }
  }

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()

      if (done) {
        break
      }

      let offset = 0

      while (offset < value.byteLength) {
        const newline = value.indexOf(10, offset)
        const end = newline < 0 ? value.byteLength : newline
        const segment = value.subarray(offset, end)

        bytes += segment.byteLength
        if (bytes > options.maximumFrameBytes) {
          throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
        }

        buffer += decoder.decode(segment, { stream: true })
        offset = end + 1
        if (newline >= 0) {
          buffer += decoder.decode()
          if (buffer.trim()) {
            await consume(buffer)
          }

          buffer = ''
          bytes = 0
        }
      }
    }

    buffer += decoder.decode()
    if (buffer.trim()) {
      await consume(buffer)
    }

    if (signal.aborted) {
      throw new AiProviderError({
        code: 'AI_PROVIDER_ABORTED',
        message: 'The request was stopped.'
      })
    }

    if (!batch) {
      throw options.backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    }

    return batch
  } finally {
    signal.removeEventListener('abort', cancel)
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export const createExchangeAiProvider = (
  options: ExchangeAiProviderOptions
): GenericHttpAiProvider => {
  const results = options.results

  if (!results || typeof results.open !== 'function') {
    throw new AiProviderError({
      code: 'AI_PROVIDER_INVALID_CONFIGURATION',
      message: 'App result storage is required for the exchange provider.'
    })
  }

  let disposed = false
  const attempts = new Set<GenericHttpAiProvider>()

  const requestActionBatch: GenericHttpAiProvider['requestActionBatch'] =
    async (input, requestOptions) => {
      if (disposed) {
        throw new AiProviderError({
          code: 'AI_PROVIDER_DISPOSED',
          message: 'The provider is disposed.'
        })
      }

      const meta = input.metadata as Record<string, never> | undefined
      const context =
        typeof meta?.conversationId === 'string'
          ? results.open(meta.conversationId)
          : undefined
      const names = context?.names()

      if (context && names?.length) {
        input = {
          ...input,
          metadata: {
            ...meta,
            conversationResultNames: names,
            conversationResults: context.describe()
          }
        }
      }

      input = options.prepareInput?.(input) ?? input

      const provider = createGenericHttpAiProvider({
        endpoint: options.endpoint,
        timeoutMs: null,
        headers: {
          accept: 'application/x-ndjson, application/json',
          ...(requestOptions.executeBatch
            ? { [options.executionHeader]: '1' }
            : {})
        },

        fetch: async (...args) => {
          const response = await (options.fetch ?? globalThis.fetch)(...args)

          if (!response.ok && isResponse(response)) {
            throw options.backendFailure(
              response.headers.get(options.errorHeader)
            )
          }

          if (
            isResponse(response) &&
            response.headers
              .get('content-type')
              ?.includes('application/x-ndjson')
          ) {
            const batch = await readActivityStream(
              response,
              args[1].signal,
              options,
              requestOptions.onProgress,
              requestOptions.executeBatch,
              async (token, receipt) => {
                const acknowledged = await (options.fetch ?? globalThis.fetch)(
                  options.endpoint,
                  {
                    method: 'POST',
                    signal: args[1].signal,
                    headers: {
                      'content-type': 'application/json',
                      [options.receiptHeader]: token
                    },
                    body: encodeReceipt(receipt, options)
                  }
                )

                if (!acknowledged.ok) {
                  const code = isResponse(acknowledged)
                    ? acknowledged.headers.get(options.errorHeader)
                    : null
                  const diagnostic =
                    code && /^ACTION_BATCH_[A-Z_]{1,80}$/.test(code)
                      ? ` (${code})`
                      : ''

                  throw new AiProviderError({
                    code: 'AI_PROVIDER_HTTP_STATUS',
                    status: acknowledged.status,
                    message: `The action receipt was not acknowledged${diagnostic}. Execution must not be replayed automatically.`
                  })
                }
              },
              context
            )

            return {
              ok: true,
              status: 200,

              json: async () => batch
            }
          }

          return response
        }
      })

      attempts.add(provider)
      try {
        return await (options.measure ?? (async (work) => work()))(() =>
          provider.requestActionBatch(input, requestOptions)
        )
      } finally {
        attempts.delete(provider)
        provider.dispose()
      }
    }

  return Object.freeze({
    dispose: () => {
      if (disposed) {
        return
      }

      disposed = true
      attempts.forEach((provider) => provider.dispose())
      attempts.clear()
      options.releaseResults?.()
    },

    requestActionBatch
  })
}
