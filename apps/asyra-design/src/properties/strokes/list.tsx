import { UIItems } from '../../workspace/ui-parts'
import type { StrokeRowAttrs } from '@asyra/utils'
import StrokeItem from './stroke'
import { PlusIcon } from '../icons'

interface StrokeListProps {
  strokes: StrokeRowAttrs[]
  ownerElementId: string | null
  mixed: boolean
  onAdd: () => void
  onRemoveStroke: (index: number) => void
}

const StrokeList = ({
  strokes,
  ownerElementId,
  mixed,
  onAdd,
  onRemoveStroke
}: StrokeListProps) => {
  return (
    <div
      className="grid grid-cols-1 w-full pb-2"
      data-inspector-section="strokes"
      data-testid="prop-strokes-section"
    >
      <UIItems
        id="strokes"
        parts={{
          strokeHeading: (
            <div className="group flex items-center justify-between h-10 pl-4 pr-2 text-white">
              <UIItems
                id="strokeHeading"
                parts={{
                  strokeLabel: (
                    <span className="text-[11px] font-medium opacity-60 tracking-wider">
                      Stroke
                    </span>
                  ),
                  addStroke: (
                    <button
                      type="button"
                      onClick={onAdd}
                      className="flex items-center justify-center w-5 h-5 rounded hover:bg-panel-surface-hover text-white/60 hover:text-white transition-colors"
                      data-stroke-action="add"
                      data-testid="prop-stroke-add"
                      title="Add stroke"
                    >
                      <PlusIcon />
                    </button>
                  )
                }}
              />
            </div>
          ),
          mixedStrokes: mixed && (
            <div
              className="pl-4 pr-2 py-2 text-[11px] text-white/50"
              data-stroke-status="mixed"
              data-testid="prop-strokes-mixed"
            >
              Mixed strokes across current selection.
            </div>
          ),
          emptyStrokes: !strokes.length && (
            <div
              className="pl-4 pr-2 py-3 text-[11px] text-white/40"
              data-stroke-status="empty"
              data-testid="prop-strokes-empty"
            >
              No strokes yet.
            </div>
          ),
          strokeRows: strokes.map((stroke, index) => {
            const primaryStrokeId = stroke.ids[0]

            if (!primaryStrokeId) {
              return null
            }

            return (
              <StrokeItem
                key={primaryStrokeId}
                index={index}
                strokeId={primaryStrokeId}
                ownerElementId={ownerElementId}
                onRemove={() => onRemoveStroke(index)}
              />
            )
          })
        }}
      />
    </div>
  )
}

export default StrokeList
