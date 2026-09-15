import type { Point3 } from './greenhouse'
import type {
  Quaternion4,
  WalkingArmJointState,
  WalkingLegJointState,
  WalkingRobotJointState,
  WalkingRigidTransform
} from './walking-robot-definition'
import type {
  WalkingRobotJoint,
  WalkingPatchReference,
  WalkingRobotSource
} from './walking-robot-source'

export interface WalkingRobotPose {
  readonly base: WalkingRigidTransform
  readonly joints: WalkingRobotJointState
}
export interface WalkingRobotPoseResult {
  readonly source: WalkingRobotSource
  readonly pose: WalkingRobotPose
  readonly bodyTransforms: readonly {
    readonly id: string
    readonly transform: WalkingRigidTransform
    readonly sourceParts: WalkingRobotSource['parts']
  }[]
  readonly frames: Readonly<{
    armRoots: readonly {
      chainId: string
      position: Point3
      rotation: Quaternion4
    }[]
    tools: readonly {
      chainId: string
      position: Point3
      rotation: Quaternion4
    }[]
    feet: readonly {
      chainId: string
      position: Point3
      rotation: Quaternion4
    }[]
    contacts: Readonly<{
      feet: readonly {
        chainId: string
        position: Point3
        rotation: Quaternion4
        part: WalkingPatchReference['part']
        patch: WalkingPatchReference['patch']
      }[]
      supportTools: readonly {
        chainId: string
        position: Point3
        rotation: Quaternion4
        part: WalkingPatchReference['part']
        patch: WalkingPatchReference['patch']
      }[]
      cuttingEdges: readonly {
        chainId: string
        position: Point3
        rotation: Quaternion4
        part: WalkingPatchReference['part']
        patch: WalkingPatchReference['patch']
      }[]
    }>
    inspectionHeads: Readonly<{
      left: WalkingRigidTransform
      right: WalkingRigidTransform
    }>
  }>
  readonly linkSegments: readonly {
    readonly bodyId: string
    readonly from: Point3
    readonly to: Point3
    readonly length: number
  }[]
  readonly massProperties: Readonly<{
    source: WalkingRobotSource['massProperties']
    bodies: readonly { bodyId: string; massKg: number; position: Point3 }[]
  }>
  readonly work: Readonly<{ fk: 1; bodyTransforms: number }>
}

const invalid = (): never => {
  throw new Error('Invalid walking robot pose')
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const exact = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => key in value)
const finitePoint = (value: unknown): value is Point3 =>
  Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
const finiteQuaternion = (value: unknown): value is Quaternion4 =>
  Array.isArray(value) &&
  value.length === 4 &&
  value.every(Number.isFinite) &&
  Math.abs(Math.hypot(...value) - 1) <= 1e-9
const p = (x: number, y: number, z: number): Point3 => Object.freeze([x, y, z])
const q = (x: number, y: number, z: number, w: number): Quaternion4 =>
  Object.freeze([x, y, z, w])
function required<T>(value: T | undefined): T {
  if (value === undefined) return invalid()
  return value
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
function multiply(a: Quaternion4, b: Quaternion4): Quaternion4 {
  return q(
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
  )
}
function rotate(rotation: Quaternion4, value: Point3): Point3 {
  const [x, y, z, w] = rotation,
    tx = 2 * (y * value[2] - z * value[1]),
    ty = 2 * (z * value[0] - x * value[2]),
    tz = 2 * (x * value[1] - y * value[0])
  return p(
    value[0] + w * tx + y * tz - z * ty,
    value[1] + w * ty + z * tx - x * tz,
    value[2] + w * tz + x * ty - y * tx
  )
}
function compose(
  parent: WalkingRigidTransform,
  child: WalkingRigidTransform
): WalkingRigidTransform {
  const delta = rotate(parent.rotation, child.position)
  return freeze({
    position: p(
      parent.position[0] + delta[0],
      parent.position[1] + delta[1],
      parent.position[2] + delta[2]
    ),
    rotation: multiply(parent.rotation, child.rotation)
  })
}
function axisRotation(
  axis: WalkingRobotJoint['axis'],
  angle: number
): WalkingRigidTransform {
  const sine = Math.sin(angle / 2),
    cosine = Math.cos(angle / 2)
  let rotation: Quaternion4
  if (axis === 'x') rotation = q(sine, 0, 0, cosine)
  else if (axis === 'y') rotation = q(0, sine, 0, cosine)
  else rotation = q(0, 0, sine, cosine)
  return freeze({ position: p(0, 0, 0), rotation })
}
function translated(
  axis: WalkingRobotJoint['axis'],
  value: number
): WalkingRigidTransform {
  let position: Point3
  if (axis === 'x') position = p(value, 0, 0)
  else if (axis === 'y') position = p(0, value, 0)
  else position = p(0, 0, value)
  return freeze({ position, rotation: q(0, 0, 0, 1) })
}
const armId = (value: Pick<WalkingArmJointState, 'side' | 'role'>) =>
  `${value.side}-${value.role}`
const legId = (value: Pick<WalkingLegJointState, 'side' | 'station'>) =>
  `${value.side}-${value.station}`

function readPose(source: WalkingRobotSource, raw: unknown): WalkingRobotPose {
  let value: unknown
  try {
    value = structuredClone(raw)
  } catch {
    return invalid()
  }
  if (
    !record(value) ||
    !exact(value, ['base', 'joints']) ||
    !record(value.base) ||
    !exact(value.base, ['position', 'rotation']) ||
    !finitePoint(value.base.position) ||
    !finiteQuaternion(value.base.rotation) ||
    !record(value.joints) ||
    !exact(value.joints, ['carriage', 'arms', 'legs']) ||
    !Number.isFinite(value.joints.carriage) ||
    !Array.isArray(value.joints.arms) ||
    !Array.isArray(value.joints.legs)
  )
    return invalid()
  const definition = source.definition
  if (
    Number(value.joints.carriage) < definition.carriage.liftRange[0] ||
    Number(value.joints.carriage) > definition.carriage.liftRange[1] ||
    value.joints.arms.length !== 4 ||
    value.joints.legs.length !== 6
  )
    return invalid()
  const armIdentities = new Set<string>()
  for (const item of value.joints.arms) {
    if (
      !record(item) ||
      !exact(item, [
        'side',
        'role',
        'rootYaw',
        'shoulderPitch',
        'elbowPitch',
        'wristPitch'
      ])
    )
      return invalid()
    const spec = definition.arms.find(
        ({ side, role }) => side === item.side && role === item.role
      ),
      id = armId(item as unknown as WalkingArmJointState)
    if (
      !spec ||
      armIdentities.has(id) ||
      !(
        ['rootYaw', 'shoulderPitch', 'elbowPitch', 'wristPitch'] as const
      ).every((key) => {
        const n = item[key],
          limits = spec.jointRanges[key]
        return (
          Number.isFinite(n) && Number(n) >= limits[0] && Number(n) <= limits[1]
        )
      })
    )
      return invalid()
    armIdentities.add(id)
  }
  const legIdentities = new Set<string>()
  for (const item of value.joints.legs) {
    if (
      !record(item) ||
      !exact(item, ['side', 'station', 'abduction', 'hip', 'knee'])
    )
      return invalid()
    const spec = definition.legs.find(
        ({ side, station }) => side === item.side && station === item.station
      ),
      id = legId(item as unknown as WalkingLegJointState)
    if (
      !spec ||
      legIdentities.has(id) ||
      !(['abduction', 'hip', 'knee'] as const).every((key) => {
        const n = item[key],
          limits = spec.jointRanges[key]
        return (
          Number.isFinite(n) && Number(n) >= limits[0] && Number(n) <= limits[1]
        )
      })
    )
      return invalid()
    legIdentities.add(id)
  }
  return freeze(value) as unknown as WalkingRobotPose
}

export function evaluateArticulatedTransforms(
  bodies: WalkingRobotSource['rig']['bodies'],
  joints: readonly WalkingRobotJoint[],
  values: ReadonlyMap<string, number>,
  base: WalkingRigidTransform,
  collectFrameChain?: (
    bodyId: string,
    frames: readonly WalkingRigidTransform[]
  ) => void
): ReadonlyMap<string, WalkingRigidTransform> {
  const transforms = new Map<string, WalkingRigidTransform>([['base', base]])
  const chains = collectFrameChain
    ? new Map<string, readonly WalkingRigidTransform[]>([
        ['base', Object.freeze([base])]
      ])
    : undefined
  if (chains && collectFrameChain)
    collectFrameChain('base', required(chains.get('base')))
  const pending = new Set(
    bodies.filter(({ id }) => id !== 'base').map(({ id }) => id)
  )
  while (pending.size) {
    let advanced = false
    for (const bodyId of [...pending]) {
      const body = required(bodies.find(({ id }) => id === bodyId)),
        parent = body.parentBodyId
          ? transforms.get(body.parentBodyId)
          : undefined
      if (!parent) continue
      let relativeFrames: readonly WalkingRigidTransform[] | undefined
      if (body.attachment === 'fixed') {
        const fixedFrame = required(body.fixedFrame)
        transforms.set(body.id, compose(parent, fixedFrame))
        if (chains) relativeFrames = [fixedFrame]
      } else {
        const joint = required(
            joints.find(({ childBodyId }) => childBodyId === body.id)
          ),
          value = values.get(joint.id)
        if (value === undefined) return invalid()
        const jointFrame = joint.frame
        const motionFrame =
          joint.motion === 'prismatic'
            ? translated(joint.axis, value)
            : axisRotation(joint.axis, value)
        transforms.set(
          body.id,
          compose(compose(parent, jointFrame), motionFrame)
        )
        if (chains) relativeFrames = [motionFrame, jointFrame]
      }
      if (chains && collectFrameChain) {
        const chain = Object.freeze([
          ...required(relativeFrames),
          ...required(chains.get(required(body.parentBodyId ?? undefined)))
        ])
        chains.set(body.id, chain)
        collectFrameChain(body.id, chain)
      }
      pending.delete(bodyId)
      advanced = true
    }
    if (!advanced) return invalid()
  }
  return transforms
}

export { compose as composeRigidTransform, axisRotation as rotateRigidAxis }

export function evaluateWalkingRobotPose(
  source: WalkingRobotSource,
  rawPose: WalkingRobotPose
): WalkingRobotPoseResult {
  const pose = readPose(source, rawPose)
  const values = new Map<string, number>([
    ['carriage-lift', pose.joints.carriage]
  ])
  for (const arm of pose.joints.arms) {
    const id = armId(arm)
    values.set(`${id}-root-yaw`, arm.rootYaw)
    values.set(`${id}-shoulder-pitch`, arm.shoulderPitch)
    values.set(`${id}-elbow-pitch`, arm.elbowPitch)
    values.set(`${id}-wrist-pitch`, arm.wristPitch)
  }
  for (const leg of pose.joints.legs) {
    const id = legId(leg)
    values.set(`${id}-abduction`, leg.abduction)
    values.set(`${id}-hip`, leg.hip)
    values.set(`${id}-knee`, leg.knee)
  }
  const transforms = evaluateArticulatedTransforms(
    source.rig.bodies,
    source.rig.joints,
    values,
    pose.base
  )
  const worldPoint = (bodyId: string, local: Point3) =>
    compose(required(transforms.get(bodyId)), {
      position: local,
      rotation: q(0, 0, 0, 1)
    }).position
  const bodyTransforms = source.rig.bodies.map((body) => ({
    id: body.id,
    transform: required(transforms.get(body.id)),
    sourceParts: body.parts
  }))
  const armRoots = source.rig.armChains.map((chain) => ({
    chainId: chain.id,
    ...required(transforms.get(chain.bodyIds[0]))
  }))
  const tools = source.rig.armChains.map((chain) => {
    const spec = required(
      source.definition.arms.find(
        ({ side, role }) => side === chain.side && role === chain.role
      )
    )
    const transform = required(transforms.get(chain.toolBodyId))
    return {
      chainId: chain.id,
      position: worldPoint(chain.toolBodyId, p(0, spec.tool.reach, 0)),
      rotation: transform.rotation
    }
  })
  const feet = source.rig.legChains.map((chain) => {
    const spec = required(
      source.definition.legs.find(
        ({ side, station }) => side === chain.side && station === chain.station
      )
    )
    const transform = required(transforms.get(chain.footBodyId))
    return {
      chainId: chain.id,
      position: worldPoint(chain.footBodyId, p(0, -spec.foot.size[1], 0)),
      rotation: transform.rotation
    }
  })
  const contactFrame = (chainId: string, reference: WalkingPatchReference) => {
    const transform = compose(
      required(transforms.get(reference.part.bodyId)),
      reference.localFrame
    )
    return {
      chainId,
      position: transform.position,
      rotation: transform.rotation,
      part: reference.part,
      patch: reference.patch
    }
  }
  const footContacts = source.rig.legChains.map((chain) =>
    contactFrame(
      chain.id,
      required(
        source.rig.contacts.feet.find(
          ({ part }) => part.bodyId === chain.footBodyId
        )
      )
    )
  )
  const supportToolContacts = source.rig.armChains
    .filter(({ role }) => role === 'support')
    .map((chain) =>
      contactFrame(
        chain.id,
        required(
          source.rig.contacts.supportTools.find(
            ({ part }) => part.bodyId === chain.toolBodyId
          )
        )
      )
    )
  const cuttingEdgeContacts = source.rig.armChains
    .filter(({ role }) => role === 'cutter')
    .map((chain) =>
      contactFrame(
        chain.id,
        required(
          source.rig.contacts.cuttingEdges.find(
            ({ part }) => part.bodyId === chain.toolBodyId
          )
        )
      )
    )
  const linkSegments: WalkingRobotPoseResult['linkSegments'][number][] = []
  for (const chain of source.rig.armChains) {
    const spec = required(
      source.definition.arms.find(
        ({ side, role }) => side === chain.side && role === chain.role
      )
    )
    for (const [bodyId, length] of [
      [chain.bodyIds[0], spec.upper.length],
      [chain.bodyIds[1], spec.forearm.length],
      [chain.bodyIds[2], spec.wrist.length],
      [chain.bodyIds[3], spec.tool.reach]
    ] as const)
      linkSegments.push({
        bodyId,
        from: worldPoint(bodyId, p(0, 0, 0)),
        to: worldPoint(bodyId, p(0, length, 0)),
        length
      })
  }
  for (const chain of source.rig.legChains) {
    const spec = required(
      source.definition.legs.find(
        ({ side, station }) => side === chain.side && station === chain.station
      )
    )
    const side = chain.side === 'left' ? -1 : 1
    linkSegments.push({
      bodyId: chain.bodyIds[0],
      from: worldPoint(chain.bodyIds[0], p(0, 0, 0)),
      to: worldPoint(chain.bodyIds[0], p(side * spec.coxa.length, 0, 0)),
      length: spec.coxa.length
    })
    for (const [bodyId, length] of [
      [chain.bodyIds[1], spec.upper.length],
      [chain.bodyIds[2], spec.lower.length]
    ] as const)
      linkSegments.push({
        bodyId,
        from: worldPoint(bodyId, p(0, 0, 0)),
        to: worldPoint(bodyId, p(0, -length, 0)),
        length
      })
  }
  const inspectionHeads = {
    left: compose(pose.base, source.rig.inspectionHeadFrames.left),
    right: compose(pose.base, source.rig.inspectionHeadFrames.right)
  }
  const massBodies = source.massProperties.bodies.map((mass) => ({
    bodyId: mass.bodyId,
    massKg: mass.massKg,
    position: worldPoint(mass.bodyId, mass.localCoM)
  }))
  return freeze({
    source,
    pose,
    bodyTransforms,
    frames: {
      armRoots,
      tools,
      feet,
      contacts: {
        feet: footContacts,
        supportTools: supportToolContacts,
        cuttingEdges: cuttingEdgeContacts
      },
      inspectionHeads
    },
    linkSegments,
    massProperties: { source: source.massProperties, bodies: massBodies },
    work: { fk: 1 as const, bodyTransforms: bodyTransforms.length }
  })
}
