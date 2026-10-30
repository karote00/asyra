import { readSpatialSurface } from '@asyra/preset/spatial-contract'

/** Authored leaf pigment, not baked lighting; UV U is root-to-tip, V is blade width. */
export function botanicalSurface(kind: 'veined-leaf' | 'snake-leaf') {
  const width = 512,
    height = 256
  const albedo: number[] = [],
    normals: number[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = x / (width - 1),
        q = (y / (height - 1) - 0.5) * 2
      const edge = Math.abs(q)
      let color: number[]
      if (kind === 'veined-leaf') {
        const branch = t * 8 - edge * 0.63
        const secondary = Math.abs(Math.sin(Math.PI * branch))
        const fine = Math.abs(Math.sin(Math.PI * (t * 18 + edge * 3.1)))
        const vein =
          edge < 0.025 || secondary < 0.075 || (fine < 0.045 && edge > 0.18)
        const variation =
          Math.sin(t * 95 + q * 31) * Math.sin(q * 67 - t * 19) * 9
        color = vein
          ? [204, 217, 183]
          : [51 + variation, 78 + variation, 39 + variation]
      } else {
        const bands =
          Math.sin(t * 155 + Math.sin(q * 17) * 1.2) +
          Math.sin(t * 71 + q * 23) * 0.45
        const mottle = Math.sin(t * 270 + q * 79) * Math.sin(q * 93 - t * 180)
        color = [
          67 + bands * 20 + mottle * 8,
          96 + bands * 25 + mottle * 10,
          49 + bands * 13
        ]
        if (edge > 0.84 + 0.025 * Math.sin(t * 27)) {
          color = [177, 177, 83]
        }
      }
      albedo.push(
        ...color.map((v) => Math.max(0, Math.min(255, Math.round(v)))),
        255
      )
      normals.push(128, 128, 255, 255)
    }
  }
  return readSpatialSurface({ width, height, albedo, normals })
}
