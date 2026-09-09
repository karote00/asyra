import { reviewExperimentInput } from './input-navigation'
import { useExperimentField, useExperimentView } from './experiment-context'
import { RunProgress } from '../results/run-progress'
import { ExperimentResult } from './experiment-result'
import { PreflightView } from './preflight-view'

export function ExperimentProgress() {
  const view = useExperimentView()

  const runningInput = useExperimentField('runningInput')

  const runtime = useExperimentField('runtime')

  return (
    <>
      {runningInput && (
        <RunProgress
          analysis={runtime.features.analysis}
          snapshotId={runningInput.snapshotId}
          budget={runningInput.budget}
          onCancel={() => view.getSnapshot().active.current?.abort()}
        />
      )}
    </>
  )
}

export function ExperimentPreflight() {
  const view = useExperimentView()

  const draft = useExperimentField('draft')

  const preflight = useExperimentField('preflight')

  const warnings = useExperimentField('warnings')
  const running = useExperimentField('running')

  const content = (
    <PreflightView
      draft={draft}
      preflight={preflight}
      warnings={warnings}
      setWarnings={(...args) => view.getSnapshot().setWarnings(...args)}
      changed={(draft) => {
        view.getSnapshot().changed(draft)
        if (view.getSnapshot().canonical) void view.getSnapshot().save(draft)
      }}
    />
  )
  if (
    preflight &&
    !running &&
    !preflight.blockers.length &&
    !preflight.assumptions.length &&
    !preflight.resourceWarnings.length
  )
    return (
      <details className="text-[10px] text-sim-muted">
        <summary>
          Preflight passed - {preflight.estimate.pairCount} pairs -{' '}
          {preflight.estimate.workUnits} work units
        </summary>
        {content}
      </details>
    )
  return content
}

export function ExperimentError() {
  const error = useExperimentField('error')

  return (
    <>
      {error && (
        <p
          className="inline-error text-sim-error-text bg-sim-error p-[11px] rounded-[5px]
              text-[11px] leading-[1.6] wrap-anywhere"
          role="alert"
        >
          {error}
          <button
            className="block mt-2"
            onClick={(event) => {
              const panel = event.currentTarget.closest('.experiment-panel')
              if (!panel) return
              reviewExperimentInput(panel, error.toLowerCase())
            }}
          >
            Review input
          </button>
        </p>
      )}
    </>
  )
}

export function ExperimentEvidence() {
  const view = useExperimentView()

  const session = useExperimentField('session')
  const historical = useExperimentField('historicalReplay')
  const canonicalDraft = useExperimentField('canonicalDraft')
  const runtime = useExperimentField('runtime')

  const selectedRun = useExperimentField('selectedRun')

  const retainedIds = useExperimentField('retainedIds')

  const workcell = useExperimentField('workcell')

  return (
    <>
      {historical && (
        <div className="text-[11px] bg-sim-warning text-sim-warning-text p-3 rounded">
          <p>Historical run replay - frozen inputs</p>
          <button
            onClick={() => {
              view.getSnapshot().onPlayback(null)
              view.getSnapshot().setTab('preview')
            }}
          >
            Return to current preview
          </button>
        </div>
      )}
      <ExperimentResult
        session={session}
        canonicalDraft={canonicalDraft}
        inputReader={runtime.experimentInputs}
        replayRun={(...args) => view.getSnapshot().replayRun(...args)}
        selectedRun={selectedRun}
        retainSelectedRun={(...args) =>
          view.getSnapshot().retainSelectedRun(...args)
        }
        retainedIds={retainedIds}
        workcell={workcell}
        onOpenRuns={(...args) => view.getSnapshot().onOpenRuns(...args)}
      />
    </>
  )
}
