/** Engine-neutral spatial data. Admission belongs to Preset. */
export interface SpatialSurface {
  readonly width: number
  readonly height: number
  readonly albedo: readonly number[]
  readonly normals: readonly number[]
}

export type SpatialVector = readonly [number, number, number]
export type SpatialQuaternion = readonly [number, number, number, number]
export type SpatialShape =
  | { kind: 'box'; size: SpatialVector }
  | { kind: 'sphere'; radius: number }
  | { kind: 'capsule'; radius: number; length: number }
  | {
      kind: 'triangles'
      positions: readonly number[]
      colors?: readonly number[]
      uvs?: readonly number[]
      indices: readonly number[]
    }

export interface SpatialInstance {
  id: string
  position: SpatialVector
  rotation: SpatialQuaternion
  scale?: SpatialVector
}

export type SpatialDescriptor =
  | {
      kind: 'camera'
      position: SpatialVector
      target: SpatialVector
      fov: number
      near: number
      far: number
    }
  | {
      kind: 'mesh'
      position: SpatialVector
      rotation: SpatialQuaternion
      scale?: SpatialVector
      castShadow?: boolean
      receiveShadow?: boolean
      shape: SpatialShape
      instances?: readonly SpatialInstance[]
      distant?: { shape: SpatialShape; maxError: number; pixelError?: number }
      surface?: SpatialSurface
      roughness?: number
      metalness?: number
      /** Opt-in shared studio reflection intensity; zero keeps the environment disabled. */
      environmentIntensity?: number
      /** sRGB self-emission color; zero is non-emissive. Does not cast light. */
      emissive?: number
      /** Finite nonnegative self-emission multiplier; defaults to zero. */
      emissiveIntensity?: number
      color: number
      opacity: number
      wireframe: boolean
      selectable: boolean
    }

export interface SpatialRay {
  readonly origin: SpatialVector
  readonly direction: SpatialVector
}
export interface SpatialBox {
  readonly min: SpatialVector
  readonly max: SpatialVector
}
export type RenderEngineSpatialQuery =
  | { readonly type: 'spatial-project'; readonly point: SpatialVector }
  | {
      readonly type: 'spatial-pick'
      readonly point: import('./types.js').RenderEnginePoint
    }
  | {
      readonly type: 'spatial-ray'
      readonly point: import('./types.js').RenderEnginePoint
    }
  | {
      readonly type: 'spatial-convert'
      readonly object: import('./types.js').RenderEngineObjectHandle
      readonly point: SpatialVector
      readonly to: 'local' | 'world'
      readonly instanceIndex?: number
    }
  | {
      readonly type: 'spatial-bounds'
      readonly object: import('./types.js').RenderEngineObjectHandle
      readonly space: 'local' | 'world'
      readonly instanceIndex?: number
    }
  | { readonly type: 'spatial-raycast'; readonly ray: SpatialRay }
export interface RenderEngineSpatialHit {
  readonly object: import('./types.js').RenderEngineObjectHandle
  readonly instanceIndex?: number
  readonly instanceId?: string
  readonly distance: number
  readonly point: SpatialVector
}
export interface RenderEngineSpatialProjection {
  readonly type: 'spatial-projection'
  readonly point: import('./types.js').RenderEnginePoint | null
  readonly depth: number | null
  readonly inFrustum: boolean
}
export type RenderEngineSpatialResult =
  | {
      readonly type: 'spatial-pick'
      readonly overlay: import('./types.js').RenderEngineObjectHandle | null
      readonly hit: RenderEngineSpatialHit | null
    }
  | RenderEngineSpatialProjection
  | { readonly type: 'spatial-ray'; readonly ray: SpatialRay | null }
  | { readonly type: 'spatial-point'; readonly point: SpatialVector }
  | { readonly type: 'spatial-bounds'; readonly bounds: SpatialBox | null }
  | {
      readonly type: 'spatial-hits'
      readonly hits: readonly RenderEngineSpatialHit[]
    }
export function isSpatialQuery(
  query: import('./types.js').RenderEngineQuery
): query is RenderEngineSpatialQuery {
  switch (query.type) {
    case 'spatial-pick':
    case 'spatial-project':
    case 'spatial-ray':
    case 'spatial-convert':
    case 'spatial-bounds':
    case 'spatial-raycast':
      return true
    default:
      return false
  }
}
