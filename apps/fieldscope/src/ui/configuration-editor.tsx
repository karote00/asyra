import {
  createContext,
  useContext,
  useState,
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
const fields: [Exclude<keyof FarmConfiguration, 'strips'>, string][] = [
  ['length', '溫室縱向深度'],
  ['width', '單棟寬度'],
  ['height', '溫室總高度'],
  ['soilInset', '鋼管距水道邊緣'],
  ['startInset', '鋼管前端留白'],
  ['endInset', '鋼管尾端留白'],
  ['topExtension', '鋼管超出橫樑'],
  ['netTop', '拉網最高位置'],
  ['netBottom', '拉網最低位置']
]
export function ConfigurationEditor({ runtime }: { runtime: FarmRuntime }) {
  const config = useSyncExternalStore(
    runtime.subscribeConfiguration,
    runtime.getConfiguration
  )
  return (
    <ConfigurationForm
      key={JSON.stringify(config)}
      runtime={runtime}
      config={config}
    />
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

function ConfigurationForm({
  runtime,
  config
}: {
  runtime: FarmRuntime
  config: FarmConfiguration
}) {
  const [draft, setDraft] = useState(config)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  const reorder = (i: number, delta: number) => {
    const strips = [...draft.strips]
    ;[strips[i], strips[i + delta]] = [strips[i + delta], strips[i]]
    setDraft({ ...draft, strips })
  }
  const site = configurationSite(config)
  return (
    <section className="bg-[#fafbf7] p-4" aria-label="場景設定">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">場景設定</h2>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy || runtime.getUndoDepth() === 0}
            onClick={() => void act(runtime.undo)}
            className="rounded border px-3 py-2 text-xs disabled:opacity-40"
          >
            復原 ⌘Z
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act(runtime.redo)}
            className="rounded border px-3 py-2 text-xs disabled:opacity-40"
          >
            重做 ⇧⌘Z
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs text-[#718268]">
        單位：公尺。四連棟共用設定。橫樑高度為總高的
        60%，兩側留白由單棟寬度扣除畦溝總寬後平均分配。鋼管間距維持
        0.6m，尾端留白為最小距離。
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void act(() => runtime.setConfiguration(draft))
        }}
      >
        <fieldset disabled={busy} className="grid grid-cols-2 gap-3">
          {fields.map(([key, label]) => (
            <label key={key} className="text-xs text-[#50664f]">
              {label}
              <input
                aria-label={label}
                type="number"
                step="any"
                value={Number.isFinite(draft[key]) ? draft[key] : ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    [key]:
                      event.target.value === ''
                        ? Number.NaN
                        : Number(event.target.value)
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#d4dccd] bg-white p-2 font-mono text-sm"
              />
            </label>
          ))}
        </fieldset>
        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-xs font-semibold">畦溝陣列 - 由左至右</h3>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              setDraft({
                ...draft,
                strips: [...draft.strips, { kind: 'soil', width: 0.3 }]
              })
            }
            className="rounded border px-3 py-2 text-xs"
          >
            新增項目
          </button>
        </div>
        <div className="mt-3 grid gap-2" data-testid="strip-editor">
          {draft.strips.map((strip, i) => (
            <div
              key={i}
              className="grid grid-cols-[1rem_minmax(0,1fr)_3rem_auto_4.5rem] items-center gap-1 rounded-lg bg-[#edf1e8] p-2"
            >
              <span className="font-mono text-xs">{i + 1}</span>
              <select
                disabled={busy}
                aria-label={`第 ${i + 1} 項種類`}
                value={strip.kind}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    strips: draft.strips.map((item, j) =>
                      j === i
                        ? {
                            ...item,
                            kind: event.target.value as 'soil' | 'drain'
                          }
                        : item
                    )
                  })
                }
                className="min-w-0 rounded border bg-white p-1 text-xs"
              >
                <option value="soil">土壤</option>
                <option value="drain">水道</option>
              </select>
              <input
                disabled={busy}
                aria-label={`第 ${i + 1} 項寬度`}
                type="number"
                step="any"
                value={Number.isFinite(strip.width) ? strip.width : ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    strips: draft.strips.map((item, j) =>
                      j === i
                        ? {
                            ...item,
                            width:
                              event.target.value === ''
                                ? Number.NaN
                                : Number(event.target.value)
                          }
                        : item
                    )
                  })
                }
                className="min-w-0 rounded border bg-white p-1 text-xs"
              />
              <span className="text-xs">m</span>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label={`Move strip ${i + 1} up`}
                  disabled={busy || i === 0}
                  onClick={() => reorder(i, -1)}
                  className="h-6 w-6 shrink-0 rounded text-[#59694c] focus-visible:outline-2 disabled:opacity-30"
                >
                  <StripActionIcon kind="up" />
                </button>
                <button
                  type="button"
                  aria-label={`Move strip ${i + 1} down`}
                  disabled={busy || i === draft.strips.length - 1}
                  onClick={() => reorder(i, 1)}
                  className="h-6 w-6 shrink-0 rounded text-[#59694c] focus-visible:outline-2 disabled:opacity-30"
                >
                  <StripActionIcon kind="down" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove strip ${i + 1}`}
                  disabled={busy || draft.strips.length === 1}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      strips: draft.strips.filter((_, j) => j !== i)
                    })
                  }
                  className="h-6 w-6 shrink-0 rounded text-red-700 focus-visible:outline-2 disabled:opacity-30"
                >
                  <StripActionIcon kind="remove" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <details className="mt-3 text-xs text-[#718268]">
          <summary>查看陣列資料</summary>
          <pre className="mt-2 overflow-auto rounded bg-[#edf1e8] p-3">
            {JSON.stringify(draft.strips, null, 2)}
          </pre>
        </details>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            disabled={busy}
            type="submit"
            className="rounded-lg bg-[#315a43] px-5 py-2 text-sm text-white disabled:opacity-40"
          >
            {busy ? '套用中…' : '套用設定'}
          </button>
          <button
            disabled={busy}
            type="button"
            onClick={() => {
              setDraft(config)
              setError('')
            }}
            className="text-xs underline"
          >
            放棄草稿
          </button>
          <span className="text-xs text-[#718268]">
            已套用：橫樑 {site.eave.toFixed(2)}m、兩側各留{' '}
            {site.margin.toFixed(2)}m
          </span>
        </div>
      </form>
    </section>
  )
}
