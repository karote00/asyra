import type { AiJsonValue } from './types.js'

interface RecipeConstraints {
  raw?: AiJsonValue
  uniqueItems?: boolean
  enum?: AiJsonValue[]
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  pattern?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  'x-runtime-value'?: 'request' | 'request-artifact' | 'document' | 'secret'
}

export type RecipeSchema = RecipeConstraints &
  (
    | {
        type: 'object'
        properties: Record<string, RecipeSchema>
        required: string[]
        additionalProperties: boolean
      }
    | { type: 'array'; items: RecipeSchema; prefixItems?: RecipeSchema[] }
    | { type: 'union'; variants: RecipeSchema[]; exclusive: boolean }
    | { type: 'opaque' | 'never' }
    | { type: 'reference'; resolve: () => RecipeSchema }
    | { type: 'string' | 'number' | 'integer' | 'boolean' | 'null' }
  )

export const recipeRecord = (
  value: unknown
): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const recipeOwn = (value: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(value, key)

const commonKeys = ['type', 'description', 'title', 'enum', 'x-runtime-value']
const keysByType: Record<
  Exclude<RecipeSchema['type'], 'union' | 'opaque' | 'never' | 'reference'>,
  string[]
> = {
  object: ['properties', 'required', 'additionalProperties'],
  array: ['items', 'minItems', 'maxItems', 'uniqueItems'],
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
  const type = value.type as keyof typeof keysByType
  const keys = [...commonKeys, ...keysByType[type]]
  if (Object.keys(value).some((key) => !keys.includes(key)))
    throw new Error(
      'Schema keyword is outside the supported composition subset'
    )
  if (
    value['x-runtime-value'] !== undefined &&
    !['request', 'request-artifact', 'document', 'secret'].includes(
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
  if (type === 'array') {
    if (
      value.uniqueItems !== undefined &&
      typeof value.uniqueItems !== 'boolean'
    )
      throw new Error('Expected boolean uniqueItems')
    readRecipeSchema(value.items, depth + 1)
  }
  return { ...value, raw: value } as unknown as RecipeSchema
}

/** Intersect supported common constraints; an unknown overlap stays opaque. */
const intersectRegistered = (left: unknown, right: unknown): unknown => {
  if (left === false || right === false) return false
  if (!recipeRecord(left)) return right
  if (!recipeRecord(right)) return left
  const result: Record<string, unknown> = { ...left }
  for (const [key, value] of Object.entries(right)) {
    if (
      !recipeOwn(result, key) ||
      JSON.stringify(result[key]) === JSON.stringify(value)
    ) {
      result[key] = value
    } else if (
      key === 'required' &&
      Array.isArray(result[key]) &&
      Array.isArray(value)
    ) {
      result[key] = [...new Set([...result[key], ...value])]
    } else if (
      key === 'properties' &&
      recipeRecord(result[key]) &&
      recipeRecord(value)
    ) {
      const properties = { ...result[key] }
      for (const [name, child] of Object.entries(value)) {
        if (recipeOwn(properties, name))
          properties[name] = intersectRegistered(properties[name], child)
        else
          properties[name] = left.additionalProperties === false ? false : child
      }
      if (right.additionalProperties === false)
        for (const name of Object.keys(properties))
          if (!recipeOwn(value, name)) properties[name] = false
      result[key] = properties
    } else if (
      key === 'additionalProperties' &&
      typeof result[key] === 'boolean' &&
      typeof value === 'boolean'
    ) {
      result[key] = result[key] && value
    } else if (
      key === 'enum' &&
      Array.isArray(result[key]) &&
      Array.isArray(value)
    ) {
      result[key] = result[key].filter((item) => value.includes(item))
    } else if (['description', 'title', 'default', 'examples'].includes(key)) {
      result[key] = value
    } else {
      return { allOf: [left, right] }
    }
  }
  if (recipeRecord(result.properties)) {
    for (const closed of [left, right]) {
      if (closed.additionalProperties !== false) continue
      const allowed = recipeRecord(closed.properties) ? closed.properties : {}
      for (const name of Object.keys(result.properties))
        if (!recipeOwn(allowed, name)) result.properties[name] = false
    }
  }
  return result
}

/** Registered references are lazy: recursive declarations never expand as trees. */
export const readRegisteredRecipeSchema = (root: unknown): RecipeSchema => {
  const references = new Map<string, RecipeSchema>()
  const parsed = new WeakMap<object, RecipeSchema>()
  const read = (value: unknown, depth = 0): RecipeSchema => {
    if (depth > 32) throw new Error('Schema nesting exceeds the proof budget')
    const raw =
      recipeRecord(value) && recipeRecord(root) && root.$defs
        ? ({ ...value, $defs: root.$defs } as unknown as AiJsonValue)
        : (value as AiJsonValue)
    const opaque = (): RecipeSchema => ({ type: 'opaque', raw })
    if (value === false) return { type: 'never', raw: false }
    if (!recipeRecord(value)) return opaque()
    const known = parsed.get(value)
    if (known) return known
    const annotation = value['x-runtime-value']
    if (
      annotation !== undefined &&
      !['request', 'request-artifact', 'document', 'secret'].includes(
        String(annotation)
      )
    )
      throw new Error('Unknown runtime value annotation')
    const metadata = annotation
      ? {
          'x-runtime-value': annotation as RecipeConstraints['x-runtime-value']
        }
      : {}
    const normalized = { ...value }
    for (const key of [
      '$defs',
      '$schema',
      'description',
      'title',
      'default',
      'examples'
    ])
      Reflect.deleteProperty(normalized, key)
    if (typeof normalized.$ref === 'string') {
      const pointer = normalized.$ref
      if (
        Object.keys(normalized).some(
          (key) => !['$ref', 'x-runtime-value'].includes(key)
        ) ||
        !pointer.startsWith('#/$defs/')
      )
        return opaque()
      let resolved = references.get(pointer)
      if (!resolved) {
        let target: unknown = root
        for (const key of recipePointer(pointer.slice(1)))
          target =
            recipeRecord(target) && recipeOwn(target, key)
              ? target[key]
              : undefined
        if (target === undefined) return opaque()
        const valueAtReference = target
        resolved = {
          type: 'reference',
          raw,
          resolve: () => read(valueAtReference)
        }
        references.set(pointer, resolved)
      }
      return { ...resolved, ...metadata, raw }
    }
    const mode = recipeOwn(normalized, 'oneOf') ? 'oneOf' : 'anyOf'
    if (recipeOwn(normalized, mode)) {
      const variants = normalized[mode]
      if (!Array.isArray(variants) || variants.length === 0) return opaque()
      Reflect.deleteProperty(normalized, mode)
      const result: RecipeSchema = {
        type: 'union',
        raw,
        ...metadata,
        exclusive: mode === 'oneOf',
        variants: variants.map((child) =>
          read(intersectRegistered(normalized, child), depth + 1)
        )
      }
      parsed.set(value, result)
      return result
    }
    if (recipeOwn(normalized, 'const')) {
      if (normalized.const !== null && typeof normalized.const === 'object')
        return opaque()
      if (
        Array.isArray(normalized.enum) &&
        !normalized.enum.includes(normalized.const)
      )
        return { type: 'never', raw }
      normalized.enum = [normalized.const]
      delete normalized.const
    }
    if (normalized.type === undefined && Array.isArray(normalized.enum)) {
      const types = new Set(
        normalized.enum.map((item) => (item === null ? 'null' : typeof item))
      )
      if (types.size === 1) normalized.type = [...types][0]
    }
    const type = normalized.type
    if (typeof type !== 'string' || !recipeOwn(keysByType, type))
      return opaque()
    const keys = [
      ...commonKeys,
      ...keysByType[type as keyof typeof keysByType],
      ...(type === 'array' ? ['uniqueItems', 'prefixItems'] : []),
      ...(['number', 'integer'].includes(type)
        ? ['exclusiveMinimum', 'exclusiveMaximum']
        : []),
      ...(type === 'string' ? ['pattern'] : [])
    ]
    if (Object.keys(normalized).some((key) => !keys.includes(key)))
      return opaque()
    if (type === 'object') {
      normalized.properties ??= {}
      normalized.required ??= []
      normalized.additionalProperties ??= true
      if (
        !recipeRecord(normalized.properties) ||
        !Array.isArray(normalized.required) ||
        typeof normalized.additionalProperties !== 'boolean' ||
        normalized.required.some(
          (key) =>
            typeof key !== 'string' ||
            !recipeOwn(normalized.properties as object, key)
        ) ||
        new Set(normalized.required).size !== normalized.required.length ||
        normalized.enum !== undefined
      )
        return opaque()
      const result = {
        ...normalized,
        ...metadata,
        raw,
        properties: Object.fromEntries(
          Object.entries(normalized.properties).map(([key, child]) => [
            key,
            read(child, depth + 1)
          ])
        )
      } as unknown as RecipeSchema
      parsed.set(value, result)
      return result
    }
    if (type === 'array') {
      if (
        (normalized.uniqueItems !== undefined &&
          typeof normalized.uniqueItems !== 'boolean') ||
        (normalized.prefixItems !== undefined &&
          !Array.isArray(normalized.prefixItems))
      )
        return opaque()
      const bounds: Record<string, unknown> = {
        ...normalized,
        items: { type: 'null' }
      }
      delete bounds.uniqueItems
      delete bounds.prefixItems
      try {
        readRecipeSchema(bounds)
      } catch {
        return opaque()
      }
      const result = {
        ...normalized,
        ...metadata,
        raw,
        ...(Array.isArray(normalized.prefixItems)
          ? {
              prefixItems: normalized.prefixItems.map((child) =>
                read(child, depth + 1)
              )
            }
          : {}),
        items: read(normalized.items ?? true, depth + 1)
      } as unknown as RecipeSchema
      parsed.set(value, result)
      return result
    }
    const primitive = { ...normalized }
    for (const key of ['exclusiveMinimum', 'exclusiveMaximum']) {
      if (
        primitive[key] !== undefined &&
        (typeof primitive[key] !== 'number' || !Number.isFinite(primitive[key]))
      )
        return opaque()
      Reflect.deleteProperty(primitive, key)
    }
    if (primitive.pattern !== undefined) {
      if (typeof primitive.pattern !== 'string') return opaque()
      try {
        new RegExp(primitive.pattern, 'u')
      } catch {
        return opaque()
      }
      delete primitive.pattern
    }
    try {
      readRecipeSchema(primitive)
    } catch {
      return opaque()
    }
    return { ...normalized, ...metadata, raw } as unknown as RecipeSchema
  }
  const result = read(root)
  if (result.type === 'opaque')
    throw new Error('Expected a supported dependency schema')
  return result
}

export const recipeResolve = (schema: RecipeSchema): RecipeSchema => {
  const visited = new Set<RecipeSchema>()
  let current = schema
  let lifetime = schema['x-runtime-value']
  while (current.type === 'reference') {
    if (visited.has(current) || visited.size >= 32)
      return { type: 'opaque', raw: schema.raw }
    visited.add(current)
    current = current.resolve()
    if (
      lifetime &&
      current['x-runtime-value'] &&
      lifetime !== current['x-runtime-value']
    )
      return { type: 'opaque', raw: schema.raw }
    lifetime ??= current['x-runtime-value']
  }
  return lifetime ? { ...current, 'x-runtime-value': lifetime } : current
}

export const recipeValidationSchema = (schema: RecipeSchema): AiJsonValue =>
  schema.raw ?? (schema as unknown as AiJsonValue)

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
  const visit = (
    current: RecipeSchema,
    keys: readonly string[],
    inherited?: RecipeConstraints['x-runtime-value']
  ): RecipeSchema => {
    current = recipeResolve(current)
    const lifetime = inherited ?? current['x-runtime-value']
    if (current.type === 'union')
      return {
        ...current,
        variants: current.variants.map((variant) =>
          visit(variant, keys, lifetime)
        )
      }
    if (!keys.length)
      return lifetime ? { ...current, 'x-runtime-value': lifetime } : current
    const [key, ...rest] = keys
    if (
      current.type === 'object' &&
      current.required.includes(key) &&
      recipeOwn(current.properties, key)
    )
      return visit(current.properties[key], rest, lifetime)
    if (
      current.type === 'array' &&
      /^(0|[1-9][0-9]*)$/u.test(key) &&
      Number(key) < (current.minItems ?? 0)
    )
      return visit(
        current.prefixItems?.[Number(key)] ?? current.items,
        rest,
        lifetime
      )
    throw new Error('Source path is absent or not guaranteed to exist')
  }
  return visit(schema, recipePointer(path))
}

/** Only explicit disjoint types/enums/required discriminators prove exclusion. */
export const recipeDisjoint = (
  source: RecipeSchema,
  target: RecipeSchema,
  depth = 0
): boolean => {
  if (depth > 64) return false
  source = recipeResolve(source)
  target = recipeResolve(target)
  if (source.type === 'never' || target.type === 'never') return true
  if (source.type === 'opaque' || target.type === 'opaque') return false
  if (source.type === 'union')
    return source.variants.every((item) =>
      recipeDisjoint(item, target, depth + 1)
    )
  if (target.type === 'union')
    return target.variants.every((item) =>
      recipeDisjoint(source, item, depth + 1)
    )
  if (
    source.type !== target.type &&
    !(
      ['number', 'integer'].includes(source.type) &&
      ['number', 'integer'].includes(target.type)
    )
  )
    return true
  const targetEnum = target.enum
  if (
    source.enum &&
    targetEnum &&
    source.enum.every((value) => !targetEnum.includes(value))
  )
    return true
  if (source.type === 'object' && target.type === 'object') {
    if (
      source.required.some(
        (key) =>
          !recipeOwn(target.properties, key) && !target.additionalProperties
      )
    )
      return true
    if (
      target.required.some(
        (key) =>
          !recipeOwn(source.properties, key) && !source.additionalProperties
      )
    )
      return true
    return source.required.some(
      (key) =>
        target.required.includes(key) &&
        recipeOwn(source.properties, key) &&
        recipeOwn(target.properties, key) &&
        recipeDisjoint(
          source.properties[key],
          target.properties[key],
          depth + 1
        )
    )
  }
  return false
}

export const recipeSelectVariant = (
  source: RecipeSchema,
  target: RecipeSchema
): RecipeSchema | undefined => {
  target = recipeResolve(target)
  if (target.type !== 'union') return target
  const candidates = target.variants.filter(
    (item) => !recipeDisjoint(source, item)
  )
  return candidates.length === 1 ? candidates[0] : undefined
}

const lower = (
  source: number | undefined,
  target: number | undefined,
  fallback: number
) => target === undefined || (source ?? fallback) >= target
const upper = (source: number | undefined, target: number | undefined) =>
  target === undefined || (source ?? Infinity) <= target

const inheritRecipeLifetime = (
  schema: RecipeSchema,
  parent: RecipeSchema
): RecipeSchema =>
  parent['x-runtime-value']
    ? { ...schema, 'x-runtime-value': parent['x-runtime-value'] }
    : schema

export const recipeAssignable = (
  source: RecipeSchema,
  target: RecipeSchema,
  depth = 0
): boolean => {
  if (depth > 64) return false
  source = recipeResolve(source)
  target = recipeResolve(target)
  if (source.type === 'never' || target.type === 'never') return false
  if (source.type === 'opaque' || target.type === 'opaque') return false
  if (source.type === 'union')
    return source.variants.every((item) =>
      recipeAssignable(inheritRecipeLifetime(item, source), target, depth + 1)
    )
  if (target.type === 'union')
    return target.variants.some(
      (item, index) =>
        recipeAssignable(
          source,
          inheritRecipeLifetime(item, target),
          depth + 1
        ) &&
        (!target.exclusive ||
          target.variants.every(
            (other, otherIndex) =>
              otherIndex === index || recipeDisjoint(source, other)
          ))
    )
  if (
    source.type !== target.type &&
    !(source.type === 'integer' && target.type === 'number')
  )
    return false
  if (source['x-runtime-value'] !== target['x-runtime-value']) return false
  if (
    target.exclusiveMinimum !== undefined &&
    !(
      (source.minimum !== undefined &&
        source.minimum > target.exclusiveMinimum) ||
      (source.exclusiveMinimum !== undefined &&
        source.exclusiveMinimum >= target.exclusiveMinimum)
    )
  )
    return false
  if (
    target.exclusiveMaximum !== undefined &&
    !(
      (source.maximum !== undefined &&
        source.maximum < target.exclusiveMaximum) ||
      (source.exclusiveMaximum !== undefined &&
        source.exclusiveMaximum <= target.exclusiveMaximum)
    )
  )
    return false
  if (
    target.pattern &&
    source.pattern !== target.pattern &&
    !(
      source.enum &&
      source.enum.every(
        (item) =>
          typeof item === 'string' &&
          new RegExp(target.pattern as string, 'u').test(item)
      )
    )
  )
    return false
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
    if (source.additionalProperties && !target.additionalProperties)
      return false
    if (
      source.additionalProperties &&
      Object.keys(target.properties).some(
        (key) => !recipeOwn(source.properties, key)
      )
    )
      return false
    if (!target.required.every((key) => source.required.includes(key)))
      return false
    return Object.entries(source.properties).every(([key, child]) =>
      recipeOwn(target.properties, key)
        ? recipeAssignable(child, target.properties[key], depth + 1)
        : target.additionalProperties && !recipeHasRuntimeValue(child)
    )
  }
  if (source.type === 'array' && target.type === 'array') {
    if (target.uniqueItems && !source.uniqueItems) return false
    const prefixLength = Math.max(
      source.prefixItems?.length ?? 0,
      target.prefixItems?.length ?? 0
    )
    for (
      let index = 0;
      index < Math.min(prefixLength, source.maxItems ?? Infinity);
      index += 1
    ) {
      if (
        !recipeAssignable(
          source.prefixItems?.[index] ?? source.items,
          target.prefixItems?.[index] ?? target.items,
          depth + 1
        )
      )
        return false
    }
    return (
      (source.maxItems ?? Infinity) <= prefixLength ||
      recipeAssignable(source.items, target.items, depth + 1)
    )
  }
  return true
}

export const recipeCapturesValue = (
  value: unknown,
  schema: RecipeSchema,
  depth = 0
): boolean => {
  if (depth > 64) return true
  schema = recipeResolve(schema)
  if (schema['x-runtime-value'] || schema.type === 'opaque') return true
  if (schema.type === 'never') return false
  if (schema.type === 'union')
    return schema.variants
      .filter((item) => !recipeDisjoint(recipeLiteralShape(value), item))
      .some((item) => recipeCapturesValue(value, item, depth + 1))
  if (schema.type === 'object' && recipeRecord(value))
    return Object.entries(value).some(
      ([key, child]) =>
        !recipeOwn(schema.properties, key) ||
        recipeCapturesValue(child, schema.properties[key], depth + 1)
    )
  if (schema.type === 'array' && Array.isArray(value))
    return value.some((child, index) =>
      recipeCapturesValue(
        child,
        schema.prefixItems?.[index] ?? schema.items,
        depth + 1
      )
    )
  return false
}

const recipeHasRuntimeValue = (
  schema: RecipeSchema,
  seen = new Set<RecipeSchema>()
): boolean => {
  schema = recipeResolve(schema)
  if (schema['x-runtime-value'] || schema.type === 'opaque') return true
  if (seen.has(schema)) return false
  seen.add(schema)
  const visit = (child: RecipeSchema) => recipeHasRuntimeValue(child, seen)
  if (schema.type === 'union') return schema.variants.some(visit)
  if (schema.type === 'object')
    return Object.values(schema.properties).some(visit)
  if (schema.type === 'array')
    return visit(schema.items) || !!schema.prefixItems?.some(visit)
  return false
}

/** Evidence for variant selection only; never a substitute for full binding checks. */
export const recipeLiteralShape = (value: unknown): RecipeSchema => {
  if (recipeRecord(value))
    return {
      type: 'object',
      additionalProperties: false,
      required: Object.keys(value),
      properties: Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          recipeLiteralShape(child)
        ])
      )
    }
  if (Array.isArray(value)) return { type: 'array', items: { type: 'opaque' } }
  if (value === null) return { type: 'null', enum: [null] }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return {
      type: typeof value as 'string' | 'number' | 'boolean',
      enum: [value]
    }
  return { type: 'opaque' }
}
