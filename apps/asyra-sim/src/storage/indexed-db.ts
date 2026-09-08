import { validateJournalEntry, type JournalEntry } from './publication-journal'
import {
  decodeProject,
  PROJECT_BYTE_LIMIT,
  validateSummary,
  type ProjectRepository,
  type ProjectSummary,
  type StoredProject
} from './project-format'

const DATABASE = 'sim-local-v1'
const PROJECTS = 'projects',
  DOCUMENTS = 'documents',
  JOURNAL = 'publications'
const abortError = () =>
  new DOMException('Local storage operation cancelled', 'AbortError')

/** Resolve only at transaction completion, never at individual request success. */
export function transactionCompletion(
  transaction: IDBTransaction,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      transaction.removeEventListener('complete', complete)
      transaction.removeEventListener('abort', aborted)
      signal?.removeEventListener('abort', cancel)
    }
    const complete = () => {
      cleanup()
      resolve()
    }
    const aborted = () => {
      cleanup()
      reject(transaction.error ?? abortError())
    }
    const cancel = () => {
      try {
        transaction.abort()
      } catch {
        /* A completed transaction cannot be aborted. */
      }
    }
    transaction.addEventListener('complete', complete)
    transaction.addEventListener('abort', aborted)
    signal?.addEventListener('abort', cancel, { once: true })
    if (signal?.aborted) cancel()
  })
}

export class IndexedProjectRepository implements ProjectRepository {
  private database: IDBDatabase | null = null
  private opening: Promise<IDBDatabase> | null = null
  private closed = false
  private transactions = new Set<IDBTransaction>()
  constructor(
    private readonly factory: IDBFactory | undefined = globalThis.indexedDB,
    private readonly name = DATABASE
  ) {}

  private open(): Promise<IDBDatabase> {
    if (this.closed)
      return Promise.reject(
        new Error('Local storage is closed; reload the App')
      )
    if (this.database) return Promise.resolve(this.database)
    if (this.opening) return this.opening
    const factory = this.factory
    if (!factory)
      return Promise.reject(
        new Error(
          'IndexedDB is unavailable; enable browser storage to save or open projects'
        )
      )
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(this.name, 2)
      let settled = false
      const timeout = setTimeout(
        () => fail(new Error('Local storage did not open within 5 seconds')),
        5000
      )
      const fail = (error: Error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        reject(error)
      }
      request.onblocked = () =>
        fail(
          new Error(
            'Local storage is blocked by another tab; close it and retry'
          )
        )
      request.onerror = () =>
        fail(request.error ?? new Error('Cannot open local storage'))
      request.onupgradeneeded = () => {
        if (settled || this.closed) {
          request.transaction?.abort()
          return
        }
        if (!request.result.objectStoreNames.contains(PROJECTS)) {
          const projects = request.result.createObjectStore(PROJECTS, {
            keyPath: 'id'
          })
          projects.createIndex('savedAt', 'savedAt')
          request.result.createObjectStore(DOCUMENTS)
        }
        if (!request.result.objectStoreNames.contains(JOURNAL))
          request.result
            .createObjectStore(JOURNAL)
            .createIndex('publicationKey', 'publicationKey', { unique: true })
      }
      request.onsuccess = () => {
        if (settled || this.closed) {
          request.result.close()
          fail(new Error('Local storage was closed during startup'))
          return
        }
        settled = true
        clearTimeout(timeout)
        const database = request.result
        database.onversionchange = () => this.close()
        database.onclose = () => this.close()
        this.database = database
        resolve(database)
      }
    })
    this.opening = opening
    void opening
      .finally(() => {
        if (this.opening === opening) this.opening = null
      })
      .catch(() => undefined)
    return opening
  }

  private async transact<T>(
    mode: IDBTransactionMode,
    run: (tx: IDBTransaction, result: (value: T) => void) => void,
    signal?: AbortSignal
  ): Promise<T> {
    signal?.throwIfAborted()
    const database = await this.open()
    signal?.throwIfAborted()
    if (this.closed) throw new Error('Local storage is closed')
    const transaction = database.transaction(
      [PROJECTS, DOCUMENTS, JOURNAL],
      mode
    )
    this.transactions.add(transaction)
    const completion = transactionCompletion(transaction, signal)
    let output: { value: T } | undefined, failure: unknown
    try {
      try {
        run(transaction, (result) => {
          output = { value: result }
        })
      } catch (error) {
        failure = error
        transaction.abort()
      }
      try {
        await completion
      } catch (error) {
        throw failure ?? error
      }
      if (!output)
        throw new Error('Storage transaction completed without a result')
      return output.value
    } finally {
      this.transactions.delete(transaction)
    }
  }

  async write(
    project: StoredProject,
    expectedRevision: string | null,
    signal?: AbortSignal
  ): Promise<void> {
    validateSummary(project)
    decodeProject(project.payload)
    const { payload, journal: _journal, ...metadata } = structuredClone(project)
    let conflict: Error | undefined
    try {
      await this.transact<undefined>(
        'readwrite',
        (tx, done) => {
          const store = tx.objectStore(PROJECTS),
            request = store.get(metadata.id)
          request.onsuccess = () => {
            const current = request.result as ProjectSummary | undefined
            if ((current?.revision ?? null) !== expectedRevision) {
              conflict = new Error(
                'This project changed in another tab; reopen it or save a new project'
              )
              tx.abort()
              return
            }
            store.put({
              ...metadata,
              journalLength: 0,
              checkpointRevision: metadata.revision,
              storedBytes: new TextEncoder().encode(payload).byteLength
            })
            const cursor = tx
              .objectStore(JOURNAL)
              .openCursor(
                IDBKeyRange.bound(
                  [metadata.id, 0],
                  [metadata.id, Number.MAX_SAFE_INTEGER]
                )
              )
            cursor.onsuccess = () => {
              if (cursor.result) {
                cursor.result.delete()
                cursor.result.continue()
              }
            }
            tx.objectStore(DOCUMENTS).put(payload, metadata.id)
            done(undefined)
          }
        },
        signal
      )
    } catch (error) {
      throw conflict ?? error
    }
  }

  async append(
    project: ProjectSummary,
    expectedRevision: string,
    entry: JournalEntry | null,
    signal?: AbortSignal
  ): Promise<void> {
    validateSummary(project)
    if (entry) validateJournalEntry(entry)
    const encoded = JSON.stringify(entry, (_key, value) => {
      if (typeof value === 'number' && !Number.isFinite(value))
        throw new Error('Nonfinite journal value')
      return value
    })
    const bytes = entry ? new TextEncoder().encode(encoded).byteLength : 0
    let failure: Error | undefined
    try {
      await this.transact<undefined>(
        'readwrite',
        (tx, done) => {
          const store = tx.objectStore(PROJECTS)
          const request = store.get(project.id)
          request.onsuccess = () => {
            const current = request.result as
              | (ProjectSummary & {
                  journalLength?: number
                  storedBytes?: number
                  checkpointRevision?: string
                })
              | undefined
            if (!current || current.revision !== expectedRevision) {
              failure = new Error(
                'This project changed in another tab; reopen it or save a new project'
              )
              tx.abort()
              return
            }
            const appendEntry = (checkpointBytes: number) => {
              const storedBytes =
                (current.storedBytes ?? checkpointBytes) + bytes
              if (storedBytes > PROJECT_BYTE_LIMIT) {
                failure = new Error(
                  'Project exceeds the 64 MiB limit; create a checkpoint copy'
                )
                tx.abort()
                return
              }
              const sequence = (current.journalLength ?? 0) + 1
              tx.objectStore(JOURNAL).add(
                {
                  entry,
                  previousRevision: current.revision,
                  revision: project.revision,
                  ...(entry
                    ? {
                        publicationKey: [
                          project.id,
                          entry.publication.publicationId
                        ]
                      }
                    : {})
                },
                [project.id, sequence]
              )
              store.put({
                ...project,
                journalLength: sequence,
                checkpointRevision:
                  current.checkpointRevision ?? current.revision,
                storedBytes
              })
              done(undefined)
            }
            if (current.storedBytes === undefined) {
              const checkpoint = tx.objectStore(DOCUMENTS).get(project.id)
              checkpoint.onsuccess = () =>
                appendEntry(
                  new TextEncoder().encode(checkpoint.result as string)
                    .byteLength
                )
            } else appendEntry(0)
          }
        },
        signal
      )
    } catch (error) {
      throw failure ?? error
    }
  }

  async read(id: string, signal?: AbortSignal): Promise<StoredProject> {
    const value = await this.transact<{
      metadata: unknown
      payload: unknown
      journal: {
        entry: JournalEntry | null
        previousRevision: string
        revision: string
      }[]
    }>(
      'readonly',
      (tx, done) => {
        let metadata: unknown, payload: unknown
        let journal: {
          entry: JournalEntry | null
          previousRevision: string
          revision: string
        }[] = []
        const meta = tx.objectStore(PROJECTS).get(id),
          doc = tx.objectStore(DOCUMENTS).get(id)
        const tail = tx
          .objectStore(JOURNAL)
          .getAll(IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER]))
        const finish = () => done({ metadata, payload, journal })
        tail.onsuccess = () => {
          journal = tail.result
          finish()
        }
        meta.onsuccess = () => {
          metadata = meta.result
          finish()
        }
        doc.onsuccess = () => {
          payload = doc.result
          finish()
        }
      },
      signal
    )
    if (value.metadata === undefined)
      throw new Error('Saved project was not found')
    validateSummary(value.metadata)
    if (typeof value.payload !== 'string')
      throw new Error('Saved project document is missing')
    decodeProject(value.payload)
    const metadata = value.metadata as ProjectSummary & {
      journalLength?: number
      checkpointRevision?: string
      storedBytes?: number
    }
    if ((metadata.journalLength ?? 0) !== value.journal.length)
      throw new Error('Incomplete local publication journal')
    let revision = metadata.checkpointRevision ?? metadata.revision
    for (const item of value.journal) {
      if (item.previousRevision !== revision)
        throw new Error('Broken local publication revision chain')
      if (item.entry && item.entry.version !== 1)
        throw new Error('Unsupported local journal entry')
      revision = item.revision
    }
    if (revision !== metadata.revision)
      throw new Error('Unacknowledged local publication tail')
    const {
      journalLength: _length,
      checkpointRevision: _checkpoint,
      storedBytes: _bytes,
      ...summary
    } = metadata
    return {
      ...summary,
      payload: value.payload,
      ...(value.journal.length
        ? {
            journal: value.journal.flatMap((item) =>
              item.entry ? [item.entry] : []
            )
          }
        : {})
    }
  }

  list(
    signal?: AbortSignal
  ): Promise<{ projects: ProjectSummary[]; limited: boolean }> {
    return this.transact(
      'readonly',
      (tx, done) => {
        const projects: ProjectSummary[] = []
        const request = tx
          .objectStore(PROJECTS)
          .index('savedAt')
          .openCursor(null, 'prev')
        request.onsuccess = () => {
          const cursor = request.result
          if (!cursor || projects.length === 100) {
            done({ projects, limited: !!cursor })
            return
          }
          try {
            validateSummary(cursor.value)
          } catch {
            tx.abort()
            return
          }
          const {
            journalLength: _length,
            checkpointRevision: _checkpoint,
            storedBytes: _bytes,
            ...summary
          } = cursor.value as ProjectSummary & {
            journalLength?: number
            checkpointRevision?: string
            storedBytes?: number
          }
          projects.push(summary)
          cursor.continue()
        }
      },
      signal
    )
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    for (const transaction of this.transactions) {
      try {
        transaction.abort()
      } catch {
        /* Already settled. */
      }
    }
    this.database?.close()
    this.database = null
  }
}
