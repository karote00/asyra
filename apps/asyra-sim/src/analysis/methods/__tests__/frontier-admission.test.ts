import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { PreparedMeshIndex } from '../mesh-index'
import type { PairEvidence } from '../continuous-query'
import type { FrontierWork } from '../mesh-frontier'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

// Fixed admission, not a product performance gate. Actual candidate traversal;
// no baseline shadow, event credit, changed source or omitted preparation.
describe.runIf(process.env.SIM_FRONTIER_LIFECYCLE_ADMISSION === '1')(
  'private linked frontier lifecycle - frozen prefix',
  () => {
    let snapshot: Awaited<ReturnType<typeof representativeSnapshot>>,
      control: PairEvidence | undefined
    const prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>()
    beforeAll(async () => {
      snapshot = await representativeSnapshot(0)
    })
    const run = (context: OriginalMeshQuery, checkpoint: () => void) => {
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
        checkpoint,
        context
      )
    }
    const save = (mode: string, data: unknown) => {
      const path = fileURLToPath(
        new URL(
          `../../../../../../tmp/capacity/lifecycle-frontier-${mode}.json`,
          import.meta.url
        )
      )
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
      return path
    }
    function classifications(result: PairEvidence) {
      let cursor = snapshot.trajectory.keyframes[114].time
      for (const leaf of result.leaves) {
        expect(leaf.start).toBe(cursor)
        expect(leaf.end).toBeGreaterThan(leaf.start)
        expect(leaf.lower).toBeGreaterThanOrEqual(0)
        if (leaf.upper !== null)
          expect(leaf.upper).toBeGreaterThanOrEqual(leaf.lower)
        if (leaf.witnessTime !== null) {
          expect(leaf.witnessTime).toBeGreaterThanOrEqual(leaf.start)
          expect(leaf.witnessTime).toBeLessThanOrEqual(leaf.end)
        }
        if (leaf.state === 'clear')
          expect(leaf.lower).toBeGreaterThan(snapshot.rule.minimumClearance)
        if (leaf.state === 'finding') {
          expect(leaf.upper).not.toBeNull()
          expect(leaf.upper as number).toBeLessThanOrEqual(
            snapshot.rule.minimumClearance
          )
          expect(leaf.witnessTime).not.toBeNull()
        }
        if (leaf.penetration) expect(leaf.upper).toBe(0)
        cursor = leaf.end
      }
      expect(cursor).toBe(snapshot.trajectory.keyframes[199].time)
      return Array.from({ length: 85 }, (_, i) => {
        const lo = snapshot.trajectory.keyframes[i + 114].time,
          hi = snapshot.trajectory.keyframes[i + 115].time
        const leaves = result.leaves.filter((l) => l.start < hi && l.end > lo)
        expect(leaves.length).toBeGreaterThan(0)
        return {
          root: i + 114,
          finding: leaves.some((l) => l.state === 'finding'),
          unresolved: leaves.some((l) => l.state === 'unresolved'),
          penetration: leaves.some((l) => l.penetration)
        }
      })
    }
    it('replays the unchanged complete 197028-unit control before candidate observation', () => {
      const started = performance.now(),
        checkpoint = () => {
          if (performance.now() - started > 20000)
            throw new Error('Fixed 20-second admission wall guard')
        }
      const context = new OriginalMeshQuery(checkpoint),
        result = run(context, checkpoint)
      save('control', {
        work: context.work,
        milliseconds: performance.now() - started,
        result
      })
      expect(result.coverage).toBe('complete')
      expect(result.evaluations).toBe(95)
      expect(context.work).toBe(197028)
      control = result
    }, 20000)
    it.each(['cold', 'hot'] as const)(
      'requires the complete %s traversal to meet 157622 with all work charged',
      (mode) => {
        if (!control)
          throw new Error(
            'Control did not reproduce; candidate observation prohibited'
          )
        const started = performance.now(),
          checkpoint = () => {
            if (performance.now() - started > 20000)
              throw new Error('Fixed 20-second admission wall guard')
          }
        const context = new OriginalMeshQuery(
          checkpoint,
          500000,
          true,
          prepared,
          true
        )
        const owner = (
          context as unknown as {
            frontier: { charge: (kind: FrontierWork) => void }
          }
        ).frontier
        const original = owner.charge,
          frontier: Partial<Record<FrontierWork, number>> = {}
        owner.charge = (kind) => {
          const before = context.work
          try {
            original(kind)
          } finally {
            frontier[kind] = (frontier[kind] ?? 0) + context.work - before
          }
        }
        const categories: Record<string, number> = {}
        const calls: Record<string, number> = {}
        for (const name of [
          'distance',
          'lowerOver',
          'chargeSourceWitness',
          'chargeEvidenceHandoff',
          'chargeEvidenceDerivation'
        ] as const) {
          const method = context[name].bind(context) as (
            ...args: unknown[]
          ) => unknown
          ;(context[name] as (...args: unknown[]) => unknown) = (...args) => {
            const before = context.work
            calls[name] = (calls[name] ?? 0) + 1
            try {
              return method(...args)
            } finally {
              categories[name] = (categories[name] ?? 0) + context.work - before
            }
          }
        }
        let result: PairEvidence | undefined, error: unknown
        try {
          result = run(context, checkpoint)
        } catch (caught) {
          error = caught
        }
        const artifact = save(mode, {
          mode,
          base: 'b9f4a710c',
          population: 'joint-2 / obstacle-11 - roots 114–198',
          controlWork: 197028,
          ceiling: 157622,
          work: context.work,
          frontier,
          categories,
          calls,
          milliseconds: performance.now() - started,
          result,
          error: error instanceof Error ? error.message : error,
          note: 'Default-off candidate actual traversal. Frontier categories are a subset of enclosing owner categories, not added twice. Public representative source, not hardware or human evidence. No G4 acceptance.'
        })
        // eslint-disable-next-line no-console -- bounded summary; complete results are saved before assertions
        console.info(
          JSON.stringify({
            mode,
            work: context.work,
            frontier,
            categories,
            calls,
            coverage: result?.coverage,
            evaluations: result?.evaluations,
            artifact
          })
        )
        expect(error).toBeUndefined()
        if (!result) throw new Error('Missing candidate result')
        expect(Object.values(categories).reduce((a, b) => a + b, 0)).toBe(
          context.work
        )
        expect(result.coverage).toBe('complete')
        expect(classifications(result)).toEqual(classifications(control))
        expect(context.work).toBeLessThanOrEqual(157622)
      },
      20000
    )
  }
)
