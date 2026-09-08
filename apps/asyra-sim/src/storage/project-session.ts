import {
  restoreJournal,
  resourceKeys,
  type JournalEntry
} from './publication-journal'
import type { ModelLoadIssue } from '../common-apis/document'
import {
  decodeProject,
  encodeProject,
  type ProjectRepository,
  type ProjectSnapshot,
  type ProjectSummary
} from './project-format'

export interface DocumentPorts {
  capture(onCaptured?: () => void): Promise<ProjectSnapshot>
  apply(
    snapshot: ProjectSnapshot,
    assertCurrent: () => void
  ): Promise<readonly ModelLoadIssue[]>
}
export interface PersistenceState {
  project: Readonly<ProjectSummary> | null
  status: 'unsaved' | 'saving' | 'saved' | 'error'
  busy: 'save' | 'open' | 'export' | null
  dirty: boolean
  error: string
}

/** Persistence acknowledgement only; the canonical document stays behind ports. */
export class ProjectSession {
  private state: PersistenceState = Object.freeze({
    project: null,
    status: 'unsaved',
    busy: null,
    dirty: true,
    error: ''
  })
  private automatic = false
  private projectName = 'Untitled project'
  private queue: { revision: number; entry: JournalEntry }[] = []
  private needsCheckpoint = true
  private knownResources = new Set<string>()
  private pendingSave: Promise<void> | null = null
  private revision = 0
  private disposed = false
  private lifetime = new AbortController()
  private listeners = new Set<() => void>()
  constructor(
    private readonly repository: ProjectRepository,
    private readonly document: DocumentPorts
  ) {}

  getState = (): PersistenceState => this.state
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  private publish(patch: Partial<PersistenceState>): void {
    if (this.disposed) return
    this.state = Object.freeze({ ...this.state, ...patch })
    this.listeners.forEach((listener) => listener())
  }
  getKnownResources(): ReadonlySet<string> {
    return this.knownResources
  }
  markEdited(entry: JournalEntry): void {
    if (this.disposed) return
    this.revision++
    this.queue.push({ revision: this.revision, entry })
    for (const key of resourceKeys(entry.resources))
      this.knownResources.add(key)
    this.publish({
      dirty: true,
      status: this.state.busy === 'save' ? 'saving' : 'unsaved',
      error: this.state.error
    })
    this.schedule()
  }
  async start(projectId?: string): Promise<void> {
    if (projectId) await this.open(projectId, true)
    this.automatic = true
    await this.flush()
  }

  private schedule(): void {
    if (
      !this.automatic ||
      this.disposed ||
      this.pendingSave ||
      this.state.busy ||
      this.state.status === 'error'
    )
      return
    void this.flush().catch(() => undefined)
  }

  async flush(): Promise<void> {
    this.assertLive()
    if (this.pendingSave) return this.pendingSave
    if (!this.state.dirty) return
    const pending = (async () => {
      while (this.state.dirty) {
        this.assertLive()
        if (this.state.project && !this.needsCheckpoint) await this.appendNext()
        else await this.save(this.projectName)
      }
    })()
    this.pendingSave = pending
    try {
      await pending
    } finally {
      if (this.pendingSave === pending) this.pendingSave = null
    }
  }

  rename(name: string): void {
    name = name.trim()
    if (!name || name.length > 200)
      throw new Error('Project name must contain 1–200 characters')
    if (name === this.projectName) return
    this.projectName = name
    this.revision++
    this.publish({
      dirty: true,
      status: this.state.busy === 'save' ? 'saving' : 'unsaved'
    })
    this.schedule()
  }

  async copy(name: string): Promise<void> {
    // A deliberate checkpoint copy can recover a rejected tail. Await owned
    // writes, but do not require another successful append to the old project.
    if (this.pendingSave) await this.pendingSave.catch(() => undefined)
    await this.save(name, true)
  }

  private assertLive(): void {
    if (this.disposed) throw new Error('Project session is closed')
    this.lifetime.signal.throwIfAborted()
  }
  private beginOperation(busy: NonNullable<PersistenceState['busy']>): number {
    this.assertLive()
    if (this.state.busy)
      throw new Error('Another project operation is still running')
    this.publish({
      busy,
      error: '',
      ...(busy === 'save' ? { status: 'saving' } : {})
    })
    return this.revision
  }
  private fail(error: unknown): never {
    this.publish({
      busy: null,
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }

  private async appendNext(): Promise<void> {
    const revision = this.beginOperation('save')
    const previous = this.state.project
    if (!previous || !this.repository.append)
      return this.fail(new Error('Publication persistence is unavailable'))
    const pending = this.queue[0]
    const metadata = {
      ...previous,
      name: this.projectName,
      revision: crypto.randomUUID(),
      savedAt: new Date().toISOString()
    }
    try {
      await this.repository.append(
        metadata,
        previous.revision,
        pending?.entry ?? null,
        this.lifetime.signal
      )
      this.assertLive()
      if (pending) this.queue.shift()
      const dirty = this.queue.length > 0 || this.revision !== revision
      this.publish({
        project: Object.freeze(metadata),
        dirty,
        status: dirty ? 'unsaved' : 'saved',
        busy: null,
        error: ''
      })
    } catch (error) {
      this.fail(error)
    }
  }

  async save(name: string, newProject = false): Promise<void> {
    name = name.trim()
    if (!name || name.length > 200)
      throw new Error('Project name must contain 1–200 characters')
    let revision = this.beginOperation('save')
    const previous = newProject ? null : this.state.project
    try {
      const snapshot = await this.document.capture(() => {
        revision = this.revision
      })
      this.assertLive()
      const metadata: ProjectSummary = {
        id: previous?.id ?? crypto.randomUUID(),
        name,
        revision: crypto.randomUUID(),
        savedAt: new Date().toISOString()
      }
      await this.repository.write(
        { ...metadata, payload: encodeProject(snapshot) },
        previous?.revision ?? null,
        this.lifetime.signal
      )
      this.assertLive()
      this.queue = this.queue.filter((pending) => pending.revision > revision)
      this.knownResources = resourceKeys(snapshot)
      for (const pending of this.queue)
        for (const key of resourceKeys(pending.entry.resources))
          this.knownResources.add(key)
      this.needsCheckpoint = false
      const dirty = this.revision !== revision
      if (!dirty) this.projectName = name
      this.publish({
        project: Object.freeze(metadata),
        status: dirty ? 'unsaved' : 'saved',
        dirty,
        busy: null,
        error: ''
      })
      if (this.automatic && dirty) this.schedule()
    } catch (error) {
      this.fail(error)
    }
  }

  async open(id: string, replacementAccepted: boolean): Promise<void> {
    if (!replacementAccepted)
      throw new Error('Opening requires explicit replacement acceptance')
    if (this.automatic) await this.flush()
    const revision = this.beginOperation('open')
    const assertCurrent = () => {
      this.assertLive()
      if (revision !== this.revision)
        throw new Error(
          'The model changed while opening; retry without editing'
        )
    }
    try {
      const stored = await this.repository.read(id, this.lifetime.signal)
      assertCurrent()
      const snapshot = restoreJournal(
        decodeProject(stored.payload),
        stored.journal ?? []
      )
      const issues = await this.document.apply(snapshot, assertCurrent)
      this.assertLive()
      const { payload: _payload, journal: _journal, ...metadata } = stored
      this.queue = []
      this.knownResources = resourceKeys(snapshot)
      this.projectName = metadata.name
      const dirty = this.revision !== revision || issues.length > 0
      this.needsCheckpoint = dirty
      this.publish({
        project: Object.freeze(metadata),
        status: dirty ? 'unsaved' : 'saved',
        dirty,
        busy: null,
        error: ''
      })
      if (this.automatic && dirty) this.schedule()
    } catch (error) {
      this.fail(error)
    }
  }

  async exportProject(): Promise<string> {
    if (this.automatic) await this.flush()
    const revision = this.beginOperation('export')
    try {
      const snapshot = await this.document.capture()
      this.assertRevision(revision)
      const payload = encodeProject(snapshot)
      this.publish({ busy: null, error: '' })
      if (this.automatic && this.state.dirty) this.schedule()
      return payload
    } catch (error) {
      this.fail(error)
    }
  }

  async importProject(
    payload: string,
    replacementAccepted: boolean
  ): Promise<void> {
    this.assertLive()
    if (!replacementAccepted)
      throw new Error('Importing requires explicit replacement acceptance')
    // Revalidate the exact previewed text before any retirement or acknowledgement.
    const snapshot = decodeProject(payload)
    if (this.automatic) await this.flush()
    const revision = this.beginOperation('open'),
      assertCurrent = () => this.assertRevision(revision)
    try {
      await this.document.apply(snapshot, assertCurrent)
      this.assertLive()
      this.projectName = 'Imported project'
      this.needsCheckpoint = true
      this.queue = []
      this.knownResources = resourceKeys(snapshot)
      this.publish({
        project: null,
        status: 'unsaved',
        dirty: true,
        busy: null,
        error: ''
      })
      if (this.automatic) await this.flush()
    } catch (error) {
      this.fail(error)
    }
  }

  private assertRevision(revision: number): void {
    this.assertLive()
    if (this.revision !== revision)
      throw new Error(
        'The model changed during the project operation; retry without editing'
      )
  }

  list() {
    this.assertLive()
    return this.repository.list(this.lifetime.signal)
  }
  close(): void {
    if (this.disposed) return
    this.disposed = true
    this.lifetime.abort()
    this.listeners.clear()
    this.repository.close()
  }
}
