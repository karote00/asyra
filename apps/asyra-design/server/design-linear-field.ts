import {
  isDesignGradient,
  type DesignGradientData
} from '../src/ai/design-fill'

type DesignGradientStop = DesignGradientData['gradientStops'][number]
import { DesignPreparationLimits } from '../src/ai/prepared-design'

interface Point {
  x: number
  y: number
  z: number
}
interface ScreenPoint {
  x: number
  y: number
}
interface LinearField {
  start: Point
  direction: Point
  lengthSquared: number
  stops: DesignGradientStop[]
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const invalid = (reason: string): never => {
  throw new Error(`Invalid linear material field: ${reason}`)
}
const point = (value: unknown): Point => {
  if (
    !record(value) ||
    Object.keys(value).length !== 3 ||
    !['x', 'y', 'z'].every(
      (k) =>
        typeof value[k] === 'number' &&
        Number.isFinite(value[k]) &&
        Math.abs(value[k] as number) <= DesignPreparationLimits.dimension
    )
  )
    return invalid('finite world point required')
  return { x: value.x as number, y: value.y as number, z: value.z as number }
}
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z
const sub = (a: Point, b: Point): Point => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
})

export const readLinearFields = (
  input: unknown
): ReadonlyMap<string, LinearField> => {
  const fields = new Map<string, LinearField>()
  if (input === undefined) return fields
  if (!record(input)) return invalid('linearFields must be a named map')
  for (const [key, value] of Object.entries(input)) {
    if (
      !key.trim() ||
      key.length > 160 ||
      !record(value) ||
      Object.keys(value).length !== 4 ||
      value.frame !== 'world'
    )
      return invalid('expected frame, start, end and gradientStops')
    const start = point(value.start),
      end = point(value.end),
      delta = sub(end, start),
      length = dot(delta, delta)
    if (!length || !Number.isFinite(length))
      return invalid('start and end must be distinct')
    const gradient = {
      gradientType: 'linear',
      gradientHandles: [
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ],
      gradientStops: value.gradientStops
    }
    if (!isDesignGradient(gradient))
      return invalid('ordered native gradientStops required')
    fields.set(key, {
      start: { ...start },
      direction: delta,
      lengthSquared: length,
      stops: structuredClone(gradient.gradientStops)
    })
  }
  return fields
}

const constantStops = (
  stops: DesignGradientStop[],
  phase: number
): DesignGradientStop[] => {
  const t = Math.max(0, Math.min(1, phase))
  let left = stops[0],
    right = left
  for (let i = 1; i < stops.length; i++) {
    if (t < stops[i].position) {
      right = stops[i]
      break
    }
    left = right = stops[i]
  }
  if (t < left.position) right = left
  const mix =
    right.position === left.position
      ? 0
      : (t - left.position) / (right.position - left.position)
  const color =
    '#' +
    [1, 3, 5]
      .map((i) => {
        const a = parseInt(left.color.slice(i, i + 2), 16),
          b = parseInt(right.color.slice(i, i + 2), 16)
        return Math.round(a + (b - a) * mix)
          .toString(16)
          .padStart(2, '0')
      })
      .join('')
  const opacity = left.opacity + (right.opacity - left.opacity) * mix
  return [
    { position: 0, color, opacity },
    { position: 1, color, opacity }
  ]
}

/** Solve one admitted planar template once; instances only shift its world phase. */
export const createLinearFieldFill = (
  fields: ReadonlyMap<string, LinearField>,
  key: unknown,
  vertices: Point[],
  points: ScreenPoint[]
): ((offset?: Point) => DesignGradientData) => {
  const field = typeof key === 'string' ? fields.get(key) : undefined
  if (!field) return invalid(`unknown materialField ${String(key)}`)
  const q = points[0],
    p = vertices[0]
  let first = 1
  for (let i = 2; i < points.length; i++)
    if (
      Math.hypot(points[i].x - q.x, points[i].y - q.y) >
      Math.hypot(points[first].x - q.x, points[first].y - q.y)
    )
      first = i
  const dx = points[first].x - q.x,
    dy = points[first].y - q.y
  let second = 0,
    det = 0
  for (let i = 1; i < points.length; i++) {
    const value = dx * (points[i].y - q.y) - dy * (points[i].x - q.x)
    if (Math.abs(value) > Math.abs(det)) {
      second = i
      det = value
    }
  }
  if (!det || !Number.isFinite(det))
    return invalid('degenerate projected plane')
  // Divide after the dot product so exact perpendicular planes stay constant.
  const firstPhase =
      dot(field.direction, sub(vertices[first], p)) / field.lengthSquared,
    secondPhase =
      dot(field.direction, sub(vertices[second], p)) / field.lengthSquared
  const ax = (firstPhase * (points[second].y - q.y) - dy * secondPhase) / det
  const ay = (dx * secondPhase - firstPhase * (points[second].x - q.x)) / det
  const xs = points.map((v) => v.x),
    ys = points.map((v) => v.y),
    x = Math.min(...xs),
    y = Math.min(...ys)
  const gx = ax * (Math.max(...xs) - x),
    gy = ay * (Math.max(...ys) - y),
    length = gx * gx + gy * gy
  const initial =
    dot(field.direction, sub(p, field.start)) / field.lengthSquared +
    ax * (x - q.x) +
    ay * (y - q.y)
  return (offset = { x: 0, y: 0, z: 0 }) => {
    const phase = initial + dot(field.direction, offset) / field.lengthSquared
    let gradient: DesignGradientData
    if (length === 0)
      gradient = {
        gradientType: 'linear',
        gradientHandles: [
          { x: 0, y: 0 },
          { x: 1, y: 0 }
        ],
        gradientStops: constantStops(field.stops, phase)
      }
    else
      gradient = {
        gradientType: 'linear',
        gradientHandles: [
          { x: (-phase * gx) / length, y: (-phase * gy) / length },
          { x: ((1 - phase) * gx) / length, y: ((1 - phase) * gy) / length }
        ],
        gradientStops: field.stops
      }
    if (!Number.isFinite(phase) || !isDesignGradient(gradient))
      return invalid('field cannot be represented by native bounded handles')
    return gradient
  }
}
