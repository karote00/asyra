import { afterEach, expect, it, vi } from 'vitest'
import { IDENTITY_POSE, type Vec3 } from '../../../domain/math'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { ConvexShape } from '../convex-query'
import type { PreparedMeshIndex } from '../mesh-index'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { MeshFrontier, type FrontierWork } from '../mesh-frontier'
import * as membership from '../mesh-membership'
import * as projection from '../mesh-projection'
import * as convex from '../convex-query'
import {
  frontierBox,
  frontierHole,
  frontierPrism,
  sourceMesh
} from '../__fixtures__/frontier-meshes'

const ops = poseOperations(intervalAlgebra)
const shape = (
  geometry: MeshGeometry,
  position: Vec3 = [0, 0, 0]
): ConvexShape => ({
  geometry,
  pose: ops.fromPose({ ...IDENTITY_POSE, position })
})
const make = (
  limit = 500000,
  prepared?: WeakMap<MeshGeometry, PreparedMeshIndex>
) => new OriginalMeshQuery(undefined, limit, true, prepared, true)
const solve = (
  context: OriginalMeshQuery,
  a: ConvexShape,
  b: ConvexShape,
  threshold = 0.1
) => context.distance(a, b, threshold, 1e-6, 64)
function observe(context: OriginalMeshQuery) {
  const owner = (
    context as unknown as { frontier: { charge: (kind: FrontierWork) => void } }
  ).frontier
  const original = owner.charge,
    events: FrontierWork[] = []
  owner.charge = (kind) => {
    events.push(kind)
    original(kind)
  }
  return events
}
afterEach(() => vi.restoreAllMocks())
it('revalidates every retained node at a changed pose and threshold and repeats triangle work', () => {
  const g = frontierPrism(),
    a = shape(g),
    context = make(),
    events = observe(context)
  const p = vi.spyOn(projection, 'projectedBoundsGap'),
    c = vi.spyOn(convex, 'convexDistance')
  for (const [x, threshold] of [
    [1.25, 0.1],
    [1.125, 0.5],
    [1.375, 0.8],
    [1.25, 0.1]
  ] as const) {
    const beforeP = p.mock.calls.length,
      beforeC = c.mock.calls.length
    const result = solve(context, a, shape(g, [x, x, 0]), threshold)
    // Exact analytic prism gap squared: (2x - 2)^2 / 2, all inputs dyadic.
    const squared = (2 * x - 2) ** 2 / 2
    expect(result.lower ** 2).toBeLessThanOrEqual(squared)
    expect(result.upper ** 2).toBeGreaterThanOrEqual(squared)
    expect(result.penetration).toBe(false)
    expect(p.mock.calls.length).toBeGreaterThan(beforeP)
    if (threshold > Math.sqrt(squared))
      expect(c.mock.calls.length).toBeGreaterThan(beforeC)
  }
  expect(events.filter((x) => x === 'publish')).toHaveLength(4)
  expect(events.filter((x) => x === 'lookup')).toHaveLength(4)
})
it('rechecks the complete interval, including an interior collision between clear endpoints', () => {
  const g = frontierPrism(),
    a = shape(g),
    context = make(),
    events = observe(context)
  const first = solve(context, a, shape(g, [1.25, 1.25, 0]))
  expect(first.lower).toBeGreaterThan(0.1)
  const whole: ConvexShape = {
    geometry: g,
    pose: {
      ...a.pose,
      position: [
        [-1.25, 1.25],
        [-1.25, 1.25],
        [0, 0]
      ]
    }
  }
  const before = events.filter((x) => x === 'publish').length
  expect(context.lowerOver(a, whole, 0.1, first, 1e-6, 64)).toBe(0)
  expect(events.filter((x) => x === 'publish')).toHaveLength(before)
  expect(solve(context, a, shape(g, [-1.25, -1.25, 0])).lower).toBeGreaterThan(
    0.1
  )
  const overlap = solve(context, a, shape(g, [0, 0, 0]))
  expect(overlap.lower).toBe(0)
  expect(overlap.upper).toBeLessThanOrEqual(1e-6)
})
it('preserves a concave hole and reruns membership before a newly contained solid', () => {
  const a = shape(frontierHole()),
    g = frontierBox(0.125),
    context = make(),
    events = observe(context)
  const spy = vi.spyOn(membership, 'shapeMembership')
  const clear = solve(context, a, shape(g, [0, 1, 0]))
  expect(clear.penetration).toBe(false)
  expect(clear.lower).toBeGreaterThan(0.1)
  expect(events).toContain('publish')
  const before = spy.mock.calls.length
  expect(solve(context, a, shape(g, [2, 1, 0]))).toMatchObject({
    penetration: true,
    lower: 0,
    upper: 0
  })
  expect(spy.mock.calls.length).toBeGreaterThan(before)
})
it('does not let a changed transported upper bound hide later-component penetration', () => {
  const box = frontierBox(0.125)
  const boxes = (centres: number[]) =>
    sourceMesh(
      centres.flatMap((x) =>
        box.positions.map((v, i) => v + (i % 3 === 0 ? x : 0))
      ),
      centres.flatMap((_x, i) => box.indices.map((v) => v + 8 * i))
    )
  const a = shape(boxes([0, 2])),
    b = boxes([9 / 32, 33 / 16]),
    context = make()
  const sample = context.createStaticSampler({
      threshold: 0.75,
      distanceTolerance: 1e-6,
      maxIterations: 64
    }),
    node = {}
  const first = sample(a, shape(b, [0, 0.5, 0]), {
    node,
    segment: 0,
    start: 0,
    end: 1,
    time: 0,
    capture: true
  })
  expect(first?.source).toBeDefined()
  const second = sample(
    a,
    shape(b, [0, 1 / 32, 1 / 32]),
    { node, segment: 0, start: 0, end: 1, time: 1, capture: false },
    first?.source
  )
  expect(second?.evidence).toMatchObject({
    penetration: true,
    lower: 0,
    upper: 0
  })
})
it('charges complete preparation identically cold and hot and stores no verdict across contexts', () => {
  const g = frontierPrism(),
    prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>()
  const runs = [0, 1].map(() => {
    const context = make(500000, prepared),
      events = observe(context)
    const results = [1.25, 1.125, 1.375].map((x) =>
      solve(context, shape(g), shape(g, [x, x, 0]))
    )
    return { work: context.work, events, results }
  })
  expect(runs[1]).toEqual(runs[0])
})
it('propagates cancellation at publication without publishing a partial replacement', () => {
  const g = frontierPrism(),
    context = make(),
    sentinel = new Error('cancel frontier publication')
  const owner = (
    context as unknown as {
      frontier: { charge: (kind: FrontierWork) => void; packet?: unknown }
    }
  ).frontier
  const charge = owner.charge
  owner.charge = (kind) => {
    if (kind === 'publish') throw sentinel
    charge(kind)
  }
  expect(() => solve(context, shape(g), shape(g, [1.25, 1.25, 0]))).toThrow(
    sentinel
  )
  expect(owner.packet).toBeUndefined()
})
it('retains newly completed evidence when optional publication exhausts, and exposes the same limit on the next operation', () => {
  const g = frontierPrism(),
    a = shape(g),
    b = shape(g, [1.25, 1.25, 0]),
    control = make()
  const expected = solve(control, a, b),
    context = make(control.work - 1)
  const sampler = context.createStaticSampler({
    threshold: 0.1,
    distanceTolerance: 1e-6,
    maxIterations: 64
  })
  const fresh = sampler(a, b, {
    node: {},
    segment: 0,
    start: 0,
    end: 1,
    time: 0,
    capture: false
  })
  expect(fresh?.evidence).toEqual(expected)
  expect(context.work).toBe(control.work)
  expect(
    (context as unknown as { frontier: { packet?: unknown } }).frontier.packet
  ).toBeUndefined()
  expect(() => solve(context, a, b)).toThrow(MeshWorkLimit)
  expect(context.work).toBe(control.work)
})
it('has no frontier owner or bookkeeping in the default installed path', () => {
  const spy = vi.spyOn(MeshFrontier.prototype, 'observe'),
    g = frontierPrism()
  solve(new OriginalMeshQuery(), shape(g), shape(g, [1.25, 1.25, 0]))
  expect(spy).not.toHaveBeenCalled()
})
