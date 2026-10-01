import { describe, expect, it } from 'vitest'
import { WalkingSourceRelationEvaluator } from '../walking-source-relation'
import {
  firstVisitedReason,
  nonlinearFixture,
  nonlinearRequired
} from './walking-motion-test-fixtures'

describe('canonical nonlinear offline geometry profiles', () => {
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
