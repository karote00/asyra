import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SharedPublication } from '@asyra/factory'
import {
  DocumentPublicationOutbox,
  IndexedDbPublicationOutboxStorage,
  type PendingDocumentPublication,
  type PublicationOutboxStorage
} from '../../collaboration/publication-outbox'

const createPublication = (
  publicationId: string,
  transactionId: number
): SharedPublication => ({
  publicationId,
  artifactId: `artifact-${publicationId}`,
  transactionId,
  origin: 'action',
  mode: 'atomic',
  slices: [
    {
      sliceId: `slice-${publicationId}`,
      orderedIds: [`delivery-${publicationId}`],
      batches: [
        {
          batchId: `batch-${publicationId}`,
          channel: 'props',
          deliveries: [
            {
              deliveryId: `delivery-${publicationId}`,
              eventName: 'updateProperty',
              orderedIds: [`position-${publicationId}`],
              payload: {
                action: 'updateProperty',
                eventName: 'updateProperty',
                id: `position-${publicationId}`,
                key: 'x',
                before: transactionId,
                after: transactionId + 1
              }
            }
          ]
        }
      ]
    }
  ]
})

const createStorage = (
  factory: IDBFactory,
  databaseName: string
): IndexedDbPublicationOutboxStorage =>
  new IndexedDbPublicationOutboxStorage({
    factory,
    databaseName
  })

const freezePublication = (
  publication: SharedPublication
): SharedPublication => {
  const freezeValue = (value: unknown): void => {
    if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
      return
    }
    Object.values(value).forEach(freezeValue)
    Object.freeze(value)
  }
  freezeValue(publication)
  return publication
}

describe('document publication recovery outbox', () => {
  let factory: IDBFactory

  beforeEach(() => {
    factory = new IDBFactory()
  })

  it('persists missing predecessors before successors and resumes the complete prefix after reopen', async () => {
    const storage = createStorage(factory, 'durable-prefix-recovery')
    const outbox = new DocumentPublicationOutbox({ fileId: 'prefix', storage })
    await outbox.initialize()
    await outbox.bindDocumentGeneration(1)
    const put = vi
      .spyOn(storage, 'put')
      .mockRejectedValue(new Error('disk full'))
    await expect(
      outbox.appendPreparationFailure(
        freezePublication(createPublication('first', 1)),
        'conversion unavailable'
      )
    ).rejects.toThrow('IndexedDB')
    await expect(outbox.append(createPublication('second', 2))).rejects.toThrow(
      'IndexedDB'
    )
    expect(put.mock.calls.map(([record]) => record.publicationId)).toEqual([
      'first',
      'first'
    ])
    put.mockRestore()
    await outbox.retryStorage()
    const reopened = new DocumentPublicationOutbox({
      fileId: 'prefix',
      storage
    })
    await reopened.initialize()
    expect(reopened.getState()).toEqual({
      pendingCount: 2,
      status: 'conflicted'
    })
    expect(reopened.getRecoverablePublications()).toEqual([])
    await reopened.retryPreparation((source) => freezePublication(source))
    expect(
      reopened
        .getRecoverablePublications()
        .map(({ publicationId }) => publicationId)
    ).toEqual(['first', 'second'])
  })

  it('does not write over unknown storage and merges retained edits after a successful read retry', async () => {
    const storage = createStorage(factory, 'load-recovery')
    const initial = new DocumentPublicationOutbox({ fileId: 'load', storage })
    await initial.initialize()
    await initial.append(createPublication('older', 1))
    const load = vi
      .spyOn(storage, 'load')
      .mockRejectedValue(new Error('read failed'))
    const put = vi.spyOn(storage, 'put')
    const outbox = new DocumentPublicationOutbox({ fileId: 'load', storage })
    await expect(outbox.initialize()).rejects.toThrow('could not be loaded')
    await expect(outbox.append(createPublication('newer', 2))).rejects.toThrow()
    expect(put).not.toHaveBeenCalled()
    load.mockRestore()
    await outbox.retryStorage()
    const reopened = new DocumentPublicationOutbox({ fileId: 'load', storage })
    await reopened.initialize()
    expect(
      reopened
        .getRecoverablePublications()
        .map(({ publicationId, appendOrder }) => [publicationId, appendOrder])
    ).toEqual([
      ['older', 1],
      ['newer', 2]
    ])
  })

  it('keeps the recovery document through rejected retry, reopen and successful preparation', async () => {
    const storage = createStorage(factory, 'draft-recovery')
    const outbox = new DocumentPublicationOutbox({ fileId: 'draft', storage })
    await outbox.initialize()
    const draft = {
      version: '1.0.0',
      sceneTree: { elements: { local: { name: 'Kept work' } } },
      props: {}
    }
    await outbox.appendPreparationFailure(
      freezePublication(createPublication('source', 1)),
      'converter failed',
      draft
    )
    await expect(
      outbox.retryPreparation(() => {
        throw new Error('still invalid')
      })
    ).rejects.toThrow('still invalid')
    const reopened = new DocumentPublicationOutbox({ fileId: 'draft', storage })
    await reopened.initialize()
    expect(reopened.getRecoveryDocument()).toEqual(draft)
    await reopened.retryPreparation((source) => freezePublication(source))
    expect(reopened.getState().status).toBe('pending')
    expect(reopened.getRecoveryDocument()).toEqual(draft)
    await reopened.acknowledge({ publicationId: 'source', sequence: 1 })
    expect(reopened.getRecoveryDocument()).toBeUndefined()
  })

  it('restores immutable publications in file-local append order after reload', async () => {
    const databaseName = 'publication-outbox-reload'
    const first = new DocumentPublicationOutbox({
      fileId: 'file-a',
      storage: createStorage(factory, databaseName)
    })
    await first.initialize()

    await first.append(createPublication('publication-a', 1))
    await first.append(createPublication('publication-b', 2))

    const reloaded = new DocumentPublicationOutbox({
      fileId: 'file-a',
      storage: createStorage(factory, databaseName)
    })
    await reloaded.initialize()

    expect(
      reloaded
        .getRecoverablePublications()
        .map(({ publication, appendOrder }) => [
          publication.publicationId,
          appendOrder
        ])
    ).toEqual([
      ['publication-a', 1],
      ['publication-b', 2]
    ])
    expect(reloaded.getState()).toEqual({
      pendingCount: 2,
      status: 'pending'
    })
    expect(reloaded.getRecoverablePublications()[0]).not.toHaveProperty(
      'document'
    )
    expect(reloaded.getRecoverablePublications()[0]).not.toHaveProperty(
      'history'
    )
  })

  it('binds pre-handshake publications to the first authoritative document generation', async () => {
    const databaseName = 'publication-outbox-first-generation'
    const outbox = new DocumentPublicationOutbox({
      fileId: 'file-first-generation',
      storage: createStorage(factory, databaseName)
    })
    await outbox.initialize()
    await outbox.append(createPublication('publication-offline-first', 1))

    expect(
      outbox.getRecoverablePublications()[0]?.documentGeneration
    ).toBeNull()

    await outbox.bindDocumentGeneration(4)

    expect(outbox.getRecoverablePublications()).toEqual([
      expect.objectContaining({
        documentGeneration: 4,
        publicationId: 'publication-offline-first'
      })
    ])
    const reloaded = new DocumentPublicationOutbox({
      fileId: 'file-first-generation',
      storage: createStorage(factory, databaseName)
    })
    await reloaded.initialize()
    expect(reloaded.getRecoverablePublications()).toEqual([
      expect.objectContaining({ documentGeneration: 4 })
    ])
  })

  it('clears prior-generation Reset artifacts before recovery send', async () => {
    const publication = createPublication('publication-before-reset', 1)
    const records: PendingDocumentPublication[] = [
      {
        fileId: 'file-reset-generation',
        publicationId: publication.publicationId,
        appendOrder: 1,
        publication,
        status: 'pending'
      } as PendingDocumentPublication
    ]
    const storage: PublicationOutboxStorage = {
      load: vi.fn(async () => records),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async (_fileId, publicationId) => {
        const index = records.findIndex(
          (record) => record.publicationId === publicationId
        )
        if (index >= 0) {
          records.splice(index, 1)
        }
      })
    }
    const outbox = new DocumentPublicationOutbox({
      fileId: 'file-reset-generation',
      storage
    })
    await outbox.initialize()

    await outbox.bindDocumentGeneration(1)

    expect(storage.delete).toHaveBeenCalledWith(
      'file-reset-generation',
      'publication-before-reset'
    )
    expect(outbox.getRecoverablePublications()).toEqual([])
    expect(outbox.getState()).toEqual({
      pendingCount: 0,
      status: 'synced'
    })
  })

  it('removes exactly one entry only for matching socket source acceptance', async () => {
    const outbox = new DocumentPublicationOutbox({
      fileId: 'file-a',
      storage: createStorage(factory, 'publication-outbox-acceptance')
    })
    await outbox.initialize()
    await outbox.append(createPublication('publication-a', 1))
    await outbox.append(createPublication('publication-b', 2))

    await expect(
      outbox.acknowledge({
        publicationId: 'publication-missing',
        sequence: 3
      })
    ).resolves.toBe(false)
    expect(outbox.getState().pendingCount).toBe(2)

    await expect(
      outbox.acknowledge({
        publicationId: 'publication-a',
        sequence: 4
      })
    ).resolves.toBe(true)
    expect(
      outbox
        .getRecoverablePublications()
        .map(({ publication }) => publication.publicationId)
    ).toEqual(['publication-b'])
  })

  it('clears every recovery record for one file without touching another file', async () => {
    const databaseName = 'publication-outbox-file-reset'
    const firstFile = new DocumentPublicationOutbox({
      fileId: 'file-a',
      storage: createStorage(factory, databaseName)
    })
    const secondFile = new DocumentPublicationOutbox({
      fileId: 'file-b',
      storage: createStorage(factory, databaseName)
    })
    await firstFile.initialize()
    await secondFile.initialize()
    await firstFile.append(createPublication('publication-a', 1))
    await firstFile.append(createPublication('publication-b', 2))
    await secondFile.append(createPublication('publication-c', 3))

    await firstFile.clear()

    expect(firstFile.getState()).toEqual({
      pendingCount: 0,
      status: 'synced'
    })
    const reloadedFirstFile = new DocumentPublicationOutbox({
      fileId: 'file-a',
      storage: createStorage(factory, databaseName)
    })
    const reloadedSecondFile = new DocumentPublicationOutbox({
      fileId: 'file-b',
      storage: createStorage(factory, databaseName)
    })
    await reloadedFirstFile.initialize()
    await reloadedSecondFile.initialize()
    expect(reloadedFirstFile.getRecoverablePublications()).toEqual([])
    expect(
      reloadedSecondFile
        .getRecoverablePublications()
        .map(({ publicationId }) => publicationId)
    ).toEqual(['publication-c'])
  })

  it('retains in-memory evidence and enters storage-failed when IndexedDB append fails', async () => {
    const failure = new DOMException('quota exceeded', 'QuotaExceededError')
    const storage: PublicationOutboxStorage = {
      load: vi.fn(async () => []),
      put: vi.fn(async () => {
        throw failure
      }),
      delete: vi.fn(async () => undefined)
    }
    const outbox = new DocumentPublicationOutbox({
      fileId: 'file-storage-failure',
      storage
    })
    await outbox.initialize()

    await expect(
      outbox.append(createPublication('publication-retained', 1))
    ).rejects.toMatchObject({
      name: 'PublicationOutboxStorageError',
      cause: failure
    })

    expect(outbox.getState()).toEqual({
      pendingCount: 1,
      status: 'storage-failed'
    })
    expect(
      outbox.getRecoverablePublications()[0]?.publication.publicationId
    ).toBe('publication-retained')
  })

  it('retains a rejected structural publication as a conflict instead of retrying it', async () => {
    const outbox = new DocumentPublicationOutbox({
      fileId: 'file-a',
      storage: createStorage(factory, 'publication-outbox-conflict')
    })
    await outbox.initialize()
    await outbox.append(createPublication('publication-conflict', 1))

    await outbox.retainConflict(
      'publication-conflict',
      'parent element no longer exists'
    )

    expect(outbox.getRecoverablePublications()).toEqual([])
    expect(outbox.getConflicts()).toEqual([
      expect.objectContaining({
        publication: expect.objectContaining({
          publicationId: 'publication-conflict'
        }),
        status: 'conflicted',
        failureReason: 'parent element no longer exists'
      })
    ])
    expect(outbox.getState()).toEqual({
      pendingCount: 1,
      status: 'conflicted'
    })

    const reloaded = new DocumentPublicationOutbox({
      fileId: 'file-a',
      storage: createStorage(factory, 'publication-outbox-conflict')
    })
    await reloaded.initialize()
    expect(reloaded.getConflicts()).toHaveLength(1)
    expect(reloaded.getRecoverablePublications()).toEqual([])
  })

  it('never replaces an existing publication identity with different content', async () => {
    const records: PendingDocumentPublication[] = []
    const storage: PublicationOutboxStorage = {
      load: vi.fn(async () => records),
      put: vi.fn(async (record) => {
        records.push(record)
      }),
      delete: vi.fn(async () => undefined)
    }
    const outbox = new DocumentPublicationOutbox({
      fileId: 'file-a',
      storage
    })
    await outbox.initialize()
    await outbox.append(createPublication('publication-a', 1))

    await expect(
      outbox.append(createPublication('publication-a', 9))
    ).rejects.toThrow(
      '[collaboration] publication identity was reused with different content'
    )
    expect(outbox.getState().pendingCount).toBe(1)
  })

  it('retains immutable Factory publication evidence without a second source snapshot', async () => {
    const storage: PublicationOutboxStorage = {
      load: vi.fn(async () => []),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined)
    }
    const outbox = new DocumentPublicationOutbox({
      fileId: 'file-owner-publication',
      storage
    })
    await outbox.initialize()
    const publication = freezePublication(
      createPublication('publication-owner-evidence', 3)
    )

    const record = await outbox.appendFactoryPublication(publication)

    expect(record.publication).toBe(publication)
    expect(storage.put).toHaveBeenCalledWith(
      expect.objectContaining({ publication })
    )
  })

  it('snapshots mutable publication input before retaining it', async () => {
    const storage: PublicationOutboxStorage = {
      load: vi.fn(async () => []),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined)
    }
    const outbox = new DocumentPublicationOutbox({
      fileId: 'file-mutable-publication',
      storage
    })
    await outbox.initialize()
    const publication = Object.freeze(
      createPublication('publication-mutable', 5)
    )

    const record = await outbox.append(publication)
    const payload = publication.slices[0]?.batches[0]?.deliveries[0]?.payload
    if (!payload || payload.action !== 'updateProperty') {
      throw new Error('expected updateProperty publication payload')
    }
    payload.after = 999

    expect(record.publication).not.toBe(publication)
    expect(
      record.publication.slices[0]?.batches[0]?.deliveries[0]?.payload
    ).toMatchObject({ after: 6 })
  })
})

describe('source preparation failure retention', () => {
  it('restores source failure evidence and blocks subsequent publications in original order', async () => {
    const factory = new IDBFactory()
    const storage = () => createStorage(factory, 'preparation-failure-reload')
    const outbox = new DocumentPublicationOutbox({
      fileId: 'failed-source',
      storage: storage()
    })
    await outbox.initialize()
    await outbox.bindDocumentGeneration(3)
    await outbox.append(createPublication('before-failure', 1))
    const source = freezePublication(createPublication('invalid-source', 2))
    await outbox.appendPreparationFailure(
      source,
      'unsupported source operation'
    )
    await outbox.append(createPublication('after-failure', 3))
    expect(
      outbox.getRecoverablePublications().map((record) => record.publicationId)
    ).toEqual(['before-failure'])
    expect(outbox.getConflicts()[0]?.publication).toBe(source)
    await expect(
      outbox.acknowledge({ publicationId: 'invalid-source', sequence: 2 })
    ).resolves.toBe(false)
    await outbox.acknowledge({ publicationId: 'before-failure', sequence: 1 })
    expect(outbox.getRecoverablePublications()).toEqual([])
    const reloaded = new DocumentPublicationOutbox({
      fileId: 'failed-source',
      storage: storage()
    })
    await reloaded.initialize()
    await reloaded.bindDocumentGeneration(3)
    expect(reloaded.getState()).toEqual({
      pendingCount: 2,
      status: 'conflicted'
    })
    expect(reloaded.getConflicts()[0]).toMatchObject({
      publication: source,
      failureReason: 'unsupported source operation',
      appendOrder: 2
    })
    expect(reloaded.getRecoverablePublications()).toEqual([])
    const otherFile = new DocumentPublicationOutbox({
      fileId: 'other-file',
      storage: storage()
    })
    await otherFile.initialize()
    expect(otherFile.getState()).toEqual({ pendingCount: 0, status: 'synced' })
    await reloaded.bindDocumentGeneration(4)
    expect(reloaded.getState()).toEqual({ pendingCount: 0, status: 'synced' })
  })

  it('does not let generation rebinding or later successful writes clear a failed retention', async () => {
    const storage: PublicationOutboxStorage = {
      load: vi.fn(async () => []),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined)
    }
    const outbox = new DocumentPublicationOutbox({
      fileId: 'failed-storage',
      storage
    })
    await outbox.initialize()
    await outbox.bindDocumentGeneration(1)
    vi.mocked(storage.put).mockRejectedValueOnce(new Error('disk full'))
    await expect(
      outbox.appendPreparationFailure(
        freezePublication(createPublication('unsaved-source', 1)),
        'preparation failed'
      )
    ).rejects.toThrow('IndexedDB')
    await outbox.bindDocumentGeneration(1)
    await outbox.append(createPublication('later-edit', 2))
    expect(outbox.getState()).toEqual({
      pendingCount: 2,
      status: 'storage-failed'
    })
    expect(outbox.getConflicts()[0]?.publicationId).toBe('unsaved-source')
    expect(outbox.getRecoverablePublications()).toEqual([])
  })

  it('does not skip an existing canonical conflict when recovering later edits', async () => {
    const storage = createStorage(new IDBFactory(), 'conflict-prefix')
    const outbox = new DocumentPublicationOutbox({
      fileId: 'conflict-prefix',
      storage
    })
    await outbox.initialize()
    await outbox.append(createPublication('rejected', 1))
    await outbox.append(createPublication('dependent', 2))
    await outbox.retainConflict('rejected', 'missing parent')
    expect(outbox.getRecoverablePublications()).toEqual([])
  })
  it('does not resurrect a previous generation after an initial load failure is repaired', async () => {
    const storage = createStorage(
      new IDBFactory(),
      'generation-after-read-failure'
    )
    const old = new DocumentPublicationOutbox({ fileId: 'generation', storage })
    await old.initialize()
    await old.bindDocumentGeneration(1)
    await old.append(createPublication('old-generation', 1))
    const load = vi
      .spyOn(storage, 'load')
      .mockRejectedValueOnce(new Error('read unavailable'))
    const current = new DocumentPublicationOutbox({
      fileId: 'generation',
      storage
    })
    await expect(current.initialize()).rejects.toThrow()
    await current.bindDocumentGeneration(2)
    await expect(
      current.append(createPublication('new-generation', 2))
    ).rejects.toThrow()
    load.mockRestore()
    await current.retryStorage()
    expect(
      current
        .getRecoverablePublications()
        .map(({ publicationId }) => publicationId)
    ).toEqual(['new-generation'])
    const reopened = new DocumentPublicationOutbox({
      fileId: 'generation',
      storage
    })
    await reopened.initialize()
    expect(
      reopened
        .getRecoverablePublications()
        .map(({ publicationId }) => publicationId)
    ).toEqual(['new-generation'])
  })
})

it('finishes failed generation retirement before retry can release retained publications', async () => {
  const storage = createStorage(new IDBFactory(), 'generation-retirement-retry')
  const outbox = new DocumentPublicationOutbox({
    fileId: 'generation-retirement',
    storage
  })
  await outbox.initialize()
  await outbox.bindDocumentGeneration(0)
  await outbox.appendPreparationFailure(
    freezePublication(createPublication('retired', 1)),
    'old conflict',
    { old: true }
  )
  vi.spyOn(storage, 'delete').mockRejectedValueOnce(
    new Error('delete unavailable')
  )
  await expect(outbox.bindDocumentGeneration(1)).rejects.toThrow(
    'bind document generation'
  )
  expect(outbox.getRecoveryDocument()).toBeUndefined()
  await outbox.retryStorage()
  expect(outbox.getState()).toEqual({ status: 'synced', pendingCount: 0 })
  expect(await storage.load('generation-retirement')).toEqual([])
})
