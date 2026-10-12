import type { AiJsonValue } from './types.js'

interface RecipeConstraints {
  enum?: AiJsonValue[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  'x-runtime-value'?: 'request' | 'document' | 'secret'
}

export type RecipeSchema = RecipeConstraints &
  (
    | {
        type: 'object'
        properties: Record<string, RecipeSchema>
        required: string[]
        additionalProperties: false
      }
    | { type: 'array'; items: RecipeSchema }
    | { type: 'string' | 'number' | 'integer' | 'boolean' | 'null' }
  )

export const recipeRecord = (
  value: unknown
): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const recipeOwn = (value: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(value, key)

const commonKeys = ['type', 'description', 'title', 'enum', 'x-runtime-value']
const keysByType: Record<RecipeSchema['type'], string[]> = {
  object: ['properties', 'required', 'additionalProperties'],
  array: ['items', 'minItems', 'maxItems'],
  string: ['minLength', 'maxLength'],
  number: ['minimum', 'maximum'],
  integer: ['minimum', 'maximum'],
  boolean: [],
  null: []
}

/** Conservative implication subset; primitive calls still use the host validator. */
export const readRecipeSchema = (value: unknown, depth = 0): RecipeSchema => {
  if (
    !recipeRecord(value) ||
    depth > 32 ||
    typeof value.type !== 'string' ||
    !recipeOwn(keysByType, value.type)
  )
    throw new Error('Expected a concrete supported schema type')
  const type = value.type as RecipeSchema['type']
  const keys = [...commonKeys, ...keysByType[type]]
  if (Object.keys(value).some((key) => !keys.includes(key)))
    throw new Error(
      'Schema keyword is outside the supported composition subset'
    )
  if (
    value['x-runtime-value'] !== undefined &&
    !['request', 'document', 'secret'].includes(
      value['x-runtime-value'] as string
    )
  )
    throw new Error('Unknown runtime value annotation')
  if (
    value.enum !== undefined &&
    (!Array.isArray(value.enum) || value.enum.length === 0)
  )
    throw new Error('Expected a nonempty enum')
  if (value.enum !== undefined && (type === 'object' || type === 'array'))
    throw new Error(
      'Structural enums are outside the supported composition subset'
    )
  for (const [min, max] of [
    ['minimum', 'maximum'],
    ['minLength', 'maxLength'],
    ['minItems', 'maxItems']
  ]) {
    for (const key of [min, max]) {
      const bound = value[key]
      if (
        bound !== undefined &&
        (typeof bound !== 'number' ||
          !Number.isFinite(bound) ||
          (key !== 'minimum' &&
            key !== 'maximum' &&
            (!Number.isSafeInteger(bound) || bound < 0)))
      )
        throw new Error('Invalid schema bound')
    }
    if (
      value[min] !== undefined &&
      value[max] !== undefined &&
      (value[min] as number) > (value[max] as number)
    )
      throw new Error('Contradictory schema bounds')
  }
  if (type === 'object') {
    if (
      !recipeRecord(value.properties) ||
      !Array.isArray(value.required) ||
      value.additionalProperties !== false
    )
      throw new Error(
        'Composition objects require properties, required and additionalProperties false'
      )
    const properties = value.properties
    if (
      value.required.some(
        (key) => typeof key !== 'string' || !recipeOwn(properties, key)
      ) ||
      new Set(value.required).size !== value.required.length
    )
      throw new Error('Invalid required property names')
    Object.values(value.properties).forEach((child) =>
      readRecipeSchema(child, depth + 1)
    )
  }
  if (type === 'array') readRecipeSchema(value.items, depth + 1)
  return value as unknown as RecipeSchema
}

export const recipePointer = (path: string): readonly string[] => {
  if (path === '') return []
  if (!path.startsWith('/') || /~(?![01])/u.test(path))
    throw new Error('Expected an RFC 6901 JSON Pointer')
  return path
    .slice(1)
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
}

export const recipeSchemaAt = (
  schema: RecipeSchema,
  path: string
): RecipeSchema => {
  let current = schema
  let lifetime = current['x-runtime-value']
  for (const key of recipePointer(path)) {
    if (
      current.type === 'object' &&
      current.required.includes(key) &&
      recipeOwn(current.properties, key)
    ) {
      current = current.properties[key]
    } else if (
      current.type === 'array' &&
      /^(0|[1-9][0-9]*)$/u.test(key) &&
      Number(key) < (current.minItems ?? 0)
    ) {
      current = current.items
    } else throw new Error('Source path is absent or not guaranteed to exist')
    lifetime ??= current['x-runtime-value']
  }
  return lifetime ? { ...current, 'x-runtime-value': lifetime } : current
}

const lower = (
  source: number | undefined,
  target: number | undefined,
  fallback: number
) => target === undefined || (source ?? fallback) >= target
const upper = (source: number | undefined, target: number | undefined) =>
  target === undefined || (source ?? Infinity) <= target

export const recipeAssignable = (
  source: RecipeSchema,
  target: RecipeSchema
): boolean => {
  if (
    source.type !== target.type &&
    !(source.type === 'integer' && target.type === 'number')
  )
    return false
  if (source['x-runtime-value'] !== target['x-runtime-value']) return false
  const targetEnum = target.enum
  if (
    targetEnum &&
    (!source.enum || !source.enum.every((value) => targetEnum.includes(value)))
  )
    return false
  if (
    !lower(source.minimum, target.minimum, -Infinity) ||
    !upper(source.maximum, target.maximum) ||
    !lower(source.minLength, target.minLength, 0) ||
    !upper(source.maxLength, target.maxLength) ||
    !lower(source.minItems, target.minItems, 0) ||
    !upper(source.maxItems, target.maxItems)
  )
    return false
  if (source.type === 'object' && target.type === 'object') {
    if (!target.required.every((key) => source.required.includes(key)))
      return false
    return Object.entries(source.properties).every(
      ([key, child]) =>
        recipeOwn(target.properties, key) &&
        recipeAssignable(child, target.properties[key])
    )
  }
  if (source.type === 'array' && target.type === 'array')
    return recipeAssignable(source.items, target.items)
  return true
}

export const recipeCapturesValue = (
  value: unknown,
  schema: RecipeSchema
): boolean => {
  if (schema['x-runtime-value']) return true
  if (schema.type === 'object' && recipeRecord(value))
    return Object.entries(value).some(
      ([key, child]) =>
        recipeOwn(schema.properties, key) &&
        recipeCapturesValue(child, schema.properties[key])
    )
  if (schema.type === 'array' && Array.isArray(value))
    return value.some((child) => recipeCapturesValue(child, schema.items))
  return false
}
