import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode
} from 'react'
import {
  createOfficeRuntime,
  type OfficeRuntime
} from '../runtime/office-runtime'
import { PLACES, type PlaceId, type LayoutProposal } from '../domain/layout'
import type { ActivityStatus } from '@asyra/preset/agent-activity'
const button =
  'rounded-xl border border-[#dce2d6] bg-white px-3 py-2 text-sm transition hover:bg-[#edf2e8]'
const primary =
  'rounded-xl bg-[#355b45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264733]'
const statuses: Record<ActivityStatus, string> = {
  idle: 'Available',
  working: 'Working',
  waiting: 'Needs input',
  completed: 'Completed',
  failed: 'Failed',
  offline: 'Offline'
}
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e2e5da] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}
function AgentCard({
  runtime,
  agentKey
}: {
  runtime: OfficeRuntime
  agentKey: string
}) {
  const agent = useSyncExternalStore(
    (listener) => runtime.activity.subscribeAgent(agentKey, listener),
    () => runtime.activity.getAgent(agentKey)
  )
  if (!agent) return null
  return (
    <button
      className="w-full rounded-xl border border-[#e2e5da] bg-[#f6f7f0] p-3 text-left"
      onClick={() => {
        if (agentKey === runtime.key) runtime.scene.follow()
      }}
      disabled={agentKey !== runtime.key}
      aria-label={`Follow ${agent.agentName}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{agent.agentName}</span>
        <span className="rounded-full bg-white px-2 py-1 text-[10px] uppercase tracking-wide">
          {statuses[agent.status]}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[#667267]">
        {agent.summary}
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-[#7b887c]">
        {agent.fidelity} evidence
      </p>
    </button>
  )
}
function AgentList({ runtime }: { runtime: OfficeRuntime }) {
  const ids = useSyncExternalStore(
    runtime.activity.subscribeAgents.bind(runtime.activity),
    runtime.activity.getAgentIds.bind(runtime.activity)
  )
  return (
    <div className="space-y-2">
      {ids.length ? (
        ids.map((key) => (
          <AgentCard key={key} runtime={runtime} agentKey={key} />
        ))
      ) : (
        <p className="text-xs leading-relaxed text-[#7b887c]">
          No runtime connected. Ari is an ambient avatar until you start the
          labeled sample.
        </p>
      )}
    </div>
  )
}
function WorkPanel({ runtime }: { runtime: OfficeRuntime }) {
  const ids = useSyncExternalStore(
    runtime.activity.subscribeAgents.bind(runtime.activity),
    runtime.activity.getAgentIds.bind(runtime.activity)
  )
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-[#7b887c]">
        Task state comes from the source event. Coffee breaks and movement are
        separate simulated activities.
      </p>
      {ids.length ? (
        ids.map((key) => (
          <AgentCard key={key} runtime={runtime} agentKey={key} />
        ))
      ) : (
        <Empty
          title="A little room for big ideas"
          text="Start the synthetic example to see a task move through working, waiting and completed."
        />
      )}
    </div>
  )
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cfd8c9] px-5 py-8 text-center">
      <div className="mb-3 text-3xl">◌</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[#7b887c]">{text}</p>
    </div>
  )
}
function Logs({ runtime }: { runtime: OfficeRuntime }) {
  const count = useSyncExternalStore(
    runtime.activity.subscribeLog.bind(runtime.activity),
    () => runtime.activity.eventCount
  )
  const entries = runtime.activity.recent(80)
  return (
    <div>
      <p className="mb-4 text-xs text-[#7b887c]">
        {count} retained events. Showing the latest 80.
      </p>
      <ol className="space-y-3">
        {entries
          .slice()
          .reverse()
          .map((event) => (
            <li
              key={`${event.source}:${event.sequence}`}
              className="border-l-2 border-[#bdccb4] pl-3"
            >
              <p className="text-xs font-semibold">
                {event.agentName} - {statuses[event.status]}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#667267]">
                {event.summary}
              </p>
              <p className="mt-1 text-[10px] text-[#8a9689]">
                {new Date(event.timestamp).toLocaleTimeString()} /{' '}
                {event.fidelity} / attempt {event.attempt}
              </p>
            </li>
          ))}
      </ol>
      {!entries.length && (
        <Empty
          title="Quiet for now"
          text="Accepted events appear here after the local archive acknowledges them."
        />
      )}
    </div>
  )
}
function LayoutPanel({
  runtime,
  act
}: {
  runtime: OfficeRuntime
  act: (action: () => unknown) => void
}) {
  const snapshot = useSyncExternalStore(
    runtime.layout.subscribe,
    runtime.layout.getSnapshot
  )
  const [proposal, setProposal] = useState<LayoutProposal | null>(null)
  const desk = snapshot.layout.furniture.find((item) => item.id === 'desk')
  const move = (dx: number, dz: number) =>
    act(() =>
      runtime.layout.apply(
        runtime.layout.propose(
          {
            ...snapshot.layout,
            furniture: snapshot.layout.furniture.map((item) =>
              item.id === 'desk'
                ? { ...item, x: item.x + dx, z: item.z + dz }
                : item
            )
          },
          'Human'
        )
      )
    )
  return (
    <div className="space-y-4">
      <Card title="Desk placement">
        <p className="mb-3 text-xs text-[#7b887c]">
          Half-unit grid. X {desk?.x}, Z {desk?.z}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className={button} onClick={() => move(-0.5, 0)}>
            ← Left
          </button>
          <button className={button} onClick={() => move(0.5, 0)}>
            Right →
          </button>
          <button className={button} onClick={() => move(0, -0.5)}>
            ↑ Back
          </button>
          <button className={button} onClick={() => move(0, 0.5)}>
            Front ↓
          </button>
        </div>
      </Card>
      <Card title="Room finish">
        <div className="flex gap-3">
          {[
            { color: 0xe7d8c5, label: 'Sand', css: 'bg-[#e7d8c5]' },
            { color: 0xbacaba, label: 'Sage', css: 'bg-[#bacaba]' },
            { color: 0xcbd8df, label: 'Mist', css: 'bg-[#cbd8df]' }
          ].map(({ color, label, css }) => (
            <button
              key={color}
              aria-label={`${label} walls`}
              title={label}
              className={`h-9 w-9 rounded-full border-2 ${snapshot.layout.wall === color ? 'border-[#355b45]' : 'border-white'} ${css}`}
              onClick={() =>
                act(() =>
                  runtime.layout.apply(
                    runtime.layout.propose(
                      { ...snapshot.layout, wall: color },
                      'Human'
                    )
                  )
                )
              }
            />
          ))}
        </div>
      </Card>
      <Card title="Attributed proposal">
        <p className="mb-3 text-xs leading-relaxed text-[#7b887c]">
          Preview a synthetic decorating suggestion. Applying uses the same
          validation and transaction as your edits.
        </p>
        {proposal ? (
          <>
            <p className="mb-3 text-xs">
              Sample decorator suggests sage walls at revision{' '}
              {proposal.expectedRevision}
            </p>
            <div className="flex gap-2">
              <button
                className={primary}
                onClick={() =>
                  act(async () => {
                    await runtime.layout.apply(proposal)
                    setProposal(null)
                  })
                }
              >
                Apply proposal
              </button>
              <button className={button} onClick={() => setProposal(null)}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            className={button}
            onClick={() =>
              setProposal(
                runtime.layout.propose(
                  { ...snapshot.layout, wall: 0xbacaba },
                  'Synthetic decorator'
                )
              )
            }
          >
            Preview suggestion
          </button>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <button className={button} onClick={() => act(runtime.layout.undo)}>
          Undo
        </button>
        <button className={button} onClick={() => act(runtime.layout.redo)}>
          Redo
        </button>
        <button className={primary} onClick={() => act(runtime.layout.save)}>
          Save layout
        </button>
        <button className={button} onClick={() => act(runtime.layout.reload)}>
          Load saved
        </button>
      </div>
      <p role="status" className="text-xs text-[#7b887c]">
        {snapshot.savedRevision === snapshot.revision
          ? 'Saved locally'
          : 'Unsaved layout'}{' '}
        - revision {snapshot.revision}
      </p>
    </div>
  )
}
function SourcePanel({
  runtime,
  act
}: {
  runtime: OfficeRuntime
  act: (action: () => unknown) => void
}) {
  const [input, setInput] = useState('')
  return (
    <div className="space-y-4">
      <Card title="Synthetic task controls">
        <p className="mb-3 text-xs leading-relaxed text-[#7b887c]">
          These are explicitly simulated events. No model, provider account or
          paid request is connected.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            ['working', 'waiting', 'completed', 'failed', 'offline'] as const
          ).map((status) => (
            <button
              key={status}
              className={button}
              onClick={() => act(() => runtime.send(status))}
            >
              {statuses[status]}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Cooperative report import">
        <p className="mb-3 text-xs leading-relaxed text-[#7b887c]">
          Import version-1 event JSON. Reports remain labeled cooperative; no
          claim of complete Dots telemetry. Imported agents are listed but have
          no assigned avatar yet.
        </p>
        <textarea
          aria-label="Cooperative event JSON"
          className="min-h-36 w-full rounded-xl border border-[#dce2d6] p-3 text-xs"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='[{"version":1,"sequence":1,"agentId":"agent-1","agentName":"Agent","taskId":"task-1","attempt":1,"status":"working","summary":"Reading the brief","timestamp":"2026-10-02T07:00:00Z"}]'
        />
        <button
          className={`${button} mt-2`}
          onClick={() =>
            act(async () => {
              await runtime.importReports(JSON.parse(input))
              setInput('')
            })
          }
        >
          Import reports
        </button>
      </Card>
    </div>
  )
}
function Workspace({ runtime }: { runtime: OfficeRuntime }) {
  const [tab, setTab] = useState<'Tasks' | 'Logs' | 'Layout' | 'Sources'>(
    'Tasks'
  )
  const [message, setMessage] = useState('')
  const [reduced, setReduced] = useState(false)
  const act = (action: () => unknown) => {
    setMessage('')
    Promise.resolve()
      .then(action)
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : String(error))
      )
  }
  return (
    <>
      <aside className="z-10 flex flex-col border-r border-[#e2e5da] bg-[#fbfaf6] p-5 max-lg:hidden">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8c9889]">
          Your neighborhood
        </p>
        <button
          className={`${button} mb-2 text-left`}
          onClick={() => runtime.scene.focus('overview')}
        >
          ⌂ Overview
        </button>
        {Object.entries(PLACES).map(([id, place]) => (
          <button
            key={id}
            className={`${button} mb-2 text-left`}
            onClick={() => runtime.scene.focus(id as PlaceId)}
          >
            {place.label}
          </button>
        ))}
        <div className="mb-3 mt-8 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8c9889]">
            Agents
          </h2>
          <span className="text-xs text-[#8c9889]">01 avatar</span>
        </div>
        <AgentList runtime={runtime} />
        <div className="mt-auto rounded-2xl bg-[#edf1e6] p-4">
          <p className="text-xs font-semibold">A slower kind of workspace</p>
          <p className="mt-2 text-xs leading-relaxed text-[#7b887c]">
            Real task evidence. A little room to breathe.
          </p>
        </div>
      </aside>
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-2xl border border-white/70 bg-white/90 p-2 shadow-sm max-lg:bottom-auto max-lg:top-20 max-lg:w-[calc(100%-2rem)] max-lg:flex-wrap max-lg:justify-center">
        <button
          className={`${button} pointer-events-auto`}
          onClick={() => runtime.scene.focus('overview')}
        >
          Overview
        </button>
        <button
          className={`${button} pointer-events-auto`}
          onClick={() => runtime.scene.follow()}
        >
          Follow Ari
        </button>
        <button
          className={`${button} pointer-events-auto`}
          onClick={() => act(() => runtime.scene.visit('park'))}
        >
          Park break
        </button>
        <button
          className={`${button} pointer-events-auto`}
          onClick={() => act(() => runtime.scene.visit('coffee'))}
        >
          Coffee walk
        </button>
      </div>
      <aside className="z-10 col-start-3 flex min-h-0 flex-col border-l border-[#e2e5da] bg-[#fbfaf6] max-lg:col-start-1 max-lg:row-start-2">
        <div className="border-b border-[#e2e5da] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Office journal</h2>
            <span className="rounded-full bg-[#eaf0e3] px-2.5 py-1 text-[10px] uppercase tracking-wider">
              Local workspace
            </span>
          </div>
          <div
            role="tablist"
            aria-label="Office panels"
            className="mt-5 flex gap-1"
          >
            {(['Tasks', 'Logs', 'Layout', 'Sources'] as const).map((name) => (
              <button
                role="tab"
                aria-selected={tab === name}
                key={name}
                className={`flex-1 rounded-lg px-2 py-2 text-xs ${tab === name ? 'bg-[#355b45] font-semibold text-white' : 'text-[#7b887c] hover:bg-[#edf1e6]'}`}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {message && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-[#e3b7a4] bg-[#fff0e9] p-3 text-xs leading-relaxed text-[#8a4330]"
            >
              {message}
              <button className="ml-2 underline" onClick={() => setMessage('')}>
                Dismiss
              </button>
            </div>
          )}
          {tab === 'Tasks' && <WorkPanel runtime={runtime} />}
          {tab === 'Logs' && <Logs runtime={runtime} />}
          {tab === 'Layout' && <LayoutPanel runtime={runtime} act={act} />}
          {tab === 'Sources' && <SourcePanel runtime={runtime} act={act} />}
        </div>
        <div className="border-t border-[#e2e5da] p-4">
          <button
            className={`${primary} w-full`}
            onClick={() => act(() => runtime.send('working'))}
          >
            Start synthetic task
          </button>
          <label className="mt-3 flex items-center gap-2 text-xs text-[#7b887c]">
            <input
              type="checkbox"
              checked={reduced}
              onChange={(event) => {
                setReduced(event.target.checked)
                runtime.scene.setReducedMotion(event.target.checked)
              }}
            />
            Reduced motion
          </label>
        </div>
      </aside>
    </>
  )
}
export function OfficeApp() {
  const host = useRef<HTMLDivElement>(null)
  const [runtime, setRuntime] = useState<OfficeRuntime | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let closed = false,
      owned: OfficeRuntime | null = null
    if (!host.current) return
    createOfficeRuntime(host.current, localStorage)
      .then((value) => {
        owned = value
        if (closed) void value.dispose()
        else setRuntime(value)
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : String(reason))
      )
    return () => {
      closed = true
      if (owned) void owned.dispose()
    }
  }, [])
  return (
    <div className="flex h-dvh min-h-[600px] flex-col overflow-hidden">
      <header className="z-20 flex h-17 shrink-0 items-center justify-between border-b border-[#e2e5da] bg-[#fbfaf6] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#355b45] text-xl text-[#edf1e6]">
            ⌘
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Asyra Office
            </h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8c9889]">
              Small world. Meaningful work.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium">The garden studio</p>
          <p className="text-[10px] text-[#8c9889]">
            Local preview - no live provider
          </p>
        </div>
      </header>
      <main className="relative grid min-h-0 flex-1 grid-cols-[210px_minmax(0,1fr)_320px] max-lg:grid-cols-1 max-lg:grid-rows-[minmax(300px,1fr)_minmax(250px,45%)]">
        <div
          ref={host}
          aria-label="3D office scene"
          className="absolute inset-y-0 left-[210px] right-[320px] overflow-hidden max-lg:inset-x-0 max-lg:bottom-[45%]"
        />
        {runtime && <Workspace runtime={runtime} />}
        {error && (
          <div
            role="alert"
            className="z-30 col-span-3 m-8 self-start rounded-2xl bg-white p-6"
          >
            <h2 className="font-semibold">Office could not start</h2>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}
        <div className="pointer-events-none absolute left-[238px] top-6 max-lg:left-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7c8b76]">
            Place 01
          </p>
          <h2 className="mt-1 text-2xl font-medium tracking-tight">
            A good place to begin
          </h2>
        </div>
      </main>
    </div>
  )
}
