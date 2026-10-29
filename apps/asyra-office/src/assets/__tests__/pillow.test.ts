import { expect, it } from 'vitest'
import { throwPillow } from '../pillow'
it('preserves the concave side outline and inflated centre, with a bounded distant version', () => {
  const p = throwPillow(),
    v = p.mesh.positions
  const x = v.filter((_, i) => i % 3 === 0),
    y = v.filter((_, i) => i % 3 === 1),
    z = v.filter((_, i) => i % 3 === 2)
  expect(Math.max(...x) - Math.min(...x)).toBeCloseTo(0.32, 8)
  expect(Math.max(...y) - Math.min(...y)).toBeCloseTo(0.11, 8)
  expect(Math.max(...z) - Math.min(...z)).toBeCloseTo(0.32, 8)
  const seam = Array.from({ length: v.length / 3 }, (_, i) =>
    v.slice(i * 3, i * 3 + 3)
  ).filter((p) => Math.abs(p[1]) < 1e-10 && Math.abs(p[2] - 0.16) < 1e-10)
  expect(Math.max(...seam.map((p) => p[0]))).toBeCloseTo(0.151, 8)
  expect(p.mesh.indices.length / 3).toBe(6240)
  expect(p.distant?.mesh.indices.length).toBe(960 * 3)
})
