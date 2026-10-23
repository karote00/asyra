import { useState } from 'react'
import { createSyntheticWalkingRobotDefinition } from '../domain/walking-robot-definition'
import {
  createWalkingRuntimeSelection,
  DEFAULT_WALKING_RUNTIME_SELECTION,
  type WalkingRuntimeSelection
} from '../domain/walking-runtime-selection'
import type { FarmRuntime } from '../runtime/bootstrap'
import { useTranslation } from './i18n/locale'

const SYNTHETIC_HARVEST_WALKING_SELECTION = createWalkingRuntimeSelection(
  createSyntheticWalkingRobotDefinition({
    definitionId: 'synthetic-harvest-walker-v2',
    sourceProfile: 'solid-articulation/2'
  })
)

export function WalkingRuntimeSelector({
  runtime,
  selection
}: {
  runtime: FarmRuntime
  selection: WalkingRuntimeSelection
}) {
  const { t } = useTranslation()
  const [error, setError] = useState(false)
  const select = (next: WalkingRuntimeSelection) => {
    setError(false)
    void runtime.setWalkingRuntimeSelection(next).catch(() => setError(true))
  }
  const walking = selection.mode === 'walking-active'
  return (
    <fieldset className="space-y-2 rounded-lg border border-[#d9dfd2] bg-white p-3">
      <legend className="px-1 text-xs font-semibold text-[#50664f]">
        {t('robot.model.heading')}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={!walking}
          className={`rounded-lg border px-2 py-2 text-xs ${
            !walking
              ? 'border-[#264c3b] bg-[#264c3b] text-white'
              : 'border-[#d9dfd2] text-[#50664f]'
          }`}
          onClick={() => select(DEFAULT_WALKING_RUNTIME_SELECTION)}
        >
          {t('robot.model.legacy')}
        </button>
        <button
          type="button"
          aria-pressed={walking}
          className={`rounded-lg border px-2 py-2 text-xs ${
            walking
              ? 'border-[#264c3b] bg-[#264c3b] text-white'
              : 'border-[#d9dfd2] text-[#50664f]'
          }`}
          onClick={() => select(SYNTHETIC_HARVEST_WALKING_SELECTION)}
        >
          {t('robot.model.walking')}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-[#657561]">
        {walking
          ? t('robot.model.walkingDetails', {
              width: selection.definition.base.chassis.size[0].toFixed(2)
            })
          : t('robot.model.legacyDetails')}
      </p>
      {walking && (
        <p className="text-xs leading-relaxed text-amber-800">
          {t('robot.model.walkingLimits')}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {t('robot.model.error')}
        </p>
      )}
    </fieldset>
  )
}
