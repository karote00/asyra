import { useEffect, useMemo, useState } from 'react'
import type { ItemProjection, ItemStatus } from '../domain/item-domain.js'
import { ITEM_STATUSES } from '../domain/item-domain.js'
import {
  createStarterRuntime,
  type StarterRuntime
} from '../runtime/starter-runtime.js'
import './styles.css'

const statusLabels: Record<ItemStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done'
}

const useStarterRuntime = () => {
  const runtime = useMemo(() => createStarterRuntime(), [])
  const [items, setItems] = useState<readonly ItemProjection[]>([])
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Starting runtime...')

  useEffect(() => {
    const host = document.getElementById('starter-render-host')
    if (!host) {
      setMessage('Render host is missing.')
      return
    }
    const unsubscribe = runtime.projection.subscribe(setItems)
    let active = true
    runtime
      .start(host, {
        width: Math.max(320, host.clientWidth || 800),
        height: 360
      })
      .then(() => {
        if (!active) {
          return
        }
        setReady(true)
        setMessage(runtime.storageStatus ?? 'Ready')
      })
      .catch((error: unknown) => {
        if (!active) {
          return
        }
        setMessage(error instanceof Error ? error.message : String(error))
      })

    return () => {
      active = false
      unsubscribe()
      void runtime.dispose()
    }
  }, [runtime])

  return { items, message, ready, runtime, setMessage }
}

const ItemRow = ({
  item,
  runtime,
  setMessage
}: {
  readonly item: ItemProjection
  readonly runtime: StarterRuntime
  readonly setMessage: (message: string) => void
}) => {
  const [title, setTitle] = useState(item.title)

  useEffect(() => {
    setTitle(item.title)
  }, [item.title])

  const commitTitle = (): void => {
    if (title === item.title) {
      return
    }
    try {
      runtime.feature.editItem(item.id, { title })
      setMessage('Updated title')
    } catch (error) {
      setTitle(item.title)
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const changeStatus = (status: ItemStatus): void => {
    try {
      runtime.feature.editItem(item.id, { status })
      setMessage('Updated status')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <li className="item-row">
      <input
        aria-label={`Title for ${item.id}`}
        value={title}
        onBlur={commitTitle}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
      />
      <div className="status-control" aria-label={`Status for ${item.id}`}>
        {ITEM_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={status === item.status ? 'active' : undefined}
            onClick={() => changeStatus(status)}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>
    </li>
  )
}

export const StarterApp = () => {
  const { items, message, ready, runtime, setMessage } = useStarterRuntime()

  const addItem = (): void => {
    try {
      runtime.feature.addItem({
        title: `Item ${items.length + 1}`,
        status: 'todo'
      })
      setMessage('Added item')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const runCommand = (command: () => Promise<void>, label: string): void => {
    command()
      .then(() => setMessage(label))
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : String(error))
      })
  }

  return (
    <main className="starter-shell">
      <section className="workspace-panel" aria-label="Starter workspace">
        <div className="toolbar">
          <button type="button" onClick={addItem} disabled={!ready}>
            Add
          </button>
          <button
            type="button"
            onClick={() => runCommand(runtime.undo, 'Undid action')}
            disabled={!ready}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => runCommand(runtime.redo, 'Redid action')}
            disabled={!ready}
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() =>
              runtime
                .save()
                .then((result) => setMessage(result.message))
                .catch((error: unknown) => {
                  setMessage(
                    error instanceof Error ? error.message : String(error)
                  )
                })
            }
            disabled={!ready}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() =>
              runtime.reload().then((result) => setMessage(result.message))
            }
            disabled={!ready}
          >
            Reload
          </button>
        </div>
        <div id="starter-render-host" className="render-host" />
      </section>
      <aside className="items-panel" aria-label="Items">
        <div className="panel-heading">
          <h1>Starter App</h1>
          <p>{message}</p>
        </div>
        <ul>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              runtime={runtime}
              setMessage={setMessage}
            />
          ))}
        </ul>
      </aside>
    </main>
  )
}
