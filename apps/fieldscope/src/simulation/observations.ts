import type { CropSpecies } from '../domain/crop-layout'
import type { CropFruit } from '../domain/crop-models'
import type { Point3 } from '../domain/greenhouse'
import type { RigidTransform } from '../domain/robot-kinematics'
import type { CanonicalMission } from './contracts'
import { QueryGeometry, type GeometrySource } from './geometry'
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
    contactDamage: 'observed' | 'none-observed' | null
  }
}
type Immutable<T> = T extends object
  ? { readonly [K in keyof T]: Immutable<T[K]> }
  : T
export interface AdmittedTargetReading {
  readonly context: ObservationContext
  readonly reading: Immutable<TargetReading>
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
  keys(input.quality, ['spines', 'calyx', 'contactDamage'])
  if (
    !choice(input.quality.spines, ['intact', 'lost']) ||
    !choice(input.quality.calyx, ['intact', 'lost']) ||
    !choice(input.quality.contactDamage, ['observed', 'none-observed'])
  )
    reject()
  return freeze(input)
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
  admit(
    context: ObservationContext,
    raw: TargetReading
  ): AdmittedTargetReading {
    const snapshot = this.current(context)
    const input = readTarget(raw)
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
