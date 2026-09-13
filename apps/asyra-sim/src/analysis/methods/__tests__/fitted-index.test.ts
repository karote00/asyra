import { expect, it } from 'vitest'
import { buildMeshIndex, refineMeshIndex, type MeshNode } from '../mesh-index'
import { prepareFittedIndex } from '../fitted-index'
import {
  source,
  rotation,
  sum,
  mul,
  rational,
  enclosed
} from '../__fixtures__/source-frame-oracle'

function setup(copies = 1) {
  const geometry = source(copies)
  const index = refineMeshIndex(
    buildMeshIndex(geometry, () => undefined),
    () => undefined
  )
  return { geometry, index }
}
function expected(node: MeshNode): {
  nodes: MeshNode[]
  triangles: number
  moments: number
  extrema: number
} {
  if (!node.children)
    return {
      nodes: [node],
      triangles: node.triangles.length,
      moments: Math.ceil((node.triangles.length * 3) / 256),
      extrema: Math.ceil((node.triangles.length * 3) / 256)
    }
  const a = expected(node.children[0]),
    b = expected(node.children[1])
  return {
    nodes: [node, ...a.nodes, ...b.nodes],
    triangles: a.triangles + b.triangles,
    moments: a.moments + b.moments + 1,
    extrema:
      a.extrema + b.extrema + Math.ceil(((a.triangles + b.triangles) * 3) / 256)
  }
}
it.each([
  [1, 30],
  [2, 66],
  [14, 499]
])(
  'preserves the existing tree and exact paid preparation - %i components',
  (copies, total) => {
    const { geometry, index } = setup(copies),
      before = JSON.stringify(index),
      e = expected(index.root)
    const fees = {
      admission: 1,
      collection: e.nodes.length,
      append: Math.ceil(e.triangles / 256),
      moments: e.moments,
      rotations: 3 * e.nodes.length,
      frameAdmission: e.nodes.length,
      normalization: e.nodes.length,
      extrema: e.extrema,
      framePublication: e.nodes.length,
      publication: 1
    }
    expect(Object.values(fees).reduce((a, b) => a + b, 0)).toBe(total)
    let work = 0
    const result = prepareFittedIndex(geometry, index, () => work++)
    expect(result).toBeDefined()
    if (!result) throw new Error('Missing fitted index')
    expect(work).toBe(total)
    expect(result.work).toBe(work)
    expect(result.geometry).toBe(geometry)
    expect(result.index).toBe(index)
    expect(result.entries.map((entry) => entry.node)).toEqual(e.nodes)
    result.entries.forEach((entry, i) => expect(entry.node).toBe(e.nodes[i]))
    expect(result.offsets).toHaveLength(geometry.indices.length / 3)
    expect([...result.offsets].sort((a, b) => a - b)).toEqual(
      Array.from({ length: geometry.indices.length / 3 }, (_, i) => i * 3)
    )
    expect(result.triangles).toHaveLength(e.triangles)
    expect(new Set(result.triangles).size).toBe(e.triangles)
    result.triangles.forEach((triangle, i) => {
      expect(result.offsets[i]).toBe(triangle.offset)
      expect(result.components[i]).toBe(triangle.component)
    })
    for (const entry of result.entries) {
      expect(entry.frame?.source.kind).toBe('node')
      if (!entry.frame || entry.frame.source.kind !== 'node')
        throw new Error('Missing span certificate')
      const span = entry.frame.source
      expect(span.geometry).toBe(geometry)
      expect(span.index).toBe(index)
      expect(span.node).toBe(entry.node)
      expect(span.offsets).toBe(result.offsets)
      expect(span.start).toBe(entry.start)
      expect(span.end).toBe(entry.end)
      expect(Object.isFrozen(span)).toBe(true)
      const matrix = rotation(entry.proposal)
      for (let i = entry.start; i < entry.end; i++)
        for (let corner = 0; corner < 3; corner++) {
          const vertex = geometry.indices[result.offsets[i] + corner]
          for (let axis = 0; axis < 3; axis++)
            enclosed(
              sum(
                [0, 1, 2].map((j) =>
                  mul(
                    matrix[j][axis],
                    rational(geometry.positions[3 * vertex + j])
                  )
                )
              ),
              entry.frame.bounds[axis]
            )
        }
    }
    expect(JSON.stringify(index)).toBe(before)
    for (const value of [
      result,
      result.offsets,
      result.triangles,
      result.components,
      result.entries
    ])
      expect(Object.isFrozen(value)).toBe(true)
    let repeat = 0
    expect(prepareFittedIndex(geometry, index, () => repeat++)).toEqual(result)
    expect(repeat).toBe(total)
  }
)
it('proposes the known octahedron principal frame without rebuilding its leaves', () => {
  const { geometry, index } = setup()
  const result = prepareFittedIndex(geometry, index, () => undefined)
  const frame = result?.entries[0].frame
  if (!frame) throw new Error('Missing fitted root')
  const widths = frame.bounds.map(([lo, hi]) => hi - lo).sort((a, b) => a - b)
  expect(widths[0]).toBeCloseTo(1.25, 10)
  expect(widths[1]).toBeCloseTo(10, 10)
  expect(widths[2]).toBeCloseTo(40, 10)
})
it('snapshots offsets before proposal callbacks can mutate diagnostic triangle objects', () => {
  const { geometry, index } = setup()
  const control = prepareFittedIndex(geometry, index, () => undefined)
  if (!control) throw new Error('Missing control')
  let work = 0
  // admission + three collection nodes + one append chunk are complete at 5.
  const result = prepareFittedIndex(geometry, index, () => {
    if (++work === 6)
      control.triangles.forEach((t) => {
        t.offset = -3
      })
  })
  expect(result?.offsets).toEqual(control.offsets)
  expect(result?.entries.map((e) => e.frame)).toEqual(
    control.entries.map((e) => e.frame)
  )
  expect(result?.work).toBe(30)
})
it('rejects duplicate source membership instead of certifying a misleading full root', () => {
  const { geometry, index } = setup()
  const a = index.root.children?.[0],
    b = index.root.children?.[1]
  if (!a || !b) throw new Error('Expected two original leaves')
  b.triangles = [...a.triangles]
  expect(() => prepareFittedIndex(geometry, index, () => undefined)).toThrow(
    'Incomplete original source partition'
  )
})
it('retains invalid proposal nodes without publishing a certificate', () => {
  const { geometry, index } = setup()
  const huge = Object.freeze({
    ...geometry,
    positions: Object.freeze(
      geometry.positions.map((x, i) => (i % 3 === 0 ? x * 1e154 : x))
    )
  })
  // Geometry remains finite. A moment may overflow; this cannot establish a frame.
  const hugeIndex = refineMeshIndex(
    buildMeshIndex(huge, () => undefined),
    () => undefined
  )
  const result = prepareFittedIndex(huge, hugeIndex, () => undefined)
  expect(result?.entries).toHaveLength(expected(hugeIndex.root).nodes.length)
  expect(result?.entries.some((entry) => entry.frame === undefined)).toBe(true)
  expect(index.root).toBeDefined()
})
it('never returns partial preparation at any paid stage and retries from original source', () => {
  const { geometry, index } = setup(),
    failure = new Error('cancelled')
  for (let stop = 1; stop <= 30; stop++) {
    let calls = 0,
      published: ReturnType<typeof prepareFittedIndex>
    expect(() => {
      published = prepareFittedIndex(geometry, index, () => {
        if (++calls === stop) throw failure
      })
    }).toThrow(failure)
    expect(published).toBeUndefined()
    expect(calls).toBe(stop)
  }
  let work = 0
  expect(prepareFittedIndex(geometry, index, () => work++)?.work).toBe(30)
  expect(work).toBe(30)
})
