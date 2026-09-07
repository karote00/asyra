import { expect, it, vi } from 'vitest'
import { liveFixture } from '../../../analysis/live/__tests__/fixtures'
import { runOfficialClearanceMethod } from '../../../analysis/methods/official-method'
import { completeAnalysisResult } from '../../../analysis/result'
import { RecordedPlaybackEvidence } from '../recorded-playback-evidence'

it('reuses an exact witness without treating earlier unclassified poses as known or clearance-only bodies as colliding', () => {
  const snapshot = liveFixture()
  const result = structuredClone(
    completeAnalysisResult(snapshot, runOfficialClearanceMethod(snapshot), {
      runId: 'recorded',
      startedAt: 0,
      endedAt: 1
    })
  )
  const pair = result.pairEvidence[0]

  // Accepted finding semantics: one observed witness in an enclosing interval.
  Object.assign(pair.evidence, {
    lower: 0,
    upper: 0,
    coverage: 'complete',
    leaves: [
      {
        start: 0,
        end: 8,
        lower: 0,
        upper: 0,
        witnessTime: 4,
        penetration: true,
        state: 'finding',
        reason: 'observed contact'
      }
    ]
  })
  Object.assign(result, { summary: 'issue-found', findingPairCount: 1 })

  Object.assign(result.pairEvidence[1].evidence, {
    lower: 0,
    upper: 0.01,
    coverage: 'complete',
    leaves: [
      {
        start: 0,
        end: 8,
        lower: 0,
        upper: 0.01,
        witnessTime: 4,
        penetration: false,
        state: 'finding',
        reason: 'clearance only'
      }
    ]
  })

  Object.assign(result.pairEvidence[2].evidence, {
    coverage: 'partial',
    leaves: [
      {
        start: 0,
        end: 8,
        lower: 0,
        upper: null,
        witnessTime: null,
        penetration: false,
        state: 'unresolved',
        reason: 'budget'
      }
    ]
  })

  const unknown = result.pairEvidence[2].evidence
  const leaves = unknown.leaves
  const readLeaves = vi.fn(() => leaves)

  Object.defineProperty(unknown, 'leaves', { get: readLeaves })

  const evidence = new RecordedPlaybackEvidence({ snapshot, result })

  // Index finding witnesses once, without expanding every pair at every time.
  expect(readLeaves).toHaveBeenCalledOnce()

  expect(evidence.at(0)).toBeUndefined()
  expect(evidence.at(3.888)).toBeUndefined()
  expect(evidence.at(4)).toMatchObject({
    checkedTime: 4,
    origin: 'recorded',
    kind: 'collision',
    issues: [
      { pairId: snapshot.pairs[0].id, kind: 'collision' },
      { pairId: snapshot.pairs[1].id, kind: 'clearance' },
      { pairId: snapshot.pairs[2].id, kind: 'unresolved' }
    ],
    highlight: {
      colors: new Map([
        [snapshot.pairs[1].a.bodyId, 0xffbd59],
        [snapshot.pairs[1].b.bodyId, 0xffbd59],
        [snapshot.pairs[0].a.bodyId, 0xff625e],
        [snapshot.pairs[0].b.bodyId, 0xff625e]
      ])
    }
  })
  expect(evidence.at(4)?.complete).toBe(false)
  expect(evidence.at(4.1)).toBeUndefined()
  const appearance = evidence.at(4)?.highlight
  const lookups = readLeaves.mock.calls.length

  expect(appearance).toBeDefined()

  for (let request = 0; request < 120; request += 1)
    expect(evidence.at(4)?.highlight).toBe(appearance)

  expect(readLeaves).toHaveBeenCalledTimes(lookups)

  expect(evidence.nextWitness(3.888, 4.1)).toBe(4)
  expect(evidence.nextWitness(4, 8)).toBeUndefined()
  expect(evidence.nextWitness(null, 8)).toBeUndefined()
})

it('reuses only all-pair clear certificates, including their boundaries, and never upgrades gaps or missing pairs', () => {
  const snapshot = liveFixture()
  const result = structuredClone(
    completeAnalysisResult(snapshot, runOfficialClearanceMethod(snapshot), {
      runId: 'recorded',
      startedAt: 0,
      endedAt: 1
    })
  )

  for (const pair of result.pairEvidence) {
    Object.assign(pair.evidence, {
      coverage: 'partial',
      leaves: [
        {
          start: 0,
          end: 2,
          lower: 1,
          upper: 1,
          witnessTime: 1,
          penetration: false,
          state: 'clear',
          reason: 'certificate'
        },
        {
          start: 2,
          end: 8,
          lower: 0,
          upper: null,
          witnessTime: null,
          penetration: false,
          state: 'unresolved',
          reason: 'budget'
        }
      ]
    })
  }

  const evidence = new RecordedPlaybackEvidence({ snapshot, result })

  for (const time of [0, 1.7, 2]) {
    expect(evidence.at(time)).toMatchObject({
      kind: 'clear',
      origin: 'recorded',
      checkedTime: time,
      complete: true
    })
  }

  for (const time of [-1, 2.1, 8, 9, NaN])
    expect(evidence.at(time)).toBeUndefined()

  const missing = new RecordedPlaybackEvidence({
    snapshot,
    result: { ...result, pairEvidence: result.pairEvidence.slice(1) }
  })

  expect(missing.at(1)).toBeUndefined()
})
