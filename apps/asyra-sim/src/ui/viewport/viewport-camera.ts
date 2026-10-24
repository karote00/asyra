import {
  dollySpatialCamera,
  panSpatialCamera,
  spatialCameraDistance,
  frameSpatialCameraPoints
} from '@asyra/preset/spatial'
import { scale, transformPoint, type Vec3 } from '../../domain/math'
import type {
  SpatialCamera,
  SpatialFrame
} from '../../render-app/spatial-layer'

export const VIEWPORT_PADDING = 32

const WHEEL_LINE_PIXELS = 16

/** Two-finger scroll, mouse wheel and Chromium pinch share target-centered zoom. */
export function wheelCamera(
  camera: SpatialCamera,
  event: Pick<WheelEvent, 'deltaX' | 'deltaY' | 'deltaMode'>,
  height: number
): SpatialCamera {
  if (
    !Number.isFinite(height) ||
    height <= 0 ||
    ![event.deltaX, event.deltaY].every(Number.isFinite)
  )
    return camera

  let dy = event.deltaY

  if (event.deltaMode === 1) {
    dy *= WHEEL_LINE_PIXELS
  } else if (event.deltaMode === 2) {
    dy *= height
  }

  if (!dy) return camera

  const radius = spatialCameraDistance(camera)
  const next = Math.max(
    0.15,
    radius * Math.exp(Math.max(-100, Math.min(100, dy)) * 0.002)
  )
  return dollySpatialCamera(
    { ...camera, far: camera.far + Math.max(0, next - radius) },
    next
  )
}

/** Translate the eye and target together in the target's screen plane. */
export function panCamera(
  camera: SpatialCamera,
  dx: number,
  dy: number,
  height: number
): SpatialCamera {
  if (!Number.isFinite(height) || height <= 0) return camera

  return panSpatialCamera(camera, dx, dy, height, {
    distance: spatialCameraDistance(camera),
    fov: camera.fov
  })
}

/** Display framing only: these bounds never enter the collision method. */
export function fitCameraToMeshes(
  camera: SpatialCamera,
  meshes: SpatialFrame['meshes'],
  width: number,
  height: number
): SpatialCamera {
  if (
    ![width, height].every(
      (value) => Number.isFinite(value) && value > 2 * VIEWPORT_PADDING
    )
  )
    return camera

  function* points(): IterableIterator<Vec3> {
    for (const { visible, descriptor } of meshes) {
      if (!visible || !descriptor.selectable) continue
      const shape = descriptor.shape
      if (shape.kind === 'triangles') {
        for (const index of shape.indices) {
          const offset = index * 3
          yield transformPoint(descriptor, [
            shape.positions[offset],
            shape.positions[offset + 1],
            shape.positions[offset + 2]
          ])
        }
      } else {
        let half: Vec3
        if (shape.kind === 'box') half = scale(shape.size, 0.5)
        else if (shape.kind === 'capsule')
          half = [shape.radius, shape.length / 2 + shape.radius, shape.radius]
        else half = [shape.radius, shape.radius, shape.radius]
        for (const x of [-half[0], half[0]])
          for (const y of [-half[1], half[1]])
            for (const z of [-half[2], half[2]])
              yield transformPoint(descriptor, [x, y, z])
      }
    }
  }

  return frameSpatialCameraPoints(camera, points(), width, height, {
    padding: VIEWPORT_PADDING,
    minDistance: 0.15,
    nearFraction: 0.5,
    minimumFarPadding: 1,
    farPaddingRatio: 0.01
  })
}
