import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_TEXT_DATA } from '@asyra/preset'
import TextProperties from '../text'
const mocks = vi.hoisted(() => ({
  value: null as unknown,
  selection: new Set(['first']),
  update: vi.fn()
}))
vi.mock('../../hooks', () => ({
  useProperty: (key: string) =>
    key === 'elementSelection' ? mocks.selection : mocks.value
}))
vi.mock('../../controllers/scene-tree', () => ({
  updateSelectedElementProperties: (...args: unknown[]) => mocks.update(...args)
}))

describe('manual text editing', () => {
  afterEach(cleanup)
  beforeEach(() => {
    mocks.selection = new Set(['first'])
    mocks.value = { ...DEFAULT_TEXT_DATA, text: 'Heading' }
    mocks.update.mockClear()
  })
  it('commits content on blur rather than every keystroke', () => {
    render(<TextProperties />)
    const content = screen.getByRole('textbox', { name: 'Content' })
    fireEvent.change(content, { target: { value: 'New heading' } })
    expect(mocks.update).not.toHaveBeenCalled()
    fireEvent.blur(content)
    expect(mocks.update).toHaveBeenCalledWith('text', 'New heading')
  })
  it('discards an edit with Escape and rejects invalid typography', () => {
    render(<TextProperties />)
    const content = screen.getByRole('textbox', { name: 'Content' })
    fireEvent.change(content, { target: { value: 'Discard' } })
    fireEvent.keyDown(content, { key: 'Escape' })
    fireEvent.blur(content)
    const size = screen.getByRole('spinbutton', { name: 'Font size' })
    fireEvent.change(size, { target: { value: '-3' } })
    fireEvent.blur(size)
    expect(mocks.update).not.toHaveBeenCalled()
    expect(size.getAttribute('aria-invalid')).toBe('true')
  })
  it('discards uncommitted drafts when selection changes to identical text', () => {
    const view = render(<TextProperties />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Content' }), {
      target: { value: 'Uncommitted' }
    })
    mocks.selection = new Set(['second'])
    view.rerender(<TextProperties />)
    expect(
      (screen.getByRole('textbox', { name: 'Content' }) as HTMLTextAreaElement)
        .value
    ).toBe('Heading')
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('has no text controls without an editable text selection', () => {
    mocks.value = null
    render(<TextProperties />)
    expect(screen.queryByRole('textbox', { name: 'Content' })).toBeNull()
  })
})
