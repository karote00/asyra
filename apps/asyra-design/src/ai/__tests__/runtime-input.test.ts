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
    ).toMatchObject({ current: true })
    expect(core.observeSharedDataChannel).toHaveBeenCalledTimes(2)
    expect(inspectionApis.inspect).toHaveBeenCalledOnce()
    await Promise.all(
      (input.ownedResources ?? []).map((resource) => resource.dispose())
    )
    expect(
      await validate.execute({ evidence: result.evidence }, context)
    ).toMatchObject({ current: false })
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

it('measures the real browser handler without treating its duration as server exchange time', async () => {
  const { observeAiAction } = await import('../runtime-input')
  let time = 10
  const definition = {
    name: 'example',
    description: 'Read current data',
    inputSchema: {},
    execute: async () => {
      time = 35
      return { current: true }
    }
  }
  const observed = observeAiAction(definition, () => time)
  expect(
    await observed.execute({}, {
      signal: new AbortController().signal
    } as never)
  ).toEqual({
    current: true,
    actionObservation: { handlerMs: 25, executor: 'app-browser' }
  })
  const error = new Error('canonical failure')
  const failed = observeAiAction({
    ...definition,
    execute: async () => {
      throw error
    }
  })
  await expect(failed.execute({}, {} as never)).rejects.toBe(error)
})

it('retains measured handler failure without replacing the original public error', async () => {
  const { AiActionExecutionError } = await import('@asyra/ai-agent-runtime')
  const { observeAiAction } = await import('../runtime-input')
  const { describeBatchFailure } = await import('../action-failure')
  const error = new AiActionExecutionError(
    'Prepared design parent relationship is invalid.'
  )
  const definition = createAiRuntimeInput({
    permissionRules: {},
    provider: { requestActionBatch: vi.fn() }
  }).actionDefinitions[0]
  const now = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(35)
  const observed = observeAiAction(
    {
      ...definition,
      execute: async () => {
        throw error
      }
    },
    now
  )
  await expect(observed.execute({}, {} as never)).rejects.toBe(error)
  expect(describeBatchFailure(error, 'batch', 40)).toMatchObject({
    actionName: definition.name,
    handlerMs: 25,
    executionMs: 40,
    message: error.message
  })
})
