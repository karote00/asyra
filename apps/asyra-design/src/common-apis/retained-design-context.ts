import {
  createDesignContextReader,
  designContextPageLimit,
  type DesignContextQuery,
  type DesignContextSource
} from './design-context'

export type RetainedContextQuery = (
  | DesignContextQuery
  | {
      scope: 'snapshot'
      snapshotId: string
      offset?: number
      limit?: number
      release?: boolean
    }
) & { delivery?: 'page' | 'reference' | 'columns' }

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
}

/** Request-host lifetime, canonical invalidation. Retains query output, never another document model. */
export const createRetainedDesignContext = (
  source: DesignContextSource,
  observe: (listener: () => void) => () => void,
  options: { maxBytes?: number; maxEntries?: number } = {}
) => {
  let revision = 0
  let disposed = false
  let bytes = 0
  const entries = new Map<
    string,
    {
      value: RetainedDesignContext
      bytes: number
      key: string
      leases: Set<string>
      rows: Map<string, ContextResult['elements'][number]>
      missing: Set<string>
    }
  >()
  const leases = new Map<
    string,
    { snapshotId: string; signal?: AbortSignal; abort: () => void }
  >()
  const releaseLease = (leaseId: string) => {
    const lease = leases.get(leaseId)
    if (!lease) return
    lease.signal?.removeEventListener('abort', lease.abort)
    entries.get(lease.snapshotId)?.leases.delete(leaseId)
    leases.delete(leaseId)
  }
  const releaseFor = (signal: AbortSignal) => {
    for (const [id, lease] of leases)
      if (lease.signal === signal) releaseLease(id)
  }
  const acquire = (snapshotId: string, signal?: AbortSignal) => {
    signal?.throwIfAborted()
    for (const [id, lease] of leases)
      if (lease.snapshotId === snapshotId && lease.signal === signal) return id
    const entry = entries.get(snapshotId)
    if (!entry) throw new RetainedQueryError('Retained query missing.')
    const id = crypto.randomUUID()
    const abort = () => releaseLease(id)
    leases.set(id, { snapshotId, signal, abort })
    entry.leases.add(id)
    signal?.addEventListener('abort', abort, { once: true })
    return id
  }
  const keys = new Map<string, string>()
  let stop: (() => void) | undefined
  const release = (id: string) => {
    const entry = entries.get(id)
    if (!entry) return
    for (const leaseId of entry.leases) releaseLease(leaseId)
    bytes -= entry.bytes
    entries.delete(id)
    if (keys.get(entry.key) === id) keys.delete(entry.key)
  }
  const get = (id: string, leaseId?: string) => {
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
  const read = (input: RetainedContextQuery, signal?: AbortSignal) => {
    signal?.throwIfAborted()
    if (disposed)
      throw new RetainedQueryError('Retained query owner is disposed.')
    stop ??= observe(() => {
      revision++
      keys.clear()
    })
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
              'delivery'
            ].includes(key)
        ) ||
        (input.limit !== undefined &&
          (!Number.isSafeInteger(input.limit) ||
            input.limit < 1 ||
            input.limit > designContextPageLimit))
      )
        throw new RetainedQueryError(
          'Snapshot reads accept only snapshotId, pagination, delivery and release.'
        )
      if (input.release) {
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
      const result = deliverPage(
        input.snapshotId,
        input.offset,
        input.limit,
        input.delivery,
        signal
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
      // Validate the original contract before retaining any output. Reuse the already selected identities.
      const validationSource = {
        ...cachedSource,
        getElementIdsInBounds: () => selected,
        getSelectedElementIds: () => selected,
        getElementChildren: () => ({
          available,
          elementIds: selected.slice(0, 1),
          total: selected.length,
          nextOffset: selected.length > 1 ? 1 : null
        }),
        getElementComputedData: () => ({})
      }
      createDesignContextReader(validationSource)({
        ...query,
        ...(query.allMatches ? {} : { offset: 0, limit: 1 })
      })
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
      const size = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength
      const maximum = options.maxBytes ?? 32 * 1024 * 1024
      if (size > maximum)
        throw new RetainedQueryError(
          'Retained query capacity exceeded; narrow the requested scope or columns.'
        )
      while (
        entries.size &&
        (bytes + size > maximum || entries.size >= (options.maxEntries ?? 8))
      ) {
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
        bytes: size,
        key,
        leases: new Set(),
        rows: new Map(snapshot.result.elements.map((row) => [row.id, row])),
        missing: new Set(snapshot.result.missingIds)
      })
      keys.set(key, snapshot.snapshotId)
    }
    return {
      ...deliverPage(
        snapshot.snapshotId,
        offset,
        query.allMatches ? snapshot.result.total : limit,
        delivery,
        signal
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
    signal?: AbortSignal
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
        leaseId: acquire(id, signal)
      }
    }
    const result = page(id, offset, limit)
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
  return {
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
