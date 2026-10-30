import type { PropertyComponentDefinition } from '@asyra/core'
import type { PropertySchema } from '@asyra/utils'
import { PRESET_REGISTRATION } from '../../registration.js'

export const TEXT_PROPERTY_TYPE = 'typography'

export const TextSizing = {
  AUTO_WIDTH: 'auto-width',
  AUTO_HEIGHT: 'auto-height',
  FIXED: 'fixed'
} as const

/** Canonical value constraints; target capabilities and write/load policy stay with their owners. */
export const TEXT_PROPERTY_VALUE_SCHEMAS = Object.freeze({
  textSizing: Object.freeze({
    type: 'string',
    enum: Object.freeze(Object.values(TextSizing))
  }),
  text: Object.freeze({ type: 'string', maxLength: 100_000 }),
  fontFamily: Object.freeze({
    type: 'string',
    minLength: 1,
    maxLength: 128,
    pattern: '\\S'
  }),
  fontSize: Object.freeze({
    type: 'number',
    minimum: Number.MIN_VALUE,
    maximum: 4096
  }),
  fontWeight: Object.freeze({
    type: 'string',
    enum: Object.freeze(['normal', 'bold'] as const)
  }),
  fontStyle: Object.freeze({
    type: 'string',
    enum: Object.freeze(['normal', 'italic'] as const)
  }),
  textAlign: Object.freeze({
    type: 'string',
    enum: Object.freeze(['left', 'center', 'right'] as const)
  }),
  lineHeight: Object.freeze({
    type: 'number',
    minimum: Number.MIN_VALUE,
    maximum: 8192
  }),
  letterSpacing: Object.freeze({ type: 'number', minimum: -100, maximum: 100 })
})

export interface TextData {
  textSizing: (typeof TextSizing)[keyof typeof TextSizing]
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: (typeof TEXT_PROPERTY_VALUE_SCHEMAS.fontWeight.enum)[number]
  fontStyle: (typeof TEXT_PROPERTY_VALUE_SCHEMAS.fontStyle.enum)[number]
  textAlign: (typeof TEXT_PROPERTY_VALUE_SCHEMAS.textAlign.enum)[number]
  lineHeight: number
  letterSpacing: number
}

export const DEFAULT_TEXT_DATA: Readonly<TextData> = Object.freeze({
  text: '',
  textSizing: TextSizing.FIXED,
  fontFamily: 'sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  lineHeight: 20,
  letterSpacing: 0
})

const finiteRange = (value: unknown, min: number, max: number) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max

export const TEXT_PROPERTY_SCHEMA: PropertySchema = {
  type: TEXT_PROPERTY_TYPE,
  fields: [
    {
      key: 'textSizing',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.textSizing,
      validate: (value) =>
        TEXT_PROPERTY_VALUE_SCHEMAS.textSizing.enum.some(
          (mode) => mode === value
        )
    },
    {
      key: 'text',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.text,
      validate: (value) =>
        typeof value === 'string' &&
        value.length <= TEXT_PROPERTY_VALUE_SCHEMAS.text.maxLength
    },
    {
      key: 'fontFamily',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.fontFamily,
      validate: (value) =>
        typeof value === 'string' &&
        value.trim().length >=
          TEXT_PROPERTY_VALUE_SCHEMAS.fontFamily.minLength &&
        value.length <= TEXT_PROPERTY_VALUE_SCHEMAS.fontFamily.maxLength
    },
    {
      key: 'fontSize',
      kind: 'number',
      defaultValue: DEFAULT_TEXT_DATA.fontSize,
      validate: (value) =>
        finiteRange(
          value,
          TEXT_PROPERTY_VALUE_SCHEMAS.fontSize.minimum,
          TEXT_PROPERTY_VALUE_SCHEMAS.fontSize.maximum
        )
    },
    {
      key: 'fontWeight',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.fontWeight,
      validate: (value) =>
        TEXT_PROPERTY_VALUE_SCHEMAS.fontWeight.enum.some(
          (option) => option === value
        )
    },
    {
      key: 'fontStyle',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.fontStyle,
      validate: (value) =>
        TEXT_PROPERTY_VALUE_SCHEMAS.fontStyle.enum.some(
          (option) => option === value
        )
    },
    {
      key: 'textAlign',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.textAlign,
      validate: (value) =>
        TEXT_PROPERTY_VALUE_SCHEMAS.textAlign.enum.some(
          (option) => option === value
        )
    },
    {
      key: 'lineHeight',
      kind: 'number',
      defaultValue: DEFAULT_TEXT_DATA.lineHeight,
      validate: (value) =>
        finiteRange(
          value,
          TEXT_PROPERTY_VALUE_SCHEMAS.lineHeight.minimum,
          TEXT_PROPERTY_VALUE_SCHEMAS.lineHeight.maximum
        )
    },
    {
      key: 'letterSpacing',
      kind: 'number',
      defaultValue: DEFAULT_TEXT_DATA.letterSpacing,
      validate: (value) =>
        finiteRange(
          value,
          TEXT_PROPERTY_VALUE_SCHEMAS.letterSpacing.minimum,
          TEXT_PROPERTY_VALUE_SCHEMAS.letterSpacing.maximum
        )
    }
  ]
}

export const TEXT_PROPERTY_DEFINITION: PropertyComponentDefinition = {
  type: TEXT_PROPERTY_TYPE,
  defaults: DEFAULT_TEXT_DATA,
  registration: PRESET_REGISTRATION
}
