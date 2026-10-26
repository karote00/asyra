import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import { planter } from '../furnishings'
it('retains broad folded leaves and bounded plant height across natural arrangements', () => {
  const parts = planter()
  const leaves = parts.filter((p) => p.id.startsWith('leaf-'))
  expect(leaves.length).toBeGreaterThanOrEqual(6)
  expect(leaves.length).toBeLessThanOrEqual(9)
  const height = Math.max(
    ...parts.flatMap((p) => p.mesh.positions.filter((_, i) => i % 3 === 2))
  )
  expect(height).toBeGreaterThan(0.29)
  expect(height).toBeLessThan(0.37)
  for (const leaf of leaves) {
    const p = leaf.mesh.positions
    const row = 1 + 11 * 9
    expect(
      Math.hypot(
        ...p.slice(row * 3, row * 3 + 3).map((n, i) => n - p[(row + 8) * 3 + i])
      )
    ).toBeGreaterThan(0.025)
  }
})

it('keeps both leaf skins thin and caps without degenerate triangles', () => {
  for (const p of planter().filter((p) => p.id.startsWith('leaf-'))) {
    for (let i = 0; i < p.mesh.indices.length; i += 3) {
      const points = p.mesh.indices
        .slice(i, i + 3)
        .map((id) => p.mesh.positions.slice(id * 3, id * 3 + 3))
      const u = points[1].map((n, a) => n - points[0][a])
      const v = points[2].map((n, a) => n - points[0][a])
      const area = Math.hypot(
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
      )
      expect(area).toBeGreaterThan(1e-14)
    }
  }
})

it('grows distinct repeatable foliage without changing the vessel across seeds', () => {
  const seeds = [606, 1607, 2608, 3609, 4610, 5611]
  const variants = seeds.map((seed) => planter(1, 0xe8dbc3, seed))
  const leaves = variants.map((parts) =>
    parts.filter((p) => p.id.startsWith('leaf-'))
  )
  expect(new Set(leaves.map((p) => p.length)).size).toBeGreaterThanOrEqual(3)
  expect(
    new Set(leaves.map((p) => JSON.stringify(p.map((l) => l.mesh.positions))))
      .size
  ).toBe(seeds.length)
  expect(planter(1, 0xe8dbc3, seeds[0])).toEqual(variants[0])
  for (const parts of variants) {
    for (const id of ['pot', 'soil', 'stem'])
      expect(parts.find((p) => p.id === id)).toEqual(
        variants[0].find((p) => p.id === id)
      )
    const blades = parts.filter((p) => p.id.startsWith('leaf-'))
    expect(blades.length).toBeGreaterThanOrEqual(6)
    expect(blades.length).toBeLessThanOrEqual(9)
    const roots = blades.map((p) => p.mesh.positions[2])
    expect(new Set(roots.map((z) => Math.round(z * 100000))).size).toBe(
      blades.length
    )
    for (const blade of blades) {
      const petiole = requiredSpecValue(
        parts.find((p) => p.id === blade.id.replace('leaf-', 'petiole-')),
        'leaf petiole'
      )
      const end = petiole.mesh.positions.slice(-3)
      expect(blade.mesh.positions.slice(0, 2)).toEqual(end.slice(0, 2))
      expect(blade.mesh.positions[2] - end[2]).toBeCloseTo(0.0003, 8)
      expect(blade.mesh.positions.every(Number.isFinite)).toBe(true)
      const z = blade.mesh.positions.filter((_, i) => i % 3 === 2)
      expect(Math.min(...z)).toBeGreaterThan(0.12)
      expect(Math.max(...z)).toBeLessThan(0.37)
    }
  }
})

it.each([-1, 1.5, NaN, Infinity, 2 ** 32])(
  'rejects invalid seed %s',
  (seed) => {
    expect(() => planter(1, 0xe8dbc3, seed)).toThrow('unsigned 32-bit')
  }
)

it('builds soil-rooted rosettes without stretching the vessel or retaining a tall central stalk', () => {
  const parts = planter(1, 0xe8dbc3, 606, 'rosette')
  const stem = requiredSpecValue(
    parts.find((p) => p.id === 'stem'),
    'stem'
  )
  const z = stem.mesh.positions.filter((_, i) => i % 3 === 2)
  expect(Math.max(...z)).toBeLessThanOrEqual(0.135)
  const leaves = parts.filter((p) => p.id.startsWith('leaf-'))
  for (const leaf of leaves) {
    expect(leaf.mesh.positions[2]).toBeLessThan(0.14)
    expect(leaf.mesh.positions[2]).toBeGreaterThan(0.1)
  }
  expect(parts.find((p) => p.id === 'pot')).toEqual(
    planter(1, 0xe8dbc3, 606).find((p) => p.id === 'pot')
  )
  expect(planter(1, 0xe8dbc3, 606, 'rosette')).toEqual(parts)
})
