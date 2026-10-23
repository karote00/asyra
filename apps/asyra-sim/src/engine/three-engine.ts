import {
  ThreeEngine as SpatialEngine,
  type EnginePlatform
} from '@asyra/preset/spatial-engine'
import { readSpatialDescriptor } from './spatial-contract'
export type { GraphicsDriver } from '@asyra/preset/spatial-engine'
/** Sim retains its strict descriptor admission and compact workcell lighting. */
export class ThreeEngine extends SpatialEngine {
  constructor(platform: EnginePlatform = {}) {
    super(platform, {
      softwareShadowFallback: false,
      readDescriptor: readSpatialDescriptor,
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
