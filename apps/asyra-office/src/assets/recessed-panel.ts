import { type Mesh } from './geometry'

export interface PanelField {
  x: number
  z: number
  width: number
  height: number
  depth: number
  transition: number
}
/** Replace the actual planar front, keeping the parent solid's bevel, rear and sides. */
export function recessPanel(
  mesh: Mesh,
  frontY: number,
  fields: readonly PanelField[]
): Mesh {
  const result: Mesh = {
    positions: [...mesh.positions],
    uvs: [...mesh.uvs],
    indices: []
  }
  const flat: number[] = []
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const ids = mesh.indices.slice(i, i + 3)
    if (
      ids.every((id) => Math.abs(mesh.positions[id * 3 + 1] - frontY) < 1e-10)
    ) {
      flat.push(...ids)
    } else {
      result.indices.push(...ids)
    }
  }
  if (!flat.length) {
    throw new Error('Panel has no planar front to recess')
  }
  const xs = flat.map((id) => mesh.positions[id * 3]),
    zs = flat.map((id) => mesh.positions[id * 3 + 2])
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minZ = Math.min(...zs),
    maxZ = Math.max(...zs)
  for (const f of fields) {
    if (!(
      f.depth > 0 &&
      f.transition > 0 &&
      f.width > 2 * f.transition &&
      f.height > 2 * f.transition &&
      f.x - f.width / 2 > minX &&
      f.x + f.width / 2 < maxX &&
      f.z - f.height / 2 > minZ &&
      f.z + f.height / 2 < maxZ
    )) {
      throw new Error('Invalid inset field')
    }
  }
  const grid = (axis: 'x' | 'z', min: number, max: number) =>
    [
      ...new Set([
        min,
        max,
        ...fields.flatMap((f) => {
          const half = (axis === 'x' ? f.width : f.height) / 2
          return [
            f[axis] - half,
            f[axis] - half + f.transition,
            f[axis] + half - f.transition,
            f[axis] + half
          ]
        })
      ])
    ].sort((a, b) => a - b)
  const X = grid('x', minX, maxX),
    Z = grid('z', minZ, maxZ)
  const depth = (x: number, z: number) =>
    Math.max(
      0,
      ...fields.map(
        (f) =>
          f.depth *
          Math.max(
            0,
            Math.min(
              1,
              (f.width / 2 - Math.abs(x - f.x)) / f.transition,
              (f.height / 2 - Math.abs(z - f.z)) / f.transition
            )
          )
      )
    )
  for (let j = 0; j < Z.length - 1; j++) {
    for (let i = 0; i < X.length - 1; i++) {
      const base = result.positions.length / 3
      for (const [x, z] of [
        [X[i], Z[j]],
        [X[i + 1], Z[j]],
        [X[i + 1], Z[j + 1]],
        [X[i], Z[j + 1]]
      ]) {
        result.positions.push(x, frontY + depth(x, z), z)
        result.uvs.push((x - minX) / (maxX - minX), (z - minZ) / (maxZ - minZ))
      }
      result.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
    }
  }
  return result
}
