import { expect, it, vi } from 'vitest'
import {
  executeAiActions,
  createAiAgentRuntime,
  type AiBatchReceipt,
  createAiToolContract,
  type ConfirmedAiActionBatch
} from '@asyra/ai-agent-runtime'
import { invokeLocalTool } from '../../../server/local-tool-invocation'
import { createBasicApiActions } from '../basic-api-actions'
import { createAiTransactionRunner } from '../transaction'

const live = vi.hoisted(() => ({ core: undefined as object | undefined }))
vi.mock('../../contexts', () => ({
  default: new Proxy(
    {},
    {
      get: (_target, key) => {
        if (!live.core) throw new Error('Core fixture not initialized')
        const value = Reflect.get(live.core, key)
        return typeof value === 'function' ? value.bind(live.core) : value
      }
    }
  )
}))
vi.mock('../../common-apis', () => ({
  elementApis: {},
  fillApis: {},
  strokeApis: {},
  selectionApis: {},
  hierarchyApis: {},
  viewportApis: {},
  transactionApis: {}
}))

it('delivers real Core results through App capture, runtime execution and native tool validation without replay', async () => {
  const { Core } = await import('@asyra/core')
  const { Factory } = await import('@asyra/factory')
  const {
    default: props,
    registerPropertySchema,
    registerPropertyComponent,
    createPropertyComponentFromConfig,
    elementPropertyRegistry
  } = await import('@asyra/props-manager')
  const {
    default: scene,
    componentRegistry,
    createDynamicComponent
  } = await import('@asyra/scene-tree')
  const type = 'owner-receipt-integration-value',
    ownerType = 'owner-receipt-integration-element'
  const config = {
    type,
    defaults: { opacity: 1 },
    persistKeys: ['opacity'],
    valueKeys: ['opacity']
  }
  registerPropertySchema({
    type,
    fields: [{ key: 'opacity', kind: 'number', defaultValue: 1 }]
  })
  registerPropertyComponent(
    type,
    createPropertyComponentFromConfig(config),
    undefined,
    config
  )
  const properties = [{ name: 'material', type, alias: ['opacity'] }]
  elementPropertyRegistry.register(properties[0], ownerType)
  componentRegistry.register({
    type: ownerType,
    idPrefix: ownerType,
    namePrefix: 'Receipt Element',
    properties,
    constructor: createDynamicComponent(
      ownerType,
      ownerType,
      'Receipt Element',
      properties,
      {}
    ),
    defaults: {}
  })
  const factory = new Factory()
  const { SharedDataChannelNames } = await import('@asyra/utils')
  factory.registerSharedDataChannel(
    SharedDataChannelNames.SCENE_TREE,
    factory.createLocalSharedDataChannel()
  )
  factory.registerSharedDataChannel(
    SharedDataChannelNames.PROPS,
    factory.createLocalSharedDataChannel()
  )
  const api = new Core({
    inputSystem: {} as never,
    factory,
    props,
    sceneTree: scene,
    render: {} as never,
    selection: {} as never,
    systemContext: {} as never
  })
  const reset = () => {
    factory.transact.reset()
    props.reset()
    scene.reset()
    props.load({
      source: { id: 'source', type, opacity: 1, sharedSource: true }
    })
    scene.load({
      workspace: 'workspace',
      workspaceList: ['workspace'],
      elements: {
        workspace: {
          id: 'workspace',
          type: 'workspace',
          name: 'Workspace',
          parentId: '',
          visible: true,
          lock: false,
          children: ['a']
        },
        a: {
          id: 'a',
          type: ownerType,
          name: 'A',
          parentId: 'workspace',
          visible: true,
          lock: false,
          props: { material: 'source' }
        }
      }
    })
  }
  live.core = api
  reset()
  const actions = createBasicApiActions(() => ({
    core: api,
    element: {},
    fill: {},
    stroke: {},
    selection: {},
    hierarchy: {},
    viewport: {}
  }))
  const runner = createAiTransactionRunner({ apis: factory })
  const calls: string[] = []
  const invoke = async (
    name: string,
    input: Record<string, unknown>,
    signal = new AbortController().signal
  ) => {
    const action = actions.find((item) => item.name === name)
    if (!action) throw new Error('Missing Core action')
    const definition = createAiToolContract(action)
    return invokeLocalTool(
      {
        call: async (_name, args, requestSignal) => {
          calls.push(name)
          const batch: ConfirmedAiActionBatch = {
            batchId: 'owner-proof',
            confirmationRequired: false,
            confirmation: 'bypassed',
            preview: { batchId: 'owner-proof', actions: [] },
            actions: [
              {
                ...action,
                id: 'owner-write',
                arguments: args as never,
                permission: 'allow',
                summary: {}
              }
            ]
          }
          const result = await runner.run(
            'owner-proof',
            (mutate) => executeAiActions(batch, requestSignal, {}, mutate),
            { signal: requestSignal }
          )
          return JSON.stringify(result.actionResults[0].result)
        }
      },
      definition,
      input,
      signal
    )
  }
  try {
    const name = 'api_core_updateElementProperties'
    const args = { updates: [{ elementId: 'a', values: { opacity: 0.4 } }] }
    const changed = await invoke(name, args)
    expect(changed.success).toBe(true)
    expect(JSON.parse(changed.text)).toMatchObject({
      status: 'complete',
      value: { acceptedIds: ['a'], changed: true },
      mutationScope: { complete: true, elementIds: ['a'] },
      toolOutcome: { status: 'success', settlement: 'completed' }
    })
    const saved = {
      props: props.save(),
      scene: scene.save(),
      depth: factory.getUndoHistoryDepth()
    }
    const noop = await invoke(name, args)
    expect(JSON.parse(noop.text)).toMatchObject({
      status: 'no-change',
      value: { changed: false },
      mutationScope: { complete: true, elementIds: [] }
    })
    expect({
      props: props.save(),
      scene: scene.save(),
      depth: factory.getUndoHistoryDepth()
    }).toEqual(saved)
    const invalid = await invoke(name, {
      updates: [
        { elementId: 'a', values: { opacity: 0.2 } },
        { elementId: 'missing', values: { opacity: 0.2 } }
      ]
    })
    expect(invalid.success).toBe(false)
    expect({
      props: props.save(),
      scene: scene.save(),
      depth: factory.getUndoHistoryDepth()
    }).toEqual(saved)
    const emptyValues = await invoke(name, {
      updates: [{ elementId: 'a', values: {} }]
    })
    expect(JSON.parse(emptyValues.text)).toMatchObject({
      status: 'no-change',
      value: { acceptedIds: ['a'], changed: false }
    })
    expect(
      (await invoke(name, { updates: [{ elementId: 'missing', values: {} }] }))
        .success
    ).toBe(false)
    expect({
      props: props.save(),
      scene: scene.save(),
      depth: factory.getUndoHistoryDepth()
    }).toEqual(saved)
    const count = calls.length
    await expect(invoke(name, args, AbortSignal.abort())).rejects.toThrow()
    expect(calls).toHaveLength(count)
    expect((await invoke(name, { updates: 'invalid' })).success).toBe(false)
    expect(calls).toHaveLength(count)
    // A nonvisual data edit still reports a mutation even with no visual dependency IDs.
    const renamed = await invoke('api_core_updateElementData', {
      elementId: 'a',
      values: { name: 'Renamed' }
    })
    expect(JSON.parse(renamed.text)).toMatchObject({
      status: 'complete',
      value: true,
      mutationScope: { elementIds: [] }
    })
    const sameName = await invoke('api_core_updateElementData', {
      elementId: 'a',
      values: { name: 'Renamed' }
    })
    expect(JSON.parse(sameName.text)).toMatchObject({
      status: 'no-change',
      value: false
    })
    factory.undo()
    expect(api.getElementData('a')?.name).toBe('A')
    factory.redo()
    expect(api.getElementData('a')?.name).toBe('Renamed')
    expect(calls.filter((call) => call === name)).toHaveLength(5)
    const prefixAction = actions.find((item) => item.name === name)
    if (!prefixAction) throw new Error('Missing prefix action')
    let prefixCalls = 0
    await expect(
      runner.run('partial-prefix', async (runMutation) => {
        const context = { signal: new AbortController().signal, runMutation }
        prefixCalls++
        const first = await prefixAction.execute(
          { updates: [{ elementId: 'a', values: { opacity: 0.7 } }] },
          context
        )
        expect(first).toMatchObject({ status: 'complete' })
        await prefixAction.execute(
          { updates: [{ elementId: 'missing', values: { opacity: 0.1 } }] },
          context
        )
      })
    ).rejects.toMatchObject({ status: 'committed' })
    const retainedPrefix = { props: props.save(), scene: scene.save() }
    // Recover by reading the original owner; a receipt failure must not rerun the prefix.
    expect(api.getElementComputedData('a')?.opacity).toBe(0.7)
    expect(prefixCalls).toBe(1)
    factory.undo()
    expect(api.getElementComputedData('a')?.opacity).toBe(0.4)
    factory.redo()
    expect({ props: props.save(), scene: scene.save() }).toEqual(retainedPrefix)
    props.reset()
    scene.reset()
    props.load(retainedPrefix.props)
    scene.load(retainedPrefix.scene)
    expect({ props: props.save(), scene: scene.save() }).toEqual(retainedPrefix)
    const failures: AiBatchReceipt[] = []
    const runtime = createAiAgentRuntime({
      provider: {
        requestActionBatch: async (_input, options) => {
          if (!options.executeBatch)
            throw new Error('Missing runtime batch dispatcher')
          const missing = {
            id: 'missing',
            name,
            arguments: { updates: [{ elementId: 'missing', values: {} }] },
            summary: 'Reject a missing target'
          }
          failures.push(
            await options.executeBatch({
              batchId: 'invalid-owner',
              actions: [missing]
            })
          )
          failures.push(
            await options.executeBatch({
              batchId: 'prefix-owner',
              actions: [
                {
                  id: 'prefix',
                  name,
                  arguments: {
                    updates: [{ elementId: 'a', values: { opacity: 0.8 } }]
                  },
                  summary: 'Apply the prefix'
                },
                missing
              ]
            })
          )
          return {
            batchId: 'read-recovery',
            actions: [
              {
                id: 'read',
                name: 'api_core_getElementData',
                arguments: { elementId: 'a' },
                summary: 'Read without replay'
              }
            ]
          }
        }
      },
      actionDefinitions: actions,
      contextProvider: { getContext: async () => ({}) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: runner
    })
    try {
      expect(
        (
          await runtime.run({
            intent: 'Verify deterministic owner failure settlement',
            signal: new AbortController().signal
          })
        ).status
      ).toBe('executed')
      expect(failures[0]).toMatchObject({
        actionResults: [],
        failure: { actionId: 'missing', settlement: 'not-started' }
      })
      expect(failures[1]).toMatchObject({
        actionResults: [{ actionId: 'prefix', result: { status: 'complete' } }],
        failure: { actionId: 'missing', settlement: 'not-started' }
      })
      expect(api.getElementComputedData('a')?.opacity).toBe(0.8)
    } finally {
      await runtime.dispose()
    }
  } finally {
    factory.transact.reset()
    live.core = undefined
  }
})
