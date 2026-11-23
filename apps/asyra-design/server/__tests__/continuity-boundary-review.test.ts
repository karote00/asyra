// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { createDesignAttachmentAction } from '../../src/ai/inspection'
import { createConversationResults } from '@asyra/ai-agent-runtime'
import { createLocalToolHost } from '../local-tool-host'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { toolSemantics } from '../../src/ai/tool-contract'

const knowledgeFixture = (body = 'Portable advice text') => {
  const context = createConversationResults(() => 'document').open('knowledge')
  const load = vi.fn(async () => [
    {
      id: 'review.advice',
      revision: 1,
      markdown:
        '---\n' +
        JSON.stringify({
          description: 'Reusable advice',
          provenance: ['Authored test advice']
        }) +
        '\n---\n' +
        body
    }
  ])
  const calls: string[] = []

  const create = (requestId: string) => {
    const owner = createLocalKnowledgeTools(requestId, load)
    const host = createLocalToolHost({
      requestId,
      signal: new AbortController().signal,
      capacity: 32,
      receiptCapacity: 8,
      artifactCapacity: 64,
      limits: LocalToolLibraryLimits.recipe,

      resultContext: async (command) => context.exchange(command),

      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('No writes')
        }
      },

      createGroups: (ownership) => [
        {
          name: 'knowledge',
          description: 'Knowledge owner',
          owner: {
            ...owner,

            call: async (...args) => {
              calls.push(args[0])

              return owner.call(...args)
            }
          }
        },
        {
          name: 'preparation',
          description: 'Preparation owner',
          owner: createLocalDesignTools(
            [
              {
                name: 'apply_prepared_design',
                description: 'Apply',
                inputSchema: {}
              }
            ],
            createDesignPreparationSession(undefined, undefined, ownership)
          )
        },
        {
          name: 'consumer',
          description: 'Portable advice consumer',
          owner: {
            definitions: [
              {
                name: 'use',
                description: 'Use advice',
                inputSchema: {
                  type: 'object',
                  properties: { text: { type: 'string' } },
                  required: ['text'],
                  additionalProperties: false
                },
                ...toolSemantics(
                  {
                    type: 'object',
                    properties: { text: { type: 'string' } },
                    required: ['text']
                  },
                  'read',
                  []
                ),
                composition: 'allowed' as const
              }
            ],

            call: async (_name, input) => {
              calls.push('use')

              return JSON.stringify(input)
            }
          }
        }
      ]
    })

    return {
      host,

      dispose: async () => {
        await host.dispose()
        owner.dispose()
      }
    }
  }

  return { context, load, calls, create }
}

it.each([true, false])(
  'keeps paged Knowledge continuations request-owned for named and final retention (%s)',
  async (named) => {
    const f = knowledgeFixture('Complete advice. '.repeat(2400))
    const first = f.create('page-owner')
    let continuation: Record<string, unknown>

    try {
      const read = await first.host.invoke({
        name: 'knowledge.read_knowledge',
        input: { ids: ['review.advice'] }
      })

      continuation = JSON.parse(read.text).contentDelivery.next.arguments
      const continued = await first.host.invoke({
        name: 'knowledge.read_knowledge',
        input: continuation
      })

      expect(continued.outcome.status, continued.text).toBe('success')
      const save = await first.host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'page',
              name: 'knowledge.read_knowledge',
              arguments: { ids: ['review.advice'] }
            }
          ],
          retain: {
            continuation: {
              ...(named ? { step: 'page' } : {}),
              path: '/contentDelivery/next'
            }
          },
          delivery: 'status'
        }
      })

      expect(save.outcome.status, save.text).not.toBe('success')
      expect(f.context.names()).toEqual([])
      expect(f.load).toHaveBeenCalledOnce()
    } finally {
      await first.dispose()
    }

    const second = f.create('next-page-owner')

    try {
      const expired = await second.host.invoke({
        name: 'knowledge.read_knowledge',
        input: continuation
      })

      expect(expired.outcome).toMatchObject({
        status: 'failed',
        settlement: 'not-started'
      })
    } finally {
      await second.dispose()
    }
  }
)

it.each(['result', 'input'])(
  'keeps discovery receipt keys out of cross-turn storage (%s)',
  async (source) => {
    const context = createConversationResults(() => 'document').open(
      'discovery'
    )

    const make = (requestId: string) => {
      const actions = [
        {
          name: 'apply_prepared_design',
          description: 'Apply',
          inputSchema: { type: 'object' }
        }
      ]

      const host: ReturnType<typeof createLocalToolHost> = createLocalToolHost({
        requestId,
        signal: new AbortController().signal,
        store: {
          read: async () => undefined,

          list: async () => [],

          write: async () => {
            throw Error('No storage writes')
          }
        },
        capacity: 32,
        receiptCapacity: 8,
        artifactCapacity: 64,
        limits: LocalToolLibraryLimits.recipe,

        resultContext: async (command) => context.exchange(command),

        createGroups: () => {
          const designs = createLocalDesignTools(actions)
          const operations = createLocalOperationTools(
            actions,
            designs,
            async () => {
              throw Error('No canvas writes')
            },
            { getNativeTools: () => host?.definitions() ?? [] }
          )

          return [
            {
              name: 'design_preparation',
              description: 'Prepare',
              owner: designs
            },
            {
              name: 'design_operations',
              description: 'Operations',
              owner: operations
            }
          ]
        }
      })

      return host
    }

    const first = make('discovery-owner')
    const names = ['design_operations.search_design_tools']
    let resultKey: string
    let definitions: unknown

    try {
      const read = await first.invoke({
        name: 'design_operations.read_design_resources',
        input: { names, view: 'full' }
      })

      expect(read.outcome.status, read.text).toBe('success')
      resultKey = JSON.parse(read.text).resultKey
      definitions = JSON.parse(read.text).tools
      expect(resultKey).toEqual(expect.any(String))
      const reused = await first.invoke({
        name: 'design_operations.read_design_resources',
        input: { names, fromResult: resultKey }
      })

      expect(reused.outcome.status, reused.text).toBe('success')
      const reply = await first.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'read',
              name: 'design_operations.read_design_resources',
              arguments: { names, fromResult: resultKey }
            }
          ],
          retain: {
            key: {
              step: 'read',
              ...(source === 'input'
                ? { source: 'input', path: '/fromResult' }
                : { path: '/resultKey' })
            }
          },
          delivery: 'status'
        }
      })

      expect(reply.outcome.status, reply.text).not.toBe('success')
      expect(context.names()).toEqual([])
      const portable = await first.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'contracts',
              name: 'design_operations.read_design_resources',
              arguments: { names, view: 'full' }
            }
          ],
          retain: { contracts: { step: 'contracts', path: '/tools' } },
          delivery: 'status'
        }
      })

      expect(portable.outcome.status, portable.text).toBe('success')
    } finally {
      await first.dispose()
    }

    const next = make('next-discovery-owner')

    try {
      expect(
        context.exchange({
          read: { contracts: { name: 'contracts', path: '' } }
        })
      ).toEqual({ contracts: definitions })
      const expired = await next.invoke({
        name: 'design_operations.read_design_resources',
        input: { names, fromResult: resultKey }
      })

      expect(expired.outcome).toMatchObject({
        status: 'failed',
        settlement: 'not-started'
      })
    } finally {
      await next.dispose()
    }
  }
)

it.each([true, false])(
  'preserves portable Knowledge through named/final retention and a successor request (named %s)',
  async (named) => {
    const f = knowledgeFixture()
    const first = f.create('first')

    try {
      const direct = await first.host.invoke({
        name: 'knowledge.read_knowledge',
        input: { ids: ['review.advice'] }
      })

      expect(direct.outcome.status, direct.text).toBe('success')
      const value = JSON.parse(direct.text)
      const redisplay = await first.host.invoke({
        name: 'knowledge.read_knowledge',
        input: { ids: ['review.advice'], fromResult: value.contextKey }
      })

      expect(JSON.parse(redisplay.text).documents).toEqual(value.documents)
      const result = await first.host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'advice',
              name: 'knowledge.read_knowledge',
              arguments: { ids: ['review.advice'] }
            }
          ],
          retain: {
            advice: { ...(named ? { step: 'advice' } : {}), path: '/documents' }
          },
          delivery: 'status'
        }
      })

      expect(result.outcome.status, result.text).toBe('success')
      expect(
        f.context.exchange({ read: { advice: { name: 'advice', path: '' } } })
      ).toEqual({ advice: value.documents })
      expect(result.text).not.toContain('Portable advice text')
      expect(f.load).toHaveBeenCalledTimes(1)
    } finally {
      await first.dispose()
    }

    const second = f.create('second')

    try {
      const count = f.calls.filter((name) => name === 'read_knowledge').length
      const used = await second.host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'use',
              name: 'consumer.use',
              arguments: {
                text: { kind: 'named', name: 'advice', path: '/0/text' }
              }
            }
          ]
        }
      })

      expect(used.outcome.status, used.text).toBe('success')
      expect(used.text).toContain('Portable advice text')
      expect(f.calls.filter((name) => name === 'read_knowledge')).toHaveLength(
        count
      )
      expect(f.load).toHaveBeenCalledTimes(1)
    } finally {
      await second.dispose()
    }
  }
)

it.each([true, false])(
  'never saves Knowledge session identities or retained references (named %s)',
  async (named) => {
    const f = knowledgeFixture()
    const request = f.create('knowledge-lifetime')

    try {
      const first = await request.host.invoke({
        name: 'knowledge.read_knowledge',
        input: { ids: ['review.advice'] }
      })
      const key = JSON.parse(first.text).contextKey

      for (const path of ['/contextKey', '/documents']) {
        const result = await request.host.invoke({
          name: 'design_operations.execute_design',
          input: {
            operations: [
              {
                id: 'advice',
                name: 'knowledge.read_knowledge',
                arguments: { ids: ['review.advice'], reuseFrom: [key] }
              }
            ],
            retain: {
              forbidden: { ...(named ? { step: 'advice' } : {}), path }
            },
            delivery: 'status'
          }
        })

        expect(result.outcome.status, result.text).not.toBe('success')
        expect(f.context.names()).not.toContain('forbidden')
      }
    } finally {
      await request.dispose()
    }
  }
)

it.each([true, false])(
  'rejects a missing actual Knowledge selection without saving or replaying (named %s)',
  async (named) => {
    const f = knowledgeFixture()
    const request = f.create('missing-selection')

    try {
      const result = await request.host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'advice',
              name: 'knowledge.read_knowledge',
              arguments: { ids: ['review.advice'] }
            }
          ],
          retain: {
            missing: { ...(named ? { step: 'advice' } : {}), path: '/missing' }
          },
          delivery: 'status'
        }
      })

      expect(result.outcome).toMatchObject({
        status: 'partial',
        settlement: 'completed'
      })
      expect(f.context.names()).toEqual([])
      expect(f.calls).toEqual(['read_knowledge'])
    } finally {
      await request.dispose()
    }
  }
)

it.each([true, false])(
  'keeps portable preparation metadata when its optional repair handle is absent (named %s)',
  async (named) => {
    const f = knowledgeFixture()
    const request = f.create('source-metadata')

    try {
      const result = await request.host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'prepared',
              name: 'preparation.prepare_design',
              arguments: {
                draft: {
                  type: 'frame',
                  name: 'Frame',
                  width: 100,
                  height: 100,
                  children: []
                }
              }
            }
          ],
          retain: {
            source: {
              ...(named ? { step: 'prepared' } : {}),
              path: '/preparationInput'
            }
          },
          delivery: 'status'
        }
      })

      expect(result.outcome.status, result.text).toBe('success')
      expect(
        f.context.exchange({ read: { source: { name: 'source', path: '' } } })
      ).toEqual({ source: { kind: 'source' } })
    } finally {
      await request.dispose()
    }
  }
)

it.each([true, false])(
  'rejects retained preparation repair handles through the public owner (named %s)',
  async (named) => {
    const f = knowledgeFixture()
    const request = f.create('repair-lifetime')

    try {
      const rejected = await request.host.invoke({
        name: 'preparation.prepare_design',
        input: {
          draft: {
            type: 'frame',
            name: 'Frame',
            width: 100,
            height: 100,
            children: [0, 1].map(() => ({
              key: 'duplicate',
              type: 'rect',
              name: 'Rect',
              width: 10,
              height: 10
            }))
          }
        }
      })

      expect(JSON.parse(rejected.text).draftId).toBeTypeOf('string')
      const repaired = await request.host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'repair',
              name: 'preparation.prepare_design',
              arguments: {
                repair: {
                  draftId: JSON.parse(rejected.text).draftId,
                  replacements: [{ path: '/children/1/key', value: 'distinct' }]
                }
              }
            }
          ],
          retain: {
            forbidden: {
              ...(named ? { step: 'repair' } : {}),
              path: '/preparationInput'
            }
          },
          delivery: 'status'
        }
      })

      expect(repaired.outcome.status, repaired.text).not.toBe('success')
      expect(f.context.names()).not.toContain('forbidden')
    } finally {
      await request.dispose()
    }
  }
)

it.each(
  [0, 7].flatMap((revision) =>
    [true, false].map((named) => ({ revision, named }))
  )
)(
  'retains portable attachment basis independently of equal stamp values (%j)',
  async ({ revision, named }) => {
    const context = createConversationResults(() => 'document').open(
      'basis-review'
    )
    const basis = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ]
    const action = createDesignAttachmentAction({} as never)
    const host = createLocalToolHost({
      requestId: 'attachment-retention-review',
      signal: new AbortController().signal,
      capacity: 32,
      receiptCapacity: 8,
      artifactCapacity: 64,
      limits: LocalToolLibraryLimits.recipe,

      resultContext: async (command) => context.exchange(command),

      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('No library writes')
        }
      },

      createGroups: () => [
        {
          name: 'fixture',
          description: 'Actual attachment result contract',
          owner: {
            definitions: [{ ...action, type: 'function' }],

            call: async () =>
              JSON.stringify({
                available: true,
                workspaceId: 'workspace',
                parentId: 'workspace',
                bounds: null,
                basis,
                evidence: { sessionId: 'request-session', revision }
              })
          }
        }
      ]
    })

    try {
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'attachment',
              name: 'fixture.read_design_attachment',
              arguments: {}
            }
          ],
          retain: {
            basis: { ...(named ? { step: 'attachment' } : {}), path: '/basis' }
          },
          delivery: 'status'
        }
      })

      expect(reply.outcome.status, reply.text).toBe('success')
      expect(
        context.exchange({ read: { basis: { name: 'basis', path: '' } } })
      ).toEqual({ basis })
    } finally {
      await host.dispose()
    }
  }
)

it.each([true, false])(
  'retains projected portable paths and consumes them in a successor host (named %s)',
  async (named) => {
    const { toolSemantics } = await import('../../src/ai/tool-contract')
    const app = createConversationResults(() => 'document')
    const context = app.open('projected')

    const object = (properties: Record<string, unknown>) => ({
      type: 'object',
      properties,
      required: Object.keys(properties),
      additionalProperties: false
    })

    const portable = object({ 'point/x': { type: 'number' } })
    const publicSchema = object({
      data: portable,
      stamp: { type: 'number', 'x-runtime-value': 'request' }
    })
    const outputSchema = object({ view: publicSchema })
    const calls: string[] = []

    const create = (requestId: string) =>
      createLocalToolHost({
        requestId,
        signal: new AbortController().signal,
        capacity: 32,
        receiptCapacity: 8,
        artifactCapacity: 64,
        limits: LocalToolLibraryLimits.recipe,

        resultContext: async (command) =>
          app.open('projected').exchange(command),

        store: {
          read: async () => undefined,

          list: async () => [],

          write: async () => {
            throw Error('No writes')
          }
        },

        createGroups: () => [
          {
            name: 'fixture',
            description: 'Projected storage handoff',
            owner: {
              definitions: [
                {
                  name: 'produce',
                  description: 'Produce portable data and a request stamp',
                  inputSchema: object({
                    data: portable,
                    stamp: { type: 'number' }
                  }),
                  ...toolSemantics(outputSchema, 'read', []),
                  composition: 'allowed',
                  delivery: { path: '/view', outputSchema: publicSchema }
                },
                {
                  name: 'consume',
                  description: 'Consume the saved value',
                  inputSchema: portable,
                  ...toolSemantics(portable, 'read', []),
                  composition: 'allowed'
                }
              ],

              invocationSchemas: (name, _args, stage) =>
                name === 'produce'
                  ? {
                      inputSchema: publicSchema,
                      outputSchema:
                        stage === 'model' ? publicSchema : outputSchema
                    }
                  : undefined,

              call: async (name, args) => {
                calls.push(name)

                return JSON.stringify(
                  name === 'produce'
                    ? { view: { data: { 'point/x': 0 }, stamp: 0 } }
                    : args
                )
              }
            }
          }
        ]
      })

    const host = create('producer')

    try {
      const selected = named ? { step: 'source' } : {}
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'source',
              name: 'fixture.produce',
              arguments: { data: { 'point/x': 0 }, stamp: 0 }
            }
          ],
          retain: {
            coordinate: { ...selected, path: '/data' },
            forbidden: { ...selected, path: '/stamp' }
          },
          delivery: 'status'
        }
      })

      // Named selections reject the entire invalid proposal before effects. Final
      // selections are validated against the completed public result's contract.
      expect(reply.outcome.status).not.toBe('success')
      expect(context.names()).not.toContain('forbidden')
      if (named) {
        expect(calls).toEqual([])
      }

      const forbiddenInput = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'source',
              name: 'fixture.produce',
              arguments: { data: { 'point/x': 0 }, stamp: 0 }
            }
          ],
          retain: {
            forbiddenInput: { step: 'source', source: 'input', path: '/stamp' }
          },
          delivery: 'status'
        }
      })

      expect(forbiddenInput.outcome.status).not.toBe('success')
      expect(context.names()).not.toContain('forbiddenInput')

      const saved = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'source',
              name: 'fixture.produce',
              arguments: { data: { 'point/x': 0 }, stamp: 0 }
            }
          ],
          retain: {
            coordinate: { ...selected, path: '/data' },
            authored: { step: 'source', source: 'input', path: '/data' }
          },
          delivery: 'status'
        }
      })

      expect(saved.outcome.status, saved.text).toBe('success')
      expect(JSON.stringify(JSON.parse(saved.text).saved)).not.toContain(
        '"point/x":0'
      )
    } finally {
      await host.dispose()
    }

    const before = calls.length
    const successor = create('consumer')

    try {
      const reply = await successor.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'next',
              name: 'fixture.consume',
              arguments: { kind: 'named', name: 'coordinate', path: '' }
            }
          ],
          delivery: { fields: { value: { step: 'next', path: '/point~1x' } } }
        }
      })

      expect(reply.outcome.status, reply.text).toBe('success')
      expect(JSON.parse(reply.text).fields).toEqual({ value: 0 })
      expect(calls.slice(before)).toEqual(['consume'])
    } finally {
      await successor.dispose()
    }
  }
)

it.each(
  ['whole', 'fields', 'array'].flatMap((form) =>
    [12, 100001].map((x) => ({ form, x }))
  )
)(
  'validates actual numeric handoffs before consuming them: %j',
  async ({ form, x }) => {
    const { toolSemantics } = await import('../../src/ai/tool-contract')

    const object = (properties: Record<string, unknown>) => ({
      type: 'object',
      properties,
      required: Object.keys(properties),
      additionalProperties: false
    })

    const point = object({ x: { type: 'number' }, y: { type: 'number' } })
    const bounded = object({
      x: { type: 'number', maximum: 100000 },
      y: { type: 'number', maximum: 100000 }
    })
    const array = form === 'array'
    const sourceSchema = array ? { type: 'array', items: point } : point
    const targetSchema = array ? { type: 'array', items: bounded } : bounded
    const value = array ? [{ x, y: 0 }] : { x, y: 0 }
    const calls: string[] = []
    const inputs: unknown[] = []
    const host = createLocalToolHost({
      requestId: 'numeric-handoff',
      signal: new AbortController().signal,
      capacity: 32,
      receiptCapacity: 8,
      artifactCapacity: 64,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('No writes')
        }
      },

      createGroups: () => [
        {
          name: 'fixture',
          description: 'Numeric handoff',
          owner: {
            definitions: [
              {
                name: 'source',
                description: 'Produce coordinates',
                inputSchema: object({}),
                ...toolSemantics(sourceSchema, 'read', []),
                composition: 'allowed'
              },
              {
                name: 'consume',
                description: 'Use bounded coordinates',
                inputSchema: targetSchema,
                ...toolSemantics(targetSchema, 'mutation', ['document']),
                composition: 'allowed'
              }
            ],

            call: async (name, input) => {
              calls.push(name)
              if (name === 'consume') {
                inputs.push(input)
              }

              return JSON.stringify(name === 'source' ? value : input)
            }
          }
        }
      ]
    })

    try {
      const args =
        form === 'fields'
          ? {
              x: { kind: 'step', step: 'source', path: '/x' },
              y: { kind: 'step', step: 'source', path: '/y' }
            }
          : { kind: 'step', step: 'source', path: '' }
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            { id: 'source', name: 'fixture.source', arguments: {} },
            { id: 'consume', name: 'fixture.consume', arguments: args }
          ],
          delivery: 'status'
        }
      })

      if (x <= 100000) {
        expect(reply.outcome.status, reply.text).toBe('success')
        expect(calls).toEqual(['source', 'consume'])
        expect(inputs).toEqual([value])
      } else {
        expect(reply.outcome.status, reply.text).toBe('failed')
        expect(reply.outcome.settlement).toBe('partial')
        expect(calls).toEqual(['source'])
        expect(inputs).toEqual([])
        expect(JSON.parse(reply.text).completed).toContain('source')
      }
    } finally {
      await host.dispose()
    }
  }
)
