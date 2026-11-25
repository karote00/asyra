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
                result:
                  a.name === edit.name
                    ? { ...square.receipt, modelResult: square.receipt }
                    : capture
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

it('replays the Dome creation mapping through Responses and reuses the roof without a lookup round trip', async () => {
  const { default: recorded } =
    await import('./fixtures/dome-build-receipt.json')
  const { createDefaultAiModelSources, selectAiModelSource } =
    await import('../ai-model-sources')
  const { createConversationResults, createAiToolContract } =
    await import('@asyra/ai-agent-runtime')
  const runtime = await createDrawingRuntime()
  const { default: square } = await import('./fixtures/selected-square.json')
  const { readFileSync } = await import('node:fs')
  const dataUrl =
    'data:image/png;base64,' +
    readFileSync(
      new URL('./fixtures/selected-square.png', import.meta.url)
    ).toString('base64')
  const capture = {
    ...square.capture,
    image: { ...square.capture.image, dataUrl }
  }
  const results = createConversationResults(() => 1).open('dome')
  const [targets] = recorded.execution.value.createdTargets
  const ids = Object.values(targets.keyToId)

  expect(new Set(ids).size).toBe(1400)
  const draw = {
    id: 'draw',
    name: 'design_workflow.prepare_and_apply_design',
    arguments: {
      draft: (await import('./fixtures/dome-ready-draft.json')).default,
      inspection: 'defer'
    }
  }
  let savedName = ''
  let requests = 0
  let appReads = 0
  let contextReads = 0
  let writes = 0
  let receiptBytes = 0
  let matchedBytes = 0
  const seen: unknown[] = []
  const source = selectAiModelSource(
    'openai-responses',
    createDefaultAiModelSources({
      continuationDatabase: ':memory:',

      fetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body))

        requests++
        const result = body.input.find(
          (entry: { type: string }) => entry.type === 'function_call_output'
        )

        if (result) {
          const text = result.output[0].text
          const receipt = JSON.parse(text)

          seen.push(receipt)
          if (seen.length === 1) {
            expect(receipt.execution.status).toBe('success')
            expect(receipt.execution.value).toEqual({
              createdElementCount: 1400,
              compositionIds: [targets.compositionId],
              createdTargetsName: expect.any(String)
            })
            expect(result.output).toContainEqual({
              type: 'input_image',
              image_url: dataUrl
            })
            receiptBytes = Buffer.byteLength(text)
            matchedBytes = Buffer.byteLength(
              JSON.stringify({
                ...recorded,
                execution: {
                  ...recorded.execution,
                  value: receipt.execution.value
                }
              })
            )
            savedName = receipt.execution.value.createdTargetsName
            expect(
              results.exchange({
                read: { full: { name: savedName, path: '' } }
              }).full
            ).toEqual([targets])
          }
        }

        const bind = (kind: 'step' | 'named') =>
          kind === 'step'
            ? { kind, step: 'draw', path: '/createdTargets/0/keyToId/roof' }
            : { kind, name: savedName, path: '/0/keyToId/roof' }

        const read = (id: unknown) => ({
          name: 'read_design_context',
          arguments: { scope: 'ids', elementIds: [id] }
        })

        const calls = [
          {
            name: 'execute_design',
            args: {
              operations: [
                {
                  name: draw.name,
                  arguments: { ...draw.arguments, inspection: 'immediate' }
                }
              ]
            }
          },
          {
            name: 'read_design_resources',
            args: {
              savedFields: {
                roof: { name: savedName, path: '/0/keyToId/roof' }
              }
            }
          },
          {
            name: 'execute_design',
            args: { operations: [read(bind('named'))] }
          },
          {
            name: 'execute_design',
            args: { operations: [draw, read(bind('step'))] }
          }
        ]
        const edgeCases = [
          { name: 'execute_design', args: { operations: [draw] } },
          {
            name: 'execute_design',
            args: {
              workflow: {
                operations: [draw],
                delivery: {
                  fields: {
                    roof: {
                      step: 'draw',
                      path: '/createdTargets/0/keyToId/roof'
                    }
                  }
                }
              }
            }
          },
          {
            name: 'execute_design',
            args: {
              operations: [
                draw,
                read({
                  kind: 'step',
                  step: 'draw',
                  path: '/createdTargets/0/keyToId/absent'
                })
              ]
            }
          }
        ]
        const call = [...calls, ...edgeCases][requests - 1]

        return Response.json({
          id: 'dome-' + requests,
          status: 'completed',
          output: call
            ? [
                {
                  type: 'function_call',
                  namespace: 'design_operations',
                  name: call.name,
                  call_id: 'call-' + requests,
                  arguments: JSON.stringify(call.args)
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
        metadata: { conversationId: 'dome' },
        actions: runtime.actionDefinitions.map(createAiToolContract)
      },
      {
        environment: {
          OPENAI_API_KEY: 'fixture',
          AI_PROVIDER_MODEL: 'fixture',
          AI_EXECUTION_SOURCE_REVISION: 'fixture'
        },

        resultContext: async (command) => {
          if ('read' in command) {
            appReads++
          }

          if ('save' in command && requests === 5) {
            throw Error('Storage unavailable')
          }

          return results.exchange(command)
        },

        executeBatch: async (batch) => ({
          context: {},
          actionResults: batch.actions.map(
            (
              action
            ): {
              actionId: string
              actionName: string
              result: import('@asyra/ai-agent-runtime').AiJsonValue
            } => {
              if (action.name === 'apply_prepared_design') {
                const args = action.arguments

                if (!args || typeof args !== 'object' || !('design' in args)) {
                  throw Error('Missing application input')
                }

                const design = args.design

                if (
                  !design ||
                  typeof design !== 'object' ||
                  !('entries' in design) ||
                  !Array.isArray(design.entries)
                ) {
                  throw Error('Missing prepared Dome entries')
                }

                expect(
                  design.entries.map((entry) => entry.key).slice(1)
                ).toEqual(Object.keys(targets.keyToId).slice(1))
                writes++

                return {
                  actionId: action.id,
                  actionName: action.name,
                  result: {
                    status: 'complete',
                    timing: {},
                    compositionId: targets.compositionId,
                    appliedElementCount: ids.length,
                    appliedElementIds: ids,
                    keyToId: targets.keyToId,
                    roleToElementIds: Object.fromEntries(
                      Object.entries(targets.keyToId).map(([k, id]) => [
                        k,
                        [id]
                      ])
                    )
                  }
                }
              }

              if (action.name === 'inspect_drawing') {
                return {
                  actionId: action.id,
                  actionName: action.name,
                  result: { ...capture, elementId: targets.compositionId }
                }
              }

              if (action.name === 'release_design_context') {
                const args = action.arguments

                if (
                  !args ||
                  typeof args !== 'object' ||
                  !('snapshotId' in args) ||
                  typeof args.snapshotId !== 'string'
                ) {
                  throw Error('Missing snapshot to release')
                }

                return {
                  actionId: action.id,
                  actionName: action.name,
                  result: { snapshotId: args.snapshotId, released: true }
                }
              }

              contextReads++
              expect(action.name).toBe('read_design_context')
              expect(action.arguments).toMatchObject({
                elementIds: [targets.keyToId.roof]
              })

              return {
                actionId: action.id,
                actionName: action.name,
                result: {
                  available: true,
                  scope: 'ids',
                  snapshotId: 'snapshot-' + contextReads,
                  leaseId: 'lease-' + contextReads,
                  coordinateSpace: 'parent-local',
                  missingIds: [],
                  elements: [{ id: targets.keyToId.roof }],
                  total: 1
                }
              }
            }
          )
        })
      }
    )
    expect(seen[1]).toMatchObject({ fields: { roof: targets.keyToId.roof } })
    expect(seen[2]).toMatchObject({
      actionResults: [{ result: { elements: [{ id: targets.keyToId.roof }] } }]
    })
    expect(seen[3]).toMatchObject({ execution: { status: 'success' } })
    expect(seen[4]).toMatchObject({
      execution: {
        status: 'success',
        value: {
          createdTargetsSaveError: 'Storage unavailable',
          createdTargets: [targets]
        }
      }
    })
    expect(seen[4]).not.toHaveProperty('execution.value.createdTargetsName')
    expect(seen[5]).toMatchObject({ fields: { roof: targets.keyToId.roof } })
    expect(seen[6]).toMatchObject({
      execution: {
        status: 'failed',
        settlement: 'partial',
        recovery: [
          expect.objectContaining({
            stepId: 'draw',
            value: expect.objectContaining({
              artifactId: expect.any(String),
              createdTargetsName: expect.any(String),
              createdElementCount: 1400
            })
          })
        ],
        calls: expect.arrayContaining([
          expect.objectContaining({
            stepId: 'draw',
            status: 'success',
            settlement: 'completed'
          })
        ])
      }
    })
    expect(requests).toBe(8)
    expect(JSON.stringify(seen[6])).not.toContain('"keyToId":')
    expect(writes).toBe(5)
    expect(contextReads).toBe(2)
    expect(appReads).toBe(2)
    expect(receiptBytes).toBeLessThan(1000)
    expect(matchedBytes).toBe(receiptBytes)
    expect(results.names()).toHaveLength(4)
    process.stdout.write(
      JSON.stringify({
        measurement: 'dome-created-targets',
        before: Buffer.byteLength(JSON.stringify(recorded)),
        after: receiptBytes,
        matchedBytes,
        requests
      }) + '\n'
    )
  } finally {
    await source.dispose?.()
    await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
  }
}, 60000)

it.each(['catalog', 'rotation', 'admission', 'curves', 'pointer'] as const)(
  'recovers recorded preparation at the Responses boundary - %s',
  async (route) => {
    const { createDefaultAiModelSources, selectAiModelSource } =
      await import('../ai-model-sources')
    const { createAiToolContract, createConversationResults } =
      await import('@asyra/ai-agent-runtime')
    const { default: submissions } =
      await import('./fixtures/retained-curve-submissions.json')
    const [original, revised, badLeaf, badParent, accepted] = submissions
    const runtime = await createDrawingRuntime()
    const saved = createConversationResults(() => 1).open('repair')

    function recordedRepair(submission: typeof accepted) {
      const args = submission.operations[0].arguments

      if (!('repair' in args)) {
        throw Error('Expected a recorded repair')
      }

      return args.repair
    }

    const { default: square } = await import('./fixtures/selected-square.json')
    const { readFileSync } = await import('node:fs')
    const capture = {
      ...square.capture,
      image: {
        ...square.capture.image,
        dataUrl:
          'data:image/png;base64,' +
          readFileSync(
            new URL('./fixtures/selected-square.png', import.meta.url)
          ).toString('base64')
      }
    }
    const operation = original.operations[0].name

    const correction = (repair: unknown) => ({
      operations: [
        { name: operation, arguments: { repair, inspection: 'immediate' } }
      ]
    })

    const call = (name: string, args: unknown) => ({ name, args })

    let writes = 0
    const submitted = { drafts: 0, repairs: 0 }
    let completed = false

    function* script(): Generator<ReturnType<typeof call>, void, string> {
      let reply = JSON.parse(
        yield call('search_design_tools', { query: 'prepare_and_apply_design' })
      )
      let text = ''

      while (reply.contentDelivery) {
        text += reply.contentDelivery.text
        if (reply.contentDelivery.lastPage) {
          reply = JSON.parse(text)
          break
        }

        reply = JSON.parse(
          yield call(
            'search_design_tools',
            reply.contentDelivery.next.arguments
          )
        )
      }

      const match = reply.tools[0]

      expect(match.execution.operation).toBe(operation)
      if (route === 'catalog' || route === 'rotation') {
        for (const field of ['retain', 'delivery']) {
          expect(match.operationParameters.properties).not.toHaveProperty(field)
          expect(match.capability.inputFields).not.toContain(field)
        }

        const label = {
          type: 'text',
          key: 'label',
          name: 'Label',
          text: 'Label',
          width: 80,
          height: 20
        }
        const select = { fields: { ids: { path: '/compositionIds' } } }
        const request = {
          operations: [
            {
              name: match.execution.operation,
              arguments: {
                inspection: 'defer',
                draft: {
                  type: 'group',
                  name: 'Badge',
                  children: [
                    route === 'rotation' ? { ...label, rotation: 22 } : label
                  ]
                }
              }
            }
          ],
          delivery: select
        }
        let receipt = JSON.parse(
          yield call(match.execution.tool, { workflow: request })
        )

        if (route === 'rotation') {
          expect(receipt.settlement).toBe('not-started')
          expect(writes).toBe(0)
          const draftId = receipt.inputIssues[0].correction.draftId

          receipt = JSON.parse(
            yield call(match.execution.tool, {
              workflow: {
                ...correction({
                  draftId,
                  replacements: [{ path: '/children/0', value: label }]
                }),
                delivery: select
              }
            })
          )
        }

        expect(receipt.fields.ids).toEqual(['created-0'])
      } else if (route === 'admission') {
        const receipt = JSON.parse(yield call(match.execution.tool, original))

        expect(receipt.settlement).toBe('not-started')
        const issue = receipt.inputIssues[0]
        const repair = issue.correction

        expect(issue.operation).toBe(operation)
        const rotation = issue.issues.find((i: { instancePath: string }) =>
          i.instancePath.endsWith('/rotation')
        )

        expect(rotation.instancePath).toBe('/draft/children/30/rotation')
        expect(issue.repairGuide.envelopeIssues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ instancePath: '/delivery' })
          ])
        )
        expect(issue.repairGuide.tool).toBe('prepare_design')
        expect(issue.repairGuide.arguments).not.toHaveProperty('delivery')
        const [target] = issue.repairGuide.arguments.repair.replacements
        const parent = target.path

        expect(parent).toBe('/children/30')
        expect(issue.repairGuide.arguments.repair.draftId).toBe(repair.draftId)

        expect(repair.draftId).toEqual(expect.any(String))
        const originalArgs = original.operations[0].arguments

        if (!('draft' in originalArgs)) {
          throw Error('Expected the original authored draft')
        }

        const sign = originalArgs.draft.children[30]

        expect(sign?.key).toBe('sign')
        const corrected: Record<string, unknown> = { ...sign }

        delete corrected.rotation
        const after = JSON.parse(
          yield call(
            match.execution.tool,
            correction({
              draftId: repair.draftId,
              replacements: [{ path: parent, value: corrected }]
            })
          )
        )

        expect(
          after.execution.recovery[0].value.repairGuide.arguments.repair.replacements.map(
            (r: { path: string }) => r.path
          )
        ).toEqual([
          '/children/18/rings/0/0/inControl',
          '/children/19/rings/0/0/inControl'
        ])
      } else {
        const rejected = JSON.parse(yield call(match.execution.tool, revised))
        const failure = rejected.execution.recovery[0].value

        expect(failure.draftId).toEqual(expect.any(String))
        if (route === 'pointer') {
          for (const invalid of [badLeaf, badParent]) {
            const source = recordedRepair(invalid)
            const retry = JSON.parse(
              yield call(
                match.execution.tool,
                correction({ ...source, draftId: failure.draftId })
              )
            )

            expect(retry.execution.recovery[0].value.message).toContain(
              '/children/16 (surface-grid v3)'
            )
            expect(retry.execution.recovery[0].value.message).toContain(
              'unresolved segment rings'
            )
          }
        }

        const paths: { path: string }[] =
          failure.repairGuide.arguments.repair.replacements
        const values = recordedRepair(badLeaf).replacements

        expect(paths.map((r) => r.path)).toEqual(
          recordedRepair(accepted).replacements.map(
            (r) => r.path + '/inControl'
          )
        )
        expect(writes).toBe(0)
        const success = JSON.parse(
          yield call(
            match.execution.tool,
            correction({
              draftId: failure.draftId,
              replacements: paths.map((p, i) => ({
                ...p,
                value: values?.[i].value
              }))
            })
          )
        )

        expect(
          success.execution?.value?.createdElementCount,
          JSON.stringify(success).slice(0, 2500)
        ).toBe(1335)
        expect(writes).toBe(1)
      }

      completed = true
    }

    let scriptFailure: unknown
    const steps = script()
    let requests = 0
    const source = selectAiModelSource(
      'openai-responses',
      createDefaultAiModelSources({
        continuationDatabase: ':memory:',

        fetch: async (_url, init) => {
          const body = JSON.parse(String(init?.body))

          if (++requests === 1) {
            return requestEntries(
              'design_operations.search_design_tools',
              'design_operations.execute_design'
            )
          }

          const next = (() => {
            try {
              return steps.next(body.input[0]?.output?.[0]?.text)
            } catch (error) {
              scriptFailure = error
              throw error
            }
          })()

          if (!next.done && next.value.name === 'execute_design') {
            const input = next.value.args
            const op =
              input && typeof input === 'object' && 'workflow' in input
                ? input.workflow
                : input

            if (
              !op ||
              typeof op !== 'object' ||
              !('operations' in op) ||
              !Array.isArray(op.operations)
            ) {
              throw Error('Expected operations')
            }

            for (const step of op.operations) {
              if ('draft' in step.arguments) {
                submitted.drafts++
              }

              if ('repair' in step.arguments) {
                submitted.repairs++
              }
            }
          }

          return Response.json({
            id: 'offline-' + requests,
            status: 'completed',
            output: next.done
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
                    namespace: 'design_operations',
                    name: next.value.name,
                    call_id: 'call-' + requests,
                    arguments: JSON.stringify(next.value.args)
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
          metadata: { conversationId: 'repair' },
          actions: runtime.actionDefinitions.map(createAiToolContract)
        },
        {
          environment: {
            OPENAI_API_KEY: 'fixture',
            AI_PROVIDER_MODEL: 'fixture',
            AI_EXECUTION_SOURCE_REVISION: 'fixture'
          },

          resultContext: async (command) => saved.exchange(command),

          executeBatch: async (batch) => ({
            context: {},
            actionResults: batch.actions.map(
              (
                action
              ): {
                actionName: string
                actionId: string
                result: import('@asyra/ai-agent-runtime').AiJsonValue
              } => {
                if (action.name === 'inspect_drawing') {
                  return {
                    actionName: action.name,
                    actionId: action.id,
                    result: { ...capture, elementId: 'created-0' }
                  }
                }

                expect(action.name).toBe('apply_prepared_design')
                const args = action.arguments

                if (!args || typeof args !== 'object' || !('design' in args)) {
                  throw Error('Missing application input')
                }

                const design = args.design

                if (
                  !design ||
                  typeof design !== 'object' ||
                  !('entries' in design) ||
                  !Array.isArray(design.entries)
                ) {
                  throw Error('Expected prepared drawing')
                }

                const keys = design.entries.map((entry) => entry.key)
                const ids = keys.map((_, i) => 'created-' + i)

                writes++

                return {
                  actionName: action.name,
                  actionId: action.id,
                  result: {
                    status: 'complete',
                    timing: {},
                    compositionId: ids[0],
                    appliedElementCount: ids.length,
                    appliedElementIds: ids,
                    keyToId: Object.fromEntries(
                      keys.map((k, i) => [k, ids[i]])
                    ),
                    roleToElementIds: Object.fromEntries(
                      keys.map((k, i) => [k, [ids[i]]])
                    )
                  }
                }
              }
            )
          })
        }
      )
      expect(completed).toBe(true)
      expect(submitted).toEqual({
        drafts: 1,
        repairs: {
          catalog: 0,
          rotation: 1,
          admission: 1,
          curves: 1,
          pointer: 3
        }[route]
      })
      expect(writes).toBe(route === 'admission' ? 0 : 1)
    } catch (error) {
      throw scriptFailure ?? error
    } finally {
      await source.dispose?.()
      await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
    }
  }
)

it('delivers a trace receipt to Responses and pages retained local paths only on request', async () => {
  const { createDefaultAiModelSources, selectAiModelSource } =
    await import('../ai-model-sources')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const { readFile } = await import('node:fs/promises')
  const bytes = await readFile('e2e/fixtures/reference-logo.png')
  const runtime = await createDrawingRuntime()
  let exchange = 0
  let imageArtifactId = ''
  const replies: string[] = []
  const sources = createDefaultAiModelSources({
    continuationDatabase: ':memory:',

    fetch: async (_, init) => {
      const body = JSON.parse(String(init?.body))

      exchange++
      if (exchange === 1) {
        return requestEntries('design_operations.execute_design')
      }

      const reply = body.input.find(
        (item: { type: string }) => item.type === 'function_call_output'
      )

      if (reply) {
        replies.push(reply.output[0].text)
        if (exchange === 3) {
          imageArtifactId = JSON.parse(reply.output[0].text).imageArtifactId
        }
      }

      const args =
        exchange === 2
          ? {
              invocation: {
                namespace: 'image_analysis',
                tool: 'vtracer',
                arguments: {
                  attachmentIndex: 0,
                  plan: {
                    strategy: 'preserve-vectors',
                    reason: 'Keep editable contours.'
                  }
                }
              }
            }
          : {
              operations: [
                {
                  name: 'image_analysis.query_vector_paths',
                  arguments: {
                    imageArtifactId,
                    region: { x: 0, y: 0, width: 250, height: 250 },
                    limit: 1
                  }
                }
              ]
            }

      return Response.json({
        id: 'vector-page-' + exchange,
        status: 'completed',
        output:
          exchange === 4
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
                  namespace: 'design_operations',
                  name: 'execute_design',
                  call_id: 'vector-' + exchange,
                  arguments: JSON.stringify(args)
                }
              ]
      })
    }
  })

  try {
    await selectAiModelSource('openai-responses', sources).request(
      {
        ...input,
        actions: runtime.actionDefinitions.map(createAiToolContract),
        metadata: {
          imageAttachments: [
            {
              mediaType: 'image/webp',
              dataUrl: 'data:image/webp;base64,' + bytes.toString('base64'),
              size: bytes.length
            }
          ]
        }
      },
      {
        environment: {
          OPENAI_API_KEY: 'fixture',
          AI_PROVIDER_MODEL: 'fixture'
        },

        executeBatch: async () => {
          throw Error('Reading a retained artifact must not change the canvas')
        }
      }
    )
    expect(exchange).toBe(4)
    const [receipt, page] = replies.map((text) => JSON.parse(text))

    expect(receipt.pathCount, replies[0]).toBeGreaterThan(1)
    expect(receipt).not.toHaveProperty('paths')
    expect(page.execution?.value, replies[1]).toMatchObject({
      imageArtifactId,
      paths: [{ id: expect.any(String) }],
      nextOffset: expect.any(Number)
    })
  } finally {
    await Promise.all(sources.map((source) => source.dispose?.()))
    await Promise.all(
      runtime.ownedResources?.map((resource) => resource.dispose()) ?? []
    )
    captureRecord.mockClear()
  }
})

it('shares preparation findings with the published check reader and scopes review to the authored node', async () => {
  const { createDesignProviderTools } = await import('../design-provider-tools')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const runtime = await createDrawingRuntime()
  const tools = await createDesignProviderTools(
    { ...input, actions: runtime.actionDefinitions.map(createAiToolContract) },
    {
      modelSource: 'openai-responses',

      executeBatch: async (batch) => ({
        context: {},
        actionResults: batch.actions.map(
          (
            a
          ): import('@asyra/ai-agent-runtime').AiBatchReceipt['actionResults'][number] => ({
            actionId: a.id,
            actionName: a.name,
            result:
              a.name === 'read_design_attachment'
                ? {
                    available: true,
                    workspaceId: 'workspace',
                    parentId: 'workspace',
                    basis: [
                      { x: 0, y: 0 },
                      { x: 1, y: 0 },
                      { x: 0, y: 1 }
                    ],
                    evidence: { sessionId: 'scene', revision: 0 }
                  }
                : {
                    current: true,
                    validatedAt: { sessionId: 'scene', revision: 0 }
                  }
          })
        )
      })
    }
  )

  const send = (args: unknown) =>
    tools.invoke({
      namespace: 'design_operations',
      name: 'execute_design',
      callId: crypto.randomUUID(),
      arguments: args
    })

  const read = async (tool: string, args: unknown) =>
    JSON.parse(
      (
        await send({
          invocation: { namespace: 'design_operations', tool, arguments: args }
        })
      ).text
    )

  try {
    const draft = {
      type: 'frame',
      name: 'Panel',
      width: 100,
      height: 100,
      brief: {
        intent: 'Tiles',
        viewpoint: 'Front',
        sources: ['User'],
        assumptions: ['Fixed'],
        checks: [
          { key: 'tile-0', property: 'width', expected: 8, tolerance: 0 }
        ]
      },
      children: Array.from({ length: 180 }, (_, i) => ({
        name: 'Tile',
        key: 'tile-' + i,
        type: 'rect',
        width: 10,
        height: 10,
        x: 95,
        y: 0
      }))
    }
    const result = JSON.parse(
      (
        await send({
          operations: [
            {
              id: 'prepare',
              name: 'design_preparation.prepare_design',
              arguments: { draft }
            }
          ]
        })
      ).text
    )
    const value = result.execution.recovery[0].value

    expect((await read('read_design_checks', {})).counts.fail).toBe(1)
    expect(value.findings.length).toBeLessThan(10)
    const page = await read('read_design_checks', {
      findingsFor: value.findingSummary.checkId,
      target: 'tile-0'
    })

    expect(page.findingPage.items.map((f: { kind: string }) => f.kind)).toEqual(
      ['overflow', 'requirement']
    )
    expect(
      (
        await read('review_prepared_design', {
          artifactId: value.artifactId,
          keys: ['tile-0']
        })
      ).deterministicFindings
    ).toEqual(page.findingPage.items)
    const selected = await read('review_prepared_design', {
      artifactId: value.artifactId,
      keys: ['tile-1']
    })

    expect(selected.findingSummary).toMatchObject({
      total: 1,
      blockingTotal: 181
    })
    const combined = JSON.parse(
      (
        await send({
          operations: [
            {
              name: 'design_workflow.prepare_and_apply_design',
              arguments: { parts: [{ key: 'panel', draft }] }
            }
          ]
        })
      ).text
    )
    const failedPart = combined.execution.recovery[0].value.parts[0]

    expect(failedPart.findingSummary.total).toBe(181)
    expect(failedPart.findings).toHaveLength(2)
    const all = await read('review_prepared_design', {
      artifactId: value.artifactId
    })

    expect(all.status).toBe('fail')
    expect(all.findingSummary.total).toBe(181)
    expect(
      (await read('review_prepared_design', { artifactId: value.artifactId }))
        .deterministicFindings
    ).toEqual([])
    expect(
      (
        await read('read_design_checks', {
          briefFor: value.findingSummary.checkId
        })
      ).preparedReview.checks[0]
    ).toMatchObject({ key: 'tile-0', actual: 10, passed: false })
    const forwarded = await send({
      workflow: {
        operations: [
          {
            id: 'full',
            name: 'design_preparation.prepare_design',
            arguments: {
              draft: {
                type: 'frame',
                name: 'Labels',
                width: 106,
                height: 100,
                children: Array.from({ length: 20 }, (_, i) => ({
                  name: 'Label',
                  key: 'label-' + i,
                  type: 'text',
                  width: 80,
                  height: 18,
                  text: 'Label'
                }))
              }
            }
          }
        ],
        delivery: { fields: { issues: { step: 'full', path: '/findings' } } }
      }
    })

    expect(JSON.parse(forwarded.text), forwarded.text).toMatchObject({
      fields: { issues: expect.any(Array) }
    })
    expect(JSON.parse(forwarded.text).fields.issues).toHaveLength(20)
    expect(value.draftId).toEqual(expect.any(String))
    const repaired = JSON.parse(
      (
        await send({
          operations: [
            {
              name: 'design_preparation.prepare_design',
              arguments: {
                repair: {
                  draftId: value.draftId,
                  replacements: [
                    { path: '/width', value: 105 },
                    { path: '/children/0/width', value: 8 }
                  ]
                }
              }
            }
          ]
        })
      ).text
    )

    expect(repaired.execution.value).toMatchObject({
      applicable: true,
      elementCount: 181,
      findings: []
    })
    const error = await send({ operations: [] })
    const message = JSON.parse(error.text).message

    expect(
      error.contentItems.flatMap((p) =>
        p.type === 'inputText'
          ? p.text.split(JSON.stringify(message)).slice(1)
          : []
      )
    ).toHaveLength(1)
  } finally {
    await tools.dispose()
    await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
  }
})

it('repairs the recorded entrance at the native provider boundary without resubmitting its source', async () => {
  const { default: submission } =
    await import('./fixtures/entrance-vector-submission.json')
  const { createDesignProviderTools } = await import('../design-provider-tools')
  const { createAiToolContract, createConversationResults } =
    await import('@asyra/ai-agent-runtime')
  const { operationInputIssue } = await import('@asyra/ai-agent-runtime/schema')
  const runtime = await createDrawingRuntime()
  const saved = createConversationResults(() => 1).open('entrance')
  const writes: string[][] = []
  const tools = await createDesignProviderTools(
    {
      ...input,
      metadata: { conversationId: 'entrance' },
      actions: runtime.actionDefinitions.map(createAiToolContract)
    },
    {
      modelSource: 'local-codex',

      resultContext: async (command) => saved.exchange(command),

      executeBatch: async (batch) => ({
        context: {},
        actionResults: batch.actions.map((a) => {
          expect(a.name).toBe('apply_prepared_design')
          const args = a.arguments

          if (
            !args ||
            typeof args !== 'object' ||
            !('design' in args) ||
            !args.design ||
            typeof args.design !== 'object' ||
            !('entries' in args.design) ||
            !Array.isArray(args.design.entries)
          ) {
            throw Error('Expected compiled design')
          }

          expect(args).toMatchObject({ parentId: submission.parentId })
          const keys = args.design.entries.map((e) => String(e.key))
          const ids = keys.map((_, i) => 'created-' + i)

          writes.push(keys)

          return {
            actionName: a.name,
            actionId: a.id,
            result: {
              status: 'complete',
              timing: {},
              compositionId: ids[0],
              appliedElementCount: ids.length,
              modelResult: {
                status: 'complete',
                compositionId: ids[0],
                appliedElementCount: ids.length
              },
              appliedElementIds: ids,
              keyToId: Object.fromEntries(keys.map((k, i) => [k, ids[i]])),
              roleToElementIds: Object.fromEntries(
                keys.map((k, i) => [k, [ids[i]]])
              )
            }
          }
        })
      })
    }
  )

  const call = async (namespace: string, name: string, args: unknown) => {
    const reply = await tools.invoke({
      namespace,
      name,
      arguments: args,
      callId: crypto.randomUUID()
    })
    const content = reply.contentItems[0]

    if (content.type !== 'inputText') {
      throw Error('Missing provider text')
    }

    const acknowledgement = reply.contentItems.at(-1)

    if (acknowledgement?.type !== 'inputText') {
      throw Error('Missing provider acknowledgement')
    }

    const state = JSON.parse(acknowledgement.text).toolOutcome

    expect(state).toMatchObject({
      status: reply.outcome.status,
      settlement: reply.outcome.settlement
    })

    return {
      ...JSON.parse(content.text),
      toolOutcome: state
    }
  }

  const draw = (args: unknown) =>
    call('design_workflow', 'prepare_and_apply_design', args)

  try {
    const rejected = await draw(submission)

    expect(rejected).toMatchObject({
      code: 'TOOL_INPUT_INVALID',
      settlement: 'not-started',
      draftId: expect.any(String)
    })
    expect(rejected.message).toMatch(/zero width/i)
    expect(rejected.retainedDraft.revision).toBe(rejected.draftId)
    expect(writes).toHaveLength(0)
    let resource = await call('design_operations', 'read_design_resources', {
      names: ['prepare_and_apply_design'],
      scopes: {
        prepare_and_apply_design: { inputScope: { operation: 'repair' } }
      }
    })

    if (resource.contentDelivery) {
      const fragments = [resource.contentDelivery.text]

      while (!resource.contentDelivery.lastPage) {
        const nextByte = resource.contentDelivery.endByte

        resource = await call(
          'design_operations',
          'read_design_resources',
          resource.contentDelivery.next.arguments
        )
        expect(resource.contentDelivery.startByte).toBe(nextByte)
        expect(resource.contentDelivery.endByte).toBeGreaterThan(nextByte)
        fragments.push(resource.contentDelivery.text)
      }

      resource = JSON.parse(fragments.join(''))
    }

    expect(resource.tools?.[0]?.inputSchema).toBeDefined()
    const guide = rejected.repairGuide.arguments

    expect(guide.parentId).toBe(submission.parentId)
    expect(guide.repair.draftId).toBe(rejected.draftId)
    const paths: string[] = guide.repair.replacements.map(
      (entry: { path: string }) => entry.path
    )

    expect(paths).toEqual(
      [42, 43, 44, 45].map((i) => '/children/' + i + '/rings')
    )
    const corrected = {
      ...guide,
      inspection: 'defer',
      repair: {
        ...guide.repair,
        replacements: paths.map((path) => {
          const node = submission.draft.children[Number(path.split('/')[2])]

          return {
            path,
            value: node.rings.map((r) =>
              r.map((pt, i) => ({
                ...pt,
                x: pt.x + (i === 1 || i === 2 ? 2 : 0)
              }))
            )
          }
        })
      }
    }

    expect(
      operationInputIssue(corrected, resource.tools[0].inputSchema)
    ).toBeUndefined()
    expect(corrected).not.toHaveProperty('draft')
    const applied = await draw(corrected)

    expect(applied, JSON.stringify(applied).slice(0, 600)).toMatchObject({
      createdElementCount: 104,
      toolOutcome: { status: 'success', settlement: 'completed' }
    })
    expect(writes).toHaveLength(1)
    expect(writes[0].slice(1)).toEqual(
      submission.draft.children.map((c) => c.key)
    )
  } finally {
    await tools.dispose()
    await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
  }
})

it('retains admission recovery on a direct drawing with explicit delivery', async () => {
  const { createDesignProviderTools } = await import('../design-provider-tools')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const runtime = await createDrawingRuntime()
  const executeBatch = vi.fn()
  const tools = await createDesignProviderTools(
    { ...input, actions: runtime.actionDefinitions.map(createAiToolContract) },
    { modelSource: 'local-codex', executeBatch }
  )

  try {
    const reply = await tools.invoke({
      namespace: 'design_workflow',
      name: 'prepare_and_apply_design',
      callId: 'invalid',
      arguments: {
        draft: {
          type: 'group',
          name: 'Container',
          children: [
            {
              type: 'rect',
              key: 'rect',
              name: 'Rectangle',
              width: -1,
              height: 1
            }
          ]
        },
        delivery: 'status'
      }
    })
    const item = reply.contentItems[0]

    if (item.type !== 'inputText') {
      throw Error('Missing rejection')
    }

    expect(JSON.parse(item.text)).toMatchObject({
      code: 'TOOL_INPUT_INVALID',
      settlement: 'not-started',
      draftId: expect.any(String)
    })

    const native = async (namespace: string, name: string, args: unknown) => {
      const reply = await tools.invoke({
        namespace,
        name,
        callId: crypto.randomUUID(),
        arguments: args
      })
      const first = reply.contentItems[0]

      if (first.type !== 'inputText') {
        throw Error('Missing provider reply')
      }

      return JSON.parse(first.text)
    }

    const bulk = await native('design_workflow', 'prepare_and_apply_design', {
      draft: {
        type: 'group',
        name: 'Elements',
        children: Array.from({ length: 53 }, (_, i) => ({
          type: 'rect',
          key: 'item' + i,
          name: 'Item',
          width: 0,
          height: 1
        }))
      }
    })
    const continuation = bulk.repairGuide.read
    const last = await native(
      'design_operations',
      continuation.tool,
      continuation.arguments
    )

    expect(last).toMatchObject({
      draftId: bulk.draftId,
      total: 53,
      items: [
        { path: '/children/50' },
        { path: '/children/51' },
        { path: '/children/52' }
      ]
    })
    expect(executeBatch).not.toHaveBeenCalled()
  } finally {
    await tools.dispose()
    await Promise.all(runtime.ownedResources?.map((r) => r.dispose()) ?? [])
  }
})
