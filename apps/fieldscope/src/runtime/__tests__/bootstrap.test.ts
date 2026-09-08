// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import * as projection from '../../render-app/site-projection'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import { bootstrap } from '../bootstrap'
import * as navigation from '../../render-app/camera-navigation'

it('keeps one geometry construction through navigation and queued display changes, then retires it', async () => {
  const build = vi.spyOn(projection, 'buildSiteMeshes')
  const preset = vi.spyOn(projection, 'cameraPreset')
  const measure = vi.spyOn(navigation, 'measureScene')
  const pan = vi.spyOn(navigation, 'panCamera')
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
  let pending: FrameRequestCallback | undefined
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = disconnect
    }
  )
  const host = document.createElement('div')
  host.getBoundingClientRect = () => new DOMRect(0, 0, 640, 480)
  const runtime = await bootstrap(
    host,
    () =>
      new ThreeEngine({
        createDriver: () => driver,
        requestFrame: (cb) => {
          pending = cb
          return 1
        },
        cancelFrame: () => {
          pending = undefined
        }
      })
  )
  const flush = () => {
    const callback = pending
    pending = undefined
    callback?.(0)
  }
  try {
    flush()
    const notify = vi.fn(),
      unsubscribe = runtime.subscribe(notify)
    await runtime.setCamera('joint')
    runtime.pan(20, 10)
    const firstPan = pan.mock.results.at(-1)?.value
    const firstInput = pan.mock.calls.at(-1)?.[0]
    runtime.zoom(-10000)
    expect.soft(runtime.getZoom()).toBe(10000)
    runtime.pan(20, 10)
    const secondPan = pan.mock.results.at(-1)?.value
    const secondInput = pan.mock.calls.at(-1)?.[0]
    if (!firstInput || !secondInput) throw new Error('Missing camera commands')
    expect(secondInput.position).toEqual(firstPan.position)
    for (let axis = 0; axis < 3; axis++) {
      expect
        .soft(secondPan.target[axis] - secondInput.target[axis])
        .toBeCloseTo(firstPan.target[axis] - firstInput.target[axis], 8)
    }
    runtime.orbit(40, -12)
    runtime.pan(0, 0)
    const rotated = pan.mock.calls.at(-1)?.[0]
    expect(rotated?.target).toEqual(secondPan.target)
    expect(rotated?.position).not.toEqual(secondPan.position)
    runtime.actualSize()
    expect(runtime.getZoom()).toBe(100)
    await runtime.setCamera('overview')
    // Keyboard motion must cover scene-scale distances and shrink with zoom.
    const movementDistance = () => {
      runtime.pan(0, 0)
      const before = pan.mock.calls.at(-1)?.[0]
      runtime.move(0, 0, 1.5) // One second at the keyboard's base rate.
      runtime.pan(0, 0)
      const after = pan.mock.calls.at(-1)?.[0]
      if (!before || !after) throw new Error('Missing movement camera')
      expect(after.fov).toBe(before.fov)
      return Math.hypot(...after.position.map((v, i) => v - before.position[i]))
    }
    const overviewSpeed = movementDistance()
    expect.soft(overviewSpeed).toBeGreaterThan(10)
    runtime.zoom(-10000)
    const detailSpeed = movementDistance()
    expect.soft(detailSpeed).toBeCloseTo(overviewSpeed / 100, 8)
    runtime.actualSize()
    expect.soft(movementDistance()).toBeCloseTo(overviewSpeed, 8)
    await runtime.setCamera('joint')
    expect.soft(movementDistance()).toBeLessThan(0.1)
    await runtime.setCamera('overview')
    notify.mockClear()
    const initial = runtime.getView()
    const presetCount = preset.mock.calls.length
    for (let i = 0; i < 20; i++) {
      runtime.move(0.01, -0.01, 0.02)
      runtime.look(1, -1)
      runtime.orbit(2, 1)
      runtime.zoom(1)
      runtime.pan(4, -2)
      flush()
    }
    runtime.fit()
    flush()
    runtime.actualSize()
    flush()
    expect(runtime.getZoom()).toBe(100)
    expect(preset).toHaveBeenCalledTimes(presetCount)
    expect(measure).toHaveBeenCalledTimes(1)
    expect(notify).not.toHaveBeenCalled()
    expect(runtime.getView()).toBe(initial)
    expect(build).toHaveBeenCalledTimes(1)
    await Promise.all([
      runtime.setLayer('film', false),
      runtime.setLayer('steel', false)
    ])
    flush()
    expect(runtime.getView().layers.film).toBe(false)
    expect(runtime.getView().layers.steel).toBe(false)
    await runtime.setOpacity(0.35)
    await runtime.setCamera('inside')
    flush()
    expect(runtime.getView().filmOpacity).toBe(0.35)
    expect(runtime.getView().camera).toBe('inside')
    await expect(runtime.setOpacity(Number.NaN)).rejects.toThrow()
    expect(runtime.getView().filmOpacity).toBe(0.35)
    expect(build).toHaveBeenCalledTimes(1)
    expect(pending).toBeUndefined()
    const configNotify = vi.fn()
    const stopConfig = runtime.subscribeConfiguration(configNotify)
    const originalConfig = runtime.getConfiguration()
    const depth = runtime.getUndoDepth()
    const changedConfig = {
      ...originalConfig,
      width: 8,
      length: 12.7,
      height: 4.5,
      netTop: 2.6,
      netBottom: 0.5,
      topExtension: 0.3,
      soilInset: 0.12,
      startInset: 0.4,
      endInset: 0.8,
      strips: [
        { kind: 'drain' as const, width: 0.3 },
        { kind: 'soil' as const, width: 1 },
        { kind: 'drain' as const, width: 0.3 },
        { kind: 'soil' as const, width: 2 }
      ]
    }
    const configurationPresetCount = preset.mock.calls.length
    await runtime.setConfiguration(changedConfig)
    flush()
    expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 1)
    expect(runtime.getConfiguration()).toEqual(changedConfig)
    expect(runtime.getUndoDepth()).toBe(depth + 1)
    expect(build).toHaveBeenCalledTimes(2)
    expect(measure).toHaveBeenCalledTimes(2)
    expect(configNotify).toHaveBeenCalledTimes(1)
    runtime.orbit(5, 2)
    runtime.zoom(5)
    flush()
    expect(build).toHaveBeenCalledTimes(2)
    await runtime.undo()
    flush()
    expect(runtime.getConfiguration()).toEqual(originalConfig)
    expect(runtime.getUndoDepth()).toBe(depth)
    expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 2)
    expect(build).toHaveBeenCalledTimes(3)
    await runtime.redo()
    flush()
    expect(runtime.getConfiguration()).toEqual(changedConfig)
    expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 3)
    expect(build).toHaveBeenCalledTimes(4)
    await expect(
      runtime.setConfiguration({ ...changedConfig, netBottom: 4 })
    ).rejects.toThrow()
    expect(runtime.getConfiguration()).toEqual(changedConfig)
    expect(build).toHaveBeenCalledTimes(4)
    expect(runtime.getUndoDepth()).toBe(depth + 1)
    await runtime.setConfiguration(changedConfig)
    expect(build).toHaveBeenCalledTimes(4)
    await runtime.undo()
    flush()
    await runtime.setConfiguration({ ...originalConfig, length: 20 })
    await runtime.redo()
    flush()
    expect(runtime.getConfiguration().length).toBe(20)
    stopConfig()
    unsubscribe()
  } finally {
    await runtime.dispose()
    expect(driver.dispose).toHaveBeenCalledTimes(1)
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(() => runtime.orbit(1, 1)).toThrow()
    await runtime.dispose()
    build.mockRestore()
    preset.mockRestore()
    measure.mockRestore()
    pan.mockRestore()
    vi.unstubAllGlobals()
  }
}, 15000)
