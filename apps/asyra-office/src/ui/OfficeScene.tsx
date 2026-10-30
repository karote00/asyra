import { INTERIOR_REVIEW_STAGE } from '../scene/office-interior'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { startReferenceScene, type SceneRuntime } from '../scene/runtime'
import { ACTORS, PLACES } from '../scene/reference-scene'
import { DEMO_TASKS, DEMO_LOGS } from '../scene/controller'
import { Icon } from './Icons'

type Tab = 'Places' | 'Agents' | 'Logs' | 'Tasks'
function ViewLabel({ runtime }: { runtime: SceneRuntime }) {
  const s = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot)
  return <span aria-label="Current view">{s.view}</span>
}
function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return (
    <span className={`avatar avatar-${index % 4}`} aria-hidden="true">
      <span className="avatar-hair" />
      <span className="avatar-face" />
      <span className="avatar-body" />
      <i />
      {name.slice(0, 1) && <span className="avatar-eyes">••</span>}
    </span>
  )
}
export function OfficeScene() {
  const host = useRef<HTMLDivElement>(null),
    [runtime, setRuntime] = useState<SceneRuntime | null>(null),
    [error, setError] = useState(''),
    [left, setLeft] = useState<Tab>('Places'),
    [right, setRight] = useState<Tab>('Tasks'),
    [filter, setFilter] = useState('All'),
    [query, setQuery] = useState(''),
    [drawer, setDrawer] = useState<'left' | 'right' | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    if (!host.current) {
      return
    }
    let retired = false
    const pending = startReferenceScene(host.current)
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
        .then((r) => r.dispose())
        .catch(() => {
          /* Live startup error is reported above. */
        })
    }
  }, [])
  const act = (fn: () => void) => {
    try {
      fn()
      setDrawer(null)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }
  const focus = (id: string) => act(() => runtime?.focusPlace(id)),
    follow = (id: string) => act(() => runtime?.follow(id))
  const searchResults = query.trim()
    ? [
        ...PLACES.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase())
        ).map((p) => ({ id: p.id, name: p.name, type: 'place' })),
        ...ACTORS.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase())
        ).map((p) => ({ id: p.id, name: p.name, type: 'agent' })),
        ...DEMO_TASKS.filter((p) =>
          p.title.toLowerCase().includes(query.toLowerCase())
        ).map((p) => ({ id: p.agent, name: p.title, type: 'agent' }))
      ]
    : []
  const tab = (
    name: Tab,
    current: Tab,
    set: (v: Tab) => void,
    icon: string
  ) => (
    <button
      role="tab"
      aria-selected={name === current}
      onClick={() => set(name)}
    >
      <Icon name={icon} size={17} />
      {name}
    </button>
  )
  return (
    <main className="office-app">
      <header className="office-header">
        <div className="brand">
          <Icon name="home" size={24} />
          <h1>Agent Office</h1>
        </div>
        <span className="brand-note">
          A calmer place
          <br />
          to make good things happen.
        </span>
        <div className="header-spacer" />
        <div className="search">
          <Icon name="search" size={16} />
          <input
            aria-label="Search places, agents and tasks"
            type="search"
            placeholder="Search anything…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <div className="search-results">
              {searchResults.length ? (
                searchResults.map((r, i) => (
                  <button
                    key={r.id + i}
                    onClick={() => {
                      if (r.type === 'place') {
                        focus(r.id)
                      } else {
                        follow(r.id)
                      }
                      setQuery('')
                    }}
                  >
                    Go to {r.name}
                  </button>
                ))
              ) : (
                <span>No matching places, agents or tasks</span>
              )}
            </div>
          )}
        </div>
        <span className="demo-badge">Reference scene - demo</span>
        <span className="profile" aria-label="Preview user">
          A
        </span>
      </header>
      <div className="office-body">
        <aside
          className={`office-panel left-panel ${drawer === 'left' ? 'drawer-open' : ''}`}
          aria-label="Office navigation"
        >
          <div
            className="panel-tabs"
            role="tablist"
            aria-label="Office navigation tabs"
          >
            {tab('Places', left, setLeft, 'pin')}
            {tab('Agents', left, setLeft, 'people')}
          </div>
          <div className="panel-content">
            {left === 'Places'
              ? PLACES.map((place, i) => (
                  <button
                    className={`place-card ${i === 0 ? 'home-card' : ''}`}
                    key={place.id}
                    onClick={() => focus(place.id)}
                  >
                    <span className={`place-thumb thumb-${place.id}`}>
                      <Icon name={place.icon} size={30} />
                      <span className="mini-leaf" />
                    </span>
                    <span className="place-info">
                      <strong>{place.name}</strong>
                      <small>{place.description}</small>
                    </span>
                    <Icon name="arrow" size={17} />
                  </button>
                ))
              : ACTORS.map((a, i) => (
                  <button
                    key={a.id}
                    className="agent-card"
                    aria-label={`Follow ${a.name} - ${a.status}`}
                    onClick={() => follow(a.id)}
                  >
                    <Avatar name={a.name} index={i} />
                    <span>
                      <strong>{a.name}</strong>
                      <small>{a.role}</small>
                      <em>{a.activity}</em>
                    </span>
                    <span
                      className={`presence ${a.status === 'Working' ? 'working' : ''}`}
                    />
                  </button>
                ))}
          </div>
          <div className="panel-footer handwritten">
            Good people
            <br />
            <span>Brighter work</span>
            <Icon name="leaf" size={23} />
          </div>
        </aside>
        <section className="world-shell" aria-label="Office neighborhood">
          <div
            ref={host}
            className="world-viewport"
            aria-label="Office 3D scene"
            onPointerDown={(e) => {
              if (e.button !== 0) {
                return
              }
              drag.current = { x: e.clientX, y: e.clientY }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!drag.current || !runtime) {
                return
              }
              const p = drag.current
              runtime.orbit(
                (p.x - e.clientX) * 0.005,
                (p.y - e.clientY) * 0.005
              )
              drag.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerUp={() => {
              drag.current = null
            }}
            onPointerCancel={() => {
              drag.current = null
            }}
            onWheel={(e) => {
              runtime?.zoom(Math.exp(e.deltaY * 0.001))
            }}
          />
          {!runtime && !error && (
            <div className="loading-scene">
              <span className="loading-orbit" />
              Making room for good ideas…
            </div>
          )}
          {error && (
            <div role="alert" className="scene-error">
              {error}
            </div>
          )}
          <div className="scene-caption">
            <span className="tiny-dot" />
            <span aria-label="Composition stage">
              {INTERIOR_REVIEW_STAGE === 'structure'
                ? 'Structure review - one floor'
                : 'Room furnishings review'}
            </span>
            <span role="status" aria-label="Scene status">
              {runtime ? 'Demo scene ready' : 'Preparing demo scene'}
            </span>
            <span className="caption-divider" />
            {runtime && <ViewLabel runtime={runtime} />}
          </div>
          <div
            className="camera-controls"
            title="WASD or arrow keys - move; Shift - faster; drag - orbit"
          >
            <button
              aria-label="Overview"
              title="Overview"
              onClick={() => act(() => runtime?.overview())}
            >
              <Icon name="home" size={18} />
            </button>
            <span />
            <button
              aria-label="Zoom in"
              onClick={() => act(() => runtime?.zoom(0.85))}
            >
              <Icon name="plus" size={18} />
            </button>
            <button
              aria-label="Zoom out"
              onClick={() => act(() => runtime?.zoom(1.18))}
            >
              <Icon name="minus" size={18} />
            </button>
          </div>
          <span className="camera-hint">
            WASD / arrows: move - Shift: faster - Drag: orbit
          </span>
          <div className="mobile-nav">
            <button
              onClick={() => setDrawer(drawer === 'left' ? null : 'left')}
            >
              <Icon name="pin" size={16} />
              Places & Agents
            </button>
            <button
              onClick={() => setDrawer(drawer === 'right' ? null : 'right')}
            >
              <Icon name="tasks" size={16} />
              Logs & Tasks
            </button>
          </div>
        </section>
        <aside
          className={`office-panel right-panel ${drawer === 'right' ? 'drawer-open' : ''}`}
          aria-label="Work context"
        >
          <div
            className="panel-tabs"
            role="tablist"
            aria-label="Work context tabs"
          >
            {tab('Logs', right, setRight, 'logs')}
            {tab('Tasks', right, setRight, 'tasks')}
          </div>
          {right === 'Tasks' ? (
            <>
              <div className="task-filters">
                {['Not started', 'In progress', 'Done', 'Blocked'].map(
                  (status) => (
                    <button
                      key={status}
                      className={`status-filter status-${status.toLowerCase().replace(' ', '-')} ${filter === status ? 'filter-selected' : ''}`}
                      aria-pressed={filter === status}
                      onClick={() =>
                        setFilter(filter === status ? 'All' : status)
                      }
                    >
                      {status}
                      <span>
                        {DEMO_TASKS.filter((t) => t.status === status).length}
                      </span>
                    </button>
                  )
                )}
              </div>
              <div className="tasks-list">
                {DEMO_TASKS.filter(
                  (t) => filter === 'All' || t.status === filter
                ).map((task) => {
                  const actor = ACTORS.find((a) => a.id === task.agent)
                  return (
                    <button
                      className="task-row"
                      data-testid="task-row"
                      key={task.id}
                      onClick={() => follow(task.agent)}
                    >
                      <span
                        className={`task-check ${task.status === 'Done' ? 'checked' : ''}`}
                      >
                        {task.status === 'Done' ? '✓' : ''}
                      </span>
                      <span className="task-copy">
                        <strong>{task.title}</strong>
                        <span
                          className={`status-pill status-${task.status.toLowerCase().replace(' ', '-')}`}
                        >
                          {task.status}
                        </span>
                      </span>
                      <span className="task-meta">
                        <Avatar
                          name={actor?.name ?? ''}
                          index={ACTORS.findIndex((a) => a.id === task.agent)}
                        />
                        <small>{task.date}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="logs-list">
              <div className="logs-caption">
                Life around the office<span>Demo activity</span>
              </div>
              {DEMO_LOGS.map((log, i) => (
                <div className="log-row" key={log.time}>
                  <time>{log.time}</time>
                  <span className="log-dot" />
                  <div>
                    <strong>{log.agent}</strong>
                    <p>{log.text}</p>
                  </div>
                  {i === 0 && <span className="live-tag">NEW</span>}
                </div>
              ))}
            </div>
          )}
          <div className="panel-footer handwritten">
            Small steps
            <br />
            <span>Brighter tomorrows</span>
            <span className="growth-bars">▂▅▇</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
