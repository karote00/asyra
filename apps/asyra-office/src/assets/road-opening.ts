import { emptyMesh, type Vec } from './geometry'
/** A real blind circular receiving recess; no road top underneath the rim/gap. */
export function roadWithOpening(
  size: Vec,
  opening: [number, number],
  radius: number,
  depth: number
) {
  const mesh = emptyMesh(),
    [cx, cy] = opening,
    top = size[2] / 2,
    floor = top - depth,
    bottom = -size[2] / 2
  const angles = Array.from({ length: 129 }, (_, i) => (i * Math.PI) / 64)
  for (const x of [-size[0] / 2, size[0] / 2])
    for (const y of [-size[1] / 2, size[1] / 2]) {
      let t = Math.atan2(y - cy, x - cx)
      if (t < 0) t += 2 * Math.PI
      angles.push(t)
    }
  angles.sort((a, b) => a - b)
  for (const angle of angles) {
    const c = Math.cos(angle),
      s = Math.sin(angle)
    const distance = Math.min(
      Math.abs(c) > 1e-9
        ? ((c > 0 ? size[0] / 2 : -size[0] / 2) - cx) / c
        : Infinity,
      Math.abs(s) > 1e-9
        ? ((s > 0 ? size[1] / 2 : -size[1] / 2) - cy) / s
        : Infinity
    )
    for (const [r, z] of [
      [radius, floor],
      [radius, top],
      [distance, top],
      [distance, bottom]
    ]) {
      const x = cx + r * c,
        y = cy + r * s
      mesh.positions.push(x, y, z)
      mesh.uvs.push((x + size[0] / 2) / size[0], (y + size[1] / 2) / size[1])
    }
  }
  for (let i = 0; i < angles.length - 1; i++)
    for (let ring = 0; ring < 3; ring++) {
      const a = i * 4 + ring,
        b = a + 1,
        c = a + 4,
        d = c + 1
      mesh.indices.push(a, b, d, a, d, c)
    }
  for (const [ring, z, flip] of [
    [0, floor, false],
    [3, bottom, true]
  ] as const) {
    const centre = mesh.positions.length / 3
    mesh.positions.push(cx, cy, z)
    mesh.uvs.push(0.5, 0.5)
    for (let i = 0; i < angles.length - 1; i++) {
      const a = i * 4 + ring,
        b = a + 4
      mesh.indices.push(...(flip ? [centre, b, a] : [centre, a, b]))
    }
  }
  return mesh
}
