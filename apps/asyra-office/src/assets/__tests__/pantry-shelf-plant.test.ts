import { expect, it } from 'vitest'
import { pantryShelfPlant, pantryShelfSucculent } from '../pantry-shelf-plant'
import { meshBounds } from '../../scene/room-furnishing-helpers'

it('includes raised pale-yellow blooms with petals, centers and soil-connected stems', () => {
  const parts = pantryShelfPlant()
  const petals = parts.filter((p) => p.id.startsWith('flower-petals-'))
  expect(petals.length).toBeGreaterThanOrEqual(3)
  const heights = new Set<number>()
  for (const p of petals) {
    const id = p.id.replace('flower-petals-', '')
    const center = parts.find((q) => q.id === `flower-center-${id}`)
    const stem = parts.find((q) => q.id === `flower-stem-${id}`)
    expect(center).toBeDefined()
    expect(stem).toBeDefined()
    if (!center || !stem) throw new Error('Missing flower structure')
    expect(p.color).toBe(0xead48c)
    const bounds = meshBounds([p])
    expect(bounds[2][0]).toBeGreaterThan(0.16)
    heights.add(Math.round(bounds[2][1] * 100))
    expect(meshBounds([stem])[2][0]).toBeLessThanOrEqual(0.099)
    for (const mesh of [p.mesh, center.mesh, stem.mesh]) {
      expect(mesh.positions.every(Number.isFinite)).toBe(true)
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const triangle = mesh.indices.slice(i, i + 3).map((n) =>
          mesh.positions
            .slice(n * 3, n * 3 + 3)
            .map((v) => Number(v.toFixed(7)))
            .join(',')
        )
        expect(new Set(triangle).size).toBe(3)
      }
    }
  }
  expect(heights.size).toBeGreaterThanOrEqual(3)
})

it('constructs the fifth shelf object as a blue pot with brown edging, fleshy leaves and a dark bud', () => {
  const parts = pantryShelfSucculent()
  const find = (id: string) => {
    const p = parts.find((p) => p.id === id)
    if (!p) throw new Error('Missing succulent part: ' + id)
    return p
  }
  expect(find('pot').color).toBe(0x596b7a)
  expect(find('pot-rim').color).toBe(0x89654d)
  expect(parts.every((p) => (p.opacity ?? 1) === 1)).toBe(true)
  expect(parts.some((p) => ['lid', 'contents'].includes(p.id))).toBe(false)
  expect(parts.filter((p) => p.id.startsWith('succulent-leaf-'))).toHaveLength(
    12
  )
  expect(meshBounds([find('bud-stem')])[2][0]).toBeLessThan(
    meshBounds([find('soil')])[2][1]
  )
  expect(find('flower-bud').color).toBe(0x4d302c)
  const bounds = meshBounds(parts)
  expect(bounds[2][0]).toBeCloseTo(0, 6)
  expect(bounds[2][1]).toBeLessThanOrEqual(0.303)
  for (const part of parts) {
    expect(part.mesh.positions.every(Number.isFinite)).toBe(true)
    const edges = new Map<string, number>()
    for (let i = 0; i < part.mesh.indices.length; i += 3) {
      const vertices = part.mesh.indices.slice(i, i + 3).map((j) =>
        part.mesh.positions
          .slice(j * 3, j * 3 + 3)
          .map((v) => Number(v.toFixed(7)))
          .join(',')
      )
      expect(new Set(vertices).size).toBe(3)
      for (let j = 0; j < 3; j++) {
        const edge = [vertices[j], vertices[(j + 1) % 3]].sort().join('|')
        edges.set(edge, (edges.get(edge) ?? 0) + 1)
      }
    }
    expect(
      [...edges.values()].every((n) => n === 2),
      part.id
    ).toBe(true)
  }
})
