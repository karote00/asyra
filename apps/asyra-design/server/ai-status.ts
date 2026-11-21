import type { IncomingMessage, ServerResponse } from 'node:http'
import { AI_STATUS_ENDPOINT } from '../src/ai/connection-status'
import {
  createDefaultAiModelSources,
  selectAiModelSource,
  type AiModelSource
} from './ai-model-sources'
import { admitsLocalProviderRequest } from './local-request-admission'

export const readAiStatus = async (
  signal?: AbortSignal,
  registered?: readonly AiModelSource[]
) => {
  const sources = registered ?? createDefaultAiModelSources()

  try {
    const source = selectAiModelSource(
      process.env.AI_PROVIDER_BACKEND?.trim() || 'local-codex',
      sources
    )

    return await source.status(process.env, signal)
  } catch {
    return { state: 'unconfigured' }
  } finally {
    if (!registered) {
      await Promise.all(sources.map((source) => source.dispose?.()))
    }
  }
}

export const createAiStatusMiddleware =
  (sources?: readonly AiModelSource[]) =>
  async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void
  ): Promise<void> => {
    if (
      new URL(request.url ?? '/', 'http://app.local').pathname !==
      AI_STATUS_ENDPOINT
    ) {
      next()

      return
    }

    response.setHeader('content-type', 'application/json')
    response.setHeader('cache-control', 'no-store')
    if (request.method !== 'POST' || !admitsLocalProviderRequest(request)) {
      response.statusCode = 403
      response.end(JSON.stringify({ state: 'unavailable' }))

      return
    }

    const controller = new AbortController()

    const abort = () => {
      if (!response.writableEnded) {
        controller.abort()
      }
    }

    response.once('close', abort)
    request.once('aborted', abort)
    try {
      const status = await readAiStatus(controller.signal, sources)

      if (!response.destroyed) {
        response.end(JSON.stringify(status))
      }
    } finally {
      response.removeListener('close', abort)
      request.removeListener('aborted', abort)
    }
  }
