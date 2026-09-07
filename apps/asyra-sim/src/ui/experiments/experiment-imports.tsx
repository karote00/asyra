import { useMemo } from 'react'
import {
  useExperimentField,
  useExperimentValue,
  useExperimentView
} from './experiment-context'
import { GlbPreview } from '../imports/glb-preview'
import { TrajectoryImportPanel } from '../imports/trajectory-import-panel'

export function ExperimentTrajectory() {
  const view = useExperimentView()

  const canonical = useExperimentField('canonical')

  const workcell = useExperimentField('workcell')

  const saving = useExperimentField('saving')

  const trajectory = useExperimentValue((state) => state.draft.trajectory)

  const sourceIdentity = useMemo(
    () =>
      JSON.stringify({
        id: canonical?.id ?? 'new',
        trajectory: canonical?.definition.trajectory,
        sourceUnits: canonical?.definition.sourceUnits
      }),
    [
      canonical?.id,
      canonical?.definition.trajectory,
      canonical?.definition.sourceUnits
    ]
  )

  return (
    <>
      <TrajectoryImportPanel
        key={sourceIdentity}
        workcell={workcell}
        trajectory={canonical?.definition.trajectory ?? trajectory}
        saving={saving}
        onAccept={(value) => {
          const first = value.trajectory.keyframes[0]

          const last = value.trajectory.keyframes.at(-1)

          if (!first || !last)
            throw new Error('Accepted trajectory has no keyframes')

          void view.getSnapshot().save({
            ...view.getSnapshot().draft,
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
