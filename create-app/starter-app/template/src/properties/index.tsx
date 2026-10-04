import { useEffect, useState } from 'react'
import type { ItemProjection } from '../domain/item-domain.js'
import { ITEM_STATUSES } from '../domain/item-domain.js'
import { statusLabels } from '../config/item-labels.js'
import { useApp } from '../contexts/app.js'
import { useItem, useSelectedId } from '../providers/properties.js'

const SelectedItemEditor = ({ item }: { readonly item: ItemProjection }) => {
  const { controller } = useApp()
  const [title, setTitle] = useState(item.title)

  useEffect(() => {
    setTitle(item.title)
  }, [item.id, item.title])

  const commitTitle = (): void => {
    if (title === item.title) return
    if (
      !controller.editItem(
        item.id,
        { title },
        'Updated title - unsaved changes'
      )
    )
      setTitle(item.title)
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
              controller.editItem(
                item.id,
                { status },
                'Updated status - unsaved changes'
              )
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
