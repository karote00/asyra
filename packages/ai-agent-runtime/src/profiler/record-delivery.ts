import type { ExecutionRecord, ExecutionRecordSink } from './records.js'
import {
  deliverRecordOutbox,
  recordDeliveryReason,
  reportRecordDeliveryIssue,
  type ExecutionRecordGap,
  type ExecutionRecordDeliveryOptions
} from './record-outbox.js'

/** Bounded capture persists independently from delivery and the product signal. */
export const createRecordDeliverySink = (
  options: ExecutionRecordDeliveryOptions & { maxPendingBytes?: number }
): ExecutionRecordSink & {
  readonly requestId: string | undefined
  resume(): Promise<boolean>
} => {
  const limit = options.maxPendingBytes ?? 2 * 1024 * 1024
  let bytes = 0
  let captureFailed = false
  let closed = false
  let terminal = false
  let complete = false
  let suspended = false
  let requestId: string | undefined
  let nextSequence = 0
  let storage = Promise.resolve()
  let delivery = Promise.resolve()
  let scheduled = false
  let reservation: Promise<void> | undefined
  const reserve = (id: string) => (reservation ??= options.outbox.reserve(id))
  let lost: ExecutionRecordGap | undefined
  let savingGap = false
  const drainStorage = async () => {
    for (;;) {
      const current = storage
      await current
      if (current === storage) return
    }
  }
  const retainGap = (record: ExecutionRecord, stage: 'capture' | 'storage') => {
    if (requestId && record.requestId !== requestId) return
    requestId ??= record.requestId
    lost = {
      requestId,
      fromSequence: Math.min(
        lost?.fromSequence ?? record.sequence,
        record.sequence
      ),
      throughSequence: Math.max(
        lost?.throughSequence ?? record.sequence,
        record.sequence
      ),
      stage: lost && lost.stage !== stage ? 'mixed' : stage
    }
    if (savingGap) return
    savingGap = true
    storage = storage.then(async () => {
      try {
        for (;;) {
          const gap = lost
          if (!gap) return
          await reserve(gap.requestId)
          await options.outbox.recordGap(gap)
          if (gap === lost) return
        }
      } catch (error) {
        reportRecordDeliveryIssue(options, {
          requestId,
          stage: 'storage',
          reason: `Gap metadata could not be persisted: ${recordDeliveryReason(error)}`,
          fromSequence: lost?.fromSequence,
          throughSequence: lost?.throughSequence
        })
      } finally {
        savingGap = false
      }
    })
  }
  const schedule = () => {
    if (scheduled || suspended || complete) return
    scheduled = true
    delivery = delivery.then(async () => {
      try {
        await drainStorage()
        if (!requestId || captureFailed) return
        const receipt = await deliverRecordOutbox(
          options,
          requestId,
          nextSequence
        )
        nextSequence = receipt.nextSequence
        complete = receipt.complete
        suspended = receipt.interrupted
      } finally {
        scheduled = false
      }
    })
  }
  const resume = async () => {
    await drainStorage()
    await delivery
    if (!complete && !captureFailed && requestId) {
      suspended = false
      schedule()
      await delivery
    }
    return !captureFailed && complete
  }
  return {
    get requestId() {
      return requestId
    },
    resume,
    write(record: ExecutionRecord) {
      const serialized = JSON.stringify(record)
      const size = new TextEncoder().encode(serialized).byteLength
      if (
        closed ||
        terminal ||
        bytes + size > limit ||
        (requestId && requestId !== record.requestId)
      ) {
        captureFailed = true
        retainGap(record, 'capture')
        reportRecordDeliveryIssue(options, {
          requestId,
          stage: 'capture',
          reason: 'Pending persistence capacity exceeded or producer closed',
          fromSequence: record.sequence
        })
        throw new Error('Record delivery capacity exceeded or closed')
      }
      requestId = record.requestId
      terminal = record.event === 'ai_request_usage'
      bytes += size
      const snapshot = JSON.parse(serialized) as ExecutionRecord
      storage = storage.then(async () => {
        try {
          await reserve(snapshot.requestId)
          await options.outbox.append(snapshot)
        } catch (error) {
          captureFailed = true
          retainGap(snapshot, 'storage')
          reportRecordDeliveryIssue(options, {
            requestId,
            stage: 'storage',
            reason: recordDeliveryReason(error),
            fromSequence: snapshot.sequence
          })
        } finally {
          bytes -= size
        }
      })
      void storage.then(schedule)
    },
    async flush() {
      closed = true
      await resume()
      return {
        status: !captureFailed && complete ? 'saved' : 'failed',
        path: null
      }
    }
  }
}

/** Explicit host startup/reconnect recovery; this function cannot execute tools. */
export const recoverRecordDelivery = async (
  options: ExecutionRecordDeliveryOptions,
  excludedRequests: ReadonlySet<string> = new Set()
) => {
  let requests: readonly string[]
  try {
    requests = await options.outbox.requests()
  } catch (error) {
    reportRecordDeliveryIssue(options, {
      stage: 'storage',
      reason: recordDeliveryReason(error)
    })
    return { complete: false }
  }
  let complete = true
  for (const requestId of requests) {
    if (excludedRequests.has(requestId)) continue
    const receipt = await deliverRecordOutbox(options, requestId)
    complete &&= receipt.complete
  }
  return { complete }
}

/** Owns producer recovery and drain order; hosts close storage after disposal. */
export const createRecordDeliveryHost = (
  options: ExecutionRecordDeliveryOptions
) => {
  const sinks = new Set<ReturnType<typeof createRecordDeliverySink>>()
  const activeRequests = new Set<string>()
  let closed = false
  let recovering = Promise.resolve()
  let disposal: Promise<void> | undefined
  const recover = () => {
    if (closed) return recovering
    recovering = recovering.then(async () => {
      const active = [...sinks]
      for (const sink of active) await sink.resume()
      await recoverRecordDelivery(options, activeRequests)
    })
    return recovering
  }
  return {
    createSink(): ExecutionRecordSink {
      if (closed) throw new Error('Record delivery host is closed')
      const sink = createRecordDeliverySink(options)
      sinks.add(sink)
      return {
        write: (record) => {
          sink.write(record)
          activeRequests.add(record.requestId)
        },
        flush: async () => {
          try {
            return await sink.flush()
          } finally {
            sinks.delete(sink)
            if (sink.requestId) activeRequests.delete(sink.requestId)
          }
        }
      }
    },
    recover,
    dispose() {
      if (!disposal) {
        closed = true
        disposal = (async () => {
          await recovering
          await Promise.all([...sinks].map((sink) => sink.flush()))
          sinks.clear()
          activeRequests.clear()
        })()
      }
      return disposal
    }
  }
}
