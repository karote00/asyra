import { useReferenceSceneFixture } from './fixtures/reference-scene'
import { beforeAll, expect, it } from 'vitest'
import { meshBounds } from '../room-furnishing-helpers'
import { catalogAsset, placeParts, type AssetPart } from '../../assets/catalog'
import { preparationSink } from '../../assets/preparation-sink'
import { pantryVessel } from '../../assets/pantry-vessels'
import { requiredSpecValue } from '../../assets/specification'

const parts = new Map<string, AssetPart[]>()
const referenceSceneFixture = useReferenceSceneFixture()
beforeAll(() => {
  const scene = referenceSceneFixture()
  let offset = 0
  for (const a of scene.assemblies) {
    parts.set(a.id, scene.parts.slice(offset, offset + a.parts.length))
    offset += a.parts.length
  }
})
const get = (id: string) => requiredSpecValue(parts.get(id), id)
const bounds = (id: string, region?: string) =>
  meshBounds(get(id).filter((p) => !region || p.id === region))

it('recesses the unchanged refrigerator in the rear corner with doors facing the aisle', () => {
  const b = bounds('fridge')
  expect(b[0][0]).toBeCloseTo(0.2276932207, 6)
  expect(b[0][1] - b[0][0]).toBeCloseTo(0.702, 6)
  expect(b[1][0]).toBeCloseTo(2.8201495177, 6)
  expect(b[1][1]).toBeCloseTo(3.5720995177, 6)
  expect(bounds('fridge', 'upper-door')[1][0]).toBeLessThan(
    bounds('fridge', 'cabinet')[1][0]
  )
  for (const id of ['pantry-fridge-plant', 'pantry-fridge-night-light']) {
    const item = bounds(id)
    expect(item[2][0]).toBeCloseTo(b[2][1], 5)
    expect(item[0][0]).toBeGreaterThan(0.1776932207)
    expect(item[1][1]).toBeLessThan(3.6220995177)
  }
})
it('keeps the dispenser outside the complete conservative fridge opening sector', () => {
  const b = bounds('water-dispenser')
  expect(b[0][0]).toBeCloseTo(0.1896932207, 6)
  expect(b[1][1]).toBeCloseTo(2.12, 6)
  const f = bounds('fridge')
  const clearance = Math.hypot(f[0][1] - b[0][1], f[1][0] - b[1][1]) - 0.752
  expect(clearance).toBeGreaterThan(0.05)
})
it('preserves the complete sink geometry at original scale and translates it to the right edge', () => {
  const expected = placeParts(
    catalogAsset('sink-cabinet'),
    [2.3775, 3.309599517721014, 0.38],
    0,
    [1.25, 1.25, 1.25]
  )
  for (const p of expected) {
    const actual = requiredSpecValue(
      get('sink').find((a) => a.id === p.id),
      p.id
    )
    expect(actual.mesh).toEqual(p.mesh)
  }
  expect(bounds('sink', 'countertop')[0][1]).toBeCloseTo(2.94, 6)
})
it('uses one cabinet door and a complete wood top without the stored preparation basin', () => {
  const top = bounds('coffee-counter-top')
  expect(top[0][0]).toBeCloseTo(0.9696932207, 6)
  expect(top[0][1]).toBeCloseTo(1.8075, 6)
  expect(
    [...parts.keys()].filter((id) => id.startsWith('coffee-counter-door'))
  ).toHaveLength(1)
  expect(parts.has('pantry-preparation-sink')).toBe(false)
  expect(preparationSink().length).toBeGreaterThan(0)
  // A closed rounded box has no recessed vertices in the planar top's interior.
  const mesh = get('coffee-counter-top')[0].mesh
  const upper = mesh.positions.filter((_, i) => i % 3 === 2)
  expect(Math.max(...upper)).toBeCloseTo(1.18, 6)
  expect(Math.min(...upper)).toBeCloseTo(1.145, 6)
  for (const fx of [0.2, 0.5, 0.8]) {
    for (const fy of [0.2, 0.5, 0.8]) {
      const x = top[0][0] + fx * (top[0][1] - top[0][0])
      const y = top[1][0] + fy * (top[1][1] - top[1][0])
      let covered = false
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const [a, b, c] = mesh.indices
          .slice(i, i + 3)
          .map((n) => mesh.positions.slice(n * 3, n * 3 + 3))
        if (![a, b, c].every((p) => Math.abs(p[2] - 1.18) < 1e-6)) {
          continue
        }
        const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if (Math.abs(d) < 1e-10) {
          continue
        }
        const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / d
        const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / d
        if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6) {
          covered = true
        }
      }
      expect(covered, 'solid top at ' + fx + ',' + fy).toBe(true)
    }
  }
})
it('retains five shelf objects without shrinking them or deleting stored asset factories', () => {
  expect(parts.has('pantry-canister-1')).toBe(false)
  expect(parts.has('pantry-canister-4')).toBe(false)
  expect(pantryVessel('shelf-cream-jar').length).toBeGreaterThan(0)
  expect(pantryVessel('shelf-amber-jar').length).toBeGreaterThan(0)
  const shelf = bounds('pantry-shelf')
  expect(shelf[0][1] - shelf[0][0]).toBeCloseTo(1.05, 6)
  let previous = shelf[0][0]
  for (const id of [
    'pantry-shelf-plant',
    'pantry-canister-0',
    'pantry-canister-2',
    'pantry-canister-3',
    'pantry-canister-5'
  ]) {
    const b = bounds(id)
    expect(b[0][0] - previous).toBeGreaterThanOrEqual(0.03 - 1e-8)
    expect(b[0][1]).toBeLessThan(shelf[0][1])
    expect(b[2][0]).toBeCloseTo(shelf[2][1], 5)
    previous = b[0][1]
  }
})
it('staggered full smallware envelopes stay on the worktop with no pairwise overlap', () => {
  const top = bounds('coffee-counter-top')
  const objects = [
    'pantry-preparation-plant',
    'pantry-counter-pitcher',
    'pantry-counter-tumbler',
    'pantry-counter-bottle'
  ].map((id) => bounds(id))
  for (const b of objects) {
    for (const a of [0, 1]) {
      expect(b[a][0]).toBeGreaterThan(top[a][0])
      expect(b[a][1]).toBeLessThan(top[a][1])
    }
  }
  expect(objects[2][1][1]).toBeLessThan(objects[1][1][0])
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      expect(
        [0, 1].some(
          (a) =>
            objects[i][a][1] <= objects[j][a][0] ||
            objects[j][a][1] <= objects[i][a][0]
        )
      ).toBe(true)
    }
  }
})
