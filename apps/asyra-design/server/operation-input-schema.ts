import lodash from 'lodash'

const { isEqual } = lodash

// App-owned model-input admission. Canonical executors remain the authority for
// target permissions, current state and writes. Never validate prepared geometry
// again here: this consumes the advertised model-facing operation schema.
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
export const operationInputIssue = (
  value: unknown,
  schema: unknown
): string | undefined => {
  const visit = (
    v: unknown,
    s: unknown,
    path: string,
    depth = 0
  ): string[] | undefined => {
    if (depth > 64) return [`${path}: input nesting exceeds validation depth`]
    if (s === false) return [`${path}: disallowed value`]
    if (!record(s)) return
    if (typeof s.$ref === 'string') {
      if (!s.$ref.startsWith('#/'))
        return [`${path}: unsupported schema reference`]
      let resolved: unknown = schema
      for (const key of s.$ref.slice(2).split('/'))
        resolved = record(resolved)
          ? resolved[key.replace(/~1/g, '/').replace(/~0/g, '~')]
          : undefined
      if (resolved === undefined) return [`${path}: unknown schema reference`]
      const issue = visit(v, resolved, path, depth + 1)
      if (issue) return issue
    }
    const branchErrors: string[] = []
    for (const mode of ['oneOf', 'anyOf', 'allOf'] as const) {
      const options = s[mode]
      if (!Array.isArray(options)) continue
      // Only prune a union when every branch constrains the same supplied
      // discriminator and exactly one branch admits it. Mixed/general branches
      // must still participate (especially overlapping oneOf schemas).
      let candidates = options
      if (record(v) && (mode === 'anyOf' || mode === 'oneOf')) {
        for (const [field, supplied] of Object.entries(v)) {
          if (typeof supplied !== 'string') continue
          const choices = options.map((option) => {
            if (!record(option) || !record(option.properties)) return undefined
            const discriminator = option.properties[field]
            if (!record(discriminator)) return undefined
            if (typeof discriminator.const === 'string')
              return [discriminator.const]
            if (
              Array.isArray(discriminator.enum) &&
              discriminator.enum.length &&
              discriminator.enum.every((item) => typeof item === 'string')
            )
              return discriminator.enum
            return undefined
          })
          if (!choices.every(Boolean)) continue
          const matching = options.filter((_option, index) =>
            choices[index]?.includes(supplied)
          )
          if (matching.length === 1) {
            candidates = matching
            break
          }
        }
      }
      const issues = candidates.map((option) =>
          visit(v, option, path, depth + 1)
        ),
        passed = issues.filter((i) => !i).length
      if (
        (mode === 'oneOf' && passed !== 1) ||
        (mode === 'anyOf' && passed === 0) ||
        (mode === 'allOf' && passed !== options.length)
      )
        branchErrors.push(
          `${path}: ${mode} mismatch`,
          ...issues.flatMap((issue) => issue ?? [])
        )
    }
    if ('const' in s && v !== s.const) return [`${path}: unexpected constant`]
    if (Array.isArray(s.enum) && !s.enum.includes(v))
      return [`${path}: value is outside the allowed choices`]
    let types: unknown[] = []
    if (Array.isArray(s.type)) types = s.type
    else if (typeof s.type === 'string') types = [s.type]
    if (
      types.length &&
      !types.some((type) => {
        if (type === 'object') return record(v)
        if (type === 'array') return Array.isArray(v)
        if (type === 'null') return v === null
        if (type === 'integer')
          return typeof v === 'number' && Number.isInteger(v)
        return typeof v === type
      })
    )
      return [`${path}: expected ${types.join(' or ')}`]
    if (record(v)) {
      const props = record(s.properties) ? s.properties : {}
      const errors: string[] = [...branchErrors]
      if (Array.isArray(s.required))
        for (const k of s.required)
          if (typeof k === 'string' && !Object.hasOwn(v, k))
            errors.push(`${path}.${k}: required field is missing`)
      for (const [key, item] of Object.entries(v)) {
        if (!Object.hasOwn(props, key) && s.additionalProperties === false) {
          errors.push(
            `${path}.${key}: unknown field; allowed fields: ${Object.keys(props).join(', ')}`
          )
        } else {
          const issue = visit(
            item,
            props[key] ?? s.additionalProperties,
            `${path}.${key}`,
            depth + 1
          )
          if (issue) errors.push(...issue)
        }
        if (errors.length >= 12)
          return [
            ...errors,
            'Correct these fields and retry for remaining diagnostics'
          ]
      }
      if (errors.length) return errors
    }
    if (Array.isArray(v)) {
      if (s.uniqueItems === true) {
        const primitives = new Set<unknown>()
        const structures: object[] = []
        for (let i = 0; i < v.length; i++) {
          const item = v[i]
          if (item !== null && typeof item === 'object') {
            if (structures.some((previous) => isEqual(previous, item)))
              return [`${path}[${i}]: duplicate item`]
            structures.push(item)
          } else {
            if (primitives.has(item)) return [`${path}[${i}]: duplicate item`]
            primitives.add(item)
          }
        }
      }
      if (typeof s.minItems === 'number' && v.length < s.minItems)
        return [`${path}: too few items`]
      if (typeof s.maxItems === 'number' && v.length > s.maxItems)
        return [`${path}: too many items`]
      const errors: string[] = []
      for (let i = 0; i < v.length; i++) {
        const issue = visit(v[i], s.items, `${path}[${i}]`, depth + 1)
        if (issue) errors.push(...issue)
        if (errors.length >= 12)
          return [
            ...errors,
            'Correct these items and retry for remaining diagnostics'
          ]
      }
      if (errors.length) return errors
    }
    if (branchErrors.length) return branchErrors
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return [`${path}: expected a finite number`]
      for (const [key, invalid] of [
        ['minimum', v < Number(s.minimum)],
        ['maximum', v > Number(s.maximum)],
        ['exclusiveMinimum', v <= Number(s.exclusiveMinimum)],
        ['exclusiveMaximum', v >= Number(s.exclusiveMaximum)]
      ] as const)
        if (typeof s[key] === 'number' && invalid)
          return [`${path}: violates ${key} ${s[key]}`]
    }
    if (typeof v === 'string') {
      if (typeof s.minLength === 'number' && v.length < s.minLength)
        return [`${path}: string is too short`]
      if (typeof s.maxLength === 'number' && v.length > s.maxLength)
        return [`${path}: string is too long`]
      if (typeof s.pattern === 'string' && !new RegExp(s.pattern).test(v))
        return [`${path}: string does not match its declared pattern`]
    }
  }
  const issues = visit(value, schema, 'arguments')
  return issues ? [...new Set(issues)].join('; ').slice(0, 3000) : undefined
}

// Native Code Mode renders union branches without their sibling constraints.
// Distribute object constraints into each alternative before registration; local
// admission still uses the original schema. Never alter the caller's registry.
const intersectSchemas = (left: unknown, right: unknown): unknown => {
  if (left === false || right === false) return false
  if (!record(left)) return right
  if (!record(right)) return left
  // Each closed object constrains its own property set. Merging sets would
  // accidentally admit fields that its sibling explicitly excludes.
  for (const [closed, other] of [
    [left, right],
    [right, left]
  ]) {
    if (closed.additionalProperties === false && record(other.properties)) {
      const allowed = record(closed.properties) ? closed.properties : {}
      if (
        Object.keys(other.properties).some(
          (name) => !Object.hasOwn(allowed, name)
        )
      )
        return { allOf: [left, right] }
    }
  }
  const result: Record<string, unknown> = { ...left }
  for (const [key, value] of Object.entries(right)) {
    if (!(key in result) || isEqual(result[key], value)) {
      result[key] = value
      continue
    }
    if (
      key === 'required' &&
      Array.isArray(result[key]) &&
      Array.isArray(value)
    ) {
      result[key] = [...new Set([...result[key], ...value])]
    } else if (key === 'properties' && record(result[key]) && record(value)) {
      const properties = { ...result[key] }
      for (const [name, property] of Object.entries(value))
        properties[name] =
          name in properties
            ? intersectSchemas(properties[name], property)
            : property
      result[key] = properties
    } else {
      // Preserve less common overlapping constraints exactly instead of choosing
      // either value and silently relaxing admission.
      return { allOf: [left, right] }
    }
  }
  return result
}
export const nativeToolInputSchema = (schema: unknown): unknown => {
  if (!record(schema)) return schema
  const result = { ...schema }
  for (const key of ['required', 'enum', 'type'] as const) {
    if (Array.isArray(result[key])) result[key] = [...new Set(result[key])]
  }
  // A compatible primitive const already expresses this enum. Keep incompatible
  // enums: their contradiction must not become an admitted value.
  if (
    'const' in result &&
    (result.const === null ||
      ['string', 'number', 'boolean'].includes(typeof result.const)) &&
    Array.isArray(result.enum) &&
    result.enum.includes(result.const)
  )
    delete result.enum
  for (const key of ['properties', '$defs', 'definitions'] as const) {
    if (record(result[key]))
      result[key] = Object.fromEntries(
        Object.entries(result[key]).map(([name, child]) => [
          name,
          nativeToolInputSchema(child)
        ])
      )
  }
  for (const key of ['items', 'additionalProperties'] as const)
    if (record(result[key])) result[key] = nativeToolInputSchema(result[key])
  for (const mode of ['oneOf', 'anyOf', 'allOf'] as const) {
    const branches = result[mode]
    if (!Array.isArray(branches)) continue
    if (mode !== 'allOf' && record(result.properties)) {
      const { [mode]: _branches, $defs, definitions, ...common } = result
      return {
        ...($defs ? { $defs } : {}),
        ...(definitions ? { definitions } : {}),
        [mode]: compactNativeAlternatives(
          mode,
          branches.map((branch) =>
            nativeToolInputSchema(intersectSchemas(common, branch))
          )
        )
      }
    }
    result[mode] = compactNativeAlternatives(
      mode,
      branches.map(nativeToolInputSchema)
    )
  }
  // With a closed object, omission expresses a prohibited field correctly to
  // native declaration generators that otherwise render `false` as `string`.
  if (result.additionalProperties === false && record(result.properties)) {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).filter(
        ([name, value]) =>
          value !== false ||
          (Array.isArray(result.required) && result.required.includes(name))
      )
    )
  }
  return result
}

const compactNativeAlternatives = (
  mode: string,
  branches: unknown[]
): unknown[] => {
  // oneOf counts matching alternatives; even byte-identical branches matter.
  if (mode === 'oneOf' || branches.some(hasReferenceValueConstraint))
    return branches
  return [
    ...new Map(
      branches.map((branch) => [JSON.stringify(branch), branch])
    ).values()
  ]
}

// Admission currently compares object-valued const/enum choices by identity.
// Keep those alternatives intact even when their JSON text is identical.
const hasReferenceValueConstraint = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasReferenceValueConstraint)
  if (!record(value)) return false
  if (value.const !== null && typeof value.const === 'object') return true
  if (
    Array.isArray(value.enum) &&
    value.enum.some((choice) => choice !== null && typeof choice === 'object')
  )
    return true
  return Object.values(value).some(hasReferenceValueConstraint)
}
