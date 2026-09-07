import type { PresentedRun } from '../results/run-freshness'
import {
  feedbackFromIssues,
  type PlaybackFeedback,
  type PlaybackIssue
} from './playback-feedback'
import type { IntervalEvidence } from '../../analysis/methods/continuous-query'

/** Query accepted proofs only; missing times must go to the live sampling owner. */
export class RecordedPlaybackEvidence {
  private readonly cues = new Map<number, PlaybackFeedback>()
  private readonly times: number[]
  private readonly sources: ReadonlyMap<
    string,
    Pick<PlaybackIssue, 'bodyIds' | 'name'>
  >
  private readonly evidence: ReadonlyMap<
    string,
    PresentedRun['result']['pairEvidence'][number]['evidence']
  >
  private currentCue?: PlaybackFeedback

  constructor(private readonly run: PresentedRun) {
    const bodies = new Map(
      run.snapshot.workcell.bodies.map((body) => [body.id, body])
    )
    const sources = new Map(
      run.snapshot.pairs.map((pair) => {
        const a = bodies.get(pair.a.bodyId)
        const b = bodies.get(pair.b.bodyId)

        if (!a || !b) throw new Error('Recorded evidence is missing its body')

        return [
          pair.id,
          { bodyIds: [a.id, b.id] as const, name: `${a.name} - ${b.name}` }
        ] as const
      })
    )
    const evidence = new Map(
      run.result.pairEvidence.map((pair) => [pair.pairId, pair.evidence])
    )
    this.sources = sources
    this.evidence = evidence
    const witnesses = new Map<number, Map<string, PlaybackIssue>>()

    for (const pair of run.result.pairEvidence) {
      const source = sources.get(pair.pairId)

      if (!source) throw new Error('Recorded evidence is missing its pair')

      for (const leaf of pair.evidence.leaves) {
        if (leaf.state !== 'finding' || leaf.witnessTime === null) continue

        let issues = witnesses.get(leaf.witnessTime)

        if (!issues) {
          issues = new Map()
          witnesses.set(leaf.witnessTime, issues)
        }

        if (issues.get(pair.pairId)?.kind === 'collision') continue

        issues.set(pair.pairId, {
          pairId: pair.pairId,
          kind: leaf.penetration ? 'collision' : 'clearance',
          ...source
        })
      }
    }

    for (const [time, issues] of witnesses) {
      this.cues.set(
        time,
        feedbackFromIssues(
          {
            origin: 'recorded',
            checkedTime: time,
            totalPairCount: run.result.totalPairCount,
            complete: false,
            message: 'Recorded witness - no new geometry calculation.'
          },
          [...issues.values()]
        )
      )
    }

    this.times = [...this.cues.keys()].sort((a, b) => a - b)
  }

  at(time: number): PlaybackFeedback | undefined {
    if (
      time < this.run.snapshot.interval[0] ||
      time > this.run.snapshot.interval[1]
    )
      return

    const cue = this.cues.get(time)

    if (cue) {
      if (this.currentCue?.checkedTime === time) return this.currentCue

      const issues = [...cue.issues]
      const known = new Set(issues.map((issue) => issue.pairId))
      let complete = true

      for (const [pairId, source] of this.sources) {
        const pair = this.evidence.get(pairId)

        if (pair && coversTime(pair.leaves, time, true)) continue

        complete = false

        if (!known.has(pairId))
          issues.push({ pairId, kind: 'unresolved', ...source })
      }

      // Only the current cue expands unknowns; never retain pairs × witnesses.
      this.currentCue = { ...cue, issues, complete }
      return this.currentCue
    }
    if (!this.covers(time, false)) return

    return {
      origin: 'recorded',
      kind: 'clear',
      checkedTime: time,
      issues: [],
      totalPairCount: this.run.result.totalPairCount,
      complete: true,
      message:
        'Recorded clear interval certificates - no new geometry calculation.'
    }
  }

  nextWitness(after: number | null, before: number) {
    if (after === null) return

    let low = 0
    let high = this.times.length

    while (low < high) {
      const middle = Math.floor((low + high) / 2)

      if (this.times[middle] <= after) low = middle + 1
      else high = middle
    }

    const time = this.times[low]

    if (time !== undefined && time <= before) return time
  }

  private covers(time: number, allowWitness: boolean) {
    const pairs = this.run.result.pairEvidence

    return (
      pairs.length === this.run.snapshot.pairs.length &&
      pairs.every((pair) =>
        coversTime(pair.evidence.leaves, time, allowWitness)
      )
    )
  }
}

/** Validated leaves are ordered; inspect only intervals adjacent to the queried time. */
function coversTime(
  leaves: readonly IntervalEvidence[],
  time: number,
  allowWitness: boolean
) {
  let low = 0
  let high = leaves.length

  while (low < high) {
    const middle = Math.floor((low + high) / 2)

    if (leaves[middle].end < time) low = middle + 1
    else high = middle
  }

  return [leaves[low], leaves[low + 1]].some(
    (leaf) =>
      leaf &&
      leaf.start <= time &&
      time <= leaf.end &&
      (leaf.state === 'clear' ||
        (allowWitness && leaf.state === 'finding' && leaf.witnessTime === time))
  )
}
