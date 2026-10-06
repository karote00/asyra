import { describe, expect, it } from 'vitest'
import {
  calculateZoomFit,
  projectWorkspacePointToViewport,
  rectFromPoints
} from '../viewport.js'

describe('rectFromPoints', () => {
  it('normalizes positive and negative pointer directions into one Rect', () => {
    expect(rectFromPoints({ x: 10, y: 20 }, { x: 35, y: 55 })).toEqual({
      x: 10,
      y: 20,
      width: 25,
      height: 35
    })
    expect(rectFromPoints({ x: 35, y: 55 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 25,
      height: 35
    })
  })
})

describe('projectWorkspacePointToViewport', () => {
  it('applies viewport scale before translation', () => {
    expect(
      projectWorkspacePointToViewport({ x: 10, y: 20 }, { x: 5, y: -5 }, 2)
    ).toEqual({ x: 25, y: 35 })
  })
})

describe('calculateZoomFit', () => {
  it.each([
    { name: 'portrait', width: 100, height: 1000 },
    { name: 'landscape', width: 1000, height: 100 },
    { name: 'square', width: 200, height: 200 },
    { name: 'vertical line', width: 0, height: 1000 },
    { name: 'horizontal line', width: 1000, height: 0 }
  ])(
    'centers $name content inside an offset viewport with padding',
    ({ width, height }) => {
      const elementsBounds = {
        minX: -350,
        minY: 120,
        maxX: -350 + width,
        maxY: 120 + height
      }
      const viewportBounds = { minX: 240, minY: 48, maxX: 1440, maxY: 848 }
      const { scale, position } = calculateZoomFit({
        elementsBounds,
        viewportBounds,
        padding: 20
      })
      const left = elementsBounds.minX * scale + position.x
      const right = elementsBounds.maxX * scale + position.x
      const top = elementsBounds.minY * scale + position.y
      const bottom = elementsBounds.maxY * scale + position.y

      expect((left + right) / 2).toBeCloseTo(840)
      expect((top + bottom) / 2).toBeCloseTo(448)
      expect(left).toBeGreaterThanOrEqual(260)
      expect(right).toBeLessThanOrEqual(1420)
      expect(top).toBeGreaterThanOrEqual(68)
      expect(bottom).toBeLessThanOrEqual(828)
      expect(Math.min(left - 240, top - 48)).toBeCloseTo(20)
    }
  )
})
