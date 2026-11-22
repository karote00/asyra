import { expect, it, vi } from 'vitest'
import { memoryStore } from '../../__tests__/fixtures/recipe-host.js'
import { createAiActionRegistry } from '../../action-registry.js'
import { invokeAiToolOwner } from '../../schema/owner-invocation.js'
import { createAiToolLeases } from '../../schema/tool-leases.js'
import { operationContractIssue } from '../../schema/validation.js'
import {
  createResponsesAiProvider,
  createResponsesConversations
} from '../responses-provider.js'
import { createAiToolHostLibrary } from '../tool-host-library.js'
import type { ToolProviderBinding } from '../tool-provider.js'

const input = {
  intent: 'Reserve inventory',
  context: {},
  actions: [],
  attempt: 1,
  metadata: { conversationId: 'one' }
}

const signal = () => new AbortController().signal

const final = {
  batchId: 'final',
  actions: [{ id: 'report', name: 'report', arguments: {}, summary: 'Done' }]
}
const message = {
  type: 'message',
  role: 'assistant',
  phase: 'final_answer',
  content: [{ type: 'output_text', text: JSON.stringify(final) }]
}

const call = (id: string, args = '{}') => ({
  type: 'function_call',
  namespace: 'inventory',
  name: 'reserve',
  call_id: id,
  arguments: args
})

const reply = (output: unknown[], status = 'completed') =>
  Response.json({ id: 'response', status, output })

const tools = [
  {
    name: 'inventory',
    description: 'Inventory operations',
    tools: [
      {
        name: 'reserve',
        description: 'Reserve a product',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false
        },
        deferLoading: true
      }
    ]
  }
]

const makeBinding = (
  overrides: Partial<ToolProviderBinding> = {}
): ToolProviderBinding => ({
  instructions: 'Manage inventory',
  tools,

  input: () => [{ type: 'inputText', text: 'Reserve product one' }],

  invoke: async () => ({
    contentItems: [
      { type: 'inputText', text: '{"id":"one"}' },
      {
        type: 'inputText',
        text: '{"toolOutcome":{"status":"success","settlement":"completed"}}'
      }
    ]
  }),

  decode: ({ text }) => JSON.parse(text),

  ...overrides
})

it('publishes exact schemas and returns correlated outputs before continuing the same conversation', async () => {
  const requests: Record<string, unknown>[] = []
  const reasoning = {
    type: 'reasoning',
    id: 'reason',
    encrypted_content: 'opaque',
    summary: []
  }
  const invoke = vi.fn(makeBinding().invoke)
  const prepare = vi.fn(async () => makeBinding({ invoke }))

  const fetcher: typeof fetch = async (_url, init) => {
    requests.push(JSON.parse(String(init?.body)))

    return reply(requests.length === 1 ? [reasoning, call('c1')] : [message])
  }

  const provider = createResponsesAiProvider({
    apiKey: 'test-key',
    model: 'test-model',
    fetch: fetcher,
    prepare
  })

  expect(
    await provider.requestActionBatch(input, { signal: signal() })
  ).toEqual(final)
  expect(
    await provider.requestActionBatch(input, { signal: signal() })
  ).toEqual(final)
  expect(invoke).toHaveBeenCalledTimes(1)
  expect(requests[0]).toMatchObject({
    store: true,
    input: [
      {
        role: 'developer',
        content: [{ type: 'input_text', text: 'Manage inventory' }]
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: 'Reserve product one' }]
      }
    ],
    tools: [
      {
        type: 'namespace',
        name: 'inventory',
        tools: [
          {
            name: 'reserve',
            strict: false,
            parameters: tools[0].tools[0].inputSchema,
            defer_loading: true
          }
        ]
      },
      { type: 'tool_search' }
    ]
  })
  expect(requests[0]).not.toHaveProperty('instructions')
  expect(requests[1].previous_response_id).toBe('response')
  expect(requests[1].input).toEqual([
    {
      type: 'function_call_output',
      call_id: 'c1',
      output: [
        { type: 'input_text', text: '{"id":"one"}' },
        {
          type: 'input_text',
          text: '{"toolOutcome":{"status":"success","settlement":"completed"}}'
        }
      ]
    }
  ])
  expect(requests[2].previous_response_id).toBe('response')
  expect(requests[2].input).toEqual([
    {
      role: 'user',
      content: [{ type: 'input_text', text: 'Reserve product one' }]
    }
  ])
  expect(prepare).toHaveBeenCalledTimes(2)
  await provider.dispose?.()
})

it('lets the model repair malformed JSON without invoking the owner or ending the turn', async () => {
  let count = 0
  const invoke = vi.fn(makeBinding().invoke)
  const outputs: unknown[] = []
  const provider = createResponsesAiProvider({
    apiKey: 'test-key',
    model: 'm',

    prepare: async () => makeBinding({ invoke }),

    fetch: async (_url, init) => {
      outputs.push(JSON.parse(String(init?.body)))

      count++
      if (count === 1) {
        return reply([call('bad', '{')])
      }

      if (count === 2) {
        return reply([call('good')])
      }

      return reply([message])
    }
  })

  expect(
    await provider.requestActionBatch(input, { signal: signal() })
  ).toEqual(final)
  expect(invoke).toHaveBeenCalledTimes(1)
  expect(JSON.stringify(outputs[1])).toContain('TOOL_ARGUMENTS_INVALID')
  expect(JSON.stringify(outputs[1])).toContain('toolOutcome')
  await provider.dispose?.()
})

it.each(['failed', 'incomplete', 'in_progress'])(
  'rejects %s responses before executing any proposed action',
  async (status) => {
    const invoke = vi.fn(makeBinding().invoke)
    const provider = createResponsesAiProvider({
      apiKey: 'test-key',
      model: 'm',

      prepare: async () => makeBinding({ invoke }),

      fetch: async () => reply([call('unsafe')], status)
    })

    await expect(
      provider.requestActionBatch(input, { signal: signal() })
    ).rejects.toMatchObject({
      code: 'AI_PROVIDER_MALFORMED_RESPONSE',
      retryable: false
    })
    expect(invoke).not.toHaveBeenCalled()
    await provider.dispose?.()
  }
)

it('does not repeat a completed mutation after HTTP failure while handing its result to the next turn', async () => {
  let count = 0
  const invoke = vi.fn(makeBinding().invoke)
  const requests: Record<string, unknown>[] = []
  const provider = createResponsesAiProvider({
    apiKey: 'secret',
    model: 'm',

    prepare: async () => makeBinding({ invoke }),

    fetch: async (_url, init) => {
      requests.push(JSON.parse(String(init?.body)))
      count++
      if (count === 2) {
        return Response.json({ error: { message: 'secret' } }, { status: 429 })
      }

      return reply(count === 1 ? [call('write')] : [message])
    }
  })

  await expect(
    provider.requestActionBatch(input, { signal: signal() })
  ).rejects.toMatchObject({
    code: 'AI_PROVIDER_HTTP_STATUS',
    status: 429,
    retryable: false
  })
  expect(
    await provider.requestActionBatch(input, { signal: signal() })
  ).toEqual(final)
  expect(invoke).toHaveBeenCalledTimes(1)
  expect(JSON.stringify(requests[2].input)).toContain('function_call_output')
  await provider.dispose?.()
})

it('blocks continuation after uncertain execution', async () => {
  let count = 0
  const dispose = vi.fn()
  const invoke = vi.fn(async () => {
    throw Error('unknown settlement')
  })
  const provider = createResponsesAiProvider({
    apiKey: 'secret',
    model: 'm',

    prepare: async () => makeBinding({ invoke, dispose }),

    fetch: async () => {
      count++

      return reply([call('write')])
    }
  })

  await expect(
    provider.requestActionBatch(input, { signal: signal() })
  ).rejects.toThrow('unknown settlement')
  await expect(
    provider.requestActionBatch(input, { signal: signal() })
  ).rejects.toThrow('unavailable')
  expect(invoke).toHaveBeenCalledTimes(1)
  expect(count).toBe(1)
  expect(dispose).toHaveBeenCalledTimes(2)
  await provider.dispose?.()
})

it('runs a non-Design action through the real host, preserving validation and selected images', async () => {
  const registry = createAiActionRegistry()
  const write = vi.fn(async () => ({ id: 'reservation-1' }))

  registry.register({
    name: 'reserve',
    description: 'Reserve one product',
    revision: 1,
    inputSchema: {
      type: 'object',
      properties: { quantity: { type: 'integer', minimum: 1 } },
      required: ['quantity'],
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false
    },
    effect: 'mutation',
    resources: ['stock'],
    composition: 'allowed',
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' },
    execute: write
  })
  const host = createAiToolHostLibrary({
    registry,
    requestId: 'inventory',
    saveInvocationName: 'save',
    capacity: 10,
    receiptCapacity: 10,
    leases: createAiToolLeases({ requestId: 'inventory', capacity: 10 }),
    limits: {
      steps: 20,
      bytes: 10000,
      bindings: 20,
      bindingDepth: 10,
      issues: 10
    },
    store: memoryStore().store,

    check: async () => ({ ok: true, scope: 'Inventory' }),

    validate: operationContractIssue,

    execute: async (call, definition) => {
      const result = await invokeAiToolOwner({
        definition,
        input: call.input,
        signal: call.signal ?? signal(),
        execute: write,

        inspectOwner: (value) => ({
          value,
          outcome: { status: 'success', settlement: 'completed' }
        })
      })

      return { ...result.outcome, value: result.value }
    }
  })
  const requests: Record<string, unknown>[] = []
  const provider = createResponsesAiProvider({
    apiKey: 'secret',
    model: 'm',

    prepare: async (_input, context) =>
      makeBinding({
        tools: [
          {
            name: 'inventory',
            description: 'Inventory operations',
            tools: registry.list().map(({ name, description, inputSchema }) => {
              const schema: unknown = inputSchema

              if (
                !schema ||
                typeof schema !== 'object' ||
                Array.isArray(schema)
              ) {
                throw Error('Inventory publication requires an object schema')
              }

              return { name, description, inputSchema: { ...schema } }
            })
          }
        ],

        invoke: async (call) => {
          const result = await host.invoke({
            name: call.name,
            callId: call.callId,
            input: call.arguments,
            signal: context.signal
          })

          if (call.callId === 'good') {
            expect(
              result.execution,
              JSON.stringify(result.execution)
            ).toMatchObject({ status: 'success' })
          }

          return {
            contentItems: [
              { type: 'inputText', text: JSON.stringify(result) },
              { type: 'inputImage', imageUrl: 'data:image/png;base64,aGVsbG8=' }
            ]
          }
        }
      }),

    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body))
      const published = body.tools
        .find((group: { name?: string }) => group.name === 'inventory')
        ?.tools.find((tool: { name?: string }) => tool.name === 'reserve')

      expect(published.parameters).toEqual(registry.get('reserve')?.inputSchema)
      expect(
        operationContractIssue({ quantity: 1 }, published.parameters)
      ).toBeUndefined()
      expect(
        operationContractIssue({ quantity: 0 }, published.parameters)
      ).toBeDefined()
      requests.push(body)

      if (requests.length === 1) {
        return reply([call('bad', '{"quantity":0}')])
      }

      if (requests.length === 2) {
        return reply([call('good', '{"quantity":1}')])
      }

      return reply([message])
    }
  })

  expect(
    await provider.requestActionBatch(input, { signal: signal() })
  ).toEqual(final)
  expect(write).toHaveBeenCalledTimes(1)
  expect(JSON.stringify(requests[1].input)).toContain('not-started')
  expect(requests[2].input).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'function_call_output',
        call_id: 'good',
        output: expect.arrayContaining([
          { type: 'input_image', image_url: 'data:image/png;base64,aGVsbG8=' }
        ])
      })
    ])
  )
  await provider.dispose?.()
  await host.dispose()
})

it('aborts network work and releases the service lease for a later turn', async () => {
  const registry = createResponsesConversations()
  let entered!: () => void
  const started = new Promise<void>((resolve) => {
    entered = resolve
  })
  const provider = createResponsesAiProvider({
    apiKey: 'secret',
    model: 'm',
    conversations: registry,

    prepare: async () => makeBinding(),

    fetch: async (_url, init) => {
      entered()

      return new Promise((_resolve, reject) =>
        init?.signal?.addEventListener(
          'abort',
          () => reject(Error('aborted')),
          { once: true }
        )
      )
    }
  })
  const controller = new AbortController()
  const request = provider.requestActionBatch(input, {
    signal: controller.signal
  })
  const rejection = expect(request).rejects.toMatchObject({
    code: 'AI_PROVIDER_ABORTED'
  })

  await started
  controller.abort()
  await rejection
  await provider.dispose?.()
})

it('preserves the settled answer when binding cleanup fails and releases the conversation', async () => {
  const cleanup = vi.fn(async () => {
    throw Error('cleanup failed')
  })
  const provider = createResponsesAiProvider({
    apiKey: 'secret',
    model: 'm',

    prepare: async () => makeBinding({ dispose: cleanup }),

    fetch: async () => reply([message])
  })

  expect(
    await provider.requestActionBatch(input, { signal: signal() })
  ).toEqual(final)
  expect(
    await provider.requestActionBatch(input, { signal: signal() })
  ).toEqual(final)
  expect(cleanup).toHaveBeenCalledTimes(2)
  await provider.dispose?.()
})

it('observes credential-free protocol bodies and cumulative usage without making diagnostics authoritative', async () => {
  const observations: unknown[] = []
  let count = 0
  const provider = createResponsesAiProvider({
    apiKey: 'private-key',
    model: 'm',

    prepare: async () =>
      makeBinding({
        observe(event) {
          observations.push(event)
          throw Error('Recorder unavailable')
        }
      }),

    fetch: async () =>
      Response.json({
        id: `r${++count}`,
        status: 'completed',
        output: count === 1 ? [call('c')] : [message],
        usage: {
          input_tokens: 10,
          output_tokens: 4,
          total_tokens: 14,
          input_tokens_details: { cached_tokens: 2 },
          output_tokens_details: { reasoning_tokens: 1 }
        }
      })
  })

  expect(
    await provider.requestActionBatch(input, { signal: signal() })
  ).toEqual(final)
  expect(observations).toHaveLength(4)
  expect(observations[3]).toMatchObject({
    direction: 'response',
    usage: {
      total: {
        inputTokens: 20,
        cachedInputTokens: 4,
        outputTokens: 8,
        reasoningOutputTokens: 2,
        totalTokens: 28
      }
    }
  })
  expect(JSON.stringify(observations)).not.toContain('private-key')
  await provider.dispose?.()
})

it('distinguishes empty and flat discovery outputs and omits inconsistent write accounting', async () => {
  const flat = {
    type: 'function',
    name: 'reserve',
    description: 'Café inventory'
  }
  const events: unknown[] = []
  const provider = createResponsesAiProvider({
    model: 'm',
    apiKey: 'test',

    prepare: async () =>
      makeBinding({ observe: (event) => events.push(event) }),

    fetch: async () =>
      Response.json({
        id: 'one',
        status: 'completed',
        output: [
          { type: 'tool_search_output', id: 'empty', tools: [] },
          { type: 'tool_search_output', id: 'flat', tools: [flat] },
          message
        ],
        usage: {
          input_tokens: 10,
          output_tokens: 4,
          total_tokens: 14,
          input_tokens_details: { cached_tokens: 9, cache_write_tokens: 7 }
        }
      })
  })

  try {
    await expect(
      provider.requestActionBatch(input, { signal: signal() })
    ).resolves.toEqual(final)
    expect(events[1]).toMatchObject({
      discovery: {
        responseId: 'one',
        searches: [
          { itemId: 'empty', bytes: 0, definitions: [] },
          {
            itemId: 'flat',
            definitions: [
              {
                name: 'reserve',
                bytes: Buffer.byteLength(JSON.stringify(flat))
              }
            ]
          }
        ]
      }
    })
    expect(events[1]).not.toHaveProperty('usage.response.cacheWriteTokens')
  } finally {
    await provider.dispose?.()
  }
})

it('keeps transient guidance outside the reusable developer prefix and never resends an old image', async () => {
  const requests: Record<string, unknown>[] = []
  let turn = 0
  const image = 'data:image/png;base64,Zmlyc3Q='
  const provider = createResponsesAiProvider({
    apiKey: 'fixture',
    model: 'fixture',

    prepare: async () => {
      turn++

      return makeBinding({
        requestInstructions:
          turn === 1 ? 'Library temporarily unavailable' : undefined,

        invoke: async () => ({
          contentItems: [{ type: 'inputImage', imageUrl: image }]
        })
      })
    },

    fetch: async (_url, init) => {
      requests.push(JSON.parse(String(init?.body)))

      return Response.json({
        id: 'r' + requests.length,
        status: 'completed',
        output: requests.length === 1 ? [call('image')] : [message]
      })
    }
  })

  try {
    await provider.requestActionBatch(input, { signal: signal() })
    await provider.requestActionBatch(input, { signal: signal() })
    expect(requests.map((r) => r.previous_response_id)).toEqual([
      undefined,
      'r1',
      'r2'
    ])
    expect(requests.map((r) => r.instructions)).toEqual([
      'Library temporarily unavailable',
      'Library temporarily unavailable',
      undefined
    ])
    expect(
      requests.map((r) => JSON.stringify(r.input).includes(image))
    ).toEqual([false, true, false])
    expect(
      requests.map((r) => JSON.stringify(r.input).includes('Manage inventory'))
    ).toEqual([true, false, false])
  } finally {
    await provider.dispose?.()
  }
})

it('reports a missing stored response without dispatching or replaying a mutation', async () => {
  let calls = 0
  const invoke = vi.fn(makeBinding().invoke)
  const provider = createResponsesAiProvider({
    apiKey: 'fixture',
    model: 'fixture',

    prepare: async () => makeBinding({ invoke }),

    fetch: async () =>
      ++calls === 1
        ? reply([call('mutate')])
        : Response.json(
            { error: { code: 'previous_response_not_found' } },
            { status: 400 }
          )
  })

  try {
    await expect(
      provider.requestActionBatch(input, { signal: signal() })
    ).rejects.toMatchObject({ code: 'AI_PROVIDER_SESSION_UNAVAILABLE' })
    expect(calls).toBe(2)
    expect(invoke).toHaveBeenCalledTimes(1)
  } finally {
    await provider.dispose?.()
  }
})

it('resumes undispatched work only with its original turn executor', async () => {
  const { createProviderConversations } =
    await import('../provider-conversations.js')

  type Checkpoint = import('../responses-provider.js').ResponsesCheckpoint
  type Entry =
    import('../provider-conversations.js').ProviderConversationRecord<Checkpoint>
  let entry: Entry | undefined
  let interrupt = true
  const storage = {
    read: () => entry,

    write: (_key: string, next: Entry) => {
      if (interrupt && next.state.executing) {
        interrupt = false
        throw Error('Interrupted before claiming the operation')
      }

      entry = next
    }
  }
  const invoke = vi.fn(makeBinding().invoke)
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(reply([call('planned')]))
    .mockResolvedValueOnce(reply([message]))

  const service = () =>
    createResponsesAiProvider({
      apiKey: 'fixture',
      model: 'fixture',
      conversations: createProviderConversations(storage),
      fetch: fetcher,

      prepare: async () => makeBinding({ invoke })
    })

  const initial = service()
  const request = {
    ...input,
    metadata: { ...input.metadata, turnId: 'original' }
  }

  await expect(
    initial.requestActionBatch(request, { signal: signal() })
  ).rejects.toThrow('Interrupted')
  await initial.dispose?.()
  const restored = service()

  try {
    await expect(
      restored.requestActionBatch(
        {
          ...request,
          metadata: { ...request.metadata, turnId: 'different' }
        },
        { signal: signal() }
      )
    ).rejects.toMatchObject({ code: 'AI_PROVIDER_SESSION_UNAVAILABLE' })
    expect(invoke).not.toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledTimes(1)
    await expect(
      restored.requestActionBatch(request, { signal: signal() })
    ).resolves.toEqual(final)
    expect(invoke).toHaveBeenCalledTimes(1)
  } finally {
    await restored.dispose?.()
  }
})
