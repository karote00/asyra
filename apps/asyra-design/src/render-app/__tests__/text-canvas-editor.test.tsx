import { act, fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  current: null as unknown,
  draft: null as {
    text: string
    bounds: { x: number; y: number; width: number; height: number }
  } | null,
  listeners: new Set<() => void>(),
  frame: undefined as (() => void) | undefined,
  publication: undefined as (() => void) | undefined,
  load: undefined as (() => void) | undefined,
  resumePresentation: vi.fn(),
  suspendElementPresentation: vi.fn(),
  cancel: vi.fn(),
  finish: vi.fn(),
  updateDraft: vi.fn((_text?: string) => ({
    x: 0,
    y: 0,
    width: 40,
    height: 20
  })),
  isCurrent: vi.fn(() => true),
  unsubscribe: vi.fn(),
  subscribe: vi.fn((_listener?: () => void) => vi.fn()),
  elementLocalToWorkspace: vi.fn(
    (_id: string, p: { x: number; y: number }) => ({
      x: 100 - p.y,
      y: 50 + p.x
    })
  ),
  workspaceToCanvas: vi.fn((p: { x: number; y: number }) => ({
    x: p.x * 2 + 10,
    y: p.y * 2 + 20
  }))
}))
vi.mock('@asyra/core', async (original) => ({
  ...(await original<typeof import('@asyra/core')>()),
  getFeature: () => ({ finish: mocks.finish, cancel: mocks.cancel }),
  subscribeToFileLoadComplete: (fn: () => void) => {
    mocks.load = fn
    return { unsubscribe: mocks.unsubscribe }
  }
}))
vi.mock('../../contexts', () => ({
  default: {
    suspendElementPresentation: mocks.suspendElementPresentation,
    elementLocalToWorkspace: mocks.elementLocalToWorkspace,
    workspaceToCanvas: mocks.workspaceToCanvas,
    subscribeToFrameComplete: (fn: () => void) => {
      mocks.frame = fn
      return mocks.unsubscribe
    },
    subscribeToSharedPublication: (fn: () => void) => {
      mocks.publication = fn
      return mocks.unsubscribe
    }
  }
}))
vi.mock('../../common-apis/text-canvas', () => ({
  textCanvasApis: {
    getSnapshot: () => mocks.current,
    getDraftSnapshot: () => mocks.draft,
    subscribe: mocks.subscribe,
    cancel: mocks.cancel,
    isCurrent: mocks.isCurrent,
    updateDraft: mocks.updateDraft
  }
}))
import { TextCanvasEditor } from '../text-canvas-editor'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.draft = null
  mocks.listeners.clear()
  mocks.subscribe.mockImplementation((listener?: () => void) => {
    if (listener) mocks.listeners.add(listener)
    return vi.fn(() => {
      if (listener) mocks.listeners.delete(listener)
    })
  })
  mocks.updateDraft.mockImplementation((text?: string) => {
    const bounds = { x: 0, y: 0, width: 40, height: 20 }
    mocks.draft = { text: text ?? '', bounds }
    mocks.listeners.forEach((listener) => listener())
    return bounds
  })
  mocks.suspendElementPresentation.mockReturnValue(mocks.resumePresentation)
  mocks.current = {
    elementId: 'text',
    workspaceId: 'workspace',
    bounds: { x: 0, y: 0, width: 200, height: 80 },
    typography: {
      text: 'Hello',
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: 'normal',
      lineHeight: 20,
      letterSpacing: 0,
      textAlign: 'left'
    },
    baseline: ''
  }
})
afterEach(cleanup)
it('uses the full affine transform and does no canonical validation on unchanged frames', () => {
  const view = render(<TextCanvasEditor />)
  const input = screen.getByRole('textbox')
  expect(input.style.transform).toBe('matrix(0,2,-2,0,210,120)')
  act(() => {
    for (let i = 0; i < 10; i++) mocks.frame?.()
  })
  expect(mocks.elementLocalToWorkspace).toHaveBeenCalledTimes(33)
  expect(mocks.isCurrent).not.toHaveBeenCalled()
  act(() => mocks.publication?.())
  expect(mocks.isCurrent).toHaveBeenCalledTimes(1)
  view.unmount()
  expect(mocks.unsubscribe).toHaveBeenCalledTimes(3)
})
it('renders only the text input without an editing hint or close button', () => {
  const view = render(<TextCanvasEditor />)
  expect(view.container.children).toHaveLength(1)
  expect(view.container.firstElementChild).toBe(screen.getByRole('textbox'))
  expect(screen.getByRole('textbox').hasAttribute('aria-describedby')).toBe(
    false
  )
})
it('keeps composing Enter local and commits the complete native draft afterwards', () => {
  render(<TextCanvasEditor />)
  const input = screen.getByRole('textbox')
  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '台灣' } })
  fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })
  expect(mocks.finish).not.toHaveBeenCalled()
  fireEvent.compositionEnd(input)
  fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })
  expect(mocks.finish).toHaveBeenCalledWith('台灣')
})
it('retains a stale draft for copying and prevents blur from committing it', () => {
  render(<TextCanvasEditor />)
  mocks.isCurrent.mockReturnValueOnce(false)
  act(() => mocks.publication?.())
  expect(
    screen.getByRole('textbox').getAttribute('aria-description')
  ).toContain('changed')
  expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true')
  expect(screen.queryByRole('button')).toBeNull()
  fireEvent.blur(screen.getByRole('textbox'))
  expect(mocks.finish).not.toHaveBeenCalled()
})
it('cancels transient state when a new document is loaded', () => {
  render(<TextCanvasEditor />)
  act(() => mocks.load?.())
  expect(mocks.cancel).toHaveBeenCalled()
})

it('commits an outside pointer before the clicked target handles its action', () => {
  render(<TextCanvasEditor />)
  const calls: string[] = []
  mocks.finish.mockImplementationOnce(() => calls.push('commit'))
  const button = document.createElement('button')
  document.body.append(button)
  button.addEventListener('pointerdown', () => calls.push('target'))
  fireEvent.pointerDown(button)
  expect(calls).toEqual(['commit', 'target'])
  button.remove()
})

it('uses measured draft bounds and does not measure again on viewport frames', () => {
  render(<TextCanvasEditor />)
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: 'Small' } })
  expect(input.style.width).toBe('40px')
  expect(input.style.height).toBe('20px')
  act(() => {
    for (let i = 0; i < 10; i++) mocks.frame?.()
  })
  expect(mocks.updateDraft).toHaveBeenCalledExactlyOnceWith('Small')
})

it('suspends the canonical glyph projection only for the native editing lifetime', () => {
  const view = render(<TextCanvasEditor />)
  expect(mocks.suspendElementPresentation).toHaveBeenCalledExactlyOnceWith(
    'text'
  )
  view.unmount()
  expect(mocks.resumePresentation).toHaveBeenCalledTimes(1)
})

it('projects panel drafts without taking focus or restarting presentation ownership', () => {
  const panelInput = document.createElement('textarea')
  document.body.append(panelInput)
  panelInput.focus()
  mocks.current = { ...(mocks.current as object), inputSurface: 'panel' }
  const view = render(<TextCanvasEditor />)
  expect(document.activeElement).toBe(panelInput)
  act(() => {
    mocks.updateDraft('Panel preview')
  })
  expect(
    (
      screen.getByRole('textbox', {
        name: 'Canvas text editor'
      }) as HTMLTextAreaElement
    ).value
  ).toBe('Panel preview')
  expect(document.activeElement).toBe(panelInput)
  expect(mocks.suspendElementPresentation).toHaveBeenCalledTimes(1)
  expect(mocks.resumePresentation).not.toHaveBeenCalled()
  view.unmount()
  panelInput.remove()
})
