import {
  AiProviderError,
  createGenericHttpAiProvider,
  type AiActionBatch,
  type AiBatchReceipt,
  type AiFetchResponse,
  type GenericHttpAiProvider,
  type GenericHttpAiProviderOptions
} from '@asyra/ai-agent-runtime'
import { measureBrowserDragAsyncPhase } from '@asyra/utils'
import {
  ACTION_BATCH_ENDPOINT,
  AI_BATCH_RECEIPT_HEADER,
  AI_BATCH_EXECUTION_HEADER
} from './action-batch-endpoint'
import type { AiToolProgress } from './action-batch-protocol'

export { ACTION_BATCH_ENDPOINT } from './action-batch-endpoint'
export const ACTION_BATCH_TIMEOUT_MS = 300_000

const backendFailure = (code: unknown): AiProviderError => {
  if (code === 'ACTION_BATCH_MODEL_TIMEOUT')
    return new AiProviderError({
      code: 'AI_PROVIDER_TIMEOUT',
      message: 'The AI request timed out.'
    })
  if (code === 'ACTION_BATCH_MODEL_CONFIGURATION_REQUIRED')
    return new AiProviderError({
      code: 'AI_PROVIDER_INVALID_CONFIGURATION',
      message: 'The AI provider is unavailable or not configured.'
    })
  if (code === 'ACTION_BATCH_MODEL_INVALID_RESPONSE')
    return new AiProviderError({
      code: 'AI_PROVIDER_MALFORMED_RESPONSE',
      message: 'The AI returned an invalid drawing response.'
    })
  if (code === 'ACTION_BATCH_IMAGE_CONVERSION_FAILED')
    return new AiProviderError({
      code: 'AI_PROVIDER_HTTP_STATUS',
      message: 'Image conversion failed. Your drawing is unchanged.'
    })
  return new AiProviderError({
    code: 'AI_PROVIDER_HTTP_STATUS',
    message: 'The AI request failed.'
  })
}

const isResponse = (value: AiFetchResponse): value is Response =>
  'headers' in value && typeof (value.headers as Headers)?.get === 'function'

const readActivityStream = async (
  response: Response,
  signal: AbortSignal,
  onProgress?: (event: AiToolProgress) => void,
  executeBatch?: (batch: AiActionBatch) => Promise<AiBatchReceipt>,
  sendReceipt?: (token: string, receipt: AiBatchReceipt) => Promise<void>
): Promise<AiActionBatch> => {
  const reader = response.body?.getReader()
  if (!reader) throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
  const cancel = () => {
    void reader.cancel().catch(() => undefined)
  }
  signal.addEventListener('abort', cancel, { once: true })
  const decoder = new TextDecoder()
  let buffer = ''
  let bytes = 0
  let batch: AiActionBatch | undefined
  const consume = async (line: string) => {
    let event: Record<string, unknown>
    try {
      event = JSON.parse(line)
    } catch {
      throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    }
    if (!event || typeof event !== 'object' || batch)
      throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    if (event.type === 'batch') {
      if (
        !executeBatch ||
        !sendReceipt ||
        typeof event.receiptToken !== 'string' ||
        !/^[a-f0-9-]{36}$/.test(event.receiptToken) ||
        !event.batch ||
        typeof event.batch !== 'object'
      )
        throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
      const receipt = await executeBatch(event.batch as AiActionBatch)
      if (signal.aborted) throw backendFailure('ACTION_BATCH_ABORTED')
      await sendReceipt(event.receiptToken, receipt)
      return
    }
    if (event.type === 'error') throw backendFailure(event.code)
    if (event.type === 'result') {
      if (!event.batch || typeof event.batch !== 'object')
        throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
      batch = event.batch as AiActionBatch
      return
    }
    if (
      event.type !== 'activity' ||
      typeof event.tool !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(event.tool) ||
      (event.status !== 'running' && event.status !== 'completed')
    )
      throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    if (!signal.aborted) {
      try {
        onProgress?.({
          tool: event.tool,
          status: event.status,
          ...(typeof event.message === 'string' && event.message.length <= 1000
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
      if (done) break
      bytes += value.byteLength
      if (bytes > 64 * 1024 * 1024)
        throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
      buffer += decoder.decode(value, { stream: true })
      let index: number
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index)
        buffer = buffer.slice(index + 1)
        if (line.trim()) await consume(line)
      }
    }
    buffer += decoder.decode()
    if (buffer.trim()) await consume(buffer)
    if (signal.aborted)
      throw new AiProviderError({
        code: 'AI_PROVIDER_ABORTED',
        message: 'The request was stopped.'
      })
    if (!batch) throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    return batch
  } finally {
    signal.removeEventListener('abort', cancel)
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export const createServerActionBatchProvider = (
  options: Pick<GenericHttpAiProviderOptions, 'fetch'> = {}
): GenericHttpAiProvider => {
  let disposed = false
  const attempts = new Set<GenericHttpAiProvider>()
  const requestActionBatch: GenericHttpAiProvider['requestActionBatch'] =
    async (input, requestOptions) => {
      if (disposed)
        throw new AiProviderError({
          code: 'AI_PROVIDER_DISPOSED',
          message: 'The provider is disposed.'
        })
      const provider = createGenericHttpAiProvider({
        endpoint: ACTION_BATCH_ENDPOINT,
        timeoutMs: ACTION_BATCH_TIMEOUT_MS,
        headers: {
          accept: 'application/x-ndjson, application/json',
          ...(requestOptions.executeBatch
            ? { [AI_BATCH_EXECUTION_HEADER]: '1' }
            : {})
        },
        fetch: async (...args) => {
          const response = await (options.fetch ?? globalThis.fetch)(...args)
          if (!response.ok && isResponse(response))
            throw backendFailure(response.headers.get('x-ai-error-code'))
          if (
            isResponse(response) &&
            response.headers
              .get('content-type')
              ?.includes('application/x-ndjson')
          ) {
            const batch = await readActivityStream(
              response,
              args[1].signal,
              requestOptions.onProgress,
              requestOptions.executeBatch,
              async (token, receipt) => {
                const acknowledged = await (options.fetch ?? globalThis.fetch)(
                  ACTION_BATCH_ENDPOINT,
                  {
                    method: 'POST',
                    signal: args[1].signal,
                    headers: {
                      'content-type': 'application/json',
                      [AI_BATCH_RECEIPT_HEADER]: token
                    },
                    body: JSON.stringify(receipt)
                  }
                )
                if (!acknowledged.ok)
                  throw backendFailure('ACTION_BATCH_MODEL_FAILED')
              }
            )
            return { ok: true, status: 200, json: async () => batch }
          }
          return response
        }
      })
      attempts.add(provider)
      try {
        return await measureBrowserDragAsyncPhase(
          'ai-provider:server-response-handoff',
          () => provider.requestActionBatch(input, requestOptions)
        )
      } finally {
        attempts.delete(provider)
        provider.dispose()
      }
    }
  return Object.freeze({
    dispose: () => {
      disposed = true
      attempts.forEach((provider) => provider.dispose())
      attempts.clear()
    },
    requestActionBatch
  })
}
