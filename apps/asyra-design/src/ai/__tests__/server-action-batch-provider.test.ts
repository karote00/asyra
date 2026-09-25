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
  it('does not stop a long request at five minutes and still supports Stop', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    let transport: AbortSignal | undefined
    const provider = createServerActionBatchProvider({
      fetch: async (_url, init) => {
        transport = init.signal
        return new Promise<never>(() => undefined)
      }
    })
    try {
      const pending = provider.requestActionBatch(input, {
        signal: controller.signal
      })
      const checked = expect(pending).rejects.toMatchObject({
        code: 'AI_PROVIDER_ABORTED'
      })
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
      expect(transport?.aborted).toBe(false)
      controller.abort()
      await checked
      expect(transport?.aborted).toBe(true)
    } finally {
      controller.abort()
      provider.dispose()
      vi.useRealTimers()
    }
  })

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

describe('sequential server prepared batch transport', () => {
  it('decodes split UTF-8 and multiple frames in a single chunk in order', async () => {
    const frame = JSON.stringify({
      type: 'activity',
      tool: 'prepare_design',
      status: 'completed',
      message: '繪製'
    })
    const bytes = new TextEncoder().encode(
      frame + '\n' + JSON.stringify({ type: 'result', batch }) + '\n'
    )
    const split = bytes.indexOf(0xe7) + 1
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, split))
        controller.enqueue(bytes.slice(split))
        controller.close()
      }
    })
    const provider = createServerActionBatchProvider({
      fetch: (async () =>
        new Response(stream, {
          headers: { 'content-type': 'application/x-ndjson' }
        })) as never
    })
    const onProgress = vi.fn()
    try {
      await expect(
        provider.requestActionBatch(input, {
          signal: new AbortController().signal,
          onProgress
        })
      ).resolves.toEqual(batch)
      expect(onProgress).toHaveBeenCalledWith({
        tool: 'prepare_design',
        status: 'completed',
        message: '繪製'
      })
    } finally {
      provider.dispose()
    }
  })
  it('continues past 64 MiB of complete frames without a cumulative quota', async () => {
    const encoder = new TextEncoder()
    const frame = encoder.encode(
      JSON.stringify({
        type: 'activity',
        tool: 'prepare_design',
        status: 'completed',
        padding: 'x'.repeat(1024 * 1024)
      }) + '\n'
    )
    let sent = 0
    const stream = new ReadableStream({
      pull(controller) {
        if (sent++ < 65) controller.enqueue(frame)
        else {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'result', batch }) + '\n')
          )
          controller.close()
        }
      }
    })
    const provider = createServerActionBatchProvider({
      fetch: (async () =>
        new Response(stream, {
          headers: { 'content-type': 'application/x-ndjson' }
        })) as never
    })
    const onProgress = vi.fn()
    try {
      await expect(
        provider.requestActionBatch(input, {
          signal: new AbortController().signal,
          onProgress
        })
      ).resolves.toEqual(batch)
      expect(onProgress).toHaveBeenCalledTimes(65)
    } finally {
      provider.dispose()
    }
  })

  it('still rejects an oversized unfinished frame across chunks', async () => {
    const chunk = new TextEncoder().encode('x'.repeat(1024 * 1024))
    let sent = 0
    const stream = new ReadableStream({
      pull(controller) {
        if (sent++ < 65) controller.enqueue(chunk)
        else controller.close()
      }
    })
    const provider = createServerActionBatchProvider({
      fetch: (async () =>
        new Response(stream, {
          headers: { 'content-type': 'application/x-ndjson' }
        })) as never
    })
    try {
      await expect(
        provider.requestActionBatch(input, {
          signal: new AbortController().signal
        })
      ).rejects.toMatchObject({ code: 'AI_PROVIDER_MALFORMED_RESPONSE' })
    } finally {
      provider.dispose()
    }
  })

  it('acknowledges only after the runtime executor returns its actual result', async () => {
    const receiptToken = '12345678-1234-1234-1234-123456789abc'
    const receipt = { actionResults: [], context: { actual: true } }
    const calls: string[] = []
    const provider = createServerActionBatchProvider({
      fetch: (async (_url, init) => {
        if ((init?.headers as Record<string, string>)?.['x-ai-batch-receipt']) {
          calls.push('receipt')
          expect(JSON.parse(String(init?.body))).toEqual(receipt)
          return new Response('{}', { status: 200 })
        }
        return new Response(
          [
            JSON.stringify({ type: 'batch', receiptToken, batch }),
            JSON.stringify({
              type: 'result',
              batch: { ...batch, batchId: 'final' }
            })
          ].join('\n'),
          { headers: { 'content-type': 'application/x-ndjson' } }
        )
      }) as never
    })
    const result = await provider.requestActionBatch(input, {
      signal: new AbortController().signal,
      executeBatch: async (prepared) => {
        calls.push('execute')
        expect(prepared).toEqual(batch)
        return receipt
      }
    })
    expect(result.batchId).toBe('final')
    expect(calls).toEqual(['execute', 'receipt'])
    provider.dispose()
  })
})
