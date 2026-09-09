import {
  ExperimentTabs,
  ExperimentTabPanel,
  ExperimentCompletion
} from './experiment-navigation'
import type { ReadonlyView } from '../shared/view-source'
import type { ExperimentInputs } from './experiment-inputs'
import { ExperimentProvider, useExperimentView } from './experiment-context'
import { ExperimentFields } from './experiment-fields'
import { ExperimentHeading, ExperimentPicker } from './experiment-picker'
import { ExperimentPlayback } from './experiment-playback'
import {
  ExperimentTrajectory,
  ExperimentOriginalImport
} from './experiment-imports'
import { ExperimentCreation, ExperimentRunAction } from './experiment-actions'
import {
  ExperimentProgress,
  ExperimentPreflight,
  ExperimentError,
  ExperimentEvidence
} from './experiment-evidence'

export function ExperimentPanel({
  inputs
}: {
  inputs: ReadonlyView<ExperimentInputs>
}) {
  return (
    <ExperimentProvider inputs={inputs}>
      <ExperimentLayout />
    </ExperimentProvider>
  )
}

function ExperimentLayout() {
  const view = useExperimentView()

  return (
    <div
      className="experiment-panel h-full min-h-0 overflow-y-auto overflow-x-hidden [&_>_.panel-heading]:flex-none
        [&_>_.panel-heading]:border-b [&_>_.panel-heading]:border-b-sim-divider
        [&_>_.panel-heading]:pt-[19px] max-[720px]:[&_>_.panel-heading]:py-1"
    >
      <ExperimentHeading />
      <div className="px-4 py-3 max-[720px]:py-2 shrink-0">
        <ExperimentPicker />
      </div>
      <div className="px-4 pb-3 grid gap-2">
        <ExperimentRunAction />
        <ExperimentCompletion />
        <ExperimentProgress />
        <ExperimentError />
      </div>
      <ExperimentTabs />

      <div
        className="experiment-scroll p-[18px] flex flex-col gap-[17px]
          min-h-0 [&_>_*]:shrink-0 [&_button]:text-[11px] [&_textarea]:resize-y
          [&_textarea]:text-[11px] [&_textarea]:leading-[1.6] [&_summary]:flex
          [&_summary]:flex-wrap [&_summary]:justify-between
          [&_summary]:items-baseline [&_summary]:[gap:5px_8px]
          [&_summary_>_span]:float-none [&_summary_>_span]:text-right
          [&_label]:wrap-anywhere [&_button]:wrap-anywhere
          [&_summary]:wrap-anywhere [&_.section-heading]:flex-wrap
          [&_.section-heading]:gap-2 [&_.preview-time]:tabular-nums"
      >
        <ExperimentPreflight />
        <ExperimentTabPanel tab="setup">
          <div
            className="contents"
            onBlur={(event) => {
              const target = event.target
              if (
                (target instanceof HTMLInputElement ||
                  target instanceof HTMLTextAreaElement) &&
                (!target.checkValidity() ||
                  (target instanceof HTMLInputElement &&
                    target.type === 'number' &&
                    target.value.trim() === ''))
              )
                return
              queueMicrotask(() => {
                if (view.getSnapshot().canonical && view.getSnapshot().dirty)
                  void view.getSnapshot().save()
              })
            }}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                event.target instanceof HTMLInputElement
              ) {
                event.preventDefault()
                event.target.blur()
              }
            }}
            onChange={(event) => {
              if (
                event.target instanceof HTMLSelectElement ||
                (event.target instanceof HTMLInputElement &&
                  event.target.type === 'checkbox')
              )
                queueMicrotask(() => {
                  if (view.getSnapshot().canonical && view.getSnapshot().dirty)
                    void view.getSnapshot().save()
                })
            }}
            onClick={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('button')
              )
                queueMicrotask(() => {
                  if (view.getSnapshot().canonical && view.getSnapshot().dirty)
                    void view.getSnapshot().save()
                })
            }}
          >
            <ExperimentFields source={view.fields} />
          </div>

          <ExperimentTrajectory />

          <ExperimentOriginalImport />

          <ExperimentCreation />
        </ExperimentTabPanel>
        <ExperimentTabPanel tab="preview">
          <p className="text-[11px] leading-relaxed text-sim-muted">
            Preview checks sampled poses. Run analysis for formal
            continuous-time evidence.
          </p>
          <ExperimentPlayback />
        </ExperimentTabPanel>
        <ExperimentTabPanel tab="results">
          <ExperimentEvidence />
        </ExperimentTabPanel>
      </div>
    </div>
  )
}
