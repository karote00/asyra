import type { InspectorRow } from './editor-types.js'

/** The Design inspector's existing X and Y controls. */
export const positionRow = {
  kind: 'inspector',
  id: 'positionRow',
  label: 'Position',
  placement: 'properties.top'
} as const satisfies InspectorRow

/** The Design inspector's existing width and height controls. */
export const dimensionRow = {
  kind: 'inspector',
  id: 'dimensionRow',
  label: 'Dimension',
  placement: 'properties.top'
} as const satisfies InspectorRow
