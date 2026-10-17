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
  UpdateElementDataChange
} from '@asyra/utils'
import type { PropertyComponentValuesUpdate } from './props.js'

export type CanonicalChange =
  | Readonly<{
      kind: 'property-components'
      records?: readonly Readonly<{
        propertyId: string
        key: string
        set?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
        remove?: readonly string[]
      }>[]
      updates: readonly PropertyComponentValuesUpdate[]
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
