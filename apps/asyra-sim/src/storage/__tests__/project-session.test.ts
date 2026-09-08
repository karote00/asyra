import { journalFixture } from './journal-fixture'
import { describe, expect, it, vi } from 'vitest'
import { ProjectSession, type DocumentPorts } from '../project-session'
import {
  decodeProject,
  encodeProject,
  type ProjectRepository,
  type ProjectSnapshot,
  type StoredProject
} from '../project-format'

const snapshot = (): ProjectSnapshot => ({
  document: {
    version: '1.0.0',
    sceneTree: { workspace: '', workspaceList: [], elements: {} },
    props: {}
  },
  loadIssues: []
})
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  let reject: (reason: unknown) => void = () => undefined
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function fixture() {
  const records = new Map<string, StoredProject>()
  const repository: ProjectRepository = {
    read: vi.fn(async (id) => {
      const record = records.get(id)
      if (!record) throw new Error('missing')
      return structuredClone(record)
    }),
    write: vi.fn(async (record) => {
      records.set(record.id, structuredClone(record))
    }),
    append: vi.fn(async (metadata, _expected, entry) => {
      const current = records.get(metadata.id)
      if (!current) throw new Error('missing')
      records.set(metadata.id, {
        ...current,
        ...metadata,
        journal: [...(current.journal ?? []), ...(entry ? [entry] : [])]
      })
    }),
    list: vi.fn(async () => ({ projects: [], limited: false })),
    close: vi.fn()
  }
  const document: DocumentPorts = {
    capture: vi.fn(async () => snapshot()),
    apply: vi.fn(async (_data, guard) => {
      guard()
      return []
    })
  }
  const session = new ProjectSession(repository, document)
  return { session, repository, document, records }
}

describe('project persistence acknowledgement', () => {
  it('exports a validated portable capture without claiming a database save', async () => {
    const { session, repository } = fixture()
    const text = await session.exportProject()
    expect(decodeProject(text)).toEqual(snapshot())
    expect(repository.write).not.toHaveBeenCalled()
    expect(session.getState()).toMatchObject({
      project: null,
      dirty: true,
      status: 'unsaved',
      busy: null
    })
    await session.save('Local')
    const before = session.getState()
    await session.exportProject()
    expect(session.getState()).toEqual(before)
    session.close()
  })

  it('requires explicit portable import acceptance and keeps imported data unsaved under a new identity', async () => {
    const { session, document, repository } = fixture()
    await session.save('Original')
    const payload = encodeProject(snapshot())
    await expect(session.importProject(payload, false)).rejects.toThrow(
      'acceptance'
    )
    expect(document.apply).not.toHaveBeenCalled()
    await session.importProject(payload, true)
    expect(document.apply).toHaveBeenCalledWith(
      snapshot(),
      expect.any(Function)
    )
    expect(repository.write).toHaveBeenCalledOnce()
    expect(session.getState()).toMatchObject({
      project: null,
      dirty: true,
      status: 'unsaved',
      busy: null
    })
    await session.save('Imported')
    expect(repository.write).toHaveBeenLastCalledWith(
      expect.anything(),
      null,
      expect.any(AbortSignal)
    )
    session.close()
  })

  it('preserves the original acknowledgement for a rejected portable target', async () => {
    const { session, document } = fixture()
    await session.save('Original')
    const before = session.getState()
    await expect(
      session.importProject('{"version":999}', true)
    ).rejects.toThrow('Unsupported')
    expect(document.apply).not.toHaveBeenCalled()
    expect(session.getState()).toEqual(before)
    session.close()
  })

  it('guards portable operations against overlap, new edits, and closed sessions', async () => {
    const { session, document } = fixture(),
      capture = deferred<ProjectSnapshot>()
    document.capture = vi.fn(() => capture.promise)
    const exporting = session.exportProject()
    await expect(session.save('Other')).rejects.toThrow('still running')
    session.markEdited(journalFixture())
    capture.resolve(snapshot())
    await expect(exporting).rejects.toThrow('model changed')
    document.apply = vi.fn(async (_target, guard) => {
      session.markEdited(journalFixture())
      guard()
      return []
    })
    await expect(
      session.importProject(encodeProject(snapshot()), true)
    ).rejects.toThrow('model changed')
    expect(session.getState().project).toBeNull()
    session.close()
    await expect(session.exportProject()).rejects.toThrow('closed')
    await expect(
      session.importProject(encodeProject(snapshot()), true)
    ).rejects.toThrow('closed')
  })

  it('reports saved only after write acknowledgement and passes the expected saved revision on replacement', async () => {
    const { session, repository } = fixture(),
      write = deferred<undefined>()
    repository.write = vi.fn(() => write.promise)
    const saving = session.save('  Cell A  ')
    expect(session.getState().status).toBe('saving')
    await Promise.resolve()
    expect(session.getState().project).toBeNull()
    write.resolve(undefined)
    await saving
    const head = session.getState().project
    expect(head?.name).toBe('Cell A')
    expect(session.getState()).toMatchObject({
      status: 'saved',
      dirty: false,
      busy: null
    })
    await session.save('Renamed')
    expect(repository.write).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: head?.id, name: 'Renamed' }),
      head?.revision,
      expect.any(AbortSignal)
    )
    session.close()
  })
  it('keeps newer edits unsaved while the detached earlier snapshot reaches storage', async () => {
    const { session, repository } = fixture(),
      write = deferred<undefined>()
    repository.write = vi.fn(() => write.promise)
    const saving = session.save('Example')
    await Promise.resolve()
    session.markEdited(journalFixture())
    write.resolve(undefined)
    await saving
    expect(session.getState()).toMatchObject({
      status: 'unsaved',
      dirty: true,
      busy: null
    })
    session.close()
  })
  it('rejects overlapping operations and retains retryable failure instead of false saved state', async () => {
    const { session, repository } = fixture(),
      write = deferred<undefined>()
    repository.write = vi.fn(() => write.promise)
    const saving = session.save('Example')
    await expect(session.save('Second')).rejects.toThrow('still running')
    await expect(session.open('id', true)).rejects.toThrow('still running')
    write.reject(
      new DOMException('Storage quota exhausted', 'QuotaExceededError')
    )
    await expect(saving).rejects.toThrow('quota')
    expect(session.getState()).toMatchObject({
      project: null,
      status: 'error',
      dirty: true,
      busy: null
    })
    repository.write = vi.fn(async () => undefined)
    await session.save('Retry')
    expect(session.getState().status).toBe('saved')
    session.close()
  })
  it('preserves prior acknowledgement after failed replacement and supports saving a separate project', async () => {
    const { session, repository } = fixture()
    await session.save('Original')
    const original = session.getState().project
    session.markEdited(journalFixture())
    repository.write = vi.fn(async () => {
      throw new Error('conflict')
    })
    await expect(session.save('Replacement')).rejects.toThrow('conflict')
    expect(session.getState().project).toEqual(original)
    repository.write = vi.fn(async () => undefined)
    await session.save('Separate', true)
    expect(session.getState().project?.id).not.toBe(original?.id)
    expect(repository.write).toHaveBeenLastCalledWith(
      expect.anything(),
      null,
      expect.any(AbortSignal)
    )
    session.close()
  })
  it('requires acceptance and refuses to overwrite edits made during asynchronous reading or before queued apply', async () => {
    const { session, repository, document } = fixture(),
      read = deferred<StoredProject>()
    await expect(session.open('id', false)).rejects.toThrow('acceptance')
    repository.read = vi.fn(() => read.promise)
    const opening = session.open('id', true)
    session.markEdited(journalFixture())
    read.resolve({
      id: 'id',
      name: 'Saved',
      revision: 'a',
      savedAt: new Date().toISOString(),
      payload: encodeProject(snapshot())
    })
    await expect(opening).rejects.toThrow('model changed')
    expect(document.apply).not.toHaveBeenCalled()
    document.apply = vi.fn(async (_data, guard) => {
      session.markEdited(journalFixture())
      guard()
      return []
    })
    await expect(session.open('id', true)).rejects.toThrow('model changed')
    expect(session.getState().project).toBeNull()
    session.close()
  })
  it('reopens through the document port and preserves repaired-data unsaved status', async () => {
    const { session, repository, document } = fixture()
    const source = {
      ...snapshot(),
      loadIssues: [{ path: 'joint', message: 'Recovered' }]
    }
    repository.read = vi.fn(async () => ({
      id: 'id',
      name: 'Saved',
      revision: 'a',
      savedAt: new Date().toISOString(),
      payload: encodeProject(source)
    }))
    document.apply = vi.fn(async (data, guard) => {
      guard()
      return data.loadIssues
    })
    await session.open('id', true)
    expect(document.apply).toHaveBeenCalledWith(source, expect.any(Function))
    expect(session.getState()).toMatchObject({
      project: { id: 'id' },
      status: 'unsaved',
      dirty: true
    })
    session.close()
  })
  it('ignores late save responses after closing and closes the owned repository exactly once', async () => {
    const { session, repository } = fixture(),
      write = deferred<undefined>()
    repository.write = vi.fn(() => write.promise)
    const listener = vi.fn()
    session.subscribe(listener)
    const saving = session.save('Example')
    await Promise.resolve()
    session.close()
    const count = listener.mock.calls.length
    write.resolve(undefined)
    await expect(saving).rejects.toThrow('closed')
    expect(listener).toHaveBeenCalledTimes(count)
    expect(session.getState().project).toBeNull()
    session.close()
    expect(repository.close).toHaveBeenCalledOnce()
  })
})

describe('automatic project persistence', () => {
  it('serializes every publication without recapturing a burst', async () => {
    const { session, document, repository } = fixture()
    await session.start()
    const append = vi.mocked(repository.append)
    const pending = deferred<undefined>()
    append.mockImplementationOnce(() => pending.promise)
    for (let i = 0; i < 20; i++) session.markEdited(journalFixture())
    expect(document.capture).toHaveBeenCalledOnce()
    expect(append).toHaveBeenCalledOnce()
    pending.resolve(undefined)
    await session.flush()
    expect(append).toHaveBeenCalledTimes(20)
    expect(document.capture).toHaveBeenCalledOnce()
    expect(session.getState().dirty).toBe(false)
    session.close()
  })

  it('keeps a failed publication retryable without acknowledging later entries', async () => {
    const { session, repository } = fixture()
    await session.start()
    const append = vi.mocked(repository.append)
    append.mockRejectedValueOnce(new Error('quota'))
    session.markEdited(journalFixture())
    await vi.waitFor(() => expect(session.getState().status).toBe('error'))
    expect(session.getState()).toMatchObject({ dirty: true, error: 'quota' })
    await session.flush()
    expect(session.getState().status).toBe('saved')
    session.close()
    const count = append.mock.calls.length
    session.markEdited(journalFixture())
    expect(append).toHaveBeenCalledTimes(count)
  })

  it('restores an existing identity without rewriting it or creating a replacement on failure', async () => {
    const { session, repository, document } = fixture()
    await session.save('Existing')
    const id = session.getState().project?.id
    if (!id) throw new Error('Missing project')
    session.close()
    const restored = new ProjectSession(repository, document)
    await restored.start(id)
    expect(restored.getState().project?.id).toBe(id)
    expect(repository.write).toHaveBeenCalledOnce()
    restored.close()
    const missing = new ProjectSession(repository, document)
    await expect(missing.start('missing')).rejects.toThrow('missing')
    expect(repository.write).toHaveBeenCalledOnce()
    expect(missing.getState().status).toBe('error')
    missing.close()
  })

  it('does not replace the document when pending persistence fails', async () => {
    const { session, repository, document } = fixture()
    await session.start()
    const original = session.getState().project
    vi.mocked(repository.append).mockRejectedValueOnce(
      new Error('revision conflict')
    )
    session.markEdited(journalFixture())
    await expect(session.open('another-project', true)).rejects.toThrow(
      'revision conflict'
    )
    expect(document.apply).not.toHaveBeenCalled()
    expect(session.getState()).toMatchObject({
      project: original,
      dirty: true,
      status: 'error'
    })
    session.close()
  })

  it('automatically acknowledges a reopened document that preserves load diagnostics', async () => {
    vi.useFakeTimers()
    const { session, document, repository } = fixture()
    try {
      await session.start()
      const id = session.getState().project?.id
      if (!id) throw new Error('Missing project')
      vi.mocked(document.apply).mockResolvedValueOnce([
        { path: 'source', message: 'Needs review' }
      ])
      await session.open(id, true)
      expect(session.getState().dirty).toBe(true)
      await vi.advanceTimersByTimeAsync(300)
      expect(session.getState().status).toBe('saved')
      expect(repository.write).toHaveBeenCalledTimes(2)
    } finally {
      session.close()
      vi.useRealTimers()
    }
  })

  it('keeps a rename made while copying queued until the copy is acknowledged', async () => {
    vi.useFakeTimers()
    const { session, repository, records } = fixture()
    try {
      await session.start()
      const pending = deferred<undefined>()
      vi.mocked(repository.write).mockImplementationOnce(async (record) => {
        await pending.promise
        records.set(record.id, structuredClone(record))
      })
      const copying = session.copy('Copied project')
      await vi.advanceTimersByTimeAsync(0)
      session.rename('Renamed during copy')
      await vi.advanceTimersByTimeAsync(500)
      expect(repository.write).toHaveBeenCalledTimes(2)
      pending.resolve(undefined)
      await copying
      await vi.advanceTimersByTimeAsync(300)
      expect(session.getState()).toMatchObject({
        dirty: false,
        project: { name: 'Renamed during copy' }
      })
      expect(repository.write).toHaveBeenCalledTimes(2)
      expect(repository.append).toHaveBeenCalledOnce()
    } finally {
      session.close()
      vi.useRealTimers()
    }
  })

  it('flushes before switching and renames without requiring manual save', async () => {
    const { session, repository } = fixture()
    await session.start()
    const first = session.getState().project
    if (!first) throw new Error('Missing project')
    await session.save('Copy', true)
    session.markEdited(journalFixture())
    await session.open(first.id, true)
    expect(session.getState().project?.id).toBe(first.id)
    session.rename('Renamed')
    await session.flush()
    expect(session.getState().project?.name).toBe('Renamed')
    expect(repository.write).toHaveBeenCalledTimes(2)
    expect(repository.append).toHaveBeenCalledTimes(2)
    session.close()
  })
})
