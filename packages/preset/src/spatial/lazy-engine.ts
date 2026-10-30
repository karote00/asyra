import {
  assertRenderEngineCapabilities,
  RenderEngineCapabilities,
  type RenderEngine,
  type RenderEngineDestroyResult
} from '@asyra/render-engine'
import type { EnginePlatform, SpatialEngineOptions } from './three-engine.js'

export const SPATIAL_ENGINE_CAPABILITIES = Object.freeze([
  RenderEngineCapabilities.OBJECTS,
  RenderEngineCapabilities.GRAPHICS,
  RenderEngineCapabilities.INTERACTION,
  RenderEngineCapabilities.RESOURCES,
  RenderEngineCapabilities.SPATIAL,
  RenderEngineCapabilities.SPATIAL_QUERIES
])

/** The provider is synchronous; only initialize evaluates the concrete SDK. */
export function createSpatialRenderEngine(
  platform: EnginePlatform = {},
  options: SpatialEngineOptions = {},
  load: () => Promise<RenderEngine> = async () => {
    const { ThreeEngine } = await import('./three-engine.js')
    return new ThreeEngine(platform, options)
  }
): RenderEngine {
  let state: 'new' | 'loading' | 'ready' | 'retired' | 'failed' = 'new'
  let delegate: RenderEngine | undefined
  const retired = () => state === 'retired'
  const release = (): RenderEngineDestroyResult => {
    const owned = delegate
    delegate = undefined
    return (
      owned?.destroy() ?? {
        destroyedObjects: 0,
        destroyedResources: 0,
        alreadyDestroyed: false
      }
    )
  }
  const ready = (): RenderEngine => {
    if (state !== 'ready' || !delegate) {
      throw new Error('Spatial engine is not ready')
    }
    return delegate
  }
  return {
    name: 'Preset deferred spatial engine',
    capabilities: new Set(SPATIAL_ENGINE_CAPABILITIES),
    async initialize(input) {
      if (state !== 'new') {
        throw new Error('Spatial engine is not available for initialization')
      }
      state = 'loading'
      try {
        delegate = await load()
        if (retired()) {
          throw new Error('Spatial initialization retired')
        }
        assertRenderEngineCapabilities(delegate, SPATIAL_ENGINE_CAPABILITIES)
        const result = await delegate.initialize(input)
        if (retired()) {
          throw new Error('Spatial initialization retired')
        }
        state = 'ready'
        return result
      } catch (error) {
        if (!retired()) {
          state = 'failed'
        }
        release()
        throw error
      }
    },
    execute: (command) => ready().execute(command),
    query: (query) => ready().query(query),
    subscribeToInteraction: (listener) =>
      ready().subscribeToInteraction(listener),
    requestFrame: (callback) => ready().requestFrame(callback),
    cancelFrame() {
      if (state === 'ready') {
        ready().cancelFrame()
      }
    },
    destroy() {
      if (retired()) {
        return {
          destroyedObjects: 0,
          destroyedResources: 0,
          alreadyDestroyed: true
        }
      }
      const pending = state === 'loading'
      state = 'retired'
      // Initialization settles only after pending work and its cleanup settle.
      return pending
        ? {
            destroyedObjects: 0,
            destroyedResources: 0,
            alreadyDestroyed: false
          }
        : release()
    }
  }
}
