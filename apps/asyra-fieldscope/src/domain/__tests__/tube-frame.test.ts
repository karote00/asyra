import { expect, it } from 'vitest'
import { TriangleBuilder } from '../mesh'
import type { Point3 } from '../greenhouse'
import { createSupportAssembly, springClipWire } from '../planting-supports'

function checkRings(
  points: Point3[],
  diameter: number,
  minimumAlignment: number
) {
  const mesh = new TriangleBuilder()
  mesh.tube({ points, diameter })
  const radius = diameter / 2
  for (let i = 0; i < points.length; i++) {
    for (let side = 0; side < 8; side++) {
      const radial = points[i].map(
        (v, k) => mesh.positions[(i * 8 + side) * 3 + k] - v
      )
      expect(Math.hypot(...radial)).toBeCloseTo(radius, 10)
      if (!i) continue
      const previous = points[i - 1].map(
        (v, k) => mesh.positions[((i - 1) * 8 + side) * 3 + k] - v
      )
      const alignment =
        radial.reduce((sum, v, k) => sum + v * previous[k], 0) /
        (radius * radius)
      expect(
        alignment,
        `ring ${i}, side ${side} must not reverse across a bend`
      ).toBeGreaterThan(minimumAlignment)
    }
  }
}

it('keeps the circular section continuous when a smooth bend crosses the vertical reference threshold', () => {
  const points: Point3[] = Array.from({ length: 61 }, (_, i) => {
    const angle = (i * Math.PI) / 120
    return [Math.sin(angle), -Math.cos(angle), 0]
  })
  checkRings(points, 0.0025, 0.99)
})

it('keeps every installed spring clip orientation continuous around both arms and hooks', () => {
  const seen = new Set<string>()
  for (const clip of createSupportAssembly().clips) {
    const key = JSON.stringify([
      clip.firstAxis,
      clip.secondAxis,
      clip.normal,
      clip.firstDiameter,
      clip.secondDiameter
    ])
    if (seen.has(key)) continue
    seen.add(key)
    const wire = springClipWire(clip)
    checkRings(wire.points, wire.diameter, 0)
  }
  expect(seen.size).toBeGreaterThan(1)
})
