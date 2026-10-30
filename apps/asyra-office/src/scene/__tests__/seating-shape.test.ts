import { beforeAll, expect, it } from 'vitest'
import { composeOfficeSeating } from '../office-seating'
import type { AssetPart } from '../../assets/catalog'
import type { Vec } from '../../assets/geometry'

const rendered = new Map<string, { parts: readonly AssetPart[]; scale: Vec }>()
beforeAll(() => {
  composeOfficeSeating({
    add(id, _asset, parts, _position, _rotation, scale) {
      if (!scale) {
        throw new Error('Missing explicit furniture scale')
      }
      rendered.set(id, { parts, scale })
    }
  })
})

// Dimensions are read from approved drawing labels, independently of scene JSON.
for (const [id, part, dimensions] of [
  ['desk', 'top', [1.2, 0.6, 0.04]],
  ['meeting-table', 'top', [0.68, 0.68, 0.035]],
  ['lounge-coffee-table', 'top', [0.62, 0.62, 0.035]]
] as const) {
  it(`preserves approved component proportions in the composed ${id}`, () => {
    const instance = rendered.get(id)
    const mesh = instance?.parts.find((p) => p.id === part)?.mesh
    if (!instance || !mesh) {
      throw new Error(`Missing ${id}/${part}`)
    }
    const lengths = [0, 1, 2].map((axis) => {
      const values = mesh.positions.filter((_, i) => i % 3 === axis)
      return (Math.max(...values) - Math.min(...values)) * instance.scale[axis]
    })
    for (const axis of [1, 2]) {
      expect(lengths[axis] / lengths[0]).toBeCloseTo(
        dimensions[axis] / dimensions[0],
        6
      )
    }
  })
}

it('omits rejected chairs instead of rendering substitutes', () => {
  expect([...rendered.keys()].sort()).toEqual([
    'desk',
    'lounge-coffee-table',
    'meeting-table'
  ])
})
