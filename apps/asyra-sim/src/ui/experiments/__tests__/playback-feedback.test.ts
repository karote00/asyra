import { expect, it } from 'vitest'
import { playbackHighlight } from '../playback-highlight'
import type { PlaybackView } from '../playback-view'
import { liveFixture } from '../../../analysis/live/__tests__/fixtures'
import { runOfficialClearanceMethod } from '../../../analysis/methods/official-method'
import {
  sampleSnapshot,
  validateLiveEvidence
} from '../../../analysis/live/sample'
import { feedbackFromIssues, playbackFeedback } from '../playback-feedback'

it('shows collision and clearance pairs together, with red precedence only on a shared body', () => {
  const input = liveFixture()
  const sample = structuredClone(
    validateLiveEvidence(
      input,
      4,
      runOfficialClearanceMethod(sampleSnapshot(input, 4))
    )
  )
  const pairs = sample.pairs.slice(0, 2)

  pairs.forEach((pair, index) =>
    Object.assign(pair.evidence, {
      leaves: [
        {
          start: 4,
          end: 4,
          lower: 0,
          upper: 0,
          witnessTime: 4,
          penetration: index === 0,
          state: 'finding',
          reason: 'observed'
        }
      ]
    })
  )

  const feedback = playbackFeedback(input, { ...sample, pairs })
  const source = input.pairs[0]
  const clearance = input.pairs[1]
  const colors = new Map([
    [clearance.a.bodyId, 0xffbd59],
    [clearance.b.bodyId, 0xffbd59],
    [source.a.bodyId, 0xff625e],
    [source.b.bodyId, 0xff625e]
  ])

  expect(feedback.kind).toBe('collision')
  expect(feedback).toMatchObject({
    issues: [
      { pairId: source.id, kind: 'collision' },
      { pairId: clearance.id, kind: 'clearance' }
    ],
    highlight: { colors }
  })
  expect(
    playbackFeedback(input, { ...sample, pairs: [...pairs].reverse() })
  ).toMatchObject({ highlight: { colors } })
})

it('keeps unresolved pairs visible alongside known findings without inventing their contact color', () => {
  const feedback = feedbackFromIssues(
    {
      checkedTime: 4,
      complete: false,
      totalPairCount: 3,
      message: 'Partial evidence'
    },
    [
      {
        pairId: 'contact',
        kind: 'collision',
        bodyIds: ['tool', 'table'],
        name: 'tool - table'
      },
      {
        pairId: 'near',
        kind: 'clearance',
        bodyIds: ['part', 'table'],
        name: 'part - table'
      },
      {
        pairId: 'unknown',
        kind: 'unresolved',
        bodyIds: ['arm', 'post'],
        name: 'arm - post'
      }
    ]
  )

  expect(feedback.issues.map((issue) => issue.kind)).toEqual([
    'collision',
    'clearance',
    'unresolved'
  ])
  expect(feedback.complete).toBe(false)
  expect(feedback.highlight?.colors).toEqual(
    new Map([
      ['tool', 0xff625e],
      ['table', 0xff625e],
      ['part', 0xffbd59]
    ])
  )
})

it('keeps the last checked parts highlighted during forward playback without applying future evidence', () => {
  const input = liveFixture()
  const view: PlaybackView = {
    workcell: input.workcell,
    joints: {},
    time: 4,
    historical: false,
    bodyIds: [],
    feedback: feedbackFromIssues(
      {
        checkedTime: 4,
        complete: true,
        totalPairCount: 1,
        message: ''
      },
      [
        {
          pairId: 'contact',
          kind: 'collision',
          bodyIds: ['a', 'b'],
          name: 'a - b'
        }
      ]
    )
  }

  const highlight = view.feedback?.highlight

  expect(highlight?.colors).toEqual(
    new Map([
      ['a', 0xff625e],
      ['b', 0xff625e]
    ])
  )

  for (let frame = 0; frame < 120; frame += 1) {
    expect(playbackHighlight({ ...view, time: 4 + frame / 60 })).toBe(highlight)
  }

  expect(playbackHighlight({ ...view, time: 3.99 })).toBeUndefined()

  if (!view.feedback) throw new Error('Missing fixture feedback')
  expect(
    playbackHighlight({
      ...view,
      feedback: feedbackFromIssues({ ...view.feedback, complete: false }, [])
    })
  ).toBeUndefined()
  expect(
    playbackHighlight({
      ...view,
      feedback: feedbackFromIssues(view.feedback, [
        {
          pairId: 'near',
          kind: 'clearance',
          bodyIds: ['a', 'b'],
          name: 'a - b'
        }
      ])
    })?.colors.get('a')
  ).toBe(0xffbd59)
  expect(playbackHighlight(null)).toBeUndefined()

  const historical = {
    ...view,
    historical: true,
    feedback: undefined,
    historicalHighlight: { colors: new Map([['a', 0x62e6c1]]) }
  }

  for (let frame = 0; frame < 120; frame += 1)
    expect(playbackHighlight(historical)).toBe(historical.historicalHighlight)
})
