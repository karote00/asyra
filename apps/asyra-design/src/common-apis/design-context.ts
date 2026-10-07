import core from '../contexts'
import type { Rect } from '@asyra/utils'

export interface DesignContextQuery {
  scope: 'selection' | 'children' | 'ids' | 'region'
  result?: 'elements' | 'ids'
  bounds?: Rect
  filter?: {
    type?: string
    parentId?: string
    ancestorId?: string
    locked?: boolean
  }
  elementIds?: string[]
  fields?: string[]
  parentId?: string
  offset?: number
  limit?: number
}
interface DesignContextSource {
  getCurrentWorkspaceId(): string | null | undefined
  getSelectedElementIds(): string[]
  getElementChildren(
    id: string,
    offset: number,
    limit: number
  ): {
    available: boolean
    elementIds: string[]
    total: number
    nextOffset: number | null
  }
  getElementIdsInBounds(bounds: Rect): string[]
  getElementMetadata(id: string):
    | {
        name?: unknown
        type?: unknown
        parentId?: unknown
        visible?: unknown
        lock?: unknown
        childCount?: number
      }
    | undefined
  getElementComputedData(
    id: string,
    fields: readonly string[]
  ): Record<string, unknown> | undefined
}
export const designContextPageLimit = 200

export const designContextFields = Object.freeze([
  'x',
  'y',
  'width',
  'height',
  'rotation',
  'text',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'lineHeight',
  'letterSpacing',
  'textColor',
  'fills',
  'strokes'
])
export const createDesignContextReader =
  (source: DesignContextSource) => (query: DesignContextQuery) => {
    if (
      !query ||
      typeof query !== 'object' ||
      Array.isArray(query) ||
      Object.keys(query).some(
        (key) =>
          ![
            'scope',
            'parentId',
            'offset',
            'limit',
            'elementIds',
            'fields',
            'bounds',
            'filter',
            'result'
          ].includes(key)
      ) ||
      !['selection', 'children', 'ids', 'region'].includes(query.scope) ||
      (query.result !== undefined &&
        !['elements', 'ids'].includes(query.result)) ||
      (query.result === 'ids' &&
        query.fields !== undefined &&
        (!Array.isArray(query.fields) || query.fields.length > 0)) ||
      (query.parentId !== undefined &&
        (query.scope !== 'children' ||
          typeof query.parentId !== 'string' ||
          !query.parentId.length ||
          query.parentId.length > 256))
    )
      throw new Error('Invalid document context query.')
    if (
      (query.scope === 'ids' &&
        (!Array.isArray(query.elementIds) ||
          !query.elementIds.length ||
          query.elementIds.some(
            (id) => typeof id !== 'string' || !id.length || id.length > 256
          ) ||
          new Set(query.elementIds).size !== query.elementIds.length)) ||
      (query.scope !== 'ids' && query.elementIds !== undefined) ||
      (query.fields !== undefined &&
        (!Array.isArray(query.fields) ||
          query.fields.some((field) => !designContextFields.includes(field)) ||
          new Set(query.fields).size !== query.fields.length))
    )
      throw new Error('Invalid document context targets or fields.')
    if (query.scope === 'region') {
      const bounds = query.bounds
      if (
        !bounds ||
        Object.keys(bounds).some(
          (key) => !['x', 'y', 'width', 'height'].includes(key)
        ) ||
        ![
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height,
          bounds.x + bounds.width,
          bounds.y + bounds.height
        ].every(Number.isFinite) ||
        bounds.width < 0 ||
        bounds.height < 0
      )
        throw new Error(
          'Region requires finite workspace bounds with nonnegative dimensions.'
        )
      if (
        query.filter !== undefined &&
        (!query.filter ||
          typeof query.filter !== 'object' ||
          Array.isArray(query.filter) ||
          Object.entries(query.filter).some(([key, value]) =>
            key === 'locked'
              ? typeof value !== 'boolean'
              : !['type', 'parentId', 'ancestorId'].includes(key) ||
                typeof value !== 'string' ||
                !value.length ||
                value.length > 256
          ))
      )
        throw new Error('Invalid region filter.')
    } else if (query.bounds !== undefined || query.filter !== undefined)
      throw new Error('Region bounds and filters require scope=region.')
    const metadata = new Map<
      string,
      ReturnType<DesignContextSource['getElementMetadata']>
    >()
    const readMetadata = (id: string) => {
      if (!metadata.has(id)) metadata.set(id, source.getElementMetadata(id))
      return metadata.get(id)
    }
    const fields = query.fields ?? []
    const elementIds = query.elementIds ?? []
    const offset = query.offset === undefined ? 0 : query.offset
    const limit =
      query.limit ?? (query.scope === 'ids' ? elementIds.length : 50)
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      (query.limit !== undefined && limit > designContextPageLimit) ||
      query.limit === null
    )
      throw new Error('Invalid document context page.')
    const parentId =
      query.scope === 'children'
        ? (query.parentId ?? source.getCurrentWorkspaceId() ?? null)
        : null
    const childPage =
      query.scope === 'children' && parentId
        ? source.getElementChildren(parentId, offset, limit)
        : undefined
    const available =
      query.scope !== 'children' || Boolean(childPage?.available)
    let ids: string[] = []
    if (query.scope === 'ids') ids = elementIds
    else if (query.scope === 'selection') ids = source.getSelectedElementIds()
    else if (query.scope === 'children') ids = childPage?.elementIds ?? []
    else
      ids = source.getElementIdsInBounds(query.bounds as Rect).filter((id) => {
        const data = readMetadata(id)
        if (!data) return false
        const filter = query.filter
        if (filter?.type !== undefined && data.type !== filter.type)
          return false
        if (filter?.parentId !== undefined && data.parentId !== filter.parentId)
          return false
        if (
          filter?.locked !== undefined &&
          (data.lock === true) !== filter.locked
        )
          return false
        if (filter?.ancestorId !== undefined) {
          let parent = data.parentId
          const visited = new Set<string>()
          while (typeof parent === 'string' && parent && !visited.has(parent)) {
            if (parent === filter.ancestorId) return true
            visited.add(parent)
            parent = readMetadata(parent)?.parentId
          }
          return false
        }
        return true
      })
    const total = childPage?.total ?? ids.length
    const pageIds =
      query.scope === 'children' ? ids : ids.slice(offset, offset + limit)
    const missingIds: string[] = []
    const matchedIds: string[] = []
    const elements: {
      id: string
      name: unknown
      type: unknown
      parentId: unknown
      visible: boolean
      locked: boolean
      childCount: number
      properties: Record<string, unknown>
      truncatedFields: string[]
    }[] = []
    for (const id of pageIds) {
      const data = readMetadata(id)
      if (!data) {
        missingIds.push(id)
        continue
      }
      matchedIds.push(id)
      if (query.result === 'ids') continue
      const computed = fields.length
        ? (source.getElementComputedData(id, fields) ?? {})
        : {}
      const properties: Record<string, unknown> = {}
      const truncatedFields: string[] = []
      for (const field of fields) {
        const value = computed[field]
        if (value === undefined) continue
        if (field === 'text' && typeof value === 'string') {
          properties[field] = value.slice(0, 2000)
          if (value.length > 2000) truncatedFields.push(field)
        } else if (
          (field === 'fills' || field === 'strokes') &&
          Array.isArray(value)
        ) {
          properties[field] = value.slice(0, 8).map((style) => {
            if (!style || typeof style !== 'object') return null
            return Object.fromEntries(
              ['type', 'color', 'opacity', 'visible', 'width', 'align']
                .filter((key) => key in style)
                .map((key) => [key, style[key]])
            )
          })
          if (value.length > 8) truncatedFields.push(field)
        } else properties[field] = value
      }
      elements.push({
        id,
        name: data.name,
        type: data.type,
        parentId: data.parentId,
        visible: data.visible !== false,
        locked: data.lock === true,
        childCount: data.childCount ?? 0,
        properties,
        truncatedFields
      })
    }
    return {
      available,
      scope: query.scope,
      parentId,
      offset,
      limit,
      total,
      ...(query.result === 'ids' ? { elementIds: matchedIds } : {}),
      nextOffset: offset + limit < total ? offset + limit : null,
      elements,
      missingIds
    }
  }

export const readDesignContext = createDesignContextReader(core)
