import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import {
  intervalAlgebra,
  interpolateSegment,
  evaluatePairKinematics,
  poseOperations,
  type Algebra,
  type AlgebraPose
} from '../../../domain/kinematic-algebra'
import { interval, type Interval } from '../../../domain/interval'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { buildMeshIndex, type Bounds } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import type { ConvexShape } from '../convex-query'
import { representativeSnapshot } from './representative-fixture'
import { originalWorkcellSnapshot } from './workcell-fixture'
import {
  chargeUnion,
  chargeCount,
  type QueryReceipt
} from './temporal-opportunity-fixture'
import {
  ExactBoxProbe,
  approximate,
  axesRuledOut,
  exactJson,
  type ProbeCharge
} from './root-box-applicability-fixture'

const box: Bounds = [
  [-0.5, 0.5],
  [-0.5, 0.5],
  [-0.5, 0.5]
]
const pose = (x: Interval = [0, 0]): AlgebraPose<Interval> => ({
  position: [x, [0, 0], [0, 0]],
  rotation: [
    [0, 0],
    [0, 0],
    [0, 0],
    [1, 1]
  ]
})
it('encloses exact box gap from both sides and distinguishes overlap from separation', () => {
  const exact = new ExactBoxProbe()
  const overlap = exact.pointGaps(box, pose(), box, pose([0.5, 0.5]), 0.02)
  expect(
    overlap.map((g) => [approximate(g.lower), approximate(g.upper), g.ruledOut])
  ).toEqual([
    [0, 0, true],
    [0, 0, true],
    [0, 0, true]
  ])
  const separated = exact.pointGaps(box, pose(), box, pose([2, 2]), 0.02)
  expect(
    separated.map((g) => [
      approximate(g.lower),
      approximate(g.upper),
      g.ruledOut
    ])
  ).toEqual([
    [1, 1, false],
    [0, 0, true],
    [0, 0, true]
  ])
})
it('does not treat overlapping outward boxes or uncertain point transforms as a counterexample', () => {
  const gaps = new ExactBoxProbe().pointGaps(
    box,
    pose([0, 10]),
    box,
    pose([5, 15]),
    0.02
  )
  expect(approximate(gaps[0].lower)).toBe(0)
  expect(approximate(gaps[0].upper)).toBe(14)
  expect(gaps[0].ruledOut).toBe(false)
})
it('uses exact threshold equality and exact signed permutation rotation', () => {
  const exact = new ExactBoxProbe(),
    rotated = {
      ...pose([1.125, 1.125]),
      rotation: [
        [0, 0],
        [0, 0],
        [1, 1],
        [0, 0]
      ] as AlgebraPose<Interval>['rotation']
    }
  const equal = exact.pointGaps(box, pose(), box, rotated, 0.125)
  expect([
    approximate(equal[0].lower),
    approximate(equal[0].upper),
    equal[0].ruledOut
  ]).toEqual([0.125, 0.125, true])
  expect(
    exact.pointGaps(box, pose(), box, rotated, 0.12499999999999999)[0].ruledOut
  ).toBe(false)
})
it('independently resolves the exact half-component quaternion rotation of an asymmetric box', () => {
  const rotated = {
    ...pose(),
    rotation: [
      [0.5, 0.5],
      [0.5, 0.5],
      [0.5, 0.5],
      [0.5, 0.5]
    ] as AlgebraPose<Interval>['rotation']
  }
  const gaps = new ExactBoxProbe().pointGaps(
    [
      [-1, 1],
      [-2, 2],
      [-3, 3]
    ],
    rotated,
    [
      [0, 0],
      [0, 0],
      [0, 0]
    ],
    pose([4, 4]),
    0.02
  )
  expect(gaps.map((g) => [approximate(g.lower), approximate(g.upper)])).toEqual(
    [
      [1, 1],
      [0, 0],
      [0, 0]
    ]
  )
})
it('permits different fixed endpoint counterexamples but never invents an untested axis', () => {
  const a = {
    gaps: [
      { axis: 0, ruledOut: true },
      { axis: 1, ruledOut: false }
    ]
  }
  const b = {
    gaps: [
      { axis: 1, ruledOut: true },
      { axis: 2, ruledOut: true }
    ]
  }
  expect(axesRuledOut([a])).toEqual([true, false, false])
  expect(axesRuledOut([a, b])).toEqual([true, true, true])
})
it('rejects invalid enclosures and propagates the exact interruption before a proof', () => {
  expect(() =>
    new ExactBoxProbe().pointGaps(box, pose([2, 1]), box, pose(), 0.02)
  ).toThrow('Reversed')
  expect(() => new ExactBoxProbe().from(Infinity)).toThrow('Nonfinite')
  const sentinel = new Error('probe exhausted')
  expect(() =>
    new ExactBoxProbe(() => {
      throw sentinel
    }).pointGaps(box, pose(), box, pose(), 0.02)
  ).toThrow(sentinel)
})

type Snapshot = Awaited<ReturnType<typeof representativeSnapshot>>
function pointShapes(
  snapshot: Snapshot,
  pair: Snapshot['pairs'][number],
  segment: number,
  time: number,
  tick: ProbeCharge
): readonly [ConvexShape, ConvexShape] {
  const algebra = Object.fromEntries(
    Object.entries(intervalAlgebra).map(([name, fn]) => [
      name,
      (...args: unknown[]) => {
        tick(`pose-${name}`)
        return (fn as (...values: unknown[]) => unknown)(...args)
      }
    ])
  ) as unknown as Algebra<Interval>
  const values = interpolateSegment(
      snapshot.trajectory,
      segment,
      interval(time),
      algebra
    ),
    poses = evaluatePairKinematics(
      snapshot.workcell,
      values,
      pair.a.bodyId,
      pair.b.bodyId,
      algebra
    ),
    ops = poseOperations(algebra)
  return [pair.a, pair.b].map((ref, side) => {
    const body = snapshot.workcell.bodies.find((b) => b.id === ref.bodyId),
      collider = body?.colliders.find((c) => c.id === ref.colliderId)
    if (!collider) throw new Error('Missing original source collider')
    tick('pose-allocation')
    return {
      geometry: collider.geometry,
      pose: ops.compose(poses[side], ops.fromPose(collider.pose))
    }
  }) as unknown as readonly [ConvexShape, ConvexShape]
}
it('uses exactly the canonical point-pose/interpolation/collider route on existing original geometry', async () => {
  const snapshot = await originalWorkcellSnapshot(),
    pair = snapshot.pairs[0],
    context = new OriginalMeshQuery(),
    distance = context.distance.bind(context)
  let captured: readonly [ConvexShape, ConvexShape] | undefined
  context.distance = (a, b, ...args) => {
    captured = [a, b]
    return distance(a, b, ...args)
  }
  queryOriginalPartPair(
    {
      workcell: snapshot.workcell,
      trajectory: snapshot.trajectory,
      a: pair.a,
      b: pair.b,
      interval: [0, 0]
    },
    {
      ...snapshot.method.settings,
      threshold: snapshot.rule.minimumClearance,
      maxIntervals: snapshot.budget.maxIntervals
    },
    () => undefined,
    context
  )
  expect(pointShapes(snapshot, pair, 0, 0, () => undefined)).toEqual(captured)
})

const project = fileURLToPath(new URL('../../../../../../', import.meta.url)),
  digest = (s: string) => createHash('sha256').update(s).digest('hex')
it.runIf(process.env.SIM_ROOT_BOX_APPLICABILITY === '1')(
  'tests only the frozen 46 first-original-root calls at their two fixed endpoints',
  async () => {
    const rawText = readFileSync(
      join(project, 'tmp/capacity/temporal-opportunity-census.json'),
      'utf8'
    )
    const census = JSON.parse(rawText) as {
      manifest: { inputHash: string }
      rows: QueryReceipt[]
    }
    const summary = JSON.parse(
      readFileSync(
        join(project, 'tmp/capacity/temporal-opportunity-summary.json'),
        'utf8'
      )
    ) as {
      opportunities: {
        pairId: string
        segment: number
        initialQueryId: number
        ranges: readonly (readonly [number, number])[]
        gross: number
      }[]
    }
    const snapshot = await representativeSnapshot(0)
    expect(digest(JSON.stringify(snapshot))).toBe(census.manifest.inputHash)
    const seen = new Set<string>(),
      eligible: QueryReceipt[] = []
    for (const row of census.rows) {
      if (row.kind !== 'lowerOver' || row.segment === undefined) continue
      const start = snapshot.trajectory.keyframes[row.segment].time,
        end = snapshot.trajectory.keyframes[row.segment + 1].time
      if (row.time?.[0] !== start || row.time[1] !== end) continue
      const key = `${row.pair}:${row.segment}`
      if (seen.has(key)) continue
      seen.add(key)
      if (row.traversal) eligible.push(row)
    }
    expect(eligible).toHaveLength(46)
    const opportunityIds = new Set(eligible.map((r) => r.id)),
      opportunities = summary.opportunities.filter((o) =>
        opportunityIds.has(o.initialQueryId)
      )
    expect(opportunities).toHaveLength(42)
    expect(opportunities.reduce((n, o) => n + o.gross, 0)).toBe(106667)
    const counts: Record<string, number> = {},
      started = performance.now()
    let work = 0
    const tick: ProbeCharge = (kind) => {
      if (performance.now() - started > 20000)
        throw new Error('20000 ms applicability guard exhausted')
      counts[kind] = (counts[kind] ?? 0) + 1
      if (++work > 500000)
        throw new Error('500000-operation applicability guard exhausted')
    }
    const exact = new ExactBoxProbe(tick),
      boxes = new Map<MeshGeometry, Bounds>()
    const bounds = (shape: ConvexShape) => {
      if (shape.geometry.kind !== 'mesh')
        throw new Error('Frozen probe requires original meshes')
      let result = boxes.get(shape.geometry)
      if (!result) {
        result = buildMeshIndex(shape.geometry, () => tick('source-prepare'))
          .root.bounds
        tick('source-binding')
        boxes.set(shape.geometry, result)
      }
      return result
    }
    const results = []
    let error: string | undefined
    try {
      for (const row of eligible) {
        const pair = snapshot.pairs.find((p) => p.id === row.pair)
        if (!pair || row.segment === undefined || !row.time)
          throw new Error('Missing frozen query provenance')
        const first = census.rows.find(
          (r) =>
            r.pair === row.pair &&
            r.segment === row.segment &&
            r.origin?.originalRoot === true &&
            r.origin.time === row.time?.[0] &&
            r.kind === 'distance'
        )
        if (
          !first ||
          first.status !== 'complete' ||
          typeof first.result !== 'object' ||
          first.result.penetration ||
          first.result.lower <= 0
        )
          throw new Error('Missing actual first static witness')
        tick('root-receipt')
        const record = {
          queryId: row.id,
          pairId: row.pair,
          segment: row.segment,
          interval: row.time,
          points: [] as {
            time: number
            poses: readonly AlgebraPose<Interval>[]
            bounds: readonly Bounds[]
            gaps: ReturnType<ExactBoxProbe['pointGaps']>
          }[],
          excludedAxes: [false, false, false],
          ruledOut: false
        }
        results.push(record)
        for (const time of row.time) {
          const shapes = pointShapes(snapshot, pair, row.segment, time, tick),
            a = bounds(shapes[0]),
            b = bounds(shapes[1])
          const gaps = exact.pointGaps(
            a,
            shapes[0].pose,
            b,
            shapes[1].pose,
            snapshot.rule.minimumClearance
          )
          tick('point-receipt')
          record.points.push({
            time,
            poses: shapes.map((s) => s.pose),
            bounds: [a, b],
            gaps
          })
        }
        record.excludedAxes = axesRuledOut(record.points)
        record.ruledOut = record.excludedAxes.every(Boolean)
      }
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught)
    }
    const milliseconds = performance.now() - started
    const excluded = new Set(
        results.filter((r) => r.ruledOut).map((r) => r.queryId)
      ),
      survivors = opportunities.filter((o) => !excluded.has(o.initialQueryId))
    const survivorGross = chargeCount(
      chargeUnion(survivors.flatMap((o) => o.ranges))
    )
    const report = {
      note: 'Counterexamples reject only the proposed fixed-world-axis complete-root-box certificate, not source collision or general G4 feasibility.',
      censusSha256: digest(rawText),
      inputHash: census.manifest.inputHash,
      threshold: snapshot.rule.minimumClearance,
      eligibleCalls: eligible.length,
      completedRoots: results.filter((r) => r.points.length === 2).length,
      endpointQueries: results.reduce((n, r) => n + r.points.length, 0),
      ruledOutRoots: excluded.size,
      remainingPossibleRoots: eligible.length - excluded.size,
      survivingOpportunityRoots: survivors.length,
      originalGrossOpportunity: 106667,
      survivorGross,
      generousCompleteFloorBeforeAnyNewFees: 500197 - survivorGross + 77898,
      work,
      milliseconds,
      counts,
      error,
      results,
      survivors
    }
    const directory = join(project, 'tmp/capacity')
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      join(directory, 'root-box-applicability.json'),
      JSON.stringify(report, exactJson, 2) + '\n'
    )
    // eslint-disable-next-line no-console -- bounded proof summary; exact dyadics and poses remain in artifact
    console.info(
      JSON.stringify({ ...report, results: undefined, survivors: undefined })
    )
    expect(error).toBeUndefined()
    expect(results.every((r) => r.points.length === 2)).toBe(true)
    expect(results).toHaveLength(46)
    expect(survivorGross).toBe(survivors.reduce((n, o) => n + o.gross, 0))
  },
  30000
)
