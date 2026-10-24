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
/** Resolve source geometry before compilation or slicing; never add source nodes. */
export const resolveSurfaceBoundaries = (input: unknown): unknown => {
  if (!record(input) || !Array.isArray(input.children)) return input
  let remaining = limits.expandedNodes - 1
  const scope = (members: unknown[], patterns = true): unknown[] => {
    remaining -= members.length
    if (remaining < 0)
      throw new Error('Invalid surface source: source node limit exceeded.')
    let index: Map<unknown, Record<string, unknown> | null> | undefined
    let changed = false
    const result = members.map((member) => {
      if (!record(member)) return member
      if (
        patterns &&
        member.type === 'pattern' &&
        Array.isArray(member.members)
      ) {
        const resolved = scope(member.members, false)
        if (resolved === member.members) return member
        changed = true
        return { ...member, members: resolved }
      }
      if (member.type !== 'surface-grid' || Array.isArray(member.boundary))
        return member
      const reference = member.boundary
      const invalid = (): never => {
        throw new Error(
          'Invalid surface grid boundary reference: use boundary:{face:key} for exactly one four-vertex projected-face in the same root children or pattern members scope, or supply four explicit corners. No canvas changes were made.'
        )
      }
      if (
        !record(reference) ||
        Object.keys(reference).length !== 1 ||
        typeof reference.face !== 'string' ||
        !reference.face.trim() ||
        reference.face.length > 160
      )
        return invalid()
      if (!index) {
        index = new Map()
        for (const item of members)
          if (record(item)) {
            const key = item.key
            index.set(key, index.has(key) ? null : item)
          }
      }
      const target = index.get(reference.face)
      if (
        !target ||
        target.type !== 'projected-face' ||
        target.ellipse !== undefined
      )
        return invalid()
      const vertices = target.vertices
      if (!Array.isArray(vertices) || vertices.length !== 4) return invalid()
      changed = true
      return { ...member, boundary: vertices }
    })
    return changed ? result : members
  }
  const children = scope(input.children)
  return children === input.children ? input : { ...input, children }
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
