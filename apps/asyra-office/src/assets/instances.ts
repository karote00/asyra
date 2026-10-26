import { renderPosition, type Vec } from './geometry'
import type { SpatialInstance } from '@asyra/render-engine'
export interface GeometryInstance {
  id: string
  position: Vec
  basis: [Vec, Vec, Vec]
  scale: number
}
/** Convert a right-handed local basis to one normalized renderer quaternion. */
export function spatialInstance(instance: GeometryInstance): SpatialInstance {
  const [a, b, c] = instance.basis.map(renderPosition)
  // The prototype itself is converted X,Y,Z -> X,Z,-Y too.
  const m = [a, c, b.map((n) => -n)],
    r00 = m[0][0],
    r01 = m[1][0],
    r02 = m[2][0],
    r10 = m[0][1],
    r11 = m[1][1],
    r12 = m[2][1],
    r20 = m[0][2],
    r21 = m[1][2],
    r22 = m[2][2],
    trace = r00 + r11 + r22
  let x: number, y: number, z: number, w: number
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2
    w = s / 4
    x = (r21 - r12) / s
    y = (r02 - r20) / s
    z = (r10 - r01) / s
  } else if (r00 > r11 && r00 > r22) {
    const s = Math.sqrt(1 + r00 - r11 - r22) * 2
    w = (r21 - r12) / s
    x = s / 4
    y = (r01 + r10) / s
    z = (r02 + r20) / s
  } else if (r11 > r22) {
    const s = Math.sqrt(1 + r11 - r00 - r22) * 2
    w = (r02 - r20) / s
    x = (r01 + r10) / s
    y = s / 4
    z = (r12 + r21) / s
  } else {
    const s = Math.sqrt(1 + r22 - r00 - r11) * 2
    w = (r10 - r01) / s
    x = (r02 + r20) / s
    y = (r12 + r21) / s
    z = s / 4
  }
  return {
    id: instance.id,
    position: renderPosition(instance.position),
    rotation: [x, y, z, w],
    scale: [instance.scale, instance.scale, instance.scale]
  }
}
