import { createAiActions } from '../../ai/actions'
import render from '@asyra/render'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import core from '../../contexts'
import { scaleElementAroundCenter } from '../element/scale'
import { designPropertyTools } from '../../ai/design-property-tools'
import { elementApis } from '../element'
import { historyApis } from '../history'

beforeAll(async () => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR
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
})
afterAll(() => core.destroy())

it('persists one Group transform while child dimensions survive scale, undo, redo and reload', async () => {
  const group = core.createElementInParent(
    { type: 'group', x: 30, y: 20, width: 10, height: 5 },
    'workspace'
  )
  const nested = core.createElementInParent(
    { type: 'group', x: 0, y: 0, width: 10, height: 5 },
    group
  )
  const leaf = core.createElementInParent(
    { type: 'rect', x: 0, y: 0, width: 10, height: 5 },
    nested
  )

  const local = () =>
    core.getElementComputedData(leaf, ['x', 'y', 'width', 'height'])

  const before = local()

  const extent = () => {
    const a = core.elementLocalToWorkspace(leaf, { x: 0, y: 0 })
    const b = core.elementLocalToWorkspace(leaf, { x: 10, y: 5 })

    if (!a || !b) {
      throw new Error('Missing rendered element')
    }

    return [b.x - a.x, b.y - a.y]
  }

  expect(extent()).toEqual([10, 5])
  expect(
    scaleElementAroundCenter(
      group,
      { scaleX: 2, scaleY: 3 },
      { undoable: true }
    )
  ).toMatchObject({ changed: true, acceptedIds: [group] })
  expect(
    core.getElementComputedData(group, ['scaleX', 'scaleY'])
  ).toMatchObject({ scaleX: 2, scaleY: 3 })
  render.updateLayers()
  expect(core.elementLocalToWorkspace(group, { x: 10, y: 5 })).toEqual({
    x: 45,
    y: 30
  })
  expect(extent()).toEqual([20, 15])
  expect(local()).toEqual(before)
  await historyApis.undo({ mode: 'atomic' })
  render.updateLayers()
  expect(extent()).toEqual([10, 5])
  await historyApis.redo({ mode: 'atomic' })
  const saved = await core.save()

  core.load(saved)
  expect(extent()).toEqual([20, 15])
  expect(local()).toEqual(before)
  elementApis.changeElementGeometry(group, { width: 40 })
  expect(local()).toMatchObject({ width: 40, height: 5 })
  expect(
    core.getElementComputedData(group, ['scaleX', 'scaleY'])
  ).toMatchObject({ scaleX: 2, scaleY: 3 })
})

it('rejects Frame dimensions through both geometry and low-level element/property tools', () => {
  const frame = core.createElementInParent(
    { type: 'frame', x: 0, y: 0, width: 20, height: 30 },
    'workspace'
  )
  const id = core.getElementData(frame)?.props?.dimension

  if (!id) {
    throw new Error('Expected a Frame dimension record')
  }

  const target = { elementId: frame, values: { width: -10 } }

  expect(() => elementApis.changeElementGeometry(frame, target.values)).toThrow(
    /Frame/
  )
  expect(() => designPropertyTools.updateElementProperties([target])).toThrow(
    /Frame/
  )
  expect(() =>
    designPropertyTools.patchElementProperties([{ ...target, records: [] }])
  ).toThrow(/Frame/)
  expect(() =>
    designPropertyTools.updatePropertyComponents([
      { propertyId: id, values: target.values }
    ])
  ).toThrow(/Frame/)
  expect(
    scaleElementAroundCenter(frame, { scaleX: 2, scaleY: 2 })
  ).toMatchObject({ changed: false, unavailableIds: [frame] })
  expect(core.getElementComputedData(frame, ['width', 'height'])).toMatchObject(
    { width: 20, height: 30 }
  )
})

it('applies the recorded Dome factor through the registered browser action', async () => {
  const id = core.createElementInParent(
    { type: 'group', x: 0, y: 0, width: 833, height: 300 },
    'workspace'
  )
  const leaf = core.createElementInParent(
    { type: 'rect', x: 0, y: 0, width: 833, height: 300 },
    id
  )
  const action = createAiActions().find(
    (owner) => owner.name === 'update_composition_elements'
  )

  if (!action) {
    throw new Error('Missing composition update')
  }

  expect(
    await action.execute(
      {
        updates: [{ elementId: id, geometry: { scaleX: 27.6, scaleY: 27.6 } }]
      },
      { signal: new AbortController().signal }
    )
  ).toMatchObject({ status: 'complete', appliedElementIds: [id], skipped: [] })
  render.updateLayers()
  const left = core.elementLocalToWorkspace(leaf, { x: 0, y: 0 })
  const right = core.elementLocalToWorkspace(leaf, { x: 833, y: 0 })

  if (!left || !right) {
    throw new Error('Missing rendered child')
  }

  expect(right.x - left.x).toBeCloseTo(833 * 27.6)
  expect(core.getElementComputedData(leaf, ['width'])).toMatchObject({
    width: 833
  })
})
