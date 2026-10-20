import factory from '@asyra/factory'
import props from '@asyra/props-manager'
import scene from '@asyra/scene-tree'
import { expect, it, vi } from 'vitest'
import core from '@asyra/core'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import {
  createAiToolContract,
  createAiAgentRuntime,
  executeAiActions,
  type AiBatchReceipt,
  type ConfirmedAiActionBatch
} from '@asyra/ai-agent-runtime'
import { basicApiContracts } from '../basic-api-catalog'
import { createBasicApiActions } from '../basic-api-actions'
import { createAiTransactionRunner } from '../transaction'
import { vectorApis } from '../../common-apis/element/vector-apis'
import { invokeLocalTool } from '../../../server/local-tool-invocation'

const required = <T>(value: T | null | undefined): T => {
  if (value == null)
    throw new Error('Required integration fixture value is missing')
  return value
}

it('delivers non-Core owner evidence through real Core, native validation and history without replay', async () => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR
    ]
  })
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
          visible: true,
          lock: false,
          children: []
        }
      }
    }
  })
  core.createElementsInParent(
    [{ id: 'a', type: 'rect', x: 0, y: 0, width: 20, height: 10 }],
    'workspace'
  )
  const actions = createBasicApiActions()
  const runner = createAiTransactionRunner()
  const calls: string[] = []
  const invoke = async (
    name: string,
    args: Record<string, unknown>,
    signal = new AbortController().signal
  ) => {
    const action = required(actions.find((entry) => entry.name === name))
    const result = await invokeLocalTool(
      {
        call: async (_name, input, requestSignal) => {
          calls.push(name)
          const batch: ConfirmedAiActionBatch = {
            batchId: 'non-core-results',
            confirmationRequired: false,
            confirmation: 'bypassed',
            preview: { batchId: 'non-core-results', actions: [] },
            actions: [
              {
                ...action,
                id: 'owner',
                arguments: input as never,
                permission: 'allow',
                summary: {}
              }
            ]
          }
          const receipt = await runner.run(
            'non-core-results',
            (mutate) => executeAiActions(batch, requestSignal, {}, mutate),
            { signal: requestSignal }
          )
          return JSON.stringify(receipt.actionResults[0].result)
        }
      },
      createAiToolContract(action),
      args,
      signal
    )
    return { ...result, receipt: JSON.parse(result.text) }
  }
  const lock = await invoke('api_element_setElementLock', {
    elementId: 'a',
    lock: true
  })
  expect(lock.receipt).toMatchObject({
    status: 'complete',
    changed: true,
    acceptedIds: ['a'],
    unavailableIds: [],
    toolOutcome: { status: 'success', settlement: 'completed' }
  })
  const depth = core.getUndoHistoryDepth()
  expect(
    (await invoke('api_element_setElementLock', { elementId: 'a', lock: true }))
      .receipt
  ).toMatchObject({
    status: 'no-change',
    changed: false,
    toolOutcome: { status: 'success', settlement: 'completed' }
  })
  expect(core.getUndoHistoryDepth()).toBe(depth)
  expect(
    (
      await invoke('api_element_setElementLock', {
        elementId: 'missing',
        lock: true
      })
    ).receipt
  ).toMatchObject({
    status: 'failed',
    unavailableIds: ['missing'],
    changed: false,
    toolOutcome: { status: 'failed', settlement: 'not-started' }
  })
  await invoke('api_element_setElementLock', { elementId: 'a', lock: false })
  expect(
    (
      await invoke('api_element_setElementPositions', {
        positionsById: { a: { x: 4, y: 5 }, missing: { x: 1, y: 2 } }
      })
    ).receipt
  ).toMatchObject({
    status: 'partial',
    acceptedIds: ['a'],
    unavailableIds: ['missing'],
    changed: true,
    toolOutcome: { status: 'partial', settlement: 'partial' }
  })
  expect(core.getElementComputedData('a')).toMatchObject({ x: 4, y: 5 })
  const fill = await invoke('api_fill_addFills', { elementIds: ['a'] })
  expect(fill.receipt).toMatchObject({
    status: 'complete',
    changed: true,
    acceptedIds: ['a']
  })
  const fillId = fill.receipt.value[0]
  const fillArgs = {
    updates: [{ elementId: 'a', fillId, patch: { opacity: 0.4 } }]
  }
  expect(
    (await invoke('api_fill_updateFillFieldsBatch', fillArgs)).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (await invoke('api_fill_updateFillFieldsBatch', fillArgs)).receipt
  ).toMatchObject({ status: 'no-change', changed: false })
  const stroke = await invoke('api_stroke_addStroke', { elementId: 'a' })
  expect(stroke.receipt).toMatchObject({ status: 'complete', changed: true })
  const strokeArgs = {
    updates: [
      { elementId: 'a', strokeId: stroke.receipt.value, patch: { width: 4 } }
    ]
  }
  expect(
    (await invoke('api_stroke_updateStrokeFieldsBatch', strokeArgs)).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (await invoke('api_stroke_updateStrokeFieldsBatch', strokeArgs)).receipt
  ).toMatchObject({ status: 'no-change', changed: false })
  for (const method of ['toggleElementLock', 'toggleElementVisible']) {
    expect(
      (await invoke(`api_element_${method}`, { elementId: 'a' })).receipt
    ).toMatchObject({ status: 'complete', changed: true })
    await invoke(`api_element_${method}`, { elementId: 'a' })
  }
  expect(
    (await invoke('api_element_resetElementSize', { elementId: 'a' })).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (await invoke('api_element_resetElementSize', { elementId: 'a' })).receipt
  ).toMatchObject({ status: 'no-change', changed: false })
  expect(
    (
      await invoke('api_element_changeElementGeometry', {
        elementId: 'a',
        geometry: { width: 20, height: 10 }
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  core.createElementsInParent(
    [{ id: 'b', type: 'rect', x: 0, y: 0, width: 20, height: 10 }],
    'workspace'
  )
  const otherFill = (await invoke('api_fill_addFills', { elementIds: ['b'] }))
    .receipt.value[0]
  expect(
    (
      await invoke('api_fill_updateFillsAtIndex', {
        elementIds: ['a'],
        index: 0,
        patch: { opacity: 0.6 }
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (
      await invoke('api_fill_updateFillsAtIndex', {
        elementIds: ['a'],
        index: 0,
        patch: { opacity: 0.6 }
      })
    ).receipt
  ).toMatchObject({ status: 'no-change', changed: false })
  expect(
    (
      await invoke('api_fill_shareFillAtIndex', {
        sourceElementId: 'a',
        elementIds: ['b'],
        index: 0
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (
      await invoke('api_fill_detachFillsAtIndex', {
        elementIds: ['b'],
        index: 0
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  const independentFill = (
    await invoke('api_fill_addFills', { elementIds: ['b'] })
  ).receipt.value[0]
  expect(
    (
      await invoke('api_fill_removeFills', {
        targets: [{ elementId: 'b', fillId: independentFill }]
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (
      await invoke('api_fill_updateGradientHandleAtClientPosition', {
        elementId: 'b',
        fillId: otherFill,
        handleIndex: 0,
        clientPos: { x: 1, y: 1 }
      })
    ).receipt
  ).toMatchObject({ status: 'failed', changed: false, unavailableIds: ['b'] })
  const gradientFill = (
    await invoke('api_fill_addFills', { elementIds: ['b'] })
  ).receipt.value[0]
  const gradientPrepared = await invoke('api_fill_updateFillFieldsBatch', {
    updates: [
      {
        elementId: 'b',
        fillId: gradientFill,
        patch: {
          kind: 'gradient',
          gradient: {
            gradientType: 'linear',
            gradientHandles: [
              { x: 0, y: 0 },
              { x: 1, y: 1 }
            ],
            gradientStops: [
              { position: 0, color: '#ffffff', opacity: 1 },
              { position: 1, color: '#000000', opacity: 1 }
            ]
          }
        }
      }
    ]
  })
  expect(gradientPrepared.receipt).toMatchObject({
    status: 'complete',
    changed: true
  })
  expect(core.getElementComputedData('b')).toMatchObject({
    width: 20,
    height: 10,
    fills: expect.arrayContaining([
      expect.objectContaining({
        kind: 'gradient',
        gradient: expect.objectContaining({ gradientType: 'linear' })
      })
    ])
  })
  const currentFills = (
    await invoke('api_core_getElementComputedData', { elementId: 'b' })
  ).receipt.value.fills as { id: string; kind: string }[]
  const currentGradientId = required(
    currentFills.find((fill) => fill.kind === 'gradient')
  ).id
  const handleArgs = {
    elementId: 'b',
    fillId: currentGradientId,
    handleIndex: 0,
    clientPos: { x: 5, y: 5 }
  }
  // Headless integration supplies only renderer coordinate projections; property writes remain real.
  const projections = [
    vi
      .spyOn(core, 'elementLocalToWorkspace')
      .mockImplementation((_id, position) => position),
    vi
      .spyOn(core, 'workspaceToElementLocal')
      .mockImplementation((_id, position) => position),
    vi
      .spyOn(core, 'workspaceToCanvas')
      .mockImplementation((position) => position),
    vi
      .spyOn(core, 'getMousePosInWorkspace')
      .mockImplementation(({ clientX, clientY }) => ({
        x: clientX,
        y: clientY
      }))
  ]
  try {
    expect(
      (
        await invoke(
          'api_fill_updateGradientHandleAtClientPosition',
          handleArgs
        )
      ).receipt
    ).toMatchObject({ status: 'complete', changed: true, acceptedIds: ['b'] })
    expect(
      (
        await invoke(
          'api_fill_updateGradientHandleAtClientPosition',
          handleArgs
        )
      ).receipt
    ).toMatchObject({ status: 'no-change', changed: false })
  } finally {
    projections.forEach((projection) => projection.mockRestore())
  }
  const extraStroke = (await invoke('api_stroke_addStroke', { elementId: 'b' }))
    .receipt.value
  expect(
    (
      await invoke('api_stroke_removeStroke', {
        elementId: 'b',
        strokeId: extraStroke
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (
      await invoke('api_stroke_removeStroke', {
        elementId: 'b',
        strokeId: extraStroke
      })
    ).receipt
  ).toMatchObject({ status: 'failed', changed: false })
  const vector = await invoke(
    'api_element_createVectorElementFromSinglePoint',
    { pointId: 'anchor-a', position: { x: 0, y: 0 } }
  )
  expect(vector.receipt).toMatchObject({ status: 'complete', changed: true })
  const vectorId = vector.receipt.value
  expect(
    (
      await invoke('api_element_setVectorClosed', {
        elementId: vectorId,
        closed: false
      })
    ).receipt
  ).toMatchObject({ status: 'no-change', changed: false })
  expect(
    (
      await invoke('api_element_updateVectorAnchorPointType', {
        elementId: vectorId,
        pointId: 'missing',
        type: 'sharp'
      })
    ).receipt
  ).toMatchObject({ status: 'failed', changed: false })
  const vectorCall = (method: string, args: Record<string, unknown> = {}) =>
    invoke(
      `api_element_${method}`,
      method === 'setVectorElementPositions'
        ? args
        : { elementId: vectorId, ...args }
    )
  expect(
    (
      await vectorCall('appendVectorAnchorPoint', {
        point: {
          id: 'anchor-b',
          x: 20,
          y: 10,
          type: 'sharp',
          inHandle: null,
          outHandle: null
        }
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  for (const [method, args] of [
    [
      'updateVectorAnchorPointPosition',
      { pointId: 'anchor-b', position: { x: 25, y: 15 } }
    ],
    ['updateVectorAnchorPointType', { pointId: 'anchor-b', type: 'smooth' }],
    [
      'setVectorAnchorPointHandleMode',
      { pointId: 'anchor-b', mode: 'mirror-angle' }
    ],
    [
      'updateVectorAnchorPointHandles',
      {
        updates: [
          {
            pointId: 'anchor-b',
            target: 'inHandle',
            position: { x: 20, y: 10 }
          }
        ]
      }
    ],
    [
      'updateVectorAnchorPointHandlePosition',
      { pointId: 'anchor-b', target: 'inHandle', position: { x: 18, y: 8 } }
    ],
    ['scaleVectorElementAroundCenter', { scale: { scaleX: 2, scaleY: 2 } }],
    [
      'setVectorElementPositions',
      { updates: [{ elementId: vectorId, position: { x: 30, y: 40 } }] }
    ]
  ] as const) {
    expect((await vectorCall(method, args)).receipt, method).toMatchObject({
      status: 'complete',
      changed: true
    })
    expect(
      (await vectorCall(method, args)).receipt,
      `${method} repeated`
    ).toMatchObject({
      status:
        method === 'scaleVectorElementAroundCenter' ? 'complete' : 'no-change'
    })
  }
  await vectorCall('appendVectorAnchorPoint', {
    point: {
      id: 'isolated',
      x: 30,
      y: 30,
      type: 'sharp',
      inHandle: null,
      outHandle: null
    },
    options: { startNewSubpath: true }
  })
  expect(
    (await vectorCall('removeLastSinglePointSubpath')).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (await vectorCall('removeLastSinglePointSubpath')).receipt
  ).toMatchObject({ status: 'no-change', changed: false })
  expect(
    (
      await vectorCall('connectVectorAnchorPoints', {
        sourcePointId: 'missing',
        targetPointId: 'anchor-b'
      })
    ).receipt
  ).toMatchObject({ status: 'failed', changed: false })
  expect(
    (
      await vectorCall('connectVectorAnchorEndpoints', {
        sourcePointId: 'missing',
        targetPointId: 'anchor-b'
      })
    ).receipt
  ).toMatchObject({ status: 'failed', changed: false })
  expect(
    (
      await vectorCall('splitVectorSegmentAtWorkspacePos', {
        segmentId: 'missing',
        workspacePos: { x: 1, y: 1 }
      })
    ).receipt
  ).toMatchObject({ status: 'failed', changed: false })
  for (const id of ['anchor-c', 'anchor-d'])
    expect(
      (
        await vectorCall('appendVectorAnchorPoint', {
          point: {
            id,
            x: 80,
            y: id === 'anchor-c' ? 60 : 80,
            type: 'sharp',
            inHandle: null,
            outHandle: null
          },
          options: { startNewSubpath: true }
        })
      ).receipt
    ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (
      await vectorCall('connectVectorAnchorEndpoints', {
        sourcePointId: 'anchor-b',
        targetPointId: 'anchor-c'
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  expect(
    (
      await vectorCall('connectVectorAnchorPoints', {
        sourcePointId: 'anchor-c',
        targetPointId: 'anchor-d'
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  const topology = (await vectorCall('getVectorTopology')).receipt.value
  const segment = (
    Object.values(topology.segments) as {
      id: string
      startId: string
      endId: string
    }[]
  ).find((entry) => entry.endId === 'anchor-d')
  if (!segment) throw new Error('Missing straight segment')
  const anchors = (await vectorCall('getVectorAnchorPoints')).receipt.value as {
    id: string
    x: number
    y: number
  }[]
  const start = anchors.find((point) => point.id === segment.startId)
  const end = anchors.find((point) => point.id === segment.endId)
  const curved = (
    Object.values(topology.segments) as {
      id: string
      startId: string
      endId: string
    }[]
  ).find((entry) => entry.endId === 'anchor-b')
  if (!start || !end || !curved) throw new Error('Missing split fixture')
  const curvedStart = anchors.find((point) => point.id === curved.startId)
  const curvedEnd = anchors.find((point) => point.id === curved.endId)
  if (!curvedStart || !curvedEnd) throw new Error('Missing curved endpoints')
  const beforeRejectedSplit = structuredClone(
    core.getElementComputedData(vectorId)
  )
  expect(() =>
    vectorApis.splitVectorSegmentAtWorkspacePos(vectorId, curved.id, {
      x: (curvedStart.x + curvedEnd.x) / 2,
      y: (curvedStart.y + curvedEnd.y) / 2
    })
  ).toThrow(/unrelated point records/)
  expect(core.getElementComputedData(vectorId)).toEqual(beforeRejectedSplit)
  const retained: AiBatchReceipt[] = []
  const add = actions.find((entry) => entry.name === 'api_fill_addFills')
  if (!add) throw new Error('Missing Fill action')
  const original = add.execute
  add.execute = vi.fn(original)
  const beforePrefix = core.getElementComputedData('a')?.fills?.length
  const runtime = createAiAgentRuntime({
    provider: {
      requestActionBatch: async (_input, options) => {
        retained.push(
          await required(options.executeBatch)({
            batchId: 'guarded-split',
            actions: [
              {
                id: 'split',
                name: 'api_element_splitVectorSegmentAtWorkspacePos',
                arguments: {
                  elementId: vectorId,
                  segmentId: curved.id,
                  workspacePos: {
                    x: (curvedStart.x + curvedEnd.x) / 2,
                    y: (curvedStart.y + curvedEnd.y) / 2
                  }
                },
                summary: 'Preserve the existing unrelated-record guard'
              }
            ]
          })
        )
        retained.push(
          await required(options.executeBatch)({
            batchId: 'prefix-failure',
            actions: [
              {
                id: 'prefix',
                name: add.name,
                arguments: { elementIds: ['a'] },
                summary: 'Add one Fill'
              },
              {
                id: 'missing',
                name: 'api_fill_updateFillFieldsBatch',
                arguments: {
                  updates: [
                    { elementId: 'missing', fillId: 'missing', patch: {} }
                  ]
                },
                summary: 'Reject an unavailable target'
              }
            ]
          })
        )
        return {
          batchId: 'read-recovery',
          actions: [
            {
              id: 'read',
              name: 'api_core_getElementComputedData',
              arguments: { elementId: 'a' },
              summary: 'Read acknowledged state without replay'
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
          intent: 'Verify non-Core recovery without replay',
          signal: new AbortController().signal
        })
      ).status
    ).toBe('executed')
    expect(retained[0]).toMatchObject({
      actionResults: [],
      failure: {
        actionId: 'split',
        settlement: 'not-started',
        code: 'AI_EXECUTION_FAILED'
      }
    })
    expect(core.getElementComputedData(vectorId)).toEqual(beforeRejectedSplit)
    expect(retained[1]).toMatchObject({
      actionResults: [
        { actionId: 'prefix', result: { status: 'complete', changed: true } }
      ],
      failure: { actionId: 'missing', settlement: 'not-started' }
    })
    expect(add.execute).toHaveBeenCalledOnce()
    expect(core.getElementComputedData('a')?.fills).toHaveLength(
      required(beforePrefix) + 1
    )
  } finally {
    await runtime.dispose()
  }
  expect(
    (
      await vectorCall('splitVectorSegmentAtWorkspacePos', {
        segmentId: segment.id,
        workspacePos: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
      })
    ).receipt
  ).toMatchObject({ status: 'complete', changed: true })
  const widthBefore = core.getElementComputedData('a')?.strokes?.[0]?.width
  await invoke('api_stroke_updateStrokeFieldsBatch', {
    updates: [
      { elementId: 'a', strokeId: stroke.receipt.value, patch: { width: 7 } }
    ]
  })
  factory.undo()
  expect(core.getElementComputedData('a')?.strokes?.[0]?.width).toBe(
    widthBefore
  )
  factory.redo()
  expect(core.getElementComputedData('a')?.strokes?.[0]?.width).toBe(7)
  const saved = {
    version: '1.0.0',
    props: props.save(),
    sceneTree: scene.save()
  }
  core.load(saved)
  expect({ props: props.save(), sceneTree: scene.save() }).toEqual({
    props: saved.props,
    sceneTree: saved.sceneTree
  })
  expect(
    (await vectorCall('removeVectorAnchorPoint', { pointId: 'anchor-b' }))
      .receipt
  ).toMatchObject({ status: 'complete', changed: true })
  const beforeInvalid = calls.length
  expect(await invoke('api_fill_addFills', { elementIds: 'a' })).toMatchObject({
    success: false,
    receipt: { code: 'PREPARATION_REJECTED', settlement: 'not-started' }
  })
  expect(calls).toHaveLength(beforeInvalid)
  const declared = basicApiContracts
    .filter((action) => action.result.kind === 'mutation-receipt')
    .map((action) => action.name)
  expect(declared).toHaveLength(31)
  expect(declared.filter((name) => !calls.includes(name))).toEqual([])
  const beforeCancelled = calls.length
  await expect(
    invoke('api_fill_addFills', { elementIds: ['a'] }, AbortSignal.abort())
  ).rejects.toThrow()
  expect(calls).toHaveLength(beforeCancelled)
})
