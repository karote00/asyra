// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { CommittedInput } from '../fields'

it('shows numeric validity while typing, keeps invalid text local, and commits a repaired value on Enter', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const commit = vi.fn()
  try {
    await act(() =>
      root.render(
        createElement(CommittedInput, {
          value: 20,
          type: 'number',
          min: 0,
          max: 100,
          validateOnCommit: true,
          onCommit: commit
        })
      )
    )
    const field = host.querySelector('input')
    if (!field) throw new Error('Missing input')
    const fill = async (text: string) =>
      act(() => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set?.call(field, text)
        field.dispatchEvent(new Event('input', { bubbles: true }))
      })
    await fill('-1')
    expect(field.getAttribute('aria-invalid')).toBe('true')
    expect(host.querySelector('[role="alert"]')?.textContent).toBeTruthy()
    expect(commit).not.toHaveBeenCalled()
    await act(() =>
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    )
    expect(commit).not.toHaveBeenCalled()
    expect(field.value).toBe('-1')
    await fill('25')
    expect(host.querySelector('[role="alert"]')).toBeNull()
    await act(() => field.focus())
    await act(() =>
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      )
    )
    expect(commit).toHaveBeenCalledExactlyOnceWith('25')
  } finally {
    await act(() => root.unmount())
    host.remove()
    vi.unstubAllGlobals()
  }
})

it('shows a cross-field diagnostic immediately without blocking a finite authored value', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const host = document.createElement('div')
  const root = createRoot(host)
  const commit = vi.fn()
  try {
    await act(() =>
      root.render(
        createElement(CommittedInput, {
          value: 0,
          type: 'number',
          validateOnCommit: true,
          onCommit: commit,
          diagnose: (text: string) =>
            Number(text) > 8 ? 'Outside the trajectory interval.' : ''
        })
      )
    )
    const field = host.querySelector('input')
    if (!field) throw new Error('Missing input')
    await act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set?.call(field, '9')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(
      'Outside the trajectory interval.'
    )
    await act(() =>
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    )
    expect(commit).toHaveBeenCalledExactlyOnceWith('9')
  } finally {
    await act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
