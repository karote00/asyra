import type { CoreRawData, PropertySchema } from '@asyra/utils'

export const ITEM_COMPONENT_TYPE = 'starter-item'
export const ITEM_PROPERTY_NAME = 'itemData'
export const ITEM_PROPERTY_TYPE = 'starter-item-data'
export const STARTER_FEATURE_NAME = 'starter-item-commands'
export const STARTER_STORAGE_SLOT = 'starter-app.document.v1'
export const STARTER_DOCUMENT_VERSION = 1

export const ITEM_STATUSES = ['todo', 'doing', 'done'] as const

export type ItemStatus = (typeof ITEM_STATUSES)[number]

export interface ItemProjection {
  readonly id: string
  readonly title: string
  readonly status: ItemStatus
}

export interface StarterDocumentWrapper {
  readonly appDocumentVersion: typeof STARTER_DOCUMENT_VERSION
  readonly savedAt: string
  readonly core: CoreRawData
}

export class StarterDomainError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'StarterDomainError'
    this.code = code
  }
}

export const isItemStatus = (value: unknown): value is ItemStatus =>
  typeof value === 'string' && ITEM_STATUSES.some((status) => status === value)

export const isValidItemTitle = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const normalizeItemTitle = (value: string): string => value.trim()

export const createItemPropertySchema = (): PropertySchema => ({
  type: ITEM_PROPERTY_TYPE,
  fields: [
    {
      key: 'title',
      kind: 'string',
      defaultValue: 'Untitled item',
      validate: isValidItemTitle
    },
    {
      key: 'status',
      kind: 'string',
      defaultValue: 'todo',
      validate: isItemStatus
    }
  ]
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isCoreDocument = (value: unknown): value is CoreRawData =>
  isRecord(value) && isRecord(value.sceneTree) && isRecord(value.props)

export const assertStarterWrapper = (
  value: unknown
): StarterDocumentWrapper => {
  if (!isRecord(value)) {
    throw new StarterDomainError(
      'wrapper-shape',
      'Saved document is not an object.'
    )
  }
  if (value.appDocumentVersion !== STARTER_DOCUMENT_VERSION) {
    throw new StarterDomainError(
      'wrapper-version',
      `Saved document version must be ${STARTER_DOCUMENT_VERSION}.`
    )
  }
  if (typeof value.savedAt !== 'string' || value.savedAt.length === 0) {
    throw new StarterDomainError(
      'wrapper-saved-at',
      'Saved document is missing its savedAt timestamp.'
    )
  }
  if (!isCoreDocument(value.core)) {
    throw new StarterDomainError(
      'wrapper-core',
      'Saved document is missing a Core payload.'
    )
  }

  return value as unknown as StarterDocumentWrapper
}

export const assertStarterDomainData = (core: CoreRawData): void => {
  const props = core.props
  if (!isRecord(props)) {
    throw new StarterDomainError(
      'core-props',
      'Saved Core payload has no Props data.'
    )
  }

  Object.entries(props).forEach(([propertyId, rawProperty]) => {
    if (!isRecord(rawProperty) || rawProperty.type !== ITEM_PROPERTY_TYPE) {
      return
    }

    if (!isValidItemTitle(rawProperty.title)) {
      throw new StarterDomainError(
        'item-title',
        `Item property "${propertyId}" is missing a valid title.`
      )
    }
    if (!isItemStatus(rawProperty.status)) {
      throw new StarterDomainError(
        'item-status',
        `Item property "${propertyId}" has an invalid status.`
      )
    }
  })
}

export const parseStarterDocumentWrapper = (
  serialized: string
): StarterDocumentWrapper => {
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch (error) {
    throw new StarterDomainError(
      'json-parse',
      error instanceof Error ? error.message : 'Saved document is not JSON.'
    )
  }

  const wrapper = assertStarterWrapper(parsed)
  assertStarterDomainData(wrapper.core)
  return wrapper
}

export const createStarterDocumentWrapper = (
  core: CoreRawData,
  savedAt = new Date().toISOString()
): StarterDocumentWrapper => ({
  appDocumentVersion: STARTER_DOCUMENT_VERSION,
  savedAt,
  core
})
