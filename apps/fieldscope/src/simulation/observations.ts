import type { WalkingOperatingReport } from '../runtime/walking-operating-workspace'
import type { WalkingRobotSource } from '../domain/walking-robot-source'
import type { CropSpecies } from '../domain/crop-layout'
import type { CropSourceAnatomyPatch, CropFruit } from '../domain/crop-models'
import { isSceneObservationSpace } from './scene-demand'
import type { SceneDemand, SceneObservationSpace } from './scene-demand'
import {
  WalkingTransitScreen,
  type WalkingSceneCandidates
} from './walking-transit-screen'
import {
  SyntheticDynamicSceneOwner,
  type SyntheticDynamicSnapshot,
  type SyntheticActorSource,
  type SyntheticSourceBounds
} from './synthetic-dynamic-scene'
import type { SourceRegion } from '../domain/source-occupancy'
import type { Point3 } from '../domain/greenhouse'
import type { RigidTransform } from '../domain/robot-kinematics'
import type { CanonicalMission } from './contracts'
import {
  QueryGeometry,
  type GeometrySource,
  type QueryGeometrySource,
  type WalkingObservationGeometrySource,
  type GeometryMesh
} from './geometry'
import {
  RayQueries,
  prepareQueryFrame,
  transformQueryDirection,
  transformQueryDirectionBounds,
  directionBounds,
  type RayResult,
  type RayBatchResult,
  type WalkingWorldRayBatch,
  type CanonicalRayCandidate
} from './ray-query'
import {
  interval,
  add,
  subtract,
  multiply,
  divide,
  squareRoot,
  type Interval
} from './query-arithmetic'
import { HarvestSession, type SessionSnapshot } from './session'

/** Composition must bind this actual run to its mission, not just current objects. */
export interface ObservationContext {
  readonly snapshot: SessionSnapshot
  readonly mission: CanonicalMission
  readonly geometry: GeometrySource
}
export interface ObservationOwners {
  isCurrentContext(context: ObservationContext): boolean
  isCurrentMission(mission: CanonicalMission): boolean
}
export interface TargetReading {
  kind: 'target'
  source: 'synthetic-injected'
  assumption: string
  id: string
  runId: string
  generation: number
  missionRevision: number
  sceneRevision: number
  robotRevision: number
  dockRevision: number
  observedAt: number
  validFrom: number
  validUntil: number
  targetId: string
  cultivar: CropSpecies | null
  pose: RigidTransform | null
  maturity: CropFruit['maturity'] | null
  coverage: { visible: number; total: number } | null
  stem: {
    targetId: string
    recognized: boolean | null
    cutSite: Point3 | null
  } | null
  approach: 'clear' | 'blocked' | null
  extraction: 'clear' | 'blocked' | null
  quality: {
    spines: 'intact' | 'lost' | null
    calyx: 'intact' | 'lost' | null
    pedicel: 'intact' | 'lost' | null
    contactDamage: 'observed' | 'none-observed' | null
  }
}
type ObservationBinding = Pick<
  TargetReading,
  | 'id'
  | 'runId'
  | 'generation'
  | 'missionRevision'
  | 'sceneRevision'
  | 'robotRevision'
  | 'dockRevision'
  | 'observedAt'
  | 'validFrom'
  | 'validUntil'
>
export interface ViewRequest extends ObservationBinding {
  source: 'synthetic-viewpoint'
  assumption: string
  targetIds: string[]
  samplesPerTarget: number
  leaves: 'source-pose' | 'unknown'
  fruits: 'all-attached' | 'unknown'
  camera: {
    pose: RigidTransform
    halfWidthSlope: number
    halfHeightSlope: number
    maxDistance: number
  }
}
export interface ActionVolumeRequest extends Omit<
  ViewRequest,
  'source' | 'targetIds' | 'samplesPerTarget'
> {
  source: 'synthetic-action-volume/1'
  actionId: string
  actionBounds: SyntheticSourceBounds
  optics: {
    illumination: number | null
    filmTransmission: number | null
    weatherTransmission: number | null
    shadowFraction: number | null
    glare: number | null
  }
  model: {
    format: 'synthetic-action-volume/1'
    minSignal: number
    maxGlare: number
    maxCandidates: number
    maxRays: number
    maxActors: number
  }
}
export type ActionDetection =
  | {
      readonly kind: 'static'
      readonly mesh: GeometryMesh
      readonly region: SourceRegion
      readonly instance: number
      readonly ray: Extract<RayResult, { status: 'hit' }>
      readonly anatomy: readonly CropSourceAnatomyPatch[]
    }
  | {
      readonly kind: 'dynamic'
      readonly trackId: string
      readonly actorKind: SyntheticActorSource['kind']
      readonly motion: SyntheticActorSource['motion']
      readonly bounds: SyntheticSourceBounds
      readonly sourceIdentity: Readonly<object>
      readonly distance: Readonly<Interval>
    }
export interface ActionVolumeObservation {
  readonly format: 'action-volume-observation/1'
  readonly identity: Readonly<object>
  readonly provenance: 'w1-canonical-obstacles/1'
  readonly context: ObservationContext
  readonly demandIdentity: Readonly<object>
  readonly dynamicIdentity: Readonly<object>
  readonly dynamicRevision: number
  readonly input: Immutable<ActionVolumeRequest>
  readonly sightBounds: SyntheticSourceBounds
  readonly reliability: Readonly<{
    status: 'reliable' | 'insufficient' | 'unknown'
    signal: Readonly<Interval>
    glare: Readonly<Interval>
  }>
  readonly coverage: 'complete-empty' | 'partial' | 'unknown'
  readonly detections: readonly ActionDetection[]
  readonly unvisited: number
  readonly reasons: readonly string[]
  readonly work: Readonly<{
    cameraFrames: number
    sightQueries: number
    rayBatches: number
    samples: number
    sourceActorVisits: number
    candidateVisits: number
    indexBuilds: number
    membershipBuilds: number
    membershipVisits: number
    placementMembershipChecks: number
    placements: number
    rayInstances: number
    rayTriangles: number
    dynamicRayTests: number
  }>
}

interface ViewSample {
  readonly targetId: string
  readonly mesh: GeometryMesh
  readonly instance: number
  readonly triangle: number
  readonly point: Point3
}
interface SampleResult {
  readonly requested: ViewSample
  readonly status: 'visible' | 'occluded' | 'outside-view' | 'unknown'
  readonly reason?: string
  readonly ray?: RayResult
  readonly sampleDistance: Interval
}
export interface ViewResult {
  readonly context: ObservationContext
  readonly input: Immutable<ViewRequest>
  readonly samples: readonly SampleResult[]
  readonly coverage: Readonly<{
    total: number
    visible: number
    occluded: number
    outsideView: number
    unknown: number
  }>
  readonly work: Readonly<{
    cameraFrames: number
    partitionVisits: number
    placements: number
    rayBatches: number
  }>
  readonly rays?: ReturnType<RayQueries['query']>
}
// Work budget for this synthetic sampler, not a calibrated sensor threshold.
const MAX_VIEW_SAMPLES = 64
type Immutable<T> = T extends object
  ? { readonly [K in keyof T]: Immutable<T[K]> }
  : T
export interface AdmittedTargetReading {
  readonly context: ObservationContext
  readonly reading: Immutable<TargetReading>
}
type QualityRequirement =
  'satisfied' | 'not-satisfied' | 'unknown' | 'not-applicable'
export interface SyntheticQualityAssessment {
  readonly observation: AdmittedTargetReading
  readonly requirements: Readonly<
    Record<keyof TargetReading['quality'], QualityRequirement>
  >
  readonly status: 'satisfied' | 'not-satisfied' | 'unknown'
  readonly physicalIntegrity: 'unverified'
}
function reject(): never {
  throw new Error('Invalid or stale synthetic target observation')
}
const text = (value: unknown): value is string =>
  typeof value === 'string' && !!value.trim()
const time = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
const point = (value: unknown) =>
  Array.isArray(value) &&
  value.length === 3 &&
  [0, 1, 2].every((index) => Number.isFinite(value[index]))
const choice = (value: unknown, values: readonly unknown[]) =>
  value === null || values.includes(value)
function keys(value: unknown, allowed: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) reject()
  const names = Object.keys(value)
  if (
    names.length !== allowed.length ||
    names.some((key) => !allowed.includes(key))
  )
    reject()
}
function freeze<T>(value: T): Immutable<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value as Immutable<T>
}
function readTarget(raw: TargetReading): Immutable<TargetReading> {
  const input = structuredClone(raw)
  keys(input, [
    'kind',
    'source',
    'assumption',
    'id',
    'runId',
    'generation',
    'missionRevision',
    'sceneRevision',
    'robotRevision',
    'dockRevision',
    'observedAt',
    'validFrom',
    'validUntil',
    'targetId',
    'cultivar',
    'pose',
    'maturity',
    'coverage',
    'stem',
    'approach',
    'extraction',
    'quality'
  ])
  if (
    input.kind !== 'target' ||
    input.source !== 'synthetic-injected' ||
    !text(input.assumption) ||
    !text(input.id) ||
    !text(input.runId) ||
    !text(input.targetId) ||
    ![
      input.generation,
      input.missionRevision,
      input.sceneRevision,
      input.robotRevision,
      input.dockRevision
    ].every((value) => Number.isSafeInteger(value) && value >= 0) ||
    ![input.observedAt, input.validFrom, input.validUntil].every(time) ||
    input.validUntil <= input.validFrom ||
    input.observedAt < input.validFrom ||
    input.observedAt >= input.validUntil ||
    !choice(input.cultivar, ['cucumber-1914', 'tomato-yu-nu']) ||
    !choice(input.maturity, ['green', 'turning', 'ripe', 'overgrown']) ||
    !choice(input.approach, ['clear', 'blocked']) ||
    !choice(input.extraction, ['clear', 'blocked'])
  )
    reject()
  if (input.pose !== null) {
    keys(input.pose, ['position', 'rotation'])
    const { position, rotation } = input.pose
    const norm =
      Array.isArray(rotation) && rotation.length === 4
        ? Math.hypot(...rotation)
        : NaN
    if (
      !point(position) ||
      !Array.isArray(rotation) ||
      rotation.length !== 4 ||
      ![0, 1, 2, 3].every((index) => Number.isFinite(rotation[index])) ||
      !Number.isFinite(norm) ||
      Math.abs(norm - 1) > 64 * Number.EPSILON
    )
      reject()
  }
  if (input.coverage !== null) {
    keys(input.coverage, ['visible', 'total'])
    const { visible, total } = input.coverage
    if (
      !Number.isSafeInteger(visible) ||
      !Number.isSafeInteger(total) ||
      visible < 0 ||
      total < visible
    )
      reject()
  }
  if (input.stem !== null) {
    keys(input.stem, ['targetId', 'recognized', 'cutSite'])
    if (
      input.stem.targetId !== input.targetId ||
      !choice(input.stem.recognized, [true, false]) ||
      (input.stem.cutSite !== null && !point(input.stem.cutSite))
    )
      reject()
  }
  keys(input.quality, ['spines', 'calyx', 'pedicel', 'contactDamage'])
  if (
    !choice(input.quality.spines, ['intact', 'lost']) ||
    !choice(input.quality.calyx, ['intact', 'lost']) ||
    !choice(input.quality.pedicel, ['intact', 'lost']) ||
    !choice(input.quality.contactDamage, ['observed', 'none-observed'])
  )
    reject()
  return freeze(input)
}

function readView(raw: ViewRequest): Immutable<ViewRequest> {
  const input = structuredClone(raw)
  keys(input, [
    'id',
    'source',
    'assumption',
    'runId',
    'generation',
    'missionRevision',
    'sceneRevision',
    'robotRevision',
    'dockRevision',
    'observedAt',
    'validFrom',
    'validUntil',
    'targetIds',
    'samplesPerTarget',
    'leaves',
    'fruits',
    'camera'
  ])
  if (
    input.source !== 'synthetic-viewpoint' ||
    !text(input.assumption) ||
    !text(input.id) ||
    !text(input.runId) ||
    ![
      input.generation,
      input.missionRevision,
      input.sceneRevision,
      input.robotRevision,
      input.dockRevision
    ].every((value) => Number.isSafeInteger(value) && value >= 0) ||
    ![input.observedAt, input.validFrom, input.validUntil].every(time) ||
    input.validUntil <= input.validFrom ||
    input.observedAt < input.validFrom ||
    input.observedAt >= input.validUntil ||
    !Array.isArray(input.targetIds) ||
    !Array.from(input.targetIds).every(text) ||
    new Set(input.targetIds).size !== input.targetIds.length ||
    !Number.isSafeInteger(input.samplesPerTarget) ||
    input.samplesPerTarget <= 0 ||
    input.samplesPerTarget > MAX_VIEW_SAMPLES ||
    input.targetIds.length * input.samplesPerTarget > MAX_VIEW_SAMPLES ||
    !['source-pose', 'unknown'].includes(input.leaves) ||
    !['all-attached', 'unknown'].includes(input.fruits)
  )
    reject()
  validateActionCamera(input.camera)
  return freeze(input)
}
function validateActionCamera(camera: Immutable<ViewRequest['camera']>) {
  keys(camera, ['pose', 'halfWidthSlope', 'halfHeightSlope', 'maxDistance'])
  if (
    ![camera.halfWidthSlope, camera.halfHeightSlope, camera.maxDistance].every(
      (value) => Number.isFinite(value) && value > 0
    )
  )
    reject()
  keys(camera.pose, ['position', 'rotation'])
  const { position, rotation } = camera.pose
  const norm =
    Array.isArray(rotation) && rotation.length === 4
      ? Math.hypot(...rotation)
      : NaN
  if (
    !point(position) ||
    !Array.isArray(rotation) ||
    ![0, 1, 2, 3].every((index) => Number.isFinite(rotation[index])) ||
    !Number.isFinite(norm) ||
    Math.abs(norm - 1) > 64 * Number.EPSILON
  )
    reject()
}
function inView(
  direction: readonly Interval[],
  camera: Immutable<ViewRequest['camera']>
): 'inside' | 'outside' | 'unknown' {
  if (
    !direction.every(
      (value) => Number.isFinite(value.low) && Number.isFinite(value.high)
    )
  )
    return 'unknown'
  const [x, y, z] = direction
  if (z.high <= 0) return 'outside'
  if (z.low <= 0) return 'unknown'
  const extent = (value: Interval) => ({
    low:
      value.low <= 0 && value.high >= 0
        ? 0
        : Math.min(Math.abs(value.low), Math.abs(value.high)),
    high: Math.max(Math.abs(value.low), Math.abs(value.high))
  })
  const axes = [
    [extent(x), multiply(interval(camera.halfWidthSlope), z)],
    [extent(y), multiply(interval(camera.halfHeightSlope), z)]
  ]
  if (axes.some((pair) => pair[0].low > pair[1].high)) return 'outside'
  if (
    axes.every(
      (pair) => Number.isFinite(pair[1].high) && pair[0].high <= pair[1].low
    )
  )
    return 'inside'
  return 'unknown'
}

function readAction(raw: ActionVolumeRequest): Immutable<ActionVolumeRequest> {
  const value = structuredClone(raw)
  const { actionId, actionBounds, optics, model, ...view } = value
  keys(value, [
    'id',
    'source',
    'assumption',
    'runId',
    'generation',
    'missionRevision',
    'sceneRevision',
    'robotRevision',
    'dockRevision',
    'observedAt',
    'validFrom',
    'validUntil',
    'leaves',
    'fruits',
    'camera',
    'actionId',
    'actionBounds',
    'optics',
    'model'
  ])
  if (value.source !== 'synthetic-action-volume/1' || !text(actionId)) reject()
  readView({
    ...view,
    source: 'synthetic-viewpoint',
    targetIds: [],
    samplesPerTarget: 1
  })
  validateActionFields(value)
  return freeze(value)
}
function validateActionFields(
  value: Pick<ActionVolumeRequest, 'actionBounds' | 'optics' | 'model'>
) {
  const { actionBounds, optics, model } = value
  keys(actionBounds, ['min', 'max'])
  if (
    !point(actionBounds.min) ||
    !point(actionBounds.max) ||
    actionBounds.min.some((v, axis) => v > actionBounds.max[axis])
  )
    reject()
  keys(optics, [
    'illumination',
    'filmTransmission',
    'weatherTransmission',
    'shadowFraction',
    'glare'
  ])
  const unit = (v: number) => Number.isFinite(v) && v >= 0 && v <= 1
  if (Object.values(optics).some((v) => v !== null && !unit(v))) reject()
  keys(model, [
    'format',
    'minSignal',
    'maxGlare',
    'maxCandidates',
    'maxRays',
    'maxActors'
  ])
  if (
    model.format !== 'synthetic-action-volume/1' ||
    !unit(model.minSignal) ||
    !unit(model.maxGlare) ||
    ![model.maxCandidates, model.maxRays, model.maxActors].every(
      (v) => Number.isSafeInteger(v) && v >= 0 && v <= 4096
    ) ||
    model.maxRays > MAX_VIEW_SAMPLES
  )
    reject()
}
function directionDistance(direction: Point3): Interval {
  const squared = direction.map((v) => multiply(interval(v), interval(v)))
  return squareRoot(add(add(squared[0], squared[1]), squared[2]))
}
/** Closed cuboid source intersection, restricted to the explicit synthetic model. */
function actorDistance(
  origin: Point3,
  direction: Point3,
  actor: SyntheticActorSource
): Interval | null | 'unknown' {
  if (
    actor.bounds.min.every(
      (v, i) => origin[i] >= v && origin[i] <= actor.bounds.max[i]
    )
  )
    return 'unknown'
  let entry = interval(0),
    exit: Interval = { low: Infinity, high: Infinity }
  for (let axis = 0; axis < 3; axis++) {
    if (direction[axis] === 0) {
      if (
        origin[axis] < actor.bounds.min[axis] ||
        origin[axis] > actor.bounds.max[axis]
      )
        return null
      continue
    }
    const a = divide(
      subtract(interval(actor.bounds.min[axis]), interval(origin[axis])),
      interval(direction[axis])
    )
    const b = divide(
      subtract(interval(actor.bounds.max[axis]), interval(origin[axis])),
      interval(direction[axis])
    )
    const near = direction[axis] > 0 ? a : b,
      far = direction[axis] > 0 ? b : a
    entry = {
      low: Math.max(entry.low, near.low),
      high: Math.max(entry.high, near.high)
    }
    exit = {
      low: Math.min(exit.low, far.low),
      high: Math.min(exit.high, far.high)
    }
  }
  if (entry.low > exit.high || exit.high < 0) return null
  if (entry.high > exit.low || !Number.isFinite(entry.high)) return 'unknown'
  return multiply(entry, directionDistance(direction))
}

/** Synthetic observation evidence only; never action or safety permission. */
export class TargetObservations {
  private readonly localRays: RayQueries
  private actions = new WeakMap<
    ActionVolumeObservation,
    { query: WalkingSceneCandidates; dynamic: SyntheticDynamicSnapshot }
  >()
  constructor(
    private readonly session: HarvestSession,
    private readonly geometry: QueryGeometry,
    private readonly owners: ObservationOwners,
    private readonly actionOwners?: {
      screen: WalkingTransitScreen
      dynamics: SyntheticDynamicSceneOwner
    }
  ) {
    this.localRays = new RayQueries(geometry)
    if (
      typeof owners?.isCurrentContext !== 'function' ||
      typeof owners?.isCurrentMission !== 'function'
    )
      reject()
  }
  private current(context: ObservationContext) {
    if (
      !context ||
      !this.owners.isCurrentContext(context) ||
      !this.owners.isCurrentMission(context.mission)
    )
      reject()
    const snapshot = this.session.getSnapshot()
    if (
      snapshot !== context.snapshot ||
      !snapshot.run ||
      !['running', 'paused', 'faulted'].includes(snapshot.lifecycle)
    )
      reject()
    const source = this.geometry.read(context.geometry)
    if (
      context.mission.scene !== source.receipt.scene ||
      context.mission.robot !== source.receipt.robot ||
      context.mission.revision !== source.receipt.revision
    )
      reject()
    return snapshot
  }
  private match(
    context: ObservationContext,
    input: ObservationBinding,
    snapshot: SessionSnapshot
  ) {
    const source = context.geometry.receipt
    if (
      input.runId !== snapshot.run?.id ||
      input.generation !== snapshot.generation ||
      input.missionRevision !== context.mission.revision ||
      input.sceneRevision !== source.scene.revision ||
      input.robotRevision !== source.robot.revision ||
      input.dockRevision !== source.dock.revision ||
      input.observedAt > snapshot.now ||
      input.validFrom > snapshot.now ||
      snapshot.now >= input.validUntil
    )
      reject()
  }
  isCurrentAction(result: ActionVolumeObservation): boolean {
    const issued = this.actions.get(result)
    if (!issued || !this.actionOwners) return false
    try {
      this.current(result.context)
      return (
        this.actionOwners.screen.isCurrentVolume(issued.query) &&
        this.actionOwners.dynamics.isCurrent(issued.dynamic)
      )
    } catch {
      return false
    }
  }

  observeActionVolume(
    context: ObservationContext,
    demand: SceneDemand,
    raw: ActionVolumeRequest
  ): ActionVolumeObservation {
    const snapshot = this.current(context),
      input = readAction(raw)
    this.match(context, input, snapshot)
    if (
      input.observedAt !== snapshot.now ||
      !this.actionOwners ||
      demand.scene !== context.geometry.receipt.scene
    )
      reject()
    const { screen, dynamics } = this.actionOwners
    const completed = observeActionKernel(
      this.geometry,
      this.localRays,
      context.geometry,
      demand,
      input,
      screen,
      dynamics,
      snapshot.run?.held.length === 0,
      (bounds) => screen.queryVolume(demand, bounds),
      () => {
        this.current(context)
      },
      (batch, candidates) => {
        if (!snapshot.run) return reject()
        return this.localRays.queryScoped(
          context.geometry,
          {
            ...batch,
            robot: {
              base: {
                position: snapshot.run.pose.base,
                rotation: [0, 0, 0, 1]
              },
              joints: snapshot.run.pose.joints
            }
          },
          candidates
        )
      }
    )
    const result: ActionVolumeObservation = Object.freeze({
      ...completed.result,
      input,
      format: 'action-volume-observation/1',
      context
    })
    this.actions.set(result, completed)
    return result
  }

  view(context: ObservationContext, raw: ViewRequest): ViewResult {
    const snapshot = this.current(context)
    const input = readView(raw)
    this.match(context, input, snapshot)
    if (input.observedAt !== snapshot.now) reject()
    const work = {
      cameraFrames: 0,
      partitionVisits: 0,
      placements: 0,
      rayBatches: 0
    }
    const source = context.geometry
    const targets = input.targetIds.map((id) => {
      const target = source.fruits.find((fruit) => fruit.id === id)
      if (!target) reject()
      return target
    })
    const selected: ViewSample[] = []
    for (const target of targets) {
      const ranges: {
        mesh: GeometryMesh
        instance: number
        start: number
        count: number
      }[] = []
      let total = 0
      for (const mesh of source.meshes) {
        const instance = mesh.plants?.indexOf(target.plant) ?? -1
        if (instance < 0) continue
        for (const part of mesh.partitions ?? []) {
          work.partitionVisits++
          if (part.fruitId !== target.source.id) continue
          const count = part.indexCount / 3
          ranges.push({ mesh, instance, start: part.indexStart / 3, count })
          total += count
        }
      }
      if (!Number.isSafeInteger(total) || total <= 0) reject()
      const count = Math.min(input.samplesPerTarget, total)
      for (let i = 0; i < count; i++) {
        let ordinal = Math.floor((i * total) / count)
        const range = ranges.find((item) => {
          if (ordinal < item.count) return true
          ordinal -= item.count
          return false
        })
        if (!range || range.mesh.shape.kind !== 'triangles') reject()
        const shape = range.mesh.shape,
          triangle = range.start + ordinal
        const local = [0, 1, 2].map((axis) => {
          const a = shape.positions[shape.indices[triangle * 3] * 3 + axis]
          const b = shape.positions[shape.indices[triangle * 3 + 1] * 3 + axis]
          const c = shape.positions[shape.indices[triangle * 3 + 2] * 3 + axis]
          return a / 3 + b / 3 + c / 3
        }) as unknown as Point3
        const position = this.geometry.placePoint(
          source,
          range.mesh,
          local,
          range.instance
        )
        work.placements++
        selected.push(
          Object.freeze({
            targetId: target.id,
            mesh: range.mesh,
            instance: range.instance,
            triangle,
            point: Object.freeze(position)
          })
        )
      }
    }
    const samples: SampleResult[] = []
    const eligible: { index: number; direction: [number, number, number] }[] =
      []
    const run = snapshot.run
    if (!run) reject()
    const known =
      input.leaves === 'source-pose' &&
      input.fruits === 'all-attached' &&
      run.held.length === 0
    const frame =
      selected.length && known ? prepareQueryFrame(input.camera.pose) : null
    if (frame) work.cameraFrames++
    for (const requested of selected) {
      const direction = requested.point.map(
        (value, axis) => value - input.camera.pose.position[axis]
      ) as [number, number, number]
      // FOV and ray queries use the actual computed floating direction above.
      // Occlusion compares against the requested point distance, retaining the
      // subtraction uncertainty instead of treating that direction as exact.
      const squared = requested.point.map((value, axis) => {
        const offset = subtract(
          interval(value),
          interval(input.camera.pose.position[axis])
        )
        return multiply(offset, offset)
      })
      const sampleDistance = squareRoot(
        add(add(squared[0], squared[1]), squared[2])
      )
      let status: SampleResult['status'] = 'unknown',
        reason: string | undefined = 'missing-current-scene-state'
      if (known && frame) {
        if (
          direction.every(Number.isFinite) &&
          direction.some((value) => value !== 0) &&
          Number.isFinite(sampleDistance.high)
        ) {
          const projection = inView(
            transformQueryDirection(frame, direction),
            input.camera
          )
          if (projection === 'inside') {
            eligible.push({ index: samples.length, direction })
            reason = undefined
          } else {
            status = projection === 'outside' ? 'outside-view' : 'unknown'
            reason = 'camera-frustum'
          }
        } else reason = 'uncertain-sample-direction'
      }
      samples.push({ requested, status, reason, sampleDistance })
    }
    let rays: ViewResult['rays']
    if (eligible.length) {
      work.rayBatches++
      rays = new RayQueries(this.geometry).query(source, {
        source: 'synthetic',
        time: snapshot.now,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        leaves: input.leaves,
        fruits: input.fruits,
        robot: {
          base: { position: run.pose.base, rotation: [0, 0, 0, 1] },
          joints: run.pose.joints
        },
        rays: eligible.map((item) => ({
          origin: [...input.camera.pose.position],
          direction: item.direction,
          maxDistance: input.camera.maxDistance
        }))
      })
      eligible.forEach((item, index) => {
        const sample = samples[item.index],
          ray = rays?.results[index]
        if (!ray) reject()
        let status: SampleResult['status'] = 'unknown',
          reason = 'unresolved-sample'
        if (ray.status === 'hit') {
          const target = targets.find(
            (fruit) => fruit.id === sample.requested.targetId
          )
          const same =
            target &&
            ray.mesh.plants?.[ray.instance] === target.plant &&
            ray.mesh.partitions?.some(
              (part) =>
                part.fruitId === target.source.id &&
                ray.triangle * 3 >= part.indexStart &&
                ray.triangle * 3 < part.indexStart + part.indexCount
            )
          if (same) {
            status = 'visible'
            reason = 'target-surface-ray'
          } else if (ray.distanceBounds.high < sample.sampleDistance.low) {
            status = 'occluded'
            reason = 'nearer-geometric-surface'
          } else reason = 'non-target-distance-unresolved'
        } else if (ray.status === 'unknown') reason = ray.reason
        samples[item.index] = { ...sample, status, reason, ray }
      })
    }
    const coverage = {
      total: samples.length,
      visible: 0,
      occluded: 0,
      outsideView: 0,
      unknown: 0
    }
    for (const sample of samples)
      coverage[
        sample.status === 'outside-view' ? 'outsideView' : sample.status
      ]++
    this.current(context)
    const result: ViewResult = {
      context,
      input,
      samples,
      coverage,
      work,
      ...(rays ? { rays } : {})
    }
    for (const sample of samples) {
      Object.freeze(sample.sampleDistance)
      Object.freeze(sample)
    }
    Object.freeze(samples)
    Object.freeze(coverage)
    Object.freeze(work)
    // Context and ray/source handles belong to their issuing owners.
    return Object.freeze(result)
  }
  assessQuality(
    context: ObservationContext,
    raw: TargetReading
  ): SyntheticQualityAssessment {
    const observation = this.admit(context, raw)
    const { cultivar, quality } = observation.reading
    const preservation = (
      value: 'intact' | 'lost' | null
    ): QualityRequirement => {
      if (value === null) return 'unknown'
      return value === 'intact' ? 'satisfied' : 'not-satisfied'
    }
    const applicable = (
      crop: CropSpecies,
      value: 'intact' | 'lost' | null
    ): QualityRequirement => {
      if (cultivar === null) return 'unknown'
      return cultivar === crop ? preservation(value) : 'not-applicable'
    }
    let contactDamage: QualityRequirement = 'unknown'
    if (quality.contactDamage === 'observed') contactDamage = 'not-satisfied'
    if (quality.contactDamage === 'none-observed') contactDamage = 'satisfied'
    const requirements = Object.freeze({
      spines: applicable('cucumber-1914', quality.spines),
      calyx: applicable('tomato-yu-nu', quality.calyx),
      pedicel: applicable('tomato-yu-nu', quality.pedicel),
      contactDamage
    })
    let status: SyntheticQualityAssessment['status'] = 'unknown'
    if (cultivar !== null) {
      const values = Object.values(requirements)
      if (values.includes('not-satisfied')) status = 'not-satisfied'
      else if (!values.includes('unknown')) status = 'satisfied'
    }
    return Object.freeze({
      observation,
      requirements,
      status,
      physicalIntegrity: 'unverified'
    })
  }
  admit(
    context: ObservationContext,
    raw: TargetReading
  ): AdmittedTargetReading {
    const snapshot = this.current(context)
    const input = readTarget(raw)
    this.match(context, input, snapshot)
    // Membership is identity validation, never a visibility/maturity lookup.
    const target = context.geometry.fruits.find(
      (fruit) => fruit.id === input.targetId
    )
    if (
      !target ||
      (input.cultivar !== null && input.cultivar !== target.plant.species)
    )
      reject()
    this.current(context)
    return Object.freeze({ context, reading: input })
  }
}

export type WalkingActionVolumeRequest = Omit<
  ActionVolumeRequest,
  'missionRevision' | 'sceneRevision' | 'robotRevision' | 'dockRevision'
>
export interface WalkingActionObservationContext {
  readonly report: Exclude<WalkingOperatingReport, { status: 'legacy-view' }>
  readonly demand: SceneDemand
  readonly source: WalkingRobotSource
  readonly geometry: WalkingObservationGeometrySource
  readonly generation: number
  readonly runId: string
  readonly now: number
  readonly sensorIdentity: Readonly<object>
}
export interface WalkingActionVolumeObservation extends Omit<
  ActionVolumeObservation,
  'format' | 'context' | 'input'
> {
  readonly format: 'walking-action-volume-observation/1'
  readonly context: WalkingActionObservationContext
  readonly input: Immutable<WalkingActionVolumeRequest>
}
function readWalkingAction(
  raw: WalkingActionVolumeRequest
): Immutable<WalkingActionVolumeRequest> {
  const input = structuredClone(raw)
  keys(input, [
    'id',
    'source',
    'assumption',
    'runId',
    'generation',
    'observedAt',
    'validFrom',
    'validUntil',
    'leaves',
    'fruits',
    'camera',
    'actionId',
    'actionBounds',
    'optics',
    'model'
  ])
  if (
    input.source !== 'synthetic-action-volume/1' ||
    !text(input.id) ||
    !text(input.actionId) ||
    !text(input.assumption) ||
    !text(input.runId) ||
    !Number.isSafeInteger(input.generation) ||
    input.generation < 0 ||
    ![input.observedAt, input.validFrom, input.validUntil].every(time) ||
    input.validUntil <= input.validFrom ||
    input.observedAt < input.validFrom ||
    input.observedAt >= input.validUntil ||
    !['source-pose', 'unknown'].includes(input.leaves) ||
    !['all-attached', 'unknown'].includes(input.fruits)
  )
    reject()
  validateActionCamera(input.camera)
  validateActionFields(input)
  return freeze(input)
}

/** Walking receipt adapter around the same bounded optical kernel. */
export class WalkingActionObservations {
  private readonly localRays: RayQueries
  private issued = new WeakMap<
    WalkingActionVolumeObservation,
    {
      query: WalkingSceneCandidates
      dynamic: SyntheticDynamicSnapshot
      space: SceneObservationSpace
    }
  >()
  private closed = false
  constructor(
    private readonly geometry: QueryGeometry,
    private readonly owners: {
      prepareObservationSpace(demand: SceneDemand): SceneObservationSpace
      isCurrentObservationSpace(space: SceneObservationSpace): boolean
      isCurrentContext(context: WalkingActionObservationContext): boolean
      screen: WalkingTransitScreen
      dynamics: SyntheticDynamicSceneOwner
    }
  ) {
    this.localRays = new RayQueries(geometry)
  }
  private current(context: WalkingActionObservationContext) {
    if (this.closed || !this.owners.isCurrentContext(context)) reject()
    const source = this.geometry.read(context.geometry)
    if (
      source.receipt.source !== context.source ||
      source.receipt.demand !== context.demand ||
      context.report.source !== context.source ||
      context.report.demand !== context.demand ||
      !Number.isSafeInteger(context.generation) ||
      context.generation < 0 ||
      !text(context.runId) ||
      !time(context.now)
    )
      reject()
  }
  observeActionVolume(
    context: WalkingActionObservationContext,
    raw: WalkingActionVolumeRequest
  ): WalkingActionVolumeObservation {
    this.current(context)
    const input = readWalkingAction(raw)
    if (
      input.runId !== context.runId ||
      input.generation !== context.generation ||
      input.observedAt !== context.now ||
      context.now < input.validFrom ||
      context.now >= input.validUntil
    )
      reject()
    const space = this.owners.prepareObservationSpace(context.demand)
    if (
      !isSceneObservationSpace(context.demand, space) ||
      !this.owners.isCurrentObservationSpace(space)
    )
      reject()
    const completed = observeActionKernel(
      this.geometry,
      this.localRays,
      context.geometry,
      context.demand,
      input,
      this.owners.screen,
      this.owners.dynamics,
      context.report.load.kind === 'empty',
      (bounds) =>
        this.owners.screen.queryObservationVolume(
          context.demand,
          space,
          bounds
        ),
      () => {
        this.current(context)
      },
      (batch, candidates) =>
        this.localRays.queryWalkingWorld(context.geometry, batch, candidates)
    )
    const result: WalkingActionVolumeObservation = Object.freeze({
      ...completed.result,
      input,
      format: 'walking-action-volume-observation/1',
      context
    })
    this.issued.set(result, { ...completed, space })
    return result
  }
  isCurrent(result: WalkingActionVolumeObservation): boolean {
    const issued = this.issued.get(result)
    if (!issued) return false
    try {
      this.current(result.context)
      return (
        this.owners.isCurrentObservationSpace(issued.space) &&
        isSceneObservationSpace(result.context.demand, issued.space) &&
        this.owners.screen.isCurrentVolume(issued.query) &&
        this.owners.dynamics.isCurrent(issued.dynamic)
      )
    } catch {
      return false
    }
  }
  close() {
    this.closed = true
    this.issued = new WeakMap()
  }
}

function observeActionKernel(
  geometry: QueryGeometry,
  localRays: RayQueries,
  source: QueryGeometrySource,
  demand: SceneDemand,
  input: Immutable<WalkingActionVolumeRequest>,
  screen: WalkingTransitScreen,
  dynamics: SyntheticDynamicSceneOwner,
  emptyLoad: boolean,
  queryVolume: (
    bounds: WalkingSceneCandidates['bounds']
  ) => WalkingSceneCandidates,
  current: () => void,
  queryRays: (
    batch: WalkingWorldRayBatch,
    candidates: readonly CanonicalRayCandidate[]
  ) => Pick<RayBatchResult, 'results' | 'work'>
) {
  const work = {
    cameraFrames: 1,
    sightQueries: 1,
    rayBatches: 0,
    samples: 0,
    sourceActorVisits: 0,
    membershipBuilds: 0,
    candidateVisits: 0,
    indexBuilds: 0,
    membershipVisits: 0,
    placementMembershipChecks: 0,
    placements: 0,
    rayInstances: 0,
    rayTriangles: 0,
    dynamicRayTests: 0
  }
  const before = { ...localRays.scopeWork }
  const indexBefore = screen.work.builds
  const placementBefore = geometry.placementWork
  const reasons: string[] = []
  const corners = Array.from(
    { length: 8 },
    (_, i) =>
      [0, 1, 2].map((axis) =>
        i & (1 << axis)
          ? input.actionBounds.max[axis]
          : input.actionBounds.min[axis]
      ) as unknown as Point3
  )
  const camera = input.camera,
    origin = camera.pose.position
  const min = input.actionBounds.min.map((v, i) =>
    Math.min(v, origin[i])
  ) as unknown as Point3
  const max = input.actionBounds.max.map((v, i) =>
    Math.max(v, origin[i])
  ) as unknown as Point3
  const sightBounds = freeze({ min, max })
  const frame = prepareQueryFrame(camera.pose)
  let contained = true
  for (const corner of corners) {
    const direction = corner.map((v, i) =>
      subtract(interval(v), interval(origin[i]))
    ) as [Interval, Interval, Interval]
    const squared = direction.map((v) => multiply(v, v))
    const distance = squareRoot(add(add(squared[0], squared[1]), squared[2]))
    if (
      inView(transformQueryDirectionBounds(frame, direction), camera) !==
        'inside' ||
      !Number.isFinite(distance.high) ||
      distance.high > camera.maxDistance
    )
      contained = false
  }
  if (!contained) reasons.push('incomplete-frustum-or-range')
  const o = input.optics
  let signal: Interval = { low: 0, high: 1 }
  let reliabilityStatus: ActionVolumeObservation['reliability']['status'] =
    'unknown'
  const glare = o.glare === null ? { low: 0, high: 1 } : interval(o.glare)
  if (
    o.illumination !== null &&
    o.filmTransmission !== null &&
    o.weatherTransmission !== null &&
    o.shadowFraction !== null &&
    o.glare !== null
  ) {
    signal = multiply(
      multiply(
        multiply(interval(o.illumination), interval(o.filmTransmission)),
        interval(o.weatherTransmission)
      ),
      subtract(interval(1), interval(o.shadowFraction))
    )
    reliabilityStatus =
      signal.low > input.model.minSignal && glare.high < input.model.maxGlare
        ? 'reliable'
        : 'insufficient'
  }
  const reliability = freeze({
    signal,
    glare,
    status: reliabilityStatus
  })
  if (reliability.status !== 'reliable')
    reasons.push('insufficient-synthetic-optics')
  const query = queryVolume({
    ...sightBounds,
    size: max.map(
      (v, i) => subtract(interval(v), interval(min[i])).high
    ) as unknown as Point3
  })
  if (query.reasons.includes('stale-scene-demand')) reject()
  if (query.coverage !== 'covered') reasons.push(...query.reasons)
  const dynamic = dynamics.readAt(
    input.observedAt,
    sightBounds,
    input.model.maxActors
  )
  work.sourceActorVisits = dynamic.work.sourceActorVisits
  if (dynamic.coverage !== 'covered') reasons.push(...dynamic.reasons)
  const count = query.affected.length + dynamic.candidates.length
  let unvisited = dynamic.unvisited
  const candidates: CanonicalRayCandidate[] = []
  const positions: Point3[] = []
  if (count > input.model.maxCandidates) {
    unvisited += count
    reasons.push('candidate-budget')
  }
  const eligible =
    !reasons.length &&
    input.leaves === 'source-pose' &&
    input.fruits === 'all-attached' &&
    emptyLoad
  if (!eligible && !reasons.length) reasons.push('missing-current-scene-state')
  if (eligible) {
    for (const item of query.affected) {
      if (item.kind !== 'source') {
        reasons.push('unsupported-optical-source')
        unvisited++
        continue
      }
      const mesh = localRays.resolveSource(source, item.mesh)
      if (
        !mesh ||
        mesh.shape.kind !== 'triangles' ||
        !mesh.origin.regions.includes(item.region)
      ) {
        reasons.push('missing-canonical-source')
        unvisited++
        continue
      }
      candidates.push({ mesh, region: item.region, instance: item.instance })
      const shape = mesh.shape,
        start = item.region.indexStart
      const local = [0, 1, 2].map(
        (axis) =>
          shape.positions[shape.indices[start] * 3 + axis] / 3 +
          shape.positions[shape.indices[start + 1] * 3 + axis] / 3 +
          shape.positions[shape.indices[start + 2] * 3 + axis] / 3
      ) as unknown as Point3
      positions.push(geometry.placePoint(source, mesh, local, item.instance))
    }
    for (const actor of dynamic.candidates)
      positions.push(
        actor.bounds.min.map(
          (v, i) => v / 2 + actor.bounds.max[i] / 2
        ) as unknown as Point3
      )
  }
  const directions: Point3[] = []
  if (!reasons.length)
    for (const position of positions) {
      if (directions.length >= input.model.maxRays) {
        unvisited++
        continue
      }
      const direction = position.map(
        (v, i) => v - origin[i]
      ) as unknown as Point3
      if (
        direction.some((v) => !Number.isFinite(v)) ||
        !direction.some((v) => v !== 0) ||
        inView(transformQueryDirection(frame, direction), camera) !== 'inside'
      ) {
        unvisited++
        continue
      }
      directions.push(direction)
    }
  work.samples = directions.length
  let rays: Pick<RayBatchResult, 'results' | 'work'> | undefined
  if (directions.length && candidates.length) {
    work.rayBatches++
    rays = queryRays(
      {
        source: 'synthetic',
        time: input.observedAt,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        leaves: input.leaves,
        fruits: input.fruits,
        rays: directions.map((direction) => ({
          origin: [...origin],
          direction: [...direction],
          maxDistance: camera.maxDistance
        }))
      },
      candidates
    )
    work.rayInstances = rays.work.instances
    work.rayTriangles = rays.work.triangles
  }
  const detections: ActionDetection[] = []
  const staticSeen = new Set<string>(),
    actorSeen = new Set<string>()
  const visibleDistance = (direction: Point3, distance: Interval): boolean => {
    const normalized = directionBounds(direction)
    if (
      distance.low <= 0 ||
      !Number.isFinite(distance.high) ||
      distance.high > camera.maxDistance ||
      inView(transformQueryDirectionBounds(frame, normalized), camera) !==
        'inside'
    ) {
      reasons.push('unresolved-ray-view')
      return false
    }
    const position = normalized.map((v, axis) =>
      add(interval(origin[axis]), multiply(v, distance))
    )
    if (
      !position.every(
        (v, axis) =>
          v.low >= sightBounds.min[axis] && v.high <= sightBounds.max[axis]
      )
    ) {
      reasons.push('ray-witness-outside-sight')
      return false
    }
    return true
  }
  directions.forEach((direction, i) => {
    const hit = rays?.results[i]
    const actorHits: { actor: SyntheticActorSource; distance: Interval }[] = []
    let uncertain = hit?.status === 'unknown'
    for (const actor of dynamic.candidates) {
      work.dynamicRayTests++
      const distance = actorDistance(origin, direction, actor)
      if (distance === 'unknown') uncertain = true
      else if (distance && distance.low <= camera.maxDistance) {
        if (distance.high > camera.maxDistance) uncertain = true
        else actorHits.push({ actor, distance })
      }
    }
    if (uncertain) {
      reasons.push('unresolved-ray')
      return
    }
    const first = actorHits.find((a) =>
      actorHits.every((b) => a === b || a.distance.high < b.distance.low)
    )
    if (
      first &&
      (!hit ||
        hit.status === 'miss' ||
        (hit.status === 'hit' && first.distance.high < hit.distanceBounds.low))
    ) {
      if (!visibleDistance(direction, first.distance)) return
      if (!actorSeen.has(first.actor.trackId)) {
        actorSeen.add(first.actor.trackId)
        detections.push(
          Object.freeze({
            kind: 'dynamic',
            trackId: first.actor.trackId,
            actorKind: first.actor.kind,
            motion: first.actor.motion,
            bounds: first.actor.bounds,
            sourceIdentity: first.actor.identity,
            distance: Object.freeze(first.distance)
          })
        )
      }
    } else if (
      hit?.status === 'hit' &&
      actorHits.every((a) => hit.distanceBounds.high < a.distance.low)
    ) {
      if (!visibleDistance(direction, hit.distanceBounds)) return
      const candidate = candidates.find(
        (c) =>
          c.mesh === hit.mesh &&
          c.instance === hit.instance &&
          hit.triangle * 3 >= c.region.indexStart &&
          hit.triangle * 3 < c.region.indexStart + c.region.indexCount
      )
      if (!candidate) {
        reasons.push('unmapped-ray-witness')
        return
      }
      const key = candidates.indexOf(candidate) + ':' + hit.triangle
      if (staticSeen.has(key)) return
      staticSeen.add(key)
      const anatomy =
        'sourceAnatomy' in hit.mesh.origin
          ? hit.mesh.origin.sourceAnatomy
          : undefined
      detections.push(
        Object.freeze({
          kind: 'static',
          mesh: hit.mesh,
          region: candidate.region,
          instance: hit.instance,
          ray: hit,
          anatomy: Object.freeze(
            (anatomy?.patches ?? []).filter(
              (p) =>
                p.source.region === candidate.region &&
                p.source.ranges.some(
                  (r) =>
                    hit.triangle * 3 >= r.indexStart &&
                    hit.triangle * 3 < r.indexStart + r.indexCount
                )
            )
          )
        })
      )
    }
  })
  if (unvisited) reasons.push('unvisited-observation-work')
  if (count) reasons.push('candidate-volume-is-not-complete-visibility')
  current()
  if (
    !dynamics.isCurrent(dynamic) ||
    (query.coverage === 'covered' && !screen.isCurrentVolume(query))
  )
    reject()
  work.indexBuilds = screen.work.builds - indexBefore
  work.candidateVisits =
    localRays.scopeWork.candidateVisits - before.candidateVisits
  work.membershipBuilds =
    localRays.scopeWork.membershipBuilds - before.membershipBuilds
  work.membershipVisits =
    localRays.scopeWork.membershipVisits - before.membershipVisits
  work.placementMembershipChecks =
    geometry.placementWork.membershipChecks - placementBefore.membershipChecks
  work.placements =
    geometry.placementWork.placements - placementBefore.placements
  let coverage: ActionVolumeObservation['coverage'] = 'unknown'
  if (!reasons.length && !count && !unvisited) coverage = 'complete-empty'
  else if (
    detections.length ||
    (query.coverage === 'covered' &&
      dynamic.coverage === 'covered' &&
      reliability.status === 'reliable' &&
      contained)
  )
    coverage = 'partial'
  const result = Object.freeze({
    identity: Object.freeze({}),
    provenance: 'w1-canonical-obstacles/1',
    demandIdentity: demand.identity,
    dynamicIdentity: dynamic.definitionIdentity,
    dynamicRevision: dynamic.revision,
    input,
    sightBounds,
    reliability,
    coverage,
    detections: Object.freeze(detections),
    unvisited,
    reasons: Object.freeze([...new Set(reasons)]),
    work: Object.freeze(work)
  })
  return { result, query, dynamic }
}
