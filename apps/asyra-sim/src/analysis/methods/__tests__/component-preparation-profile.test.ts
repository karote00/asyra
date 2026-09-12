import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as meshIndex from '../mesh-index'
import type { MeshNode } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import {
  queryOriginalPartPair,
  runOriginalPartMethod
} from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'
import { componentIndex } from './component-index-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'component-preparation-profile.test',
  () => {
    // Historical eager-build control: do not add the accepted demand-time refinement again.
    beforeEach(() => {
      vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
        (index) => index
      )
    })
    afterEach(() => vi.restoreAllMocks())

    it.each([2, 4])(
      'measures fixed source-complete component preparation over second %s',
      async (start) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' &&
            pair.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing measured pair')
        const query = {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: pair.a,
          b: pair.b,
          interval: [start, start + 1] as const
        }
        const settings = {
          threshold: snapshot.rule.minimumClearance,
          ...snapshot.method.settings,
          maxIntervals: snapshot.budget.maxIntervals
        }
        const original = new OriginalMeshQuery()
        const baseline = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          original
        )
        expect(baseline.coverage).toBe('complete')
        let originalPreparation = 0,
          addedPreparation = 0
        const offsets = (node: MeshNode): number[] =>
          node.children
            ? node.children.flatMap(offsets)
            : node.triangles.map((triangle) => triangle.offset)
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
          (mesh, checkpoint, hierarchy) => {
            const index = build(
              mesh,
              () => {
                originalPreparation++
                checkpoint()
              },
              hierarchy
            )
            if (!hierarchy) return index
            const fingerprint = JSON.stringify(index.root)
            const sourceTriangles = (node: MeshNode): typeof node.triangles =>
              node.children
                ? node.children.flatMap(sourceTriangles)
                : node.triangles
            const beforeTriangles = sourceTriangles(index.root)
            const result = componentIndex(index, () => {
              addedPreparation++
              checkpoint()
            })
            expect(new Set(sourceTriangles(result.root))).toEqual(
              new Set(beforeTriangles)
            )
            expect(JSON.stringify(index.root)).toBe(fingerprint)
            expect(offsets(result.root).sort((a, b) => a - b)).toEqual(
              offsets(index.root).sort((a, b) => a - b)
            )
            expect(result.representatives).toBe(index.representatives)
            expect(result.componentCount).toBe(index.componentCount)
            return result
          }
        )
        const context = new OriginalMeshQuery()
        const candidate = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          context
        )
        // eslint-disable-next-line no-console -- fixed immutable partition feasibility includes original and added preparation
        console.info(
          JSON.stringify({
            profile: 'admitted-component-hierarchy',
            start,
            baselineWork: original.work,
            candidateWork: context.work,
            originalPreparation,
            addedPreparation,
            queryWork: context.work - originalPreparation - addedPreparation,
            baselineCoverage: baseline.coverage,
            candidateCoverage: candidate.coverage
          })
        )
        expect(context.work).toBeLessThanOrEqual(500001)
        if (candidate.coverage === 'complete')
          expect(
            candidate.leaves.map((leaf) => [
              leaf.start,
              leaf.end,
              leaf.state,
              leaf.penetration
            ])
          ).toEqual(
            baseline.leaves.map((leaf) => [
              leaf.start,
              leaf.end,
              leaf.state,
              leaf.penetration
            ])
          )
      },
      20000
    )

    it('measures the fixed component preparation against the unchanged full representative budget', async () => {
      const snapshot = await representativeSnapshot(0)
      let originalPreparation = 0,
        addedPreparation = 0,
        builds = 0
      const build = meshIndex.buildMeshIndex
      vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
        (mesh, checkpoint, hierarchy) => {
          builds++
          const index = build(
            mesh,
            () => {
              originalPreparation++
              checkpoint()
            },
            hierarchy
          )
          return hierarchy
            ? componentIndex(index, () => {
                addedPreparation++
                checkpoint()
              })
            : index
        }
      )
      const result = runOriginalPartMethod(snapshot, () => undefined)
      // eslint-disable-next-line no-console -- whole-workload feasibility includes all immutable preparation charges
      console.info(
        JSON.stringify({
          profile: 'full-admitted-component-hierarchy',
          builds,
          originalPreparation,
          addedPreparation,
          evaluations: result.evaluations,
          coverage: result.coverage,
          firstPartial: result.pairs.find(
            (pair) => pair.evidence.coverage === 'partial'
          )?.pairId
        })
      )
      expect(result.pairs).toHaveLength(298)
    }, 20000)
  }
)
