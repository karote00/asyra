import type { RobotJoints, JointDomains } from '../domain/robot-kinematics'
import { QueryGeometry, type GeometrySource } from './geometry'
import { dyadic } from './query-arithmetic'
import { roundFraction } from '../domain/scalar-arithmetic'

export interface JointSegmentInput {
  source: 'synthetic'
  assumption: string
  from: number
  until: number
  start: RobotJoints
  end: RobotJoints
}
export interface JointDomainWindow {
  queryFrom: number
  queryUntil: number
  validFrom: number
  validUntil: number
}
interface DomainWork {
  pointEvaluations: number
  conversions: number
  maxBigIntBits: number
}
export interface JointDomainEvidence {
  readonly source: GeometrySource
  readonly segment: JointSegmentEvidence
  readonly window: Readonly<JointDomainWindow>
  readonly start: Readonly<RobotJoints>
  readonly end: Readonly<RobotJoints>
  readonly domains: JointDomains
  readonly work: Readonly<DomainWork>
}
interface JointCheck {
  readonly limits: 'within' | 'outside'
  readonly speed: 'within' | 'outside'
}
export interface JointSegmentEvidence {
  readonly source: GeometrySource
  readonly input: Readonly<
    Omit<JointSegmentInput, 'start' | 'end'> & {
      start: Readonly<RobotJoints>
      end: Readonly<RobotJoints>
    }
  >
  readonly checks: Readonly<Record<keyof RobotJoints, JointCheck>>
  readonly status: 'admissible' | 'invalid'
  readonly work: Readonly<{ joints: number; exactComparisons: number }>
}
function reject(): never {
  throw new Error('Invalid synthetic joint segment')
}
function keys(value: unknown, expected: readonly string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) reject()
  const actual = Object.keys(value)
  if (
    actual.length !== expected.length ||
    actual.some((key) => !expected.includes(key))
  )
    reject()
}
function read(raw: JointSegmentInput, joints: readonly (keyof RobotJoints)[]) {
  const input = structuredClone(raw)
  keys(input, ['source', 'assumption', 'from', 'until', 'start', 'end'])
  if (
    input.source !== 'synthetic' ||
    typeof input.assumption !== 'string' ||
    !input.assumption.trim() ||
    !Number.isFinite(input.from) ||
    !Number.isFinite(input.until) ||
    input.from < 0 ||
    input.until <= input.from
  )
    reject()
  for (const values of [input.start, input.end]) {
    keys(values, joints)
    if (joints.some((key) => !Number.isFinite(values[key]))) reject()
    Object.freeze(values)
  }
  return Object.freeze(input)
}
/** Compare original finite dyadic quantities without a rounded duration or rate. */
function withinSpeed(
  start: number,
  end: number,
  from: number,
  until: number,
  speed: number
) {
  const values = [start, end, from, until, speed].map(dyadic)
  const exponent = Math.min(...values.map((value) => value.exponent))
  const [a, b, first, last, rate] = values.map(
    (value) => value.significand << BigInt(value.exponent - exponent)
  )
  const delta = b >= a ? b - a : a - b
  const product = rate * (last - first)
  const common = Math.min(exponent, 2 * exponent)
  return (
    delta << BigInt(exponent - common) <=
    product << BigInt(2 * exponent - common)
  )
}

function readWindow(raw: JointDomainWindow) {
  const value = structuredClone(raw)
  keys(value, ['queryFrom', 'queryUntil', 'validFrom', 'validUntil'])
  if (
    Object.values(value).some((item) => !Number.isFinite(item) || item < 0) ||
    value.validFrom >= value.validUntil ||
    value.queryFrom > value.queryUntil ||
    value.validFrom > value.queryFrom ||
    value.queryUntil >= value.validUntil
  )
    reject()
  return Object.freeze(value)
}
function pointAt(
  segment: JointSegmentEvidence,
  time: number,
  work: DomainWork
): Readonly<RobotJoints> {
  work.pointEvaluations++
  const input = segment.input
  if (time === input.from) return input.start
  if (time === input.until) return input.end
  const observe = (bits: number) => {
    if (bits > 24000) throw new Error('Joint domain arithmetic budget exceeded')
    work.maxBigIntBits = Math.max(work.maxBigIntBits, bits)
  }
  const width = (value: bigint) => {
    const bits = (value < 0n ? -value : value).toString(2).length
    observe(bits)
    return bits
  }
  const shift = (value: bigint, count: number) => {
    if (
      !Number.isSafeInteger(count) ||
      count < 0 ||
      width(value) + count > 24000
    )
      throw new Error('Joint domain shift budget exceeded')
    const result = value << BigInt(count)
    width(result)
    return result
  }
  const product = (a: bigint, b: bigint) => {
    if (width(a) + width(b) > 24000)
      throw new Error('Joint domain product budget exceeded')
    const result = a * b
    width(result)
    return result
  }
  const sum = (a: bigint, b: bigint) => {
    if (Math.max(width(a), width(b)) + 1 > 24000)
      throw new Error('Joint domain sum budget exceeded')
    const result = a + b
    width(result)
    return result
  }
  const times = [input.from, input.until, time].map(dyadic)
  const exponent = Math.min(...times.map((value) => value.exponent))
  const [first, last, current] = times.map((value) =>
    shift(value.significand, value.exponent - exponent)
  )
  const left = sum(last, -current),
    right = sum(current, -first),
    duration = sum(last, -first)
  const result = {} as RobotJoints
  for (const key of Object.keys(input.start) as (keyof RobotJoints)[]) {
    const a = dyadic(input.start[key]),
      b = dyadic(input.end[key]),
      e = Math.min(a.exponent, b.exponent)
    let numerator = sum(
      product(shift(a.significand, a.exponent - e), left),
      product(shift(b.significand, b.exponent - e), right)
    )
    let denominator = duration
    if (e < 0) denominator = shift(denominator, -e)
    else numerator = shift(numerator, e)
    work.conversions++
    result[key] = roundFraction(numerator, denominator, 'nearest-even', observe)
  }
  return Object.freeze(result)
}

/** Scalar candidate evidence only. No FK, collision, physical or action admission. */
export class JointSegments {
  constructor(private readonly geometry: QueryGeometry) {}
  enclose(
    source: GeometrySource,
    raw: JointSegmentInput,
    rawWindow: JointDomainWindow
  ): JointDomainEvidence {
    this.geometry.read(source)
    const window = readWindow(rawWindow)
    const segment = this.assess(source, raw)
    if (
      segment.status !== 'admissible' ||
      window.queryFrom < segment.input.from ||
      window.queryUntil > segment.input.until
    )
      reject()
    const work: DomainWork = {
      pointEvaluations: 0,
      conversions: 0,
      maxBigIntBits: 0
    }
    const start = pointAt(segment, window.queryFrom, work)
    const end =
      window.queryUntil === window.queryFrom
        ? start
        : pointAt(segment, window.queryUntil, work)
    const domains = Object.freeze(
      Object.fromEntries(
        (Object.keys(start) as (keyof RobotJoints)[]).map((key) => [
          key,
          Object.freeze([
            Math.min(start[key], end[key]),
            Math.max(start[key], end[key])
          ])
        ])
      )
    ) as JointDomains
    this.geometry.read(source)
    return Object.freeze({
      source,
      segment,
      window,
      start,
      end,
      domains,
      work: Object.freeze(work)
    })
  }
  assess(source: GeometrySource, raw: JointSegmentInput): JointSegmentEvidence {
    this.geometry.read(source)
    const rig = source.receipt.robot.rig
    // The upstream owner never issues geometry without a rig.
    if (!rig) reject()
    const joints = Object.keys(rig.limits) as (keyof RobotJoints)[]
    const input = read(raw, joints)
    const checks = {} as Record<keyof RobotJoints, JointCheck>
    const work = { joints: 0, exactComparisons: 0 }
    let status: JointSegmentEvidence['status'] = 'admissible'
    for (const key of joints) {
      const [min, max] = rig.limits[key],
        start = input.start[key],
        end = input.end[key]
      const limits =
        start >= min && start <= max && end >= min && end <= max
          ? 'within'
          : 'outside'
      const speed = withinSpeed(
        start,
        end,
        input.from,
        input.until,
        rig.speeds[key]
      )
        ? 'within'
        : 'outside'
      work.joints++
      work.exactComparisons++
      checks[key] = Object.freeze({ limits, speed })
      if (limits === 'outside' || speed === 'outside') status = 'invalid'
    }
    this.geometry.read(source)
    return Object.freeze({
      source,
      input,
      checks: Object.freeze(checks),
      status,
      work: Object.freeze(work)
    })
  }
}
