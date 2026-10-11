import type { ExecutionRecordOutbox } from '@asyra/ai-agent-runtime'

const databaseName = 'execution-record-outbox'
const recordsStore = 'records'
const requestIndex = 'request-id'

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
  return {
    append: (record) =>
      transact<undefined>('readwrite', (store) => {
        store.add(record)
      }),
    read: (requestId, fromSequence, limit) =>
      transact('readonly', (store, set) => {
        const request = store.getAll(range(requestId, fromSequence), limit)
        request.onsuccess = () => set(request.result)
      }),
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
      }),
    async close() {
      closed = true
      const database = await connection?.catch(() => undefined)
      database?.close()
      connection = undefined
    }
  }
}
