import type { PropertyValueKind, PropertyFieldSchema } from '@asyra/utils'

export const matchesPropertyValueKind = (
  kind: PropertyValueKind,
  value: unknown
): boolean => {
  switch (kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'string':
      return typeof value === 'string'
    case 'boolean':
      return typeof value === 'boolean'
    case 'object':
      return (
        value === null ||
        (!!value && typeof value === 'object' && !Array.isArray(value))
      )
    case 'array':
      return Array.isArray(value)
    case 'custom':
      return true
  }
}

export const isRuntimePropertyFieldValueValid = (
  field: PropertyFieldSchema,
  value: unknown
): boolean => {
  if (!matchesPropertyValueKind(field.kind, value)) {
    return false
  }
  if (
    field.allowedUnits &&
    field.allowedUnits.length > 0 &&
    typeof value === 'string' &&
    !field.allowedUnits.some((unit) => unit === value)
  ) {
    return false
  }
  if (!field.validate) {
    return true
  }
  try {
    return field.validate(value as never)
  } catch {
    return false
  }
}
