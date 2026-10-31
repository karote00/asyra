import spec from '../../../../assets/asyra-office/models/street/tree-construction-spec.json'
import type { Vec } from './geometry'

/** One transform per primary subtree; child ownership is never reassigned. */
export function createTreeGrowth(seed: number, trunk: (z: number) => Vec) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error('Tree seed must be an unsigned 32-bit integer')
  }
  let state = seed >>> 0
  const next = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return (state + 0.5) / 2 ** 32
  }
  interface Growth {
    origin: Vec
    angle: number
    reach: number
    height: number
  }
  const transforms = new Map<string, Growth>()
  let index = 0
  for (const branch of [...spec.branches.entries].sort(
    (a, b) => a.level - b.level
  )) {
    if (branch.level === 1) {
      const origin = trunk(branch.attachmentZ ?? 0),
        oldAngle = Math.atan2(
          branch.end[1] - origin[1],
          branch.end[0] - origin[0]
        ),
        angle =
          ((spec.growth.azimuthOffsetDegrees +
            index++ * spec.growth.azimuthStepDegrees +
            (2 * next() - 1) * spec.growth.azimuthJitterDegrees) *
            Math.PI) /
            180 -
          oldAngle
      const [r0, r1] = spec.growth.horizontalReachRange,
        [h0, h1] = spec.growth.verticalReachRange
      transforms.set(branch.id, {
        origin,
        angle,
        reach: r0 + (r1 - r0) * next(),
        height: h0 + (h1 - h0) * next()
      })
    } else {
      const parent = transforms.get(branch.parent)
      if (!parent) {
        throw new Error('Tree growth requires the primary parent first')
      }
      transforms.set(branch.id, parent)
    }
  }
  return (id: string, point: readonly number[], lift: number) => {
    const t = transforms.get(id)
    if (!t) {
      throw new Error('Missing tree growth transform')
    }
    const x = point[0] - t.origin[0],
      y = point[1] - t.origin[1]
    const end: Vec = [
      t.origin[0] + t.reach * (Math.cos(t.angle) * x - Math.sin(t.angle) * y),
      t.origin[1] + t.reach * (Math.sin(t.angle) * x + Math.cos(t.angle) * y),
      t.origin[2] + t.height * (point[2] - t.origin[2])
    ]
    return { end, lift: lift * t.height }
  }
}
