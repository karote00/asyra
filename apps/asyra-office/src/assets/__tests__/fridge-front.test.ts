import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import { catalogAsset } from '../catalog'
it('uses the owner-approved small upper freezer and larger lower refrigerator', () => {
  const parts = catalogAsset('pantry-fridge')
  const span = (id: string) => {
    const p = requiredSpecValue(
      parts.find((p) => p.id === id),
      id
    )
    const z = p.mesh.positions.filter((_, i) => i % 3 === 2)
    return [Math.min(...z), Math.max(...z)]
  }
  const lower = span('lower-door'),
    upper = span('upper-door')
  expect(upper[1] - upper[0]).toBeCloseTo(0.428, 6)
  expect(lower[1] - lower[0]).toBeCloseTo(0.64, 6)
  for (const [door, bounds] of [
    ['upper', upper],
    ['lower', lower]
  ] as const) {
    for (const suffix of ['handle', 'handle-mount--1', 'handle-mount-1']) {
      const handle = span(`${door}-${suffix}`)
      expect(handle[0]).toBeGreaterThan(bounds[0])
      expect(handle[1]).toBeLessThan(bounds[1])
    }
  }
  expect(upper[0] - lower[1]).toBeCloseTo(0.012, 6)
  expect(lower[0]).toBeCloseTo(0.06, 6)
  expect(upper[1]).toBeCloseTo(1.14, 6)
})
