import { expect, it } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { OriginalMeshQuery } from '../original-mesh-query'

const ops = poseOperations(intervalAlgebra)
function components(count: number, offset: number): MeshGeometry {
  const positions: number[] = [],
    indices: number[] = []
  for (let i = 0; i < count; i++) {
    const x = i / 4 + offset,
      n = positions.length / 3
    positions.push(x, 0, 0, x + 1 / 32, 0, 0, x, 1 / 32, 0, x, 0, 1 / 32)
    indices.push(
      ...[0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3].map((value) => value + n)
    )
  }
  return Object.freeze({
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
    positions: Object.freeze(positions),
    indices: Object.freeze(indices)
  })
}

it.each([false, true])(
  'bounds disjoint overlapping-root component traversal - reversed %s',
  (reverse) => {
    const pair = [components(16, 0), components(32, 1 / 8)].map((geometry) => ({
      geometry,
      pose: ops.fromPose(IDENTITY_POSE)
    }))
    if (reverse) pair.reverse()
    const [a, b] = pair,
      threshold = 1 / 64
    const query = new OriginalMeshQuery()
    const first = query.distance(a, b, threshold, 1e-6, 48)
    const before = query.work
    const repeat = query.distance(a, b, threshold, 1e-6, 48)
    const staticWork = query.work - before
    const lowerBefore = query.work
    const lower = query.lowerOver(a, b, threshold, first)
    const lowerWork = query.work - lowerBefore
    const exhaustive = new OriginalMeshQuery(undefined, 500000, false)
    const truth = exhaustive.distance(a, b, threshold, 1e-6, 48)
    expect(first).toEqual(repeat)
    expect(first.penetration).toBe(false)
    expect(first.lower).toBeGreaterThan(threshold)
    expect(first.lower).toBeLessThanOrEqual(3 / 32)
    expect(lower).toBeGreaterThan(threshold)
    expect(lower).toBeLessThanOrEqual(3 / 32)
    expect(truth.penetration).toBe(first.penetration)
    expect(truth.lower).toBeGreaterThan(threshold)
    // eslint-disable-next-line no-console -- permanent bounded hierarchy-work proof
    console.info(
      JSON.stringify({
        profile: 'dual-tree-disjoint-components',
        reverse,
        staticWork,
        lowerWork,
        exhaustiveWork: exhaustive.work
      })
    )
    expect(staticWork + lowerWork).toBeLessThan(12 * (16 + 32))
  }
)

it.each([0, 1 / 64, 1 / 8])(
  'retains clearance truth at threshold %s in both pair directions',
  (threshold) => {
    const a = { geometry: components(2, 0), pose: ops.fromPose(IDENTITY_POSE) }
    const b = {
      geometry: components(3, 1 / 8),
      pose: ops.fromPose(IDENTITY_POSE)
    }
    for (const [left, right] of [
      [a, b],
      [b, a]
    ]) {
      const result = new OriginalMeshQuery().distance(
        left,
        right,
        threshold,
        1e-6,
        48
      )
      const exhaustive = new OriginalMeshQuery(
        undefined,
        500000,
        false
      ).distance(left, right, threshold, 1e-6, 48)
      expect(result.penetration).toBe(false)
      expect(result.lower).toBeLessThanOrEqual(3 / 32)
      expect(result.upper).toBeGreaterThanOrEqual(3 / 32)
      expect(result.lower > threshold).toBe(exhaustive.lower > threshold)
      expect(result.upper < threshold).toBe(exhaustive.upper < threshold)
      expect(
        new OriginalMeshQuery().distance(left, right, threshold, 1e-6, 48)
      ).toEqual(result)
    }
  }
)

it('retains closed-component containment and deterministic witnesses', () => {
  const outer = components(2, 0)
  const inner = Object.freeze({
    ...components(1, 0),
    positions: Object.freeze(
      components(1, 0).positions.map((value) => value / 8 + 1 / 256)
    )
  })
  const pair = [outer, inner].map((geometry) => ({
    geometry,
    pose: ops.fromPose(IDENTITY_POSE)
  }))
  for (const [a, b] of [pair, [...pair].reverse()]) {
    const first = new OriginalMeshQuery().distance(a, b, 1 / 64, 1e-6, 48)
    const exhaustive = new OriginalMeshQuery(undefined, 500000, false).distance(
      a,
      b,
      1 / 64,
      1e-6,
      48
    )
    expect(first.penetration).toBe(true)
    expect(first.upper).toBe(0)
    expect(first.penetration).toBe(exhaustive.penetration)
    expect(new OriginalMeshQuery().distance(a, b, 1 / 64, 1e-6, 48)).toEqual(
      first
    )
  }
})
