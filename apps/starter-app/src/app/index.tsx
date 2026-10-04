import { useEffect, useState } from 'react'
import { initApp, type AppSession } from '../init/init-app.js'
import { waitForCore } from '../contexts/core.js'
import { AppContext } from '../contexts/app.js'
import { useStatus } from '../providers/properties.js'
import { CanvasContents, ItemList, ItemCount } from '../contents/index.js'
import { ItemProperties } from '../properties/index.js'
import { Toolbar } from '../toolbar/index.js'
import './styles.css'

const Status = () => {
  const status = useStatus()
  return (
    <p
      className={'save-state ' + status?.tone}
      role="status"
      title={status?.message}
    >
      <i aria-hidden="true" />
      <span>{status?.message}</span>
    </p>
  )
}

// This shell never subscribes to the document or operation state.
export const AppView = () => (
  <main className="starter-shell">
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          A
        </span>
        <span className="brand-name">ASYRA</span>
      </div>
      <div className="workspace-name">
        <span>Starter - Workspace</span>
        <strong>Item board</strong>
      </div>
      <Status />
    </header>
    <div className="workspace">
      <section className="canvas-area" aria-label="Starter workspace">
        <Toolbar />
        <CanvasContents />
        <div className="canvas-footer">
          <span>Item visuals reflect the document</span>
          <span>
            <ItemCount />
          </span>
        </div>
      </section>
      <aside className="items-panel" aria-label="Items">
        <div className="panel-heading">
          <span className="eyebrow">Document</span>
          <h1>Items</h1>
          <p>
            <ItemCount suffix="editable Items" />
          </p>
        </div>
        <ItemList />
        <ItemProperties />
        <div className="inspector-foot">
          Undo / Redo - explicit Save / Reload
        </div>
      </aside>
    </div>
  </main>
)

export const StarterApp = () => {
  const [app, setApp] = useState<AppSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    let session: AppSession | undefined
    void waitForCore()
      .then(() => {
        if (!active) return
        session = initApp()
        setApp(session)
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      active = false
      if (session) void session.dispose()
    }
  }, [])

  if (!app)
    return (
      <main>
        <h1>Item board</h1>
        <p role="status">{error ?? 'Starting runtime...'}</p>
      </main>
    )
  return (
    <AppContext.Provider value={app}>
      <AppView />
    </AppContext.Provider>
  )
}
