import { AiToolContractError, embedAiToolSchema } from '@asyra/ai-agent-runtime'
import { operationContractIssue, operationInputIssues } from './tool-schema'
import { AiActionNames } from '../constants/ai-actions'
import type {
  AiJsonValue,
  AiToolContractInput,
  AiToolOutcome
} from '@asyra/ai-agent-runtime'

export const toolResultString = { type: 'string', minLength: 1 }
export const toolRequestReference = {
  ...toolResultString,
  maxLength: 160,
  'x-runtime-value': 'request-artifact'
}
export const toolDocumentReference = {
  ...toolResultString,
  'x-runtime-value': 'document'
}
export const toolDocumentReferences = {
  type: 'array',
  items: toolDocumentReference
}
export const toolResultIds = { type: 'array', items: toolResultString }
export const toolResultCount = { type: 'integer', minimum: 0 }
export const toolResultBoolean = { type: 'boolean' }
/** The declaring owner retains this field for validation/recording, not model decisions. */
export const toolInternalResult = (schema: Record<string, unknown>) => ({
  ...schema,
  'x-model-visibility': 'internal'
})
export const toolResultStatus = {
  enum: ['complete', 'no-change', 'partial', 'failed']
}

/** Open domain receipts preserve owner extensions; declared fields remain required. */
export const toolResultObject = (
  properties: Record<string, unknown>,
  required = Object.keys(properties)
) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: true
})

/** Canonical write coverage, independent from product values or visual acceptance. */
export const toolMutationScope = toolResultObject({
  complete: { type: 'boolean' },
  elementIds: toolDocumentReferences,
  removedElementIds: toolDocumentReferences
})

/** Metadata belongs to the definition owner, never a parallel name-based catalog. */
export const toolSemantics = (
  outputSchema: unknown,
  effect: AiToolContractInput['effect'],
  resources: readonly string[],
  output: AiToolContractInput['lifecycle']['output'] = 'value'
): Pick<
  AiToolContractInput,
  | 'revision'
  | 'outputSchema'
  | 'partialOutputSchema'
  | 'effect'
  | 'resources'
  | 'lifecycle'
> => ({
  revision: 2,
  outputSchema,
  partialOutputSchema: {
    anyOf: [
      embedAiToolSchema(outputSchema as AiJsonValue, '#/anyOf/0'),
      toolResultObject({
        available: { const: false },
        recoverable: { const: true },
        code: toolResultString,
        message: toolResultString,
        settlement: {
          enum: ['not-started', 'completed', 'partial', 'unknown']
        },
        executionResult: {
          anyOf: [
            toolResultObject({ actionResults: { type: 'array', minItems: 1 } }),
            toolResultObject({ batches: { type: 'array', minItems: 1 } })
          ]
        }
      })
    ]
  },
  effect,
  resources,
  lifecycle: { cancellation: 'cooperative', retry: 'never', output }
})

/** Browser owners return declared receipts; this records execution, not visual quality. */
export const designActionOutcome = (value: unknown): AiToolOutcome => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AiToolContractError(
      'output',
      'The browser action returned no structured receipt',
      {
        status: 'invalid',
        reportedStatus: 'unknown',
        settlement: 'unknown',
        issue: 'The browser action returned no structured receipt',
        value
      }
    )
  }
  const result = value as Record<string, unknown>
  const reportedSettlement = [
    'not-started',
    'completed',
    'partial',
    'unknown'
  ].includes(String(result.settlement))
    ? (result.settlement as AiToolOutcome['settlement'])
    : undefined
  if (
    result.delivery &&
    typeof result.delivery === 'object' &&
    (result.delivery as Record<string, unknown>).status === 'unavailable'
  ) {
    return {
      status: 'partial',
      settlement: ['complete', 'no-change'].includes(String(result.status))
        ? 'completed'
        : (reportedSettlement ?? 'unknown')
    }
  }
  if (result.status === 'unknown') {
    return { status: 'unknown', settlement: reportedSettlement ?? 'unknown' }
  }
  if (result.status === 'partial' || result.complete === false) {
    return { status: 'partial', settlement: reportedSettlement ?? 'partial' }
  }
  if (
    result.status === 'failed' ||
    result.available === false ||
    result.applicable === false
  ) {
    return {
      status: 'failed',
      settlement: reportedSettlement ?? 'unknown'
    }
  }
  return { status: 'success', settlement: reportedSettlement ?? 'completed' }
}

/** Canonical effect metadata shared by browser definitions and native wrappers. */
const actionEffects: Record<
  string,
  Pick<AiToolContractInput, 'effect' | 'resources'>
> = {
  [AiActionNames.INSERT_VECTOR_COMPOSITION]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.UPDATE_COMPOSITION_ELEMENTS]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.REMOVE_AI_COMPOSITION]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.REPLACE_VECTOR_COMPOSITION]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE]: {
    effect: 'prepare',
    resources: ['request']
  },
  [AiActionNames.SET_ELEMENT_VISIBILITY]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.SELECT_ELEMENTS]: {
    effect: 'mutation',
    resources: ['selection']
  },
  [AiActionNames.REQUEST_CLARIFICATION]: {
    effect: 'prepare',
    resources: ['request']
  },
  [AiActionNames.EXPORT_DOCUMENT]: { effect: 'read', resources: ['document'] },
  [AiActionNames.DOWNLOAD_DOCUMENT_EXPORT]: {
    effect: 'external',
    resources: ['document-export']
  },
  [AiActionNames.RELEASE_DOCUMENT_EXPORT]: {
    effect: 'prepare',
    resources: ['document-export']
  },
  [AiActionNames.REPORT_OUTCOME]: { effect: 'prepare', resources: ['request'] },
  [AiActionNames.ARRANGE_DESIGN]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.ORGANIZE_DESIGN]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.UPDATE_DESIGN_ELEMENT]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.APPLY_PRESCRIBED_POSITIONS]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.REVIEW_DESIGN]: { effect: 'read', resources: ['document'] },
  [AiActionNames.READ_DESIGN_ATTACHMENT]: {
    effect: 'read',
    resources: ['document']
  },
  [AiActionNames.RESOLVE_DESIGN_TARGETS]: {
    effect: 'read',
    resources: ['document']
  },
  [AiActionNames.READ_DESIGN_CONTEXT]: {
    effect: 'read',
    resources: ['document']
  },
  [AiActionNames.APPLY_PREPARED_MATERIAL]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.APPLY_PREPARED_DESIGN]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.RELEASE_DESIGN_CONTEXT]: {
    effect: 'prepare',
    resources: ['request']
  },
  [AiActionNames.MAP_RETAINED_FILLS]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.INSPECT_DRAWING]: { effect: 'read', resources: ['document'] },
  [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]: {
    effect: 'read',
    resources: ['document']
  }
}
export const actionToolSemantics = (name: string, outputSchema: unknown) => {
  const metadata = actionEffects[name]
  if (!metadata) {
    throw new Error(`No declared action effects: ${name}`)
  }
  return toolSemantics(outputSchema, metadata.effect, metadata.resources)
}

/** Projection failure is a delivery result, never permission to retry a write. */
const toolDeliveryFailureCode = 'TOOL_DELIVERY_INVALID'
const toolDeliveryFailureSchema = (executionResult: unknown) =>
  toolResultObject(
    {
      available: { const: false },
      recoverable: { const: true },
      code: { const: toolDeliveryFailureCode },
      message: toolResultString,
      settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] },
      toolOutcome: toolResultObject({
        status: { const: 'partial' },
        settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] }
      }),
      executionResult
    },
    ['available', 'recoverable', 'code', 'message', 'settlement', 'toolOutcome']
  )

/** Admit host metadata only at the result root; business objects stay closed. */
export const hostToolResultSchema = (schema: unknown): unknown => {
  const record = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value)
  const outcome = toolResultObject(
    {
      status: { enum: ['success', 'partial', 'failed', 'unknown'] },
      settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] },
      issues: {
        type: 'array',
        items: toolResultObject(
          {
            actionName: toolResultString,
            code: toolResultString,
            message: toolResultString
          },
          ['code', 'message']
        )
      }
    },
    ['status', 'settlement']
  )
  const visit = (
    value: unknown,
    references: readonly string[] = [],
    root = false
  ): unknown => {
    if (!record(value)) {
      return value
    }
    const result = { ...value }
    let referenced: unknown
    if (
      typeof value.$ref === 'string' &&
      value.$ref.startsWith('#/') &&
      !references.includes(value.$ref)
    ) {
      let target: unknown = schema
      for (const part of value.$ref.slice(2).split('/')) {
        const key = part.replace(/~1/g, '/').replace(/~0/g, '~')
        target =
          record(target) || Array.isArray(target)
            ? (target as Record<string, unknown>)[key]
            : undefined
      }
      if (target !== undefined) {
        delete result.$ref
        referenced = visit(target, [...references, value.$ref])
      }
    }
    for (const key of ['allOf', 'anyOf', 'oneOf']) {
      if (Array.isArray(result[key])) {
        result[key] = result[key].map((branch) => visit(branch, references))
      }
    }
    if (Object.hasOwn(result, 'not')) {
      result.not = visit(result.not, references)
    }
    const restricted =
      result.additionalProperties !== undefined &&
      result.additionalProperties !== true
    const bounded =
      typeof result.minProperties === 'number' ||
      typeof result.maxProperties === 'number'
    if (restricted || bounded || result.propertyNames !== undefined || root) {
      result.properties = {
        ...(record(result.properties) ? result.properties : {}),
        toolOutcome:
          record(result.properties) &&
          result.properties.toolOutcome !== undefined
            ? { allOf: [result.properties.toolOutcome, outcome] }
            : outcome
      }
      if (result.propertyNames !== undefined) {
        result.propertyNames = {
          anyOf: [result.propertyNames, { const: 'toolOutcome' }]
        }
      }
      if (bounded) {
        const without: Record<string, unknown> = {
          not: { required: ['toolOutcome'] }
        }
        const withOutcome: Record<string, unknown> = {
          required: ['toolOutcome']
        }
        for (const key of ['minProperties', 'maxProperties']) {
          if (typeof result[key] === 'number') {
            without[key] = result[key]
            withOutcome[key] = result[key] + 1
          }
        }
        delete result.minProperties
        delete result.maxProperties
        result.allOf = [
          ...(Array.isArray(result.allOf) ? result.allOf : []),
          { anyOf: [without, withOutcome] }
        ]
      }
    }
    if (referenced !== undefined) {
      result.allOf = [
        referenced,
        ...(Array.isArray(result.allOf) ? result.allOf : [])
      ]
    }
    return result
  }
  return visit(schema, [], true)
}

/** Canonical result alternatives also own acknowledged delivery-failure evidence. */
const declaredToolResults = (
  contract: {
    outputSchema?: unknown
    partialOutputSchema?: unknown
    recoveryOutputSchema?: unknown
  },
  stage: 'owner' | 'host' = 'owner'
) => ({
  anyOf: [
    contract.outputSchema,
    contract.partialOutputSchema,
    contract.recoveryOutputSchema
  ]
    .filter((schema) => schema !== undefined)
    .map((schema, index) =>
      embedAiToolSchema(
        (stage === 'host'
          ? schema
          : hostToolResultSchema(schema)) as AiJsonValue,
        `#/anyOf/${index}`
      )
    )
})

/** Discovery and final egress publish the same complete partial-result contract. */
export const modelToolResultSchemas = (
  contract: {
    outputSchema?: unknown
    partialOutputSchema?: unknown
    recoveryOutputSchema?: unknown
    delivery?: AiToolContractInput['delivery']
  },
  stage: 'owner' | 'host' = 'owner'
) => {
  const annotate = (schema: unknown) =>
    modelResultSchema(stage === 'host' ? schema : hostToolResultSchema(schema))
  const failure = toolDeliveryFailureSchema(
    modelResultSchema(declaredToolResults(contract, stage))
  )
  return {
    outputSchema: contract.delivery
      ? modelResultSchema(hostToolResultSchema(contract.delivery.outputSchema))
      : annotate(contract.outputSchema),
    partialOutputSchema: {
      anyOf: [
        ...(contract.delivery
          ? [
              modelResultSchema(
                hostToolResultSchema(contract.delivery.outputSchema)
              )
            ]
          : []),
        ...(contract.partialOutputSchema === undefined
          ? []
          : [annotate(contract.partialOutputSchema)]),
        ...(contract.delivery && contract.recoveryOutputSchema !== undefined
          ? [annotate(contract.recoveryOutputSchema)]
          : []),
        failure
      ].map((schema, index) =>
        embedAiToolSchema(schema as AiJsonValue, `#/anyOf/${index}`)
      )
    },
    recoveryOutputSchema: annotate(contract.recoveryOutputSchema)
  }
}

/** Preserve the owner's schema vocabulary while removing declared internal fields. */
const modelResultSchema = (schema: unknown): unknown => {
  if (!schema || typeof schema !== 'object') {
    return schema
  }
  if (Array.isArray(schema)) {
    return schema.map(modelResultSchema)
  }
  const source = schema as Record<string, unknown>
  const result = { ...source }
  const properties = source.properties as Record<string, unknown> | undefined
  const omitted = new Set<string>()
  if (properties) {
    result.properties = Object.fromEntries(
      Object.entries(properties).flatMap(([key, child]) => {
        if (
          child &&
          typeof child === 'object' &&
          (child as Record<string, unknown>)['x-model-visibility'] ===
            'internal'
        ) {
          omitted.add(key)
          return []
        }
        return [[key, modelResultSchema(child)]]
      })
    )
    if (Array.isArray(source.required)) {
      result.required = source.required.filter((key) => !omitted.has(key))
    }
  }
  for (const key of [
    '$defs',
    'definitions',
    'patternProperties',
    'dependentSchemas'
  ]) {
    const children = source[key]
    if (children && typeof children === 'object' && !Array.isArray(children)) {
      result[key] = Object.fromEntries(
        Object.entries(children).map(([name, child]) => [
          name,
          modelResultSchema(child)
        ])
      )
    }
  }
  for (const key of [
    'anyOf',
    'oneOf',
    'allOf',
    'prefixItems',
    'items',
    'additionalProperties',
    'not',
    'if',
    'then',
    'else'
  ]) {
    if (source[key] !== undefined) {
      result[key] = modelResultSchema(source[key])
    }
  }
  return result
}

/** Select declared envelope fields; explicitly open domain values retain their keys.
 * This is a pure projection of an already validated result, never owner execution.
 */
export const projectToolResultFields = (
  value: unknown,
  schema: unknown
): unknown => {
  const record = (item: unknown): item is Record<string, unknown> =>
    !!item && typeof item === 'object' && !Array.isArray(item)
  const project = (
    item: unknown,
    sources: readonly unknown[],
    depth: number
  ): unknown => {
    if (depth > 64) {
      throw new Error('Model result projection exceeds schema depth')
    }
    const fields = new Map<string, unknown[]>()
    const parts: Record<string, unknown>[] = []
    let opaque = false
    let envelope = false
    const internal = new Set<string>()
    const patterns: [RegExp, unknown][] = []
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
      if (typeof source.$ref === 'string' && source.$ref.startsWith('#/')) {
        let target: unknown = schema
        for (const token of source.$ref.slice(2).split('/')) {
          const key = token.replace(/~1/g, '/').replace(/~0/g, '~')
          target =
            record(target) || Array.isArray(target)
              ? (target as Record<string, unknown>)[key]
              : undefined
        }
        visit(target)
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
      if (record(source.patternProperties)) {
        for (const [pattern, child] of Object.entries(
          source.patternProperties
        )) {
          patterns.push([new RegExp(pattern), child])
        }
      }
      if (source.if !== undefined) {
        const matches = !operationInputIssues(item, source.if, schema, 'output')
        visit(matches ? source.then : source.else)
      }
      if (record(item) && record(source.dependentSchemas)) {
        for (const [key, child] of Object.entries(source.dependentSchemas)) {
          if (Object.hasOwn(item, key)) {
            visit(child)
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
          depth + 1
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
    if (!envelope && !patterns.length && !dynamic.length) {
      return item
    }
    const entries: [string, unknown][] = []
    for (const [key, value] of Object.entries(item)) {
      if (internal.has(key)) {
        continue
      }
      const named = fields.get(key) ?? []
      const patterned = patterns
        .filter(([pattern]) => pattern.test(key))
        .map(([, child]) => child)
      const children = [...named, ...patterned]
      if (!children.length) {
        children.push(...dynamic)
      }
      if (children.length) {
        entries.push([key, project(value, children, depth + 1)])
      }
    }
    return Object.fromEntries(entries)
  }
  return project(value, [schema], 0)
}

/** External delivery consumes an owner-authored view after complete internal handoff. */
export const projectToolDelivery = (
  contract: Pick<AiToolContractInput, 'delivery'> & {
    outputSchema?: unknown
    partialOutputSchema?: unknown
    recoveryOutputSchema?: unknown
  },
  value: unknown
): unknown => {
  if (!contract.delivery) {
    return projectToolResultFields(value, {
      anyOf: [
        contract.outputSchema,
        contract.partialOutputSchema,
        contract.recoveryOutputSchema
      ]
        .filter((entry) => entry !== undefined)
        .map((entry, index) =>
          embedAiToolSchema(
            hostToolResultSchema(entry) as AiJsonValue,
            `#/anyOf/${index}`
          )
        )
    })
  }
  let view: unknown = value
  for (const token of contract.delivery.path.slice(1).split('/')) {
    const key = token.replace(/~1/g, '/').replace(/~0/g, '~')
    view =
      view && typeof view === 'object' && Object.hasOwn(view, key)
        ? (view as Record<string, unknown>)[key]
        : undefined
  }
  // A settled owner failure has no successful delivery view to publish. Select
  // its declared recovery envelope, preserving the failure instead of replacing
  // it with a missing-view error or replaying the successful prefix.
  const originalValue =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined
  const reported = designActionOutcome(originalValue?.toolOutcome ?? value)
  if (view === undefined && reported.status !== 'success') {
    const recovery = [
      contract.partialOutputSchema,
      contract.recoveryOutputSchema
    ].filter((schema) => schema !== undefined)
    const declared = {
      anyOf: recovery.map((schema, index) =>
        embedAiToolSchema(
          hostToolResultSchema(schema) as AiJsonValue,
          `#/anyOf/${index}`
        )
      )
    }
    if (
      recovery.length &&
      !operationContractIssue(value, declared, { stage: 'output' })
    ) {
      return projectToolResultFields(value, declared)
    }
  }
  const issue =
    view === undefined
      ? 'Declared delivery view is unavailable.'
      : operationContractIssue(view, contract.delivery.outputSchema, {
          stage: 'output'
        })
  const original =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  if (issue) {
    return toolDeliveryFailure(value, issue, contract)
  }
  if (!view || typeof view !== 'object' || Array.isArray(view)) {
    return view
  }
  return {
    ...(projectToolResultFields(view, contract.delivery.outputSchema) as Record<
      string,
      unknown
    >),
    ...(original.toolOutcome ? { toolOutcome: original.toolOutcome } : {})
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
  }
) => {
  const original =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const outcome = designActionOutcome(original.toolOutcome ?? original)
  const declared = declaredToolResults(contract)
  const acknowledged = !operationContractIssue(value, declared, {
    stage: 'output'
  })
    ? projectToolResultFields(value, declared)
    : undefined
  return {
    available: false,
    recoverable: true,
    code: toolDeliveryFailureCode,
    message: `${issue} Execution must not be replayed.`,
    settlement: outcome.settlement,
    toolOutcome: { status: 'partial', settlement: outcome.settlement },
    ...(acknowledged === undefined ? {} : { executionResult: acknowledged })
  }
}
