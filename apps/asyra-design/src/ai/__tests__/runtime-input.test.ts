import { toolSemantics, toolResultObject } from '../tool-contract'
import type { AiProvider } from '@asyra/ai-agent-runtime'
import { describe, expect, it, vi } from 'vitest'
import { AiActionNames } from '../actions'
import { createAiRuntimeInput } from '../runtime-input'

it.each([
  ['partial', 'unknown'],
  ['partial', 'completed'],
  ['unknown', 'completed']
] as const)(
  'preserves explicit %s result settlement %s at the browser boundary',
  async (status, settlement) => {
    const { observeAiAction } = await import('../runtime-input')
    const execute = vi.fn(async () => ({ status, settlement }))
    const action = observeAiAction({
      ...toolSemantics({ type: 'object' }, 'mutation', ['document']),
      name: 'edit',
      description: 'Edit a target',
      inputSchema: { type: 'object' },
      execute
    })
    await expect(
      action.execute({}, { signal: new AbortController().signal })
    ).resolves.toMatchObject({ toolOutcome: { status, settlement } })
    expect(execute).toHaveBeenCalledOnce()
  }
)

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
    ...toolSemantics(
      toolResultObject({ current: { type: 'boolean' } }),
      'read',
      ['document']
    ),
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
    toolOutcome: { status: 'success', settlement: 'completed' },
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
      inputSchema: { type: 'object' },
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

it.each([false, true])(
  'releases only the settled request query leases after failure=%s',
  async (failed) => {
    const input = createAiRuntimeInput({
      provider: { requestActionBatch: vi.fn() },
      permissionRules: {},
      transactionRunner: { run: async (_label, execute) => execute() }
    })
    const queries = input.ownedResources?.find(
      (resource) => 'releaseFor' in resource
    ) as { releaseFor(signal: AbortSignal): void; dispose(): void }
    const release = vi.spyOn(queries, 'releaseFor')
    const signal = new AbortController().signal
    const result = input.transactionRunner.run(
      'request',
      async () => {
        if (failed) throw new Error('failed')
        return 42
      },
      { signal }
    )
    if (failed) await expect(result).rejects.toThrow('failed')
    else await expect(result).resolves.toBe(42)
    expect(release).toHaveBeenCalledExactlyOnceWith(signal)
    await Promise.all(
      (input.ownedResources ?? []).map((resource) => resource.dispose())
    )
  }
)

it('advertises one complete contract for every browser tool without exposing executors to discovery', async () => {
  const { createAiActionRegistry } = await import('@asyra/ai-agent-runtime')
  const input = createAiRuntimeInput({
    permissionRules: {},
    provider: { requestActionBatch: vi.fn() }
  })
  const registry = createAiActionRegistry()
  try {
    for (const action of input.actionDefinitions) {
      expect(action, action.name).toMatchObject({
        revision: 1,
        outputSchema: expect.any(Object),
        resources: expect.any(Array)
      })
      expect(action.lifecycle.retry).not.toBe('read-only')
      registry.register(action)
    }
    expect(registry.list()).toHaveLength(input.actionDefinitions.length)
    expect(
      registry
        .list()
        .every((tool) => !('outputSchema' in tool) && !('execute' in tool))
    ).toBe(true)
  } finally {
    registry.dispose()
    await Promise.all(
      (input.ownedResources ?? []).map((resource) => resource.dispose())
    )
  }
})

it('rejects malformed successful output after one execution and retains its settlement evidence', async () => {
  const { observeAiAction } = await import('../runtime-input')
  const { toolSemantics, toolResultObject } = await import('../tool-contract')
  const execute = vi.fn(async () => ({ wrong: true }))
  const action = observeAiAction({
    name: 'edit',
    description: 'Edit a target',
    inputSchema: { type: 'object' },
    ...toolSemantics(
      toolResultObject({ changed: { type: 'boolean' } }),
      'mutation',
      ['document']
    ),
    execute
  })
  await expect(
    action.execute({}, { signal: new AbortController().signal })
  ).rejects.toMatchObject({
    stage: 'output',
    inspection: {
      status: 'invalid',
      settlement: 'completed',
      value: { wrong: true }
    }
  })
  expect(execute).toHaveBeenCalledOnce()
})

it.each([null, false, [], 'invalid'])(
  'rejects an unstructured browser receipt without replay: %j',
  async (value) => {
    const { observeAiAction } = await import('../runtime-input')
    const execute = vi.fn(async () => value)
    const action = observeAiAction({
      ...toolSemantics(
        toolResultObject({ changed: { type: 'boolean' } }),
        'mutation',
        ['document']
      ),
      name: 'edit',
      description: 'Edit a target',
      inputSchema: { type: 'object' },
      execute
    })
    await expect(
      action.execute({}, { signal: new AbortController().signal })
    ).rejects.toMatchObject({
      stage: 'output',
      inspection: { status: 'invalid', settlement: 'unknown', value }
    })
    expect(execute).toHaveBeenCalledOnce()
  }
)
