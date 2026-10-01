import { expect, it } from 'vitest'
import { WalkingMotionOwner } from '../walking-motion'
import { mountedConsumerFixture } from './walking-motion-test-fixtures'

it('fails closed when a synthetic mounted offline proof has one phase-cover node', async (context) => {
  await context.annotate(
    'Starting one-node synthetic mounted offline phase-cover proof',
    'info'
  )
  // This is a distinct synthetic farm. Its sole soil strip has no adjacent
  // drain planting side; the complete model builder remains authoritative.
  const f = mountedConsumerFixture()
  const bodyRegionCounts = f.source.rig.bodies.map((body) =>
    body.parts.reduce((count, part) => count + part.regions.length, 0)
  )
  const crateRegionCount = f.crate.geometry.parts.reduce(
    (count, part) => count + part.regions.length,
    0
  )
  const M =
    bodyRegionCounts.reduce((sum, regions) => sum + regions, 0) +
    crateRegionCount
  const W =
    f.demand.freePassage.exclusions.filter(
      (e) => e.kind === 'source' && e.mesh.descriptor.shape.kind === 'triangles'
    ).length +
    f.raw.externalSources.reduce((n, p) => n + p.regions.length, 0) +
    f.demand.channels.length +
    f.raw.terrain.regions.filter((r) => r.keepOut.kind === 'bounded').length
  const phaseCount = f.raw.path.phases.length
  const R = (M * (M - 1)) / 2 + M * W
  const sameBodyPairsPerPhase =
    bodyRegionCounts.reduce(
      (sum, regions) => sum + (regions * (regions - 1)) / 2,
      0
    ) +
    (crateRegionCount * (crateRegionCount - 1)) / 2
  const requiredPairs = (R - sameBodyPairsPerPhase) * phaseCount
  // Every owner and shape has at least one original region; three times the
  // complete inventory bounds the hierarchy's owner/shape/region node count.
  const G = 3 * (M + W)
  const budget = {
    ...f.raw.budget,
    maxPhaseNodes: 1,
    maxSubdivisions: 1,
    maxRegionPairs: 1,
    maxEnvelopePairs: 1,
    maxExactPredicates: 5000000,
    maxCycleOperations: 20000000,
    maxBits: 24000
  }
  if (
    ![M, W, R, G, ...Object.values(budget)].every(
      (v) => Number.isSafeInteger(v) && v > 0
    )
  )
    throw new Error(
      'Synthetic passage profile exceeds finite safe integer domain'
    )
  const owner = new WalkingMotionOwner({
    getCurrentSceneDemand: () => f.demand,
    getCurrentWalkingRobotSource: () => f.source,
    getCurrentWalkingCycle: () => f.current,
    getCurrentMountedCrate: () => f.mounted
  })
  process.stdout.write(
    JSON.stringify({
      stage: 'synthetic-mounted-preflight',
      M,
      W,
      R,
      G,
      budget,
      farm: f.demand.farm,
      massIdentity: f.crate.massIdentity
    }) + '\n'
  )
  const result = owner.prepare({
    ...f.raw,
    budget,
    load: { ...f.raw.load, crate: { kind: 'mounted', artifact: f.crate } }
  })
  if (!('format' in result))
    throw new Error('Missing nonlinear passage admission')
  const relations = result.sourceRelations
  const first = new Map<string, unknown>()
  const partIdentity = (index: number) => {
    const entry = relations.inventory[index]
    return {
      index,
      part: entry.part?.id ?? entry.mountedPart?.id,
      region: entry.region.id,
      indexStart: entry.region.indexStart,
      indexCount: entry.region.indexCount,
      mesh: entry.exclusion?.mesh.id,
      terrain: entry.terrain?.id,
      semantic: entry.semantic?.kind
    }
  }
  for (const phase of relations.phases)
    for (const pair of phase.pairs) {
      if (pair.kind !== 'blocked' && pair.kind !== 'unknown') continue
      for (const proof of pair.proofs) {
        if (proof.kind !== 'blocked' && proof.kind !== 'unknown') continue
        const reason = proof.reason ?? proof.kind
        if (first.has(reason) || first.size >= 8) continue
        first.set(reason, {
          phase: phase.phase,
          kind: pair.kind,
          reason,
          first: partIdentity(pair.first),
          second: partIdentity(pair.second),
          parameter: [proof.parameter.low, proof.parameter.high].map(
            (q) => q.numerator + '/' + q.denominator
          ),
          witness: proof.witness
            ? proof.witness.numerator + '/' + proof.witness.denominator
            : undefined
        })
      }
    }
  const summary = {
    stage: 'synthetic-mounted-result',
    status: result.status,
    physicalStatus: result.physicalStatus,
    reasons: result.reasons,
    coverage: relations.coverage,
    relationReasons: relations.reasons,
    footExtrusions: relations.footExtrusions.length,
    receipts: result.terrainBindings.map((b) => ({
      event: b.event,
      geometry: b.sourceGeometry,
      supports: b.product.supports.length,
      reasons: b.reasons
    })),
    work: result.work,
    relationWork: relations.work,
    firstVisited: [...first.values()]
  }
  process.stdout.write(JSON.stringify(summary) + '\n')
  const evidenceText = JSON.stringify(summary)
  expect(relations.coverage.required, evidenceText).toBe(
    relations.coverage.strictBounds +
      relations.coverage.exactSeparated +
      relations.coverage.declaredBoundary +
      relations.coverage.blocked +
      relations.coverage.unknown +
      relations.coverage.unvisited
  )
  expect(relations.coverage.candidate, evidenceText).toBe(R * phaseCount)
  expect(relations.coverage.coRigidOwner, evidenceText).toBe(
    sameBodyPairsPerPhase * phaseCount
  )
  expect(relations.coverage.required, evidenceText).toBe(requiredPairs)
  expect(relations.coverage.blocked, evidenceText).toBe(0)
  expect(relations.coverage.unknown, evidenceText).toBe(0)
  expect(relations.coverage.unvisited, evidenceText).toBe(requiredPairs)
  expect(relations.reasons, evidenceText).toContain(
    'nonlinear-phase-cover-incomplete'
  )
  expect(result.work.exactOperations, evidenceText).toBeLessThanOrEqual(
    budget.maxExactPredicates
  )
  expect(result.work.cycleOperations, evidenceText).toBeLessThanOrEqual(
    budget.maxCycleOperations
  )
  expect(relations.work.phaseNodes, evidenceText).toBe(1)
  expect(
    relations.phaseCover.map((cover) => cover.phase),
    evidenceText
  ).toEqual([0])
  expect(relations.work.subdivisions, evidenceText).toBeLessThanOrEqual(
    budget.maxSubdivisions
  )
  expect(relations.work.pairIntervals, evidenceText).toBeLessThanOrEqual(
    budget.maxRegionPairs
  )
  expect(relations.footExtrusions).toHaveLength(6)
  expect(result.terrainBindings).toHaveLength(4)
  expect(
    result.terrainBindings.every(
      (b) => b.sourceGeometry === 'admitted' && b.product.supports.length === 3
    )
  ).toBe(true)
  expect(result.physicalStatus, evidenceText).toBe('unknown')
  expect(result.status, evidenceText).toBe('unknown')
}, 180000)
