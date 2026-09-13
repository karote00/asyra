import { afterEach, expect, it, vi } from 'vitest'
import * as continuous from '../continuous-query'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())

it('preserves complete original-segment source evidence while eliminating repeated queries with charged handoffs', async () => {
  const snapshot = await representativeSnapshot(0)
  const pair = snapshot.pairs.find(
    (item) =>
      item.a.bodyId === 'example:joint-2' && item.b.bodyId === 'obstacle-11'
  )
  if (!pair) throw new Error('Missing measured source pair')
  const input = {
    workcell: snapshot.workcell,
    trajectory: snapshot.trajectory,
    a: pair.a,
    b: pair.b,
    interval: [
      snapshot.trajectory.keyframes[115].time,
      snapshot.trajectory.keyframes[116].time
    ] as const
  }
  const settings = {
    threshold: snapshot.rule.minimumClearance,
    ...snapshot.method.settings,
    maxIntervals: snapshot.budget.maxIntervals
  }
  const run = continuous.queryContinuousPair
  const controlRoute = vi
    .spyOn(continuous, 'queryContinuousPair')
    .mockImplementation((query, settings, checkpoint, kernel) =>
      run(
        query,
        settings,
        checkpoint,
        kernel
          ? {
              ...kernel,
              handoffEvidence: undefined,
              lowerUsesPositiveWitnessOnly: undefined
            }
          : kernel
      )
    )
  const controlContext = new OriginalMeshQuery()
  const controlDistance = vi.spyOn(controlContext, 'distance'),
    controlLower = vi.spyOn(controlContext, 'lowerOver')
  const control = queryOriginalPartPair(
    input,
    settings,
    () => undefined,
    controlContext
  )
  controlRoute.mockRestore()
  const context = new OriginalMeshQuery()
  const distance = vi.spyOn(context, 'distance'),
    lower = vi.spyOn(context, 'lowerOver')
  const handoff = vi.spyOn(context, 'chargeEvidenceHandoff')
  const candidate = queryOriginalPartPair(
    input,
    settings,
    () => undefined,
    context
  )
  expect(candidate).toEqual(control)
  expect(candidate.coverage).toBe('complete')
  expect(candidate.evaluations).toBe(7)
  expect(controlDistance).toHaveBeenCalledTimes(13)
  expect(controlLower).toHaveBeenCalledTimes(10)
  expect(distance).toHaveBeenCalledTimes(5)
  expect(lower).toHaveBeenCalledTimes(7)
  expect(handoff).toHaveBeenCalledTimes(11)
  expect(context.work).toBeLessThanOrEqual(controlContext.work * 0.6)
}, 20000)
