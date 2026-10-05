/** Provider-neutral evidence. This is not a provider connection or task executor. */
export type ActivityStatus =
  'idle' | 'working' | 'waiting' | 'completed' | 'failed' | 'offline'
export type ActivityFidelity =
  'structured' | 'local' | 'cooperative' | 'synthetic'
export interface ActivityConnection {
  readonly id: string
  readonly fidelity: ActivityFidelity
  readonly label: string
}
export interface ActivityEvent {
  readonly version: 1
  readonly source: string
  readonly sequence: number
  readonly timestamp: string
  readonly agentId: string
  readonly agentName: string
  readonly taskId: string | null
  readonly attempt: number
  readonly status: ActivityStatus
  readonly summary: string
}
export interface AgentActivity extends ActivityEvent {
  readonly fidelity: ActivityFidelity
}
export interface ActivityArchive {
  /** Resolve only after the entire batch is retained; reject without a prefix. */
  append(events: readonly AgentActivity[]): Promise<void>
}
const statuses = new Set<ActivityStatus>([
  'idle',
  'working',
  'waiting',
  'completed',
  'failed',
  'offline'
])
const bounded = (value: unknown, limit: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= limit
export function readActivityEvent(value: unknown): ActivityEvent {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid activity event')
  const event = value as ActivityEvent
  if (
    event.version !== 1 ||
    !bounded(event.source, 120) ||
    !bounded(event.agentId, 120) ||
    !bounded(event.agentName, 120) ||
    !Number.isSafeInteger(event.sequence) ||
    event.sequence < 1 ||
    !Number.isSafeInteger(event.attempt) ||
    event.attempt < 0 ||
    !statuses.has(event.status) ||
    !bounded(event.summary, 500) ||
    !bounded(event.timestamp, 64) ||
    !Number.isFinite(Date.parse(event.timestamp)) ||
    !(event.taskId === null || bounded(event.taskId, 120)) ||
    (['working', 'waiting', 'completed', 'failed'].includes(event.status) &&
      (!event.taskId || event.attempt < 1))
  )
    throw new Error('Invalid activity event')
  return Object.freeze({
    version: 1,
    source: event.source,
    sequence: event.sequence,
    timestamp: event.timestamp,
    agentId: event.agentId,
    agentName: event.agentName,
    taskId: event.taskId,
    attempt: event.attempt,
    status: event.status,
    summary: event.summary
  })
}
/** Durable admission precedes read-only entity projection. Frames never call this owner. */
export class ActivityProjection {
  private readonly connections = new Map<string, ActivityConnection>()
  private readonly agents = new Map<string, AgentActivity>()
  private readonly watermarks = new Map<string, number>()
  private readonly agentListeners = new Map<string, Set<() => void>>()
  private readonly listListeners = new Set<() => void>()
  private readonly logListeners = new Set<() => void>()
  private readonly pending = new Set<string>()
  private readonly history: AgentActivity[] = []
  private identities: readonly string[] = Object.freeze([])
  private listChanged = false
  private logChanged = false
  private scheduled = false
  private closed = false
  private queue: Promise<void> = Promise.resolve()
  constructor(
    private readonly archive: ActivityArchive,
    private readonly schedule: (flush: () => void) => void = queueMicrotask
  ) {}
  connect(connection: ActivityConnection): void {
    if (this.closed) throw new Error('Activity projection is closed')
    if (
      !bounded(connection.id, 120) ||
      !bounded(connection.label, 120) ||
      !['structured', 'local', 'cooperative', 'synthetic'].includes(
        connection.fidelity
      ) ||
      this.connections.has(connection.id)
    )
      throw new Error('Invalid or duplicate activity connection')
    this.connections.set(connection.id, Object.freeze({ ...connection }))
  }
  ingest(input: readonly unknown[]): Promise<void> {
    if (this.closed)
      return Promise.reject(new Error('Activity projection is closed'))
    if (!Array.isArray(input) || input.length > 1000)
      return Promise.reject(
        new Error('Activity batch must contain at most 1000 events')
      )
    let events: ActivityEvent[]
    try {
      events = input.map(readActivityEvent)
    } catch (error) {
      return Promise.reject(error)
    }
    const operation = this.queue.then(async () => {
      if (this.closed) throw new Error('Activity projection is closed')
      const sequences = new Map(this.watermarks)
      const accepted: AgentActivity[] = []
      for (const event of events) {
        const connection = this.connections.get(event.source)
        if (!connection) throw new Error('Unknown activity connection')
        if (event.sequence <= (sequences.get(event.source) ?? 0)) continue
        sequences.set(event.source, event.sequence)
        accepted.push(
          Object.freeze({ ...event, fidelity: connection.fidelity })
        )
      }
      if (!accepted.length) return
      await this.archive.append(Object.freeze(accepted))
      if (this.closed) return
      for (const event of accepted) {
        this.watermarks.set(event.source, event.sequence)
        this.history.push(event)
        const key = this.key(event.source, event.agentId)
        const previous = this.agents.get(key)
        if (
          previous &&
          (event.attempt < previous.attempt ||
            (event.attempt === previous.attempt &&
              previous.taskId !== null &&
              event.taskId !== previous.taskId) ||
            (event.attempt === previous.attempt &&
              ['completed', 'failed'].includes(previous.status) &&
              ['working', 'waiting'].includes(event.status)))
        )
          continue
        if (!previous) this.listChanged = true
        this.agents.set(key, event)
        this.pending.add(key)
      }
      this.logChanged = true
      if (!this.scheduled) {
        this.scheduled = true
        this.schedule(() => this.flush())
      }
    })
    this.queue = operation.catch(() => {
      /* A failed admission must not poison the next queued batch. */
    })
    return operation
  }
  key(source: string, agentId: string): string {
    return JSON.stringify([source, agentId])
  }
  getAgent(key: string): AgentActivity | undefined {
    return this.agents.get(key)
  }
  getAgentIds(): readonly string[] {
    return this.identities
  }
  recent(limit = 100): readonly AgentActivity[] {
    return this.history.slice(-Math.max(1, Math.min(1000, limit)))
  }
  get eventCount(): number {
    return this.history.length
  }
  subscribeAgent(key: string, listener: () => void): () => void {
    let listeners = this.agentListeners.get(key)
    if (!listeners) {
      listeners = new Set()
      this.agentListeners.set(key, listeners)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (!listeners.size) this.agentListeners.delete(key)
    }
  }
  subscribeAgents(listener: () => void): () => void {
    this.listListeners.add(listener)
    return () => {
      this.listListeners.delete(listener)
    }
  }
  subscribeLog(listener: () => void): () => void {
    this.logListeners.add(listener)
    return () => {
      this.logListeners.delete(listener)
    }
  }
  flush(): void {
    this.scheduled = false
    if (this.closed) return
    if (this.listChanged) {
      this.identities = Object.freeze([...this.agents.keys()])
      this.listChanged = false
      this.listListeners.forEach((listener) => listener())
    }
    const changed = [...this.pending]
    this.pending.clear()
    changed.forEach((key) =>
      this.agentListeners.get(key)?.forEach((listener) => listener())
    )
    if (this.logChanged) {
      this.logChanged = false
      this.logListeners.forEach((listener) => listener())
    }
  }
  dispose(): void {
    this.closed = true
    this.pending.clear()
    this.agentListeners.clear()
    this.listListeners.clear()
    this.logListeners.clear()
  }
}
