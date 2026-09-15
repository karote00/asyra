import {
  AiProviderError,
  createGenericHttpAiProvider,
  type AiActionBatch,
  type AiFetchResponse,
  type GenericHttpAiProvider,
  type GenericHttpAiProviderOptions
} from '@asyra/ai-agent-runtime'
import { measureBrowserDragAsyncPhase } from '@asyra/utils'
import { ACTION_BATCH_ENDPOINT } from './action-batch-endpoint'
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
  onProgress?: (event: AiToolProgress) => void
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
  const consume = (line: string) => {
    let event: Record<string, unknown>
    try {
      event = JSON.parse(line)
    } catch {
      throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    }
    if (!event || typeof event !== 'object' || batch)
      throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    if (event.type === 'error') throw backendFailure(event.code)
    if (event.type === 'result') {
      if (!event.batch || typeof event.batch !== 'object')
        throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
      batch = event.batch as AiActionBatch
      return
    }
    if (
      event.type !== 'activity' ||
      event.tool !== 'vtracer' ||
      (event.status !== 'running' && event.status !== 'completed')
    )
      throw backendFailure('ACTION_BATCH_MODEL_INVALID_RESPONSE')
    if (!signal.aborted) {
      try {
        onProgress?.({ tool: event.tool, status: event.status })
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
        if (line.trim()) consume(line)
      }
    }
    buffer += decoder.decode()
    if (buffer.trim()) consume(buffer)
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
        headers: { accept: 'application/x-ndjson, application/json' },
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
              requestOptions.onProgress
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
