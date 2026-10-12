import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
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
