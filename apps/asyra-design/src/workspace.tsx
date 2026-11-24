import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PresetSystemPropertyKeys } from '@asyra/preset'
import { DesignWorkspace } from './app/design-workspace'
import core from './contexts'
import DataContexts from './contexts/data-change'
import { configureWorkspaceFeatures } from './init/workspace-features'
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
import ToolButton from './toolbar/tool-button'
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
  panels?: { layers?: boolean; properties?: boolean }
  controls?: false | readonly { id: string; label: string }[]
  disabledFeatures: readonly string[]
  hideUI: boolean
  defaultControls: boolean
  runAction(id: string): Promise<void>
  reopen(): Promise<void>
}

function WorkspaceControls({
  options,
  reset
}: {
  options: WorkspaceOptions
  reset: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  async function run(id: string) {
    setBusy(true)
    try {
      await options.runAction(id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {options.defaultControls && <ToolButton onReset={reset} />}
      {options.controls &&
        options.controls.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="h-7 rounded px-2 text-[11px] text-white hover:bg-[#47484e] disabled:opacity-50"
            disabled={busy}
            onClick={() => void run(id)}
          >
            {label}
          </button>
        ))}
    </div>
  )
}

export function mount(options: WorkspaceOptions) {
  initDesign()
  configureWorkspaceFeatures(options.disabledFeatures)
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
    if (options.collaboration) {
      await resetCollaborationDocument(options.collaboration.fileId)
    }

    await options.reopen()
  }

  const controls =
    options.controls === false ? (
      false
    ) : (
      <WorkspaceControls options={options} reset={reset} />
    )
  let cancel!: (error: Error) => void
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

    root.render(
      <>
        <DataContexts />
        <DesignWorkspace
          session={session}
          panels={
            options.hideUI
              ? { layers: false, properties: false }
              : options.panels
          }
          toolbar={controls}
          onReset={reset}
        />
      </>
    )
  })
  let closing: Promise<void> | undefined

  return {
    ready,

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

    undo: async () => {
      await runHistoryCommand('undo', 'reject')
    },

    redo: async () => {
      await runHistoryCommand('redo', 'reject')
    },

    save: () => core.save(),

    destroy() {
      if (!closing) {
        cancel(new Error('Design workspace closed during startup'))
        root.unmount()
        closing = options.surface.destroy()
      }

      return closing
    }
  }
}
