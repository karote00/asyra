import { getActiveCollaborationHandle } from '../collaboration/session-observation'
import React, { useEffect, useRef, useState } from 'react'
import core from '../contexts'
import {
  AiDocumentInteractionTargetProps,
  CANVAS_BACKGROUND_COLOR
} from '../constants'
import { DocumentRecoveryControls } from './document-recovery-controls'
import type {
  CollaborationDebugHandle,
  CollaborationSessionNotification
} from '../collaboration/lifecycle'
import { createEmptyDocument } from '../config/empty-document'
import {
  getConfiguredCollaborationMode,
  type CollaborationMode
} from './collaboration-mode'
import AiDrawingProgressIndicator from './ai-drawing-progress-indicator'
import { StatusToastStack } from './status-toast-stack'
import { TextCanvasEditor } from './text-canvas-editor'

export interface CanvasContextMenuInvocation {
  clientX: number
  clientY: number
  invoker: HTMLDivElement
}

export interface RenderSession {
  document?: ReturnType<typeof createEmptyDocument>
  collaboration?: CollaborationMode
  surface: {
    start(
      container: HTMLElement,
      start: (canvas: HTMLCanvasElement) => Promise<void>,
      resize: (width: number, height: number) => void,
      dispose: () => Promise<void>
    ): Promise<void>
    destroy(): Promise<void>
  }
  ready(): void
  failed(error: unknown): void
  reopen(): void
}

interface RenderAppProps {
  session?: RenderSession
  onContextMenuRequest?: (invocation: CanvasContextMenuInvocation) => void
  onCanvasHostTeardown?: () => void
}

const RenderApp: React.FC<RenderAppProps> = ({
  session,
  onContextMenuRequest,
  onCanvasHostTeardown
}) => {
  const renderContainerRef = useRef<HTMLDivElement>(null)
  const lifecycleRef = useRef<Promise<void>>(Promise.resolve())
  const [collaborationNotification, setCollaborationNotification] =
    useState<CollaborationSessionNotification>()

  const [recoverySession, setRecoverySession] =
    useState<CollaborationDebugHandle>()

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      !onContextMenuRequest ||
      !(event.target instanceof HTMLCanvasElement) ||
      !event.currentTarget.contains(event.target)
    ) {
      return
    }

    event.preventDefault()
    onContextMenuRequest({
      clientX: event.clientX,
      clientY: event.clientY,
      invoker: event.currentTarget
    })
  }

  useEffect(() => {
    let active = true
    let runtimeDestroyPromise: Promise<void> | undefined
    let unsubscribeCollaborationState: (() => void) | undefined

    const destroyRuntime = (): Promise<void> => {
      runtimeDestroyPromise ??= session
        ? session.surface.destroy()
        : core.destroy()

      return runtimeDestroyPromise
    }

    const lifecycle = lifecycleRef.current
      .catch(() => undefined)
      .then(async () => {
        if (!active) {
          return
        }

        const container = renderContainerRef.current

        if (!container) {
          return
        }

        const collaborationMode = session
          ? session.collaboration
          : getConfiguredCollaborationMode()
        let collaborationLifecycle:
          typeof import('../collaboration/lifecycle') | undefined

        if (collaborationMode) {
          collaborationLifecycle = await import('../collaboration/lifecycle')
          core.registerCollaborationSession(
            collaborationLifecycle.createCollaborationDocumentSession(
              collaborationMode
            )
          )
        } else {
          core.setLoadSource({
            name: 'LocalOnlyDocument',

            load: async () => session?.document ?? createEmptyDocument()
          })
        }

        const start = (target: HTMLElement) =>
          core.start(target, {
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: CANVAS_BACKGROUND_COLOR,
            backgroundColorAlpha: 1
          })

        if (session) {
          await session.surface.start(
            container,
            start,
            (width, height) => core.resizeRenderer(width, height),
            () => core.destroy()
          )
        } else {
          await start(container)
        }

        if (!active) {
          await destroyRuntime()

          return
        }

        const handle = collaborationMode
          ? getActiveCollaborationHandle()
          : undefined

        if (collaborationMode && !handle) {
          throw new Error(
            '[RenderApp] collaboration session did not activate through Core'
          )
        }

        if (handle) {
          setCollaborationNotification(handle.getSessionState().notification)
          setRecoverySession(
            handle.getSessionState().recoveryAvailable ? handle : undefined
          )
          unsubscribeCollaborationState = handle.onSessionStateChange(
            (state) => {
              if (active) {
                setCollaborationNotification(state.notification)
                setRecoverySession(state.recoveryAvailable ? handle : undefined)
              }
            }
          )
        }

        if (!active) {
          await destroyRuntime()
        } else {
          session?.ready()
        }
      })

    lifecycleRef.current = lifecycle
    void lifecycle.catch((error: unknown) => {
      if (active) {
        console.error('[RenderApp] Render startup failed:', error)
        session?.failed(error)
      }
    })

    return () => {
      active = false
      unsubscribeCollaborationState?.()
      void destroyRuntime().catch((error: unknown) => {
        console.error('[RenderApp] runtime teardown failed:', error)
      })
    }
  }, [session])

  useEffect(() => {
    if (!recoverySession) {
      return
    }

    const guard = (event: BeforeUnloadEvent) => {
      if (!recoverySession.hasUnpersistedChanges()) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', guard)

    return () => window.removeEventListener('beforeunload', guard)
  }, [recoverySession])

  useEffect(
    () => () => {
      onCanvasHostTeardown?.()
    },
    [onCanvasHostTeardown]
  )

  return (
    <div
      {...AiDocumentInteractionTargetProps.VIEWPORT_NAVIGATION}
      className="absolute inset-0"
      data-testid="canvas-host"
      tabIndex={-1}
      onContextMenu={handleContextMenu}
    >
      <div
        ref={renderContainerRef}
        className="absolute inset-0"
        data-testid="canvas-render-container"
      />
      <StatusToastStack
        toasts={[
          ...(collaborationNotification
            ? [
                {
                  id: collaborationNotification.id,
                  message: collaborationNotification.message
                }
              ]
            : [])
        ]}
      />
      {recoverySession && (
        <DocumentRecoveryControls
          session={recoverySession}
          reopen={session?.reopen ?? (() => window.location.reload())}
        />
      )}
      {!session && <AiDrawingProgressIndicator />}
      <TextCanvasEditor />
    </div>
  )
}

export default RenderApp
