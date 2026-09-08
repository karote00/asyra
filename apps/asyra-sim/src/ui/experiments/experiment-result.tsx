import type { ExperimentInputReader } from '../../storage/experiment-input'
import { type Workcell } from '../../domain/workcell'
import { AnalysisResultView } from '../results/analysis-result-view'
import { isPresentedRunStale } from '../results/run-freshness'
import { useExperimentController } from './use-experiment-controller'

type Props = Pick<
  ReturnType<typeof useExperimentController>,
  'canonicalDraft' | 'replayRun' | 'selectedRun' | 'retainSelectedRun'
> & {
  inputReader: ExperimentInputReader
  retainedIds: ReadonlySet<string>
  workcell: Workcell
  onOpenRuns: () => void
}

export function ExperimentResult({
  canonicalDraft,
  inputReader,
  replayRun,
  selectedRun,
  retainSelectedRun,
  retainedIds,
  workcell,
  onOpenRuns
}: Props) {
  return (
    <>
      {selectedRun && canonicalDraft && (
        <>
          <div className="retention-actions flex flex-wrap gap-2 my-3 mx-0 [&_>_p]:basis-full">
            <p className="hint text-[10px] leading-[1.6] text-sim-muted font-normal">
              {retainedIds.has(selectedRun.result.runId)
                ? 'Retained in this project.'
                : 'Result is not retained in the current project.'}
            </p>

            {!retainedIds.has(selectedRun.result.runId) && (
              <button onClick={retainSelectedRun}>Retry retention</button>
            )}

            <button onClick={onOpenRuns}>Browse runs &amp; compare</button>
          </div>

          <AnalysisResultView
            key={selectedRun.result.runId}
            run={selectedRun}
            stale={isPresentedRunStale(
              selectedRun,
              workcell,
              canonicalDraft,
              inputReader
            )}
            onReplay={replayRun}
          />
        </>
      )}
    </>
  )
}
