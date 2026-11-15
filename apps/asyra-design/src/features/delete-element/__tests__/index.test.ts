import type { SystemContextSnapshot } from '@asyra/utils'
import { beforeEach, expect, it, vi } from 'vitest'
import core from '../../../contexts'
import { FeatureNames } from '../../../constants'

const mocks = vi.hoisted(() => ({
  define: vi.fn(
    (
      _name: string,
      _event: string,
      definition: {
        execution: (snapshot: SystemContextSnapshot) => unknown
      }
    ) => definition
  ),
  selected: vi.fn(() => ['top']),
  select: vi.fn(),
  remove: vi.fn(() => true),
  rawHit: vi.fn((): string | null => 'bottom'),
  oldHit: vi.fn(() => 'bottom'),
  locked: vi.fn(() => false),
  visible: vi.fn(() => true),
  editing: vi.fn(() => false),
  path: vi.fn(() => null),
  publish: vi.fn(),
  target: vi.fn((id: string | null) => id)
}))

vi.mock('@asyra/core', async (original) => ({
  ...(await original<typeof import('@asyra/core')>()),
  defineFeature: mocks.define
}))
vi.mock('../../../common-apis', () => ({
  elementApis: {
    deleteElement: mocks.remove,
    getElementIdAtClientPos: mocks.oldHit,
    getRenderElementIdAtClientPos: mocks.rawHit,
    isElementLocked: mocks.locked,
    isElementVisible: mocks.visible
  },
  selectionApis: {
    getSelectedIds: mocks.selected,
    selectElements: mocks.select
  },
  systemContextApis: {
    getPathEditingMode: mocks.editing,
    getPathEditingVectorId: mocks.path,
    updateHoveredElementId: mocks.publish
  }
}))
vi.mock('../../../controllers/canvas-hierarchy-target', () => ({
  resolveCurrentCanvasHierarchyTarget: mocks.target
}))

import '..'

const definition = mocks.define.mock.calls.find(
  ([name]) => name === FeatureNames.DELETE_SELECTED_ELEMENT
)?.[2]

if (!definition) {
  throw new Error('Missing actual delete feature definition')
}

const execute = () => definition.execution(core.getSystemContextSnapshot())

beforeEach(() => {
  vi.clearAllMocks()
  mocks.remove.mockReturnValue(true)
  mocks.rawHit.mockReturnValue('bottom')
  mocks.locked.mockReturnValue(false)
  mocks.visible.mockReturnValue(true)
  mocks.editing.mockReturnValue(false)
  mocks.target.mockImplementation((id) => id)
})

it.each(['locked', 'hidden'] as const)(
  'does not publish the remaining %s element after deleting its occluder',
  (kind) => {
    mocks.locked.mockReturnValue(kind === 'locked')
    mocks.visible.mockReturnValue(kind !== 'hidden')
    execute()
    expect(mocks.publish).toHaveBeenCalledExactlyOnceWith(null)
  }
)

it('uses the same hierarchy target after deletion and clears selection only after success', () => {
  mocks.target.mockReturnValue('group')
  expect(execute()).toEqual({ deletedElementId: 'top' })
  expect(mocks.publish).toHaveBeenCalledExactlyOnceWith('group')
  expect(mocks.oldHit).not.toHaveBeenCalled()
  expect(mocks.select.mock.invocationCallOrder[0]).toBeGreaterThan(
    mocks.remove.mock.invocationCallOrder[0]
  )
})

it('preserves selection and hover when deletion is not accepted', () => {
  mocks.remove.mockReturnValue(false)
  expect(execute()).toBeNull()
  expect(mocks.select).not.toHaveBeenCalled()
  expect(mocks.publish).not.toHaveBeenCalled()
})

it('clears hover when no render target remains', () => {
  mocks.rawHit.mockReturnValue(null)
  execute()
  expect(mocks.publish).toHaveBeenCalledExactlyOnceWith(null)
})
