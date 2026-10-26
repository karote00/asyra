import { expect, it, vi } from 'vitest'
import { tree, createTreeVariants } from '../vegetation'
import * as geometry from '../geometry'
import { requiredSpecValue } from '../specification'
const branchIds = ['B1', 'B5', 'B9', 'B11', 'B16', 'B18', 'B19']
function tip(parts: ReturnType<typeof tree>, id: string) {
  const p = requiredSpecValue(
    parts.find((p) => p.id === id),
    id
  ).mesh.positions
  // The final cap vertex is the analytic branch endpoint.
  return p.slice(-3)
}
it.each([606, 1607, 2608, 3609, 4610, 5611])(
  'grows seed %i into all four quadrants with comparable width and depth',
  (seed) => {
    const parts = tree({ seed }),
      tips = branchIds.map((id) => tip(parts, id))
    const extent = [0, 1].map(
      (axis) =>
        Math.max(...tips.map((p) => p[axis])) -
        Math.min(...tips.map((p) => p[axis]))
    )
    expect(Math.min(...extent) / Math.max(...extent)).toBeGreaterThan(0.75)
    expect(new Set(tips.map(([x, y]) => `${x > 0}:${y > 0}`)).size).toBe(4)
    for (const axis of [0, 1]) {
      expect(Math.min(...tips.map((p) => p[axis]))).toBeLessThan(-0.45)
      expect(Math.max(...tips.map((p) => p[axis]))).toBeGreaterThan(0.45)
    }
  }
)
it('varies relative branch shape reproducibly rather than rotating copies', () => {
  const make = (seed: number) => tree({ seed })
  const signature = (parts: ReturnType<typeof tree>) => {
    const tips = branchIds.map((id) => tip(parts, id))
    return tips
      .slice(1)
      .map((p) => Math.hypot(...p.map((n, k) => n - tips[0][k])))
  }
  expect(make(606)).toEqual(make(606))
  expect(signature(make(606))).not.toEqual(signature(make(1607)))
})

it('keeps every secondary root on its actual parent curve, including B7 on B11', async () => {
  const { default: spec } =
    await import('../../../../../assets/asyra-office/models/street/tree-construction-spec.json')
  for (const seed of [606, 1607, 2608]) {
    const parts = tree({ seed })
    for (const branch of spec.branches.entries.filter((b) => b.level === 2)) {
      const parent = requiredSpecValue(
          parts.find((p) => p.id === branch.parent),
          branch.parent
        ).mesh.positions,
        child = requiredSpecValue(
          parts.find((p) => p.id === branch.id),
          branch.id
        ).mesh.positions,
        t = branch.parentT ?? 0
      const start = parent.slice(-6, -3),
        end = parent.slice(-3)
      const middle = [0, 1, 2].map(
        (axis) =>
          Array.from(
            { length: 10 },
            (_, i) => parent[(12 * 11 + i) * 3 + axis]
          ).reduce((a, b) => a + b, 0) / 10
      )
      for (let k = 0; k < 3; k++) {
        const control = 2 * middle[k] - (start[k] + end[k]) / 2
        const expected =
          (1 - t) ** 2 * start[k] + 2 * (1 - t) * t * control + t * t * end[k]
        expect(child[child.length - 6 + k]).toBeCloseTo(expected, 8)
      }
    }
  }
})

it('constructs one leaf prototype pair for a batch of different tree seeds', () => {
  const curveSamples = vi.spyOn(geometry, 'bezier')
  try {
    const batch = createTreeVariants([606, 1607, 2608, 3609, 4610, 5611])
    expect(curveSamples).toHaveBeenCalledTimes(8)
    const leaves = batch.map((parts) =>
      requiredSpecValue(
        parts.find((p) => p.instances),
        'leaves'
      )
    )
    for (const p of leaves) {
      expect(p.mesh).toBe(leaves[0].mesh)
      expect(p.distant?.mesh).toBe(leaves[0].distant?.mesh)
    }
  } finally {
    curveSamples.mockRestore()
  }
})

it('grows additional branches with a variable count across scene seeds', () => {
  const counts = [606, 1607, 2608, 3609, 4610, 5611].map(
    (seed) => tree({ seed }).filter((p) => p.material === 'wood').length - 1
  )
  expect(Math.min(...counts)).toBeGreaterThanOrEqual(35)
  expect(Math.max(...counts)).toBeLessThanOrEqual(55)
  expect(new Set(counts).size).toBeGreaterThanOrEqual(3)
})
