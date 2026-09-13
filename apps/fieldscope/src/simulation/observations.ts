import type { CropSpecies } from '../domain/crop-layout'
import type { CropFruit } from '../domain/crop-models'
import type { Point3 } from '../domain/greenhouse'
import type { RigidTransform } from '../domain/robot-kinematics'
import type { CanonicalMission } from './contracts'
import {
  QueryGeometry,
  type GeometrySource,
  type GeometryMesh
} from './geometry'
import {
  RayQueries,
  prepareQueryFrame,
  transformQueryDirection,
  type RayResult
} from './ray-query'
import {
  interval,
  add,
  subtract,
  multiply,
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
  keys(input.camera, [
    'pose',
    'halfWidthSlope',
    'halfHeightSlope',
    'maxDistance'
  ])
  if (
    ![
      input.camera.halfWidthSlope,
      input.camera.halfHeightSlope,
      input.camera.maxDistance
    ].every((value) => Number.isFinite(value) && value > 0)
  )
    reject()
  keys(input.camera.pose, ['position', 'rotation'])
  const { position, rotation } = input.camera.pose
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
  return freeze(input)
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

/** Validates injected assumptions only; no detection, action or inventory owner. */
export class TargetObservations {
  constructor(
    private readonly session: HarvestSession,
    private readonly geometry: QueryGeometry,
    private readonly owners: ObservationOwners
  ) {
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
