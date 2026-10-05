import { randomUUID } from 'node:crypto'
import type {
  AiActionBatch,
  AiBatchReceipt,
  BrowserBatchFailure
} from '../src/ai/action-batch-protocol'

export interface PreparedBatchFrame {
  readonly type: 'batch'
  readonly receiptToken: string
  readonly batch: AiActionBatch
}

export class BrowserBatchExecutionError extends Error {
  constructor(
    readonly failure: BrowserBatchFailure,
    readonly receipt?: AiBatchReceipt
  ) {
    super(failure.message)
    this.name = 'BrowserBatchExecutionError'
  }
}

/** Stop the compound operation, while retaining its receipt for model recovery. */
export const requireBatchSuccess = (
  batch: AiActionBatch,
  receipt: AiBatchReceipt,
  executionMs: number
) => {
  if (receipt.failure)
    throw new BrowserBatchExecutionError(
      {
        batchId: batch.batchId,
        code: 'BROWSER_BATCH_EXECUTION_FAILED',
        message: receipt.failure.message,
        actionName: receipt.failure.actionName,
        executionMs,
        handlerMs: null
      },
      receipt
    )
  return receipt
}

const admitFailure = (
  value: unknown,
  batch: AiActionBatch
): value is BrowserBatchFailure => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const failure = value as Record<string, unknown>
  const duration = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0
  return (
    Object.keys(failure).every((key) =>
      [
        'batchId',
        'actionName',
        'code',
        'message',
        'handlerMs',
        'executionMs'
      ].includes(key)
    ) &&
    failure.batchId === batch.batchId &&
    failure.code === 'BROWSER_BATCH_EXECUTION_FAILED' &&
    (failure.actionName === null ||
      batch.actions.some((action) => action.name === failure.actionName)) &&
    typeof failure.message === 'string' &&
    failure.message.length > 0 &&
    failure.message.length <= 1000 &&
    (failure.handlerMs === null || duration(failure.handlerMs)) &&
    duration(failure.executionMs)
  )
}

/** Pending delivery state only; tokens and artifacts are retired with the owning request. */
export const createBatchExchange = () => {
  const pending = new Map<string, (receipt: unknown) => boolean>()
  return {
    execute: (
      batch: AiActionBatch,
      signal: AbortSignal,
      send: (frame: PreparedBatchFrame) => void
    ): Promise<AiBatchReceipt> =>
      new Promise((resolve, reject) => {
        if (signal.aborted) return reject(new Error('Request cancelled'))
        const token = randomUUID()
        const cleanup = () => {
          pending.delete(token)
          signal.removeEventListener('abort', abort)
        }
        const abort = () => {
          cleanup()
          reject(new Error('Request cancelled'))
        }
        pending.set(token, (receipt) => {
          if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt))
            return false
          if ('batchFailure' in receipt) {
            if (
              Object.keys(receipt).length !== 1 ||
              !admitFailure(receipt.batchFailure, batch)
            )
              return false
            cleanup()
            reject(new BrowserBatchExecutionError(receipt.batchFailure))
            return true
          }
          if (
            !('actionResults' in receipt) ||
            !Array.isArray(receipt.actionResults) ||
            !('context' in receipt)
          )
            return false
          cleanup()
          resolve(receipt as AiBatchReceipt)
          return true
        })
        signal.addEventListener('abort', abort, { once: true })
        try {
          send({ type: 'batch', receiptToken: token, batch })
        } catch (error) {
          cleanup()
          reject(error)
        }
      }),
    accept: (token: string, receipt: unknown): boolean => {
      const settle = pending.get(token)
      // The HTTP owner has already bounded and parsed the request body.
      return settle?.(receipt) ?? false
    }
  }
}
