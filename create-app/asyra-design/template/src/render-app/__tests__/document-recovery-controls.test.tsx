import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { DocumentRecoveryControls } from '../document-recovery-controls'

it('keeps failed recovery actionable and reopens only after durable preparation settles', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const reopen = vi.fn()
  let finish!: () => void
  const session = {
    prepareRecovery: vi
      .fn()
      .mockRejectedValueOnce(new Error('Still invalid'))
      .mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve
          })
      ),
    whenIdle: vi.fn(async () => undefined),
    hasUnpersistedChanges: () => false,
    getRecoveryDocument: () => ({ version: '1.0.0', props: {}, sceneTree: {} })
  }
  await act(async () => {
    root.render(<DocumentRecoveryControls session={session} reopen={reopen} />)
  })
  const retry = host.querySelector('button') as HTMLButtonElement
  await act(async () => {
    retry.click()
  })
  expect(host.textContent).toContain('Still invalid')
  expect(reopen).not.toHaveBeenCalled()
  await act(async () => {
    retry.click()
  })
  expect(retry.disabled).toBe(true)
  expect(reopen).not.toHaveBeenCalled()
  await act(async () => {
    finish()
  })
  expect(reopen).toHaveBeenCalledOnce()
  await act(async () => root.unmount())
  host.remove()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false })
})

it('waits for queued retention before exporting the current recovery document', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  let finish!: () => void
  const getRecoveryDocument = vi.fn(() => undefined)
  const session = {
    prepareRecovery: vi.fn(async () => undefined),
    whenIdle: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    ),
    hasUnpersistedChanges: () => false,
    getRecoveryDocument
  }
  try {
    await act(async () =>
      root.render(
        <DocumentRecoveryControls session={session} reopen={vi.fn()} />
      )
    )
    await act(async () =>
      (host.querySelectorAll('button')[1] as HTMLButtonElement).click()
    )
    expect(getRecoveryDocument).not.toHaveBeenCalled()
    await act(async () => finish())
    expect(getRecoveryDocument).toHaveBeenCalledOnce()
    expect(host.textContent).toContain('Keep this tab open')
  } finally {
    await act(async () => root.unmount())
    host.remove()
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false })
  }
})

it('keeps a new active edit in the current page until recovery can safely reopen', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const reopen = vi.fn()
  let finish!: () => void
  let editing = false
  const session = {
    prepareRecovery: vi.fn(async () => undefined),
    whenIdle: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    ),
    hasUnpersistedChanges: () => editing,
    getRecoveryDocument: () => undefined
  }
  try {
    await act(async () =>
      root.render(
        <DocumentRecoveryControls session={session} reopen={reopen} />
      )
    )
    const retry = host.querySelector('button') as HTMLButtonElement
    await act(async () => retry.click())
    editing = true
    await act(async () => finish())
    expect(reopen).not.toHaveBeenCalled()
    expect(host.textContent).toContain('Keep this tab open')
    expect(retry.disabled).toBe(false)
    editing = false
    await act(async () => retry.click())
    await act(async () => finish())
    expect(reopen).toHaveBeenCalledOnce()
  } finally {
    await act(async () => root.unmount())
    host.remove()
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false })
  }
})
