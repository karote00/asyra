import { randomUUID } from 'node:crypto'
import type {
  AiActionBatch,
  AiProviderInput
} from '../src/ai/action-batch-protocol'
import { operationInputIssue } from './operation-input-schema'

export type ElementBindingMode = 'all' | 'each' | 'one'
interface ElementBindingSlot {
  path: string[]
  mode: ElementBindingMode
}

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

// The operation registry owns argument locations. Do not guess from API names.
const targetPath = (
  schema: unknown,
  field: string,
  input: Record<string, unknown>,
  requested?: unknown
): ElementBindingSlot => {
  const paths = new Map<string, ElementBindingSlot>()
  const visit = (
    value: unknown,
    path: string[],
    supplied: unknown,
    depth = 0
  ) => {
    if (!record(value) || depth > 64) return
    const mode = value['x-design-element-binding']
    if (
      path.at(-1) === field &&
      (mode === 'all' || mode === 'each' || mode === 'one')
    ) {
      const key = JSON.stringify(path)
      const prior = paths.get(key)
      if (prior && prior.mode !== mode)
        throw new Error('Conflicting registered target cardinality.')
      paths.set(key, { path, mode })
    }
    // Only supplied scalar constraints exclude a branch. Missing fields remain
    // for complete admission after identities have been bound.
    if (record(supplied) && record(value.properties)) {
      for (const [key, constraint] of Object.entries(value.properties)) {
        if (
          record(constraint) &&
          (Array.isArray(constraint.enum) ||
            Object.hasOwn(constraint, 'const')) &&
          Object.hasOwn(supplied, key) &&
          (supplied[key] === null || typeof supplied[key] !== 'object') &&
          operationInputIssue(supplied[key], constraint)
        )
          return
      }
    }
    if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
      let resolved: unknown = schema
      for (const key of value.$ref.slice(2).split('/'))
        resolved = record(resolved)
          ? resolved[key.replace(/~1/g, '/').replace(/~0/g, '~')]
          : undefined
      visit(resolved, path, supplied, depth + 1)
    }
    for (const mode of ['oneOf', 'anyOf', 'allOf']) {
      if (Array.isArray(value[mode]))
        for (const branch of value[mode])
          visit(branch, path, supplied, depth + 1)
    }
    if (record(value.items) && Array.isArray(supplied)) {
      supplied.forEach((item, index) =>
        visit(value.items, [...path, String(index)], item, depth + 1)
      )
    }
    if (!record(value.properties)) return
    for (const [key, child] of Object.entries(value.properties)) {
      const childPath = [...path, key]
      visit(
        child,
        childPath,
        record(supplied) ? supplied[key] : undefined,
        depth + 1
      )
    }
  }
  visit(schema, [], input)
  if (requested !== undefined) {
    if (
      !Array.isArray(requested) ||
      !requested.length ||
      requested.some(
        (part) =>
          typeof part !== 'string' &&
          (!Number.isSafeInteger(part) || Number(part) < 0)
      )
    )
      throw new Error('Invalid explicit target path.')
    const exact = paths.get(JSON.stringify(requested.map(String)))
    if (!exact)
      throw new Error(
        'Target path does not identify a registered supplied argument slot.'
      )
    return exact
  }
  if (paths.size !== 1)
    throw new Error(
      'Target reference needs one unambiguous registered argument path. Supply explicit arguments for this operation.'
    )
  return [...paths.values()][0]
}

const assignTarget = (
  input: Record<string, unknown>,
  path: string[],
  value: unknown,
  fullPath = path
): Record<string, unknown> => {
  const [key, ...rest] = path
  if (!rest.length) {
    if (Object.hasOwn(input, key))
      throw new Error(
        `A conflicting target binding supplies arguments ${JSON.stringify(fullPath)}. Omit that argument, including empty arrays, null or placeholders; the target supplies this slot.`
      )
    return { ...input, [key]: value }
  }
  const child = Object.hasOwn(input, key) ? input[key] : {}
  if (Array.isArray(child)) {
    const [slot, ...nested] = rest
    const index = Number(slot)
    if (
      !Number.isSafeInteger(index) ||
      index < 0 ||
      index >= child.length ||
      !record(child[index]) ||
      !nested.length
    )
      throw new Error('Target path requires an existing object array slot.')
    const items = [...child]
    items[index] = assignTarget(child[index], nested, value, fullPath)
    return { ...input, [key]: items }
  }
  if (!record(child))
    throw new Error('Target reference ancestor must be an object.')
  return { ...input, [key]: assignTarget(child, rest, value, fullPath) }
}

/** Expand request-owned identity references; canonical actions still admit every write. */
export const prepareOperationBatch = (
  operations: unknown,
  registered: AiProviderInput['actions'],
  resolveTargets?: (reference: unknown, mode: ElementBindingMode) => string[]
): AiActionBatch['actions'] => {
  if (!Array.isArray(operations) || !operations.length)
    throw new Error('A nonempty operations array is required.')
  const actions: AiActionBatch['actions'][number][] = []
  for (const [operationIndex, operation] of operations.entries()) {
    if (
      !record(operation) ||
      Object.keys(operation).some(
        (k) => !['name', 'arguments', 'target'].includes(k)
      ) ||
      !record(operation.arguments)
    )
      throw new Error('Invalid batch operation.')
    const definition = registered.find(
      (action) => action.name === operation.name
    )
    if (!definition) throw new Error('Unregistered batch operation.')
    const input = operation.arguments
    let inputs = [input]
    if (operation.target !== undefined) {
      const targets = Array.isArray(operation.target)
        ? operation.target
        : [operation.target]
      if (!targets.length) throw new Error('Target references cannot be empty.')
      const bindings: {
        mode: ElementBindingMode
        path: string[]
        reference: Record<string, unknown>
      }[] = []
      const issues: string[] = []
      let reserved = input
      for (const [targetIndex, target] of targets.entries()) {
        try {
          if (
            !record(target) ||
            typeof target.field !== 'string' ||
            !target.field.trim()
          )
            throw new Error(
              'Provide an exact registered element-identity target field.'
            )
          const { field, path: requested, ...reference } = target
          const { path, mode } = targetPath(
            definition.inputSchema,
            String(field),
            input,
            requested
          )
          // Reserve every destination before any retained-source lookup. This
          // also catches duplicate bindings without changing caller arguments.
          reserved = assignTarget(reserved, path, undefined)
          if (
            mode === 'each' &&
            bindings.some((binding) => binding.mode === 'each')
          )
            throw new Error(
              'Only one fan-out element target is allowed per operation.'
            )
          bindings.push({ mode, path, reference })
        } catch (error) {
          issues.push(
            `operations[${operationIndex}].target[${targetIndex}]: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }
      if (issues.length) throw new Error(issues.join('\n'))
      if (!resolveTargets)
        throw new Error('Artifact references are unavailable.')
      for (const { mode, path, reference } of bindings) {
        const ids = resolveTargets(reference, mode)
        if (mode === 'one' && ids.length !== 1)
          throw new Error(
            `operations[${operationIndex}].arguments ${JSON.stringify(path)} requires exactly one resolved element; received ${ids.length}.`
          )
        inputs = inputs.flatMap((current) => {
          if (mode === 'all') return [assignTarget(current, path, ids)]
          if (mode === 'one') return [assignTarget(current, path, ids[0])]
          return ids.map((elementId) => assignTarget(current, path, elementId))
        })
      }
    }
    for (const args of inputs) {
      const issue = operationInputIssue(args, definition.inputSchema)
      if (issue) throw new Error(issue)
      actions.push({
        id: randomUUID(),
        name: definition.name,
        arguments: args,
        summary: 'Updating the requested objects'
      })
    }
  }
  return actions
}

/** Remove only App binding annotations for Runtime recipe type proofs.
 * Binding expansion remains owned by the App; all JSON Schema constraints stay intact.
 */
export const runtimeOperationSchema = <T>(schema: T): T => {
  const visit = (value: unknown): unknown => {
    if (!record(value)) return value
    const result = { ...value }
    delete result['x-design-element-binding']
    for (const key of [
      'properties',
      'patternProperties',
      '$defs',
      'definitions',
      'dependentSchemas'
    ]) {
      if (record(result[key]))
        result[key] = Object.fromEntries(
          Object.entries(result[key]).map(([name, child]) => [
            name,
            visit(child)
          ])
        )
    }
    for (const key of [
      'items',
      'additionalProperties',
      'contains',
      'propertyNames',
      'not',
      'if',
      'then',
      'else',
      'unevaluatedProperties',
      'unevaluatedItems'
    ]) {
      if (record(result[key])) result[key] = visit(result[key])
    }
    for (const key of ['allOf', 'anyOf', 'oneOf', 'prefixItems']) {
      if (Array.isArray(result[key])) result[key] = result[key].map(visit)
    }
    return result
  }
  return visit(schema) as T
}
