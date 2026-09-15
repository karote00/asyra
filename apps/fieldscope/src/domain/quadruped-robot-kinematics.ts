import type { Point3 } from './greenhouse'
import {
  readQuadrupedRobotPose,
  type QuadrupedRobotJointState
} from './quadruped-robot-definition'
import {
  composeRigidTransform,
  evaluateArticulatedTransforms,
  rotateRigidAxis
} from './walking-robot-kinematics'
import {
  freezeSource,
  rigidFrame,
  type QuadrupedRobotSource,
  type QuadrupedBasketMount,
  type QuadrupedRobotPart
} from './quadruped-robot-source'
import type { WalkingRigidTransform } from './walking-robot-definition'

export interface QuadrupedRobotPoseResult {
  readonly source: QuadrupedRobotSource
  readonly mount: QuadrupedBasketMount
  readonly joints: QuadrupedRobotJointState
  readonly parts: readonly QuadrupedRobotPart[]
  readonly bodyTransforms: readonly {
    id: string
    transform: WalkingRigidTransform
    frameChain: readonly WalkingRigidTransform[]
    sourceParts: readonly QuadrupedRobotPart[]
  }[]
  readonly frames: {
    readonly armRoots: readonly (WalkingRigidTransform & { chainId: string })[]
    readonly tools: readonly (WalkingRigidTransform & { chainId: string })[]
    readonly feet: readonly (WalkingRigidTransform & { chainId: string })[]
  }
}
/** Pure FK from source-bound joint state. Candidate output does not admit motion. */
export function evaluateQuadrupedRobotPose(
  source: QuadrupedRobotSource,
  raw: unknown,
  mount: QuadrupedBasketMount
): QuadrupedRobotPoseResult {
  if (mount.source !== source) throw new Error('Foreign basket source')
  const joints = readQuadrupedRobotPose(source.definition, raw)
  const values = new Map<string, number>()
  for (const side of ['left', 'right'] as const) {
    const ids = source.rig.stageJointIds[side]
    for (const id of ids) values.set(id, joints.lifts[side] / ids.length)
  }
  for (const arm of joints.arms) {
    const id = arm.side + '-' + arm.role
    for (const key of Object.keys(
      source.definition.armAxes
    ) as (keyof typeof source.definition.armAxes)[])
      values.set(id + '-' + key, arm[key])
    if (arm.role === 'cutter')
      for (const sign of [-1, 1])
        values.set(
          id + '-tool-blade-' + sign,
          sign * 0.24 * (1 - arm.toolClosure)
        )
  }
  for (const leg of joints.legs) {
    const id = leg.side + '-' + leg.station
    for (const key of Object.keys(
      source.definition.legAxes
    ) as (keyof typeof source.definition.legAxes)[])
      values.set(id + '-' + key, leg[key])
  }
  const frameChains = new Map<string, readonly WalkingRigidTransform[]>()
  const transforms = evaluateArticulatedTransforms(
    source.rig.bodies,
    source.rig.joints,
    values,
    rigidFrame([0, source.definition.referenceBaseHeight, 0]),
    (bodyId, chain) => frameChains.set(bodyId, chain)
  )
  const frame = (id: string, point: Point3 = [0, 0, 0]) => {
    const transform = transforms.get(id)
    if (!transform) throw new Error('Missing quadruped transform')
    return composeRigidTransform(transform, rigidFrame(point))
  }
  return freezeSource({
    source,
    mount,
    joints,
    parts: [...source.parts, ...mount.parts],
    bodyTransforms: source.rig.bodies.map((body) => ({
      id: body.id,
      transform: frame(body.id),
      frameChain:
        frameChains.get(body.id) ??
        (() => {
          throw new Error('Missing canonical frame chain')
        })(),
      sourceParts: source.parts.filter((part) => part.bodyId === body.id)
    })),
    frames: {
      armRoots: source.rig.armChains.map((chain) => ({
        chainId: chain.id,
        ...frame(chain.rootBodyId)
      })),
      tools: source.rig.armChains.map((chain) => ({
        chainId: chain.id,
        ...frame(chain.terminalBodyId, chain.activePoint)
      })),
      feet: source.rig.legChains.map((chain) => {
        const contact = source.contacts.feet.find(
          (contact) => contact.part.bodyId === chain.terminalBodyId
        )
        const body = transforms.get(chain.terminalBodyId)
        if (!contact || !body)
          throw new Error('Missing canonical sole contact frame')
        return {
          chainId: chain.id,
          ...composeRigidTransform(body, contact.localFrame)
        }
      })
    }
  })
}

/** Closed-form planar candidate construction; no field target, IK search or motion admission. */
export function createQuadrupedCandidatePoses(
  source: QuadrupedRobotSource,
  mount: QuadrupedBasketMount
) {
  if (mount.source !== source) throw new Error('Foreign candidate mount')
  const definition = source.definition
  const arm = definition.arms.find(
    (item) => item.side === 'left' && item.role === 'holder'
  )
  if (!arm) throw new Error('Missing placement holder')
  const lift = 0.6
  const rootJoint = source.rig.joints.find(
    (joint) => joint.id === 'left-holder-rootYaw'
  )
  const shoulder = source.rig.joints.find(
    (joint) => joint.id === 'left-holder-rootPitch'
  )
  if (!rootJoint || !shoulder) throw new Error('Missing placement root')
  const wristYawJoint = source.rig.joints.find(
    (joint) => joint.id === 'left-holder-wristYaw'
  )
  const wristRollJoint = source.rig.joints.find(
    (joint) => joint.id === 'left-holder-wristRoll'
  )
  const toolBody = source.rig.bodies.find(
    (body) => body.id === 'left-holder-tool'
  )
  if (!wristYawJoint || !wristRollJoint || !toolBody?.fixedFrame)
    throw new Error('Missing placement wrist frames')
  const firstWristSpan = wristYawJoint.frame.position[2]
  const distalWristSpan =
    wristRollJoint.frame.position[2] + toolBody.fixedFrame.position[2]
  const ancestors = new Set<string>()
  let bodyId: string | null = rootJoint.childBodyId
  while (bodyId) {
    const body = source.rig.bodies.find((item) => item.id === bodyId)
    if (!body || ancestors.has(bodyId))
      throw new Error('Invalid placement ancestry')
    ancestors.add(bodyId)
    bodyId = body.parentBodyId
  }
  const rootJoints = source.rig.joints.filter((joint) =>
    ancestors.has(joint.childBodyId)
  )
  const values = new Map(
    rootJoints.map((joint) => [
      joint.id,
      joint.id === rootJoint.id
        ? 0
        : lift / source.rig.stageJointIds.left.length
    ])
  )
  const rootFrame = evaluateArticulatedTransforms(
    source.rig.bodies.filter((body) => ancestors.has(body.id)),
    rootJoints,
    values,
    rigidFrame([0, definition.referenceBaseHeight, 0])
  ).get(rootJoint.childBodyId)
  if (!rootFrame) throw new Error('Missing placement root frame')
  const inverse = (frame: WalkingRigidTransform): WalkingRigidTransform =>
    composeRigidTransform(
      {
        position: [0, 0, 0],
        rotation: [
          -frame.rotation[0],
          -frame.rotation[1],
          -frame.rotation[2],
          frame.rotation[3]
        ]
      },
      rigidFrame([-frame.position[0], -frame.position[1], -frame.position[2]])
    )
  const target: WalkingRigidTransform = {
    position: [
      (mount.opening.min[0] + mount.opening.max[0]) / 2,
      definition.referenceBaseHeight + mount.opening.min[1] - 0.02,
      (mount.opening.min[2] + mount.opening.max[2]) / 2
    ],
    rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2]
  }
  // Roll preserves local Z; the distal two wrist offsets share the final tool axis.
  const wristCentre = composeRigidTransform(
    target,
    rigidFrame([
      -arm.tool.activePoint[0],
      -arm.tool.activePoint[1],
      -arm.tool.activePoint[2] - distalWristSpan
    ])
  )
  const localCentre = composeRigidTransform(
    inverse(rootFrame),
    wristCentre
  ).position
  const rootYaw = Math.atan2(localCentre[0], localCentre[2])
  const yawFrame = composeRigidTransform(
    rootFrame,
    rotateRigidAxis('y', rootYaw)
  )
  const relativeTarget = composeRigidTransform(inverse(yawFrame), target)
  const direction = composeRigidTransform(
    { position: [0, 0, 0], rotation: relativeTarget.rotation },
    rigidFrame([0, 0, 1])
  ).position
  const totalPitch = Math.atan2(-direction[1], direction[2])
  const wristYaw = Math.atan2(
    direction[0],
    Math.hypot(direction[1], direction[2])
  )
  const horizontal =
    Math.hypot(localCentre[0], localCentre[2]) -
    shoulder.frame.position[2] -
    firstWristSpan * Math.cos(totalPitch)
  const down =
    -localCentre[1] +
    shoulder.frame.position[1] -
    firstWristSpan * Math.sin(totalPitch)
  const a = arm.upper.length,
    b = arm.forearm.length
  const cosine =
    (horizontal * horizontal + down * down - a * a - b * b) / (2 * a * b)
  if (cosine < -1 || cosine > 1)
    throw new Error('Unavailable basket placement reach')
  const elbowPitch = Math.acos(cosine)
  const rootPitch =
    Math.atan2(down, horizontal) -
    Math.atan2(b * Math.sin(elbowPitch), a + b * Math.cos(elbowPitch))
  const beforeRoll = composeRigidTransform(
    composeRigidTransform(yawFrame, rotateRigidAxis('x', totalPitch)),
    rotateRigidAxis('y', wristYaw)
  )
  const residual = composeRigidTransform(inverse(beforeRoll), target).rotation
  const roll = 2 * Math.atan2(residual[2], residual[3])
  const wristRoll = Math.atan2(Math.sin(roll), Math.cos(roll))
  const placement = readQuadrupedRobotPose(definition, {
    ...definition.presets.bilateralHarvest,
    lifts: {
      left: lift,
      right: definition.presets.bilateralHarvest.lifts.right
    },
    arms: definition.presets.bilateralHarvest.arms.map((item) =>
      item.side === 'left' && item.role === 'holder'
        ? {
            ...item,
            rootYaw,
            rootPitch,
            elbowPitch,
            wristPitch: totalPitch - rootPitch - elbowPitch,
            wristYaw,
            wristRoll
          }
        : item
    )
  })
  return freezeSource({
    travel: definition.presets.travel,
    bilateralHarvest: definition.presets.bilateralHarvest,
    basketPlacement: placement
  })
}
