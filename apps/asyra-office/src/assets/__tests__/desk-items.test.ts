import { expect, it } from 'vitest'
import { laptop, mug } from '../furnishings'

it('retains six keyboard rows, one spacebar, the hinge and four support pads', () => {
  const parts = laptop()
  expect(
    parts.filter((p) => p.id.startsWith('key-') || p.id === 'spacebar')
  ).toHaveLength(77)
  expect(parts.filter((p) => p.id.startsWith('underside-pad-'))).toHaveLength(4)
  expect(parts.some((p) => p.id === 'hinge')).toBe(true)
})
it('keeps the source mug empty with a rounded lip and a separately requested drink', () => {
  const empty = mug(),
    filled = mug(undefined, true)
  expect(empty.some((p) => p.id === 'coffee')).toBe(false)
  expect(filled.some((p) => p.id === 'coffee')).toBe(true)
  const cup = empty.find((p) => p.id === 'cup')
  if (!cup) throw new Error('Missing cup')
  const heights = cup.mesh.positions.filter((_, i) => i % 3 === 2)
  expect(
    heights.filter((z) => Math.abs(z - 0.09) < 1e-8).length
  ).toBeGreaterThanOrEqual(128)
  expect(cup.distant).toBeDefined()
})
