import { useState } from 'react'
import { useContentReveal } from '../shared/use-content-reveal'
import type { ExperimentSnapshot } from '../../analysis/contracts'
import type { RunRecord } from '../../storage/run-record'
import { FieldObservations } from '../observations/field-observations'
import { type ObservationAccess } from '../observations/observation-access'
import { AnalysisResultView } from './analysis-result-view'
import { RunContext } from './run-context'
import { RunComparisonView } from './run-comparison-view'
import { useRunLibrary } from './use-run-library'

export function RunLibrary({
  runs,
  retainedIds,
  candidateIds,
  onRetain,
  onReplay,
  onCandidate,
  isStale,
  runtime,
  isCurrent,
  onClose
}: {
  runs: readonly RunRecord[]
  retainedIds: ReadonlySet<string>
  candidateIds: ReadonlySet<string>
  onRetain: (run: RunRecord) => Promise<void>
  onReplay: (
    snapshot: ExperimentSnapshot,
    time: number,
    bodyIds: readonly string[]
  ) => void
  onCandidate: (id: string) => void
  isStale: (run: RunRecord) => boolean
  runtime: ObservationAccess
  isCurrent: () => boolean
  onClose: () => void
}) {
  const {
    dialog,
    selectedId,
    setSelectedId,
    comparisonIds,
    setComparisonIds,
    comparison,
    comparisonRuns,
    comparing,
    clearComparison,
    compareSelected,
    error,
    saving,
    setPage,
    selected,
    pages,
    currentPage,
    exportReport,
    retainSelected
  } = useRunLibrary({ runs, onRetain })

  const [detailRequest, setDetailRequest] = useState<object | null>(null)
  const detailTarget = useContentReveal<HTMLElement>(detailRequest)

  return (
    <dialog
      ref={dialog}
      className="run-dialog [width:min(1080px,_calc(100vw_-_48px))]
        [max-height:calc(100dvh_-_64px)] p-6 border border-sim-border
        rounded-[12px] text-sim-text shadow-[0_24px_80px_#101f2a40]
        [&::backdrop]:bg-[#101f2a80] [&_.result-card]:mt-[14px]
        [&_.result-card_summary]:cursor-pointer
        [&_.result-card_summary]:text-[11px] [&_.result-card_summary]:my-[6px]
        [&_.result-card_summary]:mx-0"
      aria-label="Runs and comparison"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || event.nativeEvent.isComposing) return
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }}
    >
      <header
        className="project-dialog-heading flex gap-3 items-center justify-between mb-[14px]
          [&_h2]:mt-[6px] [&_h2]:text-[20px]"
      >
        <div>
          <span className="eyebrow text-[9px] tracking-[1.3px] text-sim-muted font-bold">
            IMMUTABLE EXPERIMENT EVIDENCE
          </span>

          <h2>Runs &amp; compare</h2>
        </div>

        <button onClick={onClose}>Close runs</button>
      </header>

      <p className="hint text-[10px] leading-[1.6] text-sim-muted font-normal">
        Completed results are retained automatically. Comparisons do not select
        a winner or approve equipment operation.
      </p>

      {runs.length === 0 && (
        <p>No runs yet. Configure an experiment and run formal analysis.</p>
      )}

      <div
        className="run-library-grid grid grid-cols-[250px_minmax(0,_1fr)] gap-6 my-5 mx-0
          min-[701px]:max-[900px]:grid-cols-[200px_minmax(0,_1fr)] max-[900px]:gap-4 max-[700px]:grid-cols-1"
      >
        <section
          aria-label="Run history"
          className="run-history flex flex-col gap-3 [&_article]:grid [&_article]:gap-[9px]
            [&_article]:p-[10px] [&_article]:bg-sim-raised [&_article]:rounded-[6px]
            [&_article_>_button]:grid [&_article_>_button]:gap-[5px]
            [&_article_>_button]:text-left [&_article_>_button]:wrap-anywhere
            [&_article_>_button[aria-pressed=true]]:border-sim-focus
            [&_article_>_button[aria-pressed=true]]:bg-sim-selected
            [&_small]:text-[9px] [&_small]:text-sim-muted [&_small]:wrap-anywhere"
        >
          <h3>{runs.length} results</h3>

          {[...runs]
            .reverse()
            .slice(currentPage * 30, (currentPage + 1) * 30)
            .map((run) => (
              <article key={run.result.runId}>
                <button
                  aria-pressed={selectedId === run.result.runId}
                  onClick={() => {
                    setSelectedId(run.result.runId)
                    setDetailRequest({})
                  }}
                >
                  <strong>{run.name}</strong>

                  <span>
                    {run.result.execution} - {run.result.coverage}
                  </span>

                  <small>
                    Experiment revision {run.snapshot.source.experimentRevision}{' '}
                    - {run.snapshot.method.id}@{run.snapshot.method.version}
                  </small>

                  <small>{run.result.runId}</small>
                </button>

                <span className="run-retention-label text-[10px] text-sim-muted">
                  {retainedIds.has(run.result.runId)
                    ? 'Retained in project'
                    : 'Temporary - not saved'}
                </span>

                <label className="checkbox flex-row items-center gap-[6px] [&_span]:text-sim-muted [&_span]:font-normal">
                  <input
                    type="checkbox"
                    aria-label={`Compare ${run.result.runId}`}
                    checked={comparisonIds.includes(run.result.runId)}
                    disabled={
                      comparisonIds.length >= 3 &&
                      !comparisonIds.includes(run.result.runId)
                    }
                    onChange={(event) => {
                      setComparisonIds((current) =>
                        event.target.checked
                          ? [...current, run.result.runId]
                          : current.filter((id) => id !== run.result.runId)
                      )

                      clearComparison()
                    }}
                  />
                  Include in comparison
                </label>
              </article>
            ))}

          {pages > 1 && (
            <div className="pagination flex items-center justify-between gap-2 my-[10px] mx-0 text-[10px]">
              <button
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous runs
              </button>

              <span>
                {currentPage + 1}/{pages}
              </span>

              <button
                disabled={currentPage + 1 === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next runs
              </button>
            </div>
          )}

          <section
            aria-label="Selected comparison runs"
            className="grid gap-2 wrap-anywhere"
          >
            <h4>Selected comparison runs</h4>
            {comparisonRuns.length === 0 && (
              <p>Select two or three runs below their history entries.</p>
            )}
            {comparisonRuns.map((run, index) => {
              const label = `${index + 1} - ${run.name}`
              return (
                <div
                  key={run.result.runId}
                  className="grid gap-2 border border-sim-divider rounded p-2 text-xs"
                >
                  <strong>{label}</strong>
                  <span>
                    Experiment revision {run.snapshot.source.experimentRevision}
                  </span>
                  <button
                    onClick={() => {
                      setComparisonIds((current) =>
                        current.filter((id) => id !== run.result.runId)
                      )
                      clearComparison()
                    }}
                  >
                    Remove {label}
                  </button>
                </div>
              )
            })}
          </section>

          <button
            className="primary bg-sim-accent text-[#fff] border-sim-accent [&:hover]:bg-sim-accent-hover"
            disabled={comparing || comparisonIds.length < 2}
            aria-busy={comparing}
            onClick={compareSelected}
          >
            {comparing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full border-2 border-current border-r-transparent animate-spin motion-reduce:animate-none"
                />
                Comparing runs…
              </span>
            ) : (
              `Compare selected runs (${comparisonIds.length}/3)`
            )}
          </button>
        </section>

        <section
          className="run-detail min-w-0"
          aria-label="Selected run"
          ref={detailTarget}
          tabIndex={-1}
        >
          {selected && (
            <>
              <div className="section-heading flex items-center justify-between [&_>_span]:text-[10px] [&_>_span]:text-sim-muted">
                <h3>{selected.name}</h3>

                <span className="run-retention-label text-[10px] text-sim-muted">
                  {retainedIds.has(selected.result.runId)
                    ? 'Retained in project'
                    : 'Temporary result'}
                </span>
              </div>

              <RunContext run={selected} />

              <div className="run-detail-actions flex flex-wrap gap-2 my-3 mx-0 [&_button]:text-[11px]">
                {!retainedIds.has(selected.result.runId) && (
                  <button
                    disabled={
                      saving ||
                      retainedIds.has(selected.result.runId) ||
                      !candidateIds.has(selected.snapshot.source.candidateId)
                    }
                    onClick={retainSelected}
                  >
                    {saving ? 'Retaining result…' : 'Retry retention'}
                  </button>
                )}

                <button
                  disabled={
                    !candidateIds.has(selected.snapshot.source.candidateId)
                  }
                  onClick={() => {
                    onCandidate(selected.snapshot.source.candidateId)

                    onClose()
                  }}
                >
                  Select source candidate
                </button>

                {(['json', 'csv', 'html'] as const).map((format) => (
                  <button key={format} onClick={() => exportReport(format)}>
                    Export {format.toUpperCase()}
                  </button>
                ))}
              </div>

              {!candidateIds.has(selected.snapshot.source.candidateId) && (
                <p className="stale-notice bg-sim-warning text-sim-warning-text p-[10px] rounded-[5px] text-[10px] leading-[1.6]">
                  Source candidate is absent. Historical reports and replay
                  remain available; Undo may restore the source.
                </p>
              )}

              <p className="method-line text-[9px] text-sim-muted wrap-anywhere leading-[1.7]">
                Asyra Sim {selected.environment.appVersion} -{' '}
                {selected.environment.hardwareConcurrency} logical processors
                reported by browser
                <br />
                {selected.environment.userAgent}
              </p>

              <AnalysisResultView
                key={selected.result.runId}
                run={selected}
                stale={isStale(selected)}
                onReplay={(snapshot, time, bodyIds) => {
                  onReplay(snapshot, time, bodyIds)

                  onClose()
                }}
              />

              <FieldObservations
                key={`${selected.result.runId}:${retainedIds.has(selected.result.runId)}`}
                runtime={runtime}
                runId={selected.result.runId}
                retained={retainedIds.has(selected.result.runId)}
                isCurrent={isCurrent}
              />
            </>
          )}
        </section>
      </div>

      {error && (
        <p
          className="inline-error text-sim-error-text bg-sim-error p-[11px] rounded-[5px]
            text-[11px] leading-[1.6] wrap-anywhere"
          role="alert"
        >
          {error}
        </p>
      )}

      {comparison && <RunComparisonView comparison={comparison} />}
    </dialog>
  )
}
