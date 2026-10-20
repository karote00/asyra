import type {
  PropertyValuesMutation,
  PropertyRecordsMutation
} from '@asyra/props-manager'
import type {
  AddRemoveElementEntry,
  ElementRawData,
  ElementPropertyRelation,
  SceneTreeChange,
  SubtreeChange,
  UpdateElementPropertyBindingsChange,
  UpdateElementDataChange
} from '@asyra/utils'

export interface ElementPropertyValuesTargetRequest {
  readonly kind: 'values'
  readonly elementId: string
  readonly values: Readonly<Record<string, unknown>>
}

export interface ElementPropertyRecordTargetPatch {
  readonly key: string
  readonly set?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
  readonly remove?: readonly string[]
}

export interface ElementPropertyPatchTargetRequest {
  readonly kind: 'records'
  readonly elementId: string
  readonly values?: Readonly<Record<string, unknown>>
  readonly records: readonly ElementPropertyRecordTargetPatch[]
}

export type ElementPropertyTargetRequest =
  ElementPropertyValuesTargetRequest | ElementPropertyPatchTargetRequest

export interface ResolvedElementPropertyTargets {
  readonly kind: 'resolved-element-property-targets'
  readonly orderedElementIds: readonly string[]
  readonly relations: readonly ElementPropertyRelation[]
  readonly mutations: readonly (
    PropertyValuesMutation | PropertyRecordsMutation
  )[]
}

export interface ElementPropertyBindingRequest {
  readonly elementId: string
  readonly propertyName: string
  readonly expectedRootId?: string
}

export interface ResolvedElementPropertyBinding {
  readonly relation: ElementPropertyRelation
  readonly shared: boolean
}

export interface ElementPropertyBindingMutationRequest {
  readonly elementId: string
  readonly propertyName: string
  readonly propertyType: string
  readonly before: string
  readonly after: string
}

export interface PreparedElementPropertyBindingMutation {
  readonly kind: 'prepared-element-property-binding-mutation'
  readonly orphanRootPropertyIds: readonly string[]
  readonly retainedRootPropertyIds: readonly string[]
  readonly orderedElementIds: readonly string[]
  readonly evidence: readonly UpdateElementPropertyBindingsChange[]
}

export interface ElementDataValues {
  readonly name?: string
  readonly visible?: boolean
  readonly lock?: boolean
}

export interface ElementDataMutationRequest {
  readonly elementId: string
  readonly values: ElementDataValues
}

export interface ElementInsertionRequest {
  readonly parentId: string
  readonly index?: number
  readonly elements: readonly ElementRawData[]
  readonly ownerRelations: readonly ElementPropertyRelation[]
}

export interface CanonicalElementInsertionRequest {
  readonly entries: readonly AddRemoveElementEntry[]
}

export interface PreparedElementDataMutation {
  readonly kind: 'prepared-element-data-mutation'
  readonly orderedElementIds: readonly string[]
  readonly evidence: readonly UpdateElementDataChange[]
}

export interface PreparedElementInsertion {
  readonly kind: 'prepared-element-insertion'
  readonly orderedElementIds: readonly string[]
  readonly evidence: readonly SceneTreeChange[]
}

export interface PreparedCanonicalElementInsertion {
  readonly kind: 'prepared-canonical-element-insertion'
  readonly orderedElementIds: readonly string[]
  readonly ownerRelations: readonly ElementPropertyRelation[]
  readonly evidence: readonly SceneTreeChange[]
}

export interface ElementPropertyRelationRelease {
  readonly componentId: string
  readonly relationsBefore: readonly ElementPropertyRelation[]
  readonly releasedRelations: readonly ElementPropertyRelation[]
  readonly retainedRelations: readonly ElementPropertyRelation[]
}

interface ElementRemovalRelationEvidence {
  readonly relationReleases: readonly ElementPropertyRelationRelease[]
  readonly orphanRootPropertyIds: readonly string[]
  readonly retainedRootPropertyIds: readonly string[]
}

export interface PreparedElementRemoval extends ElementRemovalRelationEvidence {
  readonly kind: 'prepared-element-removal'
  readonly orderedElementIds: readonly string[]
  readonly evidence: readonly SceneTreeChange[]
}

export interface PreparedCanonicalElementRemoval extends ElementRemovalRelationEvidence {
  readonly kind: 'prepared-canonical-element-removal'
  readonly orderedElementIds: readonly string[]
  readonly evidence: readonly SceneTreeChange[]
}

export interface PreparedSubtreeRemoval extends ElementRemovalRelationEvidence {
  readonly kind: 'prepared-subtree-removal'
  readonly orderedElementIds: readonly string[]
  readonly evidence: readonly SubtreeChange[]
}

export interface PreparedSubtreesRemoval extends ElementRemovalRelationEvidence {
  readonly kind: 'prepared-subtrees-removal'
  readonly orderedElementIds: readonly string[]
  readonly evidence: readonly SceneTreeChange[]
}

export type PreparedElementMutation =
  | PreparedElementPropertyBindingMutation
  | PreparedElementDataMutation
  | PreparedElementInsertion
  | PreparedCanonicalElementInsertion
  | PreparedElementRemoval
  | PreparedCanonicalElementRemoval
  | PreparedSubtreeRemoval
  | PreparedSubtreesRemoval

export interface ElementMutationBatchResult {
  readonly orderedElementIds: readonly string[]
  readonly evidence: readonly SceneTreeChange[]
}
