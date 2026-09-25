import core from '../contexts'

export interface DesignContextQuery {
  scope: 'selection' | 'children' | 'ids'
  elementIds?: string[]
  fields?: string[]
  parentId?: string
  offset?: number
  limit?: number
}
interface DesignContextSource {
  getCurrentWorkspaceId(): string | null | undefined
  getSelectedElementIds(): string[]
  getElementData(id: string):
    | {
        name?: unknown
        type?: unknown
        parentId?: unknown
        visible?: unknown
        lock?: unknown
        children?: unknown
      }
    | undefined
  getElementComputedData(
    id: string,
    fields: readonly string[]
  ): Record<string, unknown> | undefined
}
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
            'fields'
          ].includes(key)
      ) ||
      !['selection', 'children', 'ids'].includes(query.scope) ||
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
      (query.limit !== undefined && limit > 200) ||
      query.limit === null
    )
      throw new Error('Invalid document context page.')
    const parentId =
      query.scope === 'children'
        ? (query.parentId ?? source.getCurrentWorkspaceId() ?? null)
        : null
    const parent = parentId ? source.getElementData(parentId) : undefined
    const available = query.scope !== 'children' || Boolean(parent)
    let ids: string[] = []
    if (query.scope === 'ids') ids = elementIds
    else if (query.scope === 'selection') ids = source.getSelectedElementIds()
    else if (Array.isArray(parent?.children))
      ids = parent.children.filter((id): id is string => typeof id === 'string')
    const missingIds: string[] = []
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
    for (const id of ids.slice(offset, offset + limit)) {
      const data = source.getElementData(id)
      if (!data) {
        missingIds.push(id)
        continue
      }
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
        childCount: Array.isArray(data.children) ? data.children.length : 0,
        properties,
        truncatedFields
      })
    }
    return {
      available,
      scope: query.scope,
      parentId,
      offset,
      total: ids.length,
      nextOffset: offset + limit < ids.length ? offset + limit : null,
      elements,
      missingIds
    }
  }

export const readDesignContext = createDesignContextReader(core)
