import type { Point3 } from './greenhouse'
import { TriangleBuilder } from './mesh'
import {
  readSourcePatches,
  type SourcePatch,
  type SourceRegion
} from './source-occupancy'
import {
  isAdmittedWalkingRobotDefinition,
  type Quaternion4,
  type WalkingArmRole,
  type WalkingEvidence,
  type WalkingRobotDefinition,
  type WalkingRobotJointState,
  type WalkingRigidTransform,
  type WalkingSide
} from './walking-robot-definition'
import type {
  WalkingRobotPose,
  WalkingRobotPoseResult
} from './walking-robot-kinematics'
import { evaluateWalkingRobotPose } from './walking-robot-kinematics'

export interface WalkingRobotPart {
  readonly id: string
  readonly bodyId: string
  readonly size: Point3
  readonly localFrame: WalkingRigidTransform
  readonly shape: Readonly<{
    kind: 'triangles'
    positions: readonly number[]
    indices: readonly number[]
  }>
  readonly regions: readonly SourceRegion[]
  readonly patches: readonly SourcePatch[]
  readonly material: Readonly<{
    material: string
    evidence: WalkingEvidence
  }>
}
export interface WalkingPatchReference {
  readonly part: WalkingRobotPart
  readonly patch: SourcePatch
  readonly localFrame: WalkingRigidTransform
}
export interface WalkingRobotBody {
  readonly id: string
  readonly parentBodyId: string | null
  readonly attachment: 'root' | 'joint' | 'fixed'
  readonly fixedFrame?: WalkingRigidTransform
  readonly parts: readonly WalkingRobotPart[]
}
export interface WalkingRobotJoint {
  readonly id: string
  readonly parentBodyId: string
  readonly childBodyId: string
  readonly frame: WalkingRigidTransform
  readonly axis: 'x' | 'y' | 'z'
  readonly motion: 'revolute' | 'prismatic'
  readonly domain: readonly [number, number]
}
export interface WalkingRobotJointInterface {
  readonly jointId: string
  readonly frame: WalkingRigidTransform
  readonly axis: WalkingRobotJoint['axis']
  readonly domain: readonly [number, number]
  readonly parentPatches: readonly WalkingPatchReference[]
  readonly childPatches: readonly WalkingPatchReference[]
  readonly materialInterface: 'unmodeled'
}
export interface WalkingRobotMassProperties {
  readonly id: string
  readonly definition: WalkingRobotDefinition
  readonly evidence: WalkingEvidence
  readonly totalMassKg: number
  readonly bodies: readonly {
    readonly bodyId: string
    readonly massKg: number
    readonly localCoM: Point3
  }[]
}
export interface WalkingRobotSource {
  readonly id: string
  readonly revision: number
  readonly definition: WalkingRobotDefinition
  readonly parts: readonly WalkingRobotPart[]
  readonly massProperties: WalkingRobotMassProperties
  readonly rig: Readonly<{
    bodies: readonly WalkingRobotBody[]
    joints: readonly WalkingRobotJoint[]
    jointInterfaces: readonly WalkingRobotJointInterface[]
    armChains: readonly {
      id: string
      side: WalkingSide
      role: WalkingArmRole
      bodyIds: readonly string[]
      jointIds: readonly string[]
      toolBodyId: string
      guardBodyId: string
    }[]
    legChains: readonly {
      id: string
      side: WalkingSide
      station: 'front' | 'middle' | 'rear'
      bodyIds: readonly string[]
      jointIds: readonly string[]
      footBodyId: string
    }[]
    contacts: Readonly<{
      feet: readonly WalkingPatchReference[]
      supportTools: readonly WalkingPatchReference[]
      cuttingEdges: readonly WalkingPatchReference[]
    }>
    presets: Readonly<{
      stowed: WalkingRobotJointState
      leftWorking: WalkingRobotJointState
      rightWorking: WalkingRobotJointState
    }>
    inspectionHeadFrames: Readonly<{
      left: WalkingRigidTransform
      right: WalkingRigidTransform
    }>
  }>
}

const identityRotation: Quaternion4 = Object.freeze([0, 0, 0, 1])
const sourceMaterialEvidence: WalkingEvidence = deepFreeze({
  kind: 'synthetic',
  id: 'walking-source-materials-v1',
  label: 'Walking robot source materials - synthetic assumptions'
})
const point = (x: number, y: number, z: number): Point3 =>
  Object.freeze([x, y, z])
const frame = (
  position: Point3,
  rotation: Quaternion4 = identityRotation
): WalkingRigidTransform => Object.freeze({ position, rotation })
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
function weightedMass(
  entries: readonly { massKg: number; localCoM: Point3 }[]
) {
  const massKg = entries.reduce((sum, entry) => sum + entry.massKg, 0)
  return {
    massKg,
    localCoM: point(
      entries.reduce(
        (sum, entry) => sum + entry.localCoM[0] * entry.massKg,
        0
      ) / massKg,
      entries.reduce(
        (sum, entry) => sum + entry.localCoM[1] * entry.massKg,
        0
      ) / massKg,
      entries.reduce(
        (sum, entry) => sum + entry.localCoM[2] * entry.massKg,
        0
      ) / massKg
    )
  }
}

function buildWalkingRobotSource(
  definition: WalkingRobotDefinition,
  revision: number
): WalkingRobotSource {
  type BodyDraft = Omit<WalkingRobotBody, 'parts'> & {
    parts: WalkingRobotPart[]
  }
  const parts: WalkingRobotPart[] = []
  const bodies: BodyDraft[] = []
  const joints: WalkingRobotJoint[] = []
  const massBodies: { bodyId: string; massKg: number; localCoM: Point3 }[] = []
  const body = (
    id: string,
    parentBodyId: string | null,
    attachment: WalkingRobotBody['attachment'],
    massKg: number,
    localCoM: Point3,
    fixedFrame?: WalkingRigidTransform
  ) => {
    const draft: BodyDraft = {
      id,
      parentBodyId,
      attachment,
      ...(fixedFrame ? { fixedFrame } : {}),
      parts: []
    }
    bodies.push(draft)
    massBodies.push({ bodyId: id, massKg, localCoM })
    return draft
  }
  const addPart = (
    target: BodyDraft,
    id: string,
    size: Point3,
    localFrame: WalkingRigidTransform,
    material: string,
    patch?: { id: string; indexStart: number; indexCount: number }
  ) => {
    const builder = new TriangleBuilder()
    builder.box([0, 0, 0], size)
    const regions = builder.regions()
    const patches = readSourcePatches(
      patch
        ? [
            {
              id: patch.id,
              region: regions[0],
              ranges: [
                { indexStart: patch.indexStart, indexCount: patch.indexCount }
              ]
            }
          ]
        : [],
      regions,
      builder.indices.length
    )
    const source: WalkingRobotPart = deepFreeze({
      id,
      bodyId: target.id,
      size: [...size] as Point3,
      localFrame,
      shape: {
        kind: 'triangles' as const,
        positions: [...builder.positions],
        indices: [...builder.indices]
      },
      regions,
      patches,
      material: { material, evidence: sourceMaterialEvidence }
    })
    target.parts.push(source)
    parts.push(source)
    return source
  }
  const joint = (
    id: string,
    parentBodyId: string,
    childBodyId: string,
    jointFrame: WalkingRigidTransform,
    axis: WalkingRobotJoint['axis'],
    motion: WalkingRobotJoint['motion'],
    domain: readonly [number, number]
  ) => {
    const value = deepFreeze({
      id,
      parentBodyId,
      childBodyId,
      frame: jointFrame,
      axis,
      motion,
      domain: [...domain] as [number, number]
    })
    joints.push(value)
    return value
  }

  const fixedMasses = [
    definition.base.chassis,
    definition.base.mast,
    definition.base.emptyPayloadTray,
    definition.base.inspectionHeads.left,
    definition.base.inspectionHeads.right
  ]
  const baseMass = weightedMass(fixedMasses)
  const base = body('base', null, 'root', baseMass.massKg, baseMass.localCoM)
  addPart(
    base,
    'chassis',
    definition.base.chassis.size,
    frame(definition.base.chassis.centre),
    'synthetic-structural-shell'
  )
  addPart(
    base,
    'mast',
    definition.base.mast.size,
    frame(definition.base.mast.centre),
    'synthetic-structural-shell'
  )
  addPart(
    base,
    'empty-payload-tray',
    definition.base.emptyPayloadTray.size,
    frame(definition.base.emptyPayloadTray.centre),
    'synthetic-structural-shell'
  )
  addPart(
    base,
    'inspection-head-left',
    definition.base.inspectionHeads.left.size,
    frame(definition.base.inspectionHeads.left.centre),
    'synthetic-sensor-housing'
  )
  addPart(
    base,
    'inspection-head-right',
    definition.base.inspectionHeads.right.size,
    frame(definition.base.inspectionHeads.right.centre),
    'synthetic-sensor-housing'
  )
  const carriage = body(
    'carriage',
    'base',
    'joint',
    definition.carriage.massKg,
    definition.carriage.localCoM
  )
  addPart(
    carriage,
    'carriage',
    definition.carriage.size,
    frame(definition.carriage.centre),
    'synthetic-structural-shell'
  )
  joint(
    'carriage-lift',
    'base',
    'carriage',
    frame(point(0, 0, 0)),
    'y',
    'prismatic',
    definition.carriage.liftRange
  )

  const armChains: WalkingRobotSource['rig']['armChains'][number][] = []
  const supportTools: WalkingPatchReference[] = []
  const cuttingEdges: WalkingPatchReference[] = []
  for (const arm of definition.arms) {
    const chain = `${arm.side}-${arm.role}`
    const upperId = `${chain}-upper`,
      forearmId = `${chain}-forearm`
    const wristId = `${chain}-wrist`,
      toolId = `${chain}-tool`,
      guardId = `${chain}-guard`
    const upper = body(
      upperId,
      'carriage',
      'joint',
      arm.upper.massKg,
      arm.upper.localCoM
    )
    const forearm = body(
      forearmId,
      upperId,
      'joint',
      arm.forearm.massKg,
      arm.forearm.localCoM
    )
    const wrist = body(
      wristId,
      forearmId,
      'joint',
      arm.wrist.massKg,
      arm.wrist.localCoM
    )
    const toolBody = body(
      toolId,
      wristId,
      'joint',
      arm.tool.massKg,
      arm.tool.localCoM
    )
    const guardBody = body(
      guardId,
      toolId,
      'fixed',
      arm.guard.massKg,
      arm.guard.localCoM,
      frame(
        point(0, arm.tool.reach * 0.55, arm.role === 'cutter' ? 0.045 : -0.045)
      )
    )
    addPart(
      upper,
      upperId,
      point(arm.upper.section, arm.upper.length, arm.upper.section),
      frame(point(0, arm.upper.length / 2, 0)),
      'synthetic-link'
    )
    addPart(
      forearm,
      forearmId,
      point(arm.forearm.section, arm.forearm.length, arm.forearm.section),
      frame(point(0, arm.forearm.length / 2, 0)),
      'synthetic-link'
    )
    addPart(
      wrist,
      wristId,
      point(arm.wrist.section, arm.wrist.length, arm.wrist.section),
      frame(point(0, arm.wrist.length / 2, 0)),
      'synthetic-link'
    )
    const toolPart = addPart(
      toolBody,
      toolId,
      point(arm.tool.width, arm.tool.reach, arm.tool.height),
      frame(point(0, arm.tool.reach / 2, 0)),
      arm.role === 'support'
        ? 'synthetic-soft-textile'
        : 'synthetic-hardened-steel',
      {
        id: `${chain}-${arm.role === 'support' ? 'crop-support' : 'cutting-edge'}`,
        indexStart: 6,
        indexCount: 6
      }
    )
    addPart(
      guardBody,
      guardId,
      arm.guard.size,
      frame(point(0, 0, 0)),
      'synthetic-guard'
    )
    const reference = deepFreeze({
      part: toolPart,
      patch: toolPart.patches[0],
      localFrame: frame(point(0, arm.tool.reach / 2, arm.tool.height / 2))
    })
    ;(arm.role === 'support' ? supportTools : cuttingEdges).push(reference)
    const jointIds = [
      `${chain}-root-yaw`,
      `${chain}-shoulder-pitch`,
      `${chain}-elbow-pitch`,
      `${chain}-wrist-pitch`
    ]
    joint(
      jointIds[0],
      'carriage',
      upperId,
      arm.mount,
      'y',
      'revolute',
      arm.jointRanges.rootYaw
    )
    joint(
      jointIds[1],
      upperId,
      forearmId,
      frame(point(0, arm.upper.length, 0)),
      'x',
      'revolute',
      arm.jointRanges.shoulderPitch
    )
    joint(
      jointIds[2],
      forearmId,
      wristId,
      frame(point(0, arm.forearm.length, 0)),
      'x',
      'revolute',
      arm.jointRanges.elbowPitch
    )
    joint(
      jointIds[3],
      wristId,
      toolId,
      frame(point(0, arm.wrist.length, 0)),
      'x',
      'revolute',
      arm.jointRanges.wristPitch
    )
    armChains.push(
      deepFreeze({
        id: chain,
        side: arm.side,
        role: arm.role,
        bodyIds: [upperId, forearmId, wristId, toolId, guardId],
        jointIds,
        toolBodyId: toolId,
        guardBodyId: guardId
      })
    )
  }

  const legChains: WalkingRobotSource['rig']['legChains'][number][] = []
  const feet: WalkingPatchReference[] = []
  for (const leg of definition.legs) {
    const chain = `${leg.side}-${leg.station}`
    const coxaId = `${chain}-coxa`,
      upperId = `${chain}-upper`
    const lowerId = `${chain}-lower`,
      footId = `${chain}-foot`
    const side = leg.side === 'left' ? -1 : 1
    const coxa = body(
      coxaId,
      'base',
      'joint',
      leg.coxa.massKg,
      leg.coxa.localCoM
    )
    const upper = body(
      upperId,
      coxaId,
      'joint',
      leg.upper.massKg,
      leg.upper.localCoM
    )
    const lower = body(
      lowerId,
      upperId,
      'joint',
      leg.lower.massKg,
      leg.lower.localCoM
    )
    const foot = body(
      footId,
      lowerId,
      'fixed',
      leg.foot.massKg,
      leg.foot.localCoM,
      frame(point(0, -leg.lower.length, 0))
    )
    addPart(
      coxa,
      coxaId,
      point(leg.coxa.length, leg.coxa.section, leg.coxa.section),
      frame(point((side * leg.coxa.length) / 2, 0, 0)),
      'synthetic-link'
    )
    addPart(
      upper,
      upperId,
      point(leg.upper.section, leg.upper.length, leg.upper.section),
      frame(point(0, -leg.upper.length / 2, 0)),
      'synthetic-link'
    )
    addPart(
      lower,
      lowerId,
      point(leg.lower.section, leg.lower.length, leg.lower.section),
      frame(point(0, -leg.lower.length / 2, 0)),
      'synthetic-link'
    )
    const footPart = addPart(
      foot,
      footId,
      leg.foot.size,
      frame(point(0, -leg.foot.size[1] / 2, 0)),
      'synthetic-foot',
      { id: `${chain}-ground-contact`, indexStart: 30, indexCount: 6 }
    )
    feet.push(
      deepFreeze({
        part: footPart,
        patch: footPart.patches[0],
        localFrame: frame(
          point(0, -leg.foot.size[1], 0),
          Object.freeze([Math.SQRT1_2, 0, 0, Math.SQRT1_2])
        )
      })
    )
    const jointIds = [`${chain}-abduction`, `${chain}-hip`, `${chain}-knee`]
    joint(
      jointIds[0],
      'base',
      coxaId,
      leg.mount,
      'z',
      'revolute',
      leg.jointRanges.abduction
    )
    joint(
      jointIds[1],
      coxaId,
      upperId,
      frame(point(side * leg.coxa.length, 0, 0)),
      'x',
      'revolute',
      leg.jointRanges.hip
    )
    joint(
      jointIds[2],
      upperId,
      lowerId,
      frame(point(0, -leg.upper.length, 0)),
      'x',
      'revolute',
      leg.jointRanges.knee
    )
    legChains.push(
      deepFreeze({
        id: chain,
        side: leg.side,
        station: leg.station,
        bodyIds: [coxaId, upperId, lowerId, footId],
        jointIds,
        footBodyId: footId
      })
    )
  }
  const frozenBodies = bodies.map((entry) => deepFreeze(entry))
  const massProperties: WalkingRobotMassProperties = deepFreeze({
    id: `walking-robot-mass-${revision}-${definition.definitionId}`,
    definition,
    evidence: definition.massEvidence,
    totalMassKg: massBodies.reduce((sum, entry) => sum + entry.massKg, 0),
    bodies: massBodies
  })
  const jointInterfaces = joints.map((entry): WalkingRobotJointInterface =>
    deepFreeze({
      jointId: entry.id,
      frame: entry.frame,
      axis: entry.axis,
      domain: entry.domain,
      parentPatches: [],
      childPatches: [],
      materialInterface: 'unmodeled'
    })
  )
  return deepFreeze({
    id: `walking-robot-source-${revision}-${definition.definitionId}`,
    revision,
    definition,
    parts,
    massProperties,
    rig: {
      bodies: frozenBodies,
      joints,
      jointInterfaces,
      armChains,
      legChains,
      contacts: { feet, supportTools, cuttingEdges },
      presets: definition.presets,
      inspectionHeadFrames: {
        left: frame(definition.base.inspectionHeads.left.centre),
        right: frame(definition.base.inspectionHeads.right.centre)
      }
    }
  })
}

export class WalkingRobotSourceOwner {
  readonly work = { builds: 0 }
  private current: WalkingRobotSource | undefined
  private revision = 0

  prepare(definition: WalkingRobotDefinition) {
    if (!isAdmittedWalkingRobotDefinition(definition))
      throw new Error('Walking definition was not admitted')
    if (this.current?.definition === definition) return this.current
    this.work.builds++
    this.current = buildWalkingRobotSource(definition, ++this.revision)
    return this.current
  }
  read() {
    return this.current
  }
  isCurrent(source: WalkingRobotSource) {
    return this.current === source
  }
  evaluate(
    source: WalkingRobotSource,
    pose: WalkingRobotPose
  ): WalkingRobotPoseResult {
    if (!this.isCurrent(source)) throw new Error('Stale walking robot source')
    return evaluateWalkingRobotPose(source, pose)
  }
  clear() {
    this.current = undefined
  }
}
