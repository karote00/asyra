import { arch, cpus, platform, release, totalmem } from 'node:os'
import { expect, test } from '@playwright/test'
import { EXPERIMENT_RESOURCE_PROFILE } from '../../contracts'
import type { AnalysisResult } from '../../result'
import { representativeSnapshot } from './representative-fixture'

const benchmarkDurationMs = 120000

for (const candidate of [0, 1, 2]) {
  test(`full original-part representative workcell produces useful bounded evidence for candidate ${candidate + 1}`, async ({
    page,
    browser
  }, info) => {
    test.setTimeout(benchmarkDurationMs + 15000)
    const original = await representativeSnapshot(candidate)
    expect(original.budget).toEqual({
      maxDurationMs: 30000,
      maxIntervals: 100000
    })
    expect(benchmarkDurationMs).toBeLessThanOrEqual(
      EXPERIMENT_RESOURCE_PROFILE.maxDurationMs
    )
    const snapshot = {
      ...original,
      budget: { ...original.budget, maxDurationMs: benchmarkDurationMs }
    }
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText('Local runtime ready')
    const initialWorkers = new Set(page.workers())
    const measurement = await page.evaluate(
      async ({ snapshot, moduleUrl }) => {
        const { AnalysisRunner } = await import(moduleUrl)
        const runner = new AnalysisRunner()
        const start = performance.now()
        let ticks = 0
        let heapPeak = 0
        const sample = () => {
          const memory = (
            performance as Performance & { memory?: { usedJSHeapSize: number } }
          ).memory
          heapPeak = Math.max(heapPeak, memory?.usedJSHeapSize ?? 0)
          ticks++
        }
        sample()
        const timer = setInterval(sample, 50)
        try {
          const result: AnalysisResult = await runner.run(snapshot)
          sample()
          return {
            elapsedMs: performance.now() - start,
            pageHeapPeakBytes: heapPeak || null,
            eventLoopSamples: ticks,
            execution: result.execution,
            coverage: result.coverage,
            verdict: result.verdict,
            pairs: result.totalPairCount,
            unresolved: result.unresolvedPairCount,
            evaluations: result.pairEvidence.reduce(
              (n, pair) => n + pair.evidence.evaluations,
              0
            ),
            leaves: result.pairEvidence.reduce(
              (n, pair) => n + pair.evidence.leaves.length,
              0
            ),
            unresolvedReasons: [
              ...new Set(
                result.pairEvidence.flatMap((pair) =>
                  pair.evidence.leaves
                    .filter((leaf) => leaf.state === 'unresolved')
                    .map((leaf) => leaf.reason)
                )
              )
            ],
            errors: result.errors
          }
        } finally {
          clearInterval(timer)
          await runner.dispose()
        }
      },
      { snapshot, moduleUrl: '/src/analysis/runner.ts' }
    )
    await expect
      .poll(
        () =>
          page.workers().filter((worker) => !initialWorkers.has(worker)).length
      )
      .toBe(0)
    await info.attach('representative-resource.json', {
      contentType: 'application/json',
      body: JSON.stringify({
        candidate: candidate + 1,
        profile: 'large-workcell-120s',
        hardware: {
          cpu: cpus()[0]?.model ?? 'unavailable',
          logicalCpus: cpus().length,
          architecture: arch(),
          physicalMemoryBytes: totalmem(),
          platform: platform(),
          osRelease: release(),
          browserVersion: browser.version()
        },
        workersAfterDispose: page
          .workers()
          .filter((worker) => !initialWorkers.has(worker)).length,
        method: snapshot.method,
        budget: snapshot.budget,
        bodies: snapshot.workcell.bodies.length,
        keyframes: snapshot.trajectory.keyframes.length,
        inputPairs: snapshot.pairs.length,
        triangles: snapshot.workcell.bodies.reduce(
          (n, body) =>
            n +
            body.colliders.reduce(
              (m, collider) =>
                m +
                (collider.geometry.kind === 'mesh'
                  ? collider.geometry.indices.length / 3
                  : 0),
              0
            ),
          0
        ),
        memoryLimitations:
          'Page JS heap only; excludes total browser/Worker/native/GPU resident memory. Development host, not reference hardware.',
        ...measurement
      })
    })
    expect(measurement.elapsedMs).toBeLessThan(
      snapshot.budget.maxDurationMs + 5000
    )
    expect(measurement.evaluations).toBeLessThanOrEqual(
      snapshot.budget.maxIntervals
    )
    expect(measurement.pairs).toBe(snapshot.pairs.length)
    expect(measurement.execution).toBe('completed')
    expect(measurement.coverage).toBe('complete')
    expect(measurement.unresolved).toBe(0)
    expect(measurement.eventLoopSamples).toBeGreaterThan(1)
  })
}
