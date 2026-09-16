import { expect, it, vi } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import type { Body } from '../../../domain/workcell'
import {
  queryContinuousPair,
  type PairQuery,
  type PairQueryKernel
} from '../continuous-query'
import type { DistanceEvidence } from '../convex-query'
import type { StaticSampleOrigin } from '../fresh-static-sampler'

const evidence = (lower = 0, upper = 1): DistanceEvidence => ({
  lower,
  upper,
  penetration: false,
  converged: false,
  iterations: 1,
  axis: [1, 0, 0],
  witnessA: [
    [0, 0],
    [0, 0],
    [0, 0]
  ],
  witnessB: [
    [upper, upper],
    [0, 0],
    [0, 0]
  ]
})
const base: Body = {
  id: 'root',
  name: 'Root',
  parentId: null,
  role: 'robot',
  pose: IDENTITY_POSE,
  joint: { kind: 'fixed', axis: [1, 0, 0], value: 0, min: 0, max: 0 },
  visible: true,
  color: 0,
  colliders: []
}
const collider = {
  id: 'shape',
  geometry: { kind: 'sphere' as const, radius: 1 },
  pose: IDENTITY_POSE
}
const query: PairQuery = {
  workcell: {
    version: 1,
    robotRootId: 'root',
    bodies: [
      base,
      { ...base, id: 'a', parentId: 'root', colliders: [collider] },
      { ...base, id: 'b', parentId: 'root', colliders: [collider] }
    ]
  },
  trajectory: {
    version: 1,
    keyframes: [
      { time: 0, joints: {} },
      { time: 1, joints: {} }
    ]
  },
  a: { bodyId: 'a', colliderId: 'shape' },
  b: { bodyId: 'b', colliderId: 'shape' },
  interval: [0, 1]
}
const settings = {
  threshold: 0.1,
  distanceTolerance: 1e-6,
  timeTolerance: 0.3,
  maxIntervals: 10,
  maxIterations: 10
}

it('retains the previous completed witness when next fresh consumption exhausts', () => {
  let calls = 0
  const lower = vi.fn(() => 0)
  const result = queryContinuousPair(query, settings, () => undefined, {
    sample: () =>
      ++calls === 1 ? { evidence: evidence(0.02, 0.05), source: {} } : null,
    distance: () => evidence(),
    lower,
    exhaustionReason: 'test budget',
    certifyClearBeforeResampling: true
  })
  expect(calls).toBe(2)
  expect(lower).not.toHaveBeenCalled()
  expect(result.leaves[0]).toMatchObject({
    lower: 0,
    upper: 0.05,
    witnessTime: 0,
    state: 'finding'
  })
})

it('uses only consumed fresh samples in the current node and never captures for an inherited end', () => {
  const rows: { origin: StaticSampleOrigin; source: unknown }[] = []
  const handoff = vi.fn(() => true)
  const kernel: PairQueryKernel = {
    distance: () => {
      throw new Error('Unexpected unsampled distance')
    },
    sample: (_a, _b, origin, source) => {
      rows.push({ origin, source })
      return {
        evidence: evidence(),
        source: origin.capture ? origin.time : undefined
      }
    },
    lower: () => 0,
    handoffEvidence: handoff,
    exhaustionReason: 'test budget'
  }
  queryContinuousPair(query, settings, () => undefined, kernel)
  expect(
    rows
      .slice(0, 3)
      .map((row) => [row.origin.time, row.origin.capture, row.source])
  ).toEqual([
    [0, true, undefined],
    [0.5, true, 0],
    [1, false, 0.5]
  ])
  expect(
    rows
      .slice(3)
      .every((row) => !row.origin.capture && row.source === undefined)
  ).toBe(true)
  expect(handoff).toHaveBeenCalled()
  expect(
    rows.slice(3).every((row) => row.origin.node !== rows[0].origin.node)
  ).toBe(true)
})
it('retains newly completed finding and stops before any interval or next sample after capture exhaustion', () => {
  const lower = vi.fn(() => 0),
    sample = vi.fn(() => ({ evidence: evidence(0.02, 0.05), exhausted: true }))
  const result = queryContinuousPair(query, settings, () => undefined, {
    sample,
    distance: () => evidence(),
    lower,
    exhaustionReason: 'test budget',
    certifyClearBeforeResampling: true
  })
  expect(sample).toHaveBeenCalledTimes(1)
  expect(lower).not.toHaveBeenCalled()
  expect(result.leaves[0]).toMatchObject({
    upper: 0.05,
    witnessTime: 0,
    state: 'finding',
    lower: 0
  })
})
it('does not request capture or a source for an ordinary static point', () => {
  const sample = vi.fn(
    (_a, _b, origin: StaticSampleOrigin, source: unknown) => {
      expect(origin.capture).toBe(false)
      expect(source).toBeUndefined()
      return { evidence: evidence(0.2, 0.3) }
    }
  )
  queryContinuousPair(
    { ...query, interval: [0.5, 0.5] },
    settings,
    () => undefined,
    {
      sample,
      distance: () => evidence(),
      lower: () => {
        throw new Error('No interval')
      },
      exhaustionReason: 'test budget'
    }
  )
  expect(sample).toHaveBeenCalledTimes(1)
})
