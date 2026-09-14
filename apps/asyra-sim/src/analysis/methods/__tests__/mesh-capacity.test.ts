import { afterEach, expect, it, vi } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { buildMeshIndex } from '../mesh-index'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'

const ops = poseOperations(intervalAlgebra)
function geometry(count = 1): MeshGeometry {
  const positions: number[] = [],
    indices: number[] = []
  for (let i = 0; i < count; i++) {
    const x = ((i * 37) % count) * 2,
      base = positions.length / 3
    positions.push(x, 0, 0, x + 1, 0, 0, x, 1, 0, x, 0, 1)
    indices.push(...[0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3].map((v) => v + base))
  }
  return Object.freeze({
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
    positions: Object.freeze(positions),
    indices: Object.freeze(indices)
  })
}

afterEach(() => vi.restoreAllMocks())

it('keeps exact paid work beyond 500000 and produces the unchanged complete geometry evidence', () => {
  const mesh = { geometry: geometry(), pose: ops.fromPose(IDENTITY_POSE) },
    sphere = {
      geometry: { kind: 'sphere' as const, radius: 0.1 },
      pose: ops.fromPose({ ...IDENTITY_POSE, position: [5, 0, 0] })
    },
    fresh = new OriginalMeshQuery(),
    expected = fresh.distance(mesh, sphere, 0.02, 1e-6, 48),
    context = new OriginalMeshQuery()
  for (let i = 0; i < 500001; i++) context.chargeEvidenceHandoff()
  expect(context.work).toBe(500001)
  expect(context.distance(mesh, sphere, 0.02, 1e-6, 48)).toEqual(expected)
  expect(context.work).toBe(500001 + fresh.work)
})

it('still observes cancellation beyond the old workload threshold and retains explicit diagnostic limits', () => {
  const cancelled = new Error('owned execution cancelled')
  let cancel = false
  const context = new OriginalMeshQuery(() => {
    if (cancel) throw cancelled
  })
  for (let i = 0; i < 500001; i++) context.chargeEvidenceHandoff()
  cancel = true
  expect(() => context.chargeEvidenceHandoff()).toThrow(cancelled)
  expect(context.work).toBe(500001)
  const diagnostic = new OriginalMeshQuery(undefined, 1)
  diagnostic.chargeEvidenceHandoff()
  expect(() => diagnostic.chargeEvidenceHandoff()).toThrow(MeshWorkLimit)
})

it('checks cancellation inside the original median index sort and leaves source geometry intact', () => {
  const mesh = geometry(513),
    original = structuredClone(mesh),
    cancelled = new Error('cancelled during index sort'),
    sort = Array.prototype.sort
  let sorting = false,
    comparisons = 0
  vi.spyOn(Array.prototype, 'sort').mockImplementation(function (
    this: unknown[],
    compare
  ) {
    if (!compare) throw new Error('Expected an explicit geometry comparator')
    sorting = true
    try {
      return sort.call(this, (a, b) => {
        comparisons++
        return compare(a, b)
      })
    } finally {
      sorting = false
    }
  })
  expect(() =>
    buildMeshIndex(mesh, () => {
      if (sorting && comparisons >= 256) throw cancelled
    })
  ).toThrow(cancelled)
  expect(comparisons).toBeLessThanOrEqual(257)
  vi.restoreAllMocks()
  expect(mesh).toEqual(original)
  const retry = buildMeshIndex(mesh, () => undefined)
  expect(retry.componentCount).toBe(513)
})
