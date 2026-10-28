import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import { preparationSink, cutPreparationOpening } from '../preparation-sink'
import { box, type Mesh } from '../geometry'
import { meshBounds } from '../../scene/room-furnishing-helpers'

// Vertical intersections inspect real triangles rather than dark pixels or bounding boxes.
function heights(mesh: Mesh, x: number, y: number) {
  const result: number[] = []
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = mesh.indices
      .slice(i, i + 3)
      .map((n) => mesh.positions.slice(n * 3, n * 3 + 3))
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    if (Math.abs(d) < 1e-10) continue
    const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / d
    const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / d
    if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6)
      result.push(u * a[2] + v * b[2] + (1 - u - v) * c[2])
  }
  return result
}
it('has a recessed metal floor, raised rim and thin right-side fitting without a divider', () => {
  const p = preparationSink()
  const bowl = requiredSpecValue(
    p.find((p) => p.id === 'basin'),
    'preparation basin'
  )
  expect(Math.max(...heights(bowl.mesh, 0, 0))).toBeCloseTo(-0.077, 5)
  expect(Math.max(...heights(bowl.mesh, 0.225, 0))).toBeCloseTo(0.01, 5)
  const faucet = meshBounds(p.filter((p) => p.id === 'faucet'))
  expect(faucet[0][0]).toBeGreaterThan(0.15)
  expect(faucet[1][1] - faucet[1][0]).toBeLessThanOrEqual(0.013)
  expect(faucet[2][1]).toBeGreaterThan(0.16)
  expect(p.some((p) => p.id === 'upright')).toBe(false)
})
it('opens the worktop and upper cabinet rather than drawing a basin over solid wood', () => {
  const top = cutPreparationOpening(
    box([1.59, 0.625, 0.035], 0.008),
    [0.39, -0.1225, 0.0175]
  )
  expect(heights(top, 0.39, -0.1225)).toEqual([])
  expect(Math.max(...heights(top, -0.5, 0))).toBeCloseTo(0.0175, 5)
  const body = cutPreparationOpening(
    box([1.55, 0.585, 0.745], 0.009),
    [0.39, -0.1225, 0.4025]
  )
  expect(Math.max(...heights(body, 0.39, -0.1225))).toBeLessThan(0.32)
})
