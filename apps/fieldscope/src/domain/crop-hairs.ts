import type { Point3 } from './greenhouse'
import { TriangleBuilder } from './mesh'

export interface SurfaceHairRange {
  sourceTriangle: number
  vertexStart: number
  vertexCount: number
  indexStart: number
  indexCount: number
}

/** Sample the completed surface triangles, so bristles grow from the actual mesh. */
export function appendSurfaceHairs(
  builder: TriangleBuilder,
  density: number,
  length: number,
  bothSides: boolean,
  baseColor: Point3,
  observe?: (range: SurfaceHairRange) => void
): number {
  const originalIndices = builder.indices.length
  if (!builder.colors.length)
    for (let i = 0; i < builder.positions.length; i += 3)
      builder.colors.push(...baseColor)
  let count = 0,
    carry = 0
  const cross = (a: Point3, b: Point3): Point3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
  for (let i = 0; i < originalIndices; i += 3) {
    const p = [0, 1, 2].map(
      (j) =>
        builder.positions.slice(
          builder.indices[i + j] * 3,
          builder.indices[i + j] * 3 + 3
        ) as unknown as Point3
    )
    const ab = p[1].map((v, j) => v - p[0][j]) as unknown as Point3
    const ac = p[2].map((v, j) => v - p[0][j]) as unknown as Point3
    const n = cross(ab, ac),
      magnitude = Math.hypot(...n)
    if (magnitude < 1e-12) continue
    carry += magnitude * 0.5 * density
    const samples = Math.floor(carry)
    carry -= samples
    const tangent = ab.map((v) => v / Math.hypot(...ab)) as unknown as Point3
    const vertexStart = builder.positions.length / 3
    const indexStart = builder.indices.length
    for (let j = 0; j < samples; j++) {
      const phase = count * 2.399963
      const u = 0.2 + (0.5 + 0.5 * Math.sin(phase)) * 0.35
      const v = 0.15 + (0.5 + 0.5 * Math.cos(phase * 1.7)) * (0.8 - u)
      const base = p[0].map(
        (x, k) => x + ab[k] * u + ac[k] * v
      ) as unknown as Point3
      const normal = n.map(
        (x) => (x / magnitude) * (bothSides && count % 2 ? -1 : 1)
      ) as unknown as Point3
      const sideways = cross(normal, tangent)
      const hairLength = length * (0.65 + 0.35 * Math.sin(phase) ** 2)
      const offset = builder.positions.length / 3
      for (let side = 0; side < 3; side++) {
        const angle = (side * Math.PI * 2) / 3
        builder.positions.push(
          ...base.map(
            (x, k) =>
              x +
              length *
                0.06 *
                (tangent[k] * Math.cos(angle) + sideways[k] * Math.sin(angle))
          )
        )
        builder.colors.push(0.25, 0.34, 0.14)
      }
      builder.positions.push(
        ...base.map(
          (x, k) => x + normal[k] * hairLength + tangent[k] * hairLength * 0.13
        )
      )
      builder.colors.push(0.56, 0.63, 0.4)
      for (let side = 0; side < 3; side++)
        builder.indices.push(
          offset + side,
          offset + ((side + 1) % 3),
          offset + 3
        )
      if (builder.uvs.length)
        // A tiny valid UV patch keeps normal-map tangent derivatives finite.
        builder.uvs.push(0, 0, 0.001, 0, 0, 0.001, 0.001, 0.001)
      count++
    }
    if (samples && observe)
      observe({
        sourceTriangle: i,
        vertexStart,
        vertexCount: builder.positions.length / 3 - vertexStart,
        indexStart,
        indexCount: builder.indices.length - indexStart
      })
  }
  return count
}
