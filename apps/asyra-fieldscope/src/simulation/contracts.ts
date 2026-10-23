import {
  assessHarvestLane,
  type LaneSurvey
} from '../domain/harvest-assessment'
import { assessHarvestEnergy } from '../domain/harvest-energy'
import { assessCrateLoad, type CrateLoad } from '../domain/harvest-load'
import {
  validateConfiguration,
  type FarmConfiguration
} from '../domain/farm-configuration'
import {
  validateRobot,
  type RobotSnapshot
} from '../domain/robot-configuration'
import { REST_JOINTS, type RobotJoints } from '../domain/robot-kinematics'
import type { PreparedScene } from '../render-app/site-geometry'
import type { RobotSource } from '../render-app/robot-projection'
import type { Point3 } from '../domain/greenhouse'

/** Issued as one completed canonical update by composition, never by a UI caller. */
export interface CanonicalMission {
  readonly revision: number
  readonly farm: FarmConfiguration
  readonly report: RobotSnapshot
  readonly scene: PreparedScene
  readonly robot: RobotSource
}
export interface SourceOwners {
  isCurrentMission(receipt: CanonicalMission): boolean
  isCurrentScene(scene: PreparedScene): boolean
  isCurrentRobot(robot: RobotSource): boolean
}
export interface PreparedMission {
  readonly receipt: CanonicalMission
  readonly revision: number
  readonly farm: FarmConfiguration
  readonly report: RobotSnapshot
  readonly scene: PreparedScene
  readonly robot: RobotSource
}
interface Interval {
  from: number
  until: number
}
export interface DispatchEvidence {
  id: string
  source: 'synthetic'
  missionRevision: number
  sceneRevision: number
  robotRevision: number
  observedAt: number
  validFrom: number
  validUntil: number
  survey: LaneSurvey
  battery: { soc: number | null; socUncertainty: number | null }
  dock: 'available' | 'blocked' | 'unknown'
  stowed: boolean | null
  crate: {
    id: string | null
    cultivar: 'cucumber' | 'tomato' | null
    tareKg: number | null
    load: CrateLoad | null
  }
  intervals: { dispatch: Interval; return: Interval }
}
export interface MovementRequest {
  readonly id: string
  readonly purpose: 'dispatch' | 'return'
  readonly missionRevision: number
  readonly scene: PreparedScene
  readonly robot: RobotSource
  readonly interval: Readonly<Interval>
  readonly waypoints: readonly Point3[]
  readonly joints: Readonly<RobotJoints>
}
export interface MovementResult {
  readonly request: MovementRequest
  readonly status: 'clear' | 'blocked' | 'unknown'
  readonly coverage: 'complete' | 'incomplete'
  readonly reasons: readonly string[]
}
export type MovementProvider = (
  requests: readonly MovementRequest[]
) => readonly MovementResult[]
export class DispatchAdmissionError extends Error {}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
const detached = <T>(value: T): T => freeze(structuredClone(value))
const finiteTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
const identity = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
function assertCurrent(receipt: CanonicalMission, owners: SourceOwners) {
  if (
    !receipt ||
    !Number.isSafeInteger(receipt.revision) ||
    receipt.revision <= 0 ||
    !owners.isCurrentMission(receipt) ||
    !owners.isCurrentScene(receipt.scene) ||
    !owners.isCurrentRobot(receipt.robot)
  )
    throw new DispatchAdmissionError(
      'Retired or invalid canonical mission source'
    )
}
// Issuance identity is a lifecycle guard, not a computed-output cache.
const preparedMissions = new WeakSet<PreparedMission>()
export function prepareMission(
  receipt: CanonicalMission,
  owners: SourceOwners
): PreparedMission {
  assertCurrent(receipt, owners)
  const farm = detached(validateConfiguration(structuredClone(receipt.farm)))
  validateRobot(receipt.report.settings)
  const mission = Object.freeze({
    receipt,
    revision: receipt.revision,
    farm,
    report: detached(receipt.report),
    scene: receipt.scene,
    robot: receipt.robot
  })
  preparedMissions.add(mission)
  return mission
}
function readEvidence(
  input: DispatchEvidence,
  mission: PreparedMission,
  now: number
): DispatchEvidence {
  if (
    !input ||
    !identity(input.id) ||
    input.source !== 'synthetic' ||
    input.missionRevision !== mission.revision ||
    input.sceneRevision !== mission.scene.revision ||
    input.robotRevision !== mission.robot.revision
  )
    throw new DispatchAdmissionError('Invalid dispatch evidence identity')
  if (
    ![now, input.observedAt, input.validFrom, input.validUntil].every(
      finiteTime
    ) ||
    input.validFrom > input.observedAt ||
    input.observedAt > now ||
    now >= input.validUntil
  )
    throw new DispatchAdmissionError(
      'Invalid or expired dispatch evidence time'
    )
  for (const purpose of ['dispatch', 'return'] as const) {
    const interval = input.intervals?.[purpose]
    if (
      !interval ||
      !finiteTime(interval.from) ||
      !finiteTime(interval.until) ||
      interval.from < now ||
      interval.from >= interval.until ||
      interval.until >= input.validUntil
    )
      throw new DispatchAdmissionError('Invalid movement query interval')
  }
  if (input.intervals.return.from < input.intervals.dispatch.until)
    throw new DispatchAdmissionError(
      'Return query precedes dispatch completion'
    )
  if (
    !input.survey ||
    !input.battery ||
    !input.crate ||
    !['available', 'blocked', 'unknown'].includes(input.dock) ||
    (input.stowed !== null && typeof input.stowed !== 'boolean')
  )
    throw new DispatchAdmissionError('Invalid dispatch evidence schema')
  for (const value of [input.battery.soc, input.battery.socUncertainty])
    if (
      value !== null &&
      (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1)
    )
      throw new DispatchAdmissionError('Invalid battery observation')
  const { crate } = input
  if (
    (crate.id !== null && !identity(crate.id)) ||
    (crate.cultivar !== null &&
      !['cucumber', 'tomato'].includes(crate.cultivar)) ||
    (crate.tareKg !== null && !finiteTime(crate.tareKg))
  )
    throw new DispatchAdmissionError('Invalid crate observation')
  if (
    crate.load &&
    crate.load.payloadLimit !== mission.report.settings.payloadLimit
  )
    throw new DispatchAdmissionError(
      'Crate evidence cannot replace the mission payload limit'
    )
  return detached(input)
}
function movementRequests(
  mission: PreparedMission,
  evidence: DispatchEvidence
): readonly MovementRequest[] {
  const { settings, lane } = mission.report
  if (!lane) throw new DispatchAdmissionError('Missing completed route')
  const dock: Point3 = Object.freeze([
    settings.dockX,
    0,
    settings.dockZ
  ] as const)
  const start: Point3 = Object.freeze([
    lane.centerX,
    0,
    settings.start
  ] as const)
  const end: Point3 = Object.freeze([lane.centerX, 0, settings.end] as const)
  return Object.freeze(
    (['dispatch', 'return'] as const).map((purpose) =>
      Object.freeze({
        id: `${evidence.id}:${purpose}`,
        purpose,
        missionRevision: mission.revision,
        scene: mission.scene,
        robot: mission.robot,
        interval: evidence.intervals[purpose],
        waypoints: Object.freeze(
          purpose === 'dispatch' ? [dock, start, end] : [end, dock]
        ),
        joints: REST_JOINTS
      })
    )
  )
}

/** Screens one explicit intent. No run creation, source preparation, or default clearance. */
export function admitDispatch(
  mission: PreparedMission,
  input: DispatchEvidence,
  now: number,
  owners: SourceOwners,
  query: MovementProvider
) {
  if (!preparedMissions.has(mission))
    throw new DispatchAdmissionError('Unissued prepared mission')
  assertCurrent(mission.receipt, owners)
  const evidence = readEvidence(input, mission, now)
  const { settings, route } = mission.report
  const reasons: string[] = []
  if (!mission.robot.rig) reasons.push('unsupported-rig')
  if (evidence.stowed !== true) reasons.push('unverified-stowed-pose')
  if (!route || !mission.report.lane) reasons.push('invalid-route')
  const lane = route
    ? assessHarvestLane({
        farm: mission.farm,
        lane: route,
        vehicle: {
          width: settings.width,
          length: settings.length,
          height: settings.height,
          clearance: settings.clearance
        },
        canopyReserve: settings.canopyReserve,
        start: settings.start,
        end: settings.end,
        survey: evidence.survey
      })
    : null
  if (lane && lane.status !== 'screened')
    reasons.push(...lane.blocked, ...lane.unverified)
  if (
    !evidence.crate.id ||
    evidence.crate.tareKg === null ||
    evidence.crate.cultivar !== settings.tool
  )
    reasons.push('crate-unverified')
  const load = evidence.crate.load ? assessCrateLoad(evidence.crate.load) : null
  if (!load) reasons.push('missing-load')
  else if (load.action !== 'continue-screening')
    reasons.push(...load.stop, ...load.exchange)
  if (evidence.dock !== 'available') reasons.push('dock-unavailable')
  const batteryKnown =
    evidence.battery.soc !== null && evidence.battery.socUncertainty !== null
  if (!batteryKnown) reasons.push('missing-battery')
  // Query only after prerequisite screens. A energy still independently requires
  // the provider's complete return result and the declared battery observation.
  let movements: readonly MovementResult[] = []
  let returnAdmitted = false
  if (!reasons.length) {
    const requests = movementRequests(mission, evidence)
    if (typeof query !== 'function') reasons.push('missing-movement-provider')
    else {
      const results = query(requests)
      const complete =
        Array.isArray(results) &&
        results.length === requests.length &&
        requests.every(
          (request) =>
            results.filter(
              (result) =>
                result?.request === request &&
                result.status === 'clear' &&
                result.coverage === 'complete' &&
                Array.isArray(result.reasons) &&
                result.reasons.length === 0
            ).length === 1
        )
      const admittedResults: MovementResult[] = Array.isArray(results)
        ? results.filter(
            (result) =>
              result &&
              requests.includes(result.request) &&
              ['clear', 'blocked', 'unknown'].includes(result.status) &&
              ['complete', 'incomplete'].includes(result.coverage) &&
              Array.isArray(result.reasons) &&
              result.reasons.every(
                (reason: unknown) => typeof reason === 'string'
              )
          )
        : []
      movements = Object.freeze(
        admittedResults.map((result) =>
          Object.freeze({
            request: result.request,
            status: result.status,
            coverage: result.coverage,
            reasons: Object.freeze([...result.reasons])
          })
        )
      )
      if (!complete)
        reasons.push(
          'movement-unresolved',
          ...movements.flatMap((result) => result.reasons)
        )
      else returnAdmitted = true
    }
  }
  const energy = batteryKnown
    ? assessHarvestEnergy({
        ...settings,
        soc: evidence.battery.soc as number,
        socUncertainty: evidence.battery.socUncertainty as number,
        batteryFresh: true,
        returnPathAdmitted: returnAdmitted,
        dockAvailable: evidence.dock === 'available'
      })
    : null
  if (energy && energy.action !== 'continue-screening')
    reasons.push(
      ...energy.reasons,
      ...(energy.action === 'return-to-charge' ? ['dispatch-energy'] : [])
    )
  assertCurrent(mission.receipt, owners)
  return Object.freeze({
    accepted: reasons.length === 0,
    mission,
    evidence,
    lane: lane ? freeze(lane) : null,
    load: load ? freeze(load) : null,
    energy: energy ? freeze(energy) : null,
    movements,
    reasons: Object.freeze([...new Set(reasons)])
  })
}
