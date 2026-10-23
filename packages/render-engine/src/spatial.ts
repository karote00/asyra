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
  position: SpatialVector
  yaw: number
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
      shape: SpatialShape
      instances?: readonly SpatialInstance[]
      distant?: { shape: SpatialShape; maxError: number }
      surface?: SpatialSurface
      roughness?: number
      metalness?: number
      color: number
      opacity: number
      wireframe: boolean
      selectable: boolean
    }
