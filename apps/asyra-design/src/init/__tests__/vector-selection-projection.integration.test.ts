import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import {
  applyPreset,
  PresetDefaults,
  PresetProfiles,
  PresetSystemPropertyKeys
} from '@asyra/preset'
import type { SelectedVectorPointState } from '@asyra/core'
import core from '../../contexts'
import { selectionApis } from '../../common-apis/selection'
import { historyApis } from '../../common-apis/history'
import { transactionApis } from '../../common-apis/transaction'

beforeAll(async () => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR,
      PresetDefaults.SELECTION,
      PresetDefaults.VECTOR_EDITING
    ]
  })
  await core.start(document.createElement('div'), { width: 128, height: 128 })
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
  core.createElementInParent(
    {
      id: 'vector',
      type: 'vector',
      x: 10,
      y: 20,
      width: 40,
      height: 20,
      pointCoordinateSpace: 'workspace',
      points: {
        a: {
          id: 'a',
          kind: 'anchor',
          anchorType: 'sharp',
          handleMode: 'none',
          x: 10,
          y: 20
        },
        b: {
          id: 'b',
          kind: 'anchor',
          anchorType: 'sharp',
          handleMode: 'none',
          x: 50,
          y: 40
        },
        control: {
          id: 'control',
          kind: 'control',
          controlForId: 'a',
          controlRole: 'out',
          x: 25,
          y: 25
        }
      },
      segments: {
        segment: {
          id: 'segment',
          startId: 'a',
          endId: 'b',
          inControlId: null,
          outControlId: 'control'
        }
      },
      networks: {
        network: {
          id: 'network',
          closed: false,
          pointIds: ['a', 'b'],
          segmentIds: ['segment']
        }
      }
    },
    'workspace'
  )
  core.setSystemProperty(
    PresetSystemPropertyKeys.PATH_EDITING_VECTOR_ID,
    'vector'
  )
})
afterAll(() => core.destroy())

const selectedPoint = () =>
  core.getSystemProperty<SelectedVectorPointState | null>(
    PresetSystemPropertyKeys.SELECTED_VECTOR_POINT
  )

it('projects canonical point, handle and segment selections without an App mirror', () => {
  const updates: unknown[] = []
  const subscription = core
    .getSystemPropertyObservable<SelectedVectorPointState | null>(
      PresetSystemPropertyKeys.SELECTED_VECTOR_POINT
    )
    ?.subscribe((value) => updates.push(value))

  updates.length = 0
  selectionApis.selectVectorPoint({
    elementId: 'vector',
    pointId: 'a',
    target: 'anchor'
  })
  expect(selectedPoint()).toMatchObject({
    elementId: 'vector',
    pointId: 'a',
    index: 0,
    target: 'anchor',
    x: 10,
    y: 20,
    handleMode: 'none'
  })
  expect(updates).toHaveLength(1)
  selectionApis.selectVectorPoint({
    elementId: 'vector',
    pointId: 'a',
    target: 'outHandle'
  })
  expect(selectedPoint()).toMatchObject({ target: 'outHandle', x: 25, y: 25 })
  selectionApis.clearVectorPointSelection()
  selectionApis.selectVectorSegment({
    elementId: 'vector',
    segmentId: 'segment'
  })
  expect(selectedPoint()).toBeNull()
  expect(
    core.getUIProperty(PresetSystemPropertyKeys.SELECTED_VECTOR_SEGMENT)
  ).toEqual({ elementId: 'vector', segmentId: 'segment' })
  selectionApis.clearVectorSegmentSelection()
  expect(
    core.getSystemProperty(PresetSystemPropertyKeys.SELECTED_VECTOR_SEGMENT)
  ).toBeNull()
  subscription?.unsubscribe()
})

it('refreshes derived coordinates after geometry changes and real history replay', async () => {
  transactionApis.runTransaction(() =>
    selectionApis.selectVectorPoint({
      elementId: 'vector',
      pointId: 'a',
      target: 'anchor'
    })
  )
  transactionApis.runTransaction(() =>
    core.updateElementProperties([
      { elementId: 'vector', values: { x: 70, y: 80 } }
    ])
  )
  await expect.poll(selectedPoint).toMatchObject({ x: 70, y: 80 })
  await historyApis.undo({ mode: 'atomic' })
  expect(selectedPoint()).toMatchObject({ x: 10, y: 20 })
  await historyApis.redo({ mode: 'atomic' })
  expect(selectedPoint()).toMatchObject({ x: 70, y: 80 })
})

it('projects one geometry update once and ignores unrelated geometry', () => {
  const render = core.getPresetDependencies().render
  const projection = vi.spyOn(render, 'elementSourceToWorkspace')

  transactionApis.runTransaction(() =>
    core.updateElementProperties([{ elementId: 'vector', values: { x: 90 } }])
  )
  expect(selectedPoint()).toMatchObject({ x: 90, y: 80 })
  expect(projection).toHaveBeenCalledTimes(1)
  projection.mockClear()
  selectionApis.selectVectorPoint({
    elementId: 'vector',
    pointId: 'a',
    target: 'anchor'
  })
  expect(projection).not.toHaveBeenCalled()
  core.createElementInParent(
    { id: 'unrelated', type: 'rect', x: 10, y: 20, width: 30, height: 40 },
    'workspace'
  )
  projection.mockClear()
  core.updateElementProperties([{ elementId: 'unrelated', values: { x: 500 } }])
  expect(projection).not.toHaveBeenCalled()
  projection.mockRestore()
})

it('projects canonical topology changes and cleans up its runtime subscriptions', async () => {
  transactionApis.runTransaction(() =>
    core.patchElementProperties([
      {
        elementId: 'vector',
        records: [{ key: 'points', set: { a: { x: 15, y: 22 } } }]
      }
    ])
  )
  const expected = core.elementSourceToWorkspace('vector', { x: 15, y: 22 })

  if (!expected) {
    throw new Error('Selected canonical point must have a workspace projection')
  }

  expect(selectedPoint()).toMatchObject(expected)
  const observer = vi.fn()
  const subscription = core
    .getSystemPropertyObservable<SelectedVectorPointState | null>(
      PresetSystemPropertyKeys.SELECTED_VECTOR_POINT
    )
    ?.subscribe(observer)

  observer.mockClear()
  await core.destroy()
  expect(observer).not.toHaveBeenCalled()
  subscription?.unsubscribe()
})
