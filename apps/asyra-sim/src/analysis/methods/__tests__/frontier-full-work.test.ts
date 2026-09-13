import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { OriginalMeshQuery } from '../original-mesh-query'
import {
  ORIGINAL_PART_METHOD,
  queryOriginalPartPair
} from '../original-part-method'
import {
  runClearanceQueries,
  type OfficialMethodEvidence,
  type OfficialPairEvidence
} from '../official-method'
import type { IntervalEvidence } from '../continuous-query'
import type { FrontierWork } from '../mesh-frontier'
import { representativeSnapshot } from './representative-fixture'

type Snapshot = Awaited<ReturnType<typeof representativeSnapshot>>
const save = (scenario: number, mode: string, data: unknown) => {
  const path = fileURLToPath(
    new URL(
      `../../../../../../tmp/capacity/frontier-full-${scenario}-${mode}.json`,
      import.meta.url
    )
  )
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
  return path
}
const hash = (input: unknown) =>
  createHash('sha256').update(JSON.stringify(input)).digest('hex')
function workload(snapshot: Snapshot) {
  const source = snapshot.workcell.bodies.map((body) => ({
    bodyId: body.id,
    colliders: body.colliders.map((c) => ({
      id: c.id,
      kind: c.geometry.kind,
      triangles: c.geometry.kind === 'mesh' ? c.geometry.indices.length / 3 : 0,
      hash: hash(c.geometry)
    }))
  }))
  return {
    inputHash: hash(snapshot),
    bodies: snapshot.workcell.bodies.length,
    fixtures: snapshot.workcell.bodies.filter((b) => b.role === 'fixture')
      .length,
    keyframes: snapshot.trajectory.keyframes.length,
    pairs: snapshot.pairs.length,
    triangles: source.reduce(
      (n, b) => n + b.colliders.reduce((m, c) => m + c.triangles, 0),
      0
    ),
    interval: snapshot.interval,
    method: snapshot.method,
    rule: snapshot.rule,
    budget: snapshot.budget,
    source
  }
}
function measure(snapshot: Snapshot, candidate: boolean) {
  const started = performance.now(),
    checkpoint = () => {
      if (performance.now() - started > 20000)
        throw new Error('Full-workcell 20000 ms wall guard exhausted')
    }
  const context = new OriginalMeshQuery(
    checkpoint,
    500000,
    true,
    undefined,
    candidate
  )
  const categories: Record<string, number> = {},
    calls: Record<string, number> = {},
    frontier: Partial<Record<FrontierWork, number>> = {}
  const pairs: OfficialPairEvidence[] = [],
    pairCosts: { pairId: string; work: number; completed: boolean }[] = []
  let activePair: string | undefined,
    previous = 0,
    firstWorkFailure: unknown
  // Preserve the canonical sampler function and its publishBoundary capability.
  // Wrapping only its callable body silently disables adjacent-root transport.
  for (const name of [
    'distance',
    'lowerOver',
    'chargeSourceWitness',
    'chargeEvidenceHandoff',
    'chargeEvidenceDerivation'
  ] as const) {
    const method = context[name].bind(context) as (
      ...args: unknown[]
    ) => unknown
    ;(context[name] as (...args: unknown[]) => unknown) = (...args) => {
      const before = context.work
      calls[name] = (calls[name] ?? 0) + 1
      try {
        return method(...args)
      } finally {
        categories[name] = (categories[name] ?? 0) + context.work - before
        if (context.work > 500000 && !firstWorkFailure)
          firstWorkFailure = {
            pairId: activePair,
            owner: name,
            work: context.work
          }
      }
    }
  }
  if (candidate) {
    const owner = (
        context as unknown as {
          frontier: { charge: (kind: FrontierWork) => void }
        }
      ).frontier,
      charge = owner.charge
    owner.charge = (kind) => {
      const before = context.work
      try {
        charge(kind)
      } finally {
        frontier[kind] = (frontier[kind] ?? 0) + context.work - before
      }
    }
  }
  let result: OfficialMethodEvidence | undefined, error: string | undefined
  try {
    // Same owner, settings/global budgets, canonical pair query and order as
    // runOriginalPartMethod; only this test-owned context enables the candidate.
    result = runClearanceQueries(
      snapshot,
      ORIGINAL_PART_METHOD,
      (query, settings, check) => {
        activePair = snapshot.pairs[pairs.length].id
        return queryOriginalPartPair(query, settings, check, context)
      },
      checkpoint,
      (pair) => {
        pairs.push(pair)
        pairCosts.push({
          pairId: pair.pairId,
          work: context.work - previous,
          completed: true
        })
        previous = context.work
        activePair = undefined
      }
    )
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught)
  }
  const milliseconds = performance.now() - started
  if (activePair)
    pairCosts.push({
      pairId: activePair,
      work: context.work - previous,
      completed: false
    })
  const firstPartial = pairs.find((p) => p.evidence.coverage === 'partial')
  return {
    candidate,
    work: context.work,
    milliseconds,
    error,
    activePair,
    firstWorkFailure,
    firstPartial: firstPartial
      ? {
          pairId: firstPartial.pairId,
          leaf: firstPartial.evidence.leaves.find(
            (l) => l.state === 'unresolved'
          ),
          evaluations: firstPartial.evidence.evaluations
        }
      : undefined,
    categories,
    calls,
    frontier,
    pairCosts,
    pairs,
    result
  }
}
function validateLeaf(leaf: IntervalEvidence, threshold: number) {
  expect(Number.isFinite(leaf.lower)).toBe(true)
  expect(leaf.lower).toBeGreaterThanOrEqual(0)
  if (leaf.upper !== null) {
    expect(Number.isFinite(leaf.upper)).toBe(true)
    expect(leaf.upper).toBeGreaterThanOrEqual(leaf.lower)
  }
  if (leaf.witnessTime !== null) {
    expect(leaf.witnessTime).toBeGreaterThanOrEqual(leaf.start)
    expect(leaf.witnessTime).toBeLessThanOrEqual(leaf.end)
  }
  if (leaf.state === 'clear') expect(leaf.lower).toBeGreaterThan(threshold)
  if (leaf.state === 'finding') {
    expect(leaf.upper).not.toBeNull()
    expect(leaf.upper as number).toBeLessThanOrEqual(threshold)
    expect(leaf.witnessTime).not.toBeNull()
  }
  if (leaf.penetration) {
    expect(leaf.state).toBe('finding')
    expect(leaf.lower).toBe(0)
    expect(leaf.upper).toBe(0)
    expect(leaf.witnessTime).not.toBeNull()
  }
}
interface ComparisonInput {
  pairs: readonly OfficialPairEvidence[]
  result: unknown
}
function compare(
  snapshot: Snapshot,
  control: ComparisonInput,
  candidate: ComparisonInput
) {
  const issues: string[] = [],
    metrics = {
      completeControlRoots: 0,
      newlyCompletedRoots: 0,
      identicalLeaves: 0,
      conservativeDifferences: 0
    }
  if (!candidate.result) issues.push('Candidate has no completed method result')
  if (candidate.pairs.length !== snapshot.pairs.length)
    issues.push('Candidate omitted selected pairs')
  for (let p = 0; p < candidate.pairs.length; p++) {
    const actual = candidate.pairs[p],
      base = control.pairs[p]
    if (
      actual.pairId !== snapshot.pairs[p].id ||
      base?.pairId !== actual.pairId
    ) {
      issues.push(`Pair order mismatch ${p}`)
      continue
    }
    let cursor = snapshot.interval[0]
    for (const leaf of actual.evidence.leaves) {
      if (leaf.start !== cursor || leaf.end <= leaf.start)
        issues.push(`Coverage gap/overlap ${actual.pairId}`)
      cursor = leaf.end
      validateLeaf(leaf, snapshot.rule.minimumClearance)
      const tiles = base.evidence.leaves.filter(
        (l) => l.end > leaf.start && l.start < leaf.end
      )
      if (!tiles.length || tiles.some((l) => l.state === 'unresolved')) continue
      if (tiles.some((l) => JSON.stringify(l) === JSON.stringify(leaf))) {
        metrics.identicalLeaves++
        continue
      }
      const knownLower = Math.min(...tiles.map((l) => l.lower))
      const upperValid =
        leaf.upper === null ||
        tiles.some(
          (l) =>
            l.upper !== null &&
            l.witnessTime === leaf.witnessTime &&
            l.witnessTime !== null &&
            l.witnessTime >= leaf.start &&
            l.witnessTime <= leaf.end &&
            l.upper <= (leaf.upper as number)
        )
      if (leaf.lower <= knownLower && upperValid)
        metrics.conservativeDifferences++
      else
        issues.push(
          `Unadmitted bound/witness difference ${actual.pairId} [${leaf.start},${leaf.end}]`
        )
    }
    if (cursor !== snapshot.interval[1])
      issues.push(`Incomplete pair interval ${actual.pairId}`)
    for (
      let root = 0;
      root < snapshot.trajectory.keyframes.length - 1;
      root++
    ) {
      const lo = snapshot.trajectory.keyframes[root].time,
        hi = snapshot.trajectory.keyframes[root + 1].time
      const original = base.evidence.leaves.filter(
          (l) => l.start < hi && l.end > lo
        ),
        current = actual.evidence.leaves.filter(
          (l) => l.start < hi && l.end > lo
        )
      if (!original.length || original.some((l) => l.state === 'unresolved')) {
        if (current.length && current.every((l) => l.state !== 'unresolved'))
          metrics.newlyCompletedRoots++
        continue
      }
      metrics.completeControlRoots++
      if (
        !current.length ||
        current.some((l) => l.state === 'unresolved') ||
        original.some((l) => l.state === 'finding') !==
          current.some((l) => l.state === 'finding') ||
        original.some((l) => l.penetration) !==
          current.some((l) => l.penetration)
      )
        issues.push(`Root classification changed ${actual.pairId} ${root}`)
    }
  }
  return { issues, metrics }
}
it.runIf(process.env.SIM_FRONTIER_FULL_WORK === '1')(
  'validates the three unchanged full workcells sequentially and stops on the first failed scenario',
  async () => {
    for (const scenario of [0, 1, 2]) {
      const snapshot = await representativeSnapshot(scenario),
        manifest = workload(snapshot)
      expect(manifest).toMatchObject({
        bodies: 39,
        fixtures: 30,
        keyframes: 200,
        pairs: 298
      })
      const control = measure(snapshot, false)
      save(scenario, 'control', {
        source:
          '98fa74325 default path - authoritative goal b9f4a710c behavior',
        manifest,
        ...control
      })
      expect(control.error).toBeUndefined()
      expect(control.work).toBe(
        Object.values(control.categories).reduce((a, b) => a + b, 0)
      )
      if (scenario === 0) {
        expect(control.work).toBe(500197)
        expect(control.result?.evaluations).toBe(20265)
        const expected = snapshot.pairs.find(
          (p) =>
            p.a.bodyId === 'example:joint-2' && p.b.bodyId === 'obstacle-11'
        )
        expect(control.firstPartial?.pairId).toBe(expected?.id)
      }
      const candidate = measure(snapshot, true)
      const artifact = save(scenario, 'candidate', {
        source: '98fa74325 reviewed private lifecycle - test-owned only',
        note: 'Not an installed 1.0.2 result or G4/hardware claim. Nested frontier fees are already included in owner totals.',
        manifest,
        ...candidate
      })
      const comparison = compare(snapshot, control, candidate)
      save(scenario, 'comparison', comparison)
      // eslint-disable-next-line no-console -- bounded summary, complete evidence saved before assertions
      console.info(
        JSON.stringify({
          scenario,
          work: candidate.work,
          milliseconds: candidate.milliseconds,
          coverage: candidate.result?.coverage,
          error: candidate.error,
          activePair: candidate.activePair,
          firstPartial: candidate.firstPartial,
          firstWorkFailure: candidate.firstWorkFailure,
          comparison: { ...comparison, issues: comparison.issues.slice(0, 3) },
          artifact
        })
      )
      expect(candidate.work).toBe(
        Object.values(candidate.categories).reduce((a, b) => a + b, 0)
      )
      expect(candidate.work).toBe(
        candidate.pairCosts.reduce((n, p) => n + p.work, 0)
      )
      expect(candidate.error).toBeUndefined()
      expect(candidate.result?.coverage).toBe('complete')
      expect(candidate.pairs).toHaveLength(298)
      expect(
        candidate.pairs.every((p) =>
          p.evidence.leaves.every((l) => l.state !== 'unresolved')
        )
      ).toBe(true)
      expect(comparison.issues).toEqual([])
      expect(candidate.work).toBeLessThanOrEqual(500000)
      expect(candidate.milliseconds).toBeLessThanOrEqual(20000)
    }
  },
  125000
)
it('checks the frozen full-work comparison contract without running a geometry workload', () => {
  // Synthetic evidence receipts only; the full workcell/source generator above
  // is unchanged. These cases validate comparison policy, not geometry truth.
  const snapshot = {
    interval: [0, 1],
    rule: { minimumClearance: 1 },
    trajectory: { keyframes: [{ time: 0 }, { time: 0.5 }, { time: 1 }] },
    pairs: [{ id: 'pair' }]
  } as unknown as Snapshot
  const leaves: IntervalEvidence[] = [
    {
      start: 0,
      end: 0.5,
      lower: 2,
      upper: 3,
      witnessTime: 0.25,
      penetration: false,
      state: 'clear',
      reason: 'complete'
    },
    {
      start: 0.5,
      end: 1,
      lower: 4,
      upper: 5,
      witnessTime: 0.75,
      penetration: false,
      state: 'clear',
      reason: 'complete'
    }
  ]
  const control: ComparisonInput = {
    result: {},
    pairs: [
      {
        pairId: 'pair',
        evidence: {
          leaves,
          coverage: 'complete',
          lower: 2,
          upper: 3,
          evaluations: 2
        }
      }
    ]
  }
  expect(compare(snapshot, control, structuredClone(control)).issues).toEqual(
    []
  )
  const wider = structuredClone(control)
  wider.pairs[0].evidence.leaves = [
    { ...leaves[0], lower: 1.5, upper: 3.5 },
    leaves[1]
  ]
  expect(compare(snapshot, control, wider)).toMatchObject({
    issues: [],
    metrics: { conservativeDifferences: 1 }
  })
  for (const change of [{ lower: 2.1 }, { upper: 2.9 }, { witnessTime: 0.3 }]) {
    const altered = structuredClone(control)
    altered.pairs[0].evidence.leaves = [{ ...leaves[0], ...change }, leaves[1]]
    expect(
      compare(snapshot, control, altered).issues.some((s) =>
        s.includes('Unadmitted')
      )
    ).toBe(true)
  }
  const unknown = structuredClone(control)
  unknown.pairs[0].evidence.leaves = [
    {
      ...leaves[0],
      lower: 0,
      upper: null,
      witnessTime: null,
      state: 'unresolved'
    },
    leaves[1]
  ]
  expect(
    compare(snapshot, control, unknown).issues.some((s) =>
      s.includes('Root classification')
    )
  ).toBe(true)
  expect(compare(snapshot, unknown, control)).toMatchObject({
    issues: [],
    metrics: { newlyCompletedRoots: 1 }
  })
})
