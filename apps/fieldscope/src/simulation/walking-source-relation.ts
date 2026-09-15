import type { Point3 } from '../domain/greenhouse'
import type { WalkingMountedCrate } from '../domain/walking-mounted-crate'
import type { RobotPart } from '../domain/robot-model'
import type {
  WalkingCurrentCycle,
  WalkingCurrentMountedCrate
} from '../domain/walking-motion-contract'
import type {
  ConstrainedFraction,
  ConstrainedFrame
} from '../domain/walking-constrained-kinematics'
import type {
  SourceRegion,
  SourceTriangleRange,
  SourcePatch
} from '../domain/source-occupancy'
import {
  dyadic,
  interval,
  type Dyadic,
  type Interval,
  roundFraction,
  add as addInterval,
  subtract as subtractInterval,
  multiply as multiplyInterval
} from '../domain/scalar-arithmetic'
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
  readWalkingNonlinearMotionRequest,
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
const noFrames: readonly QueryExactFrame[] = Object.freeze([])
function sourceRelationValue<T>(value: T | undefined | null): T {
  if (value === undefined || value === null)
    throw new Error('Missing source relation dependency')
  return value
}
const scalarBudget = Symbol('source relation node arithmetic')
interface RationalArithmeticBudget {
  readonly maxBits: number
  readonly count: () => void
  readonly observeBits: (bits: number) => void
}
type BudgetedDyadic = Dyadic & {
  readonly [scalarBudget]?: RationalArithmeticBudget
}
const integerBits = (n: bigint) => (n < 0n ? -n : n).toString(2).length
function boundedScalar(
  value: Dyadic,
  budget: RationalArithmeticBudget | undefined
): Dyadic {
  if (budget) Object.defineProperty(value, scalarBudget, { value: budget })
  return value
}
function scalarAccount(a: Dyadic, b?: Dyadic) {
  const first = (a as BudgetedDyadic)[scalarBudget],
    second = (b as BudgetedDyadic | undefined)?.[scalarBudget]
  if (first && second && first !== second)
    throw new Error('Different rational source nodes')
  return first ?? second
}
function scalarWork(
  budget: RationalArithmeticBudget | undefined,
  bits: number
) {
  if (!budget) return
  budget.count()
  budget.observeBits(bits)
  if (bits > budget.maxBits) throw exhausted
}
const sum = (a: Dyadic, b: Dyadic): Dyadic => {
  const exponent = Math.min(a.exponent, b.exponent)
  const budget = scalarAccount(a, b)
  scalarWork(
    budget,
    Math.max(
      integerBits(a.significand) + a.exponent - exponent,
      integerBits(b.significand) + b.exponent - exponent
    ) + 1
  )
  return boundedScalar(
    {
      significand:
        (a.significand << BigInt(a.exponent - exponent)) +
        (b.significand << BigInt(b.exponent - exponent)),
      exponent
    },
    budget
  )
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
const negative = (a: Dyadic): Dyadic => {
  const budget = scalarAccount(a)
  scalarWork(budget, integerBits(a.significand))
  return boundedScalar(
    { significand: -a.significand, exponent: a.exponent },
    budget
  )
}
const difference = (a: Dyadic, b: Dyadic) => sum(a, negative(b))
const product = (a: Dyadic, b: Dyadic): Dyadic => {
  const budget = scalarAccount(a, b)
  scalarWork(budget, integerBits(a.significand) + integerBits(b.significand))
  return boundedScalar(
    {
      significand: a.significand * b.significand,
      exponent: a.exponent + b.exponent
    },
    budget
  )
}
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
  const budget = axis.map((v) => scalarAccount(v)).find(Boolean)
  const exponent = Math.min(...axis.map((value) => value.exponent))
  const integers = axis.map((value) => {
    scalarWork(
      budget,
      integerBits(value.significand) + value.exponent - exponent
    )
    return value.significand << BigInt(value.exponent - exponent)
  })
  const gcd = (a: bigint, b: bigint): bigint => {
    while (b !== 0n) {
      scalarWork(budget, Math.max(integerBits(a), integerBits(b)))
      const next = a % b
      a = b
      b = next
    }
    return a < 0n ? -a : a
  }
  const divisor = integers.reduce((a, b) => gcd(a, b), 0n)
  if (divisor === 0n) return ''
  const sign = (integers.find((value) => value !== 0n) ?? 1n) < 0n ? -1n : 1n
  return integers
    .map((value) => {
      scalarWork(budget, integerBits(value))
      return (value / divisor) * sign
    })
    .join(',')
}
function* uniqueDirectionIterator(
  values: Iterable<ExactPoint>,
  observe?: (event: 'candidate' | 'unique' | 'duplicate' | 'zero') => void
): Generator<ExactPoint> {
  const unique = new Map<string, ExactPoint>()
  for (const value of values) {
    observe?.('candidate')
    const key = directionKey(value)
    if (!key) observe?.('zero')
    else if (unique.has(key)) observe?.('duplicate')
    if (key && !unique.has(key)) {
      const budget = value.map((v) => scalarAccount(v)).find(Boolean)
      // Positive-divisor reduction keeps the authored orientation, while
      // removing homogeneous factors already found by the canonical key.
      const sign =
        sourceRelationValue(value.find((v) => v.significand !== 0n))
          .significand < 0n
          ? -1n
          : 1n
      const normalized = budget
        ? (key.split(',').map((v) => {
            scalarWork(budget, v.length)
            return boundedScalar(
              { significand: BigInt(v) * sign, exponent: 0 },
              budget
            )
          }) as unknown as ExactPoint)
        : value
      unique.set(key, normalized)
      observe?.('unique')
      yield normalized
    }
  }
}
function uniqueDirections(values: readonly ExactPoint[]) {
  return [...uniqueDirectionIterator(values)]
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
export interface WalkingSheetTriangleRelation {
  readonly kind: 'separated' | 'surface-intersection' | 'unknown'
  readonly proof: 'strict-bounds' | 'complete-triangle-sat' | 'unproved'
  readonly triangleOffset: number
  readonly axis?: ExactPoint
}
/** Mathematical interval inputs, not a current walking-admission receipt. */
export interface WalkingSheetRegionIntervalInput {
  readonly solid: Readonly<{
    placement: WalkingRegionPlacement
    indices: readonly number[]
    vertices: VertexBounds
  }>
  readonly sheet: Readonly<{
    placement: WalkingRegionPlacement
    indices: readonly number[]
    vertices: VertexBounds
  }>
  readonly node: WalkingRationalSourceNode
  readonly parameter: NonlinearParameter
  readonly margin: number
}
export interface WalkingSheetRegionIntervalRelation {
  readonly input: WalkingSheetRegionIntervalInput
  readonly kind: 'separated' | 'pending' | 'blocked' | 'unknown'
  readonly triangleOffset?: number
  readonly work: Readonly<{
    required: number
    visited: number
    unvisited: number
    projectionVertices: number
  }>
}
type VertexBounds = readonly (readonly [Interval, Interval, Interval])[]
function sourceIntervalAxisGap(
  a: VertexBounds,
  b: VertexBounds,
  axis: ExactPoint,
  margin: number,
  maxBits: number,
  visit: () => void
): boolean {
  const normalizedAxis = (axis: ExactPoint): readonly Interval[] => {
    const shift = Math.max(
      ...axis.map((v) => integerBits(v.significand) + v.exponent)
    )
    return axis.map((v) => {
      const power = v.exponent - shift
      const n = power >= 0 ? v.significand << BigInt(power) : v.significand,
        d = power < 0 ? 1n << BigInt(-power) : 1n
      if (Math.max(integerBits(n), integerBits(d)) > maxBits)
        throw new Error('Nonlinear axis bit budget exhausted')
      return {
        low: roundFraction(n, d, 'down'),
        high: roundFraction(n, d, 'up')
      }
    })
  }
  const axisGap = (
    a: VertexBounds,
    b: VertexBounds,
    axis: ExactPoint,
    margin: number
  ) => {
    const direction = normalizedAxis(axis)
    const projection = (points: VertexBounds) => {
      let min = Infinity,
        max = -Infinity
      for (const p of points) {
        visit()
        const value = direction.reduce(
          (sum, q, k) => addInterval(sum, multiplyInterval(q, p[k])),
          interval(0)
        )
        min = Math.min(min, value.low)
        max = Math.max(max, value.high)
      }
      return { min, max }
    }
    const left = projection(a),
      right = projection(b)
    if (!left || !right) return false
    const norm = direction.reduce(
      (sum, v) =>
        addInterval(
          sum,
          multiplyInterval(
            interval(Math.max(Math.abs(v.low), Math.abs(v.high))),
            interval(Math.max(Math.abs(v.low), Math.abs(v.high)))
          )
        ),
      interval(0)
    )
    const needed = multiplyInterval(
      multiplyInterval(interval(margin), interval(margin)),
      norm
    )
    return [
      subtractInterval(interval(right.min), interval(left.max)),
      subtractInterval(interval(left.min), interval(right.max))
    ].some(
      (gap) =>
        gap.low > 0 &&
        multiplyInterval(interval(gap.low), interval(gap.low)).low >=
          needed.high
    )
  }

  return axisGap(a, b, axis, margin)
}

interface PlacedRegion {
  readonly points: readonly ExactPoint[]
  readonly triangles: readonly Triangle[]
}
interface PlacedDirections {
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
export interface WalkingRationalSourceNode {
  readonly scale: Dyadic
  readonly frames: readonly QueryExactFrame[]
  readonly chains: readonly (readonly QueryExactFrame[])[]
  readonly maxBits: number
}
export interface WalkingFootExtrusion {
  readonly authority: 'convex-source-foot-extrusion/1'
  readonly part: WalkingRobotPart
  readonly region: SourceRegion
  readonly patch: SourcePatch
  readonly axis: 0 | 1 | 2
  readonly extrusionSign: 1 | -1
  readonly planeCoordinate: number
  readonly patchVertexIndices: readonly number[]
  readonly sourceTriangleOffsets: readonly number[]
  readonly patchTriangleOffsets: readonly number[]
  readonly supportingEdges: readonly Readonly<{
    triangleOffset: number
    firstVertexIndex: number
    secondVertexIndex: number
  }>[]
  readonly witness: Readonly<{
    sourceTriangleOffset: number
    patchTriangleOffset: number
  }>
}
export interface WalkingRegionCoverPart {
  readonly shape: Shape
  readonly regions: readonly SourceRegion[]
  readonly frameIndex: number
  /** Present only for the canonical nonlinear inventory issued with a cycle node. */
  readonly inputs?: readonly WalkingNonlinearRelationInput[]
}
export interface WalkingRegionCoverGroup {
  readonly parts: readonly WalkingRegionCoverPart[]
}
export interface WalkingRegionSpan {
  readonly start: number
  readonly count: number
}
export interface WalkingRegionCover {
  readonly first: WalkingRegionSpan
  readonly second: WalkingRegionSpan
  readonly ordinal: readonly [number, number]
  readonly cardinality: number
  readonly kind: 'strictBounds' | 'leaf' | 'unvisited'
}
interface RegionCoverBranch extends WalkingRegionSpan {
  readonly children?: readonly RegionCoverBranch[]
  readonly bounds: () => SceneDemandBounds
}
interface RegionCoverTask {
  first: RegionCoverBranch
  second: RegionCoverBranch
  from: number
  until: number
  depth: number
}
export interface WalkingCycleRegionNode {
  readonly request: import('../domain/walking-motion-contract').WalkingNonlinearMotionRequest
  readonly bounds: NonlinearCycleBound
}
const cycleRegionNodes = new WeakMap<
  WalkingCycleRegionNode,
  {
    evaluator: WalkingSourceRelationEvaluator
    current: import('../domain/walking-motion-contract').WalkingCurrentCycle
    inputs: readonly WalkingNonlinearRelationInput[]
  }
>()
const joinedRegionBounds = (
  values: readonly SceneDemandBounds[]
): SceneDemandBounds => {
  const min: [number, number, number] = [Infinity, Infinity, Infinity],
    max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const value of values)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], value.min[k])
      max[k] = Math.max(max[k], value.max[k])
    }
  if (![...min, ...max].every(Number.isFinite))
    throw new Error('Unbounded region cover source')
  return Object.freeze({ min: Object.freeze(min), max: Object.freeze(max) })
}
const strictRegionBounds = (
  a: SceneDemandBounds,
  b: SceneDemandBounds,
  margin: number
) =>
  a.max.some((v, k) => {
    const left = difference(dyadic(b.min[k]), dyadic(v)),
      right = difference(dyadic(a.min[k]), dyadic(b.max[k]))
    return (
      (left.significand > 0n && compare(left, dyadic(margin)) >= 0) ||
      (right.significand > 0n && compare(right, dyadic(margin)) >= 0)
    )
  })
/** One cursor for static exact frames and canonical whole-phase bounds. */
function regionCoverCursor(
  roots: readonly RegionCoverBranch[],
  inventory: readonly Readonly<{
    shape: Shape
    region: SourceRegion
    frameIndex: number
  }>[],
  options: Readonly<{
    movingGroups: number
    maxGroupPairs: number
    maxLeaves: number
    margin: number
  }>,
  check: () => void,
  predicate: () => void,
  marginFor: (second: number) => number
) {
  const work = { groupPairs: 0, leafPairs: 0 }
  const heap: RegionCoverTask[] = []
  const key = (t: RegionCoverTask) => [
    t.first.start + Math.floor(t.from / t.second.count),
    t.second.start + (t.from % t.second.count),
    t.depth,
    t.from
  ]
  const less = (a: RegionCoverTask, b: RegionCoverTask) => {
    const x = key(a),
      y = key(b)
    for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] < y[k]
    return false
  }
  const push = (t: RegionCoverTask) => {
    let i = heap.length
    heap.push(t)
    while (i) {
      const p = (i - 1) >> 1
      if (!less(t, heap[p])) break
      heap[i] = heap[p]
      i = p
    }
    heap[i] = t
  }
  const pop = () => {
    const first = heap[0],
      last = sourceRelationValue(heap.pop())
    if (heap.length) {
      let i = 0
      while (2 * i + 1 < heap.length) {
        let c = 2 * i + 1
        if (c + 1 < heap.length && less(heap[c + 1], heap[c])) c++
        if (!less(heap[c], last)) break
        heap[i] = heap[c]
        i = c
      }
      heap[i] = last
    }
    return first
  }
  const terminal = (
    task: RegionCoverTask,
    kind: WalkingRegionCover['kind']
  ): WalkingRegionCover =>
    Object.freeze({
      first: Object.freeze({
        start: task.first.start,
        count: task.first.count
      }),
      second: Object.freeze({
        start: task.second.start,
        count: task.second.count
      }),
      ordinal: Object.freeze([task.from, task.until] as const),
      cardinality: task.until - task.from,
      kind
    })
  let required = 0,
    coRigidOwner = 0
  const initialRemainders: WalkingRegionCover[] = []
  let queued = 0
  for (let i = 0; i < options.movingGroups; i++) {
    const first = roots[i]
    coRigidOwner += (first.count * (first.count - 1)) / 2
    required += first.count * (inventory.length - first.start - first.count)
    if (!Number.isSafeInteger(required))
      throw new Error('Unsafe region cover cardinality')
    for (let j = i + 1; j < roots.length; j++) {
      const second = roots[j],
        count = first.count * second.count
      if (queued < options.maxGroupPairs) {
        push({ first, second, from: 0, until: count, depth: 0 })
        queued++
      } else {
        const remaining = { ...second, count: inventory.length - second.start }
        initialRemainders.push(
          terminal(
            {
              first,
              second: remaining,
              from: 0,
              until: first.count * remaining.count,
              depth: 0
            },
            'unvisited'
          )
        )
        break
      }
    }
  }
  let stopped = false,
    finished: readonly WalkingRegionCover[] | undefined
  const next = (): WalkingRegionCover | undefined => {
    check()
    if (stopped || finished) return
    while (heap.length) {
      const task = heap[0]
      if (task.depth < 2) {
        if (work.groupPairs >= options.maxGroupPairs) {
          stopped = true
          return
        }
        try {
          predicate()
          work.groupPairs++
          if (
            strictRegionBounds(
              task.first.bounds(),
              task.second.bounds(),
              marginFor(task.second.start)
            )
          ) {
            pop()
            return terminal(task, 'strictBounds')
          }
        } catch {
          stopped = true
          return
        }
        pop()
        if (task.depth === 0) {
          const first = sourceRelationValue(task.first.children),
            second = sourceRelationValue(task.second.children)
          if (
            first.length * second.length >
            options.maxGroupPairs - work.groupPairs
          ) {
            push(task)
            stopped = true
            return
          }
          for (const a of first)
            for (const b of second)
              push({
                first: a,
                second: b,
                from: 0,
                until: a.count * b.count,
                depth: 1
              })
        } else push({ ...task, depth: 2 })
        continue
      }
      if (work.leafPairs >= options.maxLeaves) {
        stopped = true
        return
      }
      pop()
      work.leafPairs++
      const leaf = { ...task, until: task.from + 1 }
      if (leaf.until < task.until) push({ ...task, from: leaf.until })
      return terminal(leaf, 'leaf')
    }
  }
  const finish = () => {
    check()
    if (!finished) {
      const remainder = [...initialRemainders]
      while (heap.length) remainder.push(terminal(pop(), 'unvisited'))
      finished = Object.freeze(remainder)
      stopped = true
    }
    return finished
  }
  return Object.freeze({
    inventory,
    required,
    coRigidOwner,
    next,
    finish,
    get work() {
      return Object.freeze({ ...work })
    }
  })
}
export class WalkingSourceRelationEvaluator {
  private rationalAccount?: RationalArithmeticBudget
  private readonly rationalChains = new WeakMap<
    object,
    Map<number, Map<readonly QueryExactFrame[], readonly QueryExactFrame[]>>
  >()
  private readonly rationalNodes = new WeakSet<object>()
  private readonly rationalPlacements = new WeakMap<
    object,
    WalkingRationalSourceNode
  >()
  private readonly regions = new Map<
    Shape,
    Map<SourceRegion, WalkingPreparedSourceRegion>
  >()
  private readonly placed = new Map<
    WalkingPreparedSourceRegion,
    Map<readonly QueryExactFrame[], PlacedRegion>
  >()
  private readonly placedDirections = new WeakMap<
    PlacedRegion,
    PlacedDirections | typeof exhausted
  >()
  private readonly placementInputs = new WeakMap<
    PlacedRegion,
    WalkingRegionPlacement
  >()
  private readonly localDirections = new WeakMap<
    WalkingPreparedSourceRegion,
    PlacedDirections | typeof exhausted
  >()
  private readonly directionOperators = new WeakMap<
    QueryExactFrame,
    | Readonly<{
        linear: readonly ExactPoint[]
        cofactor: readonly ExactPoint[]
        vectors: {
          edge: Map<string, ExactPoint | typeof exhausted>
          normal: Map<string, ExactPoint | typeof exhausted>
        }
      }>
    | typeof exhausted
  >()
  private readonly issued = new WeakSet<object>()
  private readonly boundaries = new WeakMap<
    object,
    { first: WalkingRegionPlacement; second: WalkingRegionPlacement }
  >()
  private currentStage: keyof typeof this.stages = 'other'
  private readonly stages = {
    sourceCertification: { arithmeticOperations: 0, predicates: 0 },
    rationalNodeCompilation: { arithmeticOperations: 0, predicates: 0 },
    localChainPreparation: { arithmeticOperations: 0, predicates: 0 },
    placementFrameValidation: { arithmeticOperations: 0, predicates: 0 },
    placementVertices: { arithmeticOperations: 0, predicates: 0 },
    placementDirections: { arithmeticOperations: 0, predicates: 0 },
    localDirectionPreparation: { arithmeticOperations: 0, predicates: 0 },
    directionMatrixPrimitive: { arithmeticOperations: 0, predicates: 0 },
    directionCofactor: { arithmeticOperations: 0, predicates: 0 },
    directionEdgeTransport: { arithmeticOperations: 0, predicates: 0 },
    directionNormalTransport: { arithmeticOperations: 0, predicates: 0 },
    directionFinalKey: { arithmeticOperations: 0, predicates: 0 },
    relationSetupAndXYZ: { arithmeticOperations: 0, predicates: 0 },
    axisPreparation: { arithmeticOperations: 0, predicates: 0 },
    axisProjection: { arithmeticOperations: 0, predicates: 0 },
    axisConstraint: { arithmeticOperations: 0, predicates: 0 },
    boundaryLocus: { arithmeticOperations: 0, predicates: 0 },
    footExtrusion: { arithmeticOperations: 0, predicates: 0 },
    terrainPlane: { arithmeticOperations: 0, predicates: 0 },
    semanticWitness: { arithmeticOperations: 0, predicates: 0 },
    sheetSurface: { arithmeticOperations: 0, predicates: 0 },
    coverBounds: { arithmeticOperations: 0, predicates: 0 },
    intervalAxisProof: { arithmeticOperations: 0, predicates: 0 },
    other: { arithmeticOperations: 0, predicates: 0 }
  }
  private readonly stageBits: Partial<
    Record<
      keyof typeof this.stages,
      {
        maxRequired: number
        firstExcess: number | null
      }
    >
  > = {}
  private readonly certificationOutcomes = {
    certified: 0,
    notClosedSolid: 0,
    topologyUnproved: 0,
    resourceIncomplete: 0
  }
  private observeStage<T>(stage: keyof typeof this.stages, run: () => T): T {
    const previous = this.currentStage
    this.currentStage = stage
    try {
      return run()
    } finally {
      this.currentStage = previous
    }
  }
  private readonly counters = {
    sheetTrianglePairs: 0,
    sheetTriangleSeparated: 0,
    sheetTriangleIntersections: 0,
    sheetTriangleUnknown: 0,
    localDirectionPreparationAttempts: 0,
    localDirectionPreparations: 0,
    localDirectionTriangles: 0,
    directionTransports: 0,
    directionOperatorPreparations: 0,
    directionPreparationAttempts: 0,
    directionPreparations: 0,
    directionPreparationFailures: 0,
    axisCandidates: 0,
    normalAxisCandidates: 0,
    crossAxisCandidates: 0,
    edgeCrossProducts: 0,
    uniqueAxes: 0,
    duplicateAxes: 0,
    zeroAxes: 0,
    axisProjectionPairs: 0,
    axisProjectionVertices: 0,
    earlySeparatedPairs: 0,
    axisPreparationOperations: 0,
    axisProjectionOperations: 0,
    axisConstraintOperations: 0,
    axisPreparationPredicates: 0,
    axisProjectionPredicates: 0,
    axisConstraintPredicates: 0,
    coverInputs: 0,
    coverVertices: 0,
    rationalNodePreparations: 0,
    rationalArithmeticOperations: 0,
    maxRationalBitsRequired: 0,
    nodeScalarVisits: 0,
    nodeScalarProofs: 0,
    nodeDenominatorSteps: 0,
    nodeIntegerPreparations: 0,
    directionVectorPreparations: 0,
    directionVectorReuses: 0,
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
  constructor(limits: {
    maxRegionPairs: number
    maxExactPredicates: number
    maxBits?: number
    priorExactPredicates?: number
  }) {
    if (
      !Object.entries(limits)
        .filter(([key]) => key !== 'priorExactPredicates')
        .every(
          ([, value]) =>
            Number.isSafeInteger(value) && sourceRelationValue(value) > 0
        )
    )
      throw new Error('Invalid source relation budget')
    this.limits = { ...limits }
    const prior = limits.priorExactPredicates ?? 0
    if (
      !Number.isSafeInteger(prior) ||
      prior < 0 ||
      prior > limits.maxExactPredicates
    )
      throw new Error('Invalid prior exact predicate work')
    this.limits.maxExactPredicates -= prior
    if (limits.maxBits !== undefined) this.arithmeticBudget(limits.maxBits)
  }
  get work() {
    return Object.freeze({
      ...this.counters,
      stages: Object.freeze(
        Object.fromEntries(
          Object.entries(this.stages).map(([key, value]) => [
            key,
            Object.freeze({ ...value })
          ])
        ) as Record<
          keyof typeof this.stages,
          Readonly<{ arithmeticOperations: number; predicates: number }>
        >
      ),
      requiredBitsByStage: Object.freeze(
        Object.fromEntries(
          Object.keys(this.stages).map((key) => [
            key,
            Object.freeze({
              ...(this.stageBits[key as keyof typeof this.stages] ?? {
                maxRequired: 0,
                firstExcess: null
              })
            })
          ])
        )
      ),
      certificationOutcomes: Object.freeze({ ...this.certificationOutcomes })
    })
  }
  get exactBudgetExhausted() {
    return this.counters.exactPredicates >= this.limits.maxExactPredicates
  }
  private predicate() {
    if (this.counters.exactPredicates >= this.limits.maxExactPredicates)
      throw exhausted
    this.counters.exactPredicates++
    this.stages[this.currentStage].predicates++
  }
  accountIntervalPredicate() {
    this.observeStage('intervalAxisProof', () => this.predicate())
  }
  private arithmeticBudget(maxBits: number) {
    if (
      !Number.isSafeInteger(maxBits) ||
      maxBits < 1 ||
      maxBits > 24000 ||
      (this.rationalAccount && this.rationalAccount.maxBits !== maxBits)
    )
      throw new Error('Invalid rational source bit budget')
    if (!this.rationalAccount)
      this.rationalAccount = Object.freeze({
        maxBits,
        count: () => {
          this.predicate()
          this.counters.rationalArithmeticOperations++
          this.stages[this.currentStage].arithmeticOperations++
        },
        observeBits: (bits: number) => {
          const observed = (this.stageBits[this.currentStage] ??= {
            maxRequired: 0,
            firstExcess: null
          })
          observed.maxRequired = Math.max(observed.maxRequired, bits)
          if (bits > maxBits && observed.firstExcess === null)
            observed.firstExcess = bits
          this.counters.maxRationalBitsRequired = Math.max(
            this.counters.maxRationalBitsRequired,
            bits
          )
        }
      })
    return this.rationalAccount
  }
  prepareRationalNode(
    inputs: readonly ConstrainedFrame<ConstrainedFraction>[],
    maxBits: number
  ): WalkingRationalSourceNode {
    return this.observeStage('rationalNodeCompilation', () => {
      const budget = this.arithmeticBudget(maxBits)
      const check = (n: bigint) => scalarWork(budget, integerBits(n))
      const gcd = (a: bigint, b: bigint) => {
        while (b) {
          scalarWork(budget, Math.max(integerBits(a), integerBits(b)))
          const r = a % b
          a = b
          b = r
        }
        return a < 0n ? -a : a
      }
      try {
        if (!Array.isArray(inputs) || !inputs.length)
          throw new Error('Missing rational source frames')
        const admittedInputs: readonly ConstrainedFrame<ConstrainedFraction>[] =
          inputs
        let denominator = 1n
        const values = new Map<bigint, Set<bigint>>()
        const denominators = new Set<bigint>()
        for (const frame of admittedInputs) {
          if (
            !frame ||
            frame.origin.length !== 3 ||
            frame.matrix.length !== 3 ||
            frame.matrix.some((row) => row.length !== 3)
          )
            throw new Error('Invalid rational source frame')
          for (const value of [...frame.origin, ...frame.matrix.flat()]) {
            this.counters.nodeScalarVisits++
            if (
              !value ||
              typeof value.numerator !== 'bigint' ||
              typeof value.denominator !== 'bigint' ||
              value.denominator <= 0n
            )
              throw new Error('Invalid rational source scalar')
            check(value.numerator)
            check(value.denominator)
            scalarWork(budget, 1)
            let numerators = values.get(value.denominator)
            if (!numerators?.has(value.numerator)) {
              if (gcd(value.numerator, value.denominator) !== 1n)
                throw new Error('Noncanonical rational source scalar')
              if (!numerators) {
                numerators = new Set()
                values.set(value.denominator, numerators)
              }
              numerators.add(value.numerator)
              this.counters.nodeScalarProofs++
            }
            if (denominators.has(value.denominator)) continue
            const divisor = gcd(denominator, value.denominator),
              factor = denominator / divisor
            scalarWork(
              budget,
              integerBits(factor) + integerBits(value.denominator)
            )
            denominator = factor * value.denominator
            denominators.add(value.denominator)
            this.counters.nodeDenominatorSteps++
          }
        }
        const integers = new Map<bigint, Map<bigint, Dyadic>>()
        const integer = (value: ConstrainedFraction): Dyadic => {
          scalarWork(budget, 1)
          let entries = integers.get(value.denominator)
          const previous = entries?.get(value.numerator)
          if (previous) return previous
          scalarWork(budget, integerBits(denominator))
          const factor = denominator / value.denominator
          scalarWork(budget, integerBits(value.numerator) + integerBits(factor))
          const result = boundedScalar(
            { significand: value.numerator * factor, exponent: 0 },
            budget
          )
          if (!entries) {
            entries = new Map()
            integers.set(value.denominator, entries)
          }
          entries.set(value.numerator, result)
          this.counters.nodeIntegerPreparations++
          return result
        }
        const frames = admittedInputs.map((input) => {
          const matrix = input.matrix.map((row) =>
            row.map(integer)
          ) as unknown as QueryExactFrame['matrix']
          const position = input.origin.map(
            integer
          ) as unknown as QueryExactFrame['position']
          const determinant = dot(matrix[0], cross(matrix[1], matrix[2]))
          if (determinant.significand === 0n)
            throw new Error('Singular rational source frame')
          return freeze({ matrix, position, determinant })
        })
        const node = freeze({
          scale: boundedScalar(
            { significand: denominator, exponent: 0 },
            budget
          ),
          frames,
          chains: frames.map((frame) => Object.freeze([frame])),
          maxBits
        })
        this.rationalNodes.add(node)
        this.counters.rationalNodePreparations++
        return node
      } catch (error) {
        if (error === exhausted)
          throw new Error(
            'Rational source arithmetic budget exhausted: ' +
              JSON.stringify({
                maxBits,
                requiredBits: this.counters.maxRationalBitsRequired,
                predicates: this.counters.exactPredicates
              })
          )
        throw error
      }
    })
  }
  prepareRegionCover(
    groups: readonly WalkingRegionCoverGroup[],
    node: WalkingRationalSourceNode | WalkingCycleRegionNode,
    options: Readonly<{
      movingGroups: number
      maxGroupPairs: number
      maxLeaves: number
      margin: number
    }>
  ) {
    return this.observeStage('coverBounds', () => {
      const cycleInput = 'request' in node ? node : undefined
      const cycleNode = cycleInput
        ? cycleRegionNodes.get(cycleInput)
        : undefined
      const rationalNode = 'scale' in node ? node : undefined
      const ensure = () => {
        if (cycleNode) {
          if (
            cycleNode.evaluator !== this ||
            !cycleInput ||
            cycleNode.current.owner.read(
              cycleInput.request.source,
              cycleNode.current.cycle.recipe
            ) !== cycleNode.current.cycle ||
            cycleInput.request.cycle !== cycleNode.current.cycle
          )
            throw new Error('Stale cycle region cover node')
        } else if (!rationalNode || !this.rationalNodes.has(rationalNode))
          throw new Error('Foreign region cover node')
      }
      ensure()
      if (
        !Array.isArray(groups) ||
        !groups.length ||
        !Number.isSafeInteger(options.movingGroups) ||
        options.movingGroups < 1 ||
        options.movingGroups > groups.length ||
        !Number.isSafeInteger(options.maxGroupPairs) ||
        options.maxGroupPairs < 1 ||
        !Number.isSafeInteger(options.maxLeaves) ||
        options.maxLeaves < 1 ||
        !Number.isFinite(options.margin) ||
        options.margin < 0
      )
        throw new Error('Invalid region cover input')
      const inventory: Readonly<{
        shape: Shape
        region: SourceRegion
        frameIndex: number
      }>[] = []
      const maxBits =
        rationalNode?.maxBits ??
        sourceRelationValue(cycleInput).request.budget.maxBits
      const account = this.arithmeticBudget(maxBits)
      const rounded = (v: Dyadic, scale: Dyadic): Interval => {
        const power = v.exponent - scale.exponent
        scalarWork(
          account,
          Math.max(
            integerBits(v.significand) + Math.max(0, power),
            integerBits(scale.significand) + Math.max(0, -power)
          )
        )
        const n = power >= 0 ? v.significand << BigInt(power) : v.significand,
          d =
            power < 0 ? scale.significand << BigInt(-power) : scale.significand
        return {
          low: roundFraction(n, d, 'down'),
          high: roundFraction(n, d, 'up')
        }
      }
      const admittedGroups: readonly WalkingRegionCoverGroup[] = groups
      const roots: RegionCoverBranch[] = admittedGroups.map((group) => {
        this.predicate()
        this.counters.coverInputs++
        if (!group.parts.length) throw new Error('Empty region cover owner')
        const start = inventory.length
        const children = group.parts.map((rawPart) => {
          this.predicate()
          this.counters.coverInputs++
          const part = Object.freeze({ ...rawPart })
          if (
            !part.regions.length ||
            !Object.isFrozen(part.shape) ||
            !Object.isFrozen(part.shape.positions) ||
            !Object.isFrozen(part.shape.indices) ||
            !Object.isFrozen(part.regions)
          )
            throw new Error('Unadmitted region cover shape')
          const start = inventory.length
          let last = 0
          for (const region of part.regions) {
            this.predicate()
            this.counters.coverInputs++
            if (
              !Object.isFrozen(region) ||
              !Number.isSafeInteger(region.indexStart) ||
              !Number.isSafeInteger(region.indexCount) ||
              region.indexStart < last ||
              region.indexStart % 3 ||
              region.indexCount <= 0 ||
              region.indexCount % 3 ||
              region.indexStart + region.indexCount > part.shape.indices.length
            )
              throw new Error('Invalid region cover partition')
            if (!cycleNode && region.indexStart !== last)
              throw new Error('Incomplete region cover partition')
            last = region.indexStart + region.indexCount
            inventory.push(
              Object.freeze({
                shape: part.shape,
                region,
                frameIndex: part.frameIndex
              })
            )
          }
          if (!cycleNode && last !== part.shape.indices.length)
            throw new Error('Incomplete region cover partition')
          if (
            cycleNode &&
            (!part.inputs ||
              part.inputs.length !== part.regions.length ||
              part.inputs.some(
                (input, k) =>
                  input !== cycleNode.inputs[start + k] ||
                  input.shape !== part.shape ||
                  input.region !== part.regions[k]
              ))
          )
            throw new Error('Foreign cycle cover inventory')
          let cached: SceneDemandBounds | undefined
          const bounds = (): SceneDemandBounds =>
            this.observeStage('coverBounds', () => {
              if (cached) return cached
              if (cycleNode && 'bounds' in node) {
                const input = sourceRelationValue(part.inputs)[0]
                if (
                  input.part &&
                  sourceRelationValue(part.inputs).every(
                    (p) => p.part === input.part
                  )
                ) {
                  const issued = node.bounds.parts.find(
                    (p) => p.part === input.part
                  )
                  if (!issued) throw new Error('Missing cycle cover part frame')
                  return (cached = {
                    min: [
                      issued.sourceBounds.min[0],
                      issued.sourceBounds.min[1],
                      issued.sourceBounds.min[2]
                    ],
                    max: [
                      issued.sourceBounds.max[0],
                      issued.sourceBounds.max[1],
                      issued.sourceBounds.max[2]
                    ]
                  })
                }
                if (
                  sourceRelationValue(part.inputs).every(
                    (p) =>
                      p.exclusion &&
                      node.request.demand.freePassage.exclusions.includes(
                        p.exclusion
                      )
                  )
                ) {
                  return (cached = joinedRegionBounds(
                    sourceRelationValue(part.inputs).map(
                      (p) => sourceRelationValue(p.exclusion).bounds
                    )
                  ))
                }
              }
              const seen = new Set<number>(),
                points: SceneDemandBounds[] = []
              const input = part.inputs?.[0]
              const boundedFrame =
                cycleNode && 'bounds' in node && input?.holderBodyId
                  ? node.bounds.bodies.find(
                      (b) => b.body.id === input.holderBodyId
                    )?.bounds
                  : undefined
              if (input?.holderBodyId && !boundedFrame)
                throw new Error('Missing cycle cover holder frame')
              const frame = rationalNode?.frames[part.frameIndex]
              if (rationalNode && !frame)
                throw new Error('Missing region cover exact frame')
              for (const region of part.regions)
                for (
                  let offset = region.indexStart;
                  offset < region.indexStart + region.indexCount;
                  offset++
                ) {
                  this.predicate()
                  const index = part.shape.indices[offset]
                  if (
                    !Number.isSafeInteger(index) ||
                    index < 0 ||
                    index * 3 + 2 >= part.shape.positions.length
                  )
                    throw new Error('Invalid region cover source index')
                  if (seen.has(index)) continue
                  seen.add(index)
                  const raw = part.shape.positions.slice(
                    index * 3,
                    index * 3 + 3
                  )
                  if (!raw.every(Number.isFinite))
                    throw new Error('Nonfinite region cover source')
                  let value: readonly Interval[]
                  if (rationalNode && frame) {
                    const p = raw.map((v) =>
                      boundedScalar(dyadic(v), account)
                    ) as unknown as ExactPoint
                    value = frame.matrix.map((row, k) =>
                      rounded(
                        sum(dot(row, p), frame.position[k]),
                        rationalNode.scale
                      )
                    )
                  } else {
                    let p = raw.map(interval) as [Interval, Interval, Interval]
                    for (const local of input?.localBounds ?? [])
                      p = transformQueryPoint(local, p) as [
                        Interval,
                        Interval,
                        Interval
                      ]
                    value = boundedFrame
                      ? boundedFrame.origin.map((v, k) =>
                          boundedFrame.matrix[k].reduce(
                            (sum, q, j) =>
                              addInterval(sum, multiplyInterval(q, p[j])),
                            v
                          )
                        )
                      : p
                  }
                  points.push({
                    min: value.map((v) => v.low) as unknown as Point3,
                    max: value.map((v) => v.high) as unknown as Point3
                  })
                  this.counters.coverVertices++
                }
              return (cached = joinedRegionBounds(points))
            })
          return { start, count: inventory.length - start, bounds }
        })
        let cached: SceneDemandBounds | undefined
        return {
          start,
          count: inventory.length - start,
          children,
          bounds: () =>
            cached ??
            (cached = joinedRegionBounds(children.map((p) => p.bounds())))
        }
      })
      if (cycleNode) {
        if (inventory.length !== cycleNode.inputs.length)
          throw new Error('Incomplete cycle cover inventory')
        let offset = 0
        for (const group of admittedGroups) {
          const first = cycleNode.inputs[offset],
            owner = first.owner
          for (const part of group.parts) {
            const previous = sourceRelationValue(part.inputs)[0]
            if (
              part.frameIndex !== -1 ||
              sourceRelationValue(part.inputs).some(
                (input) =>
                  input.owner !== owner ||
                  input.shape !== previous.shape ||
                  input.part !== previous.part ||
                  input.holderBodyId !== previous.holderBodyId ||
                  input.terrain !== previous.terrain ||
                  input.semantic !== previous.semantic ||
                  input.localFrames.length !== previous.localFrames.length ||
                  input.localFrames.some(
                    (f, k) => f !== previous.localFrames[k]
                  )
              )
            )
              throw new Error('Mixed cycle cover transform or semantic owner')
            offset += part.regions.length
          }
        }
        const declared =
          sourceRelationValue(cycleInput).request.demand.configuration
            .clearanceMargin
        if (
          options.margin !== (declared.kind === 'bounded' ? declared.metres : 0)
        )
          throw new Error('Foreign cycle cover margin')
      }
      const movingCount = roots
        .slice(0, options.movingGroups)
        .reduce((n, r) => n + r.count, 0)
      if (
        cycleNode &&
        cycleNode.inputs.some(
          (input, index) =>
            index < movingCount !== !!(input.body || input.holderBodyId)
        )
      )
        throw new Error('Foreign cycle moving owner boundary')
      const limits = Object.freeze({ ...options })
      return regionCoverCursor(
        roots,
        Object.freeze(inventory),
        limits,
        ensure,
        () => this.observeStage('coverBounds', () => this.predicate()),
        (second) => {
          if (cycleNode) {
            const input = cycleNode.inputs[second]
            return second < movingCount || input.semantic ? 0 : limits.margin
          }
          return limits.margin
        }
      )
    })
  }
  rationalPlacement(
    region: WalkingPreparedSourceRegion,
    node: WalkingRationalSourceNode,
    index: number,
    localFrames: readonly QueryExactFrame[] = noFrames
  ): WalkingRegionPlacement {
    return this.observeStage('localChainPreparation', () => {
      if (
        !this.rationalNodes.has(node) ||
        !this.issued.has(region) ||
        !Number.isSafeInteger(index) ||
        index < -1 ||
        (index !== -1 && !node.chains[index]) ||
        !Object.isFrozen(localFrames)
      )
        throw new Error('Foreign rational source placement')
      let byIndex = this.rationalChains.get(node)
      if (!byIndex) {
        byIndex = new Map()
        this.rationalChains.set(node, byIndex)
      }
      let byFrames = byIndex.get(index)
      if (!byFrames) {
        byFrames = new Map()
        byIndex.set(index, byFrames)
      }
      let frames = byFrames.get(localFrames)
      if (!frames) {
        const budget = this.arithmeticBudget(node.maxBits)
        const mark = (v: Dyadic) => {
          if (
            typeof v.significand !== 'bigint' ||
            !Number.isSafeInteger(v.exponent)
          )
            throw new Error('Invalid exact local source frame')
          scalarWork(budget, integerBits(v.significand))
          return boundedScalar({ ...v }, budget)
        }
        const locals = localFrames.map((frame) =>
          freeze({
            matrix: frame.matrix.map((row) =>
              row.map(mark)
            ) as unknown as QueryExactFrame['matrix'],
            position: frame.position.map(
              mark
            ) as unknown as QueryExactFrame['position'],
            determinant: mark(frame.determinant)
          })
        )
        const target =
          index === -1
            ? freeze({
                matrix: axes.map((axis) =>
                  axis.map((v) => product(v, node.scale))
                ) as unknown as QueryExactFrame['matrix'],
                position: point([0, 0, 0]),
                determinant: product(
                  product(node.scale, node.scale),
                  node.scale
                )
              })
            : node.frames[index]
        frames = Object.freeze([...locals, target])
        byFrames.set(localFrames, frames)
      }
      const result = Object.freeze({ region, frames })
      this.rationalPlacements.set(result, node)
      return result
    })
  }
  relateRational(
    first: WalkingRegionPlacement,
    second: WalkingRegionPlacement,
    node: WalkingRationalSourceNode,
    margin: number
  ): WalkingRegionRelation {
    if (
      !this.rationalNodes.has(node) ||
      this.rationalPlacements.get(first) !== node ||
      this.rationalPlacements.get(second) !== node
    )
      throw new Error('Foreign rational source relation')
    return this.relateScaled(first, second, margin, undefined, node.scale)
  }
  relateRationalSheetTriangle(
    solid: WalkingRegionPlacement,
    sheet: WalkingRegionPlacement,
    node: WalkingRationalSourceNode,
    triangleOffset: number
  ): WalkingSheetTriangleRelation {
    if (
      !this.rationalNodes.has(node) ||
      this.rationalPlacements.get(solid) !== node ||
      this.rationalPlacements.get(sheet) !== node
    )
      throw new Error('Foreign rational sheet relation')
    const region = sheet.region.region
    if (
      !Number.isSafeInteger(triangleOffset) ||
      triangleOffset % 3 !== 0 ||
      triangleOffset < region.indexStart ||
      triangleOffset + 3 > region.indexStart + region.indexCount
    )
      throw new Error('Invalid original sheet triangle offset')
    const unprovedSheet = () => {
      this.counters.sheetTriangleUnknown++
      return freeze({
        kind: 'unknown',
        proof: 'unproved',
        triangleOffset
      } as const)
    }
    this.counters.sheetTrianglePairs++
    return this.observeStage('sheetSurface', () => {
      if (
        !solid.region.certified ||
        region.kind !== 'sheet' ||
        solid.motion === 'unproved' ||
        sheet.motion === 'unproved'
      )
        return unprovedSheet()
      try {
        this.predicate()
        const first = this.place(solid),
          second = this.place(sheet)
        const original =
          sheet.region.triangles[(triangleOffset - region.indexStart) / 3]
        if (!original || original.length !== 3) return unprovedSheet()
        const points = original.map((index) => second.points[index])
        if (points.some((p) => !p)) return unprovedSheet()
        const edges = [
          delta(points[1], points[0]),
          delta(points[2], points[1]),
          delta(points[0], points[2])
        ]
        const normal = cross(edges[0], delta(points[2], points[0]))
        if (isZero(normal)) return unprovedSheet()
        const separated = (axis: ExactPoint) => {
          const left = this.projection(first.points, axis),
            right = this.projection(points, axis)
          return (
            compare(left.max, right.min) < 0 || compare(right.max, left.min) < 0
          )
        }
        for (const axis of axes)
          if (separated(axis)) {
            this.counters.sheetTriangleSeparated++
            return freeze({
              kind: 'separated',
              proof: 'strict-bounds',
              triangleOffset,
              axis
            } as const)
          }
        const triangleDirections: PlacedDirections = {
          normals: [normal],
          edges
        }
        for (const axis of this.completeAxes(
          this.directions(first),
          triangleDirections
        )) {
          const gap = this.observeAxisStage('Projection', () => {
            this.counters.axisProjectionPairs++
            const left = this.projection(first.points, axis, true),
              right = this.projection(points, axis, true)
            return (
              compare(left.max, right.min) < 0 ||
              compare(right.max, left.min) < 0
            )
          })
          if (gap) {
            this.counters.sheetTriangleSeparated++
            return freeze({
              kind: 'separated',
              proof: 'complete-triangle-sat',
              triangleOffset,
              axis
            } as const)
          }
        }
        this.counters.sheetTriangleIntersections++
        return freeze({
          kind: 'surface-intersection',
          proof: 'complete-triangle-sat',
          triangleOffset
        } as const)
      } catch (error) {
        if (error !== exhausted) throw error
        return unprovedSheet()
      }
    })
  }
  relateRationalSheetRegion(
    input: WalkingSheetRegionIntervalInput
  ): WalkingSheetRegionIntervalRelation {
    const { solid, sheet, node, parameter, margin } = input
    if (
      !this.rationalNodes.has(node) ||
      this.rationalPlacements.get(solid.placement) !== node ||
      this.rationalPlacements.get(sheet.placement) !== node ||
      !Number.isFinite(margin) ||
      margin < 0
    )
      throw new Error('Invalid sheet interval binding')
    const work = {
      required: sheet.placement.region.region.indexCount / 3,
      visited: 0,
      unvisited: 0,
      projectionVertices: 0
    }
    let kind: WalkingSheetRegionIntervalRelation['kind'] = 'separated',
      triangleOffset: number | undefined
    try {
      const account = this.arithmeticBudget(node.maxBits)
      for (const value of [parameter.low, parameter.high]) {
        if (
          typeof value.numerator !== 'bigint' ||
          typeof value.denominator !== 'bigint' ||
          value.denominator <= 0n ||
          value.numerator < 0n ||
          value.numerator > value.denominator
        )
          throw new Error('Invalid sheet parameter interval')
      }
      scalarWork(
        account,
        Math.max(
          integerBits(parameter.low.numerator) +
            integerBits(parameter.high.denominator),
          integerBits(parameter.high.numerator) +
            integerBits(parameter.low.denominator)
        ) + 1
      )
      if (
        parameter.low.numerator * parameter.high.denominator >
        parameter.high.numerator * parameter.low.denominator
      )
        throw new Error('Unordered sheet parameter interval')
      const validate = (bound: WalkingSheetRegionIntervalInput['solid']) => {
        const { shape, region } = bound.placement.region
        if (bound.indices.length !== bound.vertices.length)
          throw new Error('Incomplete original vertex bounds')
        const slots = new Map<number, number>()
        for (const [slot, index] of bound.indices.entries()) {
          this.predicate()
          if (
            !Number.isSafeInteger(index) ||
            index < 0 ||
            index * 3 + 2 >= shape.positions.length ||
            slots.has(index)
          )
            throw new Error('Invalid original vertex mapping')
          const p = bound.vertices[slot]
          if (
            p.length !== 3 ||
            p.some(
              (v) =>
                !Number.isFinite(v.low) ||
                !Number.isFinite(v.high) ||
                v.low > v.high
            )
          )
            throw new Error('Invalid ordered vertex bound')
          slots.set(index, slot)
        }
        const required = new Set<number>()
        for (
          let i = region.indexStart;
          i < region.indexStart + region.indexCount;
          i++
        ) {
          this.predicate()
          const index = shape.indices[i]
          if (!slots.has(index))
            throw new Error('Missing original triangle vertex')
          required.add(index)
        }
        if (required.size !== slots.size)
          throw new Error('Foreign original vertex bound')
        return slots
      }
      validate(solid)
      const slots = validate(sheet)
      const region = sheet.placement.region.region
      for (
        let offset = region.indexStart;
        offset < region.indexStart + region.indexCount;
        offset += 3
      ) {
        work.visited++
        triangleOffset = offset
        const point = this.relateRationalSheetTriangle(
          solid.placement,
          sheet.placement,
          node,
          offset
        )
        if (point.kind === 'surface-intersection') {
          kind = 'blocked'
          break
        }
        if (point.kind === 'unknown' || !point.axis) {
          kind = 'unknown'
          break
        }
        const triangle = sheet.placement.region.shape.indices
          .slice(offset, offset + 3)
          .map((index) => sheet.vertices[sourceRelationValue(slots.get(index))])
        if (
          !sourceIntervalAxisGap(
            solid.vertices,
            triangle,
            point.axis,
            margin,
            node.maxBits,
            () => {
              work.projectionVertices++
              this.accountIntervalPredicate()
            }
          )
        )
          kind = 'pending'
      }
      if (kind === 'separated' || kind === 'pending') triangleOffset = undefined
    } catch (error) {
      if (error !== exhausted) throw error
      kind = 'unknown'
    } finally {
      work.unvisited = work.required - work.visited
    }
    return Object.freeze({
      input,
      kind,
      triangleOffset,
      work: Object.freeze(work)
    })
  }
  rationalVertexInBounds(
    input: WalkingRegionPlacement,
    node: WalkingRationalSourceNode,
    bounds: SceneDemandBounds
  ) {
    return this.observeStage('semanticWitness', () => {
      if (
        this.rationalPlacements.get(input) !== node ||
        !this.rationalNodes.has(node)
      )
        throw new Error('Foreign rational semantic witness')
      const placed = this.place(input)
      for (const [index, p] of placed.points.entries()) {
        this.predicate()
        if (
          p.every(
            (v, k) =>
              compare(v, product(dyadic(bounds.min[k]), node.scale)) >= 0 &&
              compare(v, product(dyadic(bounds.max[k]), node.scale)) <= 0
          )
        ) {
          const triangle = input.region.triangles.findIndex((t) =>
            t.includes(index)
          )
          if (triangle < 0) throw new Error('Missing original semantic witness')
          const corner = input.region.triangles[triangle].indexOf(index)
          const triangleOffset = input.region.region.indexStart + triangle * 3
          return freeze({
            triangleOffset,
            vertexIndex: input.region.shape.indices[triangleOffset + corner]
          })
        }
      }
      return undefined
    })
  }
  proveHorizontalPlane(
    input: WalkingRegionPlacement,
    height: ConstrainedFraction
  ): boolean {
    return this.observeStage('terrainPlane', () => {
      if (
        height.denominator <= 0n ||
        input.region.region.kind === 'closed-solid'
      )
        return false
      try {
        const budget = this.rationalAccount
        scalarWork(
          budget,
          Math.max(
            integerBits(height.numerator),
            integerBits(height.denominator)
          )
        )
        const numerator = boundedScalar(
          { significand: height.numerator, exponent: 0 },
          budget
        )
        const denominator = boundedScalar(
          { significand: height.denominator, exponent: 0 },
          budget
        )
        const placed = this.place(input)
        if (!placed.points.length || !input.region.triangles.length)
          return false
        for (const p of placed.points)
          if (compare(product(p[1], denominator), numerator) !== 0) return false
        for (const t of input.region.triangles) {
          this.predicate()
          if (
            cross(
              delta(placed.points[t[1]], placed.points[t[0]]),
              delta(placed.points[t[2]], placed.points[t[0]])
            )[1].significand === 0n
          )
            return false
        }
        return true
      } catch (error) {
        if (error !== exhausted) throw error
        return false
      }
    })
  }
  proveFootExtrusion(
    part: WalkingRobotPart,
    region: SourceRegion,
    patch: SourcePatch
  ): WalkingFootExtrusion | undefined {
    return this.observeStage('footExtrusion', () => {
      if (
        !part.regions.includes(region) ||
        !part.patches.includes(patch) ||
        patch.region !== region
      )
        return
      const material = this.prepare(part.shape, region)
      if (!material.certified) return
      try {
        const points: ExactPoint[] = [],
          indices: number[] = [],
          byCoordinate = new Map<string, number>(),
          triangles: Triangle[] = [],
          offsets: number[] = []
        const vertex = (index: number) => {
          const raw = part.shape.positions.slice(
              index * 3,
              index * 3 + 3
            ) as unknown as Point3,
            key = raw.join(',')
          const old = byCoordinate.get(key)
          if (old !== undefined) return old
          const id = points.length
          points.push(
            point(raw).map((v) =>
              boundedScalar(v, this.rationalAccount)
            ) as unknown as ExactPoint
          )
          indices.push(index)
          byCoordinate.set(key, id)
          return id
        }
        for (const range of patch.ranges)
          for (
            let offset = range.indexStart;
            offset < range.indexStart + range.indexCount;
            offset += 3
          ) {
            if (
              offset < region.indexStart ||
              offset + 3 > region.indexStart + region.indexCount
            )
              return
            offsets.push(offset)
            triangles.push([
              vertex(part.shape.indices[offset]),
              vertex(part.shape.indices[offset + 1]),
              vertex(part.shape.indices[offset + 2])
            ])
          }
        if (!triangles.length) return
        const first = triangles[0],
          normal = cross(
            delta(points[first[1]], points[first[0]]),
            delta(points[first[2]], points[first[0]])
          )
        const nonzero = normal.flatMap((v, k) =>
          v.significand === 0n ? [] : [k]
        )
        if (nonzero.length !== 1) return
        const axis = nonzero[0] as 0 | 1 | 2,
          plane = points[first[0]][axis],
          orientation = normal[axis].significand > 0n ? 1 : -1
        if (points.some((p) => compare(p[axis], plane) !== 0)) return
        const edges = new Map<
          string,
          {
            a: number
            b: number
            count: number
            balance: number
            triangleOffset: number
          }
        >()
        let area = zero
        for (const [i, t] of triangles.entries()) {
          this.predicate()
          const n = cross(
            delta(points[t[1]], points[t[0]]),
            delta(points[t[2]], points[t[0]])
          )[axis]
          if (
            n.significand === 0n ||
            (n.significand > 0n ? 1 : -1) !== orientation
          )
            return
          area = sum(area, n)
          for (let j = 0; j < 3; j++) {
            const a = t[j],
              b = t[(j + 1) % 3],
              key = a < b ? a + ',' + b : b + ',' + a
            const old = edges.get(key)
            if (old) {
              old.count++
              old.balance += a < b ? 1 : -1
            } else
              edges.set(key, {
                a,
                b,
                count: 1,
                balance: a < b ? 1 : -1,
                triangleOffset: offsets[i]
              })
          }
        }
        const boundary = [...edges.values()].filter((e) => e.count === 1)
        if (
          boundary.length < 3 ||
          [...edges.values()].some(
            (e) => e.count > 2 || (e.count === 2 && e.balance !== 0)
          )
        )
          return
        const next = new Map(boundary.map((e) => [e.a, e.b]))
        if (
          next.size !== boundary.length ||
          new Set(boundary.map((e) => e.b)).size !== boundary.length
        )
          return
        let cursor = boundary[0].a,
          polygonArea = zero
        const visited = new Set<number>()
        do {
          if (visited.has(cursor)) return
          visited.add(cursor)
          const end = next.get(cursor)
          if (end === undefined) return
          polygonArea = sum(
            polygonArea,
            cross(points[cursor], points[end])[axis]
          )
          cursor = end
        } while (cursor !== boundary[0].a)
        if (
          visited.size !== boundary.length ||
          compare(area, polygonArea) !== 0
        )
          return
        const covered = (p: ExactPoint) =>
          boundary.every((edge) => {
            this.predicate()
            const side = cross(
              delta(points[edge.b], points[edge.a]),
              delta(p, points[edge.a])
            )[axis].significand
            return orientation > 0 ? side >= 0n : side <= 0n
          })
        if (!points.every(covered)) return
        // Pairwise strict interior exclusion makes area/edge coverage a union proof.
        for (let i = 0; i < triangles.length; i++)
          for (let j = i + 1; j < triangles.length; j++) {
            const a = triangles[i].map((k) => points[k]),
              b = triangles[j].map((k) => points[k])
            const directions = [a, b].flatMap((t) =>
              t.map((p, k) => cross(normal, delta(t[(k + 1) % 3], p)))
            )
            const separated = directions.some((direction) => {
              const left = this.projection(a, direction),
                right = this.projection(b, direction)
              return (
                compare(left.max, right.min) <= 0 ||
                compare(right.max, left.min) <= 0
              )
            })
            if (!separated) return
          }
        let extrusionSign: 1 | -1 | undefined
        const sourceOffsets: number[] = []
        let witness: WalkingFootExtrusion['witness'] | undefined
        const triangleContains = (p: ExactPoint, t: Triangle) =>
          t.every((id, k) => {
            const side = cross(
              delta(points[t[(k + 1) % 3]], points[id]),
              delta(p, points[id])
            )[axis].significand
            return orientation > 0 ? side >= 0n : side <= 0n
          })
        for (const [i, t] of material.triangles.entries()) {
          const offset = region.indexStart + i * 3
          sourceOffsets.push(offset)
          for (const index of t) {
            const p = material.points[index],
              height = difference(p[axis], plane)
            if (height.significand !== 0n) {
              const sign = height.significand > 0n ? 1 : -1
              if (extrusionSign !== undefined && sign !== extrusionSign) return
              extrusionSign = sign
            }
            const projected = p.map((v, k) =>
              k === axis ? plane : v
            ) as unknown as ExactPoint
            if (!covered(projected)) return
            if (!witness && height.significand === 0n) {
              const patchTriangle = triangles.findIndex((t) =>
                triangleContains(projected, t)
              )
              if (patchTriangle >= 0)
                witness = {
                  sourceTriangleOffset: offset,
                  patchTriangleOffset: offsets[patchTriangle]
                }
            }
          }
        }
        if (!extrusionSign || !witness) return
        return freeze({
          part,
          region,
          patch,
          axis,
          extrusionSign,
          planeCoordinate: part.shape.positions[indices[first[0]] * 3 + axis],
          patchVertexIndices: offsets
            .flatMap((offset) => part.shape.indices.slice(offset, offset + 3))
            .filter((value, index, all) => all.indexOf(value) === index),
          sourceTriangleOffsets: sourceOffsets,
          patchTriangleOffsets: offsets,
          supportingEdges: boundary.map((edge) => ({
            triangleOffset: edge.triangleOffset,
            firstVertexIndex: indices[edge.a],
            secondVertexIndex: indices[edge.b]
          })),
          witness,
          authority: 'convex-source-foot-extrusion/1' as const
        })
      } catch (error) {
        if (error !== exhausted) throw error
        return
      }
    })
  }
  prepare(shape: Shape, region: SourceRegion): WalkingPreparedSourceRegion {
    return this.observeStage('sourceCertification', () => {
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
        points.push(
          point(p).map((v) =>
            boundedScalar(v, this.rationalAccount)
          ) as unknown as ExactPoint
        )
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
      let resourceIncomplete = false
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
                key =
                  first < second ? first + ':' + second : second + ':' + first
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
        resourceIncomplete = true
      }
      if (resourceIncomplete) this.certificationOutcomes.resourceIncomplete++
      else if (region.kind !== 'closed-solid')
        this.certificationOutcomes.notClosedSolid++
      else if (certified) this.certificationOutcomes.certified++
      else this.certificationOutcomes.topologyUnproved++
      const result = freeze({ shape, region, points, triangles, certified })
      let products = this.regions.get(shape)
      if (!products) {
        products = new Map()
        this.regions.set(shape, products)
      }
      products.set(region, result)
      this.issued.add(result)
      return result
    })
  }
  private place(input: WalkingRegionPlacement): PlacedRegion {
    return this.observeStage('placementFrameValidation', () => {
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
      const points = this.observeStage('placementVertices', () =>
        input.region.points.map((p) => {
          let result = p
          for (const frame of input.frames) {
            const value = (axis: number) =>
              sum(dot(frame.matrix[axis], result), frame.position[axis])
            result = [value(0), value(1), value(2)]
          }
          return result
        })
      )
      const result: PlacedRegion = { points, triangles: input.region.triangles }
      // A non-reusable chain must still describe the already-computed points if
      // its caller later changes it. Preserve the exact scalar tags in this snapshot.
      const frames = reusable
        ? input.frames
        : input.frames.map((frame) => ({
            ...frame,
            matrix: frame.matrix.map((row) =>
              row.map((value) =>
                boundedScalar({ ...value }, scalarAccount(value))
              )
            ) as unknown as QueryExactFrame['matrix']
          }))
      this.placementInputs.set(result, { region: input.region, frames })
      let products = this.placed.get(input.region)
      if (!products) {
        products = new Map()
        this.placed.set(input.region, products)
      }
      if (reusable) products.set(input.frames, result)
      this.counters.transformPreparations++
      return result
    })
  }
  private pointDirections(input: PlacedRegion): PlacedDirections {
    const normals: ExactPoint[] = [],
      edges: ExactPoint[] = []
    for (const [a, b, c] of input.triangles) {
      normals.push(
        cross(
          delta(input.points[b], input.points[a]),
          delta(input.points[c], input.points[a])
        )
      )
      edges.push(
        delta(input.points[b], input.points[a]),
        delta(input.points[c], input.points[b]),
        delta(input.points[a], input.points[c])
      )
    }
    return {
      normals: uniqueDirections(normals),
      edges: uniqueDirections(edges)
    }
  }
  private sourceDirections(
    region: WalkingPreparedSourceRegion
  ): PlacedDirections {
    const previous = this.localDirections.get(region)
    if (previous === exhausted) throw exhausted
    if (previous) return previous
    this.counters.localDirectionPreparationAttempts++
    try {
      const value = this.observeStage('localDirectionPreparation', () => {
        // An issued source may precede the first rational node in this evaluator.
        const points = region.points.map(
          (p) =>
            p.map((v) =>
              boundedScalar({ ...v }, this.rationalAccount)
            ) as unknown as ExactPoint
        )
        const normals: ExactPoint[] = [],
          edges: ExactPoint[] = []
        for (const [a, b, c] of region.triangles) {
          this.counters.localDirectionTriangles++
          normals.push(
            cross(delta(points[b], points[a]), delta(points[c], points[a]))
          )
          edges.push(
            delta(points[b], points[a]),
            delta(points[c], points[b]),
            delta(points[a], points[c])
          )
        }
        return {
          normals: uniqueDirections(normals),
          edges: uniqueDirections(edges)
        }
      })
      this.localDirections.set(region, value)
      this.counters.localDirectionPreparations++
      return value
    } catch (error) {
      if (error === exhausted) this.localDirections.set(region, exhausted)
      throw error
    }
  }
  private directionOperator(frame: QueryExactFrame) {
    const previous = this.directionOperators.get(frame)
    if (previous === exhausted) throw exhausted
    if (previous) return previous
    try {
      const linear = this.observeStage('directionMatrixPrimitive', () => {
        // One positive divisor for the WHOLE matrix; never change a row's scale
        // or normalize the determinant sign.
        const values = frame.matrix.flat()
        const budget = sourceRelationValue(this.rationalAccount)
        const exponent = Math.min(...values.map((v) => v.exponent))
        const integers = values.map((v) => {
          scalarWork(budget, integerBits(v.significand) + v.exponent - exponent)
          return v.significand << BigInt(v.exponent - exponent)
        })
        let divisor = 0n
        for (const value of integers) {
          let a = divisor,
            b = value < 0n ? -value : value
          while (b) {
            scalarWork(budget, Math.max(integerBits(a), integerBits(b)))
            const next = a % b
            a = b
            b = next
          }
          divisor = a
        }
        if (!divisor) throw new Error('Singular source direction matrix')
        const reduced = integers.map((value) => {
          scalarWork(budget, integerBits(value))
          return boundedScalar(
            { significand: value / divisor, exponent: 0 },
            budget
          )
        })
        return [
          reduced.slice(0, 3),
          reduced.slice(3, 6),
          reduced.slice(6, 9)
        ] as unknown as readonly ExactPoint[]
      })
      const cofactor = this.observeStage('directionCofactor', () => [
        cross(linear[1], linear[2]),
        cross(linear[2], linear[0]),
        cross(linear[0], linear[1])
      ])
      const result = {
        linear,
        cofactor,
        vectors: {
          edge: new Map<string, ExactPoint | typeof exhausted>(),
          normal: new Map<string, ExactPoint | typeof exhausted>()
        }
      }
      this.directionOperators.set(frame, result)
      this.counters.directionOperatorPreparations++
      return result
    } catch (error) {
      if (error === exhausted) this.directionOperators.set(frame, exhausted)
      throw error
    }
  }
  private directions(input: PlacedRegion): PlacedDirections {
    const previous = this.placedDirections.get(input)
    if (previous === exhausted) throw exhausted
    if (previous) return previous
    this.counters.directionPreparationAttempts++
    try {
      const result = this.observeStage('placementDirections', () => {
        // Untagged legacy points retain the exact historical raw axis scale.
        if (!input.points.some((p) => p.some((v) => !!scalarAccount(v))))
          return this.pointDirections(input)
        const source = sourceRelationValue(this.placementInputs.get(input))
        const local = this.sourceDirections(source.region)
        const operators = source.frames.map((frame) =>
          this.directionOperator(frame)
        )
        const transport = (value: ExactPoint, normal: boolean) => {
          let result = value
          for (const operator of operators) {
            const key = this.observeStage(
              normal ? 'directionNormalTransport' : 'directionEdgeTransport',
              () =>
                result
                  .map((v) => {
                    scalarWork(
                      sourceRelationValue(this.rationalAccount),
                      integerBits(v.significand)
                    )
                    if (v.exponent !== 0)
                      throw new Error('Nonprimitive source direction')
                    return v.significand.toString()
                  })
                  .join(',')
            )
            const cache = normal
              ? operator.vectors.normal
              : operator.vectors.edge
            const previous = cache.get(key)
            if (previous === exhausted) throw exhausted
            if (previous) {
              this.counters.directionVectorReuses++
              result = previous
              continue
            }
            try {
              result = this.observeStage(
                normal ? 'directionNormalTransport' : 'directionEdgeTransport',
                () => {
                  const matrix = normal ? operator.cofactor : operator.linear
                  return [
                    dot(matrix[0], result),
                    dot(matrix[1], result),
                    dot(matrix[2], result)
                  ] as ExactPoint
                }
              )
              result = this.observeStage('directionFinalKey', () =>
                sourceRelationValue(uniqueDirections([result])[0])
              )
              cache.set(key, result)
              this.counters.directionVectorPreparations++
            } catch (error) {
              if (error === exhausted) cache.set(key, exhausted)
              throw error
            }
          }
          return result
        }
        const directions = {
          normals: local.normals.map((v) => transport(v, true)),
          edges: local.edges.map((v) => transport(v, false))
        }
        this.counters.directionTransports++
        return directions
      })
      this.placedDirections.set(input, result)
      this.counters.directionPreparations++
      return result
    } catch (error) {
      if (error === exhausted) {
        this.placedDirections.set(input, exhausted)
        this.counters.directionPreparationFailures++
      }
      throw error
    }
  }
  private observeAxisStage<T>(
    stage: 'Preparation' | 'Projection' | 'Constraint',
    run: () => T
  ): T {
    const operations = this.counters.rationalArithmeticOperations,
      predicates = this.counters.exactPredicates
    try {
      return this.observeStage(`axis${stage}`, run)
    } finally {
      this.counters[`axis${stage}Operations`] +=
        this.counters.rationalArithmeticOperations - operations
      this.counters[`axis${stage}Predicates`] +=
        this.counters.exactPredicates - predicates
    }
  }
  private *completeAxes(
    a: PlacedDirections,
    b: PlacedDirections
  ): Generator<ExactPoint> {
    const counters = this.counters
    function* candidates() {
      yield* a.normals
      yield* b.normals
      for (const edge of a.edges)
        for (const other of b.edges) {
          counters.edgeCrossProducts++
          yield cross(edge, other)
        }
    }
    let axisIndex = 0
    const iterator = uniqueDirectionIterator(candidates(), (event) => {
      if (event === 'candidate') {
        counters.axisCandidates++
        if (axisIndex++ < a.normals.length + b.normals.length)
          counters.normalAxisCandidates++
        else counters.crossAxisCandidates++
      } else if (event === 'unique') counters.uniqueAxes++
      else if (event === 'duplicate') counters.duplicateAxes++
      else counters.zeroAxes++
    })
    while (true) {
      const next = this.observeAxisStage('Preparation', () => iterator.next())
      if (next.done) return
      yield next.value
    }
  }
  private projection(
    points: readonly ExactPoint[],
    axis: ExactPoint,
    observeAxis = false
  ) {
    let min: Dyadic | undefined, max: Dyadic | undefined
    for (const p of points) {
      this.predicate()
      if (observeAxis) this.counters.axisProjectionVertices++
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
    return this.observeStage('boundaryLocus', () => {
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
        const firstTriangles = covered(
            first,
            relation.firstFeature,
            firstRanges
          ),
          secondTriangles = covered(
            second,
            relation.secondFeature,
            secondRanges
          )
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
    })
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
    return this.relateScaled(first, second, margin, time)
  }
  private relateScaled(
    first: WalkingRegionPlacement,
    second: WalkingRegionPlacement,
    margin: number,
    time?: Readonly<{
      from: number
      until: number
      pathFrom: number
      pathUntil: number
    }>,
    coordinateScale: Dyadic = dyadic(1)
  ): WalkingRegionRelation {
    return this.observeStage('relationSetupAndXYZ', () => {
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
          (margin === 0 ||
            compare(
              product(gap, gap),
              product(
                product(
                  product(dyadic(margin), coordinateScale),
                  product(dyadic(margin), coordinateScale)
                ),
                dot(axis, axis)
              )
            ) >= 0)
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
            return freeze({ kind: 'separated', proof: 'strict-bounds', axis })
        const completeAxes = this.completeAxes(
          this.directions(a),
          this.directions(b)
        )
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
        let contactAxis: ExactPoint | undefined,
          contactLevel: Dyadic | undefined
        const proof = isZero(velocity) ? 'complete-sat' : 'linear-time-sat'
        for (const axis of completeAxes) {
          const { left, right, slope } = this.observeAxisStage(
            'Projection',
            () => {
              this.counters.axisProjectionPairs++
              return {
                left: this.projection(a.points, axis, true),
                right: this.projection(b.points, axis, true),
                slope: dot(velocity, axis)
              }
            }
          )
          const separated = this.observeAxisStage('Constraint', () => {
            if (wholeGap(left, right, slope, axis)) return true
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
            return false
          })
          if (separated) {
            this.counters.earlySeparatedPairs++
            return freeze({ kind: 'separated', proof, axis })
          }
        }
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
    })
  }
}
export interface WalkingNonlinearRelationInput {
  readonly mountedCrate?: WalkingMountedCrate
  readonly mountedPart?: Readonly<RobotPart>
  readonly exclusion?: Extract<
    import('./scene-demand').SceneDemandExclusion,
    { kind: 'source' }
  >
  readonly owner: object
  readonly shape: Shape
  readonly region: SourceRegion
  readonly part?: WalkingRobotPart
  readonly body?: WalkingRobotBody
  readonly holderBodyId?: string
  readonly localFrames: readonly QueryExactFrame[]
  readonly localBounds: readonly ReturnType<typeof prepareQueryForwardFrame>[]
  readonly terrain?: import('../domain/walking-motion-contract').WalkingTerrainRegion
  readonly semantic?: Readonly<{
    kind: 'channel' | 'debris'
    bounds: SceneDemandBounds
  }>
}
type NonlinearCycleBound = ReturnType<
  import('../domain/walking-motion-contract').WalkingCurrentCycle['owner']['bound']
>
type NonlinearCyclePoint = ReturnType<
  import('../domain/walking-motion-contract').WalkingCurrentCycle['owner']['evaluate']
>
type NonlinearParameter = NonlinearCycleBound['parameter']
type NonlinearKind =
  | 'strictBounds'
  | 'exactSeparated'
  | 'declaredBoundary'
  | 'blocked'
  | 'unknown'
  | 'unvisited'
export interface WalkingNonlinearPairProof {
  readonly parameter: NonlinearParameter
  readonly kind: NonlinearKind
  readonly reason?: string
  readonly witness?: ConstrainedFraction
  readonly sheetTriangle?: Readonly<{
    inventoryIndex: number
    triangleOffset: number
  }>
  readonly axis?: ExactPoint
  readonly boundary?: BoundaryWitness
  readonly ground?: Readonly<{
    extrusion: WalkingFootExtrusion
    height: ConstrainedFraction
    bounds: NonlinearCycleBound
    mode: 'support' | 'swing'
  }>
  readonly terrainReceipts?: readonly import('./walking-terrain-placement').WalkingTerrainPlacement[]
}
export interface WalkingNonlinearSourceRelations {
  readonly format: 'walking-nonlinear-source-relations/1'
  readonly request: import('../domain/walking-motion-contract').WalkingNonlinearMotionRequest
  readonly source: WalkingRobotSource
  readonly cycle: import('../domain/walking-constrained-kinematics').WalkingConstrainedCycle
  readonly demand: SceneDemand
  readonly inventory: readonly WalkingNonlinearRelationInput[]
  readonly footExtrusions: readonly WalkingFootExtrusion[]
  readonly movingCount: number
  readonly phaseCover: readonly Readonly<{
    phase: 0 | 1
    parameter: NonlinearParameter
    time: import('../domain/walking-motion-contract').WalkingNonlinearMotionRequest['path']['phases'][number]
    source: WalkingRobotSource
    cycle: import('../domain/walking-constrained-kinematics').WalkingConstrainedCycle
    load: import('../domain/walking-motion-contract').WalkingNonlinearLoadCase
    bounds: NonlinearCycleBound
    routeCoverage: 'complete' | 'unknown'
  }>[]
  readonly phases: readonly Readonly<{
    phase: 0 | 1
    covers: readonly (WalkingRegionCover &
      Readonly<{
        parameter: NonlinearParameter
        bounds?: NonlinearCycleBound
      }>)[]
    pairs: readonly Readonly<{
      first: number
      second: number
      kind: NonlinearKind
      proofs: readonly WalkingNonlinearPairProof[]
    }>[]
  }>[]
  readonly coverage: Readonly<RelationCoverage>
  readonly status: 'clear' | 'blocked' | 'unknown'
  readonly reasons: readonly string[]
  readonly work: Readonly<{
    groupPairs: number
    leafPairs: number
    globalFixedReuses: number
    phaseFixedReuses: number
    phaseNodes: number
    subdivisions: number
    pairIntervals: number
    pointPreparations: number
    rationalNodePreparations: number
    vertexBounds: number
    projectionVertices: number
    cycleOperations: number
    inputPreparations: number
    sheetTriangleRequired: number
    sheetTriangleIntervals: number
    sheetTriangleUnvisited: number
    kernel: WalkingSourceRelationEvaluator['work']
  }>
}
function mountedCrateFrame(crate: WalkingMountedCrate) {
  const exact: QueryExactFrame = freeze({
    matrix: [
      [dyadic(1), dyadic(0), dyadic(0)],
      [dyadic(0), dyadic(1), dyadic(0)],
      [dyadic(0), dyadic(0), dyadic(1)]
    ],
    position: crate.placement.translation,
    determinant: dyadic(1)
  })
  const bound = (value: Dyadic): Interval => {
    const numerator =
      value.exponent >= 0
        ? value.significand << BigInt(value.exponent)
        : value.significand
    const denominator = value.exponent >= 0 ? 1n : 1n << BigInt(-value.exponent)
    return {
      low: roundFraction(numerator, denominator, 'down'),
      high: roundFraction(numerator, denominator, 'up')
    }
  }
  const bounds: ReturnType<typeof prepareQueryForwardFrame> = freeze({
    matrix: [
      [interval(1), interval(0), interval(0)],
      [interval(0), interval(1), interval(0)],
      [interval(0), interval(0), interval(1)]
    ],
    position: [
      bound(exact.position[0]),
      bound(exact.position[1]),
      bound(exact.position[2])
    ]
  })
  return { exact: Object.freeze([exact]), bounds: Object.freeze([bounds]) }
}
/** Base-frame topology only; canonical motion still owns all other interval pairs. */
export function prepareWalkingMountedCrateRelations(
  evaluator: WalkingSourceRelationEvaluator,
  current: WalkingCurrentCycle,
  mounted: WalkingCurrentMountedCrate,
  maxBits: number
) {
  const { cycle } = current,
    { crate } = mounted
  const receipt = current.owner.readBaseMotion(cycle)
  const ensure = () => {
    if (
      !receipt ||
      current.owner.read(cycle.source, cycle.recipe) !== cycle ||
      current.owner.readBaseMotion(cycle) !== receipt ||
      receipt.cycle !== cycle ||
      receipt.source !== crate.source ||
      receipt.recipe !== cycle.recipe ||
      receipt.determinant.numerator <= 0n ||
      mounted.owner.read(cycle.source, crate) !== crate
    )
      throw new Error('Stale mounted common-base relation')
  }
  ensure()
  const issued = sourceRelationValue(receipt)
  const frames = mountedCrateFrame(crate)
  let node: WalkingRationalSourceNode | undefined
  const placements = new Map<
    object,
    Map<SourceRegion, WalkingRegionPlacement>
  >()
  const place = (
    part: WalkingRobotPart | Readonly<RobotPart>,
    region: SourceRegion,
    base: boolean
  ) => {
    if (!part.regions.includes(region))
      throw new Error('Foreign mounted region')
    let regions = placements.get(part)
    if (!regions) {
      regions = new Map()
      placements.set(part, regions)
    }
    let result = regions.get(region)
    if (!result) {
      node ??= evaluator.prepareRationalNode(
        issued.parts.map((p) => p.local),
        maxBits
      )
      const index = base ? issued.parts.findIndex((p) => p.part === part) : -1
      if (base && index < 0) throw new Error('Non-base mounted relation')
      result = evaluator.rationalPlacement(
        evaluator.prepare(part.shape, region),
        node,
        index,
        base ? noFrames : frames.exact
      )
      regions.set(region, result)
    }
    return result
  }
  return Object.freeze({
    receipt,
    crate,
    placement: frames,
    relate(
      basePart: WalkingRobotPart,
      baseRegion: SourceRegion,
      cratePart: Readonly<RobotPart>,
      crateRegion: SourceRegion,
      margin: number
    ) {
      ensure()
      if (margin !== 0) return undefined
      if (
        !issued.parts.some((p) => p.part === basePart) ||
        !crate.geometry.parts.includes(cratePart)
      )
        throw new Error('Foreign mounted part')
      const a = place(basePart, baseRegion, true),
        b = place(cratePart, crateRegion, false)
      const relation = evaluator.relateRational(
        a,
        b,
        sourceRelationValue(node),
        0
      )
      if (relation.kind === 'separated')
        return { kind: 'exactSeparated' as const }
      if (relation.kind === 'volume-overlap')
        return { kind: 'blocked' as const }
      if (relation.kind !== 'boundary') return undefined
      if (
        basePart !== crate.tray ||
        baseRegion !== crate.trayPatch.region ||
        cratePart !== crate.geometry.bottomPart ||
        crateRegion !== crate.geometry.bottomPatch.region
      )
        return { kind: 'blocked' as const }
      const boundary = evaluator.proveBoundary(
        a,
        b,
        relation,
        crate.trayPatch.ranges,
        crate.geometry.bottomPatch.ranges
      )
      return boundary
        ? { kind: 'declaredBoundary' as const, boundary }
        : undefined
    }
  })
}
/** Mathematical whole-phase topology consumer; current entry owner still owns admission. */
export function prepareWalkingConstantRootRelations(
  evaluator: WalkingSourceRelationEvaluator,
  current: WalkingCurrentCycle,
  maxBits: number,
  mounted?: WalkingCurrentMountedCrate,
  phase?: number
) {
  const { cycle } = current,
    source = cycle.source
  const readReceipt = () =>
    phase === undefined
      ? current.owner.readConstantMotion(cycle)
      : current.owner.readPhaseRootMotion(cycle, phase)
  const receipt = readReceipt()
  const ensure = () => {
    if (
      !receipt ||
      current.owner.read(source, cycle.recipe) !== cycle ||
      readReceipt() !== receipt ||
      receipt.source !== source ||
      receipt.recipe !== cycle.recipe ||
      receipt.determinant.numerator <= 0n ||
      (mounted && mounted.owner.read(source, mounted.crate) !== mounted.crate)
    )
      throw new Error('Stale constant-root relation')
  }
  ensure()
  const issued = sourceRelationValue(receipt)
  const locals = new Map(issued.parts.map((p, index) => [p.part, index]))
  const mountFrames = mounted && mountedCrateFrame(mounted.crate)
  let node: WalkingRationalSourceNode | undefined
  const placements = new Map<
    object,
    Map<SourceRegion, WalkingRegionPlacement>
  >()
  const localIndex = (part: WalkingRobotPart | Readonly<RobotPart>) =>
    issued.parts.findIndex((p) => p.part === part)
  const member = (part: WalkingRobotPart | Readonly<RobotPart>) =>
    localIndex(part) >= 0 ||
    !!mounted?.crate.geometry.parts.some((p) => p === part)
  const place = (
    part: WalkingRobotPart | Readonly<RobotPart>,
    region: SourceRegion
  ) => {
    if (!member(part) || !part.regions.includes(region))
      throw new Error('Foreign constant-root material')
    let regions = placements.get(part)
    if (!regions) {
      regions = new Map()
      placements.set(part, regions)
    }
    let result = regions.get(region)
    if (!result) {
      node ??= evaluator.prepareRationalNode(
        issued.parts.map((p) => p.local),
        maxBits
      )
      const index = localIndex(part)
      result = evaluator.rationalPlacement(
        evaluator.prepare(part.shape, region),
        node,
        index,
        index >= 0 ? noFrames : sourceRelationValue(mountFrames).exact
      )
      regions.set(region, result)
    }
    return result
  }
  return Object.freeze({
    receipt: issued,
    relate(
      a: WalkingRobotPart | Readonly<RobotPart>,
      ar: SourceRegion,
      b: WalkingRobotPart | Readonly<RobotPart>,
      br: SourceRegion,
      margin: number
    ) {
      ensure()
      if (margin !== 0 || !member(a) || !member(b)) return undefined
      const ap = place(a, ar),
        bp = place(b, br)
      const result = evaluator.relateRational(
        ap,
        bp,
        sourceRelationValue(node),
        0
      )
      if (result.kind === 'separated')
        return { kind: 'exactSeparated' as const }
      if (result.kind === 'volume-overlap') return { kind: 'blocked' as const }
      if (result.kind !== 'boundary') return undefined
      const crate = mounted?.crate
      let firstRanges: SourcePatch['ranges'] = [],
        secondRanges: SourcePatch['ranges'] = []
      if (
        crate &&
        ((a === crate.tray && b === crate.geometry.bottomPart) ||
          (b === crate.tray && a === crate.geometry.bottomPart))
      ) {
        const ranges = (
          part: WalkingRobotPart | Readonly<RobotPart>,
          region: SourceRegion
        ): SourcePatch['ranges'] => {
          if (part === crate.tray && region === crate.trayPatch.region)
            return crate.trayPatch.ranges
          if (
            part === crate.geometry.bottomPart &&
            region === crate.geometry.bottomPatch.region
          )
            return crate.geometry.bottomPatch.ranges
          return []
        }
        firstRanges = ranges(a, ar)
        secondRanges = ranges(b, br)
      } else {
        const first = issued.parts.find((p) => p.part === a)?.part
        const second = issued.parts.find((p) => p.part === b)?.part
        if (first && second) {
          const joint = source.rig.joints.find(
            (j) =>
              (j.parentBodyId === first.bodyId &&
                j.childBodyId === second.bodyId) ||
              (j.parentBodyId === second.bodyId &&
                j.childBodyId === first.bodyId)
          )
          const declared =
            joint &&
            source.rig.jointInterfaces.find((p) => p.jointId === joint.id)
          if (joint && declared) {
            const ranges = (part: WalkingRobotPart, region: SourceRegion) =>
              (part.bodyId === joint.parentBodyId
                ? declared.parentPatches
                : declared.childPatches
              )
                .filter((p) => p.part === part && p.patch.region === region)
                .flatMap((p) => p.patch.ranges)
            firstRanges = ranges(first, ar)
            secondRanges = ranges(second, br)
          }
        }
      }
      if (!firstRanges.length || !secondRanges.length)
        return { kind: 'blocked' as const }
      const boundary = evaluator.proveBoundary(
        ap,
        bp,
        result,
        firstRanges,
        secondRanges
      )
      return boundary
        ? { kind: 'declaredBoundary' as const, boundary }
        : undefined
    },
    contains(part: WalkingRobotPart) {
      ensure()
      return locals.has(part)
    }
  })
}
/** Complete source inventory and interval decisions; terrain applicability is an entry-owner concern. */
export function prepareWalkingNonlinearSourceRelations(
  request: import('../domain/walking-motion-contract').WalkingNonlinearMotionRequest,
  current: import('../domain/walking-motion-contract').WalkingCurrentCycle,
  priorCycleOperations = 0,
  priorExactPredicates = 0,
  mounted?: WalkingCurrentMountedCrate
): WalkingNonlinearSourceRelations {
  if (
    !Number.isSafeInteger(priorCycleOperations) ||
    priorCycleOperations < 0 ||
    priorCycleOperations > request.budget.maxCycleOperations
  )
    throw new Error('Invalid prior nonlinear cycle work')
  if (
    readWalkingNonlinearMotionRequest(
      request,
      request.source,
      request.demand,
      current,
      mounted
    ) !== request
  )
    throw new Error('Unadmitted nonlinear source request')
  const source = request.source,
    demand = request.demand,
    cycle = current.cycle
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: request.budget.maxRegionPairs,
    maxExactPredicates: request.budget.maxExactPredicates,
    maxBits: request.budget.maxBits,
    priorExactPredicates
  })
  const reasons = new Set<string>()
  let mountedRelations:
    ReturnType<typeof prepareWalkingMountedCrateRelations> | undefined
  const work = {
    groupPairs: 0,
    leafPairs: 0,
    globalFixedReuses: 0,
    phaseFixedReuses: 0,
    phaseNodes: 0,
    subdivisions: 0,
    pairIntervals: 0,
    pointPreparations: 0,
    rationalNodePreparations: 0,
    vertexBounds: 0,
    projectionVertices: 0,
    cycleOperations: 0,
    inputPreparations: 0,
    sheetTriangleRequired: 0,
    sheetTriangleIntervals: 0,
    sheetTriangleUnvisited: 0
  }
  const exactFrames = new Map<object, QueryExactFrame>(),
    boundedFrames = new Map<
      object,
      ReturnType<typeof prepareQueryForwardFrame>
    >()
  const transform = (frame: WalkingRigidTransform) => {
    let exact = exactFrames.get(frame),
      bounds = boundedFrames.get(frame)
    if (!exact) {
      exact = prepareQueryExactForwardFrame(frame)
      exactFrames.set(frame, exact)
      work.inputPreparations++
    }
    if (!bounds) {
      bounds = prepareQueryForwardFrame(frame)
      boundedFrames.set(frame, bounds)
    }
    return { exact, bounds }
  }
  const sources: WalkingNonlinearRelationInput[] = []
  for (const body of source.rig.bodies)
    for (const part of body.parts)
      for (const region of part.regions)
        sources.push({
          owner: body,
          body,
          part,
          shape: part.shape,
          region,
          localFrames: noFrames,
          localBounds: []
        })
  const external = new Map(
    request.externalSources.map((p) => [p.sourceId, p.regions])
  )
  const attachment = (
    owner: object,
    shape: Shape,
    sourceId: string,
    holderBodyId: string,
    localFrame: WalkingRigidTransform
  ) => {
    const frame = transform(localFrame)
    for (const region of external.get(sourceId) ?? [])
      sources.push({
        owner,
        shape,
        region,
        holderBodyId,
        localFrames: Object.freeze([frame.exact]),
        localBounds: Object.freeze([frame.bounds])
      })
  }
  if (request.load.crate.kind === 'unknown')
    reasons.add('crate-geometry-unknown')
  else if (request.load.crate.kind === 'mounted') {
    const crate = request.load.crate.artifact
    mountedRelations = prepareWalkingMountedCrateRelations(
      evaluator,
      current,
      sourceRelationValue(mounted),
      request.budget.maxBits
    )
    const frame = mountedRelations.placement
    work.inputPreparations++
    for (const part of crate.geometry.parts)
      for (const region of part.regions)
        sources.push({
          owner: crate,
          mountedCrate: crate,
          mountedPart: part,
          shape: part.shape,
          region,
          holderBodyId: 'base',
          localFrames: frame.exact,
          localBounds: frame.bounds
        })
  } else {
    if (request.load.crate.sourceCoverage !== 'complete')
      reasons.add('crate-source-geometry-incomplete')
    const crate = request.load.crate
    crate.sourceParts.forEach((p, i) =>
      attachment(crate, p.shape, p.sourceId, 'base', crate.localFrames[i])
    )
  }
  if (request.load.carried.kind === 'attached')
    for (const item of request.load.carried.items) {
      if (item.sourceCoverage !== 'complete')
        reasons.add('carried-source-geometry-incomplete')
      if (item.shape.kind === 'unknown')
        reasons.add('carried-source-geometry-unknown')
      else
        attachment(
          item,
          item.shape,
          item.sourceId,
          item.holderBodyId,
          item.localFrame
        )
    }
  const movingCount = sources.length
  const instanceExact = new Map<object, QueryExactFrame>(),
    instanceBounds = new Map<
      object,
      ReturnType<typeof prepareQueryInstanceFrame>
    >()
  for (const exclusion of demand.freePassage.exclusions) {
    if (
      exclusion.kind !== 'source' ||
      exclusion.mesh.descriptor.shape.kind !== 'triangles'
    )
      continue
    const descriptor = transform(exclusion.transform.descriptor)
    const localFrames: QueryExactFrame[] = [],
      localBounds: ReturnType<typeof prepareQueryForwardFrame>[] = []
    if (exclusion.transform.instance) {
      const input = exclusion.transform.instance
      let exact = instanceExact.get(input),
        bounds = instanceBounds.get(input)
      if (!exact) {
        exact = prepareQueryExactInstanceFrame(input)
        instanceExact.set(input, exact)
        work.inputPreparations++
      }
      if (!bounds) {
        bounds = prepareQueryInstanceFrame(input)
        instanceBounds.set(input, bounds)
      }
      localFrames.push(exact)
      localBounds.push(bounds)
    }
    localFrames.push(descriptor.exact)
    localBounds.push(descriptor.bounds)
    const previous = sources[sources.length - 1],
      prior = previous?.exclusion
    const same =
      prior &&
      prior.mesh.regions === exclusion.mesh.regions &&
      prior.mesh.descriptor.shape === exclusion.mesh.descriptor.shape &&
      prior.transform.descriptor === exclusion.transform.descriptor &&
      prior.transform.instance === exclusion.transform.instance &&
      prior.relation === exclusion.relation
    sources.push({
      owner: same ? previous.owner : exclusion,
      exclusion,
      shape: exclusion.mesh.descriptor.shape,
      region: exclusion.region,
      localFrames: Object.freeze(localFrames),
      localBounds: Object.freeze(localBounds)
    })
  }
  for (const terrain of request.terrain.regions) {
    const frame = transform(terrain.frame)
    for (const region of external.get(terrain.sourceId) ?? [])
      sources.push({
        owner: terrain,
        terrain,
        shape: terrain.shape,
        region,
        localFrames: Object.freeze([frame.exact]),
        localBounds: Object.freeze([frame.bounds])
      })
  }
  // These triangles encode an authored exclusion set, never inferred material.
  // Their identity and result reason retain that distinction from source solids.
  const semantic = (
    owner: object,
    kind: 'channel' | 'debris',
    bounds: SceneDemandBounds,
    id: string
  ) => {
    const positions = [
      ...bounds.min,
      ...[bounds.max[0], bounds.min[1], bounds.min[2]],
      ...[bounds.max[0], bounds.max[1], bounds.min[2]],
      ...[bounds.min[0], bounds.max[1], bounds.min[2]],
      ...[bounds.min[0], bounds.min[1], bounds.max[2]],
      ...[bounds.max[0], bounds.min[1], bounds.max[2]],
      ...bounds.max,
      ...[bounds.min[0], bounds.max[1], bounds.max[2]]
    ]
    const shape = freeze({
      kind: 'triangles' as const,
      positions,
      indices: [
        0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2,
        0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5
      ]
    })
    const region = freeze({
      id,
      kind: bounds.min.every((v, k) => v < bounds.max[k])
        ? ('closed-solid' as const)
        : ('open-shell' as const),
      indexStart: 0,
      indexCount: 36
    })
    sources.push({
      owner,
      shape,
      region,
      localFrames: noFrames,
      localBounds: [],
      semantic: { kind, bounds }
    })
  }
  for (const channel of demand.channels)
    semantic(
      channel,
      'channel',
      channel.bounds,
      'channel-' + channel.bay + '-' + channel.stripId
    )
  for (const terrain of request.terrain.regions)
    if (terrain.keepOut.kind === 'bounded')
      semantic(terrain, 'debris', terrain.keepOut, 'debris-' + terrain.id)
  const groups = new Map<object, number>()
  for (const entry of sources.slice(0, movingCount))
    groups.set(entry.owner, (groups.get(entry.owner) ?? 0) + 1)
  const coRigid = [...groups.values()].reduce(
    (sum, n) => sum + (n * (n - 1)) / 2,
    0
  )
  const candidate =
    (movingCount * (movingCount - 1)) / 2 +
    movingCount * (sources.length - movingCount)
  const required = candidate - coRigid
  if (!Number.isSafeInteger(candidate))
    throw new Error('Nonlinear pair inventory exceeds safe integer domain')
  const pairs: { first: number; second: number }[] = []
  const coverGroups: {
    owner: object
    parts: {
      shape: Shape
      regions: SourceRegion[]
      frameIndex: number
      inputs: WalkingNonlinearRelationInput[]
    }[]
  }[] = []
  for (const entry of sources) {
    let group = coverGroups[coverGroups.length - 1]
    if (!group || group.owner !== entry.owner) {
      group = { owner: entry.owner, parts: [] }
      coverGroups.push(group)
    }
    let part = group.parts[group.parts.length - 1]
    const prior = part?.inputs[0]
    const same =
      prior &&
      prior.shape === entry.shape &&
      prior.part === entry.part &&
      prior.holderBodyId === entry.holderBodyId &&
      prior.terrain === entry.terrain &&
      prior.semantic === entry.semantic &&
      prior.localFrames.length === entry.localFrames.length &&
      prior.localFrames.every((f, k) => f === entry.localFrames[k])
    if (!same) {
      part = { shape: entry.shape, regions: [], frameIndex: -1, inputs: [] }
      group.parts.push(part)
    }
    part.regions.push(entry.region)
    part.inputs.push(entry)
  }
  const groupInputs = Object.freeze(
    coverGroups.map((g) =>
      Object.freeze({
        parts: Object.freeze(
          g.parts.map((p) =>
            Object.freeze({
              ...p,
              regions: Object.freeze(p.regions),
              inputs: Object.freeze(p.inputs)
            })
          )
        )
      })
    )
  )
  const rootSpans: WalkingRegionSpan[] = []
  let inventoryOffset = 0,
    movingGroups = 0
  for (const group of coverGroups) {
    const count = group.parts.reduce((n, p) => n + p.regions.length, 0)
    if (inventoryOffset < movingCount) movingGroups++
    rootSpans.push({ start: inventoryOffset, count })
    inventoryOffset += count
  }
  const initialCovers = () =>
    rootSpans.slice(0, movingGroups).flatMap((first) => {
      const start = first.start + first.count,
        count = sources.length - start
      return count
        ? [
            Object.freeze({
              first: Object.freeze(first),
              second: Object.freeze({ start, count }),
              ordinal: Object.freeze([0, first.count * count] as const),
              cardinality: first.count * count,
              kind: 'unvisited' as const
            })
          ]
        : []
    })
  const topology = new Map<WalkingNonlinearRelationInput, readonly number[]>()
  const footExtrusions = source.rig.contacts.feet.flatMap((contact) => {
    const proof = evaluator.proveFootExtrusion(
      contact.part,
      contact.patch.region,
      contact.patch
    )
    return proof ? [proof] : []
  })
  const sourceIndices = (entry: WalkingNonlinearRelationInput) => {
    const previous = topology.get(entry)
    if (previous) return previous
    const indices = new Set<number>()
    for (
      let offset = entry.region.indexStart;
      offset < entry.region.indexStart + entry.region.indexCount;
      offset++
    ) {
      evaluator.accountIntervalPredicate()
      const original = entry.shape.indices[offset]
      indices.add(original)
    }
    const result = Object.freeze([...indices])
    topology.set(entry, result)
    return result
  }
  const worldVertices = new Map<WalkingNonlinearRelationInput, VertexBounds>()
  const vertices = (
    entry: WalkingNonlinearRelationInput,
    frame?: ConstrainedFrame<Interval>
  ): VertexBounds => {
    if (!frame && worldVertices.has(entry))
      return sourceRelationValue(worldVertices.get(entry))
    const result = sourceIndices(entry).map((index) => {
      evaluator.accountIntervalPredicate()
      let p = entry.shape.positions
        .slice(index * 3, index * 3 + 3)
        .map(interval) as [Interval, Interval, Interval]
      for (const local of entry.localBounds)
        p = transformQueryPoint(local, p) as [Interval, Interval, Interval]
      if (frame)
        p = frame.origin.map((v, k) =>
          frame.matrix[k].reduce(
            (sum, q, j) => addInterval(sum, multiplyInterval(q, p[j])),
            v
          )
        ) as [Interval, Interval, Interval]
      work.vertexBounds++
      return Object.freeze(p)
    })
    if (!frame) worldVertices.set(entry, result)
    return Object.freeze(result)
  }
  const box = (points: VertexBounds): SceneDemandBounds => ({
    min: [0, 1, 2].map((k) =>
      Math.min(...points.map((p) => p[k].low))
    ) as unknown as Point3,
    max: [0, 1, 2].map((k) =>
      Math.max(...points.map((p) => p[k].high))
    ) as unknown as Point3
  })
  const strict = (a: SceneDemandBounds, b: SceneDemandBounds, margin: number) =>
    a.max.some((v, k) => {
      const left = difference(dyadic(b.min[k]), dyadic(v)),
        right = difference(dyadic(a.min[k]), dyadic(b.max[k]))
      return (
        (left.significand > 0n && compare(left, dyadic(margin)) >= 0) ||
        (right.significand > 0n && compare(right, dyadic(margin)) >= 0)
      )
    })
  const ensure = () => {
    if (current.owner.read(source, cycle.recipe) !== cycle)
      throw new Error('Stale nonlinear cycle relation')
  }
  const cycleWork = (operations: number) => {
    work.cycleOperations += operations
    if (
      work.cycleOperations + priorCycleOperations >
      request.budget.maxCycleOperations
    )
      throw new Error('Nonlinear cycle operation budget exhausted')
  }
  const reserveCycle = () => {
    if (
      request.budget.maxCycleOperations -
        priorCycleOperations -
        work.cycleOperations <
      cycle.recipe.budget.maxOperations
    )
      throw new Error('Nonlinear cycle operation reservation unavailable')
  }
  const phaseCover: WalkingNonlinearSourceRelations['phaseCover'][number][] = []
  const phases: WalkingNonlinearSourceRelations['phases'][number][] = []
  const overall = coverage()
  const fixedCache = new Map<
    string,
    { kind: NonlinearKind; boundary?: BoundaryWitness }
  >()
  const soilPlanes = new Map<
    WalkingNonlinearRelationInput,
    Map<string, boolean>
  >()
  const footLocus = (
    extrusion: WalkingFootExtrusion,
    bound: NonlinearCycleBound
  ): WalkingNonlinearPairProof['ground'] => {
    const height = bound.supports[0]?.fixedVertices[0]?.position[1]
    if (
      !height ||
      bound.supports.some((s) =>
        s.fixedVertices.some(
          (v) =>
            v.position[1].numerator !== height.numerator ||
            v.position[1].denominator !== height.denominator
        )
      )
    )
      return
    const frame = bound.parts.find((p) => p.part === extrusion.part)?.bounds
    if (!frame) return
    const coefficient = frame.matrix[1][extrusion.axis]
    if (
      (extrusion.extrusionSign === 1 ? coefficient.low : -coefficient.high) <= 0
    )
      return
    const support = bound.supports.find(
      (s) => s.part === extrusion.part && s.patch === extrusion.patch
    )
    const swing = bound.swing.find(
      (s) => s.part === extrusion.part && s.patch === extrusion.patch
    )
    if (!support && !swing) return
    const original = extrusion.patchVertexIndices
    const included = support
      ? support.fixedVertices.map((v) => v.index)
      : sourceRelationValue(swing).vertices.map((v) => v.index)
    if (
      original.length !== included.length ||
      !original.every((i) => included.includes(i))
    )
      return
    if (
      swing &&
      (swing.certificate.authority !== 'exact-polynomial-similarity-lift/1' ||
        !swing.certificate.openPhasePositive ||
        !swing.certificate.endpointZero)
    )
      return
    return {
      extrusion,
      height,
      bounds: bound,
      mode: support ? 'support' : 'swing'
    }
  }
  const groundCandidate = (
    a: WalkingNonlinearRelationInput,
    b: WalkingNonlinearRelationInput,
    bound: NonlinearCycleBound
  ): WalkingNonlinearPairProof['ground'] => {
    if (b.terrain?.classification !== 'soil' || b.semantic || !a.part) return
    const extrusion = footExtrusions.find(
      (e) => e.part === a.part && e.region === a.region
    )
    const locus = extrusion && footLocus(extrusion, bound)
    if (!locus) return
    const { height } = locus
    const key = height.numerator + '/' + height.denominator
    let planes = soilPlanes.get(b)
    if (!planes) {
      planes = new Map()
      soilPlanes.set(b, planes)
    }
    let horizontal = planes.get(key)
    if (horizontal === undefined) {
      horizontal = evaluator.proveHorizontalPlane(
        { region: evaluator.prepare(b.shape, b.region), frames: b.localFrames },
        height
      )
      planes.set(key, horizontal)
    }
    if (!horizontal) return
    return locus
  }
  const globalParts = new Set(
    sourceRelationValue(
      current.owner.readConstantMotion(current.cycle)
    ).parts.map((entry) => entry.part)
  )
  const globalMember = (entry: WalkingNonlinearRelationInput) =>
    (entry.part && globalParts.has(entry.part)) ||
    (entry.mountedPart && mounted && entry.mountedCrate === mounted.crate)
  const constantRelations = new Map<
    number | 'constant',
    ReturnType<typeof prepareWalkingConstantRootRelations>
  >()
  const phaseRelations = (family: number | 'constant') => {
    let result = constantRelations.get(family)
    if (!result) {
      result = prepareWalkingConstantRootRelations(
        evaluator,
        current,
        request.budget.maxBits,
        mounted,
        family === 'constant' ? undefined : family
      )
      constantRelations.set(family, result)
    }
    return result
  }
  const fixedRelation = (pairIndex: number, margin: number, phase: number) => {
    const { first, second } = pairs[pairIndex],
      a = sources[first],
      b = sources[second]
    const directFixed =
      (b.body?.attachment === 'fixed' &&
        b.body.parentBodyId === a.body?.id &&
        b.body.fixedFrame) ||
      (a.body?.attachment === 'fixed' &&
        a.body.parentBodyId === b.body?.id &&
        a.body.fixedFrame)
    const family =
      directFixed || (globalMember(a) && globalMember(b)) ? 'constant' : phase
    const key = family + ':' + first + ':' + second
    if (fixedCache.has(key)) {
      if (family === 'constant') work.globalFixedReuses++
      else work.phaseFixedReuses++
      return fixedCache.get(key)
    }
    if (margin === 0 && a.part && a.body?.id === 'base' && b.mountedPart) {
      mountedRelations ??= prepareWalkingMountedCrateRelations(
        evaluator,
        current,
        sourceRelationValue(mounted),
        request.budget.maxBits
      )
      const result = mountedRelations.relate(
        a.part,
        a.region,
        b.mountedPart,
        b.region,
        margin
      )
      if (result) fixedCache.set(key, result)
      return result
    }
    if (margin === 0 && a.part && b.mountedPart) {
      const result = phaseRelations(family).relate(
        a.part,
        a.region,
        b.mountedPart,
        b.region,
        margin
      )
      if (result) fixedCache.set(key, result)
      return result
    }
    if (!a.body || !b.body || !a.part || !b.part) return
    let af: readonly QueryExactFrame[], bf: readonly QueryExactFrame[]
    if (
      b.body.attachment === 'fixed' &&
      b.body.parentBodyId === a.body.id &&
      b.body.fixedFrame
    ) {
      af = Object.freeze([transform(a.part.localFrame).exact])
      bf = Object.freeze([
        transform(b.part.localFrame).exact,
        transform(b.body.fixedFrame).exact
      ])
    } else if (
      a.body.attachment === 'fixed' &&
      a.body.parentBodyId === b.body.id &&
      a.body.fixedFrame
    ) {
      af = Object.freeze([
        transform(a.part.localFrame).exact,
        transform(a.body.fixedFrame).exact
      ])
      bf = Object.freeze([transform(b.part.localFrame).exact])
    } else {
      if (margin !== 0) return
      const result = phaseRelations(family).relate(
        a.part,
        a.region,
        b.part,
        b.region,
        margin
      )
      if (result) fixedCache.set(key, result)
      return result
    }
    const ap = { region: evaluator.prepare(a.shape, a.region), frames: af },
      bp = { region: evaluator.prepare(b.shape, b.region), frames: bf }
    const relation = evaluator.relate(ap, bp, 0)
    let result: { kind: NonlinearKind; boundary?: BoundaryWitness } | undefined
    if (relation.kind === 'separated') result = { kind: 'exactSeparated' }
    if (relation.kind === 'volume-overlap') result = { kind: 'blocked' }
    if (relation.kind === 'boundary') {
      const ranges = (entry: WalkingNonlinearRelationInput) =>
        sourceRelationValue(entry.part)
          .patches.filter(
            (p) => p.region === entry.region && p.id.endsWith('-interface')
          )
          .flatMap((p) => p.ranges)
      const boundary = evaluator.proveBoundary(
        ap,
        bp,
        relation,
        ranges(a),
        ranges(b)
      )
      if (boundary) result = { kind: 'declaredBoundary', boundary }
    }
    if (result) fixedCache.set(key, result)
    return result
  }
  const axisGap = (
    a: VertexBounds,
    b: VertexBounds,
    axis: ExactPoint,
    margin: number
  ) =>
    sourceIntervalAxisGap(a, b, axis, margin, request.budget.maxBits, () => {
      work.projectionVertices++
      evaluator.accountIntervalPredicate()
    })
  const half = (
    a: ConstrainedFraction,
    b: ConstrainedFraction
  ): ConstrainedFraction => {
    if (
      integerBits(a.numerator) +
        integerBits(b.denominator) +
        integerBits(b.numerator) +
        integerBits(a.denominator) +
        2 >
      request.budget.maxBits
    )
      throw new Error('Nonlinear subdivision bit budget exhausted')
    const n = a.numerator * b.denominator + b.numerator * a.denominator,
      d = 2n * a.denominator * b.denominator
    let x = n < 0n ? -n : n,
      y = d
    while (y) {
      const r = x % y
      x = y
      y = r
    }
    return Object.freeze({ numerator: n / x, denominator: d / x })
  }
  const allParameter = Object.freeze({
    low: Object.freeze({ numerator: 0n, denominator: 1n }),
    high: Object.freeze({ numerator: 1n, denominator: 1n })
  })
  for (const phase of [0, 1] as const) {
    pairs.length = 0
    const records: {
      first: number
      second: number
      kind: NonlinearKind
      proofs: WalkingNonlinearPairProof[]
    }[] = []
    let covers: WalkingRegionCover[] = initialCovers()
    const queue: { parameter: NonlinearParameter; pending: number[] }[] = [
      { parameter: allParameter, pending: [] }
    ]
    while (queue.length) {
      const task = sourceRelationValue(queue.shift())
      if (work.phaseNodes >= request.budget.maxPhaseNodes) {
        for (const index of task.pending)
          if (records[index].kind !== 'blocked')
            records[index].proofs.push({
              parameter: task.parameter,
              kind: 'unvisited',
              reason: 'nonlinear-phase-node-budget-exhausted'
            })
        continue
      }
      ensure()
      work.phaseNodes++
      let bound: NonlinearCycleBound
      const priorBoundWork = current.owner.work.operations
      let charged = false
      try {
        reserveCycle()
        bound = current.owner.bound(cycle, phase, task.parameter)
        charged = true
        cycleWork(current.owner.work.operations - priorBoundWork)
      } catch (error) {
        const delta = current.owner.work.operations - priorBoundWork
        if (delta && !charged) cycleWork(delta)
        ensure()
        reasons.add(
          error instanceof Error ? error.message : 'nonlinear-bound-unavailable'
        )
        for (const index of task.pending)
          records[index].proofs.push({
            parameter: task.parameter,
            kind: 'unknown',
            reason: 'nonlinear-bound-unavailable'
          })
        continue
      }
      const partBounds = new Map(bound.parts.map((p) => [p.part, p.bounds])),
        bodyBounds = new Map(bound.bodies.map((b) => [b.body.id, b.bounds]))
      const nodeVertices = new Map<number, VertexBounds>(),
        nodeBoxes = new Map<number, SceneDemandBounds>()
      const vertexProduct = (index: number) => {
        let result = nodeVertices.get(index)
        if (!result) {
          const entry = sources[index],
            frame = (() => {
              if (entry.part) {
                return partBounds.get(entry.part)
              }
              if (entry.holderBodyId) {
                return bodyBounds.get(entry.holderBodyId)
              }
              return undefined
            })()
          if (index < movingCount && !frame)
            throw new Error('Missing nonlinear source frame')
          result = vertices(entry, frame)
          nodeVertices.set(index, result)
          nodeBoxes.set(index, box(result))
        }
        return result
      }
      if (task.parameter === allParameter) {
        const route = demand.route?.volume
        let routeCovered = !!route
        if (route) {
          for (const p of bound.parts) {
            if (
              [0, 2].some(
                (k) =>
                  p.sourceBounds.min[k] < route.min[k] ||
                  p.sourceBounds.max[k] > route.max[k]
              ) ||
              p.sourceBounds.max[1] > route.max[1]
            )
              routeCovered = false
            if (p.sourceBounds.min[1] < route.min[1]) {
              const lower = p.part.regions.every((region) => {
                const extrusion = footExtrusions.find(
                  (e) => e.part === p.part && e.region === region
                )
                const locus = extrusion && footLocus(extrusion, bound)
                return (
                  !!locus &&
                  roundFraction(
                    locus.height.numerator,
                    locus.height.denominator,
                    'down'
                  ) >= route.min[1]
                )
              })
              if (!lower) routeCovered = false
            }
          }
          for (let i = 0; i < movingCount; i++)
            if (sources[i].holderBodyId) {
              try {
                vertexProduct(i)
                const bounds = sourceRelationValue(nodeBoxes.get(i))
                if (
                  bounds.min.some((v, k) => v < route.min[k]) ||
                  bounds.max.some((v, k) => v > route.max[k])
                )
                  routeCovered = false
              } catch {
                routeCovered = false
              }
            }
        }
        if (!routeCovered)
          reasons.add('nonlinear-source-route-coverage-unproved')
        phaseCover.push({
          phase,
          parameter: task.parameter,
          time: request.path.phases[phase],
          source,
          cycle,
          load: request.load,
          bounds: bound,
          routeCoverage: routeCovered ? 'complete' : 'unknown'
        })
      }
      let cursor:
        | ReturnType<WalkingSourceRelationEvaluator['prepareRegionCover']>
        | undefined
      if (
        task.parameter === allParameter &&
        work.groupPairs < request.budget.maxEnvelopePairs &&
        work.pairIntervals < request.budget.maxRegionPairs &&
        !evaluator.exactBudgetExhausted
      ) {
        const issued = Object.freeze({ request, bounds: bound })
        cycleRegionNodes.set(issued, { evaluator, current, inputs: sources })
        try {
          cursor = evaluator.prepareRegionCover(groupInputs, issued, {
            movingGroups,
            maxGroupPairs: request.budget.maxEnvelopePairs - work.groupPairs,
            maxLeaves: request.budget.maxRegionPairs - work.pairIntervals,
            margin:
              demand.configuration.clearanceMargin.kind === 'bounded'
                ? demand.configuration.clearanceMargin.metres
                : 0
          })
          if (
            cursor.required !== required ||
            cursor.inventory.length !== sources.length
          )
            throw new Error('Nonlinear region cover inventory mismatch')
          covers = []
        } catch (error) {
          reasons.add(
            error instanceof Error
              ? error.message
              : 'nonlinear-cover-unavailable'
          )
        }
      }
      let point: NonlinearCyclePoint | undefined,
        node: WalkingRationalSourceNode | undefined,
        nodeFailure: Error | undefined
      const placements = new Map<number, WalkingRegionPlacement>()
      const midpoint = half(task.parameter.low, task.parameter.high)
      const placement = (index: number) => {
        let result = placements.get(index)
        if (result) return result
        if (nodeFailure) throw nodeFailure
        try {
          if (!point) {
            ensure()
            reserveCycle()
            const before = current.owner.work.operations
            try {
              point = current.owner.evaluate(cycle, phase, midpoint)
            } finally {
              cycleWork(current.owner.work.operations - before)
            }
            work.pointPreparations++
          }
          if (!node) {
            node = evaluator.prepareRationalNode(
              [
                ...point.parts.map((p) => p.exact),
                ...point.bodies.map((b) => b.exact)
              ],
              request.budget.maxBits
            )
            work.rationalNodePreparations++
          }
        } catch (error) {
          nodeFailure =
            error instanceof Error
              ? error
              : new Error('Nonlinear node arithmetic unavailable')
          throw nodeFailure
        }
        const entry = sources[index]
        const frameIndex = (() => {
          if (entry.part) {
            return point.parts.findIndex((p) => p.part === entry.part)
          }
          if (entry.holderBodyId) {
            return (
              point.parts.length +
              point.bodies.findIndex((b) => b.body.id === entry.holderBodyId)
            )
          }
          return -1
        })()
        if (entry.holderBodyId && frameIndex < point.parts.length)
          throw new Error('Missing nonlinear attachment holder')
        result = evaluator.rationalPlacement(
          evaluator.prepare(entry.shape, entry.region),
          node,
          frameIndex,
          entry.localFrames
        )
        placements.set(index, result)
        return result
      }
      const pending: number[] = []
      function* pendingIndices() {
        if (task.parameter !== allParameter) {
          yield* task.pending
          return
        }
        if (!cursor) return
        while (
          work.pairIntervals < request.budget.maxRegionPairs &&
          !evaluator.exactBudgetExhausted
        ) {
          const proof = cursor.next()
          if (!proof) break
          if (proof.kind !== 'leaf') {
            covers.push(proof)
            continue
          }
          const k = proof.ordinal[0],
            pair = {
              first: proof.first.start + Math.floor(k / proof.second.count),
              second: proof.second.start + (k % proof.second.count)
            }
          const index = pairs.length
          pairs.push(pair)
          records.push({ ...pair, kind: 'unvisited', proofs: [] })
          yield index
        }
      }
      for (const index of pendingIndices()) {
        const record = records[index]
        if (record.kind === 'blocked') continue
        if (
          work.pairIntervals >= request.budget.maxRegionPairs ||
          evaluator.exactBudgetExhausted
        ) {
          record.proofs.push({
            parameter: task.parameter,
            kind: 'unvisited',
            reason: 'nonlinear-pair-budget-exhausted'
          })
          continue
        }
        work.pairIntervals++
        const a = sources[record.first],
          b = sources[record.second]
        const margin = (() => {
          if (record.second < movingCount || b.semantic) {
            return 0
          }
          if (demand.configuration.clearanceMargin.kind === 'bounded') {
            return demand.configuration.clearanceMargin.metres
          }
          return 0
        })()
        try {
          const av = vertexProduct(record.first),
            bv = vertexProduct(record.second)
          if (
            strict(
              sourceRelationValue(nodeBoxes.get(record.first)),
              sourceRelationValue(nodeBoxes.get(record.second)),
              margin
            )
          ) {
            record.proofs.push({
              parameter: task.parameter,
              kind: 'strictBounds'
            })
            continue
          }
          const fixed = fixedRelation(index, margin, phase)
          if (fixed) {
            record.proofs.push({ parameter: task.parameter, ...fixed })
            if (fixed.kind === 'blocked') record.kind = 'blocked'
            continue
          }
          const ground = groundCandidate(a, b, bound)
          if (ground) {
            record.proofs.push({
              parameter: task.parameter,
              kind: 'unknown',
              reason: 'ground-contact-coverage-required',
              ground
            })
            continue
          }
          const ap = placement(record.first),
            bp = placement(record.second)
          if (
            b.semantic &&
            evaluator.rationalVertexInBounds(
              ap,
              sourceRelationValue(node),
              b.semantic.bounds
            )
          ) {
            record.kind = 'blocked'
            record.proofs.push({
              parameter: task.parameter,
              kind: 'blocked',
              witness: midpoint,
              reason: b.semantic.kind + '-hard-exclusion-intersection'
            })
            continue
          }
          if (
            a.part &&
            ap.region.certified &&
            b.region.kind === 'sheet' &&
            !b.semantic
          ) {
            const surface = evaluator.relateRationalSheetRegion({
              solid: { placement: ap, indices: sourceIndices(a), vertices: av },
              sheet: { placement: bp, indices: sourceIndices(b), vertices: bv },
              node: sourceRelationValue(node),
              parameter: task.parameter,
              margin
            })
            work.sheetTriangleRequired += surface.work.required
            work.sheetTriangleIntervals += surface.work.visited
            work.sheetTriangleUnvisited += surface.work.unvisited
            work.projectionVertices += surface.work.projectionVertices
            if (surface.kind === 'pending') pending.push(index)
            else if (surface.kind === 'separated')
              record.proofs.push({
                parameter: task.parameter,
                kind: 'exactSeparated'
              })
            else {
              if (surface.kind === 'blocked') record.kind = 'blocked'
              record.proofs.push({
                parameter: task.parameter,
                kind: surface.kind,
                ...(surface.kind === 'blocked' ? { witness: midpoint } : {}),
                ...(surface.triangleOffset === undefined
                  ? {}
                  : {
                      sheetTriangle: {
                        inventoryIndex: record.second,
                        triangleOffset: surface.triangleOffset
                      }
                    }),
                reason:
                  surface.kind === 'blocked'
                    ? 'source-sheet-surface-intersection'
                    : 'nonlinear-sheet-triangle-unproved'
              })
            }
            continue
          }
          const relation = evaluator.relateRational(
            ap,
            bp,
            sourceRelationValue(node),
            0
          )
          if (
            relation.kind === 'volume-overlap' ||
            (b.semantic && relation.kind === 'boundary')
          ) {
            record.kind = 'blocked'
            record.proofs.push({
              parameter: task.parameter,
              kind: 'blocked',
              witness: midpoint,
              reason: b.semantic
                ? b.semantic.kind + '-hard-exclusion-intersection'
                : 'source-material-volume-overlap'
            })
            continue
          }
          if (
            relation.kind === 'separated' &&
            relation.axis &&
            axisGap(av, bv, relation.axis, margin)
          ) {
            record.proofs.push({
              parameter: task.parameter,
              kind: 'exactSeparated',
              axis: relation.axis
            })
            continue
          }
          if (!ap.region.certified || !bp.region.certified)
            record.proofs.push({
              parameter: task.parameter,
              kind: 'unknown',
              reason: 'nonlinear-open-or-uncertified-source'
            })
          else pending.push(index)
        } catch (error) {
          record.proofs.push({
            parameter: task.parameter,
            kind: 'unknown',
            reason:
              error instanceof Error
                ? error.message
                : 'nonlinear-exact-work-unavailable'
          })
        }
      }
      if (cursor) {
        covers.push(...cursor.finish())
        work.groupPairs += cursor.work.groupPairs
        work.leafPairs += cursor.work.leafPairs
      }
      if (pending.length) {
        if (
          work.subdivisions >= request.budget.maxSubdivisions ||
          work.phaseNodes + queue.length + 2 > request.budget.maxPhaseNodes
        ) {
          for (const index of pending)
            records[index].proofs.push({
              parameter: task.parameter,
              kind: 'unknown',
              reason: 'nonlinear-source-interval-unproved'
            })
        } else {
          work.subdivisions++
          queue.push(
            {
              parameter: Object.freeze({
                low: task.parameter.low,
                high: midpoint
              }),
              pending
            },
            {
              parameter: Object.freeze({
                low: midpoint,
                high: task.parameter.high
              }),
              pending
            }
          )
        }
      }
    }
    const counts = coverage()
    counts.candidate = candidate
    counts.coRigidOwner = coRigid
    counts.required = required
    for (const cover of covers) {
      if (cover.kind === 'leaf')
        throw new Error('Leaf duplicated in aggregate cover')
      counts[cover.kind] += cover.cardinality
    }
    for (const record of records) {
      const kinds = record.proofs.map((p) => p.kind)
      record.kind = (() => {
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
      counts[record.kind]++
      if (
        record.kind === 'blocked' ||
        record.kind === 'unknown' ||
        record.kind === 'unvisited'
      )
        for (const proof of record.proofs)
          if (proof.reason) reasons.add(proof.reason)
    }
    for (const key of Object.keys(overall) as (keyof RelationCoverage)[])
      overall[key] += counts[key]
    if (
      counts.required !==
      counts.strictBounds +
        counts.exactSeparated +
        counts.declaredBoundary +
        counts.blocked +
        counts.targetRefinement +
        counts.unknown +
        counts.unvisited
    )
      throw new Error('Nonlinear region cover partition mismatch')
    const wholeBound = phaseCover.find((c) => c.phase === phase)?.bounds
    phases.push({
      phase,
      pairs: records,
      covers: covers.map((cover) => ({
        ...cover,
        parameter: allParameter,
        ...(wholeBound ? { bounds: wholeBound } : {})
      }))
    })
  }
  if (phaseCover.length !== 2) reasons.add('nonlinear-phase-cover-incomplete')
  if (demand.configuration.clearanceMargin.kind !== 'bounded')
    reasons.add('clearance-margin-unknown')
  if (demand.status !== 'ready') reasons.add('scene-demand-not-ready')
  return freeze({
    format: 'walking-nonlinear-source-relations/1',
    request,
    source,
    cycle,
    demand,
    inventory: sources,
    footExtrusions,
    movingCount,
    phaseCover,
    phases,
    coverage: overall,
    status: (() => {
      if (overall.blocked) {
        return 'blocked' as const
      }
      if (overall.unknown || overall.unvisited || reasons.size) {
        return 'unknown' as const
      }
      return 'clear' as const
    })(),
    reasons: [...reasons],
    work: { ...work, kernel: evaluator.work }
  })
}
