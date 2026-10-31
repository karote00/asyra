import { readSpatialSurface } from '@asyra/preset/spatial-contract'

const painted = (u: number, v: number) => {
  const phase = (u * 6) % 1
  const dx = (phase - 0.5) * 2,
    dy = (v - 0.52) / 0.26
  const radius = Math.hypot(dx, dy),
    angle = Math.atan2(dy, dx)
  const petals = 0.51 + 0.17 * Math.cos(5 * angle)
  const flower = radius < petals && radius > 0.19
  const centre = radius < 0.105
  const vine = Math.abs(v - (0.22 + 0.035 * Math.sin(u * 12 * Math.PI))) < 0.008
  const leaf = ((phase - 0.2) / 0.14) ** 2 + ((v - 0.27) / 0.045) ** 2 < 1
  const border = (v > 0.08 && v < 0.1) || (v > 0.87 && v < 0.89)
  return flower || centre || vine || leaf || border
}
/** Replaceable flat glaze artwork; relief and illumination belong to geometry/light. */
export function porcelainSurface() {
  const width = 512,
    height = 256
  const albedo: number[] = [],
    normals: number[] = []
  const glaze = [248, 246, 239],
    ink = [69, 103, 148]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let coverage = 0
      for (const sy of [0.25, 0.75]) {
        for (const sx of [0.25, 0.75]) {
          if (
            painted(
              ((x === width - 1 ? 0 : x) + sx) / (width - 1),
              (y + sy) / height
            )
          ) {
            coverage += 0.25
          }
        }
      }
      albedo.push(
        ...glaze.map((c, i) =>
          Math.round(c * (1 - coverage) + ink[i] * coverage)
        ),
        255
      )
      normals.push(128, 128, 255, 255)
    }
  }
  return readSpatialSurface({ width, height, albedo, normals })
}
