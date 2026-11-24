import { initDesign } from './init-design'
import {
  createConversationDrafts,
  type ConversationDrafts
} from '../ai/conversation-drafts'
import core from '../contexts'
import { initAiDrawingProgress } from './capabilities/init-ai-drawing-progress'
import { initFeatures } from './foundation/init-features'
import { elementApis } from '../common-apis/element'
import { viewportApis } from '../common-apis/viewport'
import {
  createAiConversationController,
  type AiConversationController
} from '../ai/conversation'
import type { AiConfirmationBroker } from '../ai/confirmation'
import { createAiStartup, type AiStartup } from '../ai/startup'
import type { AiHistoryProjection } from '../common-apis/history'
import {
  attachAiDrawingPerformanceRuntimeEvidence,
  getActiveAiDrawingPerformanceProfile
} from './performance/ai-drawing-performance-profile'

export interface AppInitialization {
  readonly aiDrafts: ConversationDrafts
  readonly aiConfirmation: AiConfirmationBroker
  readonly aiConversation: AiConversationController
  readonly aiHistory: AiHistoryProjection
  dispose(): Promise<void>
}

/**
 * Initializes all framework components and configurations.
 *
 * This is the single entry point for setting up the Asyra framework in your app.
 * Users can extend this function to add custom initialization logic, runtime scripts,
 * or redefine behaviors.
 *
 * Example extension:
 * ```typescript
 * import { initApp as baseInitApp } from './init'
 *
 * export const initApp = () => {
 *   // Initialize base framework
 *   const initialization = baseInitApp()
 *
 *   // Add custom initialization
 *   customInputHandlers()
 *   customBehaviors()
 *
 *   return initialization
 * }
 * ```
 */
export const initApp = (): AppInitialization => {
  initDesign(initAiDrawingProgress)
  const aiStartup: AiStartup = createAiStartup()
  let initializedFeatures: ReturnType<typeof initFeatures>

  try {
    initializedFeatures = initFeatures({
      aiRuntime: aiStartup.runtime
    })
  } catch (error) {
    aiStartup.history.dispose()
    void Promise.allSettled([
      aiStartup.confirmation.dispose(),
      aiStartup.runtime.dispose()
    ])
    throw error
  }

  const aiDrafts = createConversationDrafts(core)
  const aiFeature = initializedFeatures.ai
  const aiConversation = createAiConversationController({
    confirmation: aiStartup.confirmation,
    history: aiStartup.history,
    feature: aiFeature.api,

    onPublished: (turn) => {
      const result = turn.result as { recordingId?: unknown } | null

      if (typeof result?.recordingId !== 'string') {
        return
      }

      aiStartup.runtime.observe?.({
        sourceRequestId: result.recordingId,
        purpose: 'conversation-publication',
        metadata: { conversationId: turn.conversationId, turnId: turn.turnId },
        evidence: { outcome: turn.outcome, durationMs: turn.durationMs }
      })
    },

    getElementType: (elementId) => elementApis.getElementType(elementId)
  })

  const performanceProfile = getActiveAiDrawingPerformanceProfile()
  const detachPerformanceRuntimeEvidence = performanceProfile
    ? attachAiDrawingPerformanceRuntimeEvidence(performanceProfile, {
        readCanonicalElementCount: () => core.getCanonicalElementCount(),

        readCanonicalElements: () =>
          core.getAllElementData().map(({ elementId, data, computed }) => ({
            computed,
            id: elementId,
            raw: data,
            rendered: core.hasProjectedElement(elementId),
            type: String(data.type)
          })),

        readCanonicalOwnerSnapshot: () => {
          return core.getCanonicalOwnerSnapshot()
        },

        readHistoryDepth: () => core.getUndoHistoryDepth(),

        readRenderProjectionElementCount: () => core.getProjectedElementCount(),

        readViewportPosition: () => viewportApis.getPosition(),

        readZoom: () => viewportApis.getScale(),

        subscribeToTransactionStatus: (subscriber) =>
          core.subscribeToTransactionStatus(subscriber)
      })
    : undefined

  let disposal: Promise<void> | null = null

  const dispose = (): Promise<void> => {
    if (!disposal) {
      disposal = (async () => {
        window.removeEventListener('pagehide', handlePageHide)
        detachPerformanceRuntimeEvidence?.()
        aiDrafts.dispose()
        await aiConversation.dispose()
        await aiStartup.confirmation.dispose()
        aiStartup.history.dispose()
        aiFeature.dispose()
        await aiStartup.runtime.dispose()
      })()
    }

    return disposal
  }

  const handlePageHide = () => {
    void dispose()
  }

  window.addEventListener('pagehide', handlePageHide, { once: true })

  return Object.freeze({
    aiDrafts,
    aiConfirmation: aiStartup.confirmation,
    aiConversation,
    aiHistory: aiStartup.history,
    dispose
  })
}
