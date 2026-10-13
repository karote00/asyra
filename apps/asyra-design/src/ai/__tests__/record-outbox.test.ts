import {
  createRecordDeliverySink,
  recoverRecordDelivery
} from '@asyra/ai-agent-runtime'
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import { createBrowserRecordOutbox } from '../record-outbox'

const record = (requestId: string, sequence: number) => ({
  event: sequence ? 'ai_request_trace' : 'ai_request_started',
  schemaVersion: 2,
  requestId,
  sequence
})

describe('browser diagnostic outbox', () => {
  it('retains detached records after closing and reopening the host', async () => {
    const factory = new IDBFactory()
    const first = createBrowserRecordOutbox({ factory, keyRange: IDBKeyRange })
    const item = record('request-a', 0)
    await first.append(item)
    item.event = 'changed'
    await first.close()
    const reopened = createBrowserRecordOutbox({
      factory,
      keyRange: IDBKeyRange
    })
    expect(await reopened.requests()).toEqual(['request-a'])
    expect(await reopened.read('request-a', 0, 32)).toEqual([
      record('request-a', 0)
    ])
    await reopened.close()
  })

  it('reads bounded sequence pages and removes only the acknowledged stream', async () => {
    const outbox = createBrowserRecordOutbox({
      factory: new IDBFactory(),
      keyRange: IDBKeyRange
    })
    for (const item of [
      record('a', 0),
      record('a', 1),
      record('a', 2),
      record('b', 0)
    ])
      await outbox.append(item)
    expect(await outbox.read('a', 1, 1)).toEqual([record('a', 1)])
    await outbox.remove('a')
    expect(await outbox.requests()).toEqual(['b'])
    expect(await outbox.read('b', 0, 32)).toEqual([record('b', 0)])
    await outbox.close()
  })

  it('rejects duplicate capture without replacing prior evidence', async () => {
    const outbox = createBrowserRecordOutbox({
      factory: new IDBFactory(),
      keyRange: IDBKeyRange
    })
    await outbox.append(record('a', 0))
    await expect(
      outbox.append({ ...record('a', 0), event: 'changed' })
    ).rejects.toThrow()
    expect(await outbox.read('a', 0, 32)).toEqual([record('a', 0)])
    await outbox.close()
  })

  it('does not reopen a disposed host', async () => {
    const outbox = createBrowserRecordOutbox({
      factory: new IDBFactory(),
      keyRange: IDBKeyRange
    })
    await outbox.close()
    await expect(outbox.append(record('a', 0))).rejects.toThrow('closed')
  })
})

describe('durable diagnostic gaps', () => {
  it('keeps reserved gap metadata across reopen and excludes control from payload reads', async () => {
    const factory = new IDBFactory()
    const first = createBrowserRecordOutbox({ factory, keyRange: IDBKeyRange })
    await first.reserve('gap-request')
    await first.append(record('gap-request', 0))
    await first.recordGap({
      requestId: 'gap-request',
      fromSequence: 1,
      throughSequence: 2,
      stage: 'storage'
    })
    await first.recordGap({
      requestId: 'gap-request',
      fromSequence: 8,
      throughSequence: 9,
      stage: 'capture'
    })
    await first.reserve('gap-request')
    await first.close()
    const second = createBrowserRecordOutbox({ factory, keyRange: IDBKeyRange })
    expect(await second.gap('gap-request')).toEqual({
      requestId: 'gap-request',
      fromSequence: 1,
      throughSequence: 9,
      stage: 'mixed'
    })
    expect(await second.read('gap-request', 0, 32)).toEqual([
      record('gap-request', 0)
    ])
    expect(await second.requests()).toEqual(['gap-request'])
    await second.remove('gap-request')
    expect(await second.gap('gap-request')).toBeUndefined()
    expect(await second.requests()).toEqual([])
    await second.close()
  })

  it('keeps control-only requests discoverable and refuses payload collisions', async () => {
    const outbox = createBrowserRecordOutbox({
      factory: new IDBFactory(),
      keyRange: IDBKeyRange
    })
    await outbox.reserve('control-only')
    await expect(outbox.append(record('control-only', -1))).rejects.toThrow(
      'sequence'
    )
    await outbox.recordGap({
      requestId: 'control-only',
      fromSequence: 0,
      throughSequence: 0,
      stage: 'capture'
    })
    expect(await outbox.read('control-only', 0, 32)).toEqual([])
    expect(await outbox.requests()).toEqual(['control-only'])
    await outbox.remove('control-only')
    expect(await outbox.requests()).toEqual([])
    await outbox.close()
  })
})

it('replaces reserved padding with bounded loss metadata without growing the control record', async () => {
  const added = vi.spyOn(IDBObjectStore.prototype, 'add')
  const put = vi.spyOn(IDBObjectStore.prototype, 'put')
  const outbox = createBrowserRecordOutbox({
    factory: new IDBFactory(),
    keyRange: IDBKeyRange
  })
  try {
    await outbox.reserve('reserved')
    const initial = added.mock.calls.find(
      ([value]) => value.sequence === -1
    )?.[0]
    if (!initial) throw new Error('Missing control reservation')
    await outbox.recordGap({
      requestId: 'reserved',
      fromSequence: 0,
      throughSequence: Number.MAX_SAFE_INTEGER,
      stage: 'mixed'
    })
    const updated = put.mock.calls[0][0]
    expect(JSON.stringify(updated).length).toBeLessThanOrEqual(
      JSON.stringify(initial).length
    )
    expect(updated.padding.length).toBeGreaterThan(0)
    await expect(outbox.read('reserved', -1, 32)).rejects.toThrow('sequence')
  } finally {
    await outbox.close()
    added.mockRestore()
    put.mockRestore()
  }
})

it('recovers a real browser storage gap after payload quota failure without inventing evidence', async () => {
  const factory = new IDBFactory()
  const outbox = createBrowserRecordOutbox({ factory, keyRange: IDBKeyRange })
  const original = IDBObjectStore.prototype.add
  const add = vi
    .spyOn(IDBObjectStore.prototype, 'add')
    .mockImplementation(function (this: IDBObjectStore, value, key) {
      if (value.sequence === 1)
        throw new DOMException('Payload quota reached', 'QuotaExceededError')
      return original.call(this, value, key)
    })
  const send = vi.fn(async () => ({
    requestId: 'quota',
    acknowledgedSequence: 2,
    complete: true
  }))
  try {
    const sink = createRecordDeliverySink({ outbox, send })
    sink.write(record('quota', 0))
    sink.write(record('quota', 1))
    sink.write({ ...record('quota', 2), event: 'ai_request_usage' })
    expect(await sink.flush()).toMatchObject({ status: 'failed' })
    expect(add.mock.calls[0][0].sequence).toBe(-1)
    await outbox.close()
    const recovered = createBrowserRecordOutbox({
      factory,
      keyRange: IDBKeyRange
    })
    try {
      const onIssue = vi.fn()
      expect(
        await recoverRecordDelivery({ outbox: recovered, send, onIssue })
      ).toEqual({ complete: false })
      expect(await recovered.gap('quota')).toMatchObject({
        fromSequence: 1,
        throughSequence: 1,
        stage: 'storage'
      })
      expect(
        (await recovered.read('quota', 0, 32)).map((item) => item.sequence)
      ).toEqual([0, 2])
      expect(send).not.toHaveBeenCalled()
      expect(onIssue).toHaveBeenCalledWith(
        expect.objectContaining({ reason: expect.stringContaining('gap') })
      )
    } finally {
      await recovered.close()
    }
  } finally {
    await outbox.close()
    add.mockRestore()
  }
})
