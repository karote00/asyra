import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readAiStatus, createAiStatusMiddleware } from '../ai-status'
import { checkLocalAiProvider } from '../local-ai-provider'
vi.mock('../local-ai-provider', () => ({ checkLocalAiProvider: vi.fn() }))
afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
})
describe('AI readiness without inference', () => {
  it('requires model configuration before spawning a probe', async () => {
    vi.stubEnv('AI_PROVIDER_BACKEND', 'local-codex')
    vi.stubEnv('AI_PROVIDER_MODEL', '')
    expect(await readAiStatus()).toEqual({ state: 'unconfigured' })
    expect(checkLocalAiProvider).not.toHaveBeenCalled()
  })
  it('returns only readiness, never personal configuration or errors', async () => {
    vi.stubEnv('AI_PROVIDER_BACKEND', 'local-codex')
    vi.stubEnv('AI_PROVIDER_MODEL', 'personal-model')
    vi.mocked(checkLocalAiProvider).mockResolvedValue(undefined)
    expect(await readAiStatus()).toEqual({ state: 'ready' })
    vi.mocked(checkLocalAiProvider).mockRejectedValue(
      new Error('private@example.test token')
    )
    expect(await readAiStatus()).toEqual({ state: 'local-unavailable' })
  })
  it('does not claim a configured HTTP endpoint was contacted', async () => {
    vi.stubEnv('AI_PROVIDER_BACKEND', 'http')
    vi.stubEnv('AI_PROVIDER_MODEL', 'model')
    vi.stubEnv('AI_PROVIDER_ENDPOINT', 'https://example.test/model')
    vi.stubEnv('AI_PROVIDER_API_KEY', 'private')
    expect(await readAiStatus()).toEqual({ state: 'configured' })
    expect(checkLocalAiProvider).not.toHaveBeenCalled()
  })
})

describe('readiness route admission', () => {
  it.each(['GET', 'foreign-origin', 'remote-peer', 'accepted', 'other-route'])(
    'checks %s before opening a local process',
    async (kind) => {
      vi.stubEnv('AI_PROVIDER_BACKEND', 'local-codex')
      vi.stubEnv('AI_PROVIDER_MODEL', 'model')
      const request = Object.assign(new EventEmitter(), {
        url: kind === 'other-route' ? '/other' : '/api/ai/status',
        method: kind === 'GET' ? 'GET' : 'POST',
        headers: {
          host: 'localhost:3000',
          origin:
            kind === 'foreign-origin'
              ? 'https://example.test'
              : 'http://localhost:3000',
          'content-type': 'application/json'
        },
        socket: {
          remoteAddress: kind === 'remote-peer' ? '192.168.1.1' : '127.0.0.1'
        }
      })
      const response = Object.assign(new EventEmitter(), {
        setHeader: vi.fn(),
        end: vi.fn(),
        statusCode: 200,
        destroyed: false,
        writableEnded: false
      })
      const next = vi.fn()
      await createAiStatusMiddleware()(
        request as unknown as IncomingMessage,
        response as unknown as ServerResponse,
        next
      )
      expect(checkLocalAiProvider).toHaveBeenCalledTimes(
        kind === 'accepted' ? 1 : 0
      )
      expect(next).toHaveBeenCalledTimes(kind === 'other-route' ? 1 : 0)
      if (kind !== 'other-route') {
        expect(response.statusCode).toBe(kind === 'accepted' ? 200 : 403)
        expect(response.setHeader).toHaveBeenCalledWith(
          'cache-control',
          'no-store'
        )
      }
    }
  )
})
