import { SpatialLayer as SharedSpatialLayer } from '@asyra/preset/spatial'
import {
  toSpatialProjection,
  type SpatialDescriptor
} from '../engine/spatial-contract'
export type SpatialCamera = Extract<SpatialDescriptor, { kind: 'camera' }>
export type SpatialMesh = Extract<SpatialDescriptor, { kind: 'mesh' }>
export interface SpatialFrame {
  camera: SpatialCamera
  meshes: readonly {
    id: string
    elementId?: string
    descriptor: SpatialMesh
    visible: boolean
  }[]
}
export const SPATIAL_LAYER_NAME = 'farm.spatial-layer'
export class SpatialLayer {
  private readonly shared: SharedSpatialLayer
  constructor(invalidate: () => void) {
    this.shared = new SharedSpatialLayer(invalidate, {
      name: SPATIAL_LAYER_NAME
    })
  }
  get registration() {
    return this.shared.registration
  }
  submit(frame: SpatialFrame): void {
    this.shared.submit({
      ...frame,
      meshes: frame.meshes.map((mesh) => ({
        ...mesh,
        descriptor: toSpatialProjection(mesh.descriptor) as Extract<
          ReturnType<typeof toSpatialProjection>,
          { kind: 'mesh' }
        >
      }))
    })
  }
  submitCamera(camera: SpatialCamera): void {
    this.shared.submitCamera(camera)
  }
  dispose(): void {
    this.shared.dispose()
  }
}
