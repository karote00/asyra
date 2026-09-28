import { expect, it, vi } from 'vitest'
import core from '@asyra/core'
import type { ExperimentSnapshot } from '../../analysis/contracts'
import type { LivePlaybackRunner } from '../../analysis/live/runner'
import { installLivePlaybackFeature } from '../live-playback'

it('owns a non-mutating cancellable live task and detaches input before service execution', async () => {
  let received: ExperimentSnapshot | undefined
  let signal: AbortSignal | undefined
  let notifyState: (() => void) | undefined
  let notifyRecords: (() => void) | undefined
  const service = {
    setNotificationPublishers: vi.fn(
      (state: () => void, records: () => void) => {
        notifyState = state
        notifyRecords = records
      }
    ),
    capture: (input: ExperimentSnapshot) => structuredClone(input),
    open: vi.fn(
      (input: ExperimentSnapshot, _time: number, owned: AbortSignal) =>
        new Promise<void>((resolve) => {
          received = input
          signal = owned
          owned.addEventListener('abort', () => resolve(), { once: true })
        })
    ),
    sample: vi.fn(),
    getDiagnostics: vi.fn(() => []),
    recordPreviewPublication: vi.fn(),
    getState: vi.fn(),
    subscribe: vi.fn(),
    dispose: vi.fn()
  }
  const api = installLivePlaybackFeature(
    core,
    service as unknown as LivePlaybackRunner
  )
  expect(api.getDiagnostics()).toEqual([])
  api.recordPreviewPublication(1, 4, 4, 'clear', [])
  expect(service.recordPreviewPublication).toHaveBeenCalledWith(
    1,
    4,
    4,
    'clear',
    []
  )
  const stateChanged = vi.fn()
  const recordsChanged = vi.fn()
  const stopState = api.subscribe(stateChanged)
  const stopRecords = api.subscribeRecords(recordsChanged)
  stateChanged.mockClear()
  recordsChanged.mockClear()

  notifyState?.()
  expect(stateChanged).toHaveBeenCalledOnce()
  expect(recordsChanged).not.toHaveBeenCalled()
  expect(core.getUIProperty('live-playback.state-revision')).toBe(1)
  expect(core.getUIProperty('live-playback.records-revision')).toBe(0)

  notifyRecords?.()
  expect(stateChanged).toHaveBeenCalledOnce()
  expect(recordsChanged).toHaveBeenCalledOnce()
  expect(core.getUIProperty('live-playback.state-revision')).toBe(1)
  expect(core.getUIProperty('live-playback.records-revision')).toBe(1)

  stopState()
  stopRecords()

  const input = { snapshotId: 'frozen' } as ExperimentSnapshot
  const external = new AbortController()
  const before = core.getUndoHistoryDepth()
  const task = api.open(input, 4, { signal: external.signal })

  input.snapshotId = 'changed'

  await vi.waitFor(() => expect(received).toBeDefined())

  expect(received?.snapshotId).toBe('frozen')
  expect(signal).not.toBe(external.signal)

  api.sample(5, true)

  expect(service.sample).toHaveBeenCalledWith(5, true)

  await expect(api.open(input, 6)).rejects.toThrow()

  expect(api.cancel()).toBe(true)

  await task

  expect(core.getUndoHistoryDepth()).toBe(before)
})
