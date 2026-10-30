import type { Core } from '@asyra/core'
import {
  SPATIAL_MESH_SCHEMA,
  SPATIAL_MESH_PROPERTY_DEFINITION,
  SPATIAL_MESH_COMPONENT_DEFINITION,
  SPATIAL_MESH_RENDER_STRATEGY,
  SPATIAL_MESH_COMPONENT,
  SPATIAL_MESH_PROPERTY,
  SPATIAL_MODEL_REGISTRATION
} from './components.js'
type SpatialRegistrationCore = Pick<
  Core,
  | 'isCompositionOpen'
  | 'registerPropertySchema'
  | 'definePropertyComponent'
  | 'defineComponent'
  | 'registerRenderStrategy'
  | 'unregisterPropertyType'
  | 'unregisterComponent'
  | 'unregisterRenderStrategy'
  | 'getRegistration'
  | 'getPropertySchema'
  | 'getPropertyComponent'
>
/** Optional ordinary Core registrations. Core owns successful runtime teardown. */
export function registerSpatialMesh(core: SpatialRegistrationCore): () => void {
  if (!core.isCompositionOpen()) {
    throw new Error('Spatial registration requires open composition')
  }
  if (
    core.getPropertySchema(SPATIAL_MESH_PROPERTY) ||
    core.getPropertyComponent(SPATIAL_MESH_PROPERTY) ||
    core.getRegistration({ kind: 'component', key: SPATIAL_MESH_COMPONENT }) ||
    core.getRegistration({
      kind: 'render-strategy',
      key: SPATIAL_MESH_COMPONENT
    })
  ) {
    throw new Error('Spatial model already registered')
  }
  const cleanups: (() => void)[] = []
  const cleanup = () => {
    const failures: unknown[] = []
    for (let i = cleanups.length - 1; i >= 0; i--) {
      try {
        cleanups[i]()
        cleanups.splice(i, 1)
      } catch (error) {
        failures.push(error)
      }
    }
    if (failures.length) {
      throw Object.assign(new Error('Spatial registration cleanup failed'), {
        errors: failures
      })
    }
  }
  const owned = (
    kind: 'property' | 'component' | 'render-strategy',
    key: string
  ) => {
    const owner = core.getRegistration({ kind, key })?.owner
    return (
      owner?.name === SPATIAL_MODEL_REGISTRATION.owner.name &&
      owner?.packageName === SPATIAL_MODEL_REGISTRATION.owner.packageName
    )
  }

  try {
    core.registerPropertySchema(
      SPATIAL_MESH_SCHEMA,
      undefined,
      SPATIAL_MODEL_REGISTRATION
    )
    cleanups.push(() => {
      if (owned('property', SPATIAL_MESH_PROPERTY)) {
        core.unregisterPropertyType(SPATIAL_MESH_PROPERTY)
      }
    })
    core.definePropertyComponent(SPATIAL_MESH_PROPERTY_DEFINITION)
    core.defineComponent(SPATIAL_MESH_COMPONENT_DEFINITION)
    cleanups.push(() => {
      if (owned('component', SPATIAL_MESH_COMPONENT)) {
        core.unregisterComponent(SPATIAL_MESH_COMPONENT)
      }
    })
    core.registerRenderStrategy(
      SPATIAL_MESH_COMPONENT,
      SPATIAL_MESH_RENDER_STRATEGY,
      {
        ...SPATIAL_MODEL_REGISTRATION,
        relations: [
          {
            name: 'component',
            target: { kind: 'component', key: SPATIAL_MESH_COMPONENT },
            onTargetUnregister: 'unregister-source'
          }
        ]
      }
    )
    cleanups.push(() => {
      if (owned('render-strategy', SPATIAL_MESH_COMPONENT)) {
        core.unregisterRenderStrategy(SPATIAL_MESH_COMPONENT)
      }
    })
  } catch (error) {
    try {
      cleanup()
    } catch (cleanupError) {
      throw Object.assign(new Error('Spatial registration failed'), {
        errors: [error, cleanupError]
      })
    }
    throw error
  }
  return cleanup
}
