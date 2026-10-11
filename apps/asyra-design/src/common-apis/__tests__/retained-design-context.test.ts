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
  const { store, source } = fixture()
  const controller = new AbortController()
  const receipts = Array.from({ length: 8 }, (_, index) =>
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
  expect(source.getElementComputedData).toHaveBeenCalledTimes(8)
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
