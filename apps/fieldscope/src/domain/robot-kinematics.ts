import { readSourceRegions } from './source-occupancy'
import {
  robotRestFrames,
  type RobotDefinition,
  type RobotPart
} from './robot-model'
import type { Point3 } from './greenhouse'

export interface RobotJoints {
  lift: number
  yaw: number
  shoulder: number
  elbow: number
  wrist: number
}
export type RobotBody =
  'fixed' | 'lift' | 'yaw' | 'shoulder' | 'elbow' | 'wrist'
export interface RigidTransform {
  readonly position: Point3
  readonly rotation: readonly [number, number, number, number]
}
export const REST_JOINTS: Readonly<RobotJoints> = Object.freeze({
  lift: 0,
  yaw: 0,
  shoulder: 0,
  elbow: 0,
  wrist: 0
})
export const ROBOT_JOINT_LIMITS: Readonly<
  Record<keyof RobotJoints, readonly [number, number]>
> = Object.freeze({
  lift: Object.freeze([-0.1, 0.1] as const),
  yaw: Object.freeze([-Math.PI / 2, Math.PI / 2] as const),
  shoulder: Object.freeze([-Math.PI / 3, Math.PI / 3] as const),
  elbow: Object.freeze([-Math.PI / 2, Math.PI / 2] as const),
  wrist: Object.freeze([-Math.PI / 3, Math.PI / 3] as const)
})
const speeds = Object.freeze({
  lift: 0.02,
  yaw: Math.PI / 18,
  shoulder: Math.PI / 18,
  elbow: Math.PI / 18,
  wrist: Math.PI / 18
})
export interface RobotRig {
  readonly parts: readonly {
    readonly source: Readonly<RobotPart>
    readonly body: RobotBody
  }[]
  readonly frames: Readonly<ReturnType<typeof robotRestFrames>>
  readonly limits: typeof ROBOT_JOINT_LIMITS
  readonly speeds: typeof speeds
  readonly tool: {
    readonly position: Point3
    readonly closing: Point3
    readonly approach: Point3
    readonly up: Point3
  }
}

const point = (x: number, y: number, z: number): Point3 =>
  Object.freeze([x, y, z] as [number, number, number])
const identity: RigidTransform = Object.freeze({
  position: point(0, 0, 0),
  rotation: Object.freeze([0, 0, 0, 1] as const)
})
export type JointDomains = Readonly<
  Record<keyof RobotJoints, readonly [number, number]>
>
export interface KinematicAlgebra<T> {
  range(lower: number, upper: number): T
  literal(value: number): T
  add(a: T, b: T): T
  subtract(a: T, b: T): T
  multiply(a: T, b: T): T
  divide(a: T, b: T): T
  sin(value: T): T
  cos(value: T): T
}
type Vector<T> = readonly [T, T, T]
interface Transform<T> {
  readonly position: Vector<T>
  readonly rotation: readonly [T, T, T, T]
}
const numberAlgebra: KinematicAlgebra<number> = {
  literal: (value) => value,
  range: (lower) => lower,
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  sin: Math.sin,
  cos: Math.cos
}
const vector = <T>(x: T, y: T, z: T): Vector<T> =>
  Object.freeze([x, y, z] as const)
function operations<T>(algebra: KinematicAlgebra<T>) {
  const {
    literal: n,
    add: add,
    subtract: sub,
    multiply: mul,
    divide: div
  } = algebra
  const fromPoint = (p: Point3) => vector(n(p[0]), n(p[1]), n(p[2]))
  function rotate(rotation: Transform<T>['rotation'], p: Vector<T>): Vector<T> {
    const [x, y, z, w] = rotation
    const tx = mul(n(2), sub(mul(y, p[2]), mul(z, p[1]))),
      ty = mul(n(2), sub(mul(z, p[0]), mul(x, p[2]))),
      tz = mul(n(2), sub(mul(x, p[1]), mul(y, p[0])))
    return vector(
      sub(add(add(p[0], mul(w, tx)), mul(y, tz)), mul(z, ty)),
      sub(add(add(p[1], mul(w, ty)), mul(z, tx)), mul(x, tz)),
      sub(add(add(p[2], mul(w, tz)), mul(x, ty)), mul(y, tx))
    )
  }
  function transform(a: Transform<T>, value: Vector<T>): Vector<T> {
    const p = rotate(a.rotation, value)
    return vector(
      add(p[0], a.position[0]),
      add(p[1], a.position[1]),
      add(p[2], a.position[2])
    )
  }
  function compose(a: Transform<T>, b: Transform<T>): Transform<T> {
    const [x, y, z, w] = a.rotation,
      [u, v, s, t] = b.rotation
    return Object.freeze({
      position: transform(a, b.position),
      rotation: Object.freeze([
        sub(add(add(mul(w, u), mul(x, t)), mul(y, s)), mul(z, v)),
        add(add(sub(mul(w, v), mul(x, s)), mul(y, t)), mul(z, u)),
        add(sub(add(mul(w, s), mul(x, v)), mul(y, u)), mul(z, t)),
        sub(sub(sub(mul(w, t), mul(x, u)), mul(y, v)), mul(z, s))
      ] as const)
    })
  }
  function about(pivot: Vector<T>, axis: 'x' | 'y', angle: T): Transform<T> {
    const sine = algebra.sin(div(angle, n(2)))
    const rotation = Object.freeze([
      axis === 'x' ? sine : n(0),
      axis === 'y' ? sine : n(0),
      n(0),
      algebra.cos(div(angle, n(2)))
    ] as const)
    const rotated = rotate(rotation, pivot)
    return Object.freeze({
      rotation,
      position: vector(
        sub(pivot[0], rotated[0]),
        sub(pivot[1], rotated[1]),
        sub(pivot[2], rotated[2])
      )
    })
  }
  return { fromPoint, rotate, transform, compose, about }
}
const numericOperations = operations(numberAlgebra)
export function transformRobotPoint(
  transform: RigidTransform,
  value: Point3
): Point3 {
  return numericOperations.transform(transform, value)
}
function bodyFor(id: string): RobotBody {
  if (id === 'lift-carriage') return 'lift'
  if (id === 'shoulder') return 'yaw'
  if (id === 'upper-arm') return 'shoulder'
  if (id === 'elbow' || id === 'forearm') return 'elbow'
  if (
    id === 'wrist' ||
    id === 'tool-guard' ||
    id.startsWith('jaw-') ||
    id.startsWith('pad-')
  )
    return 'wrist'
  return 'fixed'
}
function admitPart(part: RobotPart): Readonly<RobotPart> {
  const shape = part.shape
  const regions = readSourceRegions(part.regions, shape.indices.length)
  // Admitted projection shapes are already immutable; direct domain callers
  // receive detached buffers, so their edits cannot change the prepared rig.
  if (
    regions === part.regions &&
    Object.isFrozen(part) &&
    Object.isFrozen(shape) &&
    Object.isFrozen(shape.positions) &&
    Object.isFrozen(shape.indices) &&
    (!shape.colors || Object.isFrozen(shape.colors)) &&
    (!shape.uvs || Object.isFrozen(shape.uvs))
  )
    return part
  return Object.freeze({
    ...part,
    regions,
    shape: Object.freeze({
      ...shape,
      positions: Object.freeze([...shape.positions]),
      indices: Object.freeze([...shape.indices]),
      ...(shape.colors ? { colors: Object.freeze([...shape.colors]) } : {}),
      ...(shape.uvs ? { uvs: Object.freeze([...shape.uvs]) } : {})
    })
  })
}
export class UnsupportedRobotRigError extends Error {}
export function prepareRobotRig(
  definition: RobotDefinition,
  parts: readonly RobotPart[]
): RobotRig {
  const { width, length, height, tool } = definition
  if (
    ![width, length, height].every(
      (value) => Number.isFinite(value) && value > 0
    ) ||
    !['cucumber', 'tomato'].includes(tool)
  )
    throw new Error('Invalid robot definition')
  const r = Math.min(length * 0.13, height * 0.12)
  if (
    height * 0.67 - 0.1 - 0.06 < r + 0.2 ||
    height * 0.67 + 0.1 + 0.06 > height - 0.045
  )
    throw new UnsupportedRobotRigError('Unsupported lift stroke')
  const frames = robotRestFrames(definition)
  Object.values(frames).forEach(Object.freeze)
  Object.freeze(frames)
  const ids = new Set(parts.map((part) => part.id))
  if (
    ids.size !== parts.length ||
    ![
      'lift-carriage',
      'shoulder',
      'upper-arm',
      'elbow',
      'forearm',
      'wrist',
      'tool-guard',
      'pad--1',
      'pad-1'
    ].every((id) => ids.has(id))
  )
    throw new Error('Incomplete robot source')
  return Object.freeze({
    parts: Object.freeze(
      parts.map((part) =>
        Object.freeze({ source: admitPart(part), body: bodyFor(part.id) })
      )
    ),
    frames,
    limits: ROBOT_JOINT_LIMITS,
    speeds,
    tool: Object.freeze({
      position: frames.tool,
      closing: point(1, 0, 0),
      approach: point(0, -1, 0),
      up: point(0, 0, 1)
    })
  })
}
export function evaluateRobotPose(rig: RobotRig, input: RobotJoints) {
  if (!input || typeof input !== 'object')
    throw new Error('Invalid robot joints')
  for (const key of Object.keys(ROBOT_JOINT_LIMITS) as (keyof RobotJoints)[]) {
    const value = input[key],
      [min, max] = ROBOT_JOINT_LIMITS[key]
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    )
      throw new Error(`Invalid robot joint: ${key}`)
  }
  const joints = Object.freeze({ ...input })
  return Object.freeze({
    joints,
    ...evaluateChain(rig, joints, numberAlgebra, identity)
  })
}

// The chain is C-owned; an algebra supplies scalar operations, never topology.
function evaluateChain<T>(
  rig: RobotRig,
  joints: Readonly<Record<keyof RobotJoints, T>>,
  algebra: KinematicAlgebra<T>,
  rest: Transform<T>
) {
  const { fromPoint, rotate, transform, compose, about } = operations(algebra)
  const shoulderPivot = fromPoint(rig.frames.shoulder)
  const elbowPivot = fromPoint(rig.frames.elbow)
  const wristPivot = fromPoint(rig.frames.wrist)
  const lift: Transform<T> = Object.freeze({
    position: vector(algebra.literal(0), joints.lift, algebra.literal(0)),
    rotation: rest.rotation
  })
  const yaw = compose(lift, about(shoulderPivot, 'y', joints.yaw))
  const shoulder = compose(yaw, about(shoulderPivot, 'x', joints.shoulder))
  const elbow = compose(shoulder, about(elbowPivot, 'x', joints.elbow))
  const wrist = compose(elbow, about(wristPivot, 'x', joints.wrist))
  const transforms = { fixed: rest, lift, yaw, shoulder, elbow, wrist }
  return Object.freeze({
    parts: Object.freeze(
      rig.parts.map((part) =>
        Object.freeze({ ...part, transform: transforms[part.body] })
      )
    ),
    frames: Object.freeze({
      shoulder: transform(shoulder, shoulderPivot),
      elbow: transform(elbow, elbowPivot),
      wrist: transform(wrist, wristPivot)
    }),
    tool: Object.freeze({
      position: transform(wrist, fromPoint(rig.tool.position)),
      closing: rotate(wrist.rotation, fromPoint(rig.tool.closing)),
      approach: rotate(wrist.rotation, fromPoint(rig.tool.approach)),
      up: rotate(wrist.rotation, fromPoint(rig.tool.up))
    })
  })
}

export function evaluateRobotDomains<T>(
  rig: RobotRig,
  input: JointDomains,
  algebra: KinematicAlgebra<T>
) {
  const domains = structuredClone(input)
  const keys = Object.keys(ROBOT_JOINT_LIMITS) as (keyof RobotJoints)[]
  if (
    !domains ||
    typeof domains !== 'object' ||
    Object.keys(domains).length !== keys.length
  )
    throw new Error('Invalid robot joint domains')
  for (const key of keys) {
    const domain = domains[key],
      [min, max] = rig.limits[key]
    if (
      !Object.hasOwn(domains, key) ||
      !Array.isArray(domain) ||
      domain.length !== 2 ||
      typeof domain[0] !== 'number' ||
      !Number.isFinite(domain[0]) ||
      typeof domain[1] !== 'number' ||
      !Number.isFinite(domain[1]) ||
      domain[0] > domain[1] ||
      domain[0] < min ||
      domain[1] > max
    )
      throw new Error(`Invalid robot joint domain: ${key}`)
  }
  // Freeze only detached numeric domains and C-owned containers, not scalar T.
  keys.forEach((key) => Object.freeze(domains[key]))
  Object.freeze(domains)
  const joints = Object.fromEntries(
    keys.map((key) => [key, algebra.range(domains[key][0], domains[key][1])])
  ) as Record<keyof RobotJoints, T>
  const rest: Transform<T> = Object.freeze({
    position: vector(
      algebra.literal(0),
      algebra.literal(0),
      algebra.literal(0)
    ),
    rotation: Object.freeze([
      algebra.literal(0),
      algebra.literal(0),
      algebra.literal(0),
      algebra.literal(1)
    ] as const)
  })
  return Object.freeze({
    domains,
    ...evaluateChain(rig, joints, algebra, rest)
  })
}
