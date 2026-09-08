import { useMemo, useRef, useState } from 'react'
import {
  useExperimentField,
  useExperimentValue,
  useExperimentView
} from './experiment-context'
import { GlbPreview } from '../imports/glb-preview'
import { TrajectoryImportPanel } from '../imports/trajectory-import-panel'

export function ExperimentTrajectory() {
  const view = useExperimentView()
  const [open, setOpen] = useState(false)

  const canonical = useExperimentField('canonical')

  const workcell = useExperimentField('workcell')

  const saving = useExperimentField('saving')
  const runtime = useExperimentField('runtime')
  const setTrajectoryValid = useExperimentField('setTrajectoryValid')

  const trajectory = useExperimentValue((state) => state.draft.trajectory)

  const sourceIdentity = useMemo(
    () =>
      JSON.stringify({
        id: canonical?.id ?? 'new',
        trajectory: canonical?.definition.trajectory,
        sourceUnits: canonical?.definition.sourceUnits,
        input: canonical?.definition.trajectoryInput
      }),
    [
      canonical?.id,
      canonical?.definition.trajectory,
      canonical?.definition.sourceUnits,
      canonical?.definition.trajectoryInput
    ]
  )

  const lifetime = useRef({
    identity: sourceIdentity,
    key: 0,
    pending: new Set<string>()
  })
  if (lifetime.current.identity !== sourceIdentity) {
    if (!lifetime.current.pending.delete(sourceIdentity)) {
      lifetime.current.key++
      lifetime.current.pending.clear()
    }
    lifetime.current.identity = sourceIdentity
  }

  return (
    <>
      <TrajectoryImportPanel
        key={lifetime.current.key}
        open={open}
        onOpen={setOpen}
        workcell={workcell}
        trajectory={canonical?.definition.trajectory ?? trajectory}
        saving={saving}
        input={canonical?.definition.trajectoryInput}
        reader={runtime.experimentInputs}
        onValidity={setTrajectoryValid}
        onEdit={async (input, result) => {
          const value = result.value
          const state = view.getSnapshot()
          const next = {
            ...state.draft,
            trajectoryInput: input,
            ...(value
              ? {
                  trajectory: value.trajectory,
                  sourceUnits: value.sourceUnits
                }
              : {})
          }
          if (!state.canonical) {
            state.changed(next)
            return true
          }
          const identity = JSON.stringify({
            id: state.canonical.id,
            trajectory: next.trajectory,
            sourceUnits: next.sourceUnits,
            input
          })
          if (identity !== lifetime.current.identity)
            lifetime.current.pending.add(identity)
          const saved = await state.save(next)
          if (saved === false) lifetime.current.pending.delete(identity)
          return saved !== false
        }}
        onAccept={(value, input) => {
          const first = value.trajectory.keyframes[0]

          const last = value.trajectory.keyframes.at(-1)

          if (!first || !last)
            throw new Error('Accepted trajectory has no keyframes')

          void view.getSnapshot().save({
            ...view.getSnapshot().draft,
            trajectoryInput: input,
            trajectory: value.trajectory,
            sourceUnits: value.sourceUnits,
            interval: [first.time, last.time]
          })
        }}
      />
    </>
  )
}

export function ExperimentOriginalImport() {
  const runtime = useExperimentField('runtime')

  const candidateId = useExperimentField('candidateId')

  const workcell = useExperimentField('workcell')

  const onVisualPreview = useExperimentField('onVisualPreview')

  const isCurrent = useExperimentField('isCurrent')

  const visualImportActive = useExperimentField('visualImportActive')

  return (
    <>
      <GlbPreview
        runtime={runtime}
        candidateId={candidateId}
        workcell={workcell}
        onPreview={onVisualPreview}
        isCurrent={isCurrent}
        active={visualImportActive}
      />
    </>
  )
}
