import type { Point3 } from './greenhouse'
import { dyadic, roundFraction } from './scalar-arithmetic'

export const WALKING_ROBOT_FORMAT = 'walking-robot-definition/2' as const
export const WALKING_ROBOT_TOPOLOGY = 'four-arm-six-leg' as const
export const MAX_WALKING_BODY_WIDTH = 0.8

export class WalkingActionDefinitionError extends Error {
  constructor(
    readonly reason:
      'legacy-topology' | 'unsupported-definition' | 'body-width-exceeded'
  ) {
    super(reason)
  }
}

export type WalkingEvidence =
  | { readonly kind: 'measured'; readonly id: string }
  | { readonly kind: 'synthetic'; readonly id: string; readonly label: string }
export type WalkingSide = 'left' | 'right'
export type WalkingArmRole = 'support' | 'cutter'
export type WalkingLegStation = 'front' | 'middle' | 'rear'
export type Quaternion4 = readonly [number, number, number, number]
export interface WalkingRigidTransform {
  readonly position: Point3
  readonly rotation: Quaternion4
}
export interface WalkingMassGeometry {
  readonly size: Point3
  readonly centre: Point3
  readonly massKg: number
  readonly localCoM: Point3
}
export interface WalkingLinkDefinition {
  readonly length: number
  readonly section: number
  readonly massKg: number
  readonly localCoM: Point3
}
export interface WalkingToolDefinition {
  readonly reach: number
  readonly width: number
  readonly height: number
  readonly massKg: number
  readonly localCoM: Point3
}
export interface WalkingGuardDefinition {
  readonly size: Point3
  readonly massKg: number
  readonly localCoM: Point3
}
export interface WalkingArmDefinition {
  readonly side: WalkingSide
  readonly role: WalkingArmRole
  readonly mount: WalkingRigidTransform
  readonly upper: WalkingLinkDefinition
  readonly forearm: WalkingLinkDefinition
  readonly wrist: WalkingLinkDefinition
  readonly tool: WalkingToolDefinition
  readonly guard: WalkingGuardDefinition
  readonly jointRanges: Readonly<{
    rootYaw: readonly [number, number]
    shoulderPitch: readonly [number, number]
    elbowPitch: readonly [number, number]
    wristPitch: readonly [number, number]
  }>
}
export interface WalkingLegDefinition {
  readonly side: WalkingSide
  readonly station: WalkingLegStation
  readonly mount: WalkingRigidTransform
  readonly coxa: WalkingLinkDefinition
  readonly upper: WalkingLinkDefinition
  readonly lower: WalkingLinkDefinition
  readonly foot: Readonly<{
    size: Point3
    massKg: number
    localCoM: Point3
  }>
  readonly jointRanges: Readonly<{
    abduction: readonly [number, number]
    hip: readonly [number, number]
    knee: readonly [number, number]
  }>
}
export interface WalkingArmJointState {
  readonly side: WalkingSide
  readonly role: WalkingArmRole
  readonly rootYaw: number
  readonly shoulderPitch: number
  readonly elbowPitch: number
  readonly wristPitch: number
}
export interface WalkingLegJointState {
  readonly side: WalkingSide
  readonly station: WalkingLegStation
  readonly abduction: number
  readonly hip: number
  readonly knee: number
}
export interface WalkingRobotJointState {
  readonly carriage: number
  readonly arms: readonly WalkingArmJointState[]
  readonly legs: readonly WalkingLegJointState[]
}
export interface WalkingRobotDefinition {
  readonly format: typeof WALKING_ROBOT_FORMAT
  readonly topology: typeof WALKING_ROBOT_TOPOLOGY
  readonly definitionId: string
  readonly geometryEvidence: WalkingEvidence
  readonly jointEvidence: WalkingEvidence
  readonly massEvidence: WalkingEvidence
  readonly sourceModel: Readonly<{
    kind: 'solid-articulation/1' | 'solid-articulation/2'
    evidence: WalkingEvidence
    pinRadiusRatio: number
    sleeveInnerRadiusRatio: number
    sleeveOuterRadiusRatio: number
    axialGapRatio: number
    linkSetbackRatio: number
  }>
  readonly base: Readonly<{
    chassis: WalkingMassGeometry
    mast: WalkingMassGeometry
    emptyPayloadTray: WalkingMassGeometry
    inspectionHeads: Readonly<{
      left: WalkingMassGeometry
      right: WalkingMassGeometry
    }>
  }>
  readonly carriage: WalkingMassGeometry & {
    readonly liftRange: readonly [number, number]
  }
  readonly arms: readonly WalkingArmDefinition[]
  readonly legs: readonly WalkingLegDefinition[]
  readonly presets: Readonly<{
    stowed: WalkingRobotJointState
    leftWorking: WalkingRobotJointState
    rightWorking: WalkingRobotJointState
  }>
}

const admitted = new WeakSet<object>()
const invalid = (): never => {
  throw new Error('Invalid walking robot definition')
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const exact = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actual = Object.keys(value)
  return actual.length === keys.length && keys.every((key) => key in value)
}
const identity = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0
const point = (value: unknown): value is Point3 =>
  Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
const positive = (value: unknown) => Number.isFinite(value) && Number(value) > 0
const range = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every(Number.isFinite) &&
  value[0] < value[1]
const quaternion = (
  value: unknown
): value is [number, number, number, number] => {
  if (
    !Array.isArray(value) ||
    value.length !== 4 ||
    !value.every(Number.isFinite)
  )
    return false
  const norm = Math.hypot(...value)
  return norm > 0 && Math.abs(norm - 1) <= 1e-9
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
function evidence(value: unknown) {
  if (!record(value) || !identity(value.id)) return false
  return value.kind === 'measured'
    ? exact(value, ['kind', 'id'])
    : value.kind === 'synthetic' &&
        exact(value, ['kind', 'id', 'label']) &&
        identity(value.label)
}
function transform(value: unknown) {
  return (
    record(value) &&
    exact(value, ['position', 'rotation']) &&
    point(value.position) &&
    quaternion(value.rotation)
  )
}
function massGeometry(value: unknown) {
  return (
    record(value) &&
    exact(value, ['size', 'centre', 'massKg', 'localCoM']) &&
    point(value.size) &&
    value.size.every(positive) &&
    point(value.centre) &&
    positive(value.massKg) &&
    point(value.localCoM)
  )
}
function link(value: unknown) {
  return (
    record(value) &&
    exact(value, ['length', 'section', 'massKg', 'localCoM']) &&
    positive(value.length) &&
    positive(value.section) &&
    positive(value.massKg) &&
    point(value.localCoM)
  )
}
function tool(value: unknown) {
  return (
    record(value) &&
    exact(value, ['reach', 'width', 'height', 'massKg', 'localCoM']) &&
    positive(value.reach) &&
    positive(value.width) &&
    positive(value.height) &&
    positive(value.massKg) &&
    point(value.localCoM)
  )
}
function guard(value: unknown) {
  return (
    record(value) &&
    exact(value, ['size', 'massKg', 'localCoM']) &&
    point(value.size) &&
    value.size.every(positive) &&
    positive(value.massKg) &&
    point(value.localCoM)
  )
}
function exactSet<T extends Record<string, unknown>>(
  values: unknown,
  keys: readonly string[],
  expected: readonly string[],
  validator: (value: T) => boolean
) {
  if (!Array.isArray(values) || values.length !== expected.length) return false
  const actual = new Set<string>()
  for (const item of values) {
    if (!record(item) || !validator(item as T)) return false
    const id = keys.map((key) => String(item[key])).join('-')
    if (actual.has(id)) return false
    actual.add(id)
  }
  return expected.every((id) => actual.has(id))
}
const armIds = ['left-support', 'left-cutter', 'right-support', 'right-cutter']
const legIds = [
  'left-front',
  'left-middle',
  'left-rear',
  'right-front',
  'right-middle',
  'right-rear'
]
function arm(value: Record<string, unknown>) {
  const ranges = value.jointRanges
  return (
    exact(value, [
      'side',
      'role',
      'mount',
      'upper',
      'forearm',
      'wrist',
      'tool',
      'guard',
      'jointRanges'
    ]) &&
    ['left', 'right'].includes(String(value.side)) &&
    ['support', 'cutter'].includes(String(value.role)) &&
    transform(value.mount) &&
    link(value.upper) &&
    link(value.forearm) &&
    link(value.wrist) &&
    tool(value.tool) &&
    guard(value.guard) &&
    record(ranges) &&
    exact(ranges, ['rootYaw', 'shoulderPitch', 'elbowPitch', 'wristPitch']) &&
    range(ranges.rootYaw) &&
    range(ranges.shoulderPitch) &&
    range(ranges.elbowPitch) &&
    range(ranges.wristPitch)
  )
}
function leg(value: Record<string, unknown>) {
  const ranges = value.jointRanges
  const foot = value.foot
  return (
    exact(value, [
      'side',
      'station',
      'mount',
      'coxa',
      'upper',
      'lower',
      'foot',
      'jointRanges'
    ]) &&
    ['left', 'right'].includes(String(value.side)) &&
    ['front', 'middle', 'rear'].includes(String(value.station)) &&
    transform(value.mount) &&
    link(value.coxa) &&
    link(value.upper) &&
    link(value.lower) &&
    record(foot) &&
    exact(foot, ['size', 'massKg', 'localCoM']) &&
    point(foot.size) &&
    foot.size.every(positive) &&
    positive(foot.massKg) &&
    point(foot.localCoM) &&
    record(ranges) &&
    exact(ranges, ['abduction', 'hip', 'knee']) &&
    range(ranges.abduction) &&
    range(ranges.hip) &&
    range(ranges.knee)
  )
}
function jointState(value: unknown, definition: Record<string, unknown>) {
  if (!record(value) || !exact(value, ['carriage', 'arms', 'legs']))
    return false
  const carriage = definition.carriage as Record<string, unknown>
  const arms = definition.arms as WalkingArmDefinition[]
  const legs = definition.legs as WalkingLegDefinition[]
  const lift = carriage.liftRange as [number, number]
  if (
    !Number.isFinite(value.carriage) ||
    Number(value.carriage) < lift[0] ||
    Number(value.carriage) > lift[1]
  )
    return false
  const validArms = exactSet<Record<string, unknown>>(
    value.arms,
    ['side', 'role'],
    armIds,
    (item) => {
      if (
        !exact(item, [
          'side',
          'role',
          'rootYaw',
          'shoulderPitch',
          'elbowPitch',
          'wristPitch'
        ])
      )
        return false
      const spec = arms.find(
        ({ side, role }) => side === item.side && role === item.role
      )
      return (
        !!spec &&
        (
          ['rootYaw', 'shoulderPitch', 'elbowPitch', 'wristPitch'] as const
        ).every((key) => {
          const n = item[key]
          const bounds = spec.jointRanges[key]
          return (
            Number.isFinite(n) &&
            Number(n) >= bounds[0] &&
            Number(n) <= bounds[1]
          )
        })
      )
    }
  )
  const validLegs = exactSet<Record<string, unknown>>(
    value.legs,
    ['side', 'station'],
    legIds,
    (item) => {
      if (!exact(item, ['side', 'station', 'abduction', 'hip', 'knee']))
        return false
      const spec = legs.find(
        ({ side, station }) => side === item.side && station === item.station
      )
      return (
        !!spec &&
        (['abduction', 'hip', 'knee'] as const).every((key) => {
          const n = item[key]
          const bounds = spec.jointRanges[key]
          return (
            Number.isFinite(n) &&
            Number(n) >= bounds[0] &&
            Number(n) <= bounds[1]
          )
        })
      )
    }
  )
  return validArms && validLegs
}

export function classifyWalkingRobotDefinition(
  raw: unknown
): 'walking-v2' | 'walking-v1' | 'legacy-unversioned' | 'unsupported-version' {
  if (record(raw) && raw.format === WALKING_ROBOT_FORMAT) {
    try {
      readWalkingRobotDefinition(raw)
      return 'walking-v2'
    } catch {
      return 'unsupported-version'
    }
  }
  if (record(raw) && raw.format === 'walking-robot-definition/1') {
    try {
      validateWalkingDefinition(raw, 'walking-robot-definition/1')
      return 'walking-v1'
    } catch {
      return 'unsupported-version'
    }
  }
  if (!record(raw) || 'format' in raw) return 'unsupported-version'
  const numericKeys = [
    'width',
    'length',
    'height',
    'clearance',
    'canopyReserve',
    'start',
    'end',
    'patrolMinutes',
    'payloadLimit',
    'payload',
    'nominalWh',
    'usableFraction',
    'soc',
    'socUncertainty',
    'nextWorkWh',
    'returnWh',
    'contingencyWh',
    'reserveWh',
    'dockX',
    'dockZ'
  ] as const
  if (
    !exact(raw, [...numericKeys, 'tool', 'scanSide', 'lane', 'survey']) ||
    !numericKeys.every((key) => Number.isFinite(raw[key])) ||
    !['cucumber', 'tomato'].includes(String(raw.tool)) ||
    !['left', 'right', 'both'].includes(String(raw.scanSide)) ||
    !record(raw.lane) ||
    !record(raw.survey)
  )
    return 'unsupported-version'
  const positiveKeys = [
      'width',
      'length',
      'height',
      'patrolMinutes',
      'payloadLimit',
      'nominalWh',
      'usableFraction',
      'reserveWh'
    ] as const,
    fractionKeys = ['usableFraction', 'soc', 'socUncertainty'] as const
  if (
    numericKeys.some(
      (key) => key !== 'dockX' && key !== 'dockZ' && Number(raw[key]) < 0
    ) ||
    positiveKeys.some((key) => Number(raw[key]) <= 0) ||
    fractionKeys.some((key) => Number(raw[key]) > 1) ||
    Number(raw.width) < 0.35 ||
    Number(raw.width) > 2 ||
    Number(raw.length) < 0.6 ||
    Number(raw.length) > 3 ||
    Number(raw.height) < 0.8 ||
    Number(raw.height) > 3 ||
    Number(raw.start) >= Number(raw.end)
  )
    return 'unsupported-version'
  const lane = raw.lane
  if (
    (lane.kind === 'strip' &&
      (!exact(lane, ['kind', 'bay', 'stripId']) ||
        !Number.isInteger(lane.bay) ||
        Number(lane.bay) < 0 ||
        Number(lane.bay) > 3 ||
        typeof lane.stripId !== 'string' ||
        !lane.stripId.trim())) ||
    (lane.kind === 'shared' &&
      (!exact(lane, ['kind', 'boundary', 'side']) ||
        !Number.isInteger(lane.boundary) ||
        Number(lane.boundary) < 1 ||
        Number(lane.boundary) > 3 ||
        !['left', 'right'].includes(String(lane.side)))) ||
    !['strip', 'shared'].includes(String(lane.kind))
  )
    return 'unsupported-version'
  const survey = raw.survey,
    surveyKeys = [
      'entranceWidth',
      'entranceHeight',
      'frontHeadland',
      'rearHeadland'
    ] as const
  if (
    !exact(survey, ['ground', ...surveyKeys]) ||
    !['unknown', 'prepared', 'soft'].includes(String(survey.ground)) ||
    !surveyKeys.every(
      (key) =>
        survey[key] === null ||
        (Number.isFinite(survey[key]) && Number(survey[key]) >= 0)
    )
  )
    return 'unsupported-version'
  return 'legacy-unversioned'
}

function validateWalkingDefinition(raw: unknown, format: string) {
  let value: unknown
  try {
    value = structuredClone(raw)
  } catch {
    return invalid()
  }
  if (
    !record(value) ||
    !exact(value, [
      'format',
      'topology',
      'definitionId',
      'geometryEvidence',
      'jointEvidence',
      'massEvidence',
      ...(format === WALKING_ROBOT_FORMAT ? ['sourceModel'] : []),
      'base',
      'carriage',
      'arms',
      'legs',
      'presets'
    ]) ||
    value.format !== format ||
    value.topology !== WALKING_ROBOT_TOPOLOGY ||
    !identity(value.definitionId) ||
    !evidence(value.geometryEvidence) ||
    !evidence(value.jointEvidence) ||
    !evidence(value.massEvidence)
  )
    return invalid()
  const base = value.base
  const carriage = value.carriage
  if (
    !record(base) ||
    !exact(base, ['chassis', 'mast', 'emptyPayloadTray', 'inspectionHeads']) ||
    !massGeometry(base.chassis) ||
    !massGeometry(base.mast) ||
    !massGeometry(base.emptyPayloadTray) ||
    !record(base.inspectionHeads) ||
    !exact(base.inspectionHeads, ['left', 'right']) ||
    !massGeometry(base.inspectionHeads.left) ||
    !massGeometry(base.inspectionHeads.right) ||
    !record(carriage) ||
    !exact(carriage, ['size', 'centre', 'massKg', 'localCoM', 'liftRange']) ||
    !point(carriage.size) ||
    !carriage.size.every(positive) ||
    !point(carriage.centre) ||
    !positive(carriage.massKg) ||
    !point(carriage.localCoM) ||
    !range(carriage.liftRange) ||
    !exactSet(value.arms, ['side', 'role'], armIds, arm) ||
    !exactSet(value.legs, ['side', 'station'], legIds, leg) ||
    !record(value.presets) ||
    !exact(value.presets, ['stowed', 'leftWorking', 'rightWorking']) ||
    !Object.values(value.presets).every((preset) => jointState(preset, value))
  )
    return invalid()
  return value
}

function validSourceModel(value: WalkingRobotDefinition) {
  const model: unknown = value.sourceModel
  const keys = [
    'pinRadiusRatio',
    'sleeveInnerRadiusRatio',
    'sleeveOuterRadiusRatio',
    'axialGapRatio',
    'linkSetbackRatio'
  ] as const
  if (
    !record(model) ||
    !exact(model, ['kind', 'evidence', ...keys]) ||
    (model.kind !== 'solid-articulation/1' &&
      model.kind !== 'solid-articulation/2') ||
    !evidence(model.evidence) ||
    !keys.every((key) => positive(model[key]))
  )
    return false
  const [pin, inner, outer, gap, setback] = keys.map((key) =>
    Number(model[key])
  )
  if (!(
    pin < inner &&
    inner < outer &&
    inner + gap <= outer &&
    outer <= 0.5 &&
    gap < 0.25 &&
    setback >= outer
  ))
    return false
  const links = [
    ...value.arms.flatMap(({ upper, forearm, wrist }) => [
      upper,
      forearm,
      wrist
    ]),
    ...value.legs.flatMap(({ coxa, upper, lower }) => [coxa, upper, lower])
  ]
  if (!links.every(({ length, section }) => length > 2 * setback * section))
    return false
  if (
    !value.legs.every(
      ({ coxa, upper }) =>
        coxa.length >
        coxa.section * setback +
          Math.max(coxa.section * setback, upper.section * (0.5 + gap))
    )
  )
    return false
  const { mast, chassis } = value.base,
    carriage = value.carriage
  const railBottom = mast.centre[1] - mast.size[1] / 2
  const railTop = mast.centre[1] + mast.size[1] / 2
  if (
    railBottom >
      carriage.liftRange[0] + carriage.centre[1] - carriage.size[1] / 2 ||
    railTop < carriage.liftRange[1] + carriage.centre[1] + carriage.size[1] / 2
  )
    return false
  const railOuter = carriage.size[2] / 2 + mast.size[2] / 2
  return (
    mast.centre[2] === carriage.centre[2] &&
    Math.abs(carriage.centre[2] - chassis.centre[2]) + railOuter <=
      chassis.size[2] / 2 &&
    Math.abs(mast.centre[0] - carriage.centre[0]) <
      (mast.size[0] + carriage.size[0]) / 2
  )
}

export function readWalkingRobotDefinition(
  raw: unknown
): WalkingRobotDefinition {
  if (record(raw) && admitted.has(raw))
    return raw as unknown as WalkingRobotDefinition
  const value = validateWalkingDefinition(raw, WALKING_ROBOT_FORMAT)
  const result = value as unknown as WalkingRobotDefinition
  if (!validSourceModel(result)) return invalid()
  deepFreeze(result)
  admitted.add(result)
  return result
}

export function isAdmittedWalkingRobotDefinition(
  value: unknown
): value is WalkingRobotDefinition {
  return record(value) && admitted.has(value)
}

/** Schema check only; current source material completes body-width admission. */
export function readActiveWalkingRobotDefinition(
  raw: unknown
): WalkingRobotDefinition {
  if (!record(raw) || raw.format !== WALKING_ROBOT_FORMAT) {
    const kind = classifyWalkingRobotDefinition(raw)
    throw new WalkingActionDefinitionError(
      kind === 'walking-v1' || kind === 'legacy-unversioned'
        ? 'legacy-topology'
        : 'unsupported-definition'
    )
  }
  const definition = readWalkingRobotDefinition(raw)
  const { chassis, mast, emptyPayloadTray, inspectionHeads } = definition.base
  const fixed = [
    chassis,
    mast,
    emptyPayloadTray,
    inspectionHeads.left,
    inspectionHeads.right
  ]
  const scalar = (value: number) => {
    const d = dyadic(value)
    return { n: d.significand, e: d.exponent }
  }
  const planes = fixed.flatMap((part) => {
    const centre = scalar(part.centre[0]),
      half = scalar(part.size[0])
    half.e--
    const e = Math.min(centre.e, half.e)
    const c = centre.n << BigInt(centre.e - e),
      h = half.n << BigInt(half.e - e)
    return [
      { n: c - h, e },
      { n: c + h, e }
    ]
  })
  const limit = scalar(MAX_WALKING_BODY_WIDTH)
  const exponent = Math.min(limit.e, ...planes.map((p) => p.e))
  const values = planes.map((p) => p.n << BigInt(p.e - exponent))
  const low = values.reduce((a, b) => (a < b ? a : b)),
    high = values.reduce((a, b) => (a > b ? a : b))
  if (high - low > limit.n << BigInt(limit.e - exponent))
    throw new WalkingActionDefinitionError('body-width-exceeded')
  return definition
}

const p = (x: number, y: number, z: number): [number, number, number] => [
  x,
  y,
  z
]
const q = (): [number, number, number, number] => [0, 0, 0, 1]
const massGeometryValue = (size: Point3, centre: Point3, massKg: number) => ({
  size,
  centre,
  massKg,
  localCoM: [...centre] as Point3
})
const linkValue = (
  length: number,
  section: number,
  massKg: number,
  axis: Point3
) => ({
  length,
  section,
  massKg,
  localCoM: axis.map(
    (component) => (component * length) / 2
  ) as unknown as Point3
})

export function createSyntheticWalkingRobotDefinition({
  definitionId,
  sourceProfile = 'solid-articulation/1'
}: {
  definitionId: string
  sourceProfile?: WalkingRobotDefinition['sourceModel']['kind']
}): WalkingRobotDefinition {
  const armRange = {
    rootYaw: [-Math.PI / 3, Math.PI / 3],
    shoulderPitch: [-Math.PI / 2, Math.PI / 2],
    elbowPitch: [0, (2 * Math.PI) / 3],
    wristPitch: [-Math.PI / 2, Math.PI / 2]
  }
  const arms = (['left', 'right'] as const).flatMap((side) =>
    (['support', 'cutter'] as const).map((role) => ({
      side,
      role,
      mount: {
        position: p(
          side === 'left' ? -0.24 : 0.24,
          0,
          role === 'support' ? -0.12 : 0.12
        ),
        rotation: [
          0,
          side === 'left' ? -Math.SQRT1_2 : Math.SQRT1_2,
          0,
          Math.SQRT1_2
        ]
      },
      upper: linkValue(0.46, 0.05, 0.65, p(0, 1, 0)),
      forearm: linkValue(0.4, 0.05, 0.5, p(0, 1, 0)),
      wrist: linkValue(0.1, 0.05, 0.25, p(0, 1, 0)),
      tool: {
        reach: 0.14,
        width: role === 'support' ? 0.05 : 0.012,
        height: 0.05,
        massKg: role === 'support' ? 0.35 : 0.5,
        localCoM: p(0, 0.07, 0)
      },
      guard: {
        size: p(0.09, 0.06, 0.04),
        massKg: 0.15,
        localCoM: p(0, 0.03, 0)
      },
      jointRanges: armRange
    }))
  )
  const stationZ = { front: -0.28, middle: 0, rear: 0.28 }
  const legs = (['left', 'right'] as const).flatMap((side) =>
    (['front', 'middle', 'rear'] as const).map((station) => ({
      side,
      station,
      mount: {
        position: p(side === 'left' ? -0.25 : 0.25, 0.18, stationZ[station]),
        rotation: q()
      },
      coxa: linkValue(0.1, 0.05, 0.35, p(side === 'left' ? -1 : 1, 0, 0)),
      upper: linkValue(0.3, 0.05, 0.65, p(0, -1, 0)),
      lower: linkValue(0.35, 0.05, 0.65, p(0, -1, 0)),
      foot: {
        size: p(0.11, 0.04, 0.15),
        massKg: 0.35,
        localCoM: p(0, -0.02, 0)
      },
      jointRanges: {
        abduction: [-Math.PI / 5, Math.PI / 5],
        hip: [-Math.PI / 2, Math.PI / 3],
        knee: [0, (2 * Math.PI) / 3]
      }
    }))
  )
  const armState = (working: WalkingSide | 'none') =>
    arms.map(({ side, role }) => ({
      side,
      role,
      rootYaw: 0,
      shoulderPitch: side === working ? -0.25 : 0,
      elbowPitch: side === working ? 0.75 : 0,
      wristPitch: side === working ? -0.35 : 0
    }))
  const legState = () =>
    legs.map(({ side, station }) => ({
      side,
      station,
      abduction: 0,
      hip: 0,
      knee: 0
    }))
  const definition = {
    format: WALKING_ROBOT_FORMAT,
    topology: WALKING_ROBOT_TOPOLOGY,
    definitionId,
    sourceModel: {
      kind: sourceProfile,
      evidence: {
        kind: 'synthetic',
        id: 'walking-solid-articulation-v1',
        label: 'Solid articulation geometry - synthetic assumptions'
      },
      pinRadiusRatio: 1 / 8,
      sleeveInnerRadiusRatio: 3 / 16,
      sleeveOuterRadiusRatio: 1 / 2,
      axialGapRatio: 1 / 16,
      linkSetbackRatio: 1 / 2
    },
    geometryEvidence: {
      kind: 'synthetic',
      id: 'adjustable-walking-geometry-v1',
      label: 'Adjustable walking geometry - synthetic comparison assumption'
    },
    jointEvidence: {
      kind: 'synthetic',
      id: 'adjustable-walking-joints-v1',
      label: 'Adjustable walking joints - synthetic comparison assumption'
    },
    massEvidence: {
      kind: 'synthetic',
      id: 'adjustable-walking-mass-v1',
      label: 'Adjustable walking mass - synthetic comparison assumption'
    },
    base: {
      chassis: massGeometryValue(p(0.58, 0.3, 0.78), p(0, 0.25, 0), 14),
      mast: {
        ...massGeometryValue(p(0.12, 1.31, 0.12), p(0, 1.055, 0), 4),
        localCoM: p(0, 0.62, 0)
      },
      emptyPayloadTray: massGeometryValue(
        p(0.4, 0.08, 0.25),
        p(0, 0.5, 0.24),
        2
      ),
      inspectionHeads: {
        left: massGeometryValue(p(0.1, 0.08, 0.1), p(-0.2, 0.82, -0.22), 1),
        right: massGeometryValue(p(0.1, 0.08, 0.1), p(0.2, 0.82, -0.22), 1)
      }
    },
    carriage: {
      ...massGeometryValue(p(0.5, 0.12, 0.22), p(0, 0, 0), 5),
      liftRange: [0.5, 1.65]
    },
    arms,
    legs,
    presets: {
      stowed: { carriage: 0.55, arms: armState('none'), legs: legState() },
      leftWorking: { carriage: 1, arms: armState('left'), legs: legState() },
      rightWorking: { carriage: 1, arms: armState('right'), legs: legState() }
    }
  }
  if (sourceProfile === 'solid-articulation/2') {
    // The authored bearing support is checked against all completed child
    // material by the source owner. One exact sum chooses the least outward
    // binary64 mount; chained rounded additions would not preserve that rule.
    for (const leg of legs) {
      const side = leg.side === 'left' ? -1 : 1
      const terms = [
        side * definition.base.chassis.centre[0],
        definition.base.chassis.size[0] / 2,
        leg.coxa.section * definition.sourceModel.sleeveOuterRadiusRatio,
        leg.coxa.section * definition.sourceModel.axialGapRatio
      ].map(dyadic)
      const exponent = Math.min(...terms.map((term) => term.exponent))
      const sum = terms.reduce(
        (value, term) =>
          value + (term.significand << BigInt(term.exponent - exponent)),
        0n
      )
      const numerator = exponent >= 0 ? sum << BigInt(exponent) : sum
      const denominator = exponent < 0 ? 1n << BigInt(-exponent) : 1n
      leg.mount.position[0] = side * roundFraction(numerator, denominator, 'up')
    }
    definition.sourceModel.evidence.id = 'walking-solid-articulation-v2'
    definition.sourceModel.evidence.label =
      'External root clevis geometry - synthetic assumptions'
    definition.geometryEvidence.id = 'adjustable-walking-geometry-v2'
    definition.massEvidence.id = 'external-root-walking-mass-v2'
    definition.massEvidence.label =
      'External root component mass and CoM - synthetic assumptions'
  }
  return readWalkingRobotDefinition(definition)
}
