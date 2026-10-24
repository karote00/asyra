import { toSpatialProjection } from '../engine/spatial-contract'
import type { SpatialCamera, SpatialFrame } from './spatial-layer'
import { fitCamera } from './site-projection'

import {
  spatialCameraDistance,
  dollySpatialCamera,
  panSpatialCamera,
  fitSpatialCameraBounds,
  SpatialBoundsOwner,
  type SpatialBounds
} from '@asyra/preset/spatial'
export type SceneBounds = SpatialBounds
export { spatialCameraDistance as cameraDistance } from '@asyra/preset/spatial'
export function setCameraDistance(
  camera: SpatialCamera,
  distance: number
): SpatialCamera {
  if (!Number.isFinite(distance) || distance <= camera.near)
    throw new Error('Invalid camera distance')
  return dollySpatialCamera(camera, distance)
}
/** Site framing keeps its nonempty-scene policy; Preset owns presentation bounds. */
export function measureScene(
  meshes: SpatialFrame['meshes'],
  owner?: SpatialBoundsOwner
): SceneBounds {
  const bounds = owner ?? new SpatialBoundsOwner()
  try {
    const result = bounds.measure(
      meshes.map(
        (mesh) =>
          toSpatialProjection(
            mesh.descriptor
          ) as import('@asyra/preset/spatial').SpatialMesh
      )
    )
    if (!result) throw new Error('Empty site bounds')
    return result
  } finally {
    if (!owner) bounds.dispose()
  }
}

export function panCamera(
  camera: SpatialCamera,
  dx: number,
  dy: number,
  width: number,
  height: number,
  referenceDistance = spatialCameraDistance(camera),
  referenceFov = camera.fov
): SpatialCamera {
  return panSpatialCamera(camera, dx, dy, height, {
    distance: referenceDistance,
    fov: fitCamera({ ...camera, fov: referenceFov }, width / height).fov
  })
}
export function fitScene(
  camera: SpatialCamera,
  bounds: SceneBounds,
  width: number,
  height: number,
  padding = 24
): SpatialCamera {
  return fitSpatialCameraBounds(camera, bounds, width, height, {
    padding,
    verticalFov: fitCamera(camera, width / height).fov
  })
}
