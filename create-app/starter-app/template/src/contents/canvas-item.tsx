import { useEffect, useRef, useState } from 'react'
import type { ItemProjection } from '../domain/item-domain.js'
import { statusLabels } from '../config/item-labels.js'
import { getStarterItemRenderBounds } from '../render-layers/items.js'
import { useApp } from '../contexts/app.js'
import { useItem, useIsSelected } from '../providers/properties.js'

interface DragSession {
  readonly pointerId: number
  readonly startX: number
  readonly startY: number
  readonly startBounds: ReturnType<typeof getStarterItemRenderBounds>
  moved: boolean
  offset?: { x: number; y: number }
}

const CanvasItemView = ({
  item,
  index,
  width,
  height
}: {
  readonly item: ItemProjection
  readonly index: number
  readonly width: number
  readonly height: number
}) => {
  const { controller, previewItemPosition } = useApp()
  const selected = useIsSelected(item.id)
  const onSelect = (): void => controller.selectItem(item.id)
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
      previewItemPosition(null)
    }
  }, [item.offset, preview, previewItemPosition])

  useEffect(() => () => previewItemPosition(null), [previewItemPosition])

  const cancelDrag = (): void => {
    drag.current = null
    setPreview(null)
    previewItemPosition(null)
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
        previewItemPosition(item.id, offset)
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
        if (controller.moveItem(item.id, session.offset)) onSelect()
        else cancelDrag()
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

export const CanvasItem = ({
  id,
  ...layout
}: {
  readonly id: string
  readonly index: number
  readonly width: number
  readonly height: number
}) => {
  const item = useItem(id)
  return item ? <CanvasItemView item={item} {...layout} /> : null
}
