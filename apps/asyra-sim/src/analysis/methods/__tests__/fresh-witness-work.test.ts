import { describe, expect, it } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import { OriginalMeshQuery } from '../original-mesh-query'
import {
  createFreshStaticSampler,
  type SourceUpper
} from '../fresh-static-sampler'

const ops = poseOperations(intervalAlgebra)
const cube: MeshGeometry = Object.freeze({
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
const shape = (x: number, geometry = cube): ConvexShape => ({
  geometry,
  pose: ops.fromPose({ ...IDENTITY_POSE, position: [x, 0, 0] })
})
const settings = {
  threshold: 1 / 16,
  distanceTolerance: 1e-6,
  maxIterations: 64
}
interface Origin {
  node: object
  segment: number
  start: number
  end: number
  time: number
  capture: boolean
}
interface Sample {
  evidence: DistanceEvidence
  source?: unknown
  exhausted?: boolean
}
type Sampler = (
  a: ConvexShape,
  b: ConvexShape,
  origin: Origin,
  source?: unknown
) => Sample | null
function sampler(context: OriginalMeshQuery): Sampler {
  return context.createStaticSampler(settings)
}
const origin = (node: object, time: number, capture = false): Origin => ({
  node,
  segment: 0,
  start: 0,
  end: 1,
  time,
  capture
})

describe('fresh node-owned source witness', () => {
  it('retains complete later-component penetration after a transported warning seed', () => {
    const boxes = (centres: number[]): MeshGeometry =>
      Object.freeze({
        ...cube,
        positions: Object.freeze(
          centres.flatMap((centre) =>
            cube.positions.map(
              (value, index) => value + (index % 3 === 0 ? centre : 0)
            )
          )
        ),
        indices: Object.freeze(
          centres.flatMap((_centre, index) =>
            cube.indices.map((value) => value + index * 8)
          )
        )
      })
    const a = shape(0, boxes([0, 2])),
      geometry = boxes([9 / 32, 33 / 16])
    const oldB: ConvexShape = {
      geometry,
      pose: ops.fromPose({ ...IDENTITY_POSE, position: [0, 1 / 2, 0] })
    }
    const nextB: ConvexShape = {
      geometry,
      pose: ops.fromPose({ ...IDENTITY_POSE, position: [0, 1 / 32, 1 / 32] })
    }
    const context = new OriginalMeshQuery(),
      sample = context.createStaticSampler({ ...settings, threshold: 3 / 4 }),
      node = {}
    const first = required(sample(a, oldB, origin(node, 0, true)))
    expect(first.source).toBeDefined()
    const target = required(sample(a, nextB, origin(node, 1), first.source))
    expect(target.evidence).toMatchObject({
      penetration: true,
      lower: 0,
      upper: 0
    })
    const raw = context.distance(a, nextB, 3 / 4, 1e-6, 64)
    expect(raw).toMatchObject({ penetration: true, lower: 0, upper: 0 })
  })
  it('charges exactly one immutable capture and six transport operations around complete solving', () => {
    const a = shape(0),
      b = shape(9 / 32),
      node = {}
    const control = new OriginalMeshQuery()
    const expected = control.distance(
      a,
      b,
      settings.threshold,
      settings.distanceTolerance,
      settings.maxIterations
    )
    const context = new OriginalMeshQuery(),
      sample = sampler(context)
    const first = required(sample(a, b, origin(node, 0, true)))
    expect(first.evidence).toEqual(expected)
    expect(first.source).toBeDefined()
    expect(context.work).toBe(control.work + 1)
    const before = context.work
    const second = required(sample(a, b, origin(node, 1), first.source))
    expect(second.source).toBeUndefined()
    expect(second.evidence.penetration).toBe(false)
    expect(second.evidence.lower).toBeLessThanOrEqual(1 / 32)
    expect(second.evidence.upper).toBeGreaterThanOrEqual(1 / 32)
    expect(context.work - before).toBeGreaterThanOrEqual(7)
  })
  it('does not capture point/final or mutable source geometry', () => {
    const context = new OriginalMeshQuery(),
      sample = sampler(context),
      node = {}
    expect(
      required(sample(shape(0), shape(9 / 32), origin(node, 0))).source
    ).toBeUndefined()
    const mutable = { ...cube, positions: [...cube.positions] }
    expect(
      required(sample(shape(0, mutable), shape(9 / 32), origin(node, 0, true)))
        .source
    ).toBeUndefined()
  })
  it('preserves a completed distance when its capture charge exhausts', () => {
    const a = shape(0),
      b = shape(9 / 32),
      control = new OriginalMeshQuery()
    const expected = control.distance(
      a,
      b,
      settings.threshold,
      settings.distanceTolerance,
      settings.maxIterations
    )
    const context = new OriginalMeshQuery(() => undefined, control.work)
    const result = required(sampler(context)(a, b, origin({}, 0, true)))
    expect(result.evidence).toEqual(expected)
    expect(result.exhausted).toBe(true)
    expect(result.source).toBeUndefined()
    expect(context.work).toBe(control.work + 1)
  })
  it('rejects fabricated and foreign-node handles with one admission charge', () => {
    const a = shape(0),
      b = shape(9 / 32),
      context = new OriginalMeshQuery(),
      sample = sampler(context)
    const first = required(sample(a, b, origin({}, 0, true)))
    for (const source of [{}, first.source]) {
      const before = context.work
      const result = required(sample(a, b, origin({}, 1), source))
      const directBefore = context.work
      const direct = context.distance(
        a,
        b,
        settings.threshold,
        settings.distanceTolerance,
        settings.maxIterations
      )
      expect(result.evidence).toEqual(direct)
      expect(directBefore - before).toBe(context.work - directBefore + 1)
    }
  })
})

describe('fresh source provenance and exact charged operations', () => {
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
  function owner() {
    let work = 0,
      stop = Infinity,
      calls = 0
    const seeds: (SourceUpper | undefined)[] = []
    let result = evidence()
    const failure = new Error('owned cancellation')
    const sample = createFreshStaticSampler(
      settings.threshold,
      () => {
        work++
        if (work === stop) throw failure
      },
      (_a, _b, seed) => {
        calls++
        seeds.push(seed)
        return result
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
      stopAt(value: number) {
        stop = value
      },
      result(value: DistanceEvidence) {
        result = value
      }
    }
  }
  it('pays capture one then each of the six actual consumption operations exactly once', () => {
    const o = owner(),
      node = {},
      a = shape(0),
      b = shape(9 / 32)
    const source = required(o.sample(a, b, origin(node, 0, true))).source
    expect(o.work).toBe(1)
    o.sample(a, b, origin(node, 1), source)
    expect(o.work).toBe(7)
    expect(o.calls).toBe(2)
    expect(o.seeds[1]).toBeDefined()
  })
  it.each([1, 2, 3, 4, 5, 6])(
    'does not publish an unpaid target when consumption operation %s cancels',
    (step) => {
      const o = owner(),
        node = {},
        a = shape(0),
        b = shape(9 / 32)
      const source = required(o.sample(a, b, origin(node, 0, true))).source
      o.stopAt(1 + step)
      expect(o.sample(a, b, origin(node, 1), source)).toBeNull()
      expect(o.calls).toBe(1)
      expect(o.work).toBe(1 + step)
    }
  )
  it('owns an immutable snapshot of source pose and witness, not caller arrays', () => {
    const o = owner(),
      node = {},
      a = shape(0),
      b = shape(9 / 32),
      output = evidence()
    o.result(output)
    const source = required(o.sample(a, b, origin(node, 0, true))).source
    ;(a.pose.position[0] as unknown as number[])[0] = 100
    ;(output.witnessA[0] as unknown as number[])[0] = -100
    o.sample(shape(0), shape(9 / 32), origin(node, 1), source)
    expect(required(o.seeds[1]).upper).toBeLessThan(1 / 16)
    expect(required(o.seeds[1]).a[0][0]).toBeLessThanOrEqual(1 / 8)
    expect(required(o.seeds[1]).a[0][1]).toBeGreaterThanOrEqual(1 / 8)
  })
  it.each(['scope', 'segment', 'geometry', 'time', 'node', 'forgery'])(
    'rejects %s mismatch before any transport',
    (mismatch) => {
      const o = owner(),
        node = {},
        a = shape(0),
        b = shape(9 / 32)
      let source = required(o.sample(a, b, origin(node, 0, true))).source
      let target = origin(node, 1),
        targetA = a
      if (mismatch === 'scope')
        source = required(owner().sample(a, b, origin(node, 0, true))).source
      if (mismatch === 'segment') target = { ...target, segment: 1 }
      if (mismatch === 'node') target = origin({}, 1)
      if (mismatch === 'time') target = { ...target, time: -1 }
      if (mismatch === 'geometry')
        targetA = shape(0, Object.freeze({ ...cube }))
      if (mismatch === 'forgery')
        source = Object.create(Object.getPrototypeOf(source))
      o.sample(targetA, b, target, source)
      expect(o.work).toBe(2)
      expect(o.seeds[1]).toBeUndefined()
    }
  )
  it.each([
    'penetration',
    'nonpositive',
    'threshold',
    'nonfinite',
    'point',
    'final'
  ])('does not capture %s output', (reason) => {
    const o = owner(),
      node = {},
      e = evidence()
    if (reason === 'penetration') e.penetration = true
    if (reason === 'nonpositive') e.lower = 0
    if (reason === 'threshold') e.upper = settings.threshold
    if (reason === 'nonfinite') e.upper = Infinity
    o.result(e)
    let at = origin(node, 0, reason !== 'final')
    if (reason === 'point') at = { ...at, end: 0 }
    expect(
      required(o.sample(shape(0), shape(9 / 32), at)).source
    ).toBeUndefined()
    expect(o.work).toBe(0)
  })
})

function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined)
    throw new Error('Expected completed owned sample')
  return value
}
