import { createCanvas, type CanvasBinding } from '@asyra/canvas'
import {
  canvasFeatures,
  type CanvasFeature,
  type DesignTool,
  type WorkspaceTool
} from './features.js'
import { createActions } from './actions.js'
import { createToolbar } from './toolbar.js'
import { mountWorkspace } from './workspace.js'
import { createRuntime } from './runtime.js'
import type {
  DesignTools,
  DesignEditor,
  DesignOptions,
  WorkspaceOptions,
  WorkspaceExtension
} from './editor-types.js'

export type { DesignTool, WorkspaceTool, WorkspaceFeature } from './features.js'
export type * from './editor-types.js'
export type * from './workspace-tools.js'

interface CanvasOptions {
  document?: unknown
  /** Features to disable on this canvas. Existing document content remains visible. */
  disabledFeatures?: readonly CanvasFeature[]
}

export async function attachDesignTools(
  canvas: CanvasBinding,
  options: CanvasOptions = {}
): Promise<
  DesignTools & {
    /** All feature IDs registered with this canvas, including disabled IDs. */
    readonly features: readonly CanvasFeature[]
    /** Replace the entire disabled list. Pass [] to enable all registered features. */
    setDisabledFeatures(
      ids: NonNullable<CanvasOptions['disabledFeatures']>
    ): Promise<void>
    /** Whether this canvas currently allows the feature. */
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
  if ('storageKey' in options && options.storageKey !== undefined) {
    throw new TypeError('Local autosave requires a workspace container')
  }

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
// Infer each installed package independently, then expose their combined IDs.
export function createDesign<
  const Extensions extends readonly [string, string, ...string[]],
  Id extends string = never,
  Host extends HTMLElement = HTMLElement
>(
  target: Host & { getContext?: never },
  options: Omit<
    WorkspaceOptions<Extensions[number] | Id>,
    'extensions' | 'actions'
  > & {
    extensions: readonly [
      ...{ [Index in keyof Extensions]: WorkspaceExtension<Extensions[Index]> }
    ]
    actions?: DesignOptions<Id>['actions']
  }
): Promise<
  HTMLCanvasElement extends Host
    ? | DesignEditor<Extensions[number] | Id, DesignTool>
      | DesignEditor<Extensions[number] | Id, WorkspaceTool>
    : DesignEditor<Extensions[number] | Id, WorkspaceTool>
>
export function createDesign<
  Id extends string = never,
  Host extends HTMLElement = HTMLElement
>(
  target: Host & { getContext?: never },
  options?: WorkspaceOptions<Id>
): Promise<
  HTMLCanvasElement extends Host
    ? DesignEditor<Id, DesignTool> | DesignEditor<Id, WorkspaceTool>
    : DesignEditor<Id, WorkspaceTool>
>
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
