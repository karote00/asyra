import {
  ThreeEngine as SpatialEngine,
  type EnginePlatform
} from '@asyra/preset/spatial'
import {
  SPATIAL_CAPABILITY,
  readSpatialDescriptor,
  sameSpatialShape
} from './spatial-contract'
export type { GraphicsDriver } from '@asyra/preset/spatial'
/** Sim retains its strict descriptor admission and compact workcell lighting. */
export class ThreeEngine extends SpatialEngine {
  constructor(platform: EnginePlatform = {}) {
    super(platform, {
      capability: SPATIAL_CAPABILITY,
      softwareShadowFallback: false,
      readDescriptor: readSpatialDescriptor,
      sameShape: sameSpatialShape,
      lighting: {
        hemisphere: [0xd7eaff, 0x4b5366, 1.3],
        keyPosition: [3, 6, 4],
        fillPosition: [-3, 3, -4],
        shadowExtent: 4,
        shadowFar: 20
      }
    })
  }
}
