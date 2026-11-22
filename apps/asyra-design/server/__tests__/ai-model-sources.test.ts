import { expect, it, vi } from 'vitest'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'
import {
  createToolCallingDesignSource,
  selectAiModelSource
} from '../ai-model-sources'

const { records } = vi.hoisted(() => {
  const records: unknown[] = []

  return { records }
})

vi.mock('@asyra/ai-agent-runtime/node', async (original) => ({
  ...(await original<typeof import('@asyra/ai-agent-runtime/node')>()),

  createExecutionRecordSink: () => ({
    write: (record: unknown) => {
      records.push(record)
    },

    flush: async () => ({ status: 'saved', path: null })
  }),

  createSqliteToolStore: async () => ({
    read: async () => undefined,

    list: async () => [],

    write: async () => {
      throw Error('No test storage')
    },

    close: async () => undefined
  })
}))
const input = {
  intent: 'Explain the available help',
  context: {},
  actions: [],
  attempt: 1
}
const final = {
  batchId: 'answer',
  actions: [
    {
      id: 'answer',
      name: 'report_outcome',
      arguments: { outcome: 'completed', message: 'Ready' },
      summary: 'Ready'
    }
  ]
}

it('uses the same prepared Design pipeline for an independently supplied model source', async () => {
  const dispose = vi.fn()
  const source = createToolCallingDesignSource({
    id: 'independent-source',

    configured: () => true,

    create: (prepare) => ({
      async requestActionBatch(value, options) {
        const binding = await prepare(value, options)

        expect(
          binding.tools.some((group) => group.name === 'design_knowledge')
        ).toBe(true)
        expect(binding.instructions).toContain('Return one final JSON object')
        expect(
          binding
            .input(false)
            .some(
              (item) =>
                item.type === 'inputText' && item.text.includes(input.intent)
            )
        ).toBe(true)
        const reply = await binding.invoke({
          namespace: 'design_knowledge',
          name: 'discover_knowledge',
          callId: 'knowledge',
          arguments: { query: 'button' }
        })

        expect(
          reply.contentItems.some(
            (item) =>
              item.type === 'inputText' && item.text.includes('toolOutcome')
          )
        ).toBe(true)

        return binding.decode({
          id: 'external-turn',
          text: JSON.stringify(final)
        })
      },

      dispose
    })
  })

  expect(
    await requestConfiguredAiActionBatch(input, {
      sources: [source],
      environment: {
        AI_PROVIDER_BACKEND: source.id,
        AI_PROVIDER_MODEL: 'external-model'
      }
    })
  ).toEqual(final)
  expect(dispose).toHaveBeenCalledTimes(1)
})

it('rejects unknown and duplicate source identities without selecting a fallback', () => {
  const source = {
    id: 'one',
    request: vi.fn(),

    status: async () => ({ state: 'configured' as const })
  }

  expect(() => selectAiModelSource('missing', [source])).toThrow(
    'not registered'
  )
  expect(() => selectAiModelSource('one', [source, source])).toThrow(
    'Duplicate'
  )
  expect(source.request).not.toHaveBeenCalled()
})

it.each([
  ['AI_PROVIDER_ABORTED', 'ACTION_BATCH_ABORTED'],
  ['AI_PROVIDER_MALFORMED_RESPONSE', 'ACTION_BATCH_MODEL_INVALID_RESPONSE'],
  ['AI_PROVIDER_HTTP_STATUS', 'ACTION_BATCH_MODEL_FAILED'],
  [
    'AI_PROVIDER_INVALID_CONFIGURATION',
    'ACTION_BATCH_MODEL_CONFIGURATION_REQUIRED'
  ]
] as const)(
  'hands %s to the existing App error boundary',
  async (code, expected) => {
    const { AiProviderError } = await import('@asyra/ai-agent-runtime')
    const { resolveActionBatchRequest } = await import('../action-batch')

    await expect(
      resolveActionBatchRequest(input, {
        requestModelActionBatch: async () => {
          throw new AiProviderError({ code, message: 'Provider failure' })
        }
      })
    ).rejects.toMatchObject({ code: expected })
  }
)

it('applies local request admission before a registered API source can spend credentials', async () => {
  const { createServer } = await import('node:http')
  const { createActionBatchMiddleware } = await import('../action-batch')

  vi.stubEnv('AI_PROVIDER_BACKEND', 'external-source')
  const source = {
    id: 'external-source',
    request: vi.fn(async () => final),

    status: async () => ({ state: 'configured' as const })
  }
  const middleware = createActionBatchMiddleware({ sources: [source] })
  const server = createServer((request, response) => {
    void middleware(request, response, () => response.end())
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()

  if (!address || typeof address === 'string') {
    throw Error('Missing listener')
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/ai/action-batch`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://foreign.example'
        },
        body: JSON.stringify(input)
      }
    )

    expect(response.status).toBe(403)
    expect(source.request).not.toHaveBeenCalled()
  } finally {
    await middleware.dispose()
    await new Promise<void>((resolve) => server.close(() => resolve()))
    vi.unstubAllEnvs()
  }
})

it('drains active turn providers before disposing service continuation and rejects later work', async () => {
  let enter!: () => void
  const entered = new Promise<void>((resolve) => {
    enter = resolve
  })
  let stop!: () => void
  const events: string[] = []
  const source = createToolCallingDesignSource({
    id: 'owned-source',

    configured: () => true,

    create: () => ({
      requestActionBatch: async () => {
        enter()
        await new Promise<void>((resolve) => {
          stop = resolve
        })
        events.push('turn-ended')
        throw Error('Disposed transport')
      },

      dispose: async () => {
        stop()
        events.push('provider-disposed')
      }
    }),

    dispose: () => {
      events.push('service-disposed')
    }
  })
  const options = { environment: { AI_PROVIDER_MODEL: 'model' } }
  const request = source.request(input, options)
  const rejection = expect(request).rejects.toMatchObject({
    code: 'AI_MODEL_BACKEND_ABORTED'
  })

  await entered
  await source.dispose?.()
  await rejection
  expect(events.at(-1)).toBe('service-disposed')
  expect(events).toContain('turn-ended')
  await expect(source.request(input, options)).rejects.toThrow('disposed')
})

it('does not label an independently configured model with Codex reasoning effort', async () => {
  records.length = 0
  const source = createToolCallingDesignSource({
    id: 'other',

    configured: () => true,

    create: () => ({ requestActionBatch: async () => final })
  })

  try {
    await source.request(input, {
      environment: {
        AI_PROVIDER_MODEL: 'other-model',
        AI_EXECUTION_SOURCE_REVISION: 'test'
      }
    })
    const usage = records.find(
      (record) =>
        typeof record === 'object' &&
        record !== null &&
        'event' in record &&
        record.event === 'ai_request_started'
    )

    expect(usage).toMatchObject({ provider: 'other', effort: null })
  } finally {
    await source.dispose?.()
  }
})

it.each(['caller', 'source'] as const)(
  'propagates %s cancellation through the actual Responses source',
  async (owner) => {
    const { createDefaultAiModelSources } = await import('../ai-model-sources')
    let entered!: () => void
    const started = new Promise<void>((resolve) => {
      entered = resolve
    })
    let release!: () => void
    let transportSignal: AbortSignal | null | undefined

    const fetcher: typeof fetch = async (_url, init) => {
      transportSignal = init?.signal
      entered()
      await new Promise<void>((resolve) => {
        release = resolve
      })

      return Response.json({
        id: 'late',
        status: 'completed',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: JSON.stringify(final) }]
          }
        ]
      })
    }

    const sources = createDefaultAiModelSources({
      continuationDatabase: ':memory:',
      fetch: fetcher
    })
    const source = selectAiModelSource('openai-responses', sources)
    const controller = new AbortController()
    const task = source.request(input, {
      signal: controller.signal,
      environment: {
        AI_PROVIDER_MODEL: 'fixture',
        OPENAI_API_KEY: 'fixture',
        AI_EXECUTION_SOURCE_REVISION: 'fixture'
      }
    })
    const settled = task.catch((error: unknown) => error)
    let disposal: void | Promise<void> = undefined

    try {
      await started
      if (owner === 'caller') {
        controller.abort()
      } else {
        disposal = source.dispose?.()
      }

      expect(transportSignal?.aborted).toBe(true)
    } finally {
      release()
      const result = await settled

      expect(result).toMatchObject({ code: expect.stringMatching(/ABORTED$/) })
      await disposal
      await Promise.all(sources.map((item) => item.dispose?.()))
    }
  }
)

it('binds transport cancellation to tool work without making observation authoritative', async () => {
  let hostWasCancelled = false
  const source = createToolCallingDesignSource({
    id: 'transport-cancel',

    configured: () => true,

    create: (prepare) => ({
      async requestActionBatch(value, options) {
        const controller = new AbortController()
        const binding = await prepare(value, {
          ...options,
          signal: controller.signal
        })

        controller.abort()
        try {
          await binding.invoke({
            namespace: 'design_knowledge',
            name: 'read_knowledge',
            callId: 'cancelled',
            arguments: { ids: ['colors'] }
          })
        } catch {
          hostWasCancelled = true
        }

        return final
      }
    })
  })

  try {
    await source
      .request(input, {
        environment: {
          AI_PROVIDER_MODEL: 'fixture',
          AI_EXECUTION_SOURCE_REVISION: 'fixture'
        },

        onProgress: () => {
          throw Error('Observer unavailable')
        }
      })
      .catch(() => undefined)
    expect(hostWasCancelled).toBe(true)
  } finally {
    await source.dispose?.()
  }
})

it('records one terminal delivery and progress for each call using the advertised contract', async () => {
  const { operationContractIssue } =
    await import('@asyra/ai-agent-runtime/schema')
  const progress: unknown[] = []

  records.length = 0
  const source = createToolCallingDesignSource({
    id: 'observed-source',

    configured: () => true,

    create: (prepare) => ({
      async requestActionBatch(value, options) {
        const binding = await prepare(value, options)
        const declaration = binding.tools
          .find((group) => group.name === 'design_knowledge')
          ?.tools.find((tool) => tool.name === 'read_knowledge')

        expect(declaration).toBeDefined()
        const args = { ids: ['colors'] }

        expect(
          operationContractIssue(args, declaration?.inputSchema)
        ).toBeUndefined()
        await binding.invoke({
          namespace: 'design_knowledge',
          name: 'read_knowledge',
          callId: 'observed-call',
          arguments: args
        })

        return final
      }
    })
  })

  try {
    await source.request(input, {
      environment: {
        AI_PROVIDER_MODEL: 'fixture',
        AI_EXECUTION_SOURCE_REVISION: 'fixture'
      },

      onProgress: (event) => progress.push(event)
    })
    const started = records.filter(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        'stage' in entry &&
        entry.stage === 'tool_started' &&
        'callId' in entry &&
        entry.callId === 'observed-call'
    )
    const completed = records.filter(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        'stage' in entry &&
        entry.stage === 'tool_completed' &&
        'callId' in entry &&
        entry.callId === 'observed-call'
    )

    expect(started).toHaveLength(1)
    expect(completed).toHaveLength(1)
    expect(progress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'completed',
          activity: expect.objectContaining({
            callId: 'observed-call',
            outcome: { status: 'success', settlement: 'completed' }
          })
        })
      ])
    )
    expect(started[0]).toMatchObject({
      evidence: { contractDigest: expect.any(String) }
    })
  } finally {
    await source.dispose?.()
  }
})

it.each(['not JSON', '{"batchId":"invalid","actions":[]}'])(
  'rejects malformed Responses final output without returning a successful batch: %s',
  async (text) => {
    const { createDefaultAiModelSources } = await import('../ai-model-sources')
    const sources = createDefaultAiModelSources({
      continuationDatabase: ':memory:',

      fetch: async () =>
        Response.json({
          id: 'invalid-final',
          status: 'completed',
          output: [
            {
              type: 'message',
              role: 'assistant',
              phase: 'final_answer',
              content: [{ type: 'output_text', text }]
            }
          ]
        })
    })

    try {
      await expect(
        requestConfiguredAiActionBatch(input, {
          sources,
          environment: {
            AI_PROVIDER_BACKEND: 'openai-responses',
            AI_PROVIDER_MODEL: 'fixture',
            OPENAI_API_KEY: 'fixture-secret',
            AI_EXECUTION_SOURCE_REVISION: 'fixture'
          }
        })
      ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_INVALID_RESPONSE' })
    } finally {
      await Promise.all(sources.map((source) => source.dispose?.()))
    }
  }
)
