import type { SharedPublication } from '@asyra/core'
import {
  measureBrowserDragAsyncPhase,
  measureBrowserDragPhase
} from '@asyra/utils'

export type PendingDocumentPublicationStatus = 'pending' | 'conflicted'

export interface PendingDocumentPublication {
  readonly fileId: string
  readonly publicationId: string
  readonly appendOrder: number
  readonly documentGeneration: number | null
  readonly publication: SharedPublication
  readonly status: PendingDocumentPublicationStatus
  readonly failureReason?: string
  readonly preparationFailed?: boolean
  readonly recoveryDocument?: unknown
}

export interface PublicationOutboxStorage {
  load(fileId: string): Promise<readonly PendingDocumentPublication[]>
  put(record: PendingDocumentPublication): Promise<void>
  delete(fileId: string, publicationId: string): Promise<void>
}

export interface PublicationOutboxState {
  readonly pendingCount: number
  readonly status: 'synced' | 'pending' | 'conflicted' | 'storage-failed'
}

export interface SourcePublicationAcceptance {
  readonly publicationId: string
  readonly sequence: number
}

interface IndexedDbPublicationOutboxStorageOptions {
  readonly factory?: IDBFactory
  readonly databaseName?: string
}

interface DocumentPublicationOutboxOptions {
  readonly fileId: string
  readonly storage?: PublicationOutboxStorage
}

const DEFAULT_DATABASE_NAME = 'collaboration-publications'
const DATABASE_VERSION = 1
const PUBLICATION_STORE_NAME = 'pending-publications'
const FILE_ID_INDEX_NAME = 'file-id'

const freezeValue = <T>(value: T): T => {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }
  Object.values(value).forEach((nested) => freezeValue(nested))
  return Object.freeze(value)
}

const snapshotPublication = (
  publication: SharedPublication
): SharedPublication =>
  measureBrowserDragPhase('collaboration:outbox-snapshot-publication', () =>
    freezeValue(structuredClone(publication))
  )

const createRecord = (
  fileId: string,
  publication: SharedPublication,
  appendOrder: number,
  documentGeneration: number | null,
  retainFactoryPublication: boolean,
  failureReason?: string
): PendingDocumentPublication =>
  Object.freeze({
    fileId,
    publicationId: publication.publicationId,
    appendOrder,
    documentGeneration,
    publication: retainFactoryPublication
      ? publication
      : snapshotPublication(publication),
    status: failureReason === undefined ? 'pending' : 'conflicted',
    ...(failureReason === undefined ? {} : { failureReason })
  })

const snapshotRecord = (
  record: PendingDocumentPublication
): PendingDocumentPublication =>
  freezeValue({
    ...structuredClone(record),
    documentGeneration:
      record.documentGeneration === null ||
      (Number.isSafeInteger(record.documentGeneration) &&
        record.documentGeneration >= 0)
        ? record.documentGeneration
        : 0,
    publication: structuredClone(record.publication)
  })

const samePublication = (
  first: SharedPublication,
  second: SharedPublication
): boolean => JSON.stringify(first) === JSON.stringify(second)

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), {
      once: true
    })
    request.addEventListener(
      'error',
      () =>
        reject(
          request.error ?? new Error('[collaboration] IndexedDB request failed')
        ),
      { once: true }
    )
  })

const transactionCompletion = (transaction: IDBTransaction): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true })
    transaction.addEventListener(
      'abort',
      () =>
        reject(
          transaction.error ??
            new Error('[collaboration] IndexedDB transaction was aborted')
        ),
      { once: true }
    )
    transaction.addEventListener(
      'error',
      () =>
        reject(
          transaction.error ??
            new Error('[collaboration] IndexedDB transaction failed')
        ),
      { once: true }
    )
  })

export class PublicationOutboxStorageError extends Error {
  override readonly cause: unknown

  constructor(message: string, cause: unknown) {
    super(message)
    this.name = 'PublicationOutboxStorageError'
    this.cause = cause
  }
}

export class IndexedDbPublicationOutboxStorage implements PublicationOutboxStorage {
  private readonly factory: IDBFactory
  private readonly databaseName: string
  private databasePromise: Promise<IDBDatabase> | undefined

  constructor(options: IndexedDbPublicationOutboxStorageOptions = {}) {
    const factory = options.factory ?? globalThis.indexedDB
    if (!factory) {
      throw new PublicationOutboxStorageError(
        '[collaboration] IndexedDB is unavailable',
        new Error('[collaboration] IndexedDB is unavailable')
      )
    }
    this.factory = factory
    this.databaseName = options.databaseName ?? DEFAULT_DATABASE_NAME
  }

  async load(fileId: string): Promise<readonly PendingDocumentPublication[]> {
    const database = await this.openDatabase()
    const transaction = database.transaction(PUBLICATION_STORE_NAME, 'readonly')
    const store = transaction.objectStore(PUBLICATION_STORE_NAME)
    const index = store.index(FILE_ID_INDEX_NAME)
    const records = await requestResult(
      index.getAll(fileId) as IDBRequest<PendingDocumentPublication[]>
    )
    await transactionCompletion(transaction)
    return records
      .map(snapshotRecord)
      .sort((first, second) => first.appendOrder - second.appendOrder)
  }

  async put(record: PendingDocumentPublication): Promise<void> {
    const database = await this.openDatabase()
    const transaction = database.transaction(
      PUBLICATION_STORE_NAME,
      'readwrite'
    )
    transaction.objectStore(PUBLICATION_STORE_NAME).put(record)
    await transactionCompletion(transaction)
  }

  async delete(fileId: string, publicationId: string): Promise<void> {
    const database = await this.openDatabase()
    const transaction = database.transaction(
      PUBLICATION_STORE_NAME,
      'readwrite'
    )
    transaction
      .objectStore(PUBLICATION_STORE_NAME)
      .delete([fileId, publicationId])
    await transactionCompletion(transaction)
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) {
      return this.databasePromise
    }
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = this.factory.open(this.databaseName, DATABASE_VERSION)
      request.addEventListener('upgradeneeded', () => {
        const database = request.result
        if (database.objectStoreNames.contains(PUBLICATION_STORE_NAME)) {
          return
        }
        const store = database.createObjectStore(PUBLICATION_STORE_NAME, {
          keyPath: ['fileId', 'publicationId']
        })
        store.createIndex(FILE_ID_INDEX_NAME, 'fileId', { unique: false })
      })
      request.addEventListener('success', () => resolve(request.result), {
        once: true
      })
      request.addEventListener(
        'error',
        () =>
          reject(
            request.error ??
              new Error('[collaboration] IndexedDB database open failed')
          ),
        { once: true }
      )
      request.addEventListener(
        'blocked',
        () =>
          reject(
            new Error('[collaboration] IndexedDB database upgrade was blocked')
          ),
        { once: true }
      )
    }).catch((error) => {
      if (this.databasePromise === opening) {
        this.databasePromise = undefined
      }
      throw error
    })
    this.databasePromise = opening
    return opening
  }
}

export class DocumentPublicationOutbox {
  readonly fileId: string

  private readonly storage: PublicationOutboxStorage
  private readonly records = new Map<string, PendingDocumentPublication>()
  private readonly stateSubscribers = new Set<
    (state: PublicationOutboxState) => void
  >()
  private operationQueue: Promise<void> = Promise.resolve()
  private initialized = false
  private storageFailed = false
  private storageLoaded = false
  private readonly unwritten = new Set<string>()
  private nextAppendOrder = 1
  private documentGeneration: number | null = null

  constructor(options: DocumentPublicationOutboxOptions) {
    if (!options.fileId.trim()) {
      throw new Error('[collaboration] publication outbox fileId is required')
    }
    this.fileId = options.fileId
    this.storage = options.storage ?? new IndexedDbPublicationOutboxStorage()
  }

  initialize(): Promise<void> {
    return this.schedule(async () => {
      if (this.initialized) {
        return
      }
      try {
        const records = await this.storage.load(this.fileId)
        records.forEach((record) => {
          if (
            record.fileId !== this.fileId ||
            record.publicationId !== record.publication.publicationId
          ) {
            return
          }
          const snapshot = snapshotRecord(record)
          this.records.set(snapshot.publicationId, snapshot)
          this.nextAppendOrder = Math.max(
            this.nextAppendOrder,
            snapshot.appendOrder + 1
          )
        })
        this.storageLoaded = true
        this.initialized = true
        this.emitState()
      } catch (error) {
        this.initialized = true
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          '[collaboration] publication outbox could not be loaded',
          error
        )
      }
    })
  }

  append(publication: SharedPublication): Promise<PendingDocumentPublication> {
    return this.appendPublication(publication, false)
  }

  bindDocumentGeneration(documentGeneration: number): Promise<void> {
    if (!Number.isSafeInteger(documentGeneration) || documentGeneration < 0) {
      return Promise.reject(
        new Error('[collaboration] document generation must be non-negative')
      )
    }
    return this.schedule(async () => {
      this.requireInitialized()
      this.documentGeneration = documentGeneration
      if (!this.storageLoaded) {
        return
      }
      try {
        await this.bindRetainedGeneration()
        await this.flushUnwritten()
      } catch (error) {
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          `[collaboration] publication outbox for ${this.fileId} could not bind document generation ${String(documentGeneration)}`,
          error
        )
      }
    })
  }

  private async bindRetainedGeneration(): Promise<void> {
    const documentGeneration = this.documentGeneration
    if (documentGeneration === null) {
      return
    }
    for (const record of this.sortedRecords()) {
      if (record.documentGeneration === documentGeneration) {
        continue
      }
      if (record.documentGeneration === null) {
        this.records.set(
          record.publicationId,
          freezeValue({ ...record, documentGeneration })
        )
        this.unwritten.add(record.publicationId)
      } else {
        await this.storage.delete(this.fileId, record.publicationId)
        this.records.delete(record.publicationId)
        this.unwritten.delete(record.publicationId)
      }
    }
  }

  appendFactoryPublication(
    publication: SharedPublication,
    recoveryDocument?: unknown
  ): Promise<PendingDocumentPublication> {
    return this.appendPublication(
      publication,
      true,
      undefined,
      recoveryDocument
    )
  }

  appendPreparationFailure(
    source: SharedPublication,
    failureReason: string,
    recoveryDocument?: unknown
  ): Promise<PendingDocumentPublication> {
    return this.appendPublication(source, true, failureReason, recoveryDocument)
  }

  private appendPublication(
    publication: SharedPublication,
    retainFactoryPublication: boolean,
    failureReason?: string,
    recoveryDocument?: unknown
  ): Promise<PendingDocumentPublication> {
    return this.schedule(async () => {
      this.requireInitialized()
      if (retainFactoryPublication && !Object.isFrozen(publication)) {
        throw new Error(
          '[collaboration] Factory publication evidence must be immutable'
        )
      }
      const existing = this.records.get(publication.publicationId)
      if (existing) {
        if (!samePublication(existing.publication, publication)) {
          throw new Error(
            '[collaboration] publication identity was reused with different content'
          )
        }
        return existing
      }

      const record = freezeValue({
        ...createRecord(
          this.fileId,
          publication,
          this.nextAppendOrder++,
          this.documentGeneration,
          retainFactoryPublication,
          failureReason
        ),
        ...(failureReason === undefined ? {} : { preparationFailed: true }),
        ...(recoveryDocument === undefined
          ? {}
          : { recoveryDocument: structuredClone(recoveryDocument) })
      })
      this.records.set(record.publicationId, record)
      this.unwritten.add(record.publicationId)
      this.emitState()
      try {
        await this.flushUnwritten()
        return record
      } catch (error) {
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          `[collaboration] publication ${record.publicationId} could not be retained in IndexedDB`,
          error
        )
      }
    })
  }

  acknowledge(acceptance: SourcePublicationAcceptance): Promise<boolean> {
    return this.schedule(async () => {
      this.requireInitialized()
      const record = this.records.get(acceptance.publicationId)
      if (!record || record.status !== 'pending') {
        return false
      }
      try {
        await this.storage.delete(this.fileId, record.publicationId)
      } catch (error) {
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          `[collaboration] accepted publication ${record.publicationId} could not be removed from IndexedDB`,
          error
        )
      }
      this.records.delete(record.publicationId)
      this.unwritten.delete(record.publicationId)
      this.emitState()
      return true
    })
  }

  clear(): Promise<void> {
    return this.schedule(async () => {
      this.requireInitialized()
      try {
        for (const record of this.sortedRecords()) {
          await this.storage.delete(this.fileId, record.publicationId)
          this.records.delete(record.publicationId)
        }
        this.nextAppendOrder = 1
        this.unwritten.clear()
        this.storageFailed = false
        this.emitState()
      } catch (error) {
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          `[collaboration] publication outbox for ${this.fileId} could not be cleared`,
          error
        )
      }
    })
  }

  retainConflict(
    publicationId: string,
    failureReason: string,
    recoveryDocument?: unknown
  ): Promise<boolean> {
    return this.schedule(async () => {
      this.requireInitialized()
      const existing = this.records.get(publicationId)
      if (!existing) {
        return false
      }
      const conflicted = freezeValue({
        ...existing,
        status: 'conflicted' as const,
        failureReason,
        ...(recoveryDocument === undefined
          ? {}
          : { recoveryDocument: structuredClone(recoveryDocument) })
      })
      this.records.set(publicationId, conflicted)
      this.unwritten.add(publicationId)
      this.emitState()
      try {
        await this.flushUnwritten()
      } catch (error) {
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          `[collaboration] conflicted publication ${publicationId} could not be updated in IndexedDB`,
          error
        )
      }
      return true
    })
  }

  /** Flush retained predecessors before admitting successors to storage. */
  private async flushUnwritten(): Promise<void> {
    if (!this.storageLoaded) {
      throw new Error('Publication storage has not been loaded')
    }
    for (const record of this.sortedRecords()) {
      if (!this.unwritten.has(record.publicationId)) {
        continue
      }
      await measureBrowserDragAsyncPhase(
        'collaboration:outbox-storage-put',
        () => this.storage.put(record)
      )
      this.unwritten.delete(record.publicationId)
    }
    this.emitState()
  }

  retryStorage(): Promise<void> {
    return this.schedule(async () => {
      this.requireInitialized()
      try {
        if (!this.storageLoaded) {
          const saved = await this.storage.load(this.fileId)
          const buffered = this.sortedRecords()
          for (const record of saved) {
            if (
              record.fileId !== this.fileId ||
              record.publicationId !== record.publication.publicationId
            ) {
              throw new Error('Invalid retained publication identity')
            }
            const current = this.records.get(record.publicationId)
            if (
              current &&
              !samePublication(current.publication, record.publication)
            ) {
              throw new Error('Retained publication identity conflict')
            }
          }
          const obsolete = saved.filter(
            (record) =>
              this.documentGeneration !== null &&
              record.documentGeneration !== null &&
              record.documentGeneration !== this.documentGeneration
          )
          for (const record of obsolete) {
            await this.storage.delete(this.fileId, record.publicationId)
          }
          const obsoleteIds = new Set(
            obsolete.map(({ publicationId }) => publicationId)
          )
          this.records.clear()
          this.nextAppendOrder = 1
          for (const record of saved) {
            if (obsoleteIds.has(record.publicationId)) {
              continue
            }
            this.records.set(record.publicationId, snapshotRecord(record))
            this.nextAppendOrder = Math.max(
              this.nextAppendOrder,
              record.appendOrder + 1
            )
          }
          for (const record of buffered) {
            if (this.records.has(record.publicationId)) {
              continue
            }
            this.records.set(
              record.publicationId,
              freezeValue({ ...record, appendOrder: this.nextAppendOrder++ })
            )
          }
          this.storageLoaded = true
        }
        await this.bindRetainedGeneration()
        await this.flushUnwritten()
        this.storageFailed = false
        this.emitState()
      } catch (error) {
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          'Retained publications could not be persisted',
          error
        )
      }
    })
  }

  retryPreparation(
    prepare: (source: SharedPublication) => SharedPublication | undefined
  ): Promise<void> {
    return this.schedule(async () => {
      this.requireInitialized()
      const replacements = this.getConflicts().map((record) => {
        const publication = record.preparationFailed
          ? prepare(record.publication)
          : record.publication
        if (
          !publication ||
          publication.publicationId !== record.publicationId
        ) {
          throw new Error('Recovery must preserve publication identity')
        }
        const {
          failureReason: _reason,
          preparationFailed: _failed,
          ...retained
        } = record
        return freezeValue({
          ...retained,
          publication,
          status: 'pending' as const
        })
      })
      for (const record of replacements) {
        this.records.set(record.publicationId, record)
        this.unwritten.add(record.publicationId)
      }
      try {
        await this.flushUnwritten()
      } catch (error) {
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          'Recovery preparation could not be retained',
          error
        )
      }
    })
  }

  retainRecoveryDocument(document: unknown): Promise<void> {
    return this.schedule(async () => {
      const record = this.sortedRecords().at(-1)
      if (!record) {
        return
      }
      this.records.set(
        record.publicationId,
        freezeValue({ ...record, recoveryDocument: structuredClone(document) })
      )
      this.unwritten.add(record.publicationId)
      try {
        await this.flushUnwritten()
      } catch (error) {
        this.markStorageFailed()
        throw new PublicationOutboxStorageError(
          'Recovery document could not be retained',
          error
        )
      }
    })
  }

  getRecoveryDocument(): unknown {
    return [...this.sortedRecords()]
      .reverse()
      .find(
        (record) =>
          record.recoveryDocument !== undefined &&
          (this.documentGeneration === null ||
            record.documentGeneration === null ||
            record.documentGeneration === this.documentGeneration)
      )?.recoveryDocument
  }

  getRecoverablePublications(): readonly PendingDocumentPublication[] {
    const records = this.sortedRecords()
    const blockedAt = records.findIndex(({ status }) => status !== 'pending')
    return blockedAt < 0 ? records : records.slice(0, blockedAt)
  }

  getConflicts(): readonly PendingDocumentPublication[] {
    return this.sortedRecords().filter(({ status }) => status === 'conflicted')
  }

  getLastAppendOrder(): number {
    return this.nextAppendOrder - 1
  }

  getState(): PublicationOutboxState {
    const records = this.sortedRecords()
    let status: PublicationOutboxState['status'] = 'synced'
    if (records.some((record) => record.status === 'pending')) {
      status = 'pending'
    }
    if (records.some((record) => record.status === 'conflicted')) {
      status = 'conflicted'
    }
    if (this.storageFailed) {
      status = 'storage-failed'
    }
    return Object.freeze({
      pendingCount: records.length,
      status
    })
  }

  onStateChange(
    subscriber: (state: PublicationOutboxState) => void
  ): () => void {
    this.stateSubscribers.add(subscriber)
    return () => this.stateSubscribers.delete(subscriber)
  }

  whenIdle(): Promise<void> {
    return this.operationQueue
  }

  private schedule<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation)
    this.operationQueue = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  private requireInitialized(): void {
    if (!this.initialized) {
      throw new Error('[collaboration] publication outbox is not initialized')
    }
  }

  private sortedRecords(): readonly PendingDocumentPublication[] {
    return [...this.records.values()].sort(
      (first, second) => first.appendOrder - second.appendOrder
    )
  }

  private markStorageFailed(): void {
    if (this.storageFailed) {
      return
    }
    this.storageFailed = true
    this.emitState()
  }

  private emitState(): void {
    const state = this.getState()
    ;[...this.stateSubscribers].forEach((subscriber) => {
      try {
        subscriber(state)
      } catch {
        // Status observers cannot alter recovery ownership.
      }
    })
  }
}
