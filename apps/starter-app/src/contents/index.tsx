import {
  useItemIds,
  useReady,
  useCanvasWidth,
  useItem,
  useIsSelected
} from '../providers/properties.js'
import { useApp } from '../contexts/app.js'
import { getStarterRenderHeight } from '../render-layers/items.js'
import { statusLabels } from '../config/item-labels.js'
import { RenderApp } from '../render-app/index.js'
import { CanvasItem } from './canvas-item.js'

export const CanvasContents = () => {
  const ids = useItemIds()
  const ready = useReady()
  const width = useCanvasWidth()
  const height = getStarterRenderHeight(ids.length, width)
  return (
    <div className="canvas-surface">
      <span className="canvas-ruler">WORKSPACE - 01</span>
      <div className="render-stage" style={{ height }}>
        <RenderApp />
        <div className="stage-heading">
          <strong>Item board</strong>
          <span>Editable Items</span>
        </div>
        {ids.map((id, index) => (
          <CanvasItem
            key={id}
            id={id}
            index={index}
            width={width}
            height={height}
          />
        ))}
        {ids.length === 0 && ready && (
          <p className="empty-canvas">
            Your canvas is empty. Add an Item to begin.
          </p>
        )}
      </div>
    </div>
  )
}

const ItemRow = ({
  id,
  index
}: {
  readonly id: string
  readonly index: number
}) => {
  const item = useItem(id)
  const selected = useIsSelected(id)
  const { controller } = useApp()
  if (!item) return null
  return (
    <button
      type="button"
      className={'item-line' + (selected ? ' selected' : '')}
      onClick={() => controller.selectItem(id)}
      aria-label={'Select ' + item.title}
      aria-pressed={selected}
    >
      <span className="list-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="list-title">{item.title}</span>
      <span className={'pill ' + item.status}>{statusLabels[item.status]}</span>
    </button>
  )
}

export const ItemList = () => {
  const ids = useItemIds()
  return (
    <div className="item-list">
      <div className="list-heading">
        <span>Item list</span>
        <span>Status</span>
      </div>
      {ids.map((id, index) => (
        <ItemRow key={id} id={id} index={index} />
      ))}
    </div>
  )
}

export const ItemCount = ({
  suffix = 'Items'
}: {
  readonly suffix?: string
}) => (
  <>
    {useItemIds().length} {suffix}
  </>
)
