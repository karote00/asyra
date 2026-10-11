import type { ExecutionRecord, ExecutionRecordSink } from './records.js'

/** Bounded, independent diagnostics transport. Never uses the product abort signal. */
export const createRecordDeliverySink = (options: {
  send: (records: readonly ExecutionRecord[]) => Promise<{ complete: boolean }>
  maxPendingBytes?: number
}): ExecutionRecordSink => {
  const limit = options.maxPendingBytes ?? 2 * 1024 * 1024
  let bytes = 0
  let failed = false
  let closed = false
  let complete = false
  let pending = Promise.resolve()
  const queue: { record: ExecutionRecord; bytes: number }[] = []
  let scheduled = false
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    pending = pending.then(async () => {
      while (queue.length && !failed) {
        const batch = queue.splice(0, 32)
        try {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const receipt = await options.send(
                batch.map((entry) => entry.record)
              )
              complete = receipt.complete
              break
            } catch {
              if (attempt === 1) failed = true
            }
          }
        } finally {
          bytes -= batch.reduce((sum, entry) => sum + entry.bytes, 0)
        }
      }
      if (failed) {
        queue.length = 0
        bytes = 0
      }
      scheduled = false
    })
  }
  let settled: ReturnType<ExecutionRecordSink['flush']> | undefined
  return {
    write(record) {
      const serialized = JSON.stringify(record)
      const size = new TextEncoder().encode(serialized).byteLength
      if (closed || failed || bytes + size > limit) {
        failed = true
        throw new Error('Record delivery capacity exceeded or closed')
      }
      bytes += size
      // Snapshot before asynchronous transport; callers cannot mutate admitted evidence.
      const snapshot = JSON.parse(serialized) as ExecutionRecord
      queue.push({ record: snapshot, bytes: size })
      schedule()
    },
    flush() {
      closed = true
      settled ??= pending.then(() => ({
        status: failed || !complete ? 'failed' : 'saved',
        path: null
      }))
      return settled
    }
  }
}
