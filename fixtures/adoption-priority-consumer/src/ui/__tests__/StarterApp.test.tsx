import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { StarterApp } from '../StarterApp.js'

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('StarterApp storage failures', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an error instead of a blank screen when browser storage is denied', async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'localStorage'
    )
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage denied', 'SecurityError')
      }
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)

    try {
      await act(async () => {
        root.render(<StarterApp />)
      })

      expect(host.textContent).toContain('Storage denied')
      expect(host.textContent).toContain('Item board')
    } finally {
      await act(async () => {
        root.unmount()
      })
      host.remove()
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    }
  })
})

describe('StarterApp priority control', () => {
  it('edits the selected Item and follows Undo and Redo', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const settle = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    }
    const click = async (label: string) => {
      const button = [...host.querySelectorAll('button')].find(
        (candidate) => candidate.textContent?.trim() === label
      )
      expect(button, `Missing button ${label}`).toBeTruthy()
      await act(async () => button?.click())
      await settle()
    }

    try {
      await act(async () => root.render(<StarterApp />))
      await settle()
      await click('＋ Add item')
      expect(host.querySelector('[aria-label="Priority"]')).toBeTruthy()
      await click('High')
      expect(
        host.querySelector('[aria-label="Priority"] [aria-pressed="true"]')
          ?.textContent
      ).toBe('High')
      await click('Undo')
      expect(
        host.querySelector('[aria-label="Priority"] [aria-pressed="true"]')
          ?.textContent
      ).toBe('Normal')
      await click('Redo')
      expect(
        host.querySelector('[aria-label="Priority"] [aria-pressed="true"]')
          ?.textContent
      ).toBe('High')
    } finally {
      await act(async () => root.unmount())
      host.remove()
    }
  })
})
