import {
  createDesignContextReader,
  validateDesignContextQuery,
  validateDesignContextFilter,
  matchesDesignContextFilter,
  assertDesignContextCount,
  designContextPageLimit,
  type DesignContextQuery,
  type DesignContextSource
} from './design-context'

export type RetainedContextQuery = (
  | DesignContextQuery
  | {
      scope: 'snapshot'
      filter?: DesignContextQuery['filter']
      expectedCount?: number
      snapshotId: string
      offset?: number
      limit?: number
      release?: boolean
    }
) & { delivery?: 'page' | 'reference' | 'columns' | 'receipt' | 'transient' }

type QueryLeaseScope = 'request' | 'consumer'

export class RetainedQueryError extends Error {}

type ContextResult = ReturnType<ReturnType<typeof createDesignContextReader>>
export interface RetainedDesignContext {
  snapshotId: string
  revision: number
  workspaceId: string | null | undefined
  coordinateSpace: 'parent-local'
  orderedIds: readonly string[]
  fields: readonly string[]
  result: ContextResult
  receiptText?: string
}

/** Request-host lifetime, canonical invalidation. Retains query output, never another document model. */
export const createRetainedDesignContext = (
  source: DesignContextSource,
  observe: (listener: () => void) => () => void,
  options: { maxBytes?: number } = {}
) => {
  let revision = 0
  let disposed = false
  let bytes = 0
  const entries = new Map<
    string,
    {
      value: RetainedDesignContext
      signal?: AbortSignal
      bytes: number
      key: string
      leases: Set<string>
      rows: Map<string, ContextResult['elements'][number]>
      missing: Set<string>
    }
  >()
  const leases = new Map<
    string,
    {
      snapshotId: string
      signal?: AbortSignal
      scope: QueryLeaseScope
      abort: () => void
    }
  >()
  const releaseLease = (leaseId: string, signal?: AbortSignal) => {
    const lease = leases.get(leaseId)
    if (!lease) return
    if (signal !== undefined && lease.signal !== signal)
      throw new RetainedQueryError('Retained query belongs to another request.')
    lease.signal?.removeEventListener('abort', lease.abort)
    entries.get(lease.snapshotId)?.leases.delete(leaseId)
    leases.delete(leaseId)
  }
  const releaseFor = (signal: AbortSignal) => {
    for (const [id, lease] of leases)
      if (lease.signal === signal) releaseLease(id)
    for (const [id, entry] of entries) if (entry.signal === signal) release(id)
  }
  const acquire = (
    snapshotId: string,
    signal?: AbortSignal,
    scope: QueryLeaseScope = 'request'
  ) => {
    signal?.throwIfAborted()
    if (scope === 'request')
      for (const [id, lease] of leases)
        if (
          lease.snapshotId === snapshotId &&
          lease.signal === signal &&
          lease.scope === 'request'
        )
          return id
    const entry = entries.get(snapshotId)
    if (!entry) throw new RetainedQueryError('Retained query missing.')
    const id = crypto.randomUUID()
    const abort = () => releaseLease(id)
    leases.set(id, { snapshotId, signal, scope, abort })
    entry.leases.add(id)
    signal?.addEventListener('abort', abort, { once: true })
    return id
  }
  const keys = new Map<string, string>()
  const requestKeys = new WeakMap<AbortSignal, number>()
  let requestSequence = 0
  const requestKey = (signal?: AbortSignal) => {
    if (!signal) return 0
    let key = requestKeys.get(signal)
    if (key === undefined) {
      key = ++requestSequence
      requestKeys.set(signal, key)
    }
    return key
  }
  const assertRequest = (id: string, signal?: AbortSignal) => {
    const entry = entries.get(id)
    if (entry && entry.signal !== signal)
      throw new RetainedQueryError('Retained query belongs to another request.')
  }
  let stop: (() => void) | undefined
  const release = (id: string) => {
    const entry = entries.get(id)
    if (!entry) return
    for (const leaseId of entry.leases) releaseLease(leaseId)
    bytes -= entry.bytes
    entries.delete(id)
    if (keys.get(entry.key) === id) keys.delete(entry.key)
  }
  const get = (id: string, leaseId?: string, signal?: AbortSignal) => {
    signal?.throwIfAborted()
    if (signal !== undefined) assertRequest(id, signal)
    if (leaseId !== undefined && leases.get(leaseId)?.snapshotId !== id)
      throw new RetainedQueryError(
        'Retained query lease is released or invalid.'
      )
    const entry = entries.get(id)
    if (disposed || !entry)
      throw new RetainedQueryError(
        'Retained query missing or evicted; read the current scope again.'
      )
    if (
      entry.value.revision !== revision ||
      entry.value.workspaceId !== source.getCurrentWorkspaceId()
    )
      throw new RetainedQueryError(
        'Retained query stale; read the current scope again before editing.'
      )
    return entry.value
  }
  const retain = (
    snapshot: RetainedDesignContext,
    key: string,
    signal?: AbortSignal
  ) => {
    const size = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength
    const maximum = options.maxBytes ?? 32 * 1024 * 1024
    if (size > maximum)
      throw new RetainedQueryError(
        'Retained query capacity exceeded; narrow the requested scope or columns.'
      )
    // All retained data shares one byte budget; small queries have no count quota.
    while (entries.size && bytes + size > maximum) {
      const oldest = [...entries].find(
        ([, entry]) => entry.leases.size === 0
      )?.[0]
      if (oldest === undefined)
        throw new RetainedQueryError(
          'Retained query capacity reserved by pending consumers; consume or release references, or use a query mapping.'
        )
      release(oldest)
    }
    bytes += size
    entries.set(snapshot.snapshotId, {
      value: snapshot,
      signal,
      bytes: size,
      key,
      leases: new Set(),
      rows: new Map(snapshot.result.elements.map((row) => [row.id, row])),
      missing: new Set(snapshot.result.missingIds)
    })
    keys.set(key, snapshot.snapshotId)
  }
  const refine = (
    input: Extract<RetainedContextQuery, { scope: 'snapshot' }>,
    signal: AbortSignal | undefined,
    leaseScope: QueryLeaseScope
  ) => {
    const parent = get(input.snapshotId, undefined, signal)
    validateDesignContextFilter(input.filter)
    const key = JSON.stringify({
      snapshot: input.snapshotId,
      filter: input.filter,
      expectedCount: input.expectedCount
    })
    const prior = keys.get(key)
    let snapshot = prior ? get(prior, undefined, signal) : undefined
    const metadata = new Map<
      string,
      ReturnType<DesignContextSource['getElementMetadata']>
    >()
    const readMetadata = (id: string) => {
      if (!metadata.has(id)) metadata.set(id, source.getElementMetadata(id))
      return metadata.get(id)
    }
    if (!snapshot) {
      const ids = parent.orderedIds.filter((id) =>
        matchesDesignContextFilter(id, input.filter, readMetadata)
      )
      assertDesignContextCount(ids.length, input.expectedCount)
      // A source mutation during metadata reads cannot produce a current subset.
      get(input.snapshotId, undefined, signal)
      const selected = new Set(ids)
      snapshot = {
        snapshotId: crypto.randomUUID(),
        revision: parent.revision,
        workspaceId: parent.workspaceId,
        coordinateSpace: parent.coordinateSpace,
        fields: parent.fields,
        orderedIds: ids,
        result: {
          ...parent.result,
          total: ids.length,
          offset: 0,
          limit: ids.length,
          nextOffset: null,
          elements: parent.result.elements.filter((row) =>
            selected.has(row.id)
          ),
          ...(parent.result.elementIds === undefined
            ? {}
            : {
                elementIds: parent.result.elementIds.filter((id) =>
                  selected.has(id)
                )
              }),
          missingIds: parent.result.missingIds.filter((id) => selected.has(id))
        }
      }
      retain(snapshot, key, signal)
    }
    return {
      ...deliverPage(
        snapshot.snapshotId,
        input.offset,
        input.limit,
        input.delivery,
        signal,
        leaseScope
      ),
      observation: {
        reused: Boolean(prior),
        selectionExecutions: 0,
        refinementExecutions: prior ? 0 : 1,
        candidateCount: prior ? 0 : parent.orderedIds.length,
        metadataReadCount: metadata.size,
        computedReadCount: 0,
        matchedCount: snapshot.result.total
      }
    }
  }
  // Consumer reads share retained rows but release only their own lease.
  const read = (
    input: RetainedContextQuery,
    signal?: AbortSignal,
    leaseScope: QueryLeaseScope = 'request'
  ) => {
    signal?.throwIfAborted()
    if (disposed)
      throw new RetainedQueryError('Retained query owner is disposed.')
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new RetainedQueryError('Invalid document context query.')
    if (
      input.delivery !== undefined &&
      !['page', 'reference', 'columns', 'receipt', 'transient'].includes(
        input.delivery
      )
    )
      throw new RetainedQueryError('Invalid document context delivery.')
    if (
      input.delivery === 'transient' &&
      (input.scope !== 'region' ||
        input.result !== 'ids' ||
        input.allMatches !== true ||
        input.offset !== undefined ||
        input.limit !== undefined ||
        (input.fields?.length ?? 0) > 0)
    )
      throw new RetainedQueryError(
        'Transient delivery requires complete region IDs without paging or fields.'
      )
    if (input.scope !== 'snapshot') {
      const { delivery: _delivery, ...query } = input
      validateDesignContextQuery(query)
    }
    if (input.scope === 'snapshot') {
      if (
        Object.keys(input).some(
          (key) =>
            ![
              'scope',
              'snapshotId',
              'offset',
              'limit',
              'release',
              'delivery',
              'filter',
              'expectedCount'
            ].includes(key)
        ) ||
        (input.limit !== undefined &&
          (!Number.isSafeInteger(input.limit) ||
            input.limit < 1 ||
            input.limit > designContextPageLimit))
      )
        throw new RetainedQueryError(
          'Snapshot reads accept only snapshotId, pagination, delivery, filter, expectedCount and release.'
        )
      if (
        typeof input.snapshotId !== 'string' ||
        !input.snapshotId.length ||
        (input.offset !== undefined &&
          (!Number.isSafeInteger(input.offset) || input.offset < 0)) ||
        (input.expectedCount !== undefined &&
          (!Number.isSafeInteger(input.expectedCount) ||
            input.expectedCount < 0))
      )
        throw new RetainedQueryError(
          'Snapshot identity, offset and expectedCount must be valid before refinement.'
        )
      validateDesignContextFilter(input.filter)
      assertRequest(input.snapshotId, signal)
      stop ??= observe(() => {
        revision++
        keys.clear()
      })
      if (input.release) {
        if (input.filter !== undefined || input.expectedCount !== undefined)
          throw new RetainedQueryError('Release cannot refine a snapshot.')
        const released = entries.has(input.snapshotId)
        release(input.snapshotId)
        return {
          available: true,
          released,
          scope: 'snapshot',
          snapshotId: input.snapshotId,
          leaseId: undefined as string | undefined,
          revision,
          coordinateSpace: 'parent-local' as const,
          parentId: null,
          offset: 0,
          limit: 0,
          total: 0,
          nextOffset: null,
          elements: [],
          elementIds: [],
          missingIds: [],
          observation: {
            reused: false,
            selectionExecutions: 0,
            candidateCount: 0,
            metadataReadCount: 0,
            computedReadCount: 0,
            matchedCount: 0
          }
        }
      }
      if (input.delivery === 'receipt') {
        if (
          input.filter !== undefined ||
          input.expectedCount !== undefined ||
          input.limit !== undefined
        )
          throw new RetainedQueryError(
            'Receipt recovery accepts snapshot identity, delivery and the exact text offset.'
          )
        const entry = entries.get(input.snapshotId)
        if (!entry || entry.value.receiptText === undefined)
          throw new RetainedQueryError(
            'Retained structural receipt unavailable; never replay a mutation for readback.'
          )
        const value = entry.value
        const text = value.receiptText as string
        const offset = input.offset ?? 0
        if (
          !Number.isSafeInteger(offset) ||
          offset < 0 ||
          offset >= text.length
        )
          throw new RetainedQueryError(
            'Receipt text offset is outside the immutable result.'
          )
        const end = Math.min(text.length, offset + 8192)
        const paged = input.offset !== undefined || text.length > 8192
        return {
          available: true,
          scope: 'snapshot',
          snapshotId: value.snapshotId,
          leaseId: acquire(value.snapshotId, signal, leaseScope),
          total: value.result.total,
          coordinateSpace: value.coordinateSpace,
          elements: [],
          missingIds: [],
          current:
            value.revision === revision &&
            value.workspaceId === source.getCurrentWorkspaceId(),
          ...(paged
            ? {
                receiptPage: {
                  encoding: 'json-text' as const,
                  offset,
                  total: text.length,
                  nextOffset: end < text.length ? end : null,
                  text: text.slice(offset, end)
                }
              }
            : { receipt: JSON.parse(text) as Record<string, unknown> })
        }
      }
      if (input.filter !== undefined) return refine(input, signal, leaseScope)
      assertDesignContextCount(
        get(input.snapshotId, undefined, signal).result.total,
        input.expectedCount
      )
      const result = deliverPage(
        input.snapshotId,
        input.offset,
        input.limit,
        input.delivery,
        signal,
        leaseScope
      )
      return {
        ...result,
        observation: {
          reused: true,
          selectionExecutions: 0,
          candidateCount: 0,
          metadataReadCount: 0,
          computedReadCount: 0,
          matchedCount: result.total
        }
      }
    }
    if (input.delivery === 'receipt')
      throw new RetainedQueryError('Receipt recovery requires scope=snapshot.')
    stop ??= observe(() => {
      revision++
      keys.clear()
    })
    const { delivery, ...query } = input
    if (disposed)
      throw new RetainedQueryError('Retained query owner is disposed.')
    const {
      offset = 0,
      limit = query.scope === 'ids' ? (query.elementIds?.length ?? 50) : 50,
      ...selector
    } = query
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      (query.limit !== undefined && limit > designContextPageLimit)
    )
      throw new RetainedQueryError('Invalid document context page.')
    const key = JSON.stringify(
      {
        ...selector,
        request: requestKey(signal),
        workspace: source.getCurrentWorkspaceId(),
        ...(query.scope === 'selection'
          ? { selection: source.getSelectedElementIds() }
          : {})
      },
      (_key, value) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? Object.fromEntries(
              Object.keys(value)
                .sort()
                .map((name) => [name, value[name]])
            )
          : value
    )
    const prior = keys.get(key)
    let snapshot = prior ? get(prior) : undefined
    const reused = Boolean(snapshot)
    const work = {
      candidateCount: 0,
      metadataReadCount: 0,
      computedReadCount: 0
    }
    if (!snapshot) {
      const capturedRevision = revision
      const workspaceId = source.getCurrentWorkspaceId()
      const metadata = new Map<
        string,
        ReturnType<DesignContextSource['getElementMetadata']>
      >()
      const cachedSource: DesignContextSource = {
        ...source,
        getElementMetadata: (id) => {
          if (!metadata.has(id)) {
            work.metadataReadCount++
            metadata.set(id, source.getElementMetadata(id))
          }
          return metadata.get(id)
        }
      }
      // Methods on Core are prototype methods: retain their receiver explicitly.
      for (const method of [
        'getCurrentWorkspaceId',
        'getSelectedElementIds',
        'getElementChildren',
        'getElementIdsInBounds',
        'getElementComputedData'
      ] as const) {
        Object.assign(cachedSource, { [method]: source[method].bind(source) })
      }
      cachedSource.getElementIdsInBounds = (bounds) => {
        const candidates = source.getElementIdsInBounds(bounds)
        work.candidateCount += candidates.length
        return candidates
      }
      cachedSource.getElementComputedData = (id, fields) => {
        work.computedReadCount++
        return source.getElementComputedData(id, fields)
      }
      const reader = createDesignContextReader(cachedSource)
      let selected: string[]
      let available = true
      let parentId: string | null = null
      if (query.scope === 'region') {
        selected =
          reader({ ...selector, fields: [], result: 'ids', allMatches: true })
            .elementIds ?? []
      } else if (query.scope === 'children') {
        parentId = query.parentId ?? source.getCurrentWorkspaceId() ?? null
        const children = parentId
          ? source.getElementChildren(parentId, 0, Number.MAX_SAFE_INTEGER)
          : undefined
        available = Boolean(children?.available)
        selected = children?.elementIds ?? []
      } else if (query.scope === 'selection')
        selected = source.getSelectedElementIds()
      else if (query.scope === 'ids') selected = query.elementIds ?? []
      else throw new RetainedQueryError('Invalid document context scope.')
      if (query.scope !== 'region') work.candidateCount = selected.length
      assertDesignContextCount(selected.length, query.expectedCount)
      const result = selected.length
        ? reader({
            scope: 'ids',
            elementIds: selected,
            fields: query.fields,
            result: query.result
          })
        : {
            available,
            scope: query.scope,
            parentId,
            offset: 0,
            limit: 0,
            total: 0,
            nextOffset: null,
            elements: [],
            missingIds: [],
            elementIds: []
          }
      if (
        revision !== capturedRevision ||
        source.getCurrentWorkspaceId() !== workspaceId
      )
        throw new RetainedQueryError(
          'Retained query changed while being read; read the current scope again.'
        )
      snapshot = {
        snapshotId: crypto.randomUUID(),
        revision: capturedRevision,
        workspaceId,
        coordinateSpace: 'parent-local',
        orderedIds: [...selected],
        fields: Object.freeze([...(query.fields ?? [])]),
        result: { ...result, scope: query.scope, available, parentId }
      }
      if (delivery !== 'transient') retain(snapshot, key, signal)
    }
    signal?.throwIfAborted()
    if (delivery === 'transient')
      return {
        ...snapshot.result,
        delivery,
        coordinateSpace: snapshot.coordinateSpace,
        elementIds: [...snapshot.orderedIds],
        elements: [],
        observation: {
          ...work,
          matchedCount: snapshot.result.total,
          reused,
          selectionExecutions: reused ? 0 : 1,
          retainedRows: 0,
          fields: snapshot.fields
        }
      }
    return {
      ...deliverPage(
        snapshot.snapshotId,
        offset,
        query.allMatches ? snapshot.result.total : limit,
        delivery,
        signal,
        leaseScope
      ),
      observation: {
        ...work,
        matchedCount: snapshot.result.total,
        reused,
        selectionExecutions: reused ? 0 : 1,
        retainedRows: snapshot.result.total,
        fields: snapshot.fields
      }
    }
  }
  const page = (id: string, offset = 0, limit = 50) => {
    const value = get(id)
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(limit) ||
      limit < 0
    )
      throw new RetainedQueryError('Invalid retained page.')
    const result = value.result
    const ids = value.orderedIds.slice(offset, offset + limit)
    const entry = entries.get(id)
    if (!entry) throw new RetainedQueryError('Retained query missing.')
    return structuredClone({
      ...result,
      snapshotId: id,
      leaseId: undefined as string | undefined,
      revision: value.revision,
      coordinateSpace: value.coordinateSpace,
      offset,
      limit,
      nextOffset: offset + limit < result.total ? offset + limit : null,
      missingIds: ids.filter((id) => entry.missing.has(id)),
      elements: ids.flatMap((id) => {
        const row = entry.rows.get(id)
        return row ? [row] : []
      }),
      ...(result.elementIds
        ? { elementIds: ids.filter((id) => !entry.missing.has(id)) }
        : {})
    })
  }
  const deliverPage = (
    id: string,
    offset = 0,
    limit = 50,
    delivery: RetainedContextQuery['delivery'],
    signal: AbortSignal | undefined,
    leaseScope: QueryLeaseScope
  ) => {
    if (delivery === 'reference') {
      const value = get(id)
      return {
        available:
          value.result.available && value.result.missingIds.length === 0,
        scope: value.result.scope,
        parentId: value.result.parentId,
        snapshotId: id,
        revision: value.revision,
        coordinateSpace: value.coordinateSpace,
        offset: 0,
        limit: 0,
        nextOffset: null,
        total: value.result.total,
        elements: [],
        elementIds: [],
        missingIds: [],
        missingCount: value.result.missingIds.length,
        delivery,
        leaseId: acquire(id, signal, leaseScope)
      }
    }
    const result = {
      ...page(id, offset, limit),
      leaseId: acquire(id, signal, leaseScope)
    }
    if (delivery === 'columns')
      return {
        ...result,
        elements: [],
        delivery,
        columns: result.elements.map((element) => ({
          id: element.id,
          ...element.properties
        }))
      }
    return result
  }
  const retainReceipt = (
    ids: readonly string[],
    receipt: unknown,
    signal: AbortSignal
  ) => {
    signal.throwIfAborted()
    if (disposed)
      throw new RetainedQueryError('Retained query owner is disposed.')
    stop ??= observe(() => {
      revision++
      keys.clear()
    })
    if (
      ids.some((id) => typeof id !== 'string' || !id) ||
      new Set(ids).size !== ids.length
    )
      throw new RetainedQueryError(
        'Structural targets require unique ordered identities.'
      )
    const snapshotId = crypto.randomUUID()
    retain(
      {
        snapshotId,
        revision,
        workspaceId: source.getCurrentWorkspaceId(),
        coordinateSpace: 'parent-local',
        orderedIds: [...ids],
        fields: [],
        receiptText: JSON.stringify(receipt),
        result: {
          available: true,
          scope: 'ids',
          parentId: null,
          offset: 0,
          limit: ids.length,
          total: ids.length,
          nextOffset: null,
          elements: [],
          elementIds: [...ids],
          missingIds: []
        }
      },
      snapshotId,
      signal
    )
    return {
      snapshotId,
      leaseId: acquire(snapshotId, signal),
      total: ids.length
    }
  }
  return {
    retainReceipt,
    read,
    page,
    get,
    release,
    releaseLease,
    releaseFor,
    dispose: () => {
      if (disposed) return
      disposed = true
      stop?.()
      for (const id of leases.keys()) releaseLease(id)
      entries.clear()
      keys.clear()
      bytes = 0
    }
  }
}
