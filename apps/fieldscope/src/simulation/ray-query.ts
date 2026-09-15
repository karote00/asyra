import {
  interval,
  add,
  subtract,
  multiply,
  divide,
  squareRoot,
  dyadic,
  fractionInterval,
  type Interval,
  type Dyadic
} from './query-arithmetic'
import type { SourceRegion } from '../domain/source-occupancy'
import {
  QueryGeometry,
  type GeometrySource,
  type QueryGeometrySource,
  type WalkingObservationGeometrySource,
  type GeometryMesh
} from './geometry'
import {
  evaluateRobotAffinePose,
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
export type WalkingWorldRayBatch = Omit<RayBatch, 'robot'>
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
      readonly distanceBounds: Interval
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
  bodyMatrices: number
}
export interface RayBatchResult<
  S extends QueryGeometrySource = GeometrySource,
  B extends WalkingWorldRayBatch = RayBatch
> {
  readonly geometry: S
  readonly input: Readonly<B>
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
function readBatch<B extends WalkingWorldRayBatch>(raw: B): Readonly<B> {
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
  if ('robot' in input && input.robot) {
    const { base } = input.robot as NonNullable<RayBatch['robot']>
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
const vectorDot = (a: readonly Interval[], b: readonly Interval[]) =>
  add(add(multiply(a[0], b[0]), multiply(a[1], b[1])), multiply(a[2], b[2]))
const finiteInterval = (a: Interval) =>
  Number.isFinite(a.low) && Number.isFinite(a.high)
const finiteVector = (v: Vector) => v.every(finiteInterval)
const zero = (a: Interval) => a.low === 0 && a.high === 0
const containsZero = (a: Interval) => a.low <= 0 && a.high >= 0
const midpoint = (a: Interval) => a.low + (a.high - a.low) / 2
const apply = (m: readonly (readonly Interval[])[], v: Vector): Vector => [
  vectorDot(m[0], v),
  vectorDot(m[1], v),
  vectorDot(m[2], v)
]
const transpose = (m: Matrix): Matrix => [
  [m[0][0], m[1][0], m[2][0]],
  [m[0][1], m[1][1], m[2][1]],
  [m[0][2], m[1][2], m[2][2]]
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
type FrameVector<T> = readonly [T, T, T]
type FrameMatrix<T> = readonly [FrameVector<T>, FrameVector<T>, FrameVector<T>]
interface FrameArithmetic<T> {
  from(value: number): T
  add(a: T, b: T): T
  subtract(a: T, b: T): T
  multiply(a: T, b: T): T
}
const intervalFrameArithmetic: FrameArithmetic<Interval> = {
  from: interval,
  add,
  subtract,
  multiply
}
function exactFrameAdd(a: Dyadic, b: Dyadic): Dyadic {
  const exponent = Math.min(a.exponent, b.exponent)
  return {
    significand:
      (a.significand << BigInt(a.exponent - exponent)) +
      (b.significand << BigInt(b.exponent - exponent)),
    exponent
  }
}
const exactFrameArithmetic: FrameArithmetic<Dyadic> = {
  from: dyadic,
  add: exactFrameAdd,
  subtract: (a, b) =>
    exactFrameAdd(a, { significand: -b.significand, exponent: b.exponent }),
  multiply: (a, b) => ({
    significand: a.significand * b.significand,
    exponent: a.exponent + b.exponent
  })
}
function frameCross<T>(
  a: FrameVector<T>,
  b: FrameVector<T>,
  ops: FrameArithmetic<T>
): FrameVector<T> {
  return [
    ops.subtract(ops.multiply(a[1], b[2]), ops.multiply(a[2], b[1])),
    ops.subtract(ops.multiply(a[2], b[0]), ops.multiply(a[0], b[2])),
    ops.subtract(ops.multiply(a[0], b[1]), ops.multiply(a[1], b[0]))
  ]
}
/** One original quaternion polynomial and operation order for both algebras. */
function sourceRotationMatrix<T>(
  rotation: RigidTransform['rotation'],
  ops: FrameArithmetic<T>
): FrameMatrix<T> {
  const [x, y, z, w] = rotation.map(ops.from)
  const rotate = (v: FrameVector<T>): FrameVector<T> => {
    const crossed = frameCross([x, y, z], v, ops)
    const t: FrameVector<T> = [
      ops.multiply(ops.from(2), crossed[0]),
      ops.multiply(ops.from(2), crossed[1]),
      ops.multiply(ops.from(2), crossed[2])
    ]
    const c = frameCross([x, y, z], t, ops)
    const component = (axis: number) =>
      ops.add(ops.add(v[axis], ops.multiply(w, t[axis])), c[axis])
    return [component(0), component(1), component(2)]
  }
  const first = rotate([ops.from(1), ops.from(0), ops.from(0)]),
    second = rotate([ops.from(0), ops.from(1), ops.from(0)]),
    third = rotate([ops.from(0), ops.from(0), ops.from(1)])
  return [
    [first[0], second[0], third[0]],
    [first[1], second[1], third[1]],
    [first[2], second[2], third[2]]
  ]
}
function rotationMatrix(rotation: RigidTransform['rotation']): Matrix {
  return sourceRotationMatrix(rotation, intervalFrameArithmetic)
}
function sourceInstanceMatrix<T>(
  yaw: number,
  from: (value: number) => T
): FrameMatrix<T> {
  const cosine = Math.cos(yaw),
    sine = Math.sin(yaw)
  return [
    [from(cosine), from(0), from(sine)],
    [from(0), from(1), from(0)],
    [from(-sine), from(0), from(cosine)]
  ]
}
export interface QueryExactFrame {
  readonly matrix: FrameMatrix<Dyadic>
  readonly position: FrameVector<Dyadic>
  readonly determinant: Dyadic
}
/** Canonical exact value; zero exponents must not grow a later affine chain. */
function reducedFrameScalar(value: Dyadic): Dyadic {
  let { significand, exponent } = value
  if (significand === 0n) return { significand: 0n, exponent: 0 }
  while ((significand & 1n) === 0n) {
    significand >>= 1n
    exponent++
  }
  return { significand, exponent }
}
function exactSourceFrame(
  matrix: FrameMatrix<Dyadic>,
  position: Point3
): QueryExactFrame {
  if (!finitePoint(position))
    throw new Error('Invalid exact source frame position')
  matrix = matrix.map((row) =>
    row.map(reducedFrameScalar)
  ) as unknown as FrameMatrix<Dyadic>
  const cofactor = frameCross(matrix[1], matrix[2], exactFrameArithmetic)
  const determinant = matrix[0].reduce(
    (sum, value, axis) =>
      exactFrameAdd(sum, exactFrameArithmetic.multiply(value, cofactor[axis])),
    dyadic(0)
  )
  if (determinant.significand === 0n)
    throw new Error('Singular exact source frame')
  return freeze({
    matrix,
    position: position.map((value) =>
      reducedFrameScalar(dyadic(value))
    ) as unknown as FrameVector<Dyadic>,
    determinant: reducedFrameScalar(determinant)
  })
}
/** Exact polynomial coefficients; neither normalized quaternions nor rounded world points. */
export function prepareQueryExactForwardFrame(
  transform: RigidTransform
): QueryExactFrame {
  const rotation = transform.rotation
  if (
    !Array.isArray(rotation) ||
    rotation.length !== 4 ||
    !rotation.every(Number.isFinite) ||
    !rotation.some((value) => value !== 0)
  )
    throw new Error('Invalid exact source frame rotation')
  return exactSourceFrame(
    sourceRotationMatrix(rotation, exactFrameArithmetic),
    transform.position
  )
}
/** Yaw trig outputs are completed binary64 coefficients; instance is applied first. */
export function prepareQueryExactInstanceFrame(placement: {
  readonly position: Point3
  readonly yaw: number
}): QueryExactFrame {
  if (!Number.isFinite(placement.yaw))
    throw new Error('Invalid exact source frame yaw')
  return exactSourceFrame(
    sourceInstanceMatrix(placement.yaw, dyadic),
    placement.position
  )
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
/** Shared conservative frame arithmetic; no second camera inverse implementation. */
export function prepareQueryFrame(transform: RigidTransform) {
  return freeze(prepareInverse(transform))
}
export function transformQueryDirection(frame: Inverse, direction: Point3) {
  return inverse(frame, numberVector(direction), true)
}
export function transformQueryDirectionBounds(
  frame: Inverse,
  direction: Vector
) {
  return inverse(frame, direction, true)
}
/** Same original coefficients as inverse queries; no rounded world-point handoff. */
export function prepareQueryForwardFrame(transform: RigidTransform) {
  return freeze({
    matrix: rotationMatrix(transform.rotation),
    position: numberVector(transform.position)
  })
}
type BodyAffine = ReturnType<
  typeof evaluateRobotAffinePose
>['parts'][number]['affine']
/** Completed C coefficients are the authority for robot-body queries. */
export function prepareQueryAffineFrame(affine: BodyAffine) {
  return freeze({
    matrix: affine.matrix.map(numberVector) as unknown as Matrix,
    position: numberVector(affine.position)
  })
}
export function prepareQueryAffineInverse(affine: BodyAffine) {
  const frame = prepareQueryAffineFrame(affine)
  return freeze({
    matrix: inverseMatrix(frame.matrix),
    position: frame.position
  })
}
export function prepareQueryInstanceFrame(placement: {
  readonly position: Point3
  readonly yaw: number
}) {
  const matrix = sourceInstanceMatrix(placement.yaw, interval)
  return freeze({ matrix, position: numberVector(placement.position) })
}
export function transformQueryPoint(
  frame: {
    readonly matrix: readonly (readonly Interval[])[]
    readonly position: readonly Interval[]
  },
  value: readonly Interval[]
): Vector {
  if (value.length !== 3) throw new Error('Invalid query point')
  const rotated = apply(frame.matrix, [value[0], value[1], value[2]])
  return [
    add(rotated[0], frame.position[0]),
    add(rotated[1], frame.position[1]),
    add(rotated[2], frame.position[2])
  ]
}
export function directionBounds(direction: Point3): Vector {
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
export interface CanonicalRayCandidate {
  readonly mesh: GeometryMesh
  readonly region: SourceRegion
  readonly instance: number
}
type ScopedRegions = Map<GeometryMesh, Map<number, readonly SourceRegion[]>>
interface Placement {
  regions?: readonly SourceRegion[]
  mesh: GeometryMesh
  instance: number
  parents: readonly Inverse[]
}
/** Two-sided source geometry only: no sensing, quality or swept-motion verdict. */
export class RayQueries {
  readonly scopeWork = {
    membershipBuilds: 0,
    membershipVisits: 0,
    candidateVisits: 0
  }
  private membershipSource?: QueryGeometrySource
  private members = new Map<GeometryMesh, Set<SourceRegion>>()
  private origins = new Map<GeometryMesh['origin'], GeometryMesh>()
  private ordinals = new Map<GeometryMesh, number>()

  constructor(private readonly geometry: QueryGeometry) {}

  private admitMembership(source: QueryGeometrySource) {
    this.geometry.read(source)
    if (this.membershipSource === source) return
    const members = new Map<GeometryMesh, Set<SourceRegion>>()
    const origins = new Map<GeometryMesh['origin'], GeometryMesh>()
    const ordinals = new Map<GeometryMesh, number>()
    for (const mesh of source.meshes) {
      this.scopeWork.membershipVisits++
      const regions = new Set<SourceRegion>()
      for (const region of mesh.origin.regions) {
        this.scopeWork.membershipVisits++
        regions.add(region)
      }
      members.set(mesh, regions)
      ordinals.set(mesh, ordinals.size)
      if (origins.has(mesh.origin))
        throw new Error('Ambiguous canonical source origin')
      origins.set(mesh.origin, mesh)
    }
    this.geometry.read(source)
    this.members = members
    this.origins = origins
    this.ordinals = ordinals
    this.membershipSource = source
    this.scopeWork.membershipBuilds++
  }

  resolveSource(
    source: QueryGeometrySource,
    origin: GeometryMesh['origin']
  ): GeometryMesh | undefined {
    this.admitMembership(source)
    return this.origins.get(origin)
  }

  queryScoped(
    source: GeometrySource,
    raw: RayBatch,
    candidates: readonly CanonicalRayCandidate[]
  ) {
    return this.scoped(source, raw, candidates)
  }

  queryWalkingWorld(
    source: WalkingObservationGeometrySource,
    raw: WalkingWorldRayBatch,
    candidates: readonly CanonicalRayCandidate[]
  ) {
    if (
      !('source' in source.receipt) ||
      'robot' in raw ||
      Object.keys(raw).some(
        (key) =>
          ![
            'source',
            'time',
            'validFrom',
            'validUntil',
            'leaves',
            'fruits',
            'rays'
          ].includes(key)
      )
    )
      throw new Error('Invalid walking world ray request')
    for (const candidate of candidates)
      if (candidate.mesh.kind !== 'farm' || candidate.mesh.frame !== 'world')
        throw new Error('Walking rays require farm world sources')
    return this.scoped(source, raw, candidates)
  }

  private scoped<S extends QueryGeometrySource, B extends WalkingWorldRayBatch>(
    source: S,
    raw: B,
    candidates: readonly CanonicalRayCandidate[]
  ) {
    this.admitMembership(source)
    const scope: ScopedRegions = new Map()
    for (const candidate of candidates) {
      this.scopeWork.candidateVisits++
      const { mesh, region, instance } = candidate
      if (
        !this.members.get(mesh)?.has(region) ||
        !Number.isSafeInteger(instance) ||
        instance < 0 ||
        instance >= (mesh.descriptor?.instances?.length ?? 1)
      )
        throw new Error('Invalid canonical ray candidate')
      let instances = scope.get(mesh)
      if (!instances) {
        instances = new Map()
        scope.set(mesh, instances)
      }
      const regions = instances.get(instance) ?? []
      if (regions.includes(region))
        throw new Error('Duplicate canonical ray candidate')
      instances.set(
        instance,
        [...regions, region].sort((a, b) => a.indexStart - b.indexStart)
      )
    }
    const result = this.execute(source, raw, scope)
    return Object.freeze({
      ...result,
      scope: 'declared-canonical-candidates' as const
    })
  }

  query(source: GeometrySource, raw: RayBatch): RayBatchResult {
    return this.execute(source, raw)
  }

  private execute<
    S extends QueryGeometrySource,
    B extends WalkingWorldRayBatch
  >(source: S, raw: B, scope?: ScopedRegions): RayBatchResult<S, B> {
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
      fk: 0,
      bodyMatrices: 0
    }
    const publish = (results: RayResult[]): RayBatchResult<S, B> => {
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
      ('robot' in source.receipt && !('robot' in input && input.robot)) ||
      input.leaves !== 'source-pose' ||
      input.fruits !== 'all-attached'
    )
      return publish(
        input.rays.map(() => ({
          status: 'unknown',
          reason: 'missing-or-expired-scene-state'
        }))
      )
    const transforms = new Map<GeometryMesh['origin'], Inverse>()
    let base: Inverse | undefined
    if ('robot' in source.receipt) {
      const robot = (
        'robot' in input ? input.robot : undefined
      ) as RayBatch['robot']
      const rig = source.receipt.robot.rig
      if (!rig || !robot) throw new Error('Missing robot rig or pose')
      const pose = evaluateRobotAffinePose(rig, robot.joints)
      work.fk += pose.work.fk
      work.bodyMatrices += pose.work.matrices
      const bodyInverses = new Map<BodyAffine, Inverse>()
      for (const part of pose.parts) {
        let completed = bodyInverses.get(part.affine)
        if (!completed) {
          completed = prepareQueryAffineInverse(part.affine)
          bodyInverses.set(part.affine, completed)
        }
        transforms.set(part.source, completed)
      }
      base = prepareInverse(robot.base)
    }
    const placements: Placement[] = []
    for (const mesh of scope
      ? [...scope.keys()].sort((a, b) => {
          const first = this.ordinals.get(a),
            second = this.ordinals.get(b)
          if (first === undefined || second === undefined)
            throw new Error('Missing canonical source ordinal')
          return first - second
        })
      : source.meshes) {
      if (mesh.shape.kind !== 'triangles')
        throw new Error('Unsupported query source')
      const parents: Inverse[] = []
      if (mesh.frame === 'robot') {
        const body = transforms.get(mesh.origin)
        if (!body || !base) throw new Error('Missing body transform')
        parents.push(base, body)
      } else {
        if (!mesh.descriptor) throw new Error('Missing installed transform')
        parents.push(prepareInverse(mesh.descriptor))
      }
      const instances = mesh.descriptor?.instances
      const selectedInstances = scope?.get(mesh)
      const instanceIndices = selectedInstances
        ? [...selectedInstances.keys()].sort((a, b) => a - b)
        : Array.from({ length: instances?.length ?? 1 }, (_, i) => i)
      for (const instance of instanceIndices) {
        const placement = instances?.[instance]
        let chain = parents
        if (placement) {
          const forward = prepareQueryInstanceFrame(placement)
          chain = [
            ...parents,
            {
              matrix: inverseMatrix(forward.matrix),
              position: forward.position
            }
          ]
        }
        placements.push({
          mesh,
          instance,
          parents: chain,
          ...(selectedInstances
            ? { regions: selectedInstances.get(instance) }
            : {})
        })
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
      for (const { mesh, instance, parents, regions } of placements) {
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
          if (regions && !regions.includes(region.source)) continue
          if (!originCandidate(region.bounds, origin)) continue
          if (
            region.source.kind === 'open-shell' ||
            closedOrigin(shape, region.source, origin, work) !== 'outside'
          )
            originUnknown = true
        }
        const spans = regions ?? [
          { indexStart: 0, indexCount: shape.indices.length }
        ]
        for (const span of spans)
          for (
            let index = span.indexStart;
            index < span.indexStart + span.indexCount;
            index += 3
          ) {
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
                    distanceBounds: first.distance,
                    barycentric: first.barycentric.map(
                      midpoint
                    ) as unknown as Point3
                  }
                  if (
                    b.numerator * a.denominator >=
                    a.numerator * b.denominator
                  )
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
                distanceBounds: distance,
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
