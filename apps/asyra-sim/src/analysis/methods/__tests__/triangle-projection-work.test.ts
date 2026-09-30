import { afterEach, expect, it, vi } from 'vitest'
import * as convex from '../convex-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'
import { useTriangleProjectionControl } from './triangle-projection-control'

afterEach(() => vi.restoreAllMocks())
async function sourceQuery() {
  const snapshot = await representativeSnapshot(0)
  const pair = snapshot.pairs.find(
    (pair) =>
      pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
  )
  if (!pair) throw new Error('Missing complete source pair')
  return {
    query: {
      workcell: snapshot.workcell,
      trajectory: snapshot.trajectory,
      a: pair.a,
      b: pair.b,
      interval: [
        snapshot.trajectory.keyframes[74].time,
        snapshot.trajectory.keyframes[75].time
      ] as const
    },
    settings: {
      threshold: snapshot.rule.minimumClearance,
      ...snapshot.method.settings,
      maxIntervals: snapshot.budget.maxIntervals
    }
  }
}
it('retains node rejection while final source triangles proceed to the owned convex query without extra axes', async () => {
  const { query, settings } = await sourceQuery()
  const counts = useTriangleProjectionControl(false)
  const context = new OriginalMeshQuery()
  const result = queryOriginalPartPair(
    query,
    settings,
    () => undefined,
    context
  )
  expect(result.coverage).toBe('complete')
  expect(result.leaves).toHaveLength(1)
  expect(result.leaves[0]).toMatchObject({
    state: 'finding',
    penetration: false,
    lower: 0
  })
  expect(result.upper).toBeLessThan(settings.threshold)
  expect(counts.triangleCalls).toBe(0)
  expect(counts.nodeAxes).toBeGreaterThan(0)
  expect(counts.convexCalls).toBeLessThanOrEqual(1742)
  expect(context.work).toBeLessThanOrEqual(37737)
}, 20000)

it('checks budget and cancellation before executing an unpaid final source convex query', async () => {
  const { query, settings } = await sourceQuery()
  let context = new OriginalMeshQuery(),
    firstConvexWork: number | undefined
  const solve = convex.convexDistance
  const convexSpy = vi
    .spyOn(convex, 'convexDistance')
    .mockImplementation((...args) => {
      if (
        args[0].geometry.kind === 'triangle' &&
        args[1].geometry.kind === 'triangle'
      )
        firstConvexWork ??= context.work
      return solve(...args)
    })
  const distance = vi.spyOn(context, 'distance')
  queryOriginalPartPair(query, settings, () => undefined, context)
  const args = distance.mock.calls[0]
  if (!firstConvexWork || !args)
    throw new Error('Missing completed original triangle work boundary')
  convexSpy.mockClear()
  context = new OriginalMeshQuery(() => undefined, firstConvexWork - 1)
  expect(() => context.distance(...args)).toThrow(MeshWorkLimit)
  expect(context.work).toBe(firstConvexWork)
  expect(convexSpy).not.toHaveBeenCalled()
  const cutoff = firstConvexWork
  context = new OriginalMeshQuery(() => {
    if (context.work + 1 === cutoff) throw new Error('cancelled source pair')
  })
  expect(() => context.distance(...args)).toThrow('cancelled source pair')
  expect(context.work).toBe(cutoff - 1)
  expect(convexSpy).not.toHaveBeenCalled()
}, 20000)
