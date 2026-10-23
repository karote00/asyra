import { useTranslation, localizeError } from './i18n/locale'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useSyncExternalStore
} from 'react'
import type { FarmRuntime } from '../runtime/bootstrap'
import {
  DEFAULT_CONFIGURATION,
  createConfigurationStrip,
  configurationSite,
  type FarmConfiguration
} from '../domain/farm-configuration'

export const ConfigurationRuntime = createContext<FarmRuntime | null>(null)
const noopSubscribe = () => () => undefined
export function useFarmConfiguration() {
  const runtime = useContext(ConfigurationRuntime)
  return useSyncExternalStore(
    runtime?.subscribeConfiguration ?? noopSubscribe,
    runtime?.getConfiguration ?? (() => DEFAULT_CONFIGURATION)
  )
}
function StripActionIcon({ kind }: { kind: 'up' | 'down' | 'remove' }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      {kind === 'remove' ? (
        <path
          d="M5 5L19 19M19 5L5 19"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d={kind === 'up' ? 'M4 20L12 4L20 20Z' : 'M4 4L20 4L12 20Z'}
          fill="currentColor"
        />
      )}
    </svg>
  )
}

const fields: Exclude<keyof FarmConfiguration, 'strips'>[] = [
  'length',
  'width',
  'height',
  'eaveHeight',
  'soilInset',
  'startInset',
  'endInset',
  'topExtension',
  'netTop',
  'netBottom'
]

export function MeasurementInput({
  value,
  label,
  onCommit,
  onHistory,
  unit = 'm'
}: {
  value: number
  unit?: string
  label: string
  onCommit: (value: number) => Promise<boolean>
  onHistory: (redo: boolean) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const [text, setText] = useState(String(value))
  const editing = useRef(false)
  useEffect(() => {
    editing.current = false
    setText(String(value))
  }, [value])
  return (
    <span className="measurement-field h-7 w-24 shrink-0">
      <input
        aria-label={label}
        aria-description={unit === 'm' ? t('editor.unit') : unit}
        type="number"
        step="any"
        value={text}
        onChange={(event) => {
          editing.current = true
          setText(event.target.value)
        }}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          // A settled numeric field belongs to document history. Unfinished
          // text keeps the browser's native text-edit Undo/Redo behavior.
          if (
            (event.metaKey || event.ctrlKey) &&
            !event.altKey &&
            !event.repeat &&
            event.code === 'KeyZ' &&
            !editing.current &&
            text !== '' &&
            Number(text) === value
          ) {
            event.preventDefault()
            event.stopPropagation()
            void onHistory(event.shiftKey)
            return
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
          if (event.key === 'Escape') {
            event.currentTarget.value = String(value)
            setText(String(value))
            event.currentTarget.blur()
          }
        }}
        onBlur={(event) => {
          editing.current = false
          const next = event.currentTarget.value
          if (next === '') {
            setText(String(value))
            return
          }
          if (Number(next) === value) return
          void onCommit(Number(next)).then((accepted) => {
            if (!accepted) setText(String(value))
          })
        }}
        className="h-full min-w-0 w-full bg-transparent pl-2 text-right text-xs tabular-nums"
      />
      <span className="field-unit">{unit}</span>
    </span>
  )
}

export function ConfigurationEditor({ runtime }: { runtime: FarmRuntime }) {
  const { t } = useTranslation()
  const config = useSyncExternalStore(
    runtime.subscribeConfiguration,
    runtime.getConfiguration
  )
  const site = configurationSite(config)
  const [error, setError] = useState<unknown>(null)
  // Resolve patches against canonical state when their turn runs, including blur
  // immediately followed by another field or strip action.
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const act = (action: () => Promise<unknown>): Promise<boolean> => {
    const result = queue.current.then(async () => {
      setError(null)
      try {
        await action()
        return true
      } catch (e) {
        setError(e)
        return false
      }
    })
    queue.current = result
    return result
  }
  const replay = (redo: boolean) => act(redo ? runtime.redo : runtime.undo)
  const update = (patch: (current: FarmConfiguration) => FarmConfiguration) =>
    act(() => runtime.setConfiguration(patch(runtime.getConfiguration())))
  const reorder = (index: number, delta: number) =>
    update((current) => {
      const strips = [...current.strips]
      ;[strips[index], strips[index + delta]] = [
        strips[index + delta],
        strips[index]
      ]
      return { ...current, strips }
    })
  return (
    <section className="bg-[#fafbf7] p-3" aria-label={t('editor.heading')}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold">{t('editor.heading')}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={runtime.getUndoDepth() === 0}
            onClick={() => void act(runtime.undo)}
            className="rounded px-2 py-1.5 text-xs hover:bg-[#edf1e8] disabled:opacity-40"
          >
            {t('editor.undo')}
          </button>
          <button
            type="button"
            onClick={() => void act(runtime.redo)}
            className="rounded px-2 py-1.5 text-xs hover:bg-[#edf1e8]"
          >
            {t('editor.redo')}
          </button>
        </div>
      </div>
      {fields.map((key, index) => (
        <div key={key}>
          {index === 0 || index === 4 || index === 8 ? (
            <h3 className="mb-1 mt-3 border-t border-[#d9dfd2] pt-3 text-xs font-semibold">
              {
                {
                  0: t('editor.greenhouse'),
                  4: t('editor.poles'),
                  8: t('editor.net')
                }[index]
              }
            </h3>
          ) : null}
          <label className="flex min-h-9 items-center justify-between gap-2 text-xs text-[#50664f]">
            <span>{t(`field.${key}`)}</span>
            <MeasurementInput
              onHistory={replay}
              value={key === 'eaveHeight' ? site.eave : config[key]}
              label={t(`field.${key}Label`)}
              onCommit={(value) =>
                update((current) => ({ ...current, [key]: value }))
              }
            />
          </label>
        </div>
      ))}
      <div className="mb-2 mt-3 flex flex-wrap gap-2 items-center justify-between border-t border-[#d9dfd2] pt-3">
        <h3 className="text-xs font-semibold">{t('editor.strips')}</h3>
        <button
          type="button"
          onClick={() =>
            void update((current) => ({
              ...current,
              strips: [...current.strips, createConfigurationStrip('soil', 0.3)]
            }))
          }
          className="rounded px-2 py-1 text-xs hover:bg-[#edf1e8]"
        >
          {t('editor.add')}
        </button>
      </div>
      <label className="mb-2 flex min-h-9 items-center justify-between gap-2 text-xs text-[#50664f]">
        <span>{t('editor.margin')}</span>
        <MeasurementInput
          onHistory={replay}
          value={Number(site.margin.toFixed(6))}
          label={t('editor.margin')}
          onCommit={(margin) =>
            update((current) => ({
              ...current,
              width:
                current.strips.reduce((sum, strip) => sum + strip.width, 0) +
                2 * margin
            }))
          }
        />
      </label>
      <div className="grid gap-1" data-testid="strip-editor">
        {config.strips.map((strip, i) => (
          <div
            key={strip.id}
            className="grid grid-cols-[0.75rem_minmax(3.5rem,1fr)_4.25rem_6rem] items-center gap-1 rounded bg-[#edf1e8] px-1 py-0.5"
          >
            <span className="text-center text-[10px] text-[#718268]">
              {i + 1}
            </span>
            <select
              aria-label={t('editor.stripKind', { index: i + 1 })}
              value={strip.kind}
              onChange={(event) => {
                const kind = event.target.value as 'soil' | 'drain'
                void update((current) => ({
                  ...current,
                  strips: current.strips.map((item, j) =>
                    j === i ? { ...item, kind } : item
                  )
                }))
              }}
              className="h-7 min-w-0 rounded border border-[#d4dccd] bg-white text-xs"
            >
              <option value="soil">{t('editor.soil')}</option>
              <option value="drain">{t('editor.drain')}</option>
            </select>
            <div className="[&>.measurement-field]:w-full">
              <MeasurementInput
                onHistory={replay}
                value={strip.width}
                label={t('editor.stripWidth', { index: i + 1 })}
                onCommit={(width) =>
                  update((current) => ({
                    ...current,
                    strips: current.strips.map((item, j) =>
                      j === i ? { ...item, width } : item
                    )
                  }))
                }
              />
            </div>
            <div className="flex items-center">
              <button
                type="button"
                aria-label={t('editor.moveUp', { index: i + 1 })}
                disabled={i === 0}
                onClick={() => void reorder(i, -1)}
                className="flex h-8 w-8 items-center justify-center rounded text-[#59694c] hover:bg-white disabled:opacity-30"
              >
                <StripActionIcon kind="up" />
              </button>
              <button
                type="button"
                aria-label={t('editor.moveDown', { index: i + 1 })}
                disabled={i === config.strips.length - 1}
                onClick={() => void reorder(i, 1)}
                className="flex h-8 w-8 items-center justify-center rounded text-[#59694c] hover:bg-white disabled:opacity-30"
              >
                <StripActionIcon kind="down" />
              </button>
              <button
                type="button"
                aria-label={t('editor.remove', { index: i + 1 })}
                disabled={config.strips.length === 1}
                onClick={() =>
                  void update((current) => ({
                    ...current,
                    strips: current.strips.filter((_, j) => j !== i)
                  }))
                }
                className="flex h-8 w-8 items-center justify-center rounded text-red-700 hover:bg-white disabled:opacity-30"
              >
                <StripActionIcon kind="remove" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {Boolean(error) && (
        <p
          role="alert"
          className="sticky bottom-0 mt-2 rounded bg-red-50 p-2 text-xs text-red-700"
        >
          {localizeError(error, t)}
        </p>
      )}
    </section>
  )
}
