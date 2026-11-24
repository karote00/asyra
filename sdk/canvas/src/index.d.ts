export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}
export interface CanvasEditor {
  setTool(tool: 'rectangle' | 'select'): void
  drawRectangle(rectangle: Rectangle): string
  getSelection(): readonly string[]
  undo(): Promise<void>
  redo(): Promise<void>
  save(): Promise<unknown>
  destroy(): Promise<void>
}
export function createCanvas(
  target: HTMLCanvasElement,
  options?: { document?: unknown }
): Promise<CanvasEditor>
