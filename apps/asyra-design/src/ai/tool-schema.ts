import type {
  AiToolValidator,
  AiToolContractInput
} from '@asyra/ai-agent-runtime'
import lodash from 'lodash'
const { isEqual } = lodash

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

export interface OperationInputIssue {
  readonly instancePath: string
  readonly keyword: string
  readonly message: string
}

const schemaMaps = ['$defs', 'definitions', 'properties'] as const
const schemaChildren = [
  'additionalProperties',
  'items',
  'propertyNames',
  'not'
] as const
const schemaArrays = ['allOf', 'anyOf', 'oneOf', 'prefixItems'] as const
const schemaBounds = [
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minProperties',
  'maxProperties',
  'minItems',
  'maxItems',
  'minLength',
  'maxLength'
] as const
const schemaKeywords = new Set<string>([
  ...schemaMaps,
  ...schemaChildren,
  ...schemaArrays,
  ...schemaBounds,
  '$ref',
  '$schema',
  '$comment',
  'type',
  'const',
  'enum',
  'required',
  'dependentRequired',
  'uniqueItems',
  'pattern',
  'title',
  'description',
  'default',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly'
])

/** The App supports an explicit schema vocabulary; unknown semantics never mean valid. */
export const operationSchemaIssue = (
  schema: unknown,
  referenceRoot: unknown = schema
): string | undefined => {
  const seen = new Set<object>()

  const strings = (value: unknown): value is string[] =>
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string') &&
    new Set(value).size === value.length

  const visit = (node: unknown, path: string): string | undefined => {
    if (typeof node === 'boolean') {
      return
    }

    if (!record(node)) {
      return path + ': expected an object or boolean schema'
    }

    if (seen.has(node)) {
      return
    }

    seen.add(node)
    for (const key of Object.keys(node)) {
      if (!schemaKeywords.has(key) && !key.startsWith('x-')) {
        return path + ': unsupported schema keyword ' + key
      }
    }

    if (node.type !== undefined) {
      const types = typeof node.type === 'string' ? [node.type] : node.type

      if (
        !strings(types) ||
        !types.length ||
        types.some(
          (type) =>
            ![
              'object',
              'array',
              'string',
              'number',
              'integer',
              'boolean',
              'null'
            ].includes(type)
        )
      ) {
        return path + ': invalid type constraint'
      }
    }

    for (const key of schemaBounds) {
      if (
        node[key] !== undefined &&
        (typeof node[key] !== 'number' ||
          !Number.isFinite(node[key]) ||
          (![
            'minimum',
            'maximum',
            'exclusiveMinimum',
            'exclusiveMaximum'
          ].includes(key) &&
            (!Number.isSafeInteger(node[key]) || node[key] < 0)))
      ) {
        return path + ': invalid ' + key + ' constraint'
      }
    }

    if (node.required !== undefined && !strings(node.required)) {
      return path + ': invalid required constraint'
    }

    if (
      node.dependentRequired !== undefined &&
      (!record(node.dependentRequired) ||
        Object.values(node.dependentRequired).some((value) => !strings(value)))
    ) {
      return path + ': invalid dependentRequired constraint'
    }

    if (
      node.enum !== undefined &&
      (!Array.isArray(node.enum) || !node.enum.length)
    ) {
      return path + ': invalid enum constraint'
    }

    if (
      node.uniqueItems !== undefined &&
      typeof node.uniqueItems !== 'boolean'
    ) {
      return path + ': invalid uniqueItems constraint'
    }

    if (node.pattern !== undefined) {
      if (typeof node.pattern !== 'string') {
        return path + ': invalid pattern constraint'
      }

      try {
        new RegExp(node.pattern)
      } catch {
        return path + ': invalid pattern expression'
      }
    }

    if (node.$ref !== undefined) {
      if (
        typeof node.$ref !== 'string' ||
        (node.$ref !== '#' && !node.$ref.startsWith('#/')) ||
        /~(?![01])/.test(node.$ref)
      ) {
        return path + ': unsupported schema reference'
      }

      let target: unknown = referenceRoot

      for (const part of node.$ref === '#'
        ? []
        : node.$ref.slice(2).split('/')) {
        const key = part.replace(/~1/g, '/').replace(/~0/g, '~')

        if (
          (!record(target) && !Array.isArray(target)) ||
          !Object.hasOwn(target, key)
        ) {
          return path + ': unknown schema reference'
        }

        target = (target as Record<string, unknown>)[key]
      }

      const issue = visit(target, path + '/$ref')

      if (issue) {
        return issue
      }
    }

    for (const key of schemaMaps) {
      if (node[key] === undefined) {
        continue
      }

      if (!record(node[key])) {
        return path + ': invalid ' + key + ' map'
      }

      for (const [name, child] of Object.entries(node[key])) {
        const issue = visit(child, path + '/' + key + '/' + name)

        if (issue) {
          return issue
        }
      }
    }

    for (const key of schemaChildren) {
      if (node[key] !== undefined) {
        const issue = visit(node[key], path + '/' + key)

        if (issue) {
          return issue
        }
      }
    }

    for (const key of schemaArrays) {
      const children = node[key]

      if (children === undefined) {
        continue
      }

      if (
        !Array.isArray(children) ||
        (key !== 'prefixItems' && !children.length)
      ) {
        return path + ': invalid ' + key + ' alternatives'
      }

      for (const [index, child] of children.entries()) {
        const issue = visit(child, path + '/' + key + '/' + index)

        if (issue) {
          return issue
        }
      }
    }
  }

  return visit(schema, 'schema')
}

/** Registration is the publication boundary, before any owner can execute. */
export const requireSupportedToolSchemas = (
  definition: Pick<
    AiToolContractInput,
    | 'name'
    | 'inputSchema'
    | 'outputSchema'
    | 'partialOutputSchema'
    | 'recoveryOutputSchema'
    | 'delivery'
  >
) => {
  const schemas = {
    input: definition.inputSchema,
    output: definition.outputSchema,
    partial: definition.partialOutputSchema,
    recovery: definition.recoveryOutputSchema,
    delivery: definition.delivery?.outputSchema
  }

  for (const [name, schema] of Object.entries(schemas)) {
    if (schema === undefined) {
      continue
    }

    const issue = operationSchemaIssue(schema)

    if (issue) {
      throw new TypeError(definition.name + ' ' + name + ': ' + issue)
    }
  }
}

/** Structured diagnostics from the one canonical traversal, also used by recovery. */
export const operationInputIssues = (
  value: unknown,
  schema: unknown,
  referenceRoot: unknown = schema,
  rootPath: 'arguments' | 'output' = 'arguments'
): OperationInputIssue[] | undefined => {
  const unsupported = operationSchemaIssue(schema, referenceRoot)

  if (unsupported) {
    return [
      {
        instancePath: '',
        keyword: 'schema',
        message: rootPath + ': ' + unsupported
      }
    ]
  }

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
      if (s.$ref !== '#' && !s.$ref.startsWith('#/')) {
        return [issue(`${path}: unsupported schema reference`)]
      }

      let resolved: unknown = referenceRoot

      for (const part of s.$ref === '#' ? [] : s.$ref.slice(2).split('/')) {
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

    if (Object.hasOwn(s, 'const') && !isEqual(v, s.const)) {
      return [issue(`${path}: unexpected constant`)]
    }

    if (Array.isArray(s.enum) && !s.enum.some((item) => isEqual(v, item))) {
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

      if (record(s.dependentRequired)) {
        for (const [trigger, required] of Object.entries(s.dependentRequired)) {
          if (!Object.hasOwn(v, trigger)) {
            continue
          }

          for (const key of required as string[]) {
            if (!Object.hasOwn(v, key)) {
              errors.push(
                issue(
                  `${path}.${key}: required when ${trigger} is present`,
                  'dependentRequired',
                  childPath(key)
                )
              )
            }
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
