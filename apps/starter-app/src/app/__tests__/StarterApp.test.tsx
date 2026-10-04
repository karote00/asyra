import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StarterApp } from '../index.js'

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
  it('keeps single-step history available without a UI history counter', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    try {
      await act(async () => {
        root.render(<StarterApp />)
      })
      const buttons = [...host.querySelectorAll('button')]
      const redo = buttons.find((button) => button.textContent === 'Redo')
      if (!redo) throw new Error('Redo control missing')
      expect(host.textContent).toContain('Ready')
      expect(redo.disabled).toBe(false)
      await act(async () => {
        redo.click()
      })
      expect(host.querySelectorAll('.item-line')).toHaveLength(0)
      expect(host.querySelector('[role="status"]')?.textContent).toBe(
        'Redo requested'
      )
    } finally {
      await act(async () => {
        root.unmount()
      })
      host.remove()
    }
  })

  it('reports a storage error by state even when its text contains unsaved changes', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('unsaved changes - 儲存空間無法使用')
      }
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    try {
      await act(async () => {
        root.render(<StarterApp />)
      })
      expect(host.querySelector('[role="status"]')?.className).toContain(
        'error'
      )
    } finally {
      await act(async () => {
        root.unmount()
      })
      host.remove()
      if (descriptor) Object.defineProperty(window, 'localStorage', descriptor)
    }
  })
  it('supports React strict effects without duplicate App registrations', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <StarterApp />
          </StrictMode>
        )
      })
      expect(host.textContent).toContain('Ready')
    } finally {
      await act(async () => {
        root.unmount()
      })
      host.remove()
    }
  })
})
