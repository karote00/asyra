import {
  idiv,
  ineg,
  interval,
  isub,
  type Interval
} from '../../domain/interval'
import {
  intervalAlgebra,
  poseOperations,
  type AlgebraPose,
  type Rotation,
  type Vector
} from '../../domain/kinematic-algebra'
import type { Quaternion, Vec3 } from '../../domain/math'
import type { MeshGeometry } from '../../domain/part-geometry'
import { projectBounds } from './bounds-projection'
import type { Bounds } from './mesh-index'

const ops = poseOperations(intervalAlgebra)

/** Isolated experimental certificate; no method routing consumes this artifact. */
export interface SourceFrame {
  readonly geometry: MeshGeometry
  readonly pose: AlgebraPose<Interval>
  readonly bounds: Bounds
}
export interface SourceFrameProjection {
  readonly a: Interval
  readonly b: Interval
  readonly lower: number
}

export function prepareSourceFrame(
  geometry: MeshGeometry,
  proposal: Quaternion,
  checkpoint: () => void
): SourceFrame | undefined {
  checkpoint()
  const q: Quaternion = Object.freeze([...proposal]) as Quaternion
  const largest = Math.max(...q.map(Math.abs))
  if (
    !q.every(Number.isFinite) ||
    largest === 0 ||
    !Object.isFrozen(geometry) ||
    !Object.isFrozen(geometry.positions) ||
    !Object.isFrozen(geometry.indices) ||
    geometry.indices.length === 0 ||
    geometry.indices.length % 3 !== 0 ||
    geometry.positions.length % 3 !== 0
  )
    return undefined

  checkpoint()
  // An exact, finite normal power of two avoids both reciprocal overflow and
  // discarded subnormal components. Divide as intervals, never rounded points.
  const exponent = Math.max(
    -1022,
    Math.min(1022, Math.floor(Math.log2(largest)))
  )
  const scale = interval(2 ** exponent)
  const scaled = q.map((value) => idiv(interval(value), scale))
  const length = ops.norm(scaled)
  if (length[0] <= 0) return undefined
  const rotation = Object.freeze(
    scaled.map((value) => Object.freeze(idiv(value, length)))
  ) as Rotation<Interval>
  const inverse: Rotation<Interval> = [
    ineg(rotation[0]),
    ineg(rotation[1]),
    ineg(rotation[2]),
    rotation[3]
  ]
  const limits: [number, number][] = [
    [Infinity, -Infinity],
    [Infinity, -Infinity],
    [Infinity, -Infinity]
  ]
  for (let occurrence = 0; occurrence < geometry.indices.length; occurrence++) {
    if (occurrence % 256 === 0) checkpoint()
    const index = geometry.indices[occurrence],
      offset = index * 3
    if (
      !Number.isSafeInteger(index) ||
      index < 0 ||
      offset + 2 >= geometry.positions.length
    )
      throw new Error('Invalid indexed source vertex')
    const vertex: Vec3 = [
      geometry.positions[offset],
      geometry.positions[offset + 1],
      geometry.positions[offset + 2]
    ]
    const local = ops.rotate(inverse, ops.vector(vertex))
    for (let axis = 0; axis < 3; axis++) {
      limits[axis][0] = Math.min(limits[axis][0], local[axis][0])
      limits[axis][1] = Math.max(limits[axis][1], local[axis][1])
    }
  }
  checkpoint()
  const bounds = Object.freeze(
    limits.map(([lo, hi]) => Object.freeze(interval(lo, hi)))
  ) as Bounds
  const position = Object.freeze([
    Object.freeze(interval(0)),
    Object.freeze(interval(0)),
    Object.freeze(interval(0))
  ]) as Vector<Interval>
  return Object.freeze({
    geometry,
    bounds,
    pose: Object.freeze({ position, rotation })
  })
}

/** Domain poses must enclose their actual unit rotations; no pose is retained. */
export function projectSourceFrames(
  a: SourceFrame,
  aPose: AlgebraPose<Interval>,
  b: SourceFrame,
  bPose: AlgebraPose<Interval>,
  direction: Vec3,
  checkpoint: () => void
): SourceFrameProjection | undefined {
  checkpoint()
  const ap = ops.compose(aPose, a.pose)
  checkpoint()
  const bp = ops.compose(bPose, b.pose)
  checkpoint()
  if (
    !direction.every(Number.isFinite) ||
    direction.every((value) => value === 0)
  )
    return undefined
  const length = ops.norm(ops.vector(direction))
  if (length[0] <= 0) return undefined
  const pa = projectBounds(a.bounds, ap, direction),
    pb = projectBounds(b.bounds, bp, direction)
  const lower = Math.max(
    0,
    idiv(isub(interval(pb[0]), interval(pa[1])), length)[0],
    idiv(isub(interval(pa[0]), interval(pb[1])), length)[0]
  )
  return Object.freeze({ a: Object.freeze(pa), b: Object.freeze(pb), lower })
}
