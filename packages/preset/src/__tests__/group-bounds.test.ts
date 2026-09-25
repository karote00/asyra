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
