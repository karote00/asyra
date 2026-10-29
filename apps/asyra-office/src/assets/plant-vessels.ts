import { emptyMesh, type Mesh } from './geometry'
type Point = [number, number]

/** Round the declared R/Z section, then revolve it; the cavity remains real. */
export function roundedProfile(
  profile: readonly number[][],
  radius: number,
  segments: number
): Point[] {
  const result: Point[] = []
  profile.forEach((p, i) => {
    if (i === 0 || i === profile.length - 1 || p[0] === 0) {
      result.push([p[0], p[1]])
      return
    }
    const a = profile[i - 1],
      b = profile[i + 1]
    const left = Math.hypot(a[0] - p[0], a[1] - p[1]),
      right = Math.hypot(b[0] - p[0], b[1] - p[1])
    const u = [(a[0] - p[0]) / left, (a[1] - p[1]) / left],
      v = [(b[0] - p[0]) / right, (b[1] - p[1]) / right]
    const theta = Math.acos(
      Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))
    )
    if (Math.PI - theta < 1e-8) {
      result.push([p[0], p[1]])
      return
    }
    const trim = Math.min(
      radius / Math.tan(theta / 2),
      left * 0.45,
      right * 0.45
    )
    const r = trim * Math.tan(theta / 2),
      d = r / Math.sin(theta / 2)
    const norm = Math.hypot(u[0] + v[0], u[1] + v[1])
    const c = [
      p[0] + ((u[0] + v[0]) * d) / norm,
      p[1] + ((u[1] + v[1]) * d) / norm
    ]
    const start = Math.atan2(
      p[1] + u[1] * trim - c[1],
      p[0] + u[0] * trim - c[0]
    )
    const end = Math.atan2(p[1] + v[1] * trim - c[1], p[0] + v[0] * trim - c[0])
    let sweep = end - start
    if (sweep > Math.PI) sweep -= 2 * Math.PI
    if (sweep < -Math.PI) sweep += 2 * Math.PI
    for (let j = 0; j <= segments; j++) {
      const angle = start + (sweep * j) / segments
      result.push([c[0] + r * Math.cos(angle), c[1] + r * Math.sin(angle)])
    }
  })
  return result
}

/** Weld the poles and the circumference; no repeated zero-area axis triangles. */
export function revolveProfile(
  profile: readonly Point[],
  segments: number
): Mesh {
  const mesh = emptyMesh(),
    rings: number[][] = []
  for (const [r, z] of profile) {
    const ring: number[] = []
    for (let i = 0; i < (r === 0 ? 1 : segments); i++) {
      ring.push(mesh.positions.length / 3)
      const angle = (2 * Math.PI * i) / segments
      mesh.positions.push(r * Math.cos(angle), r * Math.sin(angle), z)
      mesh.uvs.push(i / segments, z)
    }
    rings.push(ring)
  }
  const tri = (a: number, b: number, c: number) => {
    if (a !== b && b !== c && c !== a) mesh.indices.push(a, b, c)
  }
  for (let j = 0; j < rings.length - 1; j++)
    for (let i = 0; i < segments; i++) {
      const lower = rings[j],
        upper = rings[j + 1]
      const a = lower[i % lower.length],
        b = lower[(i + 1) % lower.length],
        c = upper[i % upper.length],
        d = upper[(i + 1) % upper.length]
      tri(a, b, d)
      tri(a, d, c)
    }
  return mesh
}

/** Intersect soil with the actual rounded cavity, retaining its flat top. */
export function clippedSoil(
  profile: readonly Point[],
  radius: number,
  bottom: number,
  top: number
): Point[] {
  const heights = new Set([bottom, top])
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1],
      b = profile[i]
    if (a[1] > bottom && a[1] < top) heights.add(a[1])
    if ((a[0] - radius) * (b[0] - radius) < 0) {
      const z = a[1] + ((b[1] - a[1]) * (radius - a[0])) / (b[0] - a[0])
      if (z > bottom && z < top) heights.add(z)
    }
  }
  const outline: Point[] = [...heights]
    .sort((a, b) => a - b)
    .map((z) => {
      const radii = [radius]
      for (let i = 1; i < profile.length; i++) {
        const a = profile[i - 1],
          b = profile[i]
        if (
          a[1] === b[1] ||
          z < Math.min(a[1], b[1]) - 1e-12 ||
          z > Math.max(a[1], b[1]) + 1e-12
        )
          continue
        const r = a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1])
        if (r > 0) radii.push(r)
      }
      return [Math.min(...radii), z]
    })
  return [[0, bottom], ...outline, [0, top]]
}

/** Sweep the same hollow section over four straight sides with rounded corners. */
export function squareProfile(
  profile: readonly Point[],
  cornerRadius: number
): Mesh {
  const mesh = revolveProfile(profile, 32)
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const x = mesh.positions[i],
      y = mesh.positions[i + 1]
    const r = Math.hypot(x, y)
    if (r === 0) continue
    const index =
      Math.round(
        (((Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI)) * 32) /
          (2 * Math.PI)
      ) % 32
    const corner = Math.floor(index / 8)
    const angle = (corner * Math.PI) / 2 + ((index % 8) * Math.PI) / 14
    const bevel = Math.min(cornerRadius, r * 0.2)
    const sx = corner === 0 || corner === 3 ? 1 : -1
    const sy = corner < 2 ? 1 : -1
    mesh.positions[i] = sx * (r - bevel) + bevel * Math.cos(angle)
    mesh.positions[i + 1] = sy * (r - bevel) + bevel * Math.sin(angle)
  }
  return mesh
}
