import { add, interval, subtract, dyadic } from '../domain/scalar-arithmetic'
import type {
  WalkingMotionRequest,
  WalkingTerrainRegion
} from '../domain/walking-motion-contract'
import {
  readWalkingMotionRequest,
  readWalkingNonlinearMotionRequest,
  isWalkingMountedCrateCurrent,
  type WalkingCurrentMountedCrate,
  type WalkingNonlinearMotionRequest,
  type WalkingCurrentCycle
} from '../domain/walking-motion-contract'
import type {
  ConstrainedFraction,
  WalkingConstrainedCycle,
  ConstrainedFrame
} from '../domain/walking-constrained-kinematics'
import {
  WalkingTerrainPlacementOwner,
  type WalkingTerrainPlacement
} from './walking-terrain-placement'
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
  prepareWalkingNonlinearSourceRelations,
  type WalkingNonlinearSourceRelations,
  type WalkingNonlinearPairProof,
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
  readonly getCurrentMountedCrate?: () => WalkingCurrentMountedCrate | undefined
  readonly getCurrentWalkingCycle?: () => WalkingCurrentCycle | undefined
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
  private nonlinear?: WalkingNonlinearMotionAdmission
  private readonly terrainOwners = Array.from(
    { length: 4 },
    () => new WalkingTerrainPlacementOwner()
  )
  private lastInput?: unknown
  private lastDemand?: SceneDemand
  private lastSource?: WalkingRobotSource
  private readonly gaitSignatures = new Map<string, string>()
  private revision = 0
  readonly work = { preparations: 0 }

  constructor(private readonly dependencies: WalkingMotionOwnerDependencies) {}

  prepare(raw: WalkingMotionRequest): WalkingMotionAdmission
  prepare(raw: {
    readonly format: 'walking-motion-request/3'
  }): WalkingNonlinearMotionAdmission
  prepare(
    raw: unknown
  ): WalkingMotionAdmission | WalkingNonlinearMotionAdmission
  prepare(
    raw: unknown
  ): WalkingMotionAdmission | WalkingNonlinearMotionAdmission {
    const demand = this.dependencies.getCurrentSceneDemand(),
      source = this.dependencies.getCurrentWalkingRobotSource()
    if (
      raw &&
      typeof raw === 'object' &&
      'format' in raw &&
      raw.format === 'walking-motion-request/3'
    ) {
      const current = this.dependencies.getCurrentWalkingCycle?.()
      if (!source || !demand || !current) {
        this.clear()
        throw new Error('Walking cycle owner unavailable')
      }
      try {
        return this.prepareNonlinear(raw, source, demand, current)
      } catch (error) {
        this.clear()
        throw error
      }
    }
    this.retireNonlinear()
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
    if (this.nonlinear)
      return this.isCurrent(this.nonlinear) ? this.nonlinear : undefined
    return this.current && this.isCurrent(this.current)
      ? this.current
      : undefined
  }

  isCurrent(product: WalkingMotionAdmission | WalkingNonlinearMotionAdmission) {
    if ('format' in product) {
      const current = this.dependencies.getCurrentWalkingCycle?.()
      return (
        product === this.nonlinear &&
        product.source === this.dependencies.getCurrentWalkingRobotSource() &&
        product.demand === this.dependencies.getCurrentSceneDemand() &&
        current?.cycle === product.cycle &&
        current.owner.read(product.source, product.cycle.recipe) ===
          product.cycle &&
        isWalkingMountedCrateCurrent(
          product.request.load,
          product.source,
          this.dependencies.getCurrentMountedCrate?.()
        ) &&
        product.terrainBindings.every(
          (binding, i) =>
            binding.request === product.request &&
            binding.terrainInput === product.request.terrain &&
            binding.partitionInput === product.request.externalSources &&
            this.terrainOwners[i].read(
              product.source,
              product.demand,
              binding.placementRequest
            ) === binding.product
        )
      )
    }
    return (
      product === this.current &&
      product.demand === this.dependencies.getCurrentSceneDemand() &&
      product.source === this.dependencies.getCurrentWalkingRobotSource()
    )
  }

  private retireNonlinear() {
    this.nonlinear = undefined
    for (const owner of this.terrainOwners) owner.dispose()
  }

  private prepareNonlinear(
    raw: unknown,
    source: WalkingRobotSource,
    demand: SceneDemand,
    current: WalkingCurrentCycle
  ): WalkingNonlinearMotionAdmission {
    const request = readWalkingNonlinearMotionRequest(
      raw,
      source,
      demand,
      current,
      this.dependencies.getCurrentMountedCrate?.()
    )
    if (this.nonlinear?.request === request && this.isCurrent(this.nonlinear))
      return this.nonlinear
    this.retireNonlinear()
    this.current = undefined
    this.work.preparations++
    const work = {
      terrainPreparations: 0,
      endpointPreparations: 0,
      phaseBoundPreparations: 0,
      bridgeVertices: 0,
      exactOperations: 0,
      cycleOperations: 0,
      inputValues: request.inputValues
    }
    const reasons: string[] = []
    const ensureCurrent = () => {
      const active = this.dependencies.getCurrentWalkingCycle?.()
      if (
        active?.cycle !== current.cycle ||
        active.owner !== current.owner ||
        current.owner.read(source, current.cycle.recipe) !== current.cycle ||
        this.dependencies.getCurrentWalkingRobotSource() !== source ||
        this.dependencies.getCurrentSceneDemand() !== demand ||
        !isWalkingMountedCrateCurrent(
          request.load,
          source,
          this.dependencies.getCurrentMountedCrate?.()
        )
      )
        throw new Error('Stale nonlinear walking owner')
    }
    const chargeCycle = (operations: number) => {
      work.cycleOperations += operations
      if (work.cycleOperations > request.budget.maxCycleOperations)
        throw new Error('Nonlinear cycle operation budget exhausted')
    }
    const endpoints = (
      [
        { phase: 0, u: 0 },
        { phase: 0, u: 1 },
        { phase: 1, u: 1 }
      ] as const
    ).map(({ phase, u }) => {
      ensureCurrent()
      if (
        request.budget.maxCycleOperations - work.cycleOperations <
        current.cycle.recipe.budget.maxOperations
      ) {
        reasons.push('nonlinear-endpoint-cycle-reservation-unavailable')
        return undefined
      }
      const before = current.owner.work.operations
      let charged = false
      try {
        const point = current.owner.evaluate(current.cycle, phase, {
          numerator: BigInt(u),
          denominator: 1n
        })
        work.endpointPreparations++
        charged = true
        chargeCycle(current.owner.work.operations - before)
        return point
      } catch (error) {
        if (!charged) chargeCycle(current.owner.work.operations - before)
        ensureCurrent()
        reasons.push(
          error instanceof Error
            ? error.message
            : 'nonlinear-endpoint-unavailable'
        )
        return undefined
      }
    })
    const arithmetic = new WalkingBridgeArithmetic(
      request.budget.maxBits,
      request.budget.maxExactPredicates,
      work
    )
    const terrainBindings = request.terrainEvents.map((event, index) => {
      ensureCurrent()
      const product = this.terrainOwners[index].prepare(
        source,
        demand,
        event.placementRequest
      )
      work.terrainPreparations++
      if (
        this.terrainOwners[index].read(
          source,
          demand,
          event.placementRequest
        ) !== product
      )
        throw new Error('Foreign terrain preparation product')
      const endpoint = endpoints[[0, 0, 1, 2][index]]
      const group = current.cycle.recipe.groups[[0, 1, 1, 0][index]]
      const bridgeReasons: string[] = []
      if (
        product.request !== event.placementRequest ||
        !product.projection ||
        product.supports.length !== 3 ||
        event.seeds.length !== 3 ||
        !endpoint
      )
        bridgeReasons.push('terrain-endpoint-product-incomplete')
      const seen = new Set<string>()
      try {
        for (const support of product.supports) {
          const anchor = current.cycle.recipe.anchors.find(
            (a) => a.chainId === support.chainId
          )
          const projection = product.projection?.supports.find(
            (s) => s.chainId === support.chainId
          )
          const frame = endpoint?.parts.find(
            (p) => p.part === support.part
          )?.exact
          if (
            !group.includes(support.chainId) ||
            seen.has(support.chainId) ||
            !anchor ||
            anchor.part !== support.part ||
            anchor.patch !== support.patch ||
            !projection ||
            projection.part !== support.part ||
            projection.patch !== support.patch ||
            !frame
          ) {
            bridgeReasons.push('terrain-endpoint-source-mismatch')
            continue
          }
          seen.add(support.chainId)
          const offsets = support.patch.ranges.flatMap((r) =>
            Array.from(
              { length: r.indexCount / 3 },
              (_, j) => r.indexStart + j * 3
            )
          )
          const vertices = new Set(
            offsets.flatMap((offset) =>
              support.part.shape.indices.slice(offset, offset + 3)
            )
          )
          const certificate = support.sourceGeometry.certificate
          if (
            !certificate ||
            certificate.footTriangleOffsets.length !== offsets.length ||
            !offsets.every(
              (v, i) => certificate.footTriangleOffsets[i] === v
            ) ||
            projection.fixedVertices.length !== vertices.size
          )
            bridgeReasons.push('terrain-endpoint-source-map-incomplete')
          for (const vertex of projection.fixedVertices) {
            work.bridgeVertices++
            if (!vertices.delete(vertex.index)) {
              bridgeReasons.push('terrain-endpoint-source-map-mismatch')
              continue
            }
            const point = arithmetic.point(
              frame,
              support.part.shape.positions.slice(
                vertex.index * 3,
                vertex.index * 3 + 3
              )
            )
            if (!point.every((v, k) => arithmetic.equal(v, vertex.position[k])))
              bridgeReasons.push('terrain-endpoint-locus-mismatch')
          }
          if (vertices.size)
            bridgeReasons.push('terrain-endpoint-source-map-incomplete')
        }
      } catch (error) {
        bridgeReasons.push(
          error instanceof Error
            ? error.message
            : 'terrain-endpoint-exact-work-unavailable'
        )
      }
      if (seen.size !== 3)
        bridgeReasons.push('terrain-endpoint-tripod-incomplete')
      return Object.freeze({
        request,
        cycle: current.cycle,
        event: event.event,
        terrainInput: request.terrain,
        partitionInput: request.externalSources,
        placementRequest: event.placementRequest,
        product,
        endpoint,
        sourceGeometry: bridgeReasons.length
          ? ('unknown' as const)
          : product.sourceGeometry.status,
        reasons: Object.freeze([...new Set(bridgeReasons)])
      })
    })
    for (const binding of terrainBindings)
      reasons.push(
        ...binding.reasons,
        ...binding.product.reasons.filter(
          (r) => r !== 'assessment-context-unbound'
        )
      )
    const rawRelations = prepareWalkingNonlinearSourceRelations(
      request,
      current,
      work.cycleOperations,
      work.exactOperations,
      this.dependencies.getCurrentMountedCrate?.()
    )
    work.exactOperations += rawRelations.work.kernel.exactPredicates
    const relationCoverage = { ...rawRelations.coverage }
    const relationPhases = rawRelations.phases.map((phase) =>
      Object.freeze({
        ...phase,
        pairs: Object.freeze(
          phase.pairs.map((pair) => {
            const proofs = pair.proofs.map(
              (proof): WalkingNonlinearPairProof => {
                if (
                  proof.kind !== 'unknown' ||
                  proof.reason !== 'ground-contact-coverage-required' ||
                  !proof.ground
                )
                  return proof
                const ground = proof.ground
                const events = (() => {
                  if (phase.phase === 0) {
                    if (ground.mode === 'support') {
                      return [0]
                    }
                    return [1, 2]
                  }
                  if (ground.mode === 'support') {
                    return [2]
                  }
                  return [0, 3]
                })()
                const receipts = events.map((i) => terrainBindings[i])
                for (const receipt of receipts) {
                  if (
                    receipt.sourceGeometry !== 'admitted' ||
                    this.terrainOwners[terrainBindings.indexOf(receipt)].read(
                      source,
                      demand,
                      receipt.placementRequest
                    ) !== receipt.product
                  )
                    return proof
                  const support = receipt.product.supports.find(
                    (s) =>
                      s.part === ground.extrusion.part &&
                      s.patch === ground.extrusion.patch
                  )
                  if (
                    !support?.sourceGeometry.certificate ||
                    support.sourceGeometry.status !== 'admitted'
                  )
                    return proof
                  try {
                    if (
                      !arithmetic.horizontalPlane(
                        support.sourceGeometry.certificate.plane,
                        ground.height
                      )
                    )
                      return proof
                  } catch {
                    return proof
                  }
                }
                return Object.freeze({
                  ...proof,
                  kind: 'declaredBoundary',
                  reason: undefined,
                  terrainReceipts: Object.freeze(receipts.map((r) => r.product))
                })
              }
            )
            const kinds = proofs.map((p) => p.kind)
            const kind = (() => {
              if (kinds.includes('blocked')) {
                return 'blocked' as const
              }
              if (kinds.length === 0 || kinds.every((k) => k === 'unvisited')) {
                return 'unvisited' as const
              }
              if (kinds.some((k) => k === 'unknown' || k === 'unvisited')) {
                return 'unknown' as const
              }
              if (kinds.includes('declaredBoundary')) {
                return 'declaredBoundary' as const
              }
              if (kinds.every((k) => k === 'strictBounds')) {
                return 'strictBounds' as const
              }
              return 'exactSeparated' as const
            })()
            relationCoverage[pair.kind]--
            relationCoverage[kind]++
            return Object.freeze({
              ...pair,
              kind,
              proofs: Object.freeze(proofs)
            })
          })
        )
      })
    )
    const relationReasons = rawRelations.reasons.filter(
      (r) => r !== 'ground-contact-coverage-required'
    )
    if (
      relationPhases.some((p) =>
        p.pairs.some((p) =>
          p.proofs.some((p) => p.reason === 'ground-contact-coverage-required')
        )
      )
    )
      relationReasons.push('ground-contact-coverage-required')
    const sourceRelations: WalkingNonlinearSourceRelations = Object.freeze({
      ...rawRelations,
      phases: Object.freeze(relationPhases),
      coverage: Object.freeze(relationCoverage),
      reasons: Object.freeze(relationReasons),
      status: (() => {
        if (relationCoverage.blocked) {
          return 'blocked' as const
        }
        if (
          relationCoverage.unknown ||
          relationCoverage.unvisited ||
          relationReasons.length
        ) {
          return 'unknown' as const
        }
        return 'clear' as const
      })()
    })
    const contactPhases = sourceRelations.phaseCover.map((cover) => {
      const binding = terrainBindings[cover.phase === 0 ? 0 : 2]
      const supports = binding.product.supports.map((support) => {
        const assessment = support.assessment
        const compatible =
          assessment !== null &&
          binding.placementRequest.terrain.contactAssessments.includes(
            assessment
          ) &&
          assessment.pathId === request.path.id &&
          assessment.loadCaseId === request.load.id &&
          assessment.from <= cover.time.from &&
          assessment.until >= cover.time.until &&
          assessment.coverage === 'complete'
        const relations = assessment
          ? [
              assessment.geometry,
              assessment.friction,
              assessment.bearing,
              assessment.sinkage
            ]
          : []
        const observations = Object.values(
          binding.placementRequest.terrain.observations
        ).every((o) => !('kind' in o) && o.coverage === 'complete')
        const physicalStatus = (() => {
          if (!compatible) {
            return 'unknown' as const
          }
          if (relations.some((r) => 'status' in r && r.status === 'blocked')) {
            return 'blocked' as const
          }
          if (
            observations &&
            relations.every((r) => 'status' in r && r.status === 'admitted')
          ) {
            return 'admitted' as const
          }
          return 'unknown' as const
        })()
        return Object.freeze({
          chainId: support.chainId,
          part: support.part,
          patch: support.patch,
          anchor: support.anchor,
          sourceGeometry: support.sourceGeometry,
          assessment,
          assessmentApplicability: compatible
            ? ('bound' as const)
            : ('unbound' as const),
          physicalStatus,
          terrainBinding: binding
        })
      })
      const first = supports[0]?.sourceGeometry.certificate?.plane
      const height = cover.bounds.supports[0]?.fixedVertices[0]?.position[1]
      let plane: WalkingNonlinearPhaseCover['plane'] = null
      try {
        if (
          first &&
          height &&
          supports.length === 3 &&
          supports.every(
            (s) =>
              s.sourceGeometry.status === 'admitted' &&
              s.sourceGeometry.certificate &&
              arithmetic.horizontalPlane(
                s.sourceGeometry.certificate.plane,
                height
              )
          )
        )
          plane = Object.freeze({
            normal: Object.freeze([
              { numerator: 0n, denominator: 1n },
              { numerator: 1n, denominator: 1n },
              { numerator: 0n, denominator: 1n }
            ]),
            height
          })
      } catch {
        reasons.push('nonlinear-support-plane-work-unavailable')
      }
      return Object.freeze({
        ...cover,
        terrain: request.terrain,
        stance: Object.freeze({
          source,
          cycle: current.cycle,
          path: request.path,
          phase: cover.phase,
          supports: Object.freeze(supports)
        }),
        plane
      })
    })
    const phaseCover = Object.freeze(contactPhases)
    const physicalStatus = (() => {
      if (
        phaseCover.some((p) =>
          p.stance.supports.some((s) => s.physicalStatus === 'blocked')
        )
      ) {
        return 'blocked' as const
      }
      if (
        phaseCover.length === 2 &&
        phaseCover.every(
          (p) =>
            p.stance.supports.length === 3 &&
            p.stance.supports.every((s) => s.physicalStatus === 'admitted')
        )
      ) {
        return 'admitted' as const
      }
      return 'unknown' as const
    })()
    work.phaseBoundPreparations = phaseCover.length
    chargeCycle(sourceRelations.work.cycleOperations)
    reasons.push(...sourceRelations.reasons)
    if (request.load.crate.kind === 'unknown')
      reasons.push('crate-geometry-unknown')
    ensureCurrent()
    const result: WalkingNonlinearMotionAdmission = Object.freeze({
      format: 'walking-motion-admission/3',
      identity: Object.freeze({}),
      revision: ++this.revision,
      source,
      demand,
      request,
      path: request.path,
      cycle: current.cycle,
      terrainBindings: Object.freeze(terrainBindings),
      phaseCover,
      sourceRelations,
      status: (() => {
        if (
          sourceRelations.status === 'blocked' ||
          physicalStatus === 'blocked' ||
          terrainBindings.some((b) => b.sourceGeometry === 'blocked')
        ) {
          return 'blocked' as const
        }
        if (
          sourceRelations.status === 'clear' &&
          physicalStatus === 'admitted' &&
          terrainBindings.every((b) => b.sourceGeometry === 'admitted') &&
          reasons.length === 0
        ) {
          return 'clear' as const
        }
        return 'unknown' as const
      })(),
      physicalStatus,
      reasons: Object.freeze([
        ...new Set([
          ...reasons,
          ...(() => {
            if (physicalStatus === 'unknown') {
              return ['physical-contact-evidence-unbound-or-unknown']
            }
            if (physicalStatus === 'blocked') {
              return ['physical-contact-blocked']
            }
            return []
          })()
        ])
      ]),
      quasiStatic: 'pending-W4',
      work: Object.freeze(work)
    })
    this.nonlinear = result
    return result
  }

  clear() {
    this.retireNonlinear()
    this.current = undefined
    this.lastInput = undefined
    this.lastDemand = undefined
    this.lastSource = undefined
    this.gaitSignatures.clear()
  }
}

type CyclePoint = ReturnType<WalkingCurrentCycle['owner']['evaluate']>
type CycleBound = ReturnType<WalkingCurrentCycle['owner']['bound']>
export interface WalkingNonlinearTerrainBinding {
  readonly request: WalkingNonlinearMotionRequest
  readonly cycle: WalkingConstrainedCycle
  readonly event: WalkingNonlinearMotionRequest['terrainEvents'][number]['event']
  readonly terrainInput: WalkingNonlinearMotionRequest['terrain']
  readonly partitionInput: WalkingNonlinearMotionRequest['externalSources']
  readonly placementRequest: WalkingNonlinearMotionRequest['terrainEvents'][number]['placementRequest']
  readonly product: WalkingTerrainPlacement
  readonly endpoint: CyclePoint | undefined
  readonly sourceGeometry: 'admitted' | 'blocked' | 'unknown'
  readonly reasons: readonly string[]
}
export interface WalkingNonlinearMotionAdmission {
  readonly format: 'walking-motion-admission/3'
  readonly identity: Readonly<object>
  readonly revision: number
  readonly source: WalkingRobotSource
  readonly demand: SceneDemand
  readonly request: WalkingNonlinearMotionRequest
  readonly sourceRelations: WalkingNonlinearSourceRelations
  readonly path: WalkingNonlinearMotionRequest['path']
  readonly cycle: WalkingConstrainedCycle
  readonly terrainBindings: readonly WalkingNonlinearTerrainBinding[]
  readonly phaseCover: readonly WalkingNonlinearPhaseCover[]
  readonly status: 'clear' | 'blocked' | 'unknown'
  readonly physicalStatus: 'admitted' | 'blocked' | 'unknown'
  readonly reasons: readonly string[]
  readonly quasiStatic: 'pending-W4'
  readonly work: Readonly<{
    terrainPreparations: number
    endpointPreparations: number
    phaseBoundPreparations: number
    bridgeVertices: number
    exactOperations: number
    cycleOperations: number
    inputValues: number
  }>
}
export interface WalkingNonlinearPhaseCover {
  readonly phase: 0 | 1
  readonly parameter: CycleBound['parameter']
  readonly time: WalkingNonlinearMotionRequest['path']['phases'][number]
  readonly cycle: WalkingConstrainedCycle
  readonly source: WalkingRobotSource
  readonly load: WalkingNonlinearMotionRequest['load']
  readonly terrain: WalkingNonlinearMotionRequest['terrain']
  readonly bounds: CycleBound
  readonly routeCoverage: 'complete' | 'unknown'
  readonly plane: Readonly<{
    normal: readonly ConstrainedFraction[]
    height: ConstrainedFraction
  }> | null
  readonly stance: Readonly<{
    source: WalkingRobotSource
    cycle: WalkingConstrainedCycle
    path: WalkingNonlinearMotionRequest['path']
    phase: 0 | 1
    supports: readonly Readonly<{
      chainId: string
      part: WalkingTerrainPlacement['supports'][number]['part']
      patch: WalkingTerrainPlacement['supports'][number]['patch']
      anchor: WalkingTerrainPlacement['supports'][number]['anchor']
      sourceGeometry: WalkingTerrainPlacement['supports'][number]['sourceGeometry']
      assessment: WalkingTerrainPlacement['supports'][number]['assessment']
      assessmentApplicability: 'bound' | 'unbound'
      physicalStatus: 'admitted' | 'blocked' | 'unknown'
      terrainBinding: WalkingNonlinearTerrainBinding
    }>[]
  }>
}
/** Bounded exact equality at the projection/cycle boundary; display values never participate. */
class WalkingBridgeArithmetic {
  constructor(
    private maxBits: number,
    private maxOperations: number,
    private work: { exactOperations: number }
  ) {}
  private count() {
    if (this.work.exactOperations >= this.maxOperations)
      throw new Error('Nonlinear exact bridge predicate budget exhausted')
    this.work.exactOperations++
  }
  private bits(n: bigint) {
    return (n < 0n ? -n : n).toString(2).length
  }
  private product(a: bigint, b: bigint) {
    this.count()
    if (this.bits(a) + this.bits(b) > this.maxBits)
      throw new Error('Nonlinear exact bridge bit budget exhausted')
    return a * b
  }
  private fraction(n: bigint, d: bigint): ConstrainedFraction {
    if (d <= 0n || this.bits(n) > this.maxBits || this.bits(d) > this.maxBits)
      throw new Error('Nonlinear exact bridge fraction unavailable')
    let a = n < 0n ? -n : n,
      b = d
    while (b) {
      this.count()
      const r = a % b
      a = b
      b = r
    }
    return { numerator: n / a, denominator: d / a }
  }
  private add(a: ConstrainedFraction, b: ConstrainedFraction) {
    const x = this.product(a.numerator, b.denominator),
      y = this.product(b.numerator, a.denominator)
    this.count()
    if (Math.max(this.bits(x), this.bits(y)) + 1 > this.maxBits)
      throw new Error('Nonlinear exact bridge sum unavailable')
    return this.fraction(x + y, this.product(a.denominator, b.denominator))
  }
  private multiply(a: ConstrainedFraction, b: ConstrainedFraction) {
    return this.fraction(
      this.product(a.numerator, b.numerator),
      this.product(a.denominator, b.denominator)
    )
  }
  private literal(value: number): ConstrainedFraction {
    const d = dyadic(value)
    return d.exponent >= 0
      ? this.fraction(d.significand << BigInt(d.exponent), 1n)
      : this.fraction(d.significand, 1n << BigInt(-d.exponent))
  }
  equal(a: ConstrainedFraction, b: ConstrainedFraction) {
    return (
      this.product(a.numerator, b.denominator) ===
      this.product(b.numerator, a.denominator)
    )
  }
  horizontalPlane(
    plane: readonly ConstrainedFraction[],
    height: ConstrainedFraction
  ) {
    return (
      plane.length === 4 &&
      plane[0].numerator === 0n &&
      plane[2].numerator === 0n &&
      plane[1].numerator !== 0n &&
      this.add(this.multiply(plane[1], height), plane[3]).numerator === 0n
    )
  }
  point(
    frame: ConstrainedFrame<ConstrainedFraction>,
    point: readonly number[]
  ) {
    return frame.origin.map((v, k) =>
      frame.matrix[k].reduce(
        (sum, q, j) => this.add(sum, this.multiply(q, this.literal(point[j]))),
        v
      )
    )
  }
}
