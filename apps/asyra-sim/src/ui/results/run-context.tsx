import type { RunRecord } from '../../storage/run-record'

/** Present frozen provenance without resolving names from the current model. */
export function RunContext({ run }: { run: RunRecord }) {
  return (
    <div className="grid gap-2 text-xs leading-relaxed wrap-anywhere">
      <p>
        Experiment revision {run.snapshot.source.experimentRevision} - rule
        revision {run.snapshot.rule.revision}
      </p>

      <details>
        <summary>Original source identities</summary>
        <p>Candidate: {run.snapshot.source.candidateId}</p>
        <p>Experiment: {run.snapshot.source.experimentId}</p>
        <p>Run: {run.result.runId}</p>
        <p>Snapshot: {run.snapshot.snapshotId}</p>
        {run.lineage && (
          <p>Copied from candidate: {run.lineage.copiedFromCandidateId}</p>
        )}
      </details>
    </div>
  )
}
