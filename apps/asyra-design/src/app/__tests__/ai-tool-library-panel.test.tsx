import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AiToolLibraryPanel } from '../ai-tool-library-panel'
import { ToolLibraryManagement } from '../../ai/tool-library-management'
const inventory = (availability = 'eligible', version = 'observed') => ({
  entries: [
    {
      name: 'window-grid',
      revision: 2,
      description: 'Create editable windows.',
      availability,
      version
    }
  ],
  unavailable: [],
  truncated: false
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('loads only on opening and sends the observed revision when suspended', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => inventory() })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'saved',
        availability: 'suspended',
        version: 'next'
      })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => inventory('suspended', 'next')
    })
  vi.stubGlobal('fetch', fetcher)
  render(<AiToolLibraryPanel />)
  expect(fetcher).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Saved tools' }))
  await screen.findByText('window-grid')
  fireEvent.click(screen.getByRole('button', { name: 'Suspend window-grid' }))
  await screen.findByText('suspended')
  expect(fetcher.mock.calls[1][0]).toBe(ToolLibraryManagement.endpoint)
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
    operation: 'suspend',
    name: 'window-grid',
    revision: 2,
    expectedVersion: 'observed'
  })
})

it('shows a failed mutation without claiming success or retrying the write', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => inventory() })
    .mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        issue: 'Saved revision changed; refresh before updating'
      })
    })
  vi.stubGlobal('fetch', fetcher)
  render(<AiToolLibraryPanel />)
  fireEvent.click(screen.getByRole('button', { name: 'Saved tools' }))
  await screen.findByText('window-grid')
  fireEvent.click(screen.getByRole('button', { name: 'Remove window-grid' }))
  await screen.findByRole('alert')
  expect(screen.getByText('eligible')).toBeTruthy()
  expect(fetcher).toHaveBeenCalledTimes(2)
})

it('aborts a pending read on close and ignores its late result', async () => {
  let resolve!: (value: unknown) => void
  const fetcher = vi.fn(
    (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Promise<unknown>((done) => {
        resolve = done
      })
  )
  vi.stubGlobal('fetch', fetcher)
  render(<AiToolLibraryPanel />)
  fireEvent.click(screen.getByRole('button', { name: 'Saved tools' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
  fireEvent.click(screen.getByRole('button', { name: 'Close saved tools' }))
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
  resolve({ ok: true, json: async () => inventory() })
  await waitFor(() => expect(screen.queryByText('window-grid')).toBeNull())
})
