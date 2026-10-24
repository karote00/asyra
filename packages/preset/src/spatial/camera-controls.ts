import type { SpatialVector } from '@asyra/render-engine'
import { readSpatialDescriptor } from './spatial-contract.js'
import type { SpatialCamera } from './spatial-layer.js'
import type { SpatialBounds } from './bounds.js'
type Vector = SpatialVector
const finite = (...values: number[]) => {
  if (!values.every(Number.isFinite))
    throw new Error('Invalid camera control input')
}
const tuple = (values: number[]): Vector => [values[0], values[1], values[2]]
const add = (a: Vector, b: Vector): Vector => tuple(a.map((n, i) => n + b[i]))
const sub = (a: Vector, b: Vector): Vector => tuple(a.map((n, i) => n - b[i]))
const scale = (a: Vector, n: number): Vector => tuple(a.map((v) => v * n))
const dot = (a: Vector, b: Vector) => a.reduce((n, v, i) => n + v * b[i], 0)
const cross = (a: Vector, b: Vector): Vector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]
const normalize = (v: Vector): Vector => scale(v, 1 / Math.hypot(...v))
/** Uses the same admission owner as spatial submission. */
export function readSpatialCamera(value: unknown): SpatialCamera {
  const camera = readSpatialDescriptor(value)
  if (camera.kind !== 'camera') throw new Error('Expected perspective camera')
  return camera
}
function basis(camera: SpatialCamera) {
  camera = readSpatialCamera(camera)
  const back = normalize(sub(camera.position, camera.target))
  const right = normalize(cross([0, 1, 0], back))
  return { back, right, up: cross(back, right) }
}
export function spatialCameraDistance(camera: SpatialCamera): number {
  camera = readSpatialCamera(camera)
  return Math.hypot(...sub(camera.position, camera.target))
}
export function moveSpatialCamera(
  camera: SpatialCamera,
  right: number,
  up: number,
  forward: number
): SpatialCamera {
  camera = readSpatialCamera(camera)
  finite(right, up, forward)
  const b = basis(camera)
  const offset = add(
    add(scale(b.right, right), scale(b.up, up)),
    scale(b.back, -forward)
  )
  return readSpatialCamera({
    ...camera,
    position: add(camera.position, offset),
    target: add(camera.target, offset)
  })
}
export function panSpatialCamera(
  camera: SpatialCamera,
  dx: number,
  dy: number,
  height: number,
  reference: { distance: number; fov: number }
): SpatialCamera {
  finite(dx, dy, height, reference.distance, reference.fov)
  if (
    height <= 0 ||
    reference.distance <= 0 ||
    reference.fov <= 0 ||
    reference.fov >= 180
  )
    throw new Error('Invalid camera pan')
  const units =
    (2 * reference.distance * Math.tan((reference.fov * Math.PI) / 360)) /
    height
  return moveSpatialCamera(camera, -dx * units, dy * units, 0)
}
export function dollySpatialCamera(
  camera: SpatialCamera,
  distance: number
): SpatialCamera {
  camera = readSpatialCamera(camera)
  finite(distance)
  const b = basis(camera)
  if (distance <= 0) throw new Error('Invalid camera distance')
  return readSpatialCamera({
    ...camera,
    position: add(camera.target, scale(b.back, distance))
  })
}
export interface SpatialPolarLimits {
  minPolar: number
  maxPolar: number
}
function rotate(
  camera: SpatialCamera,
  yaw: number,
  polar: number,
  limits: SpatialPolarLimits,
  orbit: boolean
): SpatialCamera {
  camera = readSpatialCamera(camera)
  finite(yaw, polar, limits.minPolar, limits.maxPolar)
  if (
    limits.minPolar <= 0 ||
    limits.maxPolar >= Math.PI ||
    limits.minPolar > limits.maxPolar
  )
    throw new Error('Invalid polar limits')
  const offset = orbit
    ? sub(camera.position, camera.target)
    : sub(camera.target, camera.position)
  const radius = Math.hypot(...offset)
  const theta = Math.atan2(offset[0], offset[2]) + yaw
  const phi = Math.max(
    limits.minPolar,
    Math.min(
      limits.maxPolar,
      Math.acos(Math.max(-1, Math.min(1, offset[1] / radius))) + polar
    )
  )
  const result = add(orbit ? camera.target : camera.position, [
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  ])
  return readSpatialCamera({
    ...camera,
    ...(orbit ? { position: result } : { target: result })
  })
}
export const orbitSpatialCamera = (
  camera: SpatialCamera,
  yaw: number,
  polar: number,
  limits: SpatialPolarLimits
) => rotate(camera, yaw, polar, limits, true)
export const lookSpatialCamera = (
  camera: SpatialCamera,
  yaw: number,
  polar: number,
  limits: SpatialPolarLimits
) => rotate(camera, yaw, polar, limits, false)
export function zoomSpatialCamera(
  camera: SpatialCamera,
  magnification: number,
  maxFov: number
): SpatialCamera {
  camera = readSpatialCamera(camera)
  finite(magnification, maxFov)
  if (magnification <= 0 || maxFov <= 0 || maxFov >= 180)
    throw new Error('Invalid camera zoom')
  return readSpatialCamera({
    ...camera,
    fov: Math.min(
      maxFov,
      (360 / Math.PI) *
        Math.atan(Math.tan((camera.fov * Math.PI) / 360) / magnification)
    )
  })
}
export function projectSpatialCamera(
  camera: SpatialCamera,
  aspect: number,
  policy: { projection: 'perspective'; minimumAspect: number; maxFov: number }
): SpatialCamera {
  if (policy.projection !== 'perspective')
    throw new Error('Unsupported world camera projection')
  finite(aspect, policy.minimumAspect)
  if (aspect <= 0 || policy.minimumAspect <= 0)
    throw new Error('Invalid viewport aspect')
  return zoomSpatialCamera(
    camera,
    1 / Math.max(1, policy.minimumAspect / aspect),
    policy.maxFov
  )
}
function viewport(width: number, height: number, padding: number) {
  finite(width, height, padding)
  if (padding < 0 || width <= 2 * padding || height <= 2 * padding)
    throw new Error('Viewport too small for fit padding')
}
export function fitSpatialCameraBounds(
  camera: SpatialCamera,
  bounds: SpatialBounds | null,
  width: number,
  height: number,
  options: { padding: number; verticalFov: number }
): SpatialCamera {
  const original = camera
  camera = readSpatialCamera(camera)
  const b = basis(camera)
  viewport(width, height, options.padding)
  finite(options.verticalFov)
  if (options.verticalFov <= 0 || options.verticalFov >= 180)
    throw new Error('Invalid fit FOV')
  if (!bounds) return original
  finite(...bounds.min, ...bounds.max)
  if (bounds.min.some((n, i) => n > bounds.max[i]))
    throw new Error('Invalid bounds')
  const target = tuple(bounds.min.map((n, i) => (n + bounds.max[i]) / 2))
  const vertical = Math.tan((options.verticalFov * Math.PI) / 360),
    horizontal = (vertical * width) / height
  let distance = 0
  for (const x of [bounds.min[0], bounds.max[0]])
    for (const y of [bounds.min[1], bounds.max[1]])
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const p = sub([x, y, z], target),
          depth = dot(b.back, p)
        distance = Math.max(
          distance,
          depth +
            Math.abs(dot(b.right, p)) /
              (horizontal * (1 - (2 * options.padding) / width)),
          depth +
            Math.abs(dot(b.up, p)) /
              (vertical * (1 - (2 * options.padding) / height)),
          depth + camera.near
        )
      }
  distance += 1e-6
  return readSpatialCamera({
    ...camera,
    target,
    position: add(target, scale(b.back, distance)),
    far: Math.max(
      camera.far,
      distance + Math.hypot(...sub(bounds.max, bounds.min))
    )
  })
}
/** Frame an App-selected point set using its enclosing view-space prism. */
export function frameSpatialCameraPoints(
  camera: SpatialCamera,
  points: Iterable<Vector>,
  width: number,
  height: number,
  options: {
    padding: number
    minDistance: number
    nearFraction: number
    minimumFarPadding: number
    farPaddingRatio: number
  }
): SpatialCamera {
  const original = camera
  camera = readSpatialCamera(camera)
  const b = basis(camera)
  viewport(width, height, options.padding)
  finite(
    options.minDistance,
    options.nearFraction,
    options.minimumFarPadding,
    options.farPaddingRatio
  )
  if (
    options.minDistance <= 0 ||
    options.nearFraction <= 0 ||
    options.nearFraction >= 1 ||
    options.minimumFarPadding < 0 ||
    options.farPaddingRatio < 0
  )
    throw new Error('Invalid framing limits')
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]
  let count = 0
  for (const point of points) {
    finite(...point)
    const p = [dot(point, b.right), dot(point, b.up), dot(point, b.back)]
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], p[i])
      max[i] = Math.max(max[i], p[i])
    }
    count++
  }
  if (!count) return original
  const middle = tuple(min.map((n, i) => n + (max[i] - n) / 2)),
    half = tuple(min.map((n, i) => (max[i] - n) / 2))
  const target = add(
    add(scale(b.right, middle[0]), scale(b.up, middle[1])),
    scale(b.back, middle[2])
  )
  const tan = Math.tan((camera.fov * Math.PI) / 360)
  const distance =
    half[2] +
    Math.max(
      options.minDistance,
      half[0] /
        (((tan * width) / height) * (1 - (2 * options.padding) / width)),
      half[1] / (tan * (1 - (2 * options.padding) / height))
    )
  return readSpatialCamera({
    ...camera,
    target,
    position: add(target, scale(b.back, distance)),
    near: Math.min(camera.near, (distance - half[2]) * options.nearFraction),
    far: Math.max(
      camera.far,
      distance +
        half[2] +
        Math.max(options.minimumFarPadding, distance * options.farPaddingRatio)
    )
  })
}
