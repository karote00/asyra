import type {
  PlaybackFeedback,
  PlaybackIssue
} from '../experiments/playback-feedback'

const labels: Record<PlaybackIssue['kind'], string> = {
  collision: 'Collision',
  clearance: 'Clearance',
  unresolved: 'Not fully checked'
}

const tones: Record<PlaybackIssue['kind'], string> = {
  collision: 'text-[#ff625e]',
  clearance: 'text-[#ffbd59]',
  unresolved: 'text-sim-muted'
}

function PairIssue({ issue }: { issue: PlaybackIssue }) {
  return (
    <p
      data-pair-id={issue.pairId}
      data-pair-kind={issue.kind}
      className="mt-1 text-[10px] wrap-anywhere"
    >
      <span className={tones[issue.kind]}>{labels[issue.kind]}</span>
      {' - '}
      {issue.name}
    </p>
  )
}

export function FeedbackDetails({
  feedback,
  matches
}: {
  feedback: PlaybackFeedback
  matches: boolean
}) {
  const highlighted = Boolean(feedback.highlight?.colors.size)

  return (
    <>
      {feedback.issues.slice(0, 2).map((issue) => (
        <PairIssue key={issue.pairId} issue={issue} />
      ))}

      {feedback.issues.length > 2 && (
        <details className="mt-1 pointer-events-auto text-[10px]">
          <summary className="cursor-pointer text-sim-muted">
            Show all {feedback.issues.length} pair issues
          </summary>

          <div className="max-h-40 overflow-y-auto overscroll-contain">
            {feedback.issues.map((issue) => (
              <PairIssue key={issue.pairId} issue={issue} />
            ))}
          </div>
        </details>
      )}

      <p className="mt-2 text-[10px] leading-relaxed text-sim-muted">
        {highlighted
          ? 'Last checked parts highlighted - not a precise contact region. '
          : ''}
        {highlighted && !matches && 'Current pose is not yet checked. '}
        {feedback.message}
      </p>

      {!feedback.complete && feedback.kind !== 'checking' && (
        <p className="mt-1 text-[10px] text-sim-muted">
          Incomplete coverage - other contacts may be unobserved.
        </p>
      )}
    </>
  )
}
