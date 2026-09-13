import { afterEach, expect, it, vi } from 'vitest'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { axisAngle } from '../../../domain/math'
import { interval } from '../../../domain/interval'
import type { ConvexShape } from '../convex-query'
import { source } from '../__fixtures__/source-frame-oracle'
import { OriginalMeshQuery, MeshWorkLimit } from '../original-mesh-query'
import * as fitting from '../fitted-index'
import * as indexing from '../mesh-index'
import * as membership from '../mesh-membership'
import * as projection from '../mesh-projection'

const ops = poseOperations(intervalAlgebra),
  geometry = source()
const shape = (x = 0, y = 0, g = geometry) => ({
  geometry: g,
  pose: ops.fromPose({ position: [x, y, 0], rotation: [0, 0, 0, 1] })
})
const pair = [shape(), shape(-12, 9)] as const
const solve = (q: OriginalMeshQuery) =>
  q.distance(pair[0], pair[1], 0.02, 1e-6, 48)
const candidate = (
  prepared?: WeakMap<MeshGeometry, indexing.PreparedMeshIndex>,
  checkpoint?: () => void
) => new OriginalMeshQuery(checkpoint, 500000, true, prepared, true)
afterEach(() => vi.restoreAllMocks())

it('keeps the default route exactly neutral while opt-in fits one shared geometry', () => {
  const fit = vi.spyOn(fitting, 'prepareFittedIndex')
  const a = new OriginalMeshQuery(),
    b = new OriginalMeshQuery(undefined, 500000, true, undefined, false)
  expect(solve(a)).toEqual(solve(b))
  expect(a.work).toBe(b.work)
  expect(fit).not.toHaveBeenCalled()
  const result = solve(candidate())
  expect(fit).toHaveBeenCalledTimes(1)
  expect(result.penetration).toBe(false)
  expect(result.lower).toBeGreaterThan(4.99)
  expect(result.lower).toBeLessThanOrEqual(5)
  expect(result.upper).toBeGreaterThanOrEqual(5)
})
it('owns one receipt across static and interval calls, but rebuilds and charges fully next invocation', () => {
  const prepared = new WeakMap<MeshGeometry, indexing.PreparedMeshIndex>(),
    fit = vi.spyOn(fitting, 'prepareFittedIndex')
  const cold = candidate(prepared),
    result = solve(cold),
    first = cold.work
  expect(fit).toHaveBeenCalledTimes(1)
  expect(solve(cold)).toEqual(result)
  const repeated = cold.work - first
  expect(cold.lowerOver(pair[0], pair[1], 0.02, result)).toBeGreaterThan(4.99)
  expect(fit).toHaveBeenCalledTimes(1)
  const warm = candidate(prepared)
  expect(solve(warm)).toEqual(result)
  expect(warm.work).toBe(first)
  expect(fit).toHaveBeenCalledTimes(2)
  const built = fit.mock.results[0].value
  expect(built?.work).toBe(35)
  expect(first - repeated).toBe(
    (prepared.get(geometry)?.work ?? 0) +
      (prepared.get(geometry)?.refinement?.work ?? 0) +
      35
  )
})
it('does not fit root-clear, native, exhaustive, membership-resolved or negative interval admission', () => {
  const fit = vi.spyOn(fitting, 'prepareFittedIndex')
  candidate().distance(shape(), shape(1000), 0.02, 1e-6, 48)
  const sphere = {
    geometry: { kind: 'sphere' as const, radius: 1 / 100 },
    pose: ops.identity()
  }
  candidate().distance(shape(), sphere, 0.02, 1e-6, 48)
  solve(new OriginalMeshQuery(undefined, 500000, false, undefined, true))
  const outside = solve(new OriginalMeshQuery())
  candidate().lowerOver(pair[0], pair[1], 0.02, { ...outside, lower: 0 })
  candidate().distance(
    shape(),
    shape(
      0,
      0,
      Object.freeze({
        ...geometry,
        positions: Object.freeze(geometry.positions.map((v) => v / 10))
      })
    ),
    0.02,
    1e-6,
    48
  )
  expect(fit).not.toHaveBeenCalled()
})
it('isolates fitting and iteration from later foreign refinement mutation', () => {
  const prepared = new WeakMap<MeshGeometry, indexing.PreparedMeshIndex>(),
    q = candidate(prepared)
  const result = solve(q),
    refined = prepared.get(geometry)?.refinement?.index
  if (!refined) throw new Error('Missing original refinement')
  refined.root.bounds = [
    [999, 999],
    [999, 999],
    [999, 999]
  ]
  refined.root.children = undefined
  refined.root.triangles = []
  expect(solve(q)).toEqual(result)
  expect(q.lowerOver(pair[0], pair[1], 0.02, result)).toBeGreaterThan(4.99)
})
it('retains unknown membership instead of promoting a fitted rejection to clearance', () => {
  vi.spyOn(membership, 'shapeMembership').mockReturnValue('unknown')
  const result = solve(candidate())
  expect(result.lower).toBe(0)
  expect(result.penetration).toBe(false)
  expect(result.converged).toBe(false)
})
it('charges two completed compositions before each fitted certificate and preserves the world gap', () => {
  const original = projection.projectedBoundsGap
  const baseFit = fitting.prepareFittedIndex
  const fit = vi.spyOn(fitting, 'prepareFittedIndex')
  const q = candidate()
  let publication = 0
  fit.mockImplementation((...args) => {
    const result = baseFit(...args)
    publication = q.work
    return result
  })
  const entries: { before: number; after: number }[] = []
  vi.spyOn(projection, 'projectedBoundsGap').mockImplementation(
    (a, ap, b, bp, t, check) => {
      const matching = fit.mock.results.some((r) =>
        r.value?.entries.some((e: fitting.FittedNode) => e.frame?.bounds === a)
      )
      const before = q.work,
        value = original(a, ap, b, bp, t, check)
      if (matching) entries.push({ before, after: q.work })
      return value
    }
  )
  const result = solve(q)
  expect(entries.length).toBeGreaterThan(0)
  expect(entries[0].before - publication).toBe(3) // pending node + two compositions
  expect(entries.every((e) => e.after > e.before)).toBe(true)
  expect(result.lower).toBeGreaterThan(4.99)
})
it('retries each interrupted receipt stage without publishing or reusing partial fitting', () => {
  const base = fitting.prepareFittedIndex
  for (let stop = 1; stop <= 35; stop++) {
    const prepared = new WeakMap<MeshGeometry, indexing.PreparedMeshIndex>(),
      q = candidate(prepared),
      error = new MeshWorkLimit('cancelled')
    let calls = 0
    const spy = vi
      .spyOn(fitting, 'prepareFittedIndex')
      .mockImplementationOnce((g, i, check, own) =>
        base(
          g,
          i,
          () => {
            check()
            if (++calls === stop) throw error
          },
          own
        )
      )
    expect(() => solve(q)).toThrow(error)
    expect(calls).toBe(stop)
    spy.mockRestore()
    const complete = vi.spyOn(fitting, 'prepareFittedIndex')
    expect(solve(q).lower).toBeGreaterThan(4.99)
    expect(complete).toHaveBeenCalledTimes(1)
    complete.mockRestore()
  }
})
it('publishes a complete deeply immutable traversal with exact paid source copies', () => {
  const index = indexing.refineMeshIndex(
      indexing.buildMeshIndex(geometry, () => undefined),
      () => undefined
    ),
    before = JSON.stringify(index)
  let work = 0
  const result = fitting.prepareFittedIndex(geometry, index, () => work++, true)
  expect(result?.work).toBe(35)
  expect(work).toBe(35)
  expect(result?.traversal).toBeDefined()
  expect(JSON.stringify(index)).toBe(before)
  if (!result?.traversal) throw new Error('Missing owned traversal')
  expect(result.traversal).not.toBe(index)
  for (const entry of result.entries) {
    const node = entry.traversalNode
    expect(node).toBeDefined()
    if (!node) throw new Error('Missing owned node')
    expect(Object.isFrozen(node)).toBe(true)
    expect(Object.isFrozen(node.bounds)).toBe(true)
    expect(node.bounds).toEqual(entry.node.bounds)
    expect(node).not.toBe(entry.node)
    expect(entry.frame?.source.kind).toBe('node')
    if (entry.frame?.source.kind === 'node')
      expect(entry.frame.source.node).toBe(node)
    for (const t of node.triangles) {
      expect(Object.isFrozen(t)).toBe(true)
      expect(Object.isFrozen(t.vertices)).toBe(true)
      t.vertices.forEach((v) => expect(Object.isFrozen(v)).toBe(true))
    }
  }
})

it.each([2, 33, 257])(
  'charges all copied-node, triangle and representative chunks - %i components',
  (copies) => {
    const g = source(copies)
    const index = indexing.refineMeshIndex(
      indexing.buildMeshIndex(g, () => undefined),
      () => undefined
    )
    const plain = fitting.prepareFittedIndex(g, index, () => undefined)
    let paid = 0
    const owned = fitting.prepareFittedIndex(g, index, () => paid++, true)
    if (!plain || !owned) throw new Error('Missing receipt')
    expect(paid).toBe(
      plain.work +
        plain.entries.length +
        Math.ceil(g.indices.length / 3 / 256) +
        Math.ceil(copies / 256)
    )
    expect(owned.work).toBe(paid)
    expect(owned.traversal?.representatives).toEqual(index.representatives)
    expect(Object.isFrozen(owned.traversal?.representatives)).toBe(true)
    owned.traversal?.representatives.forEach((p) =>
      expect(Object.isFrozen(p)).toBe(true)
    )
    for (const entry of owned.entries) {
      const node = entry.traversalNode
      if (!node) throw new Error('Missing node')
      expect(
        node.children?.map(
          (child) => owned.entries.find((e) => e.traversalNode === child)?.node
        )
      ).toEqual(entry.node.children)
      for (const triangle of node.triangles) {
        expect(triangle.component).toBe(
          owned.components[owned.offsets.indexOf(triangle.offset)]
        )
        expect(triangle.vertices).toEqual(
          [0, 1, 2].map((c) =>
            indexing.meshPoint(g, g.indices[triangle.offset + c])
          )
        )
        expect(Object.isFrozen(triangle.bounds)).toBe(true)
        triangle.bounds.forEach((b) => expect(Object.isFrozen(b)).toBe(true))
      }
    }
  }
)

it('misses replaced source identity and refreshes poses without rebuilding completed geometry', () => {
  const fit = vi.spyOn(fitting, 'prepareFittedIndex'),
    q = candidate()
  solve(q)
  const moved = [shape(1, 2), shape(-11, 11)] as const
  const actual = q.distance(...moved, 0.02, 1e-6, 48)
  expect(fit).toHaveBeenCalledTimes(1)
  expect(actual).toEqual(candidate().distance(...moved, 0.02, 1e-6, 48))
  const changed = source(2),
    before = fit.mock.calls.length
  const changedPair = [shape(0, 0, changed), shape(-12, 9, changed)] as const
  const result = q.distance(...changedPair, 0.02, 1e-6, 48)
  expect(fit.mock.calls.length - before).toBe(1)
  expect(result).toEqual(candidate().distance(...changedPair, 0.02, 1e-6, 48))
})

it.each([false, true])(
  'encloses full rotated-motion distance and reversed original sources - reverse %s',
  (reverse) => {
    const rotation = axisAngle([1, 2, 3], 0.7),
      pose = ops.fromPose({ position: [3, -2, 7], rotation })
    const a: ConvexShape = { ...pair[0], pose: ops.compose(pose, pair[0].pose) }
    const b: ConvexShape = { ...pair[1], pose: ops.compose(pose, pair[1].pose) }
    const ordered = reverse ? ([b, a] as const) : ([a, b] as const)
    const q = candidate(),
      evidence = q.distance(...ordered, 0.02, 1e-6, 48)
    expect(evidence.penetration).toBe(false)
    expect(evidence.lower).toBeGreaterThan(0)
    expect(evidence.lower).toBeLessThanOrEqual(5)
    expect(evidence.upper).toBeGreaterThanOrEqual(5)
    const moving = {
      ...b,
      pose: {
        ...b.pose,
        position: b.pose.position.map((v) =>
          interval(v[0] - 0.001, v[1] + 0.001)
        ) as unknown as typeof b.pose.position
      }
    }
    const lower = q.lowerOver(
      ...(reverse ? ([moving, a] as const) : ([a, moving] as const)),
      0.02,
      evidence
    )
    expect(lower).toBeGreaterThan(0.02)
    // Translation uncertainty of each coordinate bounds distance change by sqrt(3)/1000.
    expect(lower).toBeLessThanOrEqual(5 + Math.sqrt(3) / 1000)
    for (const fraction of [-1, 0, 1]) {
      const sample = {
        ...b,
        pose: {
          ...b.pose,
          position: b.pose.position.map((v) =>
            interval((v[0] + v[1]) / 2 + fraction * 0.001)
          ) as unknown as typeof b.pose.position
        }
      }
      const point = new OriginalMeshQuery(undefined, 500000, false).distance(
        a,
        sample,
        0.02,
        1e-6,
        48
      )
      expect(lower).toBeLessThanOrEqual(point.upper)
    }
  }
)

it.each([1, 2])(
  'cancels pair composition %i before any certificate and retains completed receipts',
  (stop) => {
    const error = new MeshWorkLimit('cancelled'),
      base = fitting.prepareFittedIndex
    let published = -1,
      armed = true
    const q = candidate(undefined, () => {
      if (armed && published >= 0 && q.work === published + stop) throw error
    })
    const fit = vi
      .spyOn(fitting, 'prepareFittedIndex')
      .mockImplementation((...args) => {
        const receipt = base(...args)
        published = q.work
        return receipt
      })
    const project = vi.spyOn(projection, 'projectedBoundsGap')
    expect(() => solve(q)).toThrow(error)
    expect(fit).toHaveBeenCalledTimes(1)
    expect(
      project.mock.calls.some(([bounds]) =>
        fit.mock.results.some((r) =>
          r.value?.entries.some(
            (e: fitting.FittedNode) => e.frame?.bounds === bounds
          )
        )
      )
    ).toBe(false)
    armed = false
    expect(solve(q).lower).toBeGreaterThan(4.99)
    expect(fit).toHaveBeenCalledTimes(1)
  }
)

it('retains the first complete geometry when the second receipt is interrupted', () => {
  const second = source(),
    base = fitting.prepareFittedIndex,
    error = new MeshWorkLimit('cancelled')
  const fit = vi
    .spyOn(fitting, 'prepareFittedIndex')
    .mockImplementation((g, i, check, own) => {
      if (g === second)
        return base(
          g,
          i,
          () => {
            check()
            throw error
          },
          own
        )
      return base(g, i, check, own)
    })
  const q = candidate(),
    b = shape(-12, 9, second)
  expect(() => q.distance(pair[0], b, 0.02, 1e-6, 48)).toThrow(error)
  expect(fit.mock.calls.map(([g]) => g)).toEqual([geometry, second])
  fit.mockImplementation(base)
  expect(q.distance(pair[0], b, 0.02, 1e-6, 48).lower).toBeGreaterThan(4.99)
  expect(fit.mock.calls.map(([g]) => g)).toEqual([geometry, second, second])
})

it('uses original source bounds when fitted preparation cannot certify a frame', () => {
  const base = fitting.prepareFittedIndex
  const fit = vi
    .spyOn(fitting, 'prepareFittedIndex')
    .mockImplementation((...args) => {
      const result = base(...args)
      return result
        ? Object.freeze({ ...result, frameFor: () => undefined })
        : undefined
    })
  const reference = solve(new OriginalMeshQuery()),
    q = candidate()
  expect(solve(q)).toEqual(reference)
  expect(fit).toHaveBeenCalledTimes(1)
})
