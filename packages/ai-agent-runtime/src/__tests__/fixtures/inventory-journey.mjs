import { createConversationResults } from '@asyra/ai-agent-runtime'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { TextEncoder } from 'node:util'
import { ReadableStream } from 'node:stream/web'
const { AbortController, Response } = globalThis

import {
  createAiAgentRuntime,
  createAiActionRegistry,
  AiProviderError,
  AiToolInputError,
  createExchangeAiProvider,
  createAiKnowledgeAccess,
  resultDelivery,
  readNamedFields,
  resolveNamedResultInputs,
  readCapabilityMetadata,
  matchCapabilityFields,
  createAiToolScheduler
} from '@asyra/ai-agent-runtime'
import {
  createBatchExchange,
  createAiToolHostLibrary,
  createKnowledgeFileLoader,
  parseKnowledgeFile
} from '@asyra/ai-agent-runtime/node'
import {
  invokeAiToolOwner,
  operationContractIssue,
  nativeToolInputSchema,
  projectToolDelivery,
  createAiToolLeases
} from '@asyra/ai-agent-runtime/schema'

const object = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false
})

const text = { type: 'string', minLength: 1 }
const allocation = object({
  sku: text,
  quantity: { type: 'integer', minimum: 1 }
})
const reservation = object({
  id: text,
  unitCost: { type: 'number', 'x-model-visibility': 'internal' }
})
const image = object({
  dataUrl: text,
  width: { type: 'number' },
  height: { type: 'number' }
})
const receiptSchema = object({
  id: text,
  images: { type: 'array', items: image, minItems: 2 }
})
const success = { status: 'success', settlement: 'completed' }

const step = (name, path) => ({ kind: 'step', step: name, path })

/** Domain state/model script are fixtures; every orchestration and transport owner is production. */
export async function inventoryJourney({
  fault,
  failurePolicy,
  fatal = false,
  delivery = 'status',
  retain = true,
  fieldwise = false
} = {}) {
  const evidence = {
    requests: [],
    contracts: [],
    calls: [],
    receipts: [],
    saves: 0,
    reads: 0,
    canonical: [],
    images: [],
    replies: [],
    writes: 0,
    loaderReads: 0,
    knowledgeReads: 0,
    settles: [],
    permissions: 0,
    completed: []
  }
  const state = new Map()
  let scope = 'warehouse-one'
  let turn = 0
  let sequence = 0
  let activeTransaction = false
  let scriptError
  const controller = new AbortController()
  const exchange = createBatchExchange()
  const entries = new Map()
  const store = {
    read: async (key) => entries.get(key),

    list: async () => [...entries.values()],

    write: async ({ key, expectedVersion, record }) => {
      if (entries.get(key)?.version !== expectedVersion) {
        throw Error('Storage conflict')
      }

      const value = { key, record, version: String(++sequence) }

      entries.set(key, value)

      return value
    }
  }
  const registry = createAiActionRegistry()
  const definitions = [
    {
      name: 'a',
      description: 'Read stock and prepare an allocation quantity.',
      inputSchema: object({ sku: text }),
      outputSchema: object({ allocation }),
      effect: 'read',

      execute: async ({ sku }) => ({ allocation: { sku, quantity: 2 } })
    },
    {
      name: 'b',
      description:
        'Reserve inventory for the requested quantity. Does not issue receipt images.',
      inputSchema: allocation,
      outputSchema: reservation,
      effect: 'mutation',

      execute: async (input) => {
        if (!activeTransaction) {
          throw Error('Write outside App transaction')
        }

        evidence.writes++
        state.set('reservation-one', { ...input })

        return fault === 'missing-id'
          ? { unitCost: 3 }
          : {
              id: 'reservation-one',
              unitCost: fault === 'invalid-result' ? 'wrong' : 3
            }
      }
    },
    {
      name: 'c',
      description: 'Create receipt images for an existing reservation.',
      inputSchema: object({ id: text, unitCost: { type: 'number' } }),
      outputSchema: receiptSchema,
      effect: 'read',

      execute: async ({ id }) => {
        if (fatal) {
          throw Error('Receipt service disconnected')
        }

        const images = [1, 2].map((n) => ({
          dataUrl: `data:image/png;base64,${n === 1 ? 'AQID' : 'BAUG'}`,
          width: 1,
          height: 1
        }))

        return {
          id,
          images: fault === 'missing-image' ? images.slice(0, 1) : images
        }
      }
    },
    {
      name: 'e',
      description: 'Summarize the current reservation state.',
      inputSchema: object({}),
      outputSchema: object({ count: { type: 'number' } }),
      effect: 'read',

      execute: async () => ({ count: state.size })
    },
    {
      name: 'd',
      description: 'Look up a reserved allocation by its stable identity.',
      inputSchema: object({ id: text }),
      outputSchema: object({ quantity: { type: 'number' } }),
      effect: 'read',

      execute: async ({ id }) => ({ quantity: state.get(id)?.quantity ?? 0 })
    }
  ].map((definition) => ({
    ...definition,
    revision: 1,
    resources: ['inventory'],
    composition: 'allowed',
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' },

    execute: async (input) => {
      evidence.canonical.push({ name: definition.name, input })
      const issue = operationContractIssue(input, definition.inputSchema)

      if (issue) {
        throw Error(issue)
      }

      return definition.execute(input)
    }
  }))

  definitions.forEach((definition) => registry.register(definition))

  const fetch = async (_url, init) => {
    const token = init.headers?.['x-receipt']

    if (token) {
      const receipt = JSON.parse(init.body)

      evidence.receipts.push(receipt)

      return new Response('', {
        status: exchange.accept(token, receipt) ? 200 : 409
      })
    }

    const request = JSON.parse(init.body)

    evidence.requests.push(request)
    const currentTurn = ++turn
    let wire
    const response = new Response(
      new ReadableStream({
        start(value) {
          wire = value
        }
      }),
      { headers: { 'content-type': 'application/x-ndjson' } }
    )

    const send = (frame) =>
      wire.enqueue(new TextEncoder().encode(JSON.stringify(frame) + '\n'))

    const runBatch = (batch) => exchange.execute(batch, init.signal, send)

    const results = async (command) => {
      if ('save' in command) {
        evidence.saves++
      } else {
        evidence.reads++
      }

      const receipt = await exchange.execute(
        { batchId: `context-${++sequence}`, actions: [] },
        init.signal,
        (frame) =>
          send({
            type: 'conversation-results',
            receiptToken: frame.receiptToken,
            command
          })
      )

      if (!receipt.context.ok) {
        throw Error(receipt.context.error)
      }

      return receipt.context.values
    }

    const schedule = createAiToolScheduler(init.signal)
    const leases = createAiToolLeases({
      requestId: `request-${currentTurn}`,
      capacity: 20
    })

    const execute = async (call, definition) =>
      schedule(undefined, async () => {
        evidence.calls.push({ name: definition.name, input: call.input })
        const result = await invokeAiToolOwner({
          definition,
          input: call.input,
          signal: init.signal,

          execute: () =>
            runBatch({
              batchId: `batch-${++sequence}`,
              actions: [
                {
                  id: `action-${sequence}`,
                  name: definition.name,
                  arguments: call.input,
                  summary: definition.description
                }
              ]
            }),

          inspectOwner(receipt) {
            if (receipt.failure) {
              throw Error(receipt.failure.message)
            }

            return { value: receipt.actionResults[0].result, outcome: success }
          }
        })

        return { ...result.outcome, value: result.value }
      })

    const host = createAiToolHostLibrary({
      requestId: `request-${currentTurn}`,
      saveInvocationName: 'library.save',
      registry,
      store,
      capacity: 20,
      receiptCapacity: 8,
      limits: {
        steps: 10,
        bytes: 20000,
        bindings: 80,
        bindingDepth: 20,
        issues: 10
      },
      validate: operationContractIssue,
      execute,
      leases,

      check: async () => ({ ok: true, scope: 'Inventory fixture contract' })
    })

    Promise.resolve()
      .then(async () => {
        const pinned = definitions.map((definition) => ({
          ...createAiToolContract(definition),
          inputSchema: nativeToolInputSchema(definition.inputSchema)
        }))

        if (fault === 'wrong-revision') {
          pinned[1].revision++
        }

        evidence.contracts.push(pinned)
        if (currentTurn === 1) {
          const candidates = pinned.map((definition) => ({
            name: definition.name,
            fields: matchCapabilityFields(readCapabilityMetadata(definition), [
              'quantity'
            ])
          }))

          evidence.candidates = candidates
          try {
            await execute(
              { input: { sku: 'nuts', quantity: 0 } },
              registry.get('b')
            )
            throw Error('Invalid quantity was dispatched')
          } catch (error) {
            if (!(error instanceof AiToolInputError)) {
              throw error
            }

            evidence.corrected = true
          }

          const loader = createKnowledgeFileLoader(
            async () => {
              evidence.loaderReads++

              return [
                {
                  id: 'stock-policy',
                  revision: 1,
                  markdown:
                    '---\n{"description":"Reserve stock","provenance":["Warehouse manual"]}\n---\nReserve two units.'
                }
              ]
            },
            () => {
              const contents = new Map()
              const access = createAiKnowledgeAccess({
                tenantId: 'warehouse',
                scopeId: scope,

                authorize: () => true,

                read: async (metadata) => {
                  evidence.knowledgeReads++

                  return contents.get(metadata.id)
                }
              })

              return {
                install(file) {
                  const parsed = parseKnowledgeFile(file)

                  access.register(parsed.metadata, 'admin')
                  contents.set(file.id, {
                    revision: file.revision,
                    text: parsed.text
                  })
                },

                access,

                dispose: () => access.dispose()
              }
            }
          )
          const [knowledge, same] = await Promise.all([
            loader.open(),
            loader.open()
          ])

          if (knowledge !== same) {
            throw Error('Duplicate catalog owner')
          }

          const session = knowledge.access.openSession('reader', 'stock-task', {
            retainResults: true
          })

          evidence.knowledge = await session.retrieve(
            { ids: session.discover().map((item) => item.id) },
            init.signal
          )
          evidence.knowledgeRedisplay = await session.retrieve(
            {
              ids: ['stock-policy'],
              fromResult: evidence.knowledge.contextKey
            },
            init.signal
          )
          loader.dispose()
          const proposal = {
            format: 1,
            name: 'reserve-with-receipt',
            revision: 1,
            description: 'Reserve stock then create receipt.',
            inputSchema: object({ sku: text }),
            outputSchema: receiptSchema,
            steps: [
              {
                id: 'stock',
                tool: 'a',
                revision: 1,
                input: { kind: 'input', path: '' }
              },
              {
                id: 'reserve',
                tool: 'b',
                revision: 1,
                input: fieldwise
                  ? {
                      kind: 'object',
                      fields: {
                        sku: step('stock', '/allocation/sku'),
                        quantity: step('stock', '/allocation/quantity')
                      }
                    }
                  : step('stock', '/allocation')
              },
              {
                id: 'receipt',
                tool: 'c',
                revision: 1,
                input: step('reserve', '')
              }
            ],
            output: step('receipt', '')
          }
          const admitted = host.admitInline(proposal)

          if (!admitted.ok) {
            throw Error(JSON.stringify(admitted))
          }

          const resultDeliveryOwner = resultDelivery(
            {
              ...(retain
                ? {
                    retain: {
                      reservation: { step: 'reserve', path: '' },
                      receiptImages: { step: 'receipt', path: '/images' }
                    }
                  }
                : {}),
              delivery:
                delivery === 'selected'
                  ? {
                      fields: { pictures: { step: 'receipt', path: '/images' } }
                    }
                  : delivery
            },
            results,
            (images) => evidence.images.push(...images),
            (value) =>
              value.images?.map((image, index) => ({
                path: `/images/${index}`,
                actionName: 'c',
                image
              })) ?? []
          )
          const run = await host.runInline(
            admitted.value,
            {
              requestId: `request-${currentTurn}`,
              callId: 'compound',
              input: { sku: 'nuts' },
              signal: init.signal
            },
            async (node, input, value, receipt) => {
              const contract = registry.get(node.tool)
              const view = projectToolDelivery(contract, value, receipt)

              await resultDeliveryOwner.capture(
                node.id,
                view.value,
                new Set(),
                receipt,
                undefined,
                contract.name
              )
            }
          )

          evidence.execution = run.execution
          if (run.execution.status !== 'success') {
            throw Error(run.execution.issues.join('; '))
          }

          evidence.replies.push(
            resultDeliveryOwner.finish(
              success,
              ['stock', 'reserve', 'receipt'],
              []
            )
          )
          evidence.completed.push('reserve')
        } else {
          const input = await resolveNamedResultInputs(
            { id: { kind: 'named', name: 'reservation', path: '/id' } },
            new Map(),
            results
          )
          const followup = await execute({ input }, registry.get('d'))

          evidence.replies.push(followup)
          evidence.replies.push(
            await readNamedFields(
              {
                delivery: {
                  fields: { pictures: { name: 'receiptImages', path: '' } }
                }
              },
              results,
              (images) => evidence.images.push(...images)
            )
          )
          if (fault !== 'omitted-case') {
            evidence.completed.push('reuse')
          }
        }

        await host.dispose()
        await leases.dispose()
        send({
          type: 'result',
          batch: {
            batchId: `summary-${currentTurn}`,
            actions: [
              {
                id: `summary-${currentTurn}`,
                name: 'e',
                arguments: {},
                summary: 'Summarize reservations'
              }
            ]
          }
        })
        wire.close()
      })
      .catch(async (error) => {
        scriptError = error
        await host.dispose()
        await leases.dispose()
        wire.error(error)
      })

    return response
  }

  const appResults = createConversationResults(() => scope)
  const provider = createExchangeAiProvider({
    endpoint: 'https://inventory.test/ai',
    fetch,
    receiptHeader: 'x-receipt',
    executionHeader: 'x-execute',
    errorHeader: 'x-error',
    maximumReceiptBytes: 1024 * 1024,
    maximumFrameBytes: 1024 * 1024,

    results: {
      open(id) {
        const context = appResults.open(id)

        return {
          ...context,

          exchange: async (command) => context.exchange(command)
        }
      }
    },

    releaseResults: () => appResults.clear(),

    backendFailure: () =>
      new AiProviderError({
        code: 'AI_PROVIDER_TRANSPORT_FAILED',
        message: 'Inventory transport failed'
      }),

    contextInputFailureCode: 'INPUT_INVALID',
    contextExecutionFailureCode: 'EXECUTION_FAILED',

    describeBatchFailure: (error, batchId, executionMs) => ({
      code: 'BROWSER_BATCH_EXECUTION_FAILED',
      batchId,
      message: error.message,
      actionName: null,
      handlerMs: null,
      executionMs
    })
  })
  const runtime = createAiAgentRuntime({
    provider,
    actionDefinitions: definitions,
    contextProvider: {
      getContext: async () => ({ reservations: [...state.keys()] })
    },
    permissionPolicy: {
      evaluate: () => {
        evidence.permissions++

        return 'allow'
      }
    },
    confirmationHandler: { confirm: async () => true },
    options: {
      ...(failurePolicy ? { failurePolicy } : {}),
      retryPolicy: { maxAttempts: 1 }
    },
    transactionRunner: {
      run: async (_label, work) => {
        const before = new Map(state)

        activeTransaction = true
        try {
          const result = await work()

          evidence.settles.push('completed')

          return result
        } catch (error) {
          state.clear()
          before.forEach((value, key) => state.set(key, value))
          evidence.settles.push('rolled-back')
          throw error
        } finally {
          activeTransaction = false
        }
      }
    }
  })
  const outcomes = []

  try {
    outcomes.push(
      await runtime.run({
        intent: 'Reserve stock and issue receipts',
        metadata: { conversationId: 'stock-session' },
        signal: controller.signal
      })
    )
    if (!scriptError && retain) {
      outcomes.push(
        await runtime.run({
          intent: 'Check the existing reservation and display its receipt',
          metadata: { conversationId: 'stock-session' },
          signal: controller.signal
        })
      )
    }

    if (fault === 'wrong-settlement') {
      evidence.settles = ['rolled-back']
    }

    return { evidence, outcomes, state: [...state], scriptError }
  } finally {
    await runtime.dispose()
  }
}
