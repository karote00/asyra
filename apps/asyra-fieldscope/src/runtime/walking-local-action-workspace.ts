import {
  WalkingConstrainedCycleOwner,
  type WalkingConstrainedCycle,
  type WalkingConstrainedCycleRecipe,
  type WalkingSelectedChainMotion,
  type WalkingSelectedChainMotionRecipe
} from '../domain/walking-constrained-kinematics'
import {
  WalkingSelectedChainRelationOwner,
  type WalkingSelectedChainRelationRequest,
  type WalkingSelectedChainSourceRelations
} from '../simulation/walking-source-relation'
import {
  WalkingRuntimeMonitorOwner,
  type WalkingRuntimeMonitor,
  type WalkingRuntimeMonitorContext,
  type WalkingRuntimeMonitorProfile,
  type WalkingRuntimeMonitorSample
} from '../simulation/walking-runtime-monitor'
import { interval, add, multiply } from '../domain/scalar-arithmetic'
import type { WalkingOperatingReport } from './walking-operating-workspace'
import type {
  WalkingSelectedObservationAction,
  WalkingObservationResult
} from './walking-observation-workspace'
import type { WalkingActionVolumeObservation } from '../simulation/observations'
import type { SyntheticSourceBounds } from '../simulation/synthetic-dynamic-scene'

const zero = Object.freeze({ numerator: 0n, denominator: 1n })
const one = Object.freeze({ numerator: 1n, denominator: 1n })
/** The interval owner, never endpoint sampling, supplies this observation volume. */
export function prepareWalkingSelectedActionSweep(
  owner: WalkingConstrainedCycleOwner,
  motion: WalkingSelectedChainMotion
) {
  const work = {
    boundCalls: 0,
    partVisits: 0,
    sourceVertices: 0,
    otherBodyVisits: 0
  }
  work.boundCalls++
  const bound = owner.boundSelectedChainMotion(motion, { low: zero, high: one })
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const { part, frame } of bound.parts) {
    work.partVisits++
    const positions = part.shape.positions
    for (let offset = 0; offset < positions.length; offset += 3) {
      work.sourceVertices++
      for (let axis = 0; axis < 3; axis++) {
        let value = frame.origin[axis]
        for (let k = 0; k < 3; k++)
          value = add(
            value,
            multiply(frame.matrix[axis][k], interval(positions[offset + k]))
          )
        min[axis] = Math.min(min[axis], value.low)
        max[axis] = Math.max(max[axis], value.high)
      }
    }
  }
  if (
    !min.every(Number.isFinite) ||
    !max.every(Number.isFinite) ||
    min.some((v, i) => v > max[i])
  )
    throw new Error('unavailable-selected-sweep')
  return Object.freeze({
    motion,
    bounds: Object.freeze({ min: Object.freeze(min), max: Object.freeze(max) }),
    work: Object.freeze(work)
  })
}
type ActiveReport = Exclude<WalkingOperatingReport, { status: 'legacy-view' }>
export interface WalkingLocalActionRequest {
  readonly format: 'synthetic-walking-local-action/1'
  readonly assumption: string
  readonly actionId: string
  readonly now: number
  readonly validUntil: number
  readonly cycle: WalkingConstrainedCycleRecipe
  readonly selected: Omit<WalkingSelectedChainMotionRecipe, 'format' | 'cycle'>
  readonly relationBudget: WalkingSelectedChainRelationRequest['budget']
  readonly monitor: WalkingRuntimeMonitorSample
}
export interface WalkingLocalActionContinuation {
  readonly actionId: string
  readonly now: number
  readonly validUntil: number
  readonly progress: number
  readonly monitor: WalkingRuntimeMonitorSample
}
interface PreparedAction {
  readonly actionId: string
  readonly assumption: string
  readonly report: ActiveReport
  readonly cycle: WalkingConstrainedCycle
  readonly motion: WalkingSelectedChainMotion
  readonly sweep: ReturnType<typeof prepareWalkingSelectedActionSweep>
}
interface ActionWork {
  cyclePreparations: number
  motionPreparations: number
  sweepPreparations: number
  sweepVertices: number
  relationPreparations: number
  sourceCertifications: number
  exactPredicates: number
  observationCalls: number
  observation?: Readonly<
    WalkingActionVolumeObservation['work'] &
      Extract<WalkingObservationResult, { status: 'available' }>['work']
  >
  monitor?: WalkingRuntimeMonitor['work']
}
export interface WalkingLocalActionDecision {
  readonly format: 'walking-local-action-decision/1'
  readonly identity: Readonly<object>
  readonly actionId: string
  readonly action: PreparedAction | undefined
  readonly cycle: WalkingConstrainedCycle | undefined
  readonly motion: WalkingSelectedChainMotion | undefined
  readonly relation: WalkingSelectedChainSourceRelations | undefined
  readonly observation: WalkingActionVolumeObservation | undefined
  readonly monitor: WalkingRuntimeMonitor | undefined
  readonly observedAt: number
  readonly progress: number
  readonly status: 'running' | 'complete' | 'held'
  readonly geometryStatus: 'clear' | 'blocked' | 'unknown' | 'unavailable'
  readonly observationStatus:
    'complete-empty' | 'partial' | 'unknown' | 'unavailable'
  readonly monitorStatus: WalkingRuntimeMonitor['status'] | 'unavailable'
  readonly reasons: readonly string[]
  readonly work: Readonly<ActionWork>
}
function keys(raw: object, names: readonly string[]) {
  if (
    !raw ||
    typeof raw !== 'object' ||
    Array.isArray(raw) ||
    Object.keys(raw).length !== names.length ||
    Object.keys(raw).some((k) => !names.includes(k))
  )
    throw new Error('invalid-local-action-fields')
}
function timing(raw: { actionId: string; now: number; validUntil: number }) {
  if (
    typeof raw.actionId !== 'string' ||
    !raw.actionId.trim() ||
    !Number.isFinite(raw.now) ||
    raw.now < 0 ||
    !Number.isFinite(raw.validUntil) ||
    raw.validUntil <= raw.now
  )
    throw new Error('invalid-local-action-time')
}
const overlaps = (a: SyntheticSourceBounds, b: SyntheticSourceBounds) =>
  a.min.every((v, i) => v <= b.max[i] && a.max[i] >= b.min[i])

/** Simulation decisions only; completion does not assert motion, landing or hardware safety. */
export function createWalkingLocalActionWorkspace(owners: {
  getOperating(): WalkingOperatingReport
  isCurrentOperating(report: WalkingOperatingReport): boolean
  observe(request: WalkingSelectedObservationAction): WalkingObservationResult
  isCurrentObservation(result: WalkingActionVolumeObservation): boolean
}) {
  const cycleOwner = new WalkingConstrainedCycleOwner()
  const relationOwner = new WalkingSelectedChainRelationOwner()
  let closed = false,
    latest: WalkingLocalActionDecision | undefined,
    action: PreparedAction | undefined
  let lastTime = -Infinity,
    progress = 0
  const totals = {
    motionPreparations: 0,
    sweepPreparations: 0,
    sweepVertices: 0,
    exactPredicates: 0,
    observationCalls: 0
  }
  const live = () => {
    if (closed) throw new Error('Walking local action workspace is closed')
  }
  const currentAction = (value: PreparedAction) =>
    !closed &&
    action === value &&
    owners.getOperating() === value.report &&
    owners.isCurrentOperating(value.report) &&
    value.report.source === value.cycle.source &&
    cycleOwner.read(value.report.source, value.cycle.recipe) === value.cycle &&
    cycleOwner.readSelectedChainMotion(value.cycle, value.motion) ===
      value.motion
  const monitorOwner = new WalkingRuntimeMonitorOwner((context) => {
    const value = action
    return (
      !!value &&
      currentAction(value) &&
      context.source === value.report.source &&
      context.load === value.report.load &&
      context.massProperties === value.report.source.massProperties &&
      context.cycle === value.cycle &&
      context.phase === value.motion.recipe.phase
    )
  })
  const context = (
    value: PreparedAction,
    now: number
  ): WalkingRuntimeMonitorContext => ({
    source: value.report.source,
    load: value.report.load,
    massProperties: value.report.source.massProperties,
    cycleOwner,
    cycle: value.cycle,
    phase: value.motion.recipe.phase,
    now
  })
  const counts = () => ({
    cyclePreparations: cycleOwner.work.preparations,
    relationPreparations: relationOwner.work.preparations,
    sourceCertifications: relationOwner.work.sourceCertifications,
    ...totals
  })
  const isCurrent = (decision: WalkingLocalActionDecision) => {
    const value = action
    return (
      !closed &&
      latest === decision &&
      !!value &&
      decision.action === value &&
      currentAction(value) &&
      !!decision.relation &&
      relationOwner.read(
        { owner: cycleOwner, cycle: value.cycle },
        value.motion
      ) === decision.relation &&
      !!decision.observation &&
      owners.isCurrentObservation(decision.observation) &&
      !!decision.monitor &&
      monitorOwner.read(
        context(value, decision.observedAt),
        decision.monitor
      ) === decision.monitor
    )
  }
  const execute = (
    kind: 'start' | 'continue' | 'complete',
    raw: WalkingLocalActionRequest | WalkingLocalActionContinuation
  ): WalkingLocalActionDecision => {
    live()
    latest = undefined
    const before = counts()
    const reasons: string[] = []
    let observation: WalkingActionVolumeObservation | undefined,
      monitor: WalkingRuntimeMonitor | undefined
    let relation: WalkingSelectedChainSourceRelations | undefined
    let observationWork: ActionWork['observation']
    let admitted = false
    let proposedProgress = 0
    if (kind !== 'start')
      proposedProgress = 'progress' in raw ? raw.progress : NaN
    try {
      keys(
        raw,
        kind === 'start'
          ? [
              'format',
              'assumption',
              'actionId',
              'now',
              'validUntil',
              'cycle',
              'selected',
              'relationBudget',
              'monitor'
            ]
          : ['actionId', 'now', 'validUntil', 'progress', 'monitor']
      )
      timing(raw)
      if (raw.now <= lastTime) throw new Error('nonmonotonic-action-time')
      lastTime = raw.now
      if (kind === 'start') {
        action = undefined
        cycleOwner.dispose()
        if (
          !('cycle' in raw) ||
          raw.format !== 'synthetic-walking-local-action/1' ||
          typeof raw.assumption !== 'string' ||
          !raw.assumption.trim()
        )
          throw new Error('invalid-synthetic-local-proposal')
        const report = owners.getOperating()
        if (
          report.status === 'legacy-view' ||
          !owners.isCurrentOperating(report)
        )
          throw new Error('current-walking-source-required')
        if (
          raw.cycle.source !== report.source ||
          raw.cycle.fixedJoints !== report.source.rig.presets.stowed
        )
          throw new Error('foreign-cycle-source-or-preset')
        keys(raw.selected, ['phase', 'at', 'chainId', 'targetAbduction'])
        const cycle = cycleOwner.prepare(report.source, raw.cycle)
        totals.motionPreparations++
        const motion = cycleOwner.prepareSelectedChainMotion(cycle, {
          ...raw.selected,
          format: 'walking-selected-chain-root-motion/1',
          cycle
        })
        totals.sweepPreparations++
        const sweep = prepareWalkingSelectedActionSweep(cycleOwner, motion)
        totals.sweepVertices += sweep.work.sourceVertices
        action = Object.freeze({
          actionId: raw.actionId,
          assumption: raw.assumption,
          report,
          cycle,
          motion,
          sweep
        })
        progress = 0
      } else if (
        !Number.isFinite(proposedProgress) ||
        proposedProgress < progress ||
        proposedProgress < 0 ||
        proposedProgress > 1 ||
        (kind === 'complete' ? proposedProgress !== 1 : proposedProgress >= 1)
      ) {
        throw new Error('invalid-action-progress')
      }
      const value = action
      if (!value || value.actionId !== raw.actionId)
        throw new Error('missing-or-foreign-local-action')
      if (!currentAction(value))
        throw new Error('stale-local-action-source-demand-load-or-motion')
      totals.observationCalls++
      const observed = owners.observe({
        actionId: value.actionId,
        actionBounds: value.sweep.bounds,
        now: raw.now,
        validUntil: raw.validUntil,
        binding: { owner: cycleOwner, cycle: value.cycle, motion: value.motion }
      })
      if (observed.status === 'available') {
        observation = observed.observation
        observationWork = Object.freeze({
          ...observation.work,
          ...observed.work
        })
      } else reasons.push(observed.reason)
      if (kind === 'start' && 'relationBudget' in raw) {
        relation = relationOwner.prepare(
          { owner: cycleOwner, cycle: value.cycle },
          {
            format: 'walking-selected-chain-source-relation-request/1',
            motion: value.motion,
            budget: raw.relationBudget
          }
        )
        totals.exactPredicates += relation.work.evaluator.exactPredicates
      } else
        relation = relationOwner.read(
          { owner: cycleOwner, cycle: value.cycle },
          value.motion
        )
      if (!relation) reasons.push('missing-current-local-relation')
      else {
        const coverage = relation.coverage
        if (
          relation.status !== 'clear' ||
          coverage.blocked ||
          coverage.unknown ||
          coverage.unvisited ||
          coverage.required !==
            coverage.strictBounds +
              coverage.exactSeparated +
              coverage.declaredBoundary
        )
          reasons.push('local-relation-not-complete-clear', ...relation.reasons)
      }
      monitor = monitorOwner.evaluate(context(value, raw.now), raw.monitor)
      if (monitor.status !== 'within-synthetic-profile')
        reasons.push(...monitor.reasons)
      if (!observation || !owners.isCurrentObservation(observation))
        reasons.push(
          'missing-or-stale-action-observation',
          ...(observation?.reasons ?? [])
        )
      else {
        if (observation.reliability.status !== 'reliable')
          reasons.push('insufficient-action-optics')
        for (const detection of observation.detections) {
          if (
            detection.kind === 'dynamic' &&
            overlaps(detection.bounds, value.sweep.bounds)
          )
            reasons.push(
              detection.actorKind === 'person'
                ? 'person-policy-hold'
                : 'moving-object-policy-hold'
            )
          else if (detection.kind === 'static') {
            if (detection.anatomy.some((p) => p.role === 'leaf-blade'))
              reasons.push('plant-contact-risk-unavailable')
            else reasons.push('static-source-policy-hold')
          }
        }
        if (observation.coverage !== 'complete-empty')
          reasons.push('incomplete-action-observation', ...observation.reasons)
      }
      if (
        !currentAction(value) ||
        monitorOwner.read(context(value, raw.now), monitor) !== monitor
      )
        reasons.push('stale-action-publication')
      admitted = !reasons.length
      if (admitted) progress = proposedProgress
    } catch (error) {
      reasons.push(
        error instanceof Error ? error.message : 'unknown-local-action'
      )
    }
    if (!Number.isFinite(proposedProgress)) proposedProgress = progress
    const after = counts()
    const work: ActionWork = {
      cyclePreparations: after.cyclePreparations - before.cyclePreparations,
      motionPreparations: after.motionPreparations - before.motionPreparations,
      sweepPreparations: after.sweepPreparations - before.sweepPreparations,
      sweepVertices: after.sweepVertices - before.sweepVertices,
      relationPreparations:
        after.relationPreparations - before.relationPreparations,
      sourceCertifications:
        after.sourceCertifications - before.sourceCertifications,
      exactPredicates: after.exactPredicates - before.exactPredicates,
      observationCalls: after.observationCalls - before.observationCalls,
      observation: observationWork,
      monitor: monitor?.work
    }
    let status: WalkingLocalActionDecision['status'] = 'held'
    if (admitted) status = kind === 'complete' ? 'complete' : 'running'
    const decision: WalkingLocalActionDecision = Object.freeze({
      format: 'walking-local-action-decision/1',
      identity: Object.freeze({}),
      actionId: raw.actionId,
      action,
      cycle: action?.cycle,
      motion: action?.motion,
      relation,
      observation,
      monitor,
      observedAt: raw.now,
      progress: admitted ? proposedProgress : progress,
      status,
      geometryStatus: relation?.status ?? 'unavailable',
      observationStatus: observation?.coverage ?? 'unavailable',
      monitorStatus: monitor?.status ?? 'unavailable',
      reasons: Object.freeze([...new Set(reasons)]),
      work: Object.freeze(work)
    })
    latest = decision
    return decision
  }
  return {
    configureMonitor: (profile: WalkingRuntimeMonitorProfile) => {
      live()
      monitorOwner.configure(profile)
      latest = undefined
    },
    start: (request: WalkingLocalActionRequest) => execute('start', request),
    continue: (request: WalkingLocalActionContinuation) =>
      execute('continue', request),
    complete: (request: WalkingLocalActionContinuation) =>
      execute('complete', request),
    get: () => latest,
    isCurrent,
    close: () => {
      closed = true
      latest = undefined
      action = undefined
      monitorOwner.close()
      relationOwner.dispose()
      cycleOwner.dispose()
    }
  }
}
