import { afterEach, expect, it, vi } from 'vitest'
import { interval } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { ConvexShape } from '../convex-query'
import * as mesh from '../mesh-index'
import type {
  Bounds,
  MeshIndex,
  MeshNode,
  MeshTriangle,
  PreparedMeshIndex
} from '../mesh-index'
import { meshMembership } from '../mesh-membership'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'

// Independent three closed boxes: nested solids and an overlapping component.
function source(): MeshGeometry {
  const positions: number[] = [],
    indices: number[] = []
  for (const [x, radius] of [
    [0, 2],
    [0, 1 / 2],
    [7 / 4, 1 / 2]
  ]) {
    const offset = positions.length / 3
    for (const [a, b, c] of [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1]
    ])
      positions.push(x + a * radius, b * radius, c * radius)
    for (const i of [
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2,
      3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7
    ])
      indices.push(i + offset)
  }
  return Object.freeze({
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
    positions: Object.freeze(positions),
    indices: Object.freeze(indices)
  })
}
const refine = mesh.refineMeshIndex
const ops = poseOperations(intervalAlgebra)
const shape = (geometry: MeshGeometry, y: number): ConvexShape => ({
  geometry,
  pose: ops.fromPose({ position: [0, y, 0], rotation: [0, 0, 0, 1] })
})
const query = (
  context: OriginalMeshQuery,
  geometry: MeshGeometry,
  reverse = false
) => {
  const pair = [shape(geometry, 0), shape(geometry, 4 + 1 / 32)] as const
  return context.distance(
    pair[reverse ? 1 : 0],
    pair[reverse ? 0 : 1],
    1 / 16,
    1e-6,
    48
  )
}
function inspect(root: MeshNode) {
  const seen = new Set<MeshNode>(),
    triangles: MeshTriangle[] = []
  let leaves = 0
  function visit(node: MeshNode) {
    expect(seen.has(node)).toBe(false)
    seen.add(node)
    if (node.children) {
      expect(node.triangles).toEqual([])
      const [a, b] = node.children
      expect(node.bounds).toEqual(
        a.bounds.map((axis, i) => [
          Math.min(axis[0], b.bounds[i][0]),
          Math.max(axis[1], b.bounds[i][1])
        ])
      )
      node.children.forEach(visit)
    } else {
      leaves++
      triangles.push(...node.triangles)
      expect(node.bounds).toEqual(
        [0, 1, 2].map((axis) => [
          Math.min(
            ...node.triangles.flatMap((t) => t.vertices.map((v) => v[axis]))
          ),
          Math.max(
            ...node.triangles.flatMap((t) => t.vertices.map((v) => v[axis]))
          )
        ])
      )
    }
  }
  visit(root)
  return { seen, triangles, leaves }
}
afterEach(() => vi.restoreAllMocks())

it.each([4, 1] as const)(
  'partitions every original source once with independently counted preparation - %i',
  (limit) => {
    const original = mesh.buildMeshIndex(source(), () => undefined),
      before = inspect(original.root),
      fingerprint = JSON.stringify(original)
    let work = 0
    const result = refine(original, () => work++, limit),
      after = inspect(result.root)
    expect(result.representatives).toBe(original.representatives)
    expect(result.componentCount).toBe(3)
    expect(after.triangles.length).toBe(36)
    expect(new Set(after.triangles)).toEqual(new Set(before.triangles))
    for (const node of after.seen)
      if (!node.children) {
        expect(node.triangles.length).toBeLessThanOrEqual(limit)
        expect(new Set(node.triangles.map((t) => t.component)).size).toBe(1)
      }
    // Each component has twelve triangles: leaf4 => four leaves, leaf1 => twelve.
    const componentLeaves = limit === 4 ? 4 : 12
    const componentNodes = 2 * componentLeaves - 1
    expect(after.leaves).toBe(3 * componentLeaves)
    expect(after.seen.size).toBe(3 * componentNodes + 2)
    const charges = {
      originalVisits: before.seen.size,
      grouping: 1,
      triangleBuilds: 3 * componentNodes,
      triangleBoundsScans: 3 * componentNodes,
      triangleSortChunks: 3 * (componentLeaves - 1),
      topBuilds: 5,
      topBoundsScans: 2,
      topSortChunks: 2
    }
    expect(charges.originalVisits).toBe(23)
    expect(work).toBe(
      Object.values(charges).reduce((sum, value) => sum + value, 0)
    )
    expect(work).toBe(limit === 4 ? 84 : 204)
    expect(JSON.stringify(original)).toBe(fingerprint)
    for (const [point, expected] of [
      [[0, 0, 0], 'inside'],
      [[1.5, 0, 0], 'inside'],
      [[5, 0, 0], 'outside'],
      [[0, 2, 0], 'unknown']
    ] as const) {
      const value = point.map((x) => interval(x)) as unknown as readonly [
        ReturnType<typeof interval>,
        ReturnType<typeof interval>,
        ReturnType<typeof interval>
      ]
      expect(meshMembership(value, result, () => undefined)).toBe(expected)
      expect(meshMembership(value, original, () => undefined)).toBe(expected)
    }
  }
)

it('keeps the implicit default identical to explicit four without changing its cost', () => {
  const original = mesh.buildMeshIndex(source(), () => undefined)
  let implicit = 0,
    explicit = 0
  expect(refine(original, () => implicit++)).toEqual(
    refine(original, () => explicit++, 4)
  )
  expect(implicit).toBe(84)
  expect(explicit).toBe(implicit)
})

it.each([1, 23, 24, 25, 80, 203])(
  'cancels actual preparation at paid operation %i without mutating the source',
  (stop) => {
    const original = mesh.buildMeshIndex(source(), () => undefined),
      fingerprint = JSON.stringify(original)
    let work = 0
    expect(() =>
      refine(
        original,
        () => {
          if (++work === stop) throw new MeshWorkLimit('test cancellation')
        },
        1
      )
    ).toThrow(MeshWorkLimit)
    expect(work).toBe(stop)
    expect(JSON.stringify(original)).toBe(fingerprint)
    let retry = 0
    refine(original, () => retry++, 1)
    expect(retry).toBe(204)
  }
)

it('charges identical complete singleton preparation cold and warm in an isolated policy map', () => {
  const geometry = source(),
    prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>()
  const spy = vi
    .spyOn(mesh, 'refineMeshIndex')
    .mockImplementation((index, checkpoint) => refine(index, checkpoint, 1))
  const cold = new OriginalMeshQuery(undefined, 500000, true, prepared),
    evidence = query(cold, geometry)
  expect(spy).toHaveBeenCalledTimes(1)
  const warm = new OriginalMeshQuery(undefined, 500000, true, prepared)
  expect(query(warm, geometry)).toEqual(evidence)
  expect(warm.work).toBe(cold.work)
  expect(spy).toHaveBeenCalledTimes(1)
  const refined = prepared.get(geometry)?.refinement?.index
  expect(refined).toBeDefined()
  if (!refined) throw new Error('Missing fully paid singleton index')
  expect(inspect(refined.root).leaves).toBe(36)
  // Exact dyadic source boxes have distance 1/32; no rounded solver oracle.
  expect(evidence.penetration).toBe(false)
  expect(evidence.lower).toBeGreaterThanOrEqual(0)
  expect(evidence.lower).toBeLessThanOrEqual(1 / 32)
  expect(evidence.upper).toBeGreaterThanOrEqual(1 / 32)
  const reversed = query(new OriginalMeshQuery(), geometry, true)
  expect(reversed.penetration).toBe(false)
  expect(reversed.lower).toBeLessThanOrEqual(1 / 32)
  expect(reversed.upper).toBeGreaterThanOrEqual(1 / 32)
})

it('does not retain partial singleton preparation and charges the next complete retry', () => {
  const geometry = source(),
    prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>()
  let count = 0
  vi.spyOn(mesh, 'refineMeshIndex')
    .mockImplementationOnce((index, checkpoint) =>
      refine(
        index,
        () => {
          checkpoint()
          if (++count === 80)
            throw new MeshWorkLimit('interrupted singleton preparation')
        },
        1
      )
    )
    .mockImplementation((index, checkpoint) => refine(index, checkpoint, 1))
  expect(() =>
    query(new OriginalMeshQuery(undefined, 500000, true, prepared), geometry)
  ).toThrow(MeshWorkLimit)
  expect(prepared.get(geometry)?.refinement).toBeUndefined()
  const retry = new OriginalMeshQuery(undefined, 500000, true, prepared),
    fresh = new OriginalMeshQuery()
  expect(query(retry, geometry)).toEqual(query(fresh, geometry))
  expect(retry.work).toBe(fresh.work)
})

type NodeGap = (
  a: ConvexShape,
  b: ConvexShape,
  an: MeshNode | undefined,
  bn: MeshNode | undefined,
  gap: number,
  threshold: number
) => number
type ProjectGap = (
  a: ConvexShape,
  b: ConvexShape,
  ab: Bounds | undefined,
  bb: Bounds | undefined,
  gap: number,
  threshold: number
) => number
it('keeps the new actual-node entry neutral and delegates the exact bounds without extra charges', () => {
  const owner = OriginalMeshQuery.prototype as unknown as {
    nodeGap: NodeGap
    projectGap: ProjectGap
  }
  expect(typeof owner.nodeGap).toBe('function')
  const original = mesh.buildMeshIndex(source(), () => undefined),
    a = shape(source(), 0),
    b = shape(source(), 1)
  const spy = vi.spyOn(owner, 'projectGap').mockReturnValue(0.125)
  const context = new OriginalMeshQuery(),
    before = context.work
  expect(
    owner.nodeGap.call(
      context,
      a,
      b,
      original.root,
      original.root,
      0.03125,
      0.0625
    )
  ).toBe(0.125)
  expect(spy).toHaveBeenCalledExactlyOnceWith(
    a,
    b,
    original.root.bounds,
    original.root.bounds,
    0.03125,
    0.0625
  )
  expect(context.work).toBe(before)
})

it('uses actual refined nodes only after membership and keeps root and interval rejection separate', () => {
  const geometry = source(),
    nodes = new Set<MeshNode>()
  const owner = OriginalMeshQuery.prototype as unknown as { nodeGap: NodeGap }
  const originalNodeGap = owner.nodeGap
  const build = vi
    .spyOn(mesh, 'refineMeshIndex')
    .mockImplementation((index, checkpoint) => {
      const result = refine(index, checkpoint, 1)
      for (const node of inspect(result.root).seen) nodes.add(node)
      return result
    })
  const gap = vi.spyOn(owner, 'nodeGap').mockImplementation(function (
    this: OriginalMeshQuery,
    ...args
  ) {
    expect(build).toHaveBeenCalled()
    if (!args[2] || !args[3]) throw new Error('Missing actual mesh nodes')
    expect(nodes.has(args[2])).toBe(true)
    expect(nodes.has(args[3])).toBe(true)
    return originalNodeGap.apply(this, args)
  })
  const context = new OriginalMeshQuery(),
    a = shape(geometry, 0),
    b = shape(geometry, 4 + 1 / 32)
  context.distance(a, shape(geometry, 20), 1 / 16, 1e-6, 48)
  expect(gap).not.toHaveBeenCalled()
  const sphere: ConvexShape = {
    geometry: { kind: 'sphere', radius: 1 / 1024 },
    pose: ops.fromPose({ position: [0, 0, 0], rotation: [0, 0, 0, 1] })
  }
  expect(context.distance(a, sphere, 1 / 16, 1e-6, 48).penetration).toBe(true)
  expect(gap).not.toHaveBeenCalled()
  const evidence = context.distance(a, b, 1 / 16, 1e-6, 48),
    calls = gap.mock.calls.length
  expect(calls).toBeGreaterThan(0)
  context.lowerOver(a, b, 1 / 16, evidence)
  expect(gap).toHaveBeenCalledTimes(calls)
})

it('does not publish a warm invocation before its complete singleton preparation charge', () => {
  const geometry = source(),
    prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>()
  vi.spyOn(mesh, 'refineMeshIndex').mockImplementation((index, checkpoint) =>
    refine(index, checkpoint, 1)
  )
  type Traversal = (
    shape: ConvexShape,
    index?: MeshIndex
  ) => MeshIndex | undefined
  const owner = OriginalMeshQuery.prototype as unknown as {
    traversalIndex: Traversal
  }
  const originalTraversal = owner.traversalIndex
  let beforeRefinement: number | undefined
  vi.spyOn(owner, 'traversalIndex').mockImplementation(function (
    this: OriginalMeshQuery,
    ...args
  ) {
    beforeRefinement ??= this.work
    return originalTraversal.apply(this, args)
  })
  const cold = new OriginalMeshQuery(undefined, 500000, true, prepared),
    result = query(cold, geometry)
  const completed = prepared.get(geometry)?.refinement
  expect(completed?.work).toBe(204)
  if (beforeRefinement === undefined || !completed)
    throw new Error('Missing paid preparation boundary')
  const interrupted = new OriginalMeshQuery(
    undefined,
    beforeRefinement + completed.work - 1,
    true,
    prepared
  )
  expect(() => query(interrupted, geometry)).toThrow(MeshWorkLimit)
  expect(prepared.get(geometry)?.refinement).toBe(completed)
  const retry = new OriginalMeshQuery(undefined, 500000, true, prepared)
  expect(query(retry, geometry)).toEqual(result)
  expect(retry.work).toBe(cold.work)
})
