import {
  intervalAlgebra,
  poseOperations,
  type Vector
} from '../../domain/kinematic-algebra'
import type { Interval } from '../../domain/interval'
import type { MeshGeometry } from '../../domain/part-geometry'
import { EXPERIMENT_RESOURCE_PROFILE } from '../contracts'
import {
  convexDistance,
  type ConvexShape,
  type DistanceEvidence
} from './convex-query'
import {
  boundsGap,
  buildMeshIndex,
  shapeBounds,
  worldBounds,
  worldPoint,
  type Bounds,
  type MeshIndex,
  type PreparedMeshIndex,
  type MeshNode
} from './mesh-index'
import { projectedBoundsGap } from './mesh-projection'
import { shapeMembership } from './mesh-membership'

const ops = poseOperations(intervalAlgebra)
export class MeshWorkLimit extends Error {}

/** Deterministic dual-tree descent; bounds select work, never replace geometry. */
function splitLeft(
  a: MeshNode | undefined,
  b: MeshNode | undefined,
  ab: Bounds,
  bb: Bounds
): boolean {
  if (!a?.children) return false
  if (!b?.children) return true
  const width = (bounds: Bounds) =>
    Math.max(...bounds.map((axis) => axis[1] - axis[0]))
  return width(ab) >= width(bb)
}

/** One execution-owned query context. No renderer, document mutation or global state. */
export class OriginalMeshQuery {
  work = 0
  private readonly indices = new WeakMap<MeshGeometry, MeshIndex>()
  constructor(
    private readonly checkpoint: () => void = () => undefined,
    private readonly maxWork: number = EXPERIMENT_RESOURCE_PROFILE.maxWorkUnits,
    private readonly hierarchy = true,
    private readonly prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>()
  ) {}

  private tick = (units = 1) => {
    this.checkpoint()
    this.work += units
    if (this.work > this.maxWork)
      throw new MeshWorkLimit('The original-triangle work budget was exhausted')
  }
  private index(shape: ConvexShape): MeshIndex | undefined {
    const geometry = shape.geometry
    if (geometry.kind !== 'mesh') return undefined
    const immutable =
      Object.isFrozen(geometry) &&
      Object.isFrozen(geometry.positions) &&
      Object.isFrozen(geometry.indices)
    if (immutable) {
      const retained = this.indices.get(geometry)
      if (retained) return retained
    }
    const prepared = immutable ? this.prepared.get(geometry) : undefined
    if (prepared && prepared.hierarchy === this.hierarchy) {
      // Charge the same logical preparation budget, using this invocation's deadline.
      this.tick(prepared.work)
      this.indices.set(geometry, prepared.index)
      return prepared.index
    }
    const before = this.work
    const index = buildMeshIndex(geometry, this.tick, this.hierarchy)
    if (immutable)
      this.prepared.set(geometry, {
        index,
        work: this.work - before,
        hierarchy: this.hierarchy
      })
    if (immutable) this.indices.set(geometry, index)
    return index
  }
  private projectGap(
    a: ConvexShape,
    b: ConvexShape,
    ab: Bounds | undefined,
    bb: Bounds | undefined,
    gap: number,
    threshold: number
  ): number {
    if (gap > threshold || !ab || !bb) return gap
    return Math.max(
      gap,
      projectedBoundsGap(ab, a.pose, bb, b.pose, threshold, this.tick)
    )
  }
  private witness(shape: ConvexShape, index?: MeshIndex): Vector<Interval> {
    return index
      ? worldPoint(shape.pose, index.representatives[0])
      : shape.pose.position
  }
  distance(
    a: ConvexShape,
    b: ConvexShape,
    threshold: number,
    tolerance: number,
    iterations: number
  ): DistanceEvidence {
    if (a.geometry.kind !== 'mesh' && b.geometry.kind !== 'mesh')
      return convexDistance(a, b, tolerance, iterations)
    this.tick()
    const ai = this.index(a),
      bi = this.index(b)
    const wa = this.witness(a, ai),
      wb = this.witness(b, bi)
    let result: DistanceEvidence = {
      lower: 0,
      upper: ops.norm(ops.sub(wa, wb))[1],
      penetration: false,
      converged: false,
      iterations: 0,
      axis: [1, 0, 0],
      witnessA: wa,
      witnessB: wb
    }
    const gap = this.projectGap(
      a,
      b,
      ai?.root.bounds,
      bi?.root.bounds,
      boundsGap(shapeBounds(a, ai), shapeBounds(b, bi)),
      threshold
    )
    if (gap > threshold) return { ...result, lower: gap }
    let unknown = false
    for (const [from, fi, to, ti] of [
      [a, ai, b, bi],
      [b, bi, a, ai]
    ] as const) {
      const points = fi
        ? fi.representatives.map((point) => worldPoint(from.pose, point))
        : [from.pose.position]
      for (const point of points) {
        this.tick()
        const membership = shapeMembership(point, to, ti, this.tick)
        if (membership === 'inside')
          return {
            ...result,
            upper: 0,
            penetration: true,
            converged: true,
            witnessA: point,
            witnessB: point
          }
        unknown ||= membership === 'unknown'
      }
    }
    const pending: [MeshNode | undefined, MeshNode | undefined][] = [
      [ai?.root, bi?.root]
    ]
    let lower = Infinity
    let searchThreshold = result.upper < threshold ? 0 : threshold
    while (pending.length) {
      this.tick()
      const pair = pending.pop()
      if (!pair) throw new Error('Missing pending mesh pair')
      const [an, bn] = pair
      const ab = an ? worldBounds(an.bounds, a.pose) : shapeBounds(a)
      const bb = bn ? worldBounds(bn.bounds, b.pose) : shapeBounds(b)
      const bound = this.projectGap(
        a,
        b,
        an?.bounds,
        bn?.bounds,
        boundsGap(ab, bb),
        searchThreshold
      )
      if (bound > searchThreshold) {
        lower = Math.min(lower, bound)
        continue
      }
      if (an?.children && splitLeft(an, bn, ab, bb)) {
        for (const child of an.children) pending.push([child, bn])
        continue
      }
      if (bn?.children) {
        for (const child of bn.children) pending.push([an, child])
        continue
      }
      for (const at of an?.triangles ?? [undefined])
        for (const bt of bn?.triangles ?? [undefined]) {
          this.tick()
          const ab = at ? worldBounds(at.bounds, a.pose) : shapeBounds(a),
            bb = bt ? worldBounds(bt.bounds, b.pose) : shapeBounds(b)
          const triangleGap = this.projectGap(
            a,
            b,
            at?.bounds,
            bt?.bounds,
            boundsGap(ab, bb),
            searchThreshold
          )
          if (triangleGap > searchThreshold) {
            lower = Math.min(lower, triangleGap)
            continue
          }
          const sa: ConvexShape = at
            ? {
                geometry: { kind: 'triangle', vertices: at.vertices },
                pose: a.pose
              }
            : a
          const sb: ConvexShape = bt
            ? {
                geometry: { kind: 'triangle', vertices: bt.vertices },
                pose: b.pose
              }
            : b
          const evidence = convexDistance(sa, sb, tolerance, iterations)
          lower = Math.min(lower, evidence.lower)
          if (evidence.penetration || evidence.upper < result.upper)
            result = evidence
          // A warning witness settles the clearance question, not penetration.
          // Continue all possibly intersecting regions; positively separated
          // regions cannot change that remaining classification. Keep the
          // witnessed upper bound rather than recomputing an optional minimum.
          if (result.upper < threshold) searchThreshold = 0
          if (result.penetration) return { ...result, lower: 0 }
        }
    }
    if (lower > result.upper)
      throw new Error('Inconsistent original mesh distance certificates')
    return {
      ...result,
      lower: unknown ? 0 : lower,
      converged: !unknown && result.upper - lower <= tolerance
    }
  }

  /** A positive surface gap plus an outside static witness excludes containment
   * throughout a connected time interval: entering requires a surface crossing. */
  lowerOver(
    a: ConvexShape,
    b: ConvexShape,
    threshold: number,
    witness: DistanceEvidence,
    tolerance = 1e-6,
    iterations = 48
  ): number {
    this.tick()
    const ai = this.index(a),
      bi = this.index(b)
    if (!ai && !bi)
      throw new Error('Native interval queries use their analytical kernel')
    const overall = this.projectGap(
      a,
      b,
      ai?.root.bounds,
      bi?.root.bounds,
      boundsGap(shapeBounds(a, ai), shapeBounds(b, bi)),
      threshold
    )
    if (overall > threshold) return overall
    if (witness.lower <= 0) return 0
    const pending: [MeshNode | undefined, MeshNode | undefined][] = [
      [ai?.root, bi?.root]
    ]
    let lower = Infinity
    while (pending.length) {
      this.tick()
      const pair = pending.pop()
      if (!pair) throw new Error('Missing pending mesh pair')
      const [an, bn] = pair
      const ab = an ? worldBounds(an.bounds, a.pose) : shapeBounds(a)
      const bb = bn ? worldBounds(bn.bounds, b.pose) : shapeBounds(b)
      const gap = this.projectGap(
        a,
        b,
        an?.bounds,
        bn?.bounds,
        boundsGap(ab, bb),
        threshold
      )
      if (gap > threshold) {
        lower = Math.min(lower, gap)
        continue
      }
      if (an?.children && splitLeft(an, bn, ab, bb)) {
        for (const child of an.children) pending.push([child, bn])
        continue
      }
      if (bn?.children) {
        for (const child of bn.children) pending.push([an, child])
        continue
      }
      for (const at of an?.triangles ?? [undefined])
        for (const bt of bn?.triangles ?? [undefined]) {
          this.tick()
          let gap = this.projectGap(
            a,
            b,
            at?.bounds,
            bt?.bounds,
            boundsGap(
              at ? worldBounds(at.bounds, a.pose) : shapeBounds(a),
              bt ? worldBounds(bt.bounds, b.pose) : shapeBounds(b)
            ),
            threshold
          )
          if (gap <= threshold) {
            // A box overlap is not a surface overlap. Search an axis, then use
            // the original triangle's outward support over the complete interval.
            const sa: ConvexShape = at
              ? {
                  geometry: { kind: 'triangle', vertices: at.vertices },
                  pose: a.pose
                }
              : a
            const sb: ConvexShape = bt
              ? {
                  geometry: { kind: 'triangle', vertices: bt.vertices },
                  pose: b.pose
                }
              : b
            gap = convexDistance(sa, sb, tolerance, iterations).lower
            if (gap <= threshold) return 0
          }
          lower = Math.min(lower, gap)
        }
    }
    return lower
  }
}
