import { afterEach, expect, it, vi } from 'vitest'
import * as continuous from '../continuous-query'
import { queryOriginalPartPair } from '../original-part-method'
import { OriginalMeshQuery } from '../original-mesh-query'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())

it.each(['segment71', 'window2', 'window4', 'commonPrefix'] as const)(
  'preserves source certificates with charged witnessed-zero derivation - %s',
  async (mode) => {
    const snapshot = await representativeSnapshot(0)
    const pair = snapshot.pairs.find(
      (pair) =>
        pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
    )
    if (!pair) throw new Error('Missing original source pair')
    const windows: Record<typeof mode, readonly [number, number]> = {
      segment71: [
        snapshot.trajectory.keyframes[71].time,
        snapshot.trajectory.keyframes[72].time
      ],
      window2: [2, 3],
      window4: [4, 5],
      commonPrefix: [
        snapshot.trajectory.keyframes[114].time,
        snapshot.trajectory.keyframes[199].time
      ]
    }
    const interval = windows[mode]
    const query = {
      workcell: snapshot.workcell,
      trajectory: snapshot.trajectory,
      a: pair.a,
      b: pair.b,
      interval
    }
    const settings = {
      threshold: snapshot.rule.minimumClearance,
      ...snapshot.method.settings,
      maxIntervals: snapshot.budget.maxIntervals
    }
    const execute = () => {
      const context = new OriginalMeshQuery()
      const charges = { static: 0, interval: 0, handoff: 0, derivation: 0 }
      const calls = { static: 0, interval: 0, handoff: 0, derivation: 0 }
      const distance = context.distance.bind(context),
        lower = context.lowerOver.bind(context),
        handoff = context.chargeEvidenceHandoff.bind(context),
        derivation = context.chargeEvidenceDerivation.bind(context)
      const count = <T>(kind: keyof typeof charges, operation: () => T): T => {
        const before = context.work
        calls[kind]++
        try {
          return operation()
        } finally {
          charges[kind] += context.work - before
        }
      }
      context.distance = (...args) => count('static', () => distance(...args))
      context.lowerOver = (...args) => count('interval', () => lower(...args))
      context.chargeEvidenceHandoff = () => count('handoff', handoff)
      context.chargeEvidenceDerivation = () => count('derivation', derivation)
      const start = performance.now()
      const evidence = queryOriginalPartPair(
        query,
        settings,
        () => undefined,
        context
      )
      expect(Object.values(charges).reduce((a, b) => a + b, 0)).toBe(
        context.work
      )
      return {
        evidence,
        charges,
        calls,
        work: context.work,
        milliseconds: performance.now() - start
      }
    }
    const run = continuous.queryContinuousPair
    const route = vi
      .spyOn(continuous, 'queryContinuousPair')
      .mockImplementation((query, settings, checkpoint, kernel) =>
        run(
          query,
          settings,
          checkpoint,
          kernel ? { ...kernel, deriveZeroLower: undefined } : kernel
        )
      )
    const control = execute()
    route.mockRestore()
    const candidate = execute()
    expect(control.evidence.coverage).toBe('complete')
    expect(candidate.evidence).toEqual(control.evidence)
    if (mode === 'commonPrefix') {
      expect(candidate.evidence.leaves).toHaveLength(90)
      expect(candidate.evidence.evaluations).toBe(control.evidence.evaluations)
    }
    expect(candidate.calls.static).toBe(control.calls.static)
    expect(candidate.charges.static).toBe(control.charges.static)
    expect(candidate.charges.derivation).toBe(candidate.calls.derivation)
    expect(candidate.work).toBeLessThanOrEqual(control.work)
    // eslint-disable-next-line no-console -- permanent complete-source work and charge evidence
    console.info(
      JSON.stringify({
        profile: 'witnessed-zero-source',
        mode,
        interval,
        control: { ...control, evidence: undefined },
        candidate: { ...candidate, evidence: undefined },
        evaluations: candidate.evidence.evaluations,
        leaves: candidate.evidence.leaves.length,
        completeLeaves:
          mode === 'commonPrefix'
            ? {
                control: control.evidence.leaves,
                candidate: candidate.evidence.leaves
              }
            : undefined
      })
    )
  },
  20000
)
