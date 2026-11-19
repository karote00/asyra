import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import { EntityTypes } from '@asyra/utils'
import { runTransaction } from '@asyra/core'
import core from '../../contexts'
import { hierarchyApis } from '../../common-apis/hierarchy'
import { elementApis } from '../../common-apis/element'
import { historyApis } from '../../common-apis/history'
import {
  resolveCurrentCanvasHierarchyTarget,
  resolveContainerChildAtClientPos,
  type CanvasHierarchyElementDataMap
} from '../canvas-hierarchy-target'

beforeAll(async () => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.SELECTION,
      PresetDefaults.UI_CONTEXT
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
      id: 'group',
      type: EntityTypes.GROUP,
      x: 10,
      y: 20,
      width: 40,
      height: 40
    },
    'workspace'
  )
  core.createElementInParent(
    { id: 'leaf', type: 'rect', x: 5, y: 5, width: 10, height: 10 },
    'group'
  )
})
afterAll(async () => {
  vi.restoreAllMocks()
  await core.destroy()
})

it('reuses the real Preset projection and invalidates after reparent, history and document load', async () => {
  const original = hierarchyApis.getElementDataMap
  const views = new WeakMap<
    CanvasHierarchyElementDataMap,
    CanvasHierarchyElementDataMap
  >()
  let reads = 0

  vi.spyOn(hierarchyApis, 'getElementDataMap').mockImplementation(() => {
    const source = original()
    let view = views.get(source)

    if (!view) {
      view = new Proxy(source, {
        get(target, key, receiver) {
          reads++

          return Reflect.get(target, key, receiver)
        }
      })
      views.set(source, view)
    }

    return view
  })
  const snapshot = { keyMeta: false, keyCtrl: false }

  const query = () => resolveCurrentCanvasHierarchyTarget('leaf', snapshot)

  const saved = await core.save()
  const firstMap = original()

  expect(query()).toBe('group')
  reads = 0
  expect(query()).toBe('group')
  expect(reads).toBe(2)
  runTransaction(() =>
    core.moveElements({
      elementIds: ['leaf'],
      targetParentId: 'workspace',
      targetIndex: 1
    })
  )
  expect(original()).not.toBe(firstMap)
  expect(query()).toBe('leaf')
  await historyApis.undo({ mode: 'atomic' })
  expect(query()).toBe('group')
  await historyApis.redo({ mode: 'atomic' })
  expect(query()).toBe('leaf')
  core.load(saved)
  expect(query()).toBe('group')
  reads = 0
  expect(query()).toBe('group')
  expect(reads).toBe(2)
  vi.spyOn(elementApis, 'getRenderElementIdAtClientPos').mockReturnValue('leaf')
  expect(resolveContainerChildAtClientPos('group', { x: 5, y: 5 })).toBe('leaf')
  elementApis.setElementLock('group', true)
  expect(resolveContainerChildAtClientPos('group', { x: 5, y: 5 })).toBeNull()
  elementApis.setElementLock('group', false)
  expect(resolveContainerChildAtClientPos('group', { x: 5, y: 5 })).toBe('leaf')
  elementApis.setElementVisible('leaf', false)
  expect(resolveContainerChildAtClientPos('group', { x: 5, y: 5 })).toBeNull()
  elementApis.setElementVisible('leaf', true)
  expect(resolveContainerChildAtClientPos('group', { x: 5, y: 5 })).toBe('leaf')
})
