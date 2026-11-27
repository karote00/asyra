// Ordered native parts of each workspace component. Runtime record IDs belong
// to the document and never become component IDs.
export const workspaceParts = {
  workspace: ['toolbar', 'layers', 'properties', 'canvasMenu', 'selectionMenu'],
  toolbar: ['commands', 'view'],
  commands: ['drawingTools', 'toolbarExtensions', 'toolbarActions'],
  toolbarActions: [] as readonly `action.${string}`[],
  drawingTools: [
    'resetButton',
    'selectToolIcon',
    'rectangleToolIcon',
    'ovalToolIcon',
    'penToolIcon',
    'textToolIcon'
  ],
  view: ['themeToggle', 'zoomReadout'],
  layers: ['layersHeading', 'layerTree'],
  properties: ['inspectorExtensions', 'selectionProperties', 'vectorPoint'],
  selectionProperties: [
    'selectionHeading',
    'geometry',
    'typography',
    'appearance'
  ],
  geometry: ['positionRow', 'dimensionRow', 'rotationRow'],
  appearance: ['fills', 'strokes'],
  fills: ['fillHeading', 'fillRecords'],
  fillHeading: ['fillLabel', 'addFill'],
  fillRecords: ['mixedFills', 'emptyFills', 'fillRows'],
  fillRows: ['fillColor', 'fillVisibility', 'removeFill'],
  strokes: ['strokeHeading', 'mixedStrokes', 'emptyStrokes', 'strokeRows'],
  strokeHeading: ['strokeLabel', 'addStroke'],
  strokeRows: ['strokeColorRow', 'strokeStyleRow', 'strokeOptionsRow'],
  strokeColorRow: ['strokeColor', 'strokeVisibility', 'removeStroke'],
  typography: ['editTextButton', 'typographyHeading', 'textFields'],
  textFields: [
    'fontFamilyRow',
    'fontStyleRow',
    'textSpacingRow',
    'alignmentHeading',
    'textAlignmentRow'
  ],
  vectorPoint: ['pointHeading', 'anchorSettings', 'pointCoordinates'],
  gradient: ['gradientType', 'gradientStrip', 'gradientStops'],
  feedback: ['notifications', 'recovery'],
  recovery: ['recoveryMessage', 'recoveryActions', 'recoveryError'],
  layerTree: ['layerStatus', 'layerRows'],
  layerRows: ['layerIdentity', 'layerActions'],
  layerIdentity: ['layerDisclosure', 'layerIcon', 'layerName'],
  layerActions: ['lockLayer', 'showLayer'],
  fillPaint: ['fillPicker', 'fillColorValue'],
  strokePaint: ['strokePicker', 'strokeColorValue'],
  fillModes: ['solidMode', 'gradientMode'],
  colorControls: ['colorSaturation', 'colorSliders', 'colorChannels'],
  notifications: ['notificationMessage', 'dismissNotification'],
  canvasMenu: ['groupCommand', 'ungroupCommand'],
  fillColor: ['fillPaint', 'fillDivider', 'fillOpacity'],
  strokeColor: ['strokePaint', 'strokeDivider', 'strokeOpacity'],
  strokeStyleRow: ['strokePosition', 'strokeCap', 'strokeJoin', 'strokeMiter'],
  strokeOptionsRow: ['strokeWidth', 'strokeStyle', 'strokeDash', 'strokeGap'],
  gradientType: ['gradientTypeSelect', 'flipGradient'],
  gradientStops: ['stopHeading', 'stopRows'],
  stopHeading: ['stopLabel', 'addStop'],
  stopRows: ['stopPosition', 'stopColor', 'removeStop'],
  recoveryActions: ['retrySaving', 'downloadDocument']
} as const

export type WorkspacePartGroup = keyof typeof workspaceParts
export type WorkspacePartId =
  WorkspacePartGroup | (typeof workspaceParts)[WorkspacePartGroup][number]
export type WorkspaceChild<G extends WorkspacePartGroup> =
  (typeof workspaceParts)[G][number]
export interface HostUIItem {
  readonly id: string
  mount(container: HTMLElement): undefined | (() => void)
}
export interface WorkspaceLayout {
  subscribe(id: WorkspacePartId, notify: () => void): () => void
  revision(id: WorkspacePartId): number
  order(id: WorkspacePartGroup): readonly (string | HostUIItem)[]
  target(id: WorkspacePartId): ShadowRoot | undefined
  requested(id: WorkspacePartId): boolean
}
