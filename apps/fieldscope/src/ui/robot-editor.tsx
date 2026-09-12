import { useState, useSyncExternalStore } from 'react'
import type { FarmRuntime } from '../runtime/bootstrap'
import type {
  RobotConfiguration,
  RobotNumber
} from '../domain/robot-configuration'
import { ConfigurationEditor, MeasurementInput } from './configuration-editor'
import { useTranslation } from './i18n/locale'
import type { MessageKey } from './i18n/messages'

const groups: { title: MessageKey; fields: [RobotNumber, string][] }[] = [
  {
    title: 'robot.dimensions',
    fields: [
      ['width', 'm'],
      ['length', 'm'],
      ['height', 'm'],
      ['clearance', 'm'],
      ['canopyReserve', 'm']
    ]
  },
  {
    title: 'robot.mission',
    fields: [
      ['start', 'm'],
      ['end', 'm'],
      ['patrolMinutes', 'min']
    ]
  },
  {
    title: 'robot.crate',
    fields: [
      ['payloadLimit', 'kg'],
      ['payload', 'kg']
    ]
  },
  {
    title: 'robot.battery',
    fields: [
      ['nominalWh', 'Wh'],
      ['usableFraction', '0–1'],
      ['soc', '0–1'],
      ['socUncertainty', '0–1'],
      ['nextWorkWh', 'Wh'],
      ['returnWh', 'Wh'],
      ['contingencyWh', 'Wh'],
      ['reserveWh', 'Wh']
    ]
  },
  {
    title: 'robot.dock',
    fields: [
      ['dockX', 'm'],
      ['dockZ', 'm']
    ]
  }
]
const selectStyle =
  'h-8 min-w-0 max-w-[60%] rounded border border-[#d9dfd2] bg-white px-2 text-xs'

export function WorkspaceEditor({ runtime }: { runtime: FarmRuntime }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'farm' | 'robot'>('farm')
  return (
    <>
      <div
        className="sticky top-0 z-10 flex gap-1 border-b border-[#d9dfd2] bg-[#fafbf7] p-2"
        role="tablist"
        aria-label={t('robot.workspace')}
      >
        {(['farm', 'robot'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`flex-1 rounded px-3 py-2 text-xs ${tab === key ? 'bg-[#264c3b] text-white' : 'text-[#50664f]'}`}
            onClick={() => setTab(key)}
          >
            {t(`robot.tab.${key}`)}
          </button>
        ))}
      </div>
      {tab === 'farm' ? (
        <ConfigurationEditor runtime={runtime} />
      ) : (
        <RobotEditor runtime={runtime} />
      )}
    </>
  )
}

function RobotEditor({ runtime }: { runtime: FarmRuntime }) {
  const { t } = useTranslation()
  const report = useSyncExternalStore(runtime.subscribeRobot, runtime.getRobot)
  const farm = useSyncExternalStore(
    runtime.subscribeConfiguration,
    runtime.getConfiguration
  )
  const [error, setError] = useState(false)
  const settings = report.settings
  const act = async (action: () => Promise<unknown>) => {
    try {
      await action()
      setError(false)
      return true
    } catch {
      setError(true)
      return false
    }
  }
  const patch = (value: Partial<RobotConfiguration>) =>
    act(() => runtime.patchRobot(value))
  const history = (redo: boolean) =>
    act(() => (redo ? runtime.redo() : runtime.undo()))
  const laneId =
    settings.lane.kind === 'strip'
      ? `strip:${settings.lane.bay}:${settings.lane.strip}`
      : `shared:${settings.lane.boundary}:${settings.lane.side}`
  const lanes = Array.from({ length: 4 }, (_, bay) =>
    farm.strips.map((strip, index) => ({
      id: `strip:${bay}:${index}`,
      label: t('robot.laneName', {
        bay: bay + 1,
        strip: index + 1,
        kind: t(`editor.${strip.kind}`)
      })
    }))
  ).flat()
  for (let boundary = 1; boundary < 4; boundary++)
    for (const side of ['left', 'right'] as const)
      lanes.push({
        id: `shared:${boundary}:${side}`,
        label: t('robot.sharedName', { boundary, side: t(`robot.${side}`) })
      })
  return (
    <section
      className="space-y-4 bg-[#fafbf7] p-3"
      aria-label={t('robot.workspace')}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t('robot.tab.robot')}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => void history(false)}
          >
            {t('editor.undo')}
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => void history(true)}
          >
            {t('editor.redo')}
          </button>
        </div>
      </div>
      <button
        type="button"
        className="w-full rounded-lg bg-[#264c3b] px-3 py-2 text-xs text-white"
        onClick={() => runtime.focusRobot()}
      >
        {t('robot.focus')}
      </button>
      <p className="text-xs leading-relaxed text-[#657561]">
        {t('robot.concept')}
      </p>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {t('robot.invalid')}
        </p>
      )}
      <details className="rounded-lg border border-[#d9dfd2] bg-white p-3 text-xs">
        <summary className="cursor-pointer font-semibold">
          {t(`robot.status.${report.lane?.status ?? 'invalid'}`)}
        </summary>
        {report.lane && (
          <p className="mt-1 tabular-nums">
            {t('robot.clearanceReport', {
              available: report.lane.usableWidth.toFixed(2),
              required: report.lane.requiredWidth.toFixed(2)
            })}
          </p>
        )}
        {report.lane &&
          [...report.lane.blocked, ...report.lane.unverified].map((reason) => (
            <p className="mt-1" key={reason}>
              {t(`robot.reason.${reason}`)}
            </p>
          ))}
        <p className="mt-2 text-[#657561]">{t('robot.screenOnly')}</p>
        <p className="mt-2">
          {t('robot.energyReport', {
            available: report.energy.availableWh.toFixed(0),
            required: report.energy.missionRequiredWh.toFixed(0)
          })}
        </p>
        {report.energy.undersized && (
          <p className="text-red-700">{t('robot.undersized')}</p>
        )}
        {report.exchangeRequired && (
          <p className="text-amber-800">{t('robot.exchange')}</p>
        )}
      </details>
      <div className="space-y-2">
        <label className="flex items-center justify-between gap-2 text-xs">
          {t('robot.tool')}
          <select
            className={selectStyle}
            value={settings.tool}
            onChange={(e) =>
              void patch({ tool: e.target.value as RobotConfiguration['tool'] })
            }
          >
            <option value="cucumber">{t('robot.cucumber')}</option>
            <option value="tomato">{t('robot.tomato')}</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          {t('robot.lane')}
          <select
            className={selectStyle}
            value={laneId}
            onChange={(e) => {
              const [kind, a, b] = e.target.value.split(':')
              void patch({
                lane:
                  kind === 'strip'
                    ? { kind, bay: Number(a), strip: Number(b) }
                    : {
                        kind: 'shared',
                        boundary: Number(a),
                        side: b as 'left' | 'right'
                      }
              })
            }}
          >
            {!lanes.some((lane) => lane.id === laneId) && (
              <option value={laneId}>{t('robot.status.invalid')}</option>
            )}
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>
                {lane.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          {t('robot.scanSide')}
          <select
            className={selectStyle}
            value={settings.scanSide}
            onChange={(e) =>
              void patch({
                scanSide: e.target.value as RobotConfiguration['scanSide']
              })
            }
          >
            {(['left', 'right', 'both'] as const).map((side) => (
              <option key={side} value={side}>
                {t(`robot.${side}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {groups.map((group) => (
        <fieldset
          className="space-y-2 border-t border-[#d9dfd2] pt-3"
          key={group.title}
        >
          <legend className="px-1 text-xs font-semibold text-[#50664f]">
            {t(group.title)}
          </legend>
          {group.fields.map(([key, unit]) => (
            <label
              className="flex items-center justify-between gap-2 text-xs"
              key={key}
            >
              <span>{t(`robot.field.${key}`)}</span>
              <MeasurementInput
                value={settings[key]}
                unit={unit}
                label={t(`robot.field.${key}`)}
                onCommit={(value) => patch({ [key]: value })}
                onHistory={history}
              />
            </label>
          ))}
        </fieldset>
      ))}
      <fieldset className="space-y-2 border-t border-[#d9dfd2] pt-3">
        <legend className="px-1 text-xs font-semibold text-[#50664f]">
          {t('robot.survey')}
        </legend>
        <label className="flex items-center justify-between gap-2 text-xs">
          {t('robot.ground')}
          <select
            className={selectStyle}
            value={settings.survey.ground}
            onChange={(e) =>
              void patch({
                survey: {
                  ...runtime.getRobot().settings.survey,
                  ground: e.target
                    .value as RobotConfiguration['survey']['ground']
                }
              })
            }
          >
            {(['unknown', 'prepared', 'soft'] as const).map((value) => (
              <option key={value} value={value}>
                {t(`robot.ground.${value}`)}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            'entranceWidth',
            'entranceHeight',
            'frontHeadland',
            'rearHeadland'
          ] as const
        ).map((key) => (
          <div
            key={key}
            className="flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.survey[key] !== null}
                onChange={(e) =>
                  void patch({
                    survey: {
                      ...runtime.getRobot().settings.survey,
                      [key]: e.target.checked ? 0 : null
                    }
                  })
                }
              />
              {t(`robot.field.${key}`)}
            </label>
            {settings.survey[key] === null ? (
              <span className="text-[#657561]">
                {t('robot.ground.unknown')}
              </span>
            ) : (
              <MeasurementInput
                value={settings.survey[key]}
                label={t(`robot.field.${key}`)}
                onCommit={(value) =>
                  patch({
                    survey: {
                      ...runtime.getRobot().settings.survey,
                      [key]: value
                    }
                  })
                }
                onHistory={history}
              />
            )}
          </div>
        ))}
      </fieldset>
    </section>
  )
}
