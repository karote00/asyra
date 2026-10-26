import { describe, it, expect } from 'vitest'
import { createWall } from '../wall'

const extents = (part: ReturnType<typeof createWall>[number]) => {
  const mesh = part.descriptor
  if (mesh.shape.kind !== 'triangles')
    throw new Error('Expected triangle output')
  const shape = mesh.shape
  return [0, 1, 2].map((axis) => {
    const values = shape.positions
      .filter((_, i) => i % 3 === axis)
      .map((n) => n + mesh.position[axis])
    return [Math.min(...values), Math.max(...values)]
  })
}

describe('approved wall geometry', () => {
  it('keeps both X ends flush and overhangs only thickness by 15 mm per side', () => {
    const [body, cap] = createWall().map(extents)
    expect(body).toEqual([
      [-0.5, 0.5],
      [0, 2.42],
      [-0.12, 0.12]
    ])
    expect(cap[0]).toEqual(body[0])
    expect(cap[1][0]).toBeCloseTo(2.42, 12)
    expect(cap[1][1]).toBeCloseTo(2.5, 12)
    expect(cap[2]).toEqual([-0.135, 0.135])
    expect(cap[2][1] - body[2][1]).toBeCloseTo(0.015, 12)
  })
  it('has closed outward-facing topology and exactly two upper arc segments', () => {
    for (const part of createWall()) {
      const mesh = part.descriptor
      if (mesh.shape.kind !== 'triangles') throw new Error('Expected triangles')
      const { positions: p, indices } = mesh.shape
      const edges = new Map<string, number>()
      const key = (i: number) =>
        p
          .slice(i * 3, i * 3 + 3)
          .map((n) => n.toFixed(10))
          .join(',')
      let volume = 0
      for (let i = 0; i < indices.length; i += 3) {
        const ids = indices.slice(i, i + 3)
        const [a, b, c] = ids.map((n) => p.slice(n * 3, n * 3 + 3))
        const normal = [
          (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
          (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
          (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        ]
        expect(Math.hypot(...normal)).toBeGreaterThan(0)
        expect(
          normal.reduce(
            (n, v, axis) => n + (v * (a[axis] + b[axis] + c[axis])) / 3,
            0
          )
        ).toBeGreaterThan(0)
        volume +=
          (a[0] * (b[1] * c[2] - b[2] * c[1]) +
            a[1] * (b[2] * c[0] - b[0] * c[2]) +
            a[2] * (b[0] * c[1] - b[1] * c[0])) /
          6
        for (let j = 0; j < 3; j++) {
          const edge = [key(ids[j]), key(ids[(j + 1) % 3])].sort().join('|')
          edges.set(edge, (edges.get(edge) ?? 0) + 1)
        }
      }
      expect([...edges.values()].every((count) => count === 2)).toBe(true)
      expect(volume).toBeGreaterThan(0)
      expect(indices.length / 3).toBe(32)
      const heights = [...new Set(p.filter((_, i) => i % 3 === 1))].sort(
        (a, b) => a - b
      )
      expect(heights.length).toBe(5) // bottom, end centre, arc start, midpoint, top
      expect(
        heights[heights.length - 1] - heights[heights.length - 3]
      ).toBeCloseTo(0.004, 12)
      expect(
        heights[heights.length - 1] - heights[heights.length - 2]
      ).toBeCloseTo(0.004 * (1 - Math.SQRT1_2), 12)
    }
  })
  it('scales the whole assembly once and updates metre UV repeats', () => {
    const original = createWall(),
      scaled = createWall({ size: [2, 0.81, 5] })
    const factors = [2, 2, 3]
    for (let i = 0; i < 2; i++) {
      const a = extents(original[i]),
        b = extents(scaled[i])
      for (let axis = 0; axis < 3; axis++)
        for (let end = 0; end < 2; end++)
          expect(b[axis][end]).toBeCloseTo(a[axis][end] * factors[axis], 12)
      const shape = scaled[i].descriptor.shape
      if (shape.kind !== 'triangles') throw new Error('Expected triangles')
      if (!shape.uvs) throw new Error('Missing UVs')
      // The first bottom triangle spans local X and thickness Y in metres.
      const first = shape.uvs.slice(0, 6)
      expect(
        Math.max(first[0], first[2], first[4]) -
          Math.min(first[0], first[2], first[4])
      ).toBeCloseTo(2, 12)
      expect(
        Math.max(first[1], first[3], first[5]) -
          Math.min(first[1], first[3], first[5])
      ).toBeCloseTo(i === 0 ? 0.72 : 0.81, 12)
    }
  })
  it('isolates appearance overrides and retains default colours', () => {
    const original = createWall(),
      changed = createWall({
        color: 0xabcdef,
        regions: { 'top-cap': { color: 0x223344 } }
      })
    expect(original.map((p) => p.descriptor.color)).toEqual([
      0xe4d9c4, 0xeee4d2
    ])
    expect(changed.map((p) => p.descriptor.color)).toEqual([0xabcdef, 0x223344])
    expect(createWall()[0].descriptor.color).toBe(0xe4d9c4)
  })
  it.each([
    [0, 0.27, 2.5],
    [-1, 0.27, 2.5],
    [1, NaN, 2.5],
    [1, 0.27, Infinity]
  ])('rejects invalid extents %j before output', (x, y, z) => {
    expect(() => createWall({ size: [x, y, z] })).toThrow('positive finite')
  })
  it('rejects invalid material values and retains a bounded distant replacement', () => {
    expect(() => createWall({ material: { roughness: 2 } })).toThrow()
    for (const part of createWall()) {
      expect(part.descriptor.distant?.maxError).toBe(0.004)
      expect(part.descriptor.distant?.shape.kind).toBe('triangles')
      expect(part.descriptor.distant?.pixelError).toBe(0.5)
    }
  })
})
