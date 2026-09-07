import type { ExperimentSnapshot } from '../../analysis/contracts'
import type { LiveSample } from '../../analysis/live/protocol'
import type { PartHighlight } from '../../render-app/workcell-frame'

export type PlaybackFindingKind = 'collision' | 'clearance' | 'unresolved'

export interface PlaybackIssue {
  pairId: string
  kind: PlaybackFindingKind
  bodyIds: readonly [string, string]
  name: string
}

export interface PlaybackFeedback {
  origin?: 'live' | 'recorded'
  kind: PlaybackFindingKind | 'checking' | 'clear' | 'error'
  checkedTime: number | null
  issues: readonly PlaybackIssue[]
  highlight?: PartHighlight
  complete: boolean
  totalPairCount: number
  message: string
}

export const checkingFeedback = (): PlaybackFeedback => ({
  kind: 'checking',
  checkedTime: null,
  issues: [],
  complete: false,
  totalPairCount: 0,
  message: 'Checking live geometry…'
})

/** One presentation per accepted evidence update; frames reuse its appearance. */
export function feedbackFromIssues(
  input: Omit<PlaybackFeedback, 'kind' | 'issues' | 'highlight'>,
  issues: readonly PlaybackIssue[]
): PlaybackFeedback {
  const collisions: PlaybackIssue[] = []
  const clearances: PlaybackIssue[] = []
  const unknowns: PlaybackIssue[] = []
  const colors = new Map<string, number>()

  for (const issue of issues) {
    if (issue.kind === 'collision') {
      collisions.push(issue)
      for (const id of issue.bodyIds) colors.set(id, 0xff625e)
    } else if (issue.kind === 'clearance') {
      clearances.push(issue)
      for (const id of issue.bodyIds)
        if (colors.get(id) !== 0xff625e) colors.set(id, 0xffbd59)
    } else unknowns.push(issue)
  }

  let kind: PlaybackFeedback['kind'] = 'clear'

  if (!input.complete || unknowns.length) kind = 'unresolved'
  if (clearances.length) kind = 'clearance'
  if (collisions.length) kind = 'collision'

  return {
    ...input,
    kind,
    issues: [...collisions, ...clearances, ...unknowns],
    highlight: colors.size ? { colors } : undefined
  }
}

/** Present validated method states only; no geometry or user-verdict evaluation. */
export function playbackFeedback(
  snapshot: ExperimentSnapshot,
  sample: LiveSample
): PlaybackFeedback {
  const bodies = new Map(
    snapshot.workcell.bodies.map((body) => [body.id, body])
  )
  const sources = new Map(snapshot.pairs.map((pair) => [pair.id, pair]))
  const issues: PlaybackIssue[] = []

  for (const pair of sample.pairs) {
    let kind: PlaybackFindingKind | undefined

    if (pair.evidence.coverage === 'partial') kind = 'unresolved'

    for (const leaf of pair.evidence.leaves) {
      if (leaf.state !== 'finding') continue

      kind = 'clearance'
      if (leaf.penetration) {
        kind = 'collision'
        break
      }
    }

    if (!kind) continue

    const source = sources.get(pair.pairId)

    if (!source) throw new Error('Live evidence is missing its source pair')

    const a = bodies.get(source.a.bodyId)
    const b = bodies.get(source.b.bodyId)

    if (!a || !b) throw new Error('Live evidence is missing its source body')

    issues.push({
      pairId: pair.pairId,
      kind,
      bodyIds: [a.id, b.id],
      name: `${a.name} - ${b.name}`
    })
  }

  return feedbackFromIssues(
    {
      checkedTime: sample.time,
      complete: sample.complete,
      totalPairCount: sample.totalPairCount,
      message: sample.error ?? 'Sampled check only - not a full-path report.'
    },
    issues
  )
}
