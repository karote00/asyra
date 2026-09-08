import { describe, expect, it } from 'vitest'
import {
  BED_WIDTHS,
  SITE,
  createLayout,
  createStructure,
  roofPoint
} from '../greenhouse'

describe('four connected greenhouses in source metres', () => {
  it('closes each exact 7m span with 6.3m cultivation and two 0.35m margins', () => {
    expect(BED_WIDTHS.reduce((a, b) => a + b, 0)).toBeCloseTo(6.3)
    const layout = createLayout()
    expect(layout.totalWidth).toBe(28)
    expect(layout.strips.filter((s) => s.kind === 'soil')).toHaveLength(16)
    expect(layout.strips.filter((s) => s.kind === 'drain')).toHaveLength(12)
    for (let bay = 0; bay < 4; bay++) {
      const strips = layout.strips.filter((s) => s.bay === bay)
      expect(strips.map((s) => s.width)).toEqual([
        0.9, 0.3, 1.8, 0.3, 1.8, 0.3, 0.9
      ])
      expect(strips[0].x).toBeCloseTo(bay * 7 + 0.35)
      expect(strips[6].x + strips[6].width).toBeCloseTo((bay + 1) * 7 - 0.35)
      for (let i = 1; i < strips.length; i++)
        expect(strips[i].x).toBeCloseTo(strips[i - 1].x + strips[i - 1].width)
    }
    expect(layout.passages).toEqual([
      { x: 6.65, width: 0.7 },
      { x: 13.65, width: 0.7 },
      { x: 20.65, width: 0.7 }
    ])
  })
  it('calculates circular crowns at 5m, common shoulders at 3m and closed 50m ends', () => {
    for (let bay = 0; bay < 4; bay++) {
      expect(roofPoint(bay, 0.5, 50)).toEqual([bay * 7 + 3.5, 5, 50])
      expect(roofPoint(bay, 0, 0)[0]).toBeCloseTo(bay * 7)
      expect(roofPoint(bay, 1, 0)[0]).toBeCloseTo((bay + 1) * 7)
      expect(roofPoint(bay, 0, 0)[1]).toBeCloseTo(3)
    }
    const members = createStructure()
    expect(members.filter((m) => m.kind === 'arch')).toHaveLength(204)
    expect(members.filter((m) => m.kind === 'post')).toHaveLength(55)
    expect(members.filter((m) => m.kind === 'tie')).toHaveLength(44)
    expect(SITE.drainDepth).toBeGreaterThan(0)
    const identities = members.map((m) => JSON.stringify(m.points))
    expect(new Set(identities).size).toBe(identities.length)
  })
})
