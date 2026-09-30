import { afterEach, expect, it, vi } from 'vitest'
import * as continuous from '../continuous-query'
import * as samplers from '../fresh-static-sampler'
import * as kinematics from '../../../domain/kinematic-algebra'
import * as mesh from '../mesh-index'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())

it.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'counts every eligible original root in the fixed complete prefix before raw certificates',
  async () => {
    const snapshot = await representativeSnapshot(0),
      frames = snapshot.trajectory.keyframes
    const pair = snapshot.pairs.find(
      (p) => p.a.bodyId === 'example:joint-2' && p.b.bodyId === 'obstacle-11'
    )
    if (!pair) throw new Error('Missing admitted source pair')
    const settings = {
      ...snapshot.method.settings,
      threshold: snapshot.rule.minimumClearance,
      maxIntervals: snapshot.budget.maxIntervals
    }
    const context = new OriginalMeshQuery()
    const indices = new Map<mesh.MeshIndex, MeshGeometry>()
    const preparation = new Map<
      MeshGeometry,
      { median: number; refined?: number }
    >()
    const build = mesh.buildMeshIndex,
      refine = mesh.refineMeshIndex
    vi.spyOn(mesh, 'buildMeshIndex').mockImplementation((geometry, ...args) => {
      const index = build(geometry, ...args)
      indices.set(index, geometry)
      preparation.set(geometry, { median: context.work })
      return index
    })
    vi.spyOn(mesh, 'refineMeshIndex').mockImplementation((index, ...args) => {
      const geometry = indices.get(index)
      if (!geometry) throw new Error('Unknown charged median identity')
      const result = refine(index, ...args)
      const paid = preparation.get(geometry)
      if (!paid) throw new Error('Missing median preparation')
      paid.refined = context.work
      return result
    })
    interface Sample {
      time: number
      shapes: readonly [ConvexShape, ConvexShape]
      evidence: DistanceEvidence
      seed?: samplers.SourceUpper
      work: number
      after: number
    }
    interface Root {
      node: object
      segment: number
      start: number
      end: number
      child: boolean
      penetration: boolean
      incomplete: boolean
      samples: Sample[]
      interval?: readonly [ConvexShape, ConvexShape]
    }
    const roots: Root[] = []
    let active: Root | undefined, span: readonly [number, number] | undefined
    const interpolate = kinematics.interpolateSegment
    vi.spyOn(kinematics, 'interpolateSegment').mockImplementation((...args) => {
      if (!Array.isArray(args[2]))
        throw new Error('Expected domain interval input')
      span = [args[2][0], args[2][1]]
      return interpolate(...args)
    })
    const recordInterval = (a: ConvexShape, b: ConvexShape) => {
      if (
        active &&
        !active.child &&
        span?.[0] === active.start &&
        span[1] === active.end
      )
        active.interval = [a, b]
    }
    const originalContinuous = continuous.queryContinuousPair
    vi.spyOn(continuous, 'queryContinuousPair').mockImplementation(
      (query, options, checkpoint, kernel) => {
        if (!kernel?.deriveZeroLower)
          throw new Error('Missing actual mesh route')
        const derive = kernel.deriveZeroLower
        return originalContinuous(query, options, checkpoint, {
          ...kernel,
          deriveZeroLower(a, b) {
            recordInterval(a, b)
            return derive(a, b)
          },
          lower(a, b, witness) {
            recordInterval(a, b)
            return kernel.lower(a, b, witness)
          }
        })
      }
    )
    const make = samplers.createFreshStaticSampler
    vi.spyOn(samplers, 'createFreshStaticSampler').mockImplementation(
      (threshold, tick, solve, exhausted) => {
        let seed: samplers.SourceUpper | undefined
        const sample = make(
          threshold,
          tick,
          (a, b, actual) => {
            seed = actual
            return solve(a, b, actual)
          },
          exhausted
        )
        const observed: samplers.StaticSampler = (a, b, origin, previous) => {
          if (origin.originalRoot && origin.time === origin.start) {
            active = {
              node: origin.node,
              segment: origin.segment,
              start: origin.start,
              end: origin.end,
              child: false,
              penetration: false,
              incomplete: false,
              samples: []
            }
            roots.push(active)
          } else if (active && origin.node !== active.node) active.child = true
          const before = context.work
          seed = undefined
          const result = sample(a, b, origin, previous)
          if (active) {
            active.incomplete ||= !result || result.exhausted === true
            active.penetration ||= result?.evidence.penetration === true
            if (origin.node === active.node && result)
              active.samples.push({
                time: origin.time,
                shapes: [a, b],
                evidence: result.evidence,
                seed,
                work: context.work - before,
                after: context.work
              })
          }
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
        interval: [frames[114].time, frames[199].time]
      },
      settings,
      () => undefined,
      context
    )
    expect(result.coverage).toBe('complete')
    expect(context.work).toBe(197028)
    expect(roots.map((root) => root.segment)).toEqual(
      Array.from({ length: 85 }, (_, i) => 198 - i)
    )
    const exclusions: Record<string, number> = {}
    const eligible: Root[] = []
    for (const root of roots) {
      const first = root.samples[0]
      const fullLeaf = result.leaves.find(
        (leaf) => leaf.start === root.start && leaf.end === root.end
      )
      let reason: string | undefined
      if (root.child || !fullLeaf) reason = 'subdivided'
      else if (root.incomplete || fullLeaf.state === 'unresolved')
        reason = 'incomplete'
      else if (root.penetration || fullLeaf.penetration) reason = 'penetration'
      else if (
        !first ||
        first.evidence.penetration ||
        !(first.evidence.lower > 0) ||
        !Number.isFinite(first.evidence.upper) ||
        first.evidence.lower > first.evidence.upper
      )
        reason = 'first-witness'
      else if (root.samples.length !== 3) reason = 'sample-count'
      else if (
        !root.samples
          .slice(1)
          .every(
            (record) =>
              record.seed &&
              Number.isFinite(record.seed.upper) &&
              record.seed.upper < settings.threshold
          )
      )
        reason = 'seed-eligibility'
      if (reason) {
        exclusions[reason] = (exclusions[reason] ?? 0) + 1
        continue
      }
      if (!root.interval)
        throw new Error('Missing complete root interval inputs')
      expect(root.samples.map((record) => record.time)).toEqual([
        root.start,
        root.start + (root.end - root.start) / 2,
        root.end
      ])
      for (const [side, shape] of root.interval.entries()) {
        expect(shape.geometry.kind).toBe('mesh')
        if (shape.geometry.kind !== 'mesh')
          throw new Error('Expected original mesh')
        expect(
          Object.isFrozen(shape.geometry.positions) &&
            Object.isFrozen(shape.geometry.indices)
        ).toBe(true)
        for (const record of root.samples)
          expect(record.shapes[side].geometry).toBe(shape.geometry)
        const paid = preparation.get(shape.geometry)
        if (!paid || paid.refined === undefined)
          throw new Error('Missing paid preparation')
        expect(paid.median).toBeLessThanOrEqual(first.after)
        expect(paid.refined).toBeLessThanOrEqual(first.after)
      }
      eligible.push(root)
    }
    expect(eligible.some((root) => root.segment === 114)).toBe(false)
    const baselineWork = context.work,
      unchanged = JSON.stringify(result)
    const certificates: {
      segment: number
      status: string
      gap: number | null
      work: number
      replacementUpperLimit: number
    }[] = []
    let complete = true
    for (const root of eligible) {
      const before = context.work
      let gap: number | null = null
      try {
        if (!root.interval) throw new Error('Missing root interval')
        gap = context.lowerOver(
          root.interval[0],
          root.interval[1],
          0,
          root.samples[0].evidence,
          settings.distanceTolerance,
          settings.maxIterations
        )
      } catch (error) {
        if (!(error instanceof MeshWorkLimit)) throw error
        complete = false
      }
      if (gap !== null && gap > 0)
        for (const record of root.samples)
          expect(gap).toBeLessThanOrEqual(record.evidence.upper)
      certificates.push({
        segment: root.segment,
        status: complete ? 'complete' : 'exhausted',
        gap,
        work: context.work - before,
        replacementUpperLimit:
          gap !== null && gap > 0
            ? root.samples
                .slice(1)
                .reduce((sum, record) => sum + record.work, 0)
            : 0
      })
      if (!complete) break
    }
    const certificateWork = certificates.reduce((sum, row) => sum + row.work, 0)
    const replacementUpperLimit = certificates.reduce(
      (sum, row) => sum + row.replacementUpperLimit,
      0
    )
    expect(context.work).toBe(baselineWork + certificateWork)
    expect(JSON.stringify(result)).toBe(unchanged)
    // eslint-disable-next-line no-console -- bounded complete population and actual certificate costs
    console.info(
      JSON.stringify({
        profile: 'interval-census',
        baselineWork,
        totalWork: context.work,
        roots: roots.length,
        exclusions,
        eligible: eligible.length,
        complete,
        untested: eligible.length - certificates.length,
        certificateWork,
        replacementUpperLimit,
        netSavingUpperLimit: replacementUpperLimit - certificateWork,
        certificates
      })
    )
  },
  20000
)
