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
  const sources = createDefaultAiModelSources({
    continuationDatabase: ':memory:',
    fetch: scriptedFetch
  })
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
    expect(requests[2].previous_response_id).toBe('response-2')
    expect(JSON.stringify(requests[2].input)).not.toContain('call-1')
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

async function createDrawingRuntime() {
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

  return createAiRuntimeInput({
    permissionRules: {},
    provider: { requestActionBatch: vi.fn() }
  })
}

it('replays the Dome searches through Responses with compact partial matches and attributable usage', async () => {
  const { createDefaultAiModelSources } = await import('../ai-model-sources')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const queries = [
    {
      query:
        'clip mask vector group arbitrary path boolean intersection cropped traced reference silhouette'
    },
    { query: 'boolean subtract intersect vector paths', category: 'vector' }
  ]
  const runtime = await createDrawingRuntime()
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
    continuationDatabase: ':memory:',

    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body))
      const n = step++
      let output

      if (n === 0) {
        output = [call('search_design_tools', queries[0])]
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
          expect(body.previous_response_id).toBe('response-' + (n - 1))
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
  } finally {
    await Promise.all(sources.map((source) => source.dispose?.()))
    await Promise.all(
      runtime.ownedResources?.map((resource) => resource.dispose()) ?? []
    )
    captureRecord.mockClear()
  }
})

it('recovers the acknowledged output after service restart without mixing pointers or invoking the tool again', async () => {
  const { mkdirSync, mkdtempSync, rmSync } = await import('node:fs')
  const { resolve, join } = await import('node:path')
  const { createDefaultAiModelSources, selectAiModelSource } =
    await import('../ai-model-sources')
  const root = resolve('../../tmp/responses-continuation')

  mkdirSync(root, { recursive: true })
  const directory = mkdtempSync(join(root, 'restart-'))
  const requests: Record<string, unknown>[] = []

  const fetcher: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body))

    requests.push(body)
    const index = requests.length

    if (index === 2) {
      return Response.json({}, { status: 503 })
    }

    return Response.json({
      id: 'checkpoint-' + index,
      status: 'completed',
      output:
        index === 1
          ? [
              {
                type: 'function_call',
                namespace: 'design_operations',
                name: 'execute_design',
                call_id: 'owned-by-a',
                arguments: JSON.stringify({
                  operations: [
                    {
                      id: 'advice',
                      name: 'design_knowledge.discover_knowledge',
                      arguments: { ids: ['illustration.architecture'] }
                    }
                  ]
                })
              }
            ]
          : [
              {
                type: 'message',
                role: 'assistant',
                content: [{ type: 'output_text', text: JSON.stringify(final) }]
              }
            ]
    })
  }

  const open = () =>
    selectAiModelSource(
      'openai-responses',
      createDefaultAiModelSources({
        fetch: fetcher,
        continuationDatabase: join(directory, 'checkpoints.sqlite')
      })
    )

  let source = open()

  const ask = (id: string, turnId: string) =>
    source.request(
      { ...input, metadata: { conversationId: id, turnId } },
      {
        executeBatch: async () => {
          throw Error('Unexpected canvas mutation')
        },

        environment: {
          OPENAI_API_KEY: 'fixture',
          AI_PROVIDER_MODEL: 'fixture',
          AI_EXECUTION_SOURCE_REVISION: 'fixture'
        }
      }
    )

  captureRecord.mockClear()
  try {
    await expect(ask('a', 'a-one')).rejects.toThrow()
    await ask('b', 'b-one')
    await source.dispose?.()
    source = open()
    await ask('a', 'a-one')
    await ask('b', 'b-two')
    await ask('a', 'a-two')
    expect(requests[2]).not.toHaveProperty('previous_response_id')
    expect(requests[3]).toMatchObject({
      previous_response_id: 'checkpoint-1',
      input: requests[1].input
    })
    expect(JSON.stringify(requests[1].input)).toContain('untrusted-advice')
    expect(requests[4].previous_response_id).toBe('checkpoint-3')
    expect(requests[5].previous_response_id).toBe('checkpoint-4')
    expect(JSON.stringify(requests[4])).not.toContain('owned-by-a')
    const starts = captureRecord.mock.calls
      .flat()
      .filter(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'stage' in item &&
          item.stage === 'tool_started'
      )

    expect(
      starts.filter(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'callId' in item &&
          item.callId === 'owned-by-a'
      )
    ).toHaveLength(1)
    const { DatabaseSync } = await import('node:sqlite')
    const db = new DatabaseSync(join(directory, 'checkpoints.sqlite'), {
      readOnly: true
    })

    try {
      const rows = db
        .prepare(
          'SELECT conversation_id, call_id, arguments, output FROM operation_receipts'
        )
        .all()

      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        conversation_id: 'a',
        call_id: 'owned-by-a',
        arguments: JSON.stringify({
          operations: [
            {
              id: 'advice',
              name: 'design_knowledge.discover_knowledge',
              arguments: { ids: ['illustration.architecture'] }
            }
          ]
        })
      })
      expect(JSON.parse(String(rows[0].output))).toEqual(
        Array.isArray(requests[1].input) && requests[1].input[0].output
      )
    } finally {
      db.close()
    }
  } finally {
    await source.dispose?.()
    rmSync(directory, { recursive: true, force: true })
  }
})

it('preserves an uncertain dispatch on disk and rejects stale claims across service instances', async () => {
  const { mkdirSync, mkdtempSync, rmSync } = await import('node:fs')
  const { resolve, join } = await import('node:path')
  const { createResponsesCheckpointStore } =
    await import('../responses-checkpoint-store')
  const { createResponsesAiProvider, createResponsesConversations } =
    await import('@asyra/ai-agent-runtime/node')
  const root = resolve('../../tmp/responses-continuation')

  mkdirSync(root, { recursive: true })
  const directory = mkdtempSync(join(root, 'dispatch-'))
  const path = join(directory, 'state.sqlite')
  const first = createResponsesCheckpointStore(path)
  const second = createResponsesCheckpointStore(path)
  const tools = [
    {
      name: 'app',
      description: 'App mutations',
      tools: [
        {
          name: 'write',
          description: 'Write once',
          inputSchema: { type: 'object' }
        }
      ]
    }
  ]
  const write = vi.fn(async () => {
    throw Error('Connection lost after commit')
  })
  const fetcher = vi.fn(async () =>
    Response.json({
      id: 'stored',
      status: 'completed',
      output: [
        {
          type: 'function_call',
          namespace: 'app',
          name: 'write',
          call_id: 'claimed',
          arguments: '{}'
        }
      ]
    })
  )

  const provider = (store: typeof first) =>
    createResponsesAiProvider({
      model: 'fixture',
      apiKey: 'fixture',
      conversations: createResponsesConversations(store),
      fetch: fetcher,

      prepare: async () => ({
        tools,
        instructions: 'Write',

        input: () => [{ type: 'inputText', text: 'Write once' }],

        invoke: write,

        decode: () => final
      })
    })

  const request = {
    ...input,
    metadata: { conversationId: 'same', turnId: 'once' }
  }
  const previous = provider(first)
  const next = provider(second)

  try {
    await expect(
      previous.requestActionBatch(request, {
        signal: new AbortController().signal
      })
    ).rejects.toThrow('Connection lost')
    first.close()
    const record = second.read('same')

    expect(record?.state.executing).toBe('claimed')
    if (!record) {
      throw Error('Missing durable execution claim')
    }

    expect(() => second.write('same', record)).toThrow('changed')
    await expect(
      next.requestActionBatch(request, { signal: new AbortController().signal })
    ).rejects.toMatchObject({ code: 'AI_PROVIDER_SESSION_UNAVAILABLE' })
    expect(write).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledTimes(1)
  } finally {
    await previous.dispose?.()
    await next.dispose?.()
    first.close()
    second.close()
    rmSync(directory, { recursive: true, force: true })
  }
})

it('publishes the three Design entries, resolves the Dome reference by purpose, and delivers a bounded overview with its original identity', async () => {
  const { createHash } = await import('node:crypto')
  const { default: sharp } = await import('sharp')
  const { default: dome } = await import('./fixtures/dome-responses.json')
  const { createDefaultAiModelSources, selectAiModelSource } =
    await import('../ai-model-sources')
  const download = await import('../reference-image-download')
  const raw = await sharp({
    create: { width: 3024, height: 4032, channels: 3, background: '#3399aa' }
  })
    .jpeg()
    .toBuffer()
  const sha = createHash('sha256').update(raw).digest('hex')
  const fetchImage = vi
    .spyOn(download, 'downloadReferenceImage')
    .mockImplementation(async (url) => {
      expect(url).toBe(dome.reference.references[0].imageUrl)

      return new Response(new Uint8Array(raw), {
        headers: { 'content-type': 'image/jpeg' }
      })
    })
  const runtime = await createDrawingRuntime()
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const requests: {
    tools: { type: string; tools?: { name: string }[] }[]
    input: { output: { text: string; type: string; image_url: string }[] }[]
  }[] = []
  let route = ''
  let digest = ''
  const source = selectAiModelSource(
    'openai-responses',
    createDefaultAiModelSources({
      continuationDatabase: ':memory:',

      fetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body))

        requests.push(body)
        const n = requests.length

        if (n === 1) {
          const user = body.input.find(
            (item: { role: string }) => item.role === 'user'
          )
          const appActions = JSON.parse(user.content[0].text).input.actions
          const nativeTools = body.tools
            .filter((entry: { type: string }) => entry.type === 'namespace')
            .map(
              (group: {
                type: string
                name: string
                description: string
                tools: {
                  type: string
                  name: string
                  description: string
                  parameters: unknown
                  defer_loading?: boolean
                }[]
              }) => ({
                type: group.type,
                name: group.name,
                description: group.description,
                tools: group.tools.map((tool) => ({
                  type: tool.type,
                  name: tool.name,
                  description: tool.description,
                  inputSchema: tool.parameters,
                  deferLoading: !!tool.defer_loading
                }))
              })
            )

          digest = createHash('sha256')
            .update(JSON.stringify({ nativeTools, appActions }))
            .digest('hex')
        }

        if (n === 3) {
          const menu = JSON.parse(body.input[0].output[0].text)

          route = menu.tools[0].execution.operation
          expect(route).toBe('design_references.import_reference_image')
        }

        const args = [
          dome.reference,
          {
            query: 'import public image from URL',
            inputFields: ['sourceUrl', 'imageUrl']
          },
          {
            operations: [
              { id: 'reference', name: route, arguments: dome.reference }
            ]
          }
        ][n - 1]
        const output =
          n === 4
            ? [
                {
                  type: 'message',
                  role: 'assistant',
                  content: [
                    { type: 'output_text', text: JSON.stringify(final) }
                  ]
                }
              ]
            : [
                {
                  type: 'function_call',
                  call_id: 'call-' + n,
                  namespace:
                    n === 1 ? 'design_references' : 'design_operations',
                  name: [
                    'import_reference_image',
                    'search_design_tools',
                    'execute_design'
                  ][n - 1],
                  arguments: JSON.stringify(args)
                }
              ]

        return Response.json({
          id: 'response-' + n,
          status: 'completed',
          output
        })
      }
    })
  )

  captureRecord.mockClear()
  try {
    await source.request(
      {
        ...input,
        actions: runtime.actionDefinitions.map((a) => createAiToolContract(a))
      },
      {
        environment: {
          OPENAI_API_KEY: 'fixture',
          AI_PROVIDER_MODEL: 'fixture',
          AI_EXECUTION_SOURCE_REVISION: 'fixture'
        },

        executeBatch: async () => {
          throw Error('Reference acquisition must not mutate the canvas')
        }
      }
    )
    process.stdout.write(
      JSON.stringify({
        measurement: 'dome-responses-tools-utf8',
        bytes: Buffer.byteLength(JSON.stringify(requests[0].tools))
      }) + '\n'
    )
    for (const body of requests) {
      expect(
        body.tools
          .flatMap(
            (g: { tools?: { name: string }[] }) =>
              g.tools?.map((t) => t.name) ?? []
          )
          .sort()
      ).toEqual([
        'execute_design',
        'read_design_contracts',
        'search_design_tools'
      ])
      expect(body.tools.map((t: { type: string }) => t.type)).toEqual([
        'namespace',
        'web_search'
      ])
    }

    expect(requests[1].input[0].output[0].text).toContain('TOOL_NOT_FOUND')
    const parts = requests[3].input[0].output
    const receipt = JSON.parse(parts[0].text).execution.value

    expect(receipt.references[0]).toMatchObject({
      sha256: sha,
      attachmentIndex: 0,
      image: { width: 3024, height: 4032 },
      source: { url: dome.reference.references[0].sourceUrl }
    })
    const pixels = parts.filter(
      (part: { type: string }) => part.type === 'input_image'
    )

    expect(pixels).toHaveLength(1)
    const overview = Buffer.from(pixels[0].image_url.split(',')[1], 'base64')

    expect(await sharp(overview).metadata()).toMatchObject({
      width: 960,
      height: 1280
    })
    expect(receipt.actionResults[0].result.image).toMatchObject({
      width: 960,
      height: 1280
    })
    expect(fetchImage).toHaveBeenCalledOnce()
    expect(captureRecord.mock.calls.flat()).toContainEqual(
      expect.objectContaining({
        stage: 'capabilities_advertised',
        evidence: expect.objectContaining({
          toolCount: 3,
          eagerToolCount: 3,
          contractDigest: digest
        })
      })
    )
  } finally {
    fetchImage.mockRestore()
    await source.dispose?.()
    await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
  }
})

it('runs a standalone registered invocation through the published entry and rejects private or mixed calls', async () => {
  const { createDefaultAiModelSources, selectAiModelSource } =
    await import('../ai-model-sources')
  const runtime = await createDrawingRuntime()
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const invocation = {
    namespace: 'tool_library',
    tool: 'invoke_tool',
    arguments: {
      name: 'design_operations.record_design_facts',
      revision: 2,
      input: {}
    }
  }
  const inputs = [
    { invocation },
    { invocation, operations: [] },
    {
      invocation: {
        ...invocation,
        namespace: 'host_operations',
        tool: 'execute_design'
      }
    }
  ]
  const receipts: string[] = []
  let count = 0
  const source = selectAiModelSource(
    'openai-responses',
    createDefaultAiModelSources({
      continuationDatabase: ':memory:',

      fetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body))

        if (count) {
          receipts.push(body.input[0].output[0].text)
        }

        const args = inputs[count++]

        return Response.json({
          id: 'control-' + count,
          status: 'completed',
          output: args
            ? [
                {
                  type: 'function_call',
                  namespace: 'design_operations',
                  name: 'execute_design',
                  call_id: 'step-' + count,
                  arguments: JSON.stringify(args)
                }
              ]
            : [
                {
                  type: 'message',
                  role: 'assistant',
                  content: [
                    { type: 'output_text', text: JSON.stringify(final) }
                  ]
                }
              ]
        })
      }
    })
  )

  try {
    await source.request(
      {
        ...input,
        actions: runtime.actionDefinitions.map((a) => createAiToolContract(a))
      },
      {
        executeBatch: async () => {
          throw Error('Unexpected canvas mutation')
        },

        environment: {
          OPENAI_API_KEY: 'fixture',
          AI_PROVIDER_MODEL: 'fixture',
          AI_EXECUTION_SOURCE_REVISION: 'fixture'
        }
      }
    )
    expect(JSON.parse(receipts[0])).toMatchObject({
      execution: { status: 'success', value: { facts: [] } }
    })
    for (const text of receipts.slice(1)) {
      expect(JSON.parse(text)).toMatchObject({
        toolOutcome: { status: 'failed', settlement: 'not-started' }
      })
    }
  } finally {
    await source.dispose?.()
    await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
  }
})
