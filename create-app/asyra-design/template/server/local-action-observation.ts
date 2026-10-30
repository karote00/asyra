import { observeActionBatch as observeRuntimeBatch } from '@asyra/ai-agent-runtime/node'
import { BrowserBatchExecutionError } from './batch-exchange'

/** Design translates its browser transport exception; Runtime owns observation. */
export const observeActionBatch = (
  batch: Parameters<typeof observeRuntimeBatch>[0],
  execute: Parameters<typeof observeRuntimeBatch>[1],
  definitions: Parameters<typeof observeRuntimeBatch>[2],
  parentCallId: Parameters<typeof observeRuntimeBatch>[3],
  trace: Parameters<typeof observeRuntimeBatch>[4]
) =>
  observeRuntimeBatch(
    batch,
    execute,
    definitions,
    parentCallId,
    trace,
    (error) =>
      error instanceof BrowserBatchExecutionError ? error.failure : undefined
  )
