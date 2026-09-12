import { describe, afterEach, expect, it, vi } from 'vitest'
import { idiv, imid, interval, isub } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { Vec3 } from '../../../domain/math'
import * as meshIndex from '../mesh-index'
import type { Bounds } from '../mesh-index'
import type { ConvexShape } from '../convex-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'
import { projection } from './source-bound-projection-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'node-bounds-profile.test',
  () => {
    const ops = poseOperations(intervalAlgebra)
    afterEach(() => vi.restoreAllMocks())

    it.each([
      { target: 'example:fixture-table', start: 0, end: 2 },
      { target: 'obstacle-10', start: 2, end: 3 },
      { target: 'obstacle-10', start: 3.75, end: 4 },
      { target: 'obstacle-10', start: 4, end: 4.25 }
    ])(
      'profiles node certificates for $target over $start to $end',
      async ({ target, start, end }) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === target
        )
        if (!pair) throw new Error('Missing measured pair')
        const query = {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: pair.a,
          b: pair.b,
          interval: [start, end] as const
        }
        const settings = {
          threshold: snapshot.rule.minimumClearance,
          ...snapshot.method.settings,
          maxIntervals: snapshot.budget.maxIntervals
        }
        const baselineContext = new OriginalMeshQuery()
        const baselineStart = performance.now()
        const baseline = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          baselineContext
        )
        const baselineMs = performance.now() - baselineStart
        const metadata = new WeakMap<
          Bounds,
          { bounds: Bounds; pose: ConvexShape['pose'] }
        >()
        const worldBounds = meshIndex.worldBounds,
          gap = meshIndex.boundsGap,
          build = meshIndex.buildMeshIndex
        const counts = {
          axisChecks: 0,
          addedRejections: 0,
          preparationWork: 0,
          projectionMs: 0
        }
        const context = new OriginalMeshQuery(() => {
          if (context.work + counts.axisChecks >= 500000)
            throw new MeshWorkLimit('Candidate combined work exhausted')
        })
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
          (mesh, checkpoint, hierarchy) =>
            build(
              mesh,
              () => {
                counts.preparationWork++
                checkpoint()
              },
              hierarchy
            )
        )
        vi.spyOn(meshIndex, 'worldBounds').mockImplementation(
          (bounds, pose) => {
            const result = worldBounds(bounds, pose)
            metadata.set(result, { bounds, pose })
            return result
          }
        )
        vi.spyOn(meshIndex, 'boundsGap').mockImplementation((a, b) => {
          const current = gap(a, b)
          if (current > settings.threshold) return current
          const left = metadata.get(a),
            right = metadata.get(b)
          if (!left || !right) return current
          const projectionStart = performance.now()
          try {
            for (const source of [left, right])
              for (const axis of [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
              ] as const) {
                counts.axisChecks++
                if (context.work + counts.axisChecks > 500000)
                  throw new MeshWorkLimit('Candidate projection work exhausted')
                const direction = ops
                  .rotate(source.pose.rotation, ops.vector(axis))
                  .map(imid) as unknown as Vec3
                const norm = ops.norm(ops.vector(direction))
                if (norm[0] <= 0) continue
                const pa = projection(left.bounds, left.pose, direction)
                const pb = projection(right.bounds, right.pose, direction)
                const candidate = Math.max(
                  current,
                  idiv(isub(interval(pb[0]), interval(pa[1])), norm)[0],
                  idiv(isub(interval(pa[0]), interval(pb[1])), norm)[0]
                )
                if (candidate > settings.threshold) {
                  counts.addedRejections++
                  return candidate
                }
              }
            return current
          } finally {
            counts.projectionMs += performance.now() - projectionStart
          }
        })

        const candidateStart = performance.now()
        const candidate = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          context
        )
        // eslint-disable-next-line no-console -- formal test-owned feasibility adapter, not shipped execution
        console.info(
          JSON.stringify({
            profile: 'node-bound-axis-feasibility',
            target,
            start,
            end,
            baselineWork: baselineContext.work,
            baselineMs: Math.round(baselineMs),
            candidateOriginalWork: context.work,
            candidateCombinedWork: context.work + counts.axisChecks,
            ...counts,
            candidateMs: Math.round(performance.now() - candidateStart),
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
        expect(context.work + counts.axisChecks).toBeLessThanOrEqual(500001)
      },
      20000
    )
  }
)
