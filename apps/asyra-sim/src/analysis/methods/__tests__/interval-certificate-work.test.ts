import { afterEach, expect, it, vi } from 'vitest'
import * as kinematics from '../../../domain/kinematic-algebra'
import { runOriginalPartMethod } from '../original-part-method'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryContinuousPair, type PairQueryKernel } from '../continuous-query'
import type { DistanceEvidence } from '../convex-query'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())

it('does no further static source traversal after certifying the entire keyframe interval clear', async () => {
  const snapshot = await representativeSnapshot(0)
  const distance = vi.spyOn(OriginalMeshQuery.prototype, 'distance')
  const poses = vi.spyOn(kinematics, 'evaluatePairKinematics')
  const evidence = runOriginalPartMethod({
    ...snapshot,
    pairs: snapshot.pairs.slice(0, 1)
  })
  expect(evidence.coverage).toBe('complete')
  expect(evidence.pairs[0].evidence.leaves).toHaveLength(199)
  expect(
    evidence.pairs[0].evidence.leaves.every((leaf) => leaf.state === 'clear')
  ).toBe(true)
  expect(distance).toHaveBeenCalledTimes(199)
  expect(poses).toHaveBeenCalledTimes(398)
}, 20000)

const clearWitness: DistanceEvidence = {
  lower: 1,
  upper: 2,
  penetration: false,
  converged: false,
  iterations: 0,
  axis: [1, 0, 0],
  witnessA: [
    [0, 0],
    [0, 0],
    [0, 0]
  ],
  witnessB: [
    [2, 2],
    [0, 0],
    [0, 0]
  ]
}

async function scheduled(kernel: PairQueryKernel) {
  const snapshot = await representativeSnapshot(0)
  const pair = snapshot.pairs[0]
  return queryContinuousPair(
    {
      workcell: snapshot.workcell,
      trajectory: snapshot.trajectory,
      a: pair.a,
      b: pair.b,
      interval: [0, snapshot.trajectory.keyframes[1].time]
    },
    {
      threshold: 0.02,
      distanceTolerance: 1e-6,
      timeTolerance: 1e-4,
      maxIntervals: 1,
      maxIterations: 64
    },
    () => undefined,
    kernel
  )
}

it('keeps the non-opted-in kernel sample order unchanged', async () => {
  const order: string[] = []
  const result = await scheduled({
    distance: () => {
      order.push('distance')
      return clearWitness
    },
    lower: () => {
      order.push('lower')
      return 1
    },
    exhaustionReason: 'budget'
  })
  expect(order).toEqual(['distance', 'distance', 'distance', 'lower'])
  expect(result.coverage).toBe('complete')
})

it('keeps established first evidence but cannot claim clearance when early interval work exhausts', async () => {
  const distance = vi.fn(() => clearWitness)
  const result = await scheduled({
    certifyClearBeforeResampling: true,
    distance,
    lower: () => null,
    exhaustionReason: 'budget'
  })
  expect(distance).toHaveBeenCalledTimes(1)
  expect(result.coverage).toBe('partial')
  expect(result.leaves[0]).toMatchObject({
    lower: 0,
    upper: 2,
    witnessTime: 0,
    penetration: false,
    state: 'unresolved',
    reason: 'budget'
  })
})

it('continues to the later penetration witness after an unsuccessful interval certificate', async () => {
  const penetration = { ...clearWitness, lower: 0, upper: 0, penetration: true }
  const distance = vi
    .fn()
    .mockReturnValueOnce(clearWitness)
    .mockReturnValue(penetration)
  const lower = vi.fn(() => 0)
  const result = await scheduled({
    certifyClearBeforeResampling: true,
    distance,
    lower,
    exhaustionReason: 'budget'
  })
  expect(distance).toHaveBeenCalledTimes(2)
  expect(lower).toHaveBeenCalledTimes(2)
  expect(result.leaves[0]).toMatchObject({
    lower: 0,
    upper: 0,
    penetration: true,
    state: 'finding'
  })
})

it('preserves a first penetration witness even when the final interval query exhausts', async () => {
  const distance = vi.fn(() => ({
    ...clearWitness,
    lower: 0,
    upper: 0,
    penetration: true
  }))
  const lower = vi.fn(() => null)
  const result = await scheduled({
    certifyClearBeforeResampling: true,
    distance,
    lower,
    exhaustionReason: 'budget'
  })
  expect(distance).toHaveBeenCalledTimes(1)
  expect(lower).toHaveBeenCalledTimes(1)
  expect(result.leaves[0]).toMatchObject({
    lower: 0,
    upper: 0,
    penetration: true,
    state: 'finding',
    witnessTime: 0
  })
})
