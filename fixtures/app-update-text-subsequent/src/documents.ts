import type { CoreRawData } from '@asyra/utils'
import { textSchema, TYPOGRAPHY_TYPE } from './definitions.js'

export interface DocumentEnvelope {
  documentVersion: number
  core: CoreRawData
}

export function prepareDocument(input: unknown): CoreRawData {
  const envelope = structuredClone(input) as DocumentEnvelope
  if (
    !envelope ||
    ![1, 2].includes(envelope.documentVersion) ||
    !envelope.core?.props
  ) {
    throw new Error('Unsupported document format')
  }
  for (const property of Object.values(envelope.core.props)) {
    if (property.type !== TYPOGRAPHY_TYPE) continue
    const values = property as unknown as Record<string, unknown>
    if (envelope.documentVersion === 1) {
      if (
        typeof values.lineHeight !== 'number' ||
        typeof values.fontSize !== 'number'
      ) {
        throw new Error('Invalid multiplier format')
      }
      values.lineHeight *= values.fontSize
    }
    for (const field of textSchema.fields) {
      if (!field.validate?.(values[field.key]))
        throw new Error(`Invalid ${field.key}`)
    }
  }
  return envelope.core
}
