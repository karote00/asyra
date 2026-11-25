import type {
  DesignTool,
  HistoryCommand,
  WorkspaceAction,
  WorkspaceFeature,
  WorkspaceTool
} from './features.js'
import type { common } from './common.js'
import type { WorkspaceEditingTools } from './workspace-tools.js'

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}
export interface DesignTools<Tool extends string = DesignTool> {
  /** The active primary tool, or null when no tool is active. */
  getTool(): Tool | null
  setTool(tool: Tool): void
  drawRectangle(rectangle: Rectangle): string
  getSelection(): readonly string[]
  undo(): Promise<void>
  redo(): Promise<void>
  save(): Promise<unknown>
}
export interface WorkspaceTools
  extends DesignTools<WorkspaceTool>, WorkspaceEditingTools {
  readonly common: typeof common
  drawOval(bounds: Rectangle): string
  select(ids: readonly string[]): void
  deleteSelectedElement(): void
  zoomFit(): void
  reset(): Promise<void>
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

type Command<Tool extends string> =
  Tool | HistoryCommand | (WorkspaceTool extends Tool ? WorkspaceAction : never)

export interface DesignOptions<
  Id extends string = never,
  Tool extends string = WorkspaceTool
> {
  /** Hide the built-in controls. Enabled tools still accept canvas input and SDK calls. */
  hideUI?: boolean
  /**
   * Feature IDs to disable when this editor opens. Defaults to an empty list.
   * The code stays in the bundle and existing content remains readable and visible.
   * Use editor.setDisabledFeatures() to change availability while mounted.
   */
  disabledFeatures?: readonly (
    | Command<Tool>
    | NoInfer<Id>
    | (WorkspaceTool extends Tool ? WorkspaceFeature : never)
  )[]
  actions?: Partial<Record<Id, DesignAction<Tool>>>
  /** Snapshot to open. On a declarative host, keep this reference stable until switching boards. */
  document?: unknown
  toolbar?: false | readonly (Command<Tool> | NoInfer<Id>)[]
}

export type ToolPlacement =
  'properties.top' | 'toolbar.top' | 'selectionMenu' | 'manual'
export type ToolLayout = Partial<Record<ToolPlacement, readonly string[]>> & {
  floating?: Record<string, { x: number; y: number }>
}

export interface ToolGroup<Id extends string = string> {
  readonly id: string
  readonly label?: string
  readonly placement: ToolPlacement
  mount(context: {
    container: HTMLElement
    editor: DesignEditor<Id, WorkspaceTool>
  }): undefined | (() => void)
}

export interface ToolGroups {
  getLayout(): ToolLayout
  setLayout(layout: ToolLayout): void
  move(id: string, placement: ToolPlacement, index?: number): void
  float(id: string, point: { x: number; y: number }): void
  mount(id: string, container: HTMLElement): () => void
}

export interface WorkspaceExtension<Id extends string = string> {
  readonly id?: Id
  actions?: Partial<Record<Id, DesignAction>>
  ui?: readonly ToolGroup<Id>[]
}

export interface WorkspaceOptions<
  Id extends string = never
> extends DesignOptions<Id> {
  /** Automatically restore and save committed edits in this browser under a stable board key. */
  storageKey?: string
  extensions?: readonly WorkspaceExtension<Id>[]
  toolLayout?: ToolLayout
  onToolLayoutChange?(layout: ToolLayout): void
  panels?: { layers?: boolean; properties?: boolean }
  /** Changing the service, file or actor on a declarative host opens a new editor session. */
  collaboration?: { fileId: string; endpoint: string; actorId?: string }
}

export type DesignEditor<
  Id extends string,
  Tool extends string
> = ToolsFor<Tool> &
  (WorkspaceTool extends Tool
    ? {
        readonly toolGroups: ToolGroups
      }
    : unknown) & {
    /** All feature IDs registered with this editor, including currently disabled IDs. */
    readonly features: NonNullable<DesignOptions<Id, Tool>['disabledFeatures']>
    /** Replace the entire disabled list on this editor. Pass [] to enable all registered features. */
    setDisabledFeatures(
      ids: NonNullable<DesignOptions<Id, Tool>['disabledFeatures']>
    ): Promise<void>
    /** Whether this editor currently allows the feature. Use getTool() for the active tool. */
    isFeatureEnabled(
      id: NonNullable<DesignOptions<Id, Tool>['disabledFeatures']>[number]
    ): boolean
    runAction(id: Command<Tool> | Id): Promise<void>
    destroy(): Promise<void>
  }
