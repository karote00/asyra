import { recordStorageBatchBytes } from '@asyra/ai-agent-runtime'
import type {
  ExecutionRecordGap,
  ExecutionRecordOutbox
} from '@asyra/ai-agent-runtime'

const databaseName = 'execution-record-outbox'
const recordsStore = 'records'
const requestIndex = 'request-id'

const controlSequence = -1
const controlReserveBytes = 512
type StoredGap = Omit<ExecutionRecordGap, 'requestId'>
interface RecordControl {
  requestId: string
  sequence: typeof controlSequence
  control: 'recording-gap'
  gap: StoredGap | null
  padding: string
}
const validGap = (gap: StoredGap): boolean =>
  !!gap &&
  Number.isSafeInteger(gap.fromSequence) &&
  gap.fromSequence >= 0 &&
  Number.isSafeInteger(gap.throughSequence) &&
  gap.throughSequence >= gap.fromSequence &&
  ['capture', 'storage', 'mixed'].includes(gap.stage)
const controlRecord = (
  requestId: string,
  gap: StoredGap | null
): RecordControl => ({
  requestId,
  sequence: controlSequence,
  control: 'recording-gap',
  gap,
  padding: ' '.repeat(controlReserveBytes - JSON.stringify(gap).length)
})
const readControl = (
  value: RecordControl | undefined,
  requestId: string
): RecordControl | undefined => {
  if (
    value &&
    (value.control !== 'recording-gap' ||
      value.requestId !== requestId ||
      value.sequence !== controlSequence ||
      typeof value.padding !== 'string' ||
      (value.gap !== null && !validGap(value.gap)))
  )
    throw new Error('Invalid recording control')
  return value
}

/** Diagnostics use their own database and never enter document persistence. */
export const createBrowserRecordOutbox = (
  options: {
    factory?: IDBFactory
    keyRange?: typeof IDBKeyRange
  } = {}
): ExecutionRecordOutbox & { close(): Promise<void> } => {
  let connection: Promise<IDBDatabase> | undefined
  let closed = false
  const open = (): Promise<IDBDatabase> => {
    if (closed) return Promise.reject(new Error('Recording outbox is closed'))
    connection ??= new Promise<IDBDatabase>((resolve, reject) => {
      const factory = options.factory ?? globalThis.indexedDB
      if (!factory) {
        reject(new Error('Recording storage is unavailable'))
        return
      }
      const request = factory.open(databaseName, 1)
      let rejected = false
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(recordsStore, {
          keyPath: ['requestId', 'sequence']
        })
        store.createIndex(requestIndex, 'requestId')
      }
      request.onerror = () => {
        rejected = true
        reject(request.error ?? new Error('Recording storage open failed'))
      }
      request.onblocked = () => {
        rejected = true
        reject(new Error('Recording storage upgrade is blocked'))
      }
      request.onsuccess = () => {
        const database = request.result
        if (closed || rejected) {
          database.close()
          reject(new Error('Recording outbox is closed'))
          return
        }
        database.onversionchange = () => {
          database.close()
          connection = undefined
        }
        resolve(database)
      }
    }).catch((error) => {
      connection = undefined
      throw error
    })
    return connection
  }
  const transact = async <T>(
    mode: IDBTransactionMode,
    work: (store: IDBObjectStore, set: (value: T) => void) => void
  ): Promise<T> => {
    const database = await open()
    return new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(recordsStore, mode, {
        durability: 'strict'
      })
      let result: T
      transaction.oncomplete = () => resolve(result)
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error('Recording storage transaction aborted')
        )
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error('Recording storage transaction failed')
        )
      try {
        work(transaction.objectStore(recordsStore), (value) => {
          result = value
        })
      } catch (error) {
        transaction.abort()
        reject(error)
      }
    })
  }
  const range = (requestId: string, fromSequence = 0) =>
    (options.keyRange ?? globalThis.IDBKeyRange).bound(
      [requestId, fromSequence],
      [requestId, Number.MAX_SAFE_INTEGER]
    )
  const control = <T>(
    requestId: string,
    mode: IDBTransactionMode,
    work: (
      value: RecordControl | undefined,
      store: IDBObjectStore,
      set: (value: T) => void
    ) => void
  ) =>
    transact<T>(mode, (store, set) => {
      const request = store.get([requestId, controlSequence])
      request.onsuccess = () => {
        try {
          work(readControl(request.result, requestId), store, set)
        } catch {
          store.transaction.abort()
        }
      }
    })
  return {
    reserve: (requestId) =>
      control<undefined>(requestId, 'readwrite', (value, store) => {
        if (!value) store.add(controlRecord(requestId, null))
      }),
    recordGap: ({ requestId, ...gap }) =>
      control<undefined>(requestId, 'readwrite', (value, store) => {
        if (!value || !validGap(gap))
          throw new Error('Missing reservation or invalid gap')
        const previous = value.gap
        const merged: StoredGap = previous
          ? {
              fromSequence: Math.min(previous.fromSequence, gap.fromSequence),
              throughSequence: Math.max(
                previous.throughSequence,
                gap.throughSequence
              ),
              stage: previous.stage === gap.stage ? gap.stage : 'mixed'
            }
          : gap
        store.put(controlRecord(requestId, merged))
      }),
    gap: (requestId) =>
      control(requestId, 'readonly', (value, _store, set) => {
        set(value?.gap ? { requestId, ...value.gap } : undefined)
      }),
    append: (records) => {
      const first = records[0]
      if (
        !first ||
        (records.length > 1 &&
          new TextEncoder().encode(JSON.stringify(records)).byteLength >
            recordStorageBatchBytes) ||
        records.some(
          (record, index) =>
            !Number.isSafeInteger(record.sequence) ||
            record.sequence < 0 ||
            record.requestId !== first.requestId ||
            record.sequence !== first.sequence + index
        )
      )
        return Promise.reject(
          new Error('Invalid payload batch sequence or ownership')
        )
      return transact<undefined>('readwrite', (store) => {
        for (const record of records) store.add(record)
      })
    },
    read: (requestId, fromSequence, limit) => {
      if (
        !Number.isSafeInteger(fromSequence) ||
        fromSequence < 0 ||
        !Number.isSafeInteger(limit) ||
        limit < 1
      )
        return Promise.reject(new Error('Invalid payload sequence or limit'))
      return transact('readonly', (store, set) => {
        const request = store.getAll(range(requestId, fromSequence), limit)
        request.onsuccess = () => set(request.result)
      })
    },
    requests: () =>
      transact('readonly', (store, set) => {
        const ids: string[] = []
        const request = store
          .index(requestIndex)
          .openKeyCursor(null, 'nextunique')
        request.onsuccess = () => {
          const cursor = request.result
          if (!cursor) {
            set(ids)
            return
          }
          ids.push(String(cursor.key))
          cursor.continue()
        }
      }),
    remove: (requestId) =>
      transact<undefined>('readwrite', (store) => {
        store.delete(range(requestId))
        store.delete([requestId, controlSequence])
      }),
    async close() {
      closed = true
      const database = await connection?.catch(() => undefined)
      database?.close()
      connection = undefined
    }
  }
}
