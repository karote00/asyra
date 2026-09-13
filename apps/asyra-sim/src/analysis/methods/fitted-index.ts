import { multiply, type Quaternion, type Vec3 } from '../../domain/math'
import type { MeshGeometry } from '../../domain/part-geometry'
import {
  boundsOf,
  meshPoint,
  type Bounds,
  type MeshIndex,
  type MeshNode,
  type MeshTriangle
} from './mesh-index'
import { prepareSourceSpanFrame, type SourceFrame } from './source-frame'

interface Span {
  node: MeshNode
  start: number
  end: number
  children?: readonly [number, number]
  bounds?: Bounds
}
export interface FittedNode {
  readonly node: MeshNode
  readonly traversalNode?: MeshNode
  readonly start: number
  readonly end: number
  readonly proposal: Quaternion
  readonly frame: SourceFrame | undefined
}
export interface FittedIndex {
  readonly geometry: MeshGeometry
  readonly index: MeshIndex
  readonly offsets: readonly number[]
  readonly components: readonly number[]
  readonly triangles: readonly MeshTriangle[]
  readonly entries: readonly FittedNode[]
  readonly work: number
  readonly traversal?: MeshIndex
  readonly frameFor?: (node: MeshNode) => SourceFrame | undefined
}
interface Moments {
  count: number
  mean: number[]
  scatter: number[][]
}
const matrix = () => Array.from({ length: 3 }, () => [0, 0, 0])
function merge(a: Moments, b: Moments): Moments {
  const count = a.count + b.count,
    delta = b.mean.map((v, i) => v - a.mean[i])
  return {
    count,
    mean: a.mean.map((v, i) => v + (delta[i] * b.count) / count),
    scatter: a.scatter.map((row, i) =>
      row.map(
        (v, j) =>
          v +
          b.scatter[i][j] +
          delta[i] * delta[j] * ((a.count * b.count) / count)
      )
    )
  }
}
/** Exactly three direction proposals. Their numerical accuracy is not a certificate. */
function propose(moments: Moments, tick: () => void): Quaternion {
  let a = moments.scatter.map((row) => [...row]),
    q: Quaternion = [0, 0, 0, 1]
  for (const [p, r] of [
    [0, 1],
    [0, 2],
    [1, 2]
  ]) {
    tick()
    if (!a.every((row) => row.every(Number.isFinite))) {
      q = [NaN, 0, 0, 0]
      continue
    }
    if (a[p][r] === 0) continue
    const theta = Math.atan2(2 * a[p][r], a[p][p] - a[r][r]) / 2,
      c = Math.cos(theta),
      s = Math.sin(theta)
    if (!Number.isFinite(theta)) {
      q = [NaN, 0, 0, 0]
      continue
    }
    const transform = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
    transform[p][p] = c
    transform[r][r] = c
    transform[p][r] = -s
    transform[r][p] = s
    const next = matrix()
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < 3; k++)
          for (let l = 0; l < 3; l++)
            next[i][j] += transform[k][i] * a[k][l] * transform[l][j]
    a = next
    const axis = 3 - p - r,
      delta = [0, 0, 0, Math.cos(theta / 2)]
    delta[axis] = (p === 0 && r === 2 ? -1 : 1) * Math.sin(theta / 2)
    if (q.every(Number.isFinite))
      q = multiply(q, delta as unknown as Quaternion)
  }
  return Object.freeze(q)
}

/** Original identities are diagnostic; optional owned traversal binds fitting and iteration. */
export function prepareFittedIndex(
  geometry: MeshGeometry,
  index: MeshIndex,
  checkpoint: () => void,
  ownTraversal = false
): FittedIndex | undefined {
  let work = 0
  const tick = () => {
    checkpoint()
    work++
  }
  tick()
  if (
    !Object.isFrozen(geometry) ||
    !Object.isFrozen(geometry.positions) ||
    !Object.isFrozen(geometry.indices)
  )
    return undefined
  const spans: Span[] = [],
    triangles: MeshTriangle[] = [],
    offsets: number[] = [],
    components: number[] = [],
    seenNodes = new Set<MeshNode>(),
    seenOffsets = new Set<number>()
  type Task =
    { node: MeshNode; parent?: number; side?: 0 | 1 } | { finish: number }
  const pending: Task[] = [{ node: index.root }]
  while (pending.length) {
    const task = pending.pop()
    if (!task) throw new Error('Missing source collection task')
    if ('finish' in task) {
      spans[task.finish].end = offsets.length
      continue
    }
    tick()
    const node = task.node
    if (seenNodes.has(node))
      throw new Error('Incomplete original source partition')
    seenNodes.add(node)
    const position = spans.length,
      span: Span = { node, start: offsets.length, end: 0 }
    if (ownTraversal)
      span.bounds = Object.freeze(
        node.bounds.map((axis) => Object.freeze([...axis]))
      ) as Bounds
    spans.push(span)
    if (task.parent !== undefined && task.side !== undefined) {
      const parent = spans[task.parent]
      const children = parent.children ? [...parent.children] : [-1, -1]
      children[task.side] = position
      parent.children = children as [number, number]
    }
    if (node.children) {
      if (node.triangles.length)
        throw new Error('Incomplete original source partition')
      pending.push(
        { finish: position },
        { node: node.children[1], parent: position, side: 1 },
        { node: node.children[0], parent: position, side: 0 }
      )
    } else {
      if (!node.triangles.length)
        throw new Error('Incomplete original source partition')
      for (const triangle of node.triangles) {
        if (offsets.length % 256 === 0) tick()
        const offset = triangle.offset
        if (
          !Number.isSafeInteger(offset) ||
          offset < 0 ||
          offset % 3 !== 0 ||
          offset + 2 >= geometry.indices.length ||
          seenOffsets.has(offset)
        )
          throw new Error('Incomplete original source partition')
        seenOffsets.add(offset)
        triangles.push(triangle)
        offsets.push(offset)
        components.push(triangle.component)
      }
      span.end = offsets.length
    }
  }
  if (offsets.length * 3 !== geometry.indices.length)
    throw new Error('Incomplete original source partition')
  Object.freeze(offsets)
  Object.freeze(components)
  Object.freeze(triangles)
  const representatives: Vec3[] = []
  if (ownTraversal)
    for (let i = 0; i < index.representatives.length; i++) {
      if (i % 256 === 0) tick()
      representatives.push(Object.freeze([...index.representatives[i]]) as Vec3)
    }
  const traversal: MeshIndex | undefined = ownTraversal
    ? {
        root: index.root,
        representatives: Object.freeze(representatives),
        componentCount: index.componentCount
      }
    : undefined
  const summaries: Moments[] = [],
    entries: FittedNode[] = [],
    ownedNodes: MeshNode[] = [],
    frames = new WeakMap<MeshNode, SourceFrame>()
  let copiedTriangles = 0
  for (let n = spans.length - 1; n >= 0; n--) {
    const span = spans[n]
    let moments: Moments
    if (span.children) {
      tick()
      moments = merge(summaries[span.children[0]], summaries[span.children[1]])
    } else {
      moments = { count: 0, mean: [0, 0, 0], scatter: matrix() }
      for (let i = 0; i < (span.end - span.start) * 3; i++) {
        if (i % 256 === 0) tick()
        const vertex =
            geometry.indices[offsets[span.start + Math.floor(i / 3)] + (i % 3)],
          point = [0, 1, 2].map(
            (axis) => geometry.positions[vertex * 3 + axis]
          ),
          delta = point.map((v, axis) => v - moments.mean[axis])
        moments.count++
        moments.mean = moments.mean.map(
          (v, axis) => v + delta[axis] / moments.count
        )
        for (let a = 0; a < 3; a++)
          for (let b = 0; b < 3; b++)
            moments.scatter[a][b] += delta[a] * (point[b] - moments.mean[b])
      }
    }
    summaries[n] = moments
    let traversalNode: MeshNode | undefined
    if (traversal) {
      tick()
      const copied: MeshTriangle[] = []
      if (!span.children)
        for (let i = span.start; i < span.end; i++) {
          if (copiedTriangles++ % 256 === 0) tick()
          const vertices = Object.freeze(
            [0, 1, 2].map((corner) =>
              Object.freeze(
                meshPoint(geometry, geometry.indices[offsets[i] + corner])
              )
            )
          ) as MeshTriangle['vertices']
          const bounds = Object.freeze(
            boundsOf(vertices).map((axis) => Object.freeze(axis))
          ) as Bounds
          copied.push(
            Object.freeze({
              offset: offsets[i],
              component: components[i],
              vertices,
              bounds
            })
          )
        }
      if (!span.bounds) throw new Error('Missing owned source bounds')
      traversalNode = Object.freeze({
        bounds: span.bounds,
        triangles: Object.freeze(copied),
        ...(span.children
          ? {
              children: Object.freeze([
                ownedNodes[span.children[0]],
                ownedNodes[span.children[1]]
              ]) as readonly [MeshNode, MeshNode]
            }
          : {})
      })
      ownedNodes[n] = traversalNode
    }
    const proposal = propose(moments, tick),
      source = Object.freeze({
        kind: 'node' as const,
        geometry,
        index: traversal ?? index,
        node: traversalNode ?? span.node,
        offsets,
        start: span.start,
        end: span.end
      })
    const frame = prepareSourceSpanFrame(source, proposal, tick)
    if (traversalNode && frame) frames.set(traversalNode, frame)
    entries[n] = Object.freeze({
      node: span.node,
      traversalNode,
      start: span.start,
      end: span.end,
      proposal,
      frame
    })
  }
  tick()
  if (traversal) {
    traversal.root = ownedNodes[0]
    Object.freeze(traversal)
  }
  return Object.freeze({
    traversal,
    ...(traversal ? { frameFor: (node: MeshNode) => frames.get(node) } : {}),
    geometry,
    index,
    offsets,
    components,
    triangles,
    entries: Object.freeze(entries),
    work
  })
}
