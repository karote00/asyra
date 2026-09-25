import type { AiProvider } from '@asyra/ai-agent-runtime'
import { describe, expect, it, vi } from 'vitest'
import { AiActionNames } from '../actions'
import { createAiRuntimeInput } from '../runtime-input'

describe('Asyra Design Agent runtime input', () => {
  it('builds one concrete server-provider runtime input without a delivery mode', () => {
    const provider: AiProvider = {
      requestActionBatch: vi.fn()
    }

    const input = createAiRuntimeInput({
      permissionRules: {
        [AiActionNames.INSERT_VECTOR_COMPOSITION]: 'allow'
      },
      provider
    })

    expect(input.options?.failurePolicy).toBe('preserve-progress')
    expect(input.provider).toBe(provider)
    expect(input.actionDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: AiActionNames.INSERT_VECTOR_COMPOSITION
        })
      ])
    )
    expect(input).not.toHaveProperty('deliveryMode')
  })
})

it('exposes the existing vector read, anchor and handle APIs without a dedicated flip action', () => {
  const input = createAiRuntimeInput({
    permissionRules: {},
    provider: {
      requestActionBatch: async () => ({ batchId: 'empty', actions: [] })
    }
  })
  const names = input.actionDefinitions.map((action) => action.name)
  expect(names).toContain('api_element_getVectorAnchorPoints')
  expect(names).toContain('api_element_updateVectorAnchorPointPosition')
  expect(names).toContain('api_element_updateVectorAnchorPointHandlePosition')
})
