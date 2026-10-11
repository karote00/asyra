import { describe, expect, it, vi } from 'vitest'
import { createRecordDeliverySink } from '../profiler/record-delivery'
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

describe('independent request record delivery', () => {
  it('retries a lost acknowledgement without duplicating records, including the final marker', async () => {
    const { collector, records, flush } = harness()
    let loseAcknowledgement = true
    const sink = createRecordDeliverySink({
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
      send: async () => ({ complete: false })
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
