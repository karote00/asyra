import type {
  AiJsonValue,
  AiToolStore,
  AiToolStoreEntry
} from '@asyra/ai-agent-runtime'
import { randomUUID } from 'node:crypto'
import { mkdir, open } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { isDeepStrictEqual } from 'node:util'

export const DEFAULT_TOOL_LIBRARY_DIRECTORY = '.app-data/ai-tool-library'

interface LocalToolStoreOptions {
  readonly directory: string
  readonly capacity: number
  readonly recordBytes: number
  readonly totalBytes: number
}
interface LocalToolStore extends AiToolStore {
  close(): void
}
const positive = (value: number) => Number.isSafeInteger(value) && value > 0
const keyValid = (value: string) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  Buffer.byteLength(value) <= 1024

/** Host-owned IO only. Recipe admission, eligibility and product execution stay in Runtime. */
export const createLocalToolStore = async (
  options: LocalToolStoreOptions
): Promise<LocalToolStore> => {
  if (
    ![options.capacity, options.recordBytes, options.totalBytes].every(
      positive
    ) ||
    options.recordBytes > options.totalBytes
  ) {
    throw new TypeError('Tool store requires finite capacity and byte budgets')
  }
  const directory = resolve(options.directory)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const path = resolve(directory, 'library.sqlite')
  const file = await open(path, 'a', 0o600)
  await file.close()
  // Fail promptly on contention. The save-only owner can retry without replaying a tool.
  const database = new DatabaseSync(path, {
    timeout: 0,
    allowExtension: false,
    enableDoubleQuotedStringLiterals: false
  })
  let closed = false
  const transaction = <T>(work: () => T): T => {
    if (closed) {
      throw new Error('Tool store is closed')
    }
    database.exec('BEGIN IMMEDIATE')
    try {
      const result = work()
      database.exec('COMMIT')
      return result
    } catch (error) {
      try {
        database.exec('ROLLBACK')
      } catch {
        /* Preserve the original failure. */
      }
      throw error
    }
  }
  try {
    database.exec(
      'PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; PRAGMA trusted_schema=OFF'
    )
    transaction(() => {
      const format = database.prepare('PRAGMA user_version').get()?.user_version
      if (format === 0) {
        if (
          database
            .prepare("SELECT name FROM sqlite_schema WHERE type='table'")
            .all().length
        ) {
          throw new Error('Unknown tool store version')
        }
        database.exec(`CREATE TABLE tool_library (
          key TEXT PRIMARY KEY,
          version TEXT NOT NULL,
          record TEXT NOT NULL,
          bytes INTEGER NOT NULL CHECK(bytes >= 0)
        ) STRICT; PRAGMA user_version=1`)
      } else if (format !== 1) {
        throw new Error('Unknown tool store version')
      }
      database
        .prepare('SELECT key,version,record,bytes FROM tool_library LIMIT 0')
        .all()
    })
  } catch (error) {
    database.close()
    throw error
  }
  const active = () => {
    if (closed) {
      throw new Error('Tool store is closed')
    }
  }
  const decode = (row: Record<string, unknown>): AiToolStoreEntry => {
    if (
      typeof row.key !== 'string' ||
      !keyValid(row.key) ||
      typeof row.version !== 'string' ||
      !row.version.trim() ||
      typeof row.record !== 'string' ||
      Buffer.byteLength(row.record) !== row.bytes ||
      Number(row.bytes) > options.recordBytes
    ) {
      throw new Error('Invalid tool store record')
    }
    return {
      key: row.key,
      version: row.version,
      record: JSON.parse(row.record) as AiJsonValue
    }
  }
  const readRow = database.prepare(
    'SELECT key,version,record,bytes FROM tool_library WHERE key=?'
  )
  const inventory = database.prepare(
    'SELECT key,version,record,bytes FROM tool_library ORDER BY key LIMIT ?'
  )
  const usage = database.prepare(
    'SELECT COUNT(*) AS count, COALESCE(SUM(bytes),0) AS bytes FROM tool_library'
  )
  const write = database.prepare(
    'INSERT INTO tool_library (key,version,record,bytes) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET version=excluded.version,record=excluded.record,bytes=excluded.bytes'
  )
  return {
    async read(key) {
      active()
      if (!keyValid(key)) {
        throw new TypeError('Invalid tool store key')
      }
      const row = readRow.get(key)
      return row ? decode(row) : undefined
    },
    async list(limit) {
      active()
      if (!positive(limit)) {
        throw new TypeError('Invalid tool store inventory limit')
      }
      const total = usage.get()
      if (
        Number(total?.count) > options.capacity ||
        Number(total?.bytes) > options.totalBytes
      ) {
        throw new Error('Tool store inventory exceeds its capacity')
      }
      return inventory.all(Math.min(limit, options.capacity + 1)).map(decode)
    },
    async write(input) {
      active()
      if (!keyValid(input.key)) {
        throw new TypeError('Invalid tool store key')
      }
      const serialized = JSON.stringify(input.record)
      if (typeof serialized !== 'string') {
        throw new TypeError('Tool store accepts JSON records only')
      }
      const bytes = Buffer.byteLength(serialized)
      if (bytes > options.recordBytes) {
        throw new Error('Tool store record exceeds its byte budget')
      }
      const record: AiJsonValue = JSON.parse(serialized)
      if (!isDeepStrictEqual(input.record, record)) {
        throw new TypeError('Tool store accepts JSON records only')
      }
      return transaction(() => {
        const prior = readRow.get(input.key)
        if (
          (prior ? decode(prior).version : undefined) !== input.expectedVersion
        ) {
          throw new Error('Tool store version conflict')
        }
        const total = usage.get()
        if (!prior && Number(total?.count) >= options.capacity) {
          throw new Error('Tool store capacity reached')
        }
        if (
          Number(total?.bytes) - Number(prior?.bytes ?? 0) + bytes >
          options.totalBytes
        ) {
          throw new Error('Tool store total bytes budget reached')
        }
        const version = randomUUID()
        write.run(input.key, version, serialized, bytes)
        return { key: input.key, version, record }
      })
    },
    close() {
      if (!closed) {
        database.close()
        closed = true
      }
    }
  }
}

/** Lazy connection with retryable open failure; storage errors remain visible to Runtime. */
export const createLocalToolStoreSession = (
  connect: () => Promise<LocalToolStore>
): AiToolStore & { close(): Promise<void> } => {
  let connection: Promise<LocalToolStore> | undefined
  let closed = false
  const openConnection = () => {
    if (closed) {
      return Promise.reject(new Error('Tool store session is closed'))
    }
    if (!connection) {
      const pending = Promise.resolve().then(connect)
      connection = pending
      void pending.catch(() => {
        if (connection === pending) {
          connection = undefined
        }
      })
    }
    return connection
  }
  return {
    read: async (key) => (await openConnection()).read(key),
    list: async (limit) => (await openConnection()).list(limit),
    write: async (input) => (await openConnection()).write(input),
    async close() {
      closed = true
      // An unsuccessful open owns no database. Preserve the original storage
      // receipt rather than inventing a second close failure for that open.
      const store = await connection?.catch(() => undefined)
      store?.close()
    }
  }
}
