import type { PreparedScene } from '../render-app/site-geometry'
import type {
  SceneDemand,
  SceneObservationSpace,
  SceneDemandSourceWork
} from '../simulation/scene-demand'
import {
  QueryGeometry,
  type WalkingObservationGeometryReceipt
} from '../simulation/geometry'
import {
  WalkingActionObservations,
  type WalkingActionObservationContext,
  type WalkingActionVolumeObservation,
  type ActionVolumeRequest
} from '../simulation/observations'
import {
  SyntheticDynamicSceneOwner,
  type SyntheticDynamicDefinition,
  type SyntheticSourceBounds
} from '../simulation/synthetic-dynamic-scene'
import type { WalkingTransitScreen } from '../simulation/walking-transit-screen'
import type { WalkingOperatingReport } from './walking-operating-workspace'
import type { WalkingRigidTransform } from '../domain/walking-robot-definition'
import { transformRobotPoint } from '../domain/robot-kinematics'
import type {
  WalkingConstrainedCycleOwner,
  WalkingConstrainedCycle,
  WalkingSelectedChainMotion
} from '../domain/walking-constrained-kinematics'
import { dyadic, roundFraction } from '../domain/scalar-arithmetic'

export interface WalkingSelectedObservationBinding {
  readonly owner: WalkingConstrainedCycleOwner
  readonly cycle: WalkingConstrainedCycle
  readonly motion: WalkingSelectedChainMotion
}
export interface WalkingSelectedObservationAction extends WalkingObservationAction {
  readonly binding: WalkingSelectedObservationBinding
}
type WorkspaceObservation = WalkingActionVolumeObservation & {
  readonly context: WalkingActionObservationContext & {
    readonly motion?: WalkingSelectedChainMotion
  }
}
function currentMotion(binding: WalkingSelectedObservationBinding) {
  try {
    keys(binding, ['owner', 'cycle', 'motion'])
    return (
      binding.motion.cycle === binding.cycle &&
      binding.owner.read(binding.motion.source, binding.cycle.recipe) ===
        binding.cycle &&
      binding.owner.readSelectedChainMotion(binding.cycle, binding.motion) ===
        binding.motion
    )
  } catch {
    return false
  }
}
function sameOrientation(
  motion: WalkingSelectedChainMotion,
  rotation: WalkingRigidTransform['rotation']
) {
  const scalars = rotation.map(dyadic)
  const exponent = Math.min(...scalars.map((v) => v.exponent))
  const [x, y, z, w] = scalars.map(
    (v) => v.significand << BigInt(v.exponent - exponent)
  )
  const xx = x * x,
    yy = y * y,
    zz = z * z,
    ww = w * w,
    norm = xx + yy + zz + ww
  if (norm <= 0n) return false
  const matrix = [
    [ww + xx - yy - zz, 2n * (x * y - z * w), 2n * (x * z + y * w)],
    [2n * (x * y + z * w), ww + yy - xx - zz, 2n * (y * z - x * w)],
    [2n * (x * z - y * w), 2n * (y * z + x * w), ww + zz - xx - yy]
  ]
  return motion.root.matrix.every((row, i) =>
    row.every((v, j) => v.numerator * norm === matrix[i][j] * v.denominator)
  )
}

export interface WalkingObservationScenario {
  readonly format: 'walking-observation-scenario/1'
  readonly id: string
  readonly assumption: string
  readonly validFrom: number
  readonly validUntil: number
  readonly camera: {
    readonly bodyId: 'base'
    readonly localPose: WalkingRigidTransform
    readonly halfWidthSlope: number
    readonly halfHeightSlope: number
    readonly maxDistance: number
  }
  readonly optics: ActionVolumeRequest['optics']
  readonly model: ActionVolumeRequest['model']
  readonly leaves: 'source-pose'
  readonly fruits: 'all-attached'
}
export interface WalkingObservationAction {
  readonly actionId: string
  readonly actionBounds: SyntheticSourceBounds
  readonly now: number
  readonly validUntil: number
}
export type WalkingObservationResult =
  | Readonly<{ status: 'unavailable'; reason: string }>
  | Readonly<{
      status: 'available'
      observation: WorkspaceObservation
      work: Readonly<{
        farmMembershipBuilds: number
        bodyFrameVisits: number
        cameraMounts: number
        sourcePreparation: SceneDemandSourceWork
      }>
    }>

const freeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const invalid = (): never => {
  throw new Error('Invalid walking observation scenario')
}
function keys(value: object, expected: readonly string[]) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== expected.length ||
    Object.keys(value).some((key) => !expected.includes(key))
  )
    invalid()
}
const finite = (v: number) => Number.isFinite(v)
const point = (v: readonly number[], size: number) =>
  Array.isArray(v) &&
  v.length === size &&
  Array.from({ length: size }, (_, i) => v[i]).every(finite)
function readScenario(
  raw: WalkingObservationScenario
): WalkingObservationScenario {
  const value = structuredClone(raw)
  keys(value, [
    'format',
    'id',
    'assumption',
    'validFrom',
    'validUntil',
    'camera',
    'optics',
    'model',
    'leaves',
    'fruits'
  ])
  if (
    value.format !== 'walking-observation-scenario/1' ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.assumption !== 'string' ||
    !value.assumption.trim() ||
    !finite(value.validFrom) ||
    value.validFrom < 0 ||
    !finite(value.validUntil) ||
    value.validUntil <= value.validFrom ||
    value.leaves !== 'source-pose' ||
    value.fruits !== 'all-attached'
  )
    invalid()
  const camera = value.camera
  keys(camera, [
    'bodyId',
    'localPose',
    'halfWidthSlope',
    'halfHeightSlope',
    'maxDistance'
  ])
  keys(camera.localPose, ['position', 'rotation'])
  if (
    camera.bodyId !== 'base' ||
    !point(camera.localPose.position, 3) ||
    !point(camera.localPose.rotation, 4) ||
    Math.abs(Math.hypot(...camera.localPose.rotation) - 1) >
      64 * Number.EPSILON ||
    ![camera.halfWidthSlope, camera.halfHeightSlope, camera.maxDistance].every(
      (v) => finite(v) && v > 0
    )
  )
    invalid()
  const unit = (v: number) => finite(v) && v >= 0 && v <= 1
  keys(value.optics, [
    'illumination',
    'filmTransmission',
    'weatherTransmission',
    'shadowFraction',
    'glare'
  ])
  if (Object.values(value.optics).some((v) => v !== null && !unit(v))) invalid()
  keys(value.model, [
    'format',
    'minSignal',
    'maxGlare',
    'maxCandidates',
    'maxRays',
    'maxActors'
  ])
  if (
    value.model.format !== 'synthetic-action-volume/1' ||
    !unit(value.model.minSignal) ||
    !unit(value.model.maxGlare) ||
    ![
      value.model.maxCandidates,
      value.model.maxRays,
      value.model.maxActors
    ].every((v) => Number.isSafeInteger(v) && v >= 0 && v <= 4096) ||
    value.model.maxRays > 64
  )
    invalid()
  return freeze(value)
}
function mountCamera(
  parent: WalkingRigidTransform,
  local: WalkingRigidTransform
): WalkingRigidTransform {
  const a = parent.rotation,
    b = local.rotation
  return freeze({
    position: transformRobotPoint(parent, local.position),
    rotation: [
      a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
      a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
      a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
      a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
    ] as const
  })
}

/** Production composition of walking source, explicit synthetic optics and W3a's existing index. */
export function createWalkingObservationWorkspace(owners: {
  getOperating(): WalkingOperatingReport
  isCurrentOperating(value: WalkingOperatingReport): boolean
  getDemand(): SceneDemand
  isCurrentDemand(value: SceneDemand): boolean
  prepareObservationSpace(demand: SceneDemand): SceneObservationSpace
  isCurrentObservationSpace(space: SceneObservationSpace): boolean
  getSourceWork(): SceneDemandSourceWork
  getScene(): PreparedScene
  isCurrentScene(value: PreparedScene): boolean
  screen: WalkingTransitScreen
}) {
  let closed = false,
    generation = 0,
    now = 0
  let scenario: WalkingObservationScenario | undefined
  let receipt: WalkingObservationGeometryReceipt | undefined
  let latest: WalkingActionVolumeObservation | undefined
  let dynamics: SyntheticDynamicSceneOwner | undefined =
    new SyntheticDynamicSceneOwner()
  const live = () => {
    if (closed) throw new Error('Walking observation workspace is closed')
  }
  const currentReceipt = (value: WalkingObservationGeometryReceipt) =>
    !closed &&
    receipt === value &&
    owners.getScene() === value.scene &&
    owners.isCurrentScene(value.scene) &&
    owners.getDemand() === value.demand &&
    owners.isCurrentDemand(value.demand) &&
    (() => {
      const report = owners.getOperating()
      return (
        report.status !== 'legacy-view' &&
        report.source === value.source &&
        owners.isCurrentOperating(report)
      )
    })()
  const geometry = new QueryGeometry({
    isCurrentWalkingReceipt: currentReceipt,
    isCurrentScene: owners.isCurrentScene,
    isCurrentDemand: owners.isCurrentDemand,
    isCurrentWalkingSource: (source) => {
      const report = owners.getOperating()
      return (
        !closed &&
        report.status !== 'legacy-view' &&
        report.source === source &&
        owners.isCurrentOperating(report)
      )
    }
  })
  const contexts = new WeakSet<WalkingActionObservationContext>()
  const selectedContexts = new WeakMap<
    WalkingActionObservationContext,
    WalkingSelectedObservationBinding
  >()
  const currentContext = (context: WalkingActionObservationContext) => {
    const binding = selectedContexts.get(context)
    return (
      !closed &&
      contexts.has(context) &&
      (!binding || currentMotion(binding)) &&
      context.report === owners.getOperating() &&
      owners.isCurrentOperating(context.report) &&
      context.demand === owners.getDemand() &&
      owners.isCurrentDemand(context.demand) &&
      context.source === context.report.source &&
      currentReceipt(context.geometry.receipt) &&
      context.generation === generation &&
      context.sensorIdentity === scenario &&
      context.now === now &&
      !!scenario &&
      now >= scenario.validFrom &&
      now < scenario.validUntil
    )
  }
  let observations: WalkingActionObservations | undefined =
    new WalkingActionObservations(geometry, {
      prepareObservationSpace: owners.prepareObservationSpace,
      isCurrentObservationSpace: owners.isCurrentObservationSpace,
      isCurrentContext: currentContext,
      screen: owners.screen,
      dynamics
    })
  const isCurrent = (value: WalkingActionVolumeObservation) =>
    !closed && !!observations?.isCurrent(value) && now < value.input.validUntil
  const observe = (
    raw: WalkingObservationAction,
    binding?: WalkingSelectedObservationBinding
  ): WalkingObservationResult => {
    live()
    const action = structuredClone(raw)
    keys(action, ['actionId', 'actionBounds', 'now', 'validUntil'])
    keys(action.actionBounds, ['min', 'max'])
    if (
      typeof action.actionId !== 'string' ||
      !action.actionId.trim() ||
      !finite(action.now) ||
      action.now < 0 ||
      !finite(action.validUntil) ||
      action.validUntil <= action.now ||
      !point(action.actionBounds.min, 3) ||
      !point(action.actionBounds.max, 3) ||
      action.actionBounds.min.some((v, i) => v > action.actionBounds.max[i])
    )
      invalid()
    now = action.now
    latest = undefined
    const unavailable = (reason: string): WalkingObservationResult =>
      Object.freeze({ status: 'unavailable', reason })
    if (!scenario || !observations)
      return unavailable('missing-walking-observation-scenario')
    if (
      now < scenario.validFrom ||
      now >= scenario.validUntil ||
      action.validUntil > scenario.validUntil
    )
      return unavailable('outside-walking-observation-scenario-time')
    const report = owners.getOperating(),
      demand = owners.getDemand(),
      scene = owners.getScene()
    if (report.status === 'legacy-view')
      return unavailable('walking-selection-required')
    if (
      !owners.isCurrentOperating(report) ||
      report.demand !== demand ||
      demand.scene !== scene ||
      !owners.isCurrentDemand(demand) ||
      !owners.isCurrentScene(scene)
    )
      return unavailable('stale-walking-observation-source')
    if (!demand.route) return unavailable('missing-walking-observation-route')
    let bodyFrameVisits = 0
    const base = report.stowedPoseResult.bodyTransforms.find((body) => {
      bodyFrameVisits++
      return body.id === 'base'
    })
    if (!base || report.stowedPoseResult.source !== report.source)
      return unavailable('missing-walking-base-frame')
    let cameraParent = base.transform
    if (binding) {
      if (!currentMotion(binding) || binding.motion.source !== report.source)
        return unavailable('stale-or-foreign-selected-observation-motion')
      if (!sameOrientation(binding.motion, base.transform.rotation))
        return unavailable('unsupported-selected-observation-orientation')
      const origin = binding.motion.root.origin
      cameraParent = {
        rotation: base.transform.rotation,
        position: [
          roundFraction(
            origin[0].numerator,
            origin[0].denominator,
            'nearest-even'
          ),
          roundFraction(
            origin[1].numerator,
            origin[1].denominator,
            'nearest-even'
          ),
          roundFraction(
            origin[2].numerator,
            origin[2].denominator,
            'nearest-even'
          )
        ]
      }
    }
    const before = geometry.work.membershipBuilds
    const sourceBefore = owners.getSourceWork()
    if (
      !receipt ||
      receipt.scene !== scene ||
      receipt.demand !== demand ||
      receipt.source !== report.source
    )
      receipt = Object.freeze({
        format: 'walking-observation-geometry/1',
        scene,
        demand,
        source: report.source
      })
    const source = geometry.prepareWalking(receipt)
    const context: WalkingActionObservationContext = Object.freeze({
      report,
      demand,
      source: report.source,
      geometry: source,
      generation,
      runId: scenario.id + ':' + generation,
      now,
      sensorIdentity: scenario,
      ...(binding ? { motion: binding.motion } : {})
    })
    contexts.add(context)
    if (binding) selectedContexts.set(context, Object.freeze({ ...binding }))
    const observation = observations.observeActionVolume(context, {
      id: action.actionId,
      source: 'synthetic-action-volume/1',
      assumption: scenario.assumption,
      actionId: action.actionId,
      actionBounds: action.actionBounds,
      runId: context.runId,
      generation,
      observedAt: now,
      validFrom: scenario.validFrom,
      validUntil: action.validUntil,
      leaves: scenario.leaves,
      fruits: scenario.fruits,
      camera: {
        pose: mountCamera(cameraParent, scenario.camera.localPose),
        halfWidthSlope: scenario.camera.halfWidthSlope,
        halfHeightSlope: scenario.camera.halfHeightSlope,
        maxDistance: scenario.camera.maxDistance
      },
      optics: scenario.optics,
      model: scenario.model
    })
    latest = observation
    const sourceAfter = owners.getSourceWork()
    const sourcePreparation = Object.freeze(
      Object.fromEntries(
        Object.keys(sourceBefore).map((key) => [
          key,
          sourceAfter[key as keyof SceneDemandSourceWork] -
            sourceBefore[key as keyof SceneDemandSourceWork]
        ])
      )
    ) as unknown as SceneDemandSourceWork
    return Object.freeze({
      status: 'available',
      observation,
      work: Object.freeze({
        farmMembershipBuilds: geometry.work.membershipBuilds - before,
        bodyFrameVisits,
        cameraMounts: 1,
        sourcePreparation
      })
    })
  }
  return {
    configure: (
      raw: WalkingObservationScenario,
      definition: SyntheticDynamicDefinition
    ) => {
      live()
      const admitted = readScenario(raw)
      if (!dynamics) throw new Error('Missing dynamic owner')
      dynamics.prepare(definition)
      scenario = admitted
      generation++
      latest = undefined
    },
    observe: (raw: WalkingObservationAction) => observe(raw),
    observeSelectedAction: (raw: WalkingSelectedObservationAction) => {
      live()
      keys(raw, ['actionId', 'actionBounds', 'now', 'validUntil', 'binding'])
      const { binding, ...action } = raw
      if (!currentMotion(binding)) {
        latest = undefined
        return Object.freeze({
          status: 'unavailable' as const,
          reason: 'stale-or-foreign-selected-observation-motion'
        })
      }
      return observe(action, binding)
    },
    get: () => (latest && isCurrent(latest) ? latest : undefined),
    isCurrent,
    close: () => {
      closed = true
      observations?.close()
      observations = undefined
      dynamics = undefined
      scenario = undefined
      receipt = undefined
      latest = undefined
      geometry.clear()
    }
  }
}
