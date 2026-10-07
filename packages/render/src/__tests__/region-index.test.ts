import { describe, expect, it } from 'vitest'
import { RegionIndex } from '../queries/region-index.js'

const intersects = (
  a: { x: number; y: number; width: number; height: number },
  b: typeof a
) =>
  a.x <= b.x + b.width &&
  a.x + a.width >= b.x &&
  a.y <= b.y + b.height &&
  a.y + a.height >= b.y

describe('multilevel region index', () => {
  it('matches brute force across negative coordinates, boundary contact and mixed extents', () => {
    const index = new RegionIndex<number>()
    const entries = Array.from({ length: 3000 }, (_, id) => ({
      id,
      bounds: {
        x: (id % 100) * 40 - 2000,
        y: Math.floor(id / 100) * 50 - 750,
        width: id % 23 === 0 ? 10000 : 20,
        height: id % 19 === 0 ? 2000 : 10
      }
    }))
    for (const { id, bounds } of entries) index.set(id, bounds)
    for (let i = 0; i < 100; i++) {
      const region = {
        x: i * 37 - 2100,
        y: i * 13 - 800,
        width: i % 3 ? 70 : 0,
        height: 40
      }
      expect(index.query(region).values.sort((a, b) => a - b)).toEqual(
        entries.filter((e) => intersects(e.bounds, region)).map((e) => e.id)
      )
    }
    index.set(1, { x: 0, y: 0, width: 0, height: 0 })
    index.delete(2)
    expect(index.query({ x: 0, y: 0, width: 0, height: 0 }).values).toContain(1)
    expect(
      index.query({ x: -1e6, y: -1e6, width: 2e6, height: 2e6 }).values
    ).not.toContain(2)
  })
  it('visits local candidates rather than all 20000 entries on repeated queries', () => {
    const index = new RegionIndex<number>()
    for (let i = 0; i < 20000; i++)
      index.set(i, { x: i * 50, y: 0, width: 10, height: 10 })
    for (let i = 0; i < 10; i++) {
      const result = index.query({ x: 5000, y: 0, width: 10, height: 10 })
      expect(result.values).toEqual([100])
      expect(result.checkedEntries).toBeLessThan(5)
      expect(result.visitedCells).toBeLessThan(17)
    }
    index.set(100, { x: -100, y: 0, width: 10, height: 10 })
    expect(
      index.query({ x: 5000, y: 0, width: 10, height: 10 }).values
    ).toEqual([])
  })
  it('rejects invalid bounds without losing the previous entry', () => {
    const index = new RegionIndex<string>()
    index.set('a', { x: 0, y: 0, width: 1, height: 1 })
    expect(() => index.set('a', { x: 0, y: 0, width: -1, height: 1 })).toThrow()
    expect(() => index.query({ x: NaN, y: 0, width: 1, height: 1 })).toThrow()
    expect(index.query({ x: 0, y: 0, width: 1, height: 1 }).values).toEqual([
      'a'
    ])
  })
})
