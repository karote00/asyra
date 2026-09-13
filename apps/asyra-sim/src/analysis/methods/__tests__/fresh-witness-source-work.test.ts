import { afterEach, expect, it, vi } from 'vitest'
import * as continuous from '../continuous-query'
import { queryOriginalPartPair } from '../original-part-method'
import { OriginalMeshQuery } from '../original-mesh-query'
import { representativeSnapshot } from './representative-fixture'
import * as samplers from '../fresh-static-sampler'
import type { ConvexShape } from '../convex-query'
import { transport, type SourceWitness } from './witness-transport-control'

afterEach(() => vi.restoreAllMocks())
it.each([
  [114, 114],
  [74, 74],
  [114, 198]
])(
  'retains complete original segment prefix %s–%s with less total paid source work',
  async (segment, lastSegment) => {
    const snapshot = await representativeSnapshot(0)
    const pair = snapshot.pairs.find(
      (pair) =>
        pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
    )
    if (!pair) throw new Error('Missing admitted source pair')
    const query: continuous.PairQuery = {
      workcell: snapshot.workcell,
      trajectory: snapshot.trajectory,
      a: pair.a,
      b: pair.b,
      interval: [
        snapshot.trajectory.keyframes[segment].time,
        snapshot.trajectory.keyframes[lastSegment + 1].time
      ]
    }
    const settings = {
      ...snapshot.method.settings,
      threshold: snapshot.rule.minimumClearance,
      maxIntervals: snapshot.budget.maxIntervals
    }
    const run = (enabled: boolean) => {
      const original = continuous.queryContinuousPair
      const route = enabled
        ? undefined
        : vi
            .spyOn(continuous, 'queryContinuousPair')
            .mockImplementation((query, settings, checkpoint, kernel) =>
              original(
                query,
                settings,
                checkpoint,
                kernel ? { ...kernel, sample: undefined } : kernel
              )
            )
      const context = new OriginalMeshQuery()
      let distanceWork = 0,
        lowerWork = 0,
        sourceWork = 0,
        handoffWork = 0,
        derivationWork = 0
      const distance = context.distance.bind(context),
        lower = context.lowerOver.bind(context)
      context.distance = (...args) => {
        const before = context.work
        try {
          return distance(...args)
        } finally {
          distanceWork += context.work - before
        }
      }
      context.lowerOver = (...args) => {
        const before = context.work
        try {
          return lower(...args)
        } finally {
          lowerWork += context.work - before
        }
      }
      for (const [key, accumulate] of [
        [
          'chargeSourceWitness',
          (work: number) => {
            sourceWork += work
          }
        ],
        [
          'chargeEvidenceHandoff',
          (work: number) => {
            handoffWork += work
          }
        ],
        [
          'chargeEvidenceDerivation',
          (work: number) => {
            derivationWork += work
          }
        ]
      ] as const) {
        const charge = context[key].bind(context)
        context[key] = () => {
          const before = context.work
          try {
            return charge()
          } finally {
            accumulate(context.work - before)
          }
        }
      }
      const result = queryOriginalPartPair(
        query,
        settings,
        () => undefined,
        context
      )
      route?.mockRestore()
      const categories = {
        distanceWork,
        lowerWork,
        sourceWork,
        handoffWork,
        derivationWork
      }
      expect(
        Object.values(categories).reduce((sum, value) => sum + value, 0)
      ).toBe(context.work)
      return { result, work: context.work, categories }
    }
    const control = run(false),
      candidate = run(true)
    // eslint-disable-next-line no-console -- bounded paid-work categories and complete-prefix evidence
    console.info(
      JSON.stringify({
        profile: 'fresh-source-work',
        segment,
        lastSegment,
        control: { work: control.work, ...control.categories },
        candidate: { work: candidate.work, ...candidate.categories },
        evaluations: candidate.result.evaluations,
        leafCount: candidate.result.leaves.length,
        states: candidate.result.leaves.reduce<Record<string, number>>(
          (sum, leaf) => {
            sum[leaf.state] = (sum[leaf.state] ?? 0) + 1
            return sum
          },
          {}
        ),
        sameCompleteEvidence:
          JSON.stringify(candidate.result) === JSON.stringify(control.result),
        differences: candidate.result.leaves.flatMap((leaf, index) =>
          JSON.stringify(leaf) === JSON.stringify(control.result.leaves[index])
            ? []
            : [
                {
                  index,
                  control: control.result.leaves[index],
                  candidate: leaf
                }
              ]
        )
      })
    )
    if (segment === 114 && lastSegment === 198) {
      // Version 1.0.2 permits a different valid source-point upper. The separate
      // actual-provenance case proves this precise selected witness; keep every
      // other field and leaf exact, rather than relaxing all numerical bounds.
      const changed = control.result.leaves[6]
      expect(changed).toMatchObject({
        start: snapshot.trajectory.keyframes[117].time,
        end: snapshot.trajectory.keyframes[118].time,
        upper: 0.010611026269177653
      })
      const expected = {
        ...control.result,
        leaves: control.result.leaves.map((leaf, index) =>
          index === 6 ? { ...leaf, upper: 0.012944618198707215 } : leaf
        )
      }
      expect(candidate.result).toEqual(expected)
    } else expect(candidate.result).toEqual(control.result)
    expect(candidate.result.coverage).toBe('complete')
    expect(control.result.coverage).toBe('complete')
    expect(candidate.categories.sourceWork).toBeGreaterThan(0)
    expect(candidate.work).toBeLessThan(control.work)
  },
  20000
)

it('traces the changed prefix upper to its actual issued source enclosure and target time', async () => {
  const snapshot = await representativeSnapshot(0)
  const segment = snapshot.trajectory.keyframes.findIndex(
    (frame) => frame.time === 4.703517587939698
  )
  expect(segment).toBeGreaterThanOrEqual(0)
  const pair = snapshot.pairs.find(
    (pair) =>
      pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
  )
  if (!pair) throw new Error('Missing admitted source pair')
  const node = [
    snapshot.trajectory.keyframes[segment].time,
    snapshot.trajectory.keyframes[segment + 1].time
  ] as const
  expect(node[1]).toBe(4.743718592964824)
  const settings = {
    ...snapshot.method.settings,
    threshold: snapshot.rule.minimumClearance,
    maxIntervals: snapshot.budget.maxIntervals
  }
  const make = samplers.createFreshStaticSampler
  const records: {
    sourceTime: number
    targetTime: number
    seed: samplers.SourceUpper
    finalUpper: number
  }[] = []
  vi.spyOn(samplers, 'createFreshStaticSampler').mockImplementation(
    (threshold, tick, solve, exhausted) => {
      let previous: { handle: unknown; source: SourceWitness } | undefined
      let target:
        | {
            origin: samplers.StaticSampleOrigin
            previous: unknown
            shapes: readonly [ConvexShape, ConvexShape]
          }
        | undefined
      const sample = make(
        threshold,
        tick,
        (a, b, seed) => {
          if (seed) {
            if (!previous || !target)
              throw new Error('Missing actual source issuance')
            expect(target.previous).toBe(previous.handle)
            expect(target.shapes).toEqual([a, b])
            expect(previous.source.time).toBeLessThan(target.origin.time)
            expect(target.origin.time).toBeLessThanOrEqual(node[1])
            expect(previous.source.evidence.penetration).toBe(false)
            expect(previous.source.evidence.lower).toBeGreaterThan(0)
            expect(previous.source.evidence.upper).toBeLessThan(threshold)
            const packet = previous.handle as {
              shapes: readonly ConvexShape[]
              a: unknown
              b: unknown
            }
            packet.shapes.forEach((shape, side) => {
              expect(shape.geometry).toBe(
                previous?.source.shapes[side].geometry
              )
              expect(shape.geometry).toBe(target?.shapes[side].geometry)
            })
            expect(packet.shapes.map((shape) => shape.pose)).toEqual(
              previous.source.shapes.map((shape) => shape.pose)
            )
            expect(packet.a).toEqual(previous.source.evidence.witnessA)
            expect(packet.b).toEqual(previous.source.evidence.witnessB)
            expect(
              packet.shapes.every(
                (shape) =>
                  Object.isFrozen(shape.pose) &&
                  Object.isFrozen(shape.pose.position) &&
                  Object.isFrozen(shape.pose.rotation)
              )
            ).toBe(true)
            let oracleWork = 0
            const expected = transport(
              previous.source,
              { node, time: target.origin.time, shapes: [a, b] },
              () => oracleWork++
            )
            expect(oracleWork).toBe(6)
            expect(seed).toEqual(expected)
            const result = solve(a, b, seed)
            records.push({
              sourceTime: previous.source.time,
              targetTime: target.origin.time,
              seed,
              finalUpper: result.upper
            })
            return result
          }
          return solve(a, b, seed)
        },
        exhausted
      )
      return (a, b, origin, source) => {
        expect(origin.segment).toBe(segment)
        expect([origin.start, origin.end]).toEqual(node)
        target = { origin, previous: source, shapes: [a, b] }
        const result = sample(a, b, origin, source)
        previous =
          result?.source === undefined
            ? undefined
            : {
                handle: result.source,
                source: {
                  node,
                  time: origin.time,
                  shapes: [a, b],
                  evidence: result.evidence
                }
              }
        return result
      }
    }
  )
  const result = queryOriginalPartPair(
    {
      workcell: snapshot.workcell,
      trajectory: snapshot.trajectory,
      a: pair.a,
      b: pair.b,
      interval: node
    },
    settings
  )
  expect(result.coverage).toBe('complete')
  const selected = records.find(
    (record) => record.targetTime === result.leaves[0].witnessTime
  )
  if (!selected) throw new Error('Selected target must have an issued source')
  expect(selected.seed.upper).toBe(selected.finalUpper)
  expect(selected.finalUpper).toBe(result.leaves[0].upper)
  expect(result.leaves[0]).toMatchObject({
    upper: 0.012944618198707215,
    lower: 0,
    penetration: false,
    state: 'finding',
    witnessTime: node[1]
  })
  // eslint-disable-next-line no-console -- bounded actual provenance certificate, no product work-saving claim
  console.info(
    JSON.stringify({
      profile: 'fresh-upper-provenance',
      segment,
      records,
      selectedLeaf: result.leaves[0]
    })
  )
}, 20000)
