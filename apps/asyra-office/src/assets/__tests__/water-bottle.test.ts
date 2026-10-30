import { expect, it } from 'vitest'
import { catalogAsset } from '../catalog'
import { requiredSpecValue } from '../specification'
import { bottleContents } from '../pantry-details'
import type { Mesh } from '../geometry'
import spec from '../../../../../assets/asyra-office/models/pantry/pantry-model-spec.json'

it('contains a separate static water volume with a level surface and an air space', () => {
  const water = requiredSpecValue(
    catalogAsset('water-dispenser').find((p) => p.id === 'bottle-water'),
    'static water'
  )
  const heights = water.mesh.positions.filter((_, i) => i % 3 === 2)
  const top = Math.max(...heights)
  expect(top).toBeGreaterThan(0.98)
  expect(top).toBeLessThan(1.04)
  expect(water.opacity).toBeGreaterThan(0)
  expect(water.opacity).toBeLessThan(1)
  const topTriangles = water.mesh.indices.filter(
    (_, i, indices) =>
      i % 3 === 0 &&
      [0, 1, 2].every(
        (j) =>
          Math.abs(water.mesh.positions[indices[i + j] * 3 + 2] - top) < 1e-6
      )
  )
  expect(topTriangles.length).toBeGreaterThanOrEqual(32)
  const source = requiredSpecValue(
    spec.modules
      .find((m) => m.moduleId === 'water-dispenser')
      ?.components.find((p) => p.partId === 'bottle'),
    'bottle profile'
  )
  if (!('profileZR' in source) || !source.profileZR || !('rings' in source)) {
    throw new Error('Missing bottle profile')
  }
  const volume = (mesh: Mesh) => {
    let sum = 0
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const [a, b, c] = mesh.indices
        .slice(i, i + 3)
        .map((index) => mesh.positions.slice(index * 3, index * 3 + 3))
      sum +=
        a[0] * (b[1] * c[2] - b[2] * c[1]) +
        a[1] * (b[2] * c[0] - b[0] * c[2]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])
    }
    return Math.abs(sum / 6)
  }
  const full = bottleContents(source.profileZR, source.rings, 1, 0.002)
  expect(volume(water.mesh) / volume(full)).toBeCloseTo(0.7, 5)
})

it('matches the owner photo with a long narrow inverted neck, broad shoulder and four barrel ribs', () => {
  const source = requiredSpecValue(
    spec.modules.find((m) => m.moduleId === 'water-dispenser'),
    'dispenser'
  )
  const bottle = requiredSpecValue(
    source.components.find((c) => c.partId === 'bottle'),
    'bottle'
  )
  expect('rings' in bottle && bottle.rings?.centresZ).toHaveLength(4)
  const mesh = requiredSpecValue(
    catalogAsset('water-dispenser').find((p) => p.id === 'bottle'),
    'bottle mesh'
  ).mesh
  const near = (z: number) => {
    const radii: number[] = []
    for (let i = 0; i < mesh.positions.length; i += 3) {
      if (Math.abs(mesh.positions[i + 2] - z) < 0.003) {
        radii.push(Math.hypot(mesh.positions[i], mesh.positions[i + 1]))
      }
    }
    expect(radii.length).toBeGreaterThan(0)
    return Math.max(...radii)
  }
  expect(near(0.7)).toBeLessThan(0.031)
  expect(near(0.76)).toBeGreaterThan(0.07)
  expect(near(0.76)).toBeLessThan(0.115)
  expect(near(0.94)).toBeCloseTo(0.123, 3)
  const radiusAt = (z: number) => {
    for (let i = 0; i < mesh.positions.length; i += 3) {
      if (Math.abs(mesh.positions[i + 2] - z) < 1e-6) {
        return Math.hypot(mesh.positions[i], mesh.positions[i + 1])
      }
    }
    throw new Error(`Missing shoulder section at ${z}`)
  }
  // The photo shoulder slopes continuously, without a ledge at its middle station.
  expect((radiusAt(0.76275) - radiusAt(0.756875)) / 0.005875).toBeGreaterThan(
    1.2
  )
  expect(
    catalogAsset('water-dispenser').some((p) => p.id === 'bottle-cap')
  ).toBe(true)
  expect(
    catalogAsset('water-dispenser').some((p) => /label|sticker/.test(p.id))
  ).toBe(false)
})
it('publishes translucent plastic and a separate opaque cap', () => {
  const bottle = requiredSpecValue(
    catalogAsset('water-dispenser').find((p) => p.id === 'bottle'),
    'bottle'
  )
  expect(bottle).toHaveProperty('opacity', 0.42)
  const cap = requiredSpecValue(
    catalogAsset('water-dispenser').find((p) => p.id === 'bottle-cap'),
    'cap'
  )
  expect(cap.opacity ?? 1).toBe(1)
})
