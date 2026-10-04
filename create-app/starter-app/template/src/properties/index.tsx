import { useLayoutEffect, useRef, useState } from 'react'
import type { ItemProjection } from '../domain/item-domain.js'
import { ITEM_STATUSES } from '../domain/item-domain.js'
import { statusLabels } from '../config/item-labels.js'
import { useApp } from '../contexts/app.js'
import {
  useItem,
  useSelectedId,
  useReady,
  usePending
} from '../providers/properties.js'

const SelectedItemEditor = ({ item }: { readonly item: ItemProjection }) => {
  const { controller } = useApp()
  const ready = useReady()
  const pending = usePending()
  const [draft, setDraft] = useState<string | null>(null)
  const draftRef = useRef<string | null>(null)
  const updateDraft = (value: string | null): void => {
    draftRef.current = value
    setDraft(value)
  }
  const commitTitle = (): boolean => {
    const title = draftRef.current
    if (title === null) return true
    if (!controller.editItem(item.id, { title }, 'Title accepted')) return false
    updateDraft(null)
    return true
  }
  useLayoutEffect(() => controller.registerDraft(commitTitle))
  const cancelTitle = (): void => {
    updateDraft(null)
    controller.status({ tone: 'ok', message: 'Title edit cancelled' })
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
        value={draft ?? item.title}
        disabled={!ready || pending}
        onChange={(event) => updateDraft(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.nativeEvent.isComposing ||
            event.nativeEvent.keyCode === 229
          )
            return
          if (event.key === 'Enter') controller.prepareAction()
          if (event.key === 'Escape') cancelTitle()
        }}
      />
      <p className="field-help">Press Enter to apply - Escape to cancel</p>
      <button
        type="button"
        className="cancel-edit"
        disabled={!ready || pending || draft === null}
        onClick={cancelTitle}
      >
        Cancel edit
      </button>
      <div className="field-label">Status</div>
      <div className="status-control" role="group" aria-label="Status">
        {ITEM_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={!ready || pending}
            aria-pressed={status === item.status}
            className={status === item.status ? 'active' : undefined}
            onClick={() => {
              if (status === item.status) return
              controller.editItem(item.id, { status }, 'Status accepted')
            }}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>
    </div>
  )
}

export const ItemProperties = () => {
  const id = useSelectedId()
  const item = useItem(id)
  return item ? (
    <SelectedItemEditor key={item.id} item={item} />
  ) : (
    <p className="empty-editor">Select an Item to edit</p>
  )
}
