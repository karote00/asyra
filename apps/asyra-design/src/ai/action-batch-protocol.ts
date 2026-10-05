export type AiJsonPrimitive = boolean | null | number | string

export type AiJsonValue =
  | AiJsonPrimitive
  | readonly AiJsonValue[]
  | { readonly [key: string]: AiJsonValue }

export interface AiActionDescription {
  readonly name: string
  readonly description: string
  readonly inputSchema: AiJsonValue
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

export interface AiToolProgress {
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
    readonly settlement: 'not-started' | 'unknown'
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
