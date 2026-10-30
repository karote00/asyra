import { describe, expect, it, vi } from 'vitest'
import {
  createRecordDeliverySink,
  createRecordDeliveryHost,
  recoverRecordDelivery
} from '../profiler/record-delivery'
import { createRecordCollector } from '../node/record-collector'
import type { ExecutionRecord, ExecutionRecordSink } from '../profiler/records'

const record = (
  sequence: number,
  event = 'ai_request_trace'
): ExecutionRecord => ({
  event,
  schemaVersion: 2,
  requestId: 'request-a',
  sequence
})
const harness = () => {
  const records: ExecutionRecord[] = []
  const flush = vi.fn(async () => ({ status: 'saved' as const, path: null }))
  const sink: ExecutionRecordSink = {
    checkpoint: async () => ({ status: 'saved', path: null }),
    write: (value) => {
      records.push(value)
    },
    flush
  }
  return {
    records,
    flush,
    collector: createRecordCollector({ createSink: () => sink })
  }
}

const memoryOutbox = () => {
  const entries = new Map<string, ExecutionRecord[]>()
  const gaps = new Map<
    string,
    | {
        requestId: string
        fromSequence: number
        throughSequence: number
        stage: 'capture' | 'storage' | 'mixed'
      }
    | undefined
  >()
  return {
    reserve: async (requestId: string) => {
      if (!gaps.has(requestId)) {
        gaps.set(requestId, undefined)
      }
    },
    recordGap: async (gap: {
      requestId: string
      fromSequence: number
      throughSequence: number
      stage: 'capture' | 'storage' | 'mixed'
    }) => {
      gaps.set(gap.requestId, gap)
    },
    gap: async (requestId: string) => gaps.get(requestId),
    append: async (values: readonly ExecutionRecord[]) => {
      for (const value of values) {
        const records = entries.get(value.requestId) ?? []
        records[value.sequence] = structuredClone(value)
        entries.set(value.requestId, records)
      }
    },
    read: async (requestId: string, from: number, limit: number) =>
      structuredClone((entries.get(requestId) ?? []).slice(from, from + limit)),
    remove: async (requestId: string) => {
      entries.delete(requestId)
      gaps.delete(requestId)
    },
    requests: async () => [...new Set([...entries.keys(), ...gaps.keys()])]
  }
}

it('retains a complete stream offline and recovers it after the producer is recreated', async () => {
  const outbox = memoryOutbox()
  const sink = createRecordDeliverySink({
    outbox,
    send: async () => {
      throw new Error('offline')
    }
  })
  sink.write(record(0, 'ai_request_started'))
  sink.write(record(1))
  sink.write(record(2, 'ai_request_usage'))
  expect(await sink.flush()).toMatchObject({ status: 'failed' })
  expect(
    (await outbox.read('request-a', 0, 32)).map((item) => item.sequence)
  ).toEqual([0, 1, 2])
  const { collector, records } = harness()
  await recoverRecordDelivery({
    outbox,
    send: (batch) => collector.accept(batch)
  })
  expect(await outbox.requests()).toEqual([])
  expect(records.map((item) => item.sequence)).toEqual([0, 1, 2])
  await collector.dispose()
})

it('does not delete persisted evidence for an acknowledgement from another request', async () => {
  const outbox = memoryOutbox()
  const sink = createRecordDeliverySink({
    outbox,
    send: async () => ({
      complete: true,
      requestId: 'other',
      acknowledgedSequence: 1
    })
  })
  sink.write(record(0, 'ai_request_started'))
  sink.write(record(1, 'ai_request_usage'))
  expect(await sink.flush()).toMatchObject({ status: 'failed' })
  expect(await outbox.requests()).toEqual(['request-a'])
})

it('reports durable storage failure without an unhandled rejection or a network claim', async () => {
  const outbox = memoryOutbox()
  const send = vi.fn(async () => ({
    complete: true,
    requestId: 'request-a',
    acknowledgedSequence: 0
  }))
  outbox.append = async () => {
    throw new Error('quota exceeded')
  }
  const sink = createRecordDeliverySink({ outbox, send })
  sink.write(record(0, 'ai_request_started'))
  expect(await sink.flush()).toMatchObject({ status: 'failed' })
  expect(send).not.toHaveBeenCalled()
})

describe('independent request record delivery', () => {
  it('waits for a durable checkpoint before acknowledging a nonterminal batch', async () => {
    let release!: () => void
    const durable = new Promise<void>((resolve) => {
      release = resolve
    })
    const checkpoint = vi.fn(async () => {
      await durable
      return { status: 'saved' as const, path: null }
    })
    const collector = createRecordCollector({
      createSink: () => ({
        write: () => undefined,
        checkpoint,
        flush: async () => ({ status: 'saved' as const, path: null })
      })
    })
    let acknowledged = false
    const accepting = collector
      .accept([record(0, 'ai_request_started')])
      .then((value) => {
        acknowledged = true
        return value
      })
    await new Promise((resolve) => setTimeout(resolve, 0))
    try {
      expect(checkpoint).toHaveBeenCalledOnce()
      expect(acknowledged).toBe(false)
    } finally {
      release()
      await accepting
      await collector.dispose()
    }
  })
  it('retries a lost acknowledgement without duplicating records, including the final marker', async () => {
    const { collector, records, flush } = harness()
    let loseAcknowledgement = true
    const sink = createRecordDeliverySink({
      outbox: memoryOutbox(),
      send: async (batch) => {
        const receipt = await collector.accept(batch)
        if (loseAcknowledgement) {
          loseAcknowledgement = false
          throw new Error('lost ack')
        }
        return receipt
      }
    })
    sink.write(record(0, 'ai_request_started'))
    sink.write(record(1))
    sink.write(record(2, 'ai_request_usage'))
    expect(await sink.flush()).toMatchObject({ status: 'saved' })
    expect(records.map((value) => value.sequence)).toEqual([0, 1, 2])
    expect(flush).toHaveBeenCalledTimes(1)
    await collector.dispose()
  })

  it('does not certify a missing sequence or a missing terminal marker', async () => {
    const { collector, records, flush } = harness()
    await collector.accept([record(0, 'ai_request_started')])
    await expect(
      collector.accept([record(2, 'ai_request_usage')])
    ).rejects.toThrow('sequence')
    expect(flush).not.toHaveBeenCalled()
    await collector.dispose()
    expect(records.map((value) => value.event)).toEqual(['ai_request_started'])
    expect(flush).toHaveBeenCalledTimes(1)
  })

  it('rejects a changed retry and new events after a terminal record', async () => {
    const { collector } = harness()
    await collector.accept([
      record(0, 'ai_request_started'),
      record(1, 'ai_request_usage')
    ])
    await expect(
      collector.accept([{ ...record(0, 'ai_request_started'), changed: true }])
    ).rejects.toThrow('retry')
    await expect(collector.accept([record(2)])).rejects.toThrow('terminal')
    await collector.dispose()
  })

  it('bounds undelivered data and reports transport failure without blocking product work', async () => {
    const sink = createRecordDeliverySink({
      maxPendingBytes: 50,
      outbox: memoryOutbox(),
      send: async () => ({
        complete: false,
        requestId: 'request-a',
        acknowledgedSequence: 0
      })
    })
    expect(() => sink.write(record(0))).toThrow('capacity')
    expect(await sink.flush()).toMatchObject({ status: 'failed' })
  })
})

it('expires abandoned producers without generating a successful terminal record', async () => {
  let now = 0
  const saved: ExecutionRecord[] = []
  const flush = vi.fn(async () => ({ status: 'saved' as const, path: null }))
  const collector = createRecordCollector({
    now: () => now,
    retentionMs: 1000,
    maxRequests: 1,
    createSink: () => ({
      checkpoint: async () => ({ status: 'saved', path: null }),
      write: (value) => {
        saved.push(value)
      },
      flush
    })
  })
  try {
    await collector.accept([record(0, 'ai_request_started')])
    now = 1001
    await expect(
      collector.accept([record(1, 'ai_request_usage')])
    ).rejects.toThrow('initial')
    expect(flush).toHaveBeenCalledTimes(1)
    expect(saved.map((value) => value.event)).toEqual(['ai_request_started'])
  } finally {
    await collector.dispose()
  }
})

it('reports a bounded transport failure reason with the failed sequence range', async () => {
  const onIssue = vi.fn()
  const sink = createRecordDeliverySink({
    outbox: memoryOutbox(),
    onIssue,
    send: async () => {
      throw new Error('HTTP 400 AI_RECORD_MISSING_SEQUENCE')
    }
  })
  sink.write(record(0, 'ai_request_started'))
  sink.write(record(1, 'ai_request_usage'))
  await sink.flush()
  expect(onIssue).toHaveBeenCalledWith(
    expect.objectContaining({
      stage: 'transport',
      requestId: 'request-a',
      fromSequence: 0,
      throughSequence: 1,
      reason: 'HTTP 400 AI_RECORD_MISSING_SEQUENCE'
    })
  )
})

it('drains diagnostic persistence before host disposal without repeating product work', async () => {
  const outbox = memoryOutbox()
  let release!: () => void
  const barrier = new Promise<void>((resolve) => {
    release = resolve
  })
  const append = outbox.append
  outbox.append = async (item) => {
    await barrier
    await append(item)
  }
  const { collector, records } = harness()
  const host = createRecordDeliveryHost({
    outbox,
    send: (batch) => collector.accept(batch)
  })
  const sink = host.createSink()
  sink.write(record(0, 'ai_request_started'))
  sink.write(record(1, 'ai_request_usage'))
  let disposed = false
  const disposing = host.dispose().then(() => {
    disposed = true
  })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(disposed).toBe(false)
  release()
  await disposing
  expect(records).toHaveLength(2)
  expect(await outbox.requests()).toEqual([])
  expect(() => host.createSink()).toThrow('closed')
  await collector.dispose()
})

it('resumes an active producer on reconnect without resending its acknowledged prefix', async () => {
  const outbox = memoryOutbox()
  const { collector } = harness()
  let offline = false
  const send = vi.fn(async (batch: readonly ExecutionRecord[]) => {
    if (offline) {
      throw new Error('offline')
    }
    return collector.accept(batch)
  })
  const host = createRecordDeliveryHost({ outbox, send })
  const sink = host.createSink()
  sink.write(record(0, 'ai_request_started'))
  await host.recover()
  offline = true
  sink.write(record(1))
  await host.recover()
  offline = false
  await host.recover()
  sink.write(record(2, 'ai_request_usage'))
  await sink.flush()
  expect(
    send.mock.calls.filter(([batch]) => batch[0].sequence === 0)
  ).toHaveLength(1)
  expect(await outbox.requests()).toEqual([])
  await host.dispose()
  await collector.dispose()
})

it('does not recover a producer admitted while persisted requests are being enumerated', async () => {
  const outbox = memoryOutbox()
  let release!: () => void
  let enumerating!: () => void
  const started = new Promise<void>((resolve) => {
    enumerating = resolve
  })
  const enumeration = new Promise<void>((resolve) => {
    release = resolve
  })
  const originalRequests = outbox.requests
  outbox.requests = async () => {
    enumerating()
    await enumeration
    return originalRequests()
  }
  const sent: number[] = []
  const host = createRecordDeliveryHost({
    outbox,
    send: async (batch) => {
      sent.push(...batch.map((entry) => entry.sequence))
      const last = batch[batch.length - 1]
      if (!last) {
        throw new Error('Expected a nonempty record batch')
      }
      return {
        requestId: 'request-a',
        acknowledgedSequence: last.sequence,
        complete: false
      }
    }
  })
  const recovering = host.recover()
  await started
  const sink = host.createSink()
  sink.write(record(0, 'ai_request_started'))
  await vi.waitFor(() => expect(sent).toEqual([0]))
  release()
  await recovering
  expect(sent).toEqual([0])
  await host.dispose()
})

it('retains a durable storage gap and refuses completion after restarting delivery', async () => {
  const outbox = memoryOutbox()
  const append = outbox.append
  outbox.append = async (value) => {
    if (value.some((record) => record.sequence === 1)) {
      throw new Error('quota exceeded')
    }
    await append(value)
  }
  const send = vi.fn(async () => ({
    requestId: 'request-a',
    acknowledgedSequence: 2,
    complete: true
  }))
  const sink = createRecordDeliverySink({ outbox, send })
  sink.write(record(0, 'ai_request_started'))
  sink.write(record(1))
  sink.write(record(2, 'ai_request_usage'))
  expect(await sink.flush()).toMatchObject({ status: 'failed' })
  expect(await outbox.gap('request-a')).toMatchObject({
    fromSequence: 0,
    throughSequence: 2,
    stage: 'storage'
  })
  const onIssue = vi.fn()
  expect(await recoverRecordDelivery({ outbox, send, onIssue })).toEqual({
    complete: false
  })
  expect(onIssue).toHaveBeenCalledWith(
    expect.objectContaining({
      fromSequence: 0,
      throughSequence: 2,
      reason: expect.stringContaining('gap')
    })
  )
  expect(send).not.toHaveBeenCalled()
})

it('reserves control capacity for a first-record capture refusal', async () => {
  const outbox = memoryOutbox()
  const sink = createRecordDeliverySink({
    outbox,
    maxPendingBytes: 1,
    send: async () => {
      throw new Error('No send')
    }
  })
  expect(() => sink.write(record(0, 'ai_request_started'))).toThrow('capacity')
  expect(await sink.flush()).toMatchObject({ status: 'failed' })
  expect(await outbox.gap('request-a')).toMatchObject({
    fromSequence: 0,
    throughSequence: 0,
    stage: 'capture'
  })
  expect(await outbox.requests()).toEqual(['request-a'])
})

it('coalesces a burst of refused captures into bounded control work', async () => {
  const outbox = memoryOutbox()
  outbox.reserve = vi.fn(outbox.reserve)
  outbox.recordGap = vi.fn(outbox.recordGap)
  const sink = createRecordDeliverySink({
    outbox,
    maxPendingBytes: 1,
    send: async () => {
      throw new Error('No send')
    }
  })
  for (let sequence = 0; sequence < 100; sequence++) {
    expect(() => sink.write(record(sequence))).toThrow('capacity')
  }
  await sink.flush()
  expect(outbox.reserve).toHaveBeenCalledOnce()
  expect(outbox.recordGap).toHaveBeenCalledOnce()
  expect(await outbox.gap('request-a')).toMatchObject({
    fromSequence: 0,
    throughSequence: 99
  })
})

it.each(['reserve', 'recordGap'] as const)(
  'reports failure of %s without claiming lossless recovery',
  async (method) => {
    const outbox = memoryOutbox()
    outbox[method] = async () => {
      throw new Error('Quota exceeded')
    }
    const onIssue = vi.fn()
    const sink = createRecordDeliverySink({
      outbox,
      onIssue,
      maxPendingBytes: 1,
      send: async () => {
        throw new Error('No send')
      }
    })
    expect(() => sink.write(record(0))).toThrow('capacity')
    expect(await sink.flush()).toMatchObject({ status: 'failed' })
    expect(onIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'storage',
        reason: expect.stringContaining('Gap metadata could not be persisted')
      })
    )
  }
)

it('persists bursts in bounded atomic batches without increasing capture capacity', async () => {
  const outbox = memoryOutbox()
  const append = vi.fn(outbox.append)
  outbox.append = append
  const target = harness()
  const sink = createRecordDeliverySink({
    outbox,
    send: (records) => target.collector.accept(records)
  })
  for (let i = 0; i < 1024; i++) {
    let event = 'ai_request_trace'
    if (i === 0) {
      event = 'ai_request_started'
    }
    if (i === 1023) {
      event = 'ai_request_usage'
    }
    sink.write(record(i, event))
  }
  expect(await sink.flush()).toMatchObject({ status: 'saved' })
  expect(append.mock.calls.length).toBeLessThanOrEqual(32)
  expect(target.records.map((item) => item.sequence)).toEqual(
    Array.from({ length: 1024 }, (_, i) => i)
  )
})

it('delivers a durable prefix while the next storage batch is still pending', async () => {
  const outbox = memoryOutbox()
  const append = outbox.append
  let release!: () => void
  const blocked = new Promise<void>((resolve) => {
    release = resolve
  })
  let batches = 0
  outbox.append = async (records) => {
    if (++batches === 2) {
      await blocked
    }
    await append(records)
  }
  const target = harness()
  const sent: number[] = []
  const sink = createRecordDeliverySink({
    outbox,
    send: async (records) => {
      sent.push(...records.map((item) => item.sequence))
      return target.collector.accept(records)
    }
  })
  for (let i = 0; i < 64; i++) {
    let event = 'ai_request_trace'
    if (i === 0) {
      event = 'ai_request_started'
    }
    if (i === 63) {
      event = 'ai_request_usage'
    }
    sink.write({ ...record(i, event), detail: 'x'.repeat(8080) })
  }
  try {
    await vi.waitFor(() =>
      expect(sent).toEqual(Array.from({ length: 32 }, (_, i) => i))
    )
  } finally {
    release()
  }
  expect(await sink.flush()).toMatchObject({ status: 'saved' })
  expect(sent).toEqual(Array.from({ length: 64 }, (_, i) => i))
})

it('persists sustained bursts by bytes without overflowing the unchanged capture budget', async () => {
  vi.useFakeTimers()
  const outbox = memoryOutbox()
  const append = outbox.append
  const batches: number[] = []
  outbox.append = async (records) => {
    batches.push(Buffer.byteLength(JSON.stringify(records)))
    await new Promise((resolve) => setTimeout(resolve, 10))
    await append(records)
  }
  const target = harness()
  const onIssue = vi.fn()
  const sink = createRecordDeliverySink({
    outbox,
    onIssue,
    send: (rows) => target.collector.accept(rows)
  })
  let rejected = 0
  try {
    for (let burst = 0; burst < 48; burst++) {
      for (let item = 0; item < 128; item++) {
        const sequence = burst * 128 + item
        try {
          sink.write({
            ...record(
              sequence,
              sequence ? 'ai_request_trace' : 'ai_request_started'
            ),
            detail: 'x'.repeat(900)
          })
        } catch {
          rejected++
        }
      }
      await vi.advanceTimersByTimeAsync(10)
    }
    sink.write(record(6144, 'ai_request_usage'))
    const flushed = sink.flush()
    await vi.advanceTimersByTimeAsync(3000)
    expect(await flushed).toMatchObject({ status: 'saved' })
    expect(rejected).toBe(0)
    expect(onIssue).not.toHaveBeenCalled()
    expect(batches.length).toBeLessThanOrEqual(52)
    expect(Math.max(...batches)).toBeLessThanOrEqual(256 * 1024)
    expect(target.records).toHaveLength(6145)
  } finally {
    await target.collector.dispose()
    vi.useRealTimers()
  }
})

it('keeps later persistence batches contiguous after a capture gap', async () => {
  const outbox = memoryOutbox()
  const append = outbox.append
  const batches: number[][] = []
  outbox.append = async (records) => {
    const sequences = records.map((item) => item.sequence)
    expect(sequences).toEqual(sequences.map((_, index) => sequences[0] + index))
    batches.push(sequences)
    await append(records)
  }
  const sink = createRecordDeliverySink({
    outbox,
    maxPendingBytes: 500,
    send: async () => {
      throw new Error('Offline')
    }
  })
  sink.write(record(0, 'ai_request_started'))
  sink.write(record(1))
  expect(() => sink.write({ ...record(2), detail: 'x'.repeat(1000) })).toThrow(
    'capacity'
  )
  sink.write(record(3))
  expect(await sink.flush()).toMatchObject({ status: 'failed' })
  expect(batches).toEqual([[0, 1], [3]])
  expect(await outbox.gap('request-a')).toMatchObject({
    fromSequence: 2,
    throughSequence: 2,
    stage: 'capture'
  })
})
