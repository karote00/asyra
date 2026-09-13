import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, it, vi } from 'vitest'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { DistanceEvidence, ConvexShape } from '../convex-query'
import {
  createFreshStaticSampler,
  type StaticSample
} from '../fresh-static-sampler'
import type { PairEvidence } from '../continuous-query'
import { OriginalMeshQuery, MeshWorkLimit } from '../original-mesh-query'
import {
  ORIGINAL_PART_METHOD,
  queryOriginalPartPair
} from '../original-part-method'
import {
  runClearanceQueries,
  type OfficialPairEvidence
} from '../official-method'
import { originalWorkcellSnapshot } from './workcell-fixture'
import { representativeSnapshot } from './representative-fixture'
import {
  chargeUnion,
  chargeCount,
  observeSampler,
  OpportunityCensus,
  rootOpportunity,
  type QueryReceipt
} from './temporal-opportunity-fixture'

afterEach(() => vi.restoreAllMocks())
const proof: DistanceEvidence = {
  lower: 0.01,
  upper: 0.05,
  penetration: false,
  converged: false,
  iterations: 1,
  axis: [1, 0, 0],
  witnessA: [
    [0, 0],
    [0, 0],
    [0, 0]
  ],
  witnessB: [
    [0.05, 0.05],
    [0, 0],
    [0, 0]
  ]
}
it('forwards real opaque same-node and adjacent sources, publication identity and exact results', () => {
  const g = Object.freeze({
    kind: 'mesh' as const,
    version: 1 as const,
    source: { assetId: 'opaque-source-proof', scale: [1, 1, 1] as const },
    positions: Object.freeze([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    indices: Object.freeze([0, 1, 2])
  })
  const shape: ConvexShape = {
    geometry: g,
    pose: poseOperations(intervalAlgebra).identity()
  }
  let ticks = 0,
    observed: StaticSample | null | undefined
  const seeds: unknown[] = []
  const raw = createFreshStaticSampler(
    0.1,
    () => ticks++,
    (_a, _b, seed) => {
      seeds.push(seed)
      return proof
    },
    () => false
  )
  const proxy = observeSampler(raw, (_origin, call) => {
    observed = call()
    return observed
  })
  expect(proxy.publishBoundary).toBe(raw.publishBoundary)
  const node = {},
    origin = {
      node,
      segment: 1,
      start: 1,
      end: 2,
      time: 1,
      capture: true,
      originalRoot: true
    }
  const first = proxy(shape, shape, origin)
  expect(first).toBe(observed)
  expect(first?.evidence).toBe(proof)
  const next = proxy(shape, shape, { ...origin, time: 1.5 }, first?.source)
  expect(next).toBe(observed)
  expect(seeds[1]).toBeDefined()
  const boundary = proxy.publishBoundary?.(first?.source)
  expect(boundary).toBeDefined()
  proxy(
    shape,
    shape,
    { ...origin, node: {}, segment: 0, start: 0, end: 1, time: 0 },
    boundary
  )
  expect(seeds[2]).toBeDefined()
  expect(ticks).toBe(16) // capture + same-node six/capture + publication + boundary six/capture
  const other = createFreshStaticSampler(
    0.1,
    () => undefined,
    (_a, _b, seed) => {
      expect(seed).toBeUndefined()
      return proof
    },
    () => false
  )
  other(
    shape,
    shape,
    { ...origin, node: {}, segment: 0, start: 0, end: 1, time: 0 },
    boundary
  )
})
it.each([new Error('cancel sentinel'), new MeshWorkLimit('work sentinel')])(
  'forwards exact thrown and exhaustion outcomes without swallowing %s',
  (sentinel) => {
    const raw = (() => {
      throw sentinel
    }) as Parameters<typeof observeSampler>[0]
    const proxy = observeSampler(raw, (_origin, call) => call())
    try {
      Reflect.apply(proxy, undefined, [undefined, undefined, { node: {} }])
      expect.fail('Expected original error')
    } catch (error) {
      expect(error).toBe(sentinel)
    }
  }
)
it('unions charged IDs across duplicates and nested ancestors, and retains overlapping preparation', () => {
  expect(
    chargeUnion(
      [
        [10, 30],
        [15, 20],
        [10, 30],
        [25, 40]
      ],
      [
        [12, 14],
        [13, 16],
        [35, 50]
      ]
    )
  ).toEqual([
    [10, 12],
    [16, 35]
  ])
  expect(
    chargeCount(
      chargeUnion([
        [0, 5],
        [5, 9],
        [2, 7]
      ])
    )
  ).toBe(9)
  expect(() => chargeUnion([[3, 2]])).toThrow('Invalid')
})
const row = (
  id: number,
  kind: QueryReceipt['kind'],
  charges: readonly [number, number]
): QueryReceipt => ({
  id,
  pair: 'p',
  kind,
  charges,
  segment: 0,
  time: [0, 1],
  status: 'complete',
  preparation: [],
  traversal: true,
  membership: 0,
  inside: false,
  convexCalls: 0,
  milliseconds: 0
})
const receipts = () => {
  const first = row(0, 'distance', [0, 10])
  first.time = [0, 0]
  first.origin = {
    node: 0,
    segment: 0,
    start: 0,
    end: 1,
    time: 0,
    capture: true,
    originalRoot: true
  }
  first.result = { ...proof, lower: 2, upper: 3 }
  const initial = row(1, 'lowerOver', [10, 20])
  initial.result = 0
  initial.preparation = [[12, 14]]
  const child = row(2, 'distance', [20, 30])
  child.time = [0.5, 0.5]
  child.result = proof
  return [
    first,
    initial,
    child,
    row(3, 'handoff', [30, 31]),
    row(4, 'source', [31, 32]),
    row(5, 'derivation', [32, 33])
  ]
}
const clearEvidence = (): PairEvidence => ({
  lower: 2,
  upper: 3,
  coverage: 'complete',
  evaluations: 3,
  leaves: [0, 0.5].map((start) => ({
    start,
    end: start + 0.5,
    lower: 2,
    upper: 3,
    witnessTime: start,
    penetration: false,
    state: 'clear',
    reason: 'synthetic receipt only'
  }))
})
it('credits a maximal clear root once and retains its first witness, preparation and all handoffs', () => {
  const rows = receipts(),
    result = rootOpportunity(
      'p',
      0,
      [0, 1],
      clearEvidence(),
      [...rows, rows[2]],
      1
    )
  expect(result).toMatchObject({
    eligible: true,
    initialClear: false,
    gross: 18,
    firstQueryId: 0,
    ranges: [
      [10, 12],
      [14, 30]
    ],
    firstWitnessTime: 0
  })
  expect(result.firstWitness).toBe(rows[0].result)
  expect(
    rootOpportunity('p', 0, [0, 0.5], clearEvidence(), rows, 1).eligible
  ).toBe(false)
})
it.each([
  'finding',
  'unresolved',
  'gap',
  'wrong-pair',
  'wrong-segment',
  'missing-first',
  'thrown-first',
  'nonfinite-first'
])('never credits %s evidence', (kind) => {
  const evidence = clearEvidence(),
    rows = receipts()
  if (kind === 'finding' || kind === 'unresolved')
    evidence.leaves[1].state = kind
  if (kind === 'gap') evidence.leaves = evidence.leaves.slice(0, -1)
  if (kind === 'wrong-pair')
    rows.forEach((r) => {
      r.pair = 'other'
    })
  if (kind === 'wrong-segment')
    rows.forEach((r) => {
      r.segment = 1
    })
  if (kind === 'missing-first') rows[0].origin = undefined
  if (kind === 'thrown-first') rows[0].status = 'thrown'
  if (kind === 'nonfinite-first') rows[0].result = { ...proof, upper: Infinity }
  expect(rootOpportunity('p', 0, [0, 1], evidence, rows, 1).gross).toBe(0)
})
it.each([undefined, 10])(
  'preserves canonical evidence, work and checkpoints on existing small original geometry with limit %s',
  async (limit) => {
    const snapshot = await originalWorkcellSnapshot(),
      pair = snapshot.pairs[0]
    const run = (observed: boolean) => {
      let checkpoints = 0
      const q = new OriginalMeshQuery(() => checkpoints++, limit)
      const census = observed ? new OpportunityCensus(q) : undefined
      if (census) census.pair = pair.id
      const result = queryOriginalPartPair(
        {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: pair.a,
          b: pair.b,
          interval: snapshot.interval
        },
        {
          ...snapshot.method.settings,
          threshold: snapshot.rule.minimumClearance,
          maxIntervals: snapshot.budget.maxIntervals
        },
        () => undefined,
        q
      )
      if (census)
        expect(
          chargeCount(chargeUnion(census.rows.map((r) => r.charges)))
        ).toBe(q.work)
      return { result, work: q.work, checkpoints }
    }
    const control = run(false),
      observed = run(true)
    expect(observed).toEqual(control)
  }
)

it('preserves cancellation at the original checkpoint and retains no invented completed query', async () => {
  const snapshot = await originalWorkcellSnapshot(),
    pair = snapshot.pairs[0],
    sentinel = new Error('owned cancellation')
  const run = (observed: boolean) => {
    let calls = 0,
      caught: unknown
    const context = new OriginalMeshQuery(() => {
      if (++calls === 3) throw sentinel
    })
    const census = observed ? new OpportunityCensus(context) : undefined
    if (census) census.pair = pair.id
    try {
      queryOriginalPartPair(
        {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: pair.a,
          b: pair.b,
          interval: snapshot.interval
        },
        {
          ...snapshot.method.settings,
          threshold: snapshot.rule.minimumClearance,
          maxIntervals: snapshot.budget.maxIntervals
        },
        () => undefined,
        context
      )
    } catch (error) {
      caught = error
    }
    expect(caught).toBe(sentinel)
    if (census) {
      expect(census.rows.some((r) => r.status === 'thrown')).toBe(true)
      expect(chargeCount(chargeUnion(census.rows.map((r) => r.charges)))).toBe(
        context.work
      )
    }
    return { work: context.work, calls }
  }
  const control = run(false)
  expect(run(true)).toEqual(control)
})

const project = fileURLToPath(new URL('../../../../../../', import.meta.url))
const hash = (s: string) => createHash('sha256').update(s).digest('hex')
it.runIf(process.env.SIM_TEMPORAL_OPPORTUNITY_CENSUS === '1')(
  'records one unchanged full-population default invocation, preserving partial coverage and exact control',
  async () => {
    const baselinePath = join(
      project,
      'tmp/capacity/frontier-full-0-control.json'
    )
    const baselineText = readFileSync(baselinePath, 'utf8'),
      baseline = JSON.parse(baselineText)
    const snapshot = await representativeSnapshot(0)
    expect(hash(JSON.stringify(snapshot))).toBe(baseline.manifest.inputHash)
    const started = performance.now(),
      checkpoint = () => {
        if (performance.now() - started > 20000)
          throw new Error('Whole-population 20000 ms guard exhausted')
      }
    const context = new OriginalMeshQuery(checkpoint, 500000),
      census = new OpportunityCensus(context)
    const pairs: OfficialPairEvidence[] = []
    let result: ReturnType<typeof runClearanceQueries> | undefined,
      error: string | undefined
    try {
      result = runClearanceQueries(
        snapshot,
        ORIGINAL_PART_METHOD,
        (query, settings, check) => {
          census.pair = snapshot.pairs[pairs.length].id
          return queryOriginalPartPair(query, settings, check, context)
        },
        checkpoint,
        (pair) => pairs.push(pair)
      )
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught)
    }
    const milliseconds = performance.now() - started
    const directory = join(project, 'tmp/capacity')
    mkdirSync(directory, { recursive: true })
    const rawPath = join(directory, 'temporal-opportunity-census.json')
    writeFileSync(
      rawPath,
      JSON.stringify(
        {
          source: 'b9f4a710c default - passive census only',
          baselineSha256: hash(baselineText),
          manifest: baseline.manifest,
          work: context.work,
          milliseconds,
          error,
          evaluations: result?.evaluations,
          coverage: result?.coverage,
          pairs,
          rows: census.rows
        },
        null,
        2
      ) + '\n'
    )
    expect(error).toBeUndefined()
    expect(context.work).toBe(500197)
    expect(result?.evaluations).toBe(20265)
    expect(pairs[101].evidence.evaluations).toBe(166)
    expect(hash(JSON.stringify(pairs))).toBe(
      hash(JSON.stringify(baseline.pairs))
    )
    const charges = census.rows.map((r) => r.charges)
    expect(chargeCount(charges)).toBe(context.work)
    expect(chargeCount(chargeUnion(charges))).toBe(context.work)
    const opportunities = [],
      allRanges = [],
      categories: Record<string, number> = {}
    let completeRoots = 0,
      unresolvedRoots = 0,
      unvisitedRoots = 0
    for (let index = 0; index < snapshot.pairs.length; index++) {
      const pair = snapshot.pairs[index],
        output = pairs[index]
      const rows = census.rows.filter((r) => r.pair === pair.id)
      for (
        let segment = 0;
        segment < snapshot.trajectory.keyframes.length - 1;
        segment++
      ) {
        const interval = [
          snapshot.trajectory.keyframes[segment].time,
          snapshot.trajectory.keyframes[segment + 1].time
        ] as const
        const leaves =
          output?.evidence.leaves.filter(
            (l) => l.start < interval[1] && l.end > interval[0]
          ) ?? []
        if (leaves.length && leaves.every((l) => l.state !== 'unresolved'))
          completeRoots++
        else unresolvedRoots++
        if (!rows.some((r) => r.segment === segment)) unvisitedRoots++
        if (!output) continue
        const opportunity = rootOpportunity(
          pair.id,
          segment,
          interval,
          output.evidence,
          rows,
          snapshot.rule.minimumClearance
        )
        if (opportunity.eligible && opportunity.gross > 1) {
          opportunities.push({
            pairId: pair.id,
            segment,
            interval,
            ...opportunity,
            optimisticNet: opportunity.gross - 1
          })
          allRanges.push(...opportunity.ranges)
        }
      }
    }
    for (const row of census.rows)
      categories[row.kind] =
        (categories[row.kind] ?? 0) + row.charges[1] - row.charges[0]
    const gross = chargeCount(chargeUnion(allRanges)),
      minimumNewCertificates = opportunities.length
    const postLimitWholePairAttempts = census.rows.filter(
      (r) =>
        r.kind === 'distance' &&
        r.status === 'thrown' &&
        r.charges[0] >= 500000 &&
        r.charges[1] - r.charges[0] === 1
    ).length
    // Unvisited roots need at least two canonical units. For each later exhausted
    // whole-pair call, generously credit its paid attempt toward that root. Give
    // the partly completed active failure root no additional work in this bound.
    const remainingWorkLowerBound =
      unvisitedRoots * 2 + postLimitWholePairAttempts
    const report = {
      note: 'Optimistic disjoint opportunity, not a new proof or measured saving. Unvisited geometry receives no benefit credit.',
      work: context.work,
      milliseconds,
      evaluations: result?.evaluations,
      selectedPairs: snapshot.pairs.length,
      totalRoots: snapshot.pairs.length * 199,
      completeRoots,
      unresolvedRoots,
      unvisitedRoots,
      categories,
      opportunityRoots: opportunities.length,
      gross,
      minimumNewCertificates,
      optimisticNet: gross - minimumNewCertificates,
      retainedCharges: context.work - gross,
      postLimitWholePairAttempts,
      remainingWorkLowerBound,
      optimisticCompleteFloor:
        context.work - gross + minimumNewCertificates + remainingWorkLowerBound,
      firstStaticWitnessesAndPreparationRetained: true,
      opportunities
    }
    writeFileSync(
      join(directory, 'temporal-opportunity-summary.json'),
      JSON.stringify(report, null, 2) + '\n'
    )
    expect(gross).toBe(opportunities.reduce((n, o) => n + o.gross, 0))
    // eslint-disable-next-line no-console -- bounded summary; complete receipts remain in project-local artifact
    console.info(
      JSON.stringify({ ...report, opportunities: undefined, rawPath })
    )
  },
  30000
)
