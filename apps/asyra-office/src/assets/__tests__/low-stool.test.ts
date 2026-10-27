import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import { lowStool } from '../low-stool'
it('joins four square legs to one closed cushion exterior at both detail levels', () => {
  const parts = lowStool()
  for (const p of parts)
    expect(
      requiredSpecValue(p.distant, 'distant representation').maxError
    ).toBeGreaterThan(0)
  expect(parts.map((p) => p.id)).toEqual([
    'cushion',
    'leg-0-0',
    'leg-0-1',
    'leg-1-0',
    'leg-1-1'
  ])
  for (const detail of ['mesh', 'distant'] as const) {
    const edges = new Map<string, number>(),
      extrema = [
        [Infinity, -Infinity],
        [Infinity, -Infinity],
        [Infinity, -Infinity]
      ]
    let triangles = 0
    for (const p of parts) {
      const m =
        detail === 'mesh'
          ? p.mesh
          : requiredSpecValue(p.distant, 'distant representation').mesh
      for (let i = 0; i < m.positions.length; i++) {
        const a = i % 3
        extrema[a][0] = Math.min(extrema[a][0], m.positions[i])
        extrema[a][1] = Math.max(extrema[a][1], m.positions[i])
      }
      for (let i = 0; i < m.indices.length; i += 3) {
        triangles++
        const vertices = m.indices.slice(i, i + 3).map((j) =>
          m.positions
            .slice(j * 3, j * 3 + 3)
            .map((v) => v.toFixed(8))
            .join(',')
        )
        for (let k = 0; k < 3; k++) {
          const key = [vertices[k], vertices[(k + 1) % 3]].sort().join('|')
          edges.set(key, (edges.get(key) ?? 0) + 1)
        }
      }
    }
    expect([...edges.values()].every((n) => n === 2)).toBe(true)
    expect(triangles).toBeLessThanOrEqual(detail === 'mesh' ? 1000 : 550)
    for (const [axis, expected] of [
      [0, [-0.18, 0.18]],
      [1, [-0.18, 0.18]],
      [2, [0, 0.3]]
    ] as const)
      for (const end of [0, 1])
        expect(extrema[axis][end]).toBeCloseTo(expected[end], 8)
  }
})
