import type { CoreRawData } from '@asyra/utils'
import { textSchema, TYPOGRAPHY_TYPE } from './definitions.js'

export interface DocumentEnvelope {
  documentVersion: number
  core: CoreRawData
  typographySemantics?: { letterSpacing: 'layout' }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function typographyProperties(core: CoreRawData) {
  return Object.values(core.props).filter((property) => {
    if (!isRecord(property)) throw new Error('Invalid property')
    return property.type === TYPOGRAPHY_TYPE
  }) as unknown as Record<string, unknown>[]
}

function validateTypography(values: Record<string, unknown>) {
  for (const field of textSchema.fields) {
    if (!field.validate?.(values[field.key]))
      throw new Error(`Invalid ${field.key}`)
  }
}

function encodeSpacing(values: Record<string, unknown>) {
  if ('tracking' in values)
    throw new Error('Conflicting spacing representation')
  validateTypography(values)
  values.tracking = { unit: 'layout', value: values.letterSpacing }
  delete values.letterSpacing
}

export function prepareDocument(input: unknown): CoreRawData {
  const candidate: unknown = structuredClone(input)
  if (
    !isRecord(candidate) ||
    ![1, 2, 3].includes(Number(candidate.documentVersion)) ||
    typeof candidate.documentVersion !== 'number' ||
    !isRecord(candidate.core) ||
    !isRecord(candidate.core.props)
  ) {
    throw new Error('Unsupported document format')
  }
  if (
    'typographySemantics' in candidate &&
    (!isRecord(candidate.typographySemantics) ||
      candidate.typographySemantics.letterSpacing !== 'layout')
  ) {
    throw new Error('Unresolved typography units')
  }
  const envelope = candidate as unknown as DocumentEnvelope
  const properties = typographyProperties(envelope.core)
  if (envelope.documentVersion === 1) {
    for (const values of properties) {
      if (
        typeof values.lineHeight !== 'number' ||
        !Number.isFinite(values.lineHeight) ||
        values.lineHeight <= 0 ||
        typeof values.fontSize !== 'number'
      ) {
        throw new Error('Invalid multiplier format')
      }
      values.lineHeight *= values.fontSize
      validateTypography(values)
    }
    envelope.documentVersion = 2
  }
  if (envelope.documentVersion === 2) {
    for (const values of properties) encodeSpacing(values)
    envelope.documentVersion = 3
  }
  for (const values of properties) {
    if ('letterSpacing' in values)
      throw new Error('Conflicting spacing representation')
    if (!isRecord(values.tracking) || values.tracking.unit !== 'layout')
      throw new Error('Invalid tracking units')
    values.letterSpacing = values.tracking.value
    delete values.tracking
    validateTypography(values)
  }
  return envelope.core
}

export function serializeDocument(raw: CoreRawData): DocumentEnvelope {
  const core = structuredClone(raw)
  for (const values of typographyProperties(core)) encodeSpacing(values)
  return { documentVersion: 3, core }
}
