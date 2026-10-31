import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import { leaf, tree } from '../vegetation'
import { spatialInstance } from '../instances'
it('retains all 3264 individually sized leaves while sharing one near and one distant prototype', () => {
  const parts = tree().filter((p) => p.instances)
  expect(
    parts.reduce(
      (n, p) => n + requiredSpecValue(p.instances, 'p.instances').length,
      0
    )
  ).toBe(3264)
  expect(parts[0].mesh).toBe(parts[1].mesh)
  expect(requiredSpecValue(parts[0].distant, 'parts[0].distant').mesh).toBe(
    requiredSpecValue(parts[1].distant, 'parts[1].distant').mesh
  )
  expect(leaf().indices.length / 3).toBe(256)
  expect(leaf('far').indices.length / 3).toBe(32)
  for (const p of parts) {
    for (const instance of requiredSpecValue(p.instances, 'p.instances')) {
      expect(Math.hypot(...spatialInstance(instance).rotation)).toBeCloseTo(
        1,
        6
      )
      expect(instance.scale).toBeGreaterThanOrEqual(0.65)
      expect(instance.scale).toBeLessThanOrEqual(2.2)
    }
  }
})
it('bounds distant leaf silhouette deviation plus bulge below the declared geometric error', () => {
  const near = leaf(),
    far = leaf('far'),
    boundary = Array.from({ length: 8 }, (_, i) =>
      far.positions.slice((1 + i) * 3, (2 + i) * 3)
    )
  let maximum = 0
  for (let i = 0; i < 32; i++) {
    const p = near.positions.slice((33 + i) * 3, (34 + i) * 3)
    const nearest = Math.min(
      ...boundary.map((a, j) => {
        const b = boundary[(j + 1) % 8],
          dx = b[0] - a[0],
          dy = b[1] - a[1],
          t = Math.max(
            0,
            Math.min(
              1,
              ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
            )
          )
        return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
      })
    )
    maximum = Math.max(maximum, Math.hypot(nearest, 0.003))
  }
  expect(maximum).toBeLessThan(0.01)
})

it('keeps leaf rim vertices separate from the upper and lower face normals', () => {
  const mesh = leaf()
  const faces = new Set(mesh.indices.slice(0, 192 * 3))
  const rim = new Set(mesh.indices.slice(192 * 3))
  expect([...rim].every((index) => !faces.has(index))).toBe(true)
})
