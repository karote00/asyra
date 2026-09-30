import { afterEach, expect, it, vi } from 'vitest'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import * as currentMeshIndex from '../mesh-index'
import type { PreparedMeshIndex, MeshIndex } from '../mesh-index'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'

// Formal new-owner contract; the absent candidate API must fail before implementation.
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
const query = (context: OriginalMeshQuery, a = shape(0), b = shape(1 / 8)) =>
  context.distance(a, b, 1 / 64, 1e-6, 48)
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

it('uses completed refined roots in the current distance and interval traversal', () => {
  const original = meshIndex.refineMeshIndex
  let completed: MeshIndex | undefined
  vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
    (index, checkpoint) => {
      completed = original(index, checkpoint)
      return completed
    }
  )
  const world = vi.spyOn(meshIndex, 'worldBounds')
  const context = new OriginalMeshQuery(),
    a = shape(0),
    b = shape(1 / 8)
  const witness = context.distance(a, b, 1 / 64, 1e-6, 48)
  expect(completed).toBeDefined()
  expect(
    world.mock.calls.some(([bounds]) => bounds === completed?.root.bounds)
  ).toBe(true)
  world.mockClear()
  expect(context.lowerOver(a, b, 1 / 64, witness)).toBeGreaterThan(1 / 64)
  expect(
    world.mock.calls.some(([bounds]) => bounds === completed?.root.bounds)
  ).toBe(true)
})

it.each([false, true])(
  'preserves same-geometry distinct-pose cold and warm work - reversed %s',
  (reverse) => {
    const prepared = new WeakMap<MeshGeometry, CandidatePreparedIndex>()
    const [a, b] = reverse ? [shape(1 / 8), shape(0)] : [shape(0), shape(1 / 8)]
    const cold = new OriginalMeshQuery(undefined, 500000, true, prepared),
      warm = new OriginalMeshQuery(undefined, 500000, true, prepared)
    const result = query(cold, a, b)
    expect(query(warm, a, b)).toEqual(result)
    expect(warm.work).toBe(cold.work)
    expect(prepared.get(geometry)?.refinement).toBeDefined()
  }
)

it('does not reuse preparation for replaced or mutable source geometry', () => {
  const prepared = new WeakMap<MeshGeometry, CandidatePreparedIndex>()
  const refine = vi.spyOn(meshIndex, 'refineMeshIndex')
  query(new OriginalMeshQuery(undefined, 500000, true, prepared))
  const replaced = Object.freeze({ ...geometry })
  const a = { ...shape(0), geometry: replaced },
    b = { ...shape(1 / 8), geometry: replaced }
  query(new OriginalMeshQuery(undefined, 500000, true, prepared), a, b)
  expect(refine).toHaveBeenCalledTimes(2)
  const mutable = {
    ...geometry,
    positions: [...geometry.positions],
    indices: [...geometry.indices]
  }
  query(
    new OriginalMeshQuery(undefined, 500000, true, prepared),
    { ...a, geometry: mutable },
    { ...b, geometry: mutable }
  )
  expect(prepared.get(mutable)).toBeUndefined()
})

it('rejects an unpaid warm refinement before traversal without discarding completed retained preparation', () => {
  const prepared = new WeakMap<MeshGeometry, CandidatePreparedIndex>()
  const cold = new OriginalMeshQuery(undefined, 500000, true, prepared)
  const result = query(cold)
  const artifact = prepared.get(geometry)
  if (!artifact?.refinement) throw new Error('Missing completed refinement')
  const world = vi.spyOn(meshIndex, 'worldBounds')
  const limited = new OriginalMeshQuery(
    undefined,
    artifact.work + artifact.refinement.work,
    true,
    prepared
  )
  expect(() => query(limited)).toThrow(MeshWorkLimit)
  expect(
    world.mock.calls.some(
      ([bounds]) => bounds === artifact.refinement?.index.root.bounds
    )
  ).toBe(false)
  expect(prepared.get(geometry)).toBe(artifact)
  const retry = new OriginalMeshQuery(undefined, 500000, true, prepared)
  expect(query(retry)).toEqual(result)
  expect(retry.work).toBe(cold.work)
})
