import type { MeshGeometry } from '../../../domain/part-geometry'

/** Project-authored exact synthetic source meshes; not hardware or public data. */
export function sourceMesh(
  positions: number[],
  indices: number[]
): MeshGeometry {
  return Object.freeze({
    kind: 'mesh',
    version: 1,
    source: { assetId: 'c'.repeat(64), scale: [1, 1, 1] as const },
    positions: Object.freeze(positions),
    indices: Object.freeze(indices)
  })
}
export function frontierBox(half = 1): MeshGeometry {
  return sourceMesh(
    [
      -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
      -1, 1, 1
    ].map((v) => v * half),
    [
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0,
      4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5
    ]
  )
}
export function frontierPrism(): MeshGeometry {
  return sourceMesh(
    [0, 0, -0.25, 2, 0, -0.25, 0, 2, -0.25, 0, 0, 0.25, 2, 0, 0.25, 0, 2, 0.25],
    [2, 1, 0, 3, 4, 5, 0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4, 2, 0, 3, 2, 3, 5]
  )
}
export function frontierHole(): MeshGeometry {
  const outline = [
    [-3, -3],
    [3, -3],
    [3, 3],
    [1, 3],
    [1, -1],
    [-1, -1],
    [-1, 3],
    [-3, 3]
  ]
  const positions = [-0.25, 0.25].flatMap((z) =>
      outline.flatMap(([x, y]) => [x, y, z])
    ),
    indices: number[] = []
  for (const [a, b, c] of [
    [0, 1, 4],
    [1, 2, 3],
    [1, 3, 4],
    [0, 4, 5],
    [0, 5, 7],
    [5, 6, 7]
  ])
    indices.push(c, b, a, a + 8, b + 8, c + 8)
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8
    indices.push(i, j, j + 8, i, j + 8, i + 8)
  }
  return sourceMesh(positions, indices)
}
