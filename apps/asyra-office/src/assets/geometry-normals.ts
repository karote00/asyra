import type { Mesh, Vec } from './geometry'

/** Area-weighted normals for ordinary meshes joining an authored-normal batch. */
export function meshNormals(mesh: Mesh): number[] {
  if (mesh.normals) return mesh.normals
  const result = Array<number>(mesh.positions.length).fill(0)
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const ids = mesh.indices.slice(i, i + 3).map((id) => id * 3)
    const [a, b, c] = ids.map((id) => mesh.positions.slice(id, id + 3))
    const u = b.map((v, k) => v - a[k]),
      v = c.map((n, k) => n - a[k])
    const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ]
    for (const id of ids) for (let k = 0; k < 3; k++) result[id + k] += n[k]
  }
  for (let i = 0; i < result.length; i += 3) {
    const length = Math.hypot(...result.slice(i, i + 3))
    // Unreferenced pole duplicates have no incident face; their normal is unused.
    if (!length) result[i + 2] = 1
    else for (let k = 0; k < 3; k++) result[i + k] /= length
  }
  return result
}

/** Normal matrix for construction transforms: inverse scale followed by rotation. */
export function transformNormal(
  n: readonly number[],
  rotation: Vec,
  scale: Vec
): Vec {
  let [x, y, z] = n.map((v, k) => v / scale[k])
  const [a, b, c] = rotation.map((v) => (v * Math.PI) / 180)
  ;[y, z] = [
    y * Math.cos(a) - z * Math.sin(a),
    y * Math.sin(a) + z * Math.cos(a)
  ]
  ;[x, z] = [
    x * Math.cos(b) + z * Math.sin(b),
    -x * Math.sin(b) + z * Math.cos(b)
  ]
  ;[x, y] = [
    x * Math.cos(c) - y * Math.sin(c),
    x * Math.sin(c) + y * Math.cos(c)
  ]
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

export function latheNormals(
  profile: readonly (readonly number[])[],
  segments: number
): number[] {
  const normals: number[] = []
  const tangent = (a: readonly number[], b: readonly number[]) => {
    const dr = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dr, dz)
    return length ? [dz / length, -dr / length] : [0, 0]
  }
  for (let j = 0; j < profile.length; j++) {
    const before = tangent(profile[Math.max(0, j - 1)], profile[j])
    const after = tangent(
      profile[j],
      profile[Math.min(profile.length - 1, j + 1)]
    )
    let radial = before[0] + after[0],
      axial = before[1] + after[1]
    if (profile[j][0] === 0) radial = 0
    const length = Math.hypot(radial, axial)
    radial /= length
    axial /= length
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      normals.push(radial * Math.cos(a), radial * Math.sin(a), axial)
    }
  }
  return normals
}
