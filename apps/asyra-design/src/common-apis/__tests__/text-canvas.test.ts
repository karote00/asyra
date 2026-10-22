import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  getElementData: vi.fn(),
  getElementComputedData: vi.fn(),
  getCurrentWorkspaceId: vi.fn(() => 'workspace'),
  createElementInParent: vi.fn(() => 'new-text'),
  updateElementProperties: vi.fn(),
  selectElements: vi.fn(),
  switchPrimaryTool: vi.fn(),
  runTransaction: vi.fn((fn: () => unknown) => fn())
}))
vi.mock('../../contexts', () => ({ default: mocks }))
vi.mock('../selection', () => ({ selectionApis: mocks }))
vi.mock('../system-context', () => ({ systemContextApis: mocks }))
vi.mock('@asyra/core', async (original) => ({
  ...(await original<typeof import('@asyra/core')>()),
  runTransaction: mocks.runTransaction
}))
import { textCanvasApis } from '../text-canvas'

beforeEach(() => {
  vi.clearAllMocks()
  textCanvasApis.cancel()
  mocks.getElementData.mockReturnValue({
    type: 'text',
    visible: true,
    lock: false
  })
  mocks.getElementComputedData.mockReturnValue({
    text: 'Before',
    width: 200,
    height: 80
  })
})
it('keeps new text provisional and commits one canonical creation', () => {
  textCanvasApis.beginCreate({ x: 20, y: 30, width: 240, height: 80 })
  expect(mocks.createElementInParent).not.toHaveBeenCalled()
  textCanvasApis.finish('Hello')
  expect(mocks.runTransaction).toHaveBeenCalledTimes(1)
  expect(mocks.createElementInParent).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'text', text: 'Hello', x: 20, y: 30 }),
    'workspace'
  )
  expect(mocks.selectElements).toHaveBeenCalledWith(['new-text'])
})
it('empty creation and cancellation leave canonical history untouched', () => {
  textCanvasApis.beginCreate({ x: 20, y: 30, width: 240, height: 80 })
  textCanvasApis.finish('')
  textCanvasApis.beginCreate({ x: 20, y: 30, width: 240, height: 80 })
  textCanvasApis.cancel()
  expect(mocks.runTransaction).not.toHaveBeenCalled()
  expect(mocks.createElementInParent).not.toHaveBeenCalled()
})
it('changes only content and allows clearing an existing object', () => {
  textCanvasApis.beginEdit('text-1')
  textCanvasApis.finish('')
  expect(mocks.updateElementProperties).toHaveBeenCalledWith([
    { elementId: 'text-1', values: { text: '' } }
  ])
  expect(mocks.runTransaction).toHaveBeenCalledTimes(1)
})
it('rejects stale content without overwriting a newer value', () => {
  textCanvasApis.beginEdit('text-1')
  mocks.getElementComputedData.mockReturnValue({
    text: 'Remote',
    width: 200,
    height: 80
  })
  textCanvasApis.finish('Local')
  expect(mocks.updateElementProperties).not.toHaveBeenCalled()
  expect(textCanvasApis.getSnapshot()?.error).toContain('changed')
})
it('rejects locked or hidden editing targets', () => {
  mocks.getElementData.mockReturnValue({
    type: 'text',
    lock: true,
    visible: true
  })
  textCanvasApis.beginEdit('text-1')
  expect(textCanvasApis.getSnapshot()).toBeNull()
})
it('does not commit an unchanged existing draft', () => {
  textCanvasApis.beginEdit('text-1')
  textCanvasApis.finish('Before')
  expect(mocks.runTransaction).not.toHaveBeenCalled()
})

it('uses the app default Fill for newly authored text', () => {
  textCanvasApis.beginCreate({ x: 0, y: 0, width: 240, height: 80 })
  textCanvasApis.finish('Visible text')
  expect(mocks.createElementInParent.mock.calls[0][0].fills[0].color).toBe(
    '#cccccc'
  )
})
