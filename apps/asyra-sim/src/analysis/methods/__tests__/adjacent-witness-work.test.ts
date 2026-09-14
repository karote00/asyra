import { describe, expect, it } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { Body } from '../../../domain/workcell'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import {
  createFreshStaticSampler,
  type StaticSampler,
  type SourceUpper
} from '../fresh-static-sampler'
import { queryContinuousPair, type PairQuery } from '../continuous-query'

const ops = poseOperations(intervalAlgebra)
const geometry: MeshGeometry = Object.freeze({
  kind: 'mesh',
  version: 1,
  source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
  positions: Object.freeze(
    [
      -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
      -1, 1, 1
    ].map((x) => x / 8)
  ),
  indices: Object.freeze([
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0,
    4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5
  ])
})
const shape = (x: number): ConvexShape => ({
  geometry,
  pose: ops.fromPose({ ...IDENTITY_POSE, position: [x, 0, 0] })
})
const evidence = (): DistanceEvidence => ({
  lower: 1 / 32,
  upper: 1 / 32,
  penetration: false,
  converged: true,
  iterations: 1,
  axis: [1, 0, 0],
  witnessA: [
    [1 / 8, 1 / 8],
    [0, 0],
    [0, 0]
  ],
  witnessB: [
    [5 / 32, 5 / 32],
    [0, 0],
    [0, 0]
  ]
})
type BoundarySampler = StaticSampler & {
  publishBoundary?: (source: unknown) => unknown | null
}
const origin = (node: object, segment: number, capture = false) => ({
  node,
  segment,
  start: segment,
  end: segment + 1,
  time: segment,
  capture,
  originalRoot: true
})
function owner() {
  let work = 0,
    stop = Infinity,
    calls = 0
  const seeds: (SourceUpper | undefined)[] = []
  const failure = new Error('owned budget')
  const sample: BoundarySampler = createFreshStaticSampler(
    1 / 16,
    () => {
      work++
      if (work === stop) throw failure
    },
    (_a, _b, seed) => {
      calls++
      seeds.push(seed)
      return evidence()
    },
    (error) => error === failure
  )
  return {
    sample,
    seeds,
    get work() {
      return work
    },
    get calls() {
      return calls
    },
    stopAt(n: number) {
      stop = n
    }
  }
}
function publish(sample: BoundarySampler, source: unknown) {
  expect(sample.publishBoundary).toBeTypeOf('function')
  return sample.publishBoundary?.(source)
}
describe('adjacent source ownership', () => {
  it('shares paid capture and charges publication plus all reverse-time transport operations', () => {
    const o = owner(),
      a = shape(0),
      b = shape(9 / 32),
      node = {}
    const source = o.sample(a, b, origin(node, 1, true))?.source
    expect(o.work).toBe(1)
    const boundary = publish(o.sample, source)
    expect(o.work).toBe(2)
    expect(boundary).toBeDefined()
    o.sample(a, b, origin({}, 0), boundary)
    expect(o.work).toBe(8)
    expect(o.calls).toBe(2)
    expect(o.seeds[1]?.upper).toBeGreaterThanOrEqual(1 / 32)
    expect(o.seeds[1]?.upper).toBeLessThan(1 / 16)
  })
  it('does not admit an ordinary node source across an adjacent boundary', () => {
    const o = owner(),
      a = shape(0),
      b = shape(9 / 32)
    const source = o.sample(a, b, origin({}, 1, true))?.source
    o.sample(a, b, origin({}, 0), source)
    expect(o.work).toBe(2)
    expect(o.seeds[1]).toBeUndefined()
  })
  it.each(['foreign', 'fabricated', 'middle', 'clamped'])(
    'rejects %s publication after its admission charge',
    (kind) => {
      const o = owner(),
        other = owner(),
        a = shape(0),
        b = shape(9 / 32)
      const sourceOrigin = {
        ...origin({}, 1, true),
        ...(kind === 'middle' ? { time: 1.5 } : {}),
        ...(kind === 'clamped' ? { originalRoot: false } : {})
      }
      const source = (kind === 'foreign' ? other : o).sample(
        a,
        b,
        sourceOrigin
      )?.source
      const before = o.work
      expect(
        publish(o.sample, kind === 'fabricated' ? {} : source)
      ).toBeUndefined()
      expect(o.work).toBe(before + 1)
    }
  )
  it.each(['segment', 'geometry', 'scope', 'point', 'time'])(
    'rejects mismatched target %s while charging its check',
    (kind) => {
      const o = owner(),
        other = owner(),
        a = shape(0),
        b = shape(9 / 32)
      const boundary = publish(
        o.sample,
        o.sample(a, b, origin({}, 1, true))?.source
      )
      const target = {
        ...origin({}, 0),
        ...(kind === 'segment'
          ? { segment: 2, start: 2, end: 3, time: 2 }
          : {}),
        ...(kind === 'point' ? { originalRoot: false, end: 0 } : {}),
        ...(kind === 'time' ? { time: 0.5 } : {})
      }
      const consumer = kind === 'scope' ? other : o
      const before = consumer.work
      consumer.sample(
        kind === 'geometry'
          ? { ...a, geometry: Object.freeze({ ...geometry }) }
          : a,
        b,
        target,
        boundary
      )
      expect(consumer.work).toBe(before + 1)
      expect(consumer.seeds.at(-1)).toBeUndefined()
    }
  )
  it('does not publish when the boundary charge exhausts', () => {
    const o = owner(),
      a = shape(0),
      b = shape(9 / 32)
    const source = o.sample(a, b, origin({}, 1, true))?.source
    o.stopAt(2)
    expect(publish(o.sample, source)).toBeNull()
    expect(o.calls).toBe(1)
  })
  it.each([1, 2, 3, 4, 5, 6])(
    'does not solve an unpaid target at consumption operation %s',
    (step) => {
      const o = owner(),
        a = shape(0),
        b = shape(9 / 32)
      const boundary = publish(
        o.sample,
        o.sample(a, b, origin({}, 1, true))?.source
      )
      o.stopAt(2 + step)
      expect(o.sample(a, b, origin({}, 0), boundary)).toBeNull()
      expect(o.work).toBe(2 + step)
      expect(o.calls).toBe(1)
    }
  )
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
    keyframes: [0, 1, 2, 3].map((time) => ({ time, joints: {} }))
  },
  a: { bodyId: 'a', colliderId: 'shape' },
  b: { bodyId: 'b', colliderId: 'shape' },
  interval: [0, 3]
}
const settings = {
  threshold: 1 / 16,
  distanceTolerance: 1e-6,
  timeTolerance: 0.1,
  maxIntervals: 20,
  maxIterations: 20
}
describe('adjacent root scheduling', () => {
  function run(
    exhaust = false,
    clamp = false,
    penetration = false,
    maxIntervals = settings.maxIntervals
  ) {
    const rows: { time: number; source: unknown }[] = [],
      publications: unknown[] = []
    const sample: BoundarySampler = (_a, _b, origin, source) => {
      rows.push({ time: origin.time, source })
      return {
        evidence: {
          ...evidence(),
          penetration: penetration && origin.time === 3
        },
        source: origin.capture ? origin.time : undefined
      }
    }
    sample.publishBoundary = (source) => {
      publications.push(source)
      return exhaust ? null : { boundary: source }
    }
    const result = queryContinuousPair(
      { ...query, interval: clamp ? [0, 2.5] : query.interval },
      { ...settings, maxIntervals },
      () => undefined,
      {
        sample,
        distance: () => evidence(),
        lower: () => 0,
        exhaustionReason: 'owned budget'
      }
    )
    return { rows, publications, result }
  }
  it('publishes the first source only after all root samples and consumes it at the next root', () => {
    const r = run()
    expect(r.rows.map((row) => row.time)).toEqual([
      2, 2.5, 3, 1, 1.5, 2, 0, 0.5, 1
    ])
    expect(r.publications).toEqual([2, 1])
    expect(r.rows[3].source).toEqual({ boundary: 2 })
    expect(r.rows[6].source).toEqual({ boundary: 1 })
    expect(r.result.coverage).toBe('complete')
  })
  it('does not publish when the temporal evaluation budget prevents the next root', () => {
    const r = run(false, false, false, 1)
    expect(r.rows).toHaveLength(3)
    expect(r.publications).toEqual([])
    expect(r.result.evaluations).toBe(1)
    expect(r.result.leaves.find((leaf) => leaf.start === 2)?.state).toBe(
      'finding'
    )
    expect(r.result.coverage).toBe('partial')
  })
  it('keeps the completed source leaf when publication exhausts and stops before the next sample', () => {
    const r = run(true)
    expect(r.rows).toHaveLength(3)
    expect(r.result.leaves.find((leaf) => leaf.start === 2)).toMatchObject({
      state: 'finding',
      upper: 1 / 32
    })
    expect(
      r.result.leaves
        .filter((leaf) => leaf.start < 2)
        .every((leaf) => leaf.state === 'unresolved')
    ).toBe(true)
  })
  it('never publishes a clamped or penetrating root source', () => {
    expect(run(false, true).publications).toEqual([1])
    const r = run(false, false, true)
    expect(r.publications).toEqual([1])
    expect(r.rows[3].source).toBeUndefined()
  })
})
