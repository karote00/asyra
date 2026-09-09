import { projectResultPairs } from './result-pairs'
import { useMemo, useState } from 'react'
import type { ExperimentSnapshot } from '../../analysis/contracts'
import { formatDistance } from './format-distance'
import { MethodDetails } from './method-details'
import { PairEvidenceView } from './pair-evidence-view'
import { RuleEvaluationView } from './rule-evaluation-view'
import { PresentedRun } from './run-freshness'

const summaryLabels = {
  'issue-found': 'Issue found',
  'no-issue-within-scope': 'No issue found within scope',
  'cannot-determine': 'Cannot determine'
}

export function AnalysisResultView({
  run,
  stale,
  onReplay
}: {
  run: PresentedRun
  stale: boolean
  onReplay: (
    snapshot: ExperimentSnapshot,
    time: number,
    bodyIds: readonly string[]
  ) => void
}) {
  const { result, snapshot } = run

  const missing = result.totalPairCount - result.coveredPairCount

  const lower =
    missing || !result.pairEvidence.length
      ? 0
      : result.pairEvidence.reduce(
          (minimum, pair) => Math.min(minimum, pair.evidence.lower),
          Infinity
        )

  const upper = result.pairEvidence.reduce<number | null>(
    (minimum, pair) =>
      pair.evidence.upper === null
        ? minimum
        : Math.min(minimum ?? Infinity, pair.evidence.upper),
    null
  )

  const pairs = useMemo(
    () => projectResultPairs(result, snapshot),
    [result, snapshot]
  )
  const [showAll, setShowAll] = useState(() => pairs.attention.length === 0)
  const visiblePairs = showAll ? pairs.all : pairs.attention
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(visiblePairs.length / 20))

  const currentPage = Math.min(page, pageCount - 1)

  return (
    <section
      className="result-card border border-sim-border rounded-[8px] p-[14px] grid gap-[13px]"
      data-testid="analysis-result"
    >
      <div className="result-title flex justify-between items-center gap-[10px] [&_h3]:mt-[5px] [&_h3]:text-[14px]">
        <div>
          <span className="eyebrow text-[9px] tracking-[1.3px] text-sim-muted font-bold">
            FORMAL RESULT
          </span>

          <h3>{summaryLabels[result.summary]}</h3>
        </div>

        <span
          className={`result-state rounded-[5px] bg-sim-warning text-sim-warning-text py-[6px]
            px-2 text-[10px] [&.does-not-meet]:bg-sim-error
            [&.does-not-meet]:text-sim-error-text [&.meets]:bg-sim-success
            [&.meets]:text-sim-success-text ${result.verdict}`}
          aria-label="User verdict"
        >
          {result.decision ? 'User: ' : ''}
          {result.verdict.replaceAll('-', ' ')}
        </span>
      </div>

      {stale && (
        <p className="stale-notice bg-sim-warning text-sim-warning-text p-[10px] rounded-[5px] text-[10px] leading-[1.6]">
          Historical inputs differ from the current model or experiment. Replay
          uses this run&apos;s frozen inputs.
        </p>
      )}

      <dl
        className="result-grid grid grid-cols-[1fr_1fr] gap-3 m-0 [&_dt]:text-[9px]
          [&_dt]:text-sim-muted [&_dt]:mb-1 [&_dd]:m-0 [&_dd]:text-[11px]
          [&_dd]:font-[650]"
      >
        <div>
          <dt>Execution</dt>

          <dd>{result.execution}</dd>
        </div>

        <div>
          <dt>Coverage</dt>

          <dd>{result.coverage}</dd>
        </div>

        <div>
          <dt>Pairs with evidence</dt>

          <dd>
            {result.coveredPairCount}/{result.totalPairCount}
          </dd>
        </div>

        <div>
          <dt>Finding / unresolved pairs</dt>

          <dd>
            {result.findingPairCount} / {result.unresolvedPairCount + missing}
          </dd>
        </div>

        <div>
          <dt>Geometry</dt>

          <dd>
            {snapshot.version === 2
              ? `Original parts - ${snapshot.workcell.bodies.reduce((sum, body) => sum + body.colliders.reduce((count, part) => count + (part.geometry.kind === 'mesh' ? part.geometry.indices.length / 3 : 0), 0), 0).toLocaleString('en-US')} triangles`
              : 'Native / historical primitives'}
          </dd>
        </div>

        <div>
          <dt>Minimum lower bound</dt>

          <dd>{formatDistance(lower)}</dd>
        </div>

        <div>
          <dt>Witness upper bound</dt>

          <dd>{formatDistance(upper)}</dd>
        </div>
      </dl>

      <p className="hint text-[10px] leading-[1.6] text-sim-muted font-normal">
        Bounds describe modeled geometry over the selected interval. Unknown
        regions remain unresolved. Analysis runtime is not robot cycle time.
      </p>

      {missing > 0 && (
        <p
          className="inline-error text-sim-error-text bg-sim-error p-[11px] rounded-[5px]
            text-[11px] leading-[1.6] wrap-anywhere"
        >
          {missing} pairs have no retained evidence.
        </p>
      )}

      {pairs.missing.length > 0 && (
        <details>
          <summary>
            Unresolved pairs without evidence{' '}
            <span>{pairs.missing.length}</span>
          </summary>
          {pairs.missing.map((pair) => (
            <p key={pair.id} className="text-[10px] wrap-anywhere my-2">
              {pair.a.bodyId} - {pair.b.bodyId}: no retained evidence
            </p>
          ))}
        </details>
      )}

      <details open>
        <summary>
          Pair evidence and replay{' '}
          <span>{result.pairEvidence.length} records</span>
        </summary>

        <p className="text-[11px] text-sim-muted my-2">
          Finding and unresolved pairs first. Full records remain unchanged.
        </p>
        <button
          onClick={() => {
            setShowAll(!showAll)
            setPage(0)
          }}
        >
          {showAll ? 'Show finding and unresolved pairs' : 'Show all pairs'}
        </button>
        {!visiblePairs.length && (
          <p className="text-[11px] my-2">
            No finding or unresolved records. Open all pairs for complete
            evidence.
          </p>
        )}
        <div className="evidence-list grid gap-[10px] max-h-[450px] overflow-auto">
          {visiblePairs
            .slice(currentPage * 20, (currentPage + 1) * 20)
            .map((pair) => {
              const source = pairs.sources.get(pair.pairId)

              if (!source)
                throw new Error(
                  'Result pair is missing from its frozen snapshot'
                )

              return (
                <PairEvidenceView
                  key={pair.pairId}
                  pair={pair}
                  snapshot={snapshot}
                  source={source}
                  onReplay={onReplay}
                />
              )
            })}
        </div>

        {pageCount > 1 && (
          <div className="pagination flex items-center justify-between gap-2 my-[10px] mx-0 text-[10px]">
            <button
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous pairs
            </button>

            <span>
              Pair page {currentPage + 1}/{pageCount} - all records retained
            </span>

            <button
              disabled={currentPage + 1 === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Next pairs
            </button>
          </div>
        )}
      </details>

      <p className="method-line text-[9px] text-sim-muted wrap-anywhere leading-[1.7]">
        {result.method.id}@{result.method.version} - experiment r
        {result.source.experimentRevision} - rule r{result.rule.revision}
      </p>

      <MethodDetails descriptor={snapshot.methodDescriptor} historical />

      {result.decision && <RuleEvaluationView value={result.decision} />}
      <details>
        <summary>
          Scope and assumptions <span>{snapshot.pairs.length} pairs</span>
        </summary>

        <p className="hint text-[10px] leading-[1.6] text-sim-muted font-normal">
          {snapshot.scope.backgroundNote}
        </p>

        <p className="hint text-[10px] leading-[1.6] text-sim-muted font-normal">
          {snapshot.scope.excludedPairs.length} excluded body pairs -{' '}
          {snapshot.scope.acknowledgedExcludedVisibleBodyIds.length}{' '}
          acknowledged background bodies
        </p>

        {snapshot.scope.excludedPairs.map((pair) => (
          <p
            className="method-line text-[9px] text-sim-muted wrap-anywhere leading-[1.7]"
            key={`${pair.a}/${pair.b}`}
          >
            {pair.a} / {pair.b}: {pair.reason}
          </p>
        ))}
      </details>

      {result.errors.map((error, index) => (
        <p
          className="inline-error text-sim-error-text bg-sim-error p-[11px] rounded-[5px]
            text-[11px] leading-[1.6] wrap-anywhere"
          key={index}
        >
          {error}
        </p>
      ))}
    </section>
  )
}
