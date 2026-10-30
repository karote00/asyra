import { createReadStream } from 'node:fs'
import { open } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import {
  createRecordCollector,
  recordDigestWindowSize
} from './record-collector.js'
import { createExecutionRecordSink } from './record-sink.js'

/** Retain only one bounded line buffer; byte offsets include actual LF/CRLF bytes. */
async function* recordLines(path: string, start = 0) {
  const input = createReadStream(path, { start })
  let remainder = Buffer.alloc(0)
  try {
    for await (const chunk of input) {
      remainder = Buffer.concat([remainder, chunk])
      let end: number
      while ((end = remainder.indexOf(10)) !== -1) {
        if (end > 256 * 1024) {
          throw new Error('Persisted record capacity exceeded')
        }
        yield {
          text: remainder.subarray(0, end).toString('utf8'),
          bytes: end + 1
        }
        remainder = remainder.subarray(end + 1)
      }
      if (remainder.length > 256 * 1024) {
        throw new Error('Persisted record capacity exceeded')
      }
    }
    if (remainder.length) {
      throw new Error('Unterminated persisted record stream')
    }
  } finally {
    input.destroy()
  }
}
const recordHash = (record: unknown) =>
  createHash('sha256').update(JSON.stringify(record)).digest('hex')

/** Restores only locally persisted record streams, never a product invocation. */
export const createFileRecordCollector = (options: {
  directory: string
  maxRequests?: number
  maxRecords?: number
  retentionMs?: number
}) => {
  // Bounded cursors accelerate sequential retry prefixes without indexing whole files.
  const cursors = new Map<string, { sequence: number; offset: number }>()
  const collector = createRecordCollector({
    maxRequests: options.maxRequests,
    maxRecords: options.maxRecords,
    retentionMs: options.retentionMs,
    createSink: () => createExecutionRecordSink(options.directory),
    readPersistedHashes: async (requestId, from, count) => {
      const cached = cursors.get(requestId)
      let { sequence, offset } =
        cached && cached.sequence <= from ? cached : { sequence: 0, offset: 0 }
      const hashes: string[] = []
      for await (const line of recordLines(
        join(options.directory, `${requestId}.jsonl`),
        offset
      )) {
        const record = JSON.parse(line.text)
        if (
          record.requestId !== requestId ||
          record.sequence !== sequence ||
          record.schemaVersion !== 2
        ) {
          throw new Error('Invalid persisted retry sequence')
        }
        offset += line.bytes
        if (sequence++ >= from) {
          hashes.push(recordHash(record))
        }
        if (hashes.length === count) {
          break
        }
      }
      cursors.delete(requestId)
      cursors.set(requestId, { sequence, offset })
      if (cursors.size > (options.maxRequests ?? 32)) {
        const oldest = cursors.keys().next().value
        if (oldest !== undefined) {
          cursors.delete(oldest)
        }
      }
      return hashes
    },
    restore: async (requestId) => {
      const path = join(options.directory, `${requestId}.jsonl`)
      let file
      try {
        file = await open(path, 'r')
        const { size } = await file.stat()
        const lastByte = Buffer.alloc(1)
        if (size) {
          await file.read(lastByte, 0, 1, size - 1)
        }
        if (!size || lastByte[0] !== 10) {
          throw new Error('Unterminated persisted record stream')
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return undefined
        }
        throw error
      } finally {
        await file?.close()
      }
      const hashes: string[] = []
      let nextSequence = 0
      let terminal = false
      for await (const line of recordLines(path)) {
        if (
          options.maxRecords !== undefined &&
          nextSequence >= options.maxRecords
        ) {
          throw new Error('Persisted record capacity exceeded')
        }
        const record = JSON.parse(line.text)
        if (
          terminal ||
          record.requestId !== requestId ||
          record.schemaVersion !== 2 ||
          record.sequence !== nextSequence ||
          typeof record.event !== 'string' ||
          (!nextSequence && record.event !== 'ai_request_started')
        ) {
          throw new Error('Invalid persisted record sequence')
        }
        hashes.push(recordHash(record))
        if (hashes.length > recordDigestWindowSize) {
          hashes.shift()
        }
        nextSequence++
        terminal = record.event === 'ai_request_usage'
      }
      if (!nextSequence) {
        throw new Error('Empty persisted record stream')
      }
      return {
        sink: createExecutionRecordSink(
          options.directory,
          undefined,
          requestId
        ),
        nextSequence,
        hashes,
        terminal
      }
    }
  })
  return {
    accept: collector.accept,
    async dispose() {
      await collector.dispose()
      cursors.clear()
    }
  }
}
