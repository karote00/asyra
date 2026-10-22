import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_TEXT_DATA } from '@asyra/preset'
import TextProperties from '../text'
const mocks = vi.hoisted(() => ({
  value: null as unknown,
  selection: new Set(['first']),
  update: vi.fn(),
  style: vi.fn()
}))
vi.mock('../../hooks', () => ({
  useProperty: (key: string) =>
    key === 'elementSelection' ? mocks.selection : mocks.value
}))
vi.mock('../../controllers/scene-tree', () => ({
  updateSelectedElementProperties: (...args: unknown[]) =>
    mocks.update(...args),
  updateSelectedTextStyle: (...args: unknown[]) => mocks.style(...args)
}))

describe('manual text editing', () => {
  afterEach(cleanup)
  beforeEach(() => {
    mocks.selection = new Set(['first'])
    mocks.value = { ...DEFAULT_TEXT_DATA, text: 'Heading' }
    mocks.update.mockClear()
    mocks.style.mockClear()
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

  it('commits typography choices immediately and exposes alignment state', () => {
    render(<TextProperties />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Font style' }), {
      target: { value: 'bold' }
    })
    expect(mocks.style).toHaveBeenCalledExactlyOnceWith({
      fontWeight: 'bold',
      fontStyle: 'normal'
    })
    mocks.update.mockClear()
    mocks.style.mockClear()
    const center = screen.getByRole('button', { name: 'Align center' })
    expect(center.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(center)
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith('textAlign', 'center')
  })

  it('combines bold and italic in one style update', () => {
    render(<TextProperties />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Font style' }), {
      target: { value: 'bold-italic' }
    })
    expect(mocks.style).toHaveBeenCalledExactlyOnceWith({
      fontWeight: 'bold',
      fontStyle: 'italic'
    })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('keeps IME confirmation inside a typography field', () => {
    render(<TextProperties />)
    const family = screen.getByRole('spinbutton', { name: 'Font size' })
    family.focus()
    fireEvent.change(family, { target: { value: '40' } })
    fireEvent.keyDown(family, { key: 'Enter', isComposing: true })
    expect(document.activeElement).toBe(family)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('selects a font family without free-form input', () => {
    render(<TextProperties />)
    expect(screen.queryByRole('textbox', { name: 'Font family' })).toBeNull()
    expect(
      screen
        .getByRole('combobox', { name: 'Font family' })
        .parentElement?.querySelector('svg')
    ).toBeNull()
    fireEvent.change(screen.getByRole('combobox', { name: 'Font family' }), {
      target: { value: 'serif' }
    })
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith('fontFamily', 'serif')
  })

  it('has no text controls without an editable text selection', () => {
    mocks.value = null
    render(<TextProperties />)
    expect(screen.queryByRole('textbox', { name: 'Content' })).toBeNull()
  })
})
