import { DEFAULT_TEXT_DATA, TextSizing } from '@asyra/preset'
import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  getElementData: vi.fn(),
  getElementComputedData: vi.fn(),
  getCurrentWorkspaceId: vi.fn(() => 'workspace'),
  measureText: vi.fn((layout: { width?: number }) => ({
    width: layout.width ?? 45,
    height: 40
  })),
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
import { projectTextLayoutUpdate } from '../text-layout'
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
    ...DEFAULT_TEXT_DATA,
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

it('reuses the measured draft for the editor and the single canonical commit', () => {
  textCanvasApis.beginCreate(
    { x: 10, y: 20, width: 1, height: 1 },
    TextSizing.AUTO_WIDTH
  )
  mocks.measureText.mockClear()
  expect(textCanvasApis.updateDraft('Two\nlines')).toEqual({
    x: 10,
    y: 20,
    width: 45,
    height: 40
  })
  textCanvasApis.updateDraft('Two\nlines')
  textCanvasApis.finish('Two\nlines')
  expect(mocks.measureText).toHaveBeenCalledTimes(1)
  expect(mocks.createElementInParent).toHaveBeenCalledWith(
    expect.objectContaining({
      text: 'Two\nlines',
      textSizing: TextSizing.AUTO_WIDTH,
      width: 45,
      height: 40
    }),
    'workspace'
  )
  expect(mocks.runTransaction).toHaveBeenCalledTimes(1)
})
it('remeasures changed content and disposes measurements between sessions', () => {
  textCanvasApis.beginCreate(
    { x: 0, y: 0, width: 100, height: 80 },
    TextSizing.AUTO_HEIGHT
  )
  textCanvasApis.updateDraft('Long text')
  expect(mocks.measureText).toHaveBeenLastCalledWith(
    expect.objectContaining({ width: 100, text: 'Long text' })
  )
  textCanvasApis.updateDraft('Short')
  expect(mocks.measureText).toHaveBeenCalledTimes(3)
  textCanvasApis.cancel()
  expect(textCanvasApis.updateDraft('Ignored')).toBeNull()
  textCanvasApis.beginCreate(
    { x: 0, y: 0, width: 1, height: 1 },
    TextSizing.AUTO_WIDTH
  )
  expect(mocks.measureText).toHaveBeenCalledTimes(4)
})

it('keeps automatic sizing when typography changes and makes explicit dimensions authoritative', () => {
  mocks.getElementComputedData.mockReturnValue({
    ...DEFAULT_TEXT_DATA,
    text: 'Hello',
    textSizing: TextSizing.AUTO_WIDTH,
    width: 100,
    height: 20
  })
  expect(projectTextLayoutUpdate('text', { fontSize: 32 })).toEqual({
    fontSize: 32,
    textSizing: TextSizing.AUTO_WIDTH,
    width: 45,
    height: 40
  })
  expect(projectTextLayoutUpdate('text', { width: 150 })).toEqual({
    width: 150,
    height: 40,
    textSizing: TextSizing.AUTO_HEIGHT
  })
  expect(projectTextLayoutUpdate('text', { height: 80 })).toEqual({
    height: 80,
    textSizing: TextSizing.FIXED
  })
  mocks.measureText.mockClear()
  expect(projectTextLayoutUpdate('text', { x: 15 })).toEqual({ x: 15 })
  expect(projectTextLayoutUpdate('text', { textAlign: 'center' })).toEqual({
    textAlign: 'center'
  })
  expect(mocks.measureText).not.toHaveBeenCalled()
})

it('publishes a shared draft without replacing the session or committing canonical text', () => {
  textCanvasApis.beginEdit('text-1', 'panel')
  const session = textCanvasApis.getSnapshot()
  const listener = vi.fn()
  const unsubscribe = textCanvasApis.subscribe(listener)
  textCanvasApis.updateDraft('Live draft')
  const draft = textCanvasApis.getDraftSnapshot()
  expect(textCanvasApis.getSnapshot()).toBe(session)
  expect(textCanvasApis.getDraftText('text-1')).toBe('Live draft')
  expect(textCanvasApis.getDraftText('other')).toBeNull()
  expect(listener).toHaveBeenCalledTimes(1)
  textCanvasApis.updateDraft('Live draft')
  expect(textCanvasApis.getDraftSnapshot()).toBe(draft)
  expect(listener).toHaveBeenCalledTimes(1)
  expect(mocks.updateElementProperties).not.toHaveBeenCalled()
  expect(mocks.runTransaction).not.toHaveBeenCalled()
  textCanvasApis.cancel()
  expect(textCanvasApis.getDraftSnapshot()).toBeNull()
  expect(textCanvasApis.getDraftText('text-1')).toBeNull()
  expect(listener).toHaveBeenCalledTimes(2)
  unsubscribe()
})

it('retains a shared draft when stale-target admission rejects its commit', () => {
  textCanvasApis.beginEdit('text-1', 'panel')
  textCanvasApis.updateDraft('Local draft')
  const draft = textCanvasApis.getDraftSnapshot()
  mocks.getElementComputedData.mockReturnValue({
    ...DEFAULT_TEXT_DATA,
    text: 'Remote'
  })
  textCanvasApis.finish('Local draft')
  expect(textCanvasApis.getDraftSnapshot()).toBe(draft)
  expect(textCanvasApis.getDraftText('text-1')).toBe('Local draft')
  expect(mocks.updateElementProperties).not.toHaveBeenCalled()
})
