import { useEffect, useMemo, useRef, useState } from 'react'
import type { ItemProjection, ItemStatus } from '../domain/item-domain.js'
import { ITEM_STATUSES } from '../domain/item-domain.js'
import {
  createStarterRuntime,
  getStarterItemRenderBounds,
  getStarterRenderHeight,
  type StarterRuntime
} from '../runtime/starter-runtime.js'
import './styles.css'

const statusLabels: Record<ItemStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done'
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const useStarterRuntime = () => {
  const runtime = useMemo(() => createStarterRuntime(), [])
  const [items, setItems] = useState<readonly ItemProjection[]>([])
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Starting runtime...')
  const [canvasWidth, setCanvasWidth] = useState(800)

  useEffect(() => {
    const host = document.getElementById('starter-render-host')
    if (!host) {
      setMessage('Render host is missing.')
      return
    }

    let active = true
    const unsubscribe = runtime.projection.subscribe(setItems)
    const resize = (): void => {
      if (!active) return
      const width = Math.max(1, host.clientWidth || 800)
      const height = Math.max(390, host.clientHeight || 390)
      setCanvasWidth(width)
      runtime.resize(width, height)
    }
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)

    runtime
      .start(host, {
        width: Math.max(1, host.clientWidth || 800),
        height: Math.max(390, host.clientHeight || 390)
      })
      .then(() => {
        if (!active) return
        setReady(true)
        setMessage(runtime.storageStatus ?? 'Ready')
        observer?.observe(host)
        resize()
      })
      .catch((error: unknown) => {
        if (active) setMessage(errorMessage(error))
      })

    return () => {
      active = false
      observer?.disconnect()
      unsubscribe()
      void runtime.dispose()
    }
  }, [runtime])

  return { items, message, ready, runtime, setMessage, canvasWidth }
}

const SelectedItemEditor = ({
  item,
  runtime,
  onEdit
}: {
  readonly item: ItemProjection
  readonly runtime: StarterRuntime
  readonly onEdit: (message: string) => void
}) => {
  const [title, setTitle] = useState(item.title)

  useEffect(() => {
    setTitle(item.title)
  }, [item.id, item.title])

  const commitTitle = (): void => {
    if (title === item.title) return
    try {
      runtime.feature.editItem(item.id, { title })
      onEdit('Updated title - unsaved changes')
    } catch (error) {
      setTitle(item.title)
      onEdit(errorMessage(error))
    }
  }

  return (
    <div className="item-editor">
      <div className="editor-heading">
        <strong>Edit Item</strong>
        <span>Selected</span>
      </div>
      <label className="field-label" htmlFor="selected-item-title">
        Title
      </label>
      <input
        id="selected-item-title"
        aria-label="Title"
        value={title}
        onBlur={commitTitle}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
      <p className="field-help">Press Enter to apply a title edit</p>
      <div className="field-label">Status</div>
      <div className="status-control" role="group" aria-label="Status">
        {ITEM_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={status === item.status}
            className={status === item.status ? 'active' : undefined}
            onClick={() => {
              if (status === item.status) return
              try {
                runtime.feature.editItem(item.id, { status })
                onEdit('Updated status - unsaved changes')
              } catch (error) {
                onEdit(errorMessage(error))
              }
            }}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>
    </div>
  )
}

interface DragSession {
  readonly pointerId: number
  readonly startX: number
  readonly startY: number
  readonly startBounds: ReturnType<typeof getStarterItemRenderBounds>
  moved: boolean
  offset?: { x: number; y: number }
}

const CanvasItem = ({
  item,
  index,
  width,
  height,
  selected,
  runtime,
  onSelect,
  onMove
}: {
  readonly item: ItemProjection
  readonly index: number
  readonly width: number
  readonly height: number
  readonly selected: boolean
  readonly runtime: StarterRuntime
  readonly onSelect: () => void
  readonly onMove: (message: string) => void
}) => {
  const drag = useRef<DragSession | null>(null)
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null)
  const bounds = getStarterItemRenderBounds(
    index,
    width,
    preview ?? item.offset,
    height
  )

  useEffect(() => {
    if (
      preview &&
      !drag.current &&
      preview.x === (item.offset?.x ?? 0) &&
      preview.y === (item.offset?.y ?? 0)
    ) {
      setPreview(null)
      runtime.previewItemPosition(null)
    }
  }, [item.offset, preview, runtime])

  useEffect(() => () => runtime.previewItemPosition(null), [runtime])

  const cancelDrag = (): void => {
    drag.current = null
    setPreview(null)
    runtime.previewItemPosition(null)
  }

  return (
    <button
      type="button"
      className={'canvas-item' + (selected ? ' selected' : '')}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        drag.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startBounds: getStarterItemRenderBounds(
            index,
            width,
            item.offset,
            height
          ),
          moved: false
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        const session = drag.current
        if (!session || session.pointerId !== event.pointerId) return
        const deltaX = event.clientX - session.startX
        const deltaY = event.clientY - session.startY
        if (!session.moved && Math.hypot(deltaX, deltaY) < 3) return
        session.moved = true
        const fallback = getStarterItemRenderBounds(index, width)
        const x = Math.max(
          0,
          Math.min(width - bounds.width, session.startBounds.x + deltaX)
        )
        const y = Math.max(
          0,
          Math.min(height - bounds.height, session.startBounds.y + deltaY)
        )
        const offset = {
          x: Math.round(x - fallback.x),
          y: Math.round(y - fallback.y)
        }
        session.offset = offset
        setPreview(offset)
        runtime.previewItemPosition(item.id, offset)
      }}
      onPointerUp={(event) => {
        const session = drag.current
        if (!session || session.pointerId !== event.pointerId) return
        drag.current = null
        if (
          !session.moved ||
          !session.offset ||
          (session.offset.x === (item.offset?.x ?? 0) &&
            session.offset.y === (item.offset?.y ?? 0))
        ) {
          cancelDrag()
          onSelect()
          return
        }
        try {
          runtime.feature.moveItem(item.id, session.offset)
          onMove('Moved item - unsaved changes')
          onSelect()
        } catch (error) {
          cancelDrag()
          onMove(errorMessage(error))
        }
      }}
      onPointerCancel={cancelDrag}
      onLostPointerCapture={() => {
        if (drag.current) cancelDrag()
      }}
      onClick={onSelect}
      aria-label={item.title}
      aria-pressed={selected}
    >
      <span className="canvas-item-top">
        <span>{String(index + 1).padStart(2, '0')} / ITEM</span>
        <span className={'item-status ' + item.status}>
          {statusLabels[item.status]}
        </span>
      </span>
      <strong>{item.title}</strong>
      <small>Drag to move - select to edit</small>
    </button>
  )
}

export const StarterApp = () => {
  const { items, message, ready, runtime, setMessage, canvasWidth } =
    useStarterRuntime()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [requestedSelectionId, setRequestedSelectionId] = useState<
    string | null
  >(null)
  const [pending, setPending] = useState(false)
  const [redoDepth, setRedoDepth] = useState(0)
  const selectedItem = items.find((item) => item.id === selectedId)
  const stageHeight = getStarterRenderHeight(items.length, canvasWidth)
  const canUndo = ready && !pending && runtime.core.getUndoHistoryDepth() > 0
  const canRedo = ready && !pending && redoDepth > 0

  useEffect(() => {
    if (requestedSelectionId) {
      if (items.some((item) => item.id === requestedSelectionId)) {
        setSelectedId(requestedSelectionId)
        setRequestedSelectionId(null)
      }
      return
    }
    if (selectedId && !items.some((item) => item.id === selectedId)) {
      setSelectedId(null)
    }
  }, [items, requestedSelectionId, selectedId])

  const afterEdit = (nextMessage: string): void => {
    setMessage(nextMessage)
    if (nextMessage.includes('unsaved changes')) setRedoDepth(0)
  }

  const addItem = (): void => {
    try {
      const id = runtime.feature.addItem({
        title: 'Item ' + (items.length + 1),
        status: 'todo'
      })
      setRequestedSelectionId(id)
      setRedoDepth(0)
      setMessage('Added item - unsaved changes')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const runHistory = (
    command: () => Promise<void>,
    label: string,
    onSuccess: () => void
  ): void => {
    setPending(true)
    command()
      .then(() => {
        onSuccess()
        setMessage(label + ' - unsaved changes')
      })
      .catch((error: unknown) => setMessage(errorMessage(error)))
      .finally(() => setPending(false))
  }

  const runStorage = (
    command: StarterRuntime['save'] | StarterRuntime['reload'],
    reload: boolean
  ): void => {
    setPending(true)
    command()
      .then((result) => {
        setMessage(result.message)
        if (result.ok && reload) setRedoDepth(0)
      })
      .catch((error: unknown) => setMessage(errorMessage(error)))
      .finally(() => setPending(false))
  }

  let statusTone = 'ok'
  if (message === 'Starting runtime...') {
    statusTone = 'loading'
  } else if (message.includes('unsaved changes')) {
    statusTone = 'unsaved'
  } else if (
    !ready ||
    (message !== 'Ready' &&
      !message.startsWith('Saved at ') &&
      !message.startsWith('Reloaded '))
  ) {
    statusTone = 'error'
  }

  return (
    <main className="starter-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span className="brand-name">ASYRA</span>
        </div>
        <div className="workspace-name">
          <span>Starter / Workspace</span>
          <strong>Item board</strong>
        </div>
        <p className={'save-state ' + statusTone} role="status" title={message}>
          <i aria-hidden="true" />
          <span>{message}</span>
        </p>
      </header>

      <div className="workspace">
        <section className="canvas-area" aria-label="Starter workspace">
          <div className="canvas-toolbar">
            <div className="canvas-heading">
              <strong>Canvas</strong>
              <span>{items.length} items - 2D view</span>
            </div>
            <div className="toolbar-actions">
              <button
                type="button"
                className="primary"
                onClick={addItem}
                disabled={!ready || pending}
              >
                <span aria-hidden="true">＋</span> Add item
              </button>
              <button
                type="button"
                onClick={() =>
                  runHistory(runtime.undo, 'Undid action', () =>
                    setRedoDepth((depth) => depth + 1)
                  )
                }
                disabled={!canUndo}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() =>
                  runHistory(runtime.redo, 'Redid action', () =>
                    setRedoDepth((depth) => Math.max(0, depth - 1))
                  )
                }
                disabled={!canRedo}
              >
                Redo
              </button>
              <button
                type="button"
                onClick={() => runStorage(runtime.save, false)}
                disabled={!ready || pending}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => runStorage(runtime.reload, true)}
                disabled={!ready || pending}
              >
                Reload
              </button>
            </div>
          </div>
          <div className="canvas-surface">
            <span className="canvas-ruler">WORKSPACE / 01</span>
            <div className="render-stage" style={{ height: stageHeight }}>
              <div id="starter-render-host" className="render-host" />
              <div className="stage-heading">
                <strong>Item board</strong>
                <span>Editable Items</span>
              </div>
              {items.map((item, index) => {
                return (
                  <CanvasItem
                    key={item.id}
                    item={item}
                    index={index}
                    width={canvasWidth}
                    height={stageHeight}
                    selected={item.id === selectedId}
                    runtime={runtime}
                    onSelect={() => setSelectedId(item.id)}
                    onMove={afterEdit}
                  />
                )
              })}
              {items.length === 0 && ready && (
                <p className="empty-canvas">
                  Your canvas is empty. Add an Item to begin.
                </p>
              )}
            </div>
          </div>
          <div className="canvas-footer">
            <span>Item visuals reflect the document</span>
            <span>{items.length} Items</span>
          </div>
        </section>

        <aside className="items-panel" aria-label="Items">
          <div className="panel-heading">
            <span className="eyebrow">Document</span>
            <h1>Items</h1>
            <p>{items.length} editable Items</p>
          </div>
          <div className="item-list">
            <div className="list-heading">
              <span>Item list</span>
              <span>Status</span>
            </div>
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={
                  'item-line' + (selectedId === item.id ? ' selected' : '')
                }
                onClick={() => setSelectedId(item.id)}
                aria-label={'Select ' + item.title}
                aria-pressed={selectedId === item.id}
              >
                <span className="list-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="list-title">{item.title}</span>
                <span className={'pill ' + item.status}>
                  {statusLabels[item.status]}
                </span>
              </button>
            ))}
          </div>
          {selectedItem ? (
            <SelectedItemEditor
              key={selectedItem.id}
              item={selectedItem}
              runtime={runtime}
              onEdit={afterEdit}
            />
          ) : (
            <p className="empty-editor">Select an Item to edit</p>
          )}
          <div className="inspector-foot">
            Undo / Redo - explicit Save / Reload
          </div>
        </aside>
      </div>
    </main>
  )
}
