import type { MeshGeometry } from '../../domain/part-geometry'
import { inspectMeshTopology } from '../../domain/mesh-topology'
import type { Vec3 } from '../../domain/math'
import { interval, type Interval } from '../../domain/interval'
import {
  intervalAlgebra,
  poseOperations,
  type AlgebraPose,
  type Vector
} from '../../domain/kinematic-algebra'
import { supportValue, type ConvexShape } from './convex-query'
import { projectBounds } from './bounds-projection'

const ops = poseOperations(intervalAlgebra)
export type Bounds = Vector<Interval>
export interface MeshTriangle {
  offset: number
  component: number
  vertices: readonly [Vec3, Vec3, Vec3]
  bounds: Bounds
}
export interface MeshNode {
  bounds: Bounds
  triangles: readonly MeshTriangle[]
  children?: readonly [MeshNode, MeshNode]
}
export interface MeshIndex {
  root: MeshNode
  representatives: readonly Vec3[]
  componentCount: number
}

/** Immutable preparation only; query budgets and poses never enter this cache. */
export interface PreparedMeshIndex {
  index: MeshIndex
  work: number
  hierarchy: boolean
  refinement?: { index: MeshIndex; work: number }
}

export function meshPoint(mesh: MeshGeometry, index: number): Vec3 {
  return [
    mesh.positions[index * 3],
    mesh.positions[index * 3 + 1],
    mesh.positions[index * 3 + 2]
  ]
}
export function boundsOf(points: readonly Vec3[]): Bounds {
  return [0, 1, 2].map((axis) => {
    let min = Infinity,
      max = -Infinity
    for (const point of points) {
      min = Math.min(min, point[axis])
      max = Math.max(max, point[axis])
    }
    return interval(min, max)
  }) as unknown as Bounds
}
export function buildMeshIndex(
  mesh: MeshGeometry,
  checkpoint: () => void,
  hierarchy = true
): MeshIndex {
  const topology = inspectMeshTopology(mesh, checkpoint)
  if (topology.issue) throw new Error(topology.issue)
  const triangles: MeshTriangle[] = [],
    representatives: Vec3[] = []
  topology.components.forEach((component, c) => {
    representatives.push(meshPoint(mesh, mesh.indices[component[0]]))
    for (const offset of component) {
      if (triangles.length % 256 === 0) checkpoint()
      const vertices = [0, 1, 2].map((i) =>
        meshPoint(mesh, mesh.indices[offset + i])
      ) as unknown as MeshTriangle['vertices']
      triangles.push({
        offset,
        component: c,
        vertices,
        bounds: boundsOf(vertices)
      })
    }
  })
  function build(items: MeshTriangle[]): MeshNode {
    checkpoint()
    const bounds: Bounds = [0, 1, 2].map((axis) => {
      let lo = Infinity,
        hi = -Infinity
      for (const triangle of items) {
        lo = Math.min(lo, triangle.bounds[axis][0])
        hi = Math.max(hi, triangle.bounds[axis][1])
      }
      return interval(lo, hi)
    }) as unknown as Bounds
    if (!hierarchy || items.length <= 4) return { bounds, triangles: items }
    const widths = bounds.map((axis) => axis[1] - axis[0]),
      axis = widths.indexOf(Math.max(...widths))
    items.sort(
      (a, b) =>
        a.bounds[axis][0] +
          a.bounds[axis][1] -
          (b.bounds[axis][0] + b.bounds[axis][1]) || a.offset - b.offset
    )
    const middle = Math.floor(items.length / 2)
    return {
      bounds,
      triangles: [],
      children: [build(items.slice(0, middle)), build(items.slice(middle))]
    }
  }
  return {
    root: build(triangles),
    representatives,
    componentCount: topology.components.length
  }
}
export function worldPoint(
  pose: AlgebraPose<Interval>,
  point: Vec3
): Vector<Interval> {
  return ops.add(pose.position, ops.rotate(pose.rotation, ops.vector(point)))
}
export function localPoint(
  pose: AlgebraPose<Interval>,
  point: Vector<Interval>
): Vector<Interval> {
  const q = pose.rotation
  return ops.rotate(
    [[-q[0][1], -q[0][0]], [-q[1][1], -q[1][0]], [-q[2][1], -q[2][0]], q[3]],
    ops.sub(point, pose.position)
  )
}
export function worldBounds(
  bounds: Bounds,
  pose: AlgebraPose<Interval>
): Bounds {
  return [
    projectBounds(bounds, pose, [1, 0, 0]),
    projectBounds(bounds, pose, [0, 1, 0]),
    projectBounds(bounds, pose, [0, 0, 1])
  ]
}
export function shapeBounds(shape: ConvexShape, index?: MeshIndex): Bounds {
  if (shape.geometry.kind === 'mesh') {
    if (!index) throw new Error('Missing complete mesh index')
    return worldBounds(index.root.bounds, shape.pose)
  }
  return [0, 1, 2].map((axis) => {
    const direction: [number, number, number] = [0, 0, 0]
    direction[axis] = 1
    const hi = supportValue(shape, direction)[1]
    direction[axis] = -1
    return interval(-supportValue(shape, direction)[1], hi)
  }) as unknown as Bounds
}
/** L-infinity separation is a conservative Euclidean lower bound. */
export function boundsGap(a: Bounds, b: Bounds): number {
  let gap = 0
  for (let i = 0; i < 3; i++)
    gap = Math.max(
      gap,
      intervalAlgebra.sub(interval(a[i][0]), interval(b[i][1]))[0],
      intervalAlgebra.sub(interval(b[i][0]), interval(a[i][1]))[0]
    )
  return gap
}

/** Complete admitted-component grouping; all extra immutable preparation is charged. */
export function refineMeshIndex(
  index: MeshIndex,
  checkpoint: () => void
): MeshIndex {
  const scan = <T>(items: readonly T[], visit: (item: T) => void) => {
    items.forEach((item, i) => {
      if (i % 256 === 0) checkpoint()
      visit(item)
    })
  }
  const triangles: MeshTriangle[] = [],
    pending = [index.root]
  while (pending.length) {
    const node = pending.pop()
    if (!node) throw new Error('Missing original node')
    checkpoint()
    triangles.push(...node.triangles)
    if (node.children) pending.push(node.children[1], node.children[0])
  }
  const groups = new Map<number, MeshTriangle[]>()
  scan(triangles, (triangle) => {
    const group = groups.get(triangle.component)
    if (group) group.push(triangle)
    else groups.set(triangle.component, [triangle])
  })
  if (groups.size !== index.componentCount)
    throw new Error('Incomplete admitted components')
  function build<T>(
    items: T[],
    getBounds: (item: T) => Bounds,
    key: (item: T) => number,
    limit: number,
    leaf: (items: T[], bounds?: Bounds) => MeshNode
  ): MeshNode {
    checkpoint()
    if (limit === 1 && items.length === 1) return leaf(items)
    const bounds: [[number, number], [number, number], [number, number]] = [
      [Infinity, -Infinity],
      [Infinity, -Infinity],
      [Infinity, -Infinity]
    ]
    scan(items, (item) => {
      const box = getBounds(item)
      for (let axis = 0; axis < 3; axis++) {
        bounds[axis][0] = Math.min(bounds[axis][0], box[axis][0])
        bounds[axis][1] = Math.max(bounds[axis][1], box[axis][1])
      }
    })
    if (items.length <= limit) return leaf(items, bounds)
    const widths = bounds.map((axis) => axis[1] - axis[0]),
      axis = widths.indexOf(Math.max(...widths))
    let comparisons = 0
    items.sort((a, b) => {
      if (comparisons++ % 256 === 0) checkpoint()
      const ab = getBounds(a),
        bb = getBounds(b)
      return (
        ab[axis][0] + ab[axis][1] - (bb[axis][0] + bb[axis][1]) ||
        key(a) - key(b)
      )
    })
    const middle = Math.floor(items.length / 2)
    return {
      bounds,
      triangles: [],
      children: [
        build(items.slice(0, middle), getBounds, key, limit, leaf),
        build(items.slice(middle), getBounds, key, limit, leaf)
      ]
    }
  }
  const roots = [...groups].map(([component, items]) => ({
    component,
    node: build(
      items,
      (item) => item.bounds,
      (item) => item.offset,
      4,
      (items, bounds) => {
        if (!bounds) throw new Error('Missing triangle bounds')
        return { bounds, triangles: items }
      }
    )
  }))
  const root = build(
    roots,
    (item) => item.node.bounds,
    (item) => item.component,
    1,
    (items) => items[0].node
  )
  return { ...index, root }
}
