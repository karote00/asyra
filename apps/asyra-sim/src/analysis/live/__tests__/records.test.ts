import { expect, it } from 'vitest'
import { LiveEvidenceRecords } from '../records'
import { LIVE_LIMITS } from '../protocol'
import type { LiveSample } from '../protocol'
import { liveFixture } from './fixtures'
import type { MethodEvidence } from '../../../extensions/contracts'

interface IntervalEvidenceRecordsContract {
  recordInterval(
    input: ReturnType<typeof liveFixture>,
    range: readonly [number, number],
    evidence: MethodEvidence
  ): boolean
  evidenceAt(time: number): readonly MethodEvidence['pairs'][number][]
  intervals: Map<
    string,
    {
      start: number
      end: number
      pairs: readonly MethodEvidence['pairs'][number][]
    }
  >
}

function intervalEvidence(
  input: ReturnType<typeof liveFixture>,
  start: number,
  end: number,
  state: 'clear' | 'finding' | 'unresolved',
  witnessTime: number | null = null
): MethodEvidence {
  return {
    version: 1,
    snapshotId: input.snapshotId,
    method: { id: input.method.id, version: input.method.version },
    coverage: state === 'clear' ? 'complete' : 'partial',
    evaluations: input.pairs.length,
    pairs: input.pairs.map((pair, index) => {
      const pairState = state === 'finding' && index > 0 ? 'unresolved' : state
      return {
        pairId: pair.id,
        evidence: {
          leaves: [
            {
              start,
              end,
              lower: pairState === 'clear' ? 1 : 0,
              upper: pairState === 'clear' ? 1 : null,
              witnessTime: index === 0 ? witnessTime : null,
              penetration: pairState === 'finding',
              state: pairState,
              reason:
                pairState === 'unresolved'
                  ? 'bounded query exhausted'
                  : 'certified test evidence'
            }
          ],
          lower: pairState === 'clear' ? 1 : 0,
          upper: pairState === 'clear' ? 1 : null,
          coverage: pairState === 'unresolved' ? 'partial' : 'complete',
          evaluations: 1
        }
      }
    })
  }
}

it('reuses an exact point only and does not treat a nearby time as covered', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const sample = {
    time: 2,
    pairs: [],
    totalPairCount: input.pairs.length,
    complete: false,
    error: 'unchecked pairs remain unknown'
  }

  expect(records.replace(input, 'current')).toBe(false)
  expect(records.record(input, sample)).toBe(true)

  const values = records.getAll()

  expect(records.record(input, sample)).toBe(false)
  expect(records.record(input, structuredClone(sample))).toBe(false)
  expect(records.getAll()).toBe(values)
  expect(records.get(2)).toBe(sample)
  expect(records.get(2.0001)).toBeUndefined()
})

it('bounds exact-time observations, rejects retired owners and does not leak another experiment records', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()

  records.replace(input, 'current')

  for (let time = 0; time <= LIVE_LIMITS.maxRecordedSamples; time++)
    records.record(input, {
      time,
      pairs: [],
      totalPairCount: input.pairs.length,
      complete: false,
      error: 'not checked'
    })

  expect(records.getAll()).toHaveLength(LIVE_LIMITS.maxRecordedSamples)
  expect(records.get(0)).toBeUndefined()
  expect(records.getAll('other')).toBe(records.getAll('other'))
  expect(records.getAll('other')).toHaveLength(0)

  records.replace(null)

  expect(records.getAll()).toHaveLength(0)
  expect(() =>
    records.record(input, {
      time: 0,
      pairs: [],
      totalPairCount: 1,
      complete: false,
      error: null
    })
  ).toThrow('Retired')
})

it('joins adjacent certified interval leaves but a finding remains usable only at its witness', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')

  const first = intervalEvidence(input, 0, 4, 'finding', 2)
  expect(owner.recordInterval(input, [0, 4], first)).toBe(true)
  expect(owner.recordInterval(input, [0, 4], structuredClone(first))).toBe(
    false
  )
  expect(
    owner.recordInterval(input, [4, 8], intervalEvidence(input, 4, 8, 'clear'))
  ).toBe(true)
  const atWitness = owner.evidenceAt(2)
  const insideFindingLeaf = owner.evidenceAt(3)
  const insideClearLeaf = owner.evidenceAt(6)

  expect(
    atWitness.find((pair) => pair.pairId === input.pairs[0].id)?.evidence
      .leaves[0]
  ).toMatchObject({ state: 'finding', witnessTime: 2 })
  expect(
    insideFindingLeaf.some((pair) => pair.pairId === input.pairs[0].id)
  ).toBe(false)
  expect(records.getReusablePairsAt(2)).toMatchObject([
    {
      pairId: input.pairs[0].id,
      evidence: { leaves: [{ start: 2, end: 2, witnessTime: 2 }] }
    }
  ])
  expect(records.getReusablePairsAt(3)).toEqual([])
  expect(
    insideClearLeaf.find((pair) => pair.pairId === input.pairs[0].id)?.evidence
      .leaves[0]
  ).toMatchObject({ state: 'clear', start: 4, end: 8 })
  expect(records.getAt(6)).toMatchObject({
    complete: true,
    pairs: expect.arrayContaining(
      input.pairs.map((pair) => expect.objectContaining({ pairId: pair.id }))
    )
  })
})

it('fills unknown exact-sample pairs from an interval while preserving accepted point evidence', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')
  const unknownPoint = intervalEvidence(input, 6, 6, 'unresolved')
  const clearPoint = intervalEvidence(input, 6, 6, 'clear')
  const exact: LiveSample = {
    time: 6,
    pairs: [clearPoint.pairs[0], ...unknownPoint.pairs.slice(1)],
    totalPairCount: input.pairs.length,
    complete: false,
    error: 'some pairs remain unknown'
  }
  records.record(input, exact)
  owner.recordInterval(input, [4, 8], intervalEvidence(input, 4, 8, 'clear'))

  const merged = records.getAt(6)
  expect(merged).toMatchObject({
    complete: true,
    error: null,
    time: 6,
    evidenceOrigin: 'interval'
  })
  expect(merged?.pairs[0]).toBe(exact.pairs[0])
})

it('keeps an interval gap unknown when bounded interval work cannot certify it', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')

  expect(
    owner.recordInterval(
      input,
      [1, 3],
      intervalEvidence(input, 1, 3, 'unresolved')
    )
  ).toBe(true)
  expect(owner.evidenceAt(2)).toEqual([])
})

it('accepts a consistent partial interval refinement that overlaps unresolved evidence', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')

  expect(
    owner.recordInterval(
      input,
      [0, 4],
      intervalEvidence(input, 0, 4, 'unresolved')
    )
  ).toBe(true)
  expect(
    owner.recordInterval(input, [0, 2], intervalEvidence(input, 0, 2, 'clear'))
  ).toBe(true)
  expect(records.getAt(1)).toMatchObject({ complete: true, time: 1 })
})

it('rejects a conflicting proven claim inside overlapping interval evidence', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')
  owner.recordInterval(input, [0, 4], intervalEvidence(input, 0, 4, 'clear'))

  expect(() =>
    owner.recordInterval(
      input,
      [2, 6],
      intervalEvidence(input, 2, 6, 'finding', 3)
    )
  ).toThrow('Conflicting live interval evidence')
})

it('rejects adjacent intervals whose per-pair boundary evidence conflicts', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')
  owner.recordInterval(
    input,
    [0, 4],
    intervalEvidence(input, 0, 4, 'finding', 4)
  )

  expect(() =>
    owner.recordInterval(input, [4, 8], intervalEvidence(input, 4, 8, 'clear'))
  ).toThrow('Conflicting live interval evidence')
  expect(
    owner.evidenceAt(4).find((pair) => pair.pairId === input.pairs[0].id)
  ).toMatchObject({
    evidence: { leaves: [{ state: 'finding', witnessTime: 4 }] }
  })
})

it('caps retained background intervals at the per-input work limit', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')
  const step = 8 / (LIVE_LIMITS.maxBackgroundIntervals + 1)

  for (let index = 0; index < LIVE_LIMITS.maxBackgroundIntervals; index++) {
    const start = index * step
    const end = (index + 1) * step
    expect(
      owner.recordInterval(
        input,
        [start, end],
        intervalEvidence(input, start, end, 'clear')
      )
    ).toBe(true)
  }

  const start = LIVE_LIMITS.maxBackgroundIntervals * step
  expect(
    owner.recordInterval(
      input,
      [start, 8],
      intervalEvidence(input, start, 8, 'clear')
    )
  ).toBe(false)
  expect(records.getAt(7.9)).toBeUndefined()
})

it('bounds live interval and leaf reads across different target times', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')
  const step = 8 / LIVE_LIMITS.maxBackgroundIntervals
  const leavesPerPair = 64

  for (let index = 0; index < LIVE_LIMITS.maxBackgroundIntervals; index++) {
    const start = index * step
    const end = (index + 1) * step
    const evidence = intervalEvidence(input, start, end, 'clear')
    for (const pair of evidence.pairs) {
      const leaf = pair.evidence.leaves[0]
      pair.evidence.leaves = Array.from(
        { length: leavesPerPair },
        (_, leafIndex) => {
          const leafStart = start + ((end - start) * leafIndex) / leavesPerPair
          const leafEnd =
            start + ((end - start) * (leafIndex + 1)) / leavesPerPair
          return { ...leaf, start: leafStart, end: leafEnd }
        }
      )
    }
    expect(owner.recordInterval(input, [start, end], evidence)).toBe(true)
  }

  let rangeBoundReads = 0
  const recordsInternals = records as unknown as {
    intervals: Map<
      string,
      {
        start: number
        end: number
        pairs: readonly MethodEvidence['pairs'][number][]
      }
    >
  }
  for (const [intervalIndex, interval] of [
    ...recordsInternals.intervals.values()
  ].entries()) {
    const rangeStart = intervalIndex * step
    const rangeEnd = (intervalIndex + 1) * step
    Object.defineProperties(interval, {
      start: {
        configurable: true,
        enumerable: true,
        get: () => {
          rangeBoundReads++
          return rangeStart
        }
      },
      end: {
        configurable: true,
        enumerable: true,
        get: () => {
          rangeBoundReads++
          return rangeEnd
        }
      }
    })
  }

  let leafBoundReads = 0
  for (const interval of recordsInternals.intervals.values()) {
    const rangeStart = interval.start
    for (const pair of interval.pairs) {
      for (const [leafIndex, leaf] of pair.evidence.leaves.entries()) {
        const leafStart = rangeStart + leafIndex * (step / leavesPerPair)
        const leafEnd = rangeStart + (leafIndex + 1) * (step / leavesPerPair)
        Object.defineProperties(leaf, {
          start: {
            configurable: true,
            enumerable: true,
            get: () => {
              leafBoundReads++
              return leafStart
            }
          },
          end: {
            configurable: true,
            enumerable: true,
            get: () => {
              leafBoundReads++
              return leafEnd
            }
          }
        })
      }
    }
  }

  rangeBoundReads = 0
  leafBoundReads = 0
  const queryCount = 100
  for (let query = 0; query < queryCount; query++) {
    const intervalIndex = query % LIVE_LIMITS.maxBackgroundIntervals
    const leafIndex = query % leavesPerPair
    records.evidenceAt(
      (intervalIndex + (leafIndex + 0.5) / leavesPerPair) * step
    )
  }

  expect(rangeBoundReads).toBeLessThanOrEqual(
    queryCount * (Math.ceil(Math.log2(LIVE_LIMITS.maxBackgroundIntervals)) + 2)
  )
  expect(leafBoundReads).toBeLessThanOrEqual(
    queryCount * input.pairs.length * (Math.ceil(Math.log2(leavesPerPair)) + 4)
  )
})
