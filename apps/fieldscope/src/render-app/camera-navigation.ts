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
export function measureScene(meshes: SpatialFrame['meshes']): SceneBounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const mesh of meshes) {
    const { shape, position, rotation } = mesh.descriptor
    if (
      shape.kind !== 'triangles' ||
      rotation.some((value, i) => value !== [0, 0, 0, 1][i])
    )
      throw new Error('Site bounds require unrotated triangle geometry')
    for (let i = 0; i < shape.positions.length; i++) {
      const axis = i % 3,
        value = shape.positions[i] + position[axis]
      min[axis] = Math.min(min[axis], value)
      max[axis] = Math.max(max[axis], value)
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
