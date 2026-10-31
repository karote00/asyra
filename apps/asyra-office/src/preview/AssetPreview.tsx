import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { startAssetPreview, type PreviewRuntime } from './runtime'
import { REVIEW_VIEWS } from './controller'
import { REVIEW_ASSETS, type ReviewAsset } from './vegetation-controller'

function ReviewControls({ runtime }: { runtime: PreviewRuntime }) {
  const state = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot)
  const [error, setError] = useState('')
  const run = (action: () => void) => {
    try {
      action()
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }
  return (
    <>
      <nav aria-label="Review views" className="flex flex-wrap gap-2">
        {REVIEW_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={state.view === view}
            onClick={() => run(() => runtime.setView(view))}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm transition hover:bg-slate-700 aria-pressed:border-amber-300 aria-pressed:bg-amber-100 aria-pressed:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            {view}
          </button>
        ))}
      </nav>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.neutral}
            onChange={(e) => run(() => runtime.setNeutral(e.target.checked))}
          />
          Neutral geometry
        </label>
        <output aria-label="Mesh detail" className="text-sm text-slate-300">
          {state.detail === 'near' ? 'Near' : 'Distant'} - {state.triangles}{' '}
          triangles
        </output>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-red-300">
          {error}
        </p>
      )}
    </>
  )
}

export function AssetPreview({ asset }: { asset?: ReviewAsset }) {
  const host = useRef<HTMLDivElement>(null)
  const [runtime, setRuntime] = useState<PreviewRuntime | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!host.current) {
      return
    }
    let retired = false
    const pending = startAssetPreview(host.current, asset)
    pending
      .then((value) => {
        if (retired) {
          void value.dispose()
        } else {
          setRuntime(value)
        }
      })
      .catch((e) => {
        if (!retired) {
          setError(e instanceof Error ? e.message : String(e))
        }
      })
    return () => {
      retired = true
      void pending
        .then((value) => value.dispose())
        .catch(() => {
          /* Startup already reports its error through the live view. */
        })
    }
  }, [asset])
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-700 px-5 py-5 md:px-9">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-amber-200">
            Asyra Office - Asset review
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {asset ? REVIEW_ASSETS[asset] : 'Wall - one segment'}
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          {asset
            ? 'Asset - source contract review'
            : 'Architecture 01 - Model awaiting review'}
        </p>
      </header>
      <section className="grid gap-5 p-4 md:grid-cols-[minmax(0,1fr)_280px] md:p-7">
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#f4f1e9]">
          <div
            ref={host}
            aria-label={asset ? 'Asset 3D viewport' : 'Wall 3D viewport'}
            className="h-[58vh] min-h-80 w-full md:h-[70vh]"
          />
          <div className="border-t border-slate-700 bg-slate-900 p-4">
            {!runtime && !error && <p role="status">Starting 3D preview…</p>}
            {runtime && (
              <>
                <p role="status" className="mb-3 text-xs text-emerald-300">
                  3D preview ready
                </p>
                <ReviewControls runtime={runtime} />
              </>
            )}
            {error && (
              <p role="alert" className="text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>
        {asset ? (
          <aside className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-sm leading-6">
            <h2 className="mb-4 text-base font-semibold text-amber-100">
              Source contract
            </h2>
            <p>
              Same asset factory as the office. Master geometry is retained
              across every camera.
            </p>
            <p className="mt-4">
              Five views use the same production geometry. The narrow-angle
              cameras approximate orthographic views. Detail views magnify the
              retained master without changing its shape.
            </p>
            <p className="mt-4 text-amber-200">
              Compare silhouettes, joins and hidden surfaces against the
              approved reference and numeric specification. Numerical agreement
              alone is not visual approval.
            </p>
          </aside>
        ) : (
          <aside className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-sm leading-6">
            <h2 className="mb-4 text-base font-semibold text-amber-100">
              Approved dimensions
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-400">Width / thickness / height</dt>
                <dd>1.00 × 0.27 × 2.50 m</dd>
              </div>
              <div>
                <dt className="text-slate-400">Body</dt>
                <dd>1.00 × 0.24 × 2.42 m</dd>
              </div>
              <div>
                <dt className="text-slate-400">Top cap</dt>
                <dd>1.00 × 0.27 × 0.08 m</dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-slate-700 pt-4">
              Ends stay flush. The cap extends 15 mm on each thickness face.
              Only the specified upper edges have a 4 mm radius.
            </p>
            <p className="mt-4 text-slate-400">
              Five views share one model. Reference views use a narrow
              perspective lens; they are not exact orthographic projections.
            </p>
            <p className="mt-4 text-slate-400">
              Colours and materials are replaceable. Lighting belongs to the
              scene.
            </p>
            <p className="mt-5 text-xs text-slate-500">
              This is the first asset harness, not the complete office
              interface.
            </p>
          </aside>
        )}
      </section>
    </main>
  )
}
