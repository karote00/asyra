import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { Body } from '../../../domain/workcell'
import * as continuous from '../continuous-query'
import type {
  PairQuery,
  PairQueryKernel,
  QuerySettings
} from '../continuous-query'
import type { DistanceEvidence } from '../convex-query'
import * as convex from '../convex-query'
import { queryOriginalPartPair } from '../original-part-method'
import { OriginalMeshQuery } from '../original-mesh-query'

const settings: QuerySettings = {
  threshold: 1 / 16,
  distanceTolerance: 1e-6,
  timeTolerance: 1e-4,
  maxIntervals: 64,
  maxIterations: 64
}
// Complete closed dyadic cube; analytical separation on the x axis is x-1/4.
const cube: MeshGeometry = Object.freeze({
  kind: 'mesh',
  version: 1,
  source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
  positions: Object.freeze(
    [
      -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
      -1, 1, 1
    ].map((value) => value / 8)
  ),
  indices: Object.freeze([
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0,
    4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5
  ])
})
function input(values = [9 / 32, 9 / 32]): PairQuery {
  const base: Body = {
    id: 'base',
    name: 'Base',
    parentId: null,
    role: 'robot',
    pose: IDENTITY_POSE,
    joint: { kind: 'fixed', axis: [1, 0, 0], value: 0, min: 0, max: 0 },
    visible: true,
    color: 0,
    colliders: []
  }
  const collider = { id: 'source', geometry: cube, pose: IDENTITY_POSE }
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
          role: 'link',
          joint: {
            kind: 'prismatic',
            axis: [1, 0, 0],
            value: 0,
            min: -2,
            max: 2
          },
          colliders: [collider]
        },
        { ...base, id: 'fixed', role: 'fixture', colliders: [collider] }
      ]
    },
    trajectory: {
      version: 1,
      keyframes: values.map((value, time) => ({
        time,
        joints: { moving: value }
      }))
    },
    a: { bodyId: 'moving', colliderId: 'source' },
    b: { bodyId: 'fixed', colliderId: 'source' },
    interval: [0, values.length - 1]
  }
}
type DerivingKernel = PairQueryKernel
function evidence(upper: number, penetration = false): DistanceEvidence {
  return {
    lower: 0,
    upper,
    penetration,
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
  }
}
function schedule(uppers: number[], derived: 0 | null = 0) {
  let sample = 0
  const lower = vi.fn(() => 0),
    deriveZeroLower = vi.fn(() => derived)
  const kernel: DerivingKernel = {
    certifyClearBeforeResampling: true,
    distance: () => {
      const upper = uppers[sample++]
      return evidence(upper, upper === 0)
    },
    lower,
    deriveZeroLower,
    exhaustionReason: 'owned derivation exhausted'
  }
  const result = continuous.queryContinuousPair(
    input(),
    settings,
    () => undefined,
    kernel
  )
  return { result, lower, deriveZeroLower, samples: sample }
}
afterEach(() => vi.restoreAllMocks())

describe('node-owned witnessed zero certificate', () => {
  it('derives only at final certification and retains later penetration', () => {
    const result = schedule([1 / 32, 0])
    expect(result.samples).toBe(2)
    expect(result.lower).not.toHaveBeenCalled()
    expect(result.deriveZeroLower).toHaveBeenCalledTimes(1)
    expect(result.result.leaves[0]).toMatchObject({
      lower: 0,
      upper: 0,
      penetration: true,
      state: 'finding',
      witnessTime: 0.5
    })
  })
  it('derives early equality without skipping remaining samples', () => {
    const result = schedule([1 / 16, 1 / 32, 1 / 32])
    expect(result.samples).toBe(3)
    expect(result.lower).not.toHaveBeenCalled()
    expect(result.deriveZeroLower).toHaveBeenCalledTimes(2)
    expect(result.result.leaves[0]).toMatchObject({
      lower: 0,
      state: 'finding'
    })
  })
  it('keeps upper-above-threshold on the original lower route', () => {
    const lower = vi.fn(() => 1 / 8),
      deriveZeroLower = vi.fn(() => 0 as const)
    const kernel: DerivingKernel = {
      certifyClearBeforeResampling: true,
      distance: () => evidence(1 / 4),
      lower,
      deriveZeroLower,
      exhaustionReason: 'budget'
    }
    const result = continuous.queryContinuousPair(
      input(),
      settings,
      () => undefined,
      kernel
    )
    expect(result.leaves[0].state).toBe('clear')
    expect(lower).toHaveBeenCalledTimes(1)
    expect(deriveZeroLower).not.toHaveBeenCalled()
  })
  it('keeps established witnesses but does not publish a failed derivation', () => {
    const result = schedule([1 / 16, 1 / 32, 1 / 32], null)
    expect(result.samples).toBe(1)
    expect(result.lower).not.toHaveBeenCalled()
    expect(result.result.leaves[0]).toMatchObject({
      lower: 0,
      upper: 1 / 16,
      state: 'unresolved',
      reason: 'owned derivation exhausted'
    })
  })
  it('prefers one already completed lower handoff over another derivation', () => {
    let sample = 0
    const handoffEvidence = vi.fn(() => true),
      lower = vi.fn(() => 0),
      deriveZeroLower = vi.fn(() => 0 as const)
    const kernel: DerivingKernel = {
      certifyClearBeforeResampling: true,
      distance: () => ({
        ...evidence(++sample === 1 ? 1 / 8 : 1 / 32),
        lower: 1 / 64
      }),
      lower,
      handoffEvidence,
      lowerUsesPositiveWitnessOnly: () => true,
      deriveZeroLower,
      exhaustionReason: 'budget'
    }
    continuous.queryContinuousPair(input(), settings, () => undefined, kernel)
    expect(sample).toBe(3)
    expect(lower).toHaveBeenCalledTimes(1)
    expect(handoffEvidence).toHaveBeenCalledTimes(1)
    expect(deriveZeroLower).not.toHaveBeenCalled()
  })
  it.each([false, true])(
    'matches a raw full-source interval oracle and charges its derived work, reversed=%s',
    (reverse) => {
      const query = input()
      if (reverse) [query.a, query.b] = [query.b, query.a]
      const run = continuous.queryContinuousPair
      const controlRoute = vi
        .spyOn(continuous, 'queryContinuousPair')
        .mockImplementation((query, settings, checkpoint, kernel) =>
          run(
            query,
            settings,
            checkpoint,
            kernel
              ? ({ ...kernel, deriveZeroLower: undefined } as DerivingKernel)
              : kernel
          )
        )
      const controlContext = new OriginalMeshQuery(),
        controlLower = vi.spyOn(controlContext, 'lowerOver')
      const control = queryOriginalPartPair(
        query,
        settings,
        () => undefined,
        controlContext
      )
      expect(controlLower).toHaveBeenCalledTimes(1)
      expect(controlLower.mock.results[0].value).toBe(0)
      const lowerArgs = controlLower.mock.calls[0]
      const raw = new OriginalMeshQuery()
      expect(raw.lowerOver(...lowerArgs)).toBe(0)
      controlRoute.mockRestore()
      const context = new OriginalMeshQuery(),
        originalDistance = context.distance.bind(context),
        lower = vi.spyOn(context, 'lowerOver'),
        distance = vi.spyOn(context, 'distance')
      let staticWork = 0
      distance.mockImplementation((...args) => {
        const before = context.work,
          result = originalDistance(...args)
        staticWork += context.work - before
        return result
      })
      const result = queryOriginalPartPair(
        query,
        settings,
        () => undefined,
        context
      )
      expect(result).toEqual(control)
      expect(result.leaves[0]).toMatchObject({
        state: 'finding',
        lower: 0,
        penetration: false
      })
      expect(result.leaves[0].upper).toBeGreaterThanOrEqual(1 / 32)
      expect(distance).toHaveBeenCalledTimes(3)
      expect(lower).not.toHaveBeenCalled()
      expect(context.work).toBe(staticWork + 1)
      expect(context.work).toBeLessThan(controlContext.work)
    }
  )
  it('does not import an outside near witness into a genuinely clear source interval', () => {
    // Processed in reverse temporal order: the later near segment is consumed
    // before the earlier clear segment. Every source vertex remains unchanged.
    const query = input([1, 1, 9 / 32, 9 / 32])
    const result = queryOriginalPartPair(query, settings)
    const clearQuery = { ...query, interval: [0, 1] as const }
    const fresh = queryOriginalPartPair(clearQuery, settings)
    expect(fresh.leaves[0].state).toBe('clear')
    expect(fresh.leaves[0].lower).toBeGreaterThan(settings.threshold)
    expect(result.leaves.filter((leaf) => leaf.end <= 1)).toEqual(fresh.leaves)
    expect(result.leaves.at(-1)?.state).toBe('finding')
  })
  it('preserves the positive native axis lower bound below the threshold', () => {
    const query = input()
    for (const body of query.workcell.bodies)
      for (const collider of body.colliders)
        collider.geometry = { kind: 'sphere', radius: 1 / 8 }
    const lower = vi.spyOn(convex, 'separationLowerBound')
    const result = queryOriginalPartPair(query, settings)
    expect(lower).toHaveBeenCalledTimes(1)
    expect(result.leaves[0].state).toBe('finding')
    expect(result.leaves[0].lower).toBeGreaterThan(0)
    expect(result.leaves[0].lower).toBeLessThan(settings.threshold)
  })
  it('keeps point intervals static and refreshed source/settings independent', () => {
    const query = input()
    query.interval = [0, 0]
    const lower = vi.spyOn(OriginalMeshQuery.prototype, 'lowerOver')
    const result = queryOriginalPartPair(query, settings)
    expect(lower).not.toHaveBeenCalled()
    expect(result.leaves[0].lower).toBeGreaterThan(0)
    const clear = queryOriginalPartPair(input(), {
      ...settings,
      threshold: 1 / 64
    })
    expect(clear.leaves[0].state).toBe('clear')
    expect(clear.leaves[0].lower).toBeGreaterThan(1 / 64)
    const changed = input([1, 1])
    expect(queryOriginalPartPair(changed, settings).leaves[0].state).toBe(
      'clear'
    )
  })
  it('charges and checks the real derivation before publishing, preserving prior witnesses', () => {
    let staticWork = 0
    const probe = new OriginalMeshQuery(),
      rawDistance = probe.distance.bind(probe)
    vi.spyOn(probe, 'distance').mockImplementation((...args) => {
      const before = probe.work,
        result = rawDistance(...args)
      staticWork += probe.work - before
      return result
    })
    queryOriginalPartPair(input(), settings, () => undefined, probe)
    const context = new OriginalMeshQuery(() => undefined, staticWork),
      lower = vi.spyOn(context, 'lowerOver')
    const exhausted = queryOriginalPartPair(
      input(),
      settings,
      () => undefined,
      context
    )
    expect(context.work).toBe(staticWork + 1)
    expect(lower).not.toHaveBeenCalled()
    expect(exhausted.leaves[0]).toMatchObject({
      lower: 0,
      state: 'finding',
      penetration: false
    })
    let calls = 0
    const cancelled = new OriginalMeshQuery(() => {
      if (calls === 3) throw new Error('cancelled derivation')
    })
    const raw = cancelled.distance.bind(cancelled)
    vi.spyOn(cancelled, 'distance').mockImplementation((...args) => {
      const result = raw(...args)
      calls++
      return result
    })
    expect(() =>
      queryOriginalPartPair(input(), settings, () => undefined, cancelled)
    ).toThrow('cancelled derivation')
    expect(cancelled.work).toBe(staticWork)
  })
})
