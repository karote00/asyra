import type {
  CanonicalElementRemoval,
  CanonicalElementInsertionRequest
} from '@asyra/scene-tree'
import type {
  HierarchyMove,
  PropertyComponentRawData,
  PropsRestoreSnapshot,
  SceneTreeRestoreSnapshot,
  SubtreeChange,
  UpdateElementDataChange,
  UpdateElementPropertyBindingsChange,
  PropertyLayerEdit
} from '@asyra/utils'
import type { PropertyComponentValuesUpdate } from './props.js'

export type CanonicalChange =
  | Readonly<{
      kind: 'property-components'
      creations?: readonly PropertyComponentRawData[]
      removals?: readonly PropertyComponentRawData[]
      layers?: readonly Readonly<{
        propertyId: string
        changes: readonly PropertyLayerEdit[]
      }>[]
      updates: readonly PropertyComponentValuesUpdate[]
    }>
  | Readonly<{
      kind: 'element-property-bindings'
      changes: readonly UpdateElementPropertyBindingsChange[]
    }>
  | Readonly<{
      kind: 'element-data'
      changes: readonly UpdateElementDataChange[]
    }>
  | Readonly<{
      kind: 'hierarchy-moves'
      moves: readonly HierarchyMove[]
    }>
  | Readonly<{
      kind: 'subtree-removal'
      change: SubtreeChange
    }>
  | Readonly<{
      kind: 'subtree-restore'
      sceneSnapshot: SceneTreeRestoreSnapshot
      propsSnapshot: PropsRestoreSnapshot
    }>
  | Readonly<{
      kind: 'element-creation'
      entries: CanonicalElementInsertionRequest['entries']
      properties: readonly PropertyComponentRawData[]
    }>
  | Readonly<{
      kind: 'element-removal'
      removals: readonly CanonicalElementRemoval[]
    }>

export interface CanonicalChangeAPIs {
  applyCanonicalChanges(changes: readonly CanonicalChange[]): void
}
