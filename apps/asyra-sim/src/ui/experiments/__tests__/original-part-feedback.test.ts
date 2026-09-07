import { expect, it } from 'vitest'
import { collisionStarterSnapshot } from '../../../domain/__tests__/collision-starter-fixture'
import { runOriginalPartMethod } from '../../../analysis/methods/original-part-method'
import {
  sampleSnapshot,
  validateLiveEvidence
} from '../../../analysis/live/sample'
import { completeAnalysisResult } from '../../../analysis/result'
import { playbackFeedback } from '../playback-feedback'
import { RecordedPlaybackEvidence } from '../recorded-playback-evidence'

it('uses original geometry to retain simultaneous gripper contact and workpiece clearance in live and recorded poses', async () => {
  const snapshot = await collisionStarterSnapshot()

  for (const time of [3.84, 4]) {
    const pose = sampleSnapshot(snapshot, time)
    const evidence = runOriginalPartMethod(pose)
    const sample = validateLiveEvidence(snapshot, time, evidence)
    const feedback = playbackFeedback(snapshot, sample)
    const recorded = new RecordedPlaybackEvidence({
      snapshot: pose,
      result: completeAnalysisResult(pose, evidence, {
        runId: 'pose-report',
        startedAt: 0,
        endedAt: 1
      })
    }).at(time)

    expect(sample.pairs).toHaveLength(46)
    expect(sample.complete).toBe(true)
    expect(
      feedback.issues.map((issue) => ({ name: issue.name, kind: issue.kind }))
    ).toEqual([
      { name: 'gripper - fixture table', kind: 'collision' },
      {
        name: 'workpiece - fixture table',
        kind: time === 4 ? 'collision' : 'clearance'
      }
    ])
    expect(feedback.highlight?.colors.get('example:gripper')).toBe(0xff625e)
    expect(feedback.highlight?.colors.get('example:workpiece')).toBe(
      time === 4 ? 0xff625e : 0xffbd59
    )
    expect(recorded?.issues).toEqual(feedback.issues)
    expect(recorded?.highlight).toEqual(feedback.highlight)
    expect(recorded?.complete).toBe(true)
  }
})
