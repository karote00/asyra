import { expect, it } from 'vitest'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

it.each([
  { start: 2, limit: 240000 },
  { start: 4, limit: 336000 }
])(
  'reduces complete representative source work by at least twenty percent over second $start',
  async ({ start, limit }) => {
    const snapshot = await representativeSnapshot(0)
    const pair = snapshot.pairs.find(
      (pair) =>
        pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
    )
    if (!pair) throw new Error('Missing representative source pair')
    const context = new OriginalMeshQuery()
    const result = queryOriginalPartPair(
      {
        workcell: snapshot.workcell,
        trajectory: snapshot.trajectory,
        a: pair.a,
        b: pair.b,
        interval: [start, start + 1]
      },
      {
        threshold: snapshot.rule.minimumClearance,
        ...snapshot.method.settings,
        maxIntervals: snapshot.budget.maxIntervals
      },
      () => undefined,
      context
    )
    expect(result.coverage).toBe('complete')
    expect(
      result.leaves.some((leaf) => leaf.state === 'finding' && leaf.penetration)
    ).toBe(true)
    expect(result.leaves.some((leaf) => leaf.state === 'clear')).toBe(true)
    // Includes preparation, ordering decisions and every prepared pending pair.
    expect(context.work).toBeLessThan(limit)
  },
  20000
)

const ops = poseOperations(intervalAlgebra)
function solids(permuted: boolean): MeshGeometry {
  const positions: number[] = [],
    indices: number[] = []
  const centers = Array.from({ length: 16 }, (_, index) => index / 4)
  if (permuted) centers.reverse()
  for (const x of centers) {
    const offset = positions.length / 3
    positions.push(x, 0, 0, x + 1 / 32, 0, 0, x, 1 / 32, 0, x, 0, 1 / 32)
    indices.push(
      ...[0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3].map((index) => index + offset)
    )
  }
  return {
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] },
    positions,
    indices
  }
}

it.each([false, true])(
  'retains exhaustive crossing truth under source permutation %s and reversed/rotated queries',
  (permuted) => {
    const geometry = solids(permuted)
    for (const rotation of [
      [0, 0, 0, 1],
      [0, 0, 3, 4]
    ] as const) {
      const parent = ops.fromPose({ position: [0, 0, 0], rotation })
      const a = { geometry, pose: parent }
      const b = {
        geometry: solids(!permuted),
        pose: ops.compose(
          parent,
          ops.fromPose({
            position: [1 / 128, -1 / 256, 1 / 128],
            rotation: [0, 0, 0, 1]
          })
        )
      }
      for (const [left, right] of [
        [a, b],
        [b, a]
      ]) {
        const context = new OriginalMeshQuery()
        const result = context.distance(left, right, 1 / 64, 1e-6, 48)
        const exhaustive = new OriginalMeshQuery(
          undefined,
          500000,
          false
        ).distance(left, right, 1 / 64, 1e-6, 48)
        expect(result.penetration).toBe(true)
        expect(result.penetration).toBe(exhaustive.penetration)
        expect(result.lower).toBe(0)
        expect(result.upper).toBe(0)
        expect(
          new OriginalMeshQuery().distance(left, right, 1 / 64, 1e-6, 48)
        ).toEqual(result)
        expect(context.work).toBeLessThan(10000)
      }
    }
  }
)
