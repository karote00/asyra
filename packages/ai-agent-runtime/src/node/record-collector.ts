import { createHash } from 'node:crypto'
import type {
  ExecutionRecord,
  ExecutionRecordSink
} from '../profiler/records.js'
import type { ExecutionRecordAcknowledgement } from '../profiler/record-outbox.js'

export const recordDigestWindowSize = 2048

/** Public diagnostic code; arbitrary storage errors are not exposed to HTTP clients. */
export class ExecutionRecordCollectionError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'ExecutionRecordCollectionError'
  }
}

/** One sequential producer per recording ID; provider children use distinct IDs. */
export const createRecordCollector = (options: {
  createSink: () => ExecutionRecordSink
  restore?: (requestId: string) => Promise<
    | {
        sink: ExecutionRecordSink
        nextSequence: number
        hashes: string[]
        terminal: boolean
      }
    | undefined
  >
  readPersistedHashes?: (
    requestId: string,
    fromSequence: number,
    count: number
  ) => Promise<readonly string[]>
  maxRequests?: number
  maxRecords?: number
  retentionMs?: number
  now?: () => number
}) => {
  const requests = new Map<
    string,
    {
      sink: ExecutionRecordSink
      nextSequence: number
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
    if (
      disposed ||
      !Array.isArray(input) ||
      !input.length ||
      input.length > 64
    ) {
      throw new ExecutionRecordCollectionError(
        'AI_RECORD_INVALID_BATCH',
        'Invalid record batch'
      )
    }
    const records = input as ExecutionRecord[]
    const id = records[0]?.requestId
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(id)) {
      throw new ExecutionRecordCollectionError(
        'AI_RECORD_INVALID_IDENTITY',
        'Invalid record identity'
      )
    }
    await expire()
    let state = requests.get(id)
    if (!state) {
      if (requests.size >= (options.maxRequests ?? 32)) {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_CAPACITY_EXCEEDED',
          'Record capacity exceeded'
        )
      }
      const restored = await options.restore?.(id)
      if (
        !restored &&
        (records[0].sequence !== 0 || records[0].event !== 'ai_request_started')
      ) {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_MISSING_SEQUENCE',
          'Missing initial sequence'
        )
      }
      state = {
        sink: restored?.sink ?? options.createSink(),
        nextSequence: restored?.nextSequence ?? 0,
        hashes: restored?.hashes ?? [],
        terminal: restored?.terminal ?? false,
        saved: false,
        touched: now()
      }
      requests.set(id, state)
    }
    // Validate the whole chunk before writing its first new event.
    const recentFrom = state.nextSequence - state.hashes.length
    const oldHashes = new Map<number, string>()
    const older = records.filter(
      (record) =>
        record &&
        Number.isSafeInteger(record.sequence) &&
        record.sequence >= 0 &&
        record.sequence < recentFrom
    )
    if (older.length && options.readPersistedHashes) {
      const sequences = [
        ...new Set(older.map((record) => record.sequence))
      ].sort((a, b) => a - b)
      while (sequences.length) {
        const from = sequences.shift()
        if (from === undefined) {
          break
        }
        let count = 1
        while (sequences[0] === from + count) {
          sequences.shift()
          count++
        }
        const hashes = await options.readPersistedHashes(id, from, count)
        if (hashes.length !== count) {
          throw new ExecutionRecordCollectionError(
            'AI_RECORD_STORAGE_FAILED',
            'Persisted retry evidence unavailable'
          )
        }
        hashes.forEach((hash, index) => oldHashes.set(from + index, hash))
      }
    }
    let next = state.nextSequence
    let terminal = state.terminal
    const prepared = records.map((record) => {
      if (
        !record ||
        record.requestId !== id ||
        record.schemaVersion !== 2 ||
        !Number.isSafeInteger(record.sequence) ||
        record.sequence < 0 ||
        typeof record.event !== 'string'
      ) {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_INVALID_SEQUENCE',
          'Invalid record sequence'
        )
      }
      const text = JSON.stringify(record)
      if (Buffer.byteLength(text) > 256 * 1024) {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_CAPACITY_EXCEEDED',
          'Record capacity exceeded'
        )
      }
      const hash = createHash('sha256').update(text).digest('hex')
      if (record.sequence < state.nextSequence) {
        if (
          (record.sequence < recentFrom
            ? oldHashes.get(record.sequence)
            : state.hashes[record.sequence - recentFrom]) !== hash
        ) {
          throw new ExecutionRecordCollectionError(
            'AI_RECORD_CONFLICTING_RETRY',
            'Conflicting record retry'
          )
        }
        return { record, hash, duplicate: true }
      }
      if (terminal) {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_AFTER_TERMINAL',
          'Record after terminal marker'
        )
      }
      if (record.sequence !== next++) {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_MISSING_SEQUENCE',
          'Missing or repeated sequence'
        )
      }
      if (
        next >
        (options.maxRecords ??
          (options.readPersistedHashes ? Number.MAX_SAFE_INTEGER : 50_000))
      ) {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_CAPACITY_EXCEEDED',
          'Record capacity exceeded'
        )
      }
      terminal = record.event === 'ai_request_usage'
      return { record, hash, duplicate: false }
    })
    for (const item of prepared) {
      if (item.duplicate) {
        continue
      }
      state.sink.write(item.record)
      state.hashes.push(item.hash)
      state.nextSequence++
      if (
        options.readPersistedHashes &&
        state.hashes.length > recordDigestWindowSize
      ) {
        state.hashes.shift()
      }
    }
    state.terminal = terminal
    state.touched = now()
    if (terminal && !state.saved) {
      state.saved = (await state.sink.flush()).status === 'saved'
      if (!state.saved) {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_STORAGE_FAILED',
          'Record storage failed'
        )
      }
    } else if (!terminal) {
      if ((await state.sink.checkpoint?.())?.status !== 'saved') {
        throw new ExecutionRecordCollectionError(
          'AI_RECORD_CHECKPOINT_FAILED',
          'Record durable checkpoint failed'
        )
      }
    }
    return {
      requestId: id,
      acknowledgedSequence: records[records.length - 1].sequence,
      complete: state.terminal && state.saved
    }
  }
  return {
    accept(input: unknown): Promise<ExecutionRecordAcknowledgement> {
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
