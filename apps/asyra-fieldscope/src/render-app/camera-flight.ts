import { lookSpatialCamera } from '@asyra/preset/spatial'
import type { SpatialCamera } from './spatial-layer'
export { moveSpatialCamera as moveCamera } from '@asyra/preset/spatial'
/** The App selects gesture sensitivity and polar limits. */
export function lookCamera(
  camera: SpatialCamera,
  dx: number,
  dy: number
): SpatialCamera {
  return lookSpatialCamera(camera, -dx * 0.004, dy * 0.004, {
    minPolar: 0.01,
    maxPolar: Math.PI - 0.01
  })
}
