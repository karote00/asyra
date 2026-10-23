import {
  ThreeEngine as SpatialEngine,
  type EnginePlatform
} from '@asyra/preset/spatial-engine'
export type { GraphicsDriver } from '@asyra/preset/spatial-engine'
/** Asyra FieldScope owns product composition; Preset owns the shared adapter. */
export class ThreeEngine extends SpatialEngine {
  constructor(platform: EnginePlatform = {}) {
    super(platform)
  }
}
