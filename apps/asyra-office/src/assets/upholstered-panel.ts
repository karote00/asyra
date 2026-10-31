import { bezier, emptyMesh } from './geometry'
export interface UpholsteredPanel {
  outlineControlYZ: number[][][]
  centreX: number
  thickness: number
  rounding: number
  taperStartZ: number
  taperEndZ: number
  taperX: number
}
/** Rounded extrusion of one side silhouette; the two sides remain independent. */
export function upholsteredPanel(d: UpholsteredPanel) {
  const outline = d.outlineControlYZ
    .flatMap((segment, i) =>
      bezier(
        segment.map(([y, z]) => [0, y, z]),
        8
      ).slice(i ? 1 : 0)
    )
    .slice(0, -1)
  const n = outline.length,
    area = outline.reduce((sum, p, i) => {
      const q = outline[(i + 1) % n]
      return sum + p[1] * q[2] - q[1] * p[2]
    }, 0),
    sign = Math.sign(area)
  const radii = outline.map((p, i) => {
    const a = outline[(i + n - 1) % n],
      b = outline[(i + 1) % n]
    const ab = Math.hypot(p[1] - a[1], p[2] - a[2]),
      bc = Math.hypot(b[1] - p[1], b[2] - p[2]),
      ac = Math.hypot(b[1] - a[1], b[2] - a[2])
    const twiceArea = Math.abs(
      (p[1] - a[1]) * (b[2] - a[2]) - (p[2] - a[2]) * (b[1] - a[1])
    )
    return Math.min(
      d.rounding,
      twiceArea > 1e-12 ? (0.8 * ab * bc * ac) / (2 * twiceArea) : d.rounding
    )
  })
  const inward = outline.map((p, i) => {
    const prev = outline[(i + n - 1) % n],
      next = outline[(i + 1) % n]
    const edge = (a: number[], b: number[]) => {
      const dy = b[1] - a[1],
        dz = b[2] - a[2],
        l = Math.hypot(dy, dz)
      return [(-sign * dz) / l, (sign * dy) / l]
    }
    const a = edge(prev, p),
      b = edge(p, next),
      sum = [a[0] + b[0], a[1] + b[1]],
      length = Math.hypot(...sum)
    const normal = sum.map((v) => v / length),
      dot = normal[0] * b[0] + normal[1] * b[1]
    return normal.map((v) => v / dot)
  })
  const rings: { x: number; inset: number }[] = []
  for (let i = 0; i <= 4; i++) {
    const t = Math.PI / 2 - (i * Math.PI) / 8
    rings.push({
      x: -d.thickness / 2 + d.rounding - d.rounding * Math.sin(t),
      inset: d.rounding * (1 - Math.cos(t))
    })
  }
  for (let i = 0; i <= 4; i++) {
    const t = (i * Math.PI) / 8
    rings.push({
      x: d.thickness / 2 - d.rounding + d.rounding * Math.sin(t),
      inset: d.rounding * (1 - Math.cos(t))
    })
  }
  const mesh = emptyMesh()
  for (const ring of rings) {
    outline.forEach((p, i) => {
      const localRadius = radii[i],
        inset = (ring.inset * localRadius) / d.rounding
      const y = p[1] + inward[i][0] * inset,
        z = p[2] + inward[i][1] * inset
      const center = d.centreX
      const x =
        Math.sign(ring.x) *
        (d.thickness / 2 -
          localRadius +
          (localRadius * (Math.abs(ring.x) - d.thickness / 2 + d.rounding)) /
            d.rounding)
      mesh.positions.push(center + x, y, z)
      mesh.uvs.push(i / n, (ring.x + d.thickness / 2) / d.thickness)
    })
  }
  const tri = (a: number, b: number, c: number, flip = false) =>
    mesh.indices.push(...(flip ? [a, c, b] : [a, b, c]))
  for (let row = 0; row < rings.length - 1; row++) {
    for (let i = 0; i < n; i++) {
      const a = row * n + i,
        b = row * n + ((i + 1) % n),
        c = a + n,
        e = b + n
      tri(a, b, e, sign < 0)
      tri(a, e, c, sign < 0)
    }
  }
  const cross = (a: number, b: number, c: number) => {
    const p = mesh.positions
    return (
      (p[b * 3 + 1] - p[a * 3 + 1]) * (p[c * 3 + 2] - p[a * 3 + 2]) -
      (p[b * 3 + 2] - p[a * 3 + 2]) * (p[c * 3 + 1] - p[a * 3 + 1])
    )
  }
  for (const row of [0, rings.length - 1]) {
    const remaining = Array.from({ length: n }, (_, i) => row * n + i)
    while (remaining.length > 3) {
      let removed = false
      for (let i = 0; i < remaining.length; i++) {
        const a = remaining[(i + remaining.length - 1) % remaining.length],
          b = remaining[i],
          c = remaining[(i + 1) % remaining.length]
        if (sign * cross(a, b, c) <= 1e-12) {
          continue
        }
        if (
          remaining.some(
            (p) =>
              p !== a &&
              p !== b &&
              p !== c &&
              sign * cross(a, b, p) >= -1e-12 &&
              sign * cross(b, c, p) >= -1e-12 &&
              sign * cross(c, a, p) >= -1e-12
          )
        ) {
          continue
        }
        tri(a, b, c, (row === 0) === sign > 0)
        remaining.splice(i, 1)
        removed = true
        break
      }
      if (!removed) {
        throw new Error(
          'Upholstered profile cannot be triangulated without crossing'
        )
      }
    }
    tri(remaining[0], remaining[1], remaining[2], (row === 0) === sign > 0)
  }
  // Refine before the nonlinear taper so long cap triangles cannot form ridges.
  const triangles = mesh.indices.splice(0),
    midpoints = new Map<string, number>()
  const midpoint = (a: number, b: number) => {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`,
      found = midpoints.get(key)
    if (found !== undefined) {
      return found
    }
    const index = mesh.positions.length / 3
    for (let k = 0; k < 3; k++) {
      mesh.positions.push(
        (mesh.positions[a * 3 + k] + mesh.positions[b * 3 + k]) / 2
      )
    }
    for (let k = 0; k < 2; k++) {
      mesh.uvs.push((mesh.uvs[a * 2 + k] + mesh.uvs[b * 2 + k]) / 2)
    }
    midpoints.set(key, index)
    return index
  }
  const refine = (a: number, b: number, c: number) => {
    const edges = [
      [a, b, c],
      [b, c, a],
      [c, a, b]
    ]
    edges.sort(
      (u, v) =>
        Math.abs(mesh.positions[v[0] * 3 + 2] - mesh.positions[v[1] * 3 + 2]) -
        Math.abs(mesh.positions[u[0] * 3 + 2] - mesh.positions[u[1] * 3 + 2])
    )
    const [u, v, w] = edges[0]
    if (
      Math.abs(mesh.positions[u * 3 + 2] - mesh.positions[v * 3 + 2]) <= 0.02
    ) {
      mesh.indices.push(a, b, c)
      return
    }
    const m = midpoint(u, v)
    refine(u, m, w)
    refine(m, v, w)
  }
  for (let i = 0; i < triangles.length; i += 3) {
    refine(triangles[i], triangles[i + 1], triangles[i + 2])
  }
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const t = Math.max(
      0,
      Math.min(
        1,
        (mesh.positions[i + 2] - d.taperStartZ) / (d.taperEndZ - d.taperStartZ)
      )
    )
    mesh.positions[i] -= Math.sign(d.centreX) * d.taperX * t * t * (3 - 2 * t)
  }
  return mesh
}
