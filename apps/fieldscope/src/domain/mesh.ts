import type { Point3, Member } from './greenhouse'
import { readSourceRegions, type SourceRegion } from './source-occupancy'

/** Engine-neutral triangle buffers. Construction belongs to the site lifetime. */
export class TriangleBuilder {
  constructor(private readonly tubeSides = 8) {}
  readonly positions: number[] = []
  readonly colors: number[] = []
  readonly uvs: number[] = []
  readonly indices: number[] = []
  private sourceRegions: SourceRegion[] = []

  /** An enclosing source primitive may replace its own child face declarations. */
  region(kind: SourceRegion['kind'], indexStart: number) {
    if (indexStart === this.indices.length) return
    while (
      this.sourceRegions.length &&
      this.sourceRegions[this.sourceRegions.length - 1].indexStart >= indexStart
    )
      this.sourceRegions.pop()
    this.sourceRegions.push({
      id: `region-${this.sourceRegions.length}`,
      kind,
      indexStart,
      indexCount: this.indices.length - indexStart
    })
  }

  regions() {
    return readSourceRegions(this.sourceRegions, this.indices.length)
  }

  triangle(a: Point3, b: Point3, c: Point3) {
    const start = this.indices.length
    const offset = this.positions.length / 3
    this.positions.push(...a, ...b, ...c)
    this.indices.push(offset, offset + 1, offset + 2)
    this.region('sheet', start)
  }

  quad(a: Point3, b: Point3, c: Point3, d: Point3) {
    const start = this.indices.length
    const offset = this.positions.length / 3
    this.positions.push(...a, ...b, ...c, ...d)
    this.indices.push(
      offset,
      offset + 1,
      offset + 2,
      offset,
      offset + 2,
      offset + 3
    )
    this.region('sheet', start)
  }

  box(center: Point3, size: Point3) {
    const start = this.indices.length
    const [x, y, z] = center,
      [w, h, l] = size.map((v) => v / 2)
    const p = (a: number, b: number, c: number): Point3 => [
      x + a * w,
      y + b * h,
      z + c * l
    ]
    this.quad(p(-1, -1, -1), p(1, -1, -1), p(1, 1, -1), p(-1, 1, -1))
    this.quad(p(1, -1, 1), p(-1, -1, 1), p(-1, 1, 1), p(1, 1, 1))
    this.quad(p(-1, -1, 1), p(-1, -1, -1), p(-1, 1, -1), p(-1, 1, 1))
    this.quad(p(1, -1, -1), p(1, -1, 1), p(1, 1, 1), p(1, 1, -1))
    this.quad(p(-1, 1, -1), p(1, 1, -1), p(1, 1, 1), p(-1, 1, 1))
    this.quad(p(-1, -1, 1), p(1, -1, 1), p(1, -1, -1), p(-1, -1, -1))
    this.region(
      size.every((value) => Number.isFinite(value) && value > 0)
        ? 'closed-solid'
        : 'open-shell',
      start
    )
  }

  tube(member: Pick<Member, 'points' | 'diameter'>, sides = this.tubeSides) {
    const start = this.indices.length
    const { points, diameter } = member
    const offset = this.positions.length / 3
    let previousTangent: Point3 | undefined
    let previousNormal: Point3 | undefined
    points.forEach((p, i) => {
      const before = points[Math.max(0, i - 1)],
        after = points[Math.min(points.length - 1, i + 1)]
      const tangent = normalize(subtract(after, before))
      let normal: Point3
      if (previousTangent && previousNormal) {
        // Parallel transport: rotate the preceding frame by the shortest
        // tangent-to-tangent rotation instead of choosing a new world axis.
        const rotation = cross(previousTangent, tangent)
        const cosine = previousTangent.reduce(
          (sum, v, k) => sum + v * tangent[k],
          0
        )
        const first = cross(rotation, previousNormal)
        const second = cross(rotation, first)
        normal =
          cosine > -1 + 1e-12
            ? normalize([
                previousNormal[0] + first[0] + second[0] / (1 + cosine),
                previousNormal[1] + first[1] + second[1] / (1 + cosine),
                previousNormal[2] + first[2] + second[2] / (1 + cosine)
              ])
            : previousNormal
      } else {
        const axis: Point3 = Math.abs(tangent[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
        normal = normalize(cross(tangent, axis))
      }
      const binormal = cross(tangent, normal)
      previousTangent = tangent
      previousNormal = normal
      for (let side = 0; side < sides; side++) {
        const angle = (side / sides) * Math.PI * 2
        for (let k = 0; k < 3; k++)
          this.positions.push(
            p[k] +
              (diameter / 2) *
                (normal[k] * Math.cos(angle) + binormal[k] * Math.sin(angle))
          )
        if (i === 0) continue
        const a = offset + (i - 1) * sides + side,
          b = offset + (i - 1) * sides + ((side + 1) % sides)
        this.indices.push(a, b, b + sides, a, b + sides, a + sides)
      }
    })
    this.region('open-shell', start)
  }

  shape() {
    return {
      kind: 'triangles' as const,
      positions: this.positions,
      ...(this.colors.length ? { colors: this.colors } : {}),
      ...(this.uvs.length ? { uvs: this.uvs } : {}),
      indices: this.indices
    }
  }
}
function subtract(a: Point3, b: Point3): Point3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function normalize(a: Point3): Point3 {
  const n = Math.hypot(...a)
  return [a[0] / n, a[1] / n, a[2] / n]
}
function cross(a: Point3, b: Point3): Point3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
}
