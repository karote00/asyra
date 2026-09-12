import { describe, afterEach, expect, it, vi } from 'vitest'
import { interval, isub, idiv, imid } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { Vec3 } from '../../../domain/math'
import {
  buildMeshIndex,
  boundsGap,
  worldBounds,
  type Bounds
} from '../mesh-index'
import * as meshIndex from '../mesh-index'
import type { ConvexShape } from '../convex-query'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { projection } from './source-bound-projection-fixture'
import { representativeSnapshot } from './representative-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'source-bounds-profile.test',
  () => {
    const ops = poseOperations(intervalAlgebra)
    afterEach(() => vi.restoreAllMocks())

    it.each(
      ['example:fixture-table', 'obstacle-10'].flatMap((target) => {
        const ranges =
          target === 'obstacle-10'
            ? [
                [0, 2],
                [2, 3],
                [3, 3.25],
                [3.25, 3.5],
                [3.5, 3.75],
                [3.75, 4],
                [4, 6],
                [6, 8]
              ]
            : [
                [0, 2],
                [2, 4],
                [4, 6],
                [6, 8]
              ]
        return ranges.map(([start, end]) => ({ target, start, end }))
      })
    )(
      'profiles complete source-bound rejection for joint-2 and $target over $start-$end',
      async ({ target, start: intervalStart, end: intervalEnd }) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === target
        )
        if (!pair) throw new Error('Missing measured representative pair')
        const prepared = new WeakMap<MeshGeometry, Bounds>()
        const counts = {
          calls: 0,
          preparationBuilds: 0,
          worldRejects: 0,
          addedStaticRejects: 0,
          addedIntervalRejects: 0,
          projectionAxes: 0,
          probePreparationWork: 0,
          currentPreparationWork: 0,
          avoidableStaticWork: 0,
          avoidableIntervalWork: 0,
          projectionMs: 0
        }
        let measuringCurrent = false
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
          (g, checkpoint, hierarchy) =>
            build(
              g,
              () => {
                if (measuringCurrent) counts.currentPreparationWork++
                checkpoint()
              },
              hierarchy
            )
        )
        function bounds(shape: ConvexShape): Bounds {
          const g = shape.geometry
          if (g.kind !== 'mesh')
            throw new Error('Expected complete original geometry')
          let result = prepared.get(g)
          if (!result) {
            counts.preparationBuilds++
            result = buildMeshIndex(g, () => {
              counts.probePreparationWork++
            }).root.bounds
            prepared.set(g, result)
          }
          return result
        }
        function probe(
          a: ConvexShape,
          b: ConvexShape,
          threshold: number,
          temporal: boolean
        ) {
          counts.calls++
          const ab = bounds(a),
            bb = bounds(b)
          if (
            boundsGap(worldBounds(ab, a.pose), worldBounds(bb, b.pose)) >
            threshold
          ) {
            counts.worldRejects++
            return false
          }
          const started = performance.now()
          for (const shape of [a, b])
            for (const axis of [
              [1, 0, 0],
              [0, 1, 0],
              [0, 0, 1]
            ] as const) {
              const direction = ops
                .rotate(shape.pose.rotation, ops.vector(axis))
                .map(imid) as unknown as Vec3
              const norm = ops.norm(ops.vector(direction))
              if (norm[0] <= 0) continue
              counts.projectionAxes++
              const pa = projection(ab, a.pose, direction),
                pb = projection(bb, b.pose, direction)
              const gap = Math.max(
                0,
                idiv(isub(interval(pb[0]), interval(pa[1])), norm)[0],
                idiv(isub(interval(pa[0]), interval(pb[1])), norm)[0]
              )
              if (gap > threshold) {
                if (temporal) counts.addedIntervalRejects++
                else counts.addedStaticRejects++
                counts.projectionMs += performance.now() - started
                return true
              }
            }
          counts.projectionMs += performance.now() - started
          return false
        }
        const distance = OriginalMeshQuery.prototype.distance,
          lower = OriginalMeshQuery.prototype.lowerOver
        vi.spyOn(OriginalMeshQuery.prototype, 'distance').mockImplementation(
          function (this: OriginalMeshQuery, ...args) {
            const rejected = probe(args[0], args[1], args[2], false)
            const before = this.work,
              prep = counts.currentPreparationWork
            measuringCurrent = true
            try {
              return distance.apply(this, args)
            } finally {
              measuringCurrent = false
              if (rejected)
                counts.avoidableStaticWork += Math.max(
                  0,
                  this.work -
                    before -
                    (counts.currentPreparationWork - prep) -
                    1
                )
            }
          }
        )
        vi.spyOn(OriginalMeshQuery.prototype, 'lowerOver').mockImplementation(
          function (this: OriginalMeshQuery, ...args) {
            const rejected = probe(args[0], args[1], args[2], true)
            const before = this.work,
              prep = counts.currentPreparationWork
            measuringCurrent = true
            try {
              return lower.apply(this, args)
            } finally {
              measuringCurrent = false
              if (rejected)
                counts.avoidableIntervalWork += Math.max(
                  0,
                  this.work -
                    before -
                    (counts.currentPreparationWork - prep) -
                    1
                )
            }
          }
        )
        const context = new OriginalMeshQuery()
        const start = performance.now()
        const result = queryOriginalPartPair(
          {
            workcell: snapshot.workcell,
            trajectory: snapshot.trajectory,
            a: pair.a,
            b: pair.b,
            interval: [intervalStart, intervalEnd]
          },
          {
            threshold: snapshot.rule.minimumClearance,
            ...snapshot.method.settings,
            maxIntervals: snapshot.budget.maxIntervals
          },
          () => undefined,
          context
        )
        // eslint-disable-next-line no-console -- permanent bounded certificate-feasibility profile
        console.info(
          JSON.stringify({
            profile: 'source-bound-axis-feasibility',
            target,
            intervalStart,
            intervalEnd,
            ...counts,
            currentWork: context.work,
            evaluations: result.evaluations,
            coverage: result.coverage,
            durationMs: Math.round(performance.now() - start)
          })
        )
        expect(counts.calls).toBeGreaterThan(0)
        expect(counts.preparationBuilds).toBe(2)
        expect(counts.projectionAxes).toBeLessThanOrEqual(counts.calls * 6)
      },
      20000
    )
  }
)
