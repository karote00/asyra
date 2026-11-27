function inspectorRow<
  const Id extends string,
  const Label extends string,
  const Fields extends readonly string[]
>(id: Id, label: Label, fields: Fields) {
  return Object.freeze({
    kind: 'inspector' as const,
    id,
    label,
    placement: 'properties.top' as const,
    fields: Object.freeze(fields)
  })
}

export const inspectorRowAttribute = 'data-inspector-row'

export const positionRow = inspectorRow('positionRow', 'Position', ['x', 'y'])
export const dimensionRow = inspectorRow('dimensionRow', 'Dimension', [
  'width',
  'height'
])

export const inspectorRows = Object.freeze({
  [positionRow.id]: positionRow,
  [dimensionRow.id]: dimensionRow
})

export type InspectorRowId = keyof typeof inspectorRows
export type InspectorFields = {
  [Row in InspectorRowId]: (typeof inspectorRows)[Row]['fields'][number]
}
