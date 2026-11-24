import type { CanvasBinding } from '@asyra/canvas'

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}
export type DesignTool = 'rectangle' | 'select'

export type WorkspaceTool = DesignTool | 'oval' | 'pen' | 'text'

export interface DesignTools<Tool extends string = DesignTool> {
  getTool(): Tool
  setTool(tool: Tool): void
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

export interface WorkspaceTools extends DesignTools<WorkspaceTool> {
  drawOval(bounds: Rectangle): string
  select(ids: readonly string[]): void
  group(): string | null
  ungroup(): readonly string[]
  updateElement(edit: {
    elementId: string
    name?: string
    properties?: Record<string, string | number>
    fillColor?: string
    strokeColor?: string
  }): boolean
}

type ToolsFor<Tool extends string> = WorkspaceTool extends Tool
  ? WorkspaceTools
  : DesignTools<Tool>

export interface DesignAction<Tool extends string = WorkspaceTool> {
  label: string
  run(tools: ToolsFor<Tool>): void | Promise<void>
}

type Command<Tool extends string> = Tool | 'undo' | 'redo'

export interface DesignOptions<
  Id extends string = never,
  Tool extends string = WorkspaceTool
> {
  actions?: Partial<Record<Id, DesignAction<Tool>>>
  document?: unknown
  toolbar?: false | readonly (Command<Tool> | NoInfer<Id>)[]
}

export interface WorkspaceExtension<Id extends string = string> {
  actions: Partial<Record<Id, DesignAction>>
}

export interface WorkspaceOptions<
  Id extends string = never
> extends DesignOptions<Id> {
  extensions?: readonly WorkspaceExtension<Id>[]
  panels?: { layers?: boolean; properties?: boolean }
  collaboration?: { fileId: string; endpoint: string; actorId?: string }
}

export type DesignEditor<
  Id extends string,
  Tool extends string
> = ToolsFor<Tool> & {
  runAction(id: Command<Tool> | Id): Promise<void>
  destroy(): Promise<void>
}

export function createDesign<Id extends string = never>(
  target: HTMLCanvasElement,
  options?: DesignOptions<Id, DesignTool>
): Promise<DesignEditor<Id, DesignTool>>
export function createDesign<Id extends string = never>(
  target: HTMLElement,
  options?: WorkspaceOptions<Id>
): Promise<DesignEditor<Id, WorkspaceTool>>
