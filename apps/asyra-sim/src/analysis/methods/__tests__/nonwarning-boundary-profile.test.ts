import { afterEach, describe, expect, it, vi } from 'vitest'
import * as kinematics from '../../../domain/kinematic-algebra'
import { IDENTITY_POSE } from '../../../domain/math'
import type { Interval } from '../../../domain/interval'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import * as convex from '../convex-query'
import { localPoint } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

const ops = kinematics.poseOperations(kinematics.intervalAlgebra)
const copyInterval = (v: Interval): Interval => Object.freeze([v[0], v[1]])
const copyShape = (shape: ConvexShape): ConvexShape =>
  Object.freeze({
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
interface Packet {
  shapes: readonly [ConvexShape, ConvexShape]
  a: DistanceEvidence['witnessA']
  b: DistanceEvidence['witnessB']
  upper: number
}
function transport(
  packet: Packet,
  a: ConvexShape,
  b: ConvexShape,
  tick: () => void
) {
  tick()
  if (
    packet.shapes[0].geometry !== a.geometry ||
    packet.shapes[1].geometry !== b.geometry
  )
    throw new Error('Changed ordered geometry')
  tick()
  const la = localPoint(packet.shapes[0].pose, packet.a)
  tick()
  const lb = localPoint(packet.shapes[1].pose, packet.b)
  tick()
  const wa = ops.add(a.pose.position, ops.rotate(a.pose.rotation, la))
  tick()
  const wb = ops.add(b.pose.position, ops.rotate(b.pose.rotation, lb))
  tick()
  const upper = ops.norm(ops.sub(wa, wb))[1]
  return { a: wa, b: wb, upper }
}
afterEach(() => vi.restoreAllMocks())
it.each([1 / 8, 1 / 16])(
  'retains exact source points when nonwarning upper %s transports below threshold',
  (gap) => {
    const geometry = {
      kind: 'box' as const,
      size: [1 / 4, 1 / 4, 1 / 4] as const
    }
    const shape = (x: number): ConvexShape => ({
      geometry,
      pose: ops.fromPose({ ...IDENTITY_POSE, position: [x, 0, 0] })
    })
    const a = shape(0),
      oldB = shape(1 / 4 + gap),
      nextB = shape(9 / 32)
    const packet: Packet = {
      shapes: [a, oldB],
      a: [
        [1 / 8, 1 / 8],
        [0, 0],
        [0, 0]
      ],
      b: [
        [1 / 8 + gap, 1 / 8 + gap],
        [0, 0],
        [0, 0]
      ],
      upper: gap
    }
    let work = 0
    const result = transport(packet, a, nextB, () => {
      work++
    })
    expect(packet.upper).toBeGreaterThanOrEqual(1 / 16)
    expect(work).toBe(6)
    expect(result.a[0][0]).toBeLessThanOrEqual(1 / 8)
    expect(result.a[0][1]).toBeGreaterThanOrEqual(1 / 8)
    expect(result.b[0][0]).toBeLessThanOrEqual(5 / 32)
    expect(result.b[0][1]).toBeGreaterThanOrEqual(5 / 32)
    expect(result.upper).toBeGreaterThanOrEqual(1 / 32)
    expect(result.upper).toBeLessThan(1 / 16)
  }
)

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'missed nonwarning boundaries',
  () => {
    it('measures the entire fixed complete prefix without injecting any source', async () => {
      const snapshot = await representativeSnapshot(0),
        frames = snapshot.trajectory.keyframes
      const pair = snapshot.pairs.find(
        (p) => p.a.bodyId === 'example:joint-2' && p.b.bodyId === 'obstacle-11'
      )
      if (!pair) throw new Error('Missing original pair')
      const threshold = snapshot.rule.minimumClearance
      const context = new OriginalMeshQuery()
      const overhead = { capture: 0, publication: 0, transport: 0 }
      const charge = (kind: keyof typeof overhead) => {
        const before = context.work
        try {
          context.chargeSourceWitness()
        } finally {
          overhead[kind] += context.work - before
        }
      }
      interface Root {
        node: object
        segment: number
        start: number
        end: number
        packet?: Packet
        clear: boolean
        finding: boolean
        penetration: boolean
        child: boolean
      }
      interface Row {
        segment: number
        target: number
        sourceUpper: number
        upper: number
        targetWork: number
        firstWarningWork?: number
        targetUpper?: number
        targetPenetration?: boolean
        convex: number
      }
      let root: Root | undefined,
        span: Interval | undefined,
        active: Row | undefined,
        targetBefore = 0
      let attempted = 0,
        discarded = 0
      const rows: Row[] = []
      const interpolate = kinematics.interpolateSegment
      vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
        (...args) => {
          if (!Array.isArray(args[2]))
            throw new Error('Expected interval input')
          span = [args[2][0], args[2][1]]
          return interpolate(...args)
        }
      )
      const lower = context.lowerOver.bind(context)
      context.lowerOver = (...args) => {
        const actual = span && [...span]
        const value = lower(...args)
        if (
          root &&
          actual?.[0] === root.start &&
          actual[1] === root.end &&
          value > threshold
        )
          root.clear = true
        return value
      }
      const solve = convex.convexDistance
      vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
        const value = solve(...args)
        if (active) {
          active.convex++
          if (active.firstWarningWork === undefined && value.upper < threshold)
            active.firstWarningWork = context.work - targetBefore
        }
        return value
      })
      const initial = context as unknown as {
        witness(...args: unknown[]): DistanceEvidence['witnessA']
      }
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        initial,
        'witness'
      )
      const witness = initial.witness.bind(context)
      let points: DistanceEvidence['witnessA'][] = []
      initial.witness = (...args) => {
        const value = witness(...args)
        if (active) {
          points.push(value)
          if (
            points.length === 2 &&
            ops.norm(ops.sub(points[0], points[1]))[1] < threshold
          )
            active.firstWarningWork = context.work - targetBefore
        }
        return value
      }
      const make = context.createStaticSampler.bind(context)
      context.createStaticSampler = (settings) => {
        const sample = make(settings)
        const observe: typeof sample = (a, b, origin, source) => {
          let row: Row | undefined
          const first =
            origin.originalRoot === true && origin.time === origin.start
          if (first) {
            if (root?.packet) {
              if (
                !root.child &&
                !root.penetration &&
                (root.clear || root.finding) &&
                root.segment === origin.segment + 1 &&
                root.start === origin.end
              ) {
                charge('publication')
                expect(origin.time).toBeLessThan(root.start)
                const moved = transport(root.packet, a, b, () =>
                  charge('transport')
                )
                expect(Number.isFinite(moved.upper)).toBe(true)
                row = {
                  segment: root.segment,
                  target: origin.segment,
                  sourceUpper: root.packet.upper,
                  upper: moved.upper,
                  targetWork: 0,
                  convex: 0
                }
                rows.push(row)
                active = row
                points = []
                targetBefore = context.work
              } else discarded++
            }
            root = {
              node: origin.node,
              segment: origin.segment,
              start: origin.start,
              end: origin.end,
              clear: false,
              finding: false,
              penetration: false,
              child: false
            }
          } else if (root && origin.node !== root.node) root.child = true
          const before = context.work
          const result = sample(a, b, origin, source)
          if (row) {
            row.targetWork = context.work - before
            row.targetUpper = result?.evidence.upper
            row.targetPenetration = result?.evidence.penetration
            active = undefined
          }
          if (root && origin.node === root.node && result) {
            root.penetration ||= result.evidence.penetration
            root.finding ||= result.evidence.upper < threshold
            const e = result.evidence
            if (
              first &&
              !result.exhausted &&
              !e.penetration &&
              Number.isFinite(e.lower) &&
              Number.isFinite(e.upper) &&
              e.lower > 0 &&
              e.lower <= e.upper &&
              e.upper >= threshold
            ) {
              attempted++
              for (const shape of [a, b]) {
                expect(shape.geometry.kind).toBe('mesh')
                if (shape.geometry.kind !== 'mesh')
                  throw new Error('Expected full mesh')
                expect(
                  Object.isFrozen(shape.geometry) &&
                    Object.isFrozen(shape.geometry.positions) &&
                    Object.isFrozen(shape.geometry.indices)
                ).toBe(true)
              }
              expect(
                [
                  ...e.witnessA,
                  ...e.witnessB,
                  ...a.pose.position,
                  ...a.pose.rotation,
                  ...b.pose.position,
                  ...b.pose.rotation
                ].every(
                  (v) =>
                    Number.isFinite(v[0]) &&
                    Number.isFinite(v[1]) &&
                    v[0] <= v[1]
                )
              ).toBe(true)
              charge('capture')
              root.packet = {
                shapes: Object.freeze([copyShape(a), copyShape(b)]),
                a: Object.freeze(
                  e.witnessA.map(copyInterval)
                ) as DistanceEvidence['witnessA'],
                b: Object.freeze(
                  e.witnessB.map(copyInterval)
                ) as DistanceEvidence['witnessB'],
                upper: e.upper
              }
            }
          }
          return result
        }
        observe.publishBoundary = sample.publishBoundary
        return observe
      }
      let result: ReturnType<typeof queryOriginalPartPair>
      try {
        result = queryOriginalPartPair(
          {
            workcell: snapshot.workcell,
            trajectory: snapshot.trajectory,
            a: pair.a,
            b: pair.b,
            interval: [frames[114].time, frames[199].time]
          },
          {
            ...snapshot.method.settings,
            threshold,
            maxIntervals: snapshot.budget.maxIntervals
          },
          () => undefined,
          context
        )
      } finally {
        if (originalDescriptor)
          Object.defineProperty(initial, 'witness', originalDescriptor)
        else Reflect.deleteProperty(initial, 'witness')
      }
      if (root?.packet) discarded++
      const additional = Object.values(overhead).reduce((a, b) => a + b, 0)
      expect(result.coverage).toBe('complete')
      expect(result.evaluations).toBe(95)
      expect(result.leaves).toHaveLength(90)
      expect(context.work - additional).toBe(197028)
      expect(overhead.capture).toBe(attempted)
      expect(overhead.publication).toBe(rows.length)
      expect(overhead.transport).toBe(rows.length * 6)
      expect(attempted).toBe(rows.length + discarded)
      for (const row of rows) {
        const leaf = result.leaves.find(
          (leaf) =>
            leaf.start === frames[row.segment].time &&
            leaf.end === frames[row.segment + 1].time
        )
        expect(leaf).toBeDefined()
        expect(leaf?.state === 'clear' || leaf?.state === 'finding').toBe(true)
        expect(leaf?.penetration).toBe(false)
        expect(row.target).toBe(row.segment - 1)
      }
      const warnings = rows.filter((row) => row.upper < threshold)
      const potential = warnings.reduce(
        (sum, row) => sum + (row.firstWarningWork ?? row.targetWork),
        0
      )
      // eslint-disable-next-line no-console -- fixed-prefix passive opportunity, not savings or production output
      console.info(
        JSON.stringify({
          profile: 'nonwarning-boundary',
          attempted,
          published: rows.length,
          discarded,
          warningSeeds: warnings.length,
          unsuccessful: rows.length - warnings.length,
          overhead,
          additional,
          originalWork: context.work - additional,
          totalWork: context.work,
          potentialBeforeWarningUpperLimit: potential,
          netPotentialUpperLimit: potential - additional,
          largestOpportunities: [...warnings]
            .sort((a, b) => b.targetWork - a.targetWork)
            .slice(0, 6),
          largestUnsuccessful: [...rows]
            .filter((row) => row.upper >= threshold)
            .sort((a, b) => b.targetWork - a.targetWork)
            .slice(0, 3)
        })
      )
    }, 20000)
  }
)
