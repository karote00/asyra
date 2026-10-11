import { createHash } from 'node:crypto'
import type {
  ExecutionRecord,
  ExecutionRecordSink
} from '../profiler/records.js'

/** One sequential producer per recording ID; provider children use distinct IDs. */
export const createRecordCollector = (options: {
  createSink: () => ExecutionRecordSink
  maxRequests?: number
  maxRecords?: number
  retentionMs?: number
  now?: () => number
}) => {
  const requests = new Map<
    string,
    {
      sink: ExecutionRecordSink
      hashes: string[]
      terminal: boolean
      saved: boolean
      touched: number
    }
  >()
  const now = options.now ?? Date.now
  let disposed = false
  // Serialize admission and final disk flush so concurrent retries see one acknowledgement.
  let pending: Promise<unknown> = Promise.resolve()
  const expire = async () => {
    for (const [key, request] of requests) {
      if (now() - request.touched > (options.retentionMs ?? 30 * 60_000)) {
        await request.sink.flush()
        requests.delete(key)
      }
    }
  }
  const timer = setInterval(
    () => {
      pending = pending.then(expire).catch(() => undefined)
    },
    Math.min(options.retentionMs ?? 30 * 60_000, 60_000)
  )
  timer.unref()
  const accept = async (input: unknown) => {
    if (disposed || !Array.isArray(input) || !input.length || input.length > 64)
      throw new Error('Invalid record batch')
    const records = input as ExecutionRecord[]
    const id = records[0]?.requestId
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(id))
      throw new Error('Invalid record identity')
    await expire()
    let state = requests.get(id)
    if (!state) {
      if (requests.size >= (options.maxRequests ?? 32))
        throw new Error('Record capacity exceeded')
      if (
        records[0].sequence !== 0 ||
        records[0].event !== 'ai_request_started'
      )
        throw new Error('Missing initial sequence')
      state = {
        sink: options.createSink(),
        hashes: [],
        terminal: false,
        saved: false,
        touched: now()
      }
      requests.set(id, state)
    }
    // Validate the whole chunk before writing its first new event.
    let next = state.hashes.length
    let terminal = state.terminal
    const prepared = records.map((record) => {
      if (
        !record ||
        record.requestId !== id ||
        record.schemaVersion !== 2 ||
        !Number.isSafeInteger(record.sequence) ||
        record.sequence < 0 ||
        typeof record.event !== 'string'
      )
        throw new Error('Invalid record sequence')
      const text = JSON.stringify(record)
      if (Buffer.byteLength(text) > 256 * 1024)
        throw new Error('Record capacity exceeded')
      const hash = createHash('sha256').update(text).digest('hex')
      if (record.sequence < state.hashes.length) {
        if (state.hashes[record.sequence] !== hash)
          throw new Error('Conflicting record retry')
        return { record, hash, duplicate: true }
      }
      if (terminal) throw new Error('Record after terminal marker')
      if (record.sequence !== next++)
        throw new Error('Missing or repeated sequence')
      if (next > (options.maxRecords ?? 50_000))
        throw new Error('Record capacity exceeded')
      terminal = record.event === 'ai_request_usage'
      return { record, hash, duplicate: false }
    })
    for (const item of prepared) {
      if (item.duplicate) continue
      state.sink.write(item.record)
      state.hashes.push(item.hash)
    }
    state.terminal = terminal
    state.touched = now()
    if (terminal && !state.saved) {
      state.saved = (await state.sink.flush()).status === 'saved'
      if (!state.saved) throw new Error('Record storage failed')
    }
    return { complete: state.terminal && state.saved }
  }
  return {
    accept(input: unknown): Promise<{ complete: boolean }> {
      const result = pending.then(() => accept(input))
      pending = result.catch(() => undefined)
      return result
    },
    async dispose() {
      disposed = true
      clearInterval(timer)
      await pending
      await Promise.allSettled(
        [...requests.values()].map((request) => request.sink.flush())
      )
      requests.clear()
    }
  }
}
