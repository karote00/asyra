import { createReadStream } from 'node:fs'
import { open } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { createRecordCollector } from './record-collector.js'
import { createExecutionRecordSink } from './record-sink.js'

/** Restores only locally persisted record streams, never a product invocation. */
export const createFileRecordCollector = (options: {
  directory: string
  maxRequests?: number
  maxRecords?: number
  retentionMs?: number
}) =>
  createRecordCollector({
    maxRequests: options.maxRequests,
    maxRecords: options.maxRecords,
    retentionMs: options.retentionMs,
    createSink: () => createExecutionRecordSink(options.directory),
    restore: async (requestId) => {
      const path = join(options.directory, `${requestId}.jsonl`)
      let file
      try {
        file = await open(path, 'r')
        const { size } = await file.stat()
        const lastByte = Buffer.alloc(1)
        if (size) await file.read(lastByte, 0, 1, size - 1)
        if (!size || lastByte[0] !== 10)
          throw new Error('Unterminated persisted record stream')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
        throw error
      } finally {
        await file?.close()
      }
      const input = createReadStream(path)
      const lines = createInterface({ input, crlfDelay: Infinity })
      const hashes: string[] = []
      let terminal = false
      try {
        for await (const line of lines) {
          if (
            Buffer.byteLength(line) > 256 * 1024 ||
            hashes.length >= (options.maxRecords ?? 50_000)
          )
            throw new Error('Persisted record capacity exceeded')
          const record = JSON.parse(line)
          if (
            terminal ||
            record.requestId !== requestId ||
            record.schemaVersion !== 2 ||
            record.sequence !== hashes.length ||
            typeof record.event !== 'string' ||
            (!hashes.length && record.event !== 'ai_request_started')
          )
            throw new Error('Invalid persisted record sequence')
          hashes.push(
            createHash('sha256').update(JSON.stringify(record)).digest('hex')
          )
          terminal = record.event === 'ai_request_usage'
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
        throw error
      } finally {
        lines.close()
        input.destroy()
      }
      if (!hashes.length) throw new Error('Empty persisted record stream')
      return {
        sink: createExecutionRecordSink(
          options.directory,
          undefined,
          requestId
        ),
        hashes,
        terminal
      }
    }
  })
