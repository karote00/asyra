import {
  AiToolContractError,
  embedAiToolSchema,
  selectAiToolResultSchema
} from '../tool-contract.js'
import type { AiToolContractInput, AiToolOutcome } from '../tool-contract.js'
import type { AiJsonValue } from '../types.js'
import {
  operationContractIssue,
  operationInputIssues,
  resolveLocalSchemaReference
} from './validation.js'
const toolResultString = { type: 'string', minLength: 1 }

const toolResultObject = (
  properties: Record<string, unknown>,
  required = Object.keys(properties)
) => ({ type: 'object', properties, required, additionalProperties: true })

/** Projection failure is a delivery result, never permission to retry a write. */
const toolDeliveryFailureCode = 'TOOL_DELIVERY_INVALID'

const toolDeliveryFailureSchema = (executionResult: unknown) =>
  toolResultObject(
    {
      available: { const: false },
      code: { const: toolDeliveryFailureCode },
      message: toolResultString,
      settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] },
      toolOutcome: toolResultObject({
        status: { const: 'partial' },
        settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] }
      }),
      executionResult: embedAiToolSchema(
        executionResult as AiJsonValue,
        '#/properties/executionResult'
      )
    },
    ['available', 'code', 'message', 'settlement', 'toolOutcome']
  )

/** Canonical result alternatives also own acknowledged delivery-failure evidence. */
const declaredToolResults = (contract: {
  outputSchema?: unknown
  partialOutputSchema?: unknown
  recoveryOutputSchema?: unknown
}) => {
  const alternatives = [
    contract.outputSchema,
    contract.partialOutputSchema,
    contract.recoveryOutputSchema
  ]
    .filter((schema) => schema !== undefined)
    .map((schema, index) =>
      embedAiToolSchema(schema as AiJsonValue, `#/anyOf/${index}`)
    )

  return alternatives.length ? { anyOf: alternatives } : false
}

/** Failure evidence has its own delivery contract; it is never success data. */
export const modelToolDeliveryFailureSchema = (contract: {
  outputSchema?: unknown
  partialOutputSchema?: unknown
  recoveryOutputSchema?: unknown
  delivery?: AiToolContractInput['delivery']
}) =>
  toolDeliveryFailureSchema(
    contract.delivery?.path === ''
      ? contract.delivery.outputSchema
      : modelResultSchema(declaredToolResults(contract))
  )

/** Discovery and final egress publish the same complete partial-result contract. */
export const modelToolResultSchemas = (contract: {
  outputSchema?: unknown
  partialOutputSchema?: unknown
  recoveryOutputSchema?: unknown
  delivery?: AiToolContractInput['delivery']
}) => {
  const annotate = (schema: unknown) => modelResultSchema(schema)

  const rootView = contract.delivery?.path === ''

  const failure = modelToolDeliveryFailureSchema(contract)

  return {
    outputSchema: contract.delivery
      ? modelResultSchema(contract.delivery.outputSchema)
      : annotate(contract.outputSchema),
    partialOutputSchema: {
      anyOf: [
        ...(contract.delivery
          ? [modelResultSchema(contract.delivery.outputSchema)]
          : []),
        ...(rootView
          ? []
          : [annotate(contract.partialOutputSchema ?? contract.outputSchema)]),
        failure
      ].map((schema, index) =>
        embedAiToolSchema(schema as AiJsonValue, `#/anyOf/${index}`)
      )
    },
    recoveryOutputSchema:
      contract.delivery?.path === ''
        ? contract.delivery.outputSchema
        : annotate(contract.recoveryOutputSchema)
  }
}

/** Preserve the owner's schema vocabulary while removing declared internal fields. */
const modelResultSchema = (
  schema: unknown,
  inherited?: { omitted: Set<string> },
  referenceRoot: unknown = schema
): unknown => {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  if (Array.isArray(schema)) {
    return schema.map((child) =>
      modelResultSchema(child, inherited, referenceRoot)
    )
  }

  const source = schema as Record<string, unknown>
  const result = { ...source }
  const context = {
    omitted: new Set(inherited?.omitted)
  }
  const visited = new Set<unknown>()

  const resolveReference = (reference: unknown): unknown =>
    typeof reference === 'string'
      ? resolveLocalSchemaReference(referenceRoot, reference)
      : undefined

  const collect = (node: Record<string, unknown>) => {
    if (visited.has(node)) {
      return
    }

    visited.add(node)
    if (typeof node.$ref === 'string') {
      const target = resolveReference(node.$ref)

      if (target && typeof target === 'object' && !Array.isArray(target)) {
        collect(target as Record<string, unknown>)
      }
    }

    if (node.properties && typeof node.properties === 'object') {
      for (const [key, child] of Object.entries(node.properties)) {
        if (
          child &&
          typeof child === 'object' &&
          (child as Record<string, unknown>)['x-model-visibility'] ===
            'internal'
        ) {
          context.omitted.add(key)
        }
      }
    }

    if (Array.isArray(node.allOf)) {
      for (const child of node.allOf) {
        if (child && typeof child === 'object' && !Array.isArray(child)) {
          collect(child)
        }
      }
    }
  }

  collect(source)
  const { omitted } = context
  // Visibility is a structural field declaration, not permission to transform
  // semantic constraints. Such owners must supply an explicit external view.
  const visibilityVisited = new Set<unknown>()

  const hidesFields = (value: unknown): boolean => {
    if (!value || typeof value !== 'object' || visibilityVisited.has(value)) {
      return false
    }

    visibilityVisited.add(value)
    if (Array.isArray(value)) {
      return value.some(hidesFields)
    }

    const node = value as Record<string, unknown>

    if (
      node['x-model-visibility'] === 'internal' ||
      hidesFields(resolveReference(node.$ref))
    ) {
      return true
    }

    return [
      'properties',
      '$defs',
      'definitions',
      'allOf',
      'anyOf',
      'oneOf',
      'items',
      'prefixItems',
      'additionalProperties',
      'not'
    ].some((key) => {
      const child = node[key]

      return ['properties', '$defs', 'definitions'].includes(key) &&
        child &&
        typeof child === 'object'
        ? Object.values(child).some(hidesFields)
        : hidesFields(child)
    })
  }

  const localSemantic =
    omitted.size > 0 &&
    [
      'const',
      'enum',
      'not',
      'minProperties',
      'maxProperties',
      'dependentRequired'
    ].some((key) => source[key] !== undefined)
  const compositeSemantic =
    ['const', 'enum', 'not', 'oneOf', 'uniqueItems'].some(
      (key) => source[key] !== undefined
    ) && hidesFields(source)

  if (localSemantic || compositeSemantic) {
    throw new TypeError(
      'Semantic hidden-field projection requires a declared delivery view'
    )
  }

  const properties = source.properties as Record<string, unknown> | undefined

  if (properties) {
    result.properties = Object.fromEntries(
      Object.entries(properties)
        .filter(([key]) => !omitted.has(key))
        .map(([key, child]) => [
          key,
          modelResultSchema(child, undefined, referenceRoot)
        ])
    )
  }

  if (Array.isArray(source.required)) {
    result.required = source.required.filter((key) => !omitted.has(key))
  }

  for (const key of ['$defs', 'definitions']) {
    const children = source[key]

    if (children && typeof children === 'object' && !Array.isArray(children)) {
      result[key] = Object.fromEntries(
        Object.entries(children).map(([name, child]) => [
          name,
          modelResultSchema(child, undefined, referenceRoot)
        ])
      )
    }
  }

  // Composition constraints apply to this object; value children start a new
  // field-count and dependency scope. Never leak a parent's private keys inward.
  for (const key of ['anyOf', 'oneOf', 'allOf', 'not']) {
    if (source[key] !== undefined) {
      result[key] = modelResultSchema(source[key], context, referenceRoot)
    }
  }

  for (const key of ['prefixItems', 'items', 'additionalProperties']) {
    if (source[key] !== undefined) {
      result[key] = modelResultSchema(source[key], undefined, referenceRoot)
    }
  }

  return result
}

/** Select declared envelope fields; explicitly open domain values retain their keys.
 * This is a pure projection of an already validated result, never owner execution.
 */
export const projectToolResultFields = (
  value: unknown,
  schema: unknown,
  projectedPaths: readonly string[] = []
): unknown => {
  const projected = new Set(projectedPaths)

  const record = (item: unknown): item is Record<string, unknown> =>
    !!item && typeof item === 'object' && !Array.isArray(item)

  const project = (
    item: unknown,
    sources: readonly unknown[],
    depth: number,
    path: string
  ): unknown => {
    // Child owners already selected these views. This skips selection only;
    // the complete resulting value still undergoes the pinned schema validation.
    if (projected.has(path)) {
      return item
    }

    if (depth > 64) {
      throw new Error('Model result projection exceeds schema depth')
    }

    const fields = new Map<string, unknown[]>()
    const parts: Record<string, unknown>[] = []
    let opaque = false
    let envelope = false
    const internal = new Set<string>()
    const visited = new Set<unknown>()

    const visit = (source: unknown) => {
      if (source === true) {
        opaque = true

        return
      }

      if (!record(source) || visited.has(source)) {
        return
      }

      visited.add(source)
      parts.push(source)
      if (typeof source.$ref === 'string') {
        visit(resolveLocalSchemaReference(schema, source.$ref))
      }

      if (record(source.properties)) {
        envelope = true
        for (const [key, child] of Object.entries(source.properties)) {
          if (record(child) && child['x-model-visibility'] === 'internal') {
            internal.add(key)
          } else {
            fields.set(key, [...(fields.get(key) ?? []), child])
          }
        }
      }

      if (Array.isArray(source.allOf)) {
        source.allOf.forEach(visit)
      }

      for (const key of ['anyOf', 'oneOf']) {
        if (Array.isArray(source[key])) {
          for (const branch of source[key]) {
            if (!operationInputIssues(item, branch, schema, 'output')) {
              visit(branch)
            }
          }
        }
      }
    }

    sources.forEach(visit)
    if (opaque) {
      return item
    }

    if (Array.isArray(item)) {
      return item.map((entry, index) =>
        project(
          entry,
          parts.flatMap((part) => {
            if (
              Array.isArray(part.prefixItems) &&
              index < part.prefixItems.length
            ) {
              return [part.prefixItems[index]]
            }

            return part.items === undefined ? [] : [part.items]
          }),
          depth + 1,
          path + '/*'
        )
      )
    }

    if (!record(item)) {
      return item
    }

    const dynamic = parts.flatMap((part) =>
      record(part.additionalProperties) ? [part.additionalProperties] : []
    )

    // An unconstrained value is explicitly opaque. Typed maps still project each
    // value, including maps with no fixed properties and user-authored key names.
    if (!envelope && !dynamic.length) {
      return item
    }

    const entries: [string, unknown][] = []

    for (const [key, value] of Object.entries(item)) {
      if (internal.has(key)) {
        continue
      }

      const named = fields.get(key) ?? []
      const children = [...named]

      if (!children.length) {
        children.push(...dynamic)
      }

      if (children.length) {
        entries.push([
          key,
          project(
            value,
            children,
            depth + 1,
            path + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1')
          )
        ])
      }
    }

    return Object.fromEntries(entries)
  }

  return project(value, [schema], 0, '')
}

/** External delivery consumes an owner-authored view after complete internal handoff. */
export const projectToolDelivery = (
  contract: Pick<AiToolContractInput, 'delivery'> & {
    outputSchema?: unknown
    partialOutputSchema?: unknown
    recoveryOutputSchema?: unknown
  },
  value: unknown,
  outcome: AiToolOutcome
): { value: unknown; outcome: AiToolOutcome } => {
  if (!contract.delivery) {
    return {
      outcome,
      value: projectToolResultFields(value, {
        anyOf: [
          contract.outputSchema,
          contract.partialOutputSchema,
          contract.recoveryOutputSchema
        ]
          .filter((entry) => entry !== undefined)
          .map((entry, index) =>
            embedAiToolSchema(entry as AiJsonValue, `#/anyOf/${index}`)
          )
      })
    }
  }

  let view: unknown = value

  for (const token of contract.delivery.path === ''
    ? []
    : contract.delivery.path.slice(1).split('/')) {
    const key = token.replace(/~1/g, '/').replace(/~0/g, '~')

    view =
      view && typeof view === 'object' && Object.hasOwn(view, key)
        ? (view as Record<string, unknown>)[key]
        : undefined
  }

  // A settled owner failure has no successful delivery view to publish. Select
  // its declared recovery envelope, preserving the failure instead of replacing
  // it with a missing-view error or replaying the successful prefix.
  if (view === undefined && outcome.status !== 'success') {
    const recovery = selectAiToolResultSchema(
      contract as Parameters<typeof selectAiToolResultSchema>[0],
      outcome.status
    )

    if (
      recovery !== undefined &&
      !operationContractIssue(value, recovery, { stage: 'output' })
    ) {
      return { value: projectToolResultFields(value, recovery), outcome }
    }
  }

  if (view !== undefined) {
    view = projectToolResultFields(view, contract.delivery.outputSchema)
  }

  const issue =
    view === undefined
      ? 'Declared delivery view is unavailable.'
      : operationContractIssue(view, contract.delivery.outputSchema, {
          stage: 'output'
        })

  if (issue) {
    return {
      value: toolDeliveryFailure(value, issue, contract, outcome),
      outcome: { status: 'partial', settlement: outcome.settlement }
    }
  }

  if (!view || typeof view !== 'object' || Array.isArray(view)) {
    return { value: view, outcome }
  }

  return {
    value: projectToolResultFields(view, contract.delivery.outputSchema),
    outcome
  }
}

/** One delivery failure policy for declared views and the final native boundary. */
export const toolDeliveryFailure = (
  value: unknown,
  issue: string,
  contract: {
    outputSchema?: unknown
    partialOutputSchema?: unknown
    recoveryOutputSchema?: unknown
    delivery?: AiToolContractInput['delivery']
  },
  outcome: AiToolOutcome
) => {
  const schema = modelToolDeliveryFailureSchema(contract)
  const declared = selectAiToolResultSchema(
    contract as Parameters<typeof selectAiToolResultSchema>[0],
    outcome.status
  )
  const failure = {
    available: false,
    code: toolDeliveryFailureCode,
    message: `${issue} Execution must not be replayed.`,
    settlement: outcome.settlement,
    toolOutcome: { status: 'partial', settlement: outcome.settlement }
  }

  // Evidence is optional; an invalid public view is never delivered as evidence.
  // Canonical owner data remains upstream and settlement still describes its work.
  if (
    declared !== undefined &&
    !operationContractIssue(value, declared, { stage: 'output' })
  ) {
    const candidate = {
      ...failure,
      executionResult: projectToolResultFields(value, declared)
    }

    if (!operationContractIssue(candidate, schema, { stage: 'output' })) {
      return candidate
    }
  }

  const failureIssue = operationContractIssue(failure, schema, {
    stage: 'output'
  })

  if (failureIssue) {
    throw new AiToolContractError('output', failureIssue)
  }

  return failure
}
