import { useApp } from '../contexts/app.js'
import { useReady, usePending } from '../providers/properties.js'
import { ItemCount } from '../contents/index.js'

export const Toolbar = () => {
  const { controller } = useApp()
  const ready = useReady()
  const pending = usePending()
  const disabled = !ready || pending
  return (
    <div className="canvas-toolbar">
      <div className="canvas-heading">
        <strong>Canvas</strong>
        <span>
          <ItemCount suffix="items - 2D view" />
        </span>
      </div>
      <div className="toolbar-actions">
        <button
          type="button"
          className="primary"
          onClick={controller.addItem}
          disabled={disabled}
        >
          <span aria-hidden="true">＋</span> Add item
        </button>
        <button
          type="button"
          onClick={() => void controller.undo()}
          disabled={disabled}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => void controller.redo()}
          disabled={disabled}
        >
          Redo
        </button>
        <button
          type="button"
          onClick={() => void controller.save()}
          disabled={disabled}
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => void controller.reload()}
          disabled={disabled}
        >
          Reload
        </button>
      </div>
    </div>
  )
}
