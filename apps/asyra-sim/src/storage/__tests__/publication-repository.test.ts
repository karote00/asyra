import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { IndexedProjectRepository } from '../indexed-db'
import { encodeProject, type ProjectSnapshot } from '../project-format'
import { restoreJournal } from '../publication-journal'
import { journalFixture } from './journal-fixture'

beforeEach(() => vi.stubGlobal('IDBKeyRange', IDBKeyRange))
afterEach(() => vi.unstubAllGlobals())
const snapshot: ProjectSnapshot = {
  document: {
    version: '1.0.0',
    sceneTree: { workspace: '', workspaceList: [], elements: {} },
    props: {}
  },
  loadIssues: []
}
const project = {
  id: 'project',
  name: 'Original',
  revision: 'a',
  savedAt: '2026-09-08T00:00:00Z',
  payload: encodeProject(snapshot)
}

it('atomically appends each publication, rejects duplicate and stale writes, and checkpoints the acknowledged tail', async () => {
  const factory = new IDBFactory()
  const repository = new IndexedProjectRepository(factory, 'journal')
  try {
    await repository.write(project, null)
    const first = journalFixture()
    await repository.append({ ...project, revision: 'b' }, 'a', first)
    await expect(
      repository.append({ ...project, revision: 'c' }, 'b', first)
    ).rejects.toThrow()
    expect((await repository.read(project.id)).revision).toBe('b')
    await expect(
      repository.append({ ...project, revision: 'c' }, 'a', journalFixture())
    ).rejects.toThrow('another tab')
    const cancelled = new AbortController()
    cancelled.abort()
    await expect(
      repository.append(
        { ...project, revision: 'c' },
        'b',
        journalFixture(),
        cancelled.signal
      )
    ).rejects.toThrow()
    await repository.append(
      { ...project, name: 'Renamed', revision: 'c' },
      'b',
      null
    )
    const saved = await repository.read(project.id)
    expect(saved.journal).toEqual([first])
    expect(saved.name).toBe('Renamed')
    expect(restoreJournal(snapshot, saved.journal ?? []).replay).toHaveLength(1)
    await repository.write({ ...project, revision: 'd' }, 'c')
    expect((await repository.read(project.id)).journal).toBeUndefined()
  } finally {
    repository.close()
  }
})

it.each(['missing', 'chain'])(
  'rejects a %s journal tail without accepting partial recovery',
  async (damage) => {
    const factory = new IDBFactory()
    const repository = new IndexedProjectRepository(factory, 'damaged')
    await repository.write(project, null)
    await repository.append(
      { ...project, revision: 'b' },
      'a',
      journalFixture()
    )
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('damaged')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction('publications', 'readwrite')
        const store = tx.objectStore('publications')
        if (damage === 'missing') store.delete([project.id, 1])
        else {
          const request = store.get([project.id, 1])
          request.onsuccess = () =>
            store.put({ ...request.result, previousRevision: 'wrong' }, [
              project.id,
              1
            ])
        }
        tx.oncomplete = () => resolve()
        tx.onabort = () => reject(tx.error)
      })
      await expect(repository.read(project.id)).rejects.toThrow(
        damage === 'missing' ? 'Incomplete' : 'revision chain'
      )
    } finally {
      database.close()
      repository.close()
    }
  }
)

it('rejects duplicate publications and unsupported origins during recovery', () => {
  const entry = journalFixture()
  expect(() => restoreJournal(snapshot, [entry, entry])).toThrow('Duplicate')
  const invalid = {
    ...entry,
    publication: { ...entry.publication, origin: 'untrusted' }
  }
  expect(() => restoreJournal(snapshot, [invalid as typeof entry])).toThrow(
    'policy'
  )
})
