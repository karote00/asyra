import { expect, it } from 'vitest'
import { box, emptyMesh, append } from '../geometry'
import { subtractSolids } from '../solid-subtraction'

it('retains the source solid identity for every boolean output triangle', () => {
  const cutter = emptyMesh()
  append(cutter, box([1, 1, 2]), [0.5, 0, 0.5])
  const result = subtractSolids(box([2, 2, 2]), [cutter])
  expect(result.triangleRegions).toHaveLength(result.indices.length / 3)
  expect(new Set(result.triangleRegions)).toEqual(new Set([0, 1]))
  for (const [index, region] of result.triangleRegions.entries()) {
    const points = result.indices
      .slice(index * 3, index * 3 + 3)
      .map((id) => result.positions.slice(id * 3, id * 3 + 3))
    const extent = region === 0 ? 1 : 0.5
    const onOriginalFace = [0, 1, 2].some((axis) =>
      [-1, 1].some((sign) =>
        points.every((p) => Math.abs(p[axis] - sign * extent) < 1e-8)
      )
    )
    if (region === 0) expect(onOriginalFace).toBe(true)
    else
      expect(
        points.every(
          ([x, y, z]) =>
            x >= -1e-8 &&
            x <= 1 + 1e-8 &&
            Math.abs(y) <= 0.5 + 1e-8 &&
            z >= -0.5 - 1e-8
        )
      ).toBe(true)
  }
})
