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

it('bounds each target lookup by the one certified interval covering it', () => {
  const records = new LiveEvidenceRecords()
  const input = liveFixture()
  const owner = records as unknown as IntervalEvidenceRecordsContract
  records.replace(input, 'current')
  const step = 8 / LIVE_LIMITS.maxBackgroundIntervals
  let leafBoundReads = 0

  for (let index = 0; index < LIVE_LIMITS.maxBackgroundIntervals; index++) {
    const start = index * step
    const end = (index + 1) * step
    const evidence = intervalEvidence(input, start, end, 'clear')
    for (const pair of evidence.pairs)
      Object.defineProperties(pair.evidence.leaves[0], {
        start: {
          configurable: true,
          enumerable: true,
          get: () => {
            leafBoundReads++
            return start
          }
        },
        end: {
          configurable: true,
          enumerable: true,
          get: () => {
            leafBoundReads++
            return end
          }
        }
      })
    expect(owner.recordInterval(input, [start, end], evidence)).toBe(true)
  }

  leafBoundReads = 0
  const queryCount = 100
  for (let query = 0; query < queryCount; query++) {
    const interval = query % LIVE_LIMITS.maxBackgroundIntervals
    records.evidenceAt((interval + 0.5) * step)
  }

  expect(leafBoundReads).toBeLessThanOrEqual(
    queryCount * input.pairs.length * 2
  )
})
