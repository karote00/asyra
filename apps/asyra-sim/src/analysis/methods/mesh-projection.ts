import {
  idiv,
  imid,
  interval,
  isub,
  type Interval
} from '../../domain/interval'
import {
  intervalAlgebra,
  poseOperations,
  type AlgebraPose
} from '../../domain/kinematic-algebra'
import type { Vec3 } from '../../domain/math'
import type { Bounds } from './mesh-index'
import { projectBounds } from './bounds-projection'

const ops = poseOperations(intervalAlgebra)

/** Complete source-bound rejection only; no contact, witness or retained poses. */
export function projectedBoundsGap(
  a: Bounds,
  aPose: AlgebraPose<Interval>,
  b: Bounds,
  bPose: AlgebraPose<Interval>,
  threshold: number,
  checkpoint: () => void
): number {
  let lower = 0
  for (const pose of [aPose, bPose])
    for (const axis of [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ] as const) {
      // Any fixed nonzero direction can certify separation. Its proposal need not
      // be an exact rotating axis; every projection below encloses the full pose.
      const direction = ops
        .rotate(pose.rotation, ops.vector(axis))
        .map(imid) as unknown as Vec3
      // Cardinal proposals repeat the world-axis certificate already tried by
      // the caller; they do not perform a new projection query.
      if (direction.filter((value) => value !== 0).length < 2) continue
      checkpoint()
      const norm = ops.norm(ops.vector(direction))
      if (norm[0] <= 0) continue
      const pa = projectBounds(a, aPose, direction),
        pb = projectBounds(b, bPose, direction)
      lower = Math.max(
        lower,
        idiv(isub(interval(pb[0]), interval(pa[1])), norm)[0],
        idiv(isub(interval(pa[0]), interval(pb[1])), norm)[0]
      )
      if (lower > threshold) return lower
    }
  // An unsuccessful rejection attempt must not strengthen unrelated evidence
  // or trigger new containment/temporal work downstream.
  return 0
}
