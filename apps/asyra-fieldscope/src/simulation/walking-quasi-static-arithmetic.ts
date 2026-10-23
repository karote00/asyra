import {
  add,
  subtract,
  multiply,
  divide,
  squareRoot,
  interval,
  dyadic,
  type Interval
} from '../domain/scalar-arithmetic'
import type { Point3 } from '../domain/greenhouse'
import type { WalkingRigidTransform } from '../domain/walking-robot-definition'

export type MechanicsVector = readonly [Interval, Interval, Interval]
export type MechanicsPlanePoint = readonly [number, number]
export const STANDARD_GRAVITY_METRES_PER_SECOND_SQUARED = 9.80665
const zero = () => interval(0)
const uncertain = (): Interval => ({ low: -Infinity, high: Infinity })
export const mechanicsVector = (p: Point3): MechanicsVector => [
  interval(p[0]),
  interval(p[1]),
  interval(p[2])
]
export const mechanicsAdd = (
  a: MechanicsVector,
  b: MechanicsVector
): MechanicsVector => [add(a[0], b[0]), add(a[1], b[1]), add(a[2], b[2])]
export const mechanicsSubtract = (
  a: MechanicsVector,
  b: MechanicsVector
): MechanicsVector => [
  subtract(a[0], b[0]),
  subtract(a[1], b[1]),
  subtract(a[2], b[2])
]
export const mechanicsScale = (
  a: MechanicsVector,
  b: Interval
): MechanicsVector => [multiply(a[0], b), multiply(a[1], b), multiply(a[2], b)]
const dot = (a: MechanicsVector, b: MechanicsVector) =>
  add(add(multiply(a[0], b[0]), multiply(a[1], b[1])), multiply(a[2], b[2]))
const cross = (a: MechanicsVector, b: MechanicsVector): MechanicsVector => [
  subtract(multiply(a[1], b[2]), multiply(a[2], b[1])),
  subtract(multiply(a[2], b[0]), multiply(a[0], b[2])),
  subtract(multiply(a[0], b[1]), multiply(a[1], b[0]))
]
const square = (v: Interval): Interval => {
  if (v.low <= 0 && v.high >= 0)
    return {
      low: 0,
      high: Math.max(
        multiply(interval(v.low), interval(v.low)).high,
        multiply(interval(v.high), interval(v.high)).high
      )
    }
  return multiply(v, v)
}
export const mechanicsMagnitude = (v: MechanicsVector) =>
  squareRoot(add(add(square(v[0]), square(v[1])), square(v[2])))
function rotate(
  frame: WalkingRigidTransform,
  p: MechanicsVector
): MechanicsVector {
  const q = mechanicsVector([
      frame.rotation[0],
      frame.rotation[1],
      frame.rotation[2]
    ]),
    twiceCross = mechanicsScale(cross(q, p), interval(2))
  return mechanicsAdd(
    p,
    mechanicsAdd(
      mechanicsScale(twiceCross, interval(frame.rotation[3])),
      cross(q, twiceCross)
    )
  )
}
/** Directed arithmetic over the completed binary64 pose, not ideal-real trig. */
export function mechanicsTransform(
  frame: WalkingRigidTransform,
  p: MechanicsVector
): MechanicsVector {
  return mechanicsAdd(mechanicsVector(frame.position), rotate(frame, p))
}
export function mechanicsCentreOfMass(
  entries: readonly { massKg: number; position: MechanicsVector }[]
) {
  let totalMass = zero(),
    weighted = mechanicsVector([0, 0, 0])
  for (const entry of entries) {
    const mass = interval(entry.massKg)
    totalMass = add(totalMass, mass)
    weighted = mechanicsAdd(weighted, mechanicsScale(entry.position, mass))
  }
  return {
    totalMass,
    worldCoM: weighted.map((v) =>
      divide(v, totalMass)
    ) as unknown as MechanicsVector
  }
}
export function mechanicsTorque(
  pivot: MechanicsVector,
  position: MechanicsVector,
  mass: Interval
) {
  const vector = cross(mechanicsSubtract(position, pivot), [
    zero(),
    multiply(mass, interval(-STANDARD_GRAVITY_METRES_PER_SECOND_SQUARED)),
    zero()
  ])
  return { vector, magnitude: mechanicsMagnitude(vector) }
}
function orientation(
  a: MechanicsPlanePoint,
  b: MechanicsPlanePoint,
  c: MechanicsPlanePoint
) {
  const values = [...a, ...b, ...c].map(dyadic),
    exponent = Math.min(...values.map((v) => v.exponent)),
    ints = values.map((v) => v.significand << BigInt(v.exponent - exponent))
  return (
    (ints[2] - ints[0]) * (ints[5] - ints[1]) -
    (ints[3] - ints[1]) * (ints[4] - ints[0])
  )
}
/** Exact dyadic orientation makes collinearity a decision, not an epsilon. */
export function mechanicsHull(
  points: readonly MechanicsPlanePoint[]
): readonly MechanicsPlanePoint[] {
  const sorted = [...points]
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .filter(
      (p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]
    )
  if (sorted.length < 3) return sorted
  const half = (values: readonly MechanicsPlanePoint[]) => {
    const result: MechanicsPlanePoint[] = []
    for (const value of values) {
      while (
        result.length >= 2 &&
        orientation(
          result[result.length - 2],
          result[result.length - 1],
          value
        ) <= 0n
      )
        result.pop()
      result.push(value)
    }
    result.pop()
    return result
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

export function mechanicsSupport(
  centre: MechanicsVector,
  mass: Interval,
  frame: WalkingRigidTransform,
  points: readonly MechanicsPlanePoint[],
  reserve: number | undefined
) {
  const hull = mechanicsHull(points),
    u = rotate(frame, mechanicsVector([1, 0, 0])),
    v = rotate(frame, mechanicsVector([0, 0, 1])),
    normal = cross(v, u),
    origin = mechanicsVector(frame.position),
    uu = dot(u, u),
    vv = dot(v, v),
    uv = dot(u, v),
    det = subtract(multiply(uu, vv), multiply(uv, uv)),
    normalLength = mechanicsMagnitude(normal)
  const offset = mechanicsSubtract(origin, centre),
    displacement = divide(dot(normal, offset), normal[1]),
    worldProjection = mechanicsAdd(centre, [zero(), displacement, zero()]),
    delta = mechanicsSubtract(worldProjection, origin),
    du = dot(delta, u),
    dv = dot(delta, v)
  const projection = [
    divide(subtract(multiply(du, vv), multiply(dv, uv)), det),
    divide(subtract(multiply(dv, uu), multiply(du, uv)), det)
  ] as const
  const supported = normal[1].low > 0 && det.low > 0
  const reserveInterval =
    reserve === undefined ? uncertain() : interval(reserve)
  const gravityNormal = divide(normal[1], normalLength),
    reserveMoment = multiply(
      multiply(
        mass,
        multiply(
          interval(STANDARD_GRAVITY_METRES_PER_SECOND_SQUARED),
          reserveInterval
        )
      ),
      gravityNormal
    )
  const edges = hull.map((a, i) => {
    const b = hull[(i + 1) % hull.length],
      dx = subtract(interval(b[0]), interval(a[0])),
      dz = subtract(interval(b[1]), interval(a[1])),
      worldEdge = mechanicsAdd(mechanicsScale(u, dx), mechanicsScale(v, dz)),
      length = mechanicsMagnitude(worldEdge),
      signedArea = subtract(
        multiply(dx, subtract(projection[1], interval(a[1]))),
        multiply(dz, subtract(projection[0], interval(a[0])))
      ),
      distance = divide(multiply(signedArea, normalLength), length),
      margin = subtract(distance, reserveInterval),
      pivot = mechanicsAdd(
        origin,
        mechanicsAdd(
          mechanicsScale(u, interval(a[0])),
          mechanicsScale(v, interval(a[1]))
        )
      ),
      torque = mechanicsTorque(pivot, centre, mass).vector,
      moment = subtract(divide(dot(worldEdge, torque), length), reserveMoment)
    return { from: a, until: b, marginMetres: margin, momentNm: moment }
  })
  const minimum = (values: readonly Interval[]): Interval =>
    values.length
      ? {
          low: Math.min(...values.map((x) => x.low)),
          high: Math.min(...values.map((x) => x.high))
        }
      : uncertain()
  const supportMarginMetres = minimum(edges.map((e) => e.marginMetres)),
    minimumMomentNm = minimum(edges.map((e) => e.momentNm))
  let status: 'screened' | 'blocked' | 'unknown' = 'unknown'
  if (hull.length < 3) status = 'blocked'
  else if (supported) {
    if (edges.some((e) => e.marginMetres.high <= 0 || e.momentNm.high <= 0))
      status = 'blocked'
    else if (edges.every((e) => e.marginMetres.low > 0 && e.momentNm.low > 0))
      status = 'screened'
  }
  return {
    status,
    hull,
    projection,
    worldProjection,
    supportMarginMetres,
    edges,
    minimumMomentNm
  }
}
