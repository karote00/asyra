import { requestEntries } from './responses-search-fixture'
import { createPreparedDesignAction } from '../../src/ai/design-actions'
// @vitest-environment node
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import * as files from 'node:fs/promises'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import {
  createAiAgentRuntime,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import core from '../../src/contexts'
import { elementApis } from '../../src/common-apis'
import sharp from 'sharp'
import { initText } from '../../src/init/capabilities/init-text'
import factory from '@asyra/factory'
import { isRecord } from '@asyra/utils'
import { createAiRuntimeInput } from '../../src/ai/runtime-input'
import { createAiConversationController } from '../../src/ai/conversation'
import { createServerActionBatchProvider } from '../../src/ai/server-action-batch-provider'
import { registerAiAgentFeature } from '../../src/features/ai-agent'
import { createActionBatchMiddleware } from '../action-batch'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'
import { AI_APP_PROMPT } from '../ai-domain-prompt'
import { createDefaultAiModelSources } from '../ai-model-sources'
import { operationContractIssue } from '@asyra/ai-agent-runtime/schema'
import { createNativeProviderFixture } from './native-provider-fixture'

// Observe real source IO only; keep its implementation and return values unchanged.
vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>()

  return { ...original, readFile: vi.fn(original.readFile) }
})

const dom = await vi.hoisted(async () => {
  const { builtinEnvironments } = await import('vitest/environments')
  const transport = {
    fetch,
    Request,
    Response,
    Headers,
    AbortController,
    AbortSignal
  }
  const environment = await builtinEnvironments.jsdom.setup(globalThis, {})

  // DOM belongs to the simulated UI; HTTP keeps Node's matching fetch/signal realm.
  for (const [name, value] of Object.entries(transport)) {
    vi.stubGlobal(name, value)
  }

  return environment
})

beforeAll(async () => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.VECTOR,
      PresetDefaults.CONTAINERS,
      PresetDefaults.SELECTION
    ]
  })
  initText(core)
  await core.start(document.createElement('div'), { width: 640, height: 480 })
})
afterAll(async () => {
  core.destroy()
  vi.unstubAllGlobals()
  await dom.teardown(globalThis)
})

const completion = {
  type: 'message',
  id: 'completed',
  role: 'assistant',
  status: 'completed',
  content: [
    {
      type: 'output_text',
      text: JSON.stringify({
        batchId: 'completed',
        actions: [
          {
            id: 'report',
            name: 'report_outcome',
            arguments: {
              outcome: 'completed',
              message: 'Prepared objects applied.'
            },
            summary: 'Report completion'
          }
        ]
      }),
      annotations: []
    }
  ]
}

it.each([undefined, 'alter-saved-input'] as const)(
  'hands retained stage input through the real controller HTTP exchange native Host and Core into a later turn: %s',
  async (fault) => {
    core.load({
      version: '1.0.0',
      props: {},
      sceneTree: {
        workspace: 'workspace',
        workspaceList: ['workspace'],
        elements: {
          workspace: {
            id: 'workspace',
            type: 'workspace',
            name: 'Workspace',
            parentId: '',
            children: [],
            visible: true,
            lock: false
          }
        }
      }
    })
    factory.transact.reset()
    const draft = {
      type: 'group',
      name: 'Facade',
      children: [
        {
          type: 'rect',
          key: 'pane',
          name: 'Pane',
          x: 12,
          y: 17,
          width: 30,
          height: 40,
          fill: '#246080'
        }
      ]
    }
    const steps: Parameters<typeof createNativeProviderFixture>[0] = []

    let constructionIdentity: string | undefined

    const searchReply = (callId: string) => {
      const blocks = fixture.successorContent(callId)

      if (!Array.isArray(blocks)) {
        throw Error('Missing native search reply')
      }

      for (const block of blocks.filter(isRecord)) {
        if (block.type !== 'input_text' || typeof block.text !== 'string') {
          continue
        }

        const value = JSON.parse(block.text)

        if (value.contentDelivery || Array.isArray(value.tools)) {
          return value
        }
      }

      throw Error('Missing search result')
    }

    let searchContinuation = false

    const selectWorkflow = () => {
      let menu = searchReply('purpose')

      if (menu.contentDelivery) {
        const first = menu.contentDelivery
        const last = searchReply('more-candidates').contentDelivery

        expect(first.startByte).toBe(0)
        expect(last.startByte).toBe(Buffer.byteLength(first.text))
        expect(last.revision).toBe(first.revision)
        expect(last.next).toBeNull()
        const text = first.text + last.text

        expect(Buffer.byteLength(text)).toBe(last.totalBytes)
        menu = JSON.parse(text)
      }

      const candidate = menu.tools.find(
        (tool: { namespace: string; name: string }) =>
          tool.namespace === 'design_workflow' &&
          tool.name === 'prepare_and_apply_design'
      )

      expect(candidate.capability.purpose).toBeTruthy()
      const identity = candidate.namespace + '.' + candidate.name

      constructionIdentity = identity

      return {
        type: 'function_call',
        id: 'contract',
        call_id: 'contract',
        namespace: 'design_operations',
        name: 'read_design_resources',
        arguments: JSON.stringify({
          names: [constructionIdentity],
          view: 'usage',
          includeResultSchema: true,
          scopes: {
            [identity]: {
              inputScope: { operation: 'draft', nodeTypes: ['group', 'rect'] }
            }
          }
        })
      }
    }

    for (let turn = 0; turn < 2; turn++) {
      steps.push(
        ...(turn === 0
          ? [
              {
                type: 'function_call',
                id: 'purpose',
                call_id: 'purpose',
                namespace: 'design_operations',
                name: 'search_design_tools',
                arguments: JSON.stringify({
                  query: 'prepare and apply editable design',
                  inputFields: ['draft']
                })
              },
              () => {
                const first = searchReply('purpose')

                if (!first.contentDelivery) {
                  return selectWorkflow()
                }

                searchContinuation = true
                const next = first.contentDelivery.next

                steps.splice(2, 0, selectWorkflow)

                return {
                  type: 'function_call',
                  id: 'more-candidates',
                  call_id: 'more-candidates',
                  namespace: 'design_operations',
                  name: next.tool,
                  arguments: JSON.stringify(next.arguments)
                }
              }
            ]
          : []),
        () => {
          if (!constructionIdentity) {
            throw Error('No acquired construction identity')
          }

          return {
            type: 'function_call',
            id: 'stage-' + turn,
            call_id: 'stage-' + turn,
            namespace: 'design_operations',
            name: 'execute_design',
            arguments: JSON.stringify({
              operations: [
                {
                  id: 'create',
                  name: constructionIdentity,
                  arguments: {
                    inspection: 'defer',
                    draft:
                      turn === 0
                        ? draft
                        : { kind: 'named', name: 'facadeSource', path: '' }
                  }
                }
              ],
              ...(turn === 0
                ? {
                    retain: {
                      facadeSource: {
                        step: 'create',
                        source: 'input',
                        path: '/draft'
                      }
                    }
                  }
                : {}),
              delivery: 'status',
              inspection: 'defer'
            })
          }
        },
        completion
      )
    }

    const fixture = await createNativeProviderFixture(steps)
    let requests = 0
    const middleware = createActionBatchMiddleware({
      requestModelActionBatch: (input, options) => {
        requests++
        if (requests > 2) {
          throw Error('Unexpected extra provider request')
        }

        return requestConfiguredAiActionBatch(input, {
          ...options,
          environment: fixture.environment
        })
      }
    })
    const server = createServer((request, response) => {
      void middleware(request, response, () => {
        response.statusCode = 404
        response.end()
      })
    })

    await new Promise<void>((accept) => server.listen(0, '127.0.0.1', accept))
    const address = server.address()

    if (!address || typeof address === 'string') {
      throw Error('Missing App listener')
    }

    const transportErrors: string[] = []
    let corruptedTransfers = 0
    const provider = createServerActionBatchProvider({
      fetch: async (url, init) => {
        try {
          let options = init

          if (fault && typeof init?.body === 'string') {
            const receipt: unknown = JSON.parse(init.body)

            if (
              isRecord(receipt) &&
              isRecord(receipt.context) &&
              isRecord(receipt.context.values)
            ) {
              for (const value of Object.values(receipt.context.values)) {
                if (
                  isRecord(value) &&
                  value.name === 'Facade' &&
                  Array.isArray(value.children)
                ) {
                  const pane = value.children.find(
                    (child) => isRecord(child) && child.key === 'pane'
                  )

                  if (isRecord(pane)) {
                    pane.width = 99
                    corruptedTransfers++
                    options = { ...init, body: JSON.stringify(receipt) }
                  }
                }
              }
            }
          }

          return await fetch(
            new URL(url, `http://127.0.0.1:${address.port}`),
            options
          )
        } catch (error) {
          transportErrors.push(String(error))
          throw error
        }
      },

      documentScope: () => 'formal-document'
    })
    const runtime = createAiAgentRuntime(
      createAiRuntimeInput({
        provider,
        permissionRules: {
          apply_prepared_design: 'allow',
          report_outcome: 'allow'
        }
      })
    )

    const registered = registerAiAgentFeature(runtime)
    const feature = registered.api
    const controller = createAiConversationController({
      feature,

      createConversationId: () => 'formal-continuity',

      getElementType: (id) => core.getElementMetadata(id)?.type
    })

    try {
      const first = await controller.submit(
        'Create the facade and keep its source for a later stage.'
      )

      expect(
        first.outcome,
        JSON.stringify({ result: first.result, transportErrors })
      ).toBe('success')
      const firstReply = fixture.successorOutput('stage-0')

      expect(fixture.toolReply('purpose').success).toBe(true)
      expect(constructionIdentity).toBe(
        'design_workflow.prepare_and_apply_design'
      )
      const acquired = fixture.successorOutput('contract')

      expect(acquired).toContain('prepare_and_apply_design')
      expect(acquired).toContain('draft')
      expect(fixture.toolReply('contract').success).toBe(true)
      expect(firstReply).toContain('facadeSource')
      expect(firstReply).not.toContain('#246080')
      const second = await controller.submit(
        'Use the saved facade source to create another copy.'
      )

      expect(second.outcome, JSON.stringify(second.result)).toBe('success')
      const panes = [...core.deps.sceneTree.getAllElements().values()].filter(
        (element) => element.get('name') === 'Pane'
      )

      expect(panes).toHaveLength(2)

      const assertSavedInput = () => {
        for (const pane of panes) {
          expect(
            pane.getAllComputedData(),
            'Preserved saved geometry'
          ).toMatchObject({ width: 30, height: 40 })
        }
      }

      if (fault) {
        expect(corruptedTransfers).toBe(1)
        expect(assertSavedInput).toThrow(/Preserved saved geometry/)
      } else {
        expect(corruptedTransfers).toBe(0)
        assertSavedInput()
      }

      expect(requests).toBe(2)
      expect(fixture.toolCalls()).toHaveLength(searchContinuation ? 5 : 4)
      expect(
        fixture.appPackets().filter((p) => p.method === 'thread/start')
      ).toHaveLength(1)
      expect(
        fixture.appPackets().filter((p) => p.method === 'thread/resume')
      ).toHaveLength(1)
      const successor = fixture.requests.at(-2)

      expect(JSON.stringify(successor)).toContain('facadeSource')
      const nativeInput = successor?.input

      if (!Array.isArray(nativeInput)) {
        throw Error('Missing native input')
      }

      const body = nativeInput
        .filter(isRecord)
        .flatMap((item) =>
          item.role === 'user' && Array.isArray(item.content)
            ? item.content.filter(isRecord)
            : []
        )
        .findLast(
          (item) =>
            item.type === 'input_text' &&
            typeof item.text === 'string' &&
            item.text.startsWith('{"input":')
        )

      if (!body || typeof body.text !== 'string') {
        throw Error('Missing App request in native input')
      }

      const received = JSON.parse(body.text).input.metadata

      expect(received.conversationResultNames).toEqual(['facadeSource'])
      expect(received.conversationResults).toEqual([
        expect.objectContaining({
          name: 'facadeSource',
          type: 'object',
          origin: {
            operation: 'design_workflow.prepare_and_apply_design',
            step: 'create',
            source: 'input',
            path: '/draft'
          },
          paths: expect.arrayContaining([
            { path: '/children', type: 'array', length: 1 }
          ])
        })
      ])
      expect(received.conversationResults[0]).not.toHaveProperty('value')
      expect(JSON.stringify(received.conversationResults)).not.toContain(
        JSON.stringify(draft)
      )
    } finally {
      await controller.dispose()
      await runtime.dispose()
      provider.dispose?.()
      registered.dispose()
      await middleware.dispose()
      server.closeAllConnections()
      await new Promise<void>((accept) => server.close(() => accept()))
      await fixture.dispose()
    }
  },
  90000
)

for (const { fault, title } of [
  {
    fault: undefined,
    title:
      'retains portable Knowledge through the real App exchange and consumes it in the next native turn without rereading - undefined'
  },
  {
    fault: 'alter-saved-advice',
    title:
      'retains portable Knowledge through the real App exchange and consumes it in the next native turn without rereading - alter-saved-advice'
  },
  {
    fault: 'fail-canonical-child',
    title:
      'preserves the actual native partial receipt after canonical child creation fails'
  }
] as const) {
  it(
    title,
    async () => {
      core.load({
        version: '1.0.0',
        props: {},
        sceneTree: {
          workspace: 'workspace',
          workspaceList: ['workspace'],
          elements: {
            workspace: {
              id: 'workspace',
              type: 'workspace',
              name: 'Workspace',
              parentId: '',
              children: [],
              visible: true,
              lock: false
            }
          }
        }
      })
      factory.transact.reset()
      const source = readFileSync(
        new URL('../../../../domain-knowledge/colors.md', import.meta.url),
        'utf8'
      )
      const body = source.split('\n---\n')[1]

      expect(body).toContain('color')
      const reads = vi.mocked(files.readFile)

      reads.mockClear()

      const readCount = () =>
        reads.mock.calls.filter(([path]) =>
          String(path).endsWith('/domain-knowledge/colors.md')
        ).length

      const execute = (id: string, input: Record<string, unknown>) => ({
        type: 'function_call',
        id,
        call_id: id,
        namespace: 'design_operations',
        name: 'execute_design',
        arguments: JSON.stringify(input)
      })

      const final = (
        id: string,
        message: string,
        outcome: 'completed' | 'unsupported' = 'completed'
      ) => ({
        type: 'message',
        id,
        role: 'assistant',
        status: 'completed',
        content: [
          {
            type: 'output_text',
            annotations: [],
            text: JSON.stringify({
              batchId: id,
              actions: [
                {
                  id,
                  name: 'report_outcome',
                  arguments: { outcome, message },
                  summary: message
                }
              ]
            })
          }
        ]
      })

      const fixture = await createNativeProviderFixture([
        execute('save-advice', {
          operations: [
            {
              id: 'advice',
              name: 'design_knowledge.read_knowledge',
              arguments: { ids: ['colors'] }
            }
          ],
          retain: {
            colorAdvice: { step: 'advice', path: '/documents/0/text' }
          },
          delivery: 'status',
          inspection: 'defer'
        }),
        final('saved', 'Saved color advice for the next stage.'),
        execute('use-advice', {
          operations: [
            {
              id: 'create',
              name: 'prepare_and_apply_design',
              arguments: {
                inspection: 'defer',
                draft: {
                  type: 'frame',
                  name: 'Guidance sheet',
                  width: 600,
                  height: 900,
                  children: [
                    {
                      type: 'text',
                      key: 'guidance',
                      name: 'Color guidance',
                      width: 580,
                      height: 880,
                      text: { kind: 'named', name: 'colorAdvice', path: '' },
                      fontSize: 16
                    }
                  ]
                }
              }
            }
          ],
          delivery: 'status',
          inspection: 'defer'
        }),
        fault === 'fail-canonical-child'
          ? final(
              'interrupted',
              'The frame was created but its text child failed. The existing frame must not be recreated.',
              'unsupported'
            )
          : final('created', 'Created an editable color-guidance note.')
      ])
      let requests = 0
      const middleware = createActionBatchMiddleware({
        requestModelActionBatch: (input, options) => {
          requests++
          if (requests > 2) {
            throw Error('Unexpected provider request')
          }

          return requestConfiguredAiActionBatch(input, {
            ...options,
            environment: fixture.environment
          })
        }
      })
      const server = createServer((request, response) => {
        void middleware(request, response, () => {
          response.statusCode = 404
          response.end()
        })
      })

      await new Promise<void>((accept) => server.listen(0, '127.0.0.1', accept))
      const address = server.address()

      if (!address || typeof address === 'string') {
        throw Error('Missing App listener')
      }

      const transfers: unknown[] = []
      let corruptedTransfers = 0
      const provider = createServerActionBatchProvider({
        fetch: async (url, options) => {
          let transmitted = options

          if (typeof options?.body === 'string') {
            transfers.push(JSON.parse(options.body))
            if (fault === 'alter-saved-advice') {
              const receipt: unknown = JSON.parse(options.body)

              if (
                isRecord(receipt) &&
                isRecord(receipt.context) &&
                isRecord(receipt.context.values)
              ) {
                for (const [key, value] of Object.entries(
                  receipt.context.values
                )) {
                  if (value === body) {
                    receipt.context.values[key] = 'Corrupted portable advice'
                    corruptedTransfers++
                    transmitted = { ...options, body: JSON.stringify(receipt) }
                  }
                }
              }
            }
          }

          return fetch(
            new URL(url, `http://127.0.0.1:${address.port}`),
            transmitted
          )
        },

        documentScope: () => 'knowledge-continuity-document'
      })
      const runtime = createAiAgentRuntime(
        createAiRuntimeInput({
          provider,
          permissionRules: {
            apply_prepared_design: 'allow',
            report_outcome: 'allow'
          }
        })
      )
      const registered = registerAiAgentFeature(runtime)
      const controller = createAiConversationController({
        feature: registered.api,

        createConversationId: () => 'knowledge-continuity',

        getElementType: (id) => core.getElementMetadata(id)?.type
      })

      const createElements = elementApis.createElementsInParent
      const creations = vi.fn((...args: Parameters<typeof createElements>) => {
        if (
          fault === 'fail-canonical-child' &&
          args[0].some((entry) => entry.type === 'text')
        ) {
          throw Error('Injected canonical child creation failure')
        }

        return createElements(...args)
      })

      elementApis.createElementsInParent = creations

      try {
        const first = await controller.submit(
          'Read color advice and save its text for a later note.'
        )

        expect(first.outcome, JSON.stringify(first.result)).toBe('no-change')
        expect(
          fixture.toolReply('save-advice').success,
          fixture.successorOutput('save-advice')
        ).toBe(true)
        expect(readCount()).toBe(1)
        const saved = fixture.successorOutput('save-advice')

        expect(saved).toContain('colorAdvice')
        expect(saved).not.toContain(JSON.stringify(body).slice(1, -1))
        expect(core.deps.sceneTree.getAllElements().size).toBe(1)

        const second = await controller.submit(
          'Create an editable note using the saved color advice directly.'
        )

        if (fault === 'fail-canonical-child') {
          const names = [...core.deps.sceneTree.getAllElements().values()].map(
            (element) => element.get('name')
          )

          expect(names).toEqual(['Workspace', 'Guidance sheet'])
          expect(creations).toHaveBeenCalledTimes(2)
          expect(readCount()).toBe(1)
          expect(fixture.toolCalls()).toHaveLength(2)
          const reply = fixture.toolReply('use-advice')
          const output = fixture.successorOutput('use-advice')

          expect(reply.success).toBe(false)
          expect(output).toContain('"settlement":"partial"')
          expect(output).not.toContain('TOOL_INPUT_INVALID')
          expect(
            output,
            'Declared partial receipt must remain valid at the native consumer'
          ).not.toContain('TOOL_RESULT_INVALID')

          return
        }

        expect(
          fixture.toolReply('use-advice').success,
          fixture.successorOutput('use-advice')
        ).toBe(true)
        expect(second.outcome, JSON.stringify(second.result)).toBe('success')
        const notes = [...core.deps.sceneTree.getAllElements().values()].filter(
          (element) => element.get('name') === 'Color guidance'
        )

        expect(notes).toHaveLength(1)

        const assertText = () =>
          expect(
            notes[0].getAllComputedData(),
            'Preserved Knowledge body'
          ).toMatchObject({ text: body })

        if (fault === 'alter-saved-advice') {
          expect(corruptedTransfers).toBe(1)
          expect(assertText).toThrow(/Preserved Knowledge body/)
          expect(notes[0].getAllComputedData()).toMatchObject({
            text: 'Corrupted portable advice'
          })
        } else {
          expect(corruptedTransfers).toBe(0)
          assertText()
        }

        expect(readCount()).toBe(1)
        expect(requests).toBe(2)
        expect(fixture.toolCalls()).toHaveLength(2)
        expect(fixture.requests).toHaveLength(4)
        expect(
          fixture.appPackets().filter((p) => p.method === 'thread/start')
        ).toHaveLength(1)
        expect(
          fixture.appPackets().filter((p) => p.method === 'thread/resume')
        ).toHaveLength(1)
        expect(JSON.stringify(fixture.requests)).not.toContain(
          JSON.stringify(body).slice(1, -1)
        )
        const stored = transfers
          .filter(isRecord)
          .filter(
            (transfer) =>
              isRecord(transfer.context) && isRecord(transfer.context.values)
          )

        expect(stored.length).toBeGreaterThan(0)
        const values = stored.flatMap((transfer) => {
          if (
            !isRecord(transfer.context) ||
            !isRecord(transfer.context.values)
          ) {
            throw Error('Missing actual saved context values')
          }

          return Object.values(transfer.context.values)
        })

        expect(values).toEqual([
          {
            name: 'colorAdvice',
            type: 'string',
            paths: [{ path: '', type: 'string' }],
            origin: {
              operation: 'design_knowledge.read_knowledge',
              step: 'advice',
              source: 'result',
              path: '/documents/0/text'
            }
          },
          body
        ])
      } finally {
        elementApis.createElementsInParent = createElements
        await controller.dispose()
        await runtime.dispose()
        provider.dispose?.()
        registered.dispose()
        await middleware.dispose()
        server.closeAllConnections()
        await new Promise<void>((accept) => server.close(() => accept()))
        await fixture.dispose()

        reads.mockClear()
      }
    },
    90000
  )
}

for (const mode of ['success', 'restricted', 'partial']) {
  const restricted = mode === 'restricted'
  const expectedOutcome = {
    success: 'success',
    restricted: 'no-change',
    partial: 'partial'
  }[mode]

  it(
    restricted
      ? 'rejects an unavailable mutation through Responses and continues the same App conversation'
      : `uses provider declarations for correction canonical mutation and named reuse across Responses turns - ${mode}`,
    async () => {
      core.load({
        version: '1.0.0',
        props: {},
        sceneTree: {
          workspace: 'workspace',
          workspaceList: ['workspace'],
          elements: {
            workspace: {
              id: 'workspace',
              type: 'workspace',
              name: 'Workspace',
              parentId: '',
              children: [],
              visible: true,
              lock: false
            }
          }
        }
      })
      const targetId = elementApis.createElement({
        type: 'rect',
        workspacePosition: { x: 10, y: 20 },
        width: 30,
        height: 40
      })

      if (!targetId) {
        throw Error('Missing canonical Responses target')
      }

      factory.transact.reset()
      const actionName = 'api_element_updateElementProperties'
      const received: Record<string, unknown>[] = []
      const errors: unknown[] = []
      const positions: unknown[] = []
      const progress: unknown[] = []
      const sourceRequests: unknown[] = []

      const operation = (elementIds: unknown, x: number) => ({
        operations: [
          {
            id: 'move',
            name: `design_operations.${actionName}`,
            arguments: { elementIds, values: { x } }
          },
          ...(mode === 'partial'
            ? [
                {
                  id: 'partial',
                  name: 'api_element_setElementPositions',
                  arguments: {
                    positionsById: {
                      [targetId]: { x, y: 20 },
                      'missing-target': { x, y: 20 }
                    }
                  }
                }
              ]
            : [])
        ],
        ...(Array.isArray(elementIds)
          ? {
              retain: {
                selectedIds: {
                  step: 'move',
                  source: 'input',
                  path: '/elementIds'
                }
              }
            }
          : {}),
        delivery: 'status',
        inspection: 'defer'
      })

      const png = await sharp({
        create: { width: 8, height: 8, channels: 4, background: '#123456' }
      })
        .png()
        .toBuffer()
      const selectedImage = `data:image/png;base64,${png.toString('base64')}`
      const capture = vi.spyOn(core, 'captureElementSnapshot').mockReturnValue({
        type: 'snapshot',
        dataUrl: selectedImage,
        width: 8,
        height: 8,
        bounds: { x: 0, y: 0, width: 30, height: 40 }
      })
      const root = '../../tmp/responses-continuation'

      await files.mkdir(root, { recursive: true })
      const directory = await files.mkdtemp(root + '/canvas-')

      let declared:
        { name: string; parameters: Record<string, unknown> } | undefined

      const openSources = () =>
        createDefaultAiModelSources({
          continuationDatabase: directory + '/state.sqlite',

          fetch: async (_url, init) => {
            try {
              const body = JSON.parse(String(init?.body))
              const index = received.length

              expect(new Headers(init?.headers).get('authorization')).toBe(
                'Bearer fixture-secret'
              )
              expect(JSON.stringify(body)).not.toContain('fixture-secret')
              if (!body.previous_response_id) {
                expect(body.input[0].role).toBe('developer')
                expect(body.input[0].content[0].text).toContain(AI_APP_PROMPT)

                return requestEntries('design_operations.execute_design')
              } else if (index === 0) {
                expect(body.previous_response_id).toBe('load-entries')
                declared = body.input[0].tools[0].tools[0]
              } else {
                expect(body.previous_response_id).toBe(
                  'response-' + (index - 1)
                )
                expect(JSON.stringify(body.input)).not.toContain(AI_APP_PROMPT)
              }

              received.push(body)
              positions.push(core.getElementComputedData(targetId)?.x)
              if (!declared || declared.name !== 'execute_design') {
                throw Error('Missing loaded execute contract')
              }

              // Both calls use exactly the schema sent over the provider boundary.
              let base = operation(
                { kind: 'named', name: 'selectedIds', path: '' },
                33
              )

              if (index === 0) {
                base = operation(targetId, 21)
              } else if (index === 1) {
                base = operation([targetId], 21)
              }

              const args =
                index === 3 && mode === 'success'
                  ? {
                      ...base,
                      operations: [
                        ...base.operations,
                        {
                          id: 'unselected',
                          name: 'inspect_drawing',
                          arguments: { arguments: { elementId: targetId } }
                        },
                        {
                          id: 'selected',
                          name: 'inspect_drawing',
                          arguments: { arguments: { elementId: targetId } }
                        }
                      ],
                      delivery: {
                        fields: { image: { step: 'selected', path: '' } }
                      }
                    }
                  : base

              expect(
                operationContractIssue({ workflow: args }, declared.parameters)
              ).toBeUndefined()
              const invoke = index < 2 || index === 3

              return Response.json({
                id: `response-${index}`,
                status: 'completed',
                output: invoke
                  ? [
                      {
                        type: 'function_call',
                        namespace: 'design_operations',
                        name: declared.name,
                        call_id: `move-${index}`,
                        arguments: JSON.stringify({ workflow: args })
                      }
                    ]
                  : [completion]
              })
            } catch (error) {
              errors.push(error)
              throw error
            }
          }
        })

      let sources = openSources()
      const middleware = createActionBatchMiddleware({
        sources,

        requestModelActionBatch: (input, options) => {
          sourceRequests.push(structuredClone(input))

          return requestConfiguredAiActionBatch(input, {
            ...options,
            sources,

            onProgress: (event) => {
              progress.push(event)
              options.onProgress?.(event)
            },

            environment: {
              AI_PROVIDER_BACKEND: 'openai-responses',
              AI_PROVIDER_MODEL: 'fixture-model',
              OPENAI_API_KEY: 'fixture-secret',
              AI_EXECUTION_SOURCE_REVISION: 'fixture'
            }
          })
        }
      })
      const app = createServer((request, response) => {
        void middleware(request, response, () => {
          response.statusCode = 404
          response.end()
        })
      })

      await new Promise<void>((accept) => app.listen(0, '127.0.0.1', accept))
      const address = app.address()

      if (!address || typeof address === 'string') {
        throw Error('Missing App listener')
      }

      const provider = createServerActionBatchProvider({
        fetch: (url, init) =>
          fetch(new URL(url, `http://127.0.0.1:${address.port}`), init),

        documentScope: () => 'responses-document'
      })
      const input = createAiRuntimeInput({
        provider,
        permissionRules: {
          [actionName]: 'allow',
          api_element_setElementPositions: 'allow',
          inspect_drawing: 'allow',
          report_outcome: 'allow'
        }
      })
      const runtime = createAiAgentRuntime({
        ...input,
        actionDefinitions: restricted
          ? input.actionDefinitions.filter(
              (action) => action.name === 'report_outcome'
            )
          : input.actionDefinitions
      })
      const registration = registerAiAgentFeature(runtime)
      const controller = createAiConversationController({
        feature: registration.api,

        createConversationId: () => 'responses-canonical-conversation',

        getElementType: (id) => core.getElementMetadata(id)?.type
      })

      try {
        const first = await controller.submit(
          'Move the existing object to local x 21.'
        )

        expect(errors).toEqual([])
        expect(first.outcome, JSON.stringify(first.result)).toBe(
          expectedOutcome
        )
        expect(core.getElementComputedData(targetId)?.x).toBe(
          restricted ? 10 : 21
        )
        await Promise.all(sources.map((source) => source.dispose?.()))
        sources = openSources()
        const second = await controller.submit(
          'Reuse the saved targets and move to local x 33.'
        )

        expect(errors).toEqual([])
        expect(second.outcome, JSON.stringify(second.result)).toBe(
          expectedOutcome
        )
        expect(core.getElementComputedData(targetId)?.x).toBe(
          restricted ? 10 : 33
        )
        expect(received).toHaveLength(5)
        expect(positions).toEqual(
          restricted ? [10, 10, 10, 10, 10] : [10, 10, 21, 21, 33]
        )
        const serializedFirst = JSON.stringify(received[1].input)

        expect(serializedFirst).toContain('not-started')
        if (!restricted) {
          expect(JSON.stringify(received[2].input)).toContain('selectedIds')
          expect(JSON.stringify(received[4].input)).toContain(
            mode === 'partial' ? 'partial' : 'completed'
          )
        }

        // The stored response owns the earlier call and its exact correlated result.
        expect(received[3].previous_response_id).toBe('response-2')
        expect(JSON.stringify(received[3].input)).not.toContain('move-1')
        expect(sourceRequests).toHaveLength(2)
        expect(sourceRequests[1]).toHaveProperty(
          'metadata.conversationContext.turns.0.outcome',
          expectedOutcome
        )
        for (const [callId, responseIndex] of Object.entries({
          'move-0': 1,
          'move-1': 2,
          'move-3': 4
        })) {
          const terminal = progress.filter(
            (event) =>
              isRecord(event) &&
              event.status === 'completed' &&
              isRecord(event.activity) &&
              event.activity.callId === callId
          )

          expect(terminal).toHaveLength(1)
          // Retention selects recipe execution, whose failed partial member stops
          // the sequence. The later resolved batch reports partial delivery.
          // Status is independent of settlement; preserve each owner's exact pair.
          let completedStatus = 'success'

          if (mode === 'partial') {
            completedStatus = callId === 'move-1' ? 'failed' : 'partial'
          }

          const expected =
            callId === 'move-0' || restricted
              ? { status: 'failed', settlement: 'not-started' }
              : {
                  status: completedStatus,
                  settlement: mode === 'partial' ? 'partial' : 'completed'
                }

          expect(terminal[0]).toMatchObject({ activity: { outcome: expected } })
          const continuation = received[responseIndex].input

          if (!Array.isArray(continuation)) {
            throw Error('Missing provider input')
          }

          const reply = continuation.find(
            (entry) =>
              entry.type === 'function_call_output' && entry.call_id === callId
          )
          const outcome = reply.output.find(
            (entry: { type: string; text?: string }) =>
              entry.type === 'input_text' && entry.text?.includes('toolOutcome')
          )

          expect(JSON.parse(outcome.text)).toMatchObject({
            toolOutcome: expected
          })
        }

        expect(core.getCanonicalElementCount()).toBe(1)
        if (mode === 'success') {
          expect(capture).toHaveBeenCalledTimes(2)
          const last = received[4].input

          if (!Array.isArray(last)) {
            throw Error('Missing actual provider continuation')
          }

          const output = last.find(
            (entry) =>
              isRecord(entry) &&
              entry.type === 'function_call_output' &&
              entry.call_id === 'move-3'
          )

          expect(
            output.output.filter(
              (entry: { type: string }) => entry.type === 'input_image'
            )
          ).toEqual([{ type: 'input_image', image_url: selectedImage }])
        }
      } finally {
        capture.mockRestore()
        await controller.dispose()
        await runtime.dispose()
        provider.dispose?.()
        registration.dispose()
        await middleware.dispose()
        await Promise.all(sources.map((source) => source.dispose?.()))
        await files.rm(directory, { recursive: true, force: true })
        app.closeAllConnections()
        await new Promise<void>((accept) => app.close(() => accept()))
      }
    },
    30000
  )
}

it('delivers one public result selector to the actual native successor', async () => {
  const fixture = await createNativeProviderFixture([
    {
      type: 'function_call',
      id: 'read-current-application',
      call_id: 'read-current-application',
      namespace: 'design_operations',
      name: 'read_design_resources',
      arguments: JSON.stringify({
        names: ['apply_prepared_design'],
        view: 'usage'
      })
    }
  ])
  const action = createAiToolContract(createPreparedDesignAction())

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [action],
        context: {},
        attempt: 1,
        intent: 'Read the application contract without editing.'
      },
      {
        environment: fixture.environment,
        signal: AbortSignal.timeout(45000),

        executeBatch: async () => {
          throw Error('Contract discovery must not write')
        }
      }
    )
    const received = fixture.successorOutput('read-current-application')
    const values: unknown[] = received
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
    const result = values
      .filter(isRecord)
      .find((value) => Array.isArray(value.apis))

    expect(result, received).toBeDefined()
    expect(received).not.toContain('"response"')
    expect(received).not.toContain('"includeTargets"')
    expect(received).toContain('artifactId')
    expect(received).toContain('hostContract')
    expect(fixture.toolReply('read-current-application').success).toBe(true)
  } finally {
    await fixture.dispose()
  }
}, 60000)

it('delivers actual nested selection coordinates and parent identity in the initial native context', async () => {
  const { createAiContextProvider } = await import('../../src/ai/context')

  core.load({
    version: '1.0.0',
    props: {},
    sceneTree: {
      workspace: 'coordinate-workspace',
      workspaceList: ['coordinate-workspace'],
      elements: {
        'coordinate-workspace': {
          id: 'coordinate-workspace',
          type: 'workspace',
          name: 'Workspace',
          parentId: '',
          children: [],
          visible: true,
          lock: false
        }
      }
    }
  })
  core.createElementInParent(
    {
      id: 'coordinate-parent',
      type: 'group',
      x: 100,
      y: 200,
      rotation: Math.PI / 2
    },
    'coordinate-workspace'
  )
  core.createElementInParent(
    {
      id: 'coordinate-child',
      type: 'rect',
      x: 11,
      y: 13,
      width: 30,
      height: 40
    },
    'coordinate-parent'
  )
  core.selectElements(['coordinate-child'])
  const context = await createAiContextProvider().getContext({
    intent: 'Inspect selection',
    signal: new AbortController().signal
  })

  expect(context.selectedElements).toEqual([
    expect.objectContaining({
      id: 'coordinate-child',
      parentId: 'coordinate-parent',
      coordinateSpace: 'parent-local',
      bounds: { x: 11, y: 13, width: 30, height: 40 }
    })
  ])
  const fixture = await createNativeProviderFixture([])

  try {
    await requestConfiguredAiActionBatch(
      { actions: [], context, attempt: 1, intent: 'Inspect selection' },
      { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
    )
    const input = fixture.requests[0].input

    if (!Array.isArray(input)) {
      throw Error('Missing native input')
    }

    const message = input
      .filter(isRecord)
      .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
      .find(
        (item) =>
          isRecord(item) &&
          typeof item.text === 'string' &&
          item.text.includes('"protocolVersion":1')
      )

    if (!isRecord(message) || typeof message.text !== 'string') {
      throw Error('Missing serialized App input')
    }

    const payload: unknown = JSON.parse(message.text)

    expect(payload).toMatchObject({ input: { context }, protocolVersion: 1 })
    expect(fixture.toolCalls()).toHaveLength(0)
  } finally {
    await fixture.dispose()
    core.selectElements([])
    factory.transact.reset()
  }
}, 60000)

it('applies the recorded Dome drawing through the published execute_design entry without discovery', async () => {
  const { default: dome } = await import('./fixtures/dome-responses.json')
  const { createConversationResults } = await import('@asyra/ai-agent-runtime')
  const ledger = createConversationResults(() => 1)
  const saved = ledger.open('dome')
  const before = new Set(core.deps.sceneTree.getAllElements().keys())
  const png = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#123456' }
  })
    .png()
    .toBuffer()
  const capture = vi.spyOn(core, 'captureElementSnapshot').mockReturnValue({
    type: 'snapshot',
    dataUrl: 'data:image/png;base64,' + png.toString('base64'),
    width: 8,
    height: 8,
    bounds: { x: 0, y: 0, width: 25229, height: 10680 }
  })
  const requests: { input: { output: { text: string }[] }[] }[] = []
  const sources = createDefaultAiModelSources({
    continuationDatabase: ':memory:',

    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body))

      requests.push(body)

      return Response.json({
        id: 'dome-' + requests.length,
        status: 'completed',
        output:
          requests.length === 1
            ? [
                {
                  type: 'function_call',
                  namespace: 'design_operations',
                  name: 'execute_design',
                  call_id: 'draw',
                  arguments: JSON.stringify({ workflow: dome.drawing })
                }
              ]
            : [completion]
      })
    }
  })
  const provider = {
    requestActionBatch: (
      input: Parameters<typeof requestConfiguredAiActionBatch>[0],
      opts: Parameters<typeof requestConfiguredAiActionBatch>[1]
    ) =>
      requestConfiguredAiActionBatch(input, {
        ...opts,
        sources,

        resultContext: async (command) => saved.exchange(command),

        environment: {
          AI_PROVIDER_BACKEND: 'openai-responses',
          AI_PROVIDER_MODEL: 'fixture',
          OPENAI_API_KEY: 'fixture',
          AI_EXECUTION_SOURCE_REVISION: 'fixture'
        }
      })
  }
  const input = createAiRuntimeInput({
    provider,
    permissionRules: {
      apply_prepared_design: 'allow',
      inspect_drawing: 'allow',
      report_outcome: 'allow'
    }
  })
  const runtime = createAiAgentRuntime(input)
  const registration = registerAiAgentFeature(runtime)
  const controller = createAiConversationController({
    feature: registration.api,

    createConversationId: () => 'dome',

    getElementType: (id) => core.getElementMetadata(id)?.type
  })

  try {
    const answer = await controller.submit('Draw the entire Taipei Dome.')

    expect(answer.outcome, JSON.stringify(answer.result).slice(-2400)).toBe(
      'success'
    )
    expect(requests).toHaveLength(2)
    expect(JSON.parse(requests[1].input[0].output[0].text)).toMatchObject({
      toolOutcome: { status: 'success' },
      saved: [{ name: 'domeDraft' }, { name: 'domeIDs' }]
    })
    const created = [...core.deps.sceneTree.getAllElements()]
      .filter(([id]) => !before.has(id))
      .map(([, e]) => e.get('type'))

    expect(created.filter((t) => t === 'vector')).toHaveLength(411)
    expect(created.filter((t) => t === 'group')).toHaveLength(1)
  } finally {
    capture.mockRestore()
    await controller.dispose()
    await runtime.dispose()
    registration.dispose()
    await Promise.all(sources.map((s) => s.dispose?.()))
    ledger.clear()
  }
}, 30000)

it.each(['known', 'purpose', 'method', 'latest'])(
  'edits color and position through the real Host using %s discovery',
  async (lookup) => {
    const { fillApis } = await import('../../src/common-apis')

    core.load({
      version: '1.0.0',
      props: {},
      sceneTree: {
        workspace: 'workspace',
        workspaceList: ['workspace'],
        elements: {
          workspace: {
            id: 'workspace',
            type: 'workspace',
            name: 'Workspace',
            parentId: '',
            children: [],
            visible: true,
            lock: false
          }
        }
      }
    })
    const target = elementApis.createElement({
      type: 'rect',
      workspacePosition: { x: 10, y: 20 },
      width: 40,
      height: 40
    })

    if (!target) {
      throw Error('Missing test rectangle')
    }

    fillApis.updatePrimaryFillColor(target, '#FF0000')
    expect(fillApis.getPrimaryFillColor(target)).toBe('#FF0000')
    const bodies: string[] = []
    const declarations: string[] = []
    const receipts: unknown[] = []
    let parameters: Record<string, unknown> | undefined
    const queries = [
      lookup === 'method'
        ? { query: 'updatePrimaryFillColors' }
        : { query: 'set solid fill color for element by id', category: 'fill' },
      { query: 'move element to absolute position x y' }
    ]

    if (lookup === 'latest') {
      queries[0] = { query: 'set solid fill color element', category: 'fill' }
      queries[1] = { query: 'set absolute position element x y' }
    }

    const searchBytes: number[] = []
    let turn = 1
    const sources = createDefaultAiModelSources({
      continuationDatabase: ':memory:',

      fetch: async (_, init) => {
        const raw = String(init?.body)
        const body = JSON.parse(raw)
        const previous = bodies.length

        bodies.push(raw)
        if (previous) {
          expect(body.previous_response_id).toBe('r' + previous)
        }

        const groups = [
          ...body.tools,
          ...body.input.flatMap((i: { type?: string; tools?: unknown[] }) =>
            i.type === 'tool_search_output' ? (i.tools ?? []) : []
          )
        ]

        for (const group of groups) {
          for (const tool of group.tools ?? []) {
            declarations.push(group.name + '.' + tool.name)
            if (tool.name === 'execute_design') {
              parameters = tool.parameters
            }
          }
        }

        let output

        const reply =
          body.input[0].type === 'function_call_output'
            ? JSON.parse(body.input[0].output[0].text)
            : undefined

        if (reply && !reply.apis) {
          receipts.push(JSON.parse(body.input[0].output[0].text))
          output = [completion]
        } else if (!parameters) {
          output = [
            {
              type: 'tool_search_call',
              execution: 'client',
              status: 'completed',
              call_id: 'load',
              arguments: {
                names: [
                  ...(lookup === 'known'
                    ? []
                    : ['design_operations.search_design_tools']),
                  'design_operations.execute_design'
                ]
              }
            }
          ]
        } else if (lookup !== 'known' && !reply) {
          output = [
            {
              type: 'function_call',
              namespace: 'design_operations',
              name: 'search_design_tools',
              call_id: 'lookup' + turn,
              arguments: JSON.stringify(queries[turn - 1])
            }
          ]
        } else {
          const operation =
            turn === 1
              ? {
                  name: 'api_fill_updatePrimaryFillColors',
                  arguments: {
                    updates: [{ elementId: target, color: '#0000FF' }]
                  }
                }
              : {
                  name: 'api_element_setElementPositions',
                  arguments: { positionsById: { [target]: { x: 33, y: 45 } } }
                }

          if (reply) {
            const candidate = reply.apis[0]
            const bytes = Buffer.byteLength(JSON.stringify(reply))
            const fillBaseline = lookup === 'method' ? 13401 : 2320
            const baseline = turn === 2 ? 14191 : fillBaseline

            searchBytes.push(bytes)
            expect(candidate.name).toBe(operation.name)
            expect(candidate.operationParameters).toBeDefined()
            expect(candidate.operationParameters).not.toHaveProperty(
              'x-design-discovery'
            )
            expect(
              operationContractIssue(
                operation.arguments,
                candidate.operationParameters
              )
            ).toBeUndefined()
            expect(
              operationContractIssue({}, candidate.operationParameters)
            ).toBeTruthy()
            expect(candidate.execution.tool).toBe('execute_design')
            expect(bytes).toBeLessThan(baseline)
            if (lookup === 'method' && turn === 1) {
              expect(reply.count).toBe(1)
            }

            for (const other of [...reply.apis.slice(1), ...reply.tools]) {
              expect(other.capability.purpose).toBeTruthy()
              expect(other.operationParameters).toBeUndefined()
              expect(other.usage).toBeUndefined()
            }

            operation.name = candidate.name
          }

          const args = {
            operations: [operation],
            inspection: 'defer',
            delivery: 'status'
          }

          expect(
            operationContractIssue({ workflow: args }, parameters)
          ).toBeUndefined()
          output = [
            {
              type: 'function_call',
              namespace: 'design_operations',
              name: 'execute_design',
              call_id: 'edit' + turn,
              arguments: JSON.stringify({ workflow: args })
            }
          ]
        }

        return Response.json({
          id: 'r' + bodies.length,
          status: 'completed',
          output
        })
      }
    })
    const runtime = createAiAgentRuntime(
      createAiRuntimeInput({
        permissionRules: {
          release_design_context: 'allow',
          inspect_drawing: 'allow',
          api_fill_updatePrimaryFillColors: 'allow',
          api_element_setElementPositions: 'allow',
          report_outcome: 'allow'
        },
        provider: {
          requestActionBatch: (request, options) =>
            requestConfiguredAiActionBatch(request, {
              ...options,
              sources,
              environment: {
                OPENAI_API_KEY: 'fixture',
                AI_PROVIDER_MODEL: 'fixture',
                AI_PROVIDER_BACKEND: 'openai-responses',
                AI_EXECUTION_SOURCE_REVISION: 'fixture'
              }
            })
        }
      })
    )

    const ask = (intent: string) =>
      runtime.run({
        intent,
        signal: new AbortController().signal,
        metadata: { conversationId: 'color-move', turnId: 'turn' + turn }
      })

    try {
      await ask('Change the red square to blue.')
      expect(fillApis.getPrimaryFillColor(target)).toBe('#0000FF')
      const firstTurn = bodies.length

      turn++
      await ask('Move the same square to (33, 45).')
      expect(core.getElementComputedData(target)).toMatchObject({
        x: 33,
        y: 45
      })
      expect(fillApis.getPrimaryFillColor(target)).toBe('#0000FF')
      expect(receipts).toHaveLength(2)
      for (const receipt of receipts) {
        expect(receipt, JSON.stringify(receipt)).toMatchObject({
          toolOutcome: { status: 'success', settlement: 'completed' }
        })
      }

      const sizes = bodies.map((raw) => Buffer.byteLength(raw))

      process.stdout.write(
        JSON.stringify({
          measurement: 'color-move',
          lookup,
          searchBytes,
          sizes,
          total: sizes.reduce((a, b) => a + b, 0),
          firstTurn,
          secondTurn: bodies.length - firstTurn
        }) + '\n'
      )
      const index = JSON.parse(bodies[0])
        .input[0].content[0].text.split('\n')
        .filter((line: string) => /^design_(operations|knowledge)\./.test(line))

      expect(index.map((line: string) => line.split(' - ')[0]).sort()).toEqual([
        'design_knowledge.discover_knowledge',
        'design_knowledge.read_knowledge',
        'design_operations.execute_design',
        'design_operations.read_design_resources',
        'design_operations.search_design_tools'
      ])
      expect(declarations.sort()).toEqual(
        lookup === 'known'
          ? ['design_operations.execute_design']
          : [
              'design_operations.execute_design',
              'design_operations.search_design_tools'
            ]
      )
      expect(JSON.parse(bodies[0]).tools).toEqual([
        expect.objectContaining({ type: 'tool_search', execution: 'client' })
      ])
      expect(JSON.parse(bodies[1]).input[0]).toMatchObject({
        type: 'tool_search_output',
        status: 'completed',
        execution: 'client',
        call_id: 'load'
      })
      expect(firstTurn).toBe(lookup === 'known' ? 3 : 4)
      expect(bodies.length - firstTurn).toBe(lookup === 'known' ? 2 : 3)
    } finally {
      await runtime.dispose()
      await Promise.all(sources.map((source) => source.dispose?.()))
    }
  },
  30000
)
