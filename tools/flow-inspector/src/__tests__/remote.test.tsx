import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RemoteProvider, useRemote } from '../control-plane/shared'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('React service subscriptions', () => {
  it('shares task reads until their authoritative summary changes', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: 'task' }) })
    vi.stubGlobal('fetch', fetch)
    const { result, rerender, unmount } = renderHook(
      ({ revision, identity }) => [
        useRemote('/api/tasks/task', revision, false, identity),
        useRemote('/api/tasks/task', revision, false, identity)
      ],
      {
        initialProps: { revision: 0, identity: 'completed:1' },
        wrapper: RemoteProvider
      }
    )

    await waitFor(() =>
      expect(result.current.map((item) => item.value)).toEqual([
        { id: 'task' },
        { id: 'task' }
      ])
    )
    expect(fetch).toHaveBeenCalledTimes(1)
    rerender({ revision: 1, identity: 'completed:1' })
    await act(() => Promise.resolve())
    expect(fetch).toHaveBeenCalledTimes(1)
    rerender({ revision: 2, identity: 'completed:2' })
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    unmount()
  })

  it('retries transient failures for a continuing subscription', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unavailable' })
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ value: 'recovered' })
      })
    vi.stubGlobal('fetch', fetch)
    const { result, unmount } = renderHook(() =>
      useRemote('/api/evidence', 0, true)
    )

    await waitFor(() => expect(result.current.error).toBe('Unavailable'))
    await waitFor(
      () => expect(result.current.value).toEqual({ value: 'recovered' }),
      { timeout: 2000 }
    )
    unmount()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('stops polling when the authoritative owner reports idle', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ active: false }) })
    const active = (value: { active: boolean }) => value.active
    vi.stubGlobal('fetch', fetch)
    const { result, unmount } = renderHook(() =>
      useRemote('/api/state', 0, active)
    )

    await waitFor(() => expect(result.current.value).toEqual({ active: false }))
    await act(async () => new Promise((resolve) => setTimeout(resolve, 1100)))
    expect(fetch).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('aborts the previous selection and ignores its late result', async () => {
    let complete: ((value: unknown) => void) | undefined
    const fetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            complete = resolve
          })
      )
      .mockResolvedValue({ ok: true, json: async () => ({ id: 'current' }) })
    vi.stubGlobal('fetch', fetch)
    const { result, rerender, unmount } = renderHook(
      ({ route }) => useRemote(route),
      { initialProps: { route: '/api/old' } }
    )
    const oldSignal = fetch.mock.calls[0][1].signal as AbortSignal
    rerender({ route: '/api/current' })

    await waitFor(() => expect(result.current.value).toEqual({ id: 'current' }))
    expect(oldSignal.aborted).toBe(true)
    await act(async () => {
      complete?.({ ok: true, json: async () => ({ id: 'old' }) })
    })
    expect(result.current.value).toEqual({ id: 'current' })
    unmount()
    expect(fetch.mock.calls[1][1].signal.aborted).toBe(true)
  })
})
