import type {
  AiActionBatch,
  AiToolProgress,
  ExchangeConversationResults,
  ExecuteAiBatch
} from '@asyra/ai-agent-runtime'
import type { AiModelSource } from './ai-model-sources'
import type { EvaluationReportSessions } from './evaluation-report-sessions'

export type AiModelBackendErrorCode =
  | 'AI_MODEL_BACKEND_SESSION_UNAVAILABLE'
  | 'AI_MODEL_BACKEND_TIMEOUT'
  | 'AI_MODEL_BACKEND_IMAGE_CONVERSION_FAILED'
  | 'AI_MODEL_BACKEND_ABORTED'
  | 'AI_MODEL_BACKEND_HTTP_STATUS'
  | 'AI_MODEL_BACKEND_INVALID_CONFIGURATION'
  | 'AI_MODEL_BACKEND_INVALID_RESPONSE'
  | 'AI_MODEL_BACKEND_TRANSPORT_FAILED'

export class AiModelBackendError extends Error {
  readonly code: AiModelBackendErrorCode

  readonly status?: number

  constructor(
    code: AiModelBackendErrorCode,
    message: string,
    options: { readonly status?: number } = {}
  ) {
    super(message)
    this.name = 'AiModelBackendError'
    this.code = code
    this.status = options.status
  }
}

export interface AiModelBackendOptions {
  readonly sources?: readonly AiModelSource[]
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly fetch?: typeof fetch
  readonly onProgress?: (event: AiToolProgress) => void
  readonly resultContext?: ExchangeConversationResults
  readonly reportSessions?: EvaluationReportSessions
  readonly executeBatch?: ExecuteAiBatch
  readonly signal?: AbortSignal
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const invalidConfiguration = (message: string): never => {
  throw new AiModelBackendError(
    'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
    message
  )
}

export const requireSetting = (
  environment: Readonly<Record<string, string | undefined>>,
  name: string
): string => {
  const value = environment[name]?.trim()

  if (!value) {
    return invalidConfiguration(`The Asyra Design AI backend requires ${name}.`)
  }

  return value
}

export const isActionBatchEnvelope = (
  value: unknown
): value is AiActionBatch => {
  if (
    !isRecord(value) ||
    typeof value.batchId !== 'string' ||
    value.batchId.trim().length === 0 ||
    !Array.isArray(value.actions) ||
    value.actions.length === 0
  ) {
    return false
  }

  return value.actions.every(
    (action) =>
      isRecord(action) &&
      typeof action.id === 'string' &&
      action.id.trim().length > 0 &&
      typeof action.name === 'string' &&
      action.name.trim().length > 0 &&
      Object.prototype.hasOwnProperty.call(action, 'arguments') &&
      Object.prototype.hasOwnProperty.call(action, 'summary')
  )
}

const providerFailureCodes: Readonly<Record<string, AiModelBackendErrorCode>> =
  {
    AI_PROVIDER_ABORTED: 'AI_MODEL_BACKEND_ABORTED',
    AI_PROVIDER_DISPOSED: 'AI_MODEL_BACKEND_ABORTED',
    AI_PROVIDER_FETCH_UNAVAILABLE: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
    AI_PROVIDER_INVALID_CONFIGURATION: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
    AI_PROVIDER_INVALID_ENDPOINT: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
    AI_PROVIDER_INVALID_INPUT: 'AI_MODEL_BACKEND_INVALID_RESPONSE',
    AI_PROVIDER_MALFORMED_RESPONSE: 'AI_MODEL_BACKEND_INVALID_RESPONSE',
    AI_PROVIDER_TIMEOUT: 'AI_MODEL_BACKEND_TIMEOUT',
    AI_PROVIDER_TRANSPORT_FAILED: 'AI_MODEL_BACKEND_TRANSPORT_FAILED',
    AI_PROVIDER_HTTP_STATUS: 'AI_MODEL_BACKEND_HTTP_STATUS',
    AI_PROVIDER_SESSION_UNAVAILABLE: 'AI_MODEL_BACKEND_SESSION_UNAVAILABLE'
  }

export const modelFailureCode = (code: string): string =>
  providerFailureCodes[code] ?? code
