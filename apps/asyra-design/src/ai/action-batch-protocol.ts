export type AiJsonPrimitive = boolean | null | number | string

export type AiJsonValue =
  | AiJsonPrimitive
  | readonly AiJsonValue[]
  | { readonly [key: string]: AiJsonValue }

interface CompactAiActionDescription {
  readonly name: string
  readonly description: string
  readonly inputSchema: AiJsonValue
}

/** Host transport may carry the canonical descriptor; model discovery stays compact. */
export type AiActionDescription =
  CompactAiActionDescription | import('@asyra/ai-agent-runtime').AiToolContract

// Progress identity and phase are owned by the Runtime contract.
import type { ExecutionActivity } from '@asyra/ai-agent-runtime'
export type { ExecutionActivity } from '@asyra/ai-agent-runtime'

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

export interface AiToolProgress {
  readonly activity?: ExecutionActivity
  readonly tool: string
  readonly status: 'running' | 'completed'
  readonly message?: string
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

export type ExecuteAiBatch = (batch: AiActionBatch) => Promise<AiBatchReceipt>

/** Failed exchange acknowledgement, not proof of mutation rollback. */
export interface BrowserBatchFailure {
  readonly batchId: string
  readonly actionName: string | null
  readonly code: 'BROWSER_BATCH_EXECUTION_FAILED'
  readonly message: string
  readonly handlerMs: number | null
  readonly executionMs: number
}

export interface BrowserBatchFailureEnvelope {
  readonly batchFailure: BrowserBatchFailure
}
