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
import type { Bounds, MeshIndex, MeshNode } from './mesh-index'

const ops = poseOperations(intervalAlgebra)

/** Isolated experimental certificate; no method routing consumes this artifact. */
export interface NodeSourceSpan {
  readonly kind: 'node'
  readonly geometry: MeshGeometry
  readonly index: MeshIndex
  readonly node: MeshNode
  readonly offsets: readonly number[]
  readonly start: number
  readonly end: number
}
export type FrameSource =
  Readonly<{ kind: 'mesh'; geometry: MeshGeometry }> | NodeSourceSpan
export interface SourceFrame {
  readonly source: FrameSource
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
  return prepareFrame(
    Object.freeze({ kind: 'mesh', geometry }),
    proposal,
    checkpoint
  )
}

/** The span is a completed frozen source snapshot, not current-node routing authority. */
export function prepareSourceSpanFrame(
  source: NodeSourceSpan,
  proposal: Quaternion,
  checkpoint: () => void
): SourceFrame | undefined {
  return prepareFrame(source, proposal, checkpoint)
}
function prepareFrame(
  source: FrameSource,
  proposal: Quaternion,
  checkpoint: () => void
): SourceFrame | undefined {
  const geometry = source.geometry
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
    geometry.positions.length % 3 !== 0 ||
    !Object.isFrozen(source) ||
    (source.kind === 'node' &&
      (!Object.isFrozen(source.offsets) ||
        !Number.isSafeInteger(source.start) ||
        !Number.isSafeInteger(source.end) ||
        source.start < 0 ||
        source.end <= source.start ||
        source.end > source.offsets.length))
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
  const count =
    source.kind === 'mesh'
      ? geometry.indices.length
      : 3 * (source.end - source.start)
  for (let occurrence = 0; occurrence < count; occurrence++) {
    if (occurrence % 256 === 0) checkpoint()
    const sourceOffset =
      source.kind === 'mesh'
        ? occurrence
        : source.offsets[source.start + Math.floor(occurrence / 3)] +
          (occurrence % 3)
    const index = geometry.indices[sourceOffset],
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
    source,
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
