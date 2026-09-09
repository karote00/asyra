import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ProjectSession } from '../../storage/project-session'
import type { ExperimentInputReader } from '../../storage/experiment-input'
import { type Workcell } from '../../domain/workcell'
import { AnalysisResultView } from '../results/analysis-result-view'
import { isPresentedRunStale } from '../results/run-freshness'
import { useExperimentController } from './use-experiment-controller'

type Props = Pick<
  ReturnType<typeof useExperimentController>,
  'canonicalDraft' | 'replayRun' | 'selectedRun' | 'retainSelectedRun'
> & {
  session?: ProjectSession
  inputReader: ExperimentInputReader
  retainedIds: ReadonlySet<string>
  workcell: Workcell
  onOpenRuns: () => void
}

export function ExperimentResult({
  canonicalDraft,
  session,
  inputReader,
  replayRun,
  selectedRun,
  retainSelectedRun,
  retainedIds,
  workcell,
  onOpenRuns
}: Props) {
  const stale = useMemo(
    () =>
      !!selectedRun &&
      !!canonicalDraft &&
      isPresentedRunStale(selectedRun, workcell, canonicalDraft, inputReader),
    [selectedRun, workcell, canonicalDraft, inputReader]
  )
  return (
    <>
      {!selectedRun && (
        <p className="text-[11px] text-sim-muted">
          No formal result for this experiment yet. Use Run analysis to create
          one.
        </p>
      )}
      {selectedRun && canonicalDraft && (
        <>
          <AnalysisResultView
            key={selectedRun.result.runId}
            run={selectedRun}
            stale={stale}
            onReplay={replayRun}
          />
          {stale && (
            <button
              onClick={(event) =>
                event.currentTarget
                  .closest('.experiment-panel')
                  ?.querySelector<HTMLButtonElement>('[data-run-analysis]')
                  ?.click()
              }
            >
              Rerun analysis with current inputs
            </button>
          )}
          <ResultSaving
            session={session}
            retained={retainedIds.has(selectedRun.result.runId)}
            onRetain={retainSelectedRun}
          />
          <button onClick={onOpenRuns}>Browse run history</button>
        </>
      )}
    </>
  )
}

const noSubscription = () => () => undefined
const noState = () => null

function ResultSaving({
  session,
  retained,
  onRetain
}: {
  session?: ProjectSession
  retained: boolean
  onRetain: () => unknown
}) {
  const state = useSyncExternalStore(
    session?.subscribe ?? noSubscription,
    session?.getState ?? noState
  )
  const [pending, setPending] = useState(false)
  const active = useRef(false)
  const [error, setError] = useState('')
  const retry = async (action: () => unknown) => {
    if (active.current) return
    active.current = true
    setPending(true)
    setError('')
    try {
      await action()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      active.current = false
      setPending(false)
    }
  }
  let label = 'Result could not be added to this project.'
  if (retained) {
    label = 'Saving to this project'
    if (state?.status === 'saved' && !state.dirty)
      label = 'Saved to this project'
    if (state?.status === 'error') label = `Saving failed: ${state.error}`
  }
  return (
    <div
      className="retention-actions text-[10px] text-sim-muted grid gap-2"
      aria-live="polite"
    >
      <p>{label}</p>
      {error && <p role="alert">{error}</p>}
      {!retained && (
        <button
          disabled={pending}
          aria-busy={pending}
          onClick={() => void retry(onRetain)}
        >
          {pending ? 'Retaining result…' : 'Retry retention'}
        </button>
      )}
      {retained && state?.status === 'error' && (
        <button
          disabled={pending}
          aria-busy={pending}
          onClick={() => void retry(() => session?.flush())}
        >
          {pending ? 'Retrying save…' : 'Retry saving'}
        </button>
      )}
    </div>
  )
}
