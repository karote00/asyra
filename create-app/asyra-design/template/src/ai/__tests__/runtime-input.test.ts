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

it('owns one shared inspection lifetime and disposes canonical subscriptions with the runtime', async () => {
  const { default: core } = await import('../../contexts')
  const { inspectionApis } = await import('../../common-apis/inspection')
  const originalObserve = core.observeSharedDataChannel
  const originalInspect = inspectionApis.inspect
  const stop = vi.fn()
  core.observeSharedDataChannel = vi.fn(() => stop)
  inspectionApis.inspect = vi.fn(() => ({
    available: true,
    image: { dataUrl: 'png' }
  })) as typeof originalInspect
  const customDispose = vi.fn()
  const input = createAiRuntimeInput({
    provider: { requestActionBatch: vi.fn() },
    permissionRules: {},
    ownedResources: [{ dispose: customDispose }]
  })
  const inspect = input.actionDefinitions.find(
    (action) => action.name === AiActionNames.INSPECT_DRAWING
  )
  const validate = input.actionDefinitions.find(
    (action) => action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
  )
  const context = { signal: new AbortController().signal } as never
  try {
    if (!inspect || !validate || !input.ownedResources)
      throw new Error('Missing inspection ownership')
    const result = (await inspect.execute(
      { elementId: 'drawing' },
      context
    )) as { evidence: unknown }
    expect(
      await validate.execute({ evidence: result.evidence }, context)
    ).toEqual({ current: true })
    expect(core.observeSharedDataChannel).toHaveBeenCalledTimes(2)
    expect(inspectionApis.inspect).toHaveBeenCalledOnce()
    await Promise.all(
      (input.ownedResources ?? []).map((resource) => resource.dispose())
    )
    expect(
      await validate.execute({ evidence: result.evidence }, context)
    ).toEqual({ current: false })
    expect(stop).toHaveBeenCalledTimes(2)
    expect(customDispose).toHaveBeenCalledOnce()
  } finally {
    await Promise.all(
      (input.ownedResources ?? [])
        .slice(1)
        .map((resource) => resource.dispose())
    )
    core.observeSharedDataChannel = originalObserve
    inspectionApis.inspect = originalInspect
  }
})
