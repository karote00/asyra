import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type ServerResponse
} from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createActionBatchMiddleware } from '../action-batch'
import { ACTION_BATCH_ENDPOINT } from '../../src/ai/action-batch-endpoint'

const input = {
  intent: 'Create a rectangle',
  context: {},
  actions: [],
  attempt: 1
}
const batch = {
  batchId: 'batch-1',
  actions: [
    {
      id: 'action-1',
      name: 'create_rectangle',
      arguments: {},
      summary: 'Create'
    }
  ]
}
afterEach(() => vi.unstubAllEnvs())

describe('local subscription endpoint admission', () => {
  it.each([
    'same-origin',
    'no-origin',
    'foreign-origin',
    'null-origin',
    'foreign-host',
    'form',
    'cross-site'
  ])('checks %s before model work', async (kind) => {
    vi.stubEnv('AI_PROVIDER_BACKEND', 'local-codex')
    const requestModelActionBatch = vi.fn(async () => batch)
    const middleware = createActionBatchMiddleware({ requestModelActionBatch })
    const server = createServer((request, response) => {
      void middleware(request, response, () => response.end())
    })
    try {
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      )
      const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      const headers: Record<string, string> = {
        'content-type': 'application/json'
      }
      if (kind === 'same-origin') {
        headers.origin = origin
        headers['sec-fetch-site'] = 'same-origin'
      }
      if (kind === 'foreign-origin') headers.origin = 'https://attacker.example'
      if (kind === 'null-origin') headers.origin = 'null'
      if (kind === 'foreign-host') headers.host = 'attacker.example'
      if (kind === 'form') headers['content-type'] = 'text/plain'
      if (kind === 'cross-site') headers['sec-fetch-site'] = 'cross-site'
      const response = await new Promise<{
        status: number | undefined
        body: unknown
      }>((resolve, reject) => {
        const request = httpRequest(
          origin + ACTION_BATCH_ENDPOINT,
          { method: 'POST', headers },
          (response) => {
            let source = ''
            response.setEncoding('utf8')
            response.on('data', (chunk) => {
              source += chunk
            })
            response.on('end', () =>
              resolve({ status: response.statusCode, body: JSON.parse(source) })
            )
          }
        )
        request.on('error', reject)
        request.end(JSON.stringify(input))
      })
      const accepted = ['same-origin', 'no-origin'].includes(kind)
      expect(response.status).toBe(accepted ? 200 : 403)
      expect(response.body).toEqual(
        accepted ? batch : { code: 'ACTION_BATCH_LOCAL_PROVIDER_FORBIDDEN' }
      )
      expect(requestModelActionBatch).toHaveBeenCalledTimes(accepted ? 1 : 0)
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
    }
  })

  it('rejects a non-loopback peer even with a loopback Host before reading its body', async () => {
    vi.stubEnv('AI_PROVIDER_BACKEND', 'local-codex')
    const requestModelActionBatch = vi.fn(async () => batch)
    const response = { setHeader: vi.fn(), end: vi.fn(), statusCode: 0 }
    await createActionBatchMiddleware({ requestModelActionBatch })(
      {
        url: ACTION_BATCH_ENDPOINT,
        method: 'POST',
        headers: { host: 'localhost:3000', 'content-type': 'application/json' },
        socket: { remoteAddress: '192.0.2.1' }
      } as IncomingMessage,
      response as unknown as ServerResponse,
      vi.fn()
    )
    expect(response.statusCode).toBe(403)
    expect(requestModelActionBatch).not.toHaveBeenCalled()
  })
})
