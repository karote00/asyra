import type { RawInputEvent } from '@asyra/utils'
import { InputType, DefaultPointerEventData } from '@asyra/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const unregisterInput = vi.fn()
  const owner = {
    registerInputKeyCombinations: vi.fn(
      (
        _config: Record<
          string,
          { callback?: (raw: RawInputEvent) => unknown }[]
        >
      ) => unregisterInput
    ),
    defineSystemProperty: vi.fn(),
    setSystemProperty: vi.fn(),
    registerRenderLayer: vi.fn(),
    unregisterRenderLayer: vi.fn(),
    defineFeature: vi.fn((_id, _events, options) => ({ api: options.api })),
    load: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    resizeRenderer: vi.fn(),
    resetRuntime: vi.fn()
  }
  owner.resetRuntime.mockResolvedValue(owner)
  return { owner, preset: vi.fn(), unregisterInput }
})
vi.mock('@asyra/core', () => ({
  default: mocks.owner,
  keyMap: {
    keys: {
      KeyW: 'W',
      KeyA: 'A',
      KeyS: 'S',
      KeyD: 'D',
      ArrowUp: 'ArrowUp',
      ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft',
      ArrowRight: 'ArrowRight'
    }
  }
}))
vi.mock('@asyra/preset', () => ({
  applyPreset: mocks.preset,
  PresetProfiles: { '3D': '3D' }
}))
vi.mock('../surfaces', () => ({
  createSurfaces: () => ({}),
  labelMeshes: () => []
}))
vi.mock('../reference-scene', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../reference-scene')>()
  const { box } = await import('../../assets/geometry')
  const { part } = await import('../../assets/catalog')
  return {
    ...actual,
    // This suite proves session ownership and work counts. Full scene geometry
    // is covered by the scene/interior suites and live browser cases; rebuilding
    // thousands of unrelated assets twice per lifecycle case adds no oracle.
    createReferenceScene: vi.fn(() => ({
      parts: [part('body', box([1, 1, 1]), 0xffffff, 'plain')],
      labels: [],
      assemblies: [
        {
          id: 'lifetime-fixture',
          asset: 'wall-segment',
          position: [0, 0, 0],
          parts: ['body']
        }
      ]
    })),
    buildSpatialMeshes: vi.fn(actual.buildSpatialMeshes)
  }
})
import { createReferenceScene, buildSpatialMeshes } from '../reference-scene'
import { startReferenceScene } from '../runtime'

describe('reference scene session lifetime', () => {
  const cleanup: (() => void)[] = []
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    cleanup.splice(0).forEach((dispose) => dispose())
  })
  it('releases once, ignores a retired resize callback and allows a successor', async () => {
    const callbacks: (() => void)[] = []
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          callbacks.push(callback)
        }
        observe() {
          /* The test controls delivery explicitly. */
        }
        disconnect = disconnect
      }
    )
    const preview = await startReferenceScene(document.createElement('div'))
    await expect(
      startReferenceScene(document.createElement('div'))
    ).rejects.toThrow('already active')
    expect(mocks.preset).toHaveBeenCalledWith(
      mocks.owner,
      expect.objectContaining({
        spatial: expect.objectContaining({
          bloom: { strength: 0.315, radius: 8 }
        })
      })
    )
    expect(createReferenceScene).toHaveBeenCalledOnce()
    expect(buildSpatialMeshes).toHaveBeenCalledOnce()
    for (let i = 0; i < 20; i++) {
      preview.focusPlace('tea')
      preview.follow('mina')
      preview.overview()
      preview.move(1, 0)
      preview.move(0, 1, true)
    }
    const frames = new Map<number, FrameRequestCallback>()
    let frameId = 0
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frames.set(++frameId, callback)
        return frameId
      })
    const cancelFrame = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((id) => {
        frames.delete(id)
      })
    cleanup.push(
      () => requestFrame.mockRestore(),
      () => cancelFrame.mockRestore()
    )
    expect(mocks.owner.registerInputKeyCombinations).toHaveBeenCalledOnce()
    const [registration] = Object.values(
      mocks.owner.registerInputKeyCombinations.mock.calls[0][0]
    )
    const onInput = registration[0].callback
    if (!onInput) throw new Error('Missing input callback')
    const start = performance.now()
    onInput({
      type: InputType.KEYBOARD,
      keys: ['W'],
      modifiers: { shift: false, ctrl: false, alt: false, meta: false },
      pointer: DefaultPointerEventData,
      keyboard: {
        phase: 'down',
        changedKey: 'W',
        target: document.body,
        repeat: false,
        isComposing: false
      }
    })
    for (let i = 1; i <= 60; i++) {
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((callback) => callback(start + (i * 1000) / 60))
    }
    expect(frames.size).toBe(1)
    expect(createReferenceScene).toHaveBeenCalledOnce()
    expect(buildSpatialMeshes).toHaveBeenCalledOnce()
    callbacks[0]()
    expect(mocks.owner.resizeRenderer).toHaveBeenCalledOnce()
    await Promise.all([preview.dispose(), preview.dispose()])
    expect(disconnect).toHaveBeenCalledOnce()
    expect(mocks.unregisterInput).toHaveBeenCalledOnce()
    expect(frames.size).toBe(0)
    expect(mocks.owner.unregisterRenderLayer).toHaveBeenCalledOnce()
    expect(mocks.owner.resetRuntime).toHaveBeenCalledOnce()
    const successor = await startReferenceScene(document.createElement('div'))
    mocks.owner.resizeRenderer.mockClear()
    callbacks[0]()
    expect(mocks.owner.resizeRenderer).not.toHaveBeenCalled()
    expect(() => preview.overview()).toThrow('disposed')
    callbacks[1]()
    expect(mocks.owner.resizeRenderer).toHaveBeenCalledOnce()
    await successor.dispose()
  })
  it('cleans a failed startup before permitting a subsequent session', async () => {
    mocks.owner.start.mockRejectedValueOnce(
      new Error('renderer startup failed')
    )
    await expect(
      startReferenceScene(document.createElement('div'))
    ).rejects.toThrow('renderer startup failed')
    expect(mocks.owner.unregisterRenderLayer).toHaveBeenCalledOnce()
    expect(mocks.owner.resetRuntime).toHaveBeenCalledOnce()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          /* No resize delivery is needed in this startup case. */
        }
        disconnect() {
          /* Cleanup work is asserted at the Core owner boundary. */
        }
      }
    )
    const next = await startReferenceScene(document.createElement('div'))
    await next.dispose()
    expect(mocks.owner.resetRuntime).toHaveBeenCalledTimes(2)
  })
})
