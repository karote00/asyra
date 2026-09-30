import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, afterEach, expect, it, vi } from 'vitest'
import { runOriginalPartMethod } from '../original-part-method'
import { OriginalMeshQuery } from '../original-mesh-query'
import * as meshIndex from '../mesh-index'
import * as membership from '../mesh-membership'
import * as convex from '../convex-query'
import { representativeSnapshot } from './representative-fixture'
import { supervisedTestProgress } from './heavy-test-progress'

const enabled = process.env.SIM_CAPACITY_PROFILE === '1'
const progress = enabled ? supervisedTestProgress() : undefined
afterEach(() => {
  progress?.endQuery()
  vi.restoreAllMocks()
})
afterAll(() => progress?.finish(1))

it.skipIf(!enabled)(
  'measures both unchanged timeout candidates once with a finite diagnostic window',
  async () => {
    if (!progress)
      throw new Error(
        'Capacity profiling requires the owned external supervisor'
      )
    for (const candidate of [1, 2]) {
      progress.stage('fixture-' + candidate)
      const original = await representativeSnapshot(candidate)
      const snapshot = {
        ...original,
        budget: { ...original.budget, maxDurationMs: 120000 }
      }
      expect(snapshot.workcell.bodies).toHaveLength(39)
      expect(snapshot.pairs).toHaveLength(298)
      expect(snapshot.trajectory.keyframes).toHaveLength(200)
      expect(
        snapshot.workcell.bodies.reduce(
          (sum, body) =>
            sum +
            body.colliders.reduce(
              (n, collider) =>
                n +
                (collider.geometry.kind === 'mesh'
                  ? collider.geometry.indices.length / 3
                  : 0),
              0
            ),
          0
        )
      ).toBe(40388)
      const counts = {
        staticCalls: 0,
        staticWork: 0,
        staticMs: 0,
        intervalCalls: 0,
        intervalWork: 0,
        intervalMs: 0,
        preparationCalls: 0,
        preparationWork: 0,
        preparationMs: 0,
        refinementCalls: 0,
        refinementWork: 0,
        refinementMs: 0,
        membershipCalls: 0,
        membershipWork: 0,
        membershipMs: 0,
        convexCalls: 0,
        convexMs: 0,
        worldBoundsCalls: 0,
        worldBoundsMs: 0,
        repeatedWorldBounds: 0
      }
      let activeWork = () => 0
      let transformed = new WeakMap<object, WeakSet<object>>()
      const distance = OriginalMeshQuery.prototype.distance
      vi.spyOn(OriginalMeshQuery.prototype, 'distance').mockImplementation(
        function (this: OriginalMeshQuery, ...args) {
          activeWork = () => this.work
          transformed = new WeakMap()
          const before = this.work,
            start = performance.now()
          counts.staticCalls++
          try {
            return distance.apply(this, args)
          } finally {
            counts.staticWork += this.work - before
            counts.staticMs += performance.now() - start
          }
        }
      )
      const lower = OriginalMeshQuery.prototype.lowerOver
      vi.spyOn(OriginalMeshQuery.prototype, 'lowerOver').mockImplementation(
        function (this: OriginalMeshQuery, ...args) {
          activeWork = () => this.work
          transformed = new WeakMap()
          const before = this.work,
            start = performance.now()
          counts.intervalCalls++
          try {
            return lower.apply(this, args)
          } finally {
            counts.intervalWork += this.work - before
            counts.intervalMs += performance.now() - start
          }
        }
      )
      const build = meshIndex.buildMeshIndex
      vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
        (geometry, checkpoint, hierarchy, checkExecution) => {
          counts.preparationCalls++
          const start = performance.now()
          try {
            return build(
              geometry,
              () => {
                counts.preparationWork++
                checkpoint()
              },
              hierarchy,
              checkExecution
            )
          } finally {
            counts.preparationMs += performance.now() - start
          }
        }
      )
      const refine = meshIndex.refineMeshIndex
      vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
        (index, checkpoint) => {
          counts.refinementCalls++
          const start = performance.now()
          try {
            return refine(index, () => {
              counts.refinementWork++
              checkpoint()
            })
          } finally {
            counts.refinementMs += performance.now() - start
          }
        }
      )
      const contains = membership.shapeMembership
      vi.spyOn(membership, 'shapeMembership').mockImplementation(
        (point, shape, index, checkpoint) => {
          counts.membershipCalls++
          const start = performance.now()
          try {
            return contains(point, shape, index, () => {
              counts.membershipWork++
              checkpoint()
            })
          } finally {
            counts.membershipMs += performance.now() - start
          }
        }
      )
      const solve = convex.convexDistance
      vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
        counts.convexCalls++
        const start = performance.now()
        try {
          return solve(...args)
        } finally {
          counts.convexMs += performance.now() - start
        }
      })
      const bounds = meshIndex.worldBounds
      vi.spyOn(meshIndex, 'worldBounds').mockImplementation((box, pose) => {
        counts.worldBoundsCalls++
        const poses = transformed.get(box) ?? new WeakSet<object>()
        if (poses.has(pose)) counts.repeatedWorldBounds++
        poses.add(pose)
        transformed.set(box, poses)
        const start = performance.now()
        try {
          return bounds(box, pose)
        } finally {
          counts.worldBoundsMs += performance.now() - start
        }
      })
      const rows: {
        pairId: string
        elapsedMs: number
        paidWork: number
        evaluations: number
        coverage: string
        counts: typeof counts
      }[] = []
      const start = performance.now()
      let previousTime = start,
        previousWork = 0,
        previousCounts = { ...counts }
      const reportProgress = progress.query('candidate-' + candidate, () =>
        activeWork()
      )
      const expired = new Error('Diagnostic 120-second window expired')
      let evidence: ReturnType<typeof runOriginalPartMethod> | undefined
      let failure: unknown
      try {
        evidence = runOriginalPartMethod(
          snapshot,
          () => {
            reportProgress()
            if (performance.now() - start >= snapshot.budget.maxDurationMs)
              throw expired
          },
          (pair) => {
            const now = performance.now(),
              work = activeWork()
            rows.push({
              pairId: pair.pairId,
              elapsedMs: now - previousTime,
              paidWork: work - previousWork,
              evaluations: pair.evidence.evaluations,
              coverage: pair.evidence.coverage,
              counts: Object.fromEntries(
                Object.entries(counts).map(([key, value]) => [
                  key,
                  value - previousCounts[key as keyof typeof counts]
                ])
              ) as typeof counts
            })
            previousTime = now
            previousWork = work
            previousCounts = { ...counts }
          }
        )
      } catch (error) {
        failure = error
      } finally {
        progress.endQuery()
      }
      const elapsedMs = performance.now() - start
      let execution = failure ? 'failed' : 'completed'
      if (failure === expired) execution = 'timed-out'
      const report = {
        candidate: candidate + 1,
        diagnosticOnly: true,
        timingMeaning:
          'Instrumented method wall time; nested owner times overlap and are not a product performance claim.',
        budget: snapshot.budget,
        method: snapshot.method,
        input: { bodies: 39, triangles: 40388, pairs: 298, keyframes: 200 },
        execution,
        coverage: evidence?.coverage ?? 'partial',
        elapsedMs,
        paidWork: activeWork(),
        publishedPairs: rows.length,
        evaluations:
          evidence?.evaluations ??
          rows.reduce((sum, row) => sum + row.evaluations, 0),
        counts,
        pairs: rows,
        unfinished: failure
          ? {
              paidWork: activeWork() - previousWork,
              elapsedMs: performance.now() - previousTime
            }
          : null
      }
      const folder = resolve(process.cwd(), '../../tmp/capacity')
      mkdirSync(folder, { recursive: true })
      writeFileSync(
        resolve(folder, 'candidate-' + (candidate + 1) + '-owner-profile.json'),
        JSON.stringify(report, null, 2) + '\n'
      )
      expect(failure === undefined || failure === expired).toBe(true)
      expect(elapsedMs).toBeLessThan(121000)
      expect(counts.staticWork + counts.intervalWork).toBeLessThanOrEqual(
        activeWork()
      )
      if (evidence) {
        expect(evidence.pairs).toHaveLength(298)
        expect(evidence.coverage).toBe('complete')
      }
      vi.restoreAllMocks()
    }
    progress.complete()
  },
  progress ? 0 : 20000
)
