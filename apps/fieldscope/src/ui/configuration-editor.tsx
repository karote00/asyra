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
  ['length', 'Greenhouse depth'],
  ['width', 'Single bay width'],
  ['height', 'Greenhouse height'],
  ['soilInset', 'Pipe distance from drain edge'],
  ['startInset', 'Front pipe inset'],
  ['endInset', 'Rear pipe inset'],
  ['topExtension', 'Pipe extension above beam'],
  ['netTop', 'Net top height'],
  ['netBottom', 'Net bottom height']
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
    <section className="bg-[#fafbf7] p-4" aria-label="Scene settings">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Scene settings</h2>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy || runtime.getUndoDepth() === 0}
            onClick={() => void act(runtime.undo)}
            className="rounded border px-3 py-2 text-xs disabled:opacity-40"
          >
            Undo ⌘Z
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act(runtime.redo)}
            className="rounded border px-3 py-2 text-xs disabled:opacity-40"
          >
            Redo ⇧⌘Z
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs text-[#718268]">
        Units: metres. Settings are shared by the four connected bays. Beam
        height is 60% of total height, side margins split the remaining bay
        width after strip widths, support pipe spacing stays 0.6m, and the rear
        inset is a minimum distance.
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
          <h3 className="text-xs font-semibold">
            Strip layout - left to right
          </h3>
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
            Add item
          </button>
        </div>
        <div className="mt-3 grid gap-2" data-testid="strip-editor">
          {draft.strips.map((strip, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-[#edf1e8] p-2"
            >
              <span className="w-6 font-mono text-xs">{i + 1}</span>
              <select
                disabled={busy}
                aria-label={`item ${i + 1} type`}
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
                className="rounded border bg-white p-2 text-xs"
              >
                <option value="soil">Soil</option>
                <option value="drain">Drain</option>
              </select>
              <input
                disabled={busy}
                aria-label={`item ${i + 1} width`}
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
                className="w-16 rounded border bg-white p-2 text-xs"
              />
              <span className="text-xs">m</span>
              <button
                type="button"
                aria-label={`move item ${i + 1} left`}
                disabled={busy || i === 0}
                onClick={() => reorder(i, -1)}
                className="px-2 disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                aria-label={`move item ${i + 1} right`}
                disabled={busy || i === draft.strips.length - 1}
                onClick={() => reorder(i, 1)}
                className="px-2 disabled:opacity-30"
              >
                →
              </button>
              <button
                type="button"
                aria-label={`delete item ${i + 1}`}
                disabled={busy || draft.strips.length === 1}
                onClick={() =>
                  setDraft({
                    ...draft,
                    strips: draft.strips.filter((_, j) => j !== i)
                  })
                }
                className="ml-auto px-2 text-xs text-[#975746]"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <details className="mt-3 text-xs text-[#718268]">
          <summary>View strip data</summary>
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
            {busy ? 'Applying...' : 'Apply settings'}
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
            Discard draft
          </button>
          <span className="text-xs text-[#718268]">
            Applied: beam {site.eave.toFixed(2)}m, side margins{' '}
            {site.margin.toFixed(2)}m
          </span>
        </div>
      </form>
    </section>
  )
}
