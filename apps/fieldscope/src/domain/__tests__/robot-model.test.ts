import { expect, it } from 'vitest'
import { createRobotModel } from '../robot-model'
import { DEFAULT_ROBOT } from '../robot-configuration'

it.each([
  DEFAULT_ROBOT,
  { ...DEFAULT_ROBOT, width: 0.35, length: 0.6, height: 0.8 },
  { ...DEFAULT_ROBOT, width: 2, length: 3, height: 3 }
])('keeps the concept within the admitted stowed envelope %j', (definition) => {
  const parts = createRobotModel(definition)
  expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length)
  for (const part of parts) {
    const { positions, indices } = part.shape
    expect(indices.every((i) => i >= 0 && i < positions.length / 3)).toBe(true)
    for (let i = 0; i < positions.length; i += 3) {
      expect(Math.abs(positions[i])).toBeLessThanOrEqual(
        definition.width / 2 + 0.00001
      )
      expect(positions[i + 1]).toBeGreaterThanOrEqual(-0.00001)
      expect(positions[i + 1]).toBeLessThanOrEqual(definition.height + 0.00001)
      expect(Math.abs(positions[i + 2])).toBeLessThanOrEqual(
        definition.length / 2 + 0.00001
      )
    }
  }
})
it('provides an open retained crate, separate camera lenses and crop-specific pads', () => {
  const parts = createRobotModel(DEFAULT_ROBOT)
  expect(parts.some((p) => p.id === 'crate-top')).toBe(false)
  expect(parts.filter((p) => p.id.startsWith('crate-latch'))).toHaveLength(2)
  expect(parts.filter((p) => p.id.startsWith('camera-lens'))).toHaveLength(2)
  const tomato = createRobotModel({ ...DEFAULT_ROBOT, tool: 'tomato' })
  expect(tomato.find((p) => p.id === 'pad-1')?.shape).not.toEqual(
    parts.find((p) => p.id === 'pad-1')?.shape
  )
})
