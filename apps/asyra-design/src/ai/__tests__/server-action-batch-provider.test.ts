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
        if (sent++ < 65) {
          controller.enqueue(frame)
        } else {
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
        if (sent++ < 65) {
          controller.enqueue(chunk)
        } else {
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

it('acknowledges a rejected browser batch and keeps the stream open for recovery', async () => {
  const receiptToken = '12345678-1234-1234-1234-123456789abc'
  const error = new Error('private canonical exception')
  const receipts: unknown[] = []
  const executeBatch = vi.fn(async () => {
    throw error
  })
  const provider = createServerActionBatchProvider({
    fetch: (async (_url, init) => {
      if ((init.headers as Record<string, string>)['x-ai-batch-receipt']) {
        receipts.push(JSON.parse(String(init.body)))

        return new Response('{}')
      }

      return new Response(
        JSON.stringify({ type: 'batch', receiptToken, batch }) +
          '\n' +
          JSON.stringify({ type: 'result', batch }) +
          '\n',
        {
          headers: { 'content-type': 'application/x-ndjson' }
        }
      )
    }) as never
  })

  try {
    await expect(
      provider.requestActionBatch(input, {
        signal: new AbortController().signal,
        executeBatch
      })
    ).resolves.toEqual(batch)
    expect(executeBatch).toHaveBeenCalledOnce()
    expect(receipts).toEqual([
      expect.objectContaining({
        batchFailure: expect.objectContaining({
          batchId: batch.batchId,
          message: expect.any(String),
          executionMs: expect.any(Number)
        })
      })
    ])
    expect(JSON.stringify(receipts)).not.toContain(
      'private canonical exception'
    )
  } finally {
    provider.dispose()
  }
})

it.each(['stop', 'lost-ack'])(
  'preserves execution failure during %s without retrying',
  async (mode) => {
    const controller = new AbortController()
    let posts = 0
    let executions = 0
    const provider = createServerActionBatchProvider({
      fetch: (async (_url, init) => {
        if ((init.headers as Record<string, string>)['x-ai-batch-receipt']) {
          posts++
          throw new Error('ack transport failed')
        }

        return new Response(
          JSON.stringify({
            type: 'batch',
            receiptToken: '12345678-1234-1234-1234-123456789abc',
            batch
          }) + '\n',
          {
            headers: { 'content-type': 'application/x-ndjson' }
          }
        )
      }) as never
    })

    try {
      await expect(
        provider.requestActionBatch(input, {
          signal: controller.signal,

          executeBatch: async () => {
            executions++
            if (mode === 'stop') {
              controller.abort()
            }

            throw new Error('executor failed')
          }
        })
      ).rejects.toBeDefined()
      expect(posts).toBe(mode === 'stop' ? 0 : 1)
      expect(executions).toBe(1)
    } finally {
      provider.dispose()
    }
  }
)

it.each(['ACTION_BATCH_INVALID_RECEIPT', 'private body with secrets'])(
  'records safe receipt rejection metadata without reading bodies or replaying - %s',
  async (code) => {
    const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
    let posts = 0
    const provider = createServerActionBatchProvider({
      fetch: (async (_url, init) => {
        if ((init.headers as Record<string, string>)['x-ai-batch-receipt']) {
          posts++

          return new Response('private error body', {
            status: 413,
            headers: { 'x-ai-error-code': code }
          })
        }

        return new Response(
          JSON.stringify({
            type: 'batch',
            receiptToken: '12345678-1234-1234-1234-123456789abc',
            batch
          }) + '\n',
          { headers: { 'content-type': 'application/x-ndjson' } }
        )
      }) as never
    })

    try {
      const failure = await provider
        .requestActionBatch(input, {
          signal: new AbortController().signal,
          executeBatch
        })
        .catch((error: unknown) => error)

      expect(failure).toMatchObject({
        code: 'AI_PROVIDER_HTTP_STATUS',
        status: 413,
        retryable: false
      })
      expect(String(failure)).toContain('receipt')
      expect(String(failure)).not.toContain('private')
      if (code === 'ACTION_BATCH_INVALID_RECEIPT') {
        expect(String(failure)).toContain(code)
      }

      expect(executeBatch).toHaveBeenCalledOnce()
      expect(posts).toBe(1)
    } finally {
      provider.dispose()
    }
  }
)

it.each(['activity', 'receipt', 'handoff'])(
  'does not dispatch buffered batches after Stop during %s',
  async (phase) => {
    const controller = new AbortController()
    const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
    let receipts = 0
    const frame = {
      type: 'batch',
      receiptToken: '12345678-1234-1234-1234-123456789abc',
      batch
    }
    const provider = createServerActionBatchProvider({
      fetch: (async (_url, init) => {
        if ((init.headers as Record<string, string>)['x-ai-batch-receipt']) {
          receipts++
          if (phase === 'receipt') {
            controller.abort()
          }

          return new Response('{}')
        }

        if (phase === 'handoff') {
          controller.abort()
        }

        return new Response(
          [
            { type: 'activity', tool: 'prepare_design', status: 'running' },
            frame,
            frame,
            { type: 'result', batch }
          ]
            .map((value) => JSON.stringify(value))
            .join('\n') + '\n',
          {
            headers: { 'content-type': 'application/x-ndjson' }
          }
        )
      }) as never
    })

    try {
      await expect(
        provider.requestActionBatch(input, {
          signal: controller.signal,
          executeBatch,

          onProgress: () => {
            if (phase === 'activity') {
              controller.abort()
            }
          }
        })
      ).rejects.toMatchObject({ code: 'AI_PROVIDER_ABORTED' })
      // The HTTP abort race can settle before the buffered parser unwinds.
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(executeBatch).toHaveBeenCalledTimes(phase === 'receipt' ? 1 : 0)
      expect(receipts).toBe(phase === 'receipt' ? 1 : 0)
    } finally {
      controller.abort()
      provider.dispose()
    }
  }
)

// Exercise capture against the actual transport owner, not hand-authored HTTP examples.
describe('evaluation capture and actual provider protocol', () => {
  it.each([
    'success',
    'execution-failure',
    'rejected-receipt',
    'lost-receipt',
    'cancelled'
  ])(
    'attributes only inference and never replays execution during %s',
    async (mode) => {
      const { captureRequestIdentity } =
        await import('../../../test-data/knowledge-evaluation/capture-source.mjs')
      const { AI_BATCH_RECEIPT_HEADER } =
        await import('../action-batch-endpoint')
      const controller = new AbortController()
      const identities: string[] = []
      const receipts: unknown[] = []
      let executions = 0
      let modelRequests = 0
      const provider = createServerActionBatchProvider({
        fetch: async (url, init) => {
          const headers = Object.fromEntries(
            new Headers(init.headers).entries()
          )
          const id = captureRequestIdentity(
            {
              url: () => new URL(String(url), 'http://capture.test').href,

              method: () => init.method,

              headers: () => headers,

              postDataJSON: () => JSON.parse(String(init.body))
            },
            'http://capture.test'
          )

          if (id) {
            identities.push(id)
          }

          if (headers[AI_BATCH_RECEIPT_HEADER] !== undefined) {
            receipts.push(JSON.parse(String(init.body)))
            if (mode === 'lost-receipt') {
              throw new Error('Acknowledgement connection lost')
            }

            return new Response('{}', {
              status: mode === 'rejected-receipt' ? 409 : 200
            })
          }

          modelRequests++

          return new Response(
            [
              JSON.stringify({
                type: 'batch',
                receiptToken: '12345678-1234-1234-1234-123456789abc',
                batch
              }),
              JSON.stringify({ type: 'result', batch })
            ].join('\n'),
            { headers: { 'content-type': 'application/x-ndjson' } }
          )
        }
      })

      try {
        const pending = provider.requestActionBatch(
          {
            ...input,
            metadata: {
              ...input.metadata,
              sourceRequestId: 'real-provider-request'
            }
          },
          {
            signal: controller.signal,

            executeBatch: async () => {
              executions++
              if (mode === 'cancelled') {
                controller.abort()
              }

              if (mode === 'execution-failure') {
                throw new Error('Canonical execution rejected')
              }

              return { actionResults: [], context: { executed: true } }
            }
          }
        )

        if (['success', 'execution-failure'].includes(mode)) {
          await expect(pending).resolves.toEqual(batch)
        } else {
          await expect(pending).rejects.toBeDefined()
        }

        expect(identities).toEqual(['real-provider-request'])
        expect(modelRequests).toBe(1)
        expect(executions).toBe(1)
        expect(receipts).toHaveLength(mode === 'cancelled' ? 0 : 1)
        if (mode === 'execution-failure') {
          expect(receipts[0]).toHaveProperty('batchFailure')
        }
      } finally {
        controller.abort()
        provider.dispose()
      }
    }
  )
})

it('delivers the exact local evaluation deadline with existing metadata and leaves ordinary requests unchanged', async () => {
  const previous = location.href
  const window = {
    workDeadlineAt: Date.now() + 120000,
    reportTimeoutMs: 300000,
    announceWorkDeadline: false,
    reportInstructions: 'Explain actual waits in the same thread.',
    expandedNodeLimit: 2000
  }
  const url = new URL(previous)

  url.searchParams.set('aiEvaluationWindow', JSON.stringify(window))
  history.replaceState(null, '', url)
  const requests: unknown[] = []
  const provider = createServerActionBatchProvider({
    fetch: async (_url, init) => {
      requests.push(JSON.parse(String(init.body)))

      return {
        ok: true,
        status: 200,

        json: async () => batch
      }
    }
  })

  try {
    await provider.requestActionBatch(input, {
      signal: new AbortController().signal
    })
    expect(requests[0]).toMatchObject({
      metadata: { ...(input.metadata as object), evaluationWindow: window }
    })
    history.replaceState(null, '', previous)
    await provider.requestActionBatch(input, {
      signal: new AbortController().signal
    })
    expect(requests[1]).toEqual(input)
  } finally {
    history.replaceState(null, '', previous)
    provider.dispose()
  }
})

describe('progress admission is independent of execution', () => {
  it.each([
    { tool: 'design_operations.map_retained_fills', status: 'running' },
    { tool: 42, status: 'running' },
    { tool: 'read_design_context', status: 'invalid' },
    {
      tool: 'read_design_context',
      status: 'running',
      activity: { kind: 'invalid' }
    },
    { status: 'running' }
  ])(
    'retains the open execution stream after progress %j',
    async (progress) => {
      let streamController!: ReadableStreamDefaultController<Uint8Array>
      const cancelled = vi.fn()
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          streamController = controller
        },

        cancel: cancelled
      })

      const frame = (value: unknown) =>
        streamController.enqueue(
          new TextEncoder().encode(JSON.stringify(value) + '\n')
        )

      const receipt = { context: {}, actionResults: [] }
      const executeBatch = vi.fn(async () => receipt)
      const onProgress = vi.fn()
      let requests = 0
      const fetch = vi.fn(async () =>
        ++requests > 1
          ? new Response('{}')
          : new Response(stream, {
              headers: { 'content-type': 'application/x-ndjson' }
            })
      )
      const provider = createServerActionBatchProvider({
        fetch: fetch as never
      })
      let settled = false
      const pending = provider.requestActionBatch(input, {
        signal: new AbortController().signal,
        executeBatch,
        onProgress
      })

      void pending.then(
        () => {
          settled = true
        },
        () => {
          settled = true
        }
      )

      try {
        frame({ type: 'activity', ...progress })
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(settled).toBe(false)
        expect(cancelled).not.toHaveBeenCalled()
        frame({
          type: 'batch',
          receiptToken: '11111111-1111-4111-8111-111111111111',
          batch
        })
        await vi.waitFor(() => expect(executeBatch).toHaveBeenCalledOnce())
        frame({ type: 'result', batch })
        streamController.close()
        await expect(pending).resolves.toEqual(batch)
        expect(executeBatch).toHaveBeenCalledOnce()
        expect(fetch).toHaveBeenCalledTimes(2)
        if (typeof progress.tool === 'string' && progress.tool.includes('.')) {
          expect(onProgress).toHaveBeenCalledWith(progress)
        } else {
          expect(onProgress).not.toHaveBeenCalled()
        }
      } finally {
        provider.dispose()
      }
    }
  )
})

it('isolates observer exceptions while preserving final execution results', async () => {
  const provider = createServerActionBatchProvider({
    fetch: (async () =>
      new Response(
        [
          {
            type: 'activity',
            tool: 'design_operations.map_retained_fills',
            status: 'running'
          },
          { type: 'result', batch }
        ]
          .map((frame) => JSON.stringify(frame))
          .join('\n'),
        { headers: { 'content-type': 'application/x-ndjson' } }
      )) as never
  })

  try {
    await expect(
      provider.requestActionBatch(input, {
        signal: new AbortController().signal,

        onProgress: () => {
          throw new Error('Observer failed')
        }
      })
    ).resolves.toEqual(batch)
  } finally {
    provider.dispose()
  }
})

it.each([
  { type: 'unknown', tool: 'read_design_context', status: 'running' },
  { type: 'batch', batch },
  { type: 'result' },
  { type: 'error', code: 'ACTION_BATCH_MODEL_INVALID_RESPONSE' }
])(
  'keeps execution protocol errors fatal after ignored progress: %j',
  async (event) => {
    const executeBatch = vi.fn()
    const provider = createServerActionBatchProvider({
      fetch: (async () =>
        new Response(
          [
            { type: 'activity', tool: null, status: 'invalid' },
            event,
            { type: 'result', batch }
          ]
            .map((frame) => JSON.stringify(frame))
            .join('\n'),
          { headers: { 'content-type': 'application/x-ndjson' } }
        )) as never
    })

    try {
      await expect(
        provider.requestActionBatch(input, {
          signal: new AbortController().signal,
          executeBatch
        })
      ).rejects.toMatchObject({ code: 'AI_PROVIDER_MALFORMED_RESPONSE' })
      expect(executeBatch).not.toHaveBeenCalled()
    } finally {
      provider.dispose()
    }
  }
)

it('still honors user cancellation after dropping invalid progress', async () => {
  const controller = new AbortController()
  const cancel = vi.fn()
  const onProgress = vi.fn()
  const stream = new ReadableStream<Uint8Array>({
    start(output) {
      output.enqueue(
        new TextEncoder().encode(
          JSON.stringify({ type: 'activity', tool: null, status: 'running' }) +
            '\n'
        )
      )
    },

    cancel
  })
  const provider = createServerActionBatchProvider({
    fetch: (async () =>
      new Response(stream, {
        headers: { 'content-type': 'application/x-ndjson' }
      })) as never
  })
  const pending = provider.requestActionBatch(input, {
    signal: controller.signal,
    onProgress
  })
  const stopped = expect(pending).rejects.toMatchObject({
    code: 'AI_PROVIDER_ABORTED'
  })

  try {
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(cancel).not.toHaveBeenCalled()
    controller.abort()
    await stopped
    await vi.waitFor(() => expect(cancel).toHaveBeenCalledOnce())
    expect(onProgress).not.toHaveBeenCalled()
  } finally {
    provider.dispose()
  }
})

it('ignores late progress after the final result without reopening activity', async () => {
  const onProgress = vi.fn()
  const provider = createServerActionBatchProvider({
    fetch: (async () =>
      new Response(
        [
          { type: 'result', batch },
          {
            type: 'activity',
            tool: 'design_operations.map_retained_fills',
            status: 'running'
          },
          { type: 'activity', tool: null, status: 'invalid' }
        ]
          .map((frame) => JSON.stringify(frame))
          .join('\n'),
        { headers: { 'content-type': 'application/x-ndjson' } }
      )) as never
  })

  try {
    await expect(
      provider.requestActionBatch(input, {
        signal: new AbortController().signal,
        onProgress
      })
    ).resolves.toEqual(batch)
    expect(onProgress).not.toHaveBeenCalled()
  } finally {
    provider.dispose()
  }
})

it('acknowledges browser conversation result writes and private reads without invoking a canvas action', async () => {
  const token = '12345678-1234-1234-1234-123456789abc'
  const commands = [
    { save: { trim: 'private-element-id' } },
    { read: { trim: { name: 'trim', path: '' } } },
    { read: { trim: { name: 'trim', path: '' } } }
  ]
  const requests: Record<string, unknown>[] = []
  const acks: AiBatchReceiptLike[] = []

  interface AiBatchReceiptLike {
    context: { ok: boolean; values?: Record<string, unknown> }
  }
  const provider = createServerActionBatchProvider({
    fetch: async (_url, init) => {
      const value = JSON.parse(init.body)

      if ('context' in value && 'actionResults' in value) {
        acks.push(value)

        return new Response('{}')
      }

      requests.push(value)

      return new Response(
        JSON.stringify({
          type: 'conversation-results',
          receiptToken: token,
          command: commands.shift()
        }) +
          '\n' +
          JSON.stringify({ type: 'result', batch }) +
          '\n',
        { headers: { 'content-type': 'application/x-ndjson' } }
      )
    }
  })
  const executeBatch = vi.fn()

  try {
    for (const conversationId of ['one', 'one', 'two']) {
      await provider.requestActionBatch(
        { ...input, metadata: { conversationId } },
        { signal: new AbortController().signal, executeBatch }
      )
    }

    expect(acks.map((a) => a.context.ok)).toEqual([true, true, false])
    expect(acks[1].context.values).toEqual({ trim: 'private-element-id' })
    expect(requests[1].metadata).toMatchObject({
      conversationResultNames: ['trim']
    })
    expect(JSON.stringify(requests)).not.toContain('private-element-id')
    expect(executeBatch).not.toHaveBeenCalled()
  } finally {
    provider.dispose()
  }
})
