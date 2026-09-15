import type { Point3 } from './greenhouse'
import {
  interval,
  add,
  subtract,
  multiply,
  type Interval
} from './scalar-arithmetic'
import { composeRigidTransform } from './walking-robot-kinematics'
import type { WalkingRigidTransform } from './walking-robot-definition'
import {
  freezeSource,
  type QuadrupedRobotSourceOwner,
  type QuadrupedRobotPart
} from './quadruped-robot-source'
import type { QuadrupedRobotPoseResult } from './quadruped-robot-kinematics'

interface Bounds {
  readonly min: Point3
  readonly max: Point3
}
interface Contributor {
  readonly part: QuadrupedRobotPart
  readonly kind: QuadrupedRobotPart['kind']
  readonly transform: WalkingRigidTransform
  readonly bounds: Bounds
}
export interface QuadrupedRobotEnvelope {
  readonly pose: QuadrupedRobotPoseResult
  readonly contributors: readonly Contributor[]
  readonly bounds: Bounds
  readonly fixedBodyWidth: number
}
function transformed(
  point: readonly Interval[],
  frame: WalkingRigidTransform
): Interval[] {
  const [x, y, z, w] = frame.rotation.map(interval),
    two = interval(2)
  const tx = multiply(
    two,
    subtract(multiply(y, point[2]), multiply(z, point[1]))
  )
  const ty = multiply(
    two,
    subtract(multiply(z, point[0]), multiply(x, point[2]))
  )
  const tz = multiply(
    two,
    subtract(multiply(x, point[1]), multiply(y, point[0]))
  )
  return [
    add(
      interval(frame.position[0]),
      add(
        point[0],
        add(multiply(w, tx), subtract(multiply(y, tz), multiply(z, ty)))
      )
    ),
    add(
      interval(frame.position[1]),
      add(
        point[1],
        add(multiply(w, ty), subtract(multiply(z, tx), multiply(x, tz)))
      )
    ),
    add(
      interval(frame.position[2]),
      add(
        point[2],
        add(multiply(w, tz), subtract(multiply(x, ty), multiply(y, tx)))
      )
    )
  ]
}
function union(bounds: readonly Bounds[]): Bounds {
  if (!bounds.length) throw new Error('Missing quadruped bounds')
  return {
    min: [
      Math.min(...bounds.map((item) => item.min[0])),
      Math.min(...bounds.map((item) => item.min[1])),
      Math.min(...bounds.map((item) => item.min[2]))
    ],
    max: [
      Math.max(...bounds.map((item) => item.max[0])),
      Math.max(...bounds.map((item) => item.max[1])),
      Math.max(...bounds.map((item) => item.max[2]))
    ]
  }
}
/** Encloses original transformed material only; no route or support assessment. */
export class QuadrupedRobotEnvelopeOwner {
  readonly work = { builds: 0, vertices: 0 }
  private current: QuadrupedRobotEnvelope | null = null
  constructor(private readonly sourceOwner: QuadrupedRobotSourceOwner) {}
  prepare(pose: QuadrupedRobotPoseResult): QuadrupedRobotEnvelope {
    if (!pose || !this.sourceOwner.isCurrentPose(pose))
      throw new Error('Stale quadruped envelope input')
    if (this.current?.pose === pose) return this.current
    const transforms = new Map(
      pose.bodyTransforms.map((body) => [body.id, body.transform])
    )
    const contributors = pose.parts.map((part) => {
      const body = transforms.get(part.bodyId)
      if (!body) throw new Error('Missing contributor body')
      const transform = composeRigidTransform(body, part.localFrame)
      const min = [Infinity, Infinity, Infinity],
        max = [-Infinity, -Infinity, -Infinity]
      for (let offset = 0; offset < part.shape.positions.length; offset += 3) {
        const point = transformed(
          part.shape.positions.slice(offset, offset + 3).map(interval),
          transform
        )
        point.forEach((value, axis) => {
          min[axis] = Math.min(min[axis], value.low)
          max[axis] = Math.max(max[axis], value.high)
        })
        this.work.vertices++
      }
      return {
        part,
        kind: part.kind,
        transform,
        bounds: {
          min: [min[0], min[1], min[2]] as Point3,
          max: [max[0], max[1], max[2]] as Point3
        }
      }
    })
    const fixed = union(
      contributors
        .filter((item) => item.kind === 'fixed')
        .map((item) => item.bounds)
    )
    this.current = freezeSource({
      pose,
      contributors,
      bounds: union(contributors.map((item) => item.bounds)),
      fixedBodyWidth: fixed.max[0] - fixed.min[0]
    })
    this.work.builds++
    return this.current
  }
}
