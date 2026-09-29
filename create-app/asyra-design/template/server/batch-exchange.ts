import { randomUUID } from 'node:crypto'
import type {
  AiActionBatch,
  AiBatchReceipt
} from '../src/ai/action-batch-protocol'

export interface PreparedBatchFrame {
  readonly type: 'batch'
  readonly receiptToken: string
  readonly batch: AiActionBatch
}

/** Pending delivery state only; tokens and artifacts are retired with the owning request. */
export const createBatchExchange = () => {
  const pending = new Map<string, (receipt: AiBatchReceipt) => void>()
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
          cleanup()
          resolve(receipt)
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
      if (
        !settle ||
        typeof receipt !== 'object' ||
        receipt === null ||
        !('actionResults' in receipt) ||
        !Array.isArray(receipt.actionResults) ||
        !('context' in receipt)
      )
        return false
      // The HTTP owner has already bounded and parsed the request body.
      settle(receipt as AiBatchReceipt)
      return true
    }
  }
}
