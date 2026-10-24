import { expect, it, vi } from 'vitest'
import {
  RenderEngineCapabilities,
  type RenderEngine
} from '@asyra/render-engine'
import { RecordingRenderEngine } from '@asyra/render-engine/testing'
import { createSpatialRenderEngine } from '../spatial/lazy-engine.js'

vi.mock('three', () => {
  throw new Error('Spatial SDK was evaluated eagerly')
})
const options = { host: document.createElement('div'), width: 640, height: 480 }
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const delegate = () =>
  new RecordingRenderEngine({
    name: 'Deferred spatial test',
    capabilities: Object.values(RenderEngineCapabilities)
  })

it('keeps root/2D, pure admission and mechanism imports independent of the spatial SDK', async () => {
  const root = await import('../index.js')
  const contract = await import('../spatial-contract.js')
  const spatial = await import('../spatial.js')
  expect(root.PresetCatalog).toBeDefined()
  const core = {
    isCompositionOpen: () => true,
    hasRenderEngineProvider: () => false,
    setRenderEngineProvider: vi.fn(() => vi.fn()),
    getPresetDependencies: () => ({})
  }
  const result = root.applyPreset(core as never, {
    profile: root.PresetProfiles['2D'],
    defaults: []
  })
  expect(result.profile).toBe('2D')
  expect(core.setRenderEngineProvider).toHaveBeenCalledTimes(1)
  const spatialCore = { ...core, setRenderEngineProvider: vi.fn(() => vi.fn()) }
  const official = root.applyPreset(spatialCore as never, {
    profile: root.PresetProfiles['3D'],
    defaults: []
  })
  expect(official.presetEngineId).toBe('@asyra/preset/spatial-engine')
  expect(spatialCore.setRenderEngineProvider).toHaveBeenCalledWith(
    createSpatialRenderEngine
  )
  const engine = createSpatialRenderEngine()
  expect(engine.capabilities.has(RenderEngineCapabilities.SPATIAL)).toBe(true)
  engine.destroy()
  expect(contract.readSpatialDescriptor).toBeTypeOf('function')
  expect(spatial).not.toHaveProperty('ThreeEngine')
})

it('creates synchronously, loads once at initialization and delegates only when ready', async () => {
  const loaded = delegate()
  const load = vi.fn(async () => loaded)
  const engine = createSpatialRenderEngine({}, {}, load)
  expect(load).not.toHaveBeenCalled()
  expect(() => engine.execute({ type: 'flush' })).toThrow()
  expect(() =>
    engine.query({ type: 'hit-test', point: { x: 0, y: 0 } })
  ).toThrow()
  await engine.initialize(options)
  await expect(engine.initialize(options)).rejects.toThrow()
  expect(load).toHaveBeenCalledTimes(1)
  expect(engine.execute({ type: 'flush' }).status).toBe('applied')
  expect(engine.destroy().alreadyDestroyed).toBe(false)
  expect(engine.destroy().alreadyDestroyed).toBe(true)
})

it('settles retired startup only after late loading and disposes without initializing or publishing', async () => {
  const pending = deferred<ReturnType<typeof delegate>>()
  const loaded = delegate()
  const initialize = vi.spyOn(loaded, 'initialize')
  const destroy = vi.spyOn(loaded, 'destroy')
  const engine = createSpatialRenderEngine({}, {}, () => pending.promise)
  const starting = engine.initialize(options)
  engine.destroy()
  pending.resolve(loaded)
  await expect(starting).rejects.toThrow(/retired/)
  expect(initialize).not.toHaveBeenCalled()
  expect(destroy).toHaveBeenCalledTimes(1)
  expect(() => engine.execute({ type: 'flush' })).toThrow()
})

it('disposes failed initialization and does not retry or substitute an engine', async () => {
  const loaded = delegate()
  loaded.initialize = vi.fn(() => {
    throw new Error('WebGL unavailable')
  })
  const destroy = vi.spyOn(loaded, 'destroy')
  const engine = createSpatialRenderEngine({}, {}, async () => loaded)
  await expect(engine.initialize(options)).rejects.toThrow('WebGL unavailable')
  expect(destroy).toHaveBeenCalledTimes(1)
  engine.destroy()
  expect(destroy).toHaveBeenCalledTimes(1)
  await expect(engine.initialize(options)).rejects.toThrow()
})

it('rejects import failure and delegate capability mismatch explicitly', async () => {
  const failing = createSpatialRenderEngine({}, {}, async () => {
    throw new Error('Import failed')
  })
  await expect(failing.initialize(options)).rejects.toThrow('Import failed')
  const loaded = new RecordingRenderEngine({
    name: 'Unsupported',
    capabilities: []
  })
  const destroy = vi.spyOn(loaded, 'destroy')
  const engine = createSpatialRenderEngine({}, {}, async () => loaded)
  await expect(engine.initialize(options)).rejects.toThrow(/capabilities/)
  expect(destroy).toHaveBeenCalledTimes(1)
})

it('waits for an initializing delegate before releasing it after retirement', async () => {
  const loaded: RenderEngine = delegate()
  const result = await loaded.initialize(options)
  const pending = deferred<typeof result>()
  loaded.initialize = vi.fn(() => pending.promise)
  const destroy = vi.spyOn(loaded, 'destroy')
  const engine = createSpatialRenderEngine({}, {}, async () => loaded)
  const starting = engine.initialize(options)
  await Promise.resolve()
  engine.destroy()
  expect(destroy).not.toHaveBeenCalled()
  pending.resolve(result)
  await expect(starting).rejects.toThrow(/retired/)
  expect(destroy).toHaveBeenCalledTimes(1)
})
