import { workspaceOnlyTools, workspaceFeatures } from './features.js'
import type { WorkspaceAction } from './features.js'
import { createActions } from './actions.js'
import type { WorkspaceOptions, WorkspaceTools } from './index.js'

const workspaceTools = Object.fromEntries(
  workspaceOnlyTools.map((id) => [
    id,
    {
      label: id[0].toUpperCase() + id.slice(1),

      run: (tools: WorkspaceTools) => tools.setTool(id)
    }
  ])
)
const workspaceActions = {
  group: {
    label: 'Group',

    run(tools: WorkspaceTools) {
      tools.group()
    }
  },
  ungroup: {
    label: 'Ungroup',

    run(tools: WorkspaceTools) {
      tools.ungroup()
    }
  },
  deleteSelectedElement: {
    label: 'Delete selection',

    run: (tools: WorkspaceTools) => tools.deleteSelectedElement()
  },
  zoomFit: {
    label: 'Zoom to fit',

    run: (tools: WorkspaceTools) => tools.zoomFit()
  },
  reset: {
    label: 'Reset document',

    run: (tools: WorkspaceTools) => tools.reset()
  }
} satisfies Record<
  WorkspaceAction,
  { label: string; run(tools: WorkspaceTools): void | Promise<void> }
>

export function resolveWorkspaceOptions(options: WorkspaceOptions<string>) {
  if (
    options.toolbar !== undefined &&
    options.toolbar !== false &&
    !Array.isArray(options.toolbar)
  ) {
    throw new TypeError('Expected an ordered toolbar list or false')
  }

  if (
    options.storageKey !== undefined &&
    (typeof options.storageKey !== 'string' ||
      !options.storageKey.trim() ||
      options.document !== undefined ||
      options.collaboration !== undefined)
  ) {
    throw new TypeError(
      'Local autosave requires a storage key and an independently owned document'
    )
  }

  const extensions = [
    ...(options.extensions ?? []),
    ...(options.ui ?? []).map((group) => ({ id: group.id, ui: [group] }))
  ]
  const { actions, ...policy } = createActions(
    { ...options, extensions },
    workspaceTools,
    workspaceFeatures,
    workspaceActions
  )
  const defaultControls = options.toolbar === undefined
  const ids = defaultControls
    ? [
        'undo',
        'redo',
        ...(options.extensions ?? []).flatMap((extension) =>
          extension.ui?.length ? [] : Object.keys(extension.actions ?? {})
        ),
        ...Object.keys(options.actions ?? {})
      ]
    : (options.toolbar ?? [])
  const controls =
    options.hideUI || ids === false
      ? false
      : ids.map((id) => {
          const action = actions.get(id)

          if (!action) {
            throw new TypeError('Unknown Design action: ' + id)
          }

          return { id, label: action.label }
        })

  const collaboration = options.collaboration && {
    ...options.collaboration,
    actorId: options.collaboration.actorId ?? globalThis.crypto.randomUUID()
  }

  if (
    collaboration &&
    (!collaboration.fileId?.trim() ||
      !['ws:', 'wss:'].includes(
        new globalThis.URL(collaboration.endpoint).protocol
      ) ||
      options.document !== undefined)
  ) {
    throw new TypeError(
      'Collaboration requires a file ID, a WebSocket endpoint and a server-owned document'
    )
  }

  return {
    policy,
    controls,
    defaultControls,
    collaboration,
    extensions
  } as const
}
