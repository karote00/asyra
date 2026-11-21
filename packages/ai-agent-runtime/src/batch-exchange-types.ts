import type {
  AiActionBatch,
  AiBatchReceipt,
  ExecutionActivity
} from './provider.js'
export type ExecuteAiBatch = (batch: AiActionBatch) => Promise<AiBatchReceipt>
export interface AiToolProgress {
  readonly activity?: ExecutionActivity
  readonly tool: string
  readonly status: 'running' | 'completed'
  readonly message?: string
}
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
