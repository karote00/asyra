import { readSpatialSurface } from '@asyra/preset/spatial-contract'

export type IngredientSurface =
  'granulated' | 'ground-spice' | 'dried-herbs' | 'peppercorns'

/** Ingredient albedo only; jittered shapes carry no painted directional lighting. */
export function ingredientSurface(kind: IngredientSurface) {
  const width = 512,
    height = 128
  const albedo: number[] = [],
    normals: number[] = []
  const hash = (x: number, y: number) => {
    let n = Math.imul(x + 781, 374761393) ^ Math.imul(y + 971, 668265263)
    n = Math.imul(n ^ (n >>> 13), 1274126177)
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x === width - 1 ? 0 : x
      const v = y === height - 1 ? 0 : y
      let value = 195 + hash(u, v) * 60
      if (kind === 'granulated') {
        value = 210 + hash(u, v) * 45
      }
      if (kind === 'dried-herbs' || kind === 'peppercorns') {
        const cell = 4
        const cx = Math.floor(u / cell),
          cy = Math.floor(v / cell)
        value = kind === 'dried-herbs' ? 110 : 90
        for (let row = cy - 1; row <= cy + 1; row++) {
          for (let col = cx - 1; col <= cx + 1; col++) {
            const dx = u - (col + 0.15 + hash(col, row) * 0.7) * cell
            const dy = v - (row + 0.15 + hash(col + 81, row) * 0.7) * cell
            const angle = hash(col, row + 99) * Math.PI
            const rx = dx * Math.cos(angle) + dy * Math.sin(angle)
            const ry = -dx * Math.sin(angle) + dy * Math.cos(angle)
            const major = 1 + hash(col + 3, row + 2) * 1.1
            const minor =
              kind === 'dried-herbs' ? 0.4 + hash(col, row + 11) * 0.6 : major
            if ((rx / major) ** 2 + (ry / minor) ** 2 < 1) {
              value = 150 + hash(col + 17, row + 4) * 105
            }
          }
        }
      }
      const channel = Math.round(value)
      albedo.push(channel, channel, channel, 255)
      normals.push(128, 128, 255, 255)
    }
  }
  return readSpatialSurface({ width, height, albedo, normals })
}
