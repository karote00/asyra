import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as meshIndex from '../mesh-index'
import type { Bounds, MeshNode } from '../mesh-index'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { ConvexShape } from '../convex-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'node-source-bound-profile.test',
  () => {
    // Replay this median-index hypothesis without newer demand-time refinement.
    beforeEach(() => {
      vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
        (index) => index
      )
    })
    afterEach(() => vi.restoreAllMocks())

    it.each([2, 4])(
      'measures complete query-local node source extrema over second %s',
      async (start) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' &&
            pair.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing measured pair')
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
        const original = new OriginalMeshQuery()
        const baseline = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          original
        )
        const roots = new WeakMap<
          Bounds,
          { root: MeshNode; geometry: MeshGeometry }
        >()
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation((...args) => {
          const index = build(...args)
          roots.set(index.root.bounds, { root: index.root, geometry: args[0] })
          return index
        })
        let pointWork = 0,
          unionWork = 0,
          lookupWork = 0,
          refinements = 0
        const extra = () => pointWork + unionWork + lookupWork
        const context = new OriginalMeshQuery(() => {
          if (context.work + extra() >= 500000)
            throw new MeshWorkLimit('Combined source-extrema query budget')
        })
        const check = () => {
          if (context.work + extra() > 500000)
            throw new MeshWorkLimit('Source-extrema preparation budget')
        }
        interface QueryBounds {
          seen: WeakSet<Bounds>
          bounds: WeakMap<Bounds, Bounds>
        }
        let active: WeakMap<object, QueryBounds> | undefined
        function refine(
          root: MeshNode,
          geometry: MeshGeometry,
          pose: ConvexShape['pose'],
          state: QueryBounds
        ) {
          if (!active) throw new Error('Missing direct query owner')
          const retained = state.bounds
          const points = new Map<number, Bounds>()
          const point = (index: number) => {
            const previous = points.get(index)
            if (previous) return previous
            pointWork++
            check()
            const value = meshIndex.worldPoint(
              pose,
              meshIndex.meshPoint(geometry, index)
            )
            points.set(index, value)
            return value
          }
          const union = (values: readonly Bounds[]): Bounds => {
            unionWork++
            check()
            return [0, 1, 2].map((axis) => [
              Math.min(...values.map((value) => value[axis][0])),
              Math.max(...values.map((value) => value[axis][1]))
            ]) as unknown as Bounds
          }
          const visit = (node: MeshNode): Bounds => {
            let result: Bounds
            if (node.children) result = union(node.children.map(visit))
            else {
              const triangles = node.triangles.map((triangle) => {
                const bounds = union(
                  [0, 1, 2].map((index) =>
                    point(geometry.indices[triangle.offset + index])
                  )
                )
                retained.set(triangle.bounds, bounds)
                return bounds
              })
              result = union(triangles)
            }
            retained.set(node.bounds, result)
            return result
          }
          refinements++
          visit(root)
        }
        const world = meshIndex.worldBounds
        vi.spyOn(meshIndex, 'worldBounds').mockImplementation(
          (bounds, pose) => {
            if (!active) throw new Error('Bounds escaped direct query')
            const state = active.get(pose) ?? {
              seen: new WeakSet<Bounds>(),
              bounds: new WeakMap<Bounds, Bounds>()
            }
            active.set(pose, state)
            const root = roots.get(bounds)
            // First root request is the unchanged cheap complete-box admission. Only a
            // repeated root request starts actual source hierarchy traversal/refinement.
            if (root && !state.seen.has(bounds)) {
              state.seen.add(bounds)
              return world(bounds, pose)
            }
            if (root && !state.bounds.has(bounds))
              refine(root.root, root.geometry, pose, state)
            lookupWork++
            check()
            return state.bounds.get(bounds) ?? world(bounds, pose)
          }
        )
        const distance = context.distance.bind(context),
          lower = context.lowerOver.bind(context)
        context.distance = (...args) => {
          active = new WeakMap()
          try {
            return distance(...args)
          } finally {
            active = undefined
          }
        }
        context.lowerOver = (...args) => {
          active = new WeakMap()
          try {
            return lower(...args)
          } finally {
            active = undefined
          }
        }
        const candidate = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          context
        )
        // eslint-disable-next-line no-console -- complete source extrema feasibility with all point/union/lookup costs
        console.info(
          JSON.stringify({
            profile: 'query-local-node-source-extrema',
            start,
            baselineWork: original.work,
            candidateOriginalWork: context.work,
            pointWork,
            unionWork,
            lookupWork,
            refinements,
            candidateCombinedWork: context.work + extra(),
            baselineCoverage: baseline.coverage,
            candidateCoverage: candidate.coverage
          })
        )
        expect(context.work + extra()).toBeLessThanOrEqual(500001)
        if (candidate.coverage === 'complete')
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
      },
      20000
    )
  }
)
