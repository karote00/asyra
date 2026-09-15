import type { AiActionBatch, AiProviderInput } from '@asyra/ai-agent-runtime'
import { subscribeToBrowserDragPhases } from '@asyra/utils'
import { describe, expect, it, vi } from 'vitest'
import {
  ACTION_BATCH_ENDPOINT,
  createServerActionBatchProvider
} from '../server-action-batch-provider'

const input: AiProviderInput = {
  actions: [],
  attempt: 1,
  context: {},
  intent: 'draw the submitted image',
  metadata: {
    imageAttachments: [
      {
        dataUrl: 'data:image/png;base64,AQID',
        mediaType: 'image/png',
        name: 'reference.png',
        size: 3
      }
    ]
  }
}

const batch: AiActionBatch = {
  actions: [],
  batchId: 'backend-batch'
}

describe('server action-batch provider', () => {
  it('posts the exact Agent request to the one same-origin backend endpoint', async () => {
    const phases: string[] = []
    const unsubscribe = subscribeToBrowserDragPhases((name) =>
      phases.push(name)
    )
    const fetch = vi.fn(async () => ({
      json: async () => batch,
      ok: true,
      status: 200
    }))
    const provider = createServerActionBatchProvider({
      fetch: fetch as never
    })

    try {
      await expect(
        provider.requestActionBatch(input, {
          signal: new AbortController().signal
        })
      ).resolves.toBe(batch)

      expect(fetch).toHaveBeenCalledOnce()
      expect(fetch).toHaveBeenCalledWith(ACTION_BATCH_ENDPOINT, {
        body: JSON.stringify(input),
        headers: {
          accept: 'application/x-ndjson, application/json',
          'content-type': 'application/json'
        },
        method: 'POST',
        signal: expect.any(AbortSignal)
      })
      expect(ACTION_BATCH_ENDPOINT).toBe('/api/ai/action-batch')
      expect(phases).toContain('ai-provider:server-response-handoff')
    } finally {
      unsubscribe()
      provider.dispose()
    }
  })

  it('does not accept a resident response or fileId-selected payload', () => {
    expect(createServerActionBatchProvider).toHaveLength(0)
    expect(
      Reflect.getOwnPropertyDescriptor(
        createServerActionBatchProvider,
        'serverResponse'
      )
    ).toBeUndefined()
  })
})

it.each([
  ['ACTION_BATCH_MODEL_TIMEOUT', 'AI_PROVIDER_TIMEOUT'],
  ['ACTION_BATCH_IMAGE_CONVERSION_FAILED', 'AI_PROVIDER_HTTP_STATUS'],
  [
    'ACTION_BATCH_MODEL_CONFIGURATION_REQUIRED',
    'AI_PROVIDER_INVALID_CONFIGURATION'
  ],
  ['ACTION_BATCH_MODEL_INVALID_RESPONSE', 'AI_PROVIDER_MALFORMED_RESPONSE']
])(
  'preserves sanitized backend failure %s without exposing response content',
  async (failure, code) => {
    const provider = createServerActionBatchProvider({
      fetch: vi.fn(
        async () =>
          new Response('secret-provider-body', {
            status: 502,
            headers: { 'x-ai-error-code': failure }
          })
      ) as never
    })
    try {
      await expect(
        provider.requestActionBatch(input, {
          signal: new AbortController().signal
        })
      ).rejects.toMatchObject({ code })
    } finally {
      provider.dispose()
    }
  }
)

it('streams tool activity before the final batch using one request', async () => {
  const onProgress = vi.fn()
  let finish!: () => void
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          JSON.stringify({
            type: 'activity',
            tool: 'vtracer',
            status: 'running'
          }) + '\n'
        )
      )
      finish = () => {
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ type: 'result', batch }) + '\n'
          )
        )
        controller.close()
      }
    }
  })
  const fetch = vi.fn(
    async () =>
      new Response(stream, {
        headers: { 'content-type': 'application/x-ndjson' }
      })
  )
  const provider = createServerActionBatchProvider({ fetch: fetch as never })
  const pending = provider.requestActionBatch(input, {
    signal: new AbortController().signal,
    onProgress
  })
  await vi.waitFor(() =>
    expect(onProgress).toHaveBeenCalledWith({
      tool: 'vtracer',
      status: 'running'
    })
  )
  finish()
  await expect(pending).resolves.toEqual(batch)
  expect(fetch).toHaveBeenCalledOnce()
  provider.dispose()
})

it.each([
  'not-json\n',
  JSON.stringify({ type: 'activity', tool: 'vtracer', status: 'running' }) +
    '\n',
  JSON.stringify({ type: 'result', batch }) +
    '\n' +
    JSON.stringify({ type: 'result', batch }) +
    '\n'
])(
  'rejects incomplete or malformed streams without admitting a batch',
  async (body) => {
    const provider = createServerActionBatchProvider({
      fetch: (async () =>
        new Response(body, {
          headers: { 'content-type': 'application/x-ndjson' }
        })) as never
    })
    await expect(
      provider.requestActionBatch(input, {
        signal: new AbortController().signal
      })
    ).rejects.toMatchObject({ code: 'AI_PROVIDER_MALFORMED_RESPONSE' })
    provider.dispose()
  }
)
