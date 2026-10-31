import { emptyMesh, type Vec } from './geometry'

/** Closed radial sections of a star-convex solid, preserving exact height datums. */
export function radialSolid(
  field: (p: Vec) => number,
  centreY: number,
  heights: readonly number[],
  maximumRadius: number,
  segments = 128
) {
  const mesh = emptyMesh()
  for (const z of heights) {
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments,
        dx = Math.cos(angle),
        dy = Math.sin(angle)
      const sample = (r: number) => field([r * dx, centreY + r * dy, z])
      let lo = 0,
        hi = maximumRadius
      for (let step = 1; step <= 64; step++) {
        const r = (maximumRadius * step) / 64
        if (sample(r) > 1e-11) {
          hi = r
          lo = (maximumRadius * (step - 1)) / 64
          break
        }
        if (step === 64) {
          throw new Error('Radial boundary not enclosed')
        }
      }
      for (let k = 0; k < 36; k++) {
        const r = (lo + hi) / 2
        if (sample(r) > 1e-11) {
          hi = r
        } else {
          lo = r
        }
      }
      const r = (lo + hi) / 2
      mesh.positions.push(r * dx, centreY + r * dy, z)
      mesh.uvs.push(0.5 + r * dx, 0.5 + r * dy)
    }
  }
  for (let j = 0; j < heights.length - 1; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * segments + i,
        b = j * segments + ((i + 1) % segments),
        c = a + segments,
        d = b + segments
      mesh.indices.push(a, b, d, a, d, c)
    }
  }
  for (const row of [0, heights.length - 1]) {
    const centre = mesh.positions.length / 3
    mesh.positions.push(0, centreY, heights[row])
    mesh.uvs.push(0.5, 0.5)
    for (let i = 0; i < segments; i++) {
      const a = row * segments + i,
        b = row * segments + ((i + 1) % segments)
      mesh.indices.push(...(row === 0 ? [centre, b, a] : [centre, a, b]))
    }
  }
  return mesh
}
