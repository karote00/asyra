import type { PropertyComponentDefinition } from '@asyra/core'
import type { PropertySchema } from '@asyra/utils'
import { PRESET_REGISTRATION } from '../../registration.js'

export const TEXT_PROPERTY_TYPE = 'typography'

export const TextSizing = {
  AUTO_WIDTH: 'auto-width',
  AUTO_HEIGHT: 'auto-height',
  FIXED: 'fixed'
} as const

export interface TextData {
  textSizing: (typeof TextSizing)[keyof typeof TextSizing]
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'
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
        Object.values(TextSizing).some((mode) => mode === value)
    },
    {
      key: 'text',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.text,
      validate: (value) => typeof value === 'string' && value.length <= 100_000
    },
    {
      key: 'fontFamily',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.fontFamily,
      validate: (value) =>
        typeof value === 'string' &&
        value.trim().length > 0 &&
        value.length <= 128
    },
    {
      key: 'fontSize',
      kind: 'number',
      defaultValue: DEFAULT_TEXT_DATA.fontSize,
      validate: (value) => finiteRange(value, Number.MIN_VALUE, 4096)
    },
    {
      key: 'fontWeight',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.fontWeight,
      validate: (value) => value === 'normal' || value === 'bold'
    },
    {
      key: 'fontStyle',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.fontStyle,
      validate: (value) => value === 'normal' || value === 'italic'
    },
    {
      key: 'textAlign',
      kind: 'string',
      defaultValue: DEFAULT_TEXT_DATA.textAlign,
      validate: (value) =>
        value === 'left' || value === 'center' || value === 'right'
    },
    {
      key: 'lineHeight',
      kind: 'number',
      defaultValue: DEFAULT_TEXT_DATA.lineHeight,
      validate: (value) => finiteRange(value, Number.MIN_VALUE, 8192)
    },
    {
      key: 'letterSpacing',
      kind: 'number',
      defaultValue: DEFAULT_TEXT_DATA.letterSpacing,
      validate: (value) => finiteRange(value, -100, 100)
    }
  ]
}

export const TEXT_PROPERTY_DEFINITION: PropertyComponentDefinition = {
  type: TEXT_PROPERTY_TYPE,
  defaults: DEFAULT_TEXT_DATA,
  registration: PRESET_REGISTRATION
}
