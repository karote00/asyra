import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AiConnectionStatus } from '../ai-connection-status'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AI connection status', () => {
  it('checks once, ignores unrelated rerenders, and refreshes on explicit retry', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ state: 'local-unavailable' })
    })
    vi.stubGlobal('fetch', fetch)
    const view = render(<AiConnectionStatus />)
    await screen.findByText(/Local AI unavailable/)
    view.rerender(<AiConnectionStatus />)
    expect(fetch).toHaveBeenCalledTimes(1)
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ state: 'ready' })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Check AI connection' }))
    await screen.findByText('Local AI connected')
    expect(
      screen.queryByRole('button', { name: 'Check AI connection' })
    ).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it.each(['offline', 'html', 'unknown'])(
    'reports an unavailable server for %s without exposing response data',
    async (kind) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          if (kind === 'offline') throw new Error('private endpoint')
          return {
            ok: true,
            json: async () => {
              if (kind === 'html') throw new Error('not JSON')
              return { state: 'private@example.test' }
            }
          }
        })
      )
      render(<AiConnectionStatus />)
      await screen.findByText(/AI server unavailable/)
      expect(screen.queryByText(/private/)).toBeNull()
    }
  )

  it('aborts a retired panel request', async () => {
    const fetch = vi.fn(
      () =>
        new Promise(() => {
          /* Deliberately pending until unmount. */
        })
    )
    vi.stubGlobal('fetch', fetch)
    const view = render(<AiConnectionStatus />)
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    const signal = (
      fetch.mock.calls[0] as unknown as [string, { signal: AbortSignal }]
    )[1].signal
    view.unmount()
    expect(signal.aborted).toBe(true)
  })
})
