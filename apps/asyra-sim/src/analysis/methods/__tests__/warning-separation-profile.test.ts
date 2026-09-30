import { describe, afterEach, expect, it, vi } from 'vitest'
import * as meshIndex from '../mesh-index'
import type { MeshIndex } from '../mesh-index'
import * as convex from '../convex-query'
import type { ConvexShape } from '../convex-query'
import { projectedBoundsGap } from '../mesh-projection'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'
import { vertexProjection } from './source-bound-projection-fixture'
import { idiv, interval, isub } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'warning-separation-profile.test',
  () => {
    afterEach(() => vi.restoreAllMocks())

    it.each(
      [2, 4].flatMap((start) =>
        ['bounds', 'vertices'].map((mode) => ({ start, mode }))
      )
    )(
      'measures $mode source separation after a real warning over second $start',
      async ({ start, mode }) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' &&
            pair.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing measured pair')
        const context = new OriginalMeshQuery()
        const indices = new WeakMap<object, MeshIndex>()
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation((...args) => {
          const index = build(...args)
          indices.set(args[0], index)
          return index
        })
        let active:
          | {
              a: ConvexShape
              b: ConvexShape
              attempted: boolean
              work?: number
              gap?: number
              upper?: number
            }
          | undefined
        let attempts = 0,
          axisChecks = 0,
          vertexChecks = 0,
          certified = 0,
          remainingWork = 0
        const finalStates = {
          penetration: 0,
          positiveLowerWarning: 0,
          zeroLowerWarning: 0,
          other: 0
        }
        const convexStates = {
          penetration: 0,
          positiveLowerWarning: 0,
          zeroLowerWarning: 0,
          separated: 0,
          uncertain: 0
        }
        const distance = convex.convexDistance
        vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
          const result = distance(...args)
          if (result.penetration) convexStates.penetration++
          else if (result.upper < snapshot.rule.minimumClearance) {
            if (result.lower > 0) convexStates.positiveLowerWarning++
            else convexStates.zeroLowerWarning++
          } else if (result.lower > snapshot.rule.minimumClearance)
            convexStates.separated++
          else convexStates.uncertain++
          if (
            active &&
            !active.attempted &&
            !result.penetration &&
            result.upper < snapshot.rule.minimumClearance
          ) {
            active.attempted = true
            attempts++
            let gap = 0
            if (mode === 'vertices') {
              const ops = poseOperations(intervalAlgebra)
              const norm = ops.norm(ops.vector(result.axis))
              if (norm[0] > 0) {
                const count = () => {
                  vertexChecks++
                }
                const left = vertexProjection(active.a, result.axis, count),
                  right = vertexProjection(active.b, result.axis, count)
                gap = Math.max(
                  0,
                  idiv(isub(interval(right[0]), interval(left[1])), norm)[0],
                  idiv(isub(interval(left[0]), interval(right[1])), norm)[0]
                )
              }
            } else {
              const ai = indices.get(active.a.geometry),
                bi = indices.get(active.b.geometry)
              if (!ai || !bi)
                throw new Error('Missing exact complete source index')
              gap = meshIndex.boundsGap(
                meshIndex.worldBounds(ai.root.bounds, active.a.pose),
                meshIndex.worldBounds(bi.root.bounds, active.b.pose)
              )
              if (gap <= 0)
                gap = projectedBoundsGap(
                  ai.root.bounds,
                  active.a.pose,
                  bi.root.bounds,
                  active.b.pose,
                  0,
                  () => {
                    axisChecks++
                  }
                )
            }
            active.gap = gap
            active.upper = result.upper
            active.work = context.work
          }
          return result
        })
        const queryDistance = context.distance.bind(context)
        context.distance = (...args) => {
          active = { a: args[0], b: args[1], attempted: false }
          const result = queryDistance(...args)
          if (active.attempted) {
            if (result.penetration) finalStates.penetration++
            else if (result.upper < snapshot.rule.minimumClearance) {
              if (result.lower > 0) finalStates.positiveLowerWarning++
              else finalStates.zeroLowerWarning++
            } else finalStates.other++
          }
          if (active.gap && active.gap > 0) {
            if (active.upper === undefined || active.work === undefined)
              throw new Error('Missing established warning evidence')
            expect(result.penetration).toBe(false)
            expect(active.gap).toBeLessThanOrEqual(active.upper)
            certified++
            remainingWork += context.work - active.work
          }
          active = undefined
          return result
        }
        const result = queryOriginalPartPair(
          {
            workcell: snapshot.workcell,
            trajectory: snapshot.trajectory,
            a: pair.a,
            b: pair.b,
            interval: [start, start + 1]
          },
          {
            threshold: snapshot.rule.minimumClearance,
            ...snapshot.method.settings,
            maxIntervals: snapshot.budget.maxIntervals
          },
          () => undefined,
          context
        )
        // eslint-disable-next-line no-console -- passive exact-source certificate feasibility, baseline still executes
        console.info(
          JSON.stringify({
            profile: 'warning-source-separation',
            mode,
            start,
            baselineWork: context.work,
            attempts,
            axisChecks,
            vertexChecks,
            certified,
            remainingWork,
            probeWork: attempts + axisChecks + vertexChecks,
            netPotentialWork:
              remainingWork - axisChecks - attempts - vertexChecks,
            finalStates,
            convexStates,
            coverage: result.coverage
          })
        )
        expect(result.coverage).toBe('complete')
      },
      20000
    )
  }
)
