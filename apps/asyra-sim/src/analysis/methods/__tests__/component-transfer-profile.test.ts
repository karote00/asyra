import { useEvidenceRecomputationControl } from './evidence-recomputation-control'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as kinematics from '../../../domain/kinematic-algebra'
import * as meshIndex from '../mesh-index'
import * as projections from '../mesh-projection'
import * as membership from '../mesh-membership'
import * as official from '../official-method'
import type { PairEvidence } from '../continuous-query'
import { OriginalMeshQuery } from '../original-mesh-query'
import { runOriginalPartMethod } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())
beforeEach(() => {
  useEvidenceRecomputationControl()
})
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'exact representative component transfer',
  () => {
    it.each(['median-control', 'component-candidate'] as const)(
      'measures original segment prefix - %s',
      async (mode) => {
        const snapshot = await representativeSnapshot(0)
        if (mode === 'median-control')
          vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
            (index) => index
          )
        let active = false,
          segment = -1,
          targetStart: number | undefined,
          targetEnd = 0,
          target: PairEvidence | undefined
        const rows = new Map<
          number,
          {
            segment: number
            start: number
            end: number
            work: number
            staticWork: number
            intervalWork: number
            medianPrep: number
            refinePrep: number
            axes: number
            membership: number
          }
        >()
        const row = () => {
          let value = rows.get(segment)
          if (!value) {
            value = {
              segment,
              start: snapshot.trajectory.keyframes[segment].time,
              end: snapshot.trajectory.keyframes[segment + 1].time,
              work: 0,
              staticWork: 0,
              intervalWork: 0,
              medianPrep: 0,
              refinePrep: 0,
              axes: 0,
              membership: 0
            }
            rows.set(segment, value)
          }
          return value
        }
        const run = official.runClearanceQueries
        vi.spyOn(official, 'runClearanceQueries').mockImplementation(
          (input, descriptor, query, checkpoint, onPair) =>
            run(
              input,
              descriptor,
              (request, settings, check) => {
                active =
                  request.a.bodyId === 'example:joint-2' &&
                  request.b.bodyId === 'obstacle-11'
                try {
                  const value = query(request, settings, check)
                  if (active) target = value
                  return value
                } finally {
                  active = false
                }
              },
              checkpoint,
              onPair
            )
        )
        const interpolate = kinematics.interpolateSegment
        vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
          (...args) => {
            if (active) segment = args[1]
            return interpolate(...args)
          }
        )
        const distance = OriginalMeshQuery.prototype.distance
        vi.spyOn(OriginalMeshQuery.prototype, 'distance').mockImplementation(
          function (this: OriginalMeshQuery, ...args) {
            if (!active) return distance.apply(this, args)
            targetStart ??= this.work
            const before = this.work,
              value = row()
            try {
              return distance.apply(this, args)
            } finally {
              const work = this.work - before
              value.work += work
              value.staticWork += work
              targetEnd = this.work
            }
          }
        )
        const lower = OriginalMeshQuery.prototype.lowerOver
        vi.spyOn(OriginalMeshQuery.prototype, 'lowerOver').mockImplementation(
          function (this: OriginalMeshQuery, ...args) {
            if (!active) return lower.apply(this, args)
            const before = this.work,
              value = row()
            try {
              return lower.apply(this, args)
            } finally {
              const work = this.work - before
              value.work += work
              value.intervalWork += work
              targetEnd = this.work
            }
          }
        )
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
          (geometry, checkpoint, hierarchy) =>
            build(
              geometry,
              () => {
                if (active) row().medianPrep++
                checkpoint()
              },
              hierarchy
            )
        )
        const refine = meshIndex.refineMeshIndex
        vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
          (index, checkpoint) =>
            refine(index, () => {
              if (active) row().refinePrep++
              checkpoint()
            })
        )
        const project = projections.projectedBoundsGap
        vi.spyOn(projections, 'projectedBoundsGap').mockImplementation(
          (a, ap, b, bp, threshold, checkpoint) =>
            project(a, ap, b, bp, threshold, () => {
              if (active) row().axes++
              checkpoint()
            })
        )
        const contains = membership.shapeMembership
        vi.spyOn(membership, 'shapeMembership').mockImplementation(
          (point, shape, index, checkpoint) =>
            contains(point, shape, index, () => {
              if (active) row().membership++
              checkpoint()
            })
        )
        const evidence = runOriginalPartMethod(snapshot)
        expect(evidence.coverage).toBe('partial')
        if (!target) throw new Error('Missing exact target result')
        expect(target.coverage).toBe('partial')
        if (mode === 'median-control') {
          expect(evidence.evaluations).toBe(20189)
          expect(target.evaluations).toBe(90)
        }
        // eslint-disable-next-line no-console -- complete fixed-order prefix and separately charged preparation
        console.info(
          JSON.stringify({
            profile: 'exact-component-transfer',
            mode,
            totalEvaluations: evidence.evaluations,
            targetEvaluations: target.evaluations,
            targetStart,
            targetEnd,
            unresolved: target.leaves
              .filter((leaf) => leaf.state === 'unresolved')
              .map((leaf) => [leaf.start, leaf.end]),
            rows: [...rows.values()]
          })
        )
      },
      20000
    )
  }
)
