import { useCallback, useSyncExternalStore } from 'react'
import { observeInspectionChanges } from '../common-apis/inspection-evidence'
import { elementApis } from '../common-apis/element'
import { selectionApis } from '../common-apis/selection'
import core from '../contexts'
import { useElementSelection } from '../providers'
import { featureEnabled } from '../workspace-features'
import type { InspectorNodeNumber } from './inspector-contract'
import { InspectorNumberInput } from './geometry-input'

export function NodeNumberInput({ item }: { item: InspectorNodeNumber }) {
  const selection = useElementSelection()
  const id = selection.size === 1 ? selection.values().next().value : undefined
  const matches = id && core.getElementMetadata(id)?.type === item.nodeId
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!id || !matches) {
        return () => undefined
      }

      return observeInspectionChanges((change) => {
        if (!change || change.elementIds.includes(id)) {
          notify()
        }
      }, 'effective')
    },
    [id, matches]
  )

  const read = () => {
    const value =
      matches && core.getElementComputedData(id, [item.field])?.[item.field]

    return typeof value === 'number' ? value : null
  }

  const value = useSyncExternalStore(subscribe, read)

  return (
    <InspectorNumberInput
      field={item.id}
      label={item.label}
      value={value ?? ''}
      disabled={value === null || !featureEnabled(item.nodeId)}
      onCommit={(next) => {
        const selected = selectionApis.getSelectedIds()

        if (matches && selected.length === 1 && selected[0] === id) {
          elementApis.updateElementProperties([id], { [item.field]: next })
        }
      }}
    />
  )
}
