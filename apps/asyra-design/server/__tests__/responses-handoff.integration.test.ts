import { expect, it, vi } from 'vitest'

vi.mock('@asyra/ai-agent-runtime/node', async (original) => ({
  ...(await original<typeof import('@asyra/ai-agent-runtime/node')>()),

  createExecutionRecordSink: () => ({
    write: () => undefined,

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
