import type { RobotJoints } from '../domain/robot-kinematics'
import { QueryGeometry, type GeometrySource } from './geometry'
import { dyadic } from './query-arithmetic'

export interface JointSegmentInput {
  source: 'synthetic'
  assumption: string
  from: number
  until: number
  start: RobotJoints
  end: RobotJoints
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

/** Scalar candidate evidence only. No FK, collision, physical or action admission. */
export class JointSegments {
  constructor(private readonly geometry: QueryGeometry) {}
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
