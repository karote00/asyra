import { afterEach, describe, expect, it, vi } from 'vitest'
import * as kinematics from '../../../domain/kinematic-algebra'
import { IDENTITY_POSE } from '../../../domain/math'
import type { Interval } from '../../../domain/interval'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import * as convex from '../convex-query'
import * as projection from '../mesh-projection'
import * as membership from '../mesh-membership'
import { localPoint } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'
import { withSourceWitness } from './witness-transport-control'

// Historical pre-boundary source policy (bf510dd43), replayed with the new
// boundary publication disabled. Current production work has its own formal file.
function historicalContext(): OriginalMeshQuery {
  const context = new OriginalMeshQuery()
  const make = context.createStaticSampler.bind(context)
  context.createStaticSampler = (settings) => {
    const sample = make(settings)
    return (a, b, origin, source) => sample(a, b, origin, source)
  }
  return context
}

const ops = kinematics.poseOperations(kinematics.intervalAlgebra)
interface Packet {
  shapes: readonly [ConvexShape, ConvexShape]
  evidence: DistanceEvidence
  segment: number
  time: number
  boundary: number
}
const copyInterval = (value: Interval): Interval =>
  Object.freeze([value[0], value[1]])
function copyShape(shape: ConvexShape): ConvexShape {
  return Object.freeze({
    geometry: shape.geometry,
    pose: Object.freeze({
      position: Object.freeze(
        shape.pose.position.map(copyInterval)
      ) as ConvexShape['pose']['position'],
      rotation: Object.freeze(
        shape.pose.rotation.map(copyInterval)
      ) as ConvexShape['pose']['rotation']
    })
  })
}
function transportBackward(
  source: Packet,
  target: {
    shapes: readonly [ConvexShape, ConvexShape]
    segment: number
    time: number
    boundary: number
  },
  tick: () => void
) {
  tick()
  if (
    source.segment !== target.segment + 1 ||
    source.boundary !== target.boundary ||
    source.time !== source.boundary ||
    target.time >= source.time ||
    source.evidence.penetration ||
    source.shapes.some(
      (shape, side) => shape.geometry !== target.shapes[side].geometry
    )
  )
    throw new Error('Invalid adjacent source provenance')
  tick()
  const a = localPoint(source.shapes[0].pose, source.evidence.witnessA)
  tick()
  const b = localPoint(source.shapes[1].pose, source.evidence.witnessB)
  tick()
  const wa = ops.add(
    target.shapes[0].pose.position,
    ops.rotate(target.shapes[0].pose.rotation, a)
  )
  tick()
  const wb = ops.add(
    target.shapes[1].pose.position,
    ops.rotate(target.shapes[1].pose.rotation, b)
  )
  tick()
  return { a: wa, b: wb, upper: ops.norm(ops.sub(wa, wb))[1] }
}
afterEach(() => vi.restoreAllMocks())

it('encloses exact source vertices and their rational squared distance while transporting backward in time', () => {
  // A cube corner (1/8,1/8,1/8) under exact quarter-turn then translation.
  const geometry = {
    kind: 'box' as const,
    size: [1 / 4, 1 / 4, 1 / 4] as const
  }
  const shape = (
    position: readonly [number, number, number],
    rotation: readonly [number, number, number, number] = [0, 0, 0, 1]
  ): ConvexShape => ({
    geometry,
    pose: ops.fromPose({ ...IDENTITY_POSE, position, rotation })
  })
  const source: Packet = {
    segment: 1,
    time: 1,
    boundary: 1,
    shapes: [
      shape([1 / 2, 0, 0], [0, 0, 1, 1]),
      shape([-1 / 8, -1 / 8, -1 / 8])
    ],
    evidence: {
      lower: 0,
      upper: 1,
      penetration: false,
      converged: false,
      iterations: 1,
      axis: [1, 0, 0],
      witnessA: [
        [3 / 8, 3 / 8],
        [1 / 8, 1 / 8],
        [1 / 8, 1 / 8]
      ],
      witnessB: [
        [0, 0],
        [0, 0],
        [0, 0]
      ]
    }
  }
  let work = 0
  const result = transportBackward(
    source,
    {
      segment: 0,
      time: 0,
      boundary: 1,
      shapes: [shape([0, 0, 0]), shape([-1 / 8, -1 / 8, -1 / 8])]
    },
    () => work++
  )
  expect(work).toBe(6)
  result.a.forEach((axis) => {
    expect(axis[0]).toBeLessThanOrEqual(1 / 8)
    expect(axis[1]).toBeGreaterThanOrEqual(1 / 8)
  })
  result.b.forEach((axis) => {
    expect(axis[0]).toBeLessThanOrEqual(0)
    expect(axis[1]).toBeGreaterThanOrEqual(0)
  })
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, result.upper)
  const bits = view.getBigUint64(0),
    exponent = Number((bits >> 52n) & 2047n)
  let n = bits & ((1n << 52n) - 1n)
  if (exponent) n += 1n << 52n
  const shift = exponent ? exponent - 1075 : -1074,
    d = shift < 0 ? 1n << BigInt(-shift) : 1n
  if (shift >= 0) n <<= BigInt(shift)
  expect(n * n * 64n).toBeGreaterThanOrEqual(d * d * 3n)
})

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'single adjacent original boundary',
  () => {
    it('measures completed segment 114 start as a reverse-time upper source for 113 start without injecting it', async () => {
      const snapshot = await representativeSnapshot(0)
      const pair = snapshot.pairs.find(
        (pair) =>
          pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
      )
      if (!pair) throw new Error('Missing admitted pair')
      const sourceTime = snapshot.trajectory.keyframes[114].time,
        targetTime = snapshot.trajectory.keyframes[113].time
      const context = historicalContext()
      let segment = -1,
        time: Interval | undefined,
        packet: Packet | undefined,
        addedWork = 0
      let targetWork = 0,
        firstWarningWork: number | undefined,
        targetBefore = 0,
        inTarget = false
      let targetAxes = 0,
        targetMembership = 0,
        targetConvex = 0
      let initialPoints: DistanceEvidence['witnessA'][] = []
      const initialOwner = context as unknown as {
        witness(...args: unknown[]): DistanceEvidence['witnessA']
      }
      const witness = initialOwner.witness.bind(context)
      initialOwner.witness = (...args) => {
        const result = witness(...args)
        if (inTarget) {
          initialPoints.push(result)
          if (
            initialPoints.length === 2 &&
            ops.norm(ops.sub(initialPoints[0], initialPoints[1]))[1] <
              snapshot.rule.minimumClearance
          )
            firstWarningWork = context.work - targetBefore
        }
        return result
      }
      const project = projection.projectedBoundsGap
      vi.spyOn(projection, 'projectedBoundsGap').mockImplementation(
        (a, ap, b, bp, threshold, checkpoint) =>
          project(a, ap, b, bp, threshold, () => {
            if (inTarget) targetAxes++
            checkpoint()
          })
      )
      const contains = membership.shapeMembership
      vi.spyOn(membership, 'shapeMembership').mockImplementation(
        (point, shape, index, checkpoint) =>
          contains(point, shape, index, () => {
            if (inTarget) targetMembership++
            checkpoint()
          })
      )
      let targetResult: DistanceEvidence | undefined,
        transported: ReturnType<typeof transportBackward> | undefined
      const order: { segment: number; time: number }[] = []
      const interpolate = kinematics.interpolateSegment
      vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
        (...args) => {
          segment = args[1]
          if (!Array.isArray(args[2]))
            throw new Error('Expected actual interval input')
          time = [args[2][0], args[2][1]]
          return interpolate(...args)
        }
      )
      const tick = () => {
        const before = context.work
        try {
          context.chargeSourceWitness()
        } finally {
          addedWork += context.work - before
        }
      }
      const solve = convex.convexDistance
      vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
        const result = solve(...args)
        if (inTarget) targetConvex++
        if (
          inTarget &&
          firstWarningWork === undefined &&
          result.upper < snapshot.rule.minimumClearance
        )
          firstWarningWork = context.work - targetBefore
        return result
      })
      const distance = context.distance.bind(context)
      context.distance = (a, b, threshold, tolerance, iterations) => {
        if (!time || time[0] !== time[1])
          throw new Error('Expected actual static query')
        const actualTime = time[0],
          actualSegment = segment
        order.push({ segment: actualSegment, time: actualTime })
        const isTarget = actualSegment === 113 && actualTime === targetTime
        if (isTarget) {
          if (
            !packet ||
            order[0].segment !== 114 ||
            order[0].time !== sourceTime
          )
            throw new Error('Missing completed earlier segment source')
          transported = transportBackward(
            packet,
            {
              shapes: [a, b],
              segment: actualSegment,
              time: actualTime,
              boundary: sourceTime
            },
            tick
          )
          targetBefore = context.work
          initialPoints = []
          inTarget = true
        }
        let result: DistanceEvidence
        try {
          result = distance(a, b, threshold, tolerance, iterations)
        } finally {
          if (isTarget) {
            targetWork = context.work - targetBefore
            inTarget = false
          }
        }
        if (actualSegment === 114 && actualTime === sourceTime) {
          expect(result.penetration).toBe(false)
          expect(result.lower).toBeGreaterThan(0)
          expect(Number.isFinite(result.lower)).toBe(true)
          expect(result.lower).toBeLessThanOrEqual(result.upper)
          expect(Number.isFinite(result.upper)).toBe(true)
          expect(result.upper).toBeLessThan(threshold)
          for (const shape of [a, b]) {
            expect(shape.geometry.kind).toBe('mesh')
            if (shape.geometry.kind !== 'mesh')
              throw new Error('Expected original mesh')
            expect(
              Object.isFrozen(shape.geometry) &&
                Object.isFrozen(shape.geometry.positions) &&
                Object.isFrozen(shape.geometry.indices)
            ).toBe(true)
          }
          tick()
          packet = Object.freeze({
            segment: actualSegment,
            time: actualTime,
            boundary: sourceTime,
            shapes: Object.freeze([
              copyShape(a),
              copyShape(b)
            ]) as Packet['shapes'],
            evidence: Object.freeze({
              ...result,
              witnessA: Object.freeze(
                result.witnessA.map(copyInterval)
              ) as DistanceEvidence['witnessA'],
              witnessB: Object.freeze(
                result.witnessB.map(copyInterval)
              ) as DistanceEvidence['witnessB']
            })
          })
        }
        if (isTarget) targetResult = result
        return result
      }
      const result = queryOriginalPartPair(
        {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: pair.a,
          b: pair.b,
          interval: [targetTime, snapshot.trajectory.keyframes[115].time]
        },
        {
          ...snapshot.method.settings,
          threshold: snapshot.rule.minimumClearance,
          maxIntervals: snapshot.budget.maxIntervals
        },
        () => undefined,
        context
      )
      expect(result.coverage).toBe('complete')
      const sourceLeaves = result.leaves.filter(
        (leaf) => leaf.start >= sourceTime
      )
      expect(sourceLeaves.length).toBeGreaterThan(0)
      expect(sourceLeaves.every((leaf) => leaf.state !== 'unresolved')).toBe(
        true
      )
      expect(sourceLeaves[sourceLeaves.length - 1].end).toBe(
        snapshot.trajectory.keyframes[115].time
      )
      const firstTarget = order.findIndex((row) => row.segment === 113)
      expect(firstTarget).toBeGreaterThan(0)
      expect(order.slice(firstTarget).every((row) => row.segment === 113)).toBe(
        true
      )
      expect(addedWork).toBe(7)
      expect(context.work).toBeLessThanOrEqual(500000)
      if (!packet || !targetResult || !transported)
        throw new Error('Missing actual boundary evidence')
      // eslint-disable-next-line no-console -- passive upper eligibility and cost limit, never an actual saving
      console.info(
        JSON.stringify({
          profile: 'adjacent-upper-passive',
          sourceTime,
          targetTime,
          sourceUpper: packet.evidence.upper,
          transportedUpper: transported.upper,
          eligibleWarningUpper:
            transported.upper < snapshot.rule.minimumClearance,
          targetWork,
          targetAxes,
          targetMembership,
          targetConvex,
          firstWarningWork: firstWarningWork ?? null,
          target: {
            lower: targetResult.lower,
            upper: targetResult.upper,
            penetration: targetResult.penetration
          },
          addedWork,
          originalWork: context.work - addedWork,
          totalWork: context.work,
          evaluations: result.evaluations,
          coverage: result.coverage
        })
      )
    }, 20000)
  }
)

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'single adjacent actual delta',
  () => {
    it('keeps emitted non-upper evidence exact while measuring one proven boundary seed', async () => {
      const snapshot = await representativeSnapshot(0)
      const pair = snapshot.pairs.find(
        (pair) =>
          pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
      )
      if (!pair) throw new Error('Missing admitted pair')
      const sourceTime = snapshot.trajectory.keyframes[114].time,
        targetTime = snapshot.trajectory.keyframes[113].time
      const run = (enabled: boolean) => {
        vi.restoreAllMocks()
        const context = historicalContext()
        let segment = -1,
          time: Interval | undefined,
          packet: Packet | undefined
        let addedWork = 0,
          distanceWork = 0,
          lowerWork = 0,
          sourceWork = 0,
          handoffWork = 0,
          derivationWork = 0
        let targetWork = 0,
          targetConvex = 0,
          inTarget = false
        let transported: ReturnType<typeof transportBackward> | undefined
        const samples: {
          segment: number
          time: number
          evidence: DistanceEvidence
        }[] = []
        const interpolate = kinematics.interpolateSegment
        vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
          (...args) => {
            segment = args[1]
            if (!Array.isArray(args[2]))
              throw new Error('Expected actual interval input')
            time = [args[2][0], args[2][1]]
            return interpolate(...args)
          }
        )
        const solve = convex.convexDistance
        vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
          if (inTarget) targetConvex++
          return solve(...args)
        })
        for (const [key, add] of [
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
              add(context.work - before)
            }
          }
        }
        const tick = () => {
          const before = context.work
          try {
            context.chargeSourceWitness()
          } finally {
            addedWork += context.work - before
          }
        }
        const lower = context.lowerOver.bind(context)
        context.lowerOver = (...args) => {
          const before = context.work
          try {
            return lower(...args)
          } finally {
            lowerWork += context.work - before
          }
        }
        const distance = context.distance.bind(context)
        context.distance = (a, b, threshold, tolerance, iterations) => {
          if (!time || time[0] !== time[1])
            throw new Error('Expected actual static query')
          const at = time[0],
            index = segment,
            isTarget = index === 113 && at === targetTime
          const beforeTransport = context.work
          if (enabled && isTarget) {
            if (!packet) throw new Error('Expected actual completed source')
            transported = transportBackward(
              packet,
              {
                shapes: [a, b],
                segment: index,
                time: at,
                boundary: sourceTime
              },
              tick
            )
          }
          const before = context.work
          inTarget = isTarget
          let evidence: DistanceEvidence
          try {
            evidence =
              enabled && isTarget && transported
                ? withSourceWitness(context, [a, b], transported, () =>
                    distance(a, b, threshold, tolerance, iterations)
                  )
                : distance(a, b, threshold, tolerance, iterations)
          } finally {
            distanceWork += context.work - before
            if (isTarget) targetWork = context.work - beforeTransport
            inTarget = false
          }
          samples.push({ segment: index, time: at, evidence })
          if (enabled && index === 114 && at === sourceTime) {
            expect(evidence.penetration).toBe(false)
            expect(evidence.lower).toBeGreaterThan(0)
            expect(evidence.lower).toBeLessThanOrEqual(evidence.upper)
            expect(evidence.upper).toBeLessThan(threshold)
            expect(
              Number.isFinite(evidence.lower) && Number.isFinite(evidence.upper)
            ).toBe(true)
            for (const shape of [a, b]) {
              if (shape.geometry.kind !== 'mesh')
                throw new Error('Expected original source mesh')
              expect(
                Object.isFrozen(shape.geometry) &&
                  Object.isFrozen(shape.geometry.positions) &&
                  Object.isFrozen(shape.geometry.indices)
              ).toBe(true)
            }
            tick()
            packet = Object.freeze({
              segment: index,
              time: at,
              boundary: sourceTime,
              shapes: Object.freeze([
                copyShape(a),
                copyShape(b)
              ]) as Packet['shapes'],
              evidence: Object.freeze({
                ...evidence,
                witnessA: Object.freeze(
                  evidence.witnessA.map(copyInterval)
                ) as DistanceEvidence['witnessA'],
                witnessB: Object.freeze(
                  evidence.witnessB.map(copyInterval)
                ) as DistanceEvidence['witnessB']
              })
            })
          }
          return evidence
        }
        const started = performance.now()
        const evidence = queryOriginalPartPair(
          {
            workcell: snapshot.workcell,
            trajectory: snapshot.trajectory,
            a: pair.a,
            b: pair.b,
            interval: [targetTime, snapshot.trajectory.keyframes[115].time]
          },
          {
            ...snapshot.method.settings,
            threshold: snapshot.rule.minimumClearance,
            maxIntervals: snapshot.budget.maxIntervals
          },
          () => undefined,
          context
        )
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
        expect(Object.hasOwn(context, 'witness')).toBe(false)
        return {
          evidence,
          samples,
          targetWork,
          targetConvex,
          totalWork: context.work,
          addedWork,
          categories,
          transported,
          milliseconds: performance.now() - started
        }
      }
      const control = run(false),
        candidate = run(true)
      const differences = candidate.samples.flatMap((sample, index) => {
        const baseline = control.samples[index]
        if (JSON.stringify(sample) === JSON.stringify(baseline)) return []
        return [
          {
            segment: sample.segment,
            time: sample.time,
            fields: Object.keys(sample.evidence).filter(
              (key) =>
                JSON.stringify(
                  sample.evidence[key as keyof DistanceEvidence]
                ) !==
                JSON.stringify(baseline.evidence[key as keyof DistanceEvidence])
            ),
            control: baseline.evidence,
            candidate: sample.evidence
          }
        ]
      })
      // eslint-disable-next-line no-console -- one bounded actual delta, including failed strict observables
      console.info(
        JSON.stringify({
          profile: 'adjacent-upper-delta',
          control: { ...control, samples: undefined },
          candidate: { ...candidate, samples: undefined },
          differences
        })
      )
      expect(control.evidence.coverage).toBe('complete')
      expect(candidate.evidence.coverage).toBe('complete')
      expect(candidate.addedWork).toBe(7)
      expect(candidate.targetWork).toBeLessThanOrEqual(control.targetWork * 0.8)
      expect(candidate.totalWork).toBeLessThan(control.totalWork)
      expect(candidate.targetConvex).toBeLessThanOrEqual(control.targetConvex)
      expect(
        candidate.samples.filter((sample) => sample.segment === 114)
      ).toEqual(control.samples.filter((sample) => sample.segment === 114))
      expect(
        candidate.evidence.leaves.filter((leaf) => leaf.start >= sourceTime)
      ).toEqual(
        control.evidence.leaves.filter((leaf) => leaf.start >= sourceTime)
      )
      const target = candidate.samples.find(
        (sample) => sample.segment === 113 && sample.time === targetTime
      )
      const baselineTarget = control.samples.find(
        (sample) => sample.segment === 113 && sample.time === targetTime
      )
      if (!target || !baselineTarget || !candidate.transported)
        throw new Error('Missing injected target')
      // The original solver may improve the certified initial source upper.
      expect(target.evidence.upper).toBeLessThan(candidate.transported.upper)
      expect(target.evidence.witnessA).toEqual(baselineTarget.evidence.witnessA)
      expect(target.evidence.witnessB).toEqual(baselineTarget.evidence.witnessB)
      expect(target.evidence.upper).toBe(baselineTarget.evidence.upper)
      expect(target.evidence.lower).toBeGreaterThanOrEqual(0)
      expect(target.evidence.lower).toBeLessThanOrEqual(
        baselineTarget.evidence.lower
      )
      expect({
        ...target.evidence,
        lower: baselineTarget.evidence.lower
      }).toEqual(baselineTarget.evidence)
      expect(
        candidate.samples.filter((sample) => sample.time !== targetTime)
      ).toEqual(control.samples.filter((sample) => sample.time !== targetTime))
      expect(candidate.evidence).toEqual(control.evidence)
    }, 20000)
  }
)
