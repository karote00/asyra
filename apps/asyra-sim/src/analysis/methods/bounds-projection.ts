import { ineg, type Interval } from '../../domain/interval'
import {
  intervalAlgebra,
  poseOperations,
  type AlgebraPose,
  type Vector
} from '../../domain/kinematic-algebra'
import type { Vec3 } from '../../domain/math'

const ops = poseOperations(intervalAlgebra)

/** Enclose the complete local box along one fixed world direction. */
export function projectBounds(
  bounds: Vector<Interval>,
  pose: AlgebraPose<Interval>,
  direction: Vec3
): Interval {
  const q = pose.rotation,
    d = ops.vector(direction)
  const local = ops.rotate([ineg(q[0]), ineg(q[1]), ineg(q[2]), q[3]], d)
  return intervalAlgebra.add(ops.dot(pose.position, d), ops.dot(bounds, local))
}
