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

const fields: [Exclude<keyof FarmConfiguration, 'strips'>, string, string][] = [
  ['length', '縱向深度', '溫室縱向深度'],
  ['width', '單棟寬度', '單棟寬度'],
  ['height', '總高度', '溫室總高度'],
  ['eaveHeight', '橫樑高度', '橫樑高度'],
  ['soilInset', '距水道邊緣', '鋼管距水道邊緣'],
  ['startInset', '前端留白', '鋼管前端留白'],
  ['endInset', '尾端留白', '鋼管尾端留白'],
  ['topExtension', '超出橫樑', '鋼管超出橫樑'],
  ['netTop', '頂部高度', '拉網最高位置'],
  ['netBottom', '底部高度', '拉網最低位置']
]

function MeasurementInput({
  value,
  label,
  onCommit,
  onHistory
}: {
  value: number
  label: string
  onCommit: (value: number) => Promise<boolean>
  onHistory: (redo: boolean) => Promise<boolean>
}) {
  const [text, setText] = useState(String(value))
  const editing = useRef(false)
  useEffect(() => {
    editing.current = false
    setText(String(value))
  }, [value])
  return (
    <span className="measurement-field h-7 w-24">
      <input
        aria-label={label}
        aria-description="單位：公尺"
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
      <span className="field-unit">m</span>
    </span>
  )
}

export function ConfigurationEditor({ runtime }: { runtime: FarmRuntime }) {
  const config = useSyncExternalStore(
    runtime.subscribeConfiguration,
    runtime.getConfiguration
  )
  const site = configurationSite(config)
  const [error, setError] = useState('')
  // Resolve patches against canonical state when their turn runs, including blur
  // immediately followed by another field or strip action.
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const act = (action: () => Promise<unknown>): Promise<boolean> => {
    const result = queue.current.then(async () => {
      setError('')
      try {
        await action()
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
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
    <section className="bg-[#fafbf7] p-3" aria-label="場景設定">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold">場景設定</h2>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={runtime.getUndoDepth() === 0}
            onClick={() => void act(runtime.undo)}
            className="rounded px-2 py-1.5 text-xs hover:bg-[#edf1e8] disabled:opacity-40"
          >
            復原 ⌘Z
          </button>
          <button
            type="button"
            onClick={() => void act(runtime.redo)}
            className="rounded px-2 py-1.5 text-xs hover:bg-[#edf1e8]"
          >
            重做 ⇧⌘Z
          </button>
        </div>
      </div>
      {fields.map(([key, label, accessibleLabel], index) => (
        <div key={key}>
          {index === 0 || index === 4 || index === 8 ? (
            <h3 className="mb-1 mt-3 border-t border-[#d9dfd2] pt-3 text-xs font-semibold">
              {{ 0: '溫室', 4: '鋼管', 8: '拉網' }[index]}
            </h3>
          ) : null}
          <label className="flex min-h-9 items-center justify-between gap-2 text-xs text-[#50664f]">
            <span>{label}</span>
            <MeasurementInput
              onHistory={replay}
              value={key === 'eaveHeight' ? site.eave : config[key]}
              label={accessibleLabel}
              onCommit={(value) =>
                update((current) => ({ ...current, [key]: value }))
              }
            />
          </label>
        </div>
      ))}
      <div className="mb-2 mt-3 flex items-center justify-between border-t border-[#d9dfd2] pt-3">
        <h3 className="text-xs font-semibold">畦溝 - 由左至右</h3>
        <button
          type="button"
          onClick={() =>
            void update((current) => ({
              ...current,
              strips: [...current.strips, { kind: 'soil', width: 0.3 }]
            }))
          }
          className="rounded px-2 py-1 text-xs hover:bg-[#edf1e8]"
        >
          新增項目
        </button>
      </div>
      <label className="mb-2 flex min-h-9 items-center justify-between gap-2 text-xs text-[#50664f]">
        <span>兩側各留</span>
        <MeasurementInput
          onHistory={replay}
          value={Number(site.margin.toFixed(6))}
          label="兩側各留"
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
            key={i}
            className="grid grid-cols-[1rem_minmax(0,1fr)_4.5rem_6rem] items-center gap-1 rounded bg-[#edf1e8] px-1 py-0.5"
          >
            <span className="text-center text-[10px] text-[#718268]">
              {i + 1}
            </span>
            <select
              aria-label={`第 ${i + 1} 項種類`}
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
              <option value="soil">土壤</option>
              <option value="drain">水道</option>
            </select>
            <div className="[&>.measurement-field]:w-full">
              <MeasurementInput
                onHistory={replay}
                value={strip.width}
                label={`第 ${i + 1} 項寬度`}
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
                aria-label={`Move strip ${i + 1} up`}
                disabled={i === 0}
                onClick={() => void reorder(i, -1)}
                className="flex h-8 w-8 items-center justify-center rounded text-[#59694c] hover:bg-white disabled:opacity-30"
              >
                <StripActionIcon kind="up" />
              </button>
              <button
                type="button"
                aria-label={`Move strip ${i + 1} down`}
                disabled={i === config.strips.length - 1}
                onClick={() => void reorder(i, 1)}
                className="flex h-8 w-8 items-center justify-center rounded text-[#59694c] hover:bg-white disabled:opacity-30"
              >
                <StripActionIcon kind="down" />
              </button>
              <button
                type="button"
                aria-label={`Remove strip ${i + 1}`}
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
      {error && (
        <p
          role="alert"
          className="sticky bottom-0 mt-2 rounded bg-red-50 p-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </section>
  )
}
