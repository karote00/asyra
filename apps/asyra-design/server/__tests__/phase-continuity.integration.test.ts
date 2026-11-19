import type { AiJsonValue } from '@asyra/ai-agent-runtime'
import { expect, it } from 'vitest'
import recorded from '../../test-data/ai-drawing/fixtures/phase-continuity-20261108.json'
import { createLocalToolHost } from '../local-tool-host'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'

it('exposes saved subtree shape through the existing host read route without dispatching work', async () => {
  const { createConversationResults } =
    await import('../../src/ai/conversation-results')
  const context = createConversationResults(() => 1).open('shape-continuation')

  context.exchange({
    save: {
      bodySource: recorded.body.operations[1].arguments
        .draft as unknown as AiJsonValue
    }
  })
  let reads = 0
  const host = createLocalToolHost({
    requestId: 'saved-shape',
    signal: new AbortController().signal,
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 64,
    limits: LocalToolLibraryLimits.recipe,

    resultContext: async (command) => {
      reads++

      return context.exchange(command)
    },

    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw Error('No writes')
      }
    },

    createGroups: () => []
  })

  try {
    const reply = await host.invoke({
      name: 'design_operations.execute_design',
      input: {
        delivery: {
          fields: {
            shape: { name: 'bodySource', path: '/children/0', view: 'shape' }
          }
        }
      }
    })
    const result = JSON.parse(reply.text)

    expect(result.toolOutcome.status).toBe('success')
    expect(result.fields.shape.paths).toContainEqual({
      path: '/children/0/origin',
      type: 'object'
    })
    expect(result.fields.shape.paths.length).toBeLessThanOrEqual(16)
    expect(reads).toBe(1)
    expect(reply.text).not.toContain('50800')
  } finally {
    await host.dispose()
  }
})
