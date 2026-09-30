import { expect, it } from 'vitest'
import { interval } from '../../../domain/interval'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { buildMeshIndex, type MeshNode, type MeshTriangle } from '../mesh-index'
import { meshMembership } from '../mesh-membership'
import { componentIndex } from './component-index-fixture'

function source(): MeshGeometry {
  const positions: number[] = [],
    indices: number[] = []
  for (const [x, r] of [
    [0, 2],
    [0, 1 / 2],
    [7 / 4, 1 / 2]
  ]) {
    const offset = positions.length / 3
    for (const [a, b, c] of [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1]
    ])
      positions.push(x + a * r, b * r, c * r)
    for (const index of [
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2,
      3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7
    ])
      indices.push(offset + index)
  }
  return {
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] },
    positions,
    indices
  }
}
function inspect(root: MeshNode) {
  const seen = new Set<MeshNode>(),
    triangles: MeshTriangle[] = []
  const visit = (node: MeshNode): Set<number> => {
    if (seen.has(node)) throw new Error('Repeated source node')
    seen.add(node)
    if (!node.children) {
      expect(node.triangles.length).toBeLessThanOrEqual(4)
      triangles.push(...node.triangles)
      return new Set(node.triangles.map((triangle) => triangle.component))
    }
    const [a, b] = node.children
    expect(node.bounds).toEqual(
      a.bounds.map((axis, i) => [
        Math.min(axis[0], b.bounds[i][0]),
        Math.max(axis[1], b.bounds[i][1])
      ])
    )
    return new Set([...visit(a), ...visit(b)])
  }
  expect(visit(root).size).toBe(3)
  return triangles
}
it('retains each admitted nested or overlapping component as a complete source subtree', () => {
  const original = buildMeshIndex(source(), () => undefined),
    fingerprint = JSON.stringify(original)
  let work = 0
  const grouped = componentIndex(original, () => work++)
  expect(grouped.representatives).toBe(original.representatives)
  expect(grouped.componentCount).toBe(3)
  const before = inspect(original.root),
    after = inspect(grouped.root)
  expect(new Set(after)).toEqual(new Set(before))
  expect(after.length).toBe(before.length)
  const roots: MeshNode[] = []
  const collect = (node: MeshNode): MeshTriangle[] =>
    node.children ? node.children.flatMap(collect) : [...node.triangles]
  const locate = (node: MeshNode) => {
    const items = collect(node)
    if (new Set(items.map((triangle) => triangle.component)).size === 1) {
      roots.push(node)
      return
    }
    if (!node.children) throw new Error('Mixed component leaf')
    node.children.forEach(locate)
  }
  locate(grouped.root)
  expect(roots.map((node) => collect(node).length)).toEqual([12, 12, 12])
  expect(JSON.stringify(original)).toBe(fingerprint)
  let repeatedWork = 0
  expect(componentIndex(original, () => repeatedWork++)).toEqual(grouped)
  expect(repeatedWork).toBe(work)
  // 23 original node visits + 1 grouping chunk + 3*(7 nodes + 7 scans + 3 sorts)
  // + 5 component top visits + 2 top scans + 2 top sorts.
  expect(work).toBe(84)
  for (const [point, expected] of [
    [[0, 0, 0], 'inside'],
    [[3 / 2, 0, 0], 'inside'],
    [[5, 0, 0], 'outside'],
    [[0, 2, 0], 'unknown']
  ] as const) {
    const value = [
      interval(point[0]),
      interval(point[1]),
      interval(point[2])
    ] as const
    expect(meshMembership(value, original, () => undefined)).toBe(expected)
    expect(meshMembership(value, grouped, () => undefined)).toBe(expected)
  }
})
it('returns no partial index on cancellation and leaves original source intact', () => {
  const original = buildMeshIndex(source(), () => undefined),
    before = JSON.stringify(original)
  let calls = 0
  expect(() =>
    componentIndex(original, () => {
      if (++calls === 5) throw new Error('cancel')
    })
  ).toThrow('cancel')
  expect(JSON.stringify(original)).toBe(before)
})
