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
function rotate(rotation: RigidTransform['rotation'], p: Point3): Point3 {
  const [x, y, z, w] = rotation
  const tx = 2 * (y * p[2] - z * p[1]),
    ty = 2 * (z * p[0] - x * p[2]),
    tz = 2 * (x * p[1] - y * p[0])
  return point(
    p[0] + w * tx + y * tz - z * ty,
    p[1] + w * ty + z * tx - x * tz,
    p[2] + w * tz + x * ty - y * tx
  )
}
export function transformRobotPoint(
  transform: RigidTransform,
  value: Point3
): Point3 {
  const p = rotate(transform.rotation, value)
  return point(
    p[0] + transform.position[0],
    p[1] + transform.position[1],
    p[2] + transform.position[2]
  )
}
function compose(a: RigidTransform, b: RigidTransform): RigidTransform {
  const [x, y, z, w] = a.rotation,
    [u, v, s, t] = b.rotation
  return Object.freeze({
    position: transformRobotPoint(a, b.position),
    rotation: Object.freeze([
      w * u + x * t + y * s - z * v,
      w * v - x * s + y * t + z * u,
      w * s + x * v - y * u + z * t,
      w * t - x * u - y * v - z * s
    ] as const)
  })
}
function about(pivot: Point3, axis: 'x' | 'y', angle: number): RigidTransform {
  const sine = Math.sin(angle / 2)
  const rotation = Object.freeze([
    axis === 'x' ? sine : 0,
    axis === 'y' ? sine : 0,
    0,
    Math.cos(angle / 2)
  ] as const)
  const rotated = rotate(rotation, pivot)
  return Object.freeze({
    rotation,
    position: point(
      pivot[0] - rotated[0],
      pivot[1] - rotated[1],
      pivot[2] - rotated[2]
    )
  })
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
  const lift: RigidTransform = Object.freeze({
    position: point(0, joints.lift, 0),
    rotation: identity.rotation
  })
  const yaw = compose(lift, about(rig.frames.shoulder, 'y', joints.yaw))
  const shoulder = compose(
    yaw,
    about(rig.frames.shoulder, 'x', joints.shoulder)
  )
  const elbow = compose(shoulder, about(rig.frames.elbow, 'x', joints.elbow))
  const wrist = compose(elbow, about(rig.frames.wrist, 'x', joints.wrist))
  const transforms = { fixed: identity, lift, yaw, shoulder, elbow, wrist }
  return Object.freeze({
    joints,
    parts: Object.freeze(
      rig.parts.map((part) =>
        Object.freeze({ ...part, transform: transforms[part.body] })
      )
    ),
    frames: Object.freeze({
      shoulder: transformRobotPoint(shoulder, rig.frames.shoulder),
      elbow: transformRobotPoint(elbow, rig.frames.elbow),
      wrist: transformRobotPoint(wrist, rig.frames.wrist)
    }),
    tool: Object.freeze({
      position: transformRobotPoint(wrist, rig.tool.position),
      closing: rotate(wrist.rotation, rig.tool.closing),
      approach: rotate(wrist.rotation, rig.tool.approach),
      up: rotate(wrist.rotation, rig.tool.up)
    })
  })
}
