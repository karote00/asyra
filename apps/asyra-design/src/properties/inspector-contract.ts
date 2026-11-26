export type InspectorRowId = 'positionRow' | 'dimensionRow'
export type InspectorRefs = Partial<
  Record<InspectorRowId, (element: HTMLDivElement | null) => void>
>

export interface InspectorFields {
  positionRow: 'x' | 'y'
  dimensionRow: 'width' | 'height'
}

/** A host-owned number displayed by the row's standard input. */
export interface InspectorNumberItem {
  readonly kind: 'number'
  readonly id: string
  readonly label: string
  readonly getValue: () => number | null
  readonly subscribe: (notify: () => void) => () => void
  readonly setValue: (value: number) => void
}

export type InspectorItem<Key extends string> = Key | InspectorNumberItem

export interface InspectorItemSource {
  getSnapshot(): readonly InspectorItem<InspectorFields[InspectorRowId]>[]
  subscribe(notify: () => void): () => void
}
