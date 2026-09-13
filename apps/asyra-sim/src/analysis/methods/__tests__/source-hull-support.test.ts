import { expect, it } from 'vitest'
import { interval, nextDown } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { Vec3 } from '../../../domain/math'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { buildMeshIndex, refineMeshIndex, type MeshNode } from '../mesh-index'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import {
  SourceEventCredits,
  SourceHullLifetime,
  SourceHullPreparation,
  sourceHullSeparation,
  sourceSupport,
  type SupportCharge
} from '../__fixtures__/source-hull-support'

const ops = poseOperations(intervalAlgebra),
  ignore = () => undefined
const pose = (x = 0, y = 0, z = 0) =>
  ops.fromPose({ position: [x, y, z], rotation: [0, 0, 0, 1] })
// Original project-authored synthetic solids, not hardware or public evidence.
function mesh(positions: number[], indices: number[]): MeshGeometry {
  return Object.freeze({
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
    positions: Object.freeze(positions),
    indices: Object.freeze(indices)
  })
}
function cube(size = 1, dent?: number): MeshGeometry {
  const points = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1
  ].map((v) => v * size)
  const indices = [
    0, 2, 1, 0, 3, 2, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1,
    2, 6, 1, 6, 5
  ]
  if (dent === undefined) indices.push(4, 5, 6, 4, 6, 7)
  else {
    points.push(0, 0, dent * size)
    indices.push(4, 5, 8, 5, 6, 8, 6, 7, 8, 7, 4, 8)
  }
  return mesh(points, indices)
}
function uShape(): MeshGeometry {
  const outline = [
    [-3, -3],
    [3, -3],
    [3, 3],
    [1, 3],
    [1, -1],
    [-1, -1],
    [-1, 3],
    [-3, 3]
  ]
  const positions = [-0.25, 0.25].flatMap((z) =>
    outline.flatMap(([x, y]) => [x, y, z])
  )
  const faces = [
      [0, 1, 4],
      [1, 2, 3],
      [1, 3, 4],
      [0, 4, 5],
      [0, 5, 7],
      [5, 6, 7]
    ],
    indices: number[] = []
  for (const [a, b, c] of faces) indices.push(c, b, a, a + 8, b + 8, c + 8)
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8
    indices.push(i, j, j + 8, i, j + 8, i + 8)
  }
  return mesh(positions, indices)
}
function subdivide(geometry: MeshGeometry): MeshGeometry {
  const positions: number[] = [],
    indices: number[] = []
  for (let offset = 0; offset < geometry.indices.length; offset += 3) {
    const points = [0, 1, 2].map((i) =>
      geometry.positions.slice(
        geometry.indices[offset + i] * 3,
        geometry.indices[offset + i] * 3 + 3
      )
    )
    const midpoint = (a: number[], b: number[]) =>
      a.map((v, i) => (v + b[i]) / 2)
    const vertices = [
      ...points,
      midpoint(points[0], points[1]),
      midpoint(points[1], points[2]),
      midpoint(points[2], points[0])
    ]
    const base = positions.length / 3
    positions.push(...vertices.flat())
    indices.push(...[0, 3, 5, 3, 1, 4, 5, 4, 2, 3, 4, 5].map((i) => base + i))
  }
  return mesh(positions, indices)
}
const index = (geometry: MeshGeometry) =>
  refineMeshIndex(buildMeshIndex(geometry, ignore), ignore)
const prepare = (geometry: MeshGeometry) =>
  new SourceHullPreparation(index(geometry), ignore).components[0]

it('covers every source offset and encloses independent exact full-vertex maxima including coplanar and one-ulp dents', () => {
  for (const dent of [undefined, 1, nextDown(1), 0.25]) {
    const geometry = cube(1, dent),
      component = prepare(geometry)
    const offsets: number[] = []
    const visit = (node: typeof component.root) => {
      offsets.push(...node.offsets)
      node.children.forEach(visit)
    }
    visit(component.root)
    expect(offsets.sort((a, b) => a - b)).toEqual(
      Array.from({ length: geometry.indices.length / 3 }, (_, i) => i * 3)
    )
    const p = {
      ...pose(4, -2, 1),
      rotation: [interval(0), interval(0), interval(1), interval(0)] as const
    }
    for (const d of [
      [1, 0, 0],
      [-1, 2, 0],
      [3, 4, 0],
      [0, 0, -2],
      [2, -1, 3]
    ] as Vec3[]) {
      const values: number[] = []
      for (let i = 0; i < geometry.positions.length; i += 3)
        values.push(
          (4 - geometry.positions[i]) * d[0] +
            (-2 - geometry.positions[i + 1]) * d[1] +
            (1 + geometry.positions[i + 2]) * d[2]
        )
      const expected = Math.max(...values),
        actual = sourceSupport(component, p, d, ignore).value
      expect(actual[0]).toBeLessThanOrEqual(expected)
      expect(actual[1]).toBeGreaterThanOrEqual(expected)
      expect(actual[1] - actual[0]).toBeLessThan(1e-10)
    }
  }
})

it('charges every visited node and leaf vertex occurrence while proving dominance pruning', () => {
  const component = prepare(subdivide(subdivide(cube()))),
    all = { nodes: 0, vertices: 0 }
  const visit = (node: typeof component.root) => {
    all.nodes++
    all.vertices += node.points.length
    node.children.forEach(visit)
  }
  visit(component.root)
  const charges: SupportCharge[] = []
  const support = sourceSupport(component, pose(), [1, 1, 1], (kind) =>
    charges.push(kind)
  )
  expect(support.value[0]).toBeLessThanOrEqual(3)
  expect(support.value[1]).toBeGreaterThanOrEqual(3)
  expect(charges.filter((v) => v === 'vertex').length).toBeLessThan(
    all.vertices
  )
  expect(charges.filter((v) => v === 'node').length).toBeLessThanOrEqual(
    all.nodes
  )
  expect(charges.filter((v) => v === 'direction')).toHaveLength(1)
  expect(charges.filter((v) => v === 'point')).toHaveLength(1)
  expect(charges.length).toBe(
    2 + charges.filter((v) => v === 'node' || v === 'vertex').length
  )
})

it('certifies concave-source separation in either order without an upper witness', () => {
  const component = prepare(cube(1, 0.25))
  const a = sourceHullSeparation(
    component,
    pose(),
    component,
    pose(4),
    0.5,
    ignore
  )
  const b = sourceHullSeparation(
    component,
    pose(4),
    component,
    pose(),
    0.5,
    ignore
  )
  expect(a).toBeGreaterThan(0.5)
  expect(a).toBeLessThanOrEqual(2)
  expect(b).toBeGreaterThan(0.5)
  expect(b).toBeLessThanOrEqual(2)
  expect(typeof a).toBe('number')
})

it('cannot turn hull overlap into source contact, penetration, or containment evidence', () => {
  const u = uShape(),
    small = cube(0.125),
    a = prepare(u),
    b = prepare(small)
  expect(sourceHullSeparation(a, pose(), b, pose(0, 1), 0, ignore)).toBe(0)
  const original = new OriginalMeshQuery().distance(
    { geometry: u, pose: pose() },
    { geometry: small, pose: pose(0, 1) },
    0.25,
    1e-6,
    64
  )
  expect(original.penetration).toBe(false)
  expect(original.lower).toBeGreaterThan(0.25)
  const big = prepare(cube())
  for (const p of [pose(), pose(1), pose(2)])
    expect(sourceHullSeparation(big, pose(), big, p, 0, ignore)).toBe(0)
  expect(sourceHullSeparation(big, pose(), b, pose(), 0, ignore)).toBe(0)
})

it('encloses full interval support and refuses endpoint-only clearance through an interior crossing', () => {
  const component = prepare(cube(0.125))
  const moving = {
    ...pose(),
    position: [interval(-2, 2), interval(0), interval(0)] as const
  }
  expect(
    sourceHullSeparation(component, pose(), component, pose(-2), 0.5, ignore)
  ).toBeGreaterThan(0.5)
  expect(
    sourceHullSeparation(component, pose(), component, pose(2), 0.5, ignore)
  ).toBeGreaterThan(0.5)
  expect(
    sourceHullSeparation(component, pose(), component, moving, 0.5, ignore)
  ).toBe(0)
  const supported = sourceSupport(component, moving, [1, 0, 0], ignore).value
  expect(supported[0]).toBeLessThanOrEqual(-1.875)
  expect(supported[1]).toBeGreaterThanOrEqual(2.125)
  const clear = {
    ...moving,
    position: [interval(-2, 2), interval(2), interval(0)] as const
  }
  const lower = sourceHullSeparation(
    component,
    pose(),
    component,
    clear,
    0.5,
    ignore
  )
  expect(lower).toBeGreaterThan(0.5)
  expect(lower).toBeLessThanOrEqual(1.75)
})

it('encloses every sampled rotation inside the complete quaternion interval, rather than its midpoint pose', () => {
  const component = prepare(cube()),
    moving = {
      ...pose(),
      rotation: [
        interval(0),
        interval(0),
        interval(0, 1),
        interval(0, 1)
      ] as const
    }
  const support = sourceSupport(component, moving, [1, 0, 0], ignore).value
  for (const angle of [0, Math.PI / 8, Math.PI / 4, Math.PI / 2, Math.PI]) {
    const exact = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle))
    expect(support[0]).toBeLessThanOrEqual(exact)
    expect(support[1]).toBeGreaterThanOrEqual(exact)
  }
})

it.each([2 ** -200, 1, 2 ** 200])(
  'uses the outward norm quotient at scale %s',
  (size) => {
    const component = prepare(cube(size))
    const lower = sourceHullSeparation(
      component,
      pose(),
      component,
      pose(5 * size, 6 * size),
      size,
      ignore
    )
    // Exact gaps are 3s and 4s, so squared distance is exactly 25s².
    expect(lower).toBeGreaterThan(size)
    expect(lower / size).toBeLessThanOrEqual(5)
  }
)

it('charges preparation exactly and snapshots points, bounds, and identities across cold/hot lifetimes', () => {
  const source = index(cube()),
    counts = { node: 0, triangle: 0 }
  const visit = (node: MeshNode) => {
    counts.node++
    counts.triangle += node.triangles.length
    node.children?.forEach(visit)
  }
  visit(source.root)
  const lifetime = new SourceHullLifetime(),
    cold: SupportCharge[] = [],
    hot: SupportCharge[] = []
  const invocation = lifetime.invocation((kind) => cold.push(kind)),
    prepared = invocation(source)
  expect(invocation(source)).toBe(prepared)
  expect(cold).toHaveLength(2 * (counts.node + counts.triangle) + 1)
  expect(lifetime.invocation((kind) => hot.push(kind))(source)).toBe(prepared)
  expect(hot).toEqual(cold)
  const before = sourceSupport(
    prepared.components[0],
    pose(),
    [1, 0, 0],
    ignore
  )
  const leaf = (node: MeshNode): MeshNode =>
    node.children ? leaf(node.children[0]) : node
  const changed = leaf(source.root)
  ;(changed.triangles[0].vertices[0] as unknown as number[])[0] = 100
  ;(changed.bounds[0] as unknown as number[])[1] = 200
  expect(
    sourceSupport(prepared.components[0], pose(), [1, 0, 0], ignore)
  ).toEqual(before)
  const rebuilt = index(cube(2)),
    fresh: SupportCharge[] = []
  expect(lifetime.invocation((kind) => fresh.push(kind))(rebuilt)).not.toBe(
    prepared
  )
  expect(fresh.length).toBe(cold.length)
})

it('does not publish interrupted preparation and propagates cancellation at every paid stage', () => {
  const source = index(cube()),
    component = prepare(cube()),
    seen = new Set<SupportCharge>(),
    sentinel = new MeshWorkLimit('cancelled support')
  new SourceHullPreparation(source, (kind) => seen.add(kind))
  sourceHullSeparation(component, pose(), component, pose(4), 0.1, (kind) =>
    seen.add(kind)
  )
  sourceHullSeparation(component, pose(), component, pose(1, 1), 0.1, (kind) =>
    seen.add(kind)
  )
  for (const stage of seen) {
    const pay = (kind: SupportCharge) => {
      if (kind === stage) throw sentinel
    }
    if (
      stage.startsWith('prepare') ||
      stage === 'publish-component' ||
      stage === 'publish-owner'
    ) {
      const lifetime = new SourceHullLifetime()
      expect(() => lifetime.invocation(pay)(source)).toThrow(sentinel)
      const retried: SupportCharge[] = []
      lifetime.invocation((kind) => retried.push(kind))(source)
      expect(retried).toContain('prepare-node')
    } else {
      const run = () =>
        sourceHullSeparation(
          component,
          pose(),
          component,
          stage === 'simplex' ? pose(1, 1) : pose(4),
          0.1,
          pay
        )
      expect(run).toThrow(sentinel)
    }
  }
  expect(seen).toContain('simplex')
  expect(seen).toContain('publish')
  const lifetime = new SourceHullLifetime(),
    prepared = lifetime.invocation(ignore)(source)
  expect(() =>
    prepared.owner(source.root.bounds, () => {
      throw sentinel
    })
  ).toThrow(sentinel)
  expect(() =>
    lifetime.invocation(() => {
      throw sentinel
    })(source)
  ).toThrow(sentinel)
  const retry: SupportCharge[] = []
  lifetime.invocation((kind) => retry.push(kind))(source)
  expect(retry).toEqual(prepared.charges)
})

it('rejects incomplete component roots and duplicate source occurrences', () => {
  const a = index(cube()),
    b = index(cube())
  const malformed = {
    ...a,
    root: {
      bounds: a.root.bounds,
      triangles: [],
      children: [a.root, b.root] as const
    }
  }
  expect(() => new SourceHullPreparation(malformed, ignore)).toThrow(
    'Duplicate source triangle'
  )
})

it('deduplicates actual charged event identities and forbids earlier, foreign, membership, preparation and upper credit', () => {
  const credits = new SourceEventCredits(),
    certificate = { query: 1, componentPair: '0:2', after: 10 }
  const kinds = [
    'node',
    'axis',
    'triangle',
    'membership',
    'preparation',
    'upper'
  ] as const
  kinds.forEach((kind, i) =>
    credits.record({ id: 11 + i, query: 1, componentPair: '0:2', kind })
  )
  credits.record({ id: 9, query: 1, componentPair: '0:2', kind: 'node' })
  credits.record({ id: 17, query: 2, componentPair: '0:2', kind: 'node' })
  credits.record({ id: 18, query: 1, componentPair: '1:2', kind: 'node' })
  for (let repeat = 0; repeat < 2; repeat++)
    for (let id = 9; id < 20; id++) credits.credit(id, certificate)
  expect(credits.credited).toEqual([11, 12, 13])
  expect(() =>
    credits.record({ id: 11, query: 1, componentPair: '0:2', kind: 'axis' })
  ).toThrow('Duplicate charged event identity')
})
