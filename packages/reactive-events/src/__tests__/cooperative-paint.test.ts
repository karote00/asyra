import { afterEach, expect, it, vi } from 'vitest'
import { waitForCooperativePaint } from '../cooperative-render.js'

afterEach(() => vi.unstubAllGlobals())

it('releases a replay slice after its render turn without waiting for another refresh', async () => {
  const frames: FrameRequestCallback[] = []
  let finishTask: (() => void) | undefined

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    frames.push(callback)
  )
  vi.stubGlobal('scheduler', {
    yield: () =>
      new Promise<void>((resolve) => {
        finishTask = resolve
      })
  })

  let settled = false
  const paint = waitForCooperativePaint().then(() => {
    settled = true
  })

  expect(frames).toHaveLength(1)
  frames.shift()?.(0)
  await Promise.resolve()
  expect(settled).toBe(false)
  expect(frames).toHaveLength(0)
  expect(finishTask).toBeTypeOf('function')
  finishTask?.()
  await paint
  expect(settled).toBe(true)
})

it('uses a posted task after rendering when the browser has no Scheduler API', async () => {
  const frame = vi.fn<(callback: FrameRequestCallback) => number>()

  vi.stubGlobal('scheduler', undefined)
  vi.stubGlobal('requestAnimationFrame', frame)
  const paint = waitForCooperativePaint()

  frame.mock.calls[0][0](0)
  await paint
  expect(frame).toHaveBeenCalledTimes(1)
})

it('uses the next frame as the host task when it is the only scheduling primitive', async () => {
  const frame = vi.fn<(callback: FrameRequestCallback) => number>()

  vi.stubGlobal('scheduler', undefined)
  vi.stubGlobal('MessageChannel', undefined)
  vi.stubGlobal('requestAnimationFrame', frame)
  const paint = waitForCooperativePaint()

  frame.mock.calls[0][0](0)
  await Promise.resolve()
  expect(frame).toHaveBeenCalledTimes(2)
  frame.mock.calls[1][0](16)
  await paint
})
