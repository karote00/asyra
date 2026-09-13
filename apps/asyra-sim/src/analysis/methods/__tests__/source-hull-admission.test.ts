import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { PreparedMeshIndex } from '../mesh-index'
import type { PairEvidence } from '../continuous-query'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { SourceHullLifetime } from '../__fixtures__/source-hull-support'
import {
  observeSourceHull,
  SourceAdmissionStop
} from '../__fixtures__/source-hull-observer'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())
describe.runIf(process.env.SIM_SOURCE_HULL_ADMISSION === '1')(
  'complete source hull admission - frozen prefix',
  () => {
    let snapshot: Awaited<ReturnType<typeof representativeSnapshot>>,
      control: PairEvidence | undefined
    const prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>(),
      lifetime = new SourceHullLifetime()
    beforeAll(async () => {
      snapshot = await representativeSnapshot(0)
    })
    const run = (context: OriginalMeshQuery) => {
      const pair = snapshot.pairs.find(
        (p) => p.a.bodyId === 'example:joint-2' && p.b.bodyId === 'obstacle-11'
      )
      if (!pair) throw new Error('Missing fixed source pair')
      return queryOriginalPartPair(
        {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: pair.a,
          b: pair.b,
          interval: [
            snapshot.trajectory.keyframes[114].time,
            snapshot.trajectory.keyframes[199].time
          ]
        },
        {
          ...snapshot.method.settings,
          threshold: snapshot.rule.minimumClearance,
          maxIntervals: snapshot.budget.maxIntervals
        },
        () => undefined,
        context
      )
    }
    const save = (mode: string, data: unknown) => {
      const path = fileURLToPath(
        new URL(
          `../../../../../../tmp/capacity/source-hull-${mode}.json`,
          import.meta.url
        )
      )
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
      return path
    }
    it('replays the unchanged 197028-unit complete control before admission', () => {
      const context = new OriginalMeshQuery(),
        started = performance.now(),
        result = run(context)
      save('control', {
        work: context.work,
        milliseconds: performance.now() - started,
        result
      })
      expect(result.coverage).toBe('complete')
      expect(context.work).toBe(197028)
      control = result
    }, 20000)
    it.each(['cold', 'hot'] as const)(
      'requires the complete %s admission to meet the fixed optimistic screen',
      (mode) => {
        if (!control)
          throw new Error(
            'Control did not reproduce; candidate observation prohibited'
          )
        const context = new OriginalMeshQuery(
            undefined,
            500000,
            true,
            prepared
          ),
          observer = observeSourceHull(context, lifetime)
        let result: PairEvidence | undefined, stop: string | undefined
        try {
          result = run(context)
        } catch (error) {
          if (!(error instanceof SourceAdmissionStop)) throw error
          stop = error.message
        }
        const report = observer.report
        const artifact = save(mode, {
          mode,
          base: 'b9f4a710c',
          population: 'joint-2 / obstacle-11 - roots 114–198',
          controlWork: 197028,
          ceiling: 157622,
          stop,
          result,
          ...report,
          note: 'Passive optimistic admission only. No canonical result, runtime version, hardware evidence or G4 acceptance is produced.'
        })
        // eslint-disable-next-line no-console -- bounded summary; complete charged identities are in the artifact
        console.info(
          JSON.stringify({
            mode,
            stop,
            added: report.added,
            credit: report.credit,
            optimisticWork: report.optimisticWork,
            originalWork: report.originalWork,
            attempts: report.attempts.length,
            certificates: report.certificates.length,
            milliseconds: report.milliseconds,
            artifact
          })
        )
        expect(
          Object.values(report.categories).reduce(
            (sum, value) => sum + value,
            0
          )
        ).toBe(report.added)
        expect(new Set(report.credited).size).toBe(report.credit)
        const events = new Map(report.events.map((event) => [event.id, event]))
        for (const id of report.credited) {
          const event = events.get(id)
          if (!event) throw new Error('Credit without a charged event')
          expect(['node', 'axis', 'triangle']).toContain(event.kind)
          expect(
            report.certificates.some(
              (c) =>
                c.query === event.query &&
                c.componentPair === event.componentPair &&
                c.after < id &&
                c.lower > c.threshold
            )
          ).toBe(true)
        }
        expect(
          stop,
          'Research stop is negative admission evidence, never fallback success'
        ).toBeUndefined()
        expect(result).toEqual(control)
        expect(report.originalWork).toBe(197028)
        expect(report.optimisticWork).toBeLessThanOrEqual(157622)
      },
      20000
    )
  }
)
