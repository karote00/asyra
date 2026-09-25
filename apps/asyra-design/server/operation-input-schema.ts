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
  ): string | undefined => {
    if (depth > 64) return `${path}: input nesting exceeds validation depth`
    if (s === false) return `${path}: disallowed value`
    if (!record(s)) return
    if (typeof s.$ref === 'string') {
      if (!s.$ref.startsWith('#/'))
        return `${path}: unsupported schema reference`
      let resolved: unknown = schema
      for (const key of s.$ref.slice(2).split('/'))
        resolved = record(resolved)
          ? resolved[key.replace(/~1/g, '/').replace(/~0/g, '~')]
          : undefined
      if (resolved === undefined) return `${path}: unknown schema reference`
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
      const choices = options.map((option) => {
        if (
          !record(option) ||
          !record(option.properties) ||
          !record(option.properties.type)
        )
          return undefined
        const discriminator = option.properties.type
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
      const suppliedType = record(v) ? v.type : undefined
      const matching =
        typeof suppliedType === 'string' &&
        (mode === 'anyOf' || mode === 'oneOf') &&
        choices.every(Boolean)
          ? options.filter((_option, index) =>
              choices[index]?.includes(suppliedType)
            )
          : []
      const candidates = matching.length === 1 ? matching : options
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
          `${path}: ${mode} mismatch. ${issues.filter(Boolean).join('; ').slice(0, 3000)}`
        )
    }
    if ('const' in s && v !== s.const) return `${path}: unexpected constant`
    if (Array.isArray(s.enum) && !s.enum.includes(v))
      return `${path}: value is outside the allowed choices`
    if (typeof s.type === 'string') {
      let matches = typeof v === s.type
      if (s.type === 'object') matches = record(v)
      if (s.type === 'array') matches = Array.isArray(v)
      if (s.type === 'null') matches = v === null
      if (s.type === 'integer')
        matches = typeof v === 'number' && Number.isInteger(v)
      if (!matches) return `${path}: expected ${s.type}`
    }
    if (record(v)) {
      const props = record(s.properties) ? s.properties : {}
      const errors: string[] = [...branchErrors]
      if (Array.isArray(s.required))
        for (const k of s.required)
          if (typeof k === 'string' && !Object.hasOwn(v, k))
            errors.push(`${path}.${k}: required field is missing`)
      for (const [key, item] of Object.entries(v)) {
        if (!Object.hasOwn(props, key) && s.additionalProperties === false)
          errors.push(
            `${path}.${key}: unknown field; allowed fields: ${Object.keys(props).join(', ')}`
          )
        const issue = visit(
          item,
          props[key] ?? s.additionalProperties,
          `${path}.${key}`,
          depth + 1
        )
        if (issue) errors.push(issue)
        if (errors.length >= 12)
          return `${errors.join('; ')}; correct these fields and retry for remaining diagnostics`
      }
      if (errors.length) return errors.join('; ')
    }
    if (Array.isArray(v)) {
      if (typeof s.minItems === 'number' && v.length < s.minItems)
        return `${path}: too few items`
      if (typeof s.maxItems === 'number' && v.length > s.maxItems)
        return `${path}: too many items`
      const errors: string[] = []
      for (let i = 0; i < v.length; i++) {
        const issue = visit(v[i], s.items, `${path}[${i}]`, depth + 1)
        if (issue) errors.push(issue)
        if (errors.length >= 12)
          return `${errors.join('; ')}; correct these items and retry for remaining diagnostics`
      }
      if (errors.length) return errors.join('; ')
    }
    if (branchErrors.length) return branchErrors.join('; ')
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return `${path}: expected a finite number`
      for (const [key, invalid] of [
        ['minimum', v < Number(s.minimum)],
        ['maximum', v > Number(s.maximum)],
        ['exclusiveMinimum', v <= Number(s.exclusiveMinimum)],
        ['exclusiveMaximum', v >= Number(s.exclusiveMaximum)]
      ] as const)
        if (typeof s[key] === 'number' && invalid)
          return `${path}: violates ${key} ${s[key]}`
    }
    if (typeof v === 'string') {
      if (typeof s.minLength === 'number' && v.length < s.minLength)
        return `${path}: string is too short`
      if (typeof s.maxLength === 'number' && v.length > s.maxLength)
        return `${path}: string is too long`
      if (typeof s.pattern === 'string' && !new RegExp(s.pattern).test(v))
        return `${path}: string does not match its declared pattern`
    }
  }
  return visit(value, schema, 'arguments')
}
