import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const owner = {
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
  return { owner, preset: vi.fn() }
})
vi.mock('@asyra/core', () => ({ default: mocks.owner }))
vi.mock('@asyra/preset', () => ({
  applyPreset: mocks.preset,
  PresetProfiles: { '3D': '3D' }
}))
import { startAssetPreview } from '../runtime'

describe('asset preview session lifetime', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
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
    const preview = await startAssetPreview(document.createElement('div'))
    await expect(
      startAssetPreview(document.createElement('div'))
    ).rejects.toThrow('already active')
    callbacks[0]()
    expect(mocks.owner.resizeRenderer).toHaveBeenCalledOnce()
    await Promise.all([preview.dispose(), preview.dispose()])
    expect(disconnect).toHaveBeenCalledOnce()
    expect(mocks.owner.unregisterRenderLayer).toHaveBeenCalledOnce()
    expect(mocks.owner.resetRuntime).toHaveBeenCalledOnce()
    const successor = await startAssetPreview(document.createElement('div'))
    mocks.owner.resizeRenderer.mockClear()
    callbacks[0]()
    expect(mocks.owner.resizeRenderer).not.toHaveBeenCalled()
    expect(() => preview.setView('Front')).toThrow('disposed')
    callbacks[1]()
    expect(mocks.owner.resizeRenderer).toHaveBeenCalledOnce()
    await successor.dispose()
  })
  it('cleans a failed startup before permitting a subsequent session', async () => {
    mocks.owner.start.mockRejectedValueOnce(
      new Error('renderer startup failed')
    )
    await expect(
      startAssetPreview(document.createElement('div'))
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
    const next = await startAssetPreview(document.createElement('div'))
    await next.dispose()
    expect(mocks.owner.resetRuntime).toHaveBeenCalledTimes(2)
  })
})
