import type { AiProvider, AiProviderInput } from '@asyra/ai-agent-runtime'
import {
  createResponsesAiProvider,
  createResponsesConversations,
  type PrepareToolProvider,
  type ProviderContentItem
} from '@asyra/ai-agent-runtime/node'
import type { AiConnectionState } from '../src/ai/connection-status'
import {
  AiModelBackendError,
  isActionBatchEnvelope,
  requireSetting,
  type AiModelBackendOptions
} from './ai-model-contract'
import {
  requestRecordedDesignAi,
  resolveDesignAiRequestOptions
} from './design-ai-request'
import { createDesignModelSource } from './design-model-source'
import { createNativeModelSource } from './native-model-source'

export interface AiModelSource {
  readonly id: string
  request(
    input: AiProviderInput,
    options: AiModelBackendOptions
  ): Promise<unknown>
  status(
    environment: Readonly<Record<string, string | undefined>>,
    signal?: AbortSignal
  ): Promise<{ state: AiConnectionState }>
  dispose?(): void | Promise<void>
}

export const selectAiModelSource = (
  id: string,
  sources: readonly AiModelSource[]
): AiModelSource => {
  const registered = new Map<string, AiModelSource>()

  for (const source of sources) {
    if (!source.id.trim() || registered.has(source.id)) {
      throw new AiModelBackendError(
        'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
        'Duplicate or empty AI source identity.'
      )
    }

    registered.set(source.id, source)
  }

  const source = registered.get(id)

  if (!source) {
    throw new AiModelBackendError(
      'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
      'The configured AI source is not registered.'
    )
  }

  return source
}

/** Register any tool-calling AiProvider without changing Design composition or routing. */
export const createToolCallingDesignSource = (configuration: {
  readonly id: string
  readonly configured: (
    environment: Readonly<Record<string, string | undefined>>
  ) => boolean
  readonly create: (
    prepare: PrepareToolProvider,
    options: AiModelBackendOptions
  ) => AiProvider
  readonly dispose?: () => void | Promise<void>
}): AiModelSource => {
  const providers = new Set<AiProvider>()
  const source = createDesignModelSource({
    id: configuration.id,

    stop: async () => {
      await Promise.allSettled(
        [...providers].map((provider) => provider.dispose?.())
      )
    },

    dispose: configuration.dispose,

    async status(environment) {
      return {
        state:
          configuration.configured(environment) &&
          !!environment.AI_PROVIDER_MODEL?.trim()
            ? 'configured'
            : 'unconfigured'
      }
    },

    request: (input, options) => run(input, options)
  })

  const run = async (
    input: AiProviderInput,
    options: AiModelBackendOptions
  ) => {
    if (!configuration.configured(options.environment ?? process.env)) {
      throw new AiModelBackendError(
        'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
        'The AI source is not configured.'
      )
    }

    if (
      input.metadata &&
      typeof input.metadata === 'object' &&
      !Array.isArray(input.metadata) &&
      'evaluationWindow' in input.metadata
    ) {
      throw new AiModelBackendError(
        'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
        'This source does not implement the optional evaluation/reporting transport.'
      )
    }

    const recorded = await requestRecordedDesignAi(
      input,
      await resolveDesignAiRequestOptions(options),
      {
        id: configuration.id,

        async run(value, turn, usage, tools) {
          const provider = configuration.create(async (_input, context) => {
            const abortTools = () =>
              tools.toolController.abort(context.signal.reason)

            context.signal.addEventListener('abort', abortTools, { once: true })
            if (context.signal.aborted) {
              abortTools()
            }

            return {
              dispose: () =>
                context.signal.removeEventListener('abort', abortTools),

              observe(event) {
                usage.trace('provider_transport_event', {
                  direction: event.direction,
                  protocol: configuration.id,
                  value: event.value
                })
                for (const search of event.discovery?.searches ?? []) {
                  const correlation = {
                    direction: event.direction,
                    callId: event.discovery?.responseId,
                    actionId: search.itemId
                  }

                  usage.trace('provider_transport_event', {
                    ...correlation,
                    part: 'tool-search-output',
                    count: search.definitions.length,
                    bytes: search.bytes
                  })
                  for (const definition of search.definitions) {
                    usage.trace('provider_transport_event', {
                      ...correlation,
                      part: 'discovered-definition',
                      namespace: definition.namespace,
                      tool: definition.name,
                      bytes: definition.bytes
                    })
                  }
                }

                if (event.usage) {
                  usage.update(event.usage)
                  if (event.usage.response) {
                    const { id, ...tokens } = event.usage.response

                    usage.trace('provider_transport_event', {
                      direction: event.direction,
                      callId: id,
                      part: 'response-usage',
                      ...tokens
                    })
                  }
                }
              },

              instructions: tools
                .instructions()
                .map((block) => block.text)
                .join('\n\n'),
              tools: tools.nativeDefinitions,
              webSearch: true,

              input(resumed): readonly ProviderContentItem[] {
                return tools.inputForTurn(resumed).map((item) => {
                  if (item.type === 'text' && typeof item.text === 'string') {
                    return { type: 'inputText', text: item.text }
                  }

                  if (item.type === 'image' && typeof item.url === 'string') {
                    return { type: 'inputImage', imageUrl: item.url }
                  }

                  throw new AiModelBackendError(
                    'AI_MODEL_BACKEND_INVALID_RESPONSE',
                    'The prepared provider content is invalid.'
                  )
                })
              },

              invoke: tools.invoke,

              decode(answer) {
                let result: unknown

                try {
                  result = JSON.parse(answer.text)
                } catch {
                  throw new AiModelBackendError(
                    'AI_MODEL_BACKEND_INVALID_RESPONSE',
                    'The AI source returned invalid final JSON.'
                  )
                }

                if (!isActionBatchEnvelope(result)) {
                  throw new AiModelBackendError(
                    'AI_MODEL_BACKEND_INVALID_RESPONSE',
                    'The AI source returned an invalid action batch.'
                  )
                }

                return result
              }
            }
          }, options)

          providers.add(provider)
          tools.reportProgress({ tool: 'provider', status: 'running' })
          try {
            return await provider.requestActionBatch(value, {
              signal: tools.toolController.signal,
              onProgress: tools.reportProgress
            })
          } finally {
            tools.reportProgress({ tool: 'provider', status: 'completed' })
            try {
              await provider.dispose?.()
            } catch {
              usage.trace('host_observation', {
                callId: 'provider-cleanup',
                phase: 'cleanup',
                status: 'failed',
                code: 'PROVIDER_CLEANUP_FAILED'
              })
            } finally {
              providers.delete(provider)
            }
          }
        }
      }
    )

    return recorded.value
  }

  return source
}

export const createDefaultAiModelSources = (
  configuration: { readonly fetch?: typeof fetch } = {}
): readonly AiModelSource[] => {
  const conversations = createResponsesConversations()

  return [
    createNativeModelSource(),
    createToolCallingDesignSource({
      id: 'openai-responses',

      configured: (environment) => !!environment.OPENAI_API_KEY?.trim(),

      create: (prepare, options) => {
        const environment = options.environment ?? process.env

        return createResponsesAiProvider({
          apiKey: requireSetting(environment, 'OPENAI_API_KEY'),
          model: requireSetting(environment, 'AI_PROVIDER_MODEL'),
          fetch: options.fetch ?? configuration.fetch,
          conversations,
          prepare
        })
      },

      dispose: () => conversations.dispose()
    })
  ]
}
