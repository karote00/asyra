import type { Point3 } from '../domain/greenhouse'
import {
  evaluateRobotPose,
  ROBOT_JOINT_LIMITS,
  type RigidTransform,
  type RobotJoints
} from '../domain/robot-kinematics'
import type { SourceRegion } from '../domain/source-occupancy'
import {
  QueryGeometry,
  type GeometrySource,
  type GeometryMesh
} from './geometry'
import {
  prepareQueryForwardFrame,
  prepareQueryInstanceFrame,
  transformQueryPoint
} from './ray-query'
import {
  interval,
  add,
  subtract,
  multiply,
  divide,
  dyadic,
  fractionInterval,
  type Interval
} from './query-arithmetic'

interface SurfaceReference {
  mesh: number
  instance: number
  triangle: number
}
export interface SurfaceBatch {
  source: 'synthetic'
  time: number
  validFrom: number
  validUntil: number
  robot: { base: RigidTransform; joints: RobotJoints } | null
  leaves: 'source-pose' | 'unknown'
  fruits: 'all-attached' | 'unknown'
  pairs: { first: SurfaceReference; second: SurfaceReference }[]
}
export interface SurfaceSweepBatch extends Omit<
  SurfaceBatch,
  'time' | 'leaves' | 'fruits' | 'pairs'
> {
  from: number
  until: number
  leaves: 'source-pose-throughout' | 'unknown'
  fruits: 'all-attached-throughout' | 'unknown'
  pairs: {
    first: SurfaceReference
    second: SurfaceReference
    firstTranslation: Point3
    secondTranslation: Point3
  }[]
}
export interface SurfaceSweepResult extends Omit<SurfaceResult, 'status'> {
  readonly status: 'swept-separated' | 'swept-intersection' | 'unknown'
  readonly contactFraction?: Interval
  readonly contactTime?: Interval
}
export interface SurfaceWitness {
  readonly mesh: GeometryMesh
  readonly instance: number
  readonly triangle: number
  readonly region: SourceRegion
}
export interface SurfaceResult {
  readonly status: 'surface-separated' | 'surface-intersection' | 'unknown'
  readonly reason: string
  readonly first: SurfaceWitness
  readonly second: SurfaceWitness
}
export interface SurfaceWork {
  pairs: number
  vertexVisits: number
  frames: number
  fk: number
  axes: number
  exactPredicates: number
  shapeBounds: number
  regionBounds: number
}
type Vector = readonly [Interval, Interval, Interval]
type Triangle = [Vector, Vector, Vector]
type Frame = ReturnType<typeof prepareQueryForwardFrame>
const vector = (p: Point3): Vector => [
  interval(p[0]),
  interval(p[1]),
  interval(p[2])
]
const difference = (a: Vector, b: Vector): Vector => [
  subtract(a[0], b[0]),
  subtract(a[1], b[1]),
  subtract(a[2], b[2])
]
const cross = (a: Vector, b: Vector): Vector => [
  subtract(multiply(a[1], b[2]), multiply(a[2], b[1])),
  subtract(multiply(a[2], b[0]), multiply(a[0], b[2])),
  subtract(multiply(a[0], b[1]), multiply(a[1], b[0]))
]
const dot = (a: Vector, b: Vector) =>
  add(add(multiply(a[0], b[0]), multiply(a[1], b[1])), multiply(a[2], b[2]))
const edges = (t: Triangle): Triangle => [
  difference(t[1], t[0]),
  difference(t[2], t[1]),
  difference(t[0], t[2])
]
const nonzero = (v: Interval) => v.low > 0 || v.high < 0
const finite = (v: Interval) =>
  Number.isFinite(v.low) && Number.isFinite(v.high)
const freeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
function fail(): never {
  throw new Error('Invalid surface query')
}
const point = (p: unknown, size: number): p is number[] =>
  Array.isArray(p) &&
  p.length === size &&
  Array.from({ length: size }, (_, i) => Number.isFinite(p[i])).every(Boolean)
function validateState(
  input: Pick<SurfaceBatch, 'source' | 'validFrom' | 'validUntil' | 'robot'>
) {
  if (
    !input ||
    input.source !== 'synthetic' ||
    !Number.isFinite(input.validFrom) ||
    input.validFrom < 0 ||
    !Number.isFinite(input.validUntil) ||
    input.validUntil <= input.validFrom
  )
    fail()
  if (input.robot !== null) {
    const base = input.robot?.base
    if (!base || !point(base.position, 3) || !point(base.rotation, 4)) fail()
    const norm = Math.hypot(...base.rotation)
    if (
      !Number.isFinite(norm) ||
      Math.abs(norm - 1) > 1e-12 ||
      !input.robot.joints ||
      !Object.entries(ROBOT_JOINT_LIMITS).every(([key, limits]) => {
        const value = input.robot?.joints[key as keyof RobotJoints]
        return (
          typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= limits[0] &&
          value <= limits[1]
        )
      })
    )
      fail()
  }
}
function readBatch(raw: SurfaceBatch) {
  const input = structuredClone(raw)
  validateState(input)
  if (
    !Number.isFinite(input.time) ||
    input.time < 0 ||
    !['source-pose', 'unknown'].includes(input.leaves) ||
    !['all-attached', 'unknown'].includes(input.fruits) ||
    !Array.isArray(input.pairs)
  )
    fail()
  return freeze(input)
}
function readSweep(raw: SurfaceSweepBatch) {
  const input = structuredClone(raw)
  validateState(input)
  if (
    !Number.isFinite(input.from) ||
    input.from < 0 ||
    !Number.isFinite(input.until) ||
    input.until <= input.from ||
    !['source-pose-throughout', 'unknown'].includes(input.leaves) ||
    !['all-attached-throughout', 'unknown'].includes(input.fruits) ||
    !Array.isArray(input.pairs)
  )
    fail()
  for (const pair of input.pairs)
    if (
      !pair ||
      !point(pair.firstTranslation, 3) ||
      !point(pair.secondTranslation, 3)
    )
      fail()
  return freeze(input)
}
function witness(
  source: GeometrySource,
  reference: SurfaceReference
): SurfaceWitness {
  if (
    !reference ||
    ![reference.mesh, reference.instance, reference.triangle].every(
      (value) => Number.isSafeInteger(value) && value >= 0
    )
  )
    fail()
  const mesh = source.meshes[reference.mesh]
  if (
    !mesh ||
    mesh.shape.kind !== 'triangles' ||
    reference.instance >= (mesh.descriptor?.instances?.length ?? 1) ||
    reference.triangle >= mesh.shape.indices.length / 3
  )
    fail()
  const start = reference.triangle * 3
  const region = mesh.origin.regions.find(
    (item) =>
      start >= item.indexStart && start + 3 <= item.indexStart + item.indexCount
  )
  if (!region) fail()
  return Object.freeze({
    mesh,
    instance: reference.instance,
    triangle: reference.triangle,
    region
  })
}

// Exact SAT on finite singleton coordinates. No uncertain transformed centre is
// converted to a point; common dyadic scaling preserves every source coordinate.
function exactRelation(
  a: Triangle,
  b: Triangle,
  work: SurfaceWork,
  translations?: readonly [Point3, Point3]
): { status: SurfaceResult['status']; fraction?: Interval } | undefined {
  const inputs = [
    ...a.flat(),
    ...b.flat(),
    ...(translations?.flat().map(interval) ?? [])
  ]
  if (!inputs.every((value) => finite(value) && value.low === value.high))
    return undefined
  work.exactPredicates++
  const values = inputs.map((value) => dyadic(value.low)),
    nonzeroValues = values.filter((value) => value.significand !== 0n)
  const exponent = nonzeroValues.length
    ? Math.min(...nonzeroValues.map((value) => value.exponent))
    : 0
  const ints = values.map((value) =>
    value.significand === 0n
      ? 0n
      : value.significand << BigInt(value.exponent - exponent)
  )
  type Exact = [bigint, bigint, bigint]
  const sub = (x: Exact, y: Exact): Exact => [
    x[0] - y[0],
    x[1] - y[1],
    x[2] - y[2]
  ]
  const product = (x: Exact, y: Exact): Exact => [
    x[1] * y[2] - x[2] * y[1],
    x[2] * y[0] - x[0] * y[2],
    x[0] * y[1] - x[1] * y[0]
  ]
  const project = (x: Exact, y: Exact) =>
    x[0] * y[0] + x[1] * y[1] + x[2] * y[2]
  const points = [0, 3, 6, 9, 12, 15].map(
    (offset) => ints.slice(offset, offset + 3) as Exact
  )
  const first = points.slice(0, 3),
    second = points.slice(3)
  const edge = (t: Exact[]) => [
    sub(t[1], t[0]),
    sub(t[2], t[1]),
    sub(t[0], t[2])
  ]
  const ae = edge(first),
    be = edge(second),
    an = product(ae[0], ae[1]),
    bn = product(be[0], be[1])
  if (an.every((value) => value === 0n) || bn.every((value) => value === 0n))
    return { status: 'unknown' }
  // Triangle face normals and all edge crosses are the SAT axes. In-plane
  // edge normals additionally cover the lower-dimensional coplanar case.
  const axes = [
    an,
    bn,
    ...ae.flatMap((x) => be.map((y) => product(x, y))),
    ...ae.map((x) => product(an, x)),
    ...be.map((x) => product(bn, x))
  ]
  interface Fraction {
    n: bigint
    d: bigint
  }
  let enter: Fraction = { n: 0n, d: 1n },
    exit: Fraction = { n: 1n, d: 1n }
  const compare = (x: Fraction, y: Fraction) => x.n * y.d - y.n * x.d
  const relative = translations
    ? sub(ints.slice(18, 21) as Exact, ints.slice(21, 24) as Exact)
    : undefined
  const constrain = (gap: bigint, speed: bigint) => {
    if (speed === 0n) return gap >= 0n
    const bound = speed > 0n ? { n: -gap, d: speed } : { n: gap, d: -speed }
    if (speed > 0n && compare(bound, enter) > 0n) enter = bound
    if (speed < 0n && compare(bound, exit) < 0n) exit = bound
    return compare(enter, exit) <= 0n
  }
  for (const axis of axes) {
    if (axis.every((value) => value === 0n)) continue
    work.axes++
    const ap = first.map((p) => project(axis, p)),
      bp = second.map((p) => project(axis, p))
    const min = (p: bigint[]) => p.reduce((x, y) => (x < y ? x : y)),
      max = (p: bigint[]) => p.reduce((x, y) => (x > y ? x : y))
    if (relative) {
      const speed = project(relative, axis)
      if (
        !constrain(max(ap) - min(bp), speed) ||
        !constrain(max(bp) - min(ap), -speed)
      )
        return { status: 'surface-separated' }
    } else if (max(ap) < min(bp) || max(bp) < min(ap))
      return { status: 'surface-separated' }
  }
  if (!translations) return { status: 'surface-intersection' }
  const fraction = fractionInterval(enter.n, enter.d)
  return finite(fraction)
    ? { status: 'surface-intersection', fraction }
    : { status: 'unknown' }
}
function crossing(segment: [Vector, Vector], triangle: Triangle) {
  const direction = difference(segment[1], segment[0]),
    e1 = difference(triangle[1], triangle[0]),
    e2 = difference(triangle[2], triangle[0])
  const p = cross(direction, e2),
    det = dot(e1, p)
  if (!finite(det) || !nonzero(det)) return false
  const offset = difference(segment[0], triangle[0]),
    q = cross(offset, e1)
  const u = divide(dot(offset, p), det),
    v = divide(dot(direction, q), det),
    t = divide(dot(e2, q), det),
    sum = add(u, v)
  return (
    [u, v, t, sum].every(finite) &&
    u.low >= 0 &&
    v.low >= 0 &&
    sum.high <= 1 &&
    t.low >= 0 &&
    t.high <= 1
  )
}
function relation(
  a: Triangle,
  b: Triangle,
  work: SurfaceWork
): Pick<SurfaceResult, 'status' | 'reason'> {
  if (![...a.flat(), ...b.flat()].every(finite))
    return { status: 'unknown', reason: 'unbounded-surface-arithmetic' }
  const exact = exactRelation(a, b, work)
  if (exact)
    return {
      status: exact.status,
      reason:
        exact.status === 'unknown'
          ? 'degenerate-source-triangle'
          : 'exact-surface-relation'
    }
  const ae = edges(a),
    be = edges(b),
    an = cross(ae[0], ae[1]),
    bn = cross(be[0], be[1])
  if (!an.some(nonzero) || !bn.some(nonzero))
    return { status: 'unknown', reason: 'uncertain-source-triangle' }
  const axes = [
    vector([1, 0, 0]),
    vector([0, 1, 0]),
    vector([0, 0, 1]),
    an,
    bn,
    ...ae.flatMap((x) => be.map((y) => cross(x, y))),
    ...ae.map((x) => cross(an, x)),
    ...be.map((x) => cross(bn, x))
  ]
  for (const axis of axes) {
    work.axes++
    const ap = a.map((p) => dot(axis, p)),
      bp = b.map((p) => dot(axis, p))
    if (
      Math.max(...ap.map((p) => p.high)) < Math.min(...bp.map((p) => p.low)) ||
      Math.max(...bp.map((p) => p.high)) < Math.min(...ap.map((p) => p.low))
    )
      return { status: 'surface-separated', reason: 'separating-axis' }
  }
  for (let i = 0; i < 3; i++)
    if (
      crossing([a[i], a[(i + 1) % 3]], b) ||
      crossing([b[i], b[(i + 1) % 3]], a)
    )
      return { status: 'surface-intersection', reason: 'edge-crossing' }
  return { status: 'unknown', reason: 'uncertain-surface-pair' }
}

interface SweepProof {
  status: SurfaceResult['status']
  reason: string
  fraction?: Interval
}
function sweptRelation(
  a: Triangle,
  b: Triangle,
  translations: readonly [Point3, Point3],
  work: SurfaceWork
): SweepProof {
  if (![...a.flat(), ...b.flat()].every(finite))
    return { status: 'unknown', reason: 'unbounded-sweep-arithmetic' }
  const exact = exactRelation(a, b, work, translations)
  if (exact)
    return {
      ...exact,
      reason:
        exact.status === 'unknown'
          ? 'degenerate-or-unbounded-sweep'
          : 'exact-continuous-interval'
    }
  const ae = edges(a),
    be = edges(b),
    an = cross(ae[0], ae[1]),
    bn = cross(be[0], be[1])
  if (!an.some(nonzero) || !bn.some(nonzero))
    return { status: 'unknown', reason: 'uncertain-source-triangle' }
  const axes = [
    vector([1, 0, 0]),
    vector([0, 1, 0]),
    vector([0, 0, 1]),
    an,
    bn,
    ...ae.flatMap((x) => be.map((y) => cross(x, y))),
    ...ae.map((x) => cross(an, x)),
    ...be.map((x) => cross(bn, x))
  ]
  const relative = difference(vector(translations[0]), vector(translations[1]))
  const possible = { low: 0, high: 1 },
    guaranteed = { low: 0, high: 1 }
  const constrain = (
    window: { low: number; high: number },
    gap: Interval,
    speed: Interval,
    inner: boolean
  ) => {
    const g = inner ? gap.low : gap.high,
      v = inner ? speed.low : speed.high
    if (!Number.isFinite(g) || !Number.isFinite(v)) {
      if (inner) window.low = Infinity
      return
    }
    if (v === 0) {
      if (g < 0) window.low = Infinity
      return
    }
    const bound = divide(interval(-g), interval(v))
    if (!finite(bound)) {
      if (inner) window.low = Infinity
      return
    }
    if (v > 0) window.low = Math.max(window.low, inner ? bound.high : bound.low)
    else window.high = Math.min(window.high, inner ? bound.low : bound.high)
  }
  const extent = (t: Triangle, axis: Vector, maximum: boolean): Interval => {
    const values = t.map((p) => dot(axis, p)),
      select = maximum ? Math.max : Math.min
    return {
      low: select(...values.map((v) => v.low)),
      high: select(...values.map((v) => v.high))
    }
  }
  for (const axis of axes) {
    work.axes++
    const speed = dot(relative, axis),
      reverse = { low: -speed.high, high: -speed.low }
    const gaps = [
      subtract(extent(a, axis, true), extent(b, axis, false)),
      subtract(extent(b, axis, true), extent(a, axis, false))
    ]
    for (let i = 0; i < 2; i++) {
      const slope = i ? reverse : speed
      constrain(possible, gaps[i], slope, false)
      constrain(guaranteed, gaps[i], slope, true)
    }
    if (possible.low > possible.high)
      return {
        status: 'surface-separated',
        reason: 'disjoint-continuous-time-constraints'
      }
  }
  // This exact floating witness satisfies every guaranteed inequality at the
  // same time. A midpoint of the outer possible interval would not be a proof.
  if (guaranteed.low <= guaranteed.high)
    return {
      status: 'surface-intersection',
      reason: 'common-guaranteed-time',
      fraction: interval(guaranteed.low)
    }
  return { status: 'unknown', reason: 'uncertain-continuous-time-constraints' }
}

/** Selected surface evidence only; never full-body, contact or movement clearance. */
export class SurfaceQueries {
  constructor(private readonly geometry: QueryGeometry) {}
  private prepare(
    source: GeometrySource,
    references: readonly {
      first: SurfaceReference
      second: SurfaceReference
    }[],
    robot: SurfaceBatch['robot']
  ) {
    const pairs = Array.from(references, (pair) => {
      if (!pair) fail()
      return {
        first: witness(source, pair.first),
        second: witness(source, pair.second)
      }
    })
    const work: SurfaceWork = {
      pairs: pairs.length,
      vertexVisits: 0,
      frames: 0,
      fk: 0,
      axes: 0,
      exactPredicates: 0,
      shapeBounds: 0,
      regionBounds: 0
    }
    const hasRobot = pairs.some(
      (pair) =>
        pair.first.mesh.frame === 'robot' || pair.second.mesh.frame === 'robot'
    )
    const triangles = () => {
      const transforms = new Map<GeometryMesh['origin'], RigidTransform>()
      if (hasRobot && robot) {
        const rig = source.receipt.robot.rig
        if (!rig) fail()
        const pose = evaluateRobotPose(rig, robot.joints)
        work.fk++
        for (const part of pose.parts)
          transforms.set(part.source, part.transform)
      }
      const frames = new Map<object, Frame>()
      const forward = (key: RigidTransform) => {
        let value = frames.get(key)
        if (!value) {
          value = prepareQueryForwardFrame(key)
          frames.set(key, value)
          work.frames++
        }
        return value
      }
      const triangle = (item: SurfaceWitness): Triangle => {
        const mesh = item.mesh,
          shape = mesh.shape
        if (shape.kind !== 'triangles') fail()
        const chain: Frame[] = []
        const placement = mesh.descriptor?.instances?.[item.instance]
        if (placement) {
          let frame = frames.get(placement)
          if (!frame) {
            frame = prepareQueryInstanceFrame(placement)
            frames.set(placement, frame)
            work.frames++
          }
          chain.push(frame)
        }
        if (mesh.frame === 'robot') {
          const body = transforms.get(mesh.origin)
          if (!body || !robot) fail()
          chain.push(forward(body), forward(robot.base))
        } else {
          if (!mesh.descriptor) fail()
          chain.push(forward(mesh.descriptor))
        }
        return [0, 1, 2].map((corner) => {
          const offset = shape.indices[item.triangle * 3 + corner] * 3
          work.vertexVisits++
          let p = vector([
            shape.positions[offset],
            shape.positions[offset + 1],
            shape.positions[offset + 2]
          ])
          for (const frame of chain) p = transformQueryPoint(frame, p)
          return p
        }) as Triangle
      }

      return triangle
    }
    return { pairs, work, hasRobot, triangles }
  }
  private publish<I, R>(
    source: GeometrySource,
    input: I,
    work: SurfaceWork,
    results: R[]
  ) {
    this.geometry.read(source)
    return Object.freeze({
      geometry: source,
      input,
      results: Object.freeze(results.map((result) => Object.freeze(result))),
      work: Object.freeze(work)
    })
  }
  query(source: GeometrySource, raw: SurfaceBatch) {
    this.geometry.read(source)
    const input = readBatch(raw),
      prepared = this.prepare(source, input.pairs, input.robot),
      { pairs, work, hasRobot } = prepared
    if (
      input.time < input.validFrom ||
      input.time >= input.validUntil ||
      input.leaves !== 'source-pose' ||
      input.fruits !== 'all-attached' ||
      (hasRobot && !input.robot)
    )
      return this.publish(
        source,
        input,
        work,
        pairs.map((pair): SurfaceResult => ({
          ...pair,
          status: 'unknown',
          reason: 'missing-or-expired-scene-state'
        }))
      )
    const triangle = prepared.triangles()
    return this.publish(
      source,
      input,
      work,
      pairs.map((pair): SurfaceResult => ({
        ...pair,
        ...relation(triangle(pair.first), triangle(pair.second), work)
      }))
    )
  }
  sweep(source: GeometrySource, raw: SurfaceSweepBatch) {
    this.geometry.read(source)
    const input = readSweep(raw),
      prepared = this.prepare(source, input.pairs, input.robot),
      { pairs, work, hasRobot } = prepared
    if (
      input.from < input.validFrom ||
      input.until >= input.validUntil ||
      input.leaves !== 'source-pose-throughout' ||
      input.fruits !== 'all-attached-throughout' ||
      (hasRobot && !input.robot)
    )
      return this.publish(
        source,
        input,
        work,
        pairs.map((pair): SurfaceSweepResult => ({
          ...pair,
          status: 'unknown',
          reason: 'missing-or-expired-interval-state'
        }))
      )
    const triangle = prepared.triangles()
    const results = pairs.map((pair, index): SurfaceSweepResult => {
      const movement = input.pairs[index]
      const proof = sweptRelation(
        triangle(pair.first),
        triangle(pair.second),
        [movement.firstTranslation, movement.secondTranslation],
        work
      )
      if (proof.status !== 'surface-intersection' || !proof.fraction)
        return {
          ...pair,
          status:
            proof.status === 'surface-separated'
              ? 'swept-separated'
              : 'unknown',
          reason: proof.reason
        }
      const contactFraction = Object.freeze(proof.fraction)
      const converted = add(
        interval(input.from),
        multiply(
          subtract(interval(input.until), interval(input.from)),
          contactFraction
        )
      )
      // The proven fraction is in [0,1], so the closed request interval is an
      // independent enclosure even if floating time conversion overflows.
      const contactTime = Object.freeze({
        low: Math.max(input.from, converted.low),
        high: Math.min(input.until, converted.high)
      })
      return {
        ...pair,
        status: 'swept-intersection',
        reason: proof.reason,
        contactFraction,
        contactTime
      }
    })
    return this.publish(source, input, work, results)
  }
}
