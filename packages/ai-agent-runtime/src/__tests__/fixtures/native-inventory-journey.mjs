const { Response, AbortController } = globalThis

import { ReadableStream } from 'node:stream/web'
import { TextEncoder } from 'node:util'
import {
  createAiAgentRuntime,
  createAiActionRegistry,
  createExchangeAiProvider,
  createConversationResults,
  createAiKnowledgeAccess,
  AiToolInputError,
  AiProviderError,
  resultDelivery,
  resolveNamedResultInputs,
  readNamedFields
} from '@asyra/ai-agent-runtime'
import {
  createNativeAiProvider,
  createBatchExchange,
  createAiToolHostLibrary
} from '@asyra/ai-agent-runtime/node'
import {
  invokeAiToolOwner,
  operationContractIssue,
  nativeToolInputSchema,
  createAiToolLeases,
  projectToolDelivery
} from '@asyra/ai-agent-runtime/schema'
import { nativeSessionFixture, nativeMessage } from './native-session.mjs'

const object = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false
})

const text = { type: 'string' }
const allocation = object({
  sku: text,
  quantity: { type: 'integer', minimum: 1 }
})
const reservation = object({
  id: text,
  unitCost: { type: 'number', 'x-model-visibility': 'internal' }
})
const pixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGP4z8AARAwQCgAf7gP9i18U1AAAAABJRU5ErkJggg=='
const receipt = object({
  id: text,
  images: {
    type: 'array',
    items: object({
      dataUrl: text,
      width: { type: 'integer' },
      height: { type: 'integer' }
    }),
    minItems: 2
  }
})
const success = { status: 'success', settlement: 'completed' }

const call = (id, name, args) => ({
  type: 'function_call',
  id,
  call_id: id,
  namespace: 'inventory',
  name,
  arguments: JSON.stringify(args)
})

const summary = (n) => ({
  batchId: 'summary-' + n,
  actions: [
    {
      id: 'summary-' + n,
      name: 'summary',
      arguments: {},
      summary: 'Report current inventory'
    }
  ]
})

/** Model script and domain are fixtures; provider, exchange, host and runtime are real public owners. */
export async function nativeInventoryJourney(fault) {
  const fixture = await nativeSessionFixture([
    call('catalog', 'search', {}),
    call('policy', 'knowledge', {}),
    call('bad', 'reserve', { sku: 'nuts', quantity: 0 }),
    call('good', 'reserve', { sku: 'nuts', quantity: 2 }),
    nativeMessage(JSON.stringify(summary(1))),
    call('again', 'reuse', {}),
    nativeMessage(JSON.stringify(summary(2)))
  ])
  const state = new Map()
  const evidence = {
    writes: 0,
    reads: 0,
    captures: 0,
    knowledge: 0,
    settled: [],
    bindings: [],
    decoded: [],
    contracts: [],
    arguments: []
  }
  let transaction = false
  let turn = 0
  let sequence = 0
  const definitions = [
    {
      name: 'a',
      inputSchema: allocation,
      outputSchema: object({ allocation }),
      effect: 'read',

      execute: async (input) => ({ allocation: input })
    },
    {
      name: 'b',
      inputSchema: allocation,
      outputSchema: reservation,
      effect: 'mutation',

      execute: async (input) => {
        if (!transaction) {
          throw Error('Missing transaction')
        }

        evidence.writes++
        state.set('reservation-one', input.quantity)

        return { id: 'reservation-one', unitCost: 3 }
      }
    },
    {
      name: 'c',
      inputSchema: object({ id: text, unitCost: { type: 'number' } }),
      outputSchema: receipt,
      effect: 'read',

      execute: async (input) => {
        evidence.arguments.push(input)
        evidence.captures++

        return {
          id: input.id,
          images: [
            { dataUrl: pixel, width: 2, height: 2 },
            { dataUrl: pixel, width: 2, height: 2 }
          ]
        }
      }
    },
    {
      name: 'd',
      inputSchema: object({ id: text }),
      outputSchema: object({ quantity: { type: 'number' } }),
      effect: 'read',

      execute: async ({ id }) => {
        evidence.reads++

        return { quantity: state.get(id) }
      }
    },
    {
      name: 'summary',
      inputSchema: object({}),
      outputSchema: object({ count: { type: 'number' } }),
      effect: 'read',

      execute: async () => ({ count: state.size })
    }
  ].map((d) => ({
    ...d,
    revision: 1,
    description: 'Inventory ' + d.name,
    resources: ['inventory'],
    composition: 'allowed',
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' }
  }))
  const registry = createAiActionRegistry()

  definitions.forEach((d) => registry.register(d))
  const store = {
    list: async () => [],

    read: async () => undefined,

    write: async () => {
      throw Error('No tool persistence requested')
    }
  }
  const exchange = createBatchExchange()
  const appResults = createConversationResults(() => 'warehouse')
  let contextExchange
  let images = []
  let serviceError
  const native = createNativeAiProvider({
    ...fixture.nativeOptions,

    async prepare(input, options) {
      const current = ++turn

      evidence.bindings.push(current)
      const leases = createAiToolLeases({
        requestId: 'request-' + current,
        capacity: 20
      })

      const execute = async (call, definition) => {
        const result = await invokeAiToolOwner({
          definition,
          input: call.input,
          signal: options.signal,

          execute: async () =>
            options.executeBatch({
              batchId: 'batch-' + ++sequence,
              actions: [
                {
                  id: 'action-' + sequence,
                  name: definition.name,
                  arguments: call.input,
                  summary: definition.description
                }
              ]
            }),

          inspectOwner(value) {
            if (value.failure) {
              throw Error(value.failure.message)
            }

            return { value: value.actionResults[0].result, outcome: success }
          }
        })

        return { ...result.outcome, value: result.value }
      }

      const host = createAiToolHostLibrary({
        requestId: 'request-' + current,
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

        check: async () => ({ ok: true, scope: 'Inventory' })
      })
      const knowledge = createAiKnowledgeAccess({
        tenantId: 'warehouse',
        scopeId: 'one',

        authorize: () => true,

        read: async () => {
          evidence.knowledge++

          return { revision: 1, text: 'Reserve two units.' }
        }
      })

      knowledge.register(
        {
          id: 'policy',
          revision: 1,
          description: 'Inventory policy',
          provenance: ['Warehouse manual']
        },
        'admin'
      )
      const knowledgeSession = knowledge.openSession('reader', 'order', {
        retainResults: true
      })
      const declarations = [
        { name: 'search', inputSchema: object({}) },
        { name: 'knowledge', inputSchema: object({}) },
        { name: 'reserve', inputSchema: allocation },
        { name: 'reuse', inputSchema: object({}) }
      ].map((d) => ({
        type: 'function',
        ...d,
        description: 'Inventory ' + d.name,
        inputSchema: nativeToolInputSchema(d.inputSchema)
      }))

      evidence.contracts.push(declarations)

      const reply = (value, selected = []) => ({
        success: true,
        contentItems: [
          { type: 'inputText', text: JSON.stringify(value) },
          ...selected.map((item) => ({
            type: 'inputImage',
            imageUrl: item.image.dataUrl
          }))
        ]
      })

      return {
        thread: {
          modelProvider: 'offline',
          environments: [],
          runtimeWorkspaceRoots: [],
          selectedCapabilityRoots: [],
          approvalPolicy: 'never',
          sandbox: 'read-only',
          baseInstructions: 'Use the supplied inventory tools.',
          developerInstructions: 'Return a JSON batch at completion.',
          dynamicTools: [
            {
              type: 'namespace',
              name: 'inventory',
              description: 'Inventory',
              tools: declarations
            }
          ]
        },
        turn: { environments: [] },

        input: (resumed) => [
          {
            type: 'text',
            text: JSON.stringify({
              intent: input.intent,
              context: input.context,
              resumed
            }),
            text_elements: []
          }
        ],

        async invoke(call) {
          if (call.namespace !== 'inventory') {
            throw Error('Unexpected namespace')
          }

          if (call.name === 'search') {
            return reply(
              definitions.map((d) => ({
                name: d.name,
                description: d.description,
                inputSchema: d.inputSchema,
                outputSchema: d.outputSchema,
                effect: d.effect,
                revision:
                  fault === 'wrong-revision' && d.name === 'b' ? 9 : d.revision
              }))
            )
          }

          if (call.name === 'knowledge') {
            return reply(
              await knowledgeSession.retrieve(
                { ids: ['policy'] },
                options.signal
              )
            )
          }

          if (call.name === 'reuse') {
            const args = await resolveNamedResultInputs(
              { id: { kind: 'named', name: 'reservation', path: '/id' } },
              new Map(),
              contextExchange
            )
            const value = await execute({ input: args }, registry.get('d'))

            images = []
            const saved = await readNamedFields(
              {
                delivery: {
                  fields: { pictures: { name: 'pictures', path: '' } }
                }
              },
              contextExchange,
              (list) => images.push(...list)
            )

            return reply({ current: value.value, saved }, images)
          }

          if (call.name !== 'reserve') {
            throw Error('Unexpected tool')
          }

          try {
            const issue = operationContractIssue(call.arguments, allocation)

            if (issue) {
              throw new AiToolInputError(issue)
            }

            const proposal = {
              format: 1,
              name: 'reserve-receipt',
              revision: 1,
              description: 'Reserve and issue receipt',
              inputSchema: allocation,
              outputSchema: receipt,
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
                  input: { kind: 'step', step: 'stock', path: '/allocation' }
                },
                {
                  id: 'receipt',
                  tool: 'c',
                  revision: 1,
                  input: { kind: 'step', step: 'reserve', path: '' }
                }
              ],
              output: { kind: 'step', step: 'receipt', path: '' }
            }
            const admitted = host.admitInline(proposal)

            if (!admitted.ok) {
              throw Error(JSON.stringify(admitted))
            }

            images = []
            const delivery = resultDelivery(
              {
                retain: {
                  reservation: { step: 'reserve', path: '' },
                  pictures: { step: 'receipt', path: '/images' }
                },
                delivery: {
                  fields: { pictures: { step: 'receipt', path: '/images' } }
                }
              },
              contextExchange,
              (list) => images.push(...list),
              (v) =>
                v.images?.map((image, i) => ({
                  path: '/images/' + i,
                  actionName: 'c',
                  image
                })) ?? []
            )
            const run = await host.runInline(
              admitted.value,
              {
                requestId: 'request-' + current,
                callId: call.callId,
                input: call.arguments,
                signal: options.signal
              },
              async (node, _args, value, outcome) => {
                const contract = registry.get(node.tool)
                const projected = projectToolDelivery(contract, value, outcome)

                await delivery.capture(
                  node.id,
                  projected.value,
                  new Set(),
                  outcome,
                  undefined,
                  contract.name
                )
              }
            )

            if (run.execution.status !== 'success') {
              throw Error(run.execution.issues.join('; '))
            }

            return reply(
              delivery.finish(success, ['stock', 'reserve', 'receipt'], []),
              fault === 'missing-image' ? images.slice(0, 1) : images
            )
          } catch (error) {
            if (!(error instanceof AiToolInputError)) {
              throw error
            }

            return {
              success: false,
              contentItems: [
                {
                  type: 'inputText',
                  text: JSON.stringify({
                    status: 'failed',
                    settlement: 'not-started',
                    message: error.message
                  })
                }
              ]
            }
          }
        },

        decode(result) {
          evidence.decoded.push(result)

          return JSON.parse(result.messages.at(-1).text)
        },

        async dispose() {
          knowledge.dispose()
          await host.dispose()
          await leases.dispose()
        }
      }
    }
  })

  const fetch = async (_url, init) => {
    if (init.headers?.['x-receipt']) {
      return new Response('', {
        status: exchange.accept(
          init.headers['x-receipt'],
          JSON.parse(init.body)
        )
          ? 200
          : 409
      })
    }

    let output
    const response = new Response(
      new ReadableStream({
        start(controller) {
          output = controller
        }
      }),
      { headers: { 'content-type': 'application/x-ndjson' } }
    )

    const send = (frame) =>
      output.enqueue(new TextEncoder().encode(JSON.stringify(frame) + '\n'))

    contextExchange = async (command) => {
      const receipt = await exchange.execute(
        { batchId: 'context-' + ++sequence, actions: [] },
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

    native
      .requestActionBatch(JSON.parse(init.body), {
        signal: init.signal,

        executeBatch: (batch) => exchange.execute(batch, init.signal, send)
      })
      .then((batch) => {
        send({ type: 'result', batch })
        output.close()
      })
      .catch((error) => {
        serviceError = error
        output.error(error)
      })

    return response
  }

  const provider = createExchangeAiProvider({
    endpoint: 'https://inventory.test/ai',
    fetch,
    results: appResults,
    receiptHeader: 'x-receipt',
    executionHeader: 'x-execute',
    errorHeader: 'x-error',
    maximumReceiptBytes: 1024 * 1024,
    maximumFrameBytes: 1024 * 1024,
    contextInputFailureCode: 'INPUT_INVALID',
    contextExecutionFailureCode: 'EXECUTION_FAILED',

    backendFailure: () =>
      new AiProviderError({
        code: 'AI_PROVIDER_TRANSPORT_FAILED',
        message: 'Inventory failed'
      }),

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
      getContext: async () => ({ reservationCount: state.size })
    },
    permissionPolicy: { evaluate: () => 'allow' },
    confirmationHandler: { confirm: async () => true },
    options: { retryPolicy: { maxAttempts: 1 } },
    transactionRunner: {
      run: async (_label, work) => {
        const before = new Map(state)

        transaction = true
        try {
          const result = await work()

          if (fault === 'wrong-settlement') {
            state.clear()
            before.forEach((v, k) => state.set(k, v))
            evidence.settled.push('rolled-back')
          } else {
            evidence.settled.push('completed')
          }

          return result
        } catch (error) {
          state.clear()
          before.forEach((v, k) => state.set(k, v))
          evidence.settled.push('rolled-back')
          throw error
        } finally {
          transaction = false
        }
      }
    }
  })
  const outcomes = []

  try {
    outcomes.push(
      await runtime.run({
        intent: 'Reserve two units and issue images',
        metadata: { conversationId: 'order-one' },
        signal: new AbortController().signal
      })
    )
    evidence.afterFirst = [...state]
    // App-owned change between requests must be observed through the newly bound executor.
    state.set('reservation-one', 5)
    outcomes.push(
      await runtime.run({
        intent: 'Read saved reservation and images',
        metadata: { conversationId: 'order-one' },
        signal: new AbortController().signal
      })
    )

    return { evidence, outcomes, requests: fixture.requests, serviceError }
  } finally {
    await runtime.dispose()
    await native.dispose()
    await fixture.dispose()
  }
}
