import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDENTITY_POSE, type Vec3 } from '../../../domain/math'
import { interval, type Interval } from '../../../domain/interval'
import * as kinematics from '../../../domain/kinematic-algebra'
import { EXPERIMENT_RESOURCE_PROFILE } from '../../contracts'
import * as convex from '../convex-query'
import type { DistanceEvidence } from '../convex-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import * as continuous from '../continuous-query'
import { representativeSnapshot } from './representative-fixture'
import { transport, type SourceWitness } from './witness-transport-control'

const ops = kinematics.poseOperations(kinematics.intervalAlgebra)
// Independent exact binary64-to-rational comparison, no production interval
// arithmetic in the expected normalized-rotation coordinates or squared norm.
function rational(value: number): readonly [bigint, bigint] {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0),
    exponent = Number((bits >> 52n) & 2047n)
  let numerator = bits & ((1n << 52n) - 1n)
  if (exponent) numerator += 1n << 52n
  if (bits >> 63n) numerator = -numerator
  const shift = exponent ? exponent - 1075 : -1074
  return shift >= 0
    ? [numerator << BigInt(shift), 1n]
    : [numerator, 1n << BigInt(-shift)]
}
function compare(value: number, numerator: bigint, denominator: bigint) {
  const [a, b] = rational(value)
  return a * denominator - numerator * b
}
function oracleInput(rotation: readonly [number, number, number, number]) {
  const point: Vec3 = [3 / 8, 1 / 4, -1 / 8]
  const geometry = Object.freeze({
    kind: 'triangle' as const,
    vertices: [point, [1, 0, 0], [0, 1, 0]] as const
  })
  const fixed = Object.freeze({
    kind: 'triangle' as const,
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0]
    ] as const
  })
  const node = [0, 1] as const
  const evidence: DistanceEvidence = {
    lower: 0,
    upper: 1,
    penetration: false,
    converged: false,
    iterations: 1,
    axis: [1, 0, 0],
    // Asymmetric widening ensures taking the midpoint loses the actual point.
    witnessA: [
      [7 / 8, 7 / 8 + 1 / 64],
      [0, 1 / 64],
      [0, 1 / 64]
    ],
    witnessB: [interval(0), interval(0), interval(0)]
  }
  const source: SourceWitness = {
    node,
    time: 0,
    evidence,
    shapes: [
      {
        geometry,
        pose: ops.fromPose({
          position: [1 / 2, -1 / 4, 1 / 8],
          rotation: [0, 0, 0, 1]
        })
      },
      { geometry: fixed, pose: ops.fromPose(IDENTITY_POSE) }
    ]
  }
  const target: SourceWitness = {
    ...source,
    time: 1,
    shapes: [
      {
        geometry,
        pose: ops.fromPose({ position: [-1 / 2, 1 / 8, 1 / 4], rotation })
      },
      source.shapes[1]
    ]
  }
  return { source, target }
}
afterEach(() => vi.restoreAllMocks())

it.each([
  {
    rotation: [0, 0, 1, 1] as const,
    point: [
      [-3n, 4n],
      [1n, 2n],
      [1n, 8n]
    ],
    squared: [53n, 64n]
  },
  {
    rotation: [0, 0, 3, 4] as const,
    point: [
      [-127n, 200n],
      [111n, 200n],
      [1n, 8n]
    ],
    squared: [1163n, 1600n]
  }
])(
  'encloses independent source coordinates and their exact squared separation under rotation $rotation',
  ({ rotation, point, squared }) => {
    const { source, target } = oracleInput(rotation)
    let work = 0
    const result = transport(source, target, () => work++)
    expect(result).toBeDefined()
    if (!result) throw new Error('Missing eligible transport')
    expect(work).toBe(6)
    point.forEach(([n, d], axis) => {
      expect(compare(result.a[axis][0], n, d)).toBeLessThanOrEqual(0n)
      expect(compare(result.a[axis][1], n, d)).toBeGreaterThanOrEqual(0n)
      expect(result.b[axis][0]).toBeLessThanOrEqual(0)
      expect(result.b[axis][1]).toBeGreaterThanOrEqual(0)
    })
    const [n, d] = rational(result.upper)
    expect(n * n * squared[1] - squared[0] * d * d).toBeGreaterThanOrEqual(0n)
  }
)
it('rejects invalid provenance after one charge and propagates cancellation before transport output', () => {
  const { source, target } = oracleInput([0, 0, 3, 4])
  for (const rejected of [
    { ...source, node: [0, 1] as const },
    { ...source, time: 2 },
    { ...source, evidence: { ...source.evidence, penetration: true } },
    { ...source, shapes: [source.shapes[1], source.shapes[0]] as const }
  ]) {
    let work = 0
    expect(transport(rejected, target, () => work++)).toBeUndefined()
    expect(work).toBe(1)
  }
  let work = 0
  expect(() =>
    transport(source, target, () => {
      if (++work === 4) throw new Error('cancelled before forward transform')
    })
  ).toThrow('cancelled before forward transform')
  expect(work).toBe(4)
})

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'passive neighboring source witness transport',
  () => {
    it.each([114, 74])(
      'measures the frozen ordinary sample pair in original segment %s',
      async (segment) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (item) =>
            item.a.bodyId === 'example:joint-2' &&
            item.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing original source pair')
        const node = [
          snapshot.trajectory.keyframes[segment].time,
          snapshot.trajectory.keyframes[segment + 1].time
        ] as const
        const middle = node[0] + (node[1] - node[0]) / 2
        let time: Interval | undefined
        const interpolate = kinematics.interpolateSegment
        vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
          (trajectory, segment, value, algebra) => {
            time = value as Interval
            return interpolate(trajectory, segment, value, algebra)
          }
        )
        const context = new OriginalMeshQuery()
        const rows: (SourceWitness & {
          work: number
          firstWarningWork?: number
        })[] = []
        let current: { before: number; firstWarningWork?: number } | undefined
        const solve = convex.convexDistance
        vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
          const result = solve(...args)
          if (
            current &&
            current.firstWarningWork === undefined &&
            result.upper < snapshot.rule.minimumClearance
          )
            current.firstWarningWork = context.work - current.before
          return result
        })
        const distance = context.distance.bind(context)
        context.distance = (a, b, ...args) => {
          if (!time || time[0] !== time[1])
            throw new Error('Missing actual static time')
          const inputTime = time[0]
          current = { before: context.work }
          try {
            const evidence = distance(a, b, ...args)
            rows.push({
              node,
              time: inputTime,
              shapes: [a, b],
              evidence,
              work: context.work - current.before,
              firstWarningWork: current.firstWarningWork
            })
            return evidence
          } finally {
            current = undefined
          }
        }
        // Retained passive protocol baseline predates node-owned seeding.
        const query = continuous.queryContinuousPair
        vi.spyOn(continuous, 'queryContinuousPair').mockImplementation(
          (input, settings, checkpoint, kernel) =>
            query(
              input,
              settings,
              checkpoint,
              kernel ? { ...kernel, sample: undefined } : kernel
            )
        )
        const baseline = queryOriginalPartPair(
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
        expect(baseline.coverage).toBe('complete')
        const sourceTime = segment === 114 ? node[0] : middle,
          targetTime = segment === 114 ? middle : node[1]
        const source = rows.find((row) => row.time === sourceTime),
          target = rows.find((row) => row.time === targetTime)
        if (!source || !target)
          throw new Error('Missing frozen actual neighboring samples')
        expect(source.evidence.penetration).toBe(false)
        expect(source.evidence.upper).toBeLessThan(
          snapshot.rule.minimumClearance
        )
        // Controlled admitted snapshot precondition, not a generic provenance validator.
        for (const shape of [...source.shapes, ...target.shapes]) {
          if (shape.geometry.kind !== 'mesh')
            throw new Error('Expected original mesh source')
          expect(Object.isFrozen(shape.geometry.positions)).toBe(true)
          expect(Object.isFrozen(shape.geometry.indices)).toBe(true)
        }
        let work = 0
        const transported = transport(source, target, () => {
          if (context.work + ++work > EXPERIMENT_RESOURCE_PROFILE.maxWorkUnits)
            throw new MeshWorkLimit(
              'Passive witness transport exceeded the unchanged guard'
            )
        })
        expect(transported).toBeDefined()
        if (!transported)
          throw new Error('Expected admissible original witness')
        expect(work).toBe(6)
        expect(transported.upper).toBeGreaterThanOrEqual(target.evidence.lower)
        // eslint-disable-next-line no-console -- passive seed eligibility and complete baseline evidence, not measured savings
        console.info(
          JSON.stringify({
            profile: 'source-witness-transport',
            segment,
            sourceTime,
            targetTime,
            source: source.evidence,
            target: target.evidence,
            transportedUpper: transported.upper,
            establishesWarning:
              transported.upper < snapshot.rule.minimumClearance,
            addedWork: work,
            baselineWork: context.work,
            targetWork: target.work,
            firstWarningWorkUpperBound: target.firstWarningWork,
            baselineLeaves: baseline.leaves
          })
        )
      },
      20000
    )
  }
)
