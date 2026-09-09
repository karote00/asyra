// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { ConfigurationEditor } from '../configuration-editor'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration,
  type FarmConfiguration
} from '../../domain/farm-configuration'
import type { FarmRuntime } from '../../runtime/bootstrap'

it('uses ordered 24px row icons and commits strip edits without an Apply action', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  let config = DEFAULT_CONFIGURATION
  const listeners = new Set<() => void>()
  const setConfiguration = vi.fn(async (next: FarmConfiguration) => {
    config = validateConfiguration(next)
    listeners.forEach((listener) => listener())
  })
  const runtime = {
    subscribeConfiguration: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getConfiguration: () => config,
    getUndoDepth: () => 0,
    getRedoDepth: () => 0,
    setConfiguration
  } as unknown as FarmRuntime
  const host = document.createElement('div'),
    root = createRoot(host)
  document.body.append(host)
  const button = (label: string) => {
    const value = host.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`
    )
    if (!value) throw new Error(`Missing ${label}`)
    return value
  }
  try {
    await act(async () =>
      root.render(<ConfigurationEditor runtime={runtime} />)
    )
    for (const input of host.querySelectorAll('input[type="number"]')) {
      expect(input.getAttribute('aria-description')).toBe('單位：公尺')
      expect(
        input.closest('.measurement-field')?.querySelector('.field-unit')
          ?.textContent
      ).toBe('m')
    }
    const row = button('Move strip 1 up').parentElement
    if (!row) throw new Error('Missing strip actions')
    expect(row.querySelectorAll('button').length).toBe(3)
    expect(
      [...row.querySelectorAll('button')].map((b) =>
        b.getAttribute('aria-label')
      )
    ).toEqual(['Move strip 1 up', 'Move strip 1 down', 'Remove strip 1'])
    for (const svg of row.querySelectorAll('svg')) {
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
      expect(svg.getAttribute('width')).toBe('24')
      expect(svg.getAttribute('height')).toBe('24')
    }
    expect(button('Move strip 1 up').disabled).toBe(true)
    expect(button('Move strip 7 down').disabled).toBe(true)
    expect(button('Remove strip 1').className).toContain('text-red-700')
    expect(
      button('Remove strip 1')
        .querySelector('path')
        ?.getAttribute('stroke-linecap')
    ).toBe('round')
    await act(async () => button('Move strip 2 up').click())
    expect(host.querySelector<HTMLSelectElement>('select')?.value).toBe('drain')
    await act(async () => button('Remove strip 1').click())
    expect(host.querySelectorAll('select').length).toBe(6)
    expect(host.querySelector<HTMLSelectElement>('select')?.value).toBe('soil')
    expect(setConfiguration).toHaveBeenCalledTimes(2)
    expect(host.textContent).not.toContain('套用設定')
    expect(host.textContent).not.toContain('查看陣列資料')
    const length = host.querySelector<HTMLInputElement>(
      'input[aria-label="溫室縱向深度"]'
    )
    const width = host.querySelector<HTMLInputElement>(
      'input[aria-label="單棟寬度"]'
    )
    if (!length || !width) throw new Error('Missing dimension fields')
    await act(async () => {
      length.value = '41'
      length.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      width.value = '8'
      width.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })
    expect(setConfiguration).toHaveBeenCalledTimes(4)
    expect(config.length).toBe(41)
    expect(config.width).toBe(8)
    expect(config.strips).toHaveLength(6)
    await act(async () => {
      length.value = ''
      length.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })
    expect(setConfiguration).toHaveBeenCalledTimes(4)
  } finally {
    await act(async () => root.unmount())
    host.remove()
    vi.unstubAllGlobals()
  }
})
