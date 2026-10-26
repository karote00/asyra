import { expect, it } from 'vitest'
import structure from '../reference/office-structure.json'
import evidence from '../reference/lower-room-measurements.json'

it('gives both lower rooms the reference floor-depth allocation', () => {
  const { rear, partition, front } = evidence.eastFloorRun
  const axis = rear.map((n, k) => n - front[k])
  const ratio =
    partition.reduce((sum, n, k) => sum + (n - front[k]) * axis[k], 0) /
    axis.reduce((sum, n) => sum + n * n, 0)
  const { frontInnerY, rearInnerY, loungeRearInnerY, workRearInnerY } =
    evidence.baseline
  const depth = (rearInnerY - frontInnerY) * ratio
  const lounge = structure.walls.find((w) => w.id === 'lounge-divider')
  const work = structure.walls.find((w) => w.id === 'work-back-partition')
  if (!lounge || !work) throw new Error('Missing lower-room boundary')
  expect(lounge.cross - lounge.thickness / 2 - frontInnerY).toBeCloseTo(
    depth,
    6
  )
  expect(work.cross - work.thickness / 2 - frontInnerY).toBeCloseTo(
    depth + workRearInnerY - loungeRearInnerY,
    6
  )
  expect(structure.foundation.outline).toEqual([
    [-3.1, -2.51],
    [3.1, -2.51],
    [3.1, 2.782099517721014],
    [-3.1, 2.782099517721014]
  ])
  expect(new Set(Object.values(structure.floors))).toEqual(new Set([0.38]))
})
