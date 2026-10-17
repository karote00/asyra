import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import { createRetainedDesignContext } from '../retained-design-context'

const fixture = (maxBytes?: number) => {
  let change!: () => void
  let workspace = 'workspace'
  let ids = ['a', 'b', 'c']
  const source = {
    getCurrentWorkspaceId: () => workspace,
    getSelectedElementIds: () => ids,
    getElementChildren: () => ({
      available: true,
      elementIds: ids,
      total: ids.length,
      nextOffset: null
    }),
    getElementIdsInBounds: vi.fn(() => ids),
    getElementMetadata: vi.fn((id: string) => ({
      name: id,
      type: 'rectangle',
      parentId: 'workspace',
      lock: false
    })),
    getElementComputedData: vi.fn((id: string) => ({
      x: id.charCodeAt(0),
      y: 0
    }))
  }
  const stop = vi.fn()
  const store = createRetainedDesignContext(
    source,
    (listener) => {
      change = listener
      return stop
    },
    { maxBytes }
  )
  const query = {
    scope: 'region' as const,
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    fields: ['x']
  }
  return {
    store,
    source,
    query,
    stop,
    change: () => change(),
    enter: () => {
      ids = [...ids, 'd']
      change()
    },
    replace: () => {
      workspace = 'other'
    }
  }
}

const fillByteBudget = <T>(read: (index: number) => T): T[] => {
  const values: T[] = []
  for (let index = 0; index < 100; index++) {
    try {
      values.push(read(index))
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toMatch(/capacity/)
      expect(values.length).toBeGreaterThan(0)
      return values
    }
  }
  throw new Error('Expected bounded byte pressure')
}

describe('retained current document queries', () => {
  it('selects once and serves stable pages and explicit columns without repeated property reads', () => {
    const { store, source, query } = fixture()
    const first = store.read({ ...query, limit: 1 })
    const second = store.read({ ...query, offset: 1, limit: 1 })
    expect(first).toMatchObject({
      observation: {
        candidateCount: 3,
        matchedCount: 3,
        metadataReadCount: 3,
        computedReadCount: 3
      }
    })
    expect(second).toMatchObject({
      observation: {
        candidateCount: 0,
        matchedCount: 3,
        metadataReadCount: 0,
        computedReadCount: 0
      }
    })
    expect(second.snapshotId).toBe(first.snapshotId)
    expect(second.elements[0].id).toBe('b')
    expect(source.getElementIdsInBounds).toHaveBeenCalledTimes(1)
    expect(source.getElementComputedData).toHaveBeenCalledTimes(3)
    expect(store.get(first.snapshotId).coordinateSpace).toBe('parent-local')
    store.dispose()
  })
  it.each(['change', 'enter', 'replace'] as const)(
    'rejects consumption after %s, including membership changes outside existing IDs',
    (operation) => {
      const item = fixture()
      const first = item.store.read(item.query)
      item[operation]()
      expect(() => item.store.get(first.snapshotId)).toThrow(/stale/)
      item.store.dispose()
    }
  )
  it('releases references and bounds stored data without silently reselecting', () => {
    const { store, query, source, stop } = fixture()
    const first = store.read(query)
    store.release(first.snapshotId)
    expect(() => store.get(first.snapshotId)).toThrow(/missing/)
    expect(source.getElementIdsInBounds).toHaveBeenCalledTimes(1)
    store.dispose()
    expect(stop).toHaveBeenCalledTimes(1)
    const tiny = fixture(1)
    expect(() => tiny.store.read(tiny.query)).toThrow(/capacity/)
    tiny.store.dispose()
  })
})

it('reads only the requested retained page rather than revisiting every row', () => {
  const { store, query } = fixture()
  const first = store.read(query)
  let visits = 0
  for (const row of store.get(first.snapshotId).result.elements) {
    const id = row.id
    Object.defineProperty(row, 'id', {
      get: () => {
        visits++
        return id
      },
      enumerable: true
    })
  }
  const page = store.read({
    scope: 'snapshot',
    snapshotId: first.snapshotId,
    offset: 1,
    limit: 1
  })
  expect(page.elements.map((row) => row.id)).toEqual(['b'])
  expect(visits).toBe(1)
  store.dispose()
})

it('returns an opaque reference without materializing retained rows', () => {
  const { store, query } = fixture()
  const first = store.read(query)
  for (const row of store.get(first.snapshotId).result.elements) {
    Object.defineProperty(row, 'id', {
      get: () => {
        throw new Error('Unexpected row transfer')
      },
      enumerable: true
    })
  }
  expect(
    store.read({
      scope: 'snapshot',
      snapshotId: first.snapshotId,
      delivery: 'reference'
    })
  ).toMatchObject({
    snapshotId: first.snapshotId,
    total: 3,
    elements: [],
    elementIds: []
  })
  store.dispose()
})

it('refuses new retained handoffs under pressure instead of evicting accepted consumers', () => {
  const { store, source } = fixture(4000)
  const controller = new AbortController()
  const receipts = fillByteBudget((index) =>
    store.read(
      {
        scope: 'ids',
        elementIds: [String(index)],
        fields: ['x'],
        delivery: 'reference'
      },
      controller.signal
    )
  )
  expect(() =>
    store.read(
      { scope: 'ids', elementIds: ['ninth'], delivery: 'reference' },
      controller.signal
    )
  ).toThrow(/capacity/)
  for (const receipt of receipts)
    expect(store.get(receipt.snapshotId).orderedIds).toHaveLength(1)
  const firstLease = receipts[0].leaseId
  if (!firstLease) throw new Error('Expected leased receipt')
  store.releaseLease(firstLease)
  expect(() =>
    store.read(
      { scope: 'ids', elementIds: ['ninth'], delivery: 'reference' },
      controller.signal
    )
  ).not.toThrow()
  controller.abort()
  expect(() =>
    store.read({ scope: 'ids', elementIds: ['after'], delivery: 'reference' })
  ).not.toThrow()
  expect(source.getElementComputedData).toHaveBeenCalledTimes(
    receipts.length + 1
  )
  store.dispose()
})

it('releases request leases on settlement but still rejects stale values', () => {
  const { store, change } = fixture()
  const signal = new AbortController().signal
  const receipt = store.read(
    { scope: 'ids', elementIds: ['a'], delivery: 'reference' },
    signal
  )
  change()
  expect(() => store.get(receipt.snapshotId)).toThrow(/stale/)
  store.releaseFor(signal)
  expect(() => store.get(receipt.snapshotId, receipt.leaseId)).toThrow(/lease/)
  store.dispose()
})

it('can explicitly release a stale lease without returning a newly invalid consumer handle', () => {
  const { store, query, change } = fixture()
  const receipt = store.read({ ...query, delivery: 'reference' })
  change()
  expect(
    store.read({
      scope: 'snapshot',
      snapshotId: receipt.snapshotId,
      release: true
    })
  ).toMatchObject({ available: true, released: true })
  expect(() => store.get(receipt.snapshotId, receipt.leaseId)).toThrow(/lease/)
  store.dispose()
})

it('rejects another request reading, releasing or consuming a same-workspace snapshot', () => {
  const { store, query } = fixture()
  const first = new AbortController().signal,
    second = new AbortController().signal
  const receipt = store.read({ ...query, delivery: 'reference' }, first)
  expect(() =>
    store.read({ scope: 'snapshot', snapshotId: receipt.snapshotId }, second)
  ).toThrow('request')
  expect(() =>
    store.read(
      { scope: 'snapshot', snapshotId: receipt.snapshotId, release: true },
      second
    )
  ).toThrow('request')
  expect(() => store.get(receipt.snapshotId, receipt.leaseId, second)).toThrow(
    'request'
  )
  expect(
    store.get(receipt.snapshotId, receipt.leaseId, first).orderedIds
  ).toHaveLength(3)
  const independent = store.read({ ...query, delivery: 'reference' }, second)
  expect(independent.snapshotId).not.toBe(receipt.snapshotId)
  expect(
    store.read({ ...query, delivery: 'reference' }, first).snapshotId
  ).toBe(receipt.snapshotId)
  store.releaseFor(first)
  expect(() => store.get(receipt.snapshotId)).toThrow('missing')
  expect(
    store.get(independent.snapshotId, independent.leaseId, second).orderedIds
  ).toHaveLength(3)
  store.dispose()
})

it('checks request identity before releasing an individual lease', () => {
  const { store, query } = fixture()
  const first = new AbortController().signal,
    second = new AbortController().signal
  const receipt = store.read({ ...query, delivery: 'reference' }, first)
  if (!receipt.leaseId) throw new Error('Expected a retained lease')
  expect(() => store.releaseLease(receipt.leaseId, second)).toThrow('request')
  expect(
    store.get(receipt.snapshotId, receipt.leaseId, first).orderedIds
  ).toHaveLength(3)
  store.releaseLease(receipt.leaseId, first)
  expect(() => store.get(receipt.snapshotId, receipt.leaseId, first)).toThrow(
    'lease'
  )
  store.dispose()
})

it.each(['page', 'columns'] as const)(
  'keeps delivered %s snapshots pinned instead of evicting future consumers',
  (delivery) => {
    const { store, source } = fixture(4000)
    const signal = new AbortController().signal
    const receipts = fillByteBudget((index) =>
      store.read(
        {
          scope: 'ids',
          elementIds: [String(index)],
          fields: ['x'],
          delivery
        },
        signal
      )
    )
    expect(() =>
      store.read({ scope: 'ids', elementIds: ['new'], delivery }, signal)
    ).toThrow(/capacity/)
    for (const receipt of receipts) {
      expect(receipt.leaseId).toEqual(expect.any(String))
      expect(
        store.get(receipt.snapshotId, receipt.leaseId, signal).orderedIds
      ).toHaveLength(1)
    }
    expect(source.getElementComputedData).toHaveBeenCalledTimes(
      receipts.length + 1
    )
    store.read(
      { scope: 'snapshot', snapshotId: receipts[0].snapshotId, release: true },
      signal
    )
    expect(() =>
      store.read({ scope: 'ids', elementIds: ['new'], delivery }, signal)
    ).not.toThrow()
    store.releaseFor(signal)
    for (const receipt of receipts)
      expect(() => store.get(receipt.snapshotId)).toThrow(/missing/)
    store.dispose()
  }
)

it('refines 2736 retained candidates to 24 targets without another spatial query or row transfer', () => {
  const { store, source, query, change } = fixture()
  const ids = Array.from({ length: 2736 }, (_, index) => `part-${index}`)
  source.getElementIdsInBounds.mockReturnValue(ids)
  source.getElementMetadata.mockImplementation((id) => ({
    name: `crown-${Number(id.slice(5)) < 24 ? 'roof' : 'window'}-edge`,
    type: 'rectangle',
    parentId: 'workspace',
    lock: false
  }))
  const request = new AbortController()
  const first = store.read({ ...query, delivery: 'reference' }, request.signal)
  source.getElementMetadata.mockClear()
  source.getElementComputedData.mockClear()
  const refine = {
    scope: 'snapshot' as const,
    snapshotId: first.snapshotId,
    filter: { name: { prefix: 'crown-roof', suffix: '-edge' } },
    expectedCount: 24,
    delivery: 'reference' as const
  }
  const result = store.read(refine, request.signal)
  expect(result).toMatchObject({
    total: 24,
    elements: [],
    elementIds: [],
    observation: {
      selectionExecutions: 0,
      refinementExecutions: 1,
      candidateCount: 2736
    }
  })
  expect(store.get(result.snapshotId).orderedIds).toEqual(ids.slice(0, 24))
  expect(source.getElementIdsInBounds).toHaveBeenCalledTimes(1)
  expect(source.getElementMetadata).toHaveBeenCalledTimes(2736)
  expect(source.getElementComputedData).not.toHaveBeenCalled()
  const again = store.read(refine, request.signal)
  expect(again.snapshotId).toBe(result.snapshotId)
  expect(again.observation).toMatchObject({
    refinementExecutions: 0,
    metadataReadCount: 0
  })
  expect(source.getElementMetadata).toHaveBeenCalledTimes(2736)
  expect(() =>
    store.read({ ...refine, expectedCount: 25 }, request.signal)
  ).toThrow(/count/i)
  expect(() => store.read(refine, new AbortController().signal)).toThrow(
    /another request/
  )
  const empty = store.read(
    { ...refine, filter: { name: { equals: 'missing' } }, expectedCount: 0 },
    request.signal
  )
  expect(store.get(empty.snapshotId).orderedIds).toEqual([])
  store.release(first.snapshotId)
  expect(
    store
      .read(
        {
          scope: 'snapshot',
          snapshotId: result.snapshotId,
          delivery: 'page',
          limit: 2
        },
        request.signal
      )
      .elements.map((row) => row.id)
  ).toEqual(ids.slice(0, 2))
  change()
  expect(() => store.get(result.snapshotId)).toThrow(/stale/)
  store.dispose()
})

it('serves transient region IDs without reserving capacity or changing borrowed pins', () => {
  const { store, source } = fixture(4000)
  const signal = new AbortController().signal
  const query = {
    scope: 'region' as const,
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    result: 'ids' as const,
    allMatches: true
  }
  const retained = fillByteBudget((x) =>
    store.read(
      { ...query, bounds: { ...query.bounds, x }, delivery: 'reference' },
      signal
    )
  )
  const reads = source.getElementIdsInBounds.mock.calls.length
  const borrowed = store.read({ ...query, delivery: 'transient' }, signal)
  expect(borrowed.elementIds).toEqual(['a', 'b', 'c'])
  expect(borrowed).not.toHaveProperty('snapshotId')
  expect(borrowed).not.toHaveProperty('leaseId')
  expect(source.getElementIdsInBounds).toHaveBeenCalledTimes(reads)
  for (let x = 100; x < 116; x++) {
    const result = store.read(
      { ...query, bounds: { ...query.bounds, x }, delivery: 'transient' },
      signal
    )
    expect(result.elementIds).toEqual(['a', 'b', 'c'])
    expect(result).not.toHaveProperty('snapshotId')
  }
  expect(source.getElementIdsInBounds).toHaveBeenCalledTimes(reads + 16)
  for (const snapshot of retained)
    expect(
      store.get(snapshot.snapshotId, snapshot.leaseId, signal).orderedIds
    ).toEqual(['a', 'b', 'c'])
  expect(() =>
    store.read({ ...query, bounds: { ...query.bounds, x: 99 } }, signal)
  ).toThrow(/capacity/)
  store.dispose()
})

it.each([
  { scope: 'selection' },
  {
    scope: 'region',
    bounds: { x: 0, y: 0, width: 1, height: 1 },
    result: 'elements',
    allMatches: true
  },
  {
    scope: 'region',
    bounds: { x: 0, y: 0, width: 1, height: 1 },
    result: 'ids'
  },
  { scope: 'snapshot', snapshotId: 'missing' }
])('rejects unsupported transient delivery before selection: %j', (query) => {
  const { store, source } = fixture()
  expect(() =>
    store.read({ ...query, delivery: 'transient' } as never)
  ).toThrow(/Transient/)
  expect(source.getElementIdsInBounds).not.toHaveBeenCalled()
  store.dispose()
})

it('does not publish transient values when cancellation occurs during the canonical read', () => {
  const { store, source } = fixture(4000)
  const controller = new AbortController()
  source.getElementIdsInBounds = vi.fn(() => {
    controller.abort()
    return ['a']
  })
  expect(() =>
    store.read(
      {
        scope: 'region',
        bounds: { x: 0, y: 0, width: 1, height: 1 },
        result: 'ids',
        allMatches: true,
        delivery: 'transient'
      },
      controller.signal
    )
  ).toThrow()
  store.dispose()
})

it('keeps receipt bytes bounded and query pins protected independently of receipt count', () => {
  const { store } = fixture(4000)
  const signal = new AbortController().signal
  const retained: string[] = []
  expect(() => {
    for (let i = 0; i < 50; i++) {
      retained.push(
        store.retainReceipt(['a'], { payload: 'x'.repeat(100) }, signal)
          .snapshotId
      )
    }
  }).toThrow(/capacity/)
  expect(retained.length).toBeGreaterThan(0)
  for (const snapshotId of retained) {
    expect(
      store.read({ scope: 'snapshot', snapshotId, delivery: 'receipt' }, signal)
    ).toMatchObject({
      current: true,
      receipt: { payload: 'x'.repeat(100) }
    })
  }
  store.releaseFor(signal)
  expect(() =>
    store.read(
      { scope: 'ids', elementIds: ['a'], delivery: 'reference' },
      signal
    )
  ).not.toThrow()
  store.dispose()
})

it('counts filtered structural targets as queries without copying mutation receipts', () => {
  const { store, source } = fixture(4000)
  const signal = new AbortController().signal
  const parent = store.retainReceipt(
    ['a', 'b', 'c'],
    { operation: 'group' },
    signal
  )
  const refine = (index: number) =>
    store.read(
      {
        scope: 'snapshot',
        snapshotId: parent.snapshotId,
        filter: { name: { equals: `missing-${index}` } },
        delivery: 'reference'
      },
      signal
    )
  try {
    const results = fillByteBudget(refine)
    expect(() => refine(results.length)).toThrow(/capacity/)
    for (const result of results) {
      expect(store.get(result.snapshotId).orderedIds).toEqual([])
      expect(() =>
        store.read(
          {
            scope: 'snapshot',
            snapshotId: result.snapshotId,
            delivery: 'receipt'
          },
          signal
        )
      ).toThrow(/receipt unavailable/)
    }
    source.getElementMetadata.mockClear()
    expect(refine(0).snapshotId).toBe(results[0].snapshotId)
    expect(source.getElementMetadata).not.toHaveBeenCalled()
    store.release(results[0].snapshotId)
    expect(() => refine(results.length)).not.toThrow()
    expect(
      store.read(
        {
          scope: 'snapshot',
          snapshotId: parent.snapshotId,
          delivery: 'receipt'
        },
        signal
      )
    ).toMatchObject({ receipt: { operation: 'group' } })
    expect(source.getElementIdsInBounds).not.toHaveBeenCalled()
    expect(source.getElementComputedData).not.toHaveBeenCalled()
  } finally {
    store.dispose()
  }
})

it('retains many small query handoffs within the byte budget without an entry quota', () => {
  const { store, source } = fixture()
  const signal = new AbortController().signal
  try {
    const results = Array.from({ length: 64 }, (_, index) =>
      store.read(
        {
          scope: 'ids',
          elementIds: [`small-${index}`],
          delivery: 'reference'
        },
        signal
      )
    )
    for (const [index, result] of results.entries()) {
      expect(
        store.get(result.snapshotId, result.leaseId, signal).orderedIds
      ).toEqual([`small-${index}`])
    }
    const reads = source.getElementMetadata.mock.calls.length
    expect(
      store.read(
        { scope: 'ids', elementIds: ['small-0'], delivery: 'reference' },
        signal
      ).snapshotId
    ).toBe(results[0].snapshotId)
    expect(source.getElementMetadata).toHaveBeenCalledTimes(reads)
  } finally {
    store.dispose()
  }
})

it('recovers mixed-request byte pressure without releasing sibling pins or refreshing stale targets', () => {
  const { store, change } = fixture(4000)
  const first = new AbortController()
  const second = new AbortController()
  const read = (id: string, signal: AbortSignal) =>
    store.read(
      { scope: 'ids', elementIds: [id], delivery: 'reference' },
      signal
    )
  try {
    const sibling = read('sibling', second.signal)
    const historical = store.retainReceipt(
      ['a'],
      { operation: 'group' },
      second.signal
    )
    const crowded = fillByteBudget((index) =>
      read(`request-${index}`, first.signal)
    )
    expect(() => read('retry', second.signal)).toThrow(/capacity/)
    first.abort()
    const retry = read('retry', second.signal)
    expect(
      store.get(sibling.snapshotId, sibling.leaseId, second.signal).orderedIds
    ).toEqual(['sibling'])
    for (const item of crowded)
      expect(() => store.get(item.snapshotId, item.leaseId)).toThrow(/lease/)
    store.releaseFor(first.signal)
    change()
    expect(() =>
      store.get(retry.snapshotId, retry.leaseId, second.signal)
    ).toThrow(/stale/)
    expect(
      store.read(
        {
          scope: 'snapshot',
          snapshotId: historical.snapshotId,
          delivery: 'receipt'
        },
        second.signal
      )
    ).toMatchObject({
      current: false,
      receipt: { operation: 'group' }
    })
    store.releaseFor(second.signal)
    const third = new AbortController()
    const current = read('retry', third.signal)
    expect(current.snapshotId).not.toBe(retry.snapshotId)
    expect(
      store.get(current.snapshotId, current.leaseId, third.signal).orderedIds
    ).toEqual(['retry'])
  } finally {
    store.dispose()
  }
})
