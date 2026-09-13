import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PairEvidence } from '../continuous-query'
import type { ConvexShape } from '../convex-query'
import * as convex from '../convex-query'
import * as mesh from '../mesh-index'
import * as projections from '../mesh-projection'
import * as membership from '../mesh-membership'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

interface Measurement {
  result: PairEvidence
  work: number
  milliseconds: number
}
let control: Measurement | undefined
afterEach(() => vi.restoreAllMocks())

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'fixed static projection population',
  () => {
    it.each(['control', 'candidate'] as const)(
      'measures the complete prefix - %s',
      async (mode) => {
        const snapshot = await representativeSnapshot(0),
          frames = snapshot.trajectory.keyframes
        const pair = snapshot.pairs.find(
          (p) =>
            p.a.bodyId === 'example:joint-2' && p.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing original ordered pair')
        const context = new OriginalMeshQuery()
        let depth = 0
        const costs = {
          distance: 0,
          interval: 0,
          source: 0,
          handoff: 0,
          derivation: 0
        }
        const nested = {
          preparation: 0,
          refinement: 0,
          membership: 0,
          staticAxes: 0,
          intervalAxes: 0
        }
        const calls = {
          distance: 0,
          interval: 0,
          convex: 0,
          membership: 0,
          omittedStaticProjection: 0
        }
        type Project = (
          a: ConvexShape,
          b: ConvexShape,
          ab: mesh.Bounds | undefined,
          bb: mesh.Bounds | undefined,
          gap: number,
          threshold: number
        ) => number
        const owner = OriginalMeshQuery.prototype as unknown as {
          projectGap: Project
        }
        const projectGap = owner.projectGap
        vi.spyOn(owner, 'projectGap').mockImplementation(function (
          this: OriginalMeshQuery,
          a,
          b,
          ab,
          bb,
          gap,
          threshold
        ) {
          if (
            mode === 'candidate' &&
            depth > 0 &&
            ab &&
            bb &&
            gap <= threshold
          ) {
            calls.omittedStaticProjection++
            return gap
          }
          return projectGap.call(this, a, b, ab, bb, gap, threshold)
        })
        const distance = context.distance.bind(context)
        context.distance = (...args) => {
          const before = context.work
          calls.distance++
          depth++
          try {
            return distance(...args)
          } finally {
            depth--
            costs.distance += context.work - before
          }
        }
        const lower = context.lowerOver.bind(context)
        context.lowerOver = (...args) => {
          const before = context.work
          calls.interval++
          try {
            return lower(...args)
          } finally {
            costs.interval += context.work - before
          }
        }
        for (const [method, key] of [
          ['chargeSourceWitness', 'source'],
          ['chargeEvidenceHandoff', 'handoff'],
          ['chargeEvidenceDerivation', 'derivation']
        ] as const) {
          const charge = context[method].bind(context)
          context[method] = () => {
            const before = context.work
            try {
              charge()
            } finally {
              costs[key] += context.work - before
            }
          }
        }
        const build = mesh.buildMeshIndex,
          refine = mesh.refineMeshIndex
        vi.spyOn(mesh, 'buildMeshIndex').mockImplementation(
          (geometry, checkpoint, hierarchy) =>
            build(
              geometry,
              () => {
                nested.preparation++
                checkpoint()
              },
              hierarchy
            )
        )
        vi.spyOn(mesh, 'refineMeshIndex').mockImplementation(
          (index, checkpoint) =>
            refine(index, () => {
              nested.refinement++
              checkpoint()
            })
        )
        const projected = projections.projectedBoundsGap
        vi.spyOn(projections, 'projectedBoundsGap').mockImplementation(
          (a, ap, b, bp, threshold, checkpoint) => {
            const kind = depth > 0 ? 'staticAxes' : 'intervalAxes'
            return projected(a, ap, b, bp, threshold, () => {
              nested[kind]++
              checkpoint()
            })
          }
        )
        const contains = membership.shapeMembership
        vi.spyOn(membership, 'shapeMembership').mockImplementation(
          (point, shape, index, checkpoint) => {
            calls.membership++
            return contains(point, shape, index, () => {
              nested.membership++
              checkpoint()
            })
          }
        )
        const solve = convex.convexDistance
        vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
          calls.convex++
          return solve(...args)
        })
        const started = performance.now()
        const result = queryOriginalPartPair(
          {
            workcell: snapshot.workcell,
            trajectory: snapshot.trajectory,
            a: pair.a,
            b: pair.b,
            interval: [frames[114].time, frames[199].time]
          },
          {
            ...snapshot.method.settings,
            threshold: snapshot.rule.minimumClearance,
            maxIntervals: snapshot.budget.maxIntervals
          },
          () => undefined,
          context
        )
        const measurement = {
          result,
          work: context.work,
          milliseconds: performance.now() - started
        }
        const artifactPath = fileURLToPath(
          new URL(
            `../../../../../../tmp/capacity/static-projection-${mode}.json`,
            import.meta.url
          )
        )
        mkdirSync(dirname(artifactPath), { recursive: true })
        writeFileSync(
          artifactPath,
          JSON.stringify(
            {
              mode,
              ...measurement,
              costs,
              nested,
              calls,
              note: 'Nested counters are already included in query costs. This is a test-owned policy, not a production goal result.'
            },
            null,
            2
          ) + '\n'
        )
        // eslint-disable-next-line no-console -- complete results preserved in artifact before assertions
        console.info(
          JSON.stringify({
            profile: 'static-projection-policy',
            mode,
            work: context.work,
            milliseconds: measurement.milliseconds,
            coverage: result.coverage,
            evaluations: result.evaluations,
            costs,
            nested,
            calls,
            sameCompleteEvidence: control
              ? JSON.stringify(result) === JSON.stringify(control.result)
              : null,
            artifactPath
          })
        )
        expect(depth).toBe(0)
        expect(
          Object.values(costs).reduce((sum, value) => sum + value, 0)
        ).toBe(context.work)
        expect(result.coverage).toBe('complete')
        if (mode === 'control') {
          expect(context.work).toBe(197028)
          control = measurement
        } else {
          if (!control)
            throw new Error(
              'Run both fixed population strategies in declared order'
            )
          expect(nested.staticAxes).toBe(0)
          expect(calls.omittedStaticProjection).toBeGreaterThan(0)
          expect(result).toEqual(control.result)
          expect(context.work).toBeLessThanOrEqual(
            Math.floor(control.work * 0.8)
          )
          expect(measurement.milliseconds).toBeLessThanOrEqual(
            control.milliseconds * 1.2
          )
        }
      },
      20000
    )
  }
)
