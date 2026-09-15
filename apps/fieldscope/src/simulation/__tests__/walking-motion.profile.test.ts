import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import {
  prepareQueryExactForwardFrame,
  prepareQueryExactInstanceFrame
} from '../ray-query'
import { add, dyadic, interval, multiply } from '../../domain/scalar-arithmetic'
import { readWalkingNonlinearMotionRequest } from '../../domain/walking-motion-contract'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import { SiteGeometry } from '../../render-app/site-geometry'
import { prepareSceneDemand } from '../scene-demand'
import { WalkingMotionOwner } from '../walking-motion'
import {
  WalkingSourceRelationEvaluator,
  prepareWalkingMountedCrateRelations,
  prepareWalkingNonlinearSourceRelations
} from '../walking-source-relation'
import {
  firstVisitedReason,
  mountedConsumerFixture,
  nonlinearAdd,
  nonlinearDiv,
  nonlinearExact,
  nonlinearFraction,
  nonlinearFixture,
  nonlinearGcd,
  nonlinearMul,
  nonlinearNeg,
  nonlinearRequired,
  nonlinearSub
} from './walking-motion-test-fixtures'
import type { NonlinearFraction } from './walking-motion-test-fixtures'

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

  it('reports the current home-farm plant collision while preserving owned terrain bridges', async (context) => {
    await context.annotate(
      'Starting current home-farm plant collision proof',
      'info'
    )
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
  }, 180000)
})

it('phase-root canonical coverage retains original required pairs without crossing phases', async (context) => {
  await context.annotate(
    'Starting bounded constant-root integration proof',
    'info'
  )
  const f = mountedConsumerFixture()
  const owner = new WalkingMotionOwner({
    getCurrentSceneDemand: () => f.demand,
    getCurrentWalkingRobotSource: () => f.source,
    getCurrentWalkingCycle: () => f.current,
    getCurrentMountedCrate: () => f.mounted
  })
  const result = owner.prepare({
    ...f.raw,
    budget: { ...f.raw.budget, maxPhaseNodes: 2, maxSubdivisions: 1 },
    load: { ...f.raw.load, crate: { kind: 'mounted', artifact: f.crate } }
  })
  if (!('format' in result) || result.format !== 'walking-motion-admission/3')
    throw new Error('Missing canonical nonlinear result')
  const relations = result.sourceRelations
  const selected = relations.phases[0].pairs.filter(
    (p) =>
      relations.inventory[p.first].part?.id === 'lift-rail-negative' &&
      relations.inventory[p.first].region.indexStart === 0 &&
      relations.inventory[p.second].part?.id === 'carriage' &&
      relations.inventory[p.second].region.indexStart === 324
  )
  const summary = JSON.stringify({
    coverage: relations.coverage,
    reasons: relations.reasons,
    selected: selected.map((p) => ({
      kind: p.kind,
      proofs: p.proofs.map((q) => ({
        kind: q.kind,
        low:
          q.parameter.low.numerator.toString() +
          '/' +
          q.parameter.low.denominator.toString(),
        high:
          q.parameter.high.numerator.toString() +
          '/' +
          q.parameter.high.denominator.toString()
      }))
    }))
  })
  process.stdout.write(summary + '\n')
  expect(selected, summary).toHaveLength(1)
  expect(['exactSeparated', 'declaredBoundary']).toContain(selected[0].kind)
  expect(selected[0].proofs).toHaveLength(1)
  expect(selected[0].proofs[0].parameter.low).toEqual({
    numerator: 0n,
    denominator: 1n
  })
  expect(selected[0].proofs[0].parameter.high).toEqual({
    numerator: 1n,
    denominator: 1n
  })
  const c = relations.coverage
  expect(relations.work.globalFixedReuses).toBeGreaterThan(0)
  const phasePair = (phase: number) =>
    relations.phases[phase].pairs.find(
      (p) =>
        relations.inventory[p.first].part?.id === 'left-front-abduction-pin' &&
        relations.inventory[p.first].region.indexStart === 24 &&
        relations.inventory[p.second].part?.id ===
          'left-front-abduction-sleeve' &&
        relations.inventory[p.second].region.indexStart === 36
    )
  const supportPair = phasePair(0),
    swingPair = phasePair(1)
  process.stdout.write(
    JSON.stringify({ phaseRootPairs: [supportPair, swingPair] }, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ) + '\n'
  )
  expect(supportPair?.kind).toBe('exactSeparated')
  expect(supportPair?.proofs).toHaveLength(1)
  expect(supportPair?.proofs[0].parameter).toEqual({
    low: { numerator: 0n, denominator: 1n },
    high: { numerator: 1n, denominator: 1n }
  })
  expect(swingPair?.kind).toBe('unknown')
  expect(
    swingPair?.proofs.some(
      (p) => p.reason === 'nonlinear-source-interval-unproved'
    )
  ).toBe(true)
  expect(c.required).toBe(
    c.strictBounds +
      c.exactSeparated +
      c.declaredBoundary +
      c.blocked +
      c.targetRefinement +
      c.unknown +
      c.unvisited
  )
}, 300000)
it('mounted crate consumer proves every base pair and only original tray contact across the shared phase', async (context) => {
  await context.annotate(
    'Starting mounted crate complete original-region relation proof',
    'info'
  )
  const f = mountedConsumerFixture()
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: 100000,
    maxExactPredicates: 5000000,
    maxBits: 24000
  })
  const relations = prepareWalkingMountedCrateRelations(
    evaluator,
    f.current,
    f.mounted,
    24000
  )
  expect(relations.placement.exact[0].position).toBe(
    f.crate.placement.translation
  )
  for (let axis = 0; axis < 3; axis++) {
    const value = f.crate.placement.translation[axis]
    const exactValue =
      value.exponent >= 0
        ? nonlinearFraction(value.significand << BigInt(value.exponent))
        : nonlinearFraction(value.significand, 1n << BigInt(-value.exponent))
    const bound = relations.placement.bounds[0].position[axis]
    expect(
      nonlinearSub(nonlinearExact(bound.low), exactValue).numerator
    ).toBeLessThanOrEqual(0n)
    expect(
      nonlinearSub(nonlinearExact(bound.high), exactValue).numerator
    ).toBeGreaterThanOrEqual(0n)
  }
  expect(
    relations.placement.bounds[0].position.some((v) => v.low < v.high)
  ).toBe(true)
  const base = nonlinearRequired(
    f.source.rig.bodies.find((b) => b.id === 'base')
  )
  let visited = 0,
    separated = 0,
    boundary = 0
  for (const part of base.parts)
    for (const region of part.regions)
      for (const cp of f.crate.geometry.parts)
        for (const cr of cp.regions) {
          const result = relations.relate(part, region, cp, cr, 0)
          visited++
          if (result?.kind === 'exactSeparated') separated++
          else {
            expect(result?.kind, part.id + ':' + cp.id).toBe('declaredBoundary')
            expect(part).toBe(f.crate.tray)
            expect(cp).toBe(f.crate.geometry.bottomPart)
            expect(result?.boundary?.firstTriangle).toBeGreaterThanOrEqual(24)
            expect(result?.boundary?.firstTriangle).toBeLessThan(30)
            expect(result?.boundary?.secondTriangle).toBeGreaterThanOrEqual(30)
            expect(result?.boundary?.secondTriangle).toBeLessThan(36)
            boundary++
          }
        }
  expect(visited).toBe(
    base.parts.reduce((n, p) => n + p.regions.length, 0) *
      f.crate.geometry.parts.reduce((n, p) => n + p.regions.length, 0)
  )
  expect(visited).toBe(separated + boundary)
  expect(boundary).toBe(1)
  expect(evaluator.work.rationalNodePreparations).toBe(1)
  const before = evaluator.work.transformPreparations
  relations.relate(
    f.crate.tray,
    f.crate.trayPatch.region,
    f.crate.geometry.bottomPart,
    f.crate.geometry.bottomPatch.region,
    0
  )
  expect(evaluator.work.transformPreparations).toBe(before)
  expect(evaluator.work.rationalNodePreparations).toBe(1)
  expect(() =>
    relations.relate(
      { ...f.crate.tray },
      f.crate.trayPatch.region,
      f.crate.geometry.bottomPart,
      f.crate.geometry.bottomPatch.region,
      0
    )
  ).toThrow()
  expect(() =>
    relations.relate(
      f.crate.tray,
      { ...f.crate.trayPatch.region },
      f.crate.geometry.bottomPart,
      f.crate.geometry.bottomPatch.region,
      0
    )
  ).toThrow()
  expect(
    relations.relate(
      f.crate.tray,
      f.crate.trayPatch.region,
      f.crate.geometry.bottomPart,
      f.crate.geometry.bottomPatch.region,
      0.001
    )
  ).toBeUndefined()
  f.mountOwner.clear()
  expect(() =>
    relations.relate(
      f.crate.tray,
      f.crate.trayPatch.region,
      f.crate.geometry.bottomPart,
      f.crate.geometry.bottomPatch.region,
      0
    )
  ).toThrow()
}, 300000)
it('mounted crate consumer keeps real other-base material intersections blocked', async (context) => {
  await context.annotate(
    'Starting mounted crate retained material-overlap proof',
    'info'
  )
  const f = mountedConsumerFixture(0.2)
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: 100000,
    maxExactPredicates: 5000000,
    maxBits: 24000
  })
  const relations = prepareWalkingMountedCrateRelations(
    evaluator,
    f.current,
    f.mounted,
    24000
  )
  const chassis = nonlinearRequired(
    f.source.parts.find((p) => p.id === 'chassis')
  )
  expect(
    chassis.regions.some((region) =>
      f.crate.geometry.parts.some((part) =>
        part.regions.some(
          (r) =>
            relations.relate(chassis, region, part, r, 0)?.kind === 'blocked'
        )
      )
    )
  ).toBe(true)
}, 300000)
describe('canonical nonlinear budgeted canonical cover', () => {
  it('uses the same source-bound cursor in the canonical entry and retains every unvisited phase pair', async (context) => {
    await context.annotate(
      'Starting source-bound canonical cover accounting proof',
      'info'
    )
    const { owner, raw, source, demand, cycleOwner } = nonlinearFixture()
    const product = owner.prepare({
      ...raw,
      budget: { ...raw.budget, maxEnvelopePairs: 1, maxRegionPairs: 1 }
    })
    if (
      !('format' in product) ||
      product.format !== 'walking-motion-admission/3'
    )
      throw new Error('Missing nonlinear cover result')
    const relations = product.sourceRelations
    expect(relations.work.groupPairs).toBe(1)
    expect(relations.work.leafPairs).toBe(0)
    expect(relations.work.pointPreparations).toBe(0)
    expect(relations.work.phaseNodes).toBe(2)
    expect(relations.phaseCover).toHaveLength(2)
    expect(relations.coverage.unvisited).toBeGreaterThan(0)
    expect(product.status).toBe('unknown')
    for (const phase of relations.phases) {
      const whole = nonlinearRequired(
        relations.phaseCover.find((c) => c.phase === phase.phase)
      )
      expect(phase.pairs).toHaveLength(0)
      expect(phase.covers.reduce((sum, c) => sum + c.cardinality, 0)).toBe(
        relations.coverage.required / 2
      )
      for (const cover of phase.covers) {
        expect(cover.bounds).toBe(whole.bounds)
        expect(cover.parameter).toBe(whole.parameter)
        expect(cover.cardinality).toBe(cover.ordinal[1] - cover.ordinal[0])
        expect(cover.first.start + cover.first.count).toBeLessThanOrEqual(
          relations.movingCount
        )
        expect(cover.second.start + cover.second.count).toBeLessThanOrEqual(
          relations.inventory.length
        )
      }
    }
    for (const exclusion of demand.freePassage.exclusions)
      if (exclusion.kind === 'source') {
        const entry = nonlinearRequired(
          relations.inventory.find((input) => input.exclusion === exclusion)
        )
        expect(entry.shape).toBe(exclusion.mesh.descriptor.shape)
        expect(entry.region).toBe(exclusion.region)
      }
    for (const channel of demand.channels) {
      const entry = nonlinearRequired(
        relations.inventory.find((input) => input.owner === channel)
      )
      expect(entry.semantic?.kind).toBe('channel')
      expect(entry.semantic?.bounds).toBe(channel.bounds)
    }
    expect(
      product.terrainBindings.every(
        (binding) =>
          binding.terrainInput === product.request.terrain &&
          binding.product.request === binding.placementRequest
      )
    ).toBe(true)
    const foreign = {
      ...product,
      terrainBindings: [...product.terrainBindings]
    }
    expect(owner.isCurrent(foreign)).toBe(false)
    const work = JSON.stringify(product.work)
    expect(owner.prepare(product.request)).toBe(product)
    expect(JSON.stringify(product.work)).toBe(work)
    expect(product.source).toBe(source)
    cycleOwner.dispose()
    expect(owner.isCurrent(product)).toBe(false)
    expect(owner.read()).toBeUndefined()
  }, 300000)
})
describe('canonical nonlinear first sheet witness', () => {
  it('proves the recorded first sheet collision with independent source halfspace clipping', async (context) => {
    await context.annotate(
      'Starting bounded first sheet source witness',
      'info'
    )
    const { source, demand, cycle, cycleOwner } = nonlinearFixture()
    const parameter = nonlinearFraction(1n, 2n)
    const point = cycleOwner.evaluate(cycle, 0, parameter)
    const robotInventory = source.rig.bodies.flatMap((body) =>
      body.parts.flatMap((part) =>
        part.regions.map((region) => ({ body, part, region }))
      )
    )
    const robot = nonlinearRequired(robotInventory[600])
    expect([
      robot.body.id,
      robot.part.id,
      robot.region.id,
      robot.region.indexStart,
      robot.region.indexCount
    ]).toEqual(['right-front-lower', 'right-front-lower', 'region-0', 0, 36])
    const world = demand.freePassage.exclusions.filter(
      (entry) => entry.kind === 'source'
    )
    const matches = world.filter(
      (entry, index) =>
        robotInventory.length + index === 31903 &&
        entry.region.id === 'region-4' &&
        entry.region.kind === 'sheet' &&
        entry.region.indexStart === 24 &&
        entry.region.indexCount === 6 &&
        entry.transform.instance?.yaw === Math.PI &&
        entry.transform.instance.position.every(
          (value, k) => value === [3.1500000000000004, 0, 24.650000000000002][k]
        )
    )
    expect(matches).toHaveLength(1)
    const selected = nonlinearRequired(matches[0])
    expect(selected.mesh.id).toBe('cucumber-1914-11-2')
    expect(selected.instance).toBe(44)
    const instance = nonlinearRequired(selected.transform.instance)
    expect(selected.transform.descriptor).toBe(selected.mesh.descriptor)
    expect(selected.mesh.regions.includes(selected.region)).toBe(true)
    expect(selected.mesh.descriptor.instances?.[selected.instance]).toBe(
      instance
    )
    const exactFrames = Object.freeze([
      prepareQueryExactInstanceFrame(instance),
      prepareQueryExactForwardFrame(selected.transform.descriptor)
    ])
    const lift = (v: ReturnType<typeof dyadic>) =>
      v.exponent >= 0
        ? nonlinearFraction(v.significand << BigInt(v.exponent))
        : nonlinearFraction(v.significand, 1n << BigInt(-v.exponent))
    const scalar = (n: number) => nonlinearExact(n)
    const zero = scalar(0)
    const oracleWork = {
      arithmeticChecks: 0,
      maxBits: 0,
      maxChecks: 100000,
      bitLimit: 24000
    }
    const check = (...values: bigint[]) => {
      oracleWork.arithmeticChecks++
      for (const value of values) {
        const bits = (value < 0n ? -value : value).toString(2).length
        oracleWork.maxBits = Math.max(oracleWork.maxBits, bits)
        if (
          bits > oracleWork.bitLimit ||
          oracleWork.arithmeticChecks > oracleWork.maxChecks
        )
          throw new Error('Independent sheet witness arithmetic limit')
      }
    }
    const product = (a: bigint, b: bigint) => {
      check(a, b)
      if (
        a &&
        b &&
        (a < 0n ? -a : a).toString(2).length +
          (b < 0n ? -b : b).toString(2).length >
          oracleWork.bitLimit
      )
        throw new Error('Independent sheet witness product limit')
      const result = a * b
      check(result)
      return result
    }
    const plus = (a: NonlinearFraction, b: NonlinearFraction) => {
      const g = nonlinearGcd(a.denominator, b.denominator)
      const n =
        product(a.numerator, b.denominator / g) +
        product(b.numerator, a.denominator / g)
      check(n)
      return nonlinearFraction(n, product(a.denominator / g, b.denominator))
    }
    const minus = (a: NonlinearFraction, b: NonlinearFraction) =>
      plus(a, nonlinearNeg(b))
    const times = (a: NonlinearFraction, b: NonlinearFraction) => {
      const g = nonlinearGcd(a.numerator, b.denominator),
        h = nonlinearGcd(b.numerator, a.denominator)
      return nonlinearFraction(
        product(a.numerator / g, b.numerator / h),
        product(a.denominator / h, b.denominator / g)
      )
    }
    const quotient = (a: NonlinearFraction, b: NonlinearFraction) => {
      if (!b.numerator) throw new Error('Singular witness inverse')
      return times(a, nonlinearFraction(b.denominator, b.numerator))
    }
    const dot = (
      a: readonly NonlinearFraction[],
      b: readonly NonlinearFraction[]
    ) => a.reduce((sum, v, i) => plus(sum, times(v, b[i])), zero)
    const sub = (
      a: readonly NonlinearFraction[],
      b: readonly NonlinearFraction[]
    ) => a.map((v, i) => minus(v, b[i]))
    const cross = (
      a: readonly NonlinearFraction[],
      b: readonly NonlinearFraction[]
    ) =>
      [0, 1, 2].map((i) =>
        minus(
          times(a[(i + 1) % 3], b[(i + 2) % 3]),
          times(a[(i + 2) % 3], b[(i + 1) % 3])
        )
      )
    const affine = (
      matrix: readonly (readonly NonlinearFraction[])[],
      origin: readonly NonlinearFraction[],
      v: readonly NonlinearFraction[]
    ) => matrix.map((row, i) => plus(dot(row, v), origin[i]))
    const bodyFrame = nonlinearRequired(
      point.parts.find((p) => p.part === robot.part)
    ).exact
    const cofactor = [
      cross(bodyFrame.matrix[1], bodyFrame.matrix[2]),
      cross(bodyFrame.matrix[2], bodyFrame.matrix[0]),
      cross(bodyFrame.matrix[0], bodyFrame.matrix[1])
    ]
    const determinant = dot(bodyFrame.matrix[0], cofactor[0])
    expect(determinant.numerator).not.toBe(0n)
    const inverse = (v: readonly NonlinearFraction[]) => {
      const translated = sub(v, bodyFrame.origin)
      return [0, 1, 2].map((k) =>
        quotient(
          dot(
            cofactor.map((row) => row[k]),
            translated
          ),
          determinant
        )
      )
    }
    const original = (
      shape: typeof robot.part.shape,
      start: number,
      count: number
    ) => {
      const offsets = Array.from({ length: count / 3 }, (_, i) => start + 3 * i)
      const indices = [...new Set(shape.indices.slice(start, start + count))]
      const vertices = indices.map((index) => ({
        index,
        coordinates: shape.positions.slice(index * 3, index * 3 + 3),
        exact: shape.positions.slice(index * 3, index * 3 + 3).map(scalar)
      }))
      return {
        vertices,
        triangles: offsets.map((offset) => ({
          offset,
          indices: shape.indices.slice(offset, offset + 3)
        }))
      }
    }
    if (selected.mesh.descriptor.shape.kind !== 'triangles')
      throw new Error('Foreign sheet shape')
    const solid = original(
      robot.part.shape,
      robot.region.indexStart,
      robot.region.indexCount
    )
    const sheet = original(
      selected.mesh.descriptor.shape,
      selected.region.indexStart,
      selected.region.indexCount
    )
    const localPoint = (index: number) =>
      nonlinearRequired(solid.vertices.find((v) => v.index === index)).exact
    const key = (v: readonly NonlinearFraction[]) =>
      v.map((q) => q.numerator + '/' + q.denominator).join(',')
    const edges = new Map<string, number>()
    const planes = solid.triangles.map((triangle) => {
      const vertices = triangle.indices.map(localPoint)
      for (let i = 0; i < 3; i++) {
        const edge = key(vertices[i]) + '>' + key(vertices[(i + 1) % 3])
        edges.set(edge, (edges.get(edge) ?? 0) + 1)
      }
      const normal = cross(
        sub(vertices[1], vertices[0]),
        sub(vertices[2], vertices[0])
      )
      expect(normal.some((v) => v.numerator !== 0n)).toBe(true)
      const distances = solid.vertices.map(
        (v) => dot(normal, sub(v.exact, vertices[0])).numerator
      )
      const negative =
        distances.every((d) => d <= 0n) && distances.some((d) => d < 0n)
      const positive =
        distances.every((d) => d >= 0n) && distances.some((d) => d > 0n)
      expect(negative || positive).toBe(true)
      return {
        origin: vertices[0],
        normal: positive ? normal.map(nonlinearNeg) : normal
      }
    })
    for (const [edge, count] of edges) {
      expect(count).toBe(1)
      expect(edges.get(edge.split('>').reverse().join('>'))).toBe(1)
    }
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 2,
      maxExactPredicates: 5000000,
      maxBits: 24000
    })
    const node = evaluator.prepareRationalNode([bodyFrame], 24000)
    const preparedSolid = evaluator.prepare(robot.part.shape, robot.region)
    const preparedSheet = evaluator.prepare(
      selected.mesh.descriptor.shape,
      selected.region
    )
    expect(preparedSolid.certified).toBe(true)
    const solidPlacement = evaluator.rationalPlacement(preparedSolid, node, 0)
    const sheetPlacement = evaluator.rationalPlacement(
      preparedSheet,
      node,
      -1,
      exactFrames
    )
    const scale = lift(node.scale)
    const worldSheet = sheet.vertices.map((v) => {
      const worldPoint = exactFrames.reduce(
        (p, f) =>
          affine(
            f.matrix.map((row) => row.map(lift)),
            f.position.map(lift),
            p
          ),
        v.exact
      )
      return { ...v, world: worldPoint, solidLocal: inverse(worldPoint) }
    })
    const verifyCompiled = (
      vertices: typeof solid.vertices,
      placement: typeof solidPlacement,
      direct: (v: readonly NonlinearFraction[]) => NonlinearFraction[]
    ) =>
      vertices.map((v) => {
        const expected = direct(v.exact)
        const compiled = placement.frames
          .reduce(
            (p, f) =>
              affine(
                f.matrix.map((row) => row.map(lift)),
                f.position.map(lift),
                p
              ),
            v.exact
          )
          .map((q) => quotient(q, scale))
        expect(compiled).toEqual(expected)
        return { index: v.index, world: expected, compiledWorld: compiled }
      })
    const solidCoordinates = verifyCompiled(
      solid.vertices,
      solidPlacement,
      (v) => affine(bodyFrame.matrix, bodyFrame.origin, v)
    )
    const sheetCoordinates = verifyCompiled(
      sheet.vertices,
      sheetPlacement,
      (v) =>
        exactFrames.reduce(
          (p, f) =>
            affine(
              f.matrix.map((row) => row.map(lift)),
              f.position.map(lift),
              p
            ),
          [...v]
        )
    )
    const outcomes = sheet.triangles.map((triangle) => {
      let polygon = triangle.indices.map(
        (index) =>
          nonlinearRequired(worldSheet.find((v) => v.index === index))
            .solidLocal
      )
      const initial = polygon
      expect(
        cross(sub(polygon[1], polygon[0]), sub(polygon[2], polygon[0])).some(
          (v) => v.numerator !== 0n
        )
      ).toBe(true)
      for (const plane of planes) {
        const next: NonlinearFraction[][] = []
        for (let i = 0; i < polygon.length; i++) {
          const a = polygon[i],
            b = polygon[(i + 1) % polygon.length]
          const da = dot(plane.normal, sub(a, plane.origin)),
            db = dot(plane.normal, sub(b, plane.origin))
          if (da.numerator <= 0n) next.push(a)
          if (
            (da.numerator < 0n && db.numerator > 0n) ||
            (da.numerator > 0n && db.numerator < 0n)
          ) {
            const t = quotient(da, minus(da, db))
            next.push(a.map((v, k) => plus(v, times(t, minus(b[k], v)))))
          }
        }
        polygon = next
      }
      const triangleNormal = cross(
        sub(initial[1], initial[0]),
        sub(initial[2], initial[0])
      )
      for (const v of polygon) {
        expect(
          planes.every((p) => dot(p.normal, sub(v, p.origin)).numerator <= 0n)
        ).toBe(true)
        expect(dot(triangleNormal, sub(v, initial[0])).numerator).toBe(0n)
        for (let i = 0; i < 3; i++) {
          const side = cross(
            triangleNormal,
            sub(initial[(i + 1) % 3], initial[i])
          )
          expect(dot(side, sub(v, initial[i])).numerator >= 0n).toBe(true)
        }
        const roundtrip = inverse(affine(bodyFrame.matrix, bodyFrame.origin, v))
        expect(roundtrip).toEqual(v)
      }
      const centroid = polygon.length
        ? [0, 1, 2].map((k) =>
            quotient(
              polygon.reduce((sum, v) => plus(sum, v[k]), zero),
              scalar(polygon.length)
            )
          )
        : null
      const strictInterior =
        centroid !== null &&
        planes.every(
          (p) => dot(p.normal, sub(centroid, p.origin)).numerator < 0n
        )
      const result = evaluator.relateRationalSheetTriangle(
        solidPlacement,
        sheetPlacement,
        node,
        triangle.offset
      )
      expect(result.kind).toBe(
        polygon.length ? 'surface-intersection' : 'separated'
      )
      return {
        triangleOffset: triangle.offset,
        originalIndices: triangle.indices,
        originalInSolidFrame: initial,
        clippedLocus: polygon,
        centroid,
        strictInterior,
        production: result
      }
    })
    const intersections = outcomes.filter((r) => r.clippedLocus.length)
    const artifact = {
      format: 'walking-sheet-source-witness/1',
      phase: 0,
      parameter,
      authority:
        'Independent original-source convex halfspace clipping after exact rational inverse placement',
      originalEvidence: 'test-supervision/1789419134707693000-28803',
      identities: {
        sourceDefinition: source.definition.definitionId,
        profile: source.definition.sourceModel.kind,
        sourceCurrent: cycleOwner.read(source, cycle.recipe) === cycle,
        pointSourceCurrent: point.source === source,
        pointRecipeCurrent: point.recipe === cycle.recipe,
        exactPartCurrent: point.parts.some(
          (p) => p.part === robot.part && p.exact === bodyFrame
        ),
        exclusionCurrent: demand.freePassage.exclusions.includes(selected),
        descriptorCurrent:
          selected.transform.descriptor === selected.mesh.descriptor,
        instanceCurrent:
          selected.mesh.descriptor.instances?.[selected.instance] === instance,
        regionCurrent: selected.mesh.regions.includes(selected.region)
      },
      first: {
        inventoryIndex: 600,
        bodyId: robot.body.id,
        partId: robot.part.id,
        region: robot.region,
        original: solid,
        exactFrame: bodyFrame,
        certifiedSourcePlanes: planes,
        coordinates: solidCoordinates
      },
      second: {
        inventoryIndex: 31903,
        meshId: selected.mesh.id,
        layer: selected.mesh.layer,
        instanceIndex: selected.instance,
        instance,
        region: selected.region,
        descriptor: {
          position: selected.mesh.descriptor.position,
          rotation: selected.mesh.descriptor.rotation,
          color: selected.mesh.descriptor.color,
          roughness: selected.mesh.descriptor.roughness,
          metalness: selected.mesh.descriptor.metalness,
          surface: selected.mesh.descriptor.surface
        },
        shapeDigest: createHash('sha256')
          .update(JSON.stringify(selected.mesh.descriptor.shape))
          .digest('hex'),
        original: sheet,
        exactFrames,
        coordinates: sheetCoordinates
      },
      outcomes,
      oracleWork,
      productWork: evaluator.work
    }
    if (process.env.CAPTURE_SHEET_WITNESS === '1')
      writeFileSync(
        new URL(
          '../../../.artifacts/first-blocked-sheet-witness.json',
          import.meta.url
        ),
        JSON.stringify(
          artifact,
          (_key, v) => (typeof v === 'bigint' ? v.toString() : v),
          2
        ) + '\n',
        { flag: 'wx' }
      )
    process.stdout.write(
      JSON.stringify({
        sheetWitness: {
          mesh: selected.mesh.id,
          layer: selected.mesh.layer,
          instance: selected.instance,
          triangleOffsets: intersections.map((v) => v.triangleOffset),
          strictInterior: intersections.map((v) => v.strictInterior),
          oracleWork,
          productPredicates: evaluator.work.exactPredicates
        }
      }) + '\n'
    )
    expect(
      Object.values(artifact.identities)
        .filter((v) => typeof v === 'boolean')
        .every(Boolean)
    ).toBe(true)
    expect(outcomes.map((value) => value.triangleOffset)).toEqual([24, 27])
    expect(
      outcomes.every(
        (value) =>
          value.clippedLocus.length > 0 && value.strictInterior === true
      )
    ).toBe(true)
  }, 300000)
})
describe('canonical nonlinear retained profile1 collision', () => {
  it('retains the two reported material overlaps under the unchanged profile1 exact cycle frame', async (context) => {
    await context.annotate(
      'Starting retained profile1 original-material overlap proof',
      'info'
    )
    const { source, cycle, cycleOwner } = nonlinearFixture(
      'solid-articulation/1'
    )
    expect(source.definition.sourceModel.kind).toBe('solid-articulation/1')
    const parameter = nonlinearFraction(1n, 2n)
    const evaluated = cycleOwner.evaluate(cycle, 0, parameter)
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 2,
      maxExactPredicates: 5000000,
      maxBits: 24000
    })
    const frames = [
      ...evaluated.parts.map((p) => p.exact),
      ...evaluated.bodies.map((b) => b.exact)
    ]
    const node = evaluator.prepareRationalNode(frames, 24000)
    const fromDyadic = (v: ReturnType<typeof dyadic>) =>
      v.exponent >= 0
        ? nonlinearFraction(v.significand << BigInt(v.exponent))
        : nonlinearFraction(v.significand, 1n << BigInt(-v.exponent))
    const scale = fromDyadic(node.scale)
    const inputs = [
      ['chassis', 'region-1'],
      ['right-front-coxa', 'region-0'],
      ['right-rear-coxa', 'region-0']
    ].map(([partId, regionId]) => {
      const part = nonlinearRequired(source.parts.find((p) => p.id === partId))
      const region = nonlinearRequired(
        part.regions.find((r) => r.id === regionId)
      )
      const frameIndex = evaluated.parts.findIndex((p) => p.part === part)
      const exact = nonlinearRequired(evaluated.parts[frameIndex]).exact,
        compiled = node.frames[frameIndex]
      const offsets = Array.from(
        { length: region.indexCount / 3 },
        (_, i) => region.indexStart + i * 3
      )
      const indices = [
        ...new Set(
          offsets.flatMap((offset) =>
            part.shape.indices.slice(offset, offset + 3)
          )
        )
      ]
      const vertices = indices.map((index) => {
        const coordinates = part.shape.positions.slice(index * 3, index * 3 + 3)
        const original = coordinates.map(nonlinearExact)
        const world = exact.origin.map((v, k) =>
          exact.matrix[k].reduce(
            (sum, q, j) => nonlinearAdd(sum, nonlinearMul(q, original[j])),
            v
          )
        )
        const lifted = compiled.position.map((v, k) =>
          nonlinearDiv(
            compiled.matrix[k].reduce(
              (sum, q, j) =>
                nonlinearAdd(sum, nonlinearMul(fromDyadic(q), original[j])),
              fromDyadic(v)
            ),
            scale
          )
        )
        return {
          index,
          coordinates,
          original,
          world,
          lifted,
          equals: world.every(
            (v, k) =>
              v.numerator === lifted[k].numerator &&
              v.denominator === lifted[k].denominator
          )
        }
      })
      const prepared = evaluator.prepare(part.shape, region)
      return {
        part,
        region,
        frameIndex,
        exact,
        compiled,
        vertices,
        prepared,
        placement: evaluator.rationalPlacement(prepared, node, frameIndex),
        triangles: offsets.map((offset) => ({
          offset,
          indices: part.shape.indices.slice(offset, offset + 3)
        }))
      }
    })
    const secondInputs = inputs.slice(1)
    const results = secondInputs.map((input) => ({
      first: inputs[0].part.id,
      second: input.part.id,
      relation: evaluator.relateRational(
        inputs[0].placement,
        input.placement,
        node,
        0
      ),
      overlapDepth: null,
      depthReason:
        'The relation API does not publish quantitative overlap depth'
    }))
    const artifact = {
      format: 'walking-nonlinear-midpoint-witness/1',
      originalRun: '2026-09-15 00:22:31 - terminal session 25352',
      phase: 0,
      parameter,
      alpha: cycle.recipe.alpha,
      definitionId: source.definition.definitionId,
      sourceCurrent: cycleOwner.read(source, cycle.recipe) === cycle,
      pointSourceCurrent: evaluated.source === source,
      pointRecipeCurrent: evaluated.recipe === cycle.recipe,
      scale: node.scale,
      worldMargin: 0,
      coordinateAuthority:
        'Independent rational affine evaluation equals homogeneous placement divided by its common positive scale',
      inputs: inputs.map((input) => ({
        partId: input.part.id,
        bodyId: input.part.bodyId,
        region: input.region,
        frameIndex: input.frameIndex,
        exact: input.exact,
        compiled: input.compiled,
        vertices: input.vertices,
        triangles: input.triangles,
        closedConvex: input.prepared.certified
      })),
      results,
      work: evaluator.work,
      recoveredPairCount: 2,
      originalReportedBlockedCount: 6
    }
    const message = JSON.stringify(artifact, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
    expect(
      artifact.sourceCurrent &&
        artifact.pointSourceCurrent &&
        artifact.pointRecipeCurrent,
      message
    ).toBe(true)
    expect(
      inputs.every((input) => input.vertices.every((v) => v.equals)),
      message
    ).toBe(true)
    expect(evaluator.work.rationalNodePreparations, message).toBe(1)
    expect(
      results.every((result) => result.relation.kind === 'volume-overlap'),
      message
    ).toBe(true)
  }, 300000)
})
