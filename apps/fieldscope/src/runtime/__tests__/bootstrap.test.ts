// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import * as projection from '../../render-app/site-projection'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import { bootstrap } from '../bootstrap'
import * as navigation from '../../render-app/camera-navigation'

it('keeps one geometry construction through navigation and queued display changes, then retires it', async () => {
  const build = vi.spyOn(projection, 'buildSiteMeshes')
  const measure = vi.spyOn(navigation, 'measureScene')
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
    const initial = runtime.getView()
    for (let i = 0; i < 20; i++) {
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
    unsubscribe()
  } finally {
    await runtime.dispose()
    expect(driver.dispose).toHaveBeenCalledTimes(1)
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(() => runtime.orbit(1, 1)).toThrow()
    await runtime.dispose()
    build.mockRestore()
    measure.mockRestore()
    vi.unstubAllGlobals()
  }
})
