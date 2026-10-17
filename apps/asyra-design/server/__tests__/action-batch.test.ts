import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import type {
  AiActionBatch,
  AiProviderInput
} from '../../src/ai/action-batch-protocol'
import { describe, expect, it, vi } from 'vitest'
import {
  ActionBatchServerError,
  createActionBatchMiddleware,
  resolveActionBatchRequest
} from '../action-batch'
import { ACTION_BATCH_ENDPOINT } from '../../src/ai/action-batch-endpoint'

const sampleRoot = new URL('../../samples/crdt-7076/', import.meta.url)

const sampleActionBatch = async (): Promise<AiActionBatch> =>
  JSON.parse(
    await readFile(new URL('action-batch.json', sampleRoot), 'utf8')
  ) as AiActionBatch

const sampleInput = async (): Promise<AiProviderInput> => {
  const [image, instruction] = await Promise.all([
    readFile(new URL('reference-image.png', sampleRoot)),
    readFile(new URL('instruction.txt', sampleRoot), 'utf8')
  ])
  return {
    actions: [
      {
        description: 'Insert one prepared vector composition',
        inputSchema: {},
        name: 'insert_vector_composition'
      }
    ],
    attempt: 1,
    context: {},
    intent: instruction.trim(),
    metadata: {
      imageAttachments: [
        {
          dataUrl: `data:image/png;base64,${image.toString('base64')}`,
          mediaType: 'image/png',
          name: 'reference-image.png',
          size: image.byteLength
        }
      ]
    }
  }
}

const postActionBatch = async (
  middleware: ReturnType<typeof createActionBatchMiddleware>,
  input: AiProviderInput
): Promise<{ readonly body: unknown; readonly status: number }> => {
  const server = createServer((request, response) => {
    void middleware(request, response, () => {
      response.statusCode = 404
      response.end()
    })
  })

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address() as AddressInfo
    const response = await fetch(
      `http://127.0.0.1:${address.port}${ACTION_BATCH_ENDPOINT}`,
      {
        body: JSON.stringify(input),
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        method: 'POST'
      }
    )
    return {
      body: await response.json(),
      status: response.status
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

describe('crdt-7076 action-batch backend sample', () => {
  it('bypasses the model provider for the exact 7076 sample', async () => {
    const requestModelActionBatch = vi.fn(async (): Promise<AiActionBatch> => {
      throw new Error('The exact 7076 sample must not call the model provider.')
    })

    await expect(
      resolveActionBatchRequest(await sampleInput(), {
        requestId: 'request-7076',
        requestModelActionBatch
      })
    ).resolves.toEqual(await sampleActionBatch())
    expect(requestModelActionBatch).not.toHaveBeenCalled()
  })

  it('uses the configured model path for an ordinary request', async () => {
    const expectedBatch: AiActionBatch = {
      actions: [
        {
          arguments: { height: 40, width: 80 },
          id: 'action-1',
          name: 'create_rectangle',
          summary: 'Create one rectangle'
        }
      ],
      batchId: 'model-batch'
    }
    const requestModelActionBatch = vi.fn(async () => expectedBatch)
    const input: AiProviderInput = {
      actions: [],
      attempt: 1,
      context: {},
      intent: 'Create one rectangle'
    }

    await expect(
      resolveActionBatchRequest(input, {
        requestId: 'ordinary-request',
        requestModelActionBatch
      })
    ).resolves.toEqual(expectedBatch)
    expect(requestModelActionBatch).toHaveBeenCalledOnce()
    expect(requestModelActionBatch).toHaveBeenCalledWith(input, {
      signal: undefined
    })
  })

  it('returns the exact ordered instruction file after the image and instruction match', async () => {
    const expectedBatch = await sampleActionBatch()
    const batch = await resolveActionBatchRequest(await sampleInput(), {
      requestId: 'request-7076'
    })
    const action = batch.actions[0]
    const artifact = action.arguments as {
      elementCount: number
      groupDescriptor: { id: string }
      slices: readonly { descriptors: readonly unknown[] }[]
    }

    expect(batch).toEqual(expectedBatch)
    expect(batch.actions).toHaveLength(1)
    expect(batch.batchId).toBe('create-cat-only-white-background')
    expect(artifact.elementCount).toBe(7_075)
    expect(artifact.groupDescriptor.id).toMatch(/^grp-[a-f0-9]+-1$/)
    expect(
      artifact.slices.reduce(
        (total, slice) => total + slice.descriptors.length,
        0
      )
    ).toBe(7_075)
  })

  it('returns the exact instruction file through the formal HTTP endpoint', async () => {
    const expectedBatch = await sampleActionBatch()
    const response = await postActionBatch(
      createActionBatchMiddleware(),
      await sampleInput()
    )
    const batch = response.body as {
      actions: readonly {
        arguments: {
          elementCount: number
          groupDescriptor: { id: string }
        }
      }[]
    }

    expect(response.status).toBe(200)
    expect(batch).toEqual(expectedBatch)
    expect(batch.actions).toHaveLength(1)
    expect(batch.actions[0].arguments.elementCount).toBe(7_075)
    expect(batch.actions[0].arguments.groupDescriptor.id).toMatch(
      /^grp-[a-f0-9]+-1$/
    )
  })

  it('maps incomplete configuration and upstream failure before Runtime', async () => {
    const ordinaryInput: AiProviderInput = {
      actions: [],
      attempt: 1,
      context: {},
      intent: 'Create one rectangle'
    }
    const cases = [
      {
        backendCode: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
        responseCode: 'ACTION_BATCH_MODEL_CONFIGURATION_REQUIRED',
        status: 503
      },
      {
        backendCode: 'AI_MODEL_BACKEND_TRANSPORT_FAILED',
        responseCode: 'ACTION_BATCH_MODEL_FAILED',
        status: 502
      }
    ] as const

    for (const testCase of cases) {
      const response = await postActionBatch(
        createActionBatchMiddleware({
          requestModelActionBatch: async () => {
            throw Object.assign(new Error('bounded backend failure'), {
              code: testCase.backendCode
            })
          }
        }),
        ordinaryInput
      )

      expect(response).toEqual({
        body: { code: testCase.responseCode },
        status: testCase.status
      })
    }
  })

  it('rejects a different instruction or image before action preparation', async () => {
    const input = await sampleInput()
    const requestModelActionBatch = vi.fn(async (): Promise<AiActionBatch> => {
      throw new Error(
        'A mismatched 7076 sample must fail without model fallback.'
      )
    })

    await expect(
      resolveActionBatchRequest(
        {
          ...input,
          intent: 'draw something else'
        },
        { requestId: 'wrong-instruction', requestModelActionBatch }
      )
    ).rejects.toBeInstanceOf(ActionBatchServerError)

    const metadata = input.metadata as {
      imageAttachments: readonly Record<string, unknown>[]
    }
    await expect(
      resolveActionBatchRequest(
        {
          ...input,
          metadata: {
            imageAttachments: [
              {
                ...metadata.imageAttachments[0],
                dataUrl: 'data:image/png;base64,AQID',
                size: 3
              }
            ]
          }
        },
        { requestId: 'wrong-image', requestModelActionBatch }
      )
    ).rejects.toBeInstanceOf(ActionBatchServerError)
    expect(requestModelActionBatch).not.toHaveBeenCalled()
  })

  it('keeps only the ordered instruction file as the sample drawing authority', async () => {
    const instructionFile = JSON.parse(
      await readFile(new URL('action-batch.json', sampleRoot), 'utf8')
    ) as AiActionBatch

    expect(instructionFile.batchId).toBe('create-cat-only-white-background')
    expect(instructionFile.actions).toHaveLength(1)
    await expect(
      readFile(new URL('action-batch.json', sampleRoot), 'utf8')
    ).resolves.toContain('"insert_vector_composition"')
    await expect(
      readFile(new URL('converted-vector-data.svg', sampleRoot), 'utf8')
    ).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(
      readFile(new URL('instruction.txt', sampleRoot), 'utf8')
    ).resolves.toMatch(/Draw only the cat/)
    expect(fileURLToPath(new URL('reference-image.png', sampleRoot))).toContain(
      '/samples/crdt-7076/'
    )
  })

  it('keeps one canonical 7,076-element generated regression document', async () => {
    const compressedDocument = await readFile(
      new URL('document.json.gz', sampleRoot)
    )
    const document = JSON.parse(gunzipSync(compressedDocument).toString()) as {
      version: string
      sceneTree: {
        workspaceList: readonly string[]
        elements: Readonly<Record<string, unknown>>
      }
    }
    const workspaceIds = new Set(document.sceneTree.workspaceList)
    const documentElementIds = Object.keys(document.sceneTree.elements).filter(
      (elementId) => !workspaceIds.has(elementId)
    )

    expect(compressedDocument.byteLength).toBeLessThan(16 * 1024 * 1024)
    expect(document.version).toBe('1.0.0')
    expect(documentElementIds).toHaveLength(7_076)
  })
})

it('streams a prepared operation and resumes only after its one-use same-origin receipt', async () => {
  const { AI_BATCH_EXECUTION_HEADER, AI_BATCH_RECEIPT_HEADER } =
    await import('../../src/ai/action-batch-endpoint')
  let acknowledged = false
  const prepared = {
    batchId: 'intermediate',
    actions: [
      {
        id: 'a',
        name: 'select_elements',
        arguments: { elementIds: ['actual'] },
        summary: 'Select'
      }
    ]
  }
  const middleware = createActionBatchMiddleware({
    requestModelActionBatch: async (_input, options) => {
      if (!options.executeBatch)
        throw new Error('Missing batch execution transport')
      const receipt = await options.executeBatch(prepared)
      expect(receipt.context).toEqual({ actual: true })
      acknowledged = true
      return { ...prepared, batchId: 'final' }
    }
  })
  const server = createServer((request, response) => {
    void middleware(request, response, () => response.end())
  })
  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const endpoint = origin + ACTION_BATCH_ENDPOINT
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
        accept: 'application/x-ndjson',
        [AI_BATCH_EXECUTION_HEADER]: '1'
      },
      body: JSON.stringify({
        intent: 'Select',
        context: {},
        actions: [],
        attempt: 1
      })
    })
    if (!response.body) throw new Error('Missing stream')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (!text.includes('\n'))
      text += decoder.decode((await reader.read()).value)
    const frame = JSON.parse(text.trim())
    expect(frame.type).toBe('batch')
    expect(acknowledged).toBe(false)
    const send = (requestOrigin: string) =>
      fetch(endpoint, {
        method: 'POST',
        headers: {
          origin: requestOrigin,
          'content-type': 'application/json',
          [AI_BATCH_RECEIPT_HEADER]: frame.receiptToken
        },
        body: JSON.stringify({ actionResults: [], context: { actual: true } })
      })
    expect((await send('https://foreign.example')).status).toBe(403)
    expect(acknowledged).toBe(false)
    expect((await send(origin)).status).toBe(200)
    expect((await send(origin)).status).toBe(409)
    text = ''
    while (true) {
      const part = await reader.read()
      if (part.done) break
      text += decoder.decode(part.value)
    }
    expect(JSON.parse(text.trim()).batch.batchId).toBe('final')
    expect(acknowledged).toBe(true)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

it('delivers a real browser failure through HTTP before closing the execution stream', async () => {
  const { AiActionExecutionError } = await import('@asyra/ai-agent-runtime')
  const { createServerActionBatchProvider } =
    await import('../../src/ai/server-action-batch-provider')
  const { recordActionFailure } = await import('../../src/ai/action-failure')
  const { BrowserBatchExecutionError } = await import('../batch-exchange')
  let received: unknown
  const prepared = {
    batchId: 'failed-batch',
    actions: [
      { id: 'a', name: 'apply_prepared_design', arguments: {}, summary: 'Draw' }
    ]
  }
  const middleware = createActionBatchMiddleware({
    requestModelActionBatch: async (_input, options) => {
      if (!options.executeBatch) throw new Error('Missing execution transport')
      try {
        await options.executeBatch(prepared)
      } catch (error) {
        received = error
        throw error
      }
      throw new Error('Failed batch incorrectly succeeded')
    }
  })
  const server = createServer((request, response) => {
    void middleware(request, response, () => response.end())
  })
  let provider: ReturnType<typeof createServerActionBatchProvider> | undefined
  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    provider = createServerActionBatchProvider({
      fetch: (async (url, init) =>
        fetch(origin + String(url), {
          ...init,
          headers: { ...init.headers, origin }
        })) as never
    })
    const error = new AiActionExecutionError('Prepared design is invalid.')
    const controller = new AbortController()
    await expect(
      provider.requestActionBatch(
        { intent: 'Draw', context: {}, actions: [], attempt: 1 },
        {
          signal: controller.signal,
          executeBatch: async () => {
            recordActionFailure(error, 'apply_prepared_design', 17)
            throw error
          }
        }
      )
    ).rejects.toBeDefined()
    expect(controller.signal.aborted).toBe(false)
    expect(received).toBeInstanceOf(BrowserBatchExecutionError)
    expect(received).toMatchObject({
      failure: {
        batchId: 'failed-batch',
        actionName: 'apply_prepared_design',
        handlerMs: 17,
        message: error.message
      }
    })
  } finally {
    provider?.dispose()
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

it.each(['completed', 'partial', 'unknown'] as const)(
  'delivers oversized %s output as a recoverable receipt without replay or stream cancellation',
  async (settlement) => {
    const { createServerActionBatchProvider } =
      await import('../../src/ai/server-action-batch-provider')
    const { requireBatchSuccess, BrowserBatchExecutionError } =
      await import('../batch-exchange')
    const prepared = {
      batchId: 'large-result',
      actions: [
        {
          id: 'export',
          name: 'api_core_save',
          arguments: {},
          summary: 'Export'
        }
      ]
    }
    let failure: unknown
    let postedBytes = 0
    const executeBatch = vi.fn(async () => ({
      ...(settlement === 'completed'
        ? {}
        : {
            failure: {
              code: 'OWNER_FAILED',
              message: 'An operation failed.',
              stage: 'execution',
              actionId: 'export',
              actionName: 'api_core_save',
              actionExecutionMs: 1,
              contextFresh: false,
              settlement
            }
          }),
      actionResults: [
        {
          actionId: 'export',
          actionName: 'api_core_save',
          result: {
            status: 'no-change',
            value: { content: 'x'.repeat(17 * 1024 * 1024) }
          }
        }
      ],
      context: {}
    }))
    const middleware = createActionBatchMiddleware({
      requestModelActionBatch: async (_input, options) => {
        if (!options.executeBatch)
          throw new Error('Missing execution transport')
        const receipt = await options.executeBatch(prepared)
        try {
          requireBatchSuccess(prepared, receipt, 1)
        } catch (error) {
          failure = error
        }
        return { batchId: 'recovered', actions: [] }
      }
    })
    const server = createServer((request, response) => {
      void middleware(request, response, () => response.end())
    })
    let provider: ReturnType<typeof createServerActionBatchProvider> | undefined
    try {
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      )
      const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      provider = createServerActionBatchProvider({
        fetch: (async (url, init) => {
          if ((init.headers as Record<string, string>)['x-ai-batch-receipt'])
            postedBytes = Buffer.byteLength(String(init.body))
          return fetch(origin + String(url), {
            ...init,
            headers: { ...init.headers, origin }
          })
        }) as never
      })
      const controller = new AbortController()
      await expect(
        provider.requestActionBatch(
          { intent: 'Export', context: {}, actions: [], attempt: 1 },
          { signal: controller.signal, executeBatch }
        )
      ).resolves.toMatchObject({ batchId: 'recovered' })
      expect(executeBatch).toHaveBeenCalledOnce()
      expect(controller.signal.aborted).toBe(false)
      expect(postedBytes).toBeLessThan(4096)
      expect(failure).toBeInstanceOf(BrowserBatchExecutionError)
      expect(failure).toMatchObject({
        receipt: {
          failure: {
            code: 'ACTION_BATCH_RECEIPT_TOO_LARGE',
            stage: 'delivery',
            settlement,
            contextFresh: false,
            observedResult: {
              bytes: expect.any(Number),
              limit: 16 * 1024 * 1024
            }
          }
        }
      })
      if (settlement !== 'completed')
        expect(failure).toMatchObject({
          receipt: {
            failure: {
              observedResult: {
                originalFailure: { code: 'OWNER_FAILED', settlement }
              }
            }
          }
        })
    } finally {
      provider?.dispose()
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }
)

it('preserves activity provenance and order through the HTTP progress handoff', async () => {
  const { createServerActionBatchProvider } =
    await import('../../src/ai/server-action-batch-provider')
  const events = [
    {
      tool: 'execute_design_batch',
      status: 'running' as const,
      message: 'Adding windows',
      activity: { kind: 'work' as const, callId: 'draw-1', sequence: 1 }
    },
    {
      tool: 'prepare_design',
      status: 'running' as const,
      message: 'Preparing the design',
      activity: { kind: 'system' as const, callId: 'prepare-2', sequence: 2 }
    }
  ]
  const middleware = createActionBatchMiddleware({
    requestModelActionBatch: async (_input, options) => {
      for (const event of events) options.onProgress?.(event)
      return { batchId: 'final', actions: [] }
    }
  })
  const server = createServer((request, response) => {
    void middleware(request, response, () => response.end())
  })
  let provider: ReturnType<typeof createServerActionBatchProvider> | undefined
  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    provider = createServerActionBatchProvider({
      fetch: (async (url, init) =>
        fetch(origin + String(url), {
          ...init,
          headers: { ...init.headers, origin }
        })) as never
    })
    const received: unknown[] = []
    await provider.requestActionBatch(
      { intent: 'Draw', context: {}, actions: [], attempt: 1 },
      {
        signal: new AbortController().signal,
        onProgress: (event) => {
          received.push(event)
        }
      }
    )
    expect(received).toEqual(events)
  } finally {
    provider?.dispose()
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

it('accepts independently addressed final request records and preserves idempotent acknowledgements', async () => {
  const { AI_EXECUTION_RECORD_ENDPOINT } =
    await import('../../src/ai/action-batch-endpoint')
  const records: unknown[] = []
  const flush = vi.fn(async () => ({ status: 'saved' as const, path: null }))
  const requestModelActionBatch = vi.fn()
  const middleware = createActionBatchMiddleware({
    requestModelActionBatch,
    createRecordingSink: () => ({
      checkpoint: async () => ({ status: 'saved', path: null }),
      write: (record) => {
        records.push(record)
      },
      flush
    })
  })
  const server = createServer((request, response) => {
    void middleware(request, response, () => {
      response.statusCode = 404
      response.end()
    })
  })
  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}${AI_EXECUTION_RECORD_ENDPOINT}`
    const send = async (body: unknown, origin?: string) =>
      fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(origin ? { origin } : {})
        },
        body: JSON.stringify(body)
      })
    const start = {
      event: 'ai_request_started',
      schemaVersion: 2,
      requestId: 'root',
      sequence: 0
    }
    const end = {
      event: 'ai_request_usage',
      schemaVersion: 2,
      requestId: 'root',
      sequence: 1
    }
    expect(await (await send([start])).json()).toEqual({
      complete: false,
      requestId: 'root',
      acknowledgedSequence: 0
    })
    expect(await (await send([end])).json()).toEqual({
      complete: true,
      requestId: 'root',
      acknowledgedSequence: 1
    })
    expect(await (await send([end])).json()).toEqual({
      complete: true,
      requestId: 'root',
      acknowledgedSequence: 1
    })
    expect((await send([start], 'https://foreign.example')).status).toBe(403)
    expect(records).toEqual([start, end])
    expect(flush).toHaveBeenCalledTimes(1)
    expect(requestModelActionBatch).not.toHaveBeenCalled()
  } finally {
    await middleware.dispose()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})
