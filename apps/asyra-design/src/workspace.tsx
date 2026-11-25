import { createCommonSession } from './workspace/common-session'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { PresetSystemPropertyKeys } from '@asyra/preset'
import { DesignWorkspace, type WorkspaceProps } from './app/design-workspace'
import core from './contexts'
import { featureEnabled } from './workspace-features'
import { updateWorkspaceFeatures } from './init/workspace-features'
import { initDesign } from './init/init-design'
import { switchPrimaryToolFeature } from './features/switch-primary-tool'
import { createDesignShape } from './features/create-element'
import { selectElements } from './controllers/element-selection'
import { selectionApis } from './common-apis/selection'
import { runHistoryCommand } from './features/undo-redo'
import {
  prepareDesignElementEdit,
  type DesignElementEdit
} from './common-apis/design-edit'
import { runTransaction } from '@asyra/core'
import { groupCommandFeature } from './features/group-elements'
import { PrimaryToolType } from './constants'
import { resetCollaborationDocument } from './collaboration/lifecycle'
import type { RenderSession } from './render-app'
import { deleteElementFeature } from './features/delete-element'
import { zoomFitFeature } from './features/zoom-fit'
import { workspaceCommands, observeWorkspace } from './workspace/commands'
import './index.css'
import '@asyra/design-system/index.css'

const tools = {
  select: PrimaryToolType.SELECT,
  rectangle: PrimaryToolType.RECTANGLE,
  oval: PrimaryToolType.OVAL,
  pen: PrimaryToolType.PEN,
  text: PrimaryToolType.TEXT
}

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

function createShape(type: 'rect' | 'oval', { x, y, width, height }: Bounds) {
  const id = createDesignShape(
    {
      type,
      workspacePosition: { x, y },
      width,
      height
    },
    'reject'
  )

  if (!id) {
    throw new Error('Shape creation failed')
  }

  return id
}

interface WorkspaceOptions {
  surface: RenderSession['surface']
  document?: RenderSession['document']
  collaboration?: RenderSession['collaboration']
  panels?: WorkspaceProps['panels']
  toolbar?: WorkspaceProps['toolbar']
  slots?: WorkspaceProps['slots']
  disabledFeatures: readonly string[]
  hideUI: boolean
  reopen(): Promise<void>
}

export function mount(options: WorkspaceOptions) {
  initDesign({ disabledFeatures: options.disabledFeatures })
  if (
    options.document !== undefined &&
    (!options.document || core.preflightLoad(options.document).length)
  ) {
    throw new TypeError('Invalid Design document')
  }

  const root = createRoot(
    document.body.appendChild(document.createElement('div'))
  )

  const reset = async () => {
    featureEnabled('reset', 'reject')
    if (options.collaboration) {
      await resetCollaborationDocument(options.collaboration.fileId)
    }

    await options.reopen()
  }

  let cancel!: (error: Error) => void
  let render!: (disabled: readonly string[]) => void
  const ready = new Promise<void>((resolve, reject) => {
    cancel = reject
    const session: RenderSession = {
      hideUI: options.hideUI,
      surface: options.surface,
      collaboration: options.collaboration,
      document: options.document,
      ready: resolve,
      failed: reject,
      reopen: options.reopen
    }

    render = (disabled) =>
      root.render(
        <DesignWorkspace
          session={session}
          panels={options.panels}
          slots={options.slots}
          disabledFeatures={disabled}
          toolbar={
            options.toolbar && {
              ...options.toolbar,
              actions: options.toolbar.actions.filter(
                ({ id }) => !disabled.includes(id)
              )
            }
          }
          onReset={reset}
        />
      )
    render(options.disabledFeatures)
  })
  const lifetime = new AbortController()
  let closing: Promise<void> | undefined

  return {
    ready,

    async updateFeatures(ids: readonly string[]) {
      await updateWorkspaceFeatures(ids)
      lifetime.signal.throwIfAborted()
      render(ids)
    },

    common: createCommonSession(lifetime.signal),
    commands: workspaceCommands(options.reopen),
    observe: observeWorkspace,

    getTool() {
      const active = core.getSystemProperty(
        PresetSystemPropertyKeys.PRIMARY_TOOL
      )

      if (active === 'none') {
        return null
      }

      return active === PrimaryToolType.RECTANGLE ? 'rectangle' : active
    },

    setTool(tool: keyof typeof tools) {
      if (!Object.hasOwn(tools, tool)) {
        throw new TypeError('Unknown Design tool: ' + tool)
      }

      switchPrimaryToolFeature.api.switch(tools[tool], 'reject')
    },

    drawRectangle: (bounds: Bounds) => createShape('rect', bounds),

    drawOval: (bounds: Bounds) => createShape('oval', bounds),

    select: (ids: string[]) => selectElements(ids, { undoable: false }, true),

    group: () =>
      groupCommandFeature.api.execute('group', 'reject')?.groupId ?? null,

    ungroup: () =>
      groupCommandFeature.api.execute('ungroup', 'reject')?.selectedIds ?? [],

    updateElement: (request: DesignElementEdit) => {
      const apply = prepareDesignElementEdit(request)

      return runTransaction(apply).status === 'complete'
    },

    getSelection: selectionApis.getSelectedIds,

    deleteSelectedElement() {
      featureEnabled('deleteSelectedElement', 'reject')
      deleteElementFeature.api.deleteSelectedElement()
    },

    zoomFit() {
      featureEnabled('zoomFit', 'reject')
      zoomFitFeature.api.zoomFit()
    },

    reset,

    undo: async () => {
      await runHistoryCommand('undo', 'reject')
    },

    redo: async () => {
      await runHistoryCommand('redo', 'reject')
    },

    save: () => core.save(),

    destroy() {
      if (!closing) {
        lifetime.abort()
        cancel(new Error('Design workspace closed during startup'))
        root.unmount()
        closing = options.surface.destroy()
      }

      return closing
    }
  }
}
