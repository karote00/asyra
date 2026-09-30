import { vi } from 'vitest'
import * as meshIndex from '../mesh-index'
import * as projections from '../mesh-projection'
import * as convex from '../convex-query'

/** Test-owned exact source-level policy probe; never changes geometry or tick units. */
export function useTriangleProjectionControl(omit: boolean) {
  const triangles = new WeakSet<object>(),
    nodes = new WeakSet<object>()
  const counts = {
    triangleCalls: 0,
    triangleAxes: 0,
    triangleRejections: 0,
    omittedTriangleCalls: 0,
    nodeCalls: 0,
    nodeAxes: 0,
    nodeRejections: 0,
    convexCalls: 0,
    convexMilliseconds: 0,
    projectionMilliseconds: 0
  }
  const register = (index: meshIndex.MeshIndex) => {
    const pending = [index.root]
    while (pending.length) {
      const node = pending.pop()
      if (!node) throw new Error('Missing complete measured node')
      if (triangles.has(node.bounds))
        throw new Error('Ambiguous node/source identity')
      nodes.add(node.bounds)
      for (const triangle of node.triangles) {
        if (nodes.has(triangle.bounds))
          throw new Error('Ambiguous triangle/node identity')
        triangles.add(triangle.bounds)
      }
      if (node.children) pending.push(...node.children)
    }
  }
  const build = meshIndex.buildMeshIndex
  vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation((...args) => {
    const index = build(...args)
    register(index)
    return index
  })
  const refine = meshIndex.refineMeshIndex
  vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation((...args) => {
    const index = refine(...args)
    register(index)
    return index
  })
  const project = projections.projectedBoundsGap
  vi.spyOn(projections, 'projectedBoundsGap').mockImplementation(
    (a, ap, b, bp, threshold, checkpoint) => {
      const triangle = triangles.has(a) && triangles.has(b)
      if (!triangle && (!nodes.has(a) || !nodes.has(b)))
        throw new Error('Unknown measured projection level')
      if (triangle) counts.triangleCalls++
      else counts.nodeCalls++
      if (triangle && omit) {
        counts.omittedTriangleCalls++
        return 0
      }
      const started = performance.now()
      try {
        const gap = project(a, ap, b, bp, threshold, () => {
          if (triangle) counts.triangleAxes++
          else counts.nodeAxes++
          checkpoint()
        })
        if (gap > threshold) {
          if (triangle) counts.triangleRejections++
          else counts.nodeRejections++
        }
        return gap
      } finally {
        counts.projectionMilliseconds += performance.now() - started
      }
    }
  )
  const solve = convex.convexDistance
  vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
    const started = performance.now()
    counts.convexCalls++
    try {
      return solve(...args)
    } finally {
      counts.convexMilliseconds += performance.now() - started
    }
  })
  return counts
}
