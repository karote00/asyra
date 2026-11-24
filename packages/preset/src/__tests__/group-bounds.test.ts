// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { deriveGroupBounds } from '../group-bounds.js'

describe('pure Group bounds without browser runtime', () => {
  it('unions normalized and reversed rectangles without modifying input', () => {
    const rectangles = Object.freeze([
      Object.freeze({ x: 10, y: 20, width: -15, height: 10 }),
      Object.freeze({ x: 0, y: -5, width: 30, height: 12 })
    ])

    expect(deriveGroupBounds(rectangles)).toEqual({
      x: -5,
      y: -5,
      width: 35,
      height: 35
    })
  })
  it('returns zero bounds for an empty container', () => {
    expect(deriveGroupBounds([])).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })
  it('rejects nonfinite geometry', () => {
    expect(() =>
      deriveGroupBounds([{ x: 0, y: NaN, width: 5, height: 5 }])
    ).toThrow(/finite/)
  })
})

it('unions exact rotated oval extents without changing its local origin', () => {
  const oval = {
    type: 'oval',
    x: 10,
    y: 20,
    width: 20,
    height: 10,
    rotation: Math.PI / 4
  }
  const bounds = deriveGroupBounds([oval])
  const cx = 10 + 5 / Math.sqrt(2),
    cy = 20 + 15 / Math.sqrt(2),
    radius = Math.sqrt(62.5)

  expect(bounds.x).toBeCloseTo(cx - radius, 10)
  expect(bounds.y).toBeCloseTo(cy - radius, 10)
  expect(bounds.width).toBeCloseTo(2 * radius, 10)
  expect(bounds.height).toBeCloseTo(2 * radius, 10)
  expect(oval.x).toBe(10)
})

it('projects an insertion through transformed ancestors once without entering sibling subtrees', async () => {
  const { projectGroupInsertion } = await import('../group-bounds.js')
  const children = new Map([
    ['inner', ['a']],
    ['outer', ['inner', 'b']]
  ])
  const parents = new Map([
    ['inner', 'outer'],
    ['outer', 'frame']
  ])
  const geometry = new Map([
    ['inner', { type: 'group', x: 5, y: 0, width: 10, height: 10, scaleX: 2 }],
    ['a', { type: 'rect', x: 0, y: 0, width: 10, height: 10 }],
    ['outer', { type: 'group', x: 100, y: 20, width: 45, height: 10 }],
    ['b', { type: 'group', x: 35, y: 0, width: 10, height: 10 }]
  ])
  const reads: string[] = []
  const plan = projectGroupInsertion(
    'inner',
    [{ x: -10, y: -4, width: 3, height: 2 }],
    (id) => {
      const ids = children.get(id)

      if (!ids) {
        return
      }

      reads.push(id)

      return { children: ids, parentId: parents.get(id) }
    },
    (id) => {
      const g = geometry.get(id)

      if (!g) {
        throw Error('Unexpected subtree read ' + id)
      }

      return g
    }
  )

  expect(reads).toEqual(['inner', 'outer'])
  expect(plan.offset).toEqual({ x: -10, y: -4 })
  const updates = Object.fromEntries(
    plan.updates.map((update) => [update.elementId, update.values])
  )

  expect(updates).toEqual({
    a: { x: 10, y: 4 },
    inner: { x: 0, width: 20, height: 14 },
    outer: { x: 85, y: 16, width: 60, height: 14 },
    b: { x: 50, y: 4 }
  })
  // Old a and b and the new rectangle stay at their authored workspace points.
  expect(updates.outer.x + 2 * updates.a.x).toBe(105)
  expect(updates.outer.x + updates.b.x).toBe(135)
})

it('projects the rendered bounds of rotated groups and skewed vector siblings', () => {
  const rotated = deriveGroupBounds([
    { type: 'group', x: 5, y: 10, width: 12, height: 4, rotation: Math.PI / 2 }
  ])

  expect(rotated.x).toBeCloseTo(1)
  expect(rotated.width).toBeCloseTo(4)
  expect(rotated.height).toBeCloseTo(12)
  const skewed = deriveGroupBounds([
    { type: 'vector', x: 0, y: 0, width: 10, height: 20, skewX: Math.PI / 6 }
  ])

  expect(skewed.width).toBeCloseTo(20)
  expect(skewed.height).toBeCloseTo(Math.sqrt(3) * 10)
})
