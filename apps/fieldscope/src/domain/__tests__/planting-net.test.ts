import { expect, it } from 'vitest'
import { createSupportAssembly } from '../planting-supports'
import { createPlantingNet } from '../planting-net'

it('spans 24 longitudinal rows from 45cm to extended tips with a tie at every pole', () => {
  const assembly = createSupportAssembly()
  const net = createPlantingNet(assembly)
  expect(net.ties).toHaveLength(1992)
  expect(net.strands).toHaveLength(24 * (329 + 19))
  expect(new Set(net.strands.map((strand) => strand.points[0][0])).size).toBe(
    24
  )
  for (const strand of net.strands) {
    expect(strand.points[0][0]).toBe(strand.points[1][0])
    for (const point of strand.points) {
      expect(point[1]).toBeGreaterThanOrEqual(0.45)
      expect(point[1]).toBeLessThanOrEqual(3.15)
      expect(point[2]).toBeGreaterThanOrEqual(0.25)
      expect(point[2]).toBeLessThanOrEqual(49.45)
    }
    if (strand.points[0][2] === strand.points[1][2]) {
      expect(strand.points[0][1]).toBeCloseTo(0.45)
      expect(strand.points[1][1]).toBeCloseTo(3.15)
    }
  }
  net.ties.forEach((tie, index) => {
    const tube = assembly.tubes[index]
    expect(tie.center[0]).toBe(tube.x)
    expect(tie.center[2]).toBe(tube.z)
    expect(tie.center[1] + 0.002).toBeCloseTo(tube.points[1][1])
    expect(tube.points[1][1] - tube.points[0][1]).toBeCloseTo(3.3)
  })
})
