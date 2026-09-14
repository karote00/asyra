import { add, interval, subtract } from '../domain/scalar-arithmetic'
import type {
  WalkingMotionRequest,
  WalkingTerrainRegion
} from '../domain/walking-motion-contract'
import { readWalkingMotionRequest } from '../domain/walking-motion-contract'
import { evaluateWalkingRobotPose } from '../domain/walking-robot-kinematics'
import type { WalkingRobotSource } from '../domain/walking-robot-source'
import type { Point3 } from '../domain/greenhouse'
import type { SceneDemand, SceneDemandBounds } from './scene-demand'
import {
  prepareWalkingMotionIntervals,
  walkingMotionPoseAt,
  walkingSourcePointBounds,
  type WalkingCarriedIntervalEnvelope,
  type WalkingIntervalBounds,
  type WalkingPartIntervalEnvelope
} from './walking-motion-interval'
import {
  evaluateWalkingTerrainContact,
  type WalkingTerrainContact
} from './walking-terrain-contact'
import {
  prepareWalkingSourceRelations,
  type WalkingSourceRelations
} from './walking-source-relation'

type MotionEnvelope =
  WalkingPartIntervalEnvelope | WalkingCarriedIntervalEnvelope
type MotionSegment = ReturnType<
  typeof prepareWalkingMotionIntervals
>['segments'][number]

export interface WalkingMotionAdmissionWork {
  readonly intervals: number
  readonly unvisitedIntervals: number
  readonly intervalFk: number
  readonly pointFk: number
  readonly partBounds: number
  readonly vertexVisits: number
  readonly trigBounds: number
  readonly envelopePairs: number
  readonly separatedEnvelopePairs: number
  readonly unresolvedEnvelopePairs: number
  readonly unvisitedEnvelopePairs: number
  readonly witnessPointFk: number
  readonly witnessVertices: number
  readonly terrainBoundsPreparations: number
  readonly terrainVertexBounds: number
}

export interface WalkingMotionAdmission {
  readonly identity: Readonly<object>
  readonly revision: number
  readonly status: 'clear' | 'blocked' | 'unknown'
  readonly reasons: readonly string[]
  readonly demand: SceneDemand
  readonly source: WalkingRobotSource
  readonly path: WalkingMotionRequest['path']
  readonly terrain: WalkingMotionRequest['terrain']
  readonly stance: WalkingMotionRequest['stance']
  readonly gait: WalkingMotionRequest['gait']
  readonly load: WalkingMotionRequest['load']
  readonly evaluation: WalkingMotionRequest['evaluation']
  readonly segments: ReturnType<
    typeof prepareWalkingMotionIntervals
  >['segments']
  readonly contacts: readonly WalkingTerrainContact[]
  readonly sourceRelations?: WalkingSourceRelations
  readonly maneuver?: 'clear' | 'no-turn' | 'unknown'
  readonly quasiStatic: 'pending-W4'
  readonly work: WalkingMotionAdmissionWork
}

interface WalkingMotionOwnerDependencies {
  readonly getCurrentSceneDemand: () => SceneDemand | undefined
  readonly getCurrentWalkingRobotSource: () => WalkingRobotSource | undefined
}

const addReason = (reasons: string[], reason: string) => {
  if (!reasons.includes(reason)) reasons.push(reason)
}
const separated = (left: WalkingIntervalBounds, right: SceneDemandBounds) =>
  left.max.some(
    (maximum, axis) =>
      maximum < right.min[axis] || left.min[axis] > right.max[axis]
  )
const overlaps = (left: WalkingIntervalBounds, right: SceneDemandBounds) =>
  !separated(left, right)
const expanded = (
  value: WalkingIntervalBounds | SceneDemandBounds,
  metres: number
): SceneDemandBounds =>
  Object.freeze({
    min: Object.freeze(
      value.min.map(
        (coordinate) => subtract(interval(coordinate), interval(metres)).low
      )
    ) as Point3,
    max: Object.freeze(
      value.max.map(
        (coordinate) => add(interval(coordinate), interval(metres)).high
      )
    ) as Point3
  })
const contracted = (value: SceneDemandBounds, metres: number) =>
  Object.freeze({
    min: Object.freeze(
      value.min.map(
        (coordinate) => add(interval(coordinate), interval(metres)).high
      )
    ) as Point3,
    max: Object.freeze(
      value.max.map(
        (coordinate) => subtract(interval(coordinate), interval(metres)).low
      )
    ) as Point3
  })
const witnessExclusion = (
  value: SceneDemandBounds,
  metres: number
): SceneDemandBounds => ({
  min: value.min.map(
    (coordinate) => subtract(interval(coordinate), interval(metres)).high
  ) as unknown as Point3,
  max: value.max.map(
    (coordinate) => add(interval(coordinate), interval(metres)).low
  ) as unknown as Point3
})
const witnessRoute = (
  value: SceneDemandBounds,
  metres: number
): SceneDemandBounds => ({
  min: value.min.map(
    (coordinate) => add(interval(coordinate), interval(metres)).low
  ) as unknown as Point3,
  max: value.max.map(
    (coordinate) => subtract(interval(coordinate), interval(metres)).high
  ) as unknown as Point3
})
const inside = (point: WalkingIntervalBounds, value: SceneDemandBounds) =>
  point.min.every(
    (coordinate, axis) =>
      coordinate > value.min[axis] && point.max[axis] < value.max[axis]
  )
const outside = (point: WalkingIntervalBounds, value: SceneDemandBounds) =>
  point.min.some(
    (coordinate, axis) =>
      coordinate > value.max[axis] || point.max[axis] < value.min[axis]
  )

interface WitnessPoints {
  readonly byEnvelopeId: ReadonlyMap<string, readonly WalkingIntervalBounds[]>
  readonly pointFk: number
  readonly vertices: number
}
const envelopeId = (envelope: MotionEnvelope) =>
  'part' in envelope
    ? `part:${envelope.part.id}`
    : `attachment:${envelope.attachment.id}`

function boundWitnessPoints(
  source: WalkingRobotSource,
  request: WalkingMotionRequest,
  segment: MotionSegment
): WitnessPoints {
  const byEnvelopeId = new Map<string, WalkingIntervalBounds[]>(),
    times =
      segment.from === segment.until
        ? [segment.from]
        : [segment.from, segment.until]
  let vertices = 0
  for (const time of times) {
    const pose = evaluateWalkingRobotPose(
        source,
        walkingMotionPoseAt(request.path, time)
      ),
      bodyFrames = new Map(
        pose.bodyTransforms.map(({ id, transform }) => [id, transform])
      )
    for (const part of source.parts) {
      const key = `part:${part.id}`,
        points = byEnvelopeId.get(key) ?? []
      const frame = bodyFrames.get(part.bodyId)
      if (!frame) throw new Error('Missing walking source body')
      const enclosed = walkingSourcePointBounds(part.shape, [
        frame,
        part.localFrame
      ])
      points.push(...enclosed)
      vertices += enclosed.length
      byEnvelopeId.set(key, points)
    }
    for (const { attachment } of segment.carriedEnvelopes) {
      const key = `attachment:${attachment.id}`,
        points = byEnvelopeId.get(key) ?? []
      const frame = bodyFrames.get(attachment.holderBodyId)
      if (!frame) throw new Error('Missing walking attachment holder')
      const enclosed = walkingSourcePointBounds(attachment.shape, [
        frame,
        attachment.localFrame
      ])
      points.push(...enclosed)
      vertices += enclosed.length
      byEnvelopeId.set(key, points)
    }
  }
  return { byEnvelopeId, pointFk: times.length, vertices }
}

function terrainBounds(
  region: WalkingTerrainRegion,
  work: ComparisonWork
): SceneDemandBounds {
  work.terrainBoundsPreparations++
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]
  for (const value of walkingSourcePointBounds(region.shape, [region.frame])) {
    work.terrainVertexBounds++
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], value.min[axis])
      max[axis] = Math.max(max[axis], value.max[axis])
    }
  }
  return Object.freeze({
    min: Object.freeze(min) as Point3,
    max: Object.freeze(max) as Point3
  })
}

interface ComparisonWork {
  envelopePairs: number
  separatedEnvelopePairs: number
  unresolvedEnvelopePairs: number
  unvisitedEnvelopePairs: number
  witnessPointFk: number
  witnessVertices: number
  terrainBoundsPreparations: number
  terrainVertexBounds: number
}

function assessGeometry(
  demand: SceneDemand,
  source: WalkingRobotSource,
  request: WalkingMotionRequest,
  segments: readonly MotionSegment[],
  reasons: string[],
  work: ComparisonWork
) {
  const margin =
    demand.configuration.clearanceMargin.kind === 'bounded'
      ? demand.configuration.clearanceMargin.metres
      : 0
  if (demand.configuration.clearanceMargin.kind !== 'bounded')
    addReason(reasons, 'clearance-margin-unknown')
  const debris = request.terrain.regions
    .filter(({ classification }) => classification === 'debris')
    .map((region) => {
      const declared = region.keepOut.kind === 'bounded'
      return Object.freeze({
        declared,
        obstacle: declared ? region.keepOut : terrainBounds(region, work)
      })
    })
  const compare = (operation: () => void) => {
    if (work.envelopePairs >= request.budget.maxEnvelopePairs) {
      work.unvisitedEnvelopePairs++
      return
    }
    work.envelopePairs++
    operation()
  }
  for (const segment of segments) {
    if (!segment.visited) continue
    const envelopes: MotionEnvelope[] = [
        ...segment.envelopes,
        ...segment.carriedEnvelopes
      ],
      witnesses = boundWitnessPoints(source, request, segment)
    work.witnessPointFk += witnesses.pointFk
    work.witnessVertices += witnesses.vertices
    for (
      let left = 0;
      request.format === 'walking-motion-request/1' && left < envelopes.length;
      left++
    )
      for (let right = left + 1; right < envelopes.length; right++) {
        const first = envelopes[left],
          second = envelopes[right]
        if (
          'part' in first &&
          'part' in second &&
          first.body.id === second.body.id
        )
          continue
        if (
          'attachment' in first &&
          'attachment' in second &&
          first.assembly === second.assembly
        )
          continue
        compare(() => {
          if (separated(first.bounds, second.bounds))
            work.separatedEnvelopePairs++
          else {
            work.unresolvedEnvelopePairs++
            addReason(reasons, 'different-body-overlap-exact-query-required')
          }
        })
      }
    for (const envelope of envelopes) {
      const points = witnesses.byEnvelopeId.get(envelopeId(envelope)) ?? []
      const route = demand.freePassage.route
      if (route)
        compare(() => {
          const clearanceRoute = contracted(route, margin)
          if (
            envelope.bounds.min.every(
              (value, axis) =>
                value >= clearanceRoute.min[axis] &&
                envelope.bounds.max[axis] <= clearanceRoute.max[axis]
            )
          ) {
            work.separatedEnvelopePairs++
          } else if (
            points.some((value) => outside(value, witnessRoute(route, margin)))
          ) {
            addReason(reasons, 'route-boundary-knot-witness')
          } else {
            work.unresolvedEnvelopePairs++
            addReason(reasons, 'route-boundary-exact-query-required')
          }
        })
      for (const exclusion of demand.freePassage.exclusions)
        if (
          request.format === 'walking-motion-request/1' ||
          exclusion.kind !== 'source'
        )
          compare(() => {
            const envelopeBounds =
              exclusion.kind === 'source'
                ? envelope.bounds
                : expanded(envelope.bounds, margin)
            if (!overlaps(envelopeBounds, exclusion.bounds)) {
              work.separatedEnvelopePairs++
              return
            }
            if (exclusion.kind === 'source') {
              work.unresolvedEnvelopePairs++
              addReason(reasons, 'source-envelope-exact-query-required')
              return
            }
            const witnessBounds = witnessExclusion(exclusion.bounds, margin)
            if (points.some((value) => inside(value, witnessBounds)))
              addReason(reasons, 'hard-exclusion-knot-witness')
            else {
              work.unresolvedEnvelopePairs++
              addReason(reasons, 'hard-exclusion-exact-query-required')
            }
          })
      for (const { declared, obstacle } of debris) {
        compare(() => {
          const envelopeBounds = declared
            ? expanded(envelope.bounds, margin)
            : envelope.bounds
          if (!overlaps(envelopeBounds, obstacle)) {
            work.separatedEnvelopePairs++
            return
          }
          if (
            declared &&
            points.some((value) =>
              inside(value, witnessExclusion(obstacle, margin))
            )
          )
            addReason(reasons, 'debris-keep-out-knot-witness')
          else {
            work.unresolvedEnvelopePairs++
            addReason(
              reasons,
              declared
                ? 'debris-keep-out-exact-query-required'
                : 'debris-source-overlap-exact-query-required'
            )
          }
        })
      }
    }
  }
  if (work.unvisitedEnvelopePairs > 0)
    addReason(reasons, 'envelope-pair-budget-exhausted')
}

const blockedReasons = new Set([
  'scene-demand-blocked',
  'contact-assessment-blocked',
  'support-on-authored-channel',
  'hard-exclusion-knot-witness',
  'debris-keep-out-knot-witness',
  'route-boundary-knot-witness',
  'source-material-volume-overlap'
])

export class WalkingMotionOwner {
  private current?: WalkingMotionAdmission
  private lastInput?: unknown
  private lastDemand?: SceneDemand
  private lastSource?: WalkingRobotSource
  private readonly gaitSignatures = new Map<string, string>()
  private revision = 0
  readonly work = { preparations: 0 }

  constructor(private readonly dependencies: WalkingMotionOwnerDependencies) {}

  prepare(raw: unknown): WalkingMotionAdmission {
    const demand = this.dependencies.getCurrentSceneDemand(),
      source = this.dependencies.getCurrentWalkingRobotSource()
    return this.prepareInternal(raw, demand, source)
  }

  private prepareInternal(
    raw: unknown,
    demand: SceneDemand | undefined,
    source: WalkingRobotSource | undefined
  ): WalkingMotionAdmission {
    if (!demand || !source)
      throw new Error('Walking motion owners are unavailable')
    if (
      Object.isFrozen(raw) &&
      raw === this.lastInput &&
      demand === this.lastDemand &&
      source === this.lastSource &&
      this.current
    )
      return this.current
    const request = readWalkingMotionRequest(raw, source, demand),
      gaitSignature = JSON.stringify({
        path: request.path,
        stance: request.stance
      }),
      priorSignature = this.gaitSignatures.get(request.gait.id)
    if (priorSignature !== undefined && priorSignature !== gaitSignature)
      throw new Error('Walking gait identity changed semantic motion')
    this.gaitSignatures.set(request.gait.id, gaitSignature)
    this.work.preparations++
    const intervalResult = prepareWalkingMotionIntervals(source, request),
      contactResult = evaluateWalkingTerrainContact(demand, source, request),
      reasons = [...demand.reasons, ...contactResult.reasons],
      comparisonWork: ComparisonWork = {
        envelopePairs: 0,
        separatedEnvelopePairs: 0,
        unresolvedEnvelopePairs: 0,
        unvisitedEnvelopePairs: 0,
        witnessPointFk: 0,
        witnessVertices: 0,
        terrainBoundsPreparations: 0,
        terrainVertexBounds: 0
      }
    if (demand.status !== 'ready') addReason(reasons, 'scene-demand-not-ready')
    if (demand.status === 'blocked') addReason(reasons, 'scene-demand-blocked')
    if (request.load.crate.kind === 'unknown')
      addReason(reasons, 'crate-geometry-unknown')
    if (
      request.load.crate.kind === 'attached' &&
      request.load.crate.sourceCoverage !== 'complete'
    )
      addReason(reasons, 'crate-source-geometry-incomplete')
    if (
      request.load.carried.kind === 'attached' &&
      request.load.carried.items.some(
        ({ sourceCoverage }) => sourceCoverage !== 'complete'
      )
    )
      addReason(reasons, 'carried-source-geometry-incomplete')
    if (
      request.load.carried.kind === 'attached' &&
      request.load.carried.items.some(({ shape }) => shape.kind === 'unknown')
    )
      addReason(reasons, 'carried-source-geometry-unknown')
    if (intervalResult.unvisitedIntervals > 0)
      addReason(reasons, 'motion-interval-budget-exhausted')
    const incompatible = contactResult.reasons.some((reason) =>
      [
        'terrain-scene-mismatch',
        'terrain-route-mismatch',
        'terrain-channel-authority-mismatch'
      ].includes(reason)
    )
    const sourceRelations =
      !incompatible && request.format === 'walking-motion-request/2'
        ? prepareWalkingSourceRelations(source, demand, request, intervalResult)
        : undefined
    if (request.format === 'walking-motion-request/1')
      addReason(reasons, 'source-relations-version-two-required')
    if (sourceRelations) {
      for (const reason of sourceRelations.reasons) addReason(reasons, reason)
      comparisonWork.envelopePairs = sourceRelations.work.envelopePairs
      for (const segment of sourceRelations.segments) {
        comparisonWork.separatedEnvelopePairs +=
          segment.coverage.strictBounds + segment.coverage.exactSeparated
        comparisonWork.unresolvedEnvelopePairs +=
          segment.coverage.unknown + segment.coverage.targetRefinement
        comparisonWork.unvisitedEnvelopePairs += segment.coverage.unvisited
      }
    }
    if (!incompatible)
      assessGeometry(
        demand,
        source,
        request,
        intervalResult.segments,
        reasons,
        comparisonWork
      )
    let status: 'clear' | 'blocked' | 'unknown' =
      reasons.length > 0 ? 'unknown' : 'clear'
    if (!incompatible && reasons.some((reason) => blockedReasons.has(reason)))
      status = 'blocked'
    const maneuver = status === 'blocked' ? ('no-turn' as const) : status
    const admission = Object.freeze({
      identity: Object.freeze({}),
      revision: ++this.revision,
      status,
      reasons: Object.freeze([...new Set(reasons)]),
      demand,
      source,
      path: request.path,
      terrain: request.terrain,
      stance: request.stance,
      gait: request.gait,
      load: request.load,
      evaluation: request.evaluation,
      segments: intervalResult.segments,
      contacts: contactResult.contacts,
      ...(sourceRelations ? { sourceRelations } : {}),
      ...(request.path.intent === 'turn' ? { maneuver } : {}),
      quasiStatic: 'pending-W4' as const,
      work: Object.freeze({
        ...intervalResult.work,
        unvisitedIntervals: intervalResult.unvisitedIntervals,
        ...comparisonWork
      })
    })
    this.current = admission
    this.lastInput = request
    this.lastDemand = demand
    this.lastSource = source
    return admission
  }

  read() {
    return this.current && this.isCurrent(this.current)
      ? this.current
      : undefined
  }

  isCurrent(product: WalkingMotionAdmission) {
    return (
      product === this.current &&
      product.demand === this.dependencies.getCurrentSceneDemand() &&
      product.source === this.dependencies.getCurrentWalkingRobotSource()
    )
  }

  clear() {
    this.current = undefined
    this.lastInput = undefined
    this.lastDemand = undefined
    this.lastSource = undefined
    this.gaitSignatures.clear()
  }
}
