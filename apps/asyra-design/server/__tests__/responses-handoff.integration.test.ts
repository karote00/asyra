import { expect, it, vi } from 'vitest'

const captureRecord = vi.hoisted(() => vi.fn<(record: unknown) => void>())

vi.mock('@asyra/ai-agent-runtime/node', async (original) => ({
  ...(await original<typeof import('@asyra/ai-agent-runtime/node')>()),

  createExecutionRecordSink: () => ({
    write: captureRecord,

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

it('keeps Responses continuation and named results across the real browser/server exchange', async () => {
  const { createServer } = await import('node:http')
  const { createDefaultAiModelSources } = await import('../ai-model-sources')
  const { createActionBatchMiddleware } = await import('../action-batch')
  const { createServerActionBatchProvider } =
    await import('../../src/ai/server-action-batch-provider')
  const requests: Record<string, unknown>[] = []

  const scriptedFetch: typeof fetch = async (_url, init) => {
    requests.push(JSON.parse(String(init?.body)))
    const index = requests.length
    const operation =
      index === 1
        ? {
            operations: [
              {
                id: 'advice',
                name: 'design_knowledge.read_knowledge',
                arguments: { ids: ['colors'] }
              }
            ],
            retain: {
              knowledgeIds: { step: 'advice', source: 'input', path: '/ids' }
            },
            delivery: 'status',
            inspection: 'defer'
          }
        : {
            operations: [
              {
                id: 'reuse',
                name: 'design_knowledge.read_knowledge',
                arguments: {
                  ids: { kind: 'named', name: 'knowledgeIds', path: '' }
                }
              }
            ],
            delivery: {
              fields: { advice: { step: 'reuse', path: '/documents/0/text' } }
            },
            inspection: 'defer'
          }

    return Response.json({
      id: `response-${index}`,
      status: 'completed',
      output:
        index === 1 || index === 3
          ? [
              {
                type: 'function_call',
                namespace: 'design_operations',
                name: 'execute_design',
                call_id: `call-${index}`,
                arguments: JSON.stringify(operation)
              }
            ]
          : [
              {
                type: 'message',
                role: 'assistant',
                phase: 'final_answer',
                content: [{ type: 'output_text', text: JSON.stringify(final) }]
              }
            ]
    })
  }

  vi.stubEnv('AI_PROVIDER_BACKEND', 'openai-responses')
  vi.stubEnv('AI_PROVIDER_MODEL', 'fixture-model')
  vi.stubEnv('OPENAI_API_KEY', 'fixture-secret')
  const sources = createDefaultAiModelSources({ fetch: scriptedFetch })
  const middleware = createActionBatchMiddleware({ sources })
  const server = createServer((request, response) => {
    void middleware(request, response, () => {
      response.statusCode = 404
      response.end()
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()

  if (!address || typeof address === 'string') {
    throw Error('Missing test listener')
  }

  const provider = createServerActionBatchProvider({
    fetch: (url, init) =>
      fetch(new URL(String(url), `http://127.0.0.1:${address.port}`), init),

    documentScope: () => 'document-one'
  })

  try {
    const first = {
      ...input,
      metadata: {
        conversationId: 'api-conversation',
        conversationContext: { turns: [], attachmentIndexes: [] }
      }
    }

    expect(
      await provider.requestActionBatch(first, {
        signal: new AbortController().signal,

        executeBatch: async () => {
          throw Error('Knowledge must not mutate the document')
        }
      })
    ).toEqual(final)
    expect(
      await provider.requestActionBatch(
        {
          ...first,
          intent: 'Use the saved knowledge ids',
          context: { selection: 'new' },
          metadata: {
            ...first.metadata,
            conversationContext: {
              attachmentIndexes: [],
              turns: [
                {
                  turnId: 'old',
                  intent: 'duplicate-history-marker',
                  message: 'prior',
                  outcome: 'success',
                  attachmentIndexes: []
                }
              ]
            }
          }
        },
        {
          signal: new AbortController().signal,

          executeBatch: async () => {
            throw Error('Knowledge must not mutate the document')
          }
        }
      )
    ).toEqual(final)
    expect(requests).toHaveLength(4)
    expect(JSON.stringify(requests[2].input)).toContain('call-1')
    expect(JSON.stringify(requests[2].input)).not.toContain(
      'duplicate-history-marker'
    )
    expect(JSON.stringify(requests[2].input)).toContain('new')
    expect(JSON.stringify(requests[3].input)).toContain('colors')
    expect(JSON.stringify(requests)).not.toContain('fixture-secret')
    const outputs = requests.flatMap((request) =>
      Array.isArray(request.input)
        ? request.input.filter((item) => item.type === 'function_call_output')
        : []
    )

    for (const output of outputs) {
      const delivered = output.output.map((part: { text: string }) =>
        JSON.parse(part.text)
      )

      expect(delivered).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            toolOutcome: expect.objectContaining({
              status: 'success',
              settlement: 'completed'
            })
          })
        ])
      )
      expect(
        delivered.some(
          (part: { toolOutcome?: { status: string } }) =>
            part.toolOutcome?.status === 'failed'
        )
      ).toBe(false)
    }

    expect(outputs.length).toBeGreaterThan(1)
  } finally {
    await provider.dispose?.()
    await middleware.dispose()
    await Promise.all(sources.map((source) => source.dispose?.()))
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
    vi.unstubAllEnvs()
  }
})

it('cancels and drains an outstanding browser receipt when the App service closes', async () => {
  const { createServer } = await import('node:http')
  const { createActionBatchMiddleware } = await import('../action-batch')
  let requestSignal: AbortSignal | undefined
  let ended = false
  const middleware = createActionBatchMiddleware({
    sources: [],

    requestModelActionBatch: async (_input, options) => {
      requestSignal = options?.signal
      try {
        if (!options?.executeBatch) {
          throw Error('Missing executor')
        }

        await options.executeBatch({ batchId: 'pending', actions: [] })

        return final
      } finally {
        ended = true
      }
    }
  })
  const server = createServer((request, response) => {
    void middleware(request, response, () => response.end())
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()

  if (!address || typeof address === 'string') {
    throw Error('Missing listener')
  }

  const controller = new AbortController()
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/ai/action-batch`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          accept: 'application/x-ndjson',
          'x-ai-batch-execution': '1'
        },
        body: JSON.stringify(input)
      }
    )

    reader = response.body?.getReader()
    expect(await reader?.read()).toMatchObject({ done: false })
    await middleware.dispose()
    expect(requestSignal?.aborted).toBe(true)
    expect(ended).toBe(true)
  } finally {
    controller.abort()
    await reader?.cancel().catch(() => undefined)
    await middleware.dispose()
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

it('replays the Dome searches through Responses with compact partial matches and attributable server discovery', async () => {
  const { createDefaultAiModelSources } = await import('../ai-model-sources')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const hadWindow = 'window' in globalThis

  if (!hadWindow) {
    vi.stubGlobal('window', {})
  }

  const { createAiRuntimeInput } =
    await import('../../src/ai/runtime-input').finally(() => {
      if (!hadWindow) {
        vi.unstubAllGlobals()
      }
    })
  const queries = [
    {
      query:
        'clip mask vector group arbitrary path boolean intersection cropped traced reference silhouette'
    },
    { query: 'boolean subtract intersect vector paths', category: 'vector' }
  ]
  const runtime = createAiRuntimeInput({
    permissionRules: {},
    provider: { requestActionBatch: vi.fn() }
  })
  const menus: {
    undeclaredPurposeTerms?: string[]
    message?: string
    next: { arguments: { offset: number } }
    count: number
    apis: { capability: { purpose: string }; result?: unknown }[]
    tools: unknown[]
  }[] = []
  const sizes: number[] = []
  let step = 0
  let selectedBytes = 0
  let exactName = ''
  const candidateNames: string[] = []
  let categoryCount = 0

  const call = (name: string, args: unknown) => ({
    type: 'function_call',
    namespace: 'design_operations',
    name,
    call_id: 'call-' + step,
    arguments: JSON.stringify(args)
  })

  captureRecord.mockClear()
  const sources = createDefaultAiModelSources({
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body))
      const n = step++
      let output

      if (n === 0) {
        const group = body.tools.find(
          (tool: { name?: string }) => tool.name === 'design_knowledge'
        )
        const definition = group.tools[0]

        selectedBytes = Buffer.byteLength(JSON.stringify(definition))
        output = [
          {
            type: 'tool_search_output',
            id: 'discovery-item',
            execution: 'server',
            tools: [
              { type: 'namespace', name: group.name, tools: [definition] }
            ]
          },
          call('search_design_tools', queries[0])
        ]
      } else {
        const content = body.input.at(-1).output[0].text
        const result = JSON.parse(content)

        if (n === 1 || n === 2) {
          sizes.push(Buffer.byteLength(content))
          menus.push(result)
          exactName = result.apis[0]?.operation
          if (n === 2) {
            categoryCount = result.count
            candidateNames.push(
              ...result.apis.map((entry: { name: string }) => entry.name)
            )
          }

          output = [
            call(
              'search_design_tools',
              n === 1 ? queries[1] : result.next.arguments
            )
          ]
        } else if (result.apis && !result.apis[0]?.usageGuide) {
          expect(result.offset).toBe(candidateNames.length)
          candidateNames.push(
            ...result.apis.map((entry: { name: string }) => entry.name)
          )
          output = result.next
            ? [call('search_design_tools', result.next.arguments)]
            : [
                call('read_design_contracts', {
                  names: [exactName],
                  view: 'usage'
                })
              ]
        } else {
          expect(result.apis[0].usageGuide).toBeDefined()
          expect(JSON.stringify(body.input)).not.toContain(
            'discovered-definition'
          )
          expect(
            body.input.some(
              (item: { id?: string }) => item.id === 'discovery-item'
            )
          ).toBe(true)
          output = [
            {
              type: 'message',
              role: 'assistant',
              content: [{ type: 'output_text', text: JSON.stringify(final) }]
            }
          ]
        }
      }

      return Response.json({
        id: 'response-' + n,
        status: 'completed',
        output,
        usage: {
          input_tokens: 1200,
          output_tokens: 150,
          total_tokens: 1350,
          input_tokens_details: {
            cached_tokens: 500,
            cache_write_tokens: 450,
            cache_write_tokens_details: {
              ttl_30m_tokens: 400,
              ttl_12h_tokens: 50
            }
          },
          output_tokens_details: { reasoning_tokens: 25 }
        }
      })
    }
  })

  try {
    const { requestConfiguredAiActionBatch } =
      await import('../ai-model-provider')

    await requestConfiguredAiActionBatch(
      {
        ...input,
        actions: runtime.actionDefinitions.map((action) =>
          createAiToolContract(action)
        )
      },
      {
        sources,

        executeBatch: async () => {
          throw Error('Unexpected mutation')
        },

        environment: {
          AI_PROVIDER_BACKEND: 'openai-responses',
          AI_PROVIDER_MODEL: 'fixture',
          OPENAI_API_KEY: 'fixture',
          AI_EXECUTION_SOURCE_REVISION: 'fixture'
        }
      }
    )
    process.stdout.write(
      JSON.stringify({ measurement: 'dome-search-model-bytes', sizes }) + '\n'
    )
    for (const menu of menus) {
      expect(menu.message).toMatch(/partial/i)
      expect(menu.next.arguments.offset).toBe(
        menu.apis.length + menu.tools.length
      )
      expect(menu.count).toBeGreaterThan(menu.next.arguments.offset)
      expect(menu.apis[0].capability.purpose).toBeTruthy()
      expect(menu.apis[0].result).toBeUndefined()
    }

    expect(menus[1].undeclaredPurposeTerms).toEqual(
      expect.arrayContaining(['subtract', 'intersect'])
    )
    expect(menus).toHaveLength(2)
    expect(new Set(candidateNames).size).toBe(categoryCount)
    expect(candidateNames).toHaveLength(categoryCount)
    expect(Math.max(...sizes)).toBeLessThan(6000)
    expect(captureRecord.mock.calls.flat()).toContainEqual(
      expect.objectContaining({
        stage: 'provider_transport_event',
        evidence: expect.objectContaining({
          part: 'response-usage',
          callId: 'response-1',
          inputTokens: 1200,
          cachedInputTokens: 500,
          outputTokens: 150,
          reasoningOutputTokens: 25,
          cacheWriteTokens: 450,
          cacheWrite30mTokens: 400,
          cacheWrite12hTokens: 50
        })
      })
    )
    expect(captureRecord.mock.calls.flat()).toContainEqual(
      expect.objectContaining({
        stage: 'provider_transport_event',
        evidence: expect.objectContaining({
          part: 'discovered-definition',
          namespace: 'design_knowledge',
          bytes: selectedBytes,
          callId: 'response-0',
          tool: expect.any(String)
        })
      })
    )
  } finally {
    await Promise.all(sources.map((source) => source.dispose?.()))
    await Promise.all(
      runtime.ownedResources?.map((resource) => resource.dispose()) ?? []
    )
    captureRecord.mockClear()
  }
})
