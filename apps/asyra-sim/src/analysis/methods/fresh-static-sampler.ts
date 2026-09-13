import { intervalAlgebra, poseOperations } from '../../domain/kinematic-algebra'
import type { Interval } from '../../domain/interval'
import type { ConvexShape, DistanceEvidence } from './convex-query'
import { localPoint } from './mesh-index'

export interface StaticSampleOrigin {
  node: object
  segment: number
  start: number
  end: number
  time: number
  capture: boolean
  originalRoot?: boolean
}
export interface StaticSample {
  evidence: DistanceEvidence
  source?: unknown
  exhausted?: boolean
}
export type StaticSampler = ((
  a: ConvexShape,
  b: ConvexShape,
  origin: StaticSampleOrigin,
  source?: unknown
) => StaticSample | null) & {
  publishBoundary?: (source: unknown) => unknown | null
}
export interface SourceUpper {
  a: DistanceEvidence['witnessA']
  b: DistanceEvidence['witnessB']
  upper: number
}
const ops = poseOperations(intervalAlgebra)
const finiteInterval = (value: Interval) =>
  Number.isFinite(value[0]) && Number.isFinite(value[1]) && value[0] <= value[1]
const immutableMesh = (shape: ConvexShape) =>
  shape.geometry.kind === 'mesh' &&
  Object.isFrozen(shape.geometry) &&
  Object.isFrozen(shape.geometry.positions) &&
  Object.isFrozen(shape.geometry.indices)
const copyInterval = (value: Interval): Interval =>
  Object.freeze([value[0], value[1]])
function copyShape(shape: ConvexShape): ConvexShape {
  return Object.freeze({
    geometry: shape.geometry,
    pose: Object.freeze({
      position: Object.freeze(
        shape.pose.position.map(copyInterval)
      ) as ConvexShape['pose']['position'],
      rotation: Object.freeze(
        shape.pose.rotation.map(copyInterval)
      ) as ConvexShape['pose']['rotation']
    })
  })
}
/** Unexported runtime brand; only a sampler's completed solve can mint a source. */
class FreshSource {
  #scope: object
  constructor(
    scope: object,
    readonly origin: Readonly<StaticSampleOrigin>,
    readonly shapes: readonly [ConvexShape, ConvexShape],
    readonly a: DistanceEvidence['witnessA'],
    readonly b: DistanceEvidence['witnessB'],
    readonly boundary = false
  ) {
    this.#scope = scope
    Object.freeze(this)
  }
  static belongs(value: unknown, scope: object): value is FreshSource {
    return (
      typeof value === 'object' &&
      value !== null &&
      #scope in value &&
      value.#scope === scope
    )
  }
}

/** The caller supplies canonical domain static poses, never arbitrary evidence. */
export function createFreshStaticSampler(
  threshold: number,
  tick: () => void,
  solve: (
    a: ConvexShape,
    b: ConvexShape,
    seed?: SourceUpper
  ) => DistanceEvidence,
  exhausted: (error: unknown) => boolean
): StaticSampler {
  const scope = {}
  const sample: StaticSampler = (a, b, origin, previous) => {
    let evidence: DistanceEvidence | undefined
    try {
      let seed: SourceUpper | undefined
      if (previous !== undefined) {
        tick()
        if (
          FreshSource.belongs(previous, scope) &&
          (previous.boundary
            ? origin.originalRoot === true &&
              previous.origin.originalRoot === true &&
              previous.origin.segment === origin.segment + 1 &&
              previous.origin.time === previous.origin.start &&
              previous.origin.start === origin.end &&
              origin.time === origin.start &&
              origin.start < origin.end
            : previous.origin.node === origin.node &&
              previous.origin.segment === origin.segment &&
              previous.origin.start === origin.start &&
              previous.origin.end === origin.end &&
              previous.origin.time >= origin.start &&
              previous.origin.time <= origin.time &&
              origin.time <= origin.end) &&
          previous.shapes[0].geometry === a.geometry &&
          previous.shapes[1].geometry === b.geometry &&
          immutableMesh(a) &&
          immutableMesh(b)
        ) {
          tick()
          const localA = localPoint(previous.shapes[0].pose, previous.a)
          tick()
          const localB = localPoint(previous.shapes[1].pose, previous.b)
          tick()
          const wa = ops.add(
            a.pose.position,
            ops.rotate(a.pose.rotation, localA)
          )
          tick()
          const wb = ops.add(
            b.pose.position,
            ops.rotate(b.pose.rotation, localB)
          )
          tick()
          const upper = ops.norm(ops.sub(wa, wb))[1]
          if (Number.isFinite(upper)) seed = { a: wa, b: wb, upper }
        }
      }
      evidence = solve(a, b, seed)
      if (
        origin.capture &&
        origin.start < origin.end &&
        origin.time >= origin.start &&
        origin.time < origin.end &&
        immutableMesh(a) &&
        immutableMesh(b) &&
        !evidence.penetration &&
        evidence.lower > 0 &&
        Number.isFinite(evidence.lower) &&
        Number.isFinite(evidence.upper) &&
        evidence.lower <= evidence.upper &&
        evidence.upper < threshold &&
        [
          ...evidence.witnessA,
          ...evidence.witnessB,
          ...a.pose.position,
          ...a.pose.rotation,
          ...b.pose.position,
          ...b.pose.rotation
        ].every(finiteInterval)
      ) {
        tick()
        const source = new FreshSource(
          scope,
          Object.freeze({ ...origin }),
          Object.freeze([copyShape(a), copyShape(b)]),
          Object.freeze(
            evidence.witnessA.map(copyInterval)
          ) as DistanceEvidence['witnessA'],
          Object.freeze(
            evidence.witnessB.map(copyInterval)
          ) as DistanceEvidence['witnessB']
        )
        return { evidence, source }
      }
      return { evidence }
    } catch (error) {
      if (!exhausted(error)) throw error
      return evidence ? { evidence, exhausted: true } : null
    }
  }
  sample.publishBoundary = (source) => {
    try {
      tick()
      if (
        !FreshSource.belongs(source, scope) ||
        source.boundary ||
        source.origin.originalRoot !== true ||
        source.origin.time !== source.origin.start ||
        source.origin.start >= source.origin.end
      )
        return undefined
      return new FreshSource(
        scope,
        source.origin,
        source.shapes,
        source.a,
        source.b,
        true
      )
    } catch (error) {
      if (!exhausted(error)) throw error
      return null
    }
  }
  return sample
}
