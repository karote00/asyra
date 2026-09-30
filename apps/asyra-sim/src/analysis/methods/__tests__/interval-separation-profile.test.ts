import { afterEach, expect, it, vi } from 'vitest'
import * as continuous from '../continuous-query'
import * as samplers from '../fresh-static-sampler'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())

it.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'measures the full root 114 positive-gap certificate without replacing static samples',
  async () => {
    const snapshot = await representativeSnapshot(0)
    const pair = snapshot.pairs.find(
      (value) =>
        value.a.bodyId === 'example:joint-2' && value.b.bodyId === 'obstacle-11'
    )
    if (!pair) throw new Error('Missing admitted source pair')
    const segment = 114
    const start = snapshot.trajectory.keyframes[segment].time
    const end = snapshot.trajectory.keyframes[segment + 1].time
    const middle = start + (end - start) / 2
    const settings = {
      ...snapshot.method.settings,
      threshold: snapshot.rule.minimumClearance,
      maxIntervals: snapshot.budget.maxIntervals
    }
    const context = new OriginalMeshQuery()
    const records: {
      time: number
      shapes: readonly [ConvexShape, ConvexShape]
      evidence: DistanceEvidence
      seed?: samplers.SourceUpper
      work: number
    }[] = []
    let intervalShapes: readonly [ConvexShape, ConvexShape] | undefined
    const originalContinuous = continuous.queryContinuousPair
    vi.spyOn(continuous, 'queryContinuousPair').mockImplementation(
      (query, options, checkpoint, kernel) => {
        if (!kernel?.deriveZeroLower)
          throw new Error('Missing actual mesh route')
        const derive = kernel.deriveZeroLower
        return originalContinuous(query, options, checkpoint, {
          ...kernel,
          deriveZeroLower(a, b) {
            if (intervalShapes)
              throw new Error('Unexpected second interval request')
            intervalShapes = [a, b]
            return derive(a, b)
          }
        })
      }
    )
    const originalSampler = samplers.createFreshStaticSampler
    vi.spyOn(samplers, 'createFreshStaticSampler').mockImplementation(
      (threshold, tick, solve, exhausted) => {
        let actualSeed: samplers.SourceUpper | undefined
        const sample = originalSampler(
          threshold,
          tick,
          (a, b, seed) => {
            actualSeed = seed
            return solve(a, b, seed)
          },
          exhausted
        )
        const observed: samplers.StaticSampler = (a, b, origin, previous) => {
          expect(origin.segment).toBe(segment)
          expect([origin.start, origin.end]).toEqual([start, end])
          expect(origin.originalRoot).toBe(true)
          actualSeed = undefined
          const before = context.work
          const result = sample(a, b, origin, previous)
          if (!result || result.exhausted)
            throw new Error('Incomplete baseline sample')
          records.push({
            time: origin.time,
            shapes: [a, b],
            evidence: result.evidence,
            seed: actualSeed,
            work: context.work - before
          })
          return result
        }
        observed.publishBoundary = sample.publishBoundary
        return observed
      }
    )
    const result = queryOriginalPartPair(
      {
        workcell: snapshot.workcell,
        trajectory: snapshot.trajectory,
        a: pair.a,
        b: pair.b,
        interval: [start, end]
      },
      settings,
      () => undefined,
      context
    )
    expect(result.coverage).toBe('complete')
    expect(result.evaluations).toBe(1)
    expect(records.map((record) => record.time)).toEqual([start, middle, end])
    expect(result.leaves).toHaveLength(1)
    expect(result.leaves[0]).toMatchObject({
      start,
      end,
      state: 'finding',
      penetration: false
    })
    const first = records[0]
    expect(first.seed).toBeUndefined()
    expect(first.evidence.penetration).toBe(false)
    expect(first.evidence.lower).toBeGreaterThan(0)
    expect(Number.isFinite(first.evidence.upper)).toBe(true)
    expect(first.evidence.lower).toBeLessThanOrEqual(first.evidence.upper)
    if (!intervalShapes)
      throw new Error('Missing actual full-root interval inputs')
    for (const [side, shape] of intervalShapes.entries()) {
      expect(shape.geometry).toBe(first.shapes[side].geometry)
      expect(shape.geometry.kind).toBe('mesh')
      if (shape.geometry.kind !== 'mesh')
        throw new Error('Expected admitted mesh')
      expect(Object.isFrozen(shape.geometry)).toBe(true)
      expect(Object.isFrozen(shape.geometry.positions)).toBe(true)
      expect(Object.isFrozen(shape.geometry.indices)).toBe(true)
      for (const record of records)
        expect(record.shapes[side].geometry).toBe(shape.geometry)
    }
    const baselineWork = context.work
    expect(records.reduce((sum, record) => sum + record.work, 0) + 1).toBe(
      baselineWork
    )
    const unchanged = JSON.stringify(result)
    let gap: number | null = null
    let status = 'complete'
    try {
      gap = context.lowerOver(
        intervalShapes[0],
        intervalShapes[1],
        0,
        first.evidence,
        settings.distanceTolerance,
        settings.maxIterations
      )
    } catch (error) {
      if (!(error instanceof MeshWorkLimit)) throw error
      status = 'exhausted'
    }
    const certificateWork = context.work - baselineWork
    const targets = records.slice(1)
    const seedEligible = targets.every(
      (record) =>
        record.seed !== undefined &&
        Number.isFinite(record.seed.upper) &&
        record.seed.upper < settings.threshold
    )
    const replacementUpperLimit =
      gap !== null && gap > 0 && seedEligible
        ? targets.reduce((sum, record) => sum + record.work, 0)
        : 0
    // eslint-disable-next-line no-console -- bounded passive cost evidence, not a production replacement
    console.info(
      JSON.stringify({
        profile: 'interval-separation',
        segment,
        start,
        end,
        baselineWork,
        certificateWork,
        totalWork: context.work,
        status,
        gap,
        seedEligible,
        replacementUpperLimit,
        netSavingUpperLimit: replacementUpperLimit - certificateWork,
        samples: records.map((record) => ({
          time: record.time,
          work: record.work,
          lower: record.evidence.lower,
          upper: record.evidence.upper,
          penetration: record.evidence.penetration,
          seedUpper: record.seed?.upper
        })),
        result
      })
    )
    expect(JSON.stringify(result)).toBe(unchanged)
    expect(context.work).toBe(baselineWork + certificateWork)
    if (gap !== null && gap > 0) {
      expect(records.every((record) => !record.evidence.penetration)).toBe(true)
      for (const record of records)
        expect(gap).toBeLessThanOrEqual(record.evidence.upper)
    }
  },
  20000
)
