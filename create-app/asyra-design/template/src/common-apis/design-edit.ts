import { DEFAULT_TEXT_DATA, TEXT_PROPERTY_SCHEMA } from '@asyra/preset'
import core from '../contexts'
import { elementApis } from './element'
import { fillApis } from './fills'
import { strokeApis } from './strokes'

export interface DesignElementEdit {
  elementId: string
  name?: string
  properties?: Record<string, string | number>
  fillColor?: string
  strokeColor?: string
}
interface DesignEditApis {
  getData(
    id: string
  ):
    | { type?: string; name?: string; parentId?: string; lock?: boolean }
    | undefined
  getComputed(
    id: string,
    fields: readonly string[]
  ): Record<string, unknown> | undefined
  properties(id: string, values: Record<string, string | number>): void
  rename(id: string, name: string): void
  fill(id: string, color: string): boolean
  stroke(id: string, color: string): boolean
}
const geometryFields = ['x', 'y', 'width', 'height', 'rotation']
const textFields = Object.keys(DEFAULT_TEXT_DATA)
const observationFields = [...geometryFields, ...textFields, 'fills', 'strokes']
const options = Object.freeze({
  undoable: true,
  sharedDelivery: 'immediate'
} as const)
const defaultApis: DesignEditApis = {
  getData: (id) => core.getElementData(id),
  getComputed: (id, fields) => core.getElementComputedData(id, fields),
  properties: (id, values) =>
    elementApis.updateElementProperties([id], values, options),
  rename: (id, name) => {
    core.updateElementData(id, { name }, options)
  },
  fill: (id, color) => fillApis.updatePrimaryFillColor(id, color, options),
  stroke: (id, color) => strokeApis.updatePrimaryStrokeColor(id, color, options)
}
const colorValid = (value: unknown) =>
  typeof value === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)

export const createDesignElementEditor =
  (apis: DesignEditApis = defaultApis) =>
  (request: DesignElementEdit) => {
    if (
      !request ||
      typeof request !== 'object' ||
      Array.isArray(request) ||
      Object.keys(request).some(
        (key) =>
          ![
            'elementId',
            'name',
            'properties',
            'fillColor',
            'strokeColor'
          ].includes(key)
      ) ||
      typeof request.elementId !== 'string' ||
      !request.elementId.length ||
      request.elementId.length > 256
    )
      throw new Error('Invalid design edit.')
    const { elementId, name, properties, fillColor, strokeColor } = request
    if (
      (name !== undefined &&
        (typeof name !== 'string' || !name.trim() || name.length > 160)) ||
      (fillColor !== undefined && !colorValid(fillColor)) ||
      (strokeColor !== undefined && !colorValid(strokeColor)) ||
      (properties !== undefined &&
        (!properties ||
          typeof properties !== 'object' ||
          Array.isArray(properties) ||
          !Object.keys(properties).length))
    )
      throw new Error('Invalid design edit values.')
    if (
      [name, properties, fillColor, strokeColor].every(
        (value) => value === undefined
      )
    )
      throw new Error('The design edit has no changes.')
    const target = apis.getData(elementId)
    if (!target || target.type === 'workspace')
      throw new Error('The edit target is unavailable.')
    const visited = new Set<string>()
    let id: string | undefined = elementId
    let data = target
    while (id) {
      if (visited.has(id) || visited.size >= 512)
        throw new Error('The target hierarchy is invalid.')
      visited.add(id)
      if (data.lock) throw new Error('The target or its parent is locked.')
      if (data.type === 'workspace') break
      id = data.parentId
      const parent = id ? apis.getData(id) : undefined
      if (!parent) throw new Error('The target parent is unavailable.')
      data = parent
    }
    const computed = apis.getComputed(elementId, observationFields)
    if (!computed) throw new Error('The target properties are unavailable.')
    const patch: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(properties ?? {})) {
      if (!Object.prototype.hasOwnProperty.call(computed, key))
        throw new Error(`The target does not support ${key}.`)
      if (geometryFields.includes(key)) {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          Math.abs(value) > 100000 ||
          (['width', 'height'].includes(key) && value <= 0)
        )
          throw new Error(`Invalid ${key}.`)
      } else {
        const field = TEXT_PROPERTY_SCHEMA.fields.find(
          (field) => field.key === key
        )
        if (target.type !== 'text' || !field?.validate?.(value))
          throw new Error(`Unsupported or invalid ${key}.`)
      }
      if (computed[key] !== value) patch[key] = value
    }
    for (const [key, color] of [
      ['fills', fillColor],
      ['strokes', strokeColor]
    ] as const) {
      if (
        color !== undefined &&
        (!Array.isArray(computed[key]) || !computed[key].length)
      )
        throw new Error(`The target has no primary ${key} to update.`)
    }
    let changed = false
    if (name !== undefined && name !== target.name) {
      apis.rename(elementId, name)
      changed = true
    }
    if (Object.keys(patch).length) {
      apis.properties(elementId, patch)
      changed = true
    }
    if (fillColor !== undefined)
      changed = apis.fill(elementId, fillColor) || changed
    if (strokeColor !== undefined)
      changed = apis.stroke(elementId, strokeColor) || changed
    return {
      status: changed ? 'complete' : 'no-change',
      compositionId: elementId,
      appliedElementIds: changed ? [elementId] : []
    }
  }
export const editDesignElement = createDesignElementEditor()
