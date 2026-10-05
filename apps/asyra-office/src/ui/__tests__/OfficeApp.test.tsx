import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GraphicsDriver } from '@asyra/preset/spatial'
import { OfficeApp } from '../OfficeApp'

vi.mock('@asyra/preset/spatial', async (original) => {
  const module = await original<typeof import('@asyra/preset/spatial')>()
  return {
    ...module,
    ThreeEngine: class extends module.ThreeEngine {
      constructor() {
        const driver: GraphicsDriver = {
          domElement: document.createElement('canvas'),
          autoClear: true,
          setSize: vi.fn(),
          setPixelRatio: vi.fn(),
          setClearColor: vi.fn(),
          clear: vi.fn(),
          clearDepth: vi.fn(),
          render: vi.fn(),
          dispose: vi.fn()
        }
        super({
          createDriver: () => driver,
          requestFrame: () => 1,
          cancelFrame: vi.fn()
        })
      }
    }
  }
})
let root: Root
let host: HTMLDivElement
const settle = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10))
  })
}
const click = async (label: string, selector = 'button') => {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find(
    (element) =>
      element.textContent?.trim() === label ||
      element.getAttribute('aria-label') === label
  )
  if (!button) throw new Error('Missing UI control: ' + label)
  await act(async () => {
    button.click()
  })
  await settle()
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
    }
  )
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  localStorage.clear()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  await settle()
  host.remove()
  vi.unstubAllGlobals()
})
describe('Office UI controls with the real canonical runtime and a headless graphics driver', () => {
  it('starts a labeled task, rejects a work-time break and renders the completed event log', async () => {
    await act(async () => root.render(<OfficeApp />))
    await settle()
    expect(host.textContent).toContain('No runtime connected')
    await click('Start synthetic task')
    expect(host.textContent).toContain('Preparing the studio brief')
    expect(host.textContent).toContain('synthetic evidence')
    await click('Park break')
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'agent is working'
    )
    await click('Sources')
    await click('Completed')
    await click('Logs')
    expect(host.textContent).toContain('2 retained events')
    expect(host.textContent).toContain('Studio brief completed')
  })
  it('rejects stale proposal, supports cancel, and saves and restores a canonical edit', async () => {
    await act(async () => root.render(<OfficeApp />))
    await settle()
    await click('Layout')
    await click('Preview suggestion')
    await click('Right →')
    await click('Apply proposal')
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'changed since preview'
    )
    await click('Cancel')
    await click('Dismiss')
    await click('Save layout')
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      'Saved locally'
    )
    await click('Right →')
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      'Unsaved layout'
    )
    await click('Load saved')
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      'Saved locally'
    )
    expect(host.textContent).toContain('X -1, Z -1')
  })
})
