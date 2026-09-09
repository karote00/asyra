import {
  useExperimentField,
  useExperimentValue,
  useExperimentView
} from './experiment-context'

export function ExperimentCreation() {
  const view = useExperimentView()
  const saving = useExperimentField('saving')
  const canonical = useExperimentValue((state) => !!state.canonical)
  if (canonical) return null
  return (
    <button
      className="primary bg-sim-accent text-[#fff] border-sim-accent [&:hover]:bg-sim-accent-hover"
      disabled={saving}
      aria-busy={saving}
      onClick={() => void view.getSnapshot().save()}
    >
      {saving ? 'Creating experiment…' : 'Create experiment'}
    </button>
  )
}

export function ExperimentRunAction() {
  const view = useExperimentView()

  const saving = useExperimentField('saving')

  const running = useExperimentField('running')

  const canonical = useExperimentValue((state) => !!state.canonical)

  return (
    <>
      <div className="run-actions flex gap-2 [&_>_.primary]:flex-1">
        <button
          data-run-analysis
          className="primary bg-sim-accent text-[#fff] border-sim-accent [&:hover]:bg-sim-accent-hover"
          disabled={!canonical || saving || running}
          onClick={(event) => {
            const panel = event.currentTarget.closest('.experiment-panel')
            const invalid = panel?.querySelector<HTMLInputElement>(
              'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"]'
            )
            if (invalid) {
              view
                .getSnapshot()
                .setError(
                  `Correct ${invalid.getAttribute('aria-label') ?? invalid.closest('label')?.textContent ?? 'the marked input'} before analysis.`
                )
              return
            }
            void view.getSnapshot().run()
          }}
        >
          {running ? 'Formal analysis running…' : 'Run analysis'}
        </button>
      </div>
    </>
  )
}
