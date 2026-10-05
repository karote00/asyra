import { describe, expect, it } from 'vitest'
import {
  INITIAL_LAYOUT,
  readLayout,
  validLayout,
  WaypointMotion
} from '../layout'
describe('Office layout and presentation separation', () => {
  it('admits the initial room and freezes caller-owned furniture', () => {
    const input = structuredClone(INITIAL_LAYOUT)
    const layout = readLayout(input)
    expect(layout).toEqual(INITIAL_LAYOUT)
    expect(layout.furniture).not.toBe(input.furniture)
    expect(Object.isFrozen(layout.furniture[0])).toBe(true)
  })
  it('rejects invalid, overlapping, off-grid and outside placements', () => {
    for (const update of [{ x: 20 }, { x: 0.1 }, { x: NaN }])
      expect(
        validLayout({
          ...INITIAL_LAYOUT,
          furniture: [{ ...INITIAL_LAYOUT.furniture[0], ...update }]
        })
      ).toBe(false)
    expect(
      validLayout({
        ...INITIAL_LAYOUT,
        furniture: [
          INITIAL_LAYOUT.furniture[0],
          { ...INITIAL_LAYOUT.furniture[0], id: 'another' }
        ]
      })
    ).toBe(false)
    expect(validLayout(null)).toBe(false)
  })
  it('advances a waypoint without modifying durable layout and clamps long frames', () => {
    const before = JSON.stringify(INITIAL_LAYOUT)
    const motion = new WaypointMotion()
    motion.setTarget([5, 0, 0])
    expect(motion.advance(1)).toEqual([2.5, 0, 0])
    expect(motion.advance(100)).toEqual([5, 0, 0])
    expect(motion.moving).toBe(false)
    expect(JSON.stringify(INITIAL_LAYOUT)).toBe(before)
  })
  it('honors reduced motion and negative elapsed time', () => {
    const motion = new WaypointMotion()
    motion.setTarget([5, 0, 0])
    expect(motion.advance(-1)).toEqual([0, 0, 0])
    expect(motion.advance(0, true)).toEqual([5, 0, 0])
  })
})
