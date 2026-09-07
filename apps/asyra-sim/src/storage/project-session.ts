import type { ModelLoadIssue } from '../common-apis/document'
import {
  decodeProject,
  encodeProject,
  type ProjectRepository,
  type ProjectSnapshot,
  type ProjectSummary
} from './project-format'

export interface DocumentPorts {
  capture(): Promise<ProjectSnapshot>
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
  private timer: ReturnType<typeof setTimeout> | null = null
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
  markEdited(): void {
    if (this.disposed) return
    this.revision++
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
      this.timer ||
      this.pendingSave ||
      this.state.busy
    )
      return
    this.timer = setTimeout(() => {
      this.timer = null
      void this.flush().catch(() => undefined)
    }, 300)
  }

  async flush(): Promise<void> {
    this.assertLive()
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    if (this.pendingSave) return this.pendingSave
    if (!this.state.dirty) return
    const pending = (async () => {
      while (this.state.dirty) {
        this.assertLive()
        await this.save(this.projectName)
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
    this.markEdited()
  }

  async copy(name: string): Promise<void> {
    await this.flush()
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

  async save(name: string, newProject = false): Promise<void> {
    name = name.trim()
    if (!name || name.length > 200)
      throw new Error('Project name must contain 1–200 characters')
    const revision = this.beginOperation('save'),
      previous = newProject ? null : this.state.project
    try {
      const snapshot = await this.document.capture()
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
      const snapshot = decodeProject(stored.payload)
      const issues = await this.document.apply(snapshot, assertCurrent)
      this.assertLive()
      const { payload: _payload, ...metadata } = stored
      this.projectName = metadata.name
      const dirty = this.revision !== revision || issues.length > 0
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
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.lifetime.abort()
    this.listeners.clear()
    this.repository.close()
  }
}
