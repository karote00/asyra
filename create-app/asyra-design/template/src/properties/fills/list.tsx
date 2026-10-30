import type { FillRowAttrs } from '@asyra/utils'
import FillItem from './fill'
import AppearanceSection from '../appearance-section'
import { PlusIcon } from '../icons'

interface FillListProps {
  fills: FillRowAttrs[]
  elementIds: string[]
  mixed: boolean
  onAdd: () => void
  onRemoveFill: (index: number) => void
}

const FillList = ({
  fills,
  elementIds,
  mixed,
  onAdd,
  onRemoveFill
}: FillListProps) => {
  return (
    <AppearanceSection
      label="Fill"
      testId="prop-fills-section"
      actions={
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-panel-surface-hover text-white/60 hover:text-white transition-colors"
          data-testid="prop-fill-add"
          title="Add fill"
        >
          <PlusIcon />
        </button>
      }
    >
      {mixed && (
        <div
          className="pl-4 pr-2 py-2 text-[11px] text-white/50"
          data-testid="prop-fills-mixed"
        >
          Mixed fills across current selection.
        </div>
      )}

      {!fills.length && (
        <div
          className="pl-4 pr-2 py-3 text-[11px] text-white/40"
          data-testid="prop-fills-empty"
        >
          No fills yet.
        </div>
      )}

      {fills.map((fill, index) => {
        const primaryFillId = fill.ids[0]
        if (!primaryFillId) {
          return null
        }

        return (
          <FillItem
            key={primaryFillId}
            index={index}
            fillId={primaryFillId}
            elementIds={elementIds}
            onRemove={() => onRemoveFill(index)}
          />
        )
      })}
    </AppearanceSection>
  )
}

export default FillList
