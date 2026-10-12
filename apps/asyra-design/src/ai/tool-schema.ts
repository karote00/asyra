import lodash from 'lodash'
const { isEqual } = lodash
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
      const count = Object.keys(v).length
      if (typeof s.minProperties === 'number' && count < s.minProperties)
        errors.push(`${path}: too few properties`)
      if (typeof s.maxProperties === 'number' && count > s.maxProperties)
        errors.push(`${path}: too many properties`)
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
