import {
  ThreeEngine as SpatialEngine,
  type EnginePlatform
} from '@asyra/preset/spatial'
import { SPATIAL_CAPABILITY } from './spatial-contract'
export type { GraphicsDriver } from '@asyra/preset/spatial'
/** FieldScope owns product composition; Preset owns the shared adapter. */
export class ThreeEngine extends SpatialEngine {
  constructor(platform: EnginePlatform = {}) {
    super(platform, { capability: SPATIAL_CAPABILITY })
  }
}
