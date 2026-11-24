import { requestEntries } from './responses-search-fixture'
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
                arguments: JSON.stringify({ workflow: operation })
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
                call('read_design_resources', {
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
                namespace: 'design_knowledge',
                name: 'discover_knowledge',
                call_id: 'owned-by-a',
                arguments: JSON.stringify({
                  ids: ['illustration.architecture']
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
        arguments: JSON.stringify({ ids: ['illustration.architecture'] })
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

it.each([
  { research: false, partial: false },
  { research: true, partial: false },
  { research: true, partial: true }
])(
  'imports the Dome reference with its original identity and hosted research=$research partial=$partial',
  async ({ research, partial }) => {
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
    const source = selectAiModelSource(
      'openai-responses',
      createDefaultAiModelSources({
        continuationDatabase: ':memory:',

        fetch: async (_url, init) => {
          const body = JSON.parse(String(init?.body))

          if (!body.previous_response_id) {
            expect(body.tools.map((t: { type: string }) => t.type)).toEqual([
              'tool_search'
            ])

            return requestEntries(
              ...(research ? ['web_search'] : []),
              'design_operations.search_design_tools',
              'design_operations.execute_design',
              'design_references.import_reference_image'
            )
          }

          requests.push(body)
          const n = requests.length + (partial ? 1 : 0)

          if (requests.length === 1) {
            expect(
              body.input[0].tools
                .flatMap((group: { tools: { name: string }[] }) =>
                  group.tools.map((tool) => tool.name)
                )
                .sort()
            ).toEqual(['execute_design', 'search_design_tools'])
          }

          if (n === 3) {
            const menu = JSON.parse(body.input[0].output[0].text)

            if (partial) {
              expect(menu.tools[0].match.unmatchedTerms.length).toBeGreaterThan(
                0
              )
              expect(menu.tools[0].execution).toMatchObject({
                kind: 'host-operation',
                tool: 'execute_design'
              })
              process.stdout.write(
                JSON.stringify({
                  measurement: 'partial-import',
                  menuBytes: Buffer.byteLength(JSON.stringify(menu))
                }) + '\n'
              )
            }

            route = menu.tools[0].execution.operation
            expect(route).toBe('design_references.import_reference_image')
          }

          const args = [
            dome.reference,
            partial
              ? {
                  query:
                    'import reference image from original source URL retain bytes inspect photo'
                }
              : {
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
        expect(body.tools.map((t) => t.type)).toEqual(
          research ? ['tool_search', 'web_search'] : ['tool_search']
        )
      }

      if (partial) {
        expect(requests).toHaveLength(3)
      } else {
        expect(requests[1].input[0].output[0].text).toContain('TOOL_NOT_FOUND')
      }

      const parts = requests[requests.length - 1].input[0].output
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
            toolCount: 5,
            eagerToolCount: 0,
            eagerToolDefinitionBytes: 0,
            contractDigest: expect.stringMatching(/^[a-f0-9]{64}$/)
          })
        })
      )
    } finally {
      fetchImage.mockRestore()
      await source.dispose?.()
      await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
    }
  }
)

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
    { workflow: { stages: [{ id: 'bad', operations: [], apply: [] }] } },
    {
      workflow: {
        operations: [{ name: 'invalid', arguments: {} }],
        retain: { broken: { path: 3 } }
      }
    },
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

it.each([true, false])(
  'hands the selected square to the Host with discovery=%s',
  async (discover) => {
    const { default: square } = await import('./fixtures/selected-square.json')
    const { createDefaultAiModelSources, selectAiModelSource } =
      await import('../ai-model-sources')
    const { createConversationResults, createAiToolContract } =
      await import('@asyra/ai-agent-runtime')
    const { operationInputIssue } =
      await import('@asyra/ai-agent-runtime/schema')
    const runtime = await createDrawingRuntime()
    const toolCalls: string[] = []
    let requests = 0
    let bytes = 0
    let completionParts: { text?: string }[] = []
    let loadedBytes = 0
    const results = createConversationResults(() => 1).open(
      square.metadata.conversationId
    )
    const edit = square.execute.operations[0]
    const { readFileSync } = await import('node:fs')
    const data = readFileSync(
      new URL('./fixtures/selected-square.png', import.meta.url)
    ).toString('base64')
    const capture = {
      ...square.capture,
      image: {
        ...square.capture.image,
        dataUrl: 'data:image/png;base64,' + data
      }
    }
    let applied = 0
    const sources = createDefaultAiModelSources({
      continuationDatabase: ':memory:',

      fetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body))

        requests++
        if (requests === 1) {
          bytes = Buffer.byteLength(String(init?.body))
          expect(bytes).toBeLessThan(4000)
          expect(
            body.tools.map((entry: { type: string }) => entry.type)
          ).toEqual(['tool_search'])
          expect(JSON.stringify(body.input)).not.toMatch(
            /sourceRequestId|protocolVersion|metadata.conversationContext/
          )

          const loaded = await requestEntries(
            ...(discover ? ['design_operations.search_design_tools'] : []),
            'design_operations.execute_design'
          ).json()

          // Match opaque transport identifier lengths in the recorded square request.
          loaded.id = 'resp_' + '0'.repeat(50)
          loaded.output[0].call_id = 'call_' + '0'.repeat(24)

          return Response.json(loaded)
        }

        const first = requests === 2

        if (first) {
          loadedBytes = Buffer.byteLength(String(init?.body))
          const entries = body.input[0].tools.flatMap(
            (g: { tools: unknown[] }) => g.tools
          )
          const executor = entries.find(
            (entry: { name: string }) => entry.name === 'execute_design'
          )

          expect(executor.parameters.examples).toBeUndefined()
          expect(
            Buffer.byteLength(JSON.stringify(executor.parameters))
          ).toBeLessThan(2200)
          const operation = { name: 'first', arguments: {} }
          const stage = {
            id: 'phase',
            operations: [operation],
            apply: { name: 'apply', arguments: {} }
          }

          expect(
            operationInputIssue(
              { operations: [operation], stages: [stage] },
              executor.parameters
            )
          ).toBeDefined()
          expect(
            operationInputIssue(
              {
                delivery: {
                  fields: { item: { name: 'squareColor', path: '' } }
                }
              },
              executor.parameters
            )
          ).toBeTruthy()
          for (const [name, args] of [
            ...(discover
              ? [['search_design_tools', square.query] as const]
              : []),
            [
              'execute_design',
              discover ? { workflow: square.execute } : { operations: [edit] }
            ]
          ] as const) {
            expect(
              operationInputIssue(
                args,
                entries.find((entry: { name: string }) => entry.name === name)
                  .parameters
              )
            ).toBeUndefined()
          }
        }

        const previous = toolCalls.at(-1)
        let output

        if (previous === 'execute_design') {
          completionParts = body.input[0].output
          output = [
            {
              type: 'message',
              role: 'assistant',
              content: [{ type: 'output_text', text: JSON.stringify(final) }]
            }
          ]
        } else {
          let args: unknown = discover
            ? { workflow: square.execute }
            : { operations: [edit] }
          let name = 'execute_design'

          if (first && discover) {
            name = 'search_design_tools'
            args = square.query
          } else if (discover) {
            const menu = JSON.parse(body.input[0].output[0].text)
            const result = menu.apis.find(
              (a: { name: string }) => a.name === edit.name
            )

            if (toolCalls.length === 1) {
              // The recorded model chose a lower-ranked alternative in this broader query.
              expect(result.capability.purpose).toBeTruthy()
              expect(result.operationParameters).toBeUndefined()
              name = 'search_design_tools'
              args = { query: result.operation }
            } else {
              expect(menu.count).toBe(1)
              expect(result.execution.tool).toBe(name)
              expect(result.operationParameters).toBeDefined()
              expect(
                operationInputIssue(edit.arguments, result.operationParameters)
              ).toBeUndefined()
              expect(
                operationInputIssue(
                  { updates: [{ color: '#0000FF' }] },
                  result.operationParameters
                )
              ).toBeTruthy()
            }
          }

          toolCalls.push(name)
          output = [
            {
              type: 'function_call',
              namespace: 'design_operations',
              name,
              call_id: 'call-' + requests,
              arguments: JSON.stringify(args)
            }
          ]
        }

        return Response.json({
          id: 'response-' + requests,
          status: 'completed',
          output
        })
      }
    })

    try {
      const source = selectAiModelSource('openai-responses', sources)

      await source.request(
        {
          ...input,
          intent: square.intent,
          context: square.context,
          metadata: square.metadata,
          actions: runtime.actionDefinitions.map((a) => createAiToolContract(a))
        },
        {
          environment: {
            OPENAI_API_KEY: 'fixture',
            AI_PROVIDER_MODEL: 'gpt-6.2-astra',
            AI_EXECUTION_SOURCE_REVISION: 'fixture'
          },

          resultContext: async (command) => results.exchange(command),

          executeBatch: async (batch) => ({
            context: square.context,
            actionResults: batch.actions.map((a) => {
              if (a.name === edit.name) {
                expect(a.arguments).toEqual(edit.arguments)
                applied++
              } else {
                expect(a.name).toBe('inspect_drawing')
              }

              return {
                actionId: a.id,
                actionName: a.name,
                result: a.name === edit.name ? square.receipt : capture
              }
            })
          })
        }
      )
      const receipt = JSON.parse(String(completionParts[0].text))

      if (discover) {
        expect(receipt.execution.status).toBe('success')
      } else {
        expect(receipt.actionResults[0]).toMatchObject({
          actionName: edit.name,
          result: {
            value: ['changed'],
            status: 'complete',
            settlement: 'completed'
          }
        })
        expect(
          completionParts
            .filter((p) => p.text)
            .map((p) => JSON.parse(String(p.text)))
        ).toContainEqual(
          expect.objectContaining({
            toolOutcome: expect.objectContaining({
              status: 'success',
              settlement: 'completed'
            })
          })
        )
      }

      expect(applied).toBe(1)
      expect(requests).toBe(discover ? 5 : 3)
      expect(toolCalls).toEqual(
        discover
          ? ['search_design_tools', 'search_design_tools', 'execute_design']
          : ['execute_design']
      )
      expect(bytes).toBeLessThan(square.previousBytes / 2)
      process.stdout.write(
        JSON.stringify({
          measurement: 'square-offline-replay',
          loadedBytes,
          discover,
          requests,
          bytes
        }) + '\n'
      )
    } finally {
      await Promise.all(sources.map((s) => s.dispose?.()))
      await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
    }
  }
)

it('reads the three recorded Dome operations with recipe authoring only when selected through Responses', async () => {
  const { createDefaultAiModelSources, selectAiModelSource } =
    await import('../ai-model-sources')
  const { operationInputIssue } = await import('@asyra/ai-agent-runtime/schema')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const runtime = await createDrawingRuntime()
  const query = {
    names: [
      'element.getVectorAnchorPoints',
      'element.deleteElements',
      'inspect_drawing'
    ],
    view: 'parameters'
  }
  const replies: string[] = []
  let request = 0
  const sources = createDefaultAiModelSources({
    continuationDatabase: ':memory:',

    fetch: async (_, init) => {
      const body = JSON.parse(String(init?.body))

      request++
      if (request === 1) {
        return requestEntries('design_operations.read_design_resources')
      }

      if (request === 2) {
        const tool = body.input[0].tools[0].tools[0]

        expect(
          operationInputIssue(
            { ...query, includeRecipeDependency: true },
            tool.parameters
          )
        ).toBeUndefined()
      }

      if (request > 2) {
        replies.push(body.input[0].output[0].text)
      }

      const output =
        request === 4
          ? [
              {
                type: 'message',
                role: 'assistant',
                content: [{ type: 'output_text', text: JSON.stringify(final) }]
              }
            ]
          : [
              {
                type: 'function_call',
                namespace: 'design_operations',
                name: 'read_design_resources',
                call_id: 'definition-' + request,
                arguments: JSON.stringify(
                  request === 2
                    ? query
                    : { ...query, includeRecipeDependency: true }
                )
              }
            ]

      return Response.json({
        id: 'facet-' + request,
        status: 'completed',
        output
      })
    }
  })

  try {
    await selectAiModelSource('openai-responses', sources).request(
      {
        ...input,
        actions: runtime.actionDefinitions.map(createAiToolContract)
      },
      {
        environment: {
          OPENAI_API_KEY: 'fixture',
          AI_PROVIDER_MODEL: 'fixture'
        },

        executeBatch: async () => {
          throw Error('Resource reads must not dispatch edits')
        }
      }
    )
    expect(replies).toHaveLength(2)
    const [plain, recipe] = replies.map((text) => JSON.parse(text).apis)

    expect(plain.map((entry: { name: string }) => entry.name)).toHaveLength(3)
    for (const [i, entry] of plain.entries()) {
      expect(entry.recipeDependency).toBeUndefined()
      expect(recipe[i].recipeDependency.name).toBeTruthy()
      expect(recipe[i].operationParameters).toEqual(entry.operationParameters)
      expect(entry.operationParameters).toBeDefined()
      expect(recipe[i].execution).toEqual(entry.execution)
    }

    const [ordinaryBytes, authoringBytes] = replies.map((text) =>
      Buffer.byteLength(text)
    )

    expect(ordinaryBytes).toBeLessThan(6441)
    expect(ordinaryBytes).toBeLessThan(authoringBytes)
    process.stdout.write(
      JSON.stringify({
        measurement: 'dome-three-parameters',
        ordinaryBytes,
        authoringBytes
      }) + '\n'
    )
  } finally {
    await Promise.all(sources.map((source) => source.dispose?.()))
    await Promise.all(
      runtime.ownedResources?.map((resource) => resource.dispose()) ?? []
    )
  }
})

it('matches the catalog digest when all entries are explicitly requested and preserves saved-field exclusivity', async () => {
  const { createDefaultAiModelSources, selectAiModelSource } =
    await import('../ai-model-sources')
  const { operationInputIssue } = await import('@asyra/ai-agent-runtime/schema')
  const { createAiToolContract, createConversationResults } =
    await import('@asyra/ai-agent-runtime')
  const results = createConversationResults(() => 1).open('catalog')
  const { createHash } = await import('node:crypto')
  const runtime = await createDrawingRuntime()
  let appActions: unknown
  let digest = ''
  let requests = 0
  const sources = createDefaultAiModelSources({
    continuationDatabase: ':memory:',

    fetch: async (_, init) => {
      const body = JSON.parse(String(init?.body))

      if (++requests === 1) {
        const user = body.input.find(
          (item: { role: string }) => item.role === 'user'
        )

        appActions = JSON.parse(user.content[0].text).input.actions

        return requestEntries(
          'design_operations.read_design_resources',
          'design_operations.execute_design',
          'design_operations.search_design_tools',
          'design_knowledge.discover_knowledge',
          'design_knowledge.read_knowledge'
        )
      }

      const groups = body.input[0].tools
      const nativeTools = groups.map(
        (group: {
          type: string
          name: string
          description: string
          tools: {
            type: string
            name: string
            description: string
            parameters: unknown
            defer_loading: boolean
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
            deferLoading: tool.defer_loading
          }))
        })
      )

      digest = createHash('sha256')
        .update(JSON.stringify({ nativeTools, appActions }))
        .digest('hex')
      const resource = groups
        .flatMap((group: { tools: unknown[] }) => group.tools)
        .find((tool: { name: string }) => tool.name === 'read_design_resources')

      expect(resource.name).toBe('read_design_resources')
      const savedFields = { item: { name: 'squareColor', path: '' } }

      expect(
        operationInputIssue({ savedFields }, resource.parameters)
      ).toBeUndefined()
      expect(
        operationInputIssue(
          { savedFields, names: ['first'] },
          resource.parameters
        )
      ).toBeDefined()

      return Response.json({
        id: 'done',
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
  })

  captureRecord.mockClear()
  try {
    await selectAiModelSource('openai-responses', sources).request(
      {
        ...input,
        metadata: { conversationId: 'catalog' },
        actions: runtime.actionDefinitions.map(createAiToolContract)
      },
      {
        environment: {
          OPENAI_API_KEY: 'fixture',
          AI_PROVIDER_MODEL: 'fixture'
        },

        resultContext: async (command) => results.exchange(command),

        executeBatch: async () => {
          throw Error('Unexpected mutation')
        }
      }
    )
    expect(requests).toBe(2)
    expect(captureRecord.mock.calls.flat()).toContainEqual(
      expect.objectContaining({
        stage: 'capabilities_advertised',
        evidence: expect.objectContaining({
          toolCount: 5,
          contractDigest: digest
        })
      })
    )
  } finally {
    await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
    await Promise.all(sources.map((source) => source.dispose?.()))
  }
})

it.each(['read_knowledge', 'discover_knowledge'])(
  'reads a known knowledge ID directly through Responses using %s',
  async (toolName) => {
    const { createDefaultAiModelSources, selectAiModelSource } =
      await import('../ai-model-sources')
    const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
    const runtime = await createDrawingRuntime()
    let requests = 0
    let bytes = 0
    const source = selectAiModelSource(
      'openai-responses',
      createDefaultAiModelSources({
        continuationDatabase: ':memory:',

        fetch: async (_, init) => {
          const body = JSON.parse(String(init?.body))

          requests++
          if (requests === 1) {
            bytes = Buffer.byteLength(String(init?.body))

            return requestEntries('design_knowledge.' + toolName)
          }

          if (requests === 2) {
            expect(
              body.input[0].tools[0].tools.map(
                (tool: { name: string }) => tool.name
              )
            ).toEqual([toolName])

            return Response.json({
              id: 'direct',
              status: 'completed',
              output: [
                {
                  type: 'function_call',
                  namespace: 'design_knowledge',
                  name: toolName,
                  call_id: 'color-advice',
                  arguments: JSON.stringify({ ids: ['colors'] })
                }
              ]
            })
          }

          const advice = JSON.parse(body.input[0].output[0].text)

          expect(advice.trust).toBe('untrusted-advice')
          if (toolName === 'read_knowledge') {
            expect(advice.documents).toContainEqual(
              expect.objectContaining({
                target: 'colors',
                text: expect.stringMatching(/\S/)
              })
            )
          } else {
            expect(advice.entries).toContainEqual(
              expect.objectContaining({ id: 'colors' })
            )
            expect(advice.documents).toBeUndefined()
          }

          return Response.json({
            id: 'done',
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
      })
    )

    try {
      await source.request(
        {
          ...input,
          intent: 'Read the colors advice.',
          actions: runtime.actionDefinitions.map(createAiToolContract)
        },
        {
          environment: {
            OPENAI_API_KEY: 'fixture',
            AI_PROVIDER_MODEL: 'gpt-6.2-astra',
            AI_EXECUTION_SOURCE_REVISION: 'fixture'
          },

          executeBatch: async () => {
            throw Error('Unexpected canvas dispatch')
          }
        }
      )
      expect(requests).toBe(3)
      process.stdout.write(
        JSON.stringify({ measurement: 'known-knowledge', requests, bytes }) +
          '\n'
      )
    } finally {
      await source.dispose?.()
      await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
    }
  }
)

it('reads only the selected prior turn and activates hosted research for that turn on the same chain', async () => {
  const { createDefaultAiModelSources, selectAiModelSource } =
    await import('../ai-model-sources')
  const bodies: {
    tools: { type: string }[]
    previous_response_id?: string
    input: { output?: { text: string }[] }[]
  }[] = []
  const responses = createDefaultAiModelSources({
    continuationDatabase: ':memory:',

    fetch: async (_, init) => {
      const body = JSON.parse(String(init?.body))

      bodies.push(body)
      const n = bodies.length

      if (n === 2) {
        return requestEntries(
          'web_search',
          'design_operations.read_design_resources'
        )
      }

      const output =
        n === 3
          ? [
              {
                type: 'web_search_call',
                status: 'completed',
                action: { type: 'search', query: 'public building' }
              },
              {
                type: 'function_call',
                namespace: 'design_operations',
                name: 'read_design_resources',
                call_id: 'read-2',
                arguments: JSON.stringify({ history: { start: 2, count: 1 } })
              }
            ]
          : [
              {
                type: 'message',
                role: 'assistant',
                content: [{ type: 'output_text', text: JSON.stringify(final) }]
              }
            ]

      return Response.json({ id: 'research-' + n, status: 'completed', output })
    }
  })
  const source = selectAiModelSource('openai-responses', responses)

  try {
    for (const [i, intent] of [
      'Finish the edit',
      'Read the second proposal and research public sources',
      'Finish'
    ].entries()) {
      const turns = ['unselected-marker', 'chosen-marker'].map(
        (intent, index) => ({
          turnId: 'old-' + index,
          intent,
          message: intent,
          outcome: 'success',
          attachmentIndexes: []
        })
      )

      await source.request(
        {
          ...input,
          intent,
          metadata: {
            conversationId: 'research',
            turnId: 't' + i,
            conversationContext: {
              turns: i ? turns : [],
              attachmentIndexes: []
            }
          }
        },
        {
          environment: {
            OPENAI_API_KEY: 'offline',
            AI_PROVIDER_MODEL: 'fixture'
          },

          executeBatch: async () => {
            throw Error('Read must not mutate the canvas')
          }
        }
      )
    }

    expect(
      bodies.map((body) => body.tools.some((t) => t.type === 'web_search'))
    ).toEqual([false, false, true, true, false])
    expect(bodies.map((body) => body.previous_response_id)).toEqual([
      undefined,
      'research-1',
      'load-entries',
      'research-3',
      'research-4'
    ])
    const history = JSON.parse(String(bodies[3].input[0].output?.[0].text))

    expect(history).toMatchObject({
      turns: [{ intent: 'chosen-marker' }],
      total: 2
    })
    expect(history.guidance).toContain('current targets')
    expect(JSON.stringify(bodies)).not.toContain('unselected-marker')
    expect(JSON.stringify(bodies.slice(0, 3))).not.toContain('chosen-marker')
  } finally {
    await Promise.all(responses.map((s) => s.dispose?.()))
  }
})

it('resolves the advanced workflow and deferred final control at their authoritative read boundary', async () => {
  const { createDesignProviderTools } = await import('../design-provider-tools')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const { operationInputIssue } = await import('@asyra/ai-agent-runtime/schema')
  const { readCompleteInformation } = await import('./tool-contract-assertions')
  const runtime = await createDrawingRuntime()
  const tools = await createDesignProviderTools(
    { ...input, actions: runtime.actionDefinitions.map(createAiToolContract) },
    {
      modelSource: 'openai-responses',

      executeBatch: async () => {
        throw Error('Resource reads must not mutate the canvas')
      }
    }
  )

  try {
    const sequence = 'design_operations.execute_design'
    const control = 'request_drawing_detail_choice'
    const reply = JSON.parse(
      await readCompleteInformation(
        async (args, name) => {
          const r = await tools.invoke({
            namespace: 'design_operations',
            name,
            callId: crypto.randomUUID(),
            arguments: args
          })

          return r.text
        },
        { names: [sequence, control], view: 'full' },
        'read_design_resources'
      )
    )
    const full = reply.tools.find(
      (tool: { name: string }) => tool.name === 'execute_design'
    ).inputSchema
    const stage = {
      id: 'stage',
      operations: [{ name: 'prepare', arguments: {} }],
      apply: [{ name: 'draw', arguments: {} }]
    }

    expect(operationInputIssue({ stages: [stage] }, full)).toBeUndefined()
    expect(
      operationInputIssue({ stages: [{ ...stage, apply: [] }] }, full)
    ).toBeTruthy()
    const admitted = reply.apis.find(
      (api: { name: string }) => api.name === control
    )

    expect(admitted.inputSchema).toMatchObject({
      type: 'object',
      additionalProperties: false
    })
    expect(JSON.stringify(tools.inputForTurn())).not.toContain(control)
  } finally {
    await tools.dispose()
    await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
  }
})
