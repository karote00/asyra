import type { ConversationDrafts } from '../ai/conversation-drafts'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ToolBar from '../toolbar'
import Contents from '../contents'
import Properties from '../properties'
import { toTailwindPixelSize } from '../tailwind-size'
import { COLUMN_WIDTH, CONVERSATION_PANEL_WIDTH } from '../constants'
import RenderApp from '../render-app'
import {
  createGroupCommandDescriptors,
  detectGroupCommandPlatform
} from '../config/group-command-descriptors'
import {
  createAiPanelCommandDescriptor,
  matchesAiPanelToggleShortcut
} from '../config/ai-panel-command'
import type { GroupCommandPlatform } from '../constants'
import { deriveGroupCommandState } from '../controllers/group-commands'
import {
  useElementDataMap,
  useElementSelection,
  useFlattenedIdsData
} from '../providers'
import { useAppContextMenuSession } from './context-menu-session'
import { GroupContextMenu } from './group-context-menu'
import type { RenderSession } from '../render-app'
import type { AiConfirmationBroker } from '../ai/confirmation'
import type { AiConversationController } from '../ai/conversation'
import type { AiHistoryProjection } from '../common-apis/history'

export interface WorkspaceProps {
  session?: RenderSession
  toolbar?: React.ReactNode
  onReset?: () => Promise<void>
  panels?: { layers?: boolean; properties?: boolean }
  conversationPanel?: (close: () => void) => React.ReactNode
  ai?: {
    readonly drafts: ConversationDrafts
    readonly confirmation: AiConfirmationBroker
    readonly conversation: AiConversationController
    readonly history: AiHistoryProjection
  }
  groupCommandPlatform?: GroupCommandPlatform
}

export const DesignWorkspace: React.FC<WorkspaceProps> = ({
  session,
  toolbar,
  panels,
  onReset,
  conversationPanel,
  ai,
  groupCommandPlatform = detectGroupCommandPlatform()
}) => {
  const appRootRef = useRef<HTMLDivElement>(null)
  const aiFocusReturnRef = useRef<HTMLElement | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const contextMenu = useAppContextMenuSession()
  const elementSelection = useElementSelection()
  const flattenedIds = useFlattenedIdsData()
  const elementDataMap = useElementDataMap()
  const groupCommandState = useMemo(
    () =>
      deriveGroupCommandState(
        [...elementSelection],
        flattenedIds,
        elementDataMap
      ),
    [elementDataMap, elementSelection, flattenedIds]
  )
  const groupCommandDescriptors = useMemo(
    () =>
      createGroupCommandDescriptors({
        platform: groupCommandPlatform,
        state: groupCommandState
      }),
    [groupCommandPlatform, groupCommandState]
  )
  const getCanvasHost = useCallback(
    () =>
      appRootRef.current?.querySelector<HTMLElement>(
        '[data-testid="canvas-host"]'
      ) ?? null,
    []
  )
  const focusAfterPanelClose = useCallback(
    (preferredTarget?: HTMLElement | null) => {
      const promptTriggered = Boolean(
        preferredTarget?.closest('[data-ai-agent-prompt="true"]')
      )
      let target = getCanvasHost()

      if (aiFocusReturnRef.current?.isConnected) {
        target = aiFocusReturnRef.current
      }

      if (!promptTriggered && preferredTarget?.isConnected) {
        target = preferredTarget
      }

      queueMicrotask(() => {
        if (target?.isConnected) {
          target.focus({ preventScroll: true })
        }
      })
    },
    [getCanvasHost]
  )
  const closeAiPanel = useCallback(
    ({ focusTarget }: { focusTarget?: HTMLElement | null }) => {
      setAiOpen(false)
      focusAfterPanelClose(focusTarget)
    },
    [focusAfterPanelClose]
  )
  const toggleAiPanel = useCallback(
    (invoker: HTMLElement | null) => {
      if (aiOpen) {
        closeAiPanel({ focusTarget: invoker })

        return
      }

      aiFocusReturnRef.current =
        invoker?.isConnected === true ? invoker : getCanvasHost()
      setAiOpen(true)
    },
    [aiOpen, closeAiPanel, getCanvasHost]
  )
  const aiPanelCommandDescriptor = useMemo(
    () =>
      createAiPanelCommandDescriptor({
        platform: groupCommandPlatform,

        execute: () =>
          toggleAiPanel(contextMenu.session?.invoker ?? getCanvasHost())
      }),
    [
      ai,
      contextMenu.session?.invoker,
      getCanvasHost,
      groupCommandPlatform,
      toggleAiPanel
    ]
  )
  const contextMenuDescriptors = useMemo(
    () =>
      ai
        ? [aiPanelCommandDescriptor, ...groupCommandDescriptors]
        : groupCommandDescriptors,
    [ai, aiPanelCommandDescriptor, groupCommandDescriptors]
  )

  useEffect(() => {
    if (!ai) {
      return
    }

    const handleAgentPanelShortcut = (event: KeyboardEvent) => {
      if (!matchesAiPanelToggleShortcut(event, groupCommandPlatform)) {
        return
      }

      const root = appRootRef.current
      const eventTarget =
        event.target instanceof HTMLElement ? event.target : null
      const targetIsDocumentBody = eventTarget === document.body

      if (
        !root ||
        (eventTarget && !targetIsDocumentBody && !root.contains(eventTarget)) ||
        (targetIsDocumentBody &&
          document.querySelectorAll('[data-ai-root="true"]').length !== 1)
      ) {
        return
      }

      const activeElement =
        document.activeElement instanceof HTMLElement &&
        root.contains(document.activeElement)
          ? document.activeElement
          : null
      const invoker =
        eventTarget && !targetIsDocumentBody
          ? eventTarget
          : (activeElement ?? getCanvasHost())

      event.preventDefault()
      event.stopPropagation()
      toggleAiPanel(invoker)
    }

    window.addEventListener('keydown', handleAgentPanelShortcut)

    return () => window.removeEventListener('keydown', handleAgentPanelShortcut)
  }, [ai, getCanvasHost, groupCommandPlatform, toggleAiPanel])
  const handleCanvasHostTeardown = useCallback(
    () => contextMenu.dismiss('teardown'),
    [contextMenu.dismiss]
  )

  return (
    <div
      ref={appRootRef}
      className="absolute grid h-screen w-full z-20"
      data-ai-root="true"
      style={{
        gridTemplateAreas: `
        "header header header"
        "left-sidebar canvas right-sidebar"
      `,
        gridTemplateColumns: `${panels?.layers === false ? 0 : toTailwindPixelSize(COLUMN_WIDTH)}px minmax(0, 1fr) ${aiOpen ? CONVERSATION_PANEL_WIDTH : `${panels?.properties === false ? 0 : toTailwindPixelSize(COLUMN_WIDTH)}px`}`,
        gridTemplateRows: 'auto 1fr'
      }}
    >
      <RenderApp
        session={session}
        onContextMenuRequest={contextMenu.open}
        onCanvasHostTeardown={handleCanvasHostTeardown}
      />
      <GroupContextMenu
        session={contextMenu.session}
        descriptors={contextMenuDescriptors}
        onDismiss={contextMenu.dismiss}
      />
      {toolbar === false ? null : (
        <ToolBar
          aiOpen={aiOpen}
          aiShortcutLabel={aiPanelCommandDescriptor.shortcutLabel}
          onAiToggle={ai ? toggleAiPanel : undefined}
          controls={toolbar}
          onReset={onReset}
        />
      )}
      {aiOpen && conversationPanel?.(() => closeAiPanel({}))}
      {panels?.layers !== false && <Contents />}
      {panels?.properties !== false && <Properties />}
      <div
        id="viewport-anchor"
        className="absolute inset-0 pointer-events-none"
        style={{ gridArea: 'canvas' }}
      />
    </div>
  )
}
