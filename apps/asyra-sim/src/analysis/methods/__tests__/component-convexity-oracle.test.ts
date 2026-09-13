import { expect, it } from 'vitest'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { inspectMeshTopology } from '../../../domain/mesh-topology'
import {
  exactOrientation,
  inspectLocalConvexity
} from '../__fixtures__/component-convexity-oracle'

function topFan(dent = 0): MeshGeometry {
  return {
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] },
    positions: [
      -1,
      -1,
      -1,
      1,
      -1,
      -1,
      1,
      1,
      -1,
      -1,
      1,
      -1,
      -1,
      -1,
      1,
      1,
      -1,
      1,
      1,
      1,
      1,
      -1,
      1,
      1,
      0,
      0,
      1 - dent
    ],
    indices: [
      0, 2, 1, 0, 3, 2, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1,
      2, 6, 1, 6, 5, 4, 5, 8, 5, 6, 8, 6, 7, 8, 7, 4, 8
    ]
  }
}
function component(geometry: MeshGeometry) {
  const topology = inspectMeshTopology(geometry)
  expect(topology.issue).toBeNull()
  expect(topology.components).toHaveLength(1)
  return topology.components[0]
}
it('computes the exact dyadic sign at ordinary, subnormal and extreme scales', () => {
  for (const scale of [1, 2 ** -1074, 2 ** 900]) {
    const value = exactOrientation([
      [0, 0, 0],
      [scale, 0, 0],
      [0, scale, 0],
      [0, 0, scale]
    ])
    expect(value.sign).toBe(1)
    const expectedExponent = 3 * Math.log2(scale)
    expect(BigInt(value.coefficient)).toBe(
      1n << BigInt(expectedExponent - value.exponent)
    )
    expect(BigInt(value.coefficient)).toBeGreaterThan(0n)
    expect(
      exactOrientation([
        [0, 0, 0],
        [0, scale, 0],
        [scale, 0, 0],
        [0, 0, scale]
      ]).sign
    ).toBe(-1)
  }
  expect(
    exactOrientation([
      [1, 1, 1],
      [2, 1, 1],
      [1, 2, 1],
      [1, 1, 1 + 2 ** -52]
    ]).sign
  ).toBe(1)
})
it('keeps exact coplanarity undecided instead of issuing a positive convex capability', () => {
  const g = topFan(),
    offsets = component(g)
  const result = inspectLocalConvexity(g, offsets, () => undefined)
  expect(result.state).toBe('undecided')
  expect(result.coplanar).toBeGreaterThan(0)
  expect(result.positive === 0 || result.negative === 0).toBe(true)
  expect(result.positive + result.negative).toBeGreaterThan(0)
})
it('proves even a one-ulp reflex fold and reverses signs under source orientation reversal', () => {
  const g = topFan(2 ** -52),
    before = JSON.stringify(g),
    offsets = component(g)
  const result = inspectLocalConvexity(g, offsets, () => undefined)
  expect(result.state).toBe('reflex')
  expect(result.positive).toBeGreaterThan(0)
  expect(result.negative).toBeGreaterThan(0)
  expect(result.witnesses.map((w) => w.sign).sort()).toEqual([-1, 1])
  for (const witness of result.witnesses)
    expect(BigInt(witness.coefficient)).not.toBe(0n)
  expect(JSON.stringify(g)).toBe(before)
  const reversed = {
    ...g,
    indices: g.indices.flatMap((_v, i, a) =>
      i % 3 === 0 ? [a[i], a[i + 2], a[i + 1]] : []
    )
  }
  const inverse = inspectLocalConvexity(
    reversed,
    component(reversed),
    () => undefined
  )
  expect(inverse.state).toBe('reflex')
  expect(inverse.positive).toBe(result.negative)
  expect(inverse.negative).toBe(result.positive)
  expect(inverse.coplanar).toBe(result.coplanar)
})
it('never classifies a locally convex self-intersecting star bipyramid as a certified solid', () => {
  const g: MeshGeometry = {
    kind: 'mesh',
    version: 1,
    source: { assetId: 'b'.repeat(64), scale: [1, 1, 1] },
    positions: [
      0, 3, 0, -2, -3, 0, 3, 1, 0, -3, 1, 0, 2, -3, 0, 0, 0, 2, 0, 0, -2
    ],
    indices: Array.from({ length: 5 }, (_, i) => [
      i,
      (i + 1) % 5,
      5,
      (i + 1) % 5,
      i,
      6
    ]).flat()
  }
  const result = inspectLocalConvexity(g, component(g), () => undefined)
  expect(result.state).toBe('undecided')
  expect(result.positive === 0 || result.negative === 0).toBe(true)
})
it('accounts for every unique edge and predicate and cancels before publication at every paid stage', () => {
  const g = topFan(),
    offsets = component(g),
    triangles = offsets.length,
    edges = (triangles * 3) / 2
  const expected =
    Math.ceil(triangles / 256) +
    Math.ceil((3 * triangles) / 256) +
    edges +
    edges +
    1
  let work = 0
  const result = inspectLocalConvexity(g, offsets, () => work++)
  expect(work).toBe(expected)
  expect(result.work).toBe(expected)
  for (let stop = 1; stop <= expected; stop++) {
    let calls = 0,
      published: ReturnType<typeof inspectLocalConvexity> | undefined
    expect(() => {
      published = inspectLocalConvexity(g, offsets, () => {
        if (++calls === stop) throw new Error('cancelled')
      })
    }).toThrow('cancelled')
    expect(calls).toBe(stop)
    expect(published).toBeUndefined()
  }
})
