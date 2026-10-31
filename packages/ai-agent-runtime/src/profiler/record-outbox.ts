import type { ExecutionRecord } from './records.js'

/** Strict storage transactions are partitioned by bytes, not event frequency. */
export const recordStorageBatchBytes = 256 * 1024

/** An enclosing lost range, never a reconstruction or exact missing-record count. */
export interface ExecutionRecordGap {
  readonly requestId: string
  readonly fromSequence: number
  readonly throughSequence: number
  readonly stage: 'capture' | 'storage' | 'mixed'
}

/** The host supplies durable storage. Transport never owns document state. */
export interface ExecutionRecordOutbox {
  reserve(requestId: string): Promise<void>
  recordGap(gap: ExecutionRecordGap): Promise<void>
  gap(requestId: string): Promise<ExecutionRecordGap | undefined>
  /** Atomically persist one bounded, ordered, single-request batch. */
  append(records: readonly ExecutionRecord[]): Promise<void>
  read(
    requestId: string,
    fromSequence: number,
    limit: number
  ): Promise<readonly ExecutionRecord[]>
  requests(): Promise<readonly string[]>
  remove(requestId: string): Promise<void>
}
export interface ExecutionRecordAcknowledgement {
  readonly requestId: string
  readonly acknowledgedSequence: number
  readonly complete: boolean
}
export interface ExecutionRecordDeliveryIssue {
  readonly requestId?: string
  readonly reason?: string
  readonly stage: 'capture' | 'storage' | 'transport' | 'acknowledgement'
  readonly fromSequence?: number
  readonly throughSequence?: number
}
export interface ExecutionRecordDeliveryOptions {
  readonly outbox: ExecutionRecordOutbox
  readonly send: (
    records: readonly ExecutionRecord[]
  ) => Promise<ExecutionRecordAcknowledgement>
  readonly onIssue?: (issue: ExecutionRecordDeliveryIssue) => void
}
/** Bounded diagnostic text without URLs, credentials or stacks. */
export const recordDeliveryReason = (error: unknown): string =>
  (error instanceof Error
    ? `${error.name}: ${error.message}`
    : 'Unknown delivery failure'
  )
    .replace(/^Error: /, '')
    .replace(/https?:\/\/\S+|Bearer\s+\S+|data:[^\s]+/gi, '[redacted]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 240)

export const reportRecordDeliveryIssue = (
  options: ExecutionRecordDeliveryOptions,
  issue: ExecutionRecordDeliveryIssue
) => {
  try {
    options.onIssue?.(issue)
  } catch {
    /* Diagnostics cannot change product work. */
  }
}

/** The acknowledged cursor is request-local; a fresh host revalidates stored prefixes. */
export const deliverRecordOutbox = async (
  options: ExecutionRecordDeliveryOptions,
  requestId: string,
  fromSequence = 0
): Promise<{
  complete: boolean
  nextSequence: number
  interrupted: boolean
}> => {
  try {
    const gap = await options.outbox.gap(requestId)
    if (gap) {
      reportRecordDeliveryIssue(options, {
        requestId,
        stage: gap.stage === 'capture' ? 'capture' : 'storage',
        reason:
          'Persisted recording gap; missing records cannot be reconstructed',
        fromSequence: gap.fromSequence,
        throughSequence: gap.throughSequence
      })
      return { complete: false, nextSequence: fromSequence, interrupted: true }
    }
  } catch (error) {
    reportRecordDeliveryIssue(options, {
      requestId,
      stage: 'storage',
      reason: recordDeliveryReason(error)
    })
    return { complete: false, nextSequence: fromSequence, interrupted: true }
  }
  let nextSequence = fromSequence
  for (;;) {
    let batch: readonly ExecutionRecord[]
    try {
      batch = await options.outbox.read(requestId, nextSequence, 32)
    } catch (error) {
      reportRecordDeliveryIssue(options, {
        requestId,
        stage: 'storage',
        reason: recordDeliveryReason(error),
        fromSequence: nextSequence
      })
      return { complete: false, nextSequence, interrupted: true }
    }
    const last = batch[batch.length - 1]
    if (!last) {
      return { complete: false, nextSequence, interrupted: false }
    }
    if (
      batch.some(
        (item, index) =>
          item.requestId !== requestId || item.sequence !== nextSequence + index
      )
    ) {
      reportRecordDeliveryIssue(options, {
        requestId,
        stage: 'storage',
        reason: 'Noncontiguous outbox sequence',
        fromSequence: nextSequence
      })
      return { complete: false, nextSequence, interrupted: true }
    }
    let receipt: ExecutionRecordAcknowledgement | undefined
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        receipt = await options.send(batch)
        break
      } catch (error) {
        if (attempt === 1) {
          reportRecordDeliveryIssue(options, {
            requestId,
            stage: 'transport',
            reason: recordDeliveryReason(error),
            fromSequence: nextSequence,
            throughSequence: last.sequence
          })
        }
      }
    }
    if (!receipt) {
      return { complete: false, nextSequence, interrupted: true }
    }
    if (
      receipt.requestId !== requestId ||
      receipt.acknowledgedSequence !== last.sequence ||
      typeof receipt.complete !== 'boolean' ||
      (last.event === 'ai_request_usage' && !receipt.complete)
    ) {
      reportRecordDeliveryIssue(options, {
        requestId,
        stage: 'acknowledgement',
        reason:
          'Receipt does not match the sent request, sequence or terminal marker',
        fromSequence: nextSequence,
        throughSequence: last.sequence
      })
      return { complete: false, nextSequence, interrupted: true }
    }
    nextSequence = last.sequence + 1
    if (last.event === 'ai_request_usage') {
      try {
        await options.outbox.remove(requestId)
        return { complete: true, nextSequence, interrupted: false }
      } catch (error) {
        reportRecordDeliveryIssue(options, {
          requestId,
          stage: 'storage',
          reason: recordDeliveryReason(error),
          throughSequence: last.sequence
        })
        return {
          complete: false,
          nextSequence: fromSequence,
          interrupted: true
        }
      }
    }
  }
}
