import { runTransaction, type Core } from '@asyra/core'
import {
  IDTypes,
  id,
  type ElementRawData,
  type PropertyComponentRawData
} from '@asyra/utils'
import {
  ITEM_COMPONENT_TYPE,
  ITEM_PROPERTY_NAME,
  ITEM_PROPERTY_TYPE,
  StarterDomainError,
  isValidItemOffset,
  isItemStatus,
  normalizeItemTitle,
  type ItemFieldExtension,
  type ItemStatus
} from '../domain/item-domain.js'

export interface ItemCommandApi extends Record<string, unknown> {
  addItem(input?: {
    title?: string
    status?: ItemStatus
    fields?: Record<string, unknown>
  }): string
  editItem(
    id: string,
    update: {
      title?: string
      status?: ItemStatus
      fields?: Record<string, unknown>
    }
  ): readonly string[]
  moveItem(id: string, offset: { x: number; y: number }): readonly string[]
}

const assertStatus = (status: unknown): ItemStatus => {
  if (!isItemStatus(status)) {
    throw new StarterDomainError(
      'item-status',
      `Unsupported item status: ${String(status)}`
    )
  }
  return status
}

const assertTitle = (title: unknown): string => {
  if (typeof title !== 'string') {
    throw new StarterDomainError('item-title', 'Item title must be a string.')
  }
  const normalized = normalizeItemTitle(title)
  if (normalized.length === 0) {
    throw new StarterDomainError('item-title', 'Item title is required.')
  }
  return normalized
}

export const assertItemFieldExtension = (
  itemField?: ItemFieldExtension
): void => {
  if (!itemField) {
    return
  }
  if (
    !itemField.key ||
    itemField.key === 'title' ||
    itemField.key === 'status' ||
    !itemField.validate(itemField.defaultValue)
  ) {
    throw new StarterDomainError(
      'item-field-definition',
      'Item field must have a distinct key and a valid default.'
    )
  }
}

const assertItemFields = (
  fields: Record<string, unknown> | undefined,
  itemField: ItemFieldExtension | undefined,
  includeDefault: boolean
): Record<string, string> => {
  if (
    fields !== undefined &&
    (!fields || typeof fields !== 'object' || Array.isArray(fields))
  ) {
    throw new StarterDomainError('item-field', 'Item fields must be an object.')
  }
  const keys = fields ? Object.keys(fields) : []
  if (keys.some((key) => key !== itemField?.key)) {
    throw new StarterDomainError('item-field', 'Unsupported Item field.')
  }
  if (!itemField) {
    return {}
  }
  if (keys.length === 0) {
    return includeDefault ? { [itemField.key]: itemField.defaultValue } : {}
  }
  const value = fields?.[itemField.key]
  if (!itemField.validate(value)) {
    throw new StarterDomainError('item-field', itemField.invalidMessage)
  }
  return { [itemField.key]: value as string }
}

const runActionTransaction = <T>(action: () => T): T =>
  runTransaction(action, { failureKind: 'handler-error' })

export const createItemApi = (
  core: Core,
  itemField?: ItemFieldExtension
): ItemCommandApi => {
  return {
    addItem(input = {}) {
      const title = assertTitle(input.title ?? 'Untitled item')
      const status = assertStatus(input.status ?? 'todo')
      const fields = assertItemFields(input.fields, itemField, true)
      return runActionTransaction(() => {
        const elementId = id(ITEM_COMPONENT_TYPE)
        const propertyId = id(IDTypes.PROPS)
        const element: ElementRawData = {
          id: elementId,
          type: ITEM_COMPONENT_TYPE,
          name: title,
          parentId: core.getCurrentWorkspaceId(),
          visible: true,
          lock: false,
          props: {
            [ITEM_PROPERTY_NAME]: propertyId
          }
        } as unknown as ElementRawData
        const property: PropertyComponentRawData = {
          id: propertyId,
          type: ITEM_PROPERTY_TYPE,
          title,
          status,
          offsetX: 0,
          offsetY: 0,
          ...fields
        } as PropertyComponentRawData
        const [createdId] = core.createElementsInParentFromCanonicalData(
          [element],
          [property],
          core.getCurrentWorkspaceId()
        )
        if (!createdId) {
          throw new Error('Item creation did not return an element id.')
        }
        return createdId
      })
    },
    editItem(id, update) {
      const values: Record<string, string> = {}
      if (update.title !== undefined) {
        values.title = assertTitle(update.title)
      }
      if (update.status !== undefined) {
        values.status = assertStatus(update.status)
      }
      Object.assign(values, assertItemFields(update.fields, itemField, false))
      if (Object.keys(values).length === 0) {
        return Object.freeze([])
      }

      return runActionTransaction(() =>
        core.updateElementProperties([
          {
            elementId: id,
            values
          }
        ])
      )
    },
    moveItem(id, offset) {
      if (!isValidItemOffset(offset.x) || !isValidItemOffset(offset.y)) {
        throw new StarterDomainError(
          'item-position',
          'Item position must be finite numbers.'
        )
      }
      return runActionTransaction(() =>
        core.updateElementProperties([
          { elementId: id, values: { offsetX: offset.x, offsetY: offset.y } }
        ])
      )
    }
  }
}
