import { describe, expect, it } from 'vitest'
import { createLocalToolScheduler } from '../local-tool-scheduler'

describe('request tool scheduling', () => {
  it('treats missing access as a barrier and continues after a recoverable failure', async () => {
    const schedule = createLocalToolScheduler(new AbortController().signal)
    let resume!: () => void
    const gate = new Promise<void>((resolve) => {
      resume = resolve
    })
    const events: string[] = []
    const read = schedule('independent', async () => {
      events.push('read')
      await gate
    })
    const unknown = schedule(undefined, async () => {
      events.push('unknown')
      throw new Error('Invalid input')
    })
    const rejected = expect(unknown).rejects.toThrow('Invalid input')
    const after = schedule('independent', async () => {
      events.push('after')
    })
    await Promise.resolve()
    await Promise.resolve()
    expect(events).toEqual(['read'])
    resume()
    await Promise.all([read, rejected, after])
    expect(events).toEqual(['read', 'unknown', 'after'])
  })

  it('overlaps adjacent read-only analyses but serializes writes and subsequent reads', async () => {
    const controller = new AbortController()
    const schedule = createLocalToolScheduler(controller.signal)
    const events: string[] = []
    let finish!: () => void
    const gate = new Promise<void>((resolve) => {
      finish = resolve
    })
    const first = schedule('independent', async () => {
      events.push('read1')
      await gate
      events.push('end1')
    })
    const second = schedule('independent', async () => {
      events.push('read2')
      await gate
      events.push('end2')
    })
    const write = schedule('exclusive', async () => {
      events.push('write')
    })
    const after = schedule('independent', async () => {
      events.push('after')
    })
    await Promise.resolve()
    await Promise.resolve()
    expect(events).toEqual(['read1', 'read2'])
    finish()
    await Promise.all([first, second, write, after])
    expect(events).toEqual(['read1', 'read2', 'end1', 'end2', 'write', 'after'])
  })
  it('does not start queued work after cancellation', async () => {
    const controller = new AbortController(),
      schedule = createLocalToolScheduler(controller.signal)
    let finish!: () => void
    const first = schedule(
      'exclusive',
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    )
    let writes = 0
    const next = schedule('exclusive', async () => {
      writes++
    })
    const rejected = expect(next).rejects.toThrow()
    await Promise.resolve()
    await Promise.resolve()
    controller.abort()
    finish()
    await first
    await rejected
    expect(writes).toBe(0)
  })
})
