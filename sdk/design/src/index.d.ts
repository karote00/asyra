import type { CanvasBinding } from '@asyra/canvas'

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}
export interface DesignTools {
  setTool(tool: 'rectangle' | 'select'): void
  drawRectangle(rectangle: Rectangle): string
  getSelection(): readonly string[]
  undo(): Promise<void>
  redo(): Promise<void>
  save(): Promise<unknown>
}
export function attachDesignTools(
  canvas: CanvasBinding,
  options?: { document?: unknown }
): Promise<DesignTools>
