import { ineg, type Interval } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { Vec3 } from '../../../domain/math'
import type { Bounds } from '../mesh-index'
import type { ConvexShape } from '../convex-query'
const ops = poseOperations(intervalAlgebra)
// Test-owned feasibility probe only. Project the complete source bounding box,
// not source vertices selected to favor a result. This cannot provide a contact
// witness or prove penetration; nonpositive gaps have no geometric conclusion.
export function projection(
  bounds: Bounds,
  pose: ConvexShape['pose'],
  direction: Vec3
): Interval {
  const q = pose.rotation
  const d = ops.vector(direction)
  const local = ops.rotate([ineg(q[0]), ineg(q[1]), ineg(q[2]), q[3]], d)
  return intervalAlgebra.add(ops.dot(pose.position, d), ops.dot(bounds, local))
}

/** Passive full-source support enclosure; never hull collision or an upper witness. */
export function vertexProjection(
  shape: ConvexShape,
  direction: Vec3,
  checkpoint: () => void
): Interval {
  if (shape.geometry.kind !== 'mesh')
    throw new Error('Expected complete original mesh')
  const q = shape.pose.rotation,
    d = ops.vector(direction)
  const local = ops.rotate([ineg(q[0]), ineg(q[1]), ineg(q[2]), q[3]], d)
  const translation = ops.dot(shape.pose.position, d)
  let lo = Infinity,
    hi = -Infinity
  for (let offset = 0; offset < shape.geometry.positions.length; offset += 3) {
    checkpoint()
    const p = shape.geometry.positions
    const value = intervalAlgebra.add(
      translation,
      ops.dot(ops.vector([p[offset], p[offset + 1], p[offset + 2]]), local)
    )
    lo = Math.min(lo, value[0])
    hi = Math.max(hi, value[1])
  }
  return [lo, hi]
}
