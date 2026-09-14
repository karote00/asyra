import type { Point3 } from '../domain/greenhouse'
import type {
  SourceRegion,
  SourceTriangleRange,
  SourcePatch
} from '../domain/source-occupancy'
import { dyadic, interval, type Dyadic } from '../domain/scalar-arithmetic'
import type { SpatialShape } from '../engine/spatial-contract'
import {
  prepareQueryExactForwardFrame,
  prepareQueryExactInstanceFrame,
  prepareQueryForwardFrame,
  prepareQueryInstanceFrame,
  transformQueryPoint,
  type QueryExactFrame
} from './ray-query'
import {
  readWalkingMotionRequest,
  type WalkingSourceMotionRequest
} from '../domain/walking-motion-contract'
import type { WalkingRigidTransform } from '../domain/walking-robot-definition'
import { evaluateWalkingRobotPose } from '../domain/walking-robot-kinematics'
import type {
  WalkingRobotSource,
  WalkingRobotBody,
  WalkingRobotPart
} from '../domain/walking-robot-source'
import type {
  SceneDemand,
  SceneDemandBounds,
  SceneDemandTargetPartition
} from './scene-demand'
import {
  walkingMotionPoseAt,
  walkingSourcePointBounds,
  type prepareWalkingMotionIntervals
} from './walking-motion-interval'

type ExactPoint = readonly [Dyadic, Dyadic, Dyadic]
type Triangle = readonly [number, number, number]
type Shape = Extract<SpatialShape, { kind: 'triangles' }>
const zero = dyadic(0)
const sum = (a: Dyadic, b: Dyadic): Dyadic => {
  const exponent = Math.min(a.exponent, b.exponent)
  return {
    significand:
      (a.significand << BigInt(a.exponent - exponent)) +
      (b.significand << BigInt(b.exponent - exponent)),
    exponent
  }
}

interface RelationCoverage {
  candidate: number
  coRigidOwner: number
  required: number
  strictBounds: number
  exactSeparated: number
  declaredBoundary: number
  blocked: number
  targetRefinement: number
  unknown: number
  unvisited: number
}
const coverage = (): RelationCoverage => ({
  candidate: 0,
  coRigidOwner: 0,
  required: 0,
  strictBounds: 0,
  exactSeparated: 0,
  declaredBoundary: 0,
  blocked: 0,
  targetRefinement: 0,
  unknown: 0,
  unvisited: 0
})
interface RelationSource {
  readonly owner: object
  readonly shape: Shape
  readonly region: SourceRegion
  readonly bounds?: SceneDemandBounds
  readonly clearanceExpanded?: true
  readonly body?: WalkingRobotBody
  readonly part?: WalkingRobotPart
  readonly frames: () => readonly QueryExactFrame[]
  readonly targetPartitions?: readonly SceneDemandTargetPartition[]
}
type SourceIntervals = ReturnType<typeof prepareWalkingMotionIntervals>
type BoundaryWitness = NonNullable<
  ReturnType<WalkingSourceRelationEvaluator['proveBoundary']>
>
export interface WalkingSourceRelations {
  readonly format: 'walking-source-relations/1'
  readonly source: WalkingRobotSource
  readonly demand: SceneDemand
  readonly request: WalkingSourceMotionRequest
  readonly terrain: WalkingSourceMotionRequest['terrain']
  readonly path: WalkingSourceMotionRequest['path']
  readonly stance: WalkingSourceMotionRequest['stance']
  readonly load: WalkingSourceMotionRequest['load']
  readonly evaluation: WalkingSourceMotionRequest['evaluation']
  readonly status: 'clear' | 'blocked' | 'unknown'
  readonly reasons: readonly string[]
  readonly segments: readonly {
    readonly from: number
    readonly until: number
    readonly coverage: Readonly<RelationCoverage>
    readonly self: Readonly<RelationCoverage>
    readonly environment: Readonly<RelationCoverage>
    readonly boundaries: readonly {
      first: SourceRegion
      second: SourceRegion
      witness: BoundaryWitness
      authority: 'completed-source-frame' | 'authored-fixed-parent-frame'
    }[]
    readonly issues: readonly {
      reason: string
      first: SourceRegion
      second: SourceRegion
    }[]
  }[]
  readonly work: Readonly<
    WalkingSourceRelationEvaluator['work'] & {
      framePreparations: number
      envelopePairs: number
      pointFk: number
      targetPartitionVisits: number
      sourceExclusionBindings: number
    }
  >
}

/** Full original-region inventory. The returned proof is owned by this evaluation. */
export function prepareWalkingSourceRelations(
  source: WalkingRobotSource,
  demand: SceneDemand,
  request: WalkingSourceMotionRequest,
  intervals: SourceIntervals
): WalkingSourceRelations {
  if (
    request.source !== source ||
    request.demand !== demand ||
    readWalkingMotionRequest(request, source, demand) !== request ||
    intervals.inputIdentity !== request ||
    intervals.source !== source ||
    intervals.path !== request.path
  )
    throw new Error('Stale source relation inputs')
  const evaluator = new WalkingSourceRelationEvaluator(request.budget),
    frameCache = new Map<object, QueryExactFrame>(),
    instanceCache = new Map<object, QueryExactFrame>(),
    frameIds = new Map<QueryExactFrame, number>(),
    chains = new Map<string, readonly QueryExactFrame[]>(),
    reasons = new Set<string>(),
    segments: WalkingSourceRelations['segments'][number][] = []
  let framePreparations = 0,
    envelopePairs = 0,
    pointFk = 0,
    visitedPairs = 0
  const frame = (input: WalkingRigidTransform) => {
    let result = frameCache.get(input)
    if (!result) {
      result = prepareQueryExactForwardFrame(input)
      frameCache.set(input, result)
      framePreparations++
    }
    return result
  }
  const sharedChain = (inputs: readonly QueryExactFrame[]) => {
    const key = inputs
      .map((input) => {
        let id = frameIds.get(input)
        if (id === undefined) {
          id = frameIds.size
          frameIds.set(input, id)
        }
        return id
      })
      .join(',')
    let result = chains.get(key)
    if (!result) {
      result = Object.freeze([...inputs])
      chains.set(key, result)
    }
    return result
  }
  const chain = (...inputs: WalkingRigidTransform[]) =>
    sharedChain(inputs.map(frame))
  const sceneFrames = (
    input:
      | SceneDemandTargetPartition['transform']
      | Extract<
          SceneDemand['freePassage']['exclusions'][number],
          { kind: 'source' }
        >['transform']
  ) => {
    const result: QueryExactFrame[] = []
    if (input.instance) {
      let instance = instanceCache.get(input.instance)
      if (!instance) {
        instance = prepareQueryExactInstanceFrame(input.instance)
        instanceCache.set(input.instance, instance)
        framePreparations++
      }
      result.push(instance)
    }
    result.push(frame(input.descriptor))
    return sharedChain(result)
  }
  const bound = (
    shape: Shape,
    input: WalkingRigidTransform
  ): SceneDemandBounds => {
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity]
    for (const p of walkingSourcePointBounds(shape, [input]))
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], p.min[axis])
        max[axis] = Math.max(max[axis], p.max[axis])
      }
    return { min: min as unknown as Point3, max: max as unknown as Point3 }
  }
  const external = new Map(
    request.externalSources.map((item) => [item.sourceId, item.regions])
  )
  const world: RelationSource[] = []
  const targetsByMesh = new Map<
    object,
    Map<number, SceneDemandTargetPartition[]>
  >()
  let targetPartitionVisits = 0,
    sourceExclusionBindings = 0
  for (const target of [
    ...demand.targets.left,
    ...demand.targets.right,
    ...demand.targets.unassigned
  ])
    for (const partition of target.partitions) {
      targetPartitionVisits++
      let instances = targetsByMesh.get(partition.mesh)
      if (!instances) {
        instances = new Map()
        targetsByMesh.set(partition.mesh, instances)
      }
      let partitions = instances.get(partition.instance)
      if (!partitions) {
        partitions = []
        instances.set(partition.instance, partitions)
      }
      partitions.push(partition)
    }
  if (request.load.crate.kind === 'unknown')
    reasons.add('crate-geometry-unknown')
  if (
    request.load.crate.kind === 'attached' &&
    request.load.crate.sourceCoverage !== 'complete'
  )
    reasons.add('crate-source-geometry-incomplete')
  if (request.load.carried.kind === 'attached') {
    if (
      request.load.carried.items.some((item) => item.shape.kind === 'unknown')
    )
      reasons.add('carried-source-geometry-unknown')
    if (
      request.load.carried.items.some(
        (item) => item.sourceCoverage !== 'complete'
      )
    )
      reasons.add('carried-source-geometry-incomplete')
  }
  for (const exclusion of demand.freePassage.exclusions) {
    if (
      exclusion.kind !== 'source' ||
      exclusion.mesh.descriptor.shape.kind !== 'triangles'
    )
      continue
    sourceExclusionBindings++
    let prepared: readonly QueryExactFrame[] | undefined
    world.push({
      owner: exclusion,
      shape: exclusion.mesh.descriptor.shape,
      region: exclusion.region,
      bounds: exclusion.bounds,
      clearanceExpanded: true,
      frames: () => (prepared ??= sceneFrames(exclusion.transform)),
      targetPartitions: targetsByMesh
        .get(exclusion.mesh)
        ?.get(exclusion.instance)
    })
  }
  // A selected target can be outside W1's route exclusion list. Include its
  // complete original regions, not merely the selected contact triangles.
  for (const contact of request.targetContacts) {
    const partition = contact.target.partition,
      shape = partition.mesh.descriptor.shape
    if (shape.kind !== 'triangles') continue
    for (const region of partition.mesh.regions) {
      if (
        world.some(
          (node) =>
            node.region === region &&
            node.targetPartitions?.some(
              (other) =>
                other.mesh === partition.mesh &&
                other.instance === partition.instance
            )
        )
      )
        continue
      const descriptorFrame = prepareQueryForwardFrame(
          partition.transform.descriptor
        ),
        instanceFrame = prepareQueryInstanceFrame(partition.transform.instance),
        min = [Infinity, Infinity, Infinity],
        max = [-Infinity, -Infinity, -Infinity]
      for (
        let offset = region.indexStart;
        offset < region.indexStart + region.indexCount;
        offset++
      ) {
        const vertex = shape.indices[offset] * 3
        const p = transformQueryPoint(
          descriptorFrame,
          transformQueryPoint(instanceFrame, [
            interval(shape.positions[vertex]),
            interval(shape.positions[vertex + 1]),
            interval(shape.positions[vertex + 2])
          ])
        )
        for (let axis = 0; axis < 3; axis++) {
          min[axis] = Math.min(min[axis], p[axis].low)
          max[axis] = Math.max(max[axis], p[axis].high)
        }
      }
      let prepared: readonly QueryExactFrame[] | undefined
      world.push({
        owner: partition,
        shape,
        region,
        bounds: {
          min: min as unknown as Point3,
          max: max as unknown as Point3
        },
        frames: () => (prepared ??= sceneFrames(partition.transform)),
        targetPartitions: [partition]
      })
    }
  }
  for (const terrain of request.terrain.regions) {
    const regions = external.get(terrain.sourceId)
    if (!regions) throw new Error('Missing admitted terrain regions')
    let prepared: readonly QueryExactFrame[] | undefined
    const bounds = bound(terrain.shape, terrain.frame)
    for (const region of regions)
      world.push({
        owner: terrain,
        shape: terrain.shape,
        region,
        bounds,
        frames: () => (prepared ??= chain(terrain.frame))
      })
  }
  const margin =
    demand.configuration.clearanceMargin.kind === 'bounded'
      ? demand.configuration.clearanceMargin.metres
      : 0
  if (demand.configuration.clearanceMargin.kind !== 'bounded')
    reasons.add('clearance-margin-unknown')
  const strictGap = (
    a: SceneDemandBounds | undefined,
    b: SceneDemandBounds | undefined,
    requiredMargin: number
  ) => {
    if (!a || !b) return false
    return a.max.some((value, axis) => {
      // Exact comparison of already outward endpoints; no rounded subtraction.
      const forward = difference(dyadic(b.min[axis]), dyadic(value)),
        backward = difference(dyadic(a.min[axis]), dyadic(b.max[axis]))
      return (
        (forward.significand > 0n &&
          compare(forward, dyadic(requiredMargin)) >= 0) ||
        (backward.significand > 0n &&
          compare(backward, dyadic(requiredMargin)) >= 0)
      )
    })
  }
  for (const segment of intervals.segments) {
    const self = coverage(),
      environment = coverage(),
      total = coverage(),
      boundaries: WalkingSourceRelations['segments'][number]['boundaries'][number][] =
        [],
      issues: WalkingSourceRelations['segments'][number]['issues'][number][] =
        []
    const issue = (reason: string, a: RelationSource, b: RelationSource) => {
      reasons.add(reason)
      if (!issues.some((item) => item.reason === reason))
        issues.push({ reason, first: a.region, second: b.region })
    }
    const knotIndex = request.path.knots.findIndex(
      (knot, index) =>
        knot.time <= segment.from &&
        (request.path.knots[index + 1]?.time ?? -Infinity) >= segment.until
    )
    const firstKnot = request.path.knots[knotIndex],
      lastKnot = request.path.knots[knotIndex + 1]
    if (!firstKnot || !lastKnot) throw new Error('Missing motion segment knot')
    const knots = [firstKnot, lastKnot]
    const constantJoints = knots.every(
      (knot) => JSON.stringify(knot.joints) === JSON.stringify(firstKnot.joints)
    )
    const constantOrientation = knots.every(
      (knot) =>
        knot.base.heading === firstKnot.base.heading &&
        knot.base.pitch === firstKnot.base.pitch &&
        knot.base.roll === firstKnot.base.roll
    )
    const linear = constantJoints && constantOrientation
    let bodyFrames: Map<string, WalkingRigidTransform> | undefined
    const bodyFrame = (body: WalkingRobotBody) => {
      if (!bodyFrames) {
        const pose = evaluateWalkingRobotPose(
          source,
          walkingMotionPoseAt(request.path, firstKnot.time)
        )
        pointFk++
        bodyFrames = new Map(
          pose.bodyTransforms.map((item) => [item.id, item.transform])
        )
      }
      const result = bodyFrames.get(body.id)
      if (!result) throw new Error('Missing source body frame')
      return result
    }
    const moving: RelationSource[] = []
    const envelopeByPart = new Map<
      WalkingRobotPart,
      Map<SourceRegion, SceneDemandBounds>
    >()
    for (const envelope of segment.envelopes) {
      let entries = envelopeByPart.get(envelope.part)
      if (!entries) {
        entries = new Map()
        envelopeByPart.set(envelope.part, entries)
      }
      entries.set(envelope.region, envelope.bounds)
    }
    for (const body of source.rig.bodies)
      for (const part of body.parts) {
        let prepared: readonly QueryExactFrame[] | undefined
        for (const region of part.regions)
          moving.push({
            owner: body,
            body,
            part,
            shape: part.shape,
            region,
            bounds: envelopeByPart.get(part)?.get(region),
            frames: () => (prepared ??= chain(part.localFrame, bodyFrame(body)))
          })
      }
    // Attachments are separate material owners even when a robot body carries them.
    if (segment.visited)
      for (const envelope of segment.carriedEnvelopes) {
        const regions = external.get(envelope.attachment.sourceId)
        if (!regions) throw new Error('Missing admitted carried regions')
        let prepared: readonly QueryExactFrame[] | undefined
        for (const region of regions)
          moving.push({
            owner: envelope.assembly,
            shape: envelope.attachment.shape,
            region,
            bounds: envelope.bounds,
            frames: () =>
              (prepared ??= chain(
                envelope.attachment.localFrame,
                bodyFrame(envelope.body)
              ))
          })
      }
    else {
      if (request.load.crate.kind === 'attached')
        for (const part of request.load.crate.sourceParts)
          for (const region of external.get(part.sourceId) ?? [])
            moving.push({
              owner: request.load.crate,
              shape: part.shape,
              region,
              frames: () => {
                throw new Error('Unvisited source frame')
              }
            })
      if (request.load.carried.kind === 'attached')
        for (const item of request.load.carried.items)
          if (item.shape.kind === 'triangles')
            for (const region of external.get(item.sourceId) ?? [])
              moving.push({
                owner: item,
                shape: item.shape,
                region,
                frames: () => {
                  throw new Error('Unvisited source frame')
                }
              })
    }
    const displacement = {
      from: firstKnot.base.position,
      until: lastKnot.base.position
    }
    const time = {
      from: segment.from,
      until: segment.until,
      pathFrom: firstKnot.time,
      pathUntil: lastKnot.time
    }
    if (
      displacement.from.some(
        (value, axis) => value !== displacement.until[axis]
      ) &&
      request.stance.phases.some(
        (phase) =>
          phase.from <= segment.from &&
          phase.until >= segment.until &&
          phase.legs.some((leg) => leg.state.kind === 'support')
      )
    )
      reasons.add('support-contact-motion-unproved')
    const query = (a: RelationSource, b: RelationSource, own: boolean) => {
      const counts = own ? self : environment
      counts.candidate++
      if (own && a.owner === b.owner) {
        counts.coRigidOwner++
        return
      }
      counts.required++
      if (
        !segment.visited ||
        visitedPairs >= request.budget.maxRegionPairs ||
        evaluator.exactBudgetExhausted ||
        envelopePairs >= request.budget.maxEnvelopePairs
      ) {
        counts.unvisited++
        issue('source-relation-budget-exhausted', a, b)
        return
      }
      visitedPairs++
      envelopePairs++
      if (
        strictGap(a.bounds, b.bounds, own || b.clearanceExpanded ? 0 : margin)
      ) {
        counts.strictBounds++
        return
      }
      if (!linear) {
        counts.unknown++
        issue('source-motion-exact-relation-unproved', a, b)
        return
      }
      let first: WalkingRegionPlacement, second: WalkingRegionPlacement
      let authority: 'completed-source-frame' | 'authored-fixed-parent-frame' =
        'completed-source-frame'
      try {
        first = {
          region: evaluator.prepare(a.shape, a.region),
          frames: a.frames(),
          ...(!own ? { displacement } : {})
        }
        second = {
          region: evaluator.prepare(b.shape, b.region),
          frames: b.frames()
        }
        if (own && a.body && b.body && a.part && b.part) {
          if (
            b.body.attachment === 'fixed' &&
            b.body.parentBodyId === a.body.id &&
            b.body.fixedFrame
          ) {
            first = { ...first, frames: chain(a.part.localFrame) }
            second = {
              ...second,
              frames: chain(b.part.localFrame, b.body.fixedFrame)
            }
            authority = 'authored-fixed-parent-frame'
          } else if (
            a.body.attachment === 'fixed' &&
            a.body.parentBodyId === b.body.id &&
            a.body.fixedFrame
          ) {
            first = {
              ...first,
              frames: chain(a.part.localFrame, a.body.fixedFrame)
            }
            second = { ...second, frames: chain(b.part.localFrame) }
            authority = 'authored-fixed-parent-frame'
          }
        }
      } catch {
        counts.unknown++
        issue('source-frame-unavailable', a, b)
        return
      }
      const relation = evaluator.relate(first, second, own ? 0 : margin, time)
      if (relation.kind === 'separated') {
        counts.exactSeparated++
        return
      }
      if (relation.kind === 'volume-overlap') {
        counts.blocked++
        issue('source-material-volume-overlap', a, b)
        return
      }
      if (relation.kind === 'boundary') {
        if (own && a.body && b.body && a.part && b.part) {
          const joint = source.rig.joints.find(
            (joint) =>
              (joint.parentBodyId === a.body?.id &&
                joint.childBodyId === b.body?.id) ||
              (joint.parentBodyId === b.body?.id &&
                joint.childBodyId === a.body?.id)
          )
          const declared =
            joint &&
            source.rig.jointInterfaces.find((item) => item.jointId === joint.id)
          const patches = (node: RelationSource): readonly SourcePatch[] => {
            if (declared && joint)
              return (
                node.body?.id === joint.parentBodyId
                  ? declared.parentPatches
                  : declared.childPatches
              )
                .filter((item) => item.part === node.part)
                .map((item) => item.patch)
            if (authority === 'authored-fixed-parent-frame')
              return (
                node.part?.patches.filter((patch) =>
                  patch.id.endsWith('-interface')
                ) ?? []
              )
            return []
          }
          const witness = evaluator.proveBoundary(
            first,
            second,
            relation,
            patches(a)
              .filter((patch) => patch.region === a.region)
              .flatMap((patch) => patch.ranges),
            patches(b)
              .filter((patch) => patch.region === b.region)
              .flatMap((patch) => patch.ranges)
          )
          if (witness) {
            counts.declaredBoundary++
            boundaries.push({
              first: a.region,
              second: b.region,
              witness,
              authority
            })
            return
          }
        }
        if (!own && a.part) {
          for (const contact of request.targetContacts) {
            if (
              contact.from !== segment.from ||
              contact.until !== segment.until ||
              contact.robot.part !== a.part ||
              contact.robot.region !== a.region ||
              !b.targetPartitions?.includes(contact.target.partition)
            )
              continue
            const witness = evaluator.proveBoundary(
              first,
              second,
              relation,
              contact.robot.patch.ranges,
              contact.target.ranges
            )
            if (witness) {
              counts.targetRefinement++
              issue('target-contact-refinement-required', a, b)
              return
            }
          }
        }
        counts.unknown++
        issue('source-boundary-locus-unproved', a, b)
        return
      }
      counts.unknown++
      issue('source-region-relation-unproved', a, b)
    }
    for (let i = 0; i < moving.length; i++)
      for (let j = i + 1; j < moving.length; j++)
        query(moving[i], moving[j], true)
    for (const a of moving) for (const b of world) query(a, b, false)
    for (const key of Object.keys(total) as (keyof RelationCoverage)[])
      total[key] = self[key] + environment[key]
    segments.push({
      from: segment.from,
      until: segment.until,
      coverage: total,
      self,
      environment,
      boundaries,
      issues
    })
  }
  let status: WalkingSourceRelations['status'] =
    reasons.size > 0 ? 'unknown' : 'clear'
  if (segments.some((segment) => segment.coverage.blocked > 0))
    status = 'blocked'
  return freeze({
    format: 'walking-source-relations/1',
    source,
    demand,
    request,
    terrain: request.terrain,
    path: request.path,
    stance: request.stance,
    load: request.load,
    evaluation: request.evaluation,
    status,
    reasons: [...reasons],
    segments,
    work: {
      ...evaluator.work,
      framePreparations,
      envelopePairs,
      pointFk,
      targetPartitionVisits,
      sourceExclusionBindings
    }
  })
}
const negative = (a: Dyadic): Dyadic => ({
  significand: -a.significand,
  exponent: a.exponent
})
const difference = (a: Dyadic, b: Dyadic) => sum(a, negative(b))
const product = (a: Dyadic, b: Dyadic): Dyadic => ({
  significand: a.significand * b.significand,
  exponent: a.exponent + b.exponent
})
const compare = (a: Dyadic, b: Dyadic) => {
  const value = difference(a, b).significand
  if (value < 0n) return -1
  return value > 0n ? 1 : 0
}
const point = (p: Point3): ExactPoint => [
  dyadic(p[0]),
  dyadic(p[1]),
  dyadic(p[2])
]
const delta = (a: ExactPoint, b: ExactPoint): ExactPoint => [
  difference(a[0], b[0]),
  difference(a[1], b[1]),
  difference(a[2], b[2])
]
const cross = (a: ExactPoint, b: ExactPoint): ExactPoint => [
  difference(product(a[1], b[2]), product(a[2], b[1])),
  difference(product(a[2], b[0]), product(a[0], b[2])),
  difference(product(a[0], b[1]), product(a[1], b[0]))
]
const dot = (a: ExactPoint, b: ExactPoint) =>
  sum(sum(product(a[0], b[0]), product(a[1], b[1])), product(a[2], b[2]))
const isZero = (p: ExactPoint) => p.every((value) => value.significand === 0n)
const freeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
function directionKey(axis: ExactPoint) {
  const exponent = Math.min(...axis.map((value) => value.exponent))
  const integers = axis.map(
    (value) => value.significand << BigInt(value.exponent - exponent)
  )
  const gcd = (a: bigint, b: bigint): bigint => {
    while (b !== 0n) {
      const next = a % b
      a = b
      b = next
    }
    return a < 0n ? -a : a
  }
  const divisor = integers.reduce((a, b) => gcd(a, b), 0n)
  if (divisor === 0n) return ''
  const sign = (integers.find((value) => value !== 0n) ?? 1n) < 0n ? -1n : 1n
  return integers.map((value) => (value / divisor) * sign).join(',')
}
function uniqueDirections(values: readonly ExactPoint[]) {
  const unique = new Map<string, ExactPoint>()
  for (const value of values) {
    const key = directionKey(value)
    if (key && !unique.has(key)) unique.set(key, value)
  }
  return [...unique.values()]
}
interface Fraction {
  readonly numerator: bigint
  readonly denominator: bigint
}
interface TimeBound {
  value: Fraction
  strict: boolean
}
interface TimeRange {
  low: TimeBound
  high: TimeBound
  empty: boolean
}
const fractionCompare = (a: Fraction, b: Fraction) => {
  const value = a.numerator * b.denominator - b.numerator * a.denominator
  if (value < 0n) return -1
  return value > 0n ? 1 : 0
}
function ratio(a: Dyadic, b: Dyadic): Fraction {
  if (b.significand === 0n) throw new Error('Zero exact time denominator')
  const shift = a.exponent - b.exponent
  let numerator = a.significand,
    denominator = b.significand
  if (shift >= 0) numerator <<= BigInt(shift)
  else denominator <<= BigInt(-shift)
  if (denominator < 0n) {
    numerator = -numerator
    denominator = -denominator
  }
  return { numerator, denominator }
}
const timeRange = (): TimeRange => ({
  low: { value: { numerator: 0n, denominator: 1n }, strict: false },
  high: { value: { numerator: 1n, denominator: 1n }, strict: false },
  empty: false
})
function constrain(
  range: TimeRange,
  offset: Dyadic,
  slope: Dyadic,
  strict: boolean
) {
  if (range.empty) return
  if (slope.significand === 0n) {
    range.empty = strict ? offset.significand <= 0n : offset.significand < 0n
    return
  }
  const threshold = ratio(negative(offset), slope),
    key = slope.significand > 0n ? 'low' : 'high'
  const order = fractionCompare(threshold, range[key].value)
  if ((key === 'low' && order > 0) || (key === 'high' && order < 0))
    range[key] = { value: threshold, strict }
  else if (order === 0) range[key].strict ||= strict
  const crossed = fractionCompare(range.low.value, range.high.value)
  range.empty =
    crossed > 0 || (crossed === 0 && (range.low.strict || range.high.strict))
}

export interface WalkingPreparedSourceRegion {
  readonly shape: Shape
  readonly region: SourceRegion
  readonly points: readonly ExactPoint[]
  readonly triangles: readonly Triangle[]
  readonly certified: boolean
}
export interface WalkingRegionPlacement {
  readonly region: WalkingPreparedSourceRegion
  readonly frames: readonly QueryExactFrame[]
  readonly translation?: Point3
  readonly displacement?: Readonly<{ from: Point3; until: Point3 }>
  readonly motion?: 'unproved'
}
export interface WalkingRegionRelation {
  readonly kind: 'separated' | 'volume-overlap' | 'boundary' | 'unknown'
  readonly proof:
    'strict-bounds' | 'complete-sat' | 'linear-time-sat' | 'unproved'
  readonly axis?: ExactPoint
  readonly firstFeature?: readonly number[]
  readonly secondFeature?: readonly number[]
}
interface PlacedRegion {
  readonly points: readonly ExactPoint[]
  readonly normals: readonly ExactPoint[]
  readonly edges: readonly ExactPoint[]
}
const exhausted = Symbol('walking exact predicate budget')
const unproved = freeze({ kind: 'unknown', proof: 'unproved' } as const)
const axes: readonly ExactPoint[] = [
  point([1, 0, 0]),
  point([0, 1, 0]),
  point([0, 0, 1])
]

/** One evaluation owns preparation, transformed products and finite exact work. */
export class WalkingSourceRelationEvaluator {
  private readonly regions = new Map<
    Shape,
    Map<SourceRegion, WalkingPreparedSourceRegion>
  >()
  private readonly placed = new Map<
    WalkingPreparedSourceRegion,
    Map<readonly QueryExactFrame[], PlacedRegion>
  >()
  private readonly issued = new WeakSet<object>()
  private readonly boundaries = new WeakMap<
    object,
    { first: WalkingRegionPlacement; second: WalkingRegionPlacement }
  >()
  private readonly counters = {
    regionPreparations: 0,
    sourceVertices: 0,
    transformPreparations: 0,
    regionPairs: 0,
    unvisitedRegionPairs: 0,
    exactPredicates: 0
  }
  private readonly limits: {
    maxRegionPairs: number
    maxExactPredicates: number
  }
  constructor(limits: { maxRegionPairs: number; maxExactPredicates: number }) {
    if (
      !Object.values(limits).every(
        (value) => Number.isSafeInteger(value) && value > 0
      )
    )
      throw new Error('Invalid source relation budget')
    this.limits = { ...limits }
  }
  get work() {
    return Object.freeze({ ...this.counters })
  }
  get exactBudgetExhausted() {
    return this.counters.exactPredicates >= this.limits.maxExactPredicates
  }
  private predicate() {
    if (this.counters.exactPredicates >= this.limits.maxExactPredicates)
      throw exhausted
    this.counters.exactPredicates++
  }
  prepare(shape: Shape, region: SourceRegion): WalkingPreparedSourceRegion {
    if (
      !Object.isFrozen(shape) ||
      !Object.isFrozen(shape.positions) ||
      !Object.isFrozen(shape.indices) ||
      !Object.isFrozen(region)
    )
      throw new Error('Source relation requires immutable admitted geometry')
    const prior = this.regions.get(shape)?.get(region)
    if (prior) return prior
    if (
      !Number.isSafeInteger(region.indexStart) ||
      !Number.isSafeInteger(region.indexCount) ||
      region.indexStart < 0 ||
      region.indexCount <= 0 ||
      region.indexStart % 3 !== 0 ||
      region.indexCount % 3 !== 0 ||
      region.indexStart + region.indexCount > shape.indices.length
    )
      throw new Error('Invalid source region range')
    this.counters.regionPreparations++
    const points: ExactPoint[] = [],
      triangles: Triangle[] = [],
      ids = new Map<string, number>()
    const vertex = (index: number) => {
      if (
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index * 3 + 2 >= shape.positions.length
      )
        throw new Error('Invalid source triangle index')
      const p: Point3 = [
          shape.positions[index * 3],
          shape.positions[index * 3 + 1],
          shape.positions[index * 3 + 2]
        ],
        key = p.join(',')
      const existing = ids.get(key)
      if (existing !== undefined) return existing
      const id = points.length
      points.push(point(p))
      ids.set(key, id)
      this.counters.sourceVertices++
      return id
    }
    for (
      let offset = region.indexStart;
      offset < region.indexStart + region.indexCount;
      offset += 3
    )
      triangles.push([
        vertex(shape.indices[offset]),
        vertex(shape.indices[offset + 1]),
        vertex(shape.indices[offset + 2])
      ])
    let certified = region.kind === 'closed-solid'
    try {
      if (certified) {
        const edges = new Map<string, { count: number; balance: number }>()
        let dimensional = false
        for (const triangle of triangles) {
          const [a, b, c] = triangle,
            normal = cross(
              delta(points[b], points[a]),
              delta(points[c], points[a])
            )
          this.predicate()
          if (isZero(normal)) {
            certified = false
            break
          }
          let positive = false,
            negativeSide = false
          for (const p of points) {
            this.predicate()
            const side = dot(normal, delta(p, points[a])).significand
            positive ||= side > 0n
            negativeSide ||= side < 0n
          }
          if (positive && negativeSide) {
            certified = false
            break
          }
          dimensional ||= positive || negativeSide
          for (let edge = 0; edge < 3; edge++) {
            const first = triangle[edge],
              second = triangle[(edge + 1) % 3],
              key = first < second ? first + ':' + second : second + ':' + first
            const count = edges.get(key) ?? { count: 0, balance: 0 }
            count.count++
            count.balance += first < second ? 1 : -1
            edges.set(key, count)
          }
        }
        certified &&=
          dimensional &&
          [...edges.values()].every(
            (edge) => edge.count === 2 && edge.balance === 0
          )
      }
    } catch (error) {
      if (error !== exhausted) throw error
      certified = false
    }
    const result = freeze({ shape, region, points, triangles, certified })
    let products = this.regions.get(shape)
    if (!products) {
      products = new Map()
      this.regions.set(shape, products)
    }
    products.set(region, result)
    this.issued.add(result)
    return result
  }
  private place(input: WalkingRegionPlacement): PlacedRegion {
    const reusable =
      Object.isFrozen(input.frames) &&
      input.frames.every((frame) => Object.isFrozen(frame))
    const previous = reusable
      ? this.placed.get(input.region)?.get(input.frames)
      : undefined
    if (previous) return previous
    if (!this.issued.has(input.region))
      throw new Error('Unissued prepared source region')
    for (const frame of input.frames) {
      this.predicate()
      if (
        dot(frame.matrix[0], cross(frame.matrix[1], frame.matrix[2]))
          .significand === 0n
      )
        throw new Error('Singular source placement')
    }
    const points = input.region.points.map((p) => {
      let result = p
      for (const frame of input.frames) {
        const value = (axis: number) =>
          sum(dot(frame.matrix[axis], result), frame.position[axis])
        result = [value(0), value(1), value(2)]
      }
      return result
    })
    const normals: ExactPoint[] = [],
      edges: ExactPoint[] = []
    for (const [a, b, c] of input.region.triangles) {
      normals.push(
        cross(delta(points[b], points[a]), delta(points[c], points[a]))
      )
      edges.push(
        delta(points[b], points[a]),
        delta(points[c], points[b]),
        delta(points[a], points[c])
      )
    }
    const result = {
      points,
      normals: uniqueDirections(normals),
      edges: uniqueDirections(edges)
    }
    let products = this.placed.get(input.region)
    if (!products) {
      products = new Map()
      this.placed.set(input.region, products)
    }
    if (reusable) products.set(input.frames, result)
    this.counters.transformPreparations++
    return result
  }
  private projection(points: readonly ExactPoint[], axis: ExactPoint) {
    let min: Dyadic | undefined, max: Dyadic | undefined
    for (const p of points) {
      this.predicate()
      const value = dot(p, axis)
      if (min === undefined || compare(value, min) < 0) min = value
      if (max === undefined || compare(value, max) > 0) max = value
    }
    if (min === undefined || max === undefined)
      throw new Error('Empty source projection')
    return { min, max }
  }
  /** A sufficient whole-support-feature proof. An unproved subset stays unknown. */
  proveBoundary(
    first: WalkingRegionPlacement,
    second: WalkingRegionPlacement,
    relation: WalkingRegionRelation,
    firstRanges: readonly SourceTriangleRange[],
    secondRanges: readonly SourceTriangleRange[]
  ):
    | Readonly<{
        axis: ExactPoint
        firstTriangle: number
        secondTriangle: number
      }>
    | undefined {
    const binding = this.boundaries.get(relation)
    if (
      !binding ||
      binding.first !== first ||
      binding.second !== second ||
      !relation.axis ||
      !relation.firstFeature ||
      !relation.secondFeature
    )
      return undefined
    const covered = (
      placement: WalkingRegionPlacement,
      feature: readonly number[],
      ranges: readonly SourceTriangleRange[]
    ) => {
      if (
        ranges.some(
          (range) =>
            !Number.isSafeInteger(range.indexStart) ||
            !Number.isSafeInteger(range.indexCount) ||
            range.indexStart < 0 ||
            range.indexCount <= 0 ||
            range.indexStart % 3 !== 0 ||
            range.indexCount % 3 !== 0 ||
            !Number.isSafeInteger(range.indexStart + range.indexCount)
        )
      )
        return undefined
      const vertices = new Set(feature),
        coveredVertices = new Set<number>(),
        triangles: number[] = []
      placement.region.triangles.forEach((triangle, index) => {
        this.predicate()
        if (!triangle.every((vertex) => vertices.has(vertex))) return
        const original = placement.region.region.indexStart + index * 3
        if (
          !ranges.some(
            (range) =>
              original >= range.indexStart &&
              original + 3 <= range.indexStart + range.indexCount
          )
        )
          return
        triangles.push(index)
        triangle.forEach((vertex) => coveredVertices.add(vertex))
      })
      // For a certified convex cell, all coplanar original face triangles form
      // its supporting face. Require every one, not merely its corner vertices.
      const complete = placement.region.triangles.every(
        (triangle, index) =>
          !triangle.every((vertex) => vertices.has(vertex)) ||
          triangles.includes(index)
      )
      return complete &&
        triangles.length > 0 &&
        feature.every((vertex) => coveredVertices.has(vertex))
        ? triangles
        : undefined
    }
    try {
      const firstTriangles = covered(first, relation.firstFeature, firstRanges),
        secondTriangles = covered(second, relation.secondFeature, secondRanges)
      if (!firstTriangles || !secondTriangles) return undefined
      const a = this.place(first),
        b = this.place(second),
        normal = relation.axis
      for (const i of firstTriangles)
        for (const j of secondTriangles) {
          const firstPoints = first.region.triangles[i].map(
              (index) => a.points[index]
            ),
            secondPoints = second.region.triangles[j].map(
              (index) => b.points[index]
            )
          // Complete planar triangle SAT retains an intersecting original pair,
          // including an edge/vertex witness in the named triangle closures.
          const directions = [
            ...firstPoints.map((p, index) =>
              cross(normal, delta(firstPoints[(index + 1) % 3], p))
            ),
            ...secondPoints.map((p, index) =>
              cross(normal, delta(secondPoints[(index + 1) % 3], p))
            )
          ]
          const intersects = directions
            .filter((axis) => !isZero(axis))
            .every((axis) => {
              const left = this.projection(firstPoints, axis),
                right = this.projection(secondPoints, axis)
              return (
                compare(left.max, right.min) >= 0 &&
                compare(right.max, left.min) >= 0
              )
            })
          if (intersects)
            return freeze({
              axis: normal,
              firstTriangle: first.region.region.indexStart + i * 3,
              secondTriangle: second.region.region.indexStart + j * 3
            })
        }
      return undefined
    } catch (error) {
      if (error !== exhausted) throw error
      return undefined
    }
  }
  relate(
    first: WalkingRegionPlacement,
    second: WalkingRegionPlacement,
    margin: number,
    time?: Readonly<{
      from: number
      until: number
      pathFrom: number
      pathUntil: number
    }>
  ): WalkingRegionRelation {
    if (!Number.isFinite(margin) || margin < 0)
      throw new Error('Invalid source clearance margin')
    if (this.counters.regionPairs >= this.limits.maxRegionPairs) {
      this.counters.unvisitedRegionPairs++
      return unproved
    }
    this.counters.regionPairs++
    if (
      !first.region.certified ||
      !second.region.certified ||
      first.motion === 'unproved' ||
      second.motion === 'unproved'
    )
      return unproved
    try {
      const motion = (placement: WalkingRegionPlacement) => {
        if (placement.translation && placement.displacement)
          throw new Error('Ambiguous source translation')
        return placement.displacement
          ? delta(
              point(placement.displacement.until),
              point(placement.displacement.from)
            )
          : point(placement.translation ?? [0, 0, 0])
      }
      const a = this.place(first),
        b = this.place(second),
        velocity = delta(motion(first), motion(second))
      const gapEnough = (gap: Dyadic, axis: ExactPoint) =>
        gap.significand > 0n &&
        compare(
          product(gap, gap),
          product(product(dyadic(margin), dyadic(margin)), dot(axis, axis))
        ) >= 0
      const wholeGap = (
        left: { min: Dyadic; max: Dyadic },
        right: { min: Dyadic; max: Dyadic },
        slope: Dyadic,
        axis: ExactPoint
      ) => {
        const forward = difference(right.min, left.max),
          backward = difference(left.min, right.max)
        return (
          gapEnough(
            compare(slope, zero) > 0 ? difference(forward, slope) : forward,
            axis
          ) ||
          gapEnough(
            compare(slope, zero) < 0 ? sum(backward, slope) : backward,
            axis
          )
        )
      }
      for (const axis of axes)
        if (
          wholeGap(
            this.projection(a.points, axis),
            this.projection(b.points, axis),
            dot(velocity, axis),
            axis
          )
        )
          return freeze({ kind: 'separated', proof: 'strict-bounds' })
      const completeAxes = uniqueDirections([
        ...a.normals,
        ...b.normals,
        ...a.edges.flatMap((edge) => b.edges.map((other) => cross(edge, other)))
      ])
      const closed = timeRange(),
        interior = timeRange()
      if (time) {
        if (
          ![time.from, time.until, time.pathFrom, time.pathUntil].every(
            Number.isFinite
          ) ||
          time.pathFrom >= time.pathUntil ||
          time.from < time.pathFrom ||
          time.until > time.pathUntil ||
          time.from > time.until
        )
          throw new Error('Invalid exact motion interval')
        const duration = difference(
          dyadic(time.pathUntil),
          dyadic(time.pathFrom)
        )
        const low = ratio(
            difference(dyadic(time.from), dyadic(time.pathFrom)),
            duration
          ),
          high = ratio(
            difference(dyadic(time.until), dyadic(time.pathFrom)),
            duration
          )
        for (const range of [closed, interior]) {
          range.low = { value: low, strict: false }
          range.high = { value: high, strict: false }
        }
      }
      let contactAxis: ExactPoint | undefined, contactLevel: Dyadic | undefined
      let marginSeparated = false
      for (const axis of completeAxes) {
        const left = this.projection(a.points, axis),
          right = this.projection(b.points, axis),
          slope = dot(velocity, axis)
        marginSeparated ||= wholeGap(left, right, slope, axis)
        const forward = difference(left.max, right.min),
          backward = difference(right.max, left.min)
        constrain(closed, forward, slope, false)
        constrain(closed, backward, negative(slope), false)
        constrain(interior, forward, slope, true)
        constrain(interior, backward, negative(slope), true)
        if (isZero(velocity)) {
          if (compare(left.max, right.min) === 0) {
            contactAxis = axis
            contactLevel = left.max
          } else if (compare(right.max, left.min) === 0) {
            contactAxis = [
              negative(axis[0]),
              negative(axis[1]),
              negative(axis[2])
            ]
            contactLevel = negative(left.min)
          }
        }
      }
      const proof = isZero(velocity) ? 'complete-sat' : 'linear-time-sat'
      if (marginSeparated) return freeze({ kind: 'separated', proof })
      if (!interior.empty) return freeze({ kind: 'volume-overlap', proof })
      if (closed.empty)
        return margin === 0 ? freeze({ kind: 'separated', proof }) : unproved
      if (margin !== 0) return unproved
      if (contactAxis && contactLevel) {
        const axis = contactAxis,
          level = contactLevel
        const feature = (points: readonly ExactPoint[]) =>
          points.flatMap((p, index) =>
            compare(dot(p, axis), level) === 0 ? [index] : []
          )
        const result = freeze({
          kind: 'boundary',
          proof,
          axis: contactAxis,
          firstFeature: feature(a.points),
          secondFeature: feature(b.points)
        } as const)
        this.boundaries.set(result, { first, second })
        return result
      }
      return freeze({ kind: 'boundary', proof })
    } catch (error) {
      if (error !== exhausted) throw error
      return unproved
    }
  }
}
