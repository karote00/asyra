import { describe, afterEach, expect, it, vi } from 'vitest'
import * as projection from '../mesh-projection'
import type { Bounds } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'projection-reuse-profile.test',
  () => {
    afterEach(() => vi.restoreAllMocks())

    it.each([2, 4])(
      'measures exact same-query projection repetition over second %s',
      async (start) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' &&
            pair.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing measured pair')
        interface Completed {
          a: Bounds
          b: Bounds
          value: number
          axes: number
        }
        let active:
          | { aPose: object; bPose: object; completed: Map<string, Completed> }
          | undefined
        let calls = 0,
          axes = 0,
          repeatedCalls = 0,
          repeatedAxes = 0,
          referenceCalls = 0,
          referenceAxes = 0
        const original = projection.projectedBoundsGap
        vi.spyOn(projection, 'projectedBoundsGap').mockImplementation(
          (a, aPose, b, bPose, threshold, checkpoint) => {
            if (!active)
              throw new Error('Projection escaped its direct query lifetime')
            expect(aPose).toBe(active.aPose)
            expect(bPose).toBe(active.bPose)
            const key = [...a.flat(), ...b.flat(), threshold]
              .map((value) => (Object.is(value, -0) ? '-0' : String(value)))
              .join(',')
            let work = 0
            calls++
            const result = original(a, aPose, b, bPose, threshold, () => {
              work++
              axes++
              checkpoint()
            })
            const previous = active.completed.get(key)
            if (previous) {
              expect(result).toBe(previous.value)
              expect(work).toBe(previous.axes)
              repeatedCalls++
              repeatedAxes += work
              if (previous.a === a && previous.b === b) {
                referenceCalls++
                referenceAxes += work
              }
            } else
              active.completed.set(key, { a, b, value: result, axes: work })
            return result
          }
        )
        const context = new OriginalMeshQuery()
        const distance = context.distance.bind(context),
          lower = context.lowerOver.bind(context)
        context.distance = (...args) => {
          active = {
            aPose: args[0].pose,
            bPose: args[1].pose,
            completed: new Map()
          }
          try {
            return distance(...args)
          } finally {
            active = undefined
          }
        }
        context.lowerOver = (...args) => {
          active = {
            aPose: args[0].pose,
            bPose: args[1].pose,
            completed: new Map()
          }
          try {
            return lower(...args)
          } finally {
            active = undefined
          }
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
        // eslint-disable-next-line no-console -- passive exact query identity and actual projection-work evidence
        console.info(
          JSON.stringify({
            profile: 'query-local-projection-repetition',
            start,
            work: context.work,
            calls,
            axes,
            repeatedCalls,
            repeatedAxes,
            referenceCalls,
            referenceAxes,
            optimisticNetAfterLookup: repeatedAxes - calls,
            coverage: result.coverage
          })
        )
        expect(result.coverage).toBe('complete')
      },
      20000
    )
  }
)
