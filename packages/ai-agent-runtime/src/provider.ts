import type { AiToolContractInput, AiToolOutcome } from './tool-contract.js'
import type { AiActionDescription, AiJsonValue } from './types.js'

/** Ordered public purpose and observed owner phase, independent of outcome. */
export interface ExecutionActivity {
  readonly kind: 'work' | 'system'
  readonly callId: string
  readonly sequence: number
  readonly parentCallId?: string
  readonly scope?: 'request' | 'call'
  /** Canonical operation result; transport completion alone has no outcome. */
  readonly outcome?: AiToolOutcome
  /** Actual dispatched work, not the enclosing tool capability. */
  readonly effect?: AiToolContractInput['effect'] | 'mixed'
  readonly phase?:
    | 'provider'
    | 'queued'
    | 'admission'
    | 'preparing'
    | 'executing'
    | 'applying'
    | 'inspecting'
}

/** Shared transport admission for public activity, without altering its language. */
export const isExecutionActivity = (
  value: unknown
): value is ExecutionActivity => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const activity = value as ExecutionActivity
  const identity = (id: unknown) =>
    typeof id === 'string' && id.length > 0 && id.length <= 256
  return (
    ['work', 'system'].includes(activity.kind) &&
    identity(activity.callId) &&
    Number.isSafeInteger(activity.sequence) &&
    activity.sequence > 0 &&
    (activity.parentCallId === undefined ||
      (identity(activity.parentCallId) &&
        activity.parentCallId !== activity.callId)) &&
    (activity.scope === undefined ||
      ['request', 'call'].includes(activity.scope)) &&
    (activity.outcome === undefined ||
      (activity.outcome !== null &&
        typeof activity.outcome === 'object' &&
        ['success', 'partial', 'failed', 'unknown'].includes(
          activity.outcome.status
        ) &&
        ['not-started', 'completed', 'partial', 'unknown'].includes(
          activity.outcome.settlement
        ))) &&
    (activity.effect === undefined ||
      ['read', 'prepare', 'mutation', 'external', 'mixed'].includes(
        activity.effect
      )) &&
    (activity.phase === undefined ||
      [
        'provider',
        'queued',
        'admission',
        'preparing',
        'executing',
        'applying',
        'inspecting'
      ].includes(activity.phase))
  )
}

export interface AiActionBatchAction {
  readonly id: string
  readonly name: string
  readonly arguments: unknown
  readonly summary: AiJsonValue
}

export interface AiActionBatch {
  readonly batchId: string
  readonly explanation?: string
  readonly actions: readonly AiActionBatchAction[]
}

export interface AiProviderInput<TContext = unknown> {
  readonly intent: string
  readonly context: TContext
  readonly actions: readonly AiActionDescription[]
  readonly attempt: number
  readonly metadata?: AiJsonValue
}

export interface AiBatchReceipt {
  /** Failure of this batch only. Completed actions must not be replayed. */
  readonly failure?: {
    readonly code: string
    readonly message: string
    readonly stage: string
    readonly actionName: string | null
    readonly actionId: string | null
    readonly actionExecutionMs: number | null
    readonly settlement: 'not-started' | 'completed' | 'partial' | 'unknown'
    readonly contractStage?: 'registration' | 'input' | 'output'
    readonly observedResult?: AiJsonValue
    readonly contextFresh: boolean
  }
  readonly actionResults: readonly {
    readonly actionId: string
    readonly actionName: string
    readonly result: AiJsonValue
  }[]
  readonly context: AiJsonValue
}

export interface AiProvider {
  requestActionBatch(
    input: AiProviderInput,
    options: {
      signal: AbortSignal
      executeBatch?: (batch: AiActionBatch) => Promise<AiBatchReceipt>
      onProgress?: (event: {
        readonly tool: string
        readonly status: 'running' | 'completed'
        readonly message?: string
        readonly activity?: ExecutionActivity
      }) => void
    }
  ): Promise<AiActionBatch>
  dispose?(): void | Promise<void>
}

export type AiProviderErrorCode =
  | 'AI_PROVIDER_ABORTED'
  | 'AI_PROVIDER_DISPOSED'
  | 'AI_PROVIDER_FETCH_UNAVAILABLE'
  | 'AI_PROVIDER_HTTP_STATUS'
  | 'AI_PROVIDER_INVALID_CONFIGURATION'
  | 'AI_PROVIDER_INVALID_ENDPOINT'
  | 'AI_PROVIDER_INVALID_INPUT'
  | 'AI_PROVIDER_MALFORMED_RESPONSE'
  | 'AI_PROVIDER_TIMEOUT'
  | 'AI_PROVIDER_TRANSPORT_FAILED'

export interface AiProviderErrorOptions {
  readonly code: AiProviderErrorCode
  readonly message: string
  readonly retryable?: boolean
  readonly status?: number
}

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode
  readonly retryable: boolean
  readonly stage = 'provider' as const
  readonly status?: number

  constructor(options: AiProviderErrorOptions) {
    super(options.message)
    this.name = 'AiProviderError'
    this.code = options.code
    this.retryable = options.retryable ?? false
    this.status = options.status
  }
}
