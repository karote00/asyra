import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ tool: 'select', switch: vi.fn() }))
vi.mock('../../providers', () => ({ usePrimaryTool: () => mocks.tool }))
vi.mock('../../controllers/app', () => ({ switchPrimaryTool: mocks.switch }))
vi.mock('../reset-stored-document', () => ({ resetStoredDocument: vi.fn() }))
import ToolButton from '../tool-button'

describe('Text toolbar entry', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    mocks.tool = 'select'
  })

  it('shows a T SVG and switches through the existing tool controller', () => {
    const view = render(<ToolButton />)
    const button = screen.getByRole('button', { name: 'Text', exact: true })
    expect(button.querySelector('svg')).not.toBeNull()
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(mocks.switch).toHaveBeenCalledExactlyOnceWith('text')
    mocks.tool = 'text'
    view.rerender(<ToolButton />)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('data-active')).toBe('true')
  })
})
