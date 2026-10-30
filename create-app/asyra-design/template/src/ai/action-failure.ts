import { AiActionExecutionError } from '@asyra/ai-agent-runtime'
import type { BrowserBatchFailure } from './action-batch-protocol'

type HandlerFailure = Pick<BrowserBatchFailure, 'actionName' | 'handlerMs'>
// Weak error association: observations live no longer than the actual exception.
const handlerFailures = new WeakMap<object, HandlerFailure>()

export const recordActionFailure = (
  error: unknown,
  actionName: string,
  handlerMs: number
): void => {
  if (error !== null && typeof error === 'object')
    handlerFailures.set(error, { actionName, handlerMs })
}

export const describeBatchFailure = (
  error: unknown,
  batchId: string,
  executionMs: number
): BrowserBatchFailure => ({
  batchId,
  code: 'BROWSER_BATCH_EXECUTION_FAILED',
  message:
    error instanceof AiActionExecutionError
      ? error.message
      : 'The browser could not execute this batch. Mutation settlement is unknown.',
  actionName: null,
  handlerMs: null,
  ...(error !== null && typeof error === 'object'
    ? handlerFailures.get(error)
    : undefined),
  executionMs
})
