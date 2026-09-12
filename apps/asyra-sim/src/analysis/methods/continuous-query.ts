import { interval, type Interval } from '../../domain/interval'
import {
  evaluateKinematics,
  evaluatePairKinematics,
  interpolateSegment,
  intervalAlgebra,
  poseOperations
} from '../../domain/kinematic-algebra'
import type { Trajectory, Workcell } from '../../domain/workcell'
import { EXPERIMENT_RESOURCE_PROFILE } from '../contracts'
import {
  convexDistance,
  separationLowerBound,
  type ConvexShape,
  type DistanceEvidence
} from './convex-query'
import type { StaticSampler } from './fresh-static-sampler'

export interface ColliderReference {
  bodyId: string
  colliderId: string
}
export interface PairQuery {
  workcell: Workcell
  trajectory: Trajectory
  a: ColliderReference
  b: ColliderReference
  interval: readonly [number, number]
}
export interface QuerySettings {
  threshold: number
  distanceTolerance: number
  timeTolerance: number
  maxIntervals: number
  maxIterations: number
  maxEvidenceLeaves?: number
}
export interface IntervalEvidence {
  start: number
  end: number
  lower: number
  upper: number | null
  witnessTime: number | null
  penetration: boolean
  state: 'clear' | 'finding' | 'unresolved'
  reason: string
}
export interface PairEvidence {
  leaves: readonly IntervalEvidence[]
  lower: number
  upper: number | null
  coverage: 'complete' | 'partial'
  evaluations: number
}
export interface PairQueryKernel {
  sample?: StaticSampler
  relativeFrames?: boolean
  certifyClearBeforeResampling?: boolean
  /** Charge and checkpoint one completed pending-node evidence handoff. */
  handoffEvidence?: () => boolean
  /** Only this actual route's lower certificate ignores positive witness metadata. */
  lowerUsesPositiveWitnessOnly?: (a: ConvexShape, b: ConvexShape) => boolean
  /** Called only for this node's consumed in-interval upper <= threshold. */
  deriveZeroLower?: (a: ConvexShape, b: ConvexShape) => 0 | null | undefined
  distance(a: ConvexShape, b: ConvexShape): DistanceEvidence | null
  lower(
    a: ConvexShape,
    b: ConvexShape,
    witness: DistanceEvidence
  ): number | null
  exhaustionReason: string
}
const ops = poseOperations(intervalAlgebra)

function shapesAt(
  query: PairQuery,
  segment: number,
  time: Interval,
  relativeFrames = false
): readonly [ConvexShape, ConvexShape] {
  const values = interpolateSegment(
    query.trajectory,
    segment,
    time,
    intervalAlgebra
  )
  const pairPoses = relativeFrames
    ? evaluatePairKinematics(
        query.workcell,
        values,
        query.a.bodyId,
        query.b.bodyId,
        intervalAlgebra
      )
    : null
  const poses = pairPoses
    ? new Map([
        [query.a.bodyId, pairPoses[0]],
        [query.b.bodyId, pairPoses[1]]
      ])
    : evaluateKinematics(query.workcell, values, intervalAlgebra)
  const shape = (reference: ColliderReference): ConvexShape => {
    const body = query.workcell.bodies.find(
      (body) => body.id === reference.bodyId
    )
    const collider = body?.colliders.find(
        (collider) => collider.id === reference.colliderId
      ),
      pose = poses.get(reference.bodyId)
    if (!collider || !pose)
      throw new Error('Missing canonical collider in pair snapshot')
    return {
      geometry: collider.geometry,
      pose: ops.compose(pose, ops.fromPose(collider.pose))
    }
  }
  return [shape(query.a), shape(query.b)]
}

function checkSettings(settings: QuerySettings): void {
  if (
    !Number.isFinite(settings.threshold) ||
    settings.threshold < 0 ||
    settings.threshold > 20 ||
    !Number.isFinite(settings.distanceTolerance) ||
    settings.distanceTolerance < 1e-9 ||
    settings.distanceTolerance > 1 ||
    !Number.isFinite(settings.timeTolerance) ||
    settings.timeTolerance < 1e-9 ||
    settings.timeTolerance > 1 ||
    !Number.isInteger(settings.maxIntervals) ||
    settings.maxIntervals < 1 ||
    settings.maxIntervals > EXPERIMENT_RESOURCE_PROFILE.maxIntervals ||
    (settings.maxEvidenceLeaves !== undefined &&
      (!Number.isInteger(settings.maxEvidenceLeaves) ||
        settings.maxEvidenceLeaves < 1 ||
        settings.maxEvidenceLeaves >
          EXPERIMENT_RESOURCE_PROFILE.maxEvidenceLeaves)) ||
    !Number.isInteger(settings.maxIterations) ||
    settings.maxIterations < 1 ||
    settings.maxIterations > 256
  )
    throw new Error('Unsupported method settings')
}

export function queryContinuousPair(
  query: PairQuery,
  settings: QuerySettings,
  checkpoint: () => void = () => undefined,
  kernel?: PairQueryKernel
): PairEvidence {
  checkSettings(settings)
  const maxLeaves =
    settings.maxEvidenceLeaves ?? EXPERIMENT_RESOURCE_PROFILE.maxEvidenceLeaves
  const [start, end] = query.interval,
    frames = query.trajectory.keyframes
  const first = frames[0],
    last = frames.at(-1)
  if (
    !first ||
    !last ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start > end ||
    start < first.time ||
    end > last.time
  )
    throw new Error('Analysis interval is not covered by the trajectory')
  if (query.a.bodyId === query.b.bodyId)
    throw new Error('Same-body shapes are not analysis pairs')
  interface Node {
    start: number
    end: number
    segment: number
    startEvidence?: DistanceEvidence
    endEvidence?: DistanceEvidence
  }
  const pending: Node[] = [],
    leaves: IntervalEvidence[] = []
  if (start === end) {
    const found = frames.findIndex((frame) => frame.time > start)
    pending.push({
      start,
      end,
      segment: found < 0 ? frames.length - 1 : Math.max(0, found - 1)
    })
  } else
    for (let segment = 0; segment < frames.length - 1; segment++) {
      const a = Math.max(start, frames[segment].time),
        b = Math.min(end, frames[segment + 1].time)
      if (a < b) pending.push({ start: a, end: b, segment })
    }
  if (pending.length > maxLeaves)
    return {
      leaves: [
        {
          start,
          end,
          lower: 0,
          upper: null,
          witnessTime: null,
          penetration: false,
          state: 'unresolved',
          reason:
            'The retained evidence budget cannot cover the initial trajectory segments.'
        }
      ],
      lower: 0,
      upper: null,
      coverage: 'partial',
      evaluations: 0
    }
  let evaluations = 0
  let kernelExhausted = false
  traversal: while (pending.length && evaluations < settings.maxIntervals) {
    checkpoint()
    const node = pending.pop()
    if (!node) break
    const middle = node.start + (node.end - node.start) / 2
    let startEvidence = node.startEvidence,
      middleEvidence: DistanceEvidence | undefined,
      endEvidence = node.endEvidence
    let completedLower: number | undefined
    let certifiedLower: number | null = null
    let witness: DistanceEvidence | null = null,
      witnessTime = middle
    const intervalLower = (
      a: ConvexShape,
      b: ConvexShape,
      completedWitness: DistanceEvidence,
      time: number
    ): number | null => {
      if (
        completedWitness.upper <= settings.threshold &&
        time >= node.start &&
        time <= node.end
      ) {
        const derived = kernel?.deriveZeroLower?.(a, b)
        if (derived !== undefined) return derived
      }
      return kernel
        ? kernel.lower(a, b, completedWitness)
        : separationLowerBound(a, b, completedWitness.axis)
    }
    // Endpoints matter for both minima and keyframe contacts. They are evidence,
    // never a substitute for the interval-wide separating certificate below.
    const sampleTimes = [...new Set([node.start, middle, node.end])]
    let source: unknown
    for (const [sampleIndex, time] of sampleTimes.entries()) {
      checkpoint()
      let inherited: DistanceEvidence | undefined
      if (time === node.start) inherited = node.startEvidence
      else if (time === node.end) inherited = node.endEvidence
      let result: DistanceEvidence | null
      let sampleExhausted = false
      if (inherited && kernel?.handoffEvidence) {
        result = kernel.handoffEvidence() ? inherited : null
        source = undefined
      } else {
        const [a, b] = shapesAt(
          query,
          node.segment,
          interval(time),
          kernel?.relativeFrames
        )
        if (kernel?.sample) {
          const next = sampleTimes[sampleIndex + 1]
          const capture =
            next !== undefined &&
            !(next === node.end && node.endEvidence && kernel.handoffEvidence)
          const sampled = kernel.sample(
            a,
            b,
            {
              node,
              segment: node.segment,
              start: node.start,
              end: node.end,
              time,
              capture: Boolean(capture)
            },
            source
          )
          result = sampled?.evidence ?? null
          source = sampled?.source
          sampleExhausted = sampled?.exhausted === true
        } else
          result = kernel
            ? kernel.distance(a, b)
            : convexDistance(
                a,
                b,
                settings.distanceTolerance,
                settings.maxIterations
              )
      }
      if (!result) {
        kernelExhausted = true
        if (witness) break
        pending.push(node)
        break traversal
      }
      if (time === node.start) startEvidence = result
      if (time === middle) middleEvidence = result
      if (time === node.end) endEvidence = result
      if (!witness || result.upper < witness.upper || result.penetration) {
        witness = result
        witnessTime = time
      }
      if (sampleExhausted) {
        kernelExhausted = true
        break
      }
      if (result.penetration) break
      if (
        kernel?.certifyClearBeforeResampling &&
        time === node.start &&
        node.start !== node.end &&
        witness.upper >= settings.threshold
      ) {
        const [intervalA, intervalB] = shapesAt(
          query,
          node.segment,
          interval(node.start, node.end),
          kernel.relativeFrames
        )
        const candidate = intervalLower(
          intervalA,
          intervalB,
          witness,
          witnessTime
        )
        if (candidate === null) {
          kernelExhausted = true
          break
        }
        if (
          kernel.handoffEvidence &&
          witness.lower > 0 &&
          kernel.lowerUsesPositiveWitnessOnly?.(intervalA, intervalB)
        )
          completedLower = candidate
        if (candidate > witness.upper)
          throw new Error('Inconsistent continuous distance certificates')
        if (candidate > settings.threshold) {
          certifiedLower = candidate
          break
        }
      }
    }
    if (!witness) throw new Error('No witness evaluation')
    evaluations++
    let lower: number | null = certifiedLower ?? witness.lower
    if (kernelExhausted) lower = null
    else if (
      certifiedLower === null &&
      node.start !== node.end &&
      completedLower !== undefined &&
      witness.lower > 0 &&
      kernel?.handoffEvidence
    )
      lower = kernel.handoffEvidence() ? completedLower : null
    else if (certifiedLower === null && node.start !== node.end) {
      const [a, b] = shapesAt(
        query,
        node.segment,
        interval(node.start, node.end),
        kernel?.relativeFrames
      )
      lower = intervalLower(a, b, witness, witnessTime)
    }
    if (lower === null) {
      kernelExhausted = true
      // Preserve an established static witness even when no interval-wide
      // certificate can be computed. Zero cannot establish clearance.
      lower = 0
    }
    if (lower > witness.upper)
      throw new Error('Inconsistent continuous distance certificates')
    const base = {
      start: node.start,
      end: node.end,
      lower,
      upper: witness.upper,
      witnessTime,
      penetration: witness.penetration
    }
    if (witness.penetration || witness.upper < settings.threshold)
      leaves.push({
        ...base,
        state: 'finding',
        reason:
          'An observed witness establishes an issue; this is not an enumeration of every contact.'
      })
    else if (lower > settings.threshold)
      leaves.push({
        ...base,
        state: 'clear',
        reason: 'A conservative support gap covers this complete interval.'
      })
    else if (kernelExhausted && kernel)
      leaves.push({
        ...base,
        state: 'unresolved',
        reason: kernel.exhaustionReason
      })
    else if (
      node.end - node.start <= settings.timeTolerance ||
      middle === node.start ||
      middle === node.end
    )
      leaves.push({
        ...base,
        state: 'unresolved',
        reason: 'Threshold uncertainty remains at the declared time resolution.'
      })
    else if (leaves.length + pending.length + 2 > maxLeaves)
      leaves.push({
        ...base,
        state: 'unresolved',
        reason:
          'The retained evidence budget prevents further interval subdivision.'
      })
    else
      pending.push(
        {
          start: node.start,
          end: middle,
          segment: node.segment,
          ...(kernel?.handoffEvidence
            ? { startEvidence, endEvidence: middleEvidence }
            : {})
        },
        {
          start: middle,
          end: node.end,
          segment: node.segment,
          ...(kernel?.handoffEvidence
            ? { startEvidence: middleEvidence, endEvidence }
            : {})
        }
      )
    if (kernelExhausted) break
  }
  for (const node of pending)
    leaves.push({
      start: node.start,
      end: node.end,
      lower: 0,
      upper: null,
      witnessTime: null,
      penetration: false,
      state: 'unresolved',
      reason:
        kernelExhausted && kernel
          ? kernel.exhaustionReason
          : 'Interval budget exhausted before this leaf was resolved.'
    })
  leaves.sort((a, b) => a.start - b.start)
  if (!leaves.length) throw new Error('No valid analysis interval')
  const upper = leaves.reduce<number | null>(
    (best, leaf) =>
      leaf.upper === null ? best : Math.min(best ?? Infinity, leaf.upper),
    null
  )
  return {
    leaves,
    lower: leaves.reduce(
      (lower, leaf) => Math.min(lower, leaf.lower),
      Infinity
    ),
    upper,
    coverage: leaves.some((leaf) => leaf.state === 'unresolved')
      ? 'partial'
      : 'complete',
    evaluations
  }
}
