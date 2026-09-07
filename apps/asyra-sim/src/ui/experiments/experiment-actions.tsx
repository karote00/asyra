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
      onClick={() => void view.getSnapshot().save()}
    >
      Create experiment
    </button>
  )
}

export function ExperimentPreflightAction() {
  const view = useExperimentView()

  const dirty = useExperimentField('dirty')

  const running = useExperimentField('running')

  const canonical = useExperimentValue((state) => !!state.canonical)

  return (
    <>
      <button
        className="wide w-full"
        disabled={!canonical || dirty || running}
        onClick={() => {
          try {
            view.getSnapshot().inspect()

            view.getSnapshot().setError('')
          } catch (reason) {
            view.getSnapshot().fail(reason)
          }
        }}
      >
        Run preflight
      </button>
    </>
  )
}

export function ExperimentRunAction() {
  const view = useExperimentView()

  const dirty = useExperimentField('dirty')

  const running = useExperimentField('running')

  const canonical = useExperimentValue((state) => !!state.canonical)

  return (
    <>
      <div className="run-actions flex gap-2 [&_>_.primary]:flex-1">
        <button
          className="primary bg-sim-accent text-[#fff] border-sim-accent [&:hover]:bg-sim-accent-hover"
          disabled={!canonical || dirty || running}
          onClick={() => void view.getSnapshot().run()}
        >
          {running ? 'Formal analysis running…' : 'Run formal analysis'}
        </button>
      </div>
    </>
  )
}
