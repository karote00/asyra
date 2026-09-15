import { describe, expect, it } from 'vitest'
import { WalkingConstrainedCycleOwner } from '../../domain/walking-constrained-kinematics'
import {
  cycleFixture,
  exact,
  fraction,
  over
} from '../../domain/__tests__/walking-constrained-kinematics-test-fixtures'
import { WalkingSelectedChainRelationOwner } from '../walking-source-relation'

describe('selected-chain source relations', () => {
  it('proves the actual root half-abduction with exhaustive local work', () => {
    const { source, raw } = cycleFixture({
      sourceProfile: 'solid-articulation/2'
    })
    const owner = new WalkingConstrainedCycleOwner(),
      cycle = owner.prepare(source, raw)
    const motion = owner.prepareSelectedChainMotion(cycle, {
      format: 'walking-selected-chain-root-motion/1',
      cycle,
      phase: 0,
      at: fraction(1n, 2n),
      chainId: 'right-front',
      targetAbduction: over(cycle.recipe.alpha, exact(2))
    })
    const relations = new WalkingSelectedChainRelationOwner()
    const current = { owner, cycle }
    const result = relations.prepare(current, {
      format: 'walking-selected-chain-source-relation-request/1',
      motion,
      budget: {
        maxSubdivisions: 30,
        maxRegionPairs: 2000000,
        maxExactPredicates: 5000000,
        maxBits: 24000
      }
    })
    const required =
      motion.parts.reduce((n, p) => n + p.part.regions.length, 0) *
      motion.fixed.parts.reduce((n, p) => n + p.part.regions.length, 0)
    expect(result.coverage.required).toBe(required)
    expect(
      result.coverage.strictBounds +
        result.coverage.exactSeparated +
        result.coverage.declaredBoundary +
        result.coverage.blocked +
        result.coverage.unknown +
        result.coverage.unvisited
    ).toBe(required)
    expect(result.work.rootPartOverlaps).toBeGreaterThan(0)
    expect(result.work.fixedFixedPairs).toBe(0)
    expect(result.work.movingMovingPairs).toBe(0)
    expect(result.work.externalPairs).toBe(0)
    expect(result.work.terrainPairs).toBe(0)
    expect(result.work.exactLeafPairs).toBeLessThan(required)
    expect(
      result.status,
      JSON.stringify({ reasons: result.reasons, work: result.work })
    ).toBe('clear')
    expect(
      result.coverage.blocked +
        result.coverage.unknown +
        result.coverage.unvisited
    ).toBe(0)
    console.info(
      'selected-chain work',
      JSON.stringify({
        required,
        strictBounds: result.coverage.strictBounds,
        exactSeparated: result.coverage.exactSeparated,
        declaredBoundary: result.coverage.declaredBoundary,
        exactLeafPairs: result.work.exactLeafPairs,
        rootPartOverlaps: result.work.rootPartOverlaps,
        nodes: result.work.selectedBoundPreparations,
        selectedBodyVisits: result.work.selectedBodyVisits,
        fixedFramePreparations: result.work.fixedFramePreparations,
        fixedFrameRescales: result.work.evaluator.fixedFrameRescales,
        sourceCertifications: result.work.evaluator.regionPreparations,
        predicates: result.work.evaluator.exactPredicates
      })
    )
    const work = relations.work
    expect(relations.read(current, motion)).toBe(result)
    expect(relations.work).toEqual(work)
    expect(relations.prepare(current, result.request)).toBe(result)
    expect(relations.work).toEqual(work)
    const nextMotion = owner.prepareSelectedChainMotion(cycle, {
      ...motion.recipe,
      targetAbduction: {
        numerator: cycle.recipe.alpha.numerator * 3n,
        denominator: cycle.recipe.alpha.denominator * 4n
      }
    })
    const reused = relations.prepare(current, {
      ...result.request,
      motion: nextMotion
    })
    const fresh = new WalkingSelectedChainRelationOwner().prepare(current, {
      ...result.request,
      motion: nextMotion
    })
    expect(reused.status).toBe('clear')
    expect(reused.coverage).toEqual(fresh.coverage)
    expect(reused.work.evaluator.regionPreparations).toBe(0)
    expect(reused.work.evaluator.sourceCertificationReuses).toBeGreaterThan(0)
    expect(reused.work.evaluator.sourceScalarRebindings).toBeGreaterThan(0)
    expect(reused.work.sourceLocalBoundsVertices).toBe(0)
    expect(reused.work.sourceRegionIndexReads).toBe(0)
    expect(
      result.covers.reduce((n, cover) => n + cover.cardinality, 0) +
        result.pairs.length
    ).toBe(required)
    expect(
      result.pairs.every((pair) =>
        pair.proofs.every((proof) =>
          ['exactSeparated', 'declaredBoundary'].includes(proof.kind)
        )
      )
    ).toBe(true)
    const exhausted = relations.prepare(current, {
      ...result.request,
      budget: { ...result.request.budget, maxExactPredicates: 1 }
    })
    expect(exhausted.status).toBe('unknown')
    expect(exhausted.coverage.unvisited).toBe(required)
    expect(
      exhausted.coverage.strictBounds +
        exhausted.coverage.exactSeparated +
        exhausted.coverage.declaredBoundary
    ).toBe(0)
    expect(
      relations.read(
        { owner: new WalkingConstrainedCycleOwner(), cycle },
        motion
      )
    ).toBeUndefined()
    const replacement = cycleFixture({ sourceProfile: 'solid-articulation/2' })
    const replacementCycle = owner.prepare(replacement.source, replacement.raw)
    expect(relations.read(current, motion)).toBeUndefined()
    const replacementMotion = owner.prepareSelectedChainMotion(
      replacementCycle,
      {
        ...motion.recipe,
        cycle: replacementCycle,
        targetAbduction: over(replacementCycle.recipe.alpha, exact(2))
      }
    )
    const replaced = relations.prepare(
      { owner, cycle: replacementCycle },
      { ...result.request, motion: replacementMotion }
    )
    expect(replaced.status).toBe('clear')
    expect(replaced.work.evaluator.sourceCertificationReuses).toBe(0)
    expect(replaced.work.evaluator.regionPreparations).toBe(
      result.work.evaluator.regionPreparations
    )
    owner.dispose()
    expect(relations.read(current, motion)).toBeUndefined()
  }, 20000)
})
