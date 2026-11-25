import type { AiActionBatch, AiProviderInput } from '@asyra/ai-agent-runtime'
import {
  AiModelBackendError,
  isActionBatchEnvelope,
  type AiModelBackendOptions
} from './ai-model-contract'
import {
  createDefaultAiModelSources,
  selectAiModelSource
} from './ai-model-sources'

export const requestConfiguredAiActionBatch = async (
  input: AiProviderInput,
  options: AiModelBackendOptions = {}
): Promise<AiActionBatch> => {
  const environment = options.environment ?? process.env
  const sources = options.sources ?? createDefaultAiModelSources()

  try {
    const source = selectAiModelSource(
      environment.AI_PROVIDER_BACKEND?.trim() || 'local-codex',
      sources
    )
    const value = await source.request(input, options)

    if (options.signal?.aborted) {
      throw new AiModelBackendError(
        'AI_MODEL_BACKEND_ABORTED',
        'The AI request was aborted.'
      )
    }

    if (!isActionBatchEnvelope(value)) {
      throw new AiModelBackendError(
        'AI_MODEL_BACKEND_INVALID_RESPONSE',
        'The AI source returned an invalid action batch.'
      )
    }

    return value
  } finally {
    if (!options.sources) {
      await Promise.all(sources.map((source) => source.dispose?.()))
    }
  }
}
