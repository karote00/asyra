import type { SpatialCamera } from './spatial-layer'

/** Local camera axes, metres; translation preserves orientation and optical zoom. */
export function moveCamera(
  camera: SpatialCamera,
  right: number,
  up: number,
  forward: number
): SpatialCamera {
  if (![right, up, forward].every(Number.isFinite))
    throw new Error('Invalid camera movement')
  const direction = camera.target.map((v, i) => v - camera.position[i])
  const distance = Math.hypot(...direction)
  const f = direction.map((v) => v / distance)
  const lateralLength = Math.hypot(f[0], f[2])
  const r =
    lateralLength > 1e-8
      ? [-f[2] / lateralLength, 0, f[0] / lateralLength]
      : [1, 0, 0]
  const u = [
    r[1] * f[2] - r[2] * f[1],
    r[2] * f[0] - r[0] * f[2],
    r[0] * f[1] - r[1] * f[0]
  ]
  const offset = f.map((v, i) => v * forward + r[i] * right + u[i] * up)
  return {
    ...camera,
    position: camera.position.map((v, i) => v + offset[i]) as [
      number,
      number,
      number
    ],
    target: camera.target.map((v, i) => v + offset[i]) as [
      number,
      number,
      number
    ]
  }
}

/** Look around the fixed camera position; world up prevents unwanted roll. */
export function lookCamera(
  camera: SpatialCamera,
  dx: number,
  dy: number
): SpatialCamera {
  if (![dx, dy].every(Number.isFinite)) throw new Error('Invalid camera look')
  const [x, y, z] = camera.target.map((v, i) => v - camera.position[i])
  const radius = Math.hypot(x, y, z)
  const theta = Math.atan2(x, z) - dx * 0.004
  const phi = Math.max(
    0.01,
    Math.min(
      Math.PI - 0.01,
      Math.acos(Math.max(-1, Math.min(1, y / radius))) + dy * 0.004
    )
  )
  return {
    ...camera,
    target: [
      camera.position[0] + radius * Math.sin(phi) * Math.sin(theta),
      camera.position[1] + radius * Math.cos(phi),
      camera.position[2] + radius * Math.sin(phi) * Math.cos(theta)
    ]
  }
}
