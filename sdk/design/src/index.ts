import { canvasFeatures } from './features.js'
import type {
  CanvasFeature,
  DesignTool,
  HistoryCommand,
  WorkspaceTool,
  WorkspaceAction,
  WorkspaceFeature
} from './features.js'
export type { DesignTool, WorkspaceTool, WorkspaceFeature } from './features.js'
import { createCanvas } from '@asyra/canvas'
import { createActions } from './actions.js'
import { createToolbar } from './toolbar.js'
import { mountWorkspace } from './workspace.js'
import { createRuntime } from './runtime.js'
import type { common } from './common.js'
import type { CanvasBinding } from '@asyra/canvas'

import type { WorkspaceEditingTools } from './workspace-tools.js'
export type * from './workspace-tools.js'

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}
export interface DesignTools<Tool extends string = DesignTool> {
  getTool(): Tool | null
  setTool(tool: Tool): void
  drawRectangle(rectangle: Rectangle): string
  getSelection(): readonly string[]
  undo(): Promise<void>
  redo(): Promise<void>
  save(): Promise<unknown>
}
interface CanvasOptions {
  document?: unknown
  disabledFeatures?: readonly CanvasFeature[]
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
  hideUI?: boolean
  disabledFeatures?: readonly (
    | Command<Tool>
    | NoInfer<Id>
    | (WorkspaceTool extends Tool ? WorkspaceFeature : never)
  )[]
  actions?: Partial<Record<Id, DesignAction<Tool>>>
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
  extensions?: readonly WorkspaceExtension<Id>[]
  toolLayout?: ToolLayout
  onToolLayoutChange?(layout: ToolLayout): void
  panels?: { layers?: boolean; properties?: boolean }
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
    readonly features: NonNullable<DesignOptions<Id, Tool>['disabledFeatures']>
    setDisabledFeatures(
      ids: NonNullable<DesignOptions<Id, Tool>['disabledFeatures']>
    ): Promise<void>
    isFeatureEnabled(
      id: NonNullable<DesignOptions<Id, Tool>['disabledFeatures']>[number]
    ): boolean
    runAction(id: Command<Tool> | Id): Promise<void>
    destroy(): Promise<void>
  }

export async function attachDesignTools(
  canvas: CanvasBinding,
  options: CanvasOptions = {}
): Promise<
  DesignTools & {
    readonly features: readonly CanvasFeature[]
    setDisabledFeatures(
      ids: NonNullable<CanvasOptions['disabledFeatures']>
    ): Promise<void>
    isFeatureEnabled(
      id: NonNullable<CanvasOptions['disabledFeatures']>[number]
    ): boolean
  }
> {
  const policy = createActions({
    disabledFeatures: options.disabledFeatures
  })

  const tools = await mountTools(canvas, options, policy)

  return {
    ...tools,

    get features() {
      return canvasFeatures
    }
  }
}

function mountTools(
  canvas: CanvasBinding,
  options: { document?: unknown },
  {
    disabled,
    validateDisabled,
    isEnabled
  }: Pick<
    ReturnType<typeof createActions>,
    'disabled' | 'validateDisabled' | 'isEnabled'
  >
) {
  return canvas.mount(async (target) => {
    const { destroy, updateAvailability, ...tools } =
      await createRuntime().start(target, {
        ...options,
        disabledFeatures: disabled
      })

    return {
      tools: {
        ...tools,

        async setDisabledFeatures(ids: readonly string[]) {
          updateAvailability(validateDisabled(ids))
        },

        isFeatureEnabled: isEnabled
      },
      destroy
    }
  })
}

export function createDesign<Id extends string = never>(
  target: HTMLCanvasElement,
  options?: DesignOptions<Id, DesignTool>
): Promise<DesignEditor<Id, DesignTool>>
export function createDesign<Id extends string = never>(
  target: HTMLElement,
  options?: WorkspaceOptions<Id>
): Promise<DesignEditor<Id, WorkspaceTool>>
export async function createDesign(
  host: HTMLElement,
  options: WorkspaceOptions<string> | DesignOptions<string, DesignTool> = {}
) {
  if (!globalThis.HTMLElement || !(host instanceof globalThis.HTMLElement)) {
    throw new TypeError('Expected an HTML container or canvas from this window')
  }

  if (!(host instanceof globalThis.HTMLCanvasElement)) {
    return mountWorkspace(host, options as WorkspaceOptions<string>)
  }

  const surface = createCanvas(host)
  const target = surface.target
  const listeners = new globalThis.AbortController()
  let toolbar: ReturnType<typeof createToolbar> | undefined
  let addedTabIndex = false

  function destroy() {
    listeners.abort()
    toolbar?.remove()
    if (addedTabIndex && target.getAttribute('tabindex') === '0') {
      target.removeAttribute('tabindex')
    }

    addedTabIndex = false

    return surface.destroy()
  }

  try {
    const policy = createActions({
      ...(options as DesignOptions<string, DesignTool>),
      extensions: []
    })
    const { actions, runAction } = policy
    const session = await mountTools(surface, options, policy)
    const tools = {
      ...session,

      async setDisabledFeatures(ids: readonly string[]) {
        await session.setDisabledFeatures(ids)
        toolbar?.update()
      },

      setTool(tool: DesignTool) {
        session.setTool(tool)
        toolbar?.update()
      }
    }

    const editor = {
      ...tools,

      get features() {
        return policy.features
      },

      async runAction(id: string) {
        if (listeners.signal.aborted) {
          throw new Error('Design editor is disposed')
        }

        await runAction(id, tools)
      },

      destroy
    }

    if (!options.hideUI && options.toolbar !== false) {
      toolbar = createToolbar(
        target,
        [...(options.toolbar ?? actions.keys())],
        actions,
        editor,
        listeners.signal
      )
    }

    if (!target.hasAttribute('tabindex')) {
      target.tabIndex = 0
      addedTabIndex = true
    }

    return editor
  } catch (error) {
    await destroy()
    throw error
  }
}
