import { expect, it, vi } from 'vitest'
import { WalkingConstrainedCycleOwner } from '../../domain/walking-constrained-kinematics'
import {
  cycleFixture,
  exact,
  fraction,
  over
} from '../../domain/__tests__/walking-constrained-kinematics-test-fixtures'
import {
  add,
  interval,
  multiply,
  roundFraction
} from '../../domain/scalar-arithmetic'
import { prepareWalkingSelectedActionSweep } from '../walking-local-action-workspace'

it('walking local action sweeps actual selected vertices with one whole interval owner bound', () => {
  const { source, raw } = cycleFixture({
    sourceProfile: 'solid-articulation/2'
  })
  const owner = new WalkingConstrainedCycleOwner()
  const cycle = owner.prepare(source, raw)
  const motion = owner.prepareSelectedChainMotion(cycle, {
    format: 'walking-selected-chain-root-motion/1',
    cycle,
    phase: 0,
    at: fraction(1n, 2n),
    chainId: 'right-front',
    targetAbduction: over(cycle.recipe.alpha, exact(2))
  })
  const bounds = vi.spyOn(owner, 'boundSelectedChainMotion')
  const points = vi.spyOn(owner, 'evaluateSelectedChainMotion')
  const sweep = prepareWalkingSelectedActionSweep(owner, motion)
  expect(bounds).toHaveBeenCalledExactlyOnceWith(motion, {
    low: exact(0),
    high: exact(1)
  })
  expect(points).not.toHaveBeenCalled()
  expect(sweep.motion).toBe(motion)
  expect(sweep.work.boundCalls).toBe(1)
  expect(sweep.work.partVisits).toBe(motion.parts.length)
  expect(sweep.work.sourceVertices).toBe(
    motion.parts.reduce((n, p) => n + p.part.shape.positions.length / 3, 0)
  )
  expect(sweep.work.otherBodyVisits).toBe(0)
  for (const parameter of [exact(0), fraction(1n, 2n), exact(1)]) {
    const point = owner.evaluateSelectedChainMotion(motion, parameter)
    for (const entry of point.parts) {
      const vertices = entry.part.shape.positions
      const outward = (value: { numerator: bigint; denominator: bigint }) => ({
        low: roundFraction(value.numerator, value.denominator, 'down'),
        high: roundFraction(value.numerator, value.denominator, 'up')
      })
      const matrix = entry.exact.matrix.map((row) => row.map(outward))
      const origin = entry.exact.origin.map(outward)
      for (let offset = 0; offset < vertices.length; offset += 3) {
        for (let axis = 0; axis < 3; axis++) {
          const value = matrix[axis].reduce(
            (sum, coefficient, k) =>
              add(sum, multiply(coefficient, interval(vertices[offset + k]))),
            origin[axis]
          )
          expect(sweep.bounds.min[axis]).toBeLessThanOrEqual(value.low)
          expect(sweep.bounds.max[axis]).toBeGreaterThanOrEqual(value.high)
        }
      }
    }
  }
  owner.dispose()
  expect(() => prepareWalkingSelectedActionSweep(owner, motion)).toThrow()
})
