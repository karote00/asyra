import { describe, afterEach, expect, it, vi } from 'vitest'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import * as currentMeshIndex from '../mesh-index'
import type { PreparedMeshIndex, MeshIndex } from '../mesh-index'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_LAZY_HIERARCHY_EXPERIMENT === '1')(
  'lazy-hierarchy.test',
  () => {
    // Generic refinement lifetime contract first exercised by the rejected SAH trial.
    // The current API refines components; this probe does not reconstruct SAH.
    const meshIndex = currentMeshIndex as typeof currentMeshIndex & {
      refineMeshIndex: (index: MeshIndex, checkpoint: () => void) => MeshIndex
    }
    type CandidatePreparedIndex = PreparedMeshIndex & {
      refinement?: { index: MeshIndex; work: number }
    }
    const ops = poseOperations(intervalAlgebra)
    const positions: number[] = [],
      indices: number[] = []
    for (let i = 0; i < 16; i++) {
      const x = i / 4,
        n = positions.length / 3
      positions.push(x, 0, 0, x + 1 / 32, 0, 0, x, 1 / 32, 0, x, 0, 1 / 32)
      indices.push(
        ...[0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3].map((value) => value + n)
      )
    }
    const geometry: MeshGeometry = Object.freeze({
      kind: 'mesh',
      version: 1,
      source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
      positions: Object.freeze(positions),
      indices: Object.freeze(indices)
    })
    const shape = (x: number, y = 0) => ({
      geometry,
      pose: ops.fromPose({ position: [x, y, 0], rotation: [0, 0, 0, 1] })
    })
    const query = (
      context: OriginalMeshQuery,
      a = shape(0),
      b = shape(1 / 8)
    ) => context.distance(a, b, 1 / 64, 1e-6, 48)
    afterEach(() => vi.restoreAllMocks())

    it('does not refine root-separated, membership-resolved or exhaustive queries', () => {
      const refine = vi.spyOn(meshIndex, 'refineMeshIndex')
      expect(
        query(new OriginalMeshQuery(), shape(0), shape(0, 10)).lower
      ).toBeGreaterThan(1 / 64)
      const inner = {
        geometry: { kind: 'sphere' as const, radius: 1 / 1024 },
        pose: ops.fromPose({
          position: [1 / 256, 1 / 256, 1 / 256],
          rotation: [0, 0, 0, 1]
        })
      }
      expect(
        new OriginalMeshQuery().distance(shape(0), inner, 1 / 64, 1e-6, 48)
          .penetration
      ).toBe(true)
      query(new OriginalMeshQuery(undefined, 500000, false))
      expect(refine).not.toHaveBeenCalled()
    })

    it('refines one shared geometry for two poses only after admission and charges cold and warm use identically', () => {
      const prepared = new WeakMap<MeshGeometry, CandidatePreparedIndex>()
      const refine = vi.spyOn(meshIndex, 'refineMeshIndex')
      const cold = new OriginalMeshQuery(undefined, 500000, true, prepared)
      const result = query(cold)
      expect(refine).toHaveBeenCalledTimes(1)
      expect(result.penetration).toBe(false)
      expect(result.lower).toBeGreaterThan(1 / 64)
      const warm = new OriginalMeshQuery(undefined, 500000, true, prepared)
      expect(query(warm)).toEqual(result)
      expect(warm.work).toBe(cold.work)
      expect(refine).toHaveBeenCalledTimes(1)
    })

    it('does not charge an unused retained refinement on a root-separated invocation', () => {
      const prepared = new WeakMap<MeshGeometry, CandidatePreparedIndex>()
      query(new OriginalMeshQuery(undefined, 500000, true, prepared))
      const warm = new OriginalMeshQuery(undefined, 500000, true, prepared)
      const cold = new OriginalMeshQuery()
      expect(query(warm, shape(0), shape(0, 10))).toEqual(
        query(cold, shape(0), shape(0, 10))
      )
      expect(warm.work).toBe(cold.work)
    })

    it('does not retain interrupted refinement and retries the complete source construction', () => {
      const prepared = new WeakMap<MeshGeometry, CandidatePreparedIndex>()
      const original = meshIndex.refineMeshIndex
      const refine = vi
        .spyOn(meshIndex, 'refineMeshIndex')
        .mockImplementationOnce((_index, checkpoint) => {
          checkpoint()
          throw new MeshWorkLimit('Interrupted refinement')
        })
      expect(() =>
        query(new OriginalMeshQuery(undefined, 500000, true, prepared))
      ).toThrow('Interrupted refinement')
      expect(prepared.get(geometry)?.refinement).toBeUndefined()
      refine.mockImplementation(original)
      const retry = new OriginalMeshQuery(undefined, 500000, true, prepared)
      expect(query(retry)).toEqual(query(new OriginalMeshQuery()))
      expect(prepared.get(geometry)?.refinement).toBeDefined()
    })
  }
)
