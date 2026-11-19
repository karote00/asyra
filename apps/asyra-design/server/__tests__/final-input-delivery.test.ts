import { expect, it, vi } from 'vitest'
import { createConversationResults } from '../../src/ai/conversation-results'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { createLocalToolHost } from '../local-tool-host'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'

const contextFor = () => createConversationResults(() => 1).open('final-input')

const setup = (context: ReturnType<typeof contextFor>) => {
  const owner = createLocalKnowledgeTools('final-input')
  const call = vi.fn(owner.call)
  const host = createLocalToolHost({
    requestId: 'final-input',
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
        throw Error('Unexpected recipe storage')
      }
    },

    createGroups: () => [
      {
        name: 'design_knowledge',
        description: 'Knowledge',
        owner: { ...owner, call }
      }
    ]
  })

  return { host, call }
}

for (const step of [undefined, 'advice']) {
  it(`rejects request-lifetime input retention for ${step ?? 'final'} while delivering portable input`, async () => {
    const context = contextFor()
    const { host, call } = setup(context)

    try {
      const initial = await host.invoke({
        name: 'design_knowledge.read_knowledge',
        input: { ids: ['colors'] }
      })

      expect(initial.outcome.status).toBe('success')
      const contextKey: unknown = JSON.parse(initial.text).contextKey

      if (typeof contextKey !== 'string') {
        throw Error('Missing Knowledge result identity')
      }

      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'advice',
              name: 'design_knowledge.read_knowledge',
              arguments: { ids: ['colors'], reuseFrom: [contextKey] }
            }
          ],
          retain: {
            unsafe: {
              ...(step ? { step } : {}),
              source: 'input',
              path: ''
            }
          },
          delivery: {
            fields: {
              topics: {
                ...(step ? { step } : {}),
                source: 'input',
                path: '/ids'
              }
            }
          }
        }
      })

      expect(reply.outcome.status).not.toBe('success')
      expect(reply.text).toMatch(/request|Request/)
      expect(context.names()).toEqual([])
      expect(reply.outcome).toMatchObject({
        status: 'partial',
        settlement: 'completed'
      })
      expect(JSON.parse(reply.text).fields).toEqual({ topics: ['colors'] })
      expect(call).toHaveBeenCalledTimes(2)
    } finally {
      await host.dispose()
    }
  })

  it.each(['delivery', 'retain', 'both'])(
    `preserves the Knowledge producer input with ${step ?? 'final'} selection and %s`,
    async (mode) => {
      const context = contextFor()
      const { host, call } = setup(context)
      const selector = {
        ...(step ? { step } : {}),
        source: 'input',
        path: '/ids'
      }

      try {
        const reply = await host.invoke({
          name: 'design_operations.execute_design',
          input: {
            operations: [
              {
                id: 'advice',
                name: 'design_knowledge.read_knowledge',
                arguments: { ids: ['colors'] }
              }
            ],
            ...(mode !== 'delivery' ? { retain: { topics: selector } } : {}),
            delivery:
              mode === 'retain' ? 'status' : { fields: { topics: selector } }
          }
        })
        const result = JSON.parse(reply.text)

        expect(reply.outcome.status, reply.text).toBe('success')
        expect(result.fields).toEqual(
          mode === 'retain' ? undefined : { topics: ['colors'] }
        )
        expect(call).toHaveBeenCalledTimes(1)
        if (mode === 'delivery') {
          expect(context.names()).toEqual([])
        } else {
          expect(result.saved[0]).toMatchObject({
            name: 'topics',
            origin: {
              operation: 'design_knowledge.read_knowledge',
              source: 'input',
              path: '/ids'
            }
          })
          await host.dispose()
          const next = setup(context)

          try {
            const reused = await next.host.invoke({
              name: 'design_operations.execute_design',
              input: {
                operations: [
                  {
                    id: 'advice',
                    name: 'design_knowledge.read_knowledge',
                    arguments: {
                      ids: { kind: 'named', name: 'topics', path: '' }
                    }
                  }
                ],
                delivery: {
                  fields: { topics: { source: 'input', path: '/ids' } }
                }
              }
            })

            expect(reused.outcome.status, reused.text).toBe('success')
            expect(JSON.parse(reused.text).fields).toEqual({
              topics: ['colors']
            })
            expect(next.call).toHaveBeenCalledTimes(1)
          } finally {
            await next.host.dispose()
          }
        }
      } finally {
        await host.dispose()
      }
    }
  )

  it.each(['/missing', '/contextKey'])(
    `rejects invalid Knowledge selection %s for ${step ?? 'final'} without replay`,
    async (path) => {
      const context = contextFor()
      const { host, call } = setup(context)

      try {
        const reply = await host.invoke({
          name: 'design_operations.execute_design',
          input: {
            operations: [
              {
                id: 'advice',
                name: 'design_knowledge.read_knowledge',
                arguments: { ids: ['colors'] }
              }
            ],
            retain: { unsafe: { ...(step ? { step } : {}), path } },
            delivery: 'status'
          }
        })

        expect(reply.outcome.status).not.toBe('success')
        expect(context.names()).toEqual([])
        expect(call.mock.calls.length).toBeLessThanOrEqual(1)
      } finally {
        await host.dispose()
      }
    }
  )
}
