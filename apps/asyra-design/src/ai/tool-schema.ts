import type { AiToolValidator } from '@asyra/ai-agent-runtime'
import lodash from 'lodash'
const { isEqual } = lodash
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

export interface OperationInputIssue {
  readonly instancePath: string
  readonly keyword: string
  readonly message: string
}

/** Structured diagnostics from the one canonical traversal, also used by recovery. */
export const operationInputIssues = (
  value: unknown,
  schema: unknown,
  referenceRoot: unknown = schema,
  rootPath: 'arguments' | 'output' = 'arguments'
): OperationInputIssue[] | undefined => {
  const visit = (
    v: unknown,
    s: unknown,
    path: string,
    depth = 0,
    pointer = ''
  ): OperationInputIssue[] | undefined => {
    const childPath = (key: string | number) =>
      pointer + '/' + String(key).replace(/~/g, '~0').replace(/\//g, '~1')
    const issue = (
      message: string,
      keyword = 'validation',
      instancePath = pointer
    ): OperationInputIssue => ({ instancePath, keyword, message })
    if (depth > 64) {
      return [issue(`${path}: value nesting exceeds validation depth`)]
    }
    if (s === false) {
      return [issue(`${path}: disallowed value`)]
    }
    if (!record(s)) {
      return
    }
    if (typeof s.$ref === 'string') {
      if (!s.$ref.startsWith('#/')) {
        return [issue(`${path}: unsupported schema reference`)]
      }
      let resolved: unknown = referenceRoot
      for (const part of s.$ref.slice(2).split('/')) {
        const key = part.replace(/~1/g, '/').replace(/~0/g, '~')
        resolved =
          (record(resolved) || Array.isArray(resolved)) &&
          Object.hasOwn(resolved, key)
            ? (resolved as Record<string, unknown>)[key]
            : undefined
      }
      if (resolved === undefined) {
        return [issue(`${path}: unknown schema reference`)]
      }
      const referencedIssue = visit(v, resolved, path, depth + 1, pointer)
      if (referencedIssue) {
        return referencedIssue
      }
    }
    if (Object.hasOwn(s, 'not') && !visit(v, s.not, path, depth + 1, pointer)) {
      return [
        issue(
          `${path}: ${
            record(s.not) && typeof s.not.description === 'string'
              ? s.not.description
              : 'matches a forbidden combination'
          }`,
          'not'
        )
      ]
    }
    const branchErrors: OperationInputIssue[] = []
    for (const mode of ['oneOf', 'anyOf', 'allOf'] as const) {
      const options = s[mode]
      if (!Array.isArray(options)) {
        continue
      }
      // Only prune a union when every branch constrains the same supplied
      // discriminator and exactly one branch admits it. Mixed/general branches
      // must still participate (especially overlapping oneOf schemas).
      let candidates = options
      if (record(v) && (mode === 'anyOf' || mode === 'oneOf')) {
        for (const [field, supplied] of Object.entries(v)) {
          if (typeof supplied !== 'string') {
            continue
          }
          const choices = options.map((option) => {
            if (!record(option) || !record(option.properties)) {
              return undefined
            }
            const discriminator = option.properties[field]
            if (!record(discriminator)) {
              return undefined
            }
            if (typeof discriminator.const === 'string') {
              return [discriminator.const]
            }
            if (
              Array.isArray(discriminator.enum) &&
              discriminator.enum.length &&
              discriminator.enum.every((item) => typeof item === 'string')
            ) {
              return discriminator.enum
            }
            return undefined
          })
          if (!choices.every(Boolean)) {
            continue
          }
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
          visit(v, option, path, depth + 1, pointer)
        ),
        passed = issues.filter((i) => !i).length
      if (
        (mode === 'oneOf' && passed !== 1) ||
        (mode === 'anyOf' && passed === 0) ||
        (mode === 'allOf' && passed !== options.length)
      ) {
        branchErrors.push(
          issue(`${path}: ${mode} mismatch`, mode),
          ...issues.flatMap((issue) => issue ?? [])
        )
      }
    }
    if ('const' in s && v !== s.const) {
      return [issue(`${path}: unexpected constant`)]
    }
    if (Array.isArray(s.enum) && !s.enum.includes(v)) {
      return [issue(`${path}: value is outside the allowed choices`)]
    }
    let types: unknown[] = []
    if (Array.isArray(s.type)) {
      types = s.type
    } else if (typeof s.type === 'string') {
      types = [s.type]
    }
    if (
      types.length &&
      !types.some((type) => {
        if (type === 'object') {
          return record(v)
        }
        if (type === 'array') {
          return Array.isArray(v)
        }
        if (type === 'null') {
          return v === null
        }
        if (type === 'integer') {
          return typeof v === 'number' && Number.isInteger(v)
        }
        return typeof v === type
      })
    ) {
      return [issue(`${path}: expected ${types.join(' or ')}`)]
    }
    if (record(v)) {
      const props = record(s.properties) ? s.properties : {}
      const errors: OperationInputIssue[] = [...branchErrors]
      const count = Object.keys(v).length
      if (typeof s.minProperties === 'number' && count < s.minProperties) {
        errors.push(issue(`${path}: too few properties`, 'minProperties'))
      }
      if (typeof s.maxProperties === 'number' && count > s.maxProperties) {
        errors.push(issue(`${path}: too many properties`, 'maxProperties'))
      }
      if (Array.isArray(s.required)) {
        for (const k of s.required) {
          if (typeof k === 'string' && !Object.hasOwn(v, k)) {
            errors.push(
              issue(
                `${path}.${k}: required field is missing`,
                'required',
                childPath(k)
              )
            )
          }
        }
      }
      for (const [key, item] of Object.entries(v)) {
        if (Object.hasOwn(s, 'propertyNames')) {
          const childIssue = visit(
            key,
            s.propertyNames,
            `${path} property ${JSON.stringify(key)}`,
            depth + 1,
            childPath(key)
          )
          if (childIssue) {
            errors.push(...childIssue)
          }
        }
        if (!Object.hasOwn(props, key) && s.additionalProperties === false) {
          errors.push(
            issue(
              `${path}.${key}: unknown field; allowed fields: ${Object.keys(props).join(', ')}`,
              'additionalProperties',
              childPath(key)
            )
          )
        } else {
          const childIssue = visit(
            item,
            Object.hasOwn(props, key) ? props[key] : s.additionalProperties,
            `${path}.${key}`,
            depth + 1,
            childPath(key)
          )
          if (childIssue) {
            errors.push(...childIssue)
          }
        }
        if (errors.length >= 12) {
          return [
            ...errors,
            issue(
              rootPath === 'output'
                ? 'Additional output diagnostics omitted'
                : 'Correct these fields and retry for remaining diagnostics',
              'diagnosticLimit'
            )
          ]
        }
      }
      if (errors.length) {
        return errors
      }
    }
    if (Array.isArray(v)) {
      if (s.uniqueItems === true) {
        const primitives = new Set<unknown>()
        const structures: object[] = []
        for (let i = 0; i < v.length; i++) {
          const item = v[i]
          if (item !== null && typeof item === 'object') {
            if (structures.some((previous) => isEqual(previous, item))) {
              return [
                issue(
                  `${path}[${i}]: duplicate item`,
                  'uniqueItems',
                  childPath(i)
                )
              ]
            }
            structures.push(item)
          } else {
            if (primitives.has(item)) {
              return [
                issue(
                  `${path}[${i}]: duplicate item`,
                  'uniqueItems',
                  childPath(i)
                )
              ]
            }
            primitives.add(item)
          }
        }
      }
      if (typeof s.minItems === 'number' && v.length < s.minItems) {
        return [issue(`${path}: too few items`)]
      }
      if (typeof s.maxItems === 'number' && v.length > s.maxItems) {
        return [issue(`${path}: too many items`)]
      }
      const errors: OperationInputIssue[] = []
      for (let i = 0; i < v.length; i++) {
        const itemSchema =
          Array.isArray(s.prefixItems) && i < s.prefixItems.length
            ? s.prefixItems[i]
            : s.items
        const childIssue = visit(
          v[i],
          itemSchema,
          `${path}[${i}]`,
          depth + 1,
          childPath(i)
        )
        if (childIssue) {
          errors.push(...childIssue)
        }
        if (errors.length >= 12) {
          return [
            ...errors,
            issue(
              rootPath === 'output'
                ? 'Additional output diagnostics omitted'
                : 'Correct these items and retry for remaining diagnostics',
              'diagnosticLimit'
            )
          ]
        }
      }
      if (errors.length) {
        return errors
      }
    }
    if (branchErrors.length) {
      return branchErrors
    }
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) {
        return [issue(`${path}: expected a finite number`)]
      }
      for (const [key, invalid] of [
        ['minimum', v < Number(s.minimum)],
        ['maximum', v > Number(s.maximum)],
        ['exclusiveMinimum', v <= Number(s.exclusiveMinimum)],
        ['exclusiveMaximum', v >= Number(s.exclusiveMaximum)]
      ] as const) {
        if (typeof s[key] === 'number' && invalid) {
          return [issue(`${path}: violates ${key} ${s[key]}`, key)]
        }
      }
    }
    if (typeof v === 'string') {
      if (typeof s.minLength === 'number' && v.length < s.minLength) {
        return [issue(`${path}: string is too short`)]
      }
      if (typeof s.maxLength === 'number' && v.length > s.maxLength) {
        return [issue(`${path}: string is too long`)]
      }
      if (typeof s.pattern === 'string' && !new RegExp(s.pattern).test(v)) {
        return [issue(`${path}: string does not match its declared pattern`)]
      }
    }
  }
  return visit(value, schema, rootPath)
}

export const formatOperationInputIssues = (
  issues: readonly OperationInputIssue[]
): string =>
  [...new Set(issues.map((issue) => issue.message))].join('; ').slice(0, 3000)

export const operationInputIssue = (
  value: unknown,
  schema: unknown,
  referenceRoot: unknown = schema,
  rootPath: 'arguments' | 'output' = 'arguments'
): string | undefined => {
  const issues = operationInputIssues(value, schema, referenceRoot, rootPath)
  return issues ? formatOperationInputIssues(issues) : undefined
}

/** Keep reference resolution independent from invocation-stage diagnostics. */
export const operationContractIssue = (
  value: unknown,
  schema: unknown,
  context?: Parameters<AiToolValidator>[2]
) =>
  operationInputIssue(
    value,
    schema,
    schema,
    context?.stage === 'output' ? 'output' : 'arguments'
  )
