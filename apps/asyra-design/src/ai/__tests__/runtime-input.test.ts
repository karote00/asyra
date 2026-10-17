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
    expect(input.provider.requestActionBatch).toBeTypeOf('function')
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

it('exposes document export instead of raw serializers that can overflow tool delivery', async () => {
  const input = createAiRuntimeInput({
    permissionRules: {},
    provider: {
      requestActionBatch: async () => ({ batchId: 'empty', actions: [] })
    }
  })
  try {
    const names = input.actionDefinitions.map((action) => action.name)
    expect(names).toContain('export_document')
    expect(names).toContain('download_document_export')
    expect(names).toContain('release_document_export')
    expect(names).not.toContain('api_core_save')
    expect(names).not.toContain('api_core_propsSaveData')
    expect(names).not.toContain('api_core_sceneTreeSaveData')
    expect(names).toContain('api_core_getElementData')
  } finally {
    for (const owner of input.ownedResources ?? []) await owner.dispose()
  }
})

it('owns one shared inspection lifetime and disposes canonical subscriptions with the runtime', async () => {
  const { default: core } = await import('../../contexts')
  const { inspectionApis } = await import('../../common-apis/inspection')
  const originalObserve = core.observeSharedDataChannel
  const originalInspect = inspectionApis.inspect
  const originalMetadata = core.getElementMetadata
  core.getElementMetadata = vi.fn((id) => ({
    id,
    type: 'rect',
    name: id,
    parentId: '',
    visible: true,
    lock: false,
    childCount: 0
  }))
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
    core.getElementMetadata = originalMetadata
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
        revision: expect.any(Number),
        outputSchema: expect.any(Object),
        resources: expect.any(Array)
      })
      expect(Number.isSafeInteger(action.revision) && action.revision > 0).toBe(
        true
      )
      if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE)
        expect(action.revision).toBe(3)
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

it('hands canonical flat contracts to the host provider and preserves request options and disposal', async () => {
  const provider = {
    requestActionBatch: vi.fn<AiProvider['requestActionBatch']>(async () => ({
      batchId: 'empty',
      actions: []
    })),
    dispose: vi.fn()
  }
  const input = createAiRuntimeInput({ permissionRules: {}, provider })
  const action = input.actionDefinitions.find(
    (item) => item.name === AiActionNames.READ_DESIGN_CONTEXT
  )
  if (!action) throw new Error('Missing context action')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const options = {
    signal: new AbortController().signal,
    executeBatch: vi.fn(),
    onProgress: vi.fn()
  }
  await input.provider.requestActionBatch(
    {
      intent: 'Read context',
      context: {},
      attempt: 1,
      actions: [
        {
          name: action.name,
          description: action.description,
          inputSchema: action.inputSchema as never
        }
      ]
    },
    options
  )
  expect(provider.requestActionBatch).toHaveBeenCalledWith(
    expect.objectContaining({ actions: [createAiToolContract(action)] }),
    options
  )
  const sent = provider.requestActionBatch.mock.calls[0][0]
  expect(sent.actions[0]).not.toHaveProperty('execute')
  expect(sent.actions[0]).not.toHaveProperty('contract')
  await expect(
    input.provider.requestActionBatch(
      {
        intent: 'Unknown',
        context: {},
        attempt: 1,
        actions: [{ name: 'unknown', description: 'Unknown', inputSchema: {} }]
      },
      options
    )
  ).rejects.toThrow()
  expect(provider.requestActionBatch).toHaveBeenCalledOnce()
  await input.provider.dispose?.()
  expect(provider.dispose).toHaveBeenCalledOnce()
  await Promise.all(
    (input.ownedResources ?? []).map((resource) => resource.dispose())
  )
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

it('reuses deterministic verdicts through the registered browser action and retires them with its runtime', async () => {
  const { default: core } = await import('../../contexts')
  const { SharedDataChannelNames, SCENE_TREE_ACTIONS, PROPS_ACTIONS } =
    await import('@asyra/utils')
  const original = {
    observeSharedDataChannel: core.observeSharedDataChannel,
    getElementMetadata: core.getElementMetadata,
    getElementData: core.getElementData,
    getElementComputedData: core.getElementComputedData,
    getPropertyOwnerElementIds: core.getPropertyOwnerElementIds
  }
  const listeners = new Map<string, Set<(value: unknown) => void>>()
  core.observeSharedDataChannel = vi.fn((channel, listener) => {
    const entries = listeners.get(channel) ?? new Set()
    entries.add(listener)
    listeners.set(channel, entries)
    return () => {
      entries.delete(listener)
    }
  })
  const metadata = (id: string) => ({
    id,
    type: 'rectangle',
    name: id,
    parentId: id === 'root' ? '' : 'root',
    visible: true,
    lock: false,
    childCount: id === 'root' ? 2 : 0
  })
  core.getElementMetadata = vi.fn(metadata)
  core.getElementData = vi.fn((id) => ({
    ...metadata(id),
    children: id === 'root' ? ['a', 'b'] : []
  })) as typeof original.getElementData
  let x = 0
  core.getElementComputedData = vi.fn((id) => ({
    x: id === 'a' ? x : 0,
    y: 0,
    width: id === 'root' ? 100 : 10,
    height: 100,
    rotation: 0
  }))
  core.getPropertyOwnerElementIds = vi.fn(() => ['a', 'b'])
  const input = createAiRuntimeInput({
    provider: { requestActionBatch: vi.fn() },
    permissionRules: {}
  })
  const review = input.actionDefinitions.find(
    (action) => action.name === AiActionNames.REVIEW_DESIGN
  )
  const context = { signal: new AbortController().signal }
  const emit = (channel: string, value: unknown) => {
    for (const listener of listeners.get(channel) ?? []) listener(value)
  }
  try {
    if (!review) throw new Error('Missing registered review')
    expect(await review.execute({ elementId: 'root' }, context)).toMatchObject({
      complete: true,
      observation: { evaluatedNodes: 3 }
    })
    expect(await review.execute({ elementId: 'root' }, context)).toMatchObject({
      complete: true,
      observation: { evaluatedNodes: 0, reusedNodes: 3 }
    })
    x = 150
    emit(SharedDataChannelNames.SCENE_TREE, {
      action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA,
      id: 'a',
      key: 'visible',
      before: false,
      after: true
    })
    expect(await review.execute({ elementId: 'root' }, context)).toMatchObject({
      complete: true,
      findings: [
        expect.objectContaining({
          elementId: 'a',
          kind: 'container-overflow',
          right: 60
        })
      ],
      observation: { evaluatedNodes: 2, reusedNodes: 1 }
    })
    x = 0
    emit(SharedDataChannelNames.PROPS, {
      action: PROPS_ACTIONS.UPDATE_PROPERTY,
      id: 'shared'
    })
    expect(await review.execute({ elementId: 'root' }, context)).toMatchObject({
      complete: true,
      findings: [],
      observation: { evaluatedNodes: 3, reusedNodes: 0 }
    })
    expect(core.getPropertyOwnerElementIds).toHaveBeenCalled()
    await Promise.all(
      input.ownedResources?.map((resource) => resource.dispose()) ?? []
    )
    expect([...listeners.values()].every((entries) => entries.size === 0)).toBe(
      true
    )
    await expect(
      review.execute({ elementId: 'root' }, context)
    ).rejects.toThrow(/disposed/)
  } finally {
    await Promise.all(
      input.ownedResources?.map((resource) => resource.dispose()) ?? []
    )
    Object.assign(core, original)
  }
})
