import { describe, expect, it } from 'vitest'
import { memoryStore, setup } from './fixtures/recipe-host.js'
describe('durable recipe reuse', () => {
  it('separates completed execution from save failure and retries storage only', async () => {
    const { store } = memoryStore()
    const host = setup(store)
    expect(host.register().ok).toBe(true)
    const receipt = await host.runner.invoke({
      name: 'reusable',
      requestId: 'author',
      input: 4
    })
    const write = store.write
    store.write = async () => {
      throw new Error('Disk unavailable')
    }
    expect(
      await host.persistence.save({
        name: 'reusable',
        revision: 1,
        requestId: 'author',
        receipt
      })
    ).toMatchObject({ status: 'unsaved' })
    expect(host.registry.get('reusable')).toBeUndefined()
    store.write = write
    expect(
      await host.persistence.save({
        name: 'reusable',
        revision: 1,
        requestId: 'author',
        receipt
      })
    ).toMatchObject({ status: 'saved', availability: 'eligible' })
    expect(host.writes).toEqual([4])
    expect(host.registry.get('reusable')).toBeDefined()
  })

  it('reloads a saved eligible definition without executing and uses fresh arguments', async () => {
    const { store, entries } = memoryStore()
    const first = setup(store)
    first.register()
    const receipt = await first.runner.invoke({
      name: 'reusable',
      requestId: 'author',
      input: 4
    })
    await first.persistence.save({
      name: 'reusable',
      revision: 1,
      requestId: 'author',
      receipt
    })
    const persisted = JSON.stringify([...entries.values()])
    expect(persisted).not.toContain('author')
    expect(persisted).not.toContain('"value":4')
    const second = setup(store)
    expect(await second.persistence.load('new-request')).toMatchObject({
      loaded: ['reusable'],
      unavailable: []
    })
    expect(second.writes).toEqual([])
    expect(
      await second.runner.invoke({
        name: 'reusable',
        requestId: 'new-request',
        input: 9
      })
    ).toMatchObject({ status: 'success', value: 9 })
    expect(second.writes).toEqual([9])
  })

  it('keeps saved candidates and fabricated receipts ineligible', async () => {
    const { store } = memoryStore()
    const first = setup(store)
    first.register()
    expect(
      await first.persistence.save({
        name: 'reusable',
        revision: 1,
        requestId: 'author'
      })
    ).toMatchObject({ status: 'saved', availability: 'candidate' })
    expect(
      await first.persistence.save({
        name: 'reusable',
        revision: 1,
        requestId: 'author',
        receipt: {
          status: 'success',
          settlement: 'completed',
          calls: [],
          issues: []
        }
      })
    ).toMatchObject({ status: 'unsaved' })
    const second = setup(store)
    expect(await second.persistence.load('new')).toMatchObject({
      loaded: [],
      unavailable: [expect.objectContaining({ reason: 'candidate' })]
    })
    expect(second.registry.get('reusable')).toBeUndefined()
  })

  it('isolates corrupt records and suspends definitions with changed dependencies', async () => {
    const { store, entries } = memoryStore()
    const first = setup(store)
    first.register()
    const receipt = await first.runner.invoke({
      name: 'reusable',
      requestId: 'author',
      input: 4
    })
    await first.persistence.save({
      name: 'reusable',
      revision: 1,
      requestId: 'author',
      receipt
    })
    entries.set('corrupt', {
      key: 'corrupt',
      version: 'x',
      record: { format: 99 }
    })
    const second = setup(store)
    const primitive = second.registry.get('set')
    if (!primitive) throw new Error('Missing primitive')
    second.registry.register(
      { ...primitive, revision: 2 },
      { expectedRevision: 1 }
    )
    const result = await second.persistence.load('new')
    expect(result.loaded).toEqual([])
    expect(result.unavailable).toHaveLength(2)
    expect(second.writes).toEqual([])
  })

  it('does not trust a store acknowledgement for different bytes', async () => {
    const { store } = memoryStore()
    const host = setup(store)
    host.register()
    const receipt = await host.runner.invoke({
      name: 'reusable',
      requestId: 'author',
      input: 4
    })
    store.write = async () => ({ key: 'wrong', version: 'x', record: {} })
    expect(
      await host.persistence.save({
        name: 'reusable',
        revision: 1,
        requestId: 'author',
        receipt
      })
    ).toMatchObject({ status: 'unsaved' })
    expect(host.registry.get('reusable')).toBeUndefined()
  })

  it('disables future discovery durably and never revives retired versions on reload', async () => {
    const { store } = memoryStore()
    const host = setup(store)
    host.register()
    const receipt = await host.runner.invoke({
      name: 'reusable',
      requestId: 'author',
      input: 4
    })
    await host.persistence.save({
      name: 'reusable',
      revision: 1,
      requestId: 'author',
      receipt
    })
    expect(
      await host.persistence.setState('reusable', 1, 'retired')
    ).toMatchObject({ status: 'saved' })
    expect(host.registry.get('reusable')).toBeUndefined()
    const second = setup(store)
    expect((await second.persistence.load('new')).loaded).toEqual([])
    expect(
      await host.persistence.save({
        name: 'reusable',
        revision: 1,
        requestId: 'author',
        receipt
      })
    ).toMatchObject({ status: 'unsaved' })
  })
})

it('rejects omitted dependency evidence without leaving a half-registered candidate', async () => {
  const { store, entries } = memoryStore()
  const first = setup(store)
  first.register()
  const receipt = await first.runner.invoke({
    name: 'reusable',
    requestId: 'author',
    input: 4
  })
  await first.persistence.save({
    name: 'reusable',
    revision: 1,
    requestId: 'author',
    receipt
  })
  const original = [...entries.values()][0]
  const record = original.record as Record<
    string,
    import('../types.js').AiJsonValue
  >
  entries.set(original.key, {
    ...original,
    record: { ...record, dependencies: [] }
  })
  const second = setup(store)
  const result = await second.persistence.load('new')
  expect(result.loaded).toEqual([])
  expect(second.registry.get('reusable', { requestId: 'new' })).toBeUndefined()
  entries.set(original.key, original)
  expect((await second.persistence.load('new')).loaded).toEqual(['reusable'])
})

it('preserves a durable save acknowledgement when its author request has already ended', async () => {
  const { store } = memoryStore()
  const host = setup(store)
  host.register()
  const receipt = await host.runner.invoke({
    name: 'reusable',
    requestId: 'author',
    input: 4
  })
  const write = store.write
  store.write = async (input) => {
    const ack = await write(input)
    host.library.releaseRequest('author')
    return ack
  }
  expect(
    await host.persistence.save({
      name: 'reusable',
      revision: 1,
      requestId: 'author',
      receipt
    })
  ).toMatchObject({ status: 'saved' })
  const next = setup(store)
  expect((await next.persistence.load('next')).loaded).toEqual(['reusable'])
})

it('rechecks a listed version before publishing it after concurrent retirement', async () => {
  const { store } = memoryStore()
  const first = setup(store)
  first.register()
  const receipt = await first.runner.invoke({
    name: 'reusable',
    requestId: 'author',
    input: 4
  })
  await first.persistence.save({
    name: 'reusable',
    revision: 1,
    requestId: 'author',
    receipt
  })
  const list = store.list
  store.list = async (limit) => {
    const snapshot = await list(limit)
    await first.persistence.setState('reusable', 1, 'retired')
    return snapshot
  }
  const second = setup(store)
  expect((await second.persistence.load('new')).loaded).toEqual([])
  expect(second.registry.get('reusable')).toBeUndefined()
})

it('recovers a lost durable acknowledgement by reading the exact saved bytes, without repeating execution', async () => {
  const { store } = memoryStore()
  const host = setup(store)
  host.register()
  const receipt = await host.runner.invoke({
    name: 'reusable',
    requestId: 'author',
    input: 4
  })
  const write = store.write
  store.write = async (input) => {
    await write(input)
    throw new Error('Acknowledgement lost')
  }
  expect(
    (
      await host.persistence.save({
        name: 'reusable',
        revision: 1,
        requestId: 'author',
        receipt
      })
    ).status
  ).toBe('unsaved')
  store.write = write
  expect(
    (
      await host.persistence.save({
        name: 'reusable',
        revision: 1,
        requestId: 'author',
        receipt
      })
    ).status
  ).toBe('saved')
  expect(write).toHaveBeenCalledTimes(1)
  expect(host.writes).toEqual([4])
})

it('revokes a private saved candidate in the author request immediately', async () => {
  const { store } = memoryStore()
  const host = setup(store)
  host.register()
  await host.persistence.save({
    name: 'reusable',
    revision: 1,
    requestId: 'author'
  })
  expect(
    await host.persistence.setState('reusable', 1, 'retired')
  ).toMatchObject({ status: 'saved' })
  expect(host.registry.get('reusable', { requestId: 'author' })).toBeUndefined()
  expect(
    await host.runner.invoke({
      name: 'reusable',
      requestId: 'author',
      input: 7
    })
  ).toMatchObject({ status: 'failed', settlement: 'not-started' })
  expect(host.writes).toEqual([])
})

it('does not restore an older revision when a newer saved identity is corrupt', async () => {
  const { store, entries } = memoryStore()
  const first = setup(store)
  first.register()
  const receipt = await first.runner.invoke({
    name: 'reusable',
    requestId: 'author',
    input: 3
  })
  await first.persistence.save({
    name: 'reusable',
    revision: 1,
    requestId: 'author',
    receipt
  })
  entries.set('["reusable",2]', {
    key: '["reusable",2]',
    version: 'newer',
    record: { format: 99 }
  })
  const next = setup(store)
  const result = await next.persistence.load('new')
  expect(result.loaded).toEqual([])
  expect(next.registry.get('reusable')).toBeUndefined()
})

it('does not publish a partial inventory whose newest revisions may be omitted', async () => {
  const { store, entries } = memoryStore()
  const first = setup(store)
  first.register()
  const receipt = await first.runner.invoke({
    name: 'reusable',
    requestId: 'author',
    input: 3
  })
  await first.persistence.save({
    name: 'reusable',
    revision: 1,
    requestId: 'author',
    receipt
  })
  for (let i = 0; i < 32; i++)
    entries.set(`extra${i}`, { key: `extra${i}`, version: '1', record: null })
  const next = setup(store)
  expect(await next.persistence.load('new')).toMatchObject({
    loaded: [],
    truncated: true
  })
  expect(next.registry.get('reusable')).toBeUndefined()
})

it('explicitly resumes a saved candidate for a fresh request without execution', async () => {
  const { store } = memoryStore()
  const first = setup(store)
  first.register()
  await first.persistence.save({
    name: 'reusable',
    revision: 1,
    requestId: 'author'
  })
  const next = setup(store)
  expect(
    await next.persistence.resume({
      name: 'reusable',
      revision: 1,
      requestId: 'next'
    })
  ).toMatchObject({ ok: true })
  expect(next.registry.get('reusable')).toBeUndefined()
  expect(next.registry.get('reusable', { requestId: 'next' })).toBeDefined()
  expect(next.writes).toEqual([])
  expect(
    await next.runner.invoke({ name: 'reusable', requestId: 'next', input: 8 })
  ).toMatchObject({ status: 'success', value: 8 })
})

it('repeats candidate resume without registering again or changing its submission', async () => {
  const { store } = memoryStore()
  const first = setup(store)
  first.register()
  await first.persistence.save({
    name: 'reusable',
    revision: 1,
    requestId: 'author'
  })
  const next = setup(store)
  const input = { name: 'reusable', revision: 1, requestId: 'next' }
  const result = await next.persistence.resume(input)
  expect(result.ok).toBe(true)
  expect(await next.persistence.resume(input)).toEqual(result)
  expect(next.writes).toEqual([])
})
