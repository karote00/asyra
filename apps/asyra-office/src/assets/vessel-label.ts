import { emptyMesh, type Mesh } from './geometry'

/** A closed curved label section, with explicit front arc and physical thickness. */
export function vesselLabel(
  radius: number,
  zRange: readonly number[],
  angles: readonly number[],
  segments = 32
): Mesh {
  const mesh = emptyMesh()
  for (let i = 0; i <= segments; i++) {
    const angle =
      ((angles[0] + ((angles[1] - angles[0]) * i) / segments) * Math.PI) / 180
    for (const [r, z] of [
      [radius + 0.0005, zRange[0]],
      [radius + 0.0009, zRange[0]],
      [radius + 0.0009, zRange[1]],
      [radius + 0.0005, zRange[1]]
    ]) {
      mesh.positions.push(r * Math.cos(angle), r * Math.sin(angle), z)
      mesh.uvs.push(i / segments, (z - zRange[0]) / (zRange[1] - zRange[0]))
    }
  }
  for (let i = 0; i < segments; i++)
    for (let j = 0; j < 4; j++) {
      const a = i * 4 + j,
        b = i * 4 + ((j + 1) % 4),
        c = a + 4,
        d = b + 4
      mesh.indices.push(a, c, d, a, d, b)
    }
  mesh.indices.push(0, 1, 2, 0, 2, 3)
  const end = segments * 4
  mesh.indices.push(end, end + 2, end + 1, end, end + 3, end + 2)
  return mesh
}
