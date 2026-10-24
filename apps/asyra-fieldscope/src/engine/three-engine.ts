import { readSpatialDescriptor } from '@asyra/preset/spatial-contract'
import { toSpatialProjection } from './spatial-contract'
import {
  ThreeEngine as SpatialEngine,
  type EnginePlatform
} from '@asyra/preset/spatial-engine'
export type { GraphicsDriver } from '@asyra/preset/spatial-engine'
/** Asyra FieldScope owns product composition; Preset owns the shared adapter. */
export class ThreeEngine extends SpatialEngine {
  constructor(platform: EnginePlatform = {}) {
    super(platform, {
      softwareShadowFallback: true,
      lighting: {
        hemisphere: [0xe6eedf, 0xb4bea5, 2],
        keyPosition: [-15, 35, -20],
        fillPosition: [25, 20, 20],
        shadowExtent: 40,
        shadowFar: 110,
        keyColor: 0xfff3e5,
        keyIntensity: 2.6,
        fillColor: 0xb6d5f5,
        fillIntensity: 1.2
      },
      readDescriptor: (value) => {
        const instances = (value as { instances?: readonly { yaw?: number }[] })
          ?.instances
        return instances?.every((item) => item.yaw === undefined)
          ? readSpatialDescriptor(value)
          : toSpatialProjection(value)
      }
    })
  }
}
