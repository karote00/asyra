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

it('keeps the pantry shrub dense, bounded and below its small-crown triangle budget', () => {
  const parts = planter(1, 0xa57a49, 606, 'shrub')
  expect(
    parts.filter((p) => p.id.startsWith('leaf-')).length
  ).toBeGreaterThanOrEqual(88)
  expect(parts.reduce((n, p) => n + p.mesh.indices.length / 3, 0)).toBeLessThan(
    22000
  )
  const positions = parts.flatMap((p) => p.mesh.positions)
  for (const [axis, limit] of [
    [0, 0.14],
    [1, 0.14]
  ] as const)
    expect(
      Math.max(...positions.filter((_, i) => i % 3 === axis).map(Math.abs))
    ).toBeLessThan(limit)
  expect(Math.max(...positions.filter((_, i) => i % 3 === 2))).toBeLessThan(
    0.33
  )
})

it('uses narrow curved lanceolate blades for the pantry without changing the pot', () => {
  const parts = planter(1, 0xe8dbc3, 606, 'lanceolate')
  const leaves = parts.filter((p) => p.id.startsWith('leaf-'))
  expect(leaves.length).toBeGreaterThanOrEqual(10)
  expect(parts.find((p) => p.id === 'pot')).toEqual(
    planter(1).find((p) => p.id === 'pot')
  )
  for (const leaf of leaves) {
    // Midrib at t=0.5 must arch above the straight root-to-tip chord.
    const root = leaf.mesh.positions.slice(0, 3)
    const middle = (1 + 11 * 9 + 4) * 3
    const tip = (1 + 23 * 9) * 3
    expect(
      leaf.mesh.positions[middle + 2] -
        (root[2] + leaf.mesh.positions[tip + 2]) / 2
    ).toBeGreaterThan(0.012)
  }
})

it('retains small distinct shrub blades on unequal branch reaches instead of a spherical skin', () => {
  const parts = planter(1, 0x956a48, 606, 'shrub')
  const leaves = parts.filter((p) => p.id.startsWith('leaf-'))
  expect(leaves.length).toBeGreaterThanOrEqual(80)
  expect(
    parts.reduce((sum, p) => sum + p.mesh.indices.length / 3, 0)
  ).toBeLessThan(18000)
  const roots = leaves.map(({ mesh }) =>
    Math.hypot(mesh.positions[0], mesh.positions[1])
  )
  // Middle-height leaves must occupy several depths, not a single crown shell.
  const middleRoots = leaves
    .filter(({ mesh }) => mesh.positions[2] > 0.2 && mesh.positions[2] < 0.24)
    .map(({ mesh }) => Math.hypot(mesh.positions[0], mesh.positions[1]))
  expect(Math.max(...middleRoots) - Math.min(...middleRoots)).toBeGreaterThan(
    0.025
  )
  expect(Math.min(...roots)).toBeLessThan(0.035)
  for (const leaf of leaves) {
    const positions = leaf.mesh.positions
    const point = (n: number) => positions.slice(n * 3, n * 3 + 3)
    const distance = (a: number[], b: number[]) =>
      Math.hypot(...a.map((v, i) => v - b[i]))
    const midrow = 1 + 1 * 5
    expect(distance(point(midrow), point(midrow + 4))).toBeLessThan(0.03)
    const tip = 1 + 3 * 5
    expect(distance(point(0), point(tip))).toBeLessThan(0.05)
    // Geometry stays a finite, thin, closed blade rather than a solid ball.
    const upper = point(midrow + 2),
      lower = point(2 + 3 * 5 + midrow + 2)
    expect(distance(upper, lower)).toBeCloseTo(0.0006, 6)
    expect(positions.every(Number.isFinite)).toBe(true)
  }
})

it('grows shrub leaves along connected sprigs with short petioles rather than long radial spokes', () => {
  const parts = planter(1, 0x956a48, 606, 'shrub')
  expect(parts.filter((p) => p.id.startsWith('sprig-'))).toHaveLength(9)
  for (const p of parts.filter((p) => p.id.startsWith('petiole-'))) {
    const xs = p.mesh.positions.filter((_, i) => i % 3 === 0)
    const ys = p.mesh.positions.filter((_, i) => i % 3 === 1)
    expect(
      Math.hypot(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys)
      )
    ).toBeLessThan(0.015)
  }
})

it('builds a hollow square pot with rooted broad blades and an arched outer tier', () => {
  const parts = planter(1, 0xa4714e, 606, 'broadleaf-square')
  const leaves = parts.filter((p) => p.id.startsWith('leaf-'))
  expect(leaves.length).toBeGreaterThanOrEqual(10)
  const heights = leaves.map((p) =>
    Math.max(...p.mesh.positions.filter((_, i) => i % 3 === 2))
  )
  expect(Math.max(...heights)).toBeGreaterThan(0.75)
  expect(Math.min(...heights)).toBeLessThan(0.5)
  for (const leaf of leaves) {
    const p = leaf.mesh.positions
    const middle = 1 + 11 * 9
    expect(
      Math.hypot(
        ...p
          .slice(middle * 3, middle * 3 + 3)
          .map((n, i) => n - p[(middle + 8) * 3 + i])
      )
    ).toBeGreaterThan(0.095)
    expect(p[2]).toBeGreaterThan(0.224)
    expect(p[2]).toBeLessThan(0.27)
  }
  const vessel = requiredSpecValue(
    parts.find((p) => p.id === 'pot'),
    'square vessel'
  )
  // There is no lid spanning the opening. Rim vertices retain both inside and outside contours.
  const rim = vessel.mesh.positions.flatMap((v, i, all) =>
    i % 3 === 0 && all[i + 2] > 0.248
      ? [Math.max(Math.abs(v), Math.abs(all[i + 1]))]
      : []
  )
  expect(Math.min(...rim)).toBeGreaterThan(0.14)
  expect(Math.min(...rim)).toBeLessThan(0.15)
  expect(Math.max(...rim)).toBeGreaterThan(0.158)
  for (const part of parts) {
    expect(part.mesh.positions.every(Number.isFinite)).toBe(true)
    for (let i = 0; i < part.mesh.indices.length; i += 3) {
      const [a, b, c] = part.mesh.indices
        .slice(i, i + 3)
        .map((id) => part.mesh.positions.slice(id * 3, id * 3 + 3))
      const u = b.map((v, k) => v - a[k]),
        v = c.map((v, k) => v - a[k])
      expect(
        Math.hypot(
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0]
        )
      ).toBeGreaterThan(1e-14)
    }
  }
})

it('differentiates the shelf foliage tiers while retaining a smooth open cylinder', () => {
  const configurations = [
    ['cylindrical-upright', 701, 0.27, 0.34],
    ['cylindrical-arching', 702, 0.34, 0.4],
    ['cylindrical-rosette', 703, 0.16, 0.19],
    ['cylindrical-sprout', 704, 0.19, 0.23],
    ['cylindrical-sprout', 705, 0.19, 0.23]
  ] as const
  for (const [form, seed, minHeight, maxHeight] of configurations) {
    const parts = planter(1, 0xeee5d7, seed, form)
    const leaves = parts.filter((p) => p.id.startsWith('leaf-'))
    const height = Math.max(
      ...leaves.flatMap((p) => p.mesh.positions.filter((_, i) => i % 3 === 2))
    )
    expect(height, form).toBeGreaterThan(minHeight)
    expect(height, form).toBeLessThan(maxHeight)
    const pot = requiredSpecValue(
      parts.find((p) => p.id === 'pot'),
      'cylinder'
    )
    const rim = pot.mesh.positions.flatMap((v, i, p) =>
      i % 3 === 0 && p[i + 2] > 0.112 ? [Math.hypot(v, p[i + 1])] : []
    )
    expect(Math.min(...rim), 'open inner rim').toBeGreaterThan(0.057)
    expect(Math.min(...rim)).toBeLessThan(0.061)
    expect(Math.max(...rim)).toBeCloseTo(0.065, 3)
    for (const part of parts) {
      expect(part.mesh.positions.every(Number.isFinite)).toBe(true)
      for (let i = 0; i < part.mesh.indices.length; i += 3) {
        const [a, b, c] = part.mesh.indices
          .slice(i, i + 3)
          .map((index) => part.mesh.positions.slice(index * 3, index * 3 + 3))
        const u = b.map((v, k) => v - a[k]),
          v = c.map((n, k) => n - a[k])
        expect(
          Math.hypot(
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
          )
        ).toBeGreaterThan(1e-14)
      }
    }
  }
})
