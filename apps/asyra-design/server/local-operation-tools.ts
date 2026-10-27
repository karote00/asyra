import { reviewSupersessionRecovery } from './local-design-review'
import {
  workflowUsageGuide,
  workflowUsageParameters,
  workflowInputScopes,
  workflowQueryGuidance,
  projectWorkflowInput
} from './design-workflow-discovery'
import {
  contentPageSchema,
  deliverInformation,
  informationDeliveryInstructions,
  informationDeliverySchema
} from './local-information-delivery'
import {
  prescribedPositionsSchema,
  type PrescribedPosition
} from '../src/ai/prescribed-position-contract'
import {
  createMechanicalChecks,
  mechanicalVerificationSchema
} from './local-mechanical-checks'
import {
  createLocalImageCheck,
  imageCheckDefinition,
  imageCheckResultSchema,
  type ImageCheckInspection
} from './local-image-check'
import {
  embedAiToolSchema,
  type AiJsonValue as RuntimeJsonValue
} from '@asyra/ai-agent-runtime'
import {
  createDesignCheckResults,
  designCheckDeliverySchema,
  type DesignCheckDeliveryOptions,
  designCheckSummarySchema,
  designCheckInputSchema
} from './design-check-results'
import { serializeToolPayload } from '@asyra/ai-agent-runtime/node'
import { retainedElementSetSchema } from '../src/ai/basic-api-contracts'
import { createLocalQueryArtifacts } from './local-query-artifacts'
import { BrowserBatchExecutionError } from './batch-exchange'
import type { LocalToolOwnership } from './local-tool-leases'
import {
  projectToolDelivery,
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
import {
  LocalToolInputError,
  localToolOutcome,
  localToolFailureReply,
  localToolErrorMessage,
  observeLocalToolExecution,
  type LocalToolObservation,
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
import {
  prepareOperationBatch,
  type ElementBindingMode
} from './local-operation-batch'
import {
  createLocalDesignReview,
  designEvidenceDefinitions,
  designEvidenceInput,
  reviewVisualSchema,
  reviewCaptureChecksSchema,
  reviewInspectionIds
} from './local-design-review'
import { AiDesignToolIds } from '../src/constants/ai-design'
import { AiReferenceToolIds } from './ai-domain-prompt'
import { Buffer } from 'node:buffer'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import {
  AiActionNames,
  AiBatchOnlyActionNames
} from '../src/constants/ai-actions'
import type {
  AiActionBatch,
  AiProviderInput,
  AiBatchReceipt
} from '../src/ai/action-batch-protocol'
/** Resource exports derive from the same registered receipt declarations as publication. */
const actionResultResources = (actions: AiProviderInput['actions']) => ({
  type: 'array',
  items: {
    anyOf: [
      ...actions.flatMap((action) => {
        if (
          !('delivery' in action) ||
          action.delivery?.receipt?.owner !== 'design-context'
        )
          return []
        const path = action.delivery.receipt.path
          .slice(1)
          .split('/')
          .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
        const result = path.reduceRight<unknown>(
          (schema, field) => toolResultObject({ [field]: schema }, []),
          retainedElementSetSchema
        )
        return [
          toolResultObject({
            actionId: toolResultString,
            actionName: { const: action.name },
            result
          })
        ]
      }),
      toolResultObject({
        actionId: toolResultString,
        actionName: toolResultString,
        result: true
      })
    ]
  }
})
const partialResultResources = (results: unknown) =>
  toolResultObject(
    { executionResult: toolResultObject({ actionResults: results }, []) },
    []
  )
const batchFailureRecovery =
  'Inspect the retained write receipt and check diagnostics before continuing; do not replay acknowledged mutations.'

const batchResultSchema = (resources: unknown) =>
  toolResultObject(
    {
      actionResults: resources,
      batchSummary: toolResultObject({ actionCount: toolResultCount }),
      checks: designCheckSummarySchema
    },
    ['actionResults', 'batchSummary']
  )
const batchToolSemantics = (outputSchema: unknown, resources: unknown) => {
  const semantics = toolSemantics(outputSchema, 'mutation', ['document'])
  return {
    ...semantics,
    partialOutputSchema: {
      ...(semantics.partialOutputSchema as Record<string, unknown>),
      ...partialResultResources(resources)
    }
  }
}

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
        checks: designCheckSummarySchema,
        ...(action.name === AiActionNames.REVIEW_DESIGN
          ? { mechanicalSelection: designCheckInputSchema }
          : {})
      },
      [
        'actionResults',
        ...(action.name === AiActionNames.REVIEW_DESIGN
          ? ['mechanicalSelection']
          : [])
      ]
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
    ...(action.delivery
      ? {
          delivery: {
            path: '/modelResult',
            outputSchema: envelope(action.delivery.outputSchema)
          }
        }
      : {}),
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
      ...partialResultResources(actionResultResources([action])),
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

/** Exact lookup coverage belongs to discovery, not transport completion. */
const discoveryReceipt = (value: Record<string, unknown>) => {
  const entries = [value.apis, value.tools].flatMap((items) =>
    Array.isArray(items) ? items.filter(isRecord) : []
  )
  const unresolved = [
    'missingNames',
    'missingOperations',
    'ambiguousNames'
  ].reduce(
    (count, key) => count + (Array.isArray(value[key]) ? value[key].length : 0),
    0
  )
  const unavailable = entries.filter(
    (entry) =>
      isRecord(entry.definition) &&
      entry.definition.availableInResponse === false
  ).length
  if (!unresolved && !unavailable) return {}
  const delivered = entries.length - unavailable
  return {
    status: delivered ? 'partial' : 'failed',
    settlement: 'completed',
    code: 'DEFINITION_UNAVAILABLE',
    message: `${delivered} requested definitions delivered; ${unresolved + unavailable} unavailable. Inspect per-identity resolution and recover only missing contracts; never replay writes. ${typeof value.message === 'string' ? value.message : ''}`
  }
}

const discoveryInputIssue = (args: unknown): string | undefined => {
  const selectors = ['names', 'query', 'operation', 'operations', 'category']
  if (
    !isRecord(args) ||
    Object.keys(args).some(
      (key) =>
        !selectors.includes(key) &&
        ![
          'inputScope',
          'includeSchemas',
          'refresh',
          'refreshReason',
          'view',
          'schemaPaths',
          'offset',
          'registryRevision'
        ].includes(key)
    ) ||
    (args.offset !== undefined &&
      (!Number.isSafeInteger(args.offset) ||
        Number(args.offset) < 0 ||
        (args.category === undefined && args.query === undefined))) ||
    (args.registryRevision !== undefined &&
      (!Number.isSafeInteger(args.registryRevision) ||
        Number(args.registryRevision) < 0 ||
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
    (args.inputScope !== undefined &&
      (args.schemaPaths !== undefined ||
        (args.query === undefined &&
          (!Array.isArray(args.names) || args.names.length !== 1)))) ||
    (args.view !== undefined && args.schemaPaths !== undefined) ||
    (args.view !== undefined &&
      !selectors.some((key) => args[key] !== undefined)) ||
    (args.schemaPaths !== undefined &&
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
    return 'Provide one selector: operations, operation, category, names or query; omit selectors for categories. includeSchemas requires category. view (usage/full) requires a selector; nonempty schemaPaths requires exact names/operations. inputScope requires one exact native tool via names or query and cannot combine with schemaPaths; use owner-published scope choices. Partial views cannot combine with each other. refreshReason requires refresh=true and must be context-loss, delivery-failure or missing-fields.'
  return undefined
}

export class LocalOperationPreparationError extends LocalToolInputError {
  constructor(message?: string) {
    super(
      message ??
        'Drawing preparation rejected these arguments before any canvas changes. Check the supplied operation schema, use a valid artifact from this request, valid target bounds and only supported fields. Component conversions require matching analysis receipts; omit optional mappings and analysisIds when no conversion is selected. Correct the arguments and reuse the prepared artifact; do not invent replacement paths or repeat unchanged arguments.'
    )
  }
}

export const localOperationNamespace = 'design_operations'

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
        `Unknown schema path: ${path}. Request view=usage for canonical field/definition paths or the containing schema path; the full definition remains available.`
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

const schemaSlots = (
  schema: unknown,
  prefix = ''
): { path: string; schema: Record<string, unknown> }[] => {
  if (!isRecord(schema)) return []
  const slots: { path: string; schema: Record<string, unknown> }[] = []
  if (isRecord(schema.properties))
    for (const [name, child] of Object.entries(schema.properties)) {
      const path = `${prefix}/properties/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`
      if (isRecord(child))
        slots.push({ path, schema: child }, ...schemaSlots(child, path))
    }
  // Traverse stored definitions once; never expand recursive $ref links.
  for (const container of ['$defs', 'definitions']) {
    const definitions = schema[container]
    if (isRecord(definitions))
      for (const [name, child] of Object.entries(definitions)) {
        const path = `${prefix}/${container}/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`
        if (isRecord(child))
          slots.push({ path, schema: child }, ...schemaSlots(child, path))
      }
  }
  for (const key of ['items', 'additionalProperties'])
    if (isRecord(schema[key]))
      slots.push(...schemaSlots(schema[key], `${prefix}/${key}`))
  for (const mode of ['anyOf', 'oneOf', 'allOf']) {
    const branches = schema[mode]
    if (Array.isArray(branches))
      branches.forEach((branch, index) =>
        slots.push(...schemaSlots(branch, `${prefix}/${mode}/${index}`))
      )
  }
  return slots
}
const inputFieldPaths = (schema: unknown): string[] =>
  schemaSlots(schema).map((slot) => slot.path)

/** Navigation stops at branch roots; it is not a flattened validation schema. */
const usageInputPaths = (schema: unknown): string[] => {
  if (!isRecord(schema)) return []
  const escape = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1')
  const branches = (value: unknown, prefix: string): string[] => {
    if (!isRecord(value)) return []
    return ['oneOf', 'anyOf', 'allOf'].flatMap((mode) => {
      const alternatives = value[mode]
      return Array.isArray(alternatives)
        ? alternatives.map((_, index) => `${prefix}/${mode}/${index}`)
        : []
    })
  }
  return [
    ...branches(schema, ''),
    ...(isRecord(schema.properties)
      ? Object.entries(schema.properties).flatMap(([key, child]) => {
          const path = `/properties/${escape(key)}`
          return [path, ...branches(child, path)]
        })
      : []),
    ...['$defs', 'definitions'].flatMap((key) => {
      const definitions = schema[key]
      return isRecord(definitions)
        ? Object.keys(definitions).map((name) => `/${key}/${escape(name)}`)
        : []
    })
  ]
}

/** Examples are owner-authored data, never invented runtime credentials. */
const usageInvocation = (descriptor: Record<string, unknown>) => {
  const schema = descriptor.inputSchema
  const execution = descriptor.execution
  if (!isRecord(schema) || !isRecord(execution))
    return { available: false, reason: 'no-executable-owner-example' }
  const example = Array.isArray(schema.examples)
    ? schema.examples.find(
        (value) => isRecord(value) && !operationInputIssue(value, schema)
      )
    : undefined
  if (!example) return { available: false, reason: 'no-valid-owner-example' }
  if (execution.kind === 'batch-action')
    return {
      illustrative: true,
      invocation: {
        tool: execution.tool,
        arguments: {
          operations: [{ name: descriptor.name, arguments: example }]
        }
      }
    }
  if (execution.kind === 'native-tool')
    return {
      illustrative: true,
      invocation: {
        namespace: execution.namespace,
        tool: execution.tool,
        arguments:
          typeof execution.argumentField === 'string'
            ? { [execution.argumentField]: example }
            : example
      }
    }
  if (execution.kind === 'final-response')
    return {
      illustrative: true,
      finalResponse: {
        actions: [{ name: descriptor.name, arguments: example }]
      }
    }
  return { available: false, reason: 'execution-route-unavailable' }
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
const verifyChecksDefinition = {
  type: 'function',
  name: AiDesignToolIds.VERIFY_DESIGN_CHECKS,
  ...toolSemantics(mechanicalVerificationSchema, 'read', [
    'document',
    'request'
  ]),
  composition: 'allowed' as const,
  executionAccess: LocalToolAccess.EXCLUSIVE,
  verification: {
    statusPath: '/verification/status',
    progressPath: '/verification/progress'
  },
  description:
    'Verify an exact request-owned mechanical check selection from native review_design.mechanicalSelection. Use fresh requestId/checks as recipe input, not saved literals. Reuse current passes, refresh only affected canonical dependencies, and retain independent results on failure. No model or visual judgment. Use returned requestId/checks as iteration state and carry the repair result into the next check. Registered verification metadata supplies status/progress paths. Keep independent passed and owner-retired checks selected; unsupported findings require a primary-agent decision. Never replay initial writes.',
  inputSchema: designCheckInputSchema
}

const repairChecksSchema = {
  ...designCheckInputSchema,
  required: ['requestId', 'checks', 'policy'],
  properties: {
    ...designCheckInputSchema.properties,
    policy: {
      type: 'object',
      additionalProperties: false,
      required: ['capability', 'positions'],
      properties: {
        capability: { type: 'string', enum: ['set-prescribed-child-position'] },
        positions: prescribedPositionsSchema
      }
    }
  }
}
const repairChecksResultSchema = toolResultObject({
  ...designCheckInputSchema.properties,
  actionResults: { type: 'array' }
})
const repairChecksRecoverySchema = toolResultObject({
  ...designCheckInputSchema.properties
})
const repairChecksDefinition = {
  type: 'function',
  name: AiDesignToolIds.REPAIR_DESIGN_CHECKS,
  ...toolSemantics(repairChecksResultSchema, 'mutation', [
    'document',
    'request'
  ]),
  partialOutputSchema: repairChecksRecoverySchema,
  recoveryOutputSchema: {
    anyOf: [
      repairChecksRecoverySchema,
      toolResultObject({
        available: { const: false },
        recoverable: { const: true },
        code: toolResultString,
        message: toolResultString,
        stage: { const: 'admission' },
        settlement: { const: 'not-started' }
      })
    ]
  },
  composition: 'allowed' as const,
  executionAccess: LocalToolAccess.EXCLUSIVE,
  description:
    'Apply only explicit prescribed child positions for the complete selected container-overflow findings. Supply original parent attachment evidence from read_design_attachment; never substitute a changed basis. Preflight all findings and edits before writes. Bind policy as fresh input and use returned requestId/checks for the next verification. Changed parent/workspace basis requires fresh evidence and an explicitly renewed policy. Return actual receipts; do not infer visual acceptance or replay initial writes.',
  inputSchema: repairChecksSchema
}

const checkResultsDefinition = {
  type: 'function',
  name: AiDesignToolIds.READ_DESIGN_CHECKS,
  ...toolSemantics(designCheckDeliverySchema, 'read', ['request-artifacts']),
  revision: 5,
  executionAccess: LocalToolAccess.EXCLUSIVE,
  description:
    'Read retained tool and primary-agent checks. Default returns request-checks counts, firstPendingId and ledger revision without rows. Exact-ID counts are selected-checks; paginated counts remain request-wide. Counts combine tool and main-agent evidence and are not visual acceptance or save confirmation. Exact ids retrieve full selected evidence. For all details use view=details, optional includePassed and limit (1-100); continue using nextOffset as offset with the returned revision. Changed revision requires restarting at offset zero. No model is invoked. Results never substitute for current canonical inspection.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      view: { enum: ['summary', 'details'] },
      offset: { type: 'integer', minimum: 0 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      revision: { type: 'integer', minimum: 0 },
      includePassed: { type: 'boolean' },
      ids: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', minLength: 1 }
      }
    }
  }
}

/** Internal owner lifetime, never an argument accepted from a model tool call. */
export type LocalOperationDispatch = (
  batch: AiActionBatch,
  phase?: 'cleanup'
) => Promise<AiBatchReceipt>

/** Tool-specific preparation stays on the server; only canonical receipts return to the model. */
export const createLocalOperationTools = (
  actions: AiProviderInput['actions'],
  preparation: LocalActionPreparation,
  dispatchBatch: LocalOperationDispatch,
  options: {
    observation?: LocalToolObservation
    ownership?: LocalToolOwnership
    requestSignal?: AbortSignal
    reviewTargetId?: string
    getNativeTools?: () => NativeToolDescriptor[]
    getNativeToolsRevision?: () => number
    resolveSources?: (sources: string[]) => string[]
    referenceImages?: (indexes: number[]) => { dataUrl: string }[]
    validateReferences?: (
      indexes: number[],
      referenceIds?: string[]
    ) => ReferenceIdentity[]
    prepareReferences?: (
      indexes: number[],
      signal: AbortSignal
    ) => Promise<string>
    onInspection?: (status: 'running' | 'completed', tool?: string) => void
  } = {}
) => {
  const queryArtifacts = options.ownership
    ? createLocalQueryArtifacts({
        actions,
        ownership: options.ownership,
        release: async (snapshotId) => {
          // The browser transaction finally owns cancellation cleanup, including
          // transport loss. Do not send a cleanup action through an aborted request.
          if (options.requestSignal?.aborted) return
          const id = randomUUID()
          const receipt = await dispatchBatch(
            {
              batchId: randomUUID(),
              actions: [
                {
                  id,
                  name: AiActionNames.RELEASE_DESIGN_CONTEXT,
                  arguments: { snapshotId },
                  summary: 'Release retained query data'
                }
              ]
            },
            'cleanup'
          )
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
    let receipt: AiBatchReceipt
    try {
      receipt = await dispatchBatch(batch)
    } catch (error) {
      if (!(error instanceof BrowserBatchExecutionError) || !error.receipt)
        throw error
      const partial = queryArtifacts
        ? await queryArtifacts.accept(batch, error.receipt)
        : error.receipt
      throw new BrowserBatchExecutionError(error.failure, partial)
    }
    return queryArtifacts
      ? await queryArtifacts.accept(batch, receipt)
      : receipt
  }
  const allowed = new Set<string>([
    ...Object.values(AiActionNames),
    ...basicApiContracts.map(({ name }) => name)
  ])
  const modelActions = preparation.modelActions(actions)
  const finalActions = new Map(
    modelActions
      .filter((action) =>
        [
          AiActionNames.REPORT_OUTCOME,
          AiActionNames.REQUEST_CLARIFICATION,
          AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE
        ].includes(action.name as never)
      )
      .map((action) => [action.name, action])
  )
  const registered = modelActions.filter(
    (action) => allowed.has(action.name) && !finalActions.has(action.name)
  )
  // Explicit review/capture owns evidence processing outside edit batches.
  const batchActions = registered.filter(
    (action) =>
      ![AiActionNames.REVIEW_DESIGN, AiActionNames.INSPECT_DRAWING].includes(
        action.name as never
      )
  )
  const batchResultResources = actionResultResources(batchActions)
  const batchActionNames = new Set(batchActions.map((action) => action.name))
  // Request-local indexes are derived from admitted actions; no model call or stale schema copy.
  const admittedApisByName = new Map(
    [...registered, ...finalActions.values()].map((api) => [api.name, api])
  )
  const contextReader = registered.find(
    (action) => action.name === AiActionNames.RESOLVE_DESIGN_TARGETS
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
  const regionTargetSchema = contextFields?.bounds
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
          field: {
            type: 'string',
            minLength: 1,
            description:
              'Exact canonical element-identity argument name. Its schema declares all, each or one binding cardinality; for example anchorId is exactly one.'
          },
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
                field: { type: 'string', minLength: 1 },
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
    const resolve = (
      reference: unknown,
      mode: ElementBindingMode
    ): string[] => {
      if (isRecord(reference) && reference.query !== undefined) {
        if (mode === 'each')
          throw new Error(
            'Region queries require a plural or exact-one slot; scalar fan-out is not supported.'
          )
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
        const key = JSON.stringify(reference.query, (_key, value) =>
          isRecord(value)
            ? Object.fromEntries(
                Object.keys(value)
                  .sort()
                  .map((name) => [name, value[name]])
              )
            : value
        )
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
    // Bind every operation before any read. Region membership is resolved once;
    // exact-one anchors reject ambiguous results instead of scalar fan-out.
    const executable = batchActions
    const admitted = prepareOperationBatch(operations, executable, resolve)
    if (!queryKeys.size) return admitted
    if (!contextReader) throw new Error('Region context reader is unavailable.')
    for (const [key, query] of queryKeys) {
      signal.throwIfAborted()
      const argumentsValue = { ...query }
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
            name: AiActionNames.RESOLVE_DESIGN_TARGETS,
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
          entry.actionName === AiActionNames.RESOLVE_DESIGN_TARGETS
      )
      const value = matches.length === 1 ? matches[0].result : undefined
      if (
        receipt.failure ||
        receipt.actionResults.length !== 1 ||
        !isRecord(value) ||
        (isRecord(value.toolOutcome) &&
          (value.toolOutcome.status !== 'success' ||
            value.toolOutcome.settlement !== 'completed')) ||
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
  const returnedDefinitions = new Map<
    string,
    {
      text: string
      resultKey: string
      value: Record<string, unknown>
      registryRevision: number
      receipt: ReturnType<typeof discoveryReceipt>
    }
  >()
  const batchDefinition = {
    type: 'function',
    ...batchToolSemantics(
      batchResultSchema(batchResultResources),
      batchResultResources
    ),
    revision: 3,
    name: AiDesignToolIds.EXECUTE_DESIGN_BATCH,
    description:
      'Submit an ordered batch of registered edits or narrow reads in one canvas exchange. Use each named operation schema. For region edits, target={field:"elementIds",query:{scope:"region",bounds,filter?}} resolves every matching ID internally once before batch writes; use a plural API, without metadata reads or pagination. Unavailable/incomplete/empty matches make no writes. Queries select current identities; mutation admission still rechecks targets. target alternatively supplies artifactId with a targetSetId from retain_design_targets, exact keys or keyPrefix and field=elementId (apply to each identity) or elementIds (one plural operation); omitted keys selects the prepared set. The field is resolved at its unique registered schema path, including nested request arguments; ambiguous paths require explicit arguments. Omit target-supplied argument slots entirely, including empty arrays, null or placeholders. Each destination schema declares x-design-element-binding: all supplies the list, each expands per element, one requires exactly one (for example anchorId). Multiple bindings may fill distinct omitted slots with at most one each destination; no Cartesian expansion. anchorId uses field="anchorId", path=["request","anchorId"], not field="elementId". Region queries allow all or one slots, never each. Other identity types are not element targets. References identify original creation members, not current Group children. Current canonical permission/existence checks still apply. All inputs are checked before dispatch. Existing Runtime transaction, Undo and failure semantics remain; inspect once after the stage, not after each item. Use inspection=defer only when another stage follows. Structural receipts provide retained={snapshotId,leaseId,total}; pass that object directly in a declared elementIds slot for the next edit. Read read_design_context with scope=snapshot and delivery=receipt for the original full receipt without repeating a mutation. Read operations should use fields=[] or specific fields, never reread the hierarchy to recover known IDs.',
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
                enum: batchActions.map((action) => action.name)
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
            'Compact preserves ordered owner receipts and their application, settlement and mutation-scope evidence. Structural group/ungroup/move/deletion receipts return retained snapshot/lease/count references. Pass a retained reference directly into a declared elementIds argument; no model-side expansion. Read its full immutable receipt with read_design_context scope=snapshot delivery=receipt; never replay a mutation for readback. Use full at initial invocation for every original acknowledgement. Uncertain receipts retain their evidence without implying completed application.'
        },
        message: { type: 'string', minLength: 1, maxLength: 1000 }
      }
    }
  }

  const deliverDefinition = (
    identity: string,
    descriptor: Record<string, unknown>,
    reference: Record<string, unknown>,
    args: Record<string, unknown>,
    selector: { operations: string[] } | { names: string[] }
  ) => {
    const { inputSchema } = descriptor
    // Usage documents canonical owners without exposing raw validator schemas.
    const usage = Object.fromEntries(
      [
        'name',
        'namespace',
        'registeredName',
        'revision',
        'description',
        'operation',
        'category',
        'effect',
        'result',
        'resources',
        'lifecycle',
        'composition',
        'execution',
        'recipeDependency'
      ]
        .filter((key) => Object.hasOwn(descriptor, key))
        .map((key) => [key, descriptor[key]])
    )
    const admittedAction = admittedApisByName.get(String(descriptor.name))
    const exactSelection =
      Array.isArray(args.names) ||
      Array.isArray(args.operations) ||
      (typeof args.query === 'string' &&
        (admittedApisByName.get(args.query.trim()) === admittedAction ||
          admittedApisByOperation.get(args.query.trim()) === admittedAction))
    const selectedBatch =
      exactSelection &&
      args.view === 'usage' &&
      isRecord(descriptor.execution) &&
      descriptor.execution.kind === 'batch-action' &&
      admittedAction &&
      'effect' in admittedAction &&
      admittedAction.effect === 'mutation'
        ? admittedAction
        : undefined
    const selectedResources = selectedBatch
      ? actionResultResources([selectedBatch])
      : undefined
    const selectedBatchInput = selectedBatch
      ? {
          ...batchDefinition.inputSchema,
          properties: {
            ...batchDefinition.inputSchema.properties,
            operations: {
              ...batchDefinition.inputSchema.properties.operations,
              items: {
                ...batchDefinition.inputSchema.properties.operations.items,
                properties: {
                  ...batchDefinition.inputSchema.properties.operations.items
                    .properties,
                  name: { type: 'string', enum: [selectedBatch.name] }
                }
              }
            }
          }
        }
      : undefined
    const selectedBatchResults = selectedBatch
      ? batchToolSemantics(
          batchResultSchema(selectedResources),
          selectedResources
        )
      : undefined
    const revision = createHash('sha256')
      .update(
        JSON.stringify(
          selectedBatch
            ? {
                descriptor,
                instructions: batchDefinition.description,
                input: selectedBatchInput,
                results: selectedBatchResults
              }
            : descriptor
        )
      )
      .digest('hex')
    const refresh = {
      tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      arguments: {
        ...selector,
        refresh: true,
        refreshReason: 'context-loss',
        ...(args.inputScope ? { inputScope: args.inputScope } : {}),
        ...(args.view === 'usage' ? { view: 'usage' } : {})
      }
    }
    let coverage = 'full'
    if (args.view === 'usage') coverage = 'usage'
    else if (Array.isArray(args.schemaPaths)) coverage = 'partial'
    const requestedPaths = Array.isArray(args.schemaPaths)
      ? [...new Set(args.schemaPaths as string[])].sort()
      : []
    if (coverage === 'partial') {
      const issues = requestedPaths.flatMap((path) => {
        try {
          schemaValueAt(inputSchema, path)
          return []
        } catch (error) {
          if (!(error instanceof LocalOperationPreparationError)) throw error
          return [{ path, message: error.message }]
        }
      })
      const validPaths = requestedPaths.filter(
        (path) => !issues.some((issue) => issue.path === path)
      )
      if (issues.length)
        return {
          ...reference,
          definition: {
            revision,
            state: 'unavailable',
            coverage: 'none',
            requestedCoverage: 'partial',
            availableInResponse: false,
            nextAction: 'correct-schema-paths',
            recover: {
              tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              arguments: {
                ...selector,
                ...(validPaths.length
                  ? { schemaPaths: validPaths }
                  : { view: 'usage' })
              }
            },
            refresh
          },
          schemaResolution: {
            status: 'unavailable',
            issues,
            ...(validPaths.length
              ? {
                  narrowerQuery: {
                    tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                    arguments: {
                      ...selector,
                      schemaPaths: validPaths
                    }
                  }
                }
              : {}),
            rootPaths: isRecord(inputSchema)
              ? Object.keys(inputSchema).map(
                  (key) => '/' + key.replace(/~/g, '~0').replace(/\//g, '~1')
                )
              : [],
            inputFields: usageInputPaths(inputSchema),
            recover: {
              tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              arguments: { ...selector, view: 'usage' }
            }
          }
        }
    }
    let projection = descriptor
    if (args.inputScope !== undefined) {
      try {
        projection = {
          ...descriptor,
          inputSchema: projectWorkflowInput(inputSchema, args.inputScope)
        }
        coverage = 'scoped'
      } catch (error) {
        const guidance = workflowQueryGuidance(identity, inputSchema)
        if (!guidance)
          throw new LocalOperationPreparationError(
            'This owner does not publish inputScope choices. Omit inputScope and request its full contract.'
          )
        throw new LocalOperationPreparationError(
          `${error instanceof Error ? error.message : 'Invalid inputScope'} Correct the query from these choices; the example is illustrative, not a replacement for valid selections. Scope guidance: ${JSON.stringify({ inputScopes: { operations: guidance.inputScopes.operations, nodeTypes: guidance.inputScopes.nodeTypes, optionalInputs: guidance.inputScopes.optionalInputs }, example: guidance.example })}`
        )
      }
    }
    if (args.view === 'usage' && args.inputScope !== undefined) {
      const selected = projection.inputSchema
      let guide
      try {
        guide = workflowUsageGuide(inputSchema, args.inputScope, selected)
      } catch (error) {
        throw new LocalOperationPreparationError(
          error instanceof Error ? error.message : 'Invalid selected usage'
        )
      }
      coverage = 'scoped-usage'
      projection = {
        ...usage,
        description:
          'Selected operation usage. Follow the included guide and registered execution route.',
        invocationExample: usageInvocation({
          ...descriptor,
          inputSchema: selected
        }),
        usageGuide: guide
      }
    } else if (selectedBatch && selectedBatchResults) {
      projection = {
        ...usage,
        inputFields: usageInputPaths(inputSchema),
        invocationExample: usageInvocation(descriptor),
        usageGuide: {
          instructions: batchDefinition.description,
          parameters: workflowUsageParameters(selectedBatchInput),
          operationParameters: workflowUsageParameters(inputSchema),
          results: {
            batch: workflowUsageParameters(selectedBatchResults.outputSchema),
            partialBatch: workflowUsageParameters(
              selectedBatchResults.partialOutputSchema
            ),
            ...(descriptor.outputSchema === undefined
              ? {}
              : {
                  operation: workflowUsageParameters(descriptor.outputSchema)
                }),
            ...(descriptor.partialOutputSchema === undefined
              ? {}
              : {
                  partialOperation: workflowUsageParameters(
                    descriptor.partialOutputSchema
                  )
                })
          },
          recovery:
            batchDefinition.inputSchema.properties.response.description +
            ' ' +
            batchFailureRecovery
        }
      }
    } else if (args.view === 'usage') {
      const inputScopes = workflowInputScopes(inputSchema)
      projection = {
        ...usage,
        ...(inputScopes?.selection
          ? {
              description:
                'Select the next ready part using inputScopes; exact selected usage supplies the complete execution guide.'
            }
          : {}),
        inputScopes,
        inputFields: usageInputPaths(inputSchema),
        ...(inputScopes?.selection
          ? {}
          : { outputFields: inputFieldPaths(descriptor.outputSchema) }),
        elementBindings: schemaSlots(inputSchema).flatMap(({ path, schema }) =>
          ['all', 'each', 'one'].includes(
            String(schema['x-design-element-binding'])
          )
            ? [{ schemaPath: path, mode: schema['x-design-element-binding'] }]
            : []
        ),
        invocationExample: usageInvocation(descriptor)
      }
    } else if (Array.isArray(args.schemaPaths)) {
      projection = {
        ...reference,
        ...schemaFragments(inputSchema, args.schemaPaths as string[])
      }
    }
    const navigation = projection.inputFields
    const fieldQuery =
      args.view === 'usage' && Array.isArray(navigation) && navigation.length
        ? {
            tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
            arguments: { ...selector, schemaPaths: [navigation[0]] }
          }
        : undefined
    return {
      ...projection,
      ...(fieldQuery ? { fieldQuery } : {}),
      definition: {
        revision,
        state: 'included',
        coverage,
        requestedCoverage: coverage,
        ...(args.inputScope ? { inputScope: args.inputScope } : {}),
        availableInResponse: true,
        deliveryReason: args.refresh === true ? 'recovery' : 'requested',
        ...(args.refresh === true
          ? { recoveryReason: args.refreshReason ?? 'unknown' }
          : {}),
        nextAction: 'use-response-or-recover-requested-scope',
        recover: {
          tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
          arguments: {
            ...selector,
            ...(args.inputScope ? { inputScope: args.inputScope } : {}),
            ...(args.view === 'usage' ? { view: 'usage' } : {}),
            ...(args.schemaPaths ? { schemaPaths: args.schemaPaths } : {}),
            refresh: true,
            refreshReason: 'delivery-failure'
          }
        },
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
  let nativeCatalogFingerprint: string | undefined
  let nativeCatalogRevision = 0
  let nativeTools: NativeToolDescriptor[] = []
  const nativeMatches = (name: string): NativeToolDescriptor[] => {
    const revision = options.getNativeToolsRevision?.() ?? 0
    if (!nativeToolsByName || nativeToolsRevision !== revision) {
      nativeToolsByName = new Map()
      nativeTools = (options.getNativeTools?.() ?? []).map((tool) => ({
        ...tool
      }))
      // The host counter invalidates reads even after rejected/no-op library work.
      // Page identity changes only when the ordered published catalog changes.
      const fingerprint = createHash('sha256')
        .update(JSON.stringify(nativeTools))
        .digest('hex')
      if (fingerprint !== nativeCatalogFingerprint) nativeCatalogRevision++
      nativeCatalogFingerprint = fingerprint
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
  const discoveryRevision = () => {
    nativeInventory()
    return nativeCatalogRevision
  }
  const nativeExecution = (tool: NativeToolDescriptor) =>
    tool.execution ?? {
      kind: 'native-tool',
      namespace: tool.namespace,
      tool: tool.name
    }
  const isCanonicalWrapper = (
    tool: NativeToolDescriptor,
    action: (typeof registered)[number]
  ) =>
    Boolean(getBasicApiContract(action.name)) &&
    tool.name === action.name &&
    tool.namespace === localOperationNamespace &&
    tool.registeredName === `${localOperationNamespace}.${action.name}`
  const actionExecution = (action: (typeof registered)[number]) => {
    if (finalActions.has(action.name))
      return { kind: 'final-response', action: action.name }
    if (batchActionNames.has(action.name))
      return {
        kind: 'batch-action',
        tool: AiDesignToolIds.EXECUTE_DESIGN_BATCH
      }
    const wrappers = nativeMatches(action.name).filter(
      (tool) =>
        tool.namespace === localOperationNamespace &&
        tool.providerExposure !== 'registry'
    )
    if (wrappers.length === 1)
      return { ...nativeExecution(wrappers[0]), argumentField: 'arguments' }
    return {
      kind: 'unavailable',
      reason:
        'An unambiguous native wrapper is required for explicit inspection.',
      candidates: wrappers.map((tool) => `${tool.namespace}.${tool.name}`)
    }
  }
  const discoveryGuidance = {
    capabilities:
      'Find an operation by what it does: category menus, semantic operations or capability terms such as fill, hierarchy, bounds and inspection. Menus include execution routes; exact names retrieve input/output contracts. Query resolves exact registered identities before descriptive matching; use purpose terms or categories for related capabilities. Known tools need no repeated lookup.',
    references:
      'This catalog does not search subjects, photographs or design reference material. Use native web research for missing external facts/images, then import_reference_image for a selected source. A subject word may be absent from this capability catalog; do not infer a missing drawing capability or automatically repeat it as a tool query.'
  }
  const nativeMenu = (tool: NativeToolDescriptor) => {
    const inputScopes = workflowInputScopes(tool.inputSchema)
    return {
      name: tool.name,
      namespace: tool.namespace,
      registeredName: tool.registeredName,
      revision: tool.revision,
      description: inputScopes?.selection
        ? 'Select the next ready part using inputScopes; exact selected usage supplies the complete execution guide.'
        : tool.description,
      effect: tool.effect,
      composition: tool.composition,
      execution: nativeExecution(tool),
      inputScopes
    }
  }

  const nativeDefinition = (
    tool: NativeToolDescriptor,
    args: Record<string, unknown>
  ) => ({
    ...deliverDefinition(
      `${tool.namespace}.${tool.name}`,
      { ...tool, execution: nativeExecution(tool) },
      {
        name: tool.name,
        namespace: tool.namespace,
        registeredName: tool.registeredName,
        revision: tool.revision
      },
      args,
      { names: [`${tool.namespace}.${tool.name}`] }
    ),
    schemaSource: 'registered-tool-contract',
    execution: nativeExecution(tool)
  })
  const requestId = options.ownership?.requestId ?? randomUUID()
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
        context: (receipts) => designReview.preparationContext(receipts),
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
          return {
            workspaceId: result.workspaceId,
            parentId: result.parentId,
            basis: result.basis.map((point) => ({ x: point.x, y: point.y })),
            ...(result.bounds === undefined ? {} : { bounds: result.bounds }),
            evidence: stamp
          } satisfies PreparedAttachment
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
    {
      role: 'reference' | 'overview' | 'detail'
      dataUrl: string
    } & ImageCheckInspection
  >()
  let reviewTargetId = options.reviewTargetId
  const reviewScope = new Set(
    options.reviewTargetId ? [options.reviewTargetId] : []
  )
  const measuredTargets = new Map<string, InspectionEvidenceStamp | undefined>()
  const hasOtherMeasuredTargets = (elementId: unknown) =>
    measuredTargets.size >
    (typeof elementId === 'string' && measuredTargets.has(elementId) ? 1 : 0)
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
    const prior = previous
      ? checkResults.select([{ checkId: id, revision: previous.revision }])[0]
      : undefined
    const retained =
      prior && !prior.retired && prior.recheck?.kind === 'measurement'
        ? prior.recheck.findings
        : []
    const knownFindings = [
      ...new Map(
        [...retained, ...findings].map((finding) => [
          JSON.stringify(finding),
          finding
        ])
      ).values()
    ]
    const evidence = JSON.stringify({
      complete: false,
      findings: knownFindings
    })
    measuredTargets.set(elementId, undefined)
    measurementPending = true
    checkResults.record(
      {
        id,
        origin: 'tool',
        status: knownFindings.length ? 'fail' : 'unverified',
        evidence,
        scope: [elementId],
        dependencies: { [id]: 'unavailable' }
      },
      { kind: 'measurement', elementId, findings: knownFindings }
    )
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
        isRecord(result) && Array.isArray(result.findings)
          ? result.findings
          : []
      )
      return
    }
    const findings = result.findings as unknown[]
    measuredTargets.set(elementId, stamp)
    checkResults.record(
      {
        id: measurementId(elementId),
        origin: 'tool',
        status: findings.length ? 'fail' : 'pass',
        evidence: JSON.stringify({ complete, findings }),
        scope: [elementId],
        dependencies: { [measurementId(elementId)]: JSON.stringify(stamp) }
      },
      { kind: 'measurement', elementId, findings }
    )
    measurementPending = false
    return stamp
  }
  const reconcileMeasurements = async (
    elementId: string,
    evidence: InspectionEvidenceStamp,
    coveredMeasurementTargets: unknown,
    signal?: AbortSignal
  ) => {
    if (!Array.isArray(coveredMeasurementTargets)) return
    const targets = [...new Set(coveredMeasurementTargets)].filter(
      (id): id is string =>
        typeof id === 'string' && id !== elementId && measuredTargets.has(id)
    )
    for (let offset = 0; offset < targets.length; offset += 64) {
      signal?.throwIfAborted()
      const ids = targets.slice(offset, offset + 64)
      const selected = checkResults.selection(ids.map(measurementId))
      const previous = new Map(ids.map((id) => [id, measuredTargets.get(id)]))
      const actionId = randomUUID()
      const resultText = await observeLocalToolExecution(
        AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
        {
          operation: 'reconcile-measurements',
          rootId: elementId,
          evidence,
          actionId,
          obligations: selected
        },
        async () => {
          const unavailable = (reason: string) =>
            JSON.stringify({
              status: 'partial',
              batchComplete: false,
              reason,
              reconciliation: ids.map((targetId, index) => ({
                targetId,
                oldRevision: selected[index].revision,
                disposition: 'unavailable'
              }))
            })
          let receipt: AiBatchReceipt
          try {
            receipt = await executeBatch({
              batchId: randomUUID(),
              actions: [
                {
                  id: actionId,
                  name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
                  arguments: { evidence, measurementTargets: ids },
                  summary: 'Reconciling covered layout checks'
                }
              ]
            })
          } catch {
            signal?.throwIfAborted()
            return unavailable('coverage-delivery-failed')
          }
          signal?.throwIfAborted()
          const matches = receipt.actionResults.filter(
            (item) =>
              item.actionId === actionId &&
              item.actionName === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
          )
          const result = matches.length === 1 ? matches[0].result : undefined
          if (
            receipt.failure ||
            !isRecord(result) ||
            result.current !== true ||
            !Array.isArray(result.measurements)
          )
            return unavailable('coverage-not-current-or-incomplete')
          const entries = result.measurements
          if (
            entries.length !== ids.length ||
            entries.some(
              (entry, i) => !isRecord(entry) || entry.elementId !== ids[i]
            )
          )
            return unavailable('coverage-target-identity-mismatch')
          const reconciliation: Record<string, unknown>[] = []
          for (let i = 0; i < ids.length; i++) {
            const id = ids[i]
            const entry = entries[i]
            const transition = {
              targetId: id,
              oldRevision: selected[i].revision
            }
            if (
              !measuredTargets.has(id) ||
              measuredTargets.get(id) !== previous.get(id)
            ) {
              reconciliation.push({ ...transition, disposition: 'superseded' })
              continue
            }
            try {
              checkResults.select([selected[i]])
            } catch {
              reconciliation.push({ ...transition, disposition: 'superseded' })
              continue
            }
            if (
              !isRecord(entry) ||
              entry.available !== true ||
              entry.complete !== true ||
              !Array.isArray(entry.findings)
            ) {
              reconciliation.push({
                ...transition,
                disposition: 'unavailable',
                reason: isRecord(entry) ? entry.reason : 'invalid-measurement'
              })
              continue
            }
            const stamp = inspectionStamp(entry.evidence)
            if (!stamp) {
              reconciliation.push({
                ...transition,
                disposition: 'unavailable',
                reason: 'missing-evidence'
              })
              continue
            }
            measuredTargets.set(id, stamp)
            const newRevision = checkResults.record(
              {
                id: measurementId(id),
                origin: 'tool',
                status: entry.findings.length ? 'fail' : 'pass',
                evidence: JSON.stringify({
                  complete: true,
                  findings: entry.findings
                }),
                scope: [id],
                dependencies: { [measurementId(id)]: JSON.stringify(stamp) }
              },
              { kind: 'measurement', elementId: id, findings: entry.findings }
            )
            reconciliation.push({
              ...transition,
              newRevision,
              evidence: stamp,
              disposition:
                newRevision === transition.oldRevision ? 'retained' : 'updated',
              status: entry.findings.length ? 'fail' : 'pass'
            })
          }
          return JSON.stringify({
            status: 'complete',
            batchComplete: true,
            reconciliation,
            counts: checkResults.deliver().counts
          })
        },
        {
          trace: options.observation?.trace,
          parentCallId: options.observation?.parentCallId
        },
        'Covered obligations retain or advance exact revisions; unavailable and superseded targets remain explicit.'
      )
      if (JSON.parse(resultText).batchComplete !== true) return
    }
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
  const imageCheck =
    options.referenceImages && options.validateReferences && canInspect
      ? createLocalImageCheck({
          results: checkResults,
          inspection: (id) => inspectionImages.get(id),
          validate: (id, signal) => validateEvidence([id], signal, false),
          reference: (index, use, region) => {
            const identity = options.validateReferences?.([index])[0]
            const image = options.referenceImages?.([index])[0]
            if (!identity || !image)
              throw new Error('Reference image is unavailable.')
            const resolved = designReview.resolveReferenceUse(
              use,
              'pixel-comparison'
            )
            if (
              resolved.receipt.referenceId !== identity.referenceId ||
              (resolved.region !== 'whole' &&
                (region.x < resolved.region.x ||
                  region.y < resolved.region.y ||
                  region.x + region.width >
                    resolved.region.x + resolved.region.width ||
                  region.y + region.height >
                    resolved.region.y + resolved.region.height))
            )
              throw new Error(
                'Pixel comparison is outside the explicitly selected reference use.'
              )
            return { referenceId: identity.referenceId, dataUrl: image.dataUrl }
          }
        })
      : undefined
  // Bound transport work independently from model input and scene size.
  const measurementBatchSize = 64
  const measure = async (
    elementIds: readonly string[],
    signal?: AbortSignal
  ) => {
    signal?.throwIfAborted()
    options.onInspection?.('running', AiActionNames.REVIEW_DESIGN)
    try {
      const actionResults: AiBatchReceipt['actionResults'][number][] = []
      const errors = new Map<string, string>()
      for (let offset = 0; offset < elementIds.length;) {
        signal?.throwIfAborted()
        const ids = elementIds.slice(offset, offset + measurementBatchSize)
        const actions = ids.map((elementId) => {
          return {
            id: randomUUID(),
            name: AiActionNames.REVIEW_DESIGN,
            arguments: {
              elementId,
              ...(hasOtherMeasuredTargets(elementId) || ids.length > 1
                ? { measurementTargets: 'descendants' }
                : {})
            },
            summary: 'Checking the layout'
          }
        })
        let receipt: AiBatchReceipt
        try {
          receipt = await executeBatch({ batchId: randomUUID(), actions })
        } catch (error) {
          signal?.throwIfAborted()
          if (
            !(error instanceof BrowserBatchExecutionError) ||
            !error.receipt
          ) {
            for (const id of ids) markMeasurementUnavailable(id)
            throw error
          }
          receipt = error.receipt
        }
        signal?.throwIfAborted()
        const failedIndex = receipt.failure
          ? actions.findIndex(
              (action) => action.id === receipt.failure?.actionId
            )
          : actions.length
        const completedPrefix =
          receipt.failure &&
          failedIndex >= 0 &&
          receipt.failure.stage === 'execution' &&
          receipt.failure.contextFresh === true
        const processed = completedPrefix ? failedIndex + 1 : actions.length
        for (let index = 0; index < processed; index++) {
          const action = actions[index]
          // A failed suffix cannot erase an earlier acknowledged read. Unknown
          // failure position cannot certify any member of the batch.
          const acknowledged =
            !receipt.failure || (failedIndex >= 0 && index < failedIndex)
          const result = {
            context: receipt.context,
            actionResults: receipt.actionResults.filter(
              (entry) => entry.actionId === action.id
            ),
            ...(!acknowledged ? { failure: receipt.failure } : {})
          }
          const stamp = updateMeasurementState(ids[index], result, action.id)
          const reviewed = result.actionResults[0]?.result
          if (stamp && isRecord(reviewed))
            await reconcileMeasurements(
              ids[index],
              stamp,
              reviewed.coveredMeasurementTargets,
              signal
            )
          if (measuredTargets.get(ids[index]))
            actionResults.push(...result.actionResults)
          else if (receipt.failure)
            errors.set(ids[index], receipt.failure.message)
        }
        // Only resume a suffix the canonical fail-fast executor did not run.
        // An unknown transport outcome leaves the chunk unverified instead.
        offset += processed
      }
      return { context: {}, actionResults, errors }
    } finally {
      options.onInspection?.('completed', AiActionNames.REVIEW_DESIGN)
    }
  }

  const measurementsCurrent = async (
    elementIds: readonly string[],
    signal?: AbortSignal
  ) => {
    const current = new Set<string>()
    const markStale = (id: string) => {
      measuredTargets.set(id, undefined)
      checkResults.invalidate(
        [measurementId(id)],
        'Canonical measurement dependencies changed or are unavailable.'
      )
    }
    const pending = elementIds.filter((id) => measuredTargets.get(id))
    if (
      !registered.some(
        (action) => action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      )
    ) {
      pending.forEach(markStale)
      return current
    }
    for (
      let offset = 0;
      offset < pending.length;
      offset += measurementBatchSize
    ) {
      signal?.throwIfAborted()
      const ids = pending.slice(offset, offset + measurementBatchSize)
      const actions = ids.map((id) => {
        const evidence = measuredTargets.get(id)
        if (!evidence)
          throw new Error(
            'Measurement dependencies disappeared before validation.'
          )
        return {
          id: randomUUID(),
          name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
          arguments: { evidence },
          summary: 'Checking layout evidence dependencies'
        }
      })
      let receipt: AiBatchReceipt | undefined
      try {
        receipt = await executeBatch({ batchId: randomUUID(), actions })
      } catch (error) {
        if (error instanceof BrowserBatchExecutionError) receipt = error.receipt
      }
      signal?.throwIfAborted()
      const failedIndex = receipt?.failure
        ? actions.findIndex(
            (action) => action.id === receipt?.failure?.actionId
          )
        : actions.length
      for (let index = 0; index < actions.length; index++) {
        const matches = receipt?.actionResults.filter(
          (entry) =>
            entry.actionId === actions[index].id &&
            entry.actionName === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
        )
        const result = matches?.length === 1 ? matches[0].result : undefined
        if (
          (!receipt?.failure || (failedIndex >= 0 && index < failedIndex)) &&
          isRecord(result) &&
          result.current === true
        )
          current.add(ids[index])
        else markStale(ids[index])
      }
    }
    return current
  }
  const checkMeasurements = async (
    targets: readonly string[],
    signal?: AbortSignal,
    compute = false
  ) => {
    if (!canReview) return
    const ids = [...new Set(targets)]
    const current = await measurementsCurrent(ids, signal)
    const missing = ids.filter((id) => !current.has(id))
    if (compute && missing.length) {
      await measure(missing, signal)
      for (const id of await measurementsCurrent(missing, signal))
        current.add(id)
    }
    measurementPending = !ids.length || current.size !== ids.length
  }

  const mechanicalChecks = createMechanicalChecks({
    requestId,
    store: checkResults,
    validate: measurementsCurrent,
    measure,
    refreshPrepared: async (signal, dependencies) => {
      if (!preparedReview)
        throw new Error('Prepared check owner is unavailable.')
      await preparedReview.refresh(signal, dependencies)
    }
  })
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
                dataUrl: image.dataUrl,
                target: elementId,
                region,
                imageScope: entry.result.imageScope,
                background: entry.result.background
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
    const ids = [...targets]
    const current = unavailableReason
      ? new Set<string>()
      : await measurementsCurrent(ids, signal)
    const missing = ids.filter((id) => !current.has(id))
    for (
      let offset = 0;
      offset < missing.length;
      offset += measurementBatchSize
    ) {
      signal.throwIfAborted()
      const chunk = missing.slice(offset, offset + measurementBatchSize)
      if (unavailableReason) {
        chunk.forEach((id) => markMeasurementUnavailable(id))
        continue
      }
      let message =
        'Mechanical checking did not complete; inspect this target again.'
      let errors: Map<string, string> | undefined
      try {
        const measurement = await measure(chunk, signal)
        errors = measurement.errors
        if (fullResponse) actionResults.push(...measurement.actionResults)
      } catch (error) {
        signal.throwIfAborted()
        message =
          error instanceof Error ? error.message : 'Mechanical checking failed.'
      }
      for (const elementId of chunk) {
        if (!measuredTargets.get(elementId))
          measurementIssues.push({
            elementId,
            message: errors?.get(elementId) ?? message,
            recovery:
              'Run review_design for this target; do not replay acknowledged writes.'
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

  const owner = {
    projectModelResult(name: string, args: unknown, value: unknown): unknown {
      if (!isRecord(value)) return value
      if (isRecord(value.executionResult))
        return {
          ...value,
          executionResult: owner.projectModelResult(
            name,
            args,
            value.executionResult
          )
        }
      if (!Array.isArray(value.actionResults)) return value
      const entries = value.actionResults.map((entry) => {
        if (!isRecord(entry) || typeof entry.actionName !== 'string')
          return entry
        const definition = registered.find(
          (action) => action.name === entry.actionName
        )
        return {
          ...entry,
          result:
            definition && 'delivery' in definition && definition.delivery
              ? projectToolDelivery(definition, entry.result)
              : entry.result
        }
      })
      const { modelResult: _modelResult, ...source } = value
      const projected = {
        ...source,
        actionResults: entries
      }
      return {
        ...projected,
        ...(value.toolOutcome
          ? { toolOutcome: localToolOutcome(projected) }
          : {})
      }
    },
    callInternal(
      name: string,
      args: unknown,
      signal: AbortSignal,
      inspectionTargets?: Set<string>
    ): Promise<string> {
      return execute(name, args, signal, inspectionTargets, true)
    },
    finishInspection,
    rejectInput(name: string, args: unknown) {
      return name === AiDesignToolIds.REVIEW_DRAWING
        ? reviewSupersessionRecovery(args)
        : undefined
    },
    validateReviewChecks(value: unknown) {
      const issue = operationInputIssue(value, reviewCaptureChecksSchema)
      if (issue) throw new LocalOperationPreparationError(issue)
      designReview.validateCaptureChecks('visual', [
        {
          checks: value as Parameters<
            typeof designReview.validateCaptureChecks
          >[1][number]['checks']
        }
      ])
    },
    validateCompletion: async (signal?: AbortSignal): Promise<void> => {
      if (!designReview.isAccepted()) return
      try {
        const completionIds = [
          ...new Set([
            ...designReview.evidenceEntries().map((entry) => entry.id),
            ...designReview.reviewEvidenceIds(),
            ...checkResults
              .dependencyKeys('inspection:')
              .map((key) => key.slice(11))
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
      ...(imageCheck ? [imageCheckDefinition] : []),
      ...(registered.length
        ? [
            checkResultsDefinition,
            verifyChecksDefinition,
            repairChecksDefinition
          ]
        : []),
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
              revision: 7,
              name: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              executionAccess: LocalToolAccess.INDEPENDENT,
              description:
                'Discover missing contracts. Prefer operations=["owner.method", ...] for known semantic operations; operation accepts one. names accepts exact action names, unique semantic identities or native tools (namespace.name disambiguates). Use the returned action name and execution route. With no selector returns categories; category gives a paginated scoped menu (includeSchemas=true includes schemas), query first resolves an exact registered name (including namespace.name or semantic operation); otherwise it searches capability names/descriptions. Exact hits preserve ambiguity and independent routes, without related descriptive matches. Use purpose terms or categories to explore related capabilities, not subjects or external reference material. Use native web research for missing subject facts/images. A menu explains what is available; exact names retrieve the selected contract. Follow next.arguments while complete=false; exact selectors preserve selection but oversized content still uses bounded contentDelivery. Use only one selector. Selection and representation are independent: view=usage or full works with exact, query and category selectors; query/category default to menus, exact selectors default to full. schemaPaths requires exact identities. The same schemaPaths list applies to EVERY selected identity, not a union across tools. For different fields issue separate independent per-tool queries; copy inputFields only from that entry usage. For field queries use the same-entry fieldQuery example; replace only schemaPaths with needed paths from its inputFields. The example selects one path, not all fields. Never transfer paths or selectors between entries. Selected mutation batch-action view=usage delivers the batch invocation, selected parameters, result constraints and recovery together; no parent contract read is needed. Other usage lists fields and branch roots. Usage is documentation, not a validation schema. Lookup success means all requested definitions were delivered; partial/failed means some/none were delivered, even when the read settlement is completed. A narrowerQuery recovers only valid requested paths, not the rejected scope. Each tool resolves its own paths; schemaResolution reports unavailable paths and compact root/branch navigation without discarding other tools or marking the failed scope delivered. Repeated reads return requested content; prior App output does not prove model receipt. Use refresh=true only to restore missing context or failed delivery, including incomplete field delivery. For missing fields use schemaPaths and refreshReason=missing-fields; refresh preserves that partial scope. Reuse the returned resultKey for selected retained contracts; request only missing fields instead of fetching every definition again. Full inputSchema and constraints remain available. Execute known contracts directly; no discovery prerequisite for every edit. Mutations accept new values and stable IDs. Follow each execution route: batch-action uses execute_design_batch; native-tool uses its namespace/tool. An action with argumentField=arguments wraps its action input in that native argument field. Explicit review and capture are native calls, never batch items. Exact final-response actions use the final response actions array, never a callable tool or batch item. Missing or ambiguous entries preserve unique matches and never select a similar route.',
              inputSchema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  registryRevision: {
                    type: 'integer',
                    minimum: 0,
                    description:
                      'Returned discovery catalog revision. On a changed catalog restart the selector without offset/revision.'
                  },
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
                      'usage with inputScope or an exact mutation batch-action selector returns its complete invocation, parameters, results, owner example and recovery. Read-only and exploratory usage returns purpose, route and field paths. Usage is schema-free documentation; full is the exact-selector default; category/query default to menus.'
                  },
                  inputScope: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['operation'],
                    properties: {
                      optionalInputs: {
                        type: 'array',
                        uniqueItems: true,
                        items: { type: 'string' },
                        description:
                          'Optional input groups published by this owner, such as plan when defining criteria in the same invocation. Omitted groups are outside the selected contract.'
                      },
                      operation: { type: 'string' },
                      nodeTypes: {
                        type: 'array',
                        minItems: 1,
                        uniqueItems: true,
                        items: { type: 'string' }
                      }
                    },
                    description:
                      'One exact native tool via names:[name] or query:name, including namespace.name; fuzzy search cannot select a scope. Select operation from its inputScopes and nodeTypes only when that owner publishes node choices; returns complete constraints for that subset with full output/recovery. Combine with view=usage for a complete actionable selected guide; omit view for full validation schemas. Cannot combine with schemaPaths. Full remains available for unrestricted composition.'
                  },
                  schemaPaths: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string', pattern: '^/' },
                    description:
                      'Exact names/operation only. The same paths apply independently to every identity; different per-tool fields require separate calls, which may run in parallel. JSON Pointers into inputSchema, e.g. /properties/items/items. Returns exact fragments and local reference dependencies, not a complete validation schema. Cannot combine with view; refresh preserves these exact paths.'
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
                      'Exact registered identity first (trimmed, case-sensitive, including namespace.name or semantic operation); otherwise operation-purpose terms such as fill, hierarchy or inspection search current action/native/saved descriptors. Exact hits do not expand through description references. Not subject names, photographs or reference-material search; use native web research for those. Mutually exclusive with names.'
                  }
                }
              }
            }
          ]
        : []),
      ...(registered.length ? [batchDefinition] : []),
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
      if (
        name === AiDesignToolIds.DESCRIBE_DESIGN_APIS &&
        'contentDelivery' in value
      )
        return operationInputIssue(value, informationDeliverySchema)
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
      if (name === AiDesignToolIds.CHECK_DRAWING_IMAGE)
        return operationInputIssue(value, imageCheckResultSchema)
      if (name === AiDesignToolIds.READ_DESIGN_CHECKS)
        return operationInputIssue(value, designCheckDeliverySchema)
      if (name === AiDesignToolIds.VERIFY_DESIGN_CHECKS)
        return operationInputIssue(value, mechanicalVerificationSchema)
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
          const followupActionCount =
            value.batchSummary.followupActionCount ?? 0
          if (
            !Number.isSafeInteger(followupActionCount) ||
            Number(followupActionCount) < 0
          )
            return 'Batch returned an invalid follow-up count'
          if (
            !value.failure &&
            value.actionResults.length !==
              Number(value.batchSummary.actionCount) +
                Number(followupActionCount)
          )
            return 'Batch acknowledgement count does not match executed actions'
        }
        return
      }
      if (!Array.isArray(value.apis) && !Array.isArray(value.categories))
        return 'API discovery omitted its menu or exact matches'
      if (
        value.complete !== undefined ||
        value.count !== undefined ||
        value.offset !== undefined ||
        value.next !== undefined
      ) {
        if (
          !Array.isArray(value.apis) ||
          (value.tools !== undefined && !Array.isArray(value.tools)) ||
          typeof value.complete !== 'boolean' ||
          !Number.isSafeInteger(value.offset) ||
          Number(value.offset) < 0 ||
          !Number.isSafeInteger(value.count) ||
          Number(value.count) < 0 ||
          Number(value.offset) +
            value.apis.length +
            (Array.isArray(value.tools) ? value.tools.length : 0) >
            Number(value.count)
        )
          return 'API discovery returned an invalid page boundary'
        const returned =
          value.apis.length +
          (Array.isArray(value.tools) ? value.tools.length : 0)
        const end = Number(value.offset) + returned
        if (
          value.complete !== (end === value.count) ||
          (value.complete && value.next !== undefined)
        )
          return 'API discovery completion disagrees with its page boundary'
        if (
          !value.complete &&
          (!returned ||
            !isRecord(value.next) ||
            value.next.tool !== AiDesignToolIds.DESCRIBE_DESIGN_APIS ||
            !isRecord(value.next.arguments) ||
            value.next.arguments.offset !== end ||
            discoveryInputIssue(value.next.arguments) !== undefined ||
            (value.next.arguments.category !== undefined &&
              !categoryChoices.includes(
                String(value.next.arguments.category)
              )) ||
            !Number.isSafeInteger(value.next.arguments.registryRevision) ||
            Number(value.next.arguments.registryRevision) < 0)
        )
          return 'API discovery omitted a usable continuation'
      }
    },
    resultOutcome: (name: string, value: unknown) => {
      const outcome = localToolOutcome(
        name === AiDesignToolIds.DESCRIBE_DESIGN_APIS &&
          isRecord(value) &&
          typeof value.complete === 'boolean'
          ? { ...value, complete: true }
          : value
      )
      // An acknowledged read is not a successful capture. This owner knows that
      // every capture failed; generic batch acknowledgement must not promote it.
      if (
        name === AiDesignToolIds.REVIEW_DRAWING &&
        isRecord(value) &&
        value.reviewOperation === 'capture' &&
        value.status === 'failed' &&
        value.settlement === 'completed' &&
        outcome.settlement === 'completed'
      )
        return { ...outcome, status: 'failed' as const }
      return outcome
    },
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal,
      inspectionTargets?: Set<string>,
      internal = false
    ): Promise<string> => {
      if (signal.aborted) throw new Error('Backend operation cancelled')
      if (name === AiDesignToolIds.REPAIR_DESIGN_CHECKS) {
        const issue = operationInputIssue(args, repairChecksSchema)
        if (issue || !isRecord(args))
          throw new LocalOperationPreparationError(issue)
        const { input, findings, targets } =
          await mechanicalChecks.repairSelection(
            { requestId: args.requestId, checks: args.checks },
            signal
          )
        const positions = (args.policy as { positions: PrescribedPosition[] })
          .positions
        const children = new Map<string, string>()
        for (const finding of findings) {
          const previous = children.get(finding.elementId)
          if (previous && previous !== finding.parentId)
            throw new LocalOperationPreparationError(
              'Conflicting parent identities in the selected findings.'
            )
          children.set(finding.elementId, finding.parentId)
        }
        if (
          positions.length !== children.size ||
          new Set(positions.map((item) => item.elementId)).size !==
            positions.length ||
          positions.some(
            (item) =>
              children.get(item.elementId) !== item.attachmentEvidence.parentId
          )
        )
          throw new LocalOperationPreparationError(
            'Prescribed positions must cover exactly the pending children and their original parents.'
          )
        const evidence = targets.map((id) => {
          const stamp = measuredTargets.get(id)
          if (!stamp)
            throw new LocalOperationPreparationError(
              'Mechanical evidence is unavailable before repair.'
            )
          return stamp
        })
        const result = JSON.parse(
          await owner.call(
            AiActionNames.APPLY_PRESCRIBED_POSITIONS,
            {
              arguments: { positions, evidence },
              inspection: 'defer',
              message: 'Applying prescribed positions to checked objects'
            },
            signal
          )
        )
        return JSON.stringify({
          ...result,
          requestId,
          checks: checkResults.selection(
            input.checks.map((item) => item.checkId)
          )
        })
      }
      if (name === AiDesignToolIds.VERIFY_DESIGN_CHECKS)
        return JSON.stringify(await mechanicalChecks.verify(args, signal))
      if (name === AiDesignToolIds.CHECK_DRAWING_IMAGE) {
        if (!imageCheck)
          throw new LocalOperationPreparationError(
            'Image checking is unavailable.'
          )
        return JSON.stringify(await imageCheck.call(args, signal))
      }
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
        const request = args as DesignCheckDeliveryOptions
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
        await measurementsCurrent([...targetIds], signal)
        const ids = dependencies
          ? [...dependencies]
              .filter((key) => key.startsWith('inspection:'))
              .map((key) => key.slice(11))
          : [
              ...new Set([
                ...designReview.reviewEvidenceIds(),
                ...checkResults
                  .dependencyKeys('inspection:')
                  .map((key) => key.slice(11))
              ])
            ]
        if (
          canInspect &&
          ids.length &&
          !(await validateEvidence(ids, signal, false)) &&
          isRecord(latestEvidenceValidation) &&
          latestEvidenceValidation.coherent === false
        )
          return JSON.stringify({
            ...checkResults.deliver(request),
            status: 'partial',
            evidenceValidation: latestEvidenceValidation
          })
        return JSON.stringify(checkResults.deliver(request))
      }
      if (name === AiDesignToolIds.REVIEW_PREPARED_DESIGN) {
        if (!preparedReview)
          throw new LocalOperationPreparationError(
            'Prepared review is unavailable.'
          )
        return JSON.stringify(await preparedReview.review(args, signal))
      }
      if (name === AiDesignToolIds.DESCRIBE_DESIGN_APIS) {
        const inputIssue = discoveryInputIssue(args)
        if (inputIssue || !isRecord(args))
          throw new LocalOperationPreparationError(
            inputIssue ?? 'Expected discovery arguments'
          )
        if (
          args.registryRevision !== undefined &&
          args.registryRevision !== discoveryRevision()
        )
          throw new LocalOperationPreparationError(
            'Discovery registry changed; restart this selector at offset 0 without registryRevision.'
          )
        const apis = [...admittedApisByName.values()]
        const details = (api: (typeof apis)[number], includeSchema = true) => {
          const contract = getBasicApiContract(api.name)
          const dependencies = nativeInventory().filter(
            (tool) =>
              !finalActions.has(api.name) &&
              tool.name === api.name &&
              tool.composition === 'allowed' &&
              tool.registeredName &&
              (!contract || isCanonicalWrapper(tool, api))
          )
          const dependency =
            dependencies.length === 1 ? dependencies[0] : undefined
          const recipeDependency = dependency
            ? {
                name: dependency.registeredName,
                revision: dependency.revision,
                execution: nativeExecution(dependency),
                definition: {
                  tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                  arguments: { names: [dependency.registeredName] }
                }
              }
            : undefined
          const descriptor = {
            ...api,
            execution: actionExecution(api),
            ...(recipeDependency ? { recipeDependency } : {}),
            operation: contract ? contract.operation : api.name,
            category: contract ? contract.category : 'design',
            ...(contract
              ? { effect: contract.effect, result: contract.result }
              : {})
          }
          if (!includeSchema)
            return {
              name: descriptor.name,
              description: descriptor.description,
              ...('revision' in api ? { revision: api.revision } : {}),
              operation: descriptor.operation,
              category: descriptor.category,
              effect: descriptor.effect,
              result: descriptor.result,
              execution: descriptor.execution,
              ...(descriptor.execution.kind === 'batch-action' &&
              'effect' in api &&
              api.effect === 'mutation'
                ? {
                    usage: {
                      tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                      arguments: {
                        operations: [descriptor.operation],
                        view: 'usage'
                      }
                    }
                  }
                : {}),
              ...(recipeDependency ? { recipeDependency } : {})
            }
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
            args,
            { operations: [descriptor.operation] }
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
              execution: actionExecution(api)
            }))
        }
        const pageBoundary = (count: number) => {
          const offset = Number(args.offset ?? 0)
          if (offset > count)
            throw new LocalOperationPreparationError(
              'Discovery offset is beyond the current result; restart this selector at offset 0.'
            )
          const end = Math.min(offset + definitionPageSize, count)
          const continuation: Record<string, unknown> = {
            ...args,
            offset: end,
            registryRevision: discoveryRevision()
          }
          if (continuation.includeSchemas === false)
            delete continuation.includeSchemas
          return {
            complete: end === count,
            count,
            offset,
            ...(end < count
              ? {
                  next: {
                    tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                    arguments: continuation
                  }
                }
              : {})
          }
        }
        const pageOf = (entries: typeof apis, includeSchema: boolean) => {
          const page = pageBoundary(entries.length)
          return {
            ...page,
            apis: entries
              .slice(page.offset, page.offset + definitionPageSize)
              .map((api) => details(api, includeSchema))
          }
        }
        const queryName =
          typeof args.query === 'string' ? args.query.trim() : undefined
        const exactQuery =
          queryName !== undefined &&
          (admittedApisByName.has(queryName) ||
            admittedApisByOperation.has(queryName) ||
            nativeMatches(queryName).length > 0)
        if (
          args.inputScope !== undefined &&
          queryName !== undefined &&
          !exactQuery
        )
          throw new LocalOperationPreparationError(
            'inputScope requires one exact native tool via names:[name] or query:name. Omit inputScope to search capabilities, then select an exact returned native name; do not apply a scope to fuzzy matches.'
          )
        if (exactQuery && Number(args.offset ?? 0) !== 0)
          throw new LocalOperationPreparationError(
            'Exact query has no inventory continuation; restart at offset 0.'
          )
        if (Array.isArray(args.names) || exactQuery) {
          const names = Array.isArray(args.names)
            ? [...new Set(args.names as string[])]
            : [queryName as string]
          const includeDefinition =
            !exactQuery ||
            args.view !== undefined ||
            args.inputScope !== undefined
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
          if (
            args.inputScope !== undefined &&
            !ambiguousNames.length &&
            !missingNames.length &&
            tools.length !== 1
          )
            throw new LocalOperationPreparationError(
              'inputScope requires one exact native tool, not an action-only identity. Omit inputScope for this action contract; use its returned execution route.'
            )
          return JSON.stringify({
            apis: selected.map((api) => details(api, includeDefinition)),
            tools: tools.map((tool) =>
              includeDefinition
                ? nativeDefinition(tool, args)
                : nativeMenu(tool)
            ),
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
            const page = pageBoundary(inventory.length)
            const tools = inventory
              .slice(page.offset, page.offset + definitionPageSize)
              .map((tool) =>
                args.view !== undefined ||
                args.includeSchemas === true ||
                args.refresh === true
                  ? nativeDefinition(tool, args)
                  : nativeMenu(tool)
              )
            return JSON.stringify({
              category: nativeCategory,
              apis: [],
              tools,
              ...page
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
              args.view !== undefined ||
                args.includeSchemas === true ||
                args.refresh === true
            )
          })
        }
        if (args.query === undefined)
          return JSON.stringify({
            categories,
            catalogSize: apis.length,
            guidance: discoveryGuidance
          })
        const normalize = (value: string) =>
          value
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .normalize('NFKC')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .trim()
        const terms = normalize(String(args.query)).split(' ').filter(Boolean)
        const matchesTerms = (name: string, description: string) => {
          const descriptor = normalize(`${name} ${description}`)
          return terms.every((term) => descriptor.includes(term))
        }
        const matches = apis.filter((api) =>
          matchesTerms(api.name, api.description)
        )
        const native = nativeInventory().filter((tool) => {
          if (!matchesTerms(tool.name, tool.description)) return false
          // Compact views expose this wrapper via recipeDependency. Full
          // views retain both independently executable contracts.
          const represented =
            args.view !== 'full' &&
            args.includeSchemas !== true &&
            matches.some(
              (api) =>
                isCanonicalWrapper(tool, api) &&
                tool.composition === 'allowed' &&
                nativeMatches(api.name).filter((candidate) =>
                  isCanonicalWrapper(candidate, api)
                ).length === 1
            )
          return !represented
        })
        const inventory = [
          ...matches.map((api) => ({ api })),
          ...native.map((tool) => ({ tool }))
        ]
        const page = pageBoundary(inventory.length)
        const selected = inventory.slice(
          page.offset,
          page.offset + definitionPageSize
        )
        return JSON.stringify({
          catalogSize: apis.length,
          guidance: discoveryGuidance,
          ...(inventory.length
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
          apis: selected.flatMap((entry) =>
            'api' in entry ? [details(entry.api, args.view !== undefined)] : []
          ),
          tools: selected.flatMap((entry) =>
            'tool' in entry
              ? [
                  args.view !== undefined
                    ? nativeDefinition(entry.tool, args)
                    : nativeMenu(entry.tool)
                ]
              : []
          ),
          ...page
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
        if (
          name === AiDesignToolIds.SELECT_DESIGN_REFERENCES &&
          options.prepareReferences
        ) {
          const decisions = Array.isArray(reviewArgs.referenceDecisions)
            ? reviewArgs.referenceDecisions
            : []
          const neededIds = decisions
            .filter(
              (decision) => Array.isArray(decision.uses) && decision.uses.length
            )
            .map((decision) => decision.referenceId as string)
          try {
            // Resolve every selected/declared identity before decoding or mutating review state.
            options.validateReferences?.(
              reviewArgs.referenceImageIndexes as number[],
              decisions.map((decision) => decision.referenceId as string)
            )
            const needed = options.validateReferences?.([], neededIds) ?? []
            if (needed.length) {
              const prepared = JSON.parse(
                await options.prepareReferences(
                  needed.map((reference) => reference.attachmentIndex),
                  signal
                )
              )
              const failed = prepared.references.filter(
                (reference: { validation: { validity: string } }) =>
                  reference.validation.validity !== 'decoded'
              )
              if (failed.length)
                throw new Error(
                  `Reference preparation failed: ${JSON.stringify(failed)}. Selection and prior evidence are unchanged. Retry failed attachmentIndexes with validate_reference_images or replace invalid sources, then resubmit the selection; successful preparations are retained. Do not redraw.`
                )
            }
            signal.throwIfAborted()
          } catch (error) {
            signal.throwIfAborted()
            throw new LocalOperationPreparationError(
              error instanceof Error
                ? error.message
                : 'Reference preparation failed'
            )
          }
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
            const result = candidate
              ? designReview.recordBoundReview(reviewArgs)
              : designReview.record(reviewArgs)
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
        if (
          [
            reviewArgs.inspections,
            reviewArgs.bindChecks,
            reviewArgs.checks
          ].filter((value) => value !== undefined).length !== 1
        )
          throw new LocalOperationPreparationError(
            'Choose exactly one review operation: inspections, bindChecks or bound checks.'
          )
        const targets = reviewArgs.inspections as
          | {
              elementId: string
              view?: 'overview' | 'detail'
              region?: unknown
              checks: {
                criterionId: string
                unitId?: string
                supersedes?: { revision: number; reason: string }
              }[]
            }[]
          | undefined
        let reviewOperation: 'capture' | 'bind' | 'record' = 'record'
        if (reviewArgs.inspections) reviewOperation = 'capture'
        else if (reviewArgs.bindChecks) reviewOperation = 'bind'
        const phase = reviewArgs.phase as 'structure' | 'visual'
        if (targets?.length) designReview.validateCaptureChecks(phase, targets)
        const selections = new Map<
          string,
          {
            criterionId: string
            unitId?: string
            supersedes?: { revision: number; reason: string }
            inspectionIds: string[]
          }
        >()
        const inspectionIds = reviewInspectionIds(reviewArgs)
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
            accepted: designReview.isAccepted(),
            reviewOperation,
            recordedChecks: [],
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
        const hasReusedImages = inspectionIds.length > 0
        delete reviewArgs.inspections
        const capturedResults: AiBatchReceipt['actionResults'][number][] = []
        const failedInspections: {
          inspection: NonNullable<typeof targets>[number]
          message: string
          code?: string
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
            for (const check of target.checks) {
              const key = JSON.stringify([check.criterionId, check.unitId])
              const selected = selections.get(key)
              if (selected) {
                if (
                  JSON.stringify(selected.supersedes) !==
                  JSON.stringify(check.supersedes)
                )
                  throw new LocalOperationPreparationError(
                    'Conflicting supersession declarations for one capture check.'
                  )
                if (!selected.inspectionIds.includes(id))
                  selected.inspectionIds.push(id)
              } else selections.set(key, { ...check, inspectionIds: [id] })
            }
          } else {
            failedInspections.push({
              inspection: target,
              ...(isRecord(result) && typeof result.code === 'string'
                ? { code: result.code }
                : {}),
              message:
                isRecord(result) && typeof result.message === 'string'
                  ? result.message
                  : 'Capture did not return a usable image with document evidence. Inspect this target again.'
            })
          }
        }
        if (targets?.length) reviewArgs.inspectionIds = inspectionIds
        if (failedInspections.length) {
          const message =
            'Required captures are unavailable. Retry corrected failedInspections targets as inspections; include inspectionIds only when the returned list is nonempty. Assessment has not run.'
          designReview.requireReview(message)
          const readsCompleted =
            capturedResults.length === targets?.length &&
            capturedResults.every(
              ({ result }) =>
                isRecord(result) &&
                isRecord(result.toolOutcome) &&
                result.toolOutcome.settlement === 'completed'
            )
          return JSON.stringify({
            available: false,
            status: inspectionIds.length ? 'partial' : 'failed',
            ...(readsCompleted ? { settlement: 'completed' } : {}),
            phase: reviewArgs.phase,
            accepted: designReview.isAccepted(),
            reviewOperation,
            recordedChecks: [],
            inspectionIds,
            failedInspections,
            ...designReview.judgmentHandoff(
              inspectionIds,
              reviewArgs.phase as 'structure' | 'visual'
            ),
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
            accepted: designReview.isAccepted(),
            reviewOperation,
            recordedChecks: [],
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
          signal.throwIfAborted()
          const handoff = designReview.judgmentHandoff(
            inspectionIds,
            phase,
            hasReusedImages ? undefined : [...selections.values()]
          )
          return JSON.stringify({
            phase: reviewArgs.phase,
            accepted: designReview.isAccepted(),
            reviewOperation,
            recordedChecks: [],
            inspectionIds,
            actionResults: capturedResults,
            ...handoff,
            ...(handoff.status === 'failed'
              ? { status: 'partial', settlement: 'partial' }
              : {}),
            message:
              handoff.message ??
              'Inspect the returned images, then submit primary-agent findings with these inspectionIds and no new capture targets. Supplied judgments were not recorded before the images were delivered.'
          })
        }
        if (Array.isArray(reviewArgs.bindChecks)) {
          if (!(await validateEvidence(inspectionIds, signal, false)))
            return JSON.stringify(unavailableEvidence())
          signal.throwIfAborted()
          return JSON.stringify({
            phase,
            reviewOperation,
            recordedChecks: [],
            accepted: designReview.isAccepted(),
            inspectionIds,
            ...designReview.judgmentHandoff(
              inspectionIds,
              phase,
              reviewArgs.bindChecks as Parameters<
                typeof designReview.bindReview
              >[1]
            )
          })
        }
        let candidateReview
        try {
          candidateReview = designReview.validateBoundReview(reviewArgs)
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
            status: 'partial',
            results: designReview.deliverChecks(),
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
            message,
            next: {
              tool: AiDesignToolIds.READ_DESIGN_CHECKS,
              arguments: {
                ids: designReview
                  .overviewTargets(effectiveIds)
                  .map(measurementId)
                  .filter((id) =>
                    checkResults
                      .read({ ids: [id], includePassed: true })
                      .items.some((item) => item.status !== 'pass')
                  )
              },
              instruction:
                'Read the retained mechanical findings for these exact targets. Resolve only the reported cause, then verify the existing checks. Keep current images and visual judgments; never redraw, recapture current evidence or replay settled edits.'
            }
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
        const submitted = new Map(
          batchActions.map((action) => [action.id, action])
        )
        if (args.response !== 'full' && operationArguments.response !== 'full')
          value = {
            ...value,
            actionResults: value.actionResults.map((entry) => {
              const original = submitted.get(entry.actionId)?.arguments
              if (
                entry.actionName !== AiActionNames.REVIEW_DESIGN ||
                (isRecord(original) &&
                  original.measurementTargets !== undefined) ||
                !isRecord(entry.result) ||
                !('coveredMeasurementTargets' in entry.result)
              )
                return entry
              // Automatic reconciliation has already consumed this internal scope.
              // The observed browser receipt retains it for diagnostics/recovery.
              const { coveredMeasurementTargets: _coverage, ...result } =
                entry.result
              return { ...entry, result }
            })
          }
        const followupActionCount = value.actionResults.filter(
          (entry) => !submitted.has(entry.actionId)
        ).length
        const { context: _context, ...rest } = value
        const output = batchMode
          ? {
              ...rest,
              batchSummary: {
                operationCount: (args.operations as unknown[]).length,
                actionCount: batchActions.length,
                ...(followupActionCount ? { followupActionCount } : {})
              }
            }
          : value
        const projected = owner.projectModelResult(name, args, output)
        if (!internal) return JSON.stringify(projected)
        if (
          !batchMode &&
          definition &&
          'delivery' in definition &&
          definition.delivery
        )
          return JSON.stringify({ ...output, modelResult: projected })
        return JSON.stringify(output)
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
          actions: batchActions.map((action) => {
            const args = action.arguments
            return {
              ...action,
              ...(action.name === AiActionNames.REVIEW_DESIGN &&
              isRecord(args) &&
              hasOtherMeasuredTargets(args.elementId) &&
              args.measurementTargets === undefined
                ? { arguments: { ...args, measurementTargets: 'descendants' } }
                : {}),
              summary: message
            }
          })
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
        if (
          name === AiActionNames.REVIEW_DESIGN &&
          typeof operationArguments.elementId === 'string'
        )
          value = {
            ...value,
            mechanicalSelection: {
              requestId,
              checks: checkResults.selection([
                measurementId(operationArguments.elementId)
              ])
            }
          }
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
              recovery: batchFailureRecovery,
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
        const stamp = updateMeasurementState(
          operationArguments.elementId,
          receipt,
          prepared.actions[0].id
        )
        const reviewed = receipt.actionResults.find(
          (item) => item.actionId === prepared.actions[0].id
        )?.result
        if (stamp && isRecord(reviewed))
          await reconcileMeasurements(
            operationArguments.elementId,
            stamp,
            reviewed.coveredMeasurementTargets,
            signal
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
            matches.length === 0 &&
            receipt.failure?.settlement === 'not-started' &&
            receipt.failure.actionId === submitted.id &&
            receipt.failure.actionName === submitted.name
          )
            continue
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
  const execute = owner.call.bind(owner)
  const definitions = owner.definitions.map((definition) =>
    definition.name === AiDesignToolIds.DESCRIBE_DESIGN_APIS
      ? {
          ...definition,
          description:
            definition.description +
            ' Redisplay selected saved contracts with `describe_design_apis({ names, fromResult: previous.resultKey })`; only names and contentPage may accompany fromResult. Preserves the saved view/scope and full entry constraints; menus/fragments stay incomplete. Missing/stale keys require an ordinary selected query without fromResult, never replay writes. ' +
            informationDeliveryInstructions,
          inputSchema: {
            ...definition.inputSchema,
            properties: {
              ...definition.inputSchema.properties,
              contentPage: contentPageSchema,
              fromResult: { type: 'string', minLength: 1, maxLength: 128 }
            }
          },
          outputSchema: {
            anyOf: [definition.outputSchema, informationDeliverySchema]
          },
          partialOutputSchema: {
            anyOf: [definition.partialOutputSchema, informationDeliverySchema]
          }
        }
      : definition
  )
  const deliveredOwner = {
    ...owner,
    definitions,
    callInternal(
      name: string,
      args: unknown,
      signal: AbortSignal,
      inspectionTargets?: Set<string>
    ): Promise<string> {
      return name === AiDesignToolIds.DESCRIBE_DESIGN_APIS
        ? deliveredCall(name, args, signal, inspectionTargets)
        : owner.callInternal(name, args, signal, inspectionTargets)
    },
    call: async (
      ...parameters: Parameters<typeof execute>
    ): Promise<string> => {
      const [name, args, signal] = parameters
      if (name !== AiDesignToolIds.DESCRIBE_DESIGN_APIS)
        return execute(...parameters)
      signal.throwIfAborted()
      if (!isRecord(args)) return execute(...parameters)
      const { contentPage, ...query } = args
      if (contentPage !== undefined) {
        const issue = operationInputIssue(contentPage, contentPageSchema)
        if (issue) throw new LocalOperationPreparationError(issue)
      }
      if (args.fromResult === undefined) {
        const issue = discoveryInputIssue(query)
        if (issue) throw new LocalOperationPreparationError(issue)
      }
      const keyQuery = { ...query }
      if (keyQuery.includeSchemas === false) delete keyQuery.includeSchemas
      const key = JSON.stringify(
        Object.keys(keyQuery)
          .sort()
          .map((key) => [key, keyQuery[key]])
      )
      const revision = discoveryRevision()
      let retained = returnedDefinitions.get(key)
      let selection: Record<string, unknown> | undefined
      if (args.fromResult !== undefined) {
        if (
          typeof args.fromResult !== 'string' ||
          !args.fromResult ||
          args.fromResult.length > 128 ||
          !Array.isArray(args.names) ||
          !args.names.length ||
          args.names.some((name) => typeof name !== 'string' || !name) ||
          Object.keys(args).some(
            (name) => !['fromResult', 'names', 'contentPage'].includes(name)
          )
        )
          throw new LocalOperationPreparationError(
            'fromResult requires exact names and optional contentPage only; use an ordinary selected query for a new view/scope.'
          )
        const original = [...returnedDefinitions.values()].find(
          (value) => value.resultKey === args.fromResult
        )
        if (!original || original.registryRevision !== revision)
          throw new LocalOperationPreparationError(
            'Retained discovery result is missing or stale. Repeat only the selected query without fromResult; never replay writes.'
          )
        if (!retained) {
          const apis: Record<string, unknown>[] = []
          const tools: Record<string, unknown>[] = []
          const missingNames: string[] = []
          const ambiguousNames: { name: string; candidates: string[] }[] = []
          const savedApis = Array.isArray(original.value.apis)
            ? original.value.apis.filter(isRecord)
            : []
          const savedTools = Array.isArray(original.value.tools)
            ? original.value.tools.filter(isRecord)
            : []
          for (const name of new Set(args.names as string[])) {
            const matches = (entry: Record<string, unknown>) =>
              [
                entry.name,
                entry.operation,
                entry.registeredName,
                ...(typeof entry.namespace === 'string'
                  ? [entry.namespace + '.' + entry.name]
                  : [])
              ].includes(name)
            const matchedApis = savedApis.filter(matches)
            const matchedTools = savedTools.filter(matches)
            const oldAmbiguity = Array.isArray(original.value.ambiguousNames)
              ? original.value.ambiguousNames
                  .filter(isRecord)
                  .find((entry) => entry.name === name)
              : undefined
            if (
              oldAmbiguity ||
              matchedApis.length > 1 ||
              matchedTools.length > 1
            ) {
              ambiguousNames.push({
                name,
                candidates:
                  oldAmbiguity && Array.isArray(oldAmbiguity.candidates)
                    ? oldAmbiguity.candidates.filter(
                        (value): value is string => typeof value === 'string'
                      )
                    : [
                        ...matchedApis.map((entry) => String(entry.name)),
                        ...matchedTools.map(
                          (entry) => entry.namespace + '.' + entry.name
                        )
                      ]
              })
            } else if (!matchedApis.length && !matchedTools.length)
              missingNames.push(name)
            else {
              apis.push(...matchedApis)
              tools.push(...matchedTools)
            }
          }
          selection = {
            apis: [...new Set(apis)],
            tools: [...new Set(tools)],
            missingNames,
            ...(ambiguousNames.length ? { ambiguousNames } : {}),
            ...(missingNames.length || ambiguousNames.length
              ? {
                  message:
                    'Not all requested identities are available in this saved result. Use ordinary exact qualified names without fromResult for missing contracts; never replay writes.'
                }
              : {})
          }
        }
      }
      if (
        contentPage !== undefined &&
        (!retained || retained.registryRevision !== revision)
      )
        throw new LocalOperationPreparationError(
          'Content continuation expired or registry changed; restart the original read.'
        )
      if (
        !retained ||
        retained.registryRevision !== revision ||
        (args.refresh === true && contentPage === undefined)
      ) {
        const value: Record<string, unknown> =
          selection ?? JSON.parse(await execute(name, query, signal))
        signal.throwIfAborted()
        const receipt = discoveryReceipt(value)
        const resultKey = randomBytes(16).toString('base64url')
        const published = { ...value, ...receipt, resultKey }
        const text = JSON.stringify(published)
        retained = {
          text,
          resultKey,
          value: published,
          registryRevision: revision,
          receipt
        }
        if (returnedDefinitions.size >= 64) {
          if (args.fromResult === undefined) returnedDefinitions.clear()
          else
            for (const [entryKey, entry] of returnedDefinitions) {
              if (entry.resultKey === args.fromResult) continue
              returnedDefinitions.delete(entryKey)
              break
            }
        }
        returnedDefinitions.set(key, retained)
      }
      return deliverInformation(
        retained.text,
        name,
        args,
        requestId,
        retained.receipt
      )
    }
  }
  const deliveredCall = deliveredOwner.call.bind(deliveredOwner)
  return deliveredOwner
}

export const localToolResultInstructions =
  informationDeliveryInstructions +
  `
Call registered tools directly with their JSON arguments. Use native tool discovery to obtain a missing callable declaration; use the App's describe_design_apis for its selected usage and constraints. Tool replies directly contain structured receipt text and any images; inspect these results without manually forwarding or transforming them.
Use existing resultKey/fromResult, artifactId, snapshotId and inspectionId references only where the selected tool advertises them. Missing or stale retained data requires that owner's read/refresh recovery. Never repeat a completed mutation or image capture merely to recover its output. Interpret toolOutcome and partial results independently from transport completion; preserve completed steps and recover only remaining work.
For visual decisions inspect the delivered images. Bind retained inspectionIds with review_drawing bindChecks when criteria are ready; preserve current bindings. Display is not recapture, binding or visual approval.`

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
