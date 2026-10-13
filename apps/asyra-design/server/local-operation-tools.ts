import {
  embedAiToolSchema,
  type AiJsonValue as RuntimeJsonValue
} from '@asyra/ai-agent-runtime'
import {
  createDesignCheckResults,
  designCheckResultsSchema,
  designCheckSummarySchema
} from './design-check-results'
import { serializeToolPayload } from '@asyra/ai-agent-runtime/node'
import { createLocalQueryArtifacts } from './local-query-artifacts'
import { BrowserBatchExecutionError } from './batch-exchange'
import type { LocalToolOwnership } from './local-tool-leases'
import {
  toolResultCount,
  toolResultObject,
  toolResultString,
  toolSemantics,
  actionToolSemantics
} from '../src/ai/tool-contract'
import {
  createPreparedDesignReview,
  preparedReviewDefinition,
  type PreparedAttachment
} from './local-prepared-design-review'
import type { ReferenceIdentity } from './local-reference-decisions'
import sharp from 'sharp'
import type { VisualAssessmentInput } from './local-visual-assessment'
import {
  LocalToolInputError,
  localToolOutcome,
  localToolFailureReply,
  localToolErrorMessage,
  type LocalToolDefinition
} from './local-tool-invocation'
import type { InspectionEvidenceStamp } from '../src/ai/inspection-evidence'
import {
  nativeToolInputSchema,
  operationInputIssue
} from './operation-input-schema'
import { LocalToolAccess } from './local-tool-scheduler'
import {
  basicApiContracts,
  getBasicApiContract
} from '../src/ai/basic-api-catalog'
import { prepareOperationBatch } from './local-operation-batch'
import {
  createLocalDesignReview,
  designEvidenceDefinitions,
  designEvidenceInput,
  reviewVisualSchema
} from './local-design-review'
import { AiDesignToolIds } from '../src/constants/ai-design'
import { AiReferenceToolIds } from './ai-domain-prompt'
import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import {
  AiActionNames,
  AiBatchOnlyActionNames
} from '../src/constants/ai-actions'
import type {
  AiActionBatch,
  AiProviderInput,
  AiBatchReceipt
} from '../src/ai/action-batch-protocol'
/** Browser success is the first receipt; automatic inspection is a separate tail. */
const singleActionSemantics = (action: AiProviderInput['actions'][number]) => {
  const receipt = (result: unknown, primary = false) =>
    toolResultObject({
      actionId: toolResultString,
      actionName: primary ? { const: action.name } : toolResultString,
      result
    })
  const envelope = (result: unknown) =>
    toolResultObject(
      {
        actionResults: {
          type: 'array',
          minItems: 1,
          prefixItems: [
            receipt(
              embedAiToolSchema(
                result as RuntimeJsonValue,
                '#/properties/actionResults/prefixItems/0/properties/result'
              ),
              true
            )
          ],
          items: receipt(true)
        },
        checks: designCheckSummarySchema
      },
      ['actionResults']
    )
  if (!('outputSchema' in action))
    return {
      ...actionToolSemantics(
        action.name,
        toolResultObject(
          {
            actionResults: { type: 'array', items: receipt(true) },
            checks: designCheckSummarySchema
          },
          ['actionResults']
        )
      ),
      composition: 'control-plane' as const
    }
  const outputSchema = envelope(action.outputSchema)
  const semantics = toolSemantics(
    outputSchema,
    action.effect,
    action.resources,
    action.lifecycle.output
  )
  return {
    ...action,
    ...(action.verification
      ? {
          verification: {
            statusPath:
              '/actionResults/0/result' + action.verification.statusPath,
            progressPath:
              '/actionResults/0/result' + action.verification.progressPath
          }
        }
      : {}),
    outputSchema,
    ...(action.recoveryOutputSchema === undefined
      ? {}
      : {
          recoveryOutputSchema: envelope(action.recoveryOutputSchema)
        }),
    partialOutputSchema: {
      anyOf: [
        embedAiToolSchema(
          semantics.partialOutputSchema as RuntimeJsonValue,
          '#/anyOf/0'
        ),
        embedAiToolSchema(
          envelope(
            action.partialOutputSchema ?? action.outputSchema
          ) as RuntimeJsonValue,
          '#/anyOf/1'
        )
      ]
    }
  }
}

export class LocalOperationPreparationError extends LocalToolInputError {
  constructor(message?: string) {
    super(
      message ??
        'Drawing preparation rejected these arguments before any canvas changes. Check the supplied operation schema, use a valid artifact from this request, valid target bounds and only supported fields. Component conversions require matching analysis receipts; omit optional mappings and analysisIds when no conversion is selected. Correct the arguments and reuse the prepared artifact; do not invent replacement paths or repeat unchanged arguments.'
    )
  }
}

export interface NativeToolDescriptor extends LocalToolDefinition {
  registeredName?: string
  namespace: string
  description: string
  execution?: {
    kind: 'registered-tool'
    namespace: string
    tool: string
    arguments: { name: string; revision: number }
  }
}

export interface LocalActionPreparation {
  checkResults?: ReturnType<typeof createDesignCheckResults>
  resolveRecipe?: Parameters<
    typeof createPreparedDesignReview
  >[0]['resolveRecipe']
  resolveTargets?(reference: unknown): string[]
  modelActions(actions: AiProviderInput['actions']): AiProviderInput['actions']
  resolveBatch(value: unknown): unknown
}

const requiresVisualReview = (name: string) => {
  const basic = getBasicApiContract(name)
  if (basic) return basic.effect === 'write' || basic.effect === 'delete'
  return ![
    AiActionNames.SELECT_ELEMENTS,
    AiActionNames.READ_DESIGN_CONTEXT,
    AiActionNames.RELEASE_DESIGN_CONTEXT,
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.INSPECT_DRAWING,
    AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
    AiActionNames.READ_DESIGN_ATTACHMENT,
    AiActionNames.ORGANIZE_DESIGN
  ].includes(name as never)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Canonical snapshots remain with their execution/history owner. Compact delivery
// projects only declared structural results; unknown or uncertain data is intact.
const compactStructuralResult = (
  actionName: string,
  result: unknown
): unknown => {
  const kind = getBasicApiContract(actionName)?.result.kind
  if (
    (kind !== 'moves' && kind !== 'removed') ||
    !isRecord(result) ||
    result.status !== 'complete' ||
    !isRecord(result.value)
  )
    return result
  const value = result.value
  const entries = value[kind]
  const allowed =
    kind === 'moves'
      ? ['moves', 'elementIds']
      : ['removed', 'elementId', 'rootParentChildrenAfter']
  if (
    Object.keys(value).some((key) => !allowed.includes(key)) ||
    !Array.isArray(entries) ||
    entries.some(
      (entry) =>
        !isRecord(entry) ||
        typeof entry.elementId !== 'string' ||
        !entry.elementId
    )
  )
    return result
  const identities = entries.map((entry) => ({ elementId: entry.elementId }))
  return {
    ...result,
    value: {
      [kind]: identities,
      ...(typeof value.elementId === 'string'
        ? { elementId: value.elementId }
        : {}),
      ...(Array.isArray(value.elementIds)
        ? { elementIds: value.elementIds }
        : {})
    }
  }
}

// Paths address the registered schema, not an inferred argument shape. A partial
// answer never becomes an alternate admission schema.
const schemaValueAt = (schema: unknown, path: string): unknown => {
  if (!path.startsWith('/') || /~(?![01])/u.test(path))
    throw new LocalOperationPreparationError(`Invalid schema path: ${path}`)
  let value = schema
  for (const part of path.slice(1).split('/')) {
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~')
    if (
      (!isRecord(value) && !Array.isArray(value)) ||
      !Object.hasOwn(value, key)
    )
      throw new LocalOperationPreparationError(
        `Unknown schema path: ${path}. Request view=usage for root paths or the containing schema path; the full definition remains available.`
      )
    value = (value as Record<string, unknown>)[key]
  }
  return value
}

const schemaFragments = (schema: unknown, paths: string[]) => {
  const fragments = [...new Set(paths)].map((path) => ({
    path,
    schema: schemaValueAt(schema, path)
  }))
  const contexts = new Map<string, Record<string, unknown>>()
  for (const path of paths) {
    const segments = path.split('/').slice(1)
    for (let length = 0; length < segments.length; length++) {
      const ancestorPath = length
        ? `/${segments.slice(0, length).join('/')}`
        : ''
      const ancestor = ancestorPath
        ? schemaValueAt(schema, ancestorPath)
        : schema
      if (!isRecord(ancestor)) continue
      const constraints = Object.fromEntries(
        Object.entries(ancestor).filter(([key]) =>
          [
            'type',
            'required',
            'additionalProperties',
            'minProperties',
            'maxProperties',
            'dependentRequired',
            'dependentSchemas',
            'allOf',
            'anyOf',
            'oneOf',
            'not',
            'if',
            'then',
            'else',
            'minItems',
            'maxItems',
            'uniqueItems',
            'contains',
            'minContains',
            'maxContains'
          ].includes(key)
        )
      )
      if (isRecord(ancestor.properties))
        constraints.allowedProperties = Object.keys(ancestor.properties)
      if (Object.keys(constraints).length)
        contexts.set(ancestorPath, constraints)
    }
  }
  const references = new Map<string, unknown>()
  const unresolved = new Set<string>()
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!isRecord(value)) return
    if (
      typeof value.$ref === 'string' &&
      !references.has(value.$ref) &&
      !unresolved.has(value.$ref)
    ) {
      const ref = value.$ref
      if (ref.startsWith('#/')) {
        try {
          const dependency = schemaValueAt(schema, ref.slice(1))
          references.set(ref, dependency)
          visit(dependency)
        } catch (error) {
          if (!(error instanceof LocalOperationPreparationError)) throw error
          unresolved.add(ref)
        }
      } else unresolved.add(ref)
    }
    for (const child of Object.values(value)) visit(child)
  }
  for (const fragment of fragments) visit(fragment.schema)
  for (const context of contexts.values()) visit(context)
  return {
    schemaFragments: fragments,
    schemaContext: [...contexts].map(([path, schema]) => ({ path, schema })),
    schemaReferences: Object.fromEntries(references),
    ...(unresolved.size ? { unresolvedSchemaReferences: [...unresolved] } : {})
  }
}

const inputFieldPaths = (schema: unknown, prefix = ''): string[] => {
  if (!isRecord(schema)) return []
  const fields = isRecord(schema.properties)
    ? Object.keys(schema.properties).map(
        (name) =>
          `${prefix}/properties/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`
      )
    : []
  for (const mode of ['anyOf', 'oneOf', 'allOf']) {
    const branches = schema[mode]
    if (Array.isArray(branches))
      branches.forEach((branch, index) =>
        fields.push(...inputFieldPaths(branch, `${prefix}/${mode}/${index}`))
      )
  }
  return fields
}

const inspectionStamp = (
  value: unknown
): InspectionEvidenceStamp | undefined =>
  isRecord(value) &&
  typeof value.sessionId === 'string' &&
  value.sessionId.length > 0 &&
  Number.isSafeInteger(value.revision) &&
  Number(value.revision) >= 0
    ? {
        sessionId: value.sessionId,
        revision: Number(value.revision),
        ...(typeof value.receiptId === 'string' && value.receiptId
          ? { receiptId: value.receiptId }
          : {})
      }
    : undefined
const checkResultsDefinition = {
  type: 'function',
  name: AiDesignToolIds.READ_DESIGN_CHECKS,
  ...toolSemantics(designCheckResultsSchema, 'read', ['request-artifacts']),
  revision: 3,
  executionAccess: LocalToolAccess.EXCLUSIVE,
  description:
    'Read retained tool and primary-agent checks for this request. Default returns unresolved/stale work and status counts; includePassed retrieves stored pass evidence. Results never substitute for current canonical inspection. No model is invoked.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      includePassed: { type: 'boolean' },
      ids: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', minLength: 1 }
      }
    }
  }
}

/** Tool-specific preparation stays on the server; only canonical receipts return to the model. */
export const createLocalOperationTools = (
  actions: AiProviderInput['actions'],
  preparation: LocalActionPreparation,
  dispatchBatch: (batch: AiActionBatch) => Promise<AiBatchReceipt>,
  options: {
    ownership?: LocalToolOwnership
    requestSignal?: AbortSignal
    reviewTargetId?: string
    getNativeTools?: () => NativeToolDescriptor[]
    getNativeToolsRevision?: () => number
    resolveSources?: (sources: string[]) => string[]
    validateReferences?: (
      indexes: number[],
      referenceIds?: string[]
    ) => ReferenceIdentity[]
    onInspection?: (status: 'running' | 'completed') => void
  } = {}
) => {
  const queryArtifacts = options.ownership
    ? createLocalQueryArtifacts({
        ownership: options.ownership,
        release: async (snapshotId) => {
          // The browser transaction finally owns cancellation cleanup, including
          // transport loss. Do not send a cleanup action through an aborted request.
          if (options.requestSignal?.aborted) return
          const id = randomUUID()
          const receipt = await dispatchBatch({
            batchId: randomUUID(),
            actions: [
              {
                id,
                name: AiActionNames.RELEASE_DESIGN_CONTEXT,
                arguments: { snapshotId },
                summary: 'Release retained query data'
              }
            ]
          })
          const acknowledged = receipt.actionResults.find(
            (entry) =>
              entry.actionId === id &&
              entry.actionName === AiActionNames.RELEASE_DESIGN_CONTEXT
          )
          if (
            !isRecord(acknowledged?.result) ||
            typeof acknowledged.result.released !== 'boolean'
          )
            throw new Error('Browser query release was not acknowledged')
        }
      })
    : undefined
  const executeBatch = async (batch: AiActionBatch) => {
    queryArtifacts?.admit(batch)
    const receipt = await dispatchBatch(batch)
    await queryArtifacts?.accept(batch, receipt)
    return receipt
  }
  const allowed = new Set<string>([
    ...Object.values(AiActionNames),
    ...basicApiContracts.map(({ name }) => name)
  ])
  const registered = preparation
    .modelActions(actions)
    .filter(
      (action) =>
        allowed.has(action.name) &&
        ![
          AiActionNames.REPORT_OUTCOME,
          AiActionNames.REQUEST_CLARIFICATION,
          AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE
        ].includes(action.name as never)
    )
  // Request-local indexes are derived from admitted actions; no model call or stale schema copy.
  const admittedApisByName = new Map(registered.map((api) => [api.name, api]))
  const contextReader = registered.find(
    (action) => action.name === AiActionNames.READ_DESIGN_CONTEXT
  )
  const contextAlternatives = (
    schema: unknown,
    depth = 0
  ): Record<string, unknown>[] => {
    if (!isRecord(schema) || depth > 32) return []
    for (const mode of ['oneOf', 'anyOf']) {
      const branches = schema[mode]
      if (Array.isArray(branches))
        return branches.flatMap((branch) =>
          contextAlternatives(branch, depth + 1)
        )
    }
    if (
      !isRecord(schema.properties) ||
      !schema.properties.scope ||
      operationInputIssue('region', schema.properties.scope) !== undefined
    )
      return []
    return [schema.properties]
  }
  const contextCandidates = contextAlternatives(
    nativeToolInputSchema(contextReader?.inputSchema)
  )
  const contextFields =
    contextCandidates.length === 1 ? contextCandidates[0] : undefined
  const regionTargetSchema =
    contextFields?.bounds && contextFields?.allMatches
      ? {
          type: 'object',
          additionalProperties: false,
          required: ['scope', 'bounds'],
          properties: {
            scope: { const: 'region' },
            bounds: contextFields.bounds,
            ...(contextFields.filter ? { filter: contextFields.filter } : {}),
            ...(contextFields.expectedCount
              ? { expectedCount: contextFields.expectedCount }
              : {})
          }
        }
      : undefined
  const targetArgumentPathSchema = {
    type: 'array',
    minItems: 1,
    maxItems: 32,
    description:
      'Exact registered argument path for nested or repeated fields, e.g. ["mappings",0,"query","elementIds"]. Array slots must already exist.',
    items: {
      anyOf: [
        { type: 'string', minLength: 1 },
        { type: 'integer', minimum: 0 }
      ]
    }
  }
  const targetReferenceSchema = {
    anyOf: [
      {
        type: 'object',
        additionalProperties: false,
        required: ['artifactId', 'field'],
        properties: {
          artifactId: { type: 'string' },
          targetSetId: { type: 'string', minLength: 1, maxLength: 160 },
          field: { enum: ['elementId', 'elementIds'] },
          path: targetArgumentPathSchema,
          keys: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' }
          },
          keyPrefix: { type: 'string', minLength: 1 }
        }
      },
      ...(regionTargetSchema
        ? [
            {
              type: 'object',
              additionalProperties: false,
              required: ['field', 'query'],
              properties: {
                field: { const: 'elementIds' },
                path: targetArgumentPathSchema,
                query: regionTargetSchema
              }
            }
          ]
        : [])
    ]
  }
  const resolveQueryTargets = async (
    operations: unknown,
    signal: AbortSignal
  ) => {
    const resolved = new Map<string, string[]>()
    const queryKeys = new Map<string, Record<string, unknown>>()
    const artifactTargets = new Map<string, string[]>()
    const resolve = (reference: unknown): string[] => {
      if (isRecord(reference) && reference.query !== undefined) {
        if (
          Object.keys(reference).length !== 1 ||
          !regionTargetSchema ||
          !isRecord(reference.query)
        )
          throw new Error(
            'Region query targets require the registered context reader and no artifact selector.'
          )
        const issue = operationInputIssue(reference.query, regionTargetSchema)
        if (issue) throw new Error(issue)
        const key = JSON.stringify(reference.query)
        queryKeys.set(key, reference.query)
        return resolved.get(key) ?? ['query-admission-target']
      }
      if (!preparation.resolveTargets)
        throw new Error('Artifact references are unavailable.')
      const key = JSON.stringify(reference)
      const cached = artifactTargets.get(key)
      if (cached) return cached
      const ids = preparation.resolveTargets(reference)
      artifactTargets.set(key, ids)
      return ids
    }
    // Check every operation before any read. A query is a plural snapshot, not
    // an instruction to fan out scalar writes or reevaluate after each mutation.
    if (Array.isArray(operations))
      for (const operation of operations) {
        if (!isRecord(operation)) continue
        const targets = Array.isArray(operation.target)
          ? operation.target
          : [operation.target]
        for (const target of targets)
          if (
            isRecord(target) &&
            target.query !== undefined &&
            target.field !== 'elementIds'
          )
            throw new Error(
              'Region query targets require the plural elementIds field.'
            )
      }
    const executable = registered.filter(
      (a) =>
        ![AiActionNames.REVIEW_DESIGN, AiActionNames.INSPECT_DRAWING].includes(
          a.name as never
        )
    )
    const admitted = prepareOperationBatch(operations, executable, resolve)
    if (!queryKeys.size) return admitted
    if (!contextReader) throw new Error('Region context reader is unavailable.')
    for (const [key, query] of queryKeys) {
      signal.throwIfAborted()
      const argumentsValue = {
        ...query,
        result: 'ids',
        allMatches: true,
        delivery: 'page'
      }
      const issue = operationInputIssue(
        argumentsValue,
        contextReader.inputSchema
      )
      if (issue) throw new Error(issue)
      const id = randomUUID()
      const batch = resolvePreparedBatch({
        batchId: randomUUID(),
        actions: [
          {
            id,
            name: AiActionNames.READ_DESIGN_CONTEXT,
            arguments: argumentsValue,
            summary: 'Resolve exact region targets'
          }
        ]
      }) as AiActionBatch
      const receipt = await executeBatch(batch)
      signal.throwIfAborted()
      const matches = receipt.actionResults.filter(
        (entry) =>
          entry.actionId === id &&
          entry.actionName === AiActionNames.READ_DESIGN_CONTEXT
      )
      const value = matches.length === 1 ? matches[0].result : undefined
      if (
        !isRecord(value) ||
        value.available !== true ||
        value.nextOffset !== null ||
        !Array.isArray(value.elementIds) ||
        value.elementIds.some((id) => typeof id !== 'string' || !id) ||
        new Set(value.elementIds).size !== value.elementIds.length ||
        value.total !== value.elementIds.length ||
        !Array.isArray(value.missingIds) ||
        value.missingIds.length
      )
        throw new Error(
          'Region target query did not return a complete usable identity set; no mutation was submitted.'
        )
      if (
        query.expectedCount !== undefined &&
        value.total !== query.expectedCount
      )
        throw new Error(
          'Region target match count differs from expectedCount; no mutation was submitted.'
        )
      if (!value.elementIds.length)
        throw new Error(
          'Region query matched no targets; no mutation was submitted.'
        )
      resolved.set(key, value.elementIds as string[])
    }
    return prepareOperationBatch(operations, executable, resolve)
  }
  const admittedApisByOperation = new Map<string, (typeof registered)[number]>()
  const admittedApiCategories = new Map<string, typeof registered>()
  for (const api of admittedApisByName.values()) {
    const contract = getBasicApiContract(api.name)
    const category = contract ? contract.category : 'design'
    admittedApisByOperation.set(contract ? contract.operation : api.name, api)
    const entries = admittedApiCategories.get(category) ?? []
    entries.push(api)
    admittedApiCategories.set(category, entries)
  }
  const definitionPageSize = 16
  const returnedDefinitions = new Map<string, string>()
  const deliverDefinition = (
    identity: string,
    descriptor: Record<string, unknown>,
    reference: Record<string, unknown>,
    args: Record<string, unknown>
  ) => {
    const { inputSchema, ...usage } = descriptor
    const revision = createHash('sha256')
      .update(JSON.stringify(descriptor))
      .digest('hex')
    const refresh = {
      tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      arguments: {
        names: [identity],
        refresh: true,
        refreshReason: 'context-loss'
      }
    }
    let coverage = 'full'
    if (args.view === 'usage') coverage = 'usage'
    else if (Array.isArray(args.schemaPaths)) coverage = 'partial'
    const requestedPaths = Array.isArray(args.schemaPaths)
      ? [...new Set(args.schemaPaths as string[])].sort()
      : []
    const deliveryKey = JSON.stringify([identity, coverage, requestedPaths])
    const previousRevision = returnedDefinitions.get(deliveryKey)
    let deliveryReason = 'initial'
    if (args.refresh === true) deliveryReason = 'recovery'
    else if (previousRevision !== undefined)
      deliveryReason =
        previousRevision === revision ? 'unchanged' : 'version-changed'
    const provenance = {
      deliveryReason,
      ...(args.refresh === true
        ? { recoveryReason: args.refreshReason ?? 'unknown' }
        : {})
    }
    if (args.view === 'usage' || Array.isArray(args.schemaPaths)) {
      const repeated = args.refresh !== true && previousRevision === revision
      let projection = reference
      if (!repeated) {
        projection =
          args.view === 'usage'
            ? { ...usage, inputFields: inputFieldPaths(inputSchema) }
            : {
                ...reference,
                ...schemaFragments(inputSchema, args.schemaPaths as string[])
              }
      }
      returnedDefinitions.set(deliveryKey, revision)
      return {
        ...projection,
        definition: {
          revision,
          state: repeated ? 'previously-returned' : 'included',
          coverage: repeated ? 'reference' : coverage,
          requestedCoverage: coverage,
          availableInResponse: !repeated,
          nextAction: repeated
            ? 'reuse-or-recover-requested-scope'
            : 'use-response-or-recover-requested-scope',
          ...provenance,
          recover: {
            tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
            arguments: {
              names: [identity],
              ...(args.view === 'usage'
                ? { view: 'usage' }
                : { schemaPaths: args.schemaPaths }),
              refresh: true,
              refreshReason: 'delivery-failure'
            }
          },
          refresh
        }
      }
    }
    const repeated = args.refresh !== true && previousRevision === revision
    returnedDefinitions.set(deliveryKey, revision)
    return {
      ...(repeated ? reference : descriptor),
      definition: {
        revision,
        state: repeated ? 'previously-returned' : 'included',
        coverage: repeated ? 'reference' : 'full',
        availableInResponse: !repeated,
        ...provenance,
        nextAction: repeated
          ? 'reuse-or-refresh-if-missing'
          : 'use-current-response',
        refresh
      }
    }
  }
  const nativeCategory = 'tools'
  const categoryChoices = [
    ...admittedApiCategories.keys(),
    ...(options.getNativeTools ? [nativeCategory] : [])
  ]
  const lookupRecovery = `Available categories: ${categoryChoices.join(', ')}. Select one category for its admitted operation menu. Exact names may also identify native tools; use their returned execution route.`
  // Resolve lazily after the provider has assembled all native tool groups.
  // The definitions and index live for this request only.
  let nativeToolsByName: Map<string, NativeToolDescriptor[]> | undefined
  let nativeToolsRevision: number | undefined
  let nativeTools: NativeToolDescriptor[] = []
  const nativeMatches = (name: string): NativeToolDescriptor[] => {
    const revision = options.getNativeToolsRevision?.() ?? 0
    if (!nativeToolsByName || nativeToolsRevision !== revision) {
      nativeToolsByName = new Map()
      nativeTools = options.getNativeTools?.() ?? []
      for (const tool of nativeTools) {
        for (const key of [tool.name, `${tool.namespace}.${tool.name}`]) {
          const matches = nativeToolsByName.get(key) ?? []
          matches.push(tool)
          nativeToolsByName.set(key, matches)
        }
      }
      nativeToolsRevision = revision
    }
    return nativeToolsByName.get(name) ?? []
  }
  const nativeInventory = () => {
    nativeMatches('')
    return nativeTools
  }
  const nativeExecution = (tool: NativeToolDescriptor) =>
    tool.execution ?? {
      kind: 'native-tool',
      namespace: tool.namespace,
      tool: tool.name
    }
  const checkResults = preparation.checkResults ?? createDesignCheckResults()
  const designReview = createLocalDesignReview({
    results: checkResults,
    resolveSources: options.resolveSources,
    validateReferences: options.validateReferences
  })
  const readAttachmentEvidence = async (
    name: string,
    args: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<Record<string, unknown>> => {
    signal.throwIfAborted()
    if (!registered.some((action) => action.name === name))
      throw new Error('Canonical attachment evidence action is unavailable.')
    const id = randomUUID()
    const receipt = await executeBatch({
      batchId: randomUUID(),
      actions: [
        {
          id,
          name,
          arguments: args,
          summary: 'Read canonical attachment evidence'
        }
      ]
    })
    signal.throwIfAborted()
    const matches = receipt.actionResults.filter(
      (entry) => entry.actionId === id && entry.actionName === name
    )
    const result = matches.length === 1 ? matches[0].result : undefined
    if (!isRecord(result))
      throw new Error('Canonical attachment evidence is unavailable.')
    return result
  }
  const preparedReview = preparation.resolveRecipe
    ? createPreparedDesignReview({
        results: checkResults,
        resolveRecipe: preparation.resolveRecipe,
        context: () => designReview.preparationContext(),
        resolveAttachment: async (parentId, signal) => {
          const result = await readAttachmentEvidence(
            AiActionNames.READ_DESIGN_ATTACHMENT,
            parentId === undefined ? {} : { parentId },
            signal
          )
          const stamp = inspectionStamp(result.evidence)
          if (
            result.available !== true ||
            !stamp ||
            typeof result.parentId !== 'string' ||
            typeof result.workspaceId !== 'string' ||
            !Array.isArray(result.basis) ||
            result.basis.length !== 3 ||
            result.basis.some(
              (point) =>
                !isRecord(point) ||
                !Number.isFinite(point.x) ||
                !Number.isFinite(point.y)
            )
          )
            throw new Error('Canonical attachment evidence is incomplete.')
          return result as unknown as PreparedAttachment
        },
        attachmentCurrent: async (attachment, signal) =>
          (
            await readAttachmentEvidence(
              AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
              { evidence: attachment.evidence },
              signal
            )
          ).current === true
      })
    : undefined
  const resolvePreparedBatch = (value: unknown): unknown => {
    const attachments = new Map<string, PreparedAttachment>()
    if (isRecord(value) && Array.isArray(value.actions)) {
      for (const action of value.actions) {
        if (
          isRecord(action) &&
          action.name === AiActionNames.APPLY_PREPARED_DESIGN &&
          isRecord(action.arguments) &&
          typeof action.arguments.artifactId === 'string'
        ) {
          const attachment = preparedReview?.assertApplicable(
            action.arguments.artifactId,
            typeof action.arguments.parentId === 'string'
              ? action.arguments.parentId
              : undefined
          )
          if (attachment && typeof action.id === 'string')
            attachments.set(action.id, attachment)
        }
      }
    }
    const resolved = preparation.resolveBatch(value)
    if (
      !attachments.size ||
      !isRecord(resolved) ||
      !Array.isArray(resolved.actions)
    )
      return resolved
    return {
      ...resolved,
      actions: resolved.actions.map((action) => {
        if (
          !isRecord(action) ||
          typeof action.id !== 'string' ||
          !isRecord(action.arguments)
        )
          return action
        const attachment = attachments.get(action.id)
        return attachment
          ? {
              ...action,
              arguments: {
                ...action.arguments,
                attachmentEvidence: {
                  parentId: attachment.parentId,
                  workspaceId: attachment.workspaceId,
                  evidence: attachment.evidence
                }
              }
            }
          : action
      })
    }
  }

  const inspectionImages = new Map<
    string,
    VisualAssessmentInput['images'][number]
  >()
  let reviewTargetId = options.reviewTargetId
  const reviewScope = new Set(
    options.reviewTargetId ? [options.reviewTargetId] : []
  )
  const measuredTargets = new Map<string, InspectionEvidenceStamp | undefined>()
  let inspectionUnavailable = false
  let measurementPending = false
  const mutationScopeId = 'mutation-scope:request'
  const scopeRecovery =
    'Stop this request and report its unverified writes. Read or inspect the current document if needed; continue editing only in a new request from current state. Do not replay writes.'
  const hasUnresolvedMutationScope = () =>
    !!checkResults.summary([mutationScopeId]).firstPendingId
  const unknownScope = (actionId: string) => {
    if (hasUnresolvedMutationScope()) return
    checkResults.record({
      id: mutationScopeId,
      origin: 'tool',
      status: 'unverified',
      evidence: JSON.stringify({
        actionId,
        code: 'MUTATION_SCOPE_UNAVAILABLE',
        recovery: scopeRecovery
      }),
      scope: [],
      dependencies: {}
    })
  }
  const measurementId = (target: string) => `measurement:${target}`
  const pendingMeasurementCount = () => {
    const { counts } = checkResults.summary(
      [...measuredTargets.keys()].map(measurementId)
    )
    return counts.fail + counts.unverified + counts.stale
  }
  const canReview = registered.some(
    (action) => action.name === AiActionNames.REVIEW_DESIGN
  )
  const markMeasurementUnavailable = (
    elementId: string,
    findings: unknown[] = []
  ) => {
    const id = measurementId(elementId)
    const previous = checkResults.read({ ids: [id], includePassed: true })
      .items[0]
    let evidence =
      previous?.evidence ?? JSON.stringify({ complete: false, findings: [] })
    if (findings.length) {
      const prior = previous ? JSON.parse(previous.evidence) : undefined
      const retained =
        isRecord(prior) && Array.isArray(prior.findings) ? prior.findings : []
      evidence = JSON.stringify({
        complete: false,
        findings: [
          ...new Map(
            [...retained, ...findings].map((finding) => [
              JSON.stringify(finding),
              finding
            ])
          ).values()
        ]
      })
    }
    measuredTargets.set(elementId, undefined)
    measurementPending = true
    checkResults.record({
      id,
      origin: 'tool',
      status: findings.length ? 'fail' : 'unverified',
      evidence,
      scope: [elementId],
      dependencies: { [id]: 'unavailable' }
    })
  }
  const updateMeasurementState = (
    elementId: string,
    receipt: AiBatchReceipt,
    actionId: string
  ) => {
    const matching = receipt.actionResults.filter(
      (entry) =>
        entry.actionId === actionId &&
        entry.actionName === AiActionNames.REVIEW_DESIGN
    )
    const result = matching.length === 1 ? matching[0].result : undefined
    const complete =
      !receipt.failure &&
      isRecord(result) &&
      result.available !== false &&
      result.complete === true &&
      result.truncated !== true &&
      Array.isArray(result.findings)
    const stamp =
      complete && isRecord(result)
        ? inspectionStamp(result.evidence)
        : undefined
    if (!complete || !stamp || !isRecord(result)) {
      markMeasurementUnavailable(
        elementId,
        isRecord(result) &&
          result.available !== false &&
          Array.isArray(result.findings)
          ? result.findings
          : []
      )
      return
    }
    const findings = result.findings as unknown[]
    measuredTargets.set(elementId, stamp)
    checkResults.record({
      id: measurementId(elementId),
      origin: 'tool',
      status: findings.length ? 'fail' : 'pass',
      evidence: JSON.stringify({ complete, findings }),
      scope: [elementId],
      dependencies: { [measurementId(elementId)]: JSON.stringify(stamp) }
    })
    measurementPending = false
  }
  const canInspect = registered.some(
    (action) => action.name === AiActionNames.INSPECT_DRAWING
  )
  let latestEvidenceValidation: unknown
  const validateEvidence = async (
    ids?: unknown,
    signal?: AbortSignal,
    requireCoverage = true
  ) => {
    latestEvidenceValidation = {
      current: false,
      reason: 'Inspection evidence is unavailable.'
    }
    signal?.throwIfAborted()
    const entries = designReview.evidenceEntries(ids)
    if (!entries.length) return false
    if (
      !registered.some(
        (action) => action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      )
    ) {
      const invalidInspectionIds = entries.map((entry) => entry.id)
      latestEvidenceValidation = {
        current: false,
        invalidInspectionIds,
        reason: 'Canonical evidence validation is unavailable.'
      }
      designReview.invalidateInspections(
        invalidInspectionIds,
        'Canonical evidence validation is unavailable.'
      )
      return false
    }
    const requiredIds = requireCoverage
      ? [...new Set([...reviewScope, ...designReview.factTargets()])]
      : []
    const groups = new Map<
      string,
      { actionId: string; source: InspectionEvidenceStamp; ids: string[] }
    >()
    const invalidIds: string[] = []
    for (const entry of entries) {
      if (!entry.source) {
        invalidIds.push(entry.id)
        continue
      }
      const key = JSON.stringify(entry.source)
      const group = groups.get(key) ?? {
        actionId: randomUUID(),
        source: entry.source,
        ids: []
      }
      group.ids.push(entry.id)
      groups.set(key, group)
    }
    const actions = [...groups.values()].map((group, index) => ({
      id: group.actionId,
      name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      arguments: {
        evidence: group.source,
        ...(index === 0 && requiredIds.length
          ? {
              scope: {
                requiredIds,
                overviewIds: designReview.overviewTargets(ids)
              }
            }
          : {})
      },
      summary: 'Checking inspection dependencies'
    }))
    const validations: unknown[] = []
    let validatedAt: { sessionId: string; revision: number } | undefined
    let coherent = true
    const unavailableIds: string[] = []
    const groupEntries = [...groups.values()]
    const batchSize = reviewVisualSchema.properties.inspectionIds.maxItems
    for (let offset = 0; offset < actions.length; offset += batchSize) {
      signal?.throwIfAborted()
      const batchActions = actions.slice(offset, offset + batchSize)
      const receipt = await executeBatch({
        batchId: randomUUID(),
        actions: batchActions
      })
      signal?.throwIfAborted()
      const exactBatch =
        !receipt.failure &&
        receipt.actionResults.length === batchActions.length &&
        receipt.actionResults.every((entry) =>
          batchActions.some((action) => action.id === entry.actionId)
        )
      for (const group of groupEntries.slice(offset, offset + batchSize)) {
        const matches = receipt.actionResults.filter(
          (entry) => entry.actionId === group.actionId
        )
        const result =
          exactBatch &&
          matches.length === 1 &&
          matches[0].actionName === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
            ? matches[0].result
            : undefined
        if (!isRecord(result) || typeof result.current !== 'boolean') {
          coherent = false
          unavailableIds.push(...group.ids)
        }
        const stamp =
          isRecord(result) && isRecord(result.validatedAt)
            ? result.validatedAt
            : undefined
        if (
          !stamp ||
          typeof stamp.sessionId !== 'string' ||
          !stamp.sessionId ||
          !Number.isSafeInteger(stamp.revision) ||
          Number(stamp.revision) < 0
        )
          coherent = false
        else {
          if (isRecord(result) && result.current === false)
            invalidIds.push(...group.ids)
          if (!validatedAt)
            validatedAt = {
              sessionId: stamp.sessionId,
              revision: Number(stamp.revision)
            }
          else if (
            validatedAt.sessionId !== stamp.sessionId ||
            validatedAt.revision !== stamp.revision
          )
            coherent = false
        }
        validations.push(result)
      }
      if (!coherent) {
        unavailableIds.push(
          ...groupEntries
            .slice(offset + batchSize)
            .flatMap((group) => group.ids)
        )
        break
      }
    }
    latestEvidenceValidation = {
      ...(isRecord(validations[0]) ? validations[0] : {}),
      current: invalidIds.length === 0 && coherent,
      coherent,
      invalidInspectionIds: invalidIds,
      unavailableInspectionIds: unavailableIds
    }
    if (invalidIds.length) {
      for (const id of invalidIds) inspectionImages.delete(id)
      designReview.invalidateInspections(
        invalidIds,
        'These inspection dependencies changed or could not be established.'
      )
      return false
    }
    if (!coherent) {
      designReview.requireReview(
        'Inspection validation crossed a document change or lacked the browser validation version. Retry validation; retained judgments were not cleared.'
      )
      return false
    }
    const validation = validations[0]
    if (
      requiredIds.length &&
      (!isRecord(validation) ||
        !isRecord(validation.coverage) ||
        validation.coverage.complete !== true)
    )
      throw new LocalOperationPreparationError(
        'Current overview images do not cover the requested drawing. Inspect the containing group or all remaining drawing roots; unrelated targets and detail crops cannot establish overall coverage.'
      )
    return true
  }
  const measure = async (elementId: string, signal?: AbortSignal) => {
    signal?.throwIfAborted()
    const actionId = randomUUID()
    try {
      const receipt = await executeBatch({
        batchId: randomUUID(),
        actions: [
          {
            id: actionId,
            name: AiActionNames.REVIEW_DESIGN,
            arguments: { elementId },
            summary: 'Checking the layout'
          }
        ]
      })
      signal?.throwIfAborted()
      updateMeasurementState(elementId, receipt, actionId)
      return { context: {}, actionResults: receipt.actionResults }
    } catch (error) {
      signal?.throwIfAborted()
      markMeasurementUnavailable(elementId)
      throw error
    }
  }

  const measurementCurrent = async (
    elementId: string,
    signal?: AbortSignal
  ) => {
    const markStale = () => {
      measuredTargets.set(elementId, undefined)
      checkResults.invalidate(
        [measurementId(elementId)],
        'Canonical measurement dependencies changed or are unavailable.'
      )
      return false
    }
    const stamp = measuredTargets.get(elementId)
    if (!stamp) return false
    if (
      !registered.some(
        (action) => action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      )
    )
      return markStale()
    signal?.throwIfAborted()
    const actionId = randomUUID()
    try {
      const receipt = await executeBatch({
        batchId: randomUUID(),
        actions: [
          {
            id: actionId,
            name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
            arguments: { evidence: stamp },
            summary: 'Checking layout evidence dependencies'
          }
        ]
      })
      signal?.throwIfAborted()
      const matches = receipt.actionResults.filter(
        (entry) =>
          entry.actionId === actionId &&
          entry.actionName === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      )
      const result = matches.length === 1 ? matches[0].result : undefined
      return !receipt.failure && isRecord(result) && result.current === true
        ? true
        : markStale()
    } catch {
      markStale()
      signal?.throwIfAborted()
      return false
    }
  }
  const checkMeasurements = async (
    targets: readonly string[],
    signal?: AbortSignal,
    compute = false
  ) => {
    if (!canReview) return
    let complete = targets.length > 0
    for (const target of new Set(targets)) {
      if (await measurementCurrent(target, signal)) continue
      if (compute) await measure(target, signal)
      if (!(await measurementCurrent(target, signal))) complete = false
    }
    measurementPending = !complete
  }

  const inspect = async (
    elementId: string,
    overview = false,
    region?: unknown,
    view?: unknown,
    signal?: AbortSignal
  ) => {
    options.onInspection?.('running')
    try {
      signal?.throwIfAborted()
      const receipt = await executeBatch({
        batchId: randomUUID(),
        actions: [
          {
            id: randomUUID(),
            name: AiActionNames.INSPECT_DRAWING,
            arguments: {
              elementId,
              ...(region ? { region } : {}),
              ...(view ? { view } : {})
            },
            summary: 'Reviewing the drawing'
          }
        ]
      })
      signal?.throwIfAborted()
      inspectionUnavailable = !receipt.actionResults.some(
        (entry) => isRecord(entry.result) && entry.result.available === true
      )
      for (const entry of receipt.actionResults) {
        if (isRecord(entry.result)) {
          const source = inspectionStamp(entry.result.evidence)
          const evidence = designReview.inspect(
            elementId,
            entry.actionName === AiActionNames.INSPECT_DRAWING &&
              entry.result.available === true &&
              isRecord(entry.result.image) &&
              typeof entry.result.image.dataUrl === 'string' &&
              entry.result.image.dataUrl.startsWith('data:image/png;base64,'),
            overview &&
              entry.result.partial !== true &&
              !region &&
              view !== 'detail' &&
              entry.result.imageScope !== 'detail' &&
              entry.result.imageScope !== 'region',
            region,
            !!region ||
              view === 'detail' ||
              (!overview && entry.result.imageScope !== 'overview'),
            source
          )
          if (evidence) {
            Object.assign(entry.result, evidence)
            const image = entry.result.image
            if (isRecord(image) && typeof image.dataUrl === 'string')
              inspectionImages.set(evidence.inspectionId, {
                role:
                  overview && !region && view !== 'detail'
                    ? 'overview'
                    : 'detail',
                dataUrl: image.dataUrl
              })
          }
        }
      }
      signal?.throwIfAborted()
      return receipt
    } finally {
      options.onInspection?.('completed')
    }
  }
  const finishInspection = async (
    targets: ReadonlySet<string>,
    captureTarget: string | undefined,
    deferCapture: boolean,
    signal: AbortSignal,
    settlementUnknown = false,
    fullResponse = false
  ) => {
    const actionResults: AiBatchReceipt['actionResults'][number][] = []
    const measurementIssues: {
      elementId?: string
      targetCount?: number
      message: string
      recovery: string
    }[] = []
    let unavailableReason: string | undefined
    if (settlementUnknown)
      unavailableReason =
        'Write settlement is unknown; reconcile acknowledged state before checking.'
    else if (!canReview)
      unavailableReason = 'Mechanical checking is not registered in this app.'
    if (unavailableReason && targets.size) {
      measurementIssues.push({
        ...(targets.size === 1 ? { elementId: [...targets][0] } : {}),
        targetCount: targets.size,
        message: unavailableReason,
        recovery: settlementUnknown
          ? 'Reconcile unknown write settlement before checking; do not replay writes.'
          : 'Restore review_design capability, then run review_design for affected targets. Do not replay writes.'
      })
    }
    for (const elementId of targets) {
      signal.throwIfAborted()
      if (unavailableReason) {
        markMeasurementUnavailable(elementId)
        continue
      }
      try {
        if (await measurementCurrent(elementId, signal)) continue
        const measurement = await measure(elementId, signal)
        if (!measuredTargets.get(elementId))
          measurementIssues.push({
            elementId,
            message:
              'Mechanical checking did not complete; inspect this target again.',
            recovery:
              'Run review_design for this target; do not replay acknowledged writes.'
          })
        else if (fullResponse) actionResults.push(...measurement.actionResults)
      } catch (error) {
        signal.throwIfAborted()
        // A follow-up failure never changes the acknowledged mutation receipt.
        markMeasurementUnavailable(elementId)
        measurementIssues.push({
          elementId,
          message:
            error instanceof Error
              ? error.message
              : 'Mechanical checking failed.',
          recovery: settlementUnknown
            ? 'Reconcile unknown write settlement before checking; do not replay writes.'
            : 'Run review_design for this target; do not replay acknowledged writes.'
        })
      }
    }
    if (targets.size) measurementPending = measurementIssues.length > 0
    const inspectionIssues: { elementId: string; message: string }[] = []
    if (
      !settlementUnknown &&
      !deferCapture &&
      captureTarget &&
      canInspect &&
      measurementIssues.length === 0 &&
      !checkResults.summary([...targets].map(measurementId)).firstPendingId
    ) {
      try {
        const image = await inspect(
          captureTarget,
          true,
          undefined,
          undefined,
          signal
        )
        if (
          !image.actionResults.some(
            (entry) =>
              entry.actionName === AiActionNames.INSPECT_DRAWING &&
              isRecord(entry.result) &&
              entry.result.available === true
          )
        )
          throw new Error(
            'Capture is unavailable; capture this target again without replaying its writes.'
          )
        actionResults.push(...image.actionResults)
      } catch (error) {
        signal.throwIfAborted()
        inspectionUnavailable = true
        inspectionIssues.push({
          elementId: captureTarget,
          message: error instanceof Error ? error.message : 'Capture failed.'
        })
      }
    }
    return {
      actionResults,
      inspectionDeferred: deferCapture,
      measurementDeferred: false,
      checks: checkResults.summary([...targets].map(measurementId)),
      ...(measurementIssues.length ? { measurementIssues } : {}),
      ...(inspectionIssues.length ? { inspectionIssues } : {})
    }
  }

  return {
    finishInspection,
    validateCompletion: async (signal?: AbortSignal): Promise<void> => {
      if (!designReview.isAccepted()) return
      try {
        const completionIds = [
          ...new Set([
            ...designReview.evidenceEntries().map((entry) => entry.id),
            ...designReview.reviewEvidenceIds()
          ])
        ]
        await checkMeasurements(
          designReview.overviewTargets(completionIds),
          signal
        )
        if (!(await validateEvidence(completionIds, signal)))
          designReview.requireReview(
            'Current inspection evidence is required before completion.'
          )
      } catch (error) {
        if (!(error instanceof LocalOperationPreparationError)) throw error
        designReview.invalidateWholeView(error.message)
      }
    },
    settleOutcome: (batch: AiActionBatch): AiActionBatch => {
      if (
        canInspect &&
        batch.actions.some(
          (action) =>
            registered.some((definition) => definition.name === action.name) &&
            requiresVisualReview(action.name)
        )
      )
        throw new Error(
          'Final response cannot contain unreviewed drawing operations'
        )
      const qualityIssue = canInspect ? designReview.getIssue() : undefined
      const pendingMeasurements = pendingMeasurementCount()
      if (
        !inspectionUnavailable &&
        !measurementPending &&
        pendingMeasurements === 0 &&
        !hasUnresolvedMutationScope() &&
        !qualityIssue
      )
        return batch
      let message = measurementPending
        ? 'The latest drawing still needs layout measurement.'
        : qualityIssue
      if (inspectionUnavailable)
        message = 'This app could not complete visual review of the drawing.'
      if (!measurementPending && pendingMeasurements > 0)
        message =
          'Some layout checks remain unresolved or stale. Review the pending target checks before completion.'
      if (hasUnresolvedMutationScope()) message = scopeRecovery
      const actions = [...batch.actions]
      if (
        !actions.some((action) =>
          [
            AiActionNames.REPORT_OUTCOME,
            AiActionNames.REQUEST_CLARIFICATION,
            AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE
          ].includes(action.name as never)
        )
      ) {
        actions.push({
          id: randomUUID(),
          name: AiActionNames.REPORT_OUTCOME,
          arguments: {
            outcome: 'unsupported',
            message: message ?? 'The requested result remains unverified.'
          },
          summary: 'Report the remaining work'
        })
      }
      return {
        ...batch,
        actions: actions.map((action) => {
          if (
            action.name !== AiActionNames.REPORT_OUTCOME ||
            !isRecord(action.arguments) ||
            action.arguments.outcome !== 'completed'
          )
            return action
          return {
            ...action,
            arguments: {
              outcome: 'unsupported',
              message
            }
          }
        })
      }
    },
    getStructureIssue: () => designReview.getStructureIssue(),
    actionNames: registered.map((action) => action.name),
    definitions: [
      ...(registered.length ? [checkResultsDefinition] : []),
      ...(preparedReview ? [preparedReviewDefinition] : []),
      ...(registered.length
        ? [
            {
              type: 'function',
              ...toolSemantics(
                {
                  anyOf: [
                    toolResultObject({ apis: { type: 'array' } }),
                    toolResultObject({ categories: { type: 'array' } })
                  ]
                },
                'read',
                ['tool-registry']
              ),
              name: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              executionAccess: LocalToolAccess.INDEPENDENT,
              description:
                'Discover missing contracts. Prefer operations=["owner.method", ...] for known semantic operations; operation accepts one. names accepts exact action names, unique semantic identities or native tools (namespace.name disambiguates). Use the returned action name and execution route. With no selector returns categories; category gives a paginated scoped menu (includeSchemas=true includes schemas), query does lexical search. Follow next.arguments while complete=false; exact selectors remain unpaged. Use only one selector. Known fields: request view=usage or schemaPaths; full is the default. Definitions are included once per request/revision/representation/field set; repeated reads return references. Use refresh=true only to restore missing context or failed delivery, including native Code Mode abbreviated fields. For missing fields use schemaPaths and refreshReason=missing-fields; refresh preserves that partial scope. Retain the parsed result in Code Mode and forward only needed fields, instead of printing every definition and re-fetching it. Full inputSchema and constraints remain available. Execute known contracts directly; no discovery prerequisite for every edit. Mutations accept new values and stable IDs. apis execute as batch items; tools use their native namespace. Missing or ambiguous entries preserve unique matches and never select a similar route.',
              inputSchema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  offset: {
                    type: 'integer',
                    minimum: 0,
                    description:
                      'Category/query continuation offset; use the returned next.arguments unchanged.'
                  },
                  view: {
                    type: 'string',
                    enum: ['usage', 'full'],
                    description:
                      'Exact names/operation only. usage returns purpose, execution route and root schema field paths without the full schema; full is the default.'
                  },
                  schemaPaths: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string', pattern: '^/' },
                    description:
                      'Exact names/operation only. JSON Pointers into inputSchema, e.g. /properties/items/items. Returns exact fragments and local reference dependencies, not a complete validation schema. Cannot combine with view; refresh preserves these exact paths.'
                  },
                  operation: {
                    type: 'string',
                    minLength: 1,
                    description:
                      'Exact semantic identity, for example fill.updateFillsAtIndex.'
                  },
                  operations: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string', minLength: 1 },
                    description:
                      'Exact semantic identities to resolve together, for example ["fill.updateFillsAtIndex", "hierarchy.moveElementsRelative"].'
                  },
                  category: {
                    type: 'string',
                    enum: categoryChoices,
                    minLength: 1,
                    description:
                      'Category from the compact index, for example fill or vector.'
                  },
                  includeSchemas: {
                    type: 'boolean',
                    description:
                      'Optional with category only. Include definitions not yet returned, otherwise references; refresh=true restores full definitions. Defaults to a compact menu.'
                  },
                  refresh: {
                    type: 'boolean',
                    description:
                      'Restore the selected full, usage or schemaPaths scope after context loss or failed delivery. Does not execute actions.'
                  },
                  refreshReason: {
                    type: 'string',
                    enum: [
                      'context-loss',
                      'delivery-failure',
                      'missing-fields'
                    ],
                    description:
                      'Declared recovery reason; requires refresh=true. Omission is recorded as unknown, not inferred.'
                  },
                  names: { type: 'array', items: { type: 'string' } },
                  query: {
                    type: 'string',
                    minLength: 1,
                    description:
                      'Lexical name or purpose terms, matched against current registered descriptors. Mutually exclusive with names.'
                  }
                }
              }
            }
          ]
        : []),
      ...(registered.length
        ? [
            {
              type: 'function',
              ...toolSemantics(
                toolResultObject(
                  {
                    actionResults: {
                      type: 'array',
                      items: toolResultObject({
                        actionId: toolResultString,
                        actionName: toolResultString,
                        result: true
                      })
                    },
                    batchSummary: toolResultObject({
                      actionCount: toolResultCount
                    }),
                    checks: designCheckSummarySchema
                  },
                  ['actionResults', 'batchSummary']
                ),
                'mutation',
                ['document']
              ),
              name: AiDesignToolIds.EXECUTE_DESIGN_BATCH,
              description:
                'Submit an ordered batch of registered edits or narrow reads in one canvas exchange. Use each named operation schema. For region edits, target={field:"elementIds",query:{scope:"region",bounds,filter?}} resolves every matching ID internally once before batch writes; use a plural API, without metadata reads or pagination. Unavailable/incomplete/empty matches make no writes. Queries select current identities; mutation admission still rechecks targets. target alternatively supplies artifactId with a targetSetId from retain_design_targets, exact keys or keyPrefix and field=elementId (apply to each identity) or elementIds (one plural operation); omitted keys selects the prepared set. The field is resolved at its unique registered schema path, including nested request arguments; ambiguous paths require explicit arguments. Omit target-supplied argument slots entirely, including empty arrays, null or placeholders. Multiple target bindings require plural elementIds; other scalar arguments use ordinary explicit values. References identify original creation members, not current Group children. Current canonical permission/existence checks still apply. All inputs are checked before dispatch. Existing Runtime transaction, Undo and failure semantics remain; inspect once after the stage, not after each item. Use inspection=defer only when another stage follows. Read operations should use fields=[] or specific fields, never reread the hierarchy to recover known IDs.',
              inputSchema: {
                type: 'object',
                additionalProperties: false,
                required: ['operations'],
                properties: {
                  operations: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['name', 'arguments'],
                      properties: {
                        name: {
                          type: 'string',
                          enum: registered
                            .filter(
                              (a) =>
                                ![
                                  AiActionNames.REVIEW_DESIGN,
                                  AiActionNames.INSPECT_DRAWING
                                ].includes(a.name as never)
                            )
                            .map((a) => a.name)
                        },
                        arguments: { type: 'object' },
                        target: {
                          anyOf: [
                            targetReferenceSchema,
                            {
                              type: 'array',
                              minItems: 1,
                              maxItems: 32,
                              items: targetReferenceSchema
                            }
                          ]
                        }
                      }
                    }
                  },
                  inspection: { enum: ['immediate', 'defer'] },
                  response: {
                    type: 'string',
                    enum: ['compact', 'full'],
                    default: 'compact',
                    description:
                      'Compact aggregates successful valueless basic mutation acknowledgements by action name. Query values, returned identities and uncertain outcomes remain complete. Use full for every individual acknowledgement.'
                  },
                  message: { type: 'string', minLength: 1, maxLength: 1000 }
                }
              }
            }
          ]
        : []),
      ...(canInspect ? designEvidenceDefinitions : []),
      ...registered
        .filter((action) =>
          getBasicApiContract(action.name) ||
          AiBatchOnlyActionNames.includes(action.name)
            ? 'outputSchema' in action && action.composition === 'allowed'
            : true
        )
        .map((action) => ({
          type: 'function',
          ...singleActionSemantics(action),
          ...(getBasicApiContract(action.name) ||
          AiBatchOnlyActionNames.includes(action.name)
            ? { providerExposure: 'registry' as const }
            : {}),
          name: action.name,
          description: action.description,
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['arguments'],
            properties: {
              arguments: action.inputSchema,
              inspection: {
                type: 'string',
                enum: ['immediate', 'defer'],
                description:
                  'Default immediate. Use defer only for intermediate mutations in an already planned stage: retain validation and receipts, defer only the image; mechanical checks run before this call returns. Inspect the completed stage before visual assessment or completion. Explicit inspection calls always capture.'
              },
              message: {
                type: 'string',
                minLength: 1,
                maxLength: 1000,
                description:
                  'Short activity label describing the actual visible change, e.g. Smoothing the outlines or Reshaping the tail. No tool names or generic Applying changes.'
              }
            }
          }
        }))
    ],
    resultIssue: (name: string, value: unknown): string | undefined => {
      if (!isRecord(value)) return 'Operation returned no result object'
      if (value.available === false) return
      if (name === AiDesignToolIds.REVIEW_PREPARED_DESIGN) {
        if (
          value.available !== true ||
          typeof value.artifactId !== 'string' ||
          typeof value.recipeRevision !== 'string' ||
          typeof value.evidenceRevision !== 'string' ||
          !['pass', 'fail', 'unverified'].includes(String(value.status)) ||
          value.appearance !== 'unverified' ||
          typeof value.evidenceCurrent !== 'boolean' ||
          !isRecord(value.assessment) ||
          !Array.isArray(value.assessment.checks)
        )
          return 'Prepared review omitted its bound evidence.'
        return
      }
      if (name === AiDesignToolIds.READ_DESIGN_CHECKS)
        return operationInputIssue(value, designCheckResultsSchema)
      if (name !== AiDesignToolIds.DESCRIBE_DESIGN_APIS) {
        if (name === AiDesignToolIds.DEFINE_DESIGN_CRITERIA)
          return value.phase === 'plan' &&
            value.recorded === true &&
            Array.isArray(value.criterionIds)
            ? undefined
            : 'Criteria omitted their recorded identities'
        if (name === AiDesignToolIds.RECORD_DESIGN_FACTS)
          return value.phase === 'facts' && Array.isArray(value.facts)
            ? undefined
            : 'Facts omitted their receipt'
        if (name === AiDesignToolIds.RECORD_DESIGN_CALCULATIONS)
          return Array.isArray(value.calculations)
            ? undefined
            : 'Calculations omitted their receipt'
        if (name === AiDesignToolIds.SELECT_DESIGN_REFERENCES)
          return Array.isArray(value.referenceImageIndexes) &&
            Array.isArray(value.referenceDecisions)
            ? undefined
            : 'Reference selection omitted its decisions'
        if (name === AiDesignToolIds.REVIEW_DRAWING)
          return ['structure', 'visual'].includes(String(value.phase)) &&
            typeof value.accepted === 'boolean' &&
            Array.isArray(value.inspectionIds)
            ? undefined
            : 'Review omitted its phase or evidence identities'
        if (!Array.isArray(value.actionResults))
          return 'Operation omitted acknowledged action receipts'
        for (const entry of value.actionResults) {
          if (
            !isRecord(entry) ||
            typeof entry.actionId !== 'string' ||
            typeof entry.actionName !== 'string' ||
            !Object.hasOwn(entry, 'result')
          )
            return 'Operation returned a malformed action receipt'
          if (
            entry.actionName === AiActionNames.APPLY_PREPARED_DESIGN &&
            isRecord(entry.result) &&
            entry.result.status !== 'failed' &&
            entry.result.available !== false &&
            (typeof entry.result.compositionId !== 'string' ||
              !entry.result.compositionId)
          )
            return 'Applied design omitted its composition identity'
        }
        if (name === AiDesignToolIds.EXECUTE_DESIGN_BATCH) {
          if (
            !isRecord(value.batchSummary) ||
            !Number.isSafeInteger(value.batchSummary.actionCount)
          )
            return 'Batch omitted its action summary'
          const counts = value.batchSummary.acknowledgedActions ?? []
          if (
            !Array.isArray(counts) ||
            counts.some(
              (item) =>
                !isRecord(item) ||
                typeof item.actionName !== 'string' ||
                !Number.isSafeInteger(item.count) ||
                Number(item.count) < 1
            )
          )
            return 'Batch returned malformed compact acknowledgements'
          const followupActionCount =
            value.batchSummary.followupActionCount ?? 0
          if (
            !Number.isSafeInteger(followupActionCount) ||
            Number(followupActionCount) < 0
          )
            return 'Batch returned an invalid follow-up count'
          const acknowledged = counts.reduce(
            (sum, item) => sum + Number(item.count),
            value.actionResults.length
          )
          if (
            !value.failure &&
            acknowledged !==
              Number(value.batchSummary.actionCount) +
                Number(followupActionCount)
          )
            return 'Batch acknowledgement count does not match executed actions'
        }
        return
      }
      if (!Array.isArray(value.apis) && !Array.isArray(value.categories))
        return 'API discovery omitted its menu or exact matches'
      if (value.complete !== undefined) {
        if (
          !Array.isArray(value.apis) ||
          typeof value.complete !== 'boolean' ||
          !Number.isSafeInteger(value.offset) ||
          Number(value.offset) < 0 ||
          !Number.isSafeInteger(value.count) ||
          Number(value.count) < 0 ||
          Number(value.offset) + value.apis.length > Number(value.count)
        )
          return 'API discovery returned an invalid page boundary'
        const end = Number(value.offset) + value.apis.length
        if (value.complete !== (end === value.count))
          return 'API discovery completion disagrees with its page boundary'
        if (
          !value.complete &&
          (!value.apis.length ||
            !isRecord(value.next) ||
            value.next.tool !== AiDesignToolIds.DESCRIBE_DESIGN_APIS ||
            !isRecord(value.next.arguments) ||
            value.next.arguments.offset !== end)
        )
          return 'API discovery omitted a usable continuation'
      }
    },
    resultOutcome: (name: string, value: unknown) =>
      localToolOutcome(
        name === AiDesignToolIds.DESCRIBE_DESIGN_APIS &&
          isRecord(value) &&
          typeof value.complete === 'boolean'
          ? { ...value, complete: true }
          : value
      ),
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal,
      inspectionTargets?: Set<string>
    ): Promise<string> => {
      if (signal.aborted) throw new Error('Backend operation cancelled')
      if (name === AiDesignToolIds.READ_DESIGN_CHECKS) {
        if (!registered.length)
          throw new LocalOperationPreparationError(
            'Check results are unavailable.'
          )
        const issue = operationInputIssue(
          args,
          checkResultsDefinition.inputSchema
        )
        if (issue) throw new LocalOperationPreparationError(issue)
        signal.throwIfAborted()
        const request = args as { ids?: string[]; includePassed?: boolean }
        const selected = request.ids
          ? checkResults.dependencyIds(request.ids)
          : undefined
        const selectedRecords = selected
          ? checkResults.read({ ids: selected, includePassed: true }).items
          : undefined
        const dependencies = selectedRecords
          ? new Set(
              selectedRecords.flatMap((result) =>
                Object.keys(result.dependencies)
              )
            )
          : undefined
        await preparedReview?.refresh(signal, dependencies)
        const targetIds = selected
          ? selected
              .filter((id) => id.startsWith('measurement:'))
              .map((id) => id.slice(12))
          : measuredTargets.keys()
        for (const target of targetIds) await measurementCurrent(target, signal)
        const ids = dependencies
          ? [...dependencies]
              .filter((key) => key.startsWith('inspection:'))
              .map((key) => key.slice(11))
          : designReview.reviewEvidenceIds()
        if (
          canInspect &&
          ids.length &&
          !(await validateEvidence(ids, signal, false)) &&
          isRecord(latestEvidenceValidation) &&
          latestEvidenceValidation.coherent === false
        )
          return JSON.stringify({
            ...checkResults.read(
              args as { includePassed?: boolean; ids?: string[] }
            ),
            status: 'partial',
            evidenceValidation: latestEvidenceValidation
          })
        return JSON.stringify(
          checkResults.read(args as { includePassed?: boolean; ids?: string[] })
        )
      }
      if (name === AiDesignToolIds.REVIEW_PREPARED_DESIGN) {
        if (!preparedReview)
          throw new LocalOperationPreparationError(
            'Prepared review is unavailable.'
          )
        return JSON.stringify(await preparedReview.review(args, signal))
      }
      if (name === AiDesignToolIds.DESCRIBE_DESIGN_APIS) {
        const selectors = [
          'names',
          'query',
          'operation',
          'operations',
          'category'
        ]
        if (
          !isRecord(args) ||
          Object.keys(args).some(
            (key) =>
              !selectors.includes(key) &&
              ![
                'includeSchemas',
                'refresh',
                'refreshReason',
                'view',
                'schemaPaths',
                'offset'
              ].includes(key)
          ) ||
          (args.offset !== undefined &&
            (!Number.isSafeInteger(args.offset) ||
              Number(args.offset) < 0 ||
              (args.category === undefined && args.query === undefined))) ||
          (args.refresh !== undefined && typeof args.refresh !== 'boolean') ||
          (args.view !== undefined &&
            (typeof args.view !== 'string' ||
              !['usage', 'full'].includes(args.view))) ||
          (args.schemaPaths !== undefined &&
            (!Array.isArray(args.schemaPaths) ||
              !args.schemaPaths.length ||
              args.schemaPaths.some(
                (path) => typeof path !== 'string' || !path.startsWith('/')
              ))) ||
          (args.view !== undefined && args.schemaPaths !== undefined) ||
          ((args.view !== undefined || args.schemaPaths !== undefined) &&
            args.names === undefined &&
            args.operation === undefined &&
            args.operations === undefined) ||
          (args.refreshReason !== undefined &&
            (args.refresh !== true ||
              typeof args.refreshReason !== 'string' ||
              !['context-loss', 'delivery-failure', 'missing-fields'].includes(
                args.refreshReason
              ))) ||
          (args.includeSchemas !== undefined &&
            (typeof args.includeSchemas !== 'boolean' ||
              args.category === undefined)) ||
          selectors.filter((key) => args[key] !== undefined).length > 1 ||
          ['query', 'operation', 'category'].some(
            (key) =>
              args[key] !== undefined &&
              (typeof args[key] !== 'string' || !String(args[key]).trim())
          ) ||
          (args.names !== undefined &&
            (!Array.isArray(args.names) ||
              args.names.some((v) => typeof v !== 'string'))) ||
          (args.operations !== undefined &&
            (!Array.isArray(args.operations) ||
              !args.operations.length ||
              args.operations.some((v) => typeof v !== 'string' || !v.trim())))
        )
          throw new LocalOperationPreparationError(
            'Provide one selector: operations, operation, category, names or query; omit selectors for categories. includeSchemas requires category. view (usage/full) or nonempty schemaPaths requires exact names/operations. Partial views cannot combine with each other. refreshReason requires refresh=true and must be context-loss, delivery-failure or missing-fields.'
          )
        const apis = registered
        const details = (api: (typeof apis)[number], includeSchema = true) => {
          const contract = getBasicApiContract(api.name)
          const dependencies = nativeInventory().filter(
            (tool) =>
              tool.name === api.name &&
              tool.composition === 'allowed' &&
              tool.registeredName
          )
          const dependency =
            dependencies.length === 1 ? dependencies[0] : undefined
          const recipeDependency = dependency
            ? {
                name: dependency.registeredName,
                revision: dependency.revision,
                definition: {
                  tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                  arguments: { names: [dependency.registeredName] }
                }
              }
            : undefined
          const descriptor = {
            ...api,
            execution: {
              kind: 'batch-action',
              tool: AiDesignToolIds.EXECUTE_DESIGN_BATCH
            },
            ...(recipeDependency ? { recipeDependency } : {}),
            operation: contract ? contract.operation : api.name,
            category: contract ? contract.category : 'design',
            ...(contract
              ? { effect: contract.effect, result: contract.result }
              : {})
          }
          const { inputSchema: _schema, ...menu } = descriptor
          if (!includeSchema) return menu
          return deliverDefinition(
            api.name,
            descriptor,
            {
              name: api.name,
              execution: descriptor.execution,
              operation: descriptor.operation,
              category: descriptor.category,
              ...(recipeDependency ? { recipeDependency } : {})
            },
            args
          )
        }
        const candidatesFor = (missing: string[]) => {
          const terms = missing
            .join(' ')
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter(Boolean)
          return apis
            .map((api) => {
              const operation =
                getBasicApiContract(api.name)?.operation ?? api.name
              const text = `${operation} ${api.name}`.toLowerCase()
              return {
                api,
                operation,
                score: terms.filter((term) => text.includes(term)).length
              }
            })
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map(({ api, operation }) => ({
              name: api.name,
              operation,
              execution: {
                kind: 'batch-action',
                tool: AiDesignToolIds.EXECUTE_DESIGN_BATCH
              }
            }))
        }
        const pageOf = (entries: typeof apis, includeSchema: boolean) => {
          const offset = Number(args.offset ?? 0)
          if (offset > entries.length)
            throw new LocalOperationPreparationError(
              'Discovery offset is beyond the current result; restart this selector at offset 0.'
            )
          const selected = entries.slice(offset, offset + definitionPageSize)
          const end = offset + selected.length
          const continuation: Record<string, unknown> = { ...args, offset: end }
          if (continuation.includeSchemas === false)
            delete continuation.includeSchemas
          return {
            complete: end === entries.length,
            count: entries.length,
            offset,
            apis: selected.map((api) => details(api, includeSchema)),
            ...(end < entries.length
              ? {
                  next: {
                    tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                    arguments: continuation
                  }
                }
              : {})
          }
        }
        if (Array.isArray(args.names)) {
          const names = [...new Set(args.names as string[])]
          const matches = names.map((name) => ({
            name,
            apis: [
              ...new Set(
                [
                  admittedApisByName.get(name),
                  admittedApisByOperation.get(name)
                ].filter((api) => api !== undefined)
              )
            ],
            tools: [...new Set(nativeMatches(name))]
          }))
          // A registered action and its native wrapper have explicit execution
          // routes and may both be returned. Multiple native namespaces require
          // qualification; never silently pick one.
          const unique = matches.filter(
            (match) => match.apis.length <= 1 && match.tools.length <= 1
          )
          const ambiguousNames = matches
            .filter((match) => match.apis.length > 1 || match.tools.length > 1)
            .map((match) => ({
              name: match.name,
              candidates: [
                ...match.apis.map((api) => api.name),
                ...match.tools.map((tool) => `${tool.namespace}.${tool.name}`)
              ]
            }))
          const selected = [...new Set(unique.flatMap((match) => match.apis))]
          const tools = [...new Set(unique.flatMap((match) => match.tools))]
          const missingNames = matches
            .filter((match) => !match.apis.length && !match.tools.length)
            .map((match) => match.name)
          return JSON.stringify({
            apis: selected.map((api) => details(api)),
            tools: tools.map((tool) => {
              const identity = `${tool.namespace}.${tool.name}`
              return {
                ...deliverDefinition(
                  identity,
                  { ...tool },
                  {
                    name: tool.name,
                    namespace: tool.namespace,
                    registeredName: tool.registeredName,
                    revision: tool.revision
                  },
                  args
                ),
                schemaSource: 'registered-tool-contract',
                execution: tool.execution ?? {
                  kind: 'native-tool',
                  namespace: tool.namespace,
                  tool: tool.name
                }
              }
            }),
            missingNames,
            ...(ambiguousNames.length ? { ambiguousNames } : {}),
            ...(missingNames.length
              ? {
                  message: lookupRecovery,
                  candidates: candidatesFor(missingNames)
                }
              : {})
          })
        }
        if (Array.isArray(args.operations)) {
          const identities = [...new Set(args.operations as string[])]
          const selected = identities.flatMap((identity) => {
            const api = admittedApisByOperation.get(identity)
            return api ? [api] : []
          })
          const missingOperations = identities.filter(
            (identity) => !admittedApisByOperation.has(identity)
          )
          return JSON.stringify({
            apis: selected.map((api) => details(api)),
            missingOperations,
            ...(missingOperations.length
              ? {
                  message: lookupRecovery,
                  candidates: candidatesFor(missingOperations)
                }
              : {})
          })
        }
        if (typeof args.operation === 'string') {
          const api = admittedApisByOperation.get(args.operation)
          if (!api)
            return JSON.stringify({
              apis: [],
              missingOperations: [args.operation],
              candidates: candidatesFor([args.operation]),
              message: lookupRecovery
            })
          return JSON.stringify({ apis: [details(api)] })
        }
        const categories = [...admittedApiCategories].map(
          ([category, entries]) => ({ category, count: entries.length })
        )
        if (options.getNativeTools)
          categories.push({
            category: nativeCategory,
            count: nativeInventory().length
          })
        if (args.category !== undefined) {
          if (args.category === nativeCategory && options.getNativeTools) {
            const inventory = nativeInventory()
            const offset = typeof args.offset === 'number' ? args.offset : 0
            const end = Math.min(offset + definitionPageSize, inventory.length)
            const tools = inventory.slice(offset, end).map((tool) => {
              const reference = {
                name: tool.name,
                namespace: tool.namespace,
                registeredName: tool.registeredName,
                revision: tool.revision
              }
              return {
                ...(args.includeSchemas === true || args.refresh === true
                  ? deliverDefinition(
                      `${tool.namespace}.${tool.name}`,
                      { ...tool },
                      reference,
                      args
                    )
                  : {
                      ...reference,
                      description: tool.description,
                      effect: tool.effect,
                      composition: tool.composition
                    }),
                execution: nativeExecution(tool)
              }
            })
            return JSON.stringify({
              category: nativeCategory,
              apis: [],
              tools,
              total: inventory.length,
              offset,
              complete: end >= inventory.length,
              ...(end < inventory.length
                ? {
                    next: {
                      tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                      arguments: { ...args, offset: end }
                    }
                  }
                : {})
            })
          }
          const entries = admittedApiCategories.get(String(args.category))
          if (!entries)
            throw new LocalOperationPreparationError(
              `Unknown category. ${lookupRecovery}`
            )
          return JSON.stringify({
            category: args.category,
            ...pageOf(
              entries,
              args.includeSchemas === true || args.refresh === true
            )
          })
        }
        if (args.query === undefined)
          return JSON.stringify({ categories, catalogSize: apis.length })
        const normalize = (value: string) =>
          value
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .normalize('NFKC')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .trim()
        const terms = normalize(String(args.query)).split(' ').filter(Boolean)
        const matches = apis.filter((api) => {
          const descriptor = normalize(`${api.name} ${api.description}`)
          return terms.every((term) => descriptor.includes(term))
        })
        return JSON.stringify({
          catalogSize: apis.length,
          ...(matches.length
            ? {}
            : {
                message:
                  'No lexical match; this is not evidence of an unavailable capability. Select an operation from its category.',
                categories,
                recovery: {
                  tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                  arguments: {}
                }
              }),
          ...pageOf(matches, false)
        })
      }
      const evidenceDefinition =
        canInspect &&
        designEvidenceDefinitions.find((tool) => tool.name === name)
      if (evidenceDefinition) {
        const issue = operationInputIssue(args, evidenceDefinition.inputSchema)
        if (issue) throw new LocalOperationPreparationError(issue)
        if (name === AiDesignToolIds.RECORD_DESIGN_CALCULATIONS) {
          try {
            return JSON.stringify(designReview.recordCalculations(args))
          } catch (error) {
            throw new LocalOperationPreparationError(
              error instanceof Error
                ? error.message
                : 'Invalid calculation evidence'
            )
          }
        }
        const reviewArgs = {
          ...designEvidenceInput(name, args as Record<string, unknown>)
        }
        const candidate =
          isRecord(reviewArgs) &&
          (reviewArgs.phase === 'structure' || reviewArgs.phase === 'visual')
        const recordReview = () => {
          try {
            if (name === AiDesignToolIds.SELECT_DESIGN_REFERENCES)
              return designReview.selectReferences(
                reviewArgs.referenceImageIndexes,
                {
                  ...(reviewArgs.referenceDecisions !== undefined
                    ? { referenceDecisions: reviewArgs.referenceDecisions }
                    : {}),
                  ...(reviewArgs.requirementRevision !== undefined
                    ? { requirementRevision: reviewArgs.requirementRevision }
                    : {})
                }
              )
            const result = designReview.record(reviewArgs)
            if (Array.isArray(result.checks))
              result.checks = result.checks.filter(
                (check) => !isRecord(check) || check.status !== 'pass'
              )
            return result
          } catch (error) {
            throw new LocalOperationPreparationError(
              error instanceof Error ? error.message : 'Invalid review evidence'
            )
          }
        }
        if (!candidate) return JSON.stringify(recordReview())
        const targets = reviewArgs.inspections as
          | {
              elementId: string
              view?: 'overview' | 'detail'
              region?: unknown
            }[]
          | undefined
        const inspectionIds = [
          ...((reviewArgs.inspectionIds as string[] | undefined) ?? [])
        ]
        if (inspectionIds.length + (targets?.length ?? 0) > 24)
          throw new LocalOperationPreparationError(
            'Review accepts at most 24 reusable IDs and capture targets combined.'
          )
        if (inspectionIds.length && !designReview.evidenceFor(inspectionIds)) {
          const message =
            'Reusable inspection IDs do not identify available evidence in this runtime. Capture current evidence before review; no new captures or assessment ran.'
          designReview.requireReview(message)
          return JSON.stringify({
            status: 'partial',
            phase: reviewArgs.phase,
            accepted: false,
            readyForDetail: false,
            inspectionIds,
            evidenceValidation: {
              current: false,
              invalidInspectionIds: designReview
                .evidenceEntries(inspectionIds)
                .filter((entry) => !entry.source)
                .map((entry) => entry.id)
            },
            message
          })
        }
        delete reviewArgs.inspections
        const capturedResults: AiBatchReceipt['actionResults'][number][] = []
        const failedInspections: {
          inspection: NonNullable<typeof targets>[number]
          message: string
        }[] = []
        for (const target of targets ?? []) {
          signal.throwIfAborted()
          const view = target.region ? 'detail' : (target.view ?? 'overview')
          let receipt: AiBatchReceipt
          try {
            receipt = await inspect(
              target.elementId,
              view === 'overview',
              target.region,
              view,
              signal
            )
          } catch (error) {
            signal.throwIfAborted()
            failedInspections.push({
              inspection: target,
              message:
                error instanceof Error
                  ? error.message
                  : 'Capture failed without usable evidence.'
            })
            continue
          }
          capturedResults.push(...receipt.actionResults)
          const result = receipt.actionResults.find(
            (entry) => entry.actionName === AiActionNames.INSPECT_DRAWING
          )?.result
          const id =
            isRecord(result) &&
            result.available === true &&
            typeof result.inspectionId === 'string'
              ? result.inspectionId
              : undefined
          if (
            id &&
            designReview.evidenceFor([id]) &&
            inspectionImages.has(id)
          ) {
            if (!inspectionIds.includes(id)) inspectionIds.push(id)
          } else {
            failedInspections.push({
              inspection: target,
              message:
                isRecord(result) && typeof result.message === 'string'
                  ? result.message
                  : 'Capture did not return a usable image with document evidence. Inspect this target again.'
            })
          }
        }
        reviewArgs.inspectionIds = inspectionIds
        if (failedInspections.length) {
          const message =
            'Required captures are unavailable. Retry corrected failedInspections targets as inspections; include inspectionIds only when the returned list is nonempty. Assessment has not run.'
          designReview.requireReview(message)
          return JSON.stringify({
            available: false,
            status: 'partial',
            phase: reviewArgs.phase,
            accepted: false,
            readyForDetail: false,
            inspectionIds,
            failedInspections,
            actionResults: capturedResults,
            message
          })
        }
        const unavailableEvidence = () => {
          const message =
            'Validation is incomplete; prior findings remain retained. Retry validation with the same IDs when coherent=false or evidence is unavailable. Reacquire only IDs explicitly reported as invalid, then submit the affected judgments.'
          designReview.requireReview(message)
          return {
            status: 'partial',
            phase: reviewArgs.phase,
            accepted: false,
            readyForDetail: false,
            inspectionIds,
            evidenceValidation: latestEvidenceValidation,
            message
          }
        }
        if (targets?.length) {
          if (!(await validateEvidence(inspectionIds, signal, false)))
            return JSON.stringify({
              ...unavailableEvidence(),
              actionResults: capturedResults
            })
          return JSON.stringify({
            phase: reviewArgs.phase,
            accepted: false,
            readyForDetail: false,
            inspectionIds,
            actionResults: capturedResults,
            message:
              'Inspect the returned images, then submit primary-agent findings with these inspectionIds and no new capture targets. Supplied judgments were not recorded before the images were delivered.'
          })
        }
        let candidateReview
        try {
          candidateReview = designReview.validateReview(reviewArgs)
        } catch (error) {
          throw new LocalOperationPreparationError(
            error instanceof Error ? error.message : 'Invalid review evidence'
          )
        }
        const effectiveIds = [
          ...new Set([
            ...(Array.isArray(candidateReview.inspectionIds)
              ? (candidateReview.inspectionIds as string[])
              : []),
            ...inspectionIds
          ])
        ]
        const requireCoverage =
          reviewArgs.phase === 'structure' ||
          candidateReview.readyForCompletion === true
        let coverageIssue: string | undefined
        let current = false
        try {
          current = await validateEvidence(
            effectiveIds,
            signal,
            requireCoverage
          )
        } catch (error) {
          if (!(error instanceof LocalOperationPreparationError)) throw error
          coverageIssue = error.message
        }
        const submittedChanged = () =>
          isRecord(latestEvidenceValidation) &&
          Array.isArray(latestEvidenceValidation.invalidInspectionIds) &&
          latestEvidenceValidation.invalidInspectionIds.some((id) =>
            inspectionIds.includes(String(id))
          )
        if (
          submittedChanged() ||
          (isRecord(latestEvidenceValidation) &&
            latestEvidenceValidation.coherent === false)
        )
          return JSON.stringify(unavailableEvidence())
        let pendingMeasurement = false
        if (
          current &&
          canReview &&
          candidateReview.readyForCompletion === true
        ) {
          await checkMeasurements(
            designReview.overviewTargets(effectiveIds),
            signal,
            true
          )
          pendingMeasurement = measurementPending
          // Measurement can yield to external edits; never commit a mixed-source judgment.
          await validateEvidence(effectiveIds, signal, false)
          if (
            submittedChanged() ||
            (isRecord(latestEvidenceValidation) &&
              latestEvidenceValidation.coherent === false)
          )
            return JSON.stringify(unavailableEvidence())
        }
        signal.throwIfAborted()
        const result = recordReview()
        if (coverageIssue) {
          designReview.invalidateWholeView(coverageIssue)
          return JSON.stringify({
            ...result,
            accepted: false,
            readyForDetail: false,
            status: 'partial',
            results: designReview.readChecks(),
            coverage: designReview.coverage(),
            evidenceValidation: latestEvidenceValidation,
            message: coverageIssue
          })
        }
        if (pendingMeasurement) {
          const message = 'The latest drawing still needs layout measurement.'
          designReview.requireReview(message)
          return JSON.stringify({
            ...result,
            accepted: false,
            status: 'partial',
            message
          })
        }
        return JSON.stringify(result)
      }
      const batchMode = name === AiDesignToolIds.EXECUTE_DESIGN_BATCH
      const definition = registered.find((action) => action.name === name)
      if (
        signal.aborted ||
        (!batchMode && !definition) ||
        !isRecord(args) ||
        (!batchMode && !isRecord(args.arguments)) ||
        (args.message !== undefined &&
          (typeof args.message !== 'string' ||
            !args.message.trim() ||
            args.message.length > 1000)) ||
        (batchMode &&
          args.response !== undefined &&
          args.response !== 'compact' &&
          args.response !== 'full') ||
        (args.inspection !== undefined &&
          args.inspection !== 'immediate' &&
          args.inspection !== 'defer') ||
        Object.keys(args).some(
          (key) =>
            !(
              batchMode
                ? ['operations', 'message', 'inspection', 'response']
                : ['arguments', 'message', 'inspection']
            ).includes(key)
        )
      )
        throw new Error('Invalid backend operation')
      let batchActions: AiActionBatch['actions']
      try {
        batchActions = batchMode
          ? await resolveQueryTargets(args.operations, signal)
          : prepareOperationBatch(
              [{ name, arguments: args.arguments }],
              registered,
              preparation.resolveTargets
            )
      } catch (error) {
        throw new LocalOperationPreparationError(
          error instanceof Error ? error.message : 'Invalid operation batch'
        )
      }
      const serializeReceipt = <T extends AiBatchReceipt>(value: T) => {
        if (!batchMode) return JSON.stringify(value)
        const { context: _context, ...result } = value
        const submittedIds = new Set(batchActions.map((action) => action.id))
        const followupActionCount = result.actionResults.filter(
          (entry) => !submittedIds.has(entry.actionId)
        ).length
        const acknowledged = new Map<string, number>()
        const projectedResults =
          args.response === 'full'
            ? result.actionResults
            : result.actionResults.map((entry) => ({
                ...entry,
                result: compactStructuralResult(entry.actionName, entry.result)
              }))
        const actionResults = projectedResults.filter((entry) => {
          if (args.response === 'full') return true
          const contract = getBasicApiContract(entry.actionName)
          const item = entry.result
          if (
            !contract ||
            !['write', 'delete'].includes(contract.effect) ||
            !isRecord(item) ||
            item.status !== 'complete' ||
            item.value !== null ||
            (isRecord(item.mutationScope) &&
              item.mutationScope.complete !== true) ||
            (item.application !== undefined &&
              item.application !== 'not-reported') ||
            Object.keys(item).some(
              (key) =>
                !['status', 'value', 'application', 'mutationScope'].includes(
                  key
                )
            )
          )
            return true
          acknowledged.set(
            entry.actionName,
            (acknowledged.get(entry.actionName) ?? 0) + 1
          )
          return false
        })
        return JSON.stringify({
          ...result,
          actionResults,
          batchSummary: {
            operationCount: (args.operations as unknown[]).length,
            actionCount: batchActions.length,
            ...(followupActionCount ? { followupActionCount } : {}),
            ...(acknowledged.size
              ? {
                  acknowledgedActions: [...acknowledged].map(
                    ([actionName, count]) => ({
                      actionName,
                      count,
                      application: 'not-reported'
                    })
                  )
                }
              : {})
          }
        })
      }
      const operationArguments = isRecord(args.arguments) ? args.arguments : {}
      if (name === AiActionNames.INSPECT_DRAWING) {
        if (typeof operationArguments.elementId !== 'string')
          throw new Error('Missing inspection target')
        const view = operationArguments.region
          ? 'detail'
          : (operationArguments.view ?? 'overview')
        return JSON.stringify(
          await inspect(
            operationArguments.elementId,
            view === 'overview',
            operationArguments.region,
            view,
            signal
          )
        )
      }

      const message =
        typeof args.message === 'string' ? args.message : 'Updating the drawing'
      const affectsDrawingReview = batchActions.some(
        (action) =>
          requiresVisualReview(action.name) ||
          action.name === AiActionNames.ORGANIZE_DESIGN
      )
      if (affectsDrawingReview && hasUnresolvedMutationScope())
        return localToolFailureReply(
          scopeRecovery,
          'MUTATION_SCOPE_UNAVAILABLE',
          {
            stage: 'admission',
            settlement: 'not-started',
            recoverable: false
          }
        ).text
      let prepared: AiActionBatch
      try {
        prepared = resolvePreparedBatch({
          batchId: randomUUID(),
          explanation: message,
          actions: batchActions.map((action) => ({
            ...action,
            summary: message
          }))
        }) as unknown as AiActionBatch
      } catch (error) {
        signal.throwIfAborted()
        throw new LocalOperationPreparationError(
          error instanceof Error ? error.message : undefined
        )
      }
      let receipt: AiBatchReceipt
      let executionFailure: BrowserBatchExecutionError | undefined
      try {
        receipt = await executeBatch(prepared)
      } catch (error) {
        signal.throwIfAborted()
        if (
          name === AiActionNames.REVIEW_DESIGN &&
          typeof operationArguments.elementId === 'string'
        )
          markMeasurementUnavailable(operationArguments.elementId)
        if (
          affectsDrawingReview &&
          (!(error instanceof BrowserBatchExecutionError) || !error.receipt)
        ) {
          unknownScope(prepared.actions[0].id)
          designReview.mutate()
          measurementPending = true
          return localToolFailureReply(
            localToolErrorMessage(error),
            'MUTATION_SCOPE_UNAVAILABLE',
            {
              stage: 'execution',
              settlement: 'unknown',
              recoverable: false,
              recovery: scopeRecovery,
              checks: checkResults.summary([mutationScopeId])
            }
          ).text
        }
        if (
          !affectsDrawingReview ||
          !(error instanceof BrowserBatchExecutionError) ||
          !error.receipt
        )
          throw error
        executionFailure = error
        receipt = error.receipt
      }
      const deliverReceipt = <T extends AiBatchReceipt>(value: T) => {
        if (hasUnresolvedMutationScope())
          value = {
            ...value,
            checks: checkResults.summary([
              ...[...changedTargets].map(measurementId),
              mutationScopeId
            ]),
            measurementIssues: [
              ...('measurementIssues' in value &&
              Array.isArray(value.measurementIssues)
                ? value.measurementIssues
                : []),
              {
                message:
                  'Mutation target coverage is unavailable for this request.',
                recovery: scopeRecovery
              }
            ]
          }
        if (executionFailure)
          return localToolFailureReply(
            localToolErrorMessage(executionFailure),
            value.failure?.code ?? executionFailure.failure.code,
            {
              stage: value.failure?.stage ?? 'execution',
              settlement: value.failure?.settlement ?? 'unknown',
              recovery:
                'Inspect the retained write receipt and check diagnostics before continuing; do not replay acknowledged mutations.',
              batchFailure: executionFailure.failure,
              executionResult: JSON.parse(
                serializeToolPayload(value).serialized
              )
            }
          ).text
        return serializeReceipt(value)
      }
      const changedTargets = new Set<string>()
      let removedTargets = false
      const retireTarget = (id: string) => {
        removedTargets = true
        reviewScope.delete(id)
        changedTargets.delete(id)
        inspectionTargets?.delete(id)
        measuredTargets.delete(id)
        checkResults.retire(
          measurementId(id),
          'The measured target was removed.'
        )
        if (!measuredTargets.size) measurementPending = false
      }
      signal.throwIfAborted()
      if (
        name === AiActionNames.REVIEW_DESIGN &&
        typeof operationArguments.elementId === 'string'
      ) {
        updateMeasurementState(
          operationArguments.elementId,
          receipt,
          prepared.actions[0].id
        )
      }
      if (signal.aborted) throw new Error('Backend operation cancelled')
      if (affectsDrawingReview) {
        const acknowledgements = new Map<
          string,
          AiBatchReceipt['actionResults'][number][]
        >()
        for (const entry of receipt.actionResults) {
          const entries = acknowledgements.get(entry.actionId) ?? []
          entries.push(entry)
          acknowledgements.set(entry.actionId, entries)
        }
        for (const submitted of prepared.actions) {
          const contract = getBasicApiContract(submitted.name)
          if (contract && !['write', 'delete'].includes(contract.effect))
            continue
          if (
            !contract &&
            !requiresVisualReview(submitted.name) &&
            submitted.name !== AiActionNames.ORGANIZE_DESIGN
          )
            continue
          const matches = acknowledgements.get(submitted.id) ?? []
          if (
            matches.length !== 1 ||
            matches[0].actionName !== submitted.name ||
            !isRecord(matches[0].result)
          ) {
            unknownScope(submitted.id)
            continue
          }
          const entry = matches[0]
          const receiptResult = entry.result as Record<string, unknown>
          if (contract || Object.hasOwn(receiptResult, 'mutationScope')) {
            const scope = receiptResult.mutationScope
            const validIds = (value: unknown): value is string[] =>
              Array.isArray(value) &&
              value.every((id) => typeof id === 'string' && id.length > 0)
            if (
              !isRecord(scope) ||
              !validIds(scope.elementIds) ||
              !validIds(scope.removedElementIds) ||
              typeof scope.complete !== 'boolean'
            ) {
              unknownScope(submitted.id)
              continue
            }
            const removed = new Set(scope.removedElementIds)
            if (scope.elementIds.some((id) => removed.has(id))) {
              unknownScope(submitted.id)
              continue
            }
            if (!scope.complete) unknownScope(submitted.id)
            for (const id of scope.removedElementIds) retireTarget(id)
            for (const id of scope.elementIds) {
              reviewScope.add(id)
              changedTargets.add(id)
              reviewTargetId ??= id
            }
            if (
              contract?.method === 'groupElements' &&
              isRecord(receiptResult.value)
            ) {
              const group = receiptResult.value
              if (
                typeof group.groupId === 'string' &&
                scope.elementIds.includes(group.groupId) &&
                Array.isArray(group.elementIds) &&
                (!reviewTargetId || group.elementIds.includes(reviewTargetId))
              )
                reviewTargetId = group.groupId
            }
            continue
          }
          const submittedArguments = isRecord(submitted.arguments)
            ? submitted.arguments
            : {}
          const result = receiptResult
          if (result.status === 'no-change' || result.changed === false)
            continue
          let removed: unknown
          if (entry.actionName === AiActionNames.REMOVE_AI_COMPOSITION)
            removed = result.appliedElementIds
          if (Array.isArray(removed)) {
            for (const item of removed) {
              const id = isRecord(item) ? item.elementId : item
              if (typeof id === 'string') retireTarget(id)
            }
          }
          if (
            entry.actionName === AiActionNames.REPLACE_VECTOR_COMPOSITION &&
            result.status === 'complete' &&
            typeof submittedArguments.compositionId === 'string'
          )
            retireTarget(submittedArguments.compositionId)
          const group = result.operation === 'group'
          const ungroup = result.operation === 'ungroup'
          if (
            typeof result.groupId === 'string' &&
            Array.isArray(result.elementIds)
          ) {
            const members = result.elementIds.filter(
              (id): id is string => typeof id === 'string'
            )
            if (group) {
              members.forEach((id) => reviewScope.delete(id))
              reviewScope.add(result.groupId)
              changedTargets.add(result.groupId)
              if (!reviewTargetId || members.includes(reviewTargetId))
                reviewTargetId = result.groupId
            } else if (ungroup && result.removed === true) {
              retireTarget(result.groupId)
              members.forEach((id) => {
                reviewScope.add(id)
                changedTargets.add(id)
              })
              if (!reviewTargetId || reviewTargetId === result.groupId)
                reviewTargetId = [...reviewScope][0]
            }
          }
          if (typeof result.compositionId === 'string') {
            reviewScope.add(result.compositionId)
            changedTargets.add(result.compositionId)
            if (
              !reviewTargetId ||
              entry.actionName !== AiActionNames.UPDATE_DESIGN_ELEMENT
            )
              reviewTargetId = result.compositionId
          } else if (typeof result.elementId === 'string') {
            reviewScope.add(result.elementId)
            changedTargets.add(result.elementId)
            reviewTargetId ??= result.elementId
          } else if (
            entry.actionName !== AiActionNames.REMOVE_AI_COMPOSITION &&
            Array.isArray(result.appliedElementIds)
          ) {
            for (const id of result.appliedElementIds)
              if (typeof id === 'string' && id) {
                reviewScope.add(id)
                changedTargets.add(id)
                reviewTargetId ??= id
              }
          } else if (
            result.operation === 'reorder' &&
            Array.isArray(result.moves)
          ) {
            for (const move of result.moves)
              if (isRecord(move) && typeof move.elementId === 'string') {
                reviewScope.add(move.elementId)
                changedTargets.add(move.elementId)
                reviewTargetId ??= move.elementId
              }
          }
        }
        if (reviewTargetId && !reviewScope.has(reviewTargetId))
          reviewTargetId = [...reviewScope][0]
        if (
          changedTargets.size ||
          removedTargets ||
          hasUnresolvedMutationScope()
        ) {
          designReview.mutate()
          if (changedTargets.size) measurementPending = canReview
        }
        if (inspectionTargets) {
          for (const target of changedTargets) inspectionTargets.add(target)
          return deliverReceipt({
            ...receipt,
            inspectionDeferred: true,
            measurementDeferred: true
          })
        }
        if (changedTargets.size) {
          const followup = await finishInspection(
            changedTargets,
            reviewTargetId,
            args.inspection === 'defer',
            signal,
            (executionFailure
              ? (receipt.failure?.settlement ?? 'unknown')
              : localToolOutcome(receipt).settlement) === 'unknown',
            args.response === 'full' || operationArguments.response === 'full'
          )
          return deliverReceipt({
            ...receipt,
            ...followup,
            actionResults: [...receipt.actionResults, ...followup.actionResults]
          })
        }
      }
      return deliverReceipt(receipt)
    }
  }
}

// This recipe is tested against native Code Mode's actual dynamic-tool adapter.
export const localToolResultExample = `const [receipt, ...images] = result.split("\\n");
text(JSON.parse(receipt));
for (const uri of images) image(uri);`

export const localToolResultInstructions = `App tool results in Code Mode are STRINGS, not MCP objects with a content array.
The first line is JSON; any following lines are image data URLs. After const result = await tools.<discovered_tool>(input), forward the result in that SAME exec:
${localToolResultExample}
Do not print the whole string: that prints base64 instead of showing images. Retain result with store if needed; redisplay that retained result with this recipe instead of importing again. Text-only receipts have no following image lines.`

/** Separate validated original reference rasters and bounded canvas snapshots from text. */
export const localToolContent = async (
  text: string
): Promise<
  (
    | { type: 'inputText'; text: string }
    | { type: 'inputImage'; imageUrl: string }
  )[]
> => {
  const value = JSON.parse(text)
  const images: { type: 'inputImage'; imageUrl: string }[] = []
  if (isRecord(value) && Array.isArray(value.actionResults)) {
    for (const entry of value.actionResults) {
      if (
        !isRecord(entry) ||
        (entry.actionName !== AiActionNames.INSPECT_DRAWING &&
          entry.actionName !== AiReferenceToolIds.IMPORT_REFERENCE_IMAGE) ||
        !isRecord(entry.result) ||
        entry.result.available !== true
      )
        continue
      const snapshot = entry.result.image
      if (
        !isRecord(snapshot) ||
        typeof snapshot.dataUrl !== 'string' ||
        snapshot.dataUrl.length > 8 * 1024 * 1024 + 64 ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
          snapshot.dataUrl
        )
      )
        throw new Error('Invalid drawing snapshot')
      const bytes = Buffer.from(snapshot.dataUrl.split(',')[1], 'base64')
      if (entry.actionName === AiReferenceToolIds.IMPORT_REFERENCE_IMAGE) {
        // Import already decodes once. Read metadata only here to validate the
        // handoff without re-decoding, resampling or imposing a second pixel cap.
        const metadata = await sharp(bytes).metadata()
        const declaredType = snapshot.dataUrl.slice(
          11,
          snapshot.dataUrl.indexOf(';')
        )
        if (
          bytes.length > 6 * 1024 * 1024 ||
          metadata.format !== declaredType ||
          (metadata.pages ?? 1) !== 1 ||
          metadata.autoOrient.width !== snapshot.width ||
          metadata.autoOrient.height !== snapshot.height
        )
          throw new Error('Invalid reference image metadata')
      } else if (
        !snapshot.dataUrl.startsWith('data:image/png;base64,') ||
        bytes.length < 24 ||
        !bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        bytes.readUInt32BE(16) !== snapshot.width ||
        bytes.readUInt32BE(20) !== snapshot.height ||
        Number(snapshot.width) < 1 ||
        Number(snapshot.height) < 1 ||
        Number(snapshot.width) > 1024 ||
        Number(snapshot.height) > 1024
      )
        throw new Error('Invalid drawing snapshot dimensions')
      images.push({ type: 'inputImage', imageUrl: snapshot.dataUrl })
      const { dataUrl: _dataUrl, ...metadata } = snapshot
      entry.result = { ...entry.result, image: metadata }
    }
  }
  return [{ type: 'inputText', text: JSON.stringify(value) }, ...images]
}
