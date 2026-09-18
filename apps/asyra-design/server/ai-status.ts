import type { IncomingMessage, ServerResponse } from 'node:http'
import { AI_STATUS_ENDPOINT } from '../src/ai/connection-status'
import { resolveAiModelBackendConfiguration } from './ai-model-provider'
import { admitsLocalProviderRequest } from './local-request-admission'
import { checkLocalAiProvider } from './local-ai-provider'

export const readAiStatus = async (signal?: AbortSignal) => {
  const backend = process.env.AI_PROVIDER_BACKEND?.trim() || 'http'
  if (backend === 'local-codex') {
    const model = process.env.AI_PROVIDER_MODEL?.trim()
    if (!model) return { state: 'unconfigured' }
    try {
      await checkLocalAiProvider({
        model,
        executable: process.env.AI_PROVIDER_EXECUTABLE?.trim() || 'codex',
        signal
      })
      return { state: 'ready' }
    } catch {
      return { state: 'local-unavailable' }
    }
  }
  if (backend !== 'http') return { state: 'unconfigured' }
  try {
    resolveAiModelBackendConfiguration()
    return { state: 'configured' }
  } catch {
    return { state: 'unconfigured' }
  }
}

export const createAiStatusMiddleware =
  () =>
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
      if (!response.writableEnded) controller.abort()
    }
    response.once('close', abort)
    request.once('aborted', abort)
    try {
      const status = await readAiStatus(controller.signal)
      if (!response.destroyed) response.end(JSON.stringify(status))
    } finally {
      response.removeListener('close', abort)
      request.removeListener('aborted', abort)
    }
  }
