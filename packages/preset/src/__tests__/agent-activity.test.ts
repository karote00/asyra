import { describe, expect, it, vi } from 'vitest'
import { ActivityProjection, type ActivityEvent } from '../agent-activity.js'
const event = (
  sequence: number,
  update: Partial<ActivityEvent> = {}
): ActivityEvent => ({
  version: 1,
  source: 'sample',
  sequence,
  timestamp: '2026-10-02T07:00:00Z',
  agentId: 'a',
  agentName: 'Ari',
  taskId: 'task-1',
  attempt: 1,
  status: 'working',
  summary: 'Checking the brief',
  ...update
})
const setup = () => {
  const append = vi.fn(async () => {
    /* Atomic in-memory test acknowledgement. */
  })
  const flushes: (() => void)[] = []
  const projection = new ActivityProjection({ append }, (flush) =>
    flushes.push(flush)
  )
  projection.connect({
    id: 'sample',
    label: 'Synthetic example',
    fidelity: 'synthetic'
  })
  return {
    projection,
    append,
    flush: () => flushes.splice(0).forEach((flush) => flush())
  }
}
describe('Activity projection', () => {
  it('retains every accepted event but coalesces entity updates without touching unrelated agents', async () => {
    const { projection, append, flush } = setup()
    await projection.ingest([event(1), event(2, { agentId: 'b' })])
    flush()
    const a = vi.fn(),
      b = vi.fn(),
      list = vi.fn()
    projection.subscribeAgent(projection.key('sample', 'a'), a)
    projection.subscribeAgent(projection.key('sample', 'b'), b)
    projection.subscribeAgents(list)
    const events = Array.from({ length: 500 }, (_, index) =>
      event(index + 3, { summary: `Step ${index}` })
    )
    await projection.ingest(events)
    expect(a).not.toHaveBeenCalled()
    flush()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).not.toHaveBeenCalled()
    expect(list).not.toHaveBeenCalled()
    expect(projection.eventCount).toBe(502)
    expect(append).toHaveBeenCalledTimes(2)
    expect(projection.getAgent(projection.key('sample', 'a'))?.summary).toBe(
      'Step 499'
    )
  })
  it('rejects an invalid batch without partial history or publication', async () => {
    const { projection, append } = setup()
    await expect(
      projection.ingest([event(1), event(2, { summary: '' })])
    ).rejects.toThrow('Invalid')
    expect(append).not.toHaveBeenCalled()
    expect(projection.eventCount).toBe(0)
  })
  it('deduplicates source replay and keeps a newer attempt when old completion arrives', async () => {
    const { projection, flush } = setup()
    await projection.ingest([
      event(1),
      event(2, { attempt: 2, taskId: 'task-2' }),
      event(3, { status: 'completed' })
    ])
    flush()
    await projection.ingest([event(3), event(1)])
    expect(projection.eventCount).toBe(3)
    expect(projection.getAgent(projection.key('sample', 'a'))?.taskId).toBe(
      'task-2'
    )
  })
  it('retains the terminal result against late working events in the same attempt', async () => {
    const { projection, flush } = setup()
    await projection.ingest([event(1, { status: 'completed' }), event(2)])
    flush()
    expect(projection.getAgent(projection.key('sample', 'a'))?.status).toBe(
      'completed'
    )
    expect(projection.eventCount).toBe(2)
  })
  it('uses connection fidelity rather than a caller claimed evidence label', async () => {
    const { projection, flush } = setup()
    projection.connect({
      id: 'mcp',
      label: 'Cooperative participant',
      fidelity: 'cooperative'
    })
    await projection.ingest([
      { ...event(1, { source: 'mcp' }), fidelity: 'structured' }
    ])
    flush()
    expect(projection.getAgent(projection.key('mcp', 'a'))?.fidelity).toBe(
      'cooperative'
    )
  })
  it('does not acknowledge or project failed persistence and permits retry', async () => {
    const { projection, append, flush } = setup()
    append.mockRejectedValueOnce(new Error('Disk full'))
    await expect(projection.ingest([event(1)])).rejects.toThrow('Disk full')
    expect(projection.eventCount).toBe(0)
    await projection.ingest([event(1)])
    flush()
    expect(projection.eventCount).toBe(1)
  })
  it('rejects unknown sources and oversized batches atomically', async () => {
    const { projection, append } = setup()
    await expect(
      projection.ingest([event(1), event(2, { source: 'unknown' })])
    ).rejects.toThrow('Unknown')
    await expect(
      projection.ingest(Array.from({ length: 1001 }, (_, i) => event(i + 1)))
    ).rejects.toThrow('1000')
    expect(append).not.toHaveBeenCalled()
  })
  it('contains late archive completion after disposal', async () => {
    let finish = () => {
      /* Replaced when the archive receives its batch. */
    }
    const projection = new ActivityProjection({
      append: () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    })
    projection.connect({ id: 'sample', label: 'Sample', fidelity: 'synthetic' })
    const pending = projection.ingest([event(1)])
    await Promise.resolve()
    projection.dispose()
    finish()
    await pending
    expect(projection.eventCount).toBe(0)
    await expect(projection.ingest([event(2)])).rejects.toThrow('closed')
  })
})
