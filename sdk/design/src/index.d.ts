import type { CanvasBinding } from '@asyra/canvas'

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}
export type DesignTool = 'rectangle' | 'select'

export interface DesignTools {
  getTool(): DesignTool
  setTool(tool: DesignTool): void
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

export interface DesignAction {
  label: string
  run(tools: DesignTools): void | Promise<void>
}

type Command = DesignTool | 'undo' | 'redo'

export interface DesignOptions<Id extends string = never> {
  actions?: Record<Id, DesignAction>
  document?: unknown
  toolbar?: false | readonly (Command | NoInfer<Id>)[]
}

export function createDesign<Id extends string = never>(
  target: HTMLElement,
  options?: DesignOptions<Id>
): Promise<
  DesignTools & {
    runAction(id: Command | Id): Promise<void>
    destroy(): Promise<void>
  }
>
