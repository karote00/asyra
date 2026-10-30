// @vitest-environment jsdom
import { beforeAll, expect, it, vi } from 'vitest'
import { createLocalOperationTools } from '../../../server/local-operation-tools'
import { prepareOperationBatch } from '../../../server/local-operation-batch'
import { operationInputIssue } from '../../../server/operation-input-schema'
import { invokeLocalTool } from '../../../server/local-tool-invocation'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import { idCounter, IDTypes } from '@asyra/utils'
import factory from '@asyra/factory'
import core from '../../contexts'
import { createBasicApiActions } from '../basic-api-actions'
import { createAiActions } from '../actions'
import { prepareDesign } from '../../../server/design-preparation'
import { basicApiContracts } from '../basic-api-catalog'
import { createPreparedMaterialApplication } from '../prepared-material-action'
import { createRetainedFillAction } from '../retained-fill-action'
import { createRetainedDesignContext } from '../../common-apis/retained-design-context'
import { observeDesignChanges } from '../../common-apis/design-review'
import { fillApis } from '../../common-apis/fills'

beforeAll(() => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR
    ]
  })
})

const reset = () => {
  factory.transact.reset()
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
}

it('executes the published identity example through the real Core and uses issued keys for source references', async () => {
  reset()
  const contract = basicApiContracts.find((c) => c.method === 'allocateIds')
  expect(contract).toBeDefined()
  if (!contract) {
    throw new Error('Missing identity allocation contract')
  }
  const actions = createBasicApiActions()
  const action = actions.find((a) => a.name === contract.name)
  if (!action) {
    throw new Error('Missing allocated identity executor')
  }
  const dispatch = vi.fn(
    async (batch: import('../action-batch-protocol').AiActionBatch) => ({
      context: null,
      actionResults: await Promise.all(
        batch.actions.map(async (item) => ({
          actionId: item.id,
          actionName: item.name,
          result: (await action.execute(item.arguments, {
            signal: new AbortController().signal
          })) as import('../action-batch-protocol').AiJsonValue
        }))
      )
    })
  )
  const operations = createLocalOperationTools(
    actions,
    { modelActions: (actions) => actions, resolveBatch: (value) => value },
    dispatch
  )
  const definition = operations.definitions.find(
    (item) => item.name === 'describe_design_apis'
  )
  if (!definition) {
    throw new Error('Missing discovery definition')
  }
  const delivery = JSON.parse(
    (
      await invokeLocalTool(
        operations,
        definition,
        { names: [action.name], view: 'usage' },
        new AbortController().signal
      )
    ).text
  )
  expect(delivery.contentDelivery).toBeUndefined()
  const published = delivery.apis[0]
  const invocation = published.invocationExample.invocation
  const example = invocation.arguments.operations[0].arguments
  expect(example).toEqual((contract.inputSchema.examples as unknown[])[0])
  expect(invocation.tool).toBe('execute_design_batch')
  const batchDefinition = operations.definitions.find(
    (item) => item.name === invocation.tool
  )
  if (!batchDefinition) {
    throw new Error('Missing advertised batch definition')
  }
  expect(
    operationInputIssue(invocation.arguments, batchDefinition.inputSchema)
  ).toBeUndefined()
  expect(
    prepareOperationBatch(invocation.arguments.operations, actions)[0]
  ).toMatchObject({ name: action.name, arguments: example })
  const before = core.getCanonicalOwnerSnapshot()
  const depth = core.getUndoHistoryDepth()
  const signal = new AbortController().signal
  const native = JSON.parse(
    (
      await invokeLocalTool(
        operations,
        batchDefinition,
        invocation.arguments,
        signal
      )
    ).text
  )
  expect(native.toolOutcome.status).toBe('success')
  expect(dispatch).toHaveBeenCalledTimes(1)
  const first = native.actionResults[0].result as {
    value: string[]
    status: string
    application: string
  }
  expect(first).toMatchObject({ status: 'no-change', application: 'prepared' })
  expect(first.value).toHaveLength(2)
  const second = (await action.execute(example, { signal })) as {
    value: string[]
  }
  expect(new Set([...first.value, ...second.value]).size).toBe(4)
  const [face, grid] = first.value
  const vertices = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 0 },
    { x: 10, y: 0, z: 20 },
    { x: 0, y: 0, z: 20 }
  ]
  const draft = {
    type: 'group',
    name: 'Panel',
    projection: {
      azimuth: 30,
      elevation: 25,
      scale: 1,
      originX: 0,
      originY: 0
    },
    children: [
      {
        type: 'projected-face',
        key: face,
        name: 'Panel',
        fill: '#123456',
        vertices
      },
      {
        type: 'surface-grid',
        key: grid,
        name: 'Panel',
        boundary: { face },
        rows: 1,
        columns: 1,
        order: 'cell-major',
        motifs: [
          {
            key: 'mark',
            name: 'Marker',
            fill: '#abcdef',
            vertices: [
              { u: 0, v: 0 },
              { u: 1, v: 0 },
              { u: 1, v: 1 },
              { u: 0, v: 1 }
            ]
          }
        ]
      }
    ]
  }
  const prepared = prepareDesign(draft, 'allocated-reference')
  expect(prepared.keyToId[face]).toBeTruthy()
  expect(core.getCanonicalOwnerSnapshot()).toEqual(before)
  expect(core.getUndoHistoryDepth()).toBe(depth)
  expect(
    Object.isFrozen(
      (await dispatch.mock.results[0].value).actionResults[0].result.value
    )
  ).toBe(true)
  const current = idCounter.current(IDTypes.ELEMENT)
  await expect(
    action.execute({ types: ['el', 'not-registered'] }, { signal })
  ).rejects.toThrow()
  await expect(
    action.execute(example, { signal: AbortSignal.abort() })
  ).rejects.toThrow()
  expect(idCounter.current(IDTypes.ELEMENT)).toBe(current)
})

const gradient = {
  gradientType: 'linear' as const,
  gradientHandles: [
    { x: 0, y: 0 },
    { x: 1, y: 0 }
  ],
  gradientStops: [
    { position: 0, color: '#000000', opacity: 1 },
    { position: 1, color: '#ffffff', opacity: 1 }
  ]
}
const materialFixture = () => {
  reset()
  core.createElementsInParent(
    [
      {
        id: 'panel',
        type: 'rect',
        x: 0,
        y: 0,
        width: 30,
        height: 40,
        fills: [
          {
            id: 'paint',
            type: 'fill',
            color: '#000000',
            kind: 'solid',
            opacity: 1,
            visible: true
          }
        ]
      }
    ],
    'workspace'
  )
}

it('keeps actual canonical no-op evidence through prepared material application', async () => {
  materialFixture()
  const signal = new AbortController().signal
  const owner = createPreparedMaterialApplication({
    read: () => ({ geometry: 'fixed', binding: 'fixed' }),
    update: fillApis.updateFillsAtIndex
  })
  try {
    owner.capture('root', ['panel'], signal)
    const input = {
      rootId: 'root',
      updates: [{ elementId: 'panel', color: '#000000', gradient }]
    }
    expect(await owner.action.execute(input, { signal })).toMatchObject({
      status: 'complete'
    })
    const before = core.getCanonicalOwnerSnapshot()
    const depth = core.getUndoHistoryDepth()
    expect(await owner.action.execute(input, { signal })).toMatchObject({
      status: 'no-change',
      changed: false,
      acceptedIds: ['panel']
    })
    expect(core.getCanonicalOwnerSnapshot()).toEqual(before)
    expect(core.getUndoHistoryDepth()).toBe(depth)
  } finally {
    owner.dispose()
  }
})

it('keeps actual canonical no-op evidence through retained fill mapping', async () => {
  materialFixture()
  const queries = createRetainedDesignContext(core, observeDesignChanges)
  const action = createRetainedFillAction(queries)
  const signal = new AbortController().signal
  const input = {
    mappings: [
      {
        query: { scope: 'ids' as const, elementIds: ['panel'] },
        coordinateSpace: 'parent-local' as const,
        axis: 'x' as const,
        domain: [0, 100],
        index: 0,
        outside: 'clamp' as const,
        stops: [
          { at: 0, color: '#123456' },
          { at: 1, color: '#ffffff' }
        ]
      }
    ]
  }
  try {
    expect(await action.execute(input, { signal })).toMatchObject({
      status: 'complete'
    })
    const before = core.getCanonicalOwnerSnapshot()
    const depth = core.getUndoHistoryDepth()
    expect(await action.execute(input, { signal })).toMatchObject({
      status: 'no-change',
      changed: false,
      acceptedIds: ['panel']
    })
    expect(core.getCanonicalOwnerSnapshot()).toEqual(before)
    expect(core.getUndoHistoryDepth()).toBe(depth)
  } finally {
    queries.dispose()
  }
})

it('preserves a real unchanged oval geometry result in the composed action', async () => {
  reset()
  core.createElementsInParent(
    [{ id: 'oval', type: 'oval', x: 10, y: 20, width: 30, height: 40 }],
    'workspace'
  )
  const action = createAiActions(undefined, {
    yieldToHost: vi.fn(async () => undefined)
  }).find((a) => a.name === 'update_composition_elements')
  if (!action) {
    throw new Error('Missing composition updater')
  }
  const before = core.getCanonicalOwnerSnapshot()
  const result = await action.execute(
    { updates: [{ elementId: 'oval', geometry: { scaleX: 1, scaleY: 1 } }] },
    { signal: new AbortController().signal }
  )
  expect(result).toMatchObject({
    status: 'no-change',
    appliedElementIds: [],
    skipped: [{ elementId: 'oval', reason: 'no-change' }]
  })
  expect(core.getCanonicalOwnerSnapshot()).toEqual(before)
})

it('preserves partial material targets and rejects malformed receipts without replay', async () => {
  const signal = new AbortController().signal
  const update = vi.fn(() => ({
    value: null,
    changed: true,
    acceptedIds: ['a'],
    unavailableIds: ['b']
  }))
  const owner = createPreparedMaterialApplication({
    read: () => ({ geometry: 'fixed', binding: 'fixed' }),
    update: update as never
  })
  const input = {
    rootId: 'root',
    updates: ['a', 'b'].map((elementId) => ({
      elementId,
      color: '#000000',
      gradient
    }))
  }
  try {
    owner.capture('root', ['a', 'b'], signal)
    expect(await owner.action.execute(input, { signal })).toMatchObject({
      status: 'partial',
      changed: true,
      appliedElementIds: ['a'],
      unavailableIds: ['b']
    })
    expect(update).toHaveBeenCalledTimes(1)
    update.mockReturnValueOnce({
      value: null,
      changed: true,
      acceptedIds: ['other'],
      unavailableIds: []
    })
    await expect(owner.action.execute(input, { signal })).rejects.toMatchObject(
      { stage: 'output', inspection: { settlement: 'completed' } }
    )
    expect(update).toHaveBeenCalledTimes(2)
  } finally {
    owner.dispose()
  }
})
