import { beforeEach, expect, it, vi } from 'vitest'
interface FixtureDefinition {
  priority: number
  exclusive: boolean
  session: {
    onStart: (snapshot: unknown) => unknown
    onEnd: (snapshot: unknown, state: unknown) => void
  }
  execution: (snapshot: unknown) => unknown
}
const mocks = vi.hoisted(() => ({
  definitions: new Map<string, FixtureDefinition>(),
  beginCreate: vi.fn(),
  beginEdit: vi.fn(),
  finish: vi.fn(),
  cancel: vi.fn(),
  getSnapshot: vi.fn(() => ({ elementId: 'text' })),
  getSelectedIds: vi.fn(() => ['text']),
  position: vi.fn((point: unknown) => point),
  moved: vi.fn(() => false),
  switchTool: vi.fn(),
  getRenderElementIdAtClientPos: vi.fn(() => 'text'),
  getElementType: vi.fn(() => 'text')
}))
vi.mock('@asyra/core', async (original) => ({
  ...(await original<typeof import('@asyra/core')>()),
  defineFeature: (name: string, _event: string, definition: unknown) => {
    mocks.definitions.set(name, definition as FixtureDefinition)
    return definition
  }
}))
vi.mock('../../../common-apis', () => ({
  elementApis: {
    getMousePosInWorkspace: mocks.position,
    hasMovedBeyondThreshold: mocks.moved,
    getRenderElementIdAtClientPos: mocks.getRenderElementIdAtClientPos,
    getElementType: mocks.getElementType
  },
  selectionApis: { getSelectedIds: mocks.getSelectedIds },
  systemContextApis: { switchPrimaryTool: mocks.switchTool },
  viewportApis: { getScale: () => 2 }
}))
vi.mock('../../../common-apis/text-canvas', () => ({
  textCanvasApis: {
    beginCreate: mocks.beginCreate,
    beginEdit: mocks.beginEdit,
    finish: mocks.finish,
    cancel: mocks.cancel,
    getSnapshot: mocks.getSnapshot
  }
}))
import { FeatureNames, PrimaryToolType } from '../../../constants'
import '../index'
beforeEach(() => vi.clearAllMocks())
it('owns Text gestures only and leaves provisional creation until release', () => {
  const feature = mocks.definitions.get(FeatureNames.CREATE_TEXT)
  if (!feature) throw new Error('Missing text feature')
  expect(feature.priority).toBeGreaterThan(10)
  expect(feature.exclusive).toBe(true)
  expect(
    feature.session.onStart({ primaryTool: PrimaryToolType.RECTANGLE })
  ).toBeNull()
  const snapshot = {
    primaryTool: PrimaryToolType.TEXT,
    mousePosition: { x: 30, y: 40 }
  }
  if (!feature) throw new Error('Missing text feature')
  const state = feature.session.onStart(snapshot)
  expect(mocks.beginCreate).not.toHaveBeenCalled()
  feature.session.onEnd(snapshot, state)
  expect(mocks.beginCreate).toHaveBeenCalledWith({
    x: 30,
    y: 40,
    width: 240,
    height: 80
  })
})
it('uses drag bounds and does not start an editor when interrupted', () => {
  const feature = mocks.definitions.get(FeatureNames.CREATE_TEXT)
  if (!feature) throw new Error('Missing text feature')
  const state = feature.session.onStart({
    primaryTool: PrimaryToolType.TEXT,
    mousePosition: { x: 30, y: 40 }
  })
  mocks.moved.mockReturnValueOnce(true)
  feature.session.onEnd({ mousePosition: { x: 130, y: 90 } }, state)
  expect(mocks.beginCreate).toHaveBeenCalledWith({
    x: 30,
    y: 40,
    width: 100,
    height: 50
  })
  mocks.beginCreate.mockClear()
  feature.session.onEnd({ detail: { cancelled: true } }, state)
  expect(mocks.beginCreate).not.toHaveBeenCalled()
})
it('routes double-click only to an ordinary text editing target', () => {
  const feature = mocks.definitions.get(FeatureNames.EDIT_TEXT)
  if (!feature) throw new Error('Missing text feature')
  feature.execution({
    primaryTool: PrimaryToolType.SELECT,
    mousePosition: { x: 10, y: 20 }
  })
  expect(mocks.beginEdit).toHaveBeenCalledWith('text')
  mocks.beginEdit.mockClear()
  mocks.getElementType.mockReturnValueOnce('group')
  expect(
    feature.execution({
      primaryTool: PrimaryToolType.SELECT,
      mousePosition: { x: 10, y: 20 }
    })
  ).toBeNull()
  expect(mocks.beginEdit).not.toHaveBeenCalled()
})

it('preserves the group child-selection step before editing nested text', () => {
  const feature = mocks.definitions.get(FeatureNames.EDIT_TEXT)
  if (!feature) throw new Error('Missing text feature')
  mocks.getSelectedIds.mockReturnValueOnce(['group'])
  expect(
    feature.execution({
      primaryTool: PrimaryToolType.SELECT,
      mousePosition: { x: 10, y: 20 }
    })
  ).toBeNull()
  expect(mocks.beginEdit).not.toHaveBeenCalled()
})
