import type { Rectangle } from './index.js'

export interface Point {
  x: number
  y: number
}
export interface Layer {
  id?: string
  name?: string
  type?: string
  parentId?: string
  children?: string[]
  lock?: boolean
  visible?: boolean
}
export interface Gradient {
  gradientType: 'linear' | 'radial' | 'angular' | 'diamond'
  gradientHandles: Point[]
  gradientStops: { position: number; color: string; opacity: number }[]
}
type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hwb' | 'oklch' | 'hsb' | 'css'
export interface Fill {
  id: string
  type: string
  kind: 'gradient' | 'solid'
  color: string
  opacity: number
  visible: boolean
  defaultColorFormat: ColorFormat
  colorFormat: ColorFormat
  gradient: Gradient | null
}
export interface Stroke {
  id: string
  type: string
  style: 'solid' | 'dashed'
  position: 'inside' | 'outside' | 'center'
  joinType: 'bevel' | 'miter' | 'round'
  capType: 'butt' | 'square' | 'round'
  width: number
  miterAngle: number
  dash: number
  gap: number
  fill: Fill
}
export interface Anchor extends Point {
  id: string
  type: 'sharp' | 'smooth'
  handleMode: 'none' | 'mirror-angle' | 'mirror-angle-length'
  inHandle: Point | null
  outHandle: Point | null
}
export interface PathData {
  anchors: Anchor[]
  segments: Record<
    string,
    {
      id: string
      startId: string
      endId: string
      inControlId?: string | null
      outControlId?: string | null
    }
  >
  networks: Record<
    string,
    { id: string; pointIds: string[]; segmentIds: string[]; closed: boolean }
  >
}
export interface CollaborationState {
  connection: 'none' | 'connected' | 'disconnected'
  sync: 'synced' | 'pending' | 'reconciling' | 'conflicted' | 'storage-failed'
  pendingCount: number
  disconnectedEpoch: number
  recoveryAvailable?: boolean
  notification?: {
    id: string
    message: string
    type: 'disconnected' | 'reconnected' | 'storage-failed' | 'conflicted'
  }
}
export interface ElementProperties extends Partial<Rectangle> {
  fills?: Fill[]
  strokes?: Stroke[]
  text?: string
  rotation?: number
  [key: string]: unknown
}

export interface WorkspaceObservations {
  disabledFeatures: readonly string[]
  elementSelection: ReadonlySet<string>
  elementDataMap: Readonly<Record<string, Layer>>
  flattenedElementIds: readonly string[]
  hoveredElementId: string | null
  viewportPosition: Point
  zoom: number
  collaboration: CollaborationState | null
}

export interface WorkspaceEditingTools {
  getLayers(): {
    workspaceId: string | null
    ids: string[]
    elements: Record<string, Layer>
  }
  getElementProperties(
    id: string,
    fields?: readonly string[]
  ): ElementProperties | undefined
  getViewport(): { position: Point; scale: number }
  panTo(position: Point): void
  zoomTo(scale: number, center: Point): void
  selectArea(bounds: Rectangle, additive?: boolean): void
  setHoveredElement(id: string | null): void
  moveElements(positions: Record<string, Point>): void
  moveLayers(request: {
    elementIds: readonly string[]
    targetParentId: string
    targetIndex: number
  }): readonly string[]
  setLayerLocked(id: string, locked: boolean): boolean
  setLayerVisible(id: string, visible: boolean): boolean
  createText(
    text: string,
    bounds: Rectangle,
    sizing?: 'fixed' | 'auto-width' | 'auto-height'
  ): string
  createPath(points: readonly Point[], closed?: boolean): string | null
  getPath(id: string): PathData | null
  editPath(id: string | null): void
  selectPathPoint(
    id: string,
    anchorId: string,
    target?: 'anchor' | 'inHandle' | 'outHandle'
  ): void
  selectPathSegment(id: string, segmentId: string): void
  appendAnchor(
    id: string,
    point: Point,
    startNewSubpath?: boolean
  ): string | null
  moveAnchor(id: string, anchorId: string, point: Point): boolean
  removeAnchor(id: string, anchorId: string): boolean
  splitSegment(id: string, segmentId: string, point: Point): string | null
  setAnchorType(id: string, anchorId: string, type: Anchor['type']): boolean
  setHandleMode(
    id: string,
    anchorId: string,
    mode: 'none' | 'mirror-angle' | 'mirror-angle-length'
  ): boolean
  moveHandle(
    id: string,
    anchorId: string,
    handle: 'inHandle' | 'outHandle',
    point: Point
  ): boolean
  connectAnchors(id: string, from: string, to: string): boolean
  setPathClosed(id: string, closed: boolean): boolean
  addFill(id: string): string | null
  updateFill(
    id: string,
    fillId: string,
    patch: Partial<Omit<Fill, 'id' | 'type'>>
  ): boolean
  removeFill(id: string, fillId: string): boolean
  getGradientHandles(id: string, fillId: string): [Point, Point] | null
  moveGradientHandle(
    id: string,
    fillId: string,
    index: 0 | 1,
    point: Point
  ): boolean
  setActiveGradient(id: string | null, fillId: string | null): void
  addStroke(id: string): string | null
  updateStroke(
    id: string,
    strokeId: string,
    patch: Partial<Omit<Stroke, 'id' | 'type'>>
  ): boolean
  removeStroke(id: string, strokeId: string): boolean
  getCollaborationState(): CollaborationState | null
  retrySaving(): Promise<void>
  downloadRecoveryFile(): Promise<void>
  observe<K extends keyof WorkspaceObservations>(
    key: K,
    listener: (value: WorkspaceObservations[K]) => void
  ): () => void
  observe(key: string, listener: (value: unknown) => void): () => void
}
