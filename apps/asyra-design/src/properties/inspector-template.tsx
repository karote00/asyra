import { NodeNumberInput } from './node-number-input'
import { createContext, useContext, useSyncExternalStore } from 'react'
import { updateSelectedElementProperties } from '../controllers/scene-tree'
import { useProperty } from '../hooks'
import { InspectorNumberInput } from './geometry-input'
import type {
  InspectorFields,
  InspectorItemSource,
  InspectorNumberItem,
  InspectorRowId
} from './inspector-contract'

type Field = InspectorFields[InspectorRowId]
const labels = { x: 'X', y: 'Y', width: 'W', height: 'H' }

const nativeItems = {
  positionRow: ['x', 'y'],
  dimensionRow: ['width', 'height']
} as const

export const InspectorTemplates = createContext<
  Readonly<Record<InspectorRowId, InspectorItemSource>> | undefined
>(undefined)

function NativeInput({ field }: { field: Field }) {
  const value = useProperty<number | string>(field)

  return (
    <InspectorNumberInput
      field={field}
      label={labels[field]}
      value={value}
      onCommit={(next) => updateSelectedElementProperties(field, next)}
    />
  )
}

function CustomInput({ item }: { item: InspectorNumberItem }) {
  const value = useSyncExternalStore(item.subscribe, item.getValue)

  return (
    <InspectorNumberInput
      field={item.id}
      label={item.label}
      value={value ?? ''}
      disabled={value === null}
      onCommit={item.setValue}
    />
  )
}

const subscribeStatic = () => () => undefined

export function InspectorTemplateRow({ id }: { id: InspectorRowId }) {
  const source = useContext(InspectorTemplates)?.[id]
  const items = useSyncExternalStore(
    source?.subscribe ?? subscribeStatic,
    source?.getSnapshot ?? (() => nativeItems[id])
  )

  return (
    <div className="grid grid-flow-col auto-cols-fr items-center gap-2 pl-4 pr-2 h-8 min-h-8">
      {items.map((item) => {
        if (typeof item === 'string') {
          return <NativeInput key={item} field={item} />
        }

        return item.kind === 'node-number' ? (
          <NodeNumberInput key={item.id} item={item} />
        ) : (
          <CustomInput key={item.id} item={item} />
        )
      })}
    </div>
  )
}
