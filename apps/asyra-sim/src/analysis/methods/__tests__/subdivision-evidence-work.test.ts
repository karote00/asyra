import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import type { Body } from '../../../domain/workcell'
import * as convex from '../convex-query'
import {
  queryContinuousPair,
  type PairQuery,
  type PairQueryKernel,
  type QuerySettings
} from '../continuous-query'
import { queryOriginalPartPair } from '../original-part-method'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'

const settings: QuerySettings = {
  threshold: 0.02,
  distanceTolerance: 1e-6,
  timeTolerance: 1e-4,
  maxIntervals: 64,
  maxIterations: 64
}
function query(times = [0, 1]): PairQuery {
  const base: Body = {
    id: 'base',
    parentId: null,
    name: 'Base',
    role: 'robot',
    pose: IDENTITY_POSE,
    joint: { kind: 'fixed', axis: [1, 0, 0], value: 0, min: 0, max: 0 },
    colliders: [],
    visible: true,
    color: 0
  }
  const collider = {
    id: 'shape',
    geometry: { kind: 'sphere' as const, radius: 0.125 },
    pose: IDENTITY_POSE
  }
  return {
    workcell: {
      version: 1,
      robotRootId: 'base',
      bodies: [
        base,
        {
          ...base,
          id: 'moving',
          parentId: 'base',
          role: 'tool',
          joint: {
            kind: 'prismatic',
            axis: [1, 0, 0],
            value: 0,
            min: 0,
            max: 2
          },
          colliders: [collider]
        },
        {
          ...base,
          id: 'fixed',
          role: 'fixture',
          pose: { ...IDENTITY_POSE, position: [3, 0, 0] },
          colliders: [collider]
        }
      ]
    },
    trajectory: {
      version: 1,
      keyframes: times.map((time) => ({ time, joints: { moving: time } }))
    },
    a: { bodyId: 'moving', colliderId: 'shape' },
    b: { bodyId: 'fixed', colliderId: 'shape' },
    interval: [times[0], times[times.length - 1]]
  }
}
function schedule(
  input: PairQuery,
  enabled: boolean,
  selectedSettings = settings
) {
  const counts = { static: 0, lower: 0, handoffs: 0, work: 0 }
  const kernel: PairQueryKernel = {
    certifyClearBeforeResampling: true,
    distance: (a, b) => {
      counts.static++
      counts.work += 10
      return convex.convexDistance(a, b, 1e-6, 64)
    },
    lower: (a, b) => {
      counts.lower++
      counts.work += 20
      // Deliberately conservative but independent: true sphere separation is
      // at least 7/4 throughout [0,1]; the wider interval is left unproved.
      return Math.max(
        a.pose.position[0][1] - a.pose.position[0][0],
        b.pose.position[0][1] - b.pose.position[0][0]
      ) > 0.26
        ? 0
        : 1
    },
    exhaustionReason: 'owned budget',
    ...(enabled
      ? {
          handoffEvidence: () => {
            counts.handoffs++
            counts.work++
            return true
          },
          lowerUsesPositiveWitnessOnly: () => true
        }
      : {})
  }
  const result = queryContinuousPair(
    input,
    selectedSettings,
    () => undefined,
    kernel
  )
  return { result, counts }
}
afterEach(() => vi.restoreAllMocks())

describe('subdivision completed evidence ownership', () => {
  it('hands exact endpoints to children and completed zero certificates to the same node', () => {
    const input = query(),
      control = schedule(input, false),
      candidate = schedule(input, true)
    expect(control.counts).toEqual({
      static: 13,
      lower: 10,
      handoffs: 0,
      work: 330
    })
    expect(candidate.result).toEqual(control.result)
    expect(candidate.result.evaluations).toBe(7)
    expect(candidate.result.leaves).toHaveLength(4)
    expect(candidate.counts).toEqual({
      static: 5,
      lower: 7,
      handoffs: 11,
      work: 201
    })
    for (const leaf of candidate.result.leaves) {
      expect(leaf.lower).toBeLessThanOrEqual(2.75 - leaf.end)
      expect(leaf.upper).toBeGreaterThanOrEqual(2.75 - leaf.end)
      expect(leaf.state).toBe('clear')
    }
  })
  it('starts separate original segments and successor queries without inherited endpoints', () => {
    const input = query([0, 0.5, 1]),
      first = schedule(input, true),
      next = schedule(input, true)
    expect(first).toEqual(next)
    expect(first.counts).toEqual({
      static: 6,
      lower: 6,
      handoffs: 6,
      work: 186
    })
    const changed = query([0, 0.5, 1])
    changed.workcell.bodies[2].pose = { ...IDENTITY_POSE, position: [4, 0, 0] }
    expect(schedule(changed, true).counts.static).toBe(6)
    expect(schedule(changed, true).result).not.toEqual(first.result)
  })
  it('keeps reversal and changed query dependencies equivalent to fresh traversal', () => {
    const reversed = query()
    ;[reversed.a, reversed.b] = [reversed.b, reversed.a]
    expect(schedule(reversed, true).result).toEqual(
      schedule(reversed, false).result
    )
    expect(schedule(reversed, true).counts).toEqual({
      static: 5,
      lower: 7,
      handoffs: 11,
      work: 201
    })
    const source = query()
    source.workcell.bodies[1].colliders[0].geometry = {
      kind: 'sphere',
      radius: 0.25
    }
    for (const input of [query(), source]) {
      const changed = { ...settings, threshold: 0.04, distanceTolerance: 1e-5 }
      expect(schedule(input, true, changed).result).toEqual(
        schedule(input, false, changed).result
      )
    }
  })
  it('still consumes a later penetration after early zero with an initially positive witness', () => {
    let calls = 0
    const lower = vi.fn(() => 0),
      handoffEvidence = vi.fn(() => true)
    const kernel: PairQueryKernel = {
      certifyClearBeforeResampling: true,
      handoffEvidence,
      lowerUsesPositiveWitnessOnly: () => true,
      distance: (a, b) => {
        const evidence = convex.convexDistance(a, b, 1e-6, 64)
        return ++calls === 1
          ? evidence
          : { ...evidence, lower: 0, upper: 0, penetration: true }
      },
      lower,
      exhaustionReason: 'budget'
    }
    const result = queryContinuousPair(
      query(),
      settings,
      () => undefined,
      kernel
    )
    expect(calls).toBe(2)
    expect(lower).toHaveBeenCalledTimes(2)
    expect(handoffEvidence).not.toHaveBeenCalled()
    expect(result.leaves[0]).toMatchObject({
      state: 'finding',
      penetration: true,
      upper: 0,
      lower: 0
    })
  })
  it('does not bypass cancellation on an inherited endpoint', () => {
    const kernel: PairQueryKernel = {
      certifyClearBeforeResampling: true,
      handoffEvidence: () => {
        throw new Error('cancelled endpoint')
      },
      distance: (a, b) => convex.convexDistance(a, b, 1e-6, 64),
      lower: () => 0,
      exhaustionReason: 'budget'
    }
    expect(() =>
      queryContinuousPair(query(), settings, () => undefined, kernel)
    ).toThrow('cancelled endpoint')
  })
  it('recomputes after nonpositive first admission becomes positive', () => {
    let calls = 0
    const lower = vi.fn(() => 0)
    const kernel: PairQueryKernel = {
      certifyClearBeforeResampling: true,
      handoffEvidence: () => true,
      lowerUsesPositiveWitnessOnly: () => true,
      distance: (a, b) => ({
        ...convex.convexDistance(a, b, 1e-6, 64),
        lower: ++calls === 1 ? 0 : 1
      }),
      lower,
      exhaustionReason: 'budget'
    }
    queryContinuousPair(
      query(),
      { ...settings, maxIntervals: 1 },
      () => undefined,
      kernel
    )
    expect(lower).toHaveBeenCalledTimes(2)
  })
  it('does not opt native/native original queries into witness-independent lower reuse', () => {
    const context = new OriginalMeshQuery()
    let calls = 0
    const distance = context.distance.bind(context)
    context.distance = (...args) => ({
      ...distance(...args),
      axis: ++calls === 1 ? [1, 0, 0] : [0, 1, 0]
    })
    const lower = vi.spyOn(convex, 'separationLowerBound').mockReturnValue(0)
    queryOriginalPartPair(
      query(),
      { ...settings, maxIntervals: 1 },
      () => undefined,
      context
    )
    expect(lower).toHaveBeenCalledTimes(2)
    expect(lower.mock.calls[0][2]).toEqual([1, 0, 0])
    expect(lower.mock.calls[1][2]).toEqual([0, 1, 0])
  })
  it('charges actual evidence handoffs before publication and checkpoints cancellation', () => {
    const checkpoint = vi.fn()
    const context = new OriginalMeshQuery(checkpoint, 2)
    context.chargeEvidenceHandoff()
    context.chargeEvidenceHandoff()
    expect(context.work).toBe(2)
    expect(checkpoint).toHaveBeenCalledTimes(2)
    expect(() => context.chargeEvidenceHandoff()).toThrow(MeshWorkLimit)
    const aborted = new OriginalMeshQuery(() => {
      throw new Error('cancelled')
    })
    expect(() => aborted.chargeEvidenceHandoff()).toThrow('cancelled')
    expect(aborted.work).toBe(0)
  })
  it('retains established evidence when same-node certificate handoff exhausts', () => {
    const kernel: PairQueryKernel = {
      certifyClearBeforeResampling: true,
      handoffEvidence: () => false,
      lowerUsesPositiveWitnessOnly: () => true,
      distance: (a, b) => convex.convexDistance(a, b, 1e-6, 64),
      lower: () => 0,
      exhaustionReason: 'handoff budget'
    }
    const result = queryContinuousPair(
      query(),
      settings,
      () => undefined,
      kernel
    )
    expect(result.evaluations).toBe(1)
    expect(result.coverage).toBe('partial')
    expect(result.leaves).toHaveLength(1)
    expect(result.leaves[0]).toMatchObject({
      lower: 0,
      state: 'unresolved',
      reason: 'handoff budget'
    })
    expect(result.upper).not.toBeNull()
  })
  it('cannot publish an unpaid inherited endpoint', () => {
    let calls = 0
    const kernel: PairQueryKernel = {
      certifyClearBeforeResampling: true,
      handoffEvidence: () => false,
      distance: (a, b) => {
        calls++
        return convex.convexDistance(a, b, 1e-6, 64)
      },
      lower: () => 0,
      exhaustionReason: 'handoff budget'
    }
    const result = queryContinuousPair(
      query(),
      settings,
      () => undefined,
      kernel
    )
    expect(calls).toBe(3)
    expect(result.evaluations).toBe(1)
    expect(result.coverage).toBe('partial')
    expect(
      result.leaves.every((leaf) => leaf.upper === null && leaf.lower === 0)
    ).toBe(true)
  })
})
