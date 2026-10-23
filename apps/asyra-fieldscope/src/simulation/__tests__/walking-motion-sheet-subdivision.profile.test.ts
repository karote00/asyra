import { describe, expect, it } from 'vitest'
import { add, interval, multiply } from '../../domain/scalar-arithmetic'
import { readWalkingNonlinearMotionRequest } from '../../domain/walking-motion-contract'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import { SiteGeometry } from '../../render-app/site-geometry'
import { prepareSceneDemand } from '../scene-demand'
import { prepareWalkingNonlinearSourceRelations } from '../walking-source-relation'
import {
  firstVisitedReason,
  nonlinearExact,
  nonlinearFixture,
  nonlinearRequired
} from './walking-motion-test-fixtures'

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
})
