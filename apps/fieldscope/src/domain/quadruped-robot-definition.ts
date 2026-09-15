import type { Point3 } from './greenhouse'
import type {
  WalkingEvidence,
  WalkingMassGeometry,
  WalkingLinkDefinition,
  WalkingRigidTransform
} from './walking-robot-definition'
import {
  classifyWalkingRobotDefinition,
  MAX_WALKING_BODY_WIDTH
} from './walking-robot-definition'
import { dyadic } from './scalar-arithmetic'
import {
  createSyntheticBasketPlatform,
  readBasketPlatform,
  type BasketPlatform
} from './basket-interface'

export const QUADRUPED_ROBOT_FORMAT = 'walking-robot-definition/3' as const
export const QUADRUPED_ROBOT_TOPOLOGY = 'four-arm-four-leg' as const
export const QUADRUPED_SOURCE_PROFILE = 'side-stage-articulation/1' as const
type Side = 'left' | 'right'
type Role = 'holder' | 'cutter'
type Station = 'front' | 'rear'
type Range = readonly [number, number]
const ARM_AXES = {
  rootYaw: 'y',
  rootPitch: 'x',
  elbowPitch: 'x',
  wristPitch: 'x',
  wristYaw: 'y',
  wristRoll: 'z'
} as const
const LEG_AXES = {
  hipAbduction: 'z',
  hipPitch: 'x',
  kneePitch: 'x',
  anklePitch: 'x'
} as const
type ArmJoint = keyof typeof ARM_AXES
type LegJoint = keyof typeof LEG_AXES
interface ArmDefinition {
  readonly side: Side
  readonly role: Role
  readonly mount: WalkingRigidTransform
  readonly upper: WalkingLinkDefinition
  readonly forearm: WalkingLinkDefinition
  readonly wrist: WalkingLinkDefinition
  readonly tool: WalkingMassGeometry & {
    readonly activePoint: Point3
    readonly functions: readonly (
      'foliage-opening' | 'fruit-retention' | 'cutting'
    )[]
  }
  readonly guard: WalkingMassGeometry
  readonly jointRanges: Readonly<Record<ArmJoint, Range>>
}
interface LegDefinition {
  readonly side: Side
  readonly station: Station
  readonly mount: WalkingRigidTransform
  readonly upper: WalkingLinkDefinition
  readonly lower: WalkingLinkDefinition
  readonly foot: WalkingMassGeometry
  readonly jointRanges: Readonly<Record<LegJoint, Range>>
}
interface ShoulderStage {
  readonly mount: WalkingRigidTransform
  readonly liftRange: Range
  readonly fixedHousing: WalkingMassGeometry
  readonly telescope: {
    readonly segmentCount: number
    readonly overlap: number
    readonly wall: number
    readonly clearance: number
  }
  readonly movingMassKg: number
  readonly movingLocalCoM: Point3
}
type ArmState = Readonly<
  { side: Side; role: Role; toolClosure: number } & Record<ArmJoint, number>
>
type LegState = Readonly<
  { side: Side; station: Station } & Record<LegJoint, number>
>
export interface QuadrupedRobotJointState {
  readonly definitionId: string
  readonly lifts: Readonly<Record<Side, number>>
  readonly arms: readonly ArmState[]
  readonly legs: readonly LegState[]
}
export interface QuadrupedRobotDefinition {
  readonly format: typeof QUADRUPED_ROBOT_FORMAT
  readonly topology: typeof QUADRUPED_ROBOT_TOPOLOGY
  readonly sourceProfile: typeof QUADRUPED_SOURCE_PROFILE
  readonly definitionId: string
  readonly evidence: WalkingEvidence
  readonly referenceBaseHeight: number
  readonly chassis: WalkingMassGeometry
  readonly platform: BasketPlatform
  readonly stages: Readonly<Record<Side, ShoulderStage>>
  readonly armAxes: typeof ARM_AXES
  readonly legAxes: typeof LEG_AXES
  readonly arms: readonly ArmDefinition[]
  readonly legs: readonly LegDefinition[]
  readonly presets: Readonly<
    Record<
      'travel' | 'bilateralHarvest' | 'basketPlacement',
      QuadrupedRobotJointState
    >
  >
}
export class QuadrupedDefinitionError extends Error {
  constructor(
    readonly reason:
      | 'unsupported-topology'
      | 'unsupported-version'
      | 'invalid-definition'
      | 'body-width-exceeded'
      | 'invalid-pose',
    readonly identity: Readonly<{
      format: unknown
      topology: unknown
      definitionId: unknown
    }> | null = null
  ) {
    super(reason)
  }
}
const admitted = new WeakSet<object>()
const invalid = (): never => {
  throw new QuadrupedDefinitionError('invalid-definition')
}
const invalidPose = (): never => {
  throw new QuadrupedDefinitionError('invalid-pose')
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const exact = (
  value: unknown,
  keys: string[]
): value is Record<string, unknown> =>
  record(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const positive = (value: unknown): value is number => finite(value) && value > 0
const point = (value: unknown): value is Point3 =>
  Array.isArray(value) && value.length === 3 && value.every(finite)
const identity = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0
const range = (value: unknown): value is Range =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every(finite) &&
  value[0] < value[1]
function evidence(value: unknown) {
  if (!record(value) || !identity(value.id)) return false
  if (value.kind === 'measured') return exact(value, ['kind', 'id'])
  return (
    exact(value, ['kind', 'id', 'label']) &&
    value.kind === 'synthetic' &&
    identity(value.label)
  )
}
function transform(value: unknown) {
  if (
    !exact(value, ['position', 'rotation']) ||
    !point(value.position) ||
    !Array.isArray(value.rotation) ||
    value.rotation.length !== 4 ||
    !value.rotation.every(finite)
  )
    return false
  return Math.abs(Math.hypot(...value.rotation) - 1) <= 1e-9
}
function massPart(value: unknown, extra: string[] = []) {
  return (
    exact(value, ['size', 'centre', 'massKg', 'localCoM', ...extra]) &&
    point(value.size) &&
    value.size.every(positive) &&
    point(value.centre) &&
    positive(value.massKg) &&
    point(value.localCoM)
  )
}
function link(value: unknown) {
  return (
    exact(value, ['length', 'section', 'massKg', 'localCoM']) &&
    positive(value.length) &&
    positive(value.section) &&
    positive(value.massKg) &&
    point(value.localCoM)
  )
}
function domains(value: unknown, axes: Record<string, string>) {
  return exact(value, Object.keys(axes)) && Object.values(value).every(range)
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
const chainKey = (value: { side: string; role?: string; station?: string }) =>
  value.side + '-' + (value.role ?? value.station)
function chains(
  value: unknown,
  expected: string[],
  valid: (item: Record<string, unknown>) => boolean
) {
  if (!Array.isArray(value) || value.length !== expected.length) return false
  const keys = new Set<string>()
  for (const item of value) {
    if (!record(item) || !valid(item)) return false
    const key = String(item.side) + '-' + String(item.role ?? item.station)
    if (!expected.includes(key) || keys.has(key)) return false
    keys.add(key)
  }
  return true
}
const ARM_CHAINS = [
  'left-holder',
  'left-cutter',
  'right-holder',
  'right-cutter'
]
const LEG_CHAINS = ['left-front', 'left-rear', 'right-front', 'right-rear']
function validArm(arm: Record<string, unknown>) {
  if (
    !exact(arm, [
      'side',
      'role',
      'mount',
      'upper',
      'forearm',
      'wrist',
      'tool',
      'guard',
      'jointRanges'
    ]) ||
    !transform(arm.mount) ||
    ![arm.upper, arm.forearm, arm.wrist].every(link) ||
    !massPart(arm.guard) ||
    !massPart(arm.tool, ['activePoint', 'functions']) ||
    !record(arm.tool) ||
    !point(arm.tool.activePoint) ||
    !domains(arm.jointRanges, ARM_AXES)
  )
    return false
  const functions =
    arm.role === 'holder' ? ['foliage-opening', 'fruit-retention'] : ['cutting']
  return (
    Array.isArray(arm.tool.functions) &&
    arm.tool.functions.length === functions.length &&
    new Set(arm.tool.functions).size === functions.length &&
    functions.every(
      (value) =>
        (arm.tool as Record<string, unknown>).functions instanceof Array &&
        ((arm.tool as Record<string, unknown>).functions as unknown[]).includes(
          value
        )
    )
  )
}
function validLeg(leg: Record<string, unknown>) {
  return (
    exact(leg, [
      'side',
      'station',
      'mount',
      'upper',
      'lower',
      'foot',
      'jointRanges'
    ]) &&
    transform(leg.mount) &&
    link(leg.upper) &&
    link(leg.lower) &&
    massPart(leg.foot) &&
    domains(leg.jointRanges, LEG_AXES)
  )
}
function validStage(stage: unknown) {
  return (
    exact(stage, [
      'mount',
      'liftRange',
      'fixedHousing',
      'movingMassKg',
      'movingLocalCoM',
      'telescope'
    ]) &&
    transform(stage.mount) &&
    range(stage.liftRange) &&
    stage.liftRange[0] >= 0 &&
    massPart(stage.fixedHousing) &&
    positive(stage.movingMassKg) &&
    point(stage.movingLocalCoM) &&
    exact(stage.telescope, ['segmentCount', 'overlap', 'wall', 'clearance']) &&
    Number.isInteger(stage.telescope.segmentCount) &&
    Number(stage.telescope.segmentCount) >= 2 &&
    Number(stage.telescope.segmentCount) <= 16 &&
    positive(stage.telescope.overlap) &&
    positive(stage.telescope.wall) &&
    positive(stage.telescope.clearance)
  )
}

/** Exact binary64 input-width comparison, with no rounded subtraction or resizing. */
function checkFixedWidth(parts: readonly WalkingMassGeometry[]) {
  const limit = dyadic(MAX_WALKING_BODY_WIDTH)
  const planes = parts.flatMap((part) => {
    const centre = dyadic(part.centre[0]),
      width = dyadic(part.size[0])
    const exponent = Math.min(centre.exponent, width.exponent - 1)
    const middle = centre.significand << BigInt(centre.exponent - exponent)
    const half = width.significand << BigInt(width.exponent - 1 - exponent)
    return [
      { n: middle - half, e: exponent },
      { n: middle + half, e: exponent }
    ]
  })
  const exponent = Math.min(limit.exponent, ...planes.map((value) => value.e))
  const values = planes.map((value) => value.n << BigInt(value.e - exponent))
  const low = values.reduce((a, b) => (a < b ? a : b))
  const high = values.reduce((a, b) => (a > b ? a : b))
  if (high - low > limit.significand << BigInt(limit.exponent - exponent)) {
    throw new QuadrupedDefinitionError('body-width-exceeded')
  }
}
function validatePose(definition: QuadrupedRobotDefinition, raw: unknown) {
  if (
    !exact(raw, ['definitionId', 'lifts', 'arms', 'legs']) ||
    raw.definitionId !== definition.definitionId ||
    !exact(raw.lifts, ['left', 'right'])
  )
    return invalidPose()
  for (const side of ['left', 'right'] as const) {
    const value = raw.lifts[side],
      domain = definition.stages[side].liftRange
    if (!finite(value) || value < domain[0] || value > domain[1])
      return invalidPose()
  }
  const validState = (
    item: Record<string, unknown>,
    fields: string[],
    definitions: readonly (ArmDefinition | LegDefinition)[]
  ) => {
    const owner = definitions.find(
      (chain) =>
        chainKey(chain) ===
        String(item.side) + '-' + String(item.role ?? item.station)
    )
    if (!owner || !exact(item, fields)) return false
    return Object.entries(owner.jointRanges).every(
      ([name, domain]) =>
        finite(item[name]) && item[name] >= domain[0] && item[name] <= domain[1]
    )
  }
  if (
    !chains(
      raw.arms,
      ARM_CHAINS,
      (item) =>
        validState(
          item,
          ['side', 'role', 'toolClosure', ...Object.keys(ARM_AXES)],
          definition.arms
        ) &&
        finite(item.toolClosure) &&
        item.toolClosure >= 0 &&
        item.toolClosure <= 1
    ) ||
    !chains(raw.legs, LEG_CHAINS, (item) =>
      validState(
        item,
        ['side', 'station', ...Object.keys(LEG_AXES)],
        definition.legs
      )
    )
  )
    return invalidPose()
  return raw as unknown as QuadrupedRobotJointState
}

/** New-version admission only; old saved identities never select a replacement. */
export function readQuadrupedRobotDefinition(
  raw: unknown
): QuadrupedRobotDefinition {
  if (record(raw) && admitted.has(raw))
    return raw as unknown as QuadrupedRobotDefinition
  if (!record(raw) || raw.format !== QUADRUPED_ROBOT_FORMAT) {
    let legacy = false
    if (record(raw)) {
      legacy =
        raw.format === 'walking-robot-definition/1' ||
        raw.format === 'walking-robot-definition/2' ||
        classifyWalkingRobotDefinition(raw) === 'legacy-unversioned'
    }
    const original = record(raw)
      ? {
          format: raw.format ?? null,
          topology: raw.topology ?? null,
          definitionId: raw.definitionId ?? null
        }
      : null
    throw new QuadrupedDefinitionError(
      legacy ? 'unsupported-topology' : 'unsupported-version',
      original
    )
  }
  if (
    !exact(raw, [
      'format',
      'topology',
      'sourceProfile',
      'definitionId',
      'evidence',
      'referenceBaseHeight',
      'chassis',
      'platform',
      'stages',
      'armAxes',
      'legAxes',
      'arms',
      'legs',
      'presets'
    ]) ||
    raw.topology !== QUADRUPED_ROBOT_TOPOLOGY ||
    raw.sourceProfile !== QUADRUPED_SOURCE_PROFILE ||
    !identity(raw.definitionId) ||
    !evidence(raw.evidence) ||
    !positive(raw.referenceBaseHeight) ||
    !massPart(raw.chassis) ||
    !exact(raw.stages, ['left', 'right']) ||
    !validStage(raw.stages.left) ||
    !validStage(raw.stages.right) ||
    !exact(raw.armAxes, Object.keys(ARM_AXES)) ||
    !Object.entries(ARM_AXES).every(
      ([key, value]) => (raw.armAxes as Record<string, unknown>)[key] === value
    ) ||
    !exact(raw.legAxes, Object.keys(LEG_AXES)) ||
    !Object.entries(LEG_AXES).every(
      ([key, value]) => (raw.legAxes as Record<string, unknown>)[key] === value
    ) ||
    !chains(raw.arms, ARM_CHAINS, validArm) ||
    !chains(raw.legs, LEG_CHAINS, validLeg) ||
    !exact(raw.presets, ['travel', 'bilateralHarvest', 'basketPlacement'])
  )
    return invalid()
  const definition = structuredClone(raw) as unknown as QuadrupedRobotDefinition
  readBasketPlatform(definition.platform)
  if (
    definition.stages.left.mount.position[0] >= 0 ||
    definition.stages.right.mount.position[0] <= 0
  )
    return invalid()
  checkFixedWidth([
    definition.chassis,
    ...definition.platform.fixedParts,
    definition.stages.left.fixedHousing,
    definition.stages.right.fixedHousing
  ])
  for (const pose of Object.values(definition.presets))
    validatePose(definition, pose)
  const travel = definition.presets.travel
  if (
    travel.lifts.left !== definition.stages.left.liftRange[0] ||
    travel.lifts.right !== definition.stages.right.liftRange[0] ||
    travel.arms.some((arm) => arm.role === 'cutter' && arm.toolClosure !== 1)
  )
    return invalid()
  freeze(definition)
  admitted.add(definition)
  return definition
}

/** Joint state validation; it does not issue FK, collision, support or action evidence. */
export function readQuadrupedRobotPose(
  definitionRaw: unknown,
  raw: unknown
): QuadrupedRobotJointState {
  const definition = readQuadrupedRobotDefinition(definitionRaw)
  return freeze(structuredClone(validatePose(definition, raw)))
}

export function createSyntheticQuadrupedRobotDefinition({
  definitionId = 'synthetic-quadruped-candidate'
}: { definitionId?: string } = {}): QuadrupedRobotDefinition {
  const part = (
    size: Point3,
    centre: Point3,
    massKg: number
  ): WalkingMassGeometry => ({ size, centre, massKg, localCoM: [0, 0, 0] })
  const mount = (position: Point3): WalkingRigidTransform => ({
    position,
    rotation: [0, 0, 0, 1]
  })
  const linkPart = (length: number, massKg: number): WalkingLinkDefinition => ({
    length,
    section: 0.035,
    massKg,
    localCoM: [0, 0, length / 2]
  })
  const stages = Object.fromEntries(
    (['left', 'right'] as const).map((side) => {
      const x = side === 'left' ? -0.363 : 0.363
      return [
        side,
        {
          mount: mount([x, 0.29, 0]),
          liftRange: [0, 1.32],
          fixedHousing: part([0.07, 0.24, 0.18], [x, 0.12, 0], 2),
          telescope: {
            segmentCount: 8,
            overlap: 0.04,
            wall: 0.002,
            clearance: 0.001
          },
          movingMassKg: 3,
          movingLocalCoM: [0, 0, 0]
        }
      ]
    })
  ) as unknown as QuadrupedRobotDefinition['stages']
  const arms: ArmDefinition[] = []
  const legs: LegDefinition[] = []
  for (const side of ['left', 'right'] as const) {
    for (const role of ['holder', 'cutter'] as const) {
      arms.push({
        side,
        role,
        mount: mount([
          side === 'left' ? -0.08 : 0.08,
          0.08,
          role === 'holder' ? -0.36 : 0.36
        ]),
        upper: linkPart(0.4, 1.1),
        forearm: linkPart(0.4, 0.8),
        wrist: linkPart(0.08, 0.3),
        tool: {
          ...part([0.08, 0.06, 0.12], [0, 0, 0.06], 0.35),
          activePoint: [0, 0, 0.1],
          functions:
            role === 'holder'
              ? ['foliage-opening', 'fruit-retention']
              : ['cutting']
        },
        guard: part([0.11, 0.08, 0.14], [0, 0, 0.06], 0.15),
        jointRanges: {
          rootYaw: [-Math.PI, Math.PI],
          rootPitch: [-Math.PI / 2, Math.PI / 2],
          elbowPitch: [-2.6, 2.6],
          wristPitch: [-Math.PI / 2, Math.PI / 2],
          wristYaw: [-Math.PI, Math.PI],
          wristRoll: [-Math.PI, Math.PI]
        }
      })
    }
    for (const station of ['front', 'rear'] as const) {
      legs.push({
        side,
        station,
        mount: mount([
          side === 'left' ? -0.335 : 0.335,
          0,
          station === 'front' ? 0.3 : -0.3
        ]),
        upper: linkPart(0.24, 1.1),
        lower: linkPart(0.27, 0.8),
        foot: part([0.12, 0.035, 0.16], [0, 0, 0], 0.3),
        jointRanges: {
          hipAbduction: [-0.8, 0.8],
          hipPitch: [-1.5, 1.5],
          kneePitch: [0, 2.7],
          anklePitch: [-1.5, 1.5]
        }
      })
    }
  }
  const stanceAngle = Math.acos((0.26 - 0.035 - 0.025) / (0.24 + 0.27))
  const pose = (
    left: number,
    right: number,
    rootPitch: number,
    cutterClosure = 1
  ): QuadrupedRobotJointState => ({
    definitionId,
    lifts: { left, right },
    arms: arms.map(({ side, role }) => ({
      side,
      role,
      toolClosure: role === 'cutter' ? cutterClosure : 1,
      rootYaw: rootPitch === 0 ? 0 : (Math.PI / 2) * (side === 'left' ? -1 : 1),
      rootPitch,
      elbowPitch: 2.6,
      wristPitch: -0.8,
      wristYaw: 0,
      wristRoll: 0
    })),
    legs: legs.map(({ side, station }) => ({
      side,
      station,
      hipAbduction: 0,
      hipPitch: -stanceAngle,
      kneePitch: 2 * stanceAngle,
      anklePitch: -stanceAngle
    }))
  })
  const basePlatform = createSyntheticBasketPlatform()
  const platform = {
    ...basePlatform,
    fixedParts: basePlatform.fixedParts.map((part, index) =>
      index === 0
        ? part
        : {
            ...part,
            centre: [
              index % 2 ? -0.18 : 0.18,
              part.centre[1],
              index % 2 ? -0.4 : 0.4
            ] as Point3
          }
    )
  }
  return readQuadrupedRobotDefinition({
    format: QUADRUPED_ROBOT_FORMAT,
    topology: QUADRUPED_ROBOT_TOPOLOGY,
    sourceProfile: QUADRUPED_SOURCE_PROFILE,
    definitionId,
    evidence: {
      kind: 'synthetic',
      id: 'quadruped-work-candidate',
      label: 'Synthetic work candidate - source and capability unverified'
    },
    referenceBaseHeight: 0.26,
    chassis: part([0.54, 0.18, 0.82], [0, 0.09, 0], 12),
    platform,
    stages,
    armAxes: ARM_AXES,
    legAxes: LEG_AXES,
    arms,
    legs,
    presets: {
      travel: pose(0, 0, 0),
      bilateralHarvest: pose(0.8, 1.1, 0.2, 0),
      basketPlacement: pose(0.4, 0.2, -0.3)
    }
  })
}
