import type { Core } from '@asyra/core'
import {
  TEXT_COMPONENT_DEFINITION,
  TEXT_COMPONENT_TYPE,
  TEXT_PROPERTY_DEFINITION,
  TEXT_PROPERTY_SCHEMA,
  TEXT_PROPERTY_TYPE,
  TEXT_RENDER_STRATEGY
} from '@asyra/preset'
import { createDefaultFill, type PropertySchema } from '@asyra/utils'

export const TEXT_TYPE = TEXT_COMPONENT_TYPE
export const TYPOGRAPHY_TYPE = TEXT_PROPERTY_TYPE
export const CHART_TYPE = 'chart-caption'
export const REFERENCE_TYPE = 'caption-reference'
export const STORAGE_SLOT = 'text-consumer-document'
export const APP_FEATURE = 'document-actions'
export const METADATA_UI = 'text-metadata'
export const TYPOGRAPHY_UI = 'text-controls'
export const CHART_UI = 'chart-caption-controls'

const metadataFields = [
  {
    key: 'approvalStatus',
    kind: 'string',
    defaultValue: 'draft',
    validate: (v) => v === 'draft' || v === 'approved'
  },
  {
    key: 'sourceRecordId',
    kind: 'string',
    defaultValue: '',
    validate: (v) => typeof v === 'string' && v.length <= 128
  },
  {
    key: 'labelCategory',
    kind: 'string',
    defaultValue: 'general',
    validate: (v) => v === 'general' || v === 'warning'
  }
] satisfies PropertySchema['fields']

export const textSchema: PropertySchema = {
  ...TEXT_PROPERTY_SCHEMA,
  fields: [...TEXT_PROPERTY_SCHEMA.fields, ...metadataFields]
}

export function installText(core: Core) {
  core.registerPropertySchema(TEXT_PROPERTY_SCHEMA)
  core.definePropertyComponent(TEXT_PROPERTY_DEFINITION)
  const base = core.getPropertyTypeDefinition(TEXT_PROPERTY_TYPE)
  if (!base) throw new Error('Missing official typography definition')
  for (const field of metadataFields) {
    if (base.fields.some((official) => official.key === field.key)) {
      throw new Error(`Text extension requires contract review: ${field.key}`)
    }
  }
  core.redefinePropertyType(TEXT_PROPERTY_TYPE, (current) => ({
    ...current,
    fields: [
      ...current.fields.map((field) =>
        field.key === 'textColor'
          ? { ...field, defaultValue: createDefaultFill().color }
          : field
      ),
      ...metadataFields.map((field) => ({
        ...field,
        persist: true,
        project: true,
        unit: false
      }))
    ]
  }))
  core.defineComponent({
    ...TEXT_COMPONENT_DEFINITION,
    properties: TEXT_COMPONENT_DEFINITION.properties.map((property) =>
      property.type === TEXT_PROPERTY_TYPE
        ? {
            ...property,
            alias: [
              ...(property.alias ?? []),
              ...metadataFields.map((field) => field.key)
            ]
          }
        : property
    )
  })
  core.registerRenderStrategy(TEXT_COMPONENT_TYPE, TEXT_RENDER_STRATEGY, {
    relations: ['position', 'dimension', TEXT_PROPERTY_TYPE].map((key) => ({
      name: `property:${key}`,
      target: { kind: 'property', key },
      onTargetUnregister: 'unregister-source'
    }))
  })
}

export function installChart(core: Core) {
  core.registerPropertySchema({
    type: REFERENCE_TYPE,
    fields: [
      {
        key: 'sourceTextId',
        kind: 'string',
        defaultValue: '',
        validate: (v) => typeof v === 'string'
      }
    ]
  })
  core.definePropertyComponent({
    type: REFERENCE_TYPE,
    defaults: { sourceTextId: '' }
  })
  core.defineComponent({
    type: CHART_TYPE,
    idPrefix: CHART_TYPE,
    namePrefix: 'Chart',
    properties: [
      {
        name: TYPOGRAPHY_TYPE,
        type: TYPOGRAPHY_TYPE,
        alias: textSchema.fields.map((field) => field.key)
      },
      { name: REFERENCE_TYPE, type: REFERENCE_TYPE, alias: ['sourceTextId'] }
    ]
  })
}
