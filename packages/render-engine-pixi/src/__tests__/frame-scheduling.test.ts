import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Keep the real Pixi Ticker: a mock that always emits hid its clock guard.
vi.mock('pixi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pixi.js')>()
  return {
    ...actual,
    Application: class {
      stage = new actual.Container()
      canvas = {}
      renderer = { events: { rootBoundary: {} } }
      init() {
        return Promise.resolve()
      }
      destroy() {
        this.stage.destroy()
      }
    }
  }
})

import { PixiRenderEngine } from '../pixi-render-engine.js'

describe('engine-owned one-shot frame scheduling', () => {
  let engine: PixiRenderEngine
  let nextId: number
  let pending: Map<number, FrameRequestCallback>
  let now: number
  const deliver = (timestamp: number) => {
    const callbacks = [...pending.values()]
    pending.clear()
    for (const callback of callbacks) callback(timestamp)
  }

  beforeEach(async () => {
    nextId = 0
    pending = new Map()
    now = 20
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++nextId
      pending.set(id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id))
    engine = new PixiRenderEngine()
    await engine.initialize({ host: {}, width: 100, height: 100 })
  })

  afterEach(() => {
    engine.destroy()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('delivers every requested browser frame even when its timestamp precedes request-time now', () => {
    const callback = vi.fn()
    // Input tasks can run after the browser frame timestamp was established.
    // A one-shot scheduler must not reinterpret that timestamp as an FPS gate.
    for (let index = 0; index < 6; index++) {
      now = 20 + index * 16
      engine.requestFrame(callback)
      deliver(16 + index * 16)
      expect(callback).toHaveBeenCalledTimes(index + 1)
      expect(callback).toHaveBeenLastCalledWith(16 + index * 16)
      expect(pending.size).toBe(0)
    }
  })

  it('replaces pending work and ignores a cancelled callback even if already dispatched', () => {
    const first = vi.fn()
    const second = vi.fn()
    engine.requestFrame(first)
    const obsolete = [...pending.values()][0]
    engine.requestFrame(second)
    obsolete(32)
    deliver(48)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledExactlyOnceWith(48)
    expect(pending.size).toBe(0)
  })

  it('preserves the next one-shot request made inside a frame callback', () => {
    const second = vi.fn()
    engine.requestFrame(() => engine.requestFrame(second))
    deliver(32)
    expect(pending.size).toBe(1)
    deliver(48)
    expect(second).toHaveBeenCalledExactlyOnceWith(48)
    expect(pending.size).toBe(0)
  })

  it('cancels the pending callback on teardown without an idle loop', () => {
    const callback = vi.fn()
    engine.requestFrame(callback)
    const obsolete = [...pending.values()][0]
    engine.destroy()
    obsolete(32)
    expect(callback).not.toHaveBeenCalled()
    expect(pending.size).toBe(0)
  })
})
