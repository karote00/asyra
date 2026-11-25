import { createConversationResults } from '@asyra/ai-agent-runtime'
import { createExchangeAiProvider } from '@asyra/ai-agent-runtime'

import { readEvaluationWindow } from './evaluation-window'
import { AiToolFailureCodes } from '../constants/ai-design'

import {
  AiProviderError,
  type GenericHttpAiProvider,
  type GenericHttpAiProviderOptions
} from '@asyra/ai-agent-runtime'
import { measureBrowserDragAsyncPhase } from '@asyra/utils'
import {
  ACTION_BATCH_ENDPOINT,
  AI_BATCH_RECEIPT_HEADER,
  AI_BATCH_EXECUTION_HEADER,
  AI_BATCH_MAXIMUM_REQUEST_BYTES
} from './action-batch-endpoint'

import { describeBatchFailure } from './action-failure'

/** Local manual evaluation only; the evaluator supplies one immutable window before Send. */
export const browserEvaluationWindow = () => {
  if (!import.meta.env.DEV || typeof location === 'undefined') {
    return undefined
  }

  const value = new URL(location.href).searchParams.get('aiEvaluationWindow')

  return value === null ? undefined : readEvaluationWindow(JSON.parse(value))
}

export { ACTION_BATCH_ENDPOINT } from './action-batch-endpoint'

const backendFailureDescriptions = new Map<
  unknown,
  ConstructorParameters<typeof AiProviderError>[0]
>([
  [
    'ACTION_BATCH_SESSION_UNAVAILABLE',
    {
      code: 'AI_PROVIDER_SESSION_UNAVAILABLE',
      message:
        'The previous AI session is unavailable or its tools changed. Start a new conversation.'
    }
  ],
  [
    'ACTION_BATCH_MODEL_TIMEOUT',
    {
      code: 'AI_PROVIDER_TIMEOUT',
      message: 'The AI request timed out.'
    }
  ],
  [
    'ACTION_BATCH_MODEL_CONFIGURATION_REQUIRED',
    {
      code: 'AI_PROVIDER_INVALID_CONFIGURATION',
      message: 'The AI provider is unavailable or not configured.'
    }
  ],
  [
    'ACTION_BATCH_MODEL_INVALID_RESPONSE',
    {
      code: 'AI_PROVIDER_MALFORMED_RESPONSE',
      message: 'The AI returned an invalid drawing response.'
    }
  ],
  [
    'ACTION_BATCH_IMAGE_CONVERSION_FAILED',
    {
      code: 'AI_PROVIDER_HTTP_STATUS',
      message: 'Image conversion failed. Your drawing is unchanged.'
    }
  ]
])

const backendFailure = (code: unknown): AiProviderError =>
  new AiProviderError(
    backendFailureDescriptions.get(code) ?? {
      code: 'AI_PROVIDER_HTTP_STATUS',
      message: 'The AI request failed.'
    }
  )

export const createServerActionBatchProvider = (
  options: Pick<GenericHttpAiProviderOptions, 'fetch'> & {
    documentScope?: () => unknown
  } = {}
): GenericHttpAiProvider => {
  const results = createConversationResults(
    options.documentScope ?? (() => undefined)
  )

  return createExchangeAiProvider({
    results,

    releaseResults: () => results.clear(),

    ...options,
    endpoint: ACTION_BATCH_ENDPOINT,
    executionHeader: AI_BATCH_EXECUTION_HEADER,
    receiptHeader: AI_BATCH_RECEIPT_HEADER,
    errorHeader: 'x-ai-error-code',
    maximumReceiptBytes: AI_BATCH_MAXIMUM_REQUEST_BYTES,
    maximumFrameBytes: 64 * 1024 * 1024,
    backendFailure,
    contextInputFailureCode: AiToolFailureCodes.INPUT_INVALID,
    contextExecutionFailureCode: AiToolFailureCodes.EXECUTION_FAILED,
    describeBatchFailure,

    prepareInput(input) {
      const evaluationWindow = browserEvaluationWindow()

      return evaluationWindow
        ? {
            ...input,
            metadata: {
              ...((input.metadata as Record<string, never>) ?? {}),
              evaluationWindow: { ...evaluationWindow }
            }
          }
        : input
    },

    measure: (work) =>
      measureBrowserDragAsyncPhase('ai-provider:server-response-handoff', work)
  })
}
