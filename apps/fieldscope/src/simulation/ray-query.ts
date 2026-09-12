import {
  interval,
  add,
  subtract,
  multiply,
  divide,
  squareRoot,
  dyadic,
  fractionInterval,
  type Interval
} from './query-arithmetic'
import type { SourceRegion } from '../domain/source-occupancy'
import {
  QueryGeometry,
  type GeometrySource,
  type GeometryMesh
} from './geometry'
import {
  evaluateRobotPose,
  type RobotJoints,
  type RigidTransform
} from '../domain/robot-kinematics'
import type { Point3 } from '../domain/greenhouse'
import type { SpatialShape } from '../engine/spatial-contract'

export interface RayInput {
  origin: [number, number, number]
  direction: [number, number, number]
  maxDistance: number
}
export interface RayBatch {
  source: 'synthetic'
  time: number
  validFrom: number
  validUntil: number
  robot: { base: RigidTransform; joints: RobotJoints } | null
  leaves: 'source-pose' | 'unknown'
  fruits: 'all-attached' | 'unknown'
  rays: RayInput[]
}
export interface RayWitness {
  readonly mesh: GeometryMesh
  readonly instance: number
  readonly triangle: number
  readonly distance: Interval | null
}
export type RayResult =
  | { readonly status: 'miss' }
  | {
      readonly status: 'unknown'
      readonly reason: string
      readonly witnesses?: readonly RayWitness[]
    }
  | {
      readonly status: 'hit'
      readonly mesh: GeometryMesh
      readonly instance: number
      readonly triangle: number
      readonly distance: number
      readonly barycentric: Point3
    }
export interface RayWork {
  shapeBounds: number
  vertexVisits: number
  regionBounds: number
  regionIndexVisits: number
  occupancyTriangles: number
  exactPredicates: number
  instances: number
  triangles: number
  rays: number
  fk: number
}
export interface RayBatchResult {
  readonly geometry: GeometrySource
  readonly input: Readonly<RayBatch>
  readonly results: readonly RayResult[]
  readonly work: Readonly<RayWork>
}
type TriangleShape = Extract<SpatialShape, { kind: 'triangles' }>
interface Bounds {
  min: Point3
  max: Point3
}
const EPS = Number.EPSILON * 64
const finitePoint = (point: Point3) =>
  Array.isArray(point) && point.length === 3 && point.every(Number.isFinite)
function unit(direction: Point3): Point3 {
  const scale = Math.max(...direction.map(Math.abs))
  if (!scale) throw new Error('Zero ray direction')
  const scaled: Point3 = [
    direction[0] / scale,
    direction[1] / scale,
    direction[2] / scale
  ]
  const length = Math.hypot(...scaled)
  return [scaled[0] / length, scaled[1] / length, scaled[2] / length]
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
function readBatch(raw: RayBatch): Readonly<RayBatch> {
  const input = structuredClone(raw)
  if (
    !input ||
    input.source !== 'synthetic' ||
    !Number.isFinite(input.time) ||
    input.time < 0 ||
    !Number.isFinite(input.validFrom) ||
    input.validFrom < 0 ||
    !Number.isFinite(input.validUntil) ||
    input.validUntil <= input.validFrom ||
    !['source-pose', 'unknown'].includes(input.leaves) ||
    !['all-attached', 'unknown'].includes(input.fruits) ||
    !Array.isArray(input.rays) ||
    !input.rays.length
  )
    throw new Error('Invalid ray batch')
  for (const ray of input.rays) {
    if (
      !finitePoint(ray.origin) ||
      !finitePoint(ray.direction) ||
      !Number.isFinite(ray.maxDistance) ||
      ray.maxDistance <= 0
    )
      throw new Error('Invalid ray')
    unit(ray.direction)
  }
  if (input.robot) {
    const { base } = input.robot
    if (
      !base ||
      !finitePoint(base.position) ||
      !Array.isArray(base.rotation) ||
      base.rotation.length !== 4 ||
      !base.rotation.every(Number.isFinite) ||
      Math.abs(Math.hypot(...base.rotation) - 1) > EPS
    )
      throw new Error('Invalid robot base transform')
  }
  return freeze(input)
}
type Vector = readonly [Interval, Interval, Interval]
type Matrix = readonly [Vector, Vector, Vector]
const numberVector = (p: Point3): Vector => [
  interval(p[0]),
  interval(p[1]),
  interval(p[2])
]
const vectorSubtract = (a: Vector, b: Vector): Vector => [
  subtract(a[0], b[0]),
  subtract(a[1], b[1]),
  subtract(a[2], b[2])
]
const vectorCross = (a: Vector, b: Vector): Vector => [
  subtract(multiply(a[1], b[2]), multiply(a[2], b[1])),
  subtract(multiply(a[2], b[0]), multiply(a[0], b[2])),
  subtract(multiply(a[0], b[1]), multiply(a[1], b[0]))
]
const vectorDot = (a: Vector, b: Vector) =>
  add(add(multiply(a[0], b[0]), multiply(a[1], b[1])), multiply(a[2], b[2]))
const finiteInterval = (a: Interval) =>
  Number.isFinite(a.low) && Number.isFinite(a.high)
const finiteVector = (v: Vector) => v.every(finiteInterval)
const zero = (a: Interval) => a.low === 0 && a.high === 0
const containsZero = (a: Interval) => a.low <= 0 && a.high >= 0
const midpoint = (a: Interval) => a.low + (a.high - a.low) / 2
const apply = (m: Matrix, v: Vector): Vector => [
  vectorDot(m[0], v),
  vectorDot(m[1], v),
  vectorDot(m[2], v)
]
const transpose = (m: Matrix): Matrix => [
  [m[0][0], m[1][0], m[2][0]],
  [m[0][1], m[1][1], m[2][1]],
  [m[0][2], m[1][2], m[2][2]]
]
const identity: Matrix = [
  numberVector([1, 0, 0]),
  numberVector([0, 1, 0]),
  numberVector([0, 0, 1])
]
function inverseMatrix(m: Matrix): Matrix {
  const cofactor: Matrix = [
    vectorCross(m[1], m[2]),
    vectorCross(m[2], m[0]),
    vectorCross(m[0], m[1])
  ]
  const determinant = vectorDot(m[0], cofactor[0])
  return transpose(cofactor).map((row) =>
    row.map((value) => divide(value, determinant))
  ) as unknown as Matrix
}
function rotationMatrix(rotation: RigidTransform['rotation']): Matrix {
  const [x, y, z, w] = rotation.map(interval)
  const rotate = (v: Vector): Vector => {
    const t = vectorCross([x, y, z], v).map((value) =>
      multiply(interval(2), value)
    ) as unknown as Vector
    const c = vectorCross([x, y, z], t)
    return v.map((value, axis) =>
      add(add(value, multiply(w, t[axis])), c[axis])
    ) as unknown as Vector
  }
  return transpose(identity.map(rotate) as unknown as Matrix)
}
interface Inverse {
  matrix: Matrix
  position: Vector
}
function prepareInverse(transform: RigidTransform): Inverse {
  return {
    matrix: inverseMatrix(rotationMatrix(transform.rotation)),
    position: numberVector(transform.position)
  }
}
function inverse(transform: Inverse, value: Vector, direction = false): Vector {
  return apply(
    transform.matrix,
    direction ? value : vectorSubtract(value, transform.position)
  )
}
function directionBounds(direction: Point3): Vector {
  const scale = interval(Math.max(...direction.map(Math.abs)))
  const scaled = direction.map((value) =>
    divide(interval(value), scale)
  ) as unknown as Vector
  const length = squareRoot(vectorDot(scaled, scaled))
  return scaled.map((value) => divide(value, length)) as unknown as Vector
}
function vertex(shape: TriangleShape, index: number): Point3 {
  const offset = shape.indices[index] * 3
  return [
    shape.positions[offset],
    shape.positions[offset + 1],
    shape.positions[offset + 2]
  ]
}
function emptyBounds(): {
  min: [number, number, number]
  max: [number, number, number]
} {
  return {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity]
  }
}
function include(box: ReturnType<typeof emptyBounds>, p: Point3) {
  for (let axis = 0; axis < 3; axis++) {
    box.min[axis] = Math.min(box.min[axis], p[axis])
    box.max[axis] = Math.max(box.max[axis], p[axis])
  }
}
/** Only a conclusive separation rejects; all surviving entries are lower bounds. */
function entryDistance(
  box: Bounds,
  origin: Vector,
  direction: Vector,
  maxDistance: number
): number | null {
  let near = 0,
    far = maxDistance
  for (let axis = 0; axis < 3; axis++) {
    const d = direction[axis],
      o = origin[axis]
    if (zero(d)) {
      if (o.high < box.min[axis] || o.low > box.max[axis]) return null
      continue
    }
    if (containsZero(d)) continue
    const a = divide(subtract(interval(box.min[axis]), o), d)
    const b = divide(subtract(interval(box.max[axis]), o), d)
    near = Math.max(near, Math.min(a.low, b.low))
    far = Math.min(far, Math.max(a.high, b.high))
    if (near > far) return null
  }
  return near
}
interface TriangleHit {
  proof: 'enclosed' | 'exact'
  exactDistance?: { numerator: bigint; denominator: bigint }
  distance: Interval
  barycentric: readonly [Interval, Interval, Interval]
}
type ExactVector = readonly [bigint, bigint, bigint]
const exactSubtract = (a: ExactVector, b: ExactVector): ExactVector => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2]
]
const exactCross = (a: ExactVector, b: ExactVector): ExactVector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]
const exactDot = (a: ExactVector, b: ExactVector) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
function exactTriangle(
  a: Point3,
  b: Point3,
  c: Point3,
  origin: Vector,
  direction: Vector,
  range: number,
  work: RayWork
): TriangleHit | null | undefined {
  if (
    ![...origin, ...direction].every(
      (value) => finiteInterval(value) && value.low === value.high
    )
  )
    return undefined
  work.exactPredicates++
  const values = [
    ...a,
    ...b,
    ...c,
    ...origin.map((value) => value.low),
    ...direction.map((value) => value.low)
  ].map(dyadic)
  const exponent = Math.min(
    ...values
      .filter((value) => value.significand !== 0n)
      .map((value) => value.exponent)
  )
  const integers = values.map((value) =>
    value.significand === 0n
      ? 0n
      : value.significand << BigInt(value.exponent - exponent)
  )
  const [first, second, third, o, d] = [0, 3, 6, 9, 12].map(
    (offset) => integers.slice(offset, offset + 3) as unknown as ExactVector
  )
  const e1 = exactSubtract(second, first),
    e2 = exactSubtract(third, first),
    p = exactCross(d, e2)
  let determinant = exactDot(e1, p)
  if (determinant === 0n) return undefined
  const offset = exactSubtract(o, first),
    q = exactCross(offset, e1)
  let u = exactDot(offset, p),
    v = exactDot(d, q),
    t = exactDot(e2, q)
  if (determinant < 0n) {
    determinant = -determinant
    u = -u
    v = -v
    t = -t
  }
  if (u < 0n || v < 0n || u + v > determinant || t < 0n) return null
  if (t === 0n) return undefined
  const limit = dyadic(range)
  if (
    limit.exponent >= 0
      ? t > determinant * (limit.significand << BigInt(limit.exponent))
      : t << BigInt(-limit.exponent) > determinant * limit.significand
  )
    return null
  const distance = fractionInterval(t, determinant)
  const barycentric = [determinant - u - v, u, v].map((value) =>
    fractionInterval(value, determinant)
  ) as unknown as TriangleHit['barycentric']
  if (![distance, ...barycentric].every(finiteInterval)) return undefined
  return {
    proof: 'exact',
    exactDistance: { numerator: t, denominator: determinant },
    distance,
    barycentric
  }
}
function triangleHit(
  a: Point3,
  b: Point3,
  c: Point3,
  origin: Vector,
  direction: Vector,
  range: number,
  work: RayWork
): TriangleHit | { unknownAt: number } | null {
  const box = emptyBounds()
  include(box, a)
  include(box, b)
  include(box, c)
  const entry = entryDistance(box, origin, direction, range)
  if (entry === null) return null
  const unresolved = () => {
    const exact = exactTriangle(a, b, c, origin, direction, range, work)
    return exact === undefined ? { unknownAt: entry } : exact
  }
  const first = numberVector(a),
    e1 = vectorSubtract(numberVector(b), first),
    e2 = vectorSubtract(numberVector(c), first)
  const p = vectorCross(direction, e2),
    determinant = vectorDot(e1, p)
  if (!finiteInterval(determinant) || containsZero(determinant))
    return unresolved()
  const offset = vectorSubtract(origin, first),
    q = vectorCross(offset, e1)
  const u = divide(vectorDot(offset, p), determinant),
    v = divide(vectorDot(direction, q), determinant)
  const total = add(u, v),
    distance = divide(vectorDot(e2, q), determinant)
  if (![u, v, total, distance].every(finiteInterval)) return unresolved()
  if (
    u.high < 0 ||
    v.high < 0 ||
    total.low > 1 ||
    distance.high < 0 ||
    distance.low > range
  )
    return null
  if (
    u.low < 0 ||
    v.low < 0 ||
    total.high > 1 ||
    distance.low <= 0 ||
    distance.high > range
  )
    return unresolved()
  return {
    proof: 'enclosed',
    distance,
    barycentric: [subtract(interval(1), total), u, v]
  }
}
function originCandidate(box: Bounds, origin: Vector) {
  return origin.every(
    (value, axis) => value.high >= box.min[axis] && value.low <= box.max[axis]
  )
}
/** A closed region's exact surface crossings, never aggregate mesh winding. */
function closedOrigin(
  shape: TriangleShape,
  region: SourceRegion,
  origin: Vector,
  work: RayWork
): 'outside' | 'inside' | 'unknown' {
  let crossings = 0
  for (
    let i = region.indexStart;
    i < region.indexStart + region.indexCount;
    i += 3
  ) {
    work.occupancyTriangles++
    const hit = triangleHit(
      vertex(shape, i),
      vertex(shape, i + 1),
      vertex(shape, i + 2),
      origin,
      numberVector([1, 0, 0]),
      Number.MAX_VALUE,
      work
    )
    if (!hit) continue
    // A boundary crossing may be a shared edge or tangent, so parity is unresolved.
    if ('unknownAt' in hit || hit.barycentric.some((value) => value.low <= 0))
      return 'unknown'
    crossings++
  }
  return crossings % 2 ? 'inside' : 'outside'
}
interface Placement {
  mesh: GeometryMesh
  instance: number
  parents: readonly Inverse[]
}
/** Two-sided source geometry only: no sensing, quality or swept-motion verdict. */
export class RayQueries {
  constructor(private readonly geometry: QueryGeometry) {}
  query(source: GeometrySource, raw: RayBatch): RayBatchResult {
    this.geometry.read(source)
    const input = readBatch(raw)
    const work: RayWork = {
      shapeBounds: 0,
      vertexVisits: 0,
      regionBounds: 0,
      regionIndexVisits: 0,
      occupancyTriangles: 0,
      exactPredicates: 0,
      instances: 0,
      triangles: 0,
      rays: input.rays.length,
      fk: 0
    }
    const publish = (results: RayResult[]): RayBatchResult => {
      this.geometry.read(source)
      return Object.freeze({
        geometry: source,
        input,
        results: Object.freeze(results.map(freeze)),
        work: Object.freeze(work)
      })
    }
    if (
      input.time < input.validFrom ||
      input.time >= input.validUntil ||
      !input.robot ||
      input.leaves !== 'source-pose' ||
      input.fruits !== 'all-attached'
    )
      return publish(
        input.rays.map(() => ({
          status: 'unknown',
          reason: 'missing-or-expired-scene-state'
        }))
      )
    const rig = source.receipt.robot.rig
    if (!rig) throw new Error('Missing robot rig')
    const pose = evaluateRobotPose(rig, input.robot.joints)
    work.fk++
    const bodyInverses = new Map<RigidTransform, Inverse>()
    const transforms = new Map(
      pose.parts.map((part) => {
        let completed = bodyInverses.get(part.transform)
        if (!completed) {
          completed = prepareInverse(part.transform)
          bodyInverses.set(part.transform, completed)
        }
        return [part.source, completed] as const
      })
    )
    const base = prepareInverse(input.robot.base)
    const placements: Placement[] = []
    for (const mesh of source.meshes) {
      if (mesh.shape.kind !== 'triangles')
        throw new Error('Unsupported query source')
      const parents: Inverse[] = []
      if (mesh.frame === 'robot') {
        const body = transforms.get(
          mesh.origin as (typeof pose.parts)[number]['source']
        )
        if (!body) throw new Error('Missing body transform')
        parents.push(base, body)
      } else {
        if (!mesh.descriptor) throw new Error('Missing installed transform')
        parents.push(prepareInverse(mesh.descriptor))
      }
      const instances = mesh.descriptor?.instances
      for (let instance = 0; instance < (instances?.length ?? 1); instance++) {
        const placement = instances?.[instance]
        let chain = parents
        if (placement) {
          const c = interval(Math.cos(placement.yaw)),
            s = interval(Math.sin(placement.yaw)),
            n = interval(-Math.sin(placement.yaw))
          const matrix: Matrix = [
            [c, interval(0), s],
            numberVector([0, 1, 0]),
            [n, interval(0), c]
          ]
          chain = [
            ...parents,
            {
              matrix: inverseMatrix(matrix),
              position: numberVector(placement.position)
            }
          ]
        }
        placements.push({ mesh, instance, parents: chain })
      }
    }
    const results = input.rays.map((ray): RayResult => {
      const direction = directionBounds(ray.direction)
      let selected:
        | {
            result: Extract<RayResult, { status: 'hit' }>
            distance: Interval
            refine: () => TriangleHit | null | undefined
          }
        | undefined
      let unknownAt = Infinity,
        originUnknown = false
      let witnesses: readonly RayWitness[] | undefined
      const ambiguous = (lower: number, evidence: readonly RayWitness[]) => {
        if (lower < unknownAt) {
          unknownAt = lower
          witnesses = evidence
        }
      }
      for (const { mesh, instance, parents } of placements) {
        work.instances++
        const shape = mesh.shape as TriangleShape,
          product = mesh.prepared
        if (!product) throw new Error('Missing completed query shape')
        let origin = numberVector(ray.origin),
          localDirection = direction
        for (const parent of parents) {
          origin = inverse(parent, origin)
          localDirection = inverse(parent, localDirection, true)
        }
        if (!finiteVector(origin) || !finiteVector(localDirection)) {
          unknownAt = 0
          continue
        }
        if (
          entryDistance(
            product.bounds,
            origin,
            localDirection,
            ray.maxDistance
          ) === null
        )
          continue
        for (const region of product.regions) {
          if (!originCandidate(region.bounds, origin)) continue
          if (
            region.source.kind === 'open-shell' ||
            closedOrigin(shape, region.source, origin, work) !== 'outside'
          )
            originUnknown = true
        }
        for (let index = 0; index < shape.indices.length; index += 3) {
          work.triangles++
          const candidate = triangleHit(
            vertex(shape, index),
            vertex(shape, index + 1),
            vertex(shape, index + 2),
            origin,
            localDirection,
            ray.maxDistance,
            work
          )
          if (!candidate) continue
          if ('unknownAt' in candidate) {
            ambiguous(candidate.unknownAt, [
              {
                mesh,
                instance,
                triangle: index / 3,
                distance: { low: candidate.unknownAt, high: ray.maxDistance }
              }
            ])
            continue
          }
          let completed = candidate
          let distance = completed.distance
          let refined = completed.proof === 'exact'
          let exact: TriangleHit | null | undefined = refined
            ? completed
            : undefined
          const refine = () => {
            if (!refined) {
              exact = exactTriangle(
                vertex(shape, index),
                vertex(shape, index + 1),
                vertex(shape, index + 2),
                origin,
                localDirection,
                ray.maxDistance,
                work
              )
              refined = true
            }
            return exact
          }
          if (selected) {
            const previous = selected.distance
            if (distance.low > previous.high) continue
            if (
              distance.low === distance.high &&
              previous.low === previous.high &&
              distance.low === previous.low
            )
              continue
            if (distance.high >= previous.low) {
              const first = selected.refine(),
                second = refine()
              if (second === null) continue
              if (first === null) {
                // A contradictory proof cannot preserve an old hit or erase earlier candidates.
                ambiguous(0, [
                  {
                    mesh: selected.result.mesh,
                    instance: selected.result.instance,
                    triangle: selected.result.triangle,
                    distance: previous
                  }
                ])
                selected = undefined
              } else if (first?.exactDistance && second?.exactDistance) {
                const a = first.exactDistance,
                  b = second.exactDistance
                selected.distance = first.distance
                selected.result = {
                  ...selected.result,
                  distance: midpoint(first.distance),
                  barycentric: first.barycentric.map(
                    midpoint
                  ) as unknown as Point3
                }
                if (b.numerator * a.denominator >= a.numerator * b.denominator)
                  continue
                completed = second
                distance = second.distance
              } else {
                ambiguous(Math.min(distance.low, previous.low), [
                  {
                    mesh: selected.result.mesh,
                    instance: selected.result.instance,
                    triangle: selected.result.triangle,
                    distance: previous
                  },
                  { mesh, instance, triangle: index / 3, distance }
                ])
                continue
              }
            }
          }
          selected = {
            distance,
            refine,
            result: {
              status: 'hit',
              mesh,
              instance,
              triangle: index / 3,
              distance: midpoint(distance),
              barycentric: completed.barycentric.map(
                midpoint
              ) as unknown as Point3
            }
          }
        }
      }
      if (originUnknown)
        return { status: 'unknown', reason: 'unknown-origin-occupancy' }
      if (unknownAt <= (selected?.distance.high ?? ray.maxDistance))
        return {
          status: 'unknown',
          reason: 'geometric-ambiguity',
          ...(witnesses ? { witnesses } : {})
        }
      return selected?.result ?? { status: 'miss' }
    })
    return publish(results)
  }
}
