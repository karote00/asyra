import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'

interface Point {
  x: number
  y: number
  z: number
}
interface ScreenPoint {
  x: number
  y: number
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const fail = (): never => {
  throw new Error(
    'Invalid projected face: choose polygon vertices or ellipse:{center,u,v}; use finite world coordinates and independent nonzero radius vectors. Ellipses do not accept segments. No canvas changes were made.'
  )
}
const point = (v: unknown): Point => {
  if (!record(v) || Object.keys(v).some((k) => !['x', 'y', 'z'].includes(k)))
    return fail()
  const read = (k: string) =>
    typeof v[k] === 'number' &&
    Number.isFinite(v[k]) &&
    Math.abs(v[k] as number) <= limits.dimension
      ? (v[k] as number)
      : fail()
  return { x: read('x'), y: read('y'), z: read('z') }
}
/** Native ovals have object cost; explicit polygons own path command cost. */
export const facePointCount = (value: unknown): number => {
  if (!record(value) || value.ellipse !== undefined) return 0
  const vertices = value.vertices
  return Array.isArray(vertices) ? vertices.length : 0
}
export const readFaceVertices = (
  face: Record<string, unknown>,
  capacity: number
): unknown[] => {
  const vertices = face.vertices
  if (
    face.ellipse !== undefined ||
    !Array.isArray(vertices) ||
    vertices.length < 3 ||
    vertices.length > Math.min(limits.pathCommands, capacity)
  )
    return fail()
  return vertices
}
/** One analytic projection per source template. No sampled contour or renderer access. */
export const projectFaceEllipse = (
  face: Record<string, unknown>,
  project: (p: Point) => ScreenPoint
) => {
  if (
    face.vertices !== undefined ||
    !record(face.ellipse) ||
    Object.keys(face.ellipse).some((k) => !['center', 'u', 'v'].includes(k))
  )
    return fail()
  const center = point(face.ellipse.center),
    u = point(face.ellipse.u),
    v = point(face.ellipse.v)
  if (
    !Math.hypot(
      u.y * v.z - u.z * v.y,
      u.z * v.x - u.x * v.z,
      u.x * v.y - u.y * v.x
    )
  )
    return fail()
  const bounds = { min: { ...center }, max: { ...center } }
  for (const k of ['x', 'y', 'z'] as const) {
    const radius = Math.hypot(u[k], v[k])
    bounds.min[k] -= radius
    bounds.max[k] += radius
    if (
      Math.max(Math.abs(bounds.min[k]), Math.abs(bounds.max[k])) >
      limits.dimension
    )
      return fail()
  }
  const c = project(center),
    zero = project({ x: 0, y: 0, z: 0 }),
    pu = project(u),
    pv = project(v)
  const a = { x: pu.x - zero.x, y: pu.y - zero.y },
    b = { x: pv.x - zero.x, y: pv.y - zero.y }
  const xx = a.x * a.x + b.x * b.x,
    xy = a.x * a.y + b.x * b.y,
    yy = a.y * a.y + b.y * b.y
  const major = (xx + yy + Math.hypot(xx - yy, 2 * xy)) / 2,
    det = a.x * b.y - a.y * b.x
  const minor = (det * det) / major
  if (!(major > 0 && minor > 0) || !Number.isFinite(major + minor))
    return fail()
  const width = 2 * Math.sqrt(major),
    height = 2 * Math.sqrt(minor),
    rotation = Math.atan2(2 * xy, xx - yy) / 2
  if (width > limits.dimension || height > limits.dimension) return fail()
  const cos = Math.cos(rotation),
    sin = Math.sin(rotation)
  const x = c.x - (cos * width) / 2 + (sin * height) / 2,
    y = c.y - (sin * width) / 2 - (cos * height) / 2
  const world = [
    center,
    { x: center.x + u.x, y: center.y + u.y, z: center.z + u.z },
    { x: center.x + v.x, y: center.y + v.y, z: center.z + v.z }
  ]
  const local = [
    { x: width / 2, y: height / 2 },
    {
      x: width / 2 + cos * a.x + sin * a.y,
      y: height / 2 - sin * a.x + cos * a.y
    },
    {
      x: width / 2 + cos * b.x + sin * b.y,
      y: height / 2 - sin * b.x + cos * b.y
    }
  ]
  return { width, height, rotation, x, y, bounds, world, local }
}
