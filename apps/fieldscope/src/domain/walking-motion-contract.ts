import type {
  WalkingConstrainedCycle,
  WalkingConstrainedCycleOwner
} from './walking-constrained-kinematics'
import type {
  WalkingTerrainPlacementRequest,
  WalkingTerrainPlacementSeed
} from './walking-terrain-placement-contract'
import { readWalkingTerrainPlacementRequest } from './walking-terrain-placement-contract'
import type { Point3 } from './greenhouse'
import type {
  WalkingEvidence,
  WalkingRobotJointState,
  WalkingRigidTransform
} from './walking-robot-definition'
import type { WalkingRobotSource } from './walking-robot-source'
import type {
  WalkingMountedCrate,
  WalkingMountedCrateOwner
} from './walking-mounted-crate'
import type { WalkingRobotPart } from './walking-robot-source'
import {
  readSourceRegions,
  type SourceRegion,
  type SourcePatch,
  type SourceTriangleRange
} from './source-occupancy'
import type {
  SceneDemand,
  SceneDemandTarget,
  SceneDemandTargetPartition
} from '../simulation/scene-demand'

export const WALKING_MOTION_REQUEST_FORMAT = 'walking-motion-request/1' as const
export const WALKING_SOURCE_MOTION_REQUEST_FORMAT =
  'walking-motion-request/2' as const
export const WALKING_TERRAIN_FORMAT = 'walking-terrain/1' as const

export interface WalkingMotionBaseState {
  readonly position: Point3
  readonly heading: number
  readonly pitch: number
  readonly roll: number
}
export interface WalkingMotionKnot {
  readonly time: number
  readonly base: WalkingMotionBaseState
  readonly joints: WalkingRobotJointState
}
export interface WalkingMotionPath {
  readonly id: string
  readonly intent: 'straight' | 'reverse' | 'turn' | 'transfer'
  readonly knots: readonly WalkingMotionKnot[]
}
export type WalkingStanceLegState =
  | Readonly<{ kind: 'support'; contactAssessmentId: string }>
  | Readonly<{ kind: 'swing' }>
export interface WalkingStancePhase {
  readonly from: number
  readonly until: number
  readonly legs: readonly {
    readonly chainId: string
    readonly state: WalkingStanceLegState
  }[]
}
export interface WalkingStanceSchedule {
  readonly id: string
  readonly phases: readonly WalkingStancePhase[]
}
export type WalkingTerrainObservation =
  | Readonly<{ kind: 'unknown' }>
  | Readonly<{
      coverage: 'complete' | 'sampled'
      evidence: WalkingEvidence
    }>
export type WalkingContactRelation =
  | Readonly<{ kind: 'unknown' }>
  | Readonly<{
      status: 'admitted' | 'blocked'
      evidence: WalkingEvidence
    }>
export interface WalkingTerrainRegion {
  readonly id: string
  readonly classification: 'soil' | 'channel' | 'debris'
  readonly sourceId: string
  readonly shape: Readonly<{
    kind: 'triangles'
    positions: readonly number[]
    indices: readonly number[]
  }>
  readonly frame: WalkingRigidTransform
  readonly binding:
    | Readonly<{ kind: 'route-soil'; bay: number; stripId: string }>
    | Readonly<{ kind: 'scene-channel'; bay: number; stripId: string }>
    | Readonly<{ kind: 'debris' }>
  readonly keepOut:
    | Readonly<{ kind: 'none' }>
    | Readonly<{
        kind: 'bounded'
        min: Point3
        max: Point3
        evidence: WalkingEvidence
      }>
}
export interface WalkingContactAssessment {
  readonly id: string
  readonly footPatchId: string
  readonly terrainRegionId: string
  readonly pathId: string
  readonly from: number
  readonly until: number
  readonly loadCaseId: string
  readonly coverage: 'complete' | 'sampled'
  readonly geometry: WalkingContactRelation
  readonly friction: WalkingContactRelation
  readonly bearing: WalkingContactRelation
  readonly sinkage: WalkingContactRelation
}
export interface WalkingTerrainEvidence {
  readonly format: typeof WALKING_TERRAIN_FORMAT
  readonly id: string
  readonly revision: number
  readonly sceneRevision: number
  readonly route: Readonly<{ bay: number; stripId: string }>
  readonly provenance: WalkingEvidence
  readonly observations: Readonly<{
    height: WalkingTerrainObservation
    slope: WalkingTerrainObservation
    rut: WalkingTerrainObservation
    debris: WalkingTerrainObservation
  }>
  readonly regions: readonly WalkingTerrainRegion[]
  readonly contactAssessments: readonly WalkingContactAssessment[]
}
export interface WalkingCarriedAttachment {
  readonly id: string
  readonly sourceId: string
  readonly sourceCoverage: 'complete' | 'partial'
  readonly shape:
    | Readonly<{
        kind: 'triangles'
        positions: readonly number[]
        indices: readonly number[]
      }>
    | Readonly<{ kind: 'unknown' }>
  readonly holderBodyId: string
  readonly localFrame: WalkingRigidTransform
  readonly massPropertiesId: string
}
export interface WalkingLoadCase {
  readonly id: string
  readonly provenance: WalkingEvidence
  readonly crate:
    | Readonly<{ kind: 'unknown' }>
    | Readonly<{
        kind: 'attached'
        provenance: WalkingEvidence
        sourceCoverage: 'complete' | 'partial'
        sourceParts: readonly Readonly<{
          id: string
          sourceId: string
          shape: Extract<
            WalkingCarriedAttachment['shape'],
            { kind: 'triangles' }
          >
        }>[]
        holderBodyId: 'base'
        localFrames: readonly WalkingRigidTransform[]
        massIdentity: string
      }>
  readonly carried:
    | Readonly<{ kind: 'none' }>
    | Readonly<{ kind: 'attached'; items: readonly WalkingCarriedAttachment[] }>
}
export interface WalkingMotionRequestV1 {
  readonly format: typeof WALKING_MOTION_REQUEST_FORMAT
  readonly requestId: string
  readonly path: WalkingMotionPath
  readonly evaluation: Readonly<{ from: number; until: number }>
  readonly stance: WalkingStanceSchedule
  readonly gait: Readonly<{ id: string; provenance: WalkingEvidence }>
  readonly terrain: WalkingTerrainEvidence
  readonly load: WalkingLoadCase
  readonly budget: Readonly<{
    maxIntervals: number
    maxEnvelopePairs: number
  }>
}

export interface WalkingTargetContact {
  readonly from: number
  readonly until: number
  readonly purpose: 'support' | 'cut'
  readonly robot: Readonly<{
    part: WalkingRobotPart
    region: SourceRegion
    patch: SourcePatch
  }>
  readonly target: Readonly<{
    target: SceneDemandTarget
    partition: SceneDemandTargetPartition
    ranges: readonly SourceTriangleRange[]
  }>
}
export interface WalkingExternalSourceRegions {
  readonly sourceId: string
  readonly regions: readonly SourceRegion[]
}
export interface WalkingSourceMotionRequest extends Omit<
  WalkingMotionRequestV1,
  'format' | 'budget'
> {
  readonly format: typeof WALKING_SOURCE_MOTION_REQUEST_FORMAT
  readonly source: WalkingRobotSource
  readonly demand: SceneDemand
  readonly externalSources: readonly WalkingExternalSourceRegions[]
  readonly targetContacts: readonly WalkingTargetContact[]
  readonly budget: Readonly<{
    maxIntervals: number
    maxEnvelopePairs: number
    maxRegionPairs: number
    maxExactPredicates: number
  }>
}
export type WalkingMotionRequest =
  WalkingMotionRequestV1 | WalkingSourceMotionRequest
const admittedRequests = new WeakMap<
  object,
  { source: WalkingRobotSource; demand?: SceneDemand }
>()

const invalid = (): never => {
  throw new Error('Invalid walking motion request')
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const exact = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => key in value)
const identity = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0
const finitePoint = (value: unknown): value is Point3 =>
  Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
const frame = (value: unknown): value is WalkingRigidTransform =>
  record(value) &&
  exact(value, ['position', 'rotation']) &&
  finitePoint(value.position) &&
  Array.isArray(value.rotation) &&
  value.rotation.length === 4 &&
  value.rotation.every(Number.isFinite) &&
  Math.abs(Math.hypot(...value.rotation) - 1) <= 1e-9
const positiveInteger = (value: unknown) =>
  Number.isInteger(value) && Number(value) > 0
const evidence = (value: unknown): value is WalkingEvidence =>
  record(value) &&
  identity(value.id) &&
  (value.kind === 'measured'
    ? exact(value, ['kind', 'id'])
    : value.kind === 'synthetic' &&
      exact(value, ['kind', 'id', 'label']) &&
      identity(value.label))
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
function triangleShape(value: unknown) {
  if (
    !record(value) ||
    !exact(value, ['kind', 'positions', 'indices']) ||
    value.kind !== 'triangles' ||
    !Array.isArray(value.positions) ||
    value.positions.length < 9 ||
    value.positions.length % 3 !== 0 ||
    !value.positions.every(Number.isFinite) ||
    !Array.isArray(value.indices) ||
    value.indices.length < 3 ||
    value.indices.length % 3 !== 0 ||
    !value.indices.every(
      (index) =>
        Number.isInteger(index) &&
        Number(index) >= 0 &&
        Number(index) < (value.positions as unknown[]).length / 3
    )
  )
    return false
  return true
}
function jointState(value: unknown, source: WalkingRobotSource) {
  if (
    !record(value) ||
    !exact(value, ['carriage', 'arms', 'legs']) ||
    !Number.isFinite(value.carriage) ||
    Number(value.carriage) < source.definition.carriage.liftRange[0] ||
    Number(value.carriage) > source.definition.carriage.liftRange[1] ||
    !Array.isArray(value.arms) ||
    !Array.isArray(value.legs)
  )
    return false
  const armIds = new Set<string>()
  if (
    value.arms.length !== source.definition.arms.length ||
    !value.arms.every((entry) => {
      if (
        !record(entry) ||
        !exact(entry, [
          'side',
          'role',
          'rootYaw',
          'shoulderPitch',
          'elbowPitch',
          'wristPitch'
        ])
      )
        return false
      const definition = source.definition.arms.find(
          ({ side, role }) => side === entry.side && role === entry.role
        ),
        id = `${String(entry.side)}-${String(entry.role)}`
      if (!definition || armIds.has(id)) return false
      armIds.add(id)
      return (
        ['rootYaw', 'shoulderPitch', 'elbowPitch', 'wristPitch'] as const
      ).every(
        (key) =>
          Number.isFinite(entry[key]) &&
          Number(entry[key]) >= definition.jointRanges[key][0] &&
          Number(entry[key]) <= definition.jointRanges[key][1]
      )
    })
  )
    return false
  const legIds = new Set<string>()
  return (
    value.legs.length === source.definition.legs.length &&
    value.legs.every((entry) => {
      if (
        !record(entry) ||
        !exact(entry, ['side', 'station', 'abduction', 'hip', 'knee'])
      )
        return false
      const definition = source.definition.legs.find(
          ({ side, station }) =>
            side === entry.side && station === entry.station
        ),
        id = `${String(entry.side)}-${String(entry.station)}`
      if (!definition || legIds.has(id)) return false
      legIds.add(id)
      return (['abduction', 'hip', 'knee'] as const).every(
        (key) =>
          Number.isFinite(entry[key]) &&
          Number(entry[key]) >= definition.jointRanges[key][0] &&
          Number(entry[key]) <= definition.jointRanges[key][1]
      )
    })
  )
}
function relation(value: unknown): value is WalkingContactRelation {
  return (
    record(value) &&
    (value.kind === 'unknown'
      ? exact(value, ['kind'])
      : ['admitted', 'blocked'].includes(String(value.status)) &&
        exact(value, ['status', 'evidence']) &&
        evidence(value.evidence))
  )
}
function observation(value: unknown): value is WalkingTerrainObservation {
  return (
    record(value) &&
    (value.kind === 'unknown'
      ? exact(value, ['kind'])
      : ['complete', 'sampled'].includes(String(value.coverage)) &&
        exact(value, ['coverage', 'evidence']) &&
        evidence(value.evidence))
  )
}

export function readWalkingMotionRequest(
  raw: unknown,
  source: WalkingRobotSource,
  demand?: SceneDemand
): WalkingMotionRequest {
  if (record(raw) && admittedRequests.has(raw)) {
    const binding = admittedRequests.get(raw)
    if (
      binding?.source !== source ||
      (raw.format === WALKING_SOURCE_MOTION_REQUEST_FORMAT &&
        binding.demand !== demand)
    )
      return invalid()
    return raw as unknown as WalkingMotionRequest
  }
  if (record(raw) && raw.format === WALKING_SOURCE_MOTION_REQUEST_FORMAT)
    return readSourceMotionRequest(raw, source, demand)
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
      'requestId',
      'path',
      'evaluation',
      'stance',
      'gait',
      'terrain',
      'load',
      'budget'
    ]) ||
    value.format !== WALKING_MOTION_REQUEST_FORMAT ||
    !identity(value.requestId) ||
    !record(value.path) ||
    !exact(value.path, ['id', 'intent', 'knots']) ||
    !identity(value.path.id) ||
    !['straight', 'reverse', 'turn', 'transfer'].includes(
      String(value.path.intent)
    ) ||
    !Array.isArray(value.path.knots) ||
    value.path.knots.length < 2
  )
    return invalid()
  const path = value.path,
    knots = value.path.knots
  for (let index = 0; index < knots.length; index++) {
    const knot = knots[index]
    if (
      !record(knot) ||
      !exact(knot, ['time', 'base', 'joints']) ||
      !Number.isFinite(knot.time) ||
      (index > 0 && Number(knot.time) <= Number(knots[index - 1].time)) ||
      !record(knot.base) ||
      !exact(knot.base, ['position', 'heading', 'pitch', 'roll']) ||
      !finitePoint(knot.base.position) ||
      ![knot.base.heading, knot.base.pitch, knot.base.roll].every(
        Number.isFinite
      ) ||
      !jointState(knot.joints, source)
    )
      return invalid()
  }
  if (
    !record(value.evaluation) ||
    !exact(value.evaluation, ['from', 'until']) ||
    !Number.isFinite(value.evaluation.from) ||
    !Number.isFinite(value.evaluation.until) ||
    Number(value.evaluation.from) >= Number(value.evaluation.until) ||
    Number(value.evaluation.from) < Number(knots[0].time) ||
    Number(value.evaluation.until) > Number(knots.at(-1)?.time)
  )
    return invalid()
  const knotTimes = new Set(knots.map(({ time }) => time))
  if (
    !record(value.stance) ||
    !exact(value.stance, ['id', 'phases']) ||
    !identity(value.stance.id) ||
    !Array.isArray(value.stance.phases) ||
    !value.stance.phases.length
  )
    return invalid()
  const phases = value.stance.phases,
    chainIds = new Set(source.rig.legChains.map(({ id }) => id))
  for (let index = 0; index < phases.length; index++) {
    const phase = phases[index]
    if (
      !record(phase) ||
      !exact(phase, ['from', 'until', 'legs']) ||
      !Number.isFinite(phase.from) ||
      !Number.isFinite(phase.until) ||
      Number(phase.from) >= Number(phase.until) ||
      !knotTimes.has(phase.from as number) ||
      !knotTimes.has(phase.until as number) ||
      (index === 0
        ? phase.from !== value.evaluation.from
        : phase.from !== phases[index - 1].until) ||
      (index === phases.length - 1 && phase.until !== value.evaluation.until) ||
      !Array.isArray(phase.legs) ||
      phase.legs.length !== chainIds.size
    )
      return invalid()
    const seen = new Set<string>()
    for (const leg of phase.legs) {
      if (
        !record(leg) ||
        !exact(leg, ['chainId', 'state']) ||
        !identity(leg.chainId) ||
        !chainIds.has(leg.chainId as string) ||
        seen.has(leg.chainId as string) ||
        !record(leg.state) ||
        (leg.state.kind === 'support'
          ? !exact(leg.state, ['kind', 'contactAssessmentId']) ||
            !identity(leg.state.contactAssessmentId)
          : leg.state.kind !== 'swing' || !exact(leg.state, ['kind']))
      )
        return invalid()
      seen.add(leg.chainId as string)
    }
  }
  if (
    !record(value.gait) ||
    !exact(value.gait, ['id', 'provenance']) ||
    !identity(value.gait.id) ||
    !evidence(value.gait.provenance) ||
    !record(value.load) ||
    !exact(value.load, ['id', 'provenance', 'crate', 'carried']) ||
    !identity(value.load.id) ||
    !evidence(value.load.provenance) ||
    !record(value.load.crate) ||
    !record(value.load.carried)
  )
    return invalid()
  validateWalkingLoad(value.load, source)
  if (
    !record(value.terrain) ||
    !exact(value.terrain, [
      'format',
      'id',
      'revision',
      'sceneRevision',
      'route',
      'provenance',
      'observations',
      'regions',
      'contactAssessments'
    ]) ||
    value.terrain.format !== WALKING_TERRAIN_FORMAT ||
    !identity(value.terrain.id) ||
    !positiveInteger(value.terrain.revision) ||
    !positiveInteger(value.terrain.sceneRevision) ||
    !record(value.terrain.route) ||
    !exact(value.terrain.route, ['bay', 'stripId']) ||
    !Number.isInteger(value.terrain.route.bay) ||
    Number(value.terrain.route.bay) < 0 ||
    !identity(value.terrain.route.stripId) ||
    !evidence(value.terrain.provenance) ||
    !record(value.terrain.observations) ||
    !exact(value.terrain.observations, ['height', 'slope', 'rut', 'debris']) ||
    !Object.values(value.terrain.observations).every(observation) ||
    !Array.isArray(value.terrain.regions) ||
    !value.terrain.regions.length ||
    !Array.isArray(value.terrain.contactAssessments)
  )
    return invalid()
  const terrainRoute = value.terrain.route,
    terrainRegions = value.terrain.regions,
    contactAssessments = value.terrain.contactAssessments,
    regionIds = new Set<string>()
  for (const region of terrainRegions) {
    if (
      !record(region) ||
      !exact(region, [
        'id',
        'classification',
        'sourceId',
        'shape',
        'frame',
        'binding',
        'keepOut'
      ]) ||
      !identity(region.id) ||
      regionIds.has(region.id as string) ||
      !['soil', 'channel', 'debris'].includes(String(region.classification)) ||
      !identity(region.sourceId) ||
      !triangleShape(region.shape) ||
      !frame(region.frame) ||
      !record(region.binding) ||
      !record(region.keepOut)
    )
      return invalid()
    if (
      (region.classification === 'soil' &&
        (region.binding.kind !== 'route-soil' ||
          !exact(region.binding, ['kind', 'bay', 'stripId']) ||
          region.binding.bay !== terrainRoute.bay ||
          region.binding.stripId !== terrainRoute.stripId)) ||
      (region.classification === 'channel' &&
        (region.binding.kind !== 'scene-channel' ||
          !exact(region.binding, ['kind', 'bay', 'stripId']) ||
          !Number.isInteger(region.binding.bay) ||
          Number(region.binding.bay) < 0 ||
          !identity(region.binding.stripId))) ||
      (region.classification === 'debris' &&
        (region.binding.kind !== 'debris' || !exact(region.binding, ['kind'])))
    )
      return invalid()
    if (
      region.keepOut.kind === 'none'
        ? !exact(region.keepOut, ['kind'])
        : region.classification !== 'debris' ||
          region.keepOut.kind !== 'bounded' ||
          !exact(region.keepOut, ['kind', 'min', 'max', 'evidence']) ||
          !finitePoint(region.keepOut.min) ||
          !finitePoint(region.keepOut.max) ||
          !region.keepOut.min.every(
            (minimum, axis) =>
              minimum <=
              ((region.keepOut as Record<string, unknown>).max as Point3)[axis]
          ) ||
          !evidence(region.keepOut.evidence)
    )
      return invalid()
    regionIds.add(region.id as string)
  }
  const footPatches = new Map(
      source.rig.legChains.map((chain) => [
        source.rig.contacts.feet.find(
          ({ part }) => part.bodyId === chain.footBodyId
        )?.patch.id,
        chain.id
      ])
    ),
    assessments = new Map<string, WalkingContactAssessment>()
  for (const assessment of contactAssessments) {
    if (
      !record(assessment) ||
      !exact(assessment, [
        'id',
        'footPatchId',
        'terrainRegionId',
        'pathId',
        'from',
        'until',
        'loadCaseId',
        'coverage',
        'geometry',
        'friction',
        'bearing',
        'sinkage'
      ]) ||
      !identity(assessment.id) ||
      assessments.has(assessment.id as string) ||
      !footPatches.has(assessment.footPatchId as string) ||
      !regionIds.has(assessment.terrainRegionId as string) ||
      assessment.pathId !== path.id ||
      assessment.loadCaseId !== value.load.id ||
      !Number.isFinite(assessment.from) ||
      !Number.isFinite(assessment.until) ||
      Number(assessment.from) >= Number(assessment.until) ||
      Number(assessment.from) < Number(value.evaluation.from) ||
      Number(assessment.until) > Number(value.evaluation.until) ||
      !['complete', 'sampled'].includes(String(assessment.coverage)) ||
      ![
        assessment.geometry,
        assessment.friction,
        assessment.bearing,
        assessment.sinkage
      ].every(relation)
    )
      return invalid()
    assessments.set(
      assessment.id as string,
      assessment as unknown as WalkingContactAssessment
    )
  }
  for (const phase of phases)
    for (const leg of phase.legs) {
      if (leg.state.kind !== 'support') continue
      const assessment = assessments.get(
          leg.state.contactAssessmentId as string
        ),
        patch = [...footPatches.entries()].find(
          ([, chainId]) => chainId === leg.chainId
        )?.[0]
      if (
        !assessment ||
        assessment.footPatchId !== patch ||
        assessment.from > Number(phase.from) ||
        assessment.until < Number(phase.until)
      )
        return invalid()
    }
  if (
    !record(value.budget) ||
    !exact(value.budget, ['maxIntervals', 'maxEnvelopePairs']) ||
    !positiveInteger(value.budget.maxIntervals) ||
    !positiveInteger(value.budget.maxEnvelopePairs)
  )
    return invalid()
  const admitted = freeze(value) as unknown as WalkingMotionRequest
  admittedRequests.set(admitted, { source })
  return admitted
}

/** Explicit current-product binding; never an automatic version-one migration. */
function readSourceMotionRequest(
  raw: Record<string, unknown>,
  source: WalkingRobotSource,
  demand: SceneDemand | undefined
): WalkingSourceMotionRequest {
  const snapshot = { ...raw }
  if (
    !demand ||
    snapshot.source !== source ||
    snapshot.demand !== demand ||
    !exact(snapshot, [
      'format',
      'requestId',
      'path',
      'evaluation',
      'stance',
      'gait',
      'terrain',
      'load',
      'budget',
      'source',
      'demand',
      'externalSources',
      'targetContacts'
    ]) ||
    !record(snapshot.budget) ||
    !exact(snapshot.budget, [
      'maxIntervals',
      'maxEnvelopePairs',
      'maxRegionPairs',
      'maxExactPredicates'
    ]) ||
    !Object.values(snapshot.budget).every(
      (value) => Number.isSafeInteger(value) && Number(value) > 0
    ) ||
    !Array.isArray(snapshot.externalSources) ||
    !Array.isArray(snapshot.targetContacts)
  )
    return invalid()
  const budget = {
    maxIntervals: Number(snapshot.budget.maxIntervals),
    maxEnvelopePairs: Number(snapshot.budget.maxEnvelopePairs),
    maxRegionPairs: Number(snapshot.budget.maxRegionPairs),
    maxExactPredicates: Number(snapshot.budget.maxExactPredicates)
  }
  const base = readWalkingMotionRequest(
    {
      format: WALKING_MOTION_REQUEST_FORMAT,
      requestId: snapshot.requestId,
      path: snapshot.path,
      evaluation: snapshot.evaluation,
      stance: snapshot.stance,
      gait: snapshot.gait,
      terrain: snapshot.terrain,
      load: snapshot.load,
      budget: {
        maxIntervals: budget.maxIntervals,
        maxEnvelopePairs: budget.maxEnvelopePairs
      }
    },
    source
  )
  if (base.format !== WALKING_MOTION_REQUEST_FORMAT) return invalid()
  const shapes = new Map<
    string,
    Extract<WalkingCarriedAttachment['shape'], { kind: 'triangles' }>
  >()
  const bind = (
    sourceId: string,
    shape: Extract<WalkingCarriedAttachment['shape'], { kind: 'triangles' }>
  ) => {
    if (shapes.has(sourceId)) return invalid()
    shapes.set(sourceId, shape)
  }
  for (const region of base.terrain.regions) bind(region.sourceId, region.shape)
  if (base.load.crate.kind === 'attached')
    for (const part of base.load.crate.sourceParts)
      bind(part.sourceId, part.shape)
  if (base.load.carried.kind === 'attached')
    for (const item of base.load.carried.items)
      if (item.shape.kind === 'triangles') bind(item.sourceId, item.shape)
  const sourceIds = new Set<string>(),
    externalSources: WalkingExternalSourceRegions[] = []
  for (const candidate of structuredClone(snapshot.externalSources)) {
    if (
      !record(candidate) ||
      !exact(candidate, ['sourceId', 'regions']) ||
      !identity(candidate.sourceId) ||
      !Array.isArray(candidate.regions)
    )
      return invalid()
    const sourceId = String(candidate.sourceId),
      shape = shapes.get(sourceId)
    if (!shape || sourceIds.has(sourceId)) return invalid()
    sourceIds.add(sourceId)
    externalSources.push(
      Object.freeze({
        sourceId,
        regions: readSourceRegions(candidate.regions, shape.indices.length)
      })
    )
  }
  if (sourceIds.size !== shapes.size) return invalid()
  const breaks = [
    ...new Set([
      base.evaluation.from,
      base.evaluation.until,
      ...base.path.knots.map((knot) => knot.time),
      ...base.stance.phases.flatMap((phase) => [phase.from, phase.until])
    ])
  ]
    .filter(
      (time) => time >= base.evaluation.from && time <= base.evaluation.until
    )
    .sort((a, b) => a - b)
  const contacts: WalkingTargetContact[] = [],
    targets = [
      ...demand.targets.left,
      ...demand.targets.right,
      ...demand.targets.unassigned
    ]
  for (const input of snapshot.targetContacts) {
    if (!record(input)) return invalid()
    const candidate = { ...input }
    if (
      !exact(candidate, ['from', 'until', 'purpose', 'robot', 'target']) ||
      !Number.isFinite(candidate.from) ||
      !Number.isFinite(candidate.until) ||
      !['support', 'cut'].includes(String(candidate.purpose)) ||
      !record(candidate.robot) ||
      !exact(candidate.robot, ['part', 'region', 'patch']) ||
      !record(candidate.target) ||
      !exact(candidate.target, ['target', 'partition', 'ranges'])
    )
      return invalid()
    const from = Number(candidate.from),
      until = Number(candidate.until),
      index = breaks.indexOf(from)
    if (index < 0 || breaks[index + 1] !== until) return invalid()
    const robot = { ...candidate.robot },
      targetInput = { ...candidate.target }
    const part = source.parts.find((part) => part === robot.part)
    const region = part?.regions.find((region) => region === robot.region),
      patch = part?.patches.find((patch) => patch === robot.patch)
    const purpose = candidate.purpose === 'support' ? 'support' : 'cut',
      allowed =
        purpose === 'support'
          ? source.rig.contacts.supportTools
          : source.rig.contacts.cuttingEdges
    if (
      !part ||
      !region ||
      !patch ||
      patch.region !== region ||
      !allowed.some(
        (reference) => reference.part === part && reference.patch === patch
      )
    )
      return invalid()
    if (
      contacts.some(
        (contact) =>
          contact.robot.patch === patch &&
          contact.from < until &&
          from < contact.until
      )
    )
      return invalid()
    const target = targets.find((target) => target === targetInput.target),
      partition = target?.partitions.find(
        (partition) => partition === targetInput.partition
      )
    if (
      !target ||
      !partition ||
      !Array.isArray(targetInput.ranges) ||
      targetInput.ranges.length === 0
    )
      return invalid()
    const ranges: SourceTriangleRange[] = []
    let end = partition.partition.indexStart
    for (const rawRange of targetInput.ranges) {
      if (!record(rawRange)) return invalid()
      const inputRange = { ...rawRange }
      if (
        !exact(inputRange, ['indexStart', 'indexCount']) ||
        !Number.isSafeInteger(inputRange.indexStart) ||
        !Number.isSafeInteger(inputRange.indexCount)
      )
        return invalid()
      const indexStart = Number(inputRange.indexStart),
        indexCount = Number(inputRange.indexCount)
      if (
        indexStart < end ||
        indexStart % 3 !== 0 ||
        indexCount <= 0 ||
        indexCount % 3 !== 0 ||
        !Number.isSafeInteger(indexStart + indexCount) ||
        indexStart + indexCount >
          partition.partition.indexStart + partition.partition.indexCount
      )
        return invalid()
      end = indexStart + indexCount
      ranges.push(Object.freeze({ indexStart, indexCount }))
    }
    contacts.push(
      Object.freeze({
        from,
        until,
        purpose,
        robot: Object.freeze({ part, region, patch }),
        target: Object.freeze({
          target,
          partition,
          ranges: Object.freeze(ranges)
        })
      })
    )
  }
  const result: WalkingSourceMotionRequest = Object.freeze({
    ...base,
    format: WALKING_SOURCE_MOTION_REQUEST_FORMAT,
    source,
    demand,
    budget: Object.freeze(budget),
    externalSources: Object.freeze(externalSources),
    targetContacts: Object.freeze(contacts)
  })
  admittedRequests.set(result, { source, demand })
  return result
}

/** The input snapshot belongs to W3; terrain products subsequently admit detached copies. */
export const WALKING_NONLINEAR_MOTION_REQUEST_FORMAT =
  'walking-motion-request/3' as const
export interface WalkingNonlinearMotionRequest {
  readonly format: typeof WALKING_NONLINEAR_MOTION_REQUEST_FORMAT
  readonly requestId: string
  readonly source: WalkingRobotSource
  readonly demand: SceneDemand
  readonly cycle: WalkingConstrainedCycle
  readonly path: Readonly<{
    id: string
    phases: readonly Readonly<{ phase: 0 | 1; from: number; until: number }>[]
  }>
  readonly gait: WalkingMotionRequestV1['gait']
  readonly terrain: WalkingTerrainEvidence
  readonly load: WalkingNonlinearLoadCase
  readonly externalSources: readonly WalkingExternalSourceRegions[]
  readonly terrainEvents: readonly Readonly<{
    event: 'initial-a' | 'initial-b' | 'handoff-b' | 'final-a'
    seeds: readonly WalkingTerrainPlacementSeed[]
    placementRequest: WalkingTerrainPlacementRequest
  }>[]
  readonly targetContacts: readonly []
  readonly placementBudget: WalkingTerrainPlacementRequest['budget']
  readonly budget: Readonly<{
    maxPhaseNodes: number
    maxSubdivisions: number
    maxRegionPairs: number
    maxExactPredicates: number
    maxBits: number
    maxCycleOperations: number
    maxInputValues: number
    maxEnvelopePairs: number
  }>
  readonly inputValues: number
}
export interface WalkingCurrentCycle {
  readonly owner: WalkingConstrainedCycleOwner
  readonly cycle: WalkingConstrainedCycle
}
export interface WalkingCurrentMountedCrate {
  readonly owner: WalkingMountedCrateOwner
  readonly crate: WalkingMountedCrate
}
export type WalkingNonlinearLoadCase = Omit<WalkingLoadCase, 'crate'> & {
  readonly crate:
    | WalkingLoadCase['crate']
    | Readonly<{
        kind: 'mounted'
        artifact: WalkingMountedCrate
      }>
}
export function isWalkingMountedCrateCurrent(
  load: WalkingNonlinearLoadCase,
  source: WalkingRobotSource,
  current?: WalkingCurrentMountedCrate
) {
  return (
    load.crate.kind !== 'mounted' ||
    Boolean(
      current &&
      current.crate === load.crate.artifact &&
      current.owner.read(source, current.crate) === current.crate
    )
  )
}
const admittedNonlinearRequests = new WeakSet<object>()
function validateWalkingLoad(
  load: Record<string, unknown>,
  source: WalkingRobotSource,
  mounted?: WalkingMountedCrate
) {
  if (
    !exact(load, ['id', 'provenance', 'crate', 'carried']) ||
    !identity(load.id) ||
    !evidence(load.provenance) ||
    !record(load.crate) ||
    !record(load.carried)
  )
    return invalid()
  const bodyIds = new Set(source.rig.bodies.map(({ id }) => id)),
    attachmentIds = new Set<string>()
  const crate = load.crate,
    carried = load.carried
  if (crate.kind === 'mounted' && mounted) {
    if (!exact(crate, ['kind', 'artifact']) || crate.artifact !== mounted)
      return invalid()
  } else if (crate.kind === 'unknown') {
    if (!exact(crate, ['kind'])) return invalid()
  } else {
    if (
      crate.kind !== 'attached' ||
      !exact(crate, [
        'kind',
        'provenance',
        'sourceCoverage',
        'sourceParts',
        'holderBodyId',
        'localFrames',
        'massIdentity'
      ]) ||
      !evidence(crate.provenance) ||
      !['complete', 'partial'].includes(String(crate.sourceCoverage)) ||
      crate.holderBodyId !== 'base' ||
      !bodyIds.has('base') ||
      !identity(crate.massIdentity) ||
      !Array.isArray(crate.sourceParts) ||
      !crate.sourceParts.length ||
      !Array.isArray(crate.localFrames) ||
      crate.localFrames.length !== crate.sourceParts.length ||
      !crate.localFrames.every(frame)
    )
      return invalid()
    const sourceIds = new Set<string>()
    for (const part of crate.sourceParts) {
      if (
        !record(part) ||
        !exact(part, ['id', 'sourceId', 'shape']) ||
        !identity(part.id) ||
        attachmentIds.has(part.id as string) ||
        !identity(part.sourceId) ||
        sourceIds.has(part.sourceId as string) ||
        !triangleShape(part.shape)
      )
        return invalid()
      attachmentIds.add(part.id as string)
      sourceIds.add(part.sourceId as string)
    }
  }
  if (carried.kind === 'none') {
    if (!exact(carried, ['kind'])) return invalid()
  } else if (
    carried.kind !== 'attached' ||
    !exact(carried, ['kind', 'items']) ||
    !Array.isArray(carried.items) ||
    !carried.items.length
  )
    return invalid()
  for (const attachment of carried.kind === 'attached'
    ? (carried.items as unknown[])
    : []) {
    if (
      !record(attachment) ||
      !exact(attachment, [
        'id',
        'sourceId',
        'sourceCoverage',
        'shape',
        'holderBodyId',
        'localFrame',
        'massPropertiesId'
      ]) ||
      !identity(attachment.id) ||
      attachmentIds.has(attachment.id as string) ||
      !identity(attachment.sourceId) ||
      !['complete', 'partial'].includes(String(attachment.sourceCoverage)) ||
      !(
        triangleShape(attachment.shape) ||
        (record(attachment.shape) &&
          exact(attachment.shape, ['kind']) &&
          attachment.shape.kind === 'unknown')
      ) ||
      !bodyIds.has(attachment.holderBodyId as string) ||
      !frame(attachment.localFrame) ||
      !identity(attachment.massPropertiesId)
    )
      return invalid()
    attachmentIds.add(attachment.id as string)
  }
}
/** No linear-knot surrogate: cycle issuance and terrain input provenance are explicit. */
export function readWalkingNonlinearMotionRequest(
  raw: unknown,
  source: WalkingRobotSource,
  demand: SceneDemand,
  current: WalkingCurrentCycle,
  mounted?: WalkingCurrentMountedCrate
): WalkingNonlinearMotionRequest {
  if (
    !record(raw) ||
    raw.source !== source ||
    raw.demand !== demand ||
    raw.cycle !== current.cycle ||
    current.cycle.source !== source ||
    current.owner.read(source, current.cycle.recipe) !== current.cycle
  )
    return invalid()
  const rawLoad = raw.load
  if (
    record(rawLoad) &&
    record(rawLoad.crate) &&
    rawLoad.crate.kind === 'mounted' &&
    (!mounted ||
      rawLoad.crate.artifact !== mounted.crate ||
      mounted.owner.read(source, mounted.crate) !== mounted.crate)
  )
    return invalid()
  if (admittedNonlinearRequests.has(raw))
    return raw as unknown as WalkingNonlinearMotionRequest
  if (
    !exact(raw, [
      'format',
      'requestId',
      'source',
      'demand',
      'cycle',
      'path',
      'gait',
      'terrain',
      'load',
      'externalSources',
      'terrainEvents',
      'targetContacts',
      'placementBudget',
      'budget'
    ]) ||
    raw.format !== WALKING_NONLINEAR_MOTION_REQUEST_FORMAT ||
    !identity(raw.requestId) ||
    !record(raw.budget)
  )
    return invalid()
  const budgetKeys = [
    'maxPhaseNodes',
    'maxSubdivisions',
    'maxRegionPairs',
    'maxExactPredicates',
    'maxBits',
    'maxCycleOperations',
    'maxInputValues',
    'maxEnvelopePairs'
  ]
  if (
    !exact(raw.budget, budgetKeys) ||
    !Object.values(raw.budget).every(
      (v) => Number.isSafeInteger(v) && Number(v) > 0
    ) ||
    Number(raw.budget.maxBits) > 24000
  )
    return invalid()
  let inputValues = 0
  const refs = new Set<object>([
    source,
    demand,
    current.cycle,
    ...source.parts,
    ...source.rig.contacts.feet.map((c) => c.patch)
  ])
  if (mounted) refs.add(mounted.crate)
  const copy = (v: unknown): unknown => {
    if (
      ++inputValues >
      Number((raw.budget as Record<string, unknown>).maxInputValues)
    )
      return invalid()
    if (
      typeof v === 'bigint' &&
      v.toString(2).length >
        Number((raw.budget as Record<string, unknown>).maxBits)
    )
      return invalid()
    if (typeof v === 'number' && !Number.isFinite(v)) return invalid()
    if (v && typeof v === 'object' && refs.has(v)) return v
    if (Array.isArray(v)) return Array.from(v, copy)
    if (record(v))
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, copy(x)]))
    return v
  }
  const value = copy(raw) as Record<string, unknown>
  if (
    !record(value.path) ||
    !exact(value.path, ['id', 'phases']) ||
    !identity(value.path.id) ||
    !Array.isArray(value.path.phases) ||
    value.path.phases.length !== 2
  )
    return invalid()
  let previous: number | undefined
  for (const [i, p] of value.path.phases.entries()) {
    if (
      !record(p) ||
      !exact(p, ['phase', 'from', 'until']) ||
      p.phase !== i ||
      !Number.isFinite(p.from) ||
      !Number.isFinite(p.until) ||
      Number(p.from) >= Number(p.until) ||
      (previous !== undefined && p.from !== previous)
    )
      return invalid()
    previous = Number(p.until)
  }
  if (
    !record(value.gait) ||
    !exact(value.gait, ['id', 'provenance']) ||
    !identity(value.gait.id) ||
    !evidence(value.gait.provenance) ||
    !record(value.load)
  )
    return invalid()
  validateWalkingLoad(value.load, source, mounted?.crate)
  if (
    !Array.isArray(value.targetContacts) ||
    value.targetContacts.length ||
    !Array.isArray(value.terrainEvents) ||
    value.terrainEvents.length !== 4 ||
    !Array.isArray(value.externalSources)
  )
    return invalid()
  const events = ['initial-a', 'initial-b', 'handoff-b', 'final-a']
  const terrain = value.terrain
  if (!record(terrain) || !Array.isArray(terrain.regions)) return invalid()
  const terrainRegions = terrain.regions
  const shapes = new Map<string, number>()
  for (const r of terrainRegions) {
    if (
      !record(r) ||
      !identity(r.sourceId) ||
      !triangleShape(r.shape) ||
      shapes.has(String(r.sourceId))
    )
      return invalid()
    shapes.set(
      String(r.sourceId),
      (r.shape as { indices: number[] }).indices.length
    )
  }
  const load = value.load as unknown as WalkingNonlinearLoadCase
  if (load.crate.kind === 'attached')
    for (const p of load.crate.sourceParts) {
      if (shapes.has(p.sourceId)) return invalid()
      shapes.set(p.sourceId, p.shape.indices.length)
    }
  if (load.carried.kind === 'attached')
    for (const p of load.carried.items) {
      if (shapes.has(p.sourceId)) return invalid()
      if (p.shape.kind === 'triangles')
        shapes.set(p.sourceId, p.shape.indices.length)
    }
  const seen = new Set<string>()
  const partitions = value.externalSources.map((p) => {
    if (
      !record(p) ||
      !exact(p, ['sourceId', 'regions']) ||
      !identity(p.sourceId) ||
      !Array.isArray(p.regions) ||
      seen.has(String(p.sourceId)) ||
      !shapes.has(String(p.sourceId))
    )
      return invalid()
    seen.add(String(p.sourceId))
    return Object.freeze({
      sourceId: String(p.sourceId),
      regions: readSourceRegions(
        p.regions,
        shapes.get(String(p.sourceId)) ?? invalid()
      )
    })
  })
  if (seen.size !== shapes.size) return invalid()
  // W3 issues each admitted event request once from its snapshot. The owned
  // placement producer consumes that exact admitted request without readmission.
  const admittedEvents = []
  for (const [i, event] of value.terrainEvents.entries()) {
    if (
      !record(event) ||
      !exact(event, ['event', 'seeds']) ||
      event.event !== events[i]
    )
      return invalid()
    const placementRequest = readWalkingTerrainPlacementRequest(
      {
        format: 'walking-terrain-placement-request/1',
        source,
        demand,
        farm: demand.farm,
        route: demand.route,
        terrain,
        partitions: partitions.filter((p) =>
          terrainRegions.some((r) => record(r) && r.sourceId === p.sourceId)
        ),
        seeds: event.seeds,
        baseOrientation: current.cycle.recipe.baseOrientation,
        fixedJoints: current.cycle.recipe.fixedJoints,
        interval: { low: 0, high: 0 },
        budget: value.placementBudget
      },
      { source, demand }
    )
    inputValues += placementRequest.inputValues
    if (
      inputValues >
      Number((value.budget as Record<string, unknown>).maxInputValues)
    )
      return invalid()
    admittedEvents.push({ ...event, placementRequest })
  }
  const result = freeze({
    ...value,
    externalSources: partitions,
    terrainEvents: admittedEvents,
    inputValues
  }) as unknown as WalkingNonlinearMotionRequest
  admittedNonlinearRequests.add(result)
  return result
}
