import { emptyMesh, type Mesh, type Vec } from './geometry'

/** Extrudes a simple planar profile, triangulating concave caps without a fan. */
export function extrudeProfile(
  points: readonly (readonly number[])[],
  axis: 0 | 1 | 2,
  range: readonly [number, number],
  caps: readonly [boolean, boolean] = [true, true]
): Mesh {
  const m = emptyMesh(),
    n = points.length
  if (n < 3 || !(range[1] > range[0])) throw new Error('Invalid extrusion')
  const area = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % n]
    return sum + p[0] * q[1] - q[0] * p[1]
  }, 0)
  const p = area > 0 ? [...points] : [...points].reverse()
  for (const height of range)
    for (const [u, v] of p) {
      const point: Vec = [0, 0, 0]
      point[axis] = height
      point[(axis + 1) % 3] = u
      point[(axis + 2) % 3] = v
      m.positions.push(...point)
      m.uvs.push(u, v)
    }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    m.indices.push(i, j, j + n, i, j + n, i + n)
  }
  const cross = (a: number, b: number, c: number) =>
    (p[b][0] - p[a][0]) * (p[c][1] - p[a][1]) -
    (p[b][1] - p[a][1]) * (p[c][0] - p[a][0])
  const indices = Array.from({ length: n }, (_, i) => i),
    triangles: number[] = []
  while (indices.length > 3) {
    let ear = false
    for (let i = 0; i < indices.length; i++) {
      const a = indices[(i + indices.length - 1) % indices.length],
        b = indices[i],
        c = indices[(i + 1) % indices.length]
      if (
        cross(a, b, c) <= 1e-12 ||
        indices.some(
          (q) =>
            q !== a &&
            q !== b &&
            q !== c &&
            cross(a, b, q) >= -1e-12 &&
            cross(b, c, q) >= -1e-12 &&
            cross(c, a, q) >= -1e-12
        )
      )
        continue
      triangles.push(a, b, c)
      indices.splice(i, 1)
      ear = true
      break
    }
    if (!ear) throw new Error('Profile has an invalid or crossing boundary')
  }
  triangles.push(...indices)
  for (let i = 0; i < triangles.length; i += 3) {
    const [a, b, c] = triangles.slice(i, i + 3)
    if (caps[0]) m.indices.push(a, c, b)
    if (caps[1]) m.indices.push(a + n, b + n, c + n)
  }
  // Planar cut faces retain independent normal domains at every sharp edge.
  const flat = emptyMesh()
  for (const id of m.indices) {
    flat.indices.push(flat.positions.length / 3)
    flat.positions.push(...m.positions.slice(id * 3, id * 3 + 3))
    flat.uvs.push(...m.uvs.slice(id * 2, id * 2 + 2))
  }
  return flat
}
