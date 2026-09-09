import type { ReactNode } from 'react'
import { useExperimentField, useExperimentView } from './experiment-context'

const tabs = ['setup', 'preview', 'results'] as const
const labels = { setup: 'Setup', preview: 'Preview', results: 'Results' }

export function ExperimentTabs() {
  const view = useExperimentView()
  const active = useExperimentField('tab')
  return (
    <div
      role="tablist"
      aria-label="Experiment workflow"
      className="flex shrink-0 px-3 border-b border-sim-border"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab}
          id={`experiment-tab-${tab}`}
          role="tab"
          aria-selected={active === tab}
          aria-controls={`experiment-panel-${tab}`}
          tabIndex={active === tab ? 0 : -1}
          className="flex-1 rounded-none border-0 border-b-2 border-transparent aria-selected:border-sim-accent aria-selected:text-sim-accent py-3 max-[720px]:py-2"
          onClick={() => view.getSnapshot().setTab(tab)}
          onKeyDown={(event) => {
            let next = index
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
            else if (event.key === 'ArrowLeft')
              next = (index + tabs.length - 1) % tabs.length
            else if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = tabs.length - 1
            else return
            event.preventDefault()
            view.getSnapshot().setTab(tabs[next])
            const buttons =
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]'
              )
            buttons?.[next]?.focus()
          }}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  )
}

export function ExperimentTabPanel({
  tab,
  children
}: {
  tab: (typeof tabs)[number]
  children: ReactNode
}) {
  const active = useExperimentField('tab')
  return (
    <div
      role="tabpanel"
      id={`experiment-panel-${tab}`}
      aria-labelledby={`experiment-tab-${tab}`}
      hidden={active !== tab}
      className="grid gap-[17px] [&[hidden]]:hidden"
    >
      {children}
    </div>
  )
}

export function ExperimentCompletion() {
  const view = useExperimentView()
  const run = useExperimentField('selectedRun')
  const running = useExperimentField('running')
  if (!run || running) return null
  return (
    <div
      className="flex items-center justify-between gap-2 text-[11px]"
      aria-live="polite"
    >
      <span>Analysis {run.result.execution}</span>
      <button onClick={() => view.getSnapshot().setTab('results')}>
        View results
      </button>
    </div>
  )
}
