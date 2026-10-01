import type {
  AddElementsChange,
  CreateElementData,
  ComputedDataPatchChange,
  DataTypes,
  ElementDataFieldChange,
  EVENT_OPTIONS,
  ElementRawData,
  GroupInstanceTypes,
  HierarchyMove,
  MoveHierarchyRequest,
  RemoveElementsChange,
  SceneTreeDataOwner,
  SceneTreeRawData,
  SceneTreeChange,
  SubtreeChange,
  UpdateElementBatchChange
} from '@asyra/utils'
import { EventTypes } from '../types.js'

/** Complete canonical mutation, consumed locally before another API runs. */
export interface SceneTreeChangedEvent {
  type: typeof EventTypes.SCENE_TREE_CHANGED
  payload: { projectionOwner: symbol; changes: readonly SceneTreeChange[] }
}

export interface SceneTreeInitEvent {
  type: EventTypes
}

export interface SceneTreeLoadDataEvent {
  type: EventTypes
  payload: {
    data: SceneTreeRawData
  }
}

export interface SceneTreeLoadCompleteEvent {
  type: EventTypes
}

export interface AddElementEvent {
  type: EventTypes
  payload: {
    data: CreateElementData
    parent?: GroupInstanceTypes
    parentId?: string
    index?: number
  }
  options?: EVENT_OPTIONS
}

export interface RemoveElementEvent {
  type: EventTypes
  payload: {
    data: Partial<ElementRawData>
    parent?: GroupInstanceTypes
  }
  options?: EVENT_OPTIONS
}

export interface AddElementsEvent {
  type: EventTypes
  payload: AddElementsChange
  options?: EVENT_OPTIONS
}

export interface RemoveElementsEvent {
  type: EventTypes
  payload: RemoveElementsChange
  options?: EVENT_OPTIONS
}

export interface MoveElementsEvent {
  type: EventTypes
  payload:
    | {
        request: MoveHierarchyRequest
      }
    | {
        moves: HierarchyMove[]
      }
  options?: EVENT_OPTIONS
}

export interface ChangeSubtreeEvent {
  type: EventTypes
  payload: SubtreeChange
  options?: EVENT_OPTIONS
}

export interface UpdateComputedDataEvent {
  type: EventTypes
  payload: {
    id: string
    key: string
    before: DataTypes
    after: DataTypes
    owner: SceneTreeDataOwner
  }
}

export interface UpdateElementDataEvent {
  type: EventTypes
  payload: {
    id: string
    changes: readonly ElementDataFieldChange[]
  }
}

export interface UpdateComputedDataBatchEvent {
  type: EventTypes
  payload: Pick<
    UpdateElementBatchChange,
    'action' | 'eventName' | 'id' | 'changes'
  >
}

export interface UpdateComputedDataPatchEvent {
  type: EventTypes
  payload: {
    id: string
    patch: ComputedDataPatchChange
  }
}

export type SceneTreeEvents =
  | SceneTreeChangedEvent
  | SceneTreeInitEvent
  | SceneTreeLoadDataEvent
  | SceneTreeLoadCompleteEvent
  | AddElementEvent
  | RemoveElementEvent
  | AddElementsEvent
  | RemoveElementsEvent
  | MoveElementsEvent
  | ChangeSubtreeEvent
  | UpdateElementDataEvent
  | UpdateComputedDataEvent
  | UpdateComputedDataBatchEvent
  | UpdateComputedDataPatchEvent
