import { afterEach, describe, expect, it, vi } from 'vitest'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'
import { useTriangleProjectionControl } from './triangle-projection-control'

afterEach(() => vi.restoreAllMocks())
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'final triangle projection policy',
  () => {
    it('profiles current full source evidence, work and three cold CPU runs at segment 74', async () => {
      const snapshot = await representativeSnapshot(0)
      const pair = snapshot.pairs.find(
        (pair) =>
          pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
      )
      if (!pair) throw new Error('Missing exact measured pair')
      const query = {
        workcell: snapshot.workcell,
        trajectory: snapshot.trajectory,
        a: pair.a,
        b: pair.b,
        interval: [
          snapshot.trajectory.keyframes[74].time,
          snapshot.trajectory.keyframes[75].time
        ] as const
      }
      const settings = {
        threshold: snapshot.rule.minimumClearance,
        ...snapshot.method.settings,
        maxIntervals: snapshot.budget.maxIntervals
      }
      const run = () => {
        vi.restoreAllMocks()
        const counts = useTriangleProjectionControl(false)
        const context = new OriginalMeshQuery()
        const started = performance.now()
        const evidence = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          context
        )
        expect(evidence.coverage).toBe('complete')
        expect(counts.triangleCalls).toBe(0)
        expect(counts.nodeAxes).toBe(8847)
        expect(counts.convexCalls).toBe(1742)
        expect(context.work).toBeLessThanOrEqual(37737)
        return {
          work: context.work,
          milliseconds: performance.now() - started,
          counts,
          evidence
        }
      }
      const rows = [run(), run(), run()]
      expect(rows[1].evidence).toEqual(rows[0].evidence)
      expect(rows[2].evidence).toEqual(rows[0].evidence)
      // Current cold CPU is measured under the original 20-second test guard.
      // The recorded A/B median ceiling passed before implementation; no old policy is rerun here.
      // eslint-disable-next-line no-console -- all current cold timings plus explicitly recorded pre-policy evidence
      console.info(
        JSON.stringify({
          profile: 'current-triangle-projection-policy',
          recordedBeforePolicy: {
            source: '7a889ff27',
            work: 42963,
            medianMilliseconds: 571.571792,
            triangleAxes: 5226,
            convexCalls: 1742
          },
          currentMedianMilliseconds: rows
            .map((row) => row.milliseconds)
            .sort((a, b) => a - b)[1],
          rows: rows.map(({ work, milliseconds, counts }) => ({
            work,
            milliseconds,
            ...counts
          }))
        })
      )
    }, 20000)
  }
)
