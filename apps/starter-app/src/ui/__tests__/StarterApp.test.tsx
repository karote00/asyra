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
      expect(host.textContent).toContain('Starter App')
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
