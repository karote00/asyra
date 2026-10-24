import { afterEach, describe, expect, it, vi } from 'vitest'
import core from '@asyra/core'
import { Render, renderSceneTreeStore } from '@asyra/render'
import { applyPreset } from '../preset.js'
import { PresetProfiles, PresetDefaults } from '../constants.js'
import { PresetSystemPropertyKeys } from '../system-property-keys.js'
import { bindPresetProfileProvider } from '../composition/profile-provider.js'

const spatial = vi.hoisted(() => ({
  created: [] as import('@asyra/render-engine/testing').RecordingRenderEngine[],
  options: [] as unknown[],
  fail: false
}))
vi.mock('../spatial/three-engine.js', async () => {
  const { RecordingRenderEngine } = await import('@asyra/render-engine/testing')
  const { RenderEngineCapabilities } = await import('@asyra/render-engine')
  return {
    ThreeEngine: class extends RecordingRenderEngine {
      constructor(_platform?: unknown, options?: unknown) {
        super({
          name: 'official-profile-lifecycle',
          capabilities: Object.values(RenderEngineCapabilities)
        })
        spatial.created.push(this)
        spatial.options.push(options)
        const initialize = this.initialize.bind(this)
        this.initialize = (input) => {
          if (spatial.fail) throw new Error('WebGL initialization rejected')
          return {
            ...initialize(input),
            surface: document.createElement('canvas')
          }
        }
        const destroy = this.destroy.bind(this)
        this.destroy = vi.fn(destroy)
      }
    }
  }
})

const empty = {
  version: '1.0.0',
  props: {},
  sceneTree: { workspace: '', workspaceList: [], elements: {} }
}
const start = async (host: HTMLElement) => {
  core.setRenderer({
    name: 'preset-lifecycle-surface',
    init: async () => ({
      canvas: document.createElement('canvas'),
      instance: null
    }),
    destroy: vi.fn(),
    getCanvas: () => null,
    getInstance: () => null,
    getViewportPosition: () => ({ x: 0, y: 0 }),
    getViewportScale: () => 1,
    setViewportPosition: vi.fn(),
    setViewportScale: vi.fn(),
    resize: vi.fn()
  })
  await core.start(host, { width: 100, height: 100 })
}

afterEach(async () => {
  vi.restoreAllMocks()
  if (core.getRuntimeState() === 'active') await core.resetRuntime()
})

describe('Preset complete Core handoff', () => {
  it('reapplies all defaults to a fresh Core without retaining prior load subscriptions or managed state', async () => {
    const first = core,
      host = document.createElement('div')
    applyPreset(first, { profile: PresetProfiles.CUSTOM })
    const oldZoom = first.getSystemPropertyObservable<number>(
      PresetSystemPropertyKeys.ZOOM
    )
    const completed = vi.fn()
    oldZoom?.subscribe({ complete: completed })
    await start(host)
    const next = await first.resetRuntime()
    expect(core).toBe(next)
    expect(completed).toHaveBeenCalledOnce()
    expect(host.querySelectorAll('canvas')).toHaveLength(0)
    expect(next.getRegistrations()).toEqual([])
    expect(next.hasSystemProperty(PresetSystemPropertyKeys.ZOOM)).toBe(false)

    applyPreset(next, { profile: PresetProfiles.CUSTOM })
    const reload = vi.spyOn(renderSceneTreeStore, 'reload')
    next.load(empty)
    expect(reload).toHaveBeenCalledOnce()
    expect(next.getUndoHistoryDepth()).toBe(0)
    await start(host)
    await next.resetRuntime()
    expect(host.querySelectorAll('canvas')).toHaveLength(0)
    applyPreset(core, { profile: PresetProfiles.CUSTOM, defaults: [] })
    expect(core.getRegistrations()).toEqual([])
  })
})

it('starts the official 3D provider once, retires INPUT and surface ownership, and reapplies to a fresh Core', async () => {
  const host = document.createElement('div')
  const initialCount = spatial.created.length
  const first = core
  applyPreset(first, {
    profile: PresetProfiles['3D'],
    defaults: [PresetDefaults.INPUT]
  })
  expect(spatial.created).toHaveLength(initialCount)
  first.load(empty)
  await first.start(host, { width: 100, height: 100 })
  expect(spatial.created).toHaveLength(initialCount + 1)
  expect(host.querySelectorAll('canvas')).toHaveLength(1)
  const engine = spatial.created.at(-1)
  if (!engine) throw new Error('Missing initialized delegate')
  const next = await first.resetRuntime()
  expect(engine.destroy).toHaveBeenCalledOnce()
  expect(host.querySelectorAll('canvas')).toHaveLength(0)
  expect(next.getRegistrations()).toEqual([])
  expect(next.hasRenderEngineProvider()).toBe(false)
  expect(() =>
    applyPreset(first, { profile: PresetProfiles['3D'], defaults: [] })
  ).toThrow()
  applyPreset(next, { profile: PresetProfiles['3D'], defaults: [] })
  next.load(empty)
  await next.start(host, { width: 100, height: 100 })
  expect(spatial.created).toHaveLength(initialCount + 2)
  expect(spatial.created.at(-1)).not.toBe(engine)
  await next.resetRuntime()
  expect(engine.destroy).toHaveBeenCalledOnce()
  expect(host.querySelectorAll('canvas')).toHaveLength(0)
})

it('preserves official initialization failure without a fallback canvas and cleans the failed generation', async () => {
  const host = document.createElement('div')
  const first = core
  applyPreset(first, { profile: PresetProfiles['3D'], defaults: [] })
  spatial.fail = true
  try {
    await expect(
      first.start(host, { width: 100, height: 100 })
    ).rejects.toThrow('WebGL initialization rejected')
    expect(host.querySelectorAll('canvas')).toHaveLength(0)
    const engine = spatial.created.at(-1)
    if (!engine) throw new Error('Missing initialized delegate')
    expect(engine.destroy).toHaveBeenCalledOnce()
    const next = await first.resetRuntime()
    expect(engine.destroy).toHaveBeenCalledOnce()
    expect(next.hasRenderEngineProvider()).toBe(false)
    expect(next.getRegistrations()).toEqual([])
  } finally {
    spatial.fail = false
  }
})

it('keeps simultaneous official provider lifetimes isolated through Render', async () => {
  const first = new Render(),
    second = new Render()
  for (const render of [first, second])
    bindPresetProfileProvider(
      {
        setRenderEngineProvider: (provider) =>
          render.setEngineProvider(provider)
      },
      PresetProfiles['3D']
    )
  try {
    await first.init(100, 100, 0)
    const firstEngine = spatial.created.at(-1)
    await second.init(200, 200, 0)
    const secondEngine = spatial.created.at(-1)
    if (!firstEngine || !secondEngine) throw new Error('Missing delegates')
    expect(firstEngine).not.toBe(secondEngine)
    first.resetRuntime()
    expect(firstEngine.destroy).toHaveBeenCalledOnce()
    expect(secondEngine.destroy).not.toHaveBeenCalled()
    expect(second.getEngine()?.execute({ type: 'flush' }).status).toBe(
      'applied'
    )
    second.resetRuntime()
    expect(secondEngine.destroy).toHaveBeenCalledOnce()
  } finally {
    first.resetRuntime()
    second.resetRuntime()
  }
})

it('delivers detached App presentation settings to the deferred concrete owner', async () => {
  const hemisphere: [number, number, number] = [0xabcdef, 0x123456, 2]
  const lighting = {
    hemisphere,
    keyPosition: [1, 2, 3] as const,
    fillPosition: [-1, 2, -3] as const,
    shadowExtent: 8,
    shadowFar: 40,
    castShadows: false
  }
  const first = core
  applyPreset(first, {
    profile: PresetProfiles['3D'],
    defaults: [],
    spatial: { lighting, softwareShadowFallback: false }
  })
  hemisphere[2] = 99
  lighting.shadowFar = 500
  first.load(empty)
  await first.start(document.createElement('div'), { width: 100, height: 100 })
  expect(spatial.options.at(-1)).toEqual({
    softwareShadowFallback: false,
    lighting: {
      ...lighting,
      hemisphere: [0xabcdef, 0x123456, 2],
      shadowFar: 40
    }
  })
  expect(Object.isFrozen(spatial.options.at(-1))).toBe(true)
  await first.resetRuntime()
})
