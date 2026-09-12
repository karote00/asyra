import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDENTITY_POSE, type Vec3 } from '../../../domain/math'
import type { Interval } from '../../../domain/interval'
import type { MeshGeometry } from '../../../domain/part-geometry'
import * as kinematics from '../../../domain/kinematic-algebra'
import * as convex from '../convex-query'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'
import { seededDistance, type SourceWitness } from './witness-transport-control'

const ops = kinematics.poseOperations(kinematics.intervalAlgebra)
function boxes(centres: readonly number[]): MeshGeometry {
  const positions: number[] = [],
    indices: number[] = []
  const vertices = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1
  ]
  const faces = [
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0,
    4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5
  ]
  centres.forEach((centre, component) => {
    positions.push(
      ...vertices.map((value, i) => value / 8 + (i % 3 === 0 ? centre : 0))
    )
    indices.push(...faces.map((index) => index + component * 8))
  })
  return Object.freeze({
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
    positions: Object.freeze(positions),
    indices: Object.freeze(indices)
  })
}
const shape = (
  geometry: MeshGeometry,
  position: Vec3 = [0, 0, 0]
): ConvexShape => ({
  geometry,
  pose: ops.fromPose({ ...IDENTITY_POSE, position })
})
function ordered(evidence: DistanceEvidence) {
  expect(Number.isFinite(evidence.lower)).toBe(true)
  expect(Number.isFinite(evidence.upper)).toBe(true)
  expect(evidence.lower).toBeGreaterThanOrEqual(0)
  expect(evidence.upper).toBeGreaterThanOrEqual(evidence.lower)
}
function status(evidence: DistanceEvidence, threshold: number) {
  if (evidence.penetration) return 'penetration'
  if (evidence.upper < threshold) return 'finding'
  if (evidence.lower > threshold) return 'clear'
  return 'uncertain'
}
// Exact binary64 comparison of a squared bound with the dyadic source gap².
function squaredGapCompare(value: number) {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0),
    exponent = Number((bits >> 52n) & 2047n)
  let n = bits & ((1n << 52n) - 1n)
  if (exponent) n += 1n << 52n
  const shift = exponent ? exponent - 1075 : -1074
  const d = shift < 0 ? 1n << BigInt(-shift) : 1n
  if (shift >= 0) n <<= BigInt(shift)
  return n * n * 1024n - d * d
}
afterEach(() => vi.restoreAllMocks())

it.each([true, false])(
  'preserves the exact closed-box source gap under an injected legal seed, hierarchy=%s',
  (hierarchy) => {
    const geometry = boxes([0]),
      node = [0, 1] as const
    const a = shape(geometry),
      oldB = shape(geometry, [3 / 8, 0, 0]),
      nextB = shape(geometry, [9 / 32, 0, 0])
    const context = new OriginalMeshQuery(() => undefined, undefined, hierarchy)
    const evidence = context.distance(a, oldB, 1 / 4, 1e-6, 64)
    expect(evidence.penetration).toBe(false)
    const source: SourceWitness = { node, time: 0, shapes: [a, oldB], evidence }
    const candidate = seededDistance(
      context,
      source,
      { node, time: 1, shapes: [a, nextB] },
      1 / 4,
      1e-6,
      64
    )
    expect(candidate.addedWork).toBe(6)
    ordered(candidate.evidence)
    expect(candidate.evidence.penetration).toBe(false)
    expect(squaredGapCompare(candidate.evidence.lower)).toBeLessThanOrEqual(0n)
    expect(squaredGapCompare(candidate.evidence.upper)).toBeGreaterThanOrEqual(
      0n
    )
    expect(Object.hasOwn(context, 'witness')).toBe(false)
  }
)
it('continues complete membership and finds penetration in the later closed component despite a valid warning seed', () => {
  const a = shape(boxes([0, 2])),
    geometry = boxes([9 / 32, 33 / 16])
  const oldB = shape(geometry, [0, 1 / 2, 0]),
    nextB = shape(geometry, [0, 1 / 32, 1 / 32])
  const node = [0, 1] as const,
    context = new OriginalMeshQuery()
  const evidence = context.distance(a, oldB, 3 / 4, 1e-6, 64)
  expect(evidence.penetration).toBe(false)
  const candidate = seededDistance(
    context,
    { node, time: 0, shapes: [a, oldB], evidence },
    { node, time: 1, shapes: [a, nextB] },
    3 / 4,
    1e-6,
    64
  )
  expect(candidate.seed.upper).toBeLessThan(3 / 4)
  expect(candidate.evidence).toMatchObject({
    penetration: true,
    lower: 0,
    upper: 0
  })
  expect(Object.hasOwn(context, 'witness')).toBe(false)
})
it('restores interception when the target exhausts after all seed operations were charged', () => {
  const geometry = boxes([0]),
    node = [0, 1] as const
  const a = shape(geometry),
    oldB = shape(geometry, [3 / 8, 0, 0]),
    nextB = shape(geometry, [9 / 32, 0, 0])
  const probe = new OriginalMeshQuery()
  probe.distance(a, oldB, 1 / 4, 1e-6, 64)
  const context = new OriginalMeshQuery(() => undefined, probe.work + 6)
  const evidence = context.distance(a, oldB, 1 / 4, 1e-6, 64)
  expect(() =>
    seededDistance(
      context,
      { node, time: 0, shapes: [a, oldB], evidence },
      { node, time: 1, shapes: [a, nextB] },
      1 / 4,
      1e-6,
      64
    )
  ).toThrow(MeshWorkLimit)
  expect(context.work).toBe(probe.work + 7)
  expect(Object.hasOwn(context, 'witness')).toBe(false)
})

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'actual two-query witness seed deltas',
  () => {
    it.each([114, 74])(
      'retains classification and penetration with explicitly permitted numerical witness differences - segment%s',
      async (segment) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (item) =>
            item.a.bodyId === 'example:joint-2' &&
            item.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing frozen source pair')
        const node = [
          snapshot.trajectory.keyframes[segment].time,
          snapshot.trajectory.keyframes[segment + 1].time
        ] as const
        const middle = node[0] + (node[1] - node[0]) / 2
        const sourceTime = segment === 114 ? node[0] : middle,
          targetTime = segment === 114 ? middle : node[1]
        const run = (enabled: boolean) => {
          vi.restoreAllMocks()
          let time: Interval | undefined,
            source: SourceWitness | undefined,
            targetEvidence: DistanceEvidence | undefined
          let targetWork = 0,
            addedWork = 0,
            beforeTarget = 0,
            targetCalls = 0,
            targetConvex = 0,
            convexCalls = 0,
            activeTarget = false
          const interpolate = kinematics.interpolateSegment
          vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
            (trajectory, segment, value, algebra) => {
              time = value as Interval
              return interpolate(trajectory, segment, value, algebra)
            }
          )
          const solve = convex.convexDistance
          vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
            convexCalls++
            if (activeTarget) targetConvex++
            return solve(...args)
          })
          const context = new OriginalMeshQuery(),
            raw = context.distance.bind(context)
          context.distance = (a, b, threshold, tolerance, iterations) => {
            if (!time || time[0] !== time[1])
              throw new Error('Missing actual static input')
            const sampleTime = time[0],
              before = context.work
            activeTarget = sampleTime === targetTime
            let evidence: DistanceEvidence
            try {
              if (activeTarget && enabled) {
                if (!source)
                  throw new Error(
                    'Source witness must be computed and paid first'
                  )
                const result = seededDistance(
                  context,
                  source,
                  { node, time: sampleTime, shapes: [a, b] },
                  threshold,
                  tolerance,
                  iterations
                )
                evidence = result.evidence
                addedWork += result.addedWork
              } else evidence = raw(a, b, threshold, tolerance, iterations)
              if (sampleTime === sourceTime)
                source = { node, time: sampleTime, shapes: [a, b], evidence }
              if (activeTarget) {
                targetCalls++
                beforeTarget = before
                targetWork = context.work - before
                targetEvidence = evidence
              }
              return evidence
            } finally {
              activeTarget = false
            }
          }
          const started = performance.now()
          const result = queryOriginalPartPair(
            {
              workcell: snapshot.workcell,
              trajectory: snapshot.trajectory,
              a: pair.a,
              b: pair.b,
              interval: node
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
          expect(targetCalls).toBe(1)
          if (!targetEvidence || !source)
            throw new Error('Missing completed target/source')
          for (const shape of source.shapes) {
            if (shape.geometry.kind !== 'mesh')
              throw new Error('Expected immutable original mesh')
            expect(Object.isFrozen(shape.geometry.positions)).toBe(true)
            expect(Object.isFrozen(shape.geometry.indices)).toBe(true)
          }
          expect(Object.hasOwn(context, 'witness')).toBe(false)
          return {
            result,
            targetEvidence,
            sourceEvidence: source.evidence,
            work: context.work,
            targetWork,
            beforeTarget,
            addedWork,
            targetConvex,
            convexCalls,
            milliseconds: performance.now() - started
          }
        }
        const control = run(false),
          candidate = run(true)
        expect(candidate.sourceEvidence).toEqual(control.sourceEvidence)
        expect(candidate.beforeTarget).toBe(control.beforeTarget)
        expect(candidate.addedWork).toBe(6)
        expect(candidate.targetWork).toBeLessThan(control.targetWork)
        expect(candidate.work).toBeLessThan(control.work)
        expect(candidate.result).toEqual(control.result)
        ordered(control.targetEvidence)
        ordered(candidate.targetEvidence)
        expect(
          status(candidate.targetEvidence, snapshot.rule.minimumClearance)
        ).toBe(status(control.targetEvidence, snapshot.rule.minimumClearance))
        expect(candidate.targetEvidence.penetration).toBe(
          control.targetEvidence.penetration
        )
        expect(
          Math.max(candidate.targetEvidence.lower, control.targetEvidence.lower)
        ).toBeLessThanOrEqual(
          Math.min(candidate.targetEvidence.upper, control.targetEvidence.upper)
        )
        expect(
          candidate.result.leaves.map(({ start, end, state, penetration }) => ({
            start,
            end,
            state,
            penetration
          }))
        ).toEqual(
          control.result.leaves.map(({ start, end, state, penetration }) => ({
            start,
            end,
            state,
            penetration
          }))
        )
        // These are explicitly new seed-path tests. Existing full-field equality
        // regressions remain unchanged; bound overlap alone is not their truth oracle.
        // eslint-disable-next-line no-console -- complete source/target costs and explicit witness differences
        console.info(
          JSON.stringify({
            profile: 'actual-witness-seed',
            segment,
            sourceTime,
            targetTime,
            control,
            candidate
          })
        )
      },
      20000
    )
  }
)
