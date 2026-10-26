import { expect, it } from 'vitest'
import { awning } from '../awning'

it('joins the inclined roof to a vertical valance and keeps fractional strip widths', () => {
  const parts = awning({ count: 5.3 })
  expect(parts).toHaveLength(6)
  const xyz = parts.flatMap((p) => p.mesh.positions)
  const axis = (i: number) => xyz.filter((_, k) => k % 3 === i)
  expect(Math.max(...axis(0)) - Math.min(...axis(0))).toBeCloseTo(1.325, 10)
  expect(Math.min(...axis(1))).toBeCloseTo(-0.8, 10)
  expect(Math.max(...axis(2))).toBeCloseTo(0.42, 10)
  const lastX = parts[5].mesh.positions.filter((_, i) => i % 3 === 0)
  expect(Math.max(...lastX) - Math.min(...lastX)).toBeCloseTo(0.075, 10)
  expect(parts.reduce((sum, p) => sum + p.mesh.indices.length / 3, 0)).toBe(80)
  expect(parts[5].color).toBe(parts[1].color)
})
it('keeps the front valance vertical when the canopy angle changes', () => {
  const parts = awning({
    count: 1,
    angle: 40,
    length: 1,
    valance: 0.2,
    mode: 'solid',
    palette: [0xaabbcc]
  })
  const p = parts[0].mesh.positions
  expect(parts[0].color).toBe(0xaabbcc)
  expect(p.filter((_, i) => i % 3 === 2)).toContain(0.2)
  expect(Math.max(...p.filter((_, i) => i % 3 === 2))).toBeCloseTo(
    0.2 + Math.sin((40 * Math.PI) / 180),
    10
  )
  expect(() => awning({ angle: 90 })).toThrow()
  expect(() => awning({ count: 2, width: 1 })).toThrow()
})
