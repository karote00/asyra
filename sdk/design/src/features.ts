const canvasTools = ['rectangle', 'select'] as const
const historyCommands = ['undo', 'redo'] as const
export const canvasFeatures = Object.freeze([
  ...canvasTools,
  ...historyCommands
] as const)
export const workspaceOnlyTools = Object.freeze([
  'oval',
  'pen',
  'text'
] as const)
const workspaceActions = [
  'group',
  'ungroup',
  'deleteSelectedElement',
  'zoomFit',
  'reset'
] as const

export const workspaceFeatures = Object.freeze([
  ...canvasFeatures,
  ...workspaceOnlyTools,
  ...workspaceActions,
  'hoverElement',
  'moveElements',
  'moveLayerHierarchy',
  'pan',
  'zoom',
  'geometry',
  'fills',
  'strokes',
  'lock',
  'visibility',
  'rename'
] as const)

export type DesignTool = (typeof canvasTools)[number]
export type HistoryCommand = (typeof historyCommands)[number]
export type CanvasFeature = (typeof canvasFeatures)[number]
export type WorkspaceTool = DesignTool | (typeof workspaceOnlyTools)[number]
export type WorkspaceAction = (typeof workspaceActions)[number]
export type WorkspaceFeature = (typeof workspaceFeatures)[number]
