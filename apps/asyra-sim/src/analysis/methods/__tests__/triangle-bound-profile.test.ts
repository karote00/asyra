import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as meshIndex from '../mesh-index'
import type { Bounds, MeshNode, MeshTriangle } from '../mesh-index'
import * as convex from '../convex-query'
import * as projection from '../mesh-projection'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'triangle-bound-profile.test',
  () => {
    // Replay this median-index hypothesis without newer demand-time refinement.
    beforeEach(() => {
      vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
        (index) => index
      )
    })
    afterEach(() => vi.restoreAllMocks())

    it.each([2, 4])(
      'compares complete triangle source bounds over second %s',
      async (start) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' &&
            pair.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing measured source pair')
        const query = {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: pair.a,
          b: pair.b,
          interval: [start, start + 1] as const
        }
        const settings = {
          threshold: snapshot.rule.minimumClearance,
          ...snapshot.method.settings,
          maxIntervals: snapshot.budget.maxIntervals
        }
        const triangles = new WeakMap<Bounds, MeshTriangle>()
        const remember = (node: MeshNode) => {
          for (const triangle of node.triangles)
            triangles.set(triangle.bounds, triangle)
          for (const child of node.children ?? []) remember(child)
        }
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation((...args) => {
          const index = build(...args)
          remember(index.root)
          return index
        })
        let axes = 0,
          convexCalls = 0,
          boundsCalls = 0,
          boundsMs = 0
        const distance = convex.convexDistance,
          project = projection.projectedBoundsGap,
          world = meshIndex.worldBounds
        vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
          convexCalls++
          return distance(...args)
        })
        vi.spyOn(projection, 'projectedBoundsGap').mockImplementation(
          (a, ap, b, bp, threshold, checkpoint) =>
            project(a, ap, b, bp, threshold, () => {
              axes++
              checkpoint()
            })
        )
        vi.spyOn(meshIndex, 'worldBounds').mockImplementation(
          (bounds, pose) => {
            if (!triangles.has(bounds)) return world(bounds, pose)
            boundsCalls++
            const time = performance.now()
            const result = world(bounds, pose)
            boundsMs += performance.now() - time
            return result
          }
        )
        const original = new OriginalMeshQuery()
        const baseline = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          original
        )
        const baselineCounts = {
          work: original.work,
          axes,
          convexCalls,
          boundsCalls,
          boundsMs: Math.round(boundsMs)
        }
        axes = 0
        convexCalls = 0
        boundsCalls = 0
        boundsMs = 0
        vi.spyOn(meshIndex, 'worldBounds').mockImplementation(
          (bounds, pose) => {
            const triangle = triangles.get(bounds)
            if (!triangle) return world(bounds, pose)
            boundsCalls++
            const time = performance.now()
            const vertices = triangle.vertices.map((vertex) =>
              meshIndex.worldPoint(pose, vertex)
            )
            const result: Bounds = [0, 1, 2].map((axis) => [
              Math.min(...vertices.map((vertex) => vertex[axis][0])),
              Math.max(...vertices.map((vertex) => vertex[axis][1]))
            ]) as unknown as Bounds
            boundsMs += performance.now() - time
            return result
          }
        )
        const candidateContext = new OriginalMeshQuery()
        const candidate = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          candidateContext
        )
        // eslint-disable-next-line no-console -- bounded triangle enclosure replacement feasibility, no product geometry substitution
        console.info(
          JSON.stringify({
            profile: 'triangle-source-world-bound',
            start,
            baseline: baselineCounts,
            candidate: {
              work: candidateContext.work,
              axes,
              convexCalls,
              boundsCalls,
              boundsMs: Math.round(boundsMs)
            },
            baselineCoverage: baseline.coverage,
            candidateCoverage: candidate.coverage
          })
        )
        expect(
          candidate.leaves.map((leaf) => [
            leaf.start,
            leaf.end,
            leaf.state,
            leaf.penetration
          ])
        ).toEqual(
          baseline.leaves.map((leaf) => [
            leaf.start,
            leaf.end,
            leaf.state,
            leaf.penetration
          ])
        )
        expect(candidate.coverage).toBe('complete')
      },
      20000
    )
  }
)
