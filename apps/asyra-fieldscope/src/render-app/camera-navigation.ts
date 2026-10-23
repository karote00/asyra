import type { SpatialCamera, SpatialFrame } from './spatial-layer'
import type { Point3 } from '../domain/greenhouse'
import { fitCamera } from './site-projection'

export interface SceneBounds {
  min: Point3
  max: Point3
}
const difference = (a: Point3, b: Point3): Point3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2]
]
const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Point3, b: Point3): Point3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]
const normalize = (value: Point3): Point3 => {
  const length = Math.hypot(...value)
  return [value[0] / length, value[1] / length, value[2] / length]
}
export const cameraDistance = (camera: SpatialCamera) =>
  Math.hypot(...difference(camera.position, camera.target))

/** One scan of admitted site geometry at startup, reused by every fit command. */
export function measureScene(
  meshes: SpatialFrame['meshes'],
  localBounds = new WeakMap<object, SceneBounds>()
): SceneBounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const mesh of meshes) {
    const { shape, position, rotation } = mesh.descriptor
    if (
      shape.kind !== 'triangles' ||
      rotation.some((value, i) => value !== [0, 0, 0, 1][i])
    )
      throw new Error('Site bounds require unrotated triangle geometry')
    const immutable = Object.isFrozen(shape) && Object.isFrozen(shape.positions)
    let bounds = immutable ? localBounds.get(shape) : undefined
    if (!bounds) {
      const min: [number, number, number] = [Infinity, Infinity, Infinity]
      const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
      for (let i = 0; i < shape.positions.length; i++) {
        const axis = i % 3
        const value = shape.positions[i]
        min[axis] = Math.min(min[axis], value)
        max[axis] = Math.max(max[axis], value)
      }
      bounds = { min, max }
      if (immutable) localBounds.set(shape, bounds)
    }
    const { min: localMin, max: localMax } = bounds
    const instances = mesh.descriptor.instances ?? [
      { position: [0, 0, 0], yaw: 0 }
    ]
    for (const instance of instances) {
      const c = Math.cos(instance.yaw),
        s = Math.sin(instance.yaw)
      // Yaw transforms X/Z intervals independently; their extrema equal the
      // eight transformed corners without allocating corners for every plant.
      const cx0 = c * localMin[0],
        cx1 = c * localMax[0]
      const sz0 = s * localMin[2],
        sz1 = s * localMax[2]
      const sx0 = -s * localMin[0],
        sx1 = -s * localMax[0]
      const cz0 = c * localMin[2],
        cz1 = c * localMax[2]
      const x = instance.position[0] + position[0]
      const y = instance.position[1] + position[1]
      const z = instance.position[2] + position[2]
      min[0] = Math.min(min[0], Math.min(cx0, cx1) + Math.min(sz0, sz1) + x)
      max[0] = Math.max(max[0], Math.max(cx0, cx1) + Math.max(sz0, sz1) + x)
      min[1] = Math.min(min[1], localMin[1] + y)
      max[1] = Math.max(max[1], localMax[1] + y)
      min[2] = Math.min(min[2], Math.min(sx0, sx1) + Math.min(cz0, cz1) + z)
      max[2] = Math.max(max[2], Math.max(sx0, sx1) + Math.max(cz0, cz1) + z)
    }
  }
  if (!min.every(Number.isFinite) || !max.every(Number.isFinite))
    throw new Error('Empty site bounds')
  return { min, max }
}

export function setCameraDistance(
  camera: SpatialCamera,
  distance: number
): SpatialCamera {
  if (!Number.isFinite(distance) || distance <= camera.near)
    throw new Error('Invalid camera distance')
  const back = normalize(difference(camera.position, camera.target))
  return {
    ...camera,
    position: camera.target.map((value, i) => value + back[i] * distance) as [
      number,
      number,
      number
    ]
  }
}

export function panCamera(
  camera: SpatialCamera,
  dx: number,
  dy: number,
  width: number,
  height: number,
  referenceDistance = cameraDistance(camera),
  referenceFov = camera.fov
): SpatialCamera {
  if (
    ![dx, dy, width, height, referenceDistance].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    referenceDistance <= 0
  )
    throw new Error('Invalid pan input')
  const back = normalize(difference(camera.position, camera.target))
  const right = normalize(cross([0, 1, 0], back)),
    up = cross(back, right)
  const unitsPerPixel =
    (2 *
      referenceDistance *
      Math.tan(
        (fitCamera({ ...camera, fov: referenceFov }, width / height).fov *
          Math.PI) /
          360
      )) /
    height
  const offset = right.map(
    (value, i) => (-dx * value + dy * up[i]) * unitsPerPixel
  )
  const translate = (point: Point3): Point3 =>
    point.map((value, i) => value + offset[i]) as [number, number, number]
  return {
    ...camera,
    position: translate(camera.position),
    target: translate(camera.target)
  }
}

/** Exact perspective corner constraints, in CSS pixels, with the current orientation. */
export function fitScene(
  camera: SpatialCamera,
  bounds: SceneBounds,
  width: number,
  height: number,
  padding = 24
): SpatialCamera {
  if (
    ![width, height, padding].every(Number.isFinite) ||
    padding < 0 ||
    width <= 2 * padding ||
    height <= 2 * padding
  )
    throw new Error('Viewport too small for fit padding')
  const target = bounds.min.map((value, i) => (value + bounds.max[i]) / 2) as [
    number,
    number,
    number
  ]
  const back = normalize(difference(camera.position, camera.target))
  const right = normalize(cross([0, 1, 0], back)),
    up = cross(back, right)
  const vertical = Math.tan(
    (fitCamera(camera, width / height).fov * Math.PI) / 360
  )
  const horizontal = (vertical * width) / height
  let distance = 0
  for (const x of [bounds.min[0], bounds.max[0]])
    for (const y of [bounds.min[1], bounds.max[1]])
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const p = difference([x, y, z], target),
          depth = dot(back, p)
        distance = Math.max(
          distance,
          depth +
            Math.abs(dot(right, p)) /
              (horizontal * (1 - (2 * padding) / width)),
          depth +
            Math.abs(dot(up, p)) / (vertical * (1 - (2 * padding) / height)),
          depth + camera.near
        )
      }
  return {
    ...camera,
    target,
    position: target.map((value, i) => value + back[i] * (distance + 1e-6)) as [
      number,
      number,
      number
    ],
    far: Math.max(
      camera.far,
      distance + Math.hypot(...difference(bounds.max, bounds.min))
    )
  }
}
