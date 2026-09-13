import { useEvidenceRecomputationControl } from './evidence-recomputation-control'
import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as meshIndex from '../mesh-index'
import type { MeshNode } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import {
  queryOriginalPartPair,
  runOriginalPartMethod
} from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'
import { rotateIndex } from './rotation-index-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'rotation-preparation-profile.test',
  () => {
    // Preserve the historical median-index control instead of applying newer refinement.
    beforeEach(() => {
      useEvidenceRecomputationControl()
      vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
        (index) => index
      )
    })
    afterEach(() => vi.restoreAllMocks())

    it.each([2, 4])(
      'measures fixed source-complete rotation preparation over second %s',
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
            const originalLeaves = new Set<MeshNode>()
            const inspect = (root: MeshNode, leaves: Set<MeshNode>) => {
              const pending = [root],
                seen = new Set<MeshNode>()
              let cost = 0
              while (pending.length) {
                const node = pending.pop()
                if (!node || seen.has(node))
                  throw new Error('Repeated node or cycle')
                seen.add(node)
                if (!node.children) {
                  leaves.add(node)
                  continue
                }
                const [a, b] = node.children
                if (
                  !node.bounds.every(
                    (axis, i) =>
                      axis[0] === Math.min(a.bounds[i][0], b.bounds[i][0]) &&
                      axis[1] === Math.max(a.bounds[i][1], b.bounds[i][1])
                  )
                )
                  throw new Error('Incorrect complete child union')
                const [x, y, z] = node.bounds.map((axis) => axis[1] - axis[0])
                cost += 2 * (x * y + x * z + y * z)
                pending.push(a, b)
              }
              return cost
            }
            const beforeCost = inspect(index.root, originalLeaves)
            const result = rotateIndex(index, () => {
              addedPreparation++
              checkpoint()
            })
            const nextLeaves = new Set<MeshNode>()
            const afterCost = inspect(result.root, nextLeaves)
            expect(afterCost).toBeLessThanOrEqual(
              beforeCost + Math.abs(beforeCost) * 1e-12
            )
            expect(nextLeaves.size).toBe(originalLeaves.size)
            expect(
              [...nextLeaves].every((leaf) => originalLeaves.has(leaf))
            ).toBe(true)
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
            profile: 'single-pass-source-rotation',
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

    it('measures the fixed rotation preparation against the unchanged full representative budget', async () => {
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
            ? rotateIndex(index, () => {
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
          profile: 'full-single-pass-source-rotation',
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
