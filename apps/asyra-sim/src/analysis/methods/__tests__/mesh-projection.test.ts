import { expect, it, vi } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { Bounds } from '../mesh-index'
import { projectedBoundsGap } from '../mesh-projection'
import { MeshWorkLimit } from '../original-mesh-query'

const ops = poseOperations(intervalAlgebra)
const a: Bounds = [
  [-1 / 8, 1 / 8],
  [-1 / 8, 1 / 8],
  [-1 / 8, 1 / 8]
]
const b: Bounds = [
  [-1 / 16, 1 / 16],
  [-1 / 16, 1 / 16],
  [-1 / 16, 1 / 16]
]
const rotation = [0, 0, 0.6, 0.8] as const
const left = ops.fromPose({ ...IDENTITY_POSE, rotation })
const right = ops.fromPose({ rotation, position: [-0.2112, 0.0616, 0] })

it('charges every projected direction including unsuccessful attempts and charges no repeated world direction', () => {
  const check = vi.fn()
  expect(projectedBoundsGap(a, left, b, right, 0.02, check)).toBeGreaterThan(
    0.02
  )
  expect(check).toHaveBeenCalledTimes(2)
  check.mockClear()
  expect(projectedBoundsGap(a, left, b, right, 0.04, check)).toBe(0)
  expect(check).toHaveBeenCalledTimes(4)
  check.mockClear()
  const identity = ops.fromPose(IDENTITY_POSE)
  expect(projectedBoundsGap(a, identity, b, identity, 0.02, check)).toBe(0)
  expect(check).not.toHaveBeenCalled()
})

it('honors cancellation and exact projected-work exhaustion before producing a certificate', () => {
  const cancelled = vi.fn(() => {
    throw new Error('cancelled')
  })
  expect(() => projectedBoundsGap(a, left, b, right, 0.02, cancelled)).toThrow(
    'cancelled'
  )
  expect(cancelled).toHaveBeenCalledTimes(1)
  let work = 0
  expect(() =>
    projectedBoundsGap(a, left, b, right, 0.02, () => {
      if (++work > 1) throw new MeshWorkLimit('work')
    })
  ).toThrow(MeshWorkLimit)
  expect(work).toBe(2)
})

it('retains no source, pose or threshold result between current queries', () => {
  const query = (source: Bounds, pose: typeof right, threshold: number) =>
    projectedBoundsGap(a, left, source, pose, threshold, () => undefined)
  const first = query(b, right, 0.02)
  expect(first).toBeGreaterThan(0.02)
  expect(query(b, right, 0.04)).toBe(0)
  expect(query(b, left, 0.02)).toBe(0)
  const enlarged: Bounds = [
    [-1, 1],
    [-1, 1],
    [-1, 1]
  ]
  expect(query(enlarged, right, 0.02)).toBe(0)
  expect(query(b, right, 0.02)).toBe(first)
  expect(
    projectedBoundsGap(b, right, a, left, 0.02, () => undefined)
  ).toBeCloseTo(first, 12)
})
