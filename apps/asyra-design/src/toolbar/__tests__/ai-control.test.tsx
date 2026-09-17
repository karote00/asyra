import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../tool-button', () => ({
  default: () => <div data-testid="tool-controls" />
}))

vi.mock('../theme-toggle', () => ({
  default: () => <div data-testid="theme-control" />
}))

vi.mock('../zoom', () => ({
  default: () => <div data-testid="zoom-control" />
}))

import ToolBar from '..'
import { documentInteractionLock } from '../../ai/document-interaction-lock'

describe('AI Agent toolbar activation', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps toggle activation available while locked and restores ordinary shortcuts when unlocked', () => {
    const toggle = vi.fn()
    render(<ToolBar aiOpen={false} onAiToggle={toggle} />)
    const button = screen.getByRole('button', { name: 'Open Agent' })
    const shortcut = vi.fn()
    document.addEventListener('keydown', shortcut)
    const release = documentInteractionLock.acquire()
    try {
      fireEvent.click(button)
      expect(toggle).toHaveBeenCalledOnce()
      fireEvent.keyDown(button, { key: 'r', code: 'KeyR' })
      expect(shortcut).not.toHaveBeenCalled()
      release()
      fireEvent.keyDown(button, { key: 'r', code: 'KeyR' })
      expect(shortcut).toHaveBeenCalledOnce()
    } finally {
      release()
      document.removeEventListener('keydown', shortcut)
    }
  })

  it('always exposes the labelled toggle for the App-owned Agent', () => {
    const onAiToggle = vi.fn()
    const { rerender } = render(
      <ToolBar aiOpen={false} onAiToggle={onAiToggle} />
    )

    const button = screen.getByRole('button', { name: 'Open Agent' })
    expect(screen.getByTestId('ai-agent-toolbar-button')).toBe(button)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(button)
    expect(onAiToggle).toHaveBeenCalledWith(button)

    rerender(<ToolBar aiOpen onAiToggle={onAiToggle} />)
    expect(screen.getByRole('button', { name: 'Close Agent' })).toBeTruthy()
  })
})
