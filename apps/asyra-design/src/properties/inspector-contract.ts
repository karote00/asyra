export type InspectorRowId = 'positionRow' | 'dimensionRow'
export type InspectorRefs = Partial<
  Record<InspectorRowId, (element: HTMLDivElement | null) => void>
>
