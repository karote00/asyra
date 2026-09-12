import { useEvidenceRecomputationControl } from './evidence-recomputation-control'
import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as meshIndex from '../mesh-index'
import type { MeshNode } from '../mesh-index'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'traversal-order-profile.test',
  () => {
    // Replay this median-index hypothesis without newer demand-time refinement.
    beforeEach(() => {
      useEvidenceRecomputationControl()
      vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
        (index) => index
      )
    })
    afterEach(() => vi.restoreAllMocks())

    it.each([2, 4])(
      'compares complete source traversal order over second %s',
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
        const baselineContext = new OriginalMeshQuery()
        const baseline = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          baselineContext
        )
        let preparation = 0,
          reordering = 0
        const context = new OriginalMeshQuery(() => {
          if (context.work + reordering >= 500000)
            throw new MeshWorkLimit('Combined order diagnostic work exhausted')
        })
        const copy = (node: MeshNode): MeshNode => {
          reordering++
          if (context.work + reordering > 500000)
            throw new MeshWorkLimit('Order preparation exhausted')
          return {
            ...node,
            triangles: [...node.triangles].reverse(),
            children: node.children
              ? [copy(node.children[1]), copy(node.children[0])]
              : undefined
          }
        }
        const offsets = (node: MeshNode): number[] =>
          node.children
            ? node.children.flatMap(offsets)
            : node.triangles.map((triangle) => triangle.offset)
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
          (geometry, checkpoint, hierarchy) => {
            const index = build(
              geometry,
              () => {
                preparation++
                checkpoint()
              },
              hierarchy
            )
            const root = copy(index.root)
            expect(offsets(root).sort((a, b) => a - b)).toEqual(
              offsets(index.root).sort((a, b) => a - b)
            )
            // Bounds, component identities and representatives remain the same objects.
            expect(root.bounds).toBe(index.root.bounds)
            return { ...index, root }
          }
        )
        const candidate = queryOriginalPartPair(
          query,
          settings,
          () => undefined,
          context
        )
        // eslint-disable-next-line no-console -- traversal order is a diagnostic control, not a production strategy
        console.info(
          JSON.stringify({
            profile: 'complete-source-order',
            start,
            baselineWork: baselineContext.work,
            candidateOriginalWork: context.work,
            reordering,
            preparation,
            candidateCombinedWork: context.work + reordering,
            baselineCoverage: baseline.coverage,
            candidateCoverage: candidate.coverage,
            baselineStates: baseline.leaves.map((leaf) => leaf.state),
            candidateStates: candidate.leaves.map((leaf) => leaf.state)
          })
        )
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
  }
)
