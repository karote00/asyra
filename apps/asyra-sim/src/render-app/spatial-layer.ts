import { SpatialLayer as SharedSpatialLayer } from '@asyra/preset/spatial'
export type {
  SpatialCamera,
  SpatialMesh,
  SpatialFrame
} from '@asyra/preset/spatial'
import { readSpatialDescriptor } from '../engine/spatial-contract'
export const SPATIAL_LAYER_NAME = 'sim.spatial-layer'
export class SpatialLayer extends SharedSpatialLayer {
  constructor(invalidate: () => void) {
    super(invalidate, {
      name: SPATIAL_LAYER_NAME,
      readDescriptor: readSpatialDescriptor
    })
  }
}
