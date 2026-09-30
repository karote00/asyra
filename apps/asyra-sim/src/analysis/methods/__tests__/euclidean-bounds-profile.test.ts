import { afterEach, describe, expect, it, vi } from 'vitest'
import { interval, isub } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import * as projection from '../mesh-projection'
import { worldBounds } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

const ops = poseOperations(intervalAlgebra)
afterEach(() => vi.restoreAllMocks())
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'euclidean bounds passive profile',
  () => {
    it.each([2, 4])(
      'measures complete bound norm over second %s',
      async (start) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' &&
            pair.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing fixed source pair')
        const original = projection.projectedBoundsGap
        let calls = 0,
          normAttempts = 0,
          newProofs = 0,
          bypassedAxes = 0,
          alreadyRejected = 0,
          zeroThresholdCalls = 0
        vi.spyOn(projection, 'projectedBoundsGap').mockImplementation(
          (a, ap, b, bp, threshold, checkpoint) => {
            calls++
            let proves = false
            if (threshold === 0) zeroThresholdCalls++
            else {
              const aw = worldBounds(a, ap),
                bw = worldBounds(b, bp)
              const gaps = aw.map((axis, i) =>
                Math.max(
                  0,
                  isub(interval(axis[0]), interval(bw[i][1]))[0],
                  isub(interval(bw[i][0]), interval(axis[1]))[0]
                )
              )
              if (
                gaps.filter((gap) => gap > 0).length >= 2 &&
                Math.max(...gaps) <= threshold
              ) {
                normAttempts++
                const norm = ops.norm([
                  interval(gaps[0]),
                  interval(gaps[1]),
                  interval(gaps[2])
                ])[0]
                proves = norm > threshold
                if (proves) newProofs++
              }
            }
            let axes = 0
            const result = original(a, ap, b, bp, threshold, () => {
              axes++
              checkpoint()
            })
            if (proves) {
              bypassedAxes += axes
              if (result > threshold) alreadyRejected++
            }
            return result
          }
        )
        const context = new OriginalMeshQuery()
        const run = (queryContext: OriginalMeshQuery) =>
          queryOriginalPartPair(
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
            queryContext
          )
        const result = run(context)
        expect(result.coverage).toBe('complete')
        let candidateNorms = 0,
          candidateProofs = 0
        vi.spyOn(projection, 'projectedBoundsGap').mockImplementation(
          (a, ap, b, bp, threshold, checkpoint) => {
            if (threshold > 0) {
              // Measurement-only reconstruction of the world bounds already evaluated
              // by every production caller; a candidate must consume those artifacts.
              const aw = worldBounds(a, ap),
                bw = worldBounds(b, bp)
              const gaps = aw.map((axis, i) =>
                Math.max(
                  0,
                  isub(interval(axis[0]), interval(bw[i][1]))[0],
                  isub(interval(bw[i][0]), interval(axis[1]))[0]
                )
              )
              if (
                gaps.filter((gap) => gap > 0).length >= 2 &&
                Math.max(...gaps) <= threshold
              ) {
                checkpoint()
                candidateNorms++
                const norm = ops.norm([
                  interval(gaps[0]),
                  interval(gaps[1]),
                  interval(gaps[2])
                ])[0]
                if (norm > threshold) {
                  candidateProofs++
                  return norm
                }
              }
            }
            return original(a, ap, b, bp, threshold, checkpoint)
          }
        )
        const candidateContext = new OriginalMeshQuery()
        const candidate = run(candidateContext)
        expect(candidate.coverage).toBe('complete')
        expect(
          candidate.leaves.map((leaf) => [
            leaf.start,
            leaf.end,
            leaf.state,
            leaf.penetration
          ])
        ).toEqual(
          result.leaves.map((leaf) => [
            leaf.start,
            leaf.end,
            leaf.state,
            leaf.penetration
          ])
        )
        // eslint-disable-next-line no-console -- fixed passive proof and complete additional norm cost
        console.info(
          JSON.stringify({
            profile: 'euclidean-world-bound',
            start,
            work: context.work,
            candidateWork: candidateContext.work,
            candidateNorms,
            candidateProofs,
            candidateCoverage: candidate.coverage,
            coverage: result.coverage,
            calls,
            zeroThresholdCalls,
            normAttempts,
            newProofs,
            alreadyRejected,
            bypassedAxes,
            netKnownAxisWork: bypassedAxes - normAttempts
          })
        )
      },
      20000
    )
  }
)
