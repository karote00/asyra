import { describe, expect, it } from 'vitest'
import { add, interval, multiply } from '../../domain/scalar-arithmetic'
import { readWalkingNonlinearMotionRequest } from '../../domain/walking-motion-contract'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import { SiteGeometry } from '../../render-app/site-geometry'
import { prepareSceneDemand } from '../scene-demand'
import { WalkingMotionOwner } from '../walking-motion'
import {
  WalkingSourceRelationEvaluator,
  prepareWalkingNonlinearSourceRelations
} from '../walking-source-relation'
import {
  firstVisitedReason,
  mountedConsumerFixture,
  nonlinearExact,
  nonlinearFixture,
  nonlinearRequired
} from './walking-motion-test-fixtures'

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

describe('canonical nonlinear offline geometry profiles', () => {
  it('subdivides a pending original sheet region through the canonical phase queue and cover', async (context) => {
    await context.annotate(
      'Starting bounded canonical sheet interval proof',
      'info'
    )
    const fixture = nonlinearFixture('solid-articulation/2', true)
    const { source, cycle, cycleOwner } = fixture
    const half = { numerator: 1n, denominator: 2n }
    const parameters = [
      { low: nonlinearExact(0), high: nonlinearExact(1) },
      { low: nonlinearExact(0), high: half },
      { low: half, high: nonlinearExact(1) }
    ]
    const bounds = parameters.map((p) => cycleOwner.bound(cycle, 0, p))
    const part = nonlinearRequired(source.parts.find((p) => p.id === 'chassis'))
    const frameBounds = bounds.map(
      (b) => nonlinearRequired(b.parts.find((p) => p.part === part)).bounds
    )
    const candidates = part.regions.flatMap((region) => {
      const indices = [
        ...new Set(
          part.shape.indices.slice(
            region.indexStart,
            region.indexStart + region.indexCount
          )
        )
      ]
      const boxes = frameBounds.map((frame) => {
        const points = indices.map((index) =>
          frame.origin.map((origin, k) =>
            frame.matrix[k].reduce(
              (sum, q, j) =>
                add(
                  sum,
                  multiply(q, interval(part.shape.positions[index * 3 + j]))
                ),
              origin
            )
          )
        )
        return {
          min: [0, 1, 2].map((k) => Math.min(...points.map((p) => p[k].low))),
          max: [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k].high)))
        }
      })
      const parent = boxes[0]
      return [0, 1, 2, 3, 4, 5, 6, 7].flatMap((corner) => {
        // A small triangle lies strictly inside the parent box but outside both
        // half-interval boxes. This chooses an enclosure regression, not a route.
        const p = [0, 1, 2].map((k) =>
          corner & (1 << k) ? parent.max[k] : parent.min[k]
        )
        const gaps = boxes
          .slice(1)
          .map((b) =>
            Math.max(
              ...[0, 1, 2].map((k) =>
                Math.max(b.min[k] - p[k], p[k] - b.max[k])
              )
            )
          )
        const radius =
          Math.min(
            ...gaps,
            ...[0, 1, 2].map((k) => parent.max[k] - parent.min[k])
          ) / 8
        if (!(radius > 0)) return []
        const centre = p.map(
          (v, k) => v + (corner & (1 << k) ? -radius : radius)
        )
        const positions = [
          ...centre,
          ...centre.map((v, k) => v + (k === 0 ? radius / 4 : 0)),
          ...centre.map((v, k) => v + (k === 2 ? radius / 4 : 0))
        ]
        return [{ region, positions }]
      })
    })
    const selected = nonlinearRequired(candidates[0])
    const descriptor = readSpatialDescriptor({
      kind: 'mesh',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      shape: {
        kind: 'triangles',
        positions: selected.positions,
        indices: [0, 1, 2]
      },
      color: 0,
      opacity: 1,
      wireframe: false,
      selectable: false
    })
    if (descriptor.kind !== 'mesh')
      throw new Error('Expected admitted sheet mesh')
    const geometry = new SiteGeometry()
    const scene = geometry.prepareScene(fixture.demand.farm, [
      ...fixture.demand.scene.meshes,
      {
        id: 'queue-sheet',
        layer: 'net',
        visible: true,
        descriptor,
        regions: [
          {
            id: 'queue-original-sheet',
            kind: 'sheet',
            indexStart: 0,
            indexCount: 3
          }
        ]
      }
    ])
    const demand = prepareSceneDemand(
      fixture.demand.farm,
      scene,
      fixture.demand.configuration
    )
    expect(
      demand.freePassage.exclusions.some(
        (e) => e.kind === 'source' && e.region.id === 'queue-original-sheet'
      )
    ).toBe(true)
    const movingRegions = source.parts.reduce(
      (sum, p) => sum + p.regions.length,
      0
    )
    const worldRegionUpper =
      demand.freePassage.exclusions.length +
      demand.channels.length +
      fixture.raw.externalSources.reduce(
        (sum, s) => sum + s.regions.length,
        0
      ) +
      fixture.raw.terrain.regions.length
    const originalPairUpper =
      (movingRegions * (movingRegions - 1)) / 2 +
      movingRegions * worldRegionUpper
    // Every nonempty hierarchy owner and shape owns at least one original region:
    // G <= owners + shapes + regions <= 3*(M+W). Only the two root phases build cursors.
    const groupUpper = 3 * (movingRegions + worldRegionUpper)
    const gateBudget = {
      ...fixture.raw.budget,
      maxPhaseNodes: 6,
      maxSubdivisions: 2,
      maxRegionPairs: 6 * originalPairUpper,
      maxEnvelopePairs: 2 * groupUpper * groupUpper,
      maxExactPredicates: 30000000
    }
    expect(
      Object.values(gateBudget).every((v) => Number.isSafeInteger(v) && v > 0)
    ).toBe(true)
    const current = { owner: cycleOwner, cycle }
    const request = readWalkingNonlinearMotionRequest(
      {
        ...fixture.raw,
        demand,
        budget: gateBudget,
        terrain: { ...fixture.raw.terrain, sceneRevision: scene.revision }
      },
      source,
      demand,
      current
    )
    process.stdout.write(
      JSON.stringify({
        stage: 'sheet-queue-preflight',
        M: movingRegions,
        W: worldRegionUpper,
        R: originalPairUpper,
        G: groupUpper,
        caps: gateBudget
      }) + '\n'
    )
    const result = prepareWalkingNonlinearSourceRelations(request, current)
    const first = result.inventory.findIndex(
      (p) => p.part === part && p.region === selected.region
    )
    const second = result.inventory.findIndex(
      (p) => p.region.id === 'queue-original-sheet'
    )
    const pair = result.phases[0].pairs.find(
      (p) => p.first === first && p.second === second
    )
    const summary = JSON.stringify({
      target: {
        first,
        second,
        part: part.id,
        region: selected.region.id,
        kind: pair?.kind,
        proofs: pair?.proofs.map((p) => ({
          kind: p.kind,
          reason: p.reason,
          parameter: [p.parameter.low, p.parameter.high].map(
            (q) => q.numerator + '/' + q.denominator
          )
        }))
      },
      caps: gateBudget,
      inventory: {
        movingRegions,
        worldRegionUpper,
        originalPairUpper,
        groupUpper
      },
      work: {
        phaseNodes: result.work.phaseNodes,
        subdivisions: result.work.subdivisions,
        pairIntervals: result.work.pairIntervals,
        groupPairs: result.work.groupPairs,
        exactPredicates: result.work.kernel.exactPredicates,
        exclusiveKernelStages: result.work.kernel.stages,
        maxRationalBitsRequired: result.work.kernel.maxRationalBitsRequired,
        requiredBitsByStage: result.work.kernel.requiredBitsByStage,
        cycleOperations: result.work.cycleOperations,
        sheetRequired: result.work.sheetTriangleRequired,
        sheetVisited: result.work.sheetTriangleIntervals,
        sheetUnvisited: result.work.sheetTriangleUnvisited
      },
      coverage: result.coverage,
      firstVisitedReasons: firstVisitedReason(
        result.phases.flatMap((p) => p.pairs)
      )
        .slice(0, 6)
        .map((v) => ({
          first: v.row.first,
          second: v.row.second,
          kind: v.proof.kind,
          reason: v.proof.reason
        }))
    })
    process.stdout.write(
      '{"stage":"sheet-queue-result","result":' + summary + '}\n'
    )
    expect(pair, summary).toBeDefined()
    const complete = nonlinearRequired(pair)
    expect(['strictBounds', 'exactSeparated'], summary).toContain(complete.kind)
    expect(complete.proofs, summary).toHaveLength(2)
    expect(
      complete.proofs.map((p) => p.parameter),
      summary
    ).toEqual([
      { low: parameters[1].low, high: parameters[1].high },
      { low: parameters[2].low, high: parameters[2].high }
    ])
    expect(
      complete.proofs.every(
        (p) => p.kind === 'strictBounds' || p.kind === 'exactSeparated'
      ),
      summary
    ).toBe(true)
    expect(result.work.subdivisions, summary).toBeGreaterThan(0)
    expect(result.work.sheetTriangleRequired, summary).toBe(
      result.work.sheetTriangleIntervals + result.work.sheetTriangleUnvisited
    )
    const c = result.coverage
    expect(c.required, summary).toBe(
      c.strictBounds +
        c.exactSeparated +
        c.declaredBoundary +
        c.blocked +
        c.targetRefinement +
        c.unknown +
        c.unvisited
    )
  }, 180000)

  it('reports the current home-farm plant collision while preserving owned terrain bridges', () => {
    const { owner, raw, cycle } = nonlinearFixture()
    const result = owner.prepare(raw)
    const relations = result.sourceRelations
    const exactWork = relations.work.kernel
    expect(exactWork.axisCandidates).toBe(
      exactWork.normalAxisCandidates + exactWork.crossAxisCandidates
    )
    expect(exactWork.axisCandidates).toBeGreaterThanOrEqual(
      exactWork.uniqueAxes + exactWork.duplicateAxes + exactWork.zeroAxes
    )
    expect(
      exactWork.axisPreparationOperations +
        exactWork.axisProjectionOperations +
        exactWork.axisConstraintOperations
    ).toBeLessThanOrEqual(exactWork.rationalArithmeticOperations)
    const unresolved = relations.phases.flatMap((phase) =>
      phase.pairs
        .filter((pair) =>
          ['blocked', 'unknown', 'unvisited'].includes(pair.kind)
        )
        .map((pair) => ({
          phase: phase.phase,
          kind: pair.kind,
          first: {
            part: relations.inventory[pair.first].part?.id,
            region: relations.inventory[pair.first].region.id
          },
          second: {
            part: relations.inventory[pair.second].part?.id,
            region: relations.inventory[pair.second].region.id
          },
          reasons: [
            ...new Set(pair.proofs.flatMap((p) => (p.reason ? [p.reason] : [])))
          ]
        }))
    )
    const observedRows = relations.phases.flatMap((phase) =>
      phase.pairs.map((pair) => ({ ...pair, phase: phase.phase }))
    )
    const provenance = (index: number) => {
      const entry = relations.inventory[index]
      return {
        inventoryIndex: index,
        ownerOrdinal: relations.inventory.findIndex(
          (v) => v.owner === entry.owner
        ),
        shapeOrdinal: relations.inventory.findIndex(
          (v) => v.shape === entry.shape
        ),
        body: entry.body?.id,
        part: entry.part?.id,
        holder: entry.holderBodyId,
        region: entry.region,
        terrainId: entry.terrain?.id,
        terrainClassification: entry.terrain?.classification,
        semantic: entry.semantic,
        localFrames: entry.localFrames,
        sourceCurrent: entry.part
          ? result.source.parts.includes(entry.part)
          : null,
        certificationFailureClassification: 'unavailable'
      }
    }
    expect(relations.source).toBe(result.source)
    expect(relations.cycle).toBe(result.cycle)
    expect(relations.request).toBe(result.request)
    const visitedByReason = firstVisitedReason(observedRows).map(
      ({ row, proof }) => ({
        phase: row.phase,
        kind: row.kind,
        reason: proof.reason,
        parameter: proof.parameter,
        witness: proof.witness,
        first: provenance(row.first),
        second: provenance(row.second)
      })
    )
    const receiptSummary = result.terrainBindings.map((binding) => ({
      event: binding.event,
      status: binding.sourceGeometry,
      reasons: binding.reasons,
      sameRequest: binding.request === result.request,
      sameCycle: binding.cycle === result.cycle,
      sameInputTerrain: binding.terrainInput === result.request.terrain,
      sameInputPartition:
        binding.partitionInput === result.request.externalSources,
      sameReturnedRequest: binding.product.request === binding.placementRequest,
      supports: binding.product.supports.map((v) => ({
        part: v.part.id,
        patch: v.patch.id,
        status: v.sourceGeometry.status
      }))
    }))
    const summary = JSON.stringify(
      {
        visitedByReason,
        receiptSummary,
        sharedExactWork: {
          used: result.work.exactOperations,
          cap: result.request.budget.maxExactPredicates,
          remainder:
            result.request.budget.maxExactPredicates -
            result.work.exactOperations,
          horizontalPlaneFailureClassification: 'unavailable'
        },
        coverage: relations.coverage,
        work: relations.work,
        firstUnresolved: unresolved.slice(0, 4),
        reasons: relations.reasons
      },
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value)
    )
    expect(relations.footExtrusions, summary).toHaveLength(6)
    expect(relations.coverage.blocked, summary).toBeGreaterThanOrEqual(1)
    expect(result.status, summary).toBe('blocked')
    const plantCollision = observedRows.find(
      (row) =>
        row.phase === 0 &&
        row.kind === 'blocked' &&
        row.first === 600 &&
        row.second === 31903 &&
        row.proofs.some(
          (proof) =>
            proof.kind === 'blocked' &&
            proof.reason === 'source-sheet-surface-intersection' &&
            proof.sheetTriangle?.inventoryIndex === 31903 &&
            proof.sheetTriangle.triangleOffset === 24
        )
    )
    expect(plantCollision, summary).toBeDefined()
    if (!plantCollision)
      throw new Error('Missing current home-farm plant collision')
    const plantProof = plantCollision.proofs.find(
      (proof) =>
        proof.kind === 'blocked' &&
        proof.reason === 'source-sheet-surface-intersection' &&
        proof.sheetTriangle?.triangleOffset === 24
    )
    expect(plantProof?.witness, summary).toEqual({
      numerator: 1n,
      denominator: 2n
    })
    expect(plantProof?.sheetTriangle, summary).toEqual({
      inventoryIndex: 31903,
      triangleOffset: 24
    })
    const robotPart = relations.inventory[plantCollision.first]
    const plantSheet = relations.inventory[plantCollision.second]
    expect(robotPart.body?.id, summary).toBe('right-front-lower')
    expect(robotPart.part?.id, summary).toBe('right-front-lower')
    expect(robotPart.region, summary).toMatchObject({
      id: 'region-0',
      kind: 'closed-solid',
      indexStart: 0,
      indexCount: 36
    })
    expect(
      robotPart.part && result.source.parts.includes(robotPart.part),
      summary
    ).toBe(true)
    expect(plantSheet.exclusion?.mesh.id, summary).toBe('cucumber-1914-11-2')
    expect(plantSheet.exclusion?.instance, summary).toBe(44)
    expect(plantSheet.region, summary).toMatchObject({
      id: 'region-4',
      kind: 'sheet',
      indexStart: 24,
      indexCount: 6
    })
    expect(plantSheet.exclusion?.region, summary).toBe(plantSheet.region)
    expect(
      plantSheet.exclusion &&
        result.demand.freePassage.exclusions.includes(plantSheet.exclusion),
      summary
    ).toBe(true)
    expect(
      relations.coverage.unknown + relations.coverage.unvisited,
      summary
    ).toBeGreaterThan(0)
    expect(result.work.exactOperations, summary).toBeLessThanOrEqual(
      raw.budget.maxExactPredicates
    )
    expect(result.work.cycleOperations, summary).toBeLessThanOrEqual(
      raw.budget.maxCycleOperations
    )
    expect(relations.work.phaseNodes, summary).toBeLessThanOrEqual(
      raw.budget.maxPhaseNodes
    )
    expect(relations.work.subdivisions, summary).toBeLessThanOrEqual(
      raw.budget.maxSubdivisions
    )
    expect(result.format).toBe('walking-motion-admission/3')
    expect(result.cycle).toBe(cycle)
    expect(result.terrainBindings).toHaveLength(4)
    expect(result.phaseCover).toHaveLength(2)
    expect(
      result.terrainBindings.map((binding) => ({
        status: binding.sourceGeometry,
        reasons: binding.reasons
      }))
    ).toEqual(
      Array.from({ length: 4 }, () => ({ status: 'admitted', reasons: [] }))
    )
    expect(result.work.terrainPreparations).toBe(4)
    expect(result.work.endpointPreparations).toBe(3)
    expect(result.work.phaseBoundPreparations).toBe(2)
    const copies = new Set(
      result.terrainBindings.map((binding) => binding.product.request?.terrain)
    )
    expect(copies.size).toBe(4)
    for (const binding of result.terrainBindings) {
      expect(binding.terrainInput).toBe(result.request.terrain)
      expect(binding.partitionInput).toBe(result.request.externalSources)
      expect(binding.product.request).toBe(binding.placementRequest)
      expect(binding.product.request?.terrain).not.toBe(binding.terrainInput)
    }
    const preparations = owner.work.preparations
    expect(owner.prepare(result.request)).toBe(result)
    expect(owner.work.preparations).toBe(preparations)
    expect(
      owner.isCurrent({
        ...result,
        terrainBindings: [...result.terrainBindings]
      })
    ).toBe(false)
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 100,
      maxExactPredicates: 5000000,
      maxBits: 24000
    })
    const endpoint = nonlinearRequired(result.terrainBindings[0].endpoint)
    const node = evaluator.prepareRationalNode(
      endpoint.parts.map((part) => part.exact),
      24000
    )
    expect(node.frames).toHaveLength(endpoint.parts.length)
    expect(evaluator.work.rationalNodePreparations).toBe(1)
    expect(result.sourceRelations.coverage.required).toBeGreaterThan(0)
    expect(result.sourceRelations.coverage.candidate).toBe(
      result.sourceRelations.coverage.coRigidOwner +
        result.sourceRelations.coverage.required
    )
    expect(result.sourceRelations.coverage.required).toBe(
      result.sourceRelations.coverage.strictBounds +
        result.sourceRelations.coverage.exactSeparated +
        result.sourceRelations.coverage.declaredBoundary +
        result.sourceRelations.coverage.blocked +
        result.sourceRelations.coverage.unknown +
        result.sourceRelations.coverage.unvisited
    )
    expect(result.status).not.toBe('clear') // Explicit missing crate inventory is never cleared.
  }, 30000)
})
