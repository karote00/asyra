import { createNativeConversations } from '@asyra/ai-agent-runtime/node'
import { createDesignModelSource } from './design-model-source'
import { resolveDesignAiRequestOptions } from './design-ai-request'
import { AiModelBackendError, isActionBatchEnvelope } from './ai-model-contract'
import type { AiModelSource } from './ai-model-sources'

export const createNativeModelSource = (): AiModelSource => {
  const conversations = createNativeConversations()

  return createDesignModelSource({
    dispose: () => conversations.dispose(),

    id: 'local-codex',

    async request(input, options) {
      const environment = options.environment ?? process.env
      const executable = environment.AI_PROVIDER_EXECUTABLE?.trim() || 'codex'
      const { requestLocalAiActionBatch } = await import('./local-ai-provider')
      const shared = await resolveDesignAiRequestOptions(options)
      const value = await requestLocalAiActionBatch(input, {
        ...shared,
        conversations,
        executable
      })

      if (options.signal?.aborted) {
        throw new AiModelBackendError(
          'AI_MODEL_BACKEND_ABORTED',
          'The local AI provider request was aborted.'
        )
      }

      if (!isActionBatchEnvelope(value)) {
        throw new AiModelBackendError(
          'AI_MODEL_BACKEND_INVALID_RESPONSE',
          'The local AI provider returned an invalid action batch.'
        )
      }

      return value
    },

    async status(environment, signal) {
      const model = environment.AI_PROVIDER_MODEL?.trim()

      if (!model) {
        return { state: 'unconfigured' }
      }

      try {
        const { checkLocalAiProvider } = await import('./local-ai-provider')

        await checkLocalAiProvider({
          model,
          executable: environment.AI_PROVIDER_EXECUTABLE?.trim() || 'codex',
          signal
        })

        return { state: 'ready' }
      } catch {
        return { state: 'local-unavailable' }
      }
    }
  })
}
