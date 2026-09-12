import { afterEach, describe, expect, it, vi } from 'vitest'
import * as kinematics from '../../../domain/kinematic-algebra'
import * as meshIndex from '../mesh-index'
import { EXPERIMENT_RESOURCE_PROFILE } from '../../contracts'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'exact original segment repetition',
  () => {
    it('measures completed identical queries in original segment 115', async () => {
      const snapshot = await representativeSnapshot(0)
      const pair = snapshot.pairs.find(
        (item) =>
          item.a.bodyId === 'example:joint-2' && item.b.bodyId === 'obstacle-11'
      )
      if (!pair) throw new Error('Missing measured source pair')
      const context = new OriginalMeshQuery(
        () => undefined,
        EXPERIMENT_RESOURCE_PROFILE.maxWorkUnits
      )
      const identities = new WeakMap<object, number>()
      let nextIdentity = 0
      const identity = (object: object) => {
        let value = identities.get(object)
        if (value === undefined) {
          value = nextIdentity++
          identities.set(object, value)
        }
        return value
      }
      // JSON numbers round-trip binary64, with an explicit negative-zero token.
      const exact = (value: unknown) =>
        JSON.stringify(value, (_key, item) =>
          typeof item === 'number' && Object.is(item, -0)
            ? 'negative-zero'
            : item
        )
      let time: unknown,
        segment = -1,
        medianPrep = 0,
        refinePrep = 0
      const interpolate = kinematics.interpolateSegment
      vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
        (...args) => {
          segment = args[1]
          time = args[2]
          return interpolate(...args)
        }
      )
      const build = meshIndex.buildMeshIndex
      vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
        (geometry, checkpoint, hierarchy) =>
          build(
            geometry,
            () => {
              medianPrep++
              checkpoint()
            },
            hierarchy
          )
      )
      const refine = meshIndex.refineMeshIndex
      vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
        (index, checkpoint) =>
          refine(index, () => {
            refinePrep++
            checkpoint()
          })
      )
      const rows: {
        kind: string
        work: number
        repeated: boolean
        time: unknown
      }[] = []
      const completed = new Map<string, unknown>()
      const admittedIntervals = new Map<string, number>()
      let equivalentIntervalCalls = 0,
        equivalentIntervalWork = 0
      const record = (
        kind: string,
        args:
          | Parameters<typeof context.distance>
          | Parameters<typeof context.lowerOver>,
        call: () => unknown
      ) => {
        const key = exact([
          kind,
          segment,
          time,
          identity(args[0].geometry),
          args[0].pose,
          identity(args[1].geometry),
          args[1].pose,
          ...args.slice(2)
        ])
        const before = context.work
        const output = call()
        const repeated = completed.has(key)
        if (repeated) expect(output).toEqual(completed.get(key))
        else completed.set(key, structuredClone(output))
        rows.push({ kind, work: context.work - before, repeated, time })
        return output
      }
      const distance = context.distance.bind(context)
      context.distance = (...args) =>
        record('static', args, () => distance(...args)) as ReturnType<
          typeof distance
        >
      const lower = context.lowerOver.bind(context)
      context.lowerOver = (...args) => {
        const before = context.work
        const output = record('interval', args, () => lower(...args)) as number
        if (args[3].lower > 0) {
          const key = exact([
            segment,
            time,
            identity(args[0].geometry),
            args[0].pose,
            identity(args[1].geometry),
            args[1].pose,
            args[2],
            args[4],
            args[5]
          ])
          if (admittedIntervals.has(key)) {
            expect(output).toBe(admittedIntervals.get(key))
            equivalentIntervalCalls++
            equivalentIntervalWork += context.work - before
          } else admittedIntervals.set(key, output)
        }
        return output
      }
      const interval = [
        snapshot.trajectory.keyframes[115].time,
        snapshot.trajectory.keyframes[116].time
      ] as const
      const result = queryOriginalPartPair(
        {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: pair.a,
          b: pair.b,
          interval
        },
        {
          threshold: snapshot.rule.minimumClearance,
          ...snapshot.method.settings,
          maxIntervals: snapshot.budget.maxIntervals
        },
        () => undefined,
        context
      )
      expect(result.coverage).toBe('complete')
      expect(context.work).toBeLessThanOrEqual(
        EXPERIMENT_RESOURCE_PROFILE.maxWorkUnits
      )
      const summarize = (kind: string) => {
        const selected = rows.filter((row) => row.kind === kind)
        return {
          calls: selected.length,
          repeatedCalls: selected.filter((row) => row.repeated).length,
          work: selected.reduce((sum, row) => sum + row.work, 0),
          repeatedWorkUpperBound: selected
            .filter((row) => row.repeated)
            .reduce((sum, row) => sum + row.work, 0)
        }
      }
      // eslint-disable-next-line no-console -- permanent passive exact-input work evidence
      console.info(
        JSON.stringify({
          profile: 'segment-repetition',
          equivalentIntervalCalls,
          equivalentIntervalWork,
          interval,
          work: context.work,
          medianPrep,
          refinePrep,
          evaluations: result.evaluations,
          static: summarize('static'),
          intervalCalls: summarize('interval'),
          largestRepeats: rows
            .filter((row) => row.repeated)
            .sort((a, b) => b.work - a.work)
            .slice(0, 5),
          states: result.leaves.map((leaf) => leaf.state)
        })
      )
    }, 20000)
  }
)
