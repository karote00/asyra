import { SpatialLayer as SharedSpatialLayer } from '@asyra/preset/spatial'
export type {
  SpatialCamera,
  SpatialMesh,
  SpatialFrame
} from '@asyra/preset/spatial'
export const SPATIAL_LAYER_NAME = 'farm.spatial-layer'
export class SpatialLayer extends SharedSpatialLayer {
  constructor(invalidate: () => void) {
    super(invalidate, { name: SPATIAL_LAYER_NAME })
  }
}
