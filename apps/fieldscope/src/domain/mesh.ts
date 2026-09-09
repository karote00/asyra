import type { Point3, Member } from './greenhouse'

/** Engine-neutral triangle buffers. Construction belongs to the site lifetime. */
export class TriangleBuilder {
  constructor(private readonly tubeSides = 8) {}
  readonly positions: number[] = []
  readonly colors: number[] = []
  readonly uvs: number[] = []
  readonly indices: number[] = []

  triangle(a: Point3, b: Point3, c: Point3) {
    const offset = this.positions.length / 3
    this.positions.push(...a, ...b, ...c)
    this.indices.push(offset, offset + 1, offset + 2)
  }

  quad(a: Point3, b: Point3, c: Point3, d: Point3) {
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
  }

  box(center: Point3, size: Point3) {
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
  }

  tube(member: Pick<Member, 'points' | 'diameter'>, sides = this.tubeSides) {
    const { points, diameter } = member
    const offset = this.positions.length / 3
    points.forEach((p, i) => {
      const before = points[Math.max(0, i - 1)],
        after = points[Math.min(points.length - 1, i + 1)]
      const tangent = normalize(subtract(after, before))
      const axis: Point3 = Math.abs(tangent[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
      const normal = normalize(cross(tangent, axis)),
        binormal = cross(tangent, normal)
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
