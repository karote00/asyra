import sharp from 'sharp'
import type {
  VisualAssessment,
  VisualAssessmentContext,
  VisualAssessmentInput
} from './local-visual-assessment'
import {
  LocalToolInputError,
  type LocalToolDefinition
} from './local-tool-invocation'
import type { InspectionEvidenceStamp } from '../src/ai/inspection-evidence'
import { operationInputIssue } from './operation-input-schema'
import { LocalToolAccess } from './local-tool-scheduler'
import {
  basicApiContracts,
  getBasicApiContract
} from '../src/ai/basic-api-catalog'
import { prepareOperationBatch } from './local-operation-batch'
import {
  createLocalDesignReview,
  designReviewDefinition
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
export class LocalOperationPreparationError extends LocalToolInputError {
  constructor(message?: string) {
    super(
      message ??
        'Drawing preparation rejected these arguments before any canvas changes. Check the supplied operation schema, use a valid artifact from this request, valid target bounds and only supported fields. Component conversions require matching analysis receipts; omit optional mappings and analysisIds when no conversion is selected. Correct the arguments and reuse the prepared artifact; do not invent replacement paths or repeat unchanged arguments.'
    )
  }
}

export interface NativeToolDescriptor extends LocalToolDefinition {
  namespace: string
  description: string
}

export interface LocalActionPreparation {
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
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.INSPECT_DRAWING,
    AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
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
        `Unknown schema path: ${path}. Request the full definition to inspect available paths.`
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
  return {
    schemaFragments: fragments,
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
    ? { sessionId: value.sessionId, revision: Number(value.revision) }
    : undefined
const sameEvidence = (
  left?: InspectionEvidenceStamp,
  right?: InspectionEvidenceStamp
) =>
  !!left &&
  !!right &&
  left.sessionId === right.sessionId &&
  left.revision === right.revision

/** Tool-specific preparation stays on the server; only canonical receipts return to the model. */
export const createLocalOperationTools = (
  actions: AiProviderInput['actions'],
  preparation: LocalActionPreparation,
  executeBatch: (batch: AiActionBatch) => Promise<AiBatchReceipt>,
  options: {
    reviewTargetId?: string
    getNativeTools?: () => NativeToolDescriptor[]
    assessVisual?: (
      input: VisualAssessmentContext & {
        phase: 'structure' | 'visual'
        images: VisualAssessmentInput['images']
      },
      signal: AbortSignal
    ) => Promise<VisualAssessment>
    onInspection?: (status: 'running' | 'completed') => void
  } = {}
) => {
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
      arguments: { names: [identity], refresh: true }
    }
    if (args.view === 'usage' || Array.isArray(args.schemaPaths)) {
      const projection =
        args.view === 'usage'
          ? { ...usage, inputFields: inputFieldPaths(inputSchema) }
          : {
              ...reference,
              ...schemaFragments(inputSchema, args.schemaPaths as string[])
            }
      return {
        ...projection,
        definition: {
          revision,
          state: 'included',
          coverage: args.view === 'usage' ? 'usage' : 'partial',
          availableInResponse: true,
          nextAction: 'use-response-or-request-full-contract',
          refresh
        }
      }
    }
    const repeated =
      args.refresh !== true && returnedDefinitions.get(identity) === revision
    returnedDefinitions.set(identity, revision)
    return {
      ...(repeated ? reference : descriptor),
      definition: {
        revision,
        state: repeated ? 'previously-returned' : 'included',
        coverage: repeated ? 'reference' : 'full',
        availableInResponse: !repeated,
        nextAction: repeated
          ? 'reuse-or-refresh-if-missing'
          : 'use-current-response',
        refresh
      }
    }
  }
  const categoryChoices = [...admittedApiCategories.keys()]
  const lookupRecovery = `Available categories: ${categoryChoices.join(', ')}. Select one category for its admitted operation menu. Exact names may also identify native tools; use their returned execution route.`
  // Resolve lazily after the provider has assembled all native tool groups.
  // The definitions and index live for this request only.
  let nativeToolsByName: Map<string, NativeToolDescriptor[]> | undefined
  const nativeMatches = (name: string): NativeToolDescriptor[] => {
    if (!nativeToolsByName) {
      nativeToolsByName = new Map()
      for (const tool of options.getNativeTools?.() ?? []) {
        for (const key of [tool.name, `${tool.namespace}.${tool.name}`]) {
          const matches = nativeToolsByName.get(key) ?? []
          matches.push(tool)
          nativeToolsByName.set(key, matches)
        }
      }
    }
    return nativeToolsByName.get(name) ?? []
  }
  const designReview = createLocalDesignReview({
    independentAssessment: !!options.assessVisual
  })
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
  let measurementEvidence: InspectionEvidenceStamp | undefined
  const unresolvedTextOverflow = new Set<string>()
  const canReview = registered.some(
    (action) => action.name === AiActionNames.REVIEW_DESIGN
  )
  const updateMeasurementState = (receipt: AiBatchReceipt) => {
    const review = receipt.actionResults.find(
      (entry) => entry.actionName === AiActionNames.REVIEW_DESIGN
    )
    if (
      review &&
      isRecord(review.result) &&
      Array.isArray(review.result.findings)
    ) {
      if (Array.isArray(review.result.measuredTextIds)) {
        for (const id of review.result.measuredTextIds)
          if (typeof id === 'string') unresolvedTextOverflow.delete(id)
      }
      for (const finding of review.result.findings) {
        if (isRecord(finding) && finding.kind === 'text-overflow')
          unresolvedTextOverflow.add(
            typeof finding.elementId === 'string'
              ? finding.elementId
              : 'unidentified-text'
          )
      }
    }
  }
  const canInspect = registered.some(
    (action) => action.name === AiActionNames.INSPECT_DRAWING
  )
  let latestEvidenceValidation: unknown
  const validateEvidence = async (ids?: unknown, signal?: AbortSignal) => {
    latestEvidenceValidation = {
      current: false,
      reason: 'Inspection evidence is unavailable.'
    }
    signal?.throwIfAborted()
    const evidence = designReview.evidenceFor(ids)
    if (
      !evidence ||
      !registered.some(
        (action) => action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      )
    )
      return false
    const requiredIds = [
      ...new Set([...reviewScope, ...designReview.factTargets()])
    ]
    const actionId = randomUUID()
    const receipt = await executeBatch({
      batchId: randomUUID(),
      actions: [
        {
          id: actionId,
          name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
          arguments: {
            evidence,
            ...(requiredIds.length
              ? {
                  scope: {
                    requiredIds,
                    overviewIds: designReview.overviewTargets(ids)
                  }
                }
              : {})
          },
          summary: 'Checking inspection freshness'
        }
      ]
    })
    signal?.throwIfAborted()
    latestEvidenceValidation = receipt.actionResults.find(
      (entry) => entry.actionId === actionId
    )?.result
    const current = receipt.actionResults.some(
      (entry) =>
        entry.actionId === actionId &&
        entry.actionName === AiActionNames.VALIDATE_INSPECTION_EVIDENCE &&
        isRecord(entry.result) &&
        entry.result.current === true
    )
    if (!current) {
      inspectionImages.clear()
      designReview.mutate()
      return false
    }
    const validation = receipt.actionResults.find(
      (entry) => entry.actionId === actionId
    )?.result
    if (
      requiredIds.length &&
      (!isRecord(validation) ||
        !isRecord(validation.coverage) ||
        validation.coverage.complete !== true)
    )
      throw new LocalOperationPreparationError(
        'Current overview images do not cover the requested drawing. Inspect the containing group or all remaining drawing roots; unrelated targets and detail crops cannot establish overall coverage.'
      )
    if (
      canReview &&
      designReview
        .overviewTargets(ids)
        .some((id) => !sameEvidence(measuredTargets.get(id), evidence))
    ) {
      measurementPending = true
    }
    return true
  }
  const measure = async (elementId: string, signal?: AbortSignal) => {
    signal?.throwIfAborted()
    const receipt = await executeBatch({
      batchId: randomUUID(),
      actions: [
        {
          id: randomUUID(),
          name: AiActionNames.REVIEW_DESIGN,
          arguments: { elementId },
          summary: 'Checking the layout'
        }
      ]
    })
    updateMeasurementState(receipt)
    measurementPending = !receipt.actionResults.some(
      (entry) =>
        entry.actionName === AiActionNames.REVIEW_DESIGN &&
        isRecord(entry.result) &&
        entry.result.complete === true
    )
    const measured = receipt.actionResults.find(
      (entry) => entry.actionName === AiActionNames.REVIEW_DESIGN
    )
    measurementEvidence =
      !measurementPending && measured && isRecord(measured.result)
        ? inspectionStamp(measured.result.evidence)
        : undefined
    measuredTargets.set(elementId, measurementEvidence)
    return { context: {}, actionResults: receipt.actionResults }
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
      let measurement =
        canReview &&
        (measurementPending || (overview && !measuredTargets.has(elementId)))
          ? await measure(elementId, signal)
          : undefined
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
      inspectionUnavailable = !receipt.actionResults.some(
        (entry) => isRecord(entry.result) && entry.result.available === true
      )
      for (const entry of receipt.actionResults) {
        if (isRecord(entry.result)) {
          const source = inspectionStamp(entry.result.evidence)
          if (
            source &&
            canReview &&
            !sameEvidence(
              source,
              overview ? measuredTargets.get(elementId) : measurementEvidence
            )
          ) {
            // A failed/missing measurement stamp cannot be repaired by immediately repeating the same work.
            if (!measurement || measurementEvidence)
              measurement = await measure(elementId, signal)
            measurementPending ||= !sameEvidence(source, measurementEvidence)
          }
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
      return measurement
        ? {
            ...receipt,
            actionResults: [
              ...receipt.actionResults,
              ...measurement.actionResults
            ]
          }
        : receipt
    } finally {
      options.onInspection?.('completed')
    }
  }
  return {
    validateCompletion: async (signal?: AbortSignal): Promise<void> => {
      if (!designReview.isAccepted()) return
      try {
        if (!(await validateEvidence(undefined, signal))) designReview.mutate()
      } catch (error) {
        if (!(error instanceof LocalOperationPreparationError)) throw error
        inspectionImages.clear()
        designReview.mutate()
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
      if (
        !inspectionUnavailable &&
        !measurementPending &&
        unresolvedTextOverflow.size === 0 &&
        !qualityIssue
      )
        return batch
      let message = measurementPending
        ? 'The latest drawing still needs layout measurement.'
        : qualityIssue
      if (inspectionUnavailable)
        message = 'This app could not complete visual review of the drawing.'
      if (unresolvedTextOverflow.size > 0)
        message =
          'Some text still extends beyond its text box. The drawing needs further adjustment.'
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
      ...(registered.length
        ? [
            {
              type: 'function',
              name: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              executionAccess: LocalToolAccess.INDEPENDENT,
              description:
                'Discover missing contracts. Prefer operations=["owner.method", ...] for known semantic operations; operation accepts one. names accepts exact action names, unique semantic identities or native tools (namespace.name disambiguates). Use the returned action name and execution route. With no selector returns categories; category gives a scoped menu (includeSchemas=true includes schemas), query does lexical search. Use only one selector. Known fields: request view=usage or schemaPaths; full is the default. Definitions are included once per request/revision; repeated reads return references. Use refresh=true only to restore missing context or failed delivery, including native Code Mode abbreviated fields. Full inputSchema and constraints remain available. Execute known contracts directly; no discovery prerequisite for every edit. Mutations accept new values and stable IDs. apis execute as batch items; tools use their native namespace. Missing or ambiguous entries preserve unique matches and never select a similar route.',
              inputSchema: {
                type: 'object',
                additionalProperties: false,
                properties: {
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
                      'Exact names/operation only. JSON Pointers into inputSchema, e.g. /properties/items/items. Returns exact fragments and local reference dependencies, not a complete validation schema. Cannot combine with view or refresh.'
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
                      'Restore full action definitions after context loss or failed delivery. Does not execute actions.'
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
              name: AiDesignToolIds.EXECUTE_DESIGN_BATCH,
              description:
                'Submit an ordered batch of registered edits or narrow reads in one canvas exchange. Use each named operation schema. target optionally supplies artifactId with exact keys or keyPrefix and field=elementId (apply to each identity) or elementIds (one plural operation); omitted keys selects the prepared set. The field is resolved at its unique registered schema path, including nested request arguments; ambiguous paths require explicit arguments. References identify original creation members, not current Group children. Current canonical permission/existence checks still apply. All inputs are checked before dispatch. Existing Runtime transaction, Undo and failure semantics remain; inspect once after the stage, not after each item. Use inspection=defer only when another stage follows. Read operations should use fields=[] or specific fields, never reread the hierarchy to recover known IDs.',
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
                          type: 'object',
                          additionalProperties: false,
                          required: ['artifactId', 'field'],
                          properties: {
                            artifactId: { type: 'string' },
                            field: { enum: ['elementId', 'elementIds'] },
                            keys: {
                              type: 'array',
                              minItems: 1,
                              items: { type: 'string' }
                            },
                            keyPrefix: { type: 'string', minLength: 1 }
                          }
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
      ...(canInspect ? [designReviewDefinition] : []),
      ...registered
        .filter(
          (action) =>
            !getBasicApiContract(action.name) &&
            !AiBatchOnlyActionNames.includes(action.name)
        )
        .map((action) => ({
          type: 'function',
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
                  'Default immediate. Use defer only for intermediate mutations in an already planned stage: retain validation and receipts, defer automatic measurement and image until explicit inspection of the stage. Inspect the completed stage before visual assessment or completion. Explicit inspection calls always capture.'
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
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal
    ): Promise<string> => {
      if (signal.aborted) throw new Error('Backend operation cancelled')
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
              !['includeSchemas', 'refresh', 'view', 'schemaPaths'].includes(
                key
              )
          ) ||
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
          ((args.view === 'usage' || args.schemaPaths !== undefined) &&
            args.refresh === true) ||
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
            'Provide one selector: operations, operation, category, names or query; omit selectors for categories. includeSchemas requires category. view (usage/full) or nonempty schemaPaths requires exact names/operations. Partial queries cannot combine with refresh or with each other.'
          )
        const apis = registered
        const details = (api: (typeof apis)[number], includeSchema = true) => {
          const contract = getBasicApiContract(api.name)
          const descriptor = {
            ...api,
            execution: {
              kind: 'batch-action',
              tool: AiDesignToolIds.EXECUTE_DESIGN_BATCH
            },
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
              category: descriptor.category
            },
            args
          )
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
                  { name: tool.name, namespace: tool.namespace },
                  args
                ),
                schemaSource: 'registered-tool-contract',
                execution: {
                  kind: 'native-tool',
                  namespace: tool.namespace,
                  tool: tool.name
                }
              }
            }),
            missingNames,
            ...(ambiguousNames.length ? { ambiguousNames } : {}),
            ...(missingNames.length ? { message: lookupRecovery } : {})
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
            ...(missingOperations.length ? { message: lookupRecovery } : {})
          })
        }
        if (typeof args.operation === 'string') {
          const api = admittedApisByOperation.get(args.operation)
          if (!api)
            throw new LocalOperationPreparationError(
              `Unknown or unavailable operation. ${lookupRecovery}`
            )
          return JSON.stringify({ apis: [details(api)] })
        }
        const categories = [...admittedApiCategories].map(
          ([category, entries]) => ({ category, count: entries.length })
        )
        if (args.category !== undefined) {
          const entries = admittedApiCategories.get(String(args.category))
          if (!entries)
            throw new LocalOperationPreparationError(
              `Unknown category. ${lookupRecovery}`
            )
          return JSON.stringify({
            category: args.category,
            apis: entries.map((api) => {
              return details(
                api,
                args.includeSchemas === true || args.refresh === true
              )
            })
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
          complete: true,
          count: matches.length,
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
          apis: matches.map((api) => details(api))
        })
      }
      if (canInspect && name === AiDesignToolIds.RECORD_DESIGN_REVIEW) {
        const issue = operationInputIssue(
          args,
          designReviewDefinition.inputSchema
        )
        if (issue) throw new LocalOperationPreparationError(issue)
        const candidate =
          isRecord(args) &&
          (args.phase === 'structure' || args.phase === 'visual')
        const recordReview = (independent?: VisualAssessment) => {
          try {
            return designReview.record(args, independent)
          } catch (error) {
            throw new LocalOperationPreparationError(
              error instanceof Error ? error.message : 'Invalid review evidence'
            )
          }
        }
        if (!candidate) return JSON.stringify(recordReview())
        const evidenceResult = async () => {
          let message =
            'Inspection evidence changed. Inspect the current drawing again; earlier findings cannot approve completion.'
          try {
            if (await validateEvidence(args.inspectionIds, signal))
              return undefined
          } catch (error) {
            if (!(error instanceof LocalOperationPreparationError)) throw error
            message = error.message
          }
          designReview.invalidateAssessment(message)
          return {
            status: 'partial',
            phase: args.phase,
            accepted: false,
            readyForDetail: false,
            inspectionIds: args.inspectionIds,
            evidenceValidation: latestEvidenceValidation,
            message
          }
        }
        const unavailable = await evidenceResult()
        if (unavailable) return JSON.stringify(unavailable)
        try {
          designReview.validateReview(args)
        } catch (error) {
          throw new LocalOperationPreparationError(
            error instanceof Error ? error.message : 'Invalid review evidence'
          )
        }
        if (
          options.assessVisual &&
          (args.phase === 'structure' || args.final !== false)
        ) {
          const phase = args.phase as 'structure' | 'visual'
          const comparison = designReview.comparisonContext(phase)
          if (!Object.keys(comparison.criteria).length)
            return JSON.stringify(recordReview())
          const images = (args.inspectionIds as string[]).map((id) =>
            inspectionImages.get(id)
          )
          if (images.some((image) => !image))
            throw new Error('Current assessment images are unavailable.')
          const independent = await options.assessVisual(
            {
              ...comparison,
              phase,
              images: images as VisualAssessmentInput['images']
            },
            signal
          )
          signal.throwIfAborted()
          // Preserve findings before checking freshness, but never let old pixels approve a revision.
          designReview.retainAssessment(phase, independent, false)
          const invalidated = await evidenceResult()
          if (invalidated)
            return JSON.stringify({
              ...invalidated,
              independentAssessment: independent
            })
          return JSON.stringify(recordReview(independent))
        }
        return JSON.stringify(recordReview())
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
        batchActions = prepareOperationBatch(
          batchMode ? args.operations : [{ name, arguments: args.arguments }],
          registered.filter(
            (a) =>
              !batchMode ||
              ![
                AiActionNames.REVIEW_DESIGN,
                AiActionNames.INSPECT_DRAWING
              ].includes(a.name as never)
          ),
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
        const acknowledged = new Map<string, number>()
        const actionResults = result.actionResults.filter((entry) => {
          if (args.response === 'full') return true
          const contract = getBasicApiContract(entry.actionName)
          const item = entry.result
          if (
            !contract ||
            !['write', 'delete'].includes(contract.effect) ||
            !isRecord(item) ||
            item.status !== 'complete' ||
            item.value !== null ||
            (item.application !== undefined &&
              item.application !== 'not-reported') ||
            Object.keys(item).some(
              (key) =>
                !['status', 'value', 'elementId', 'application'].includes(key)
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
      let prepared: AiActionBatch
      try {
        prepared = preparation.resolveBatch({
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
      const affectsDrawingReview = batchActions.some(
        (action) =>
          requiresVisualReview(action.name) ||
          (action.name === AiActionNames.ORGANIZE_DESIGN && !!reviewTargetId)
      )
      if (affectsDrawingReview) {
        measuredTargets.clear()
        inspectionImages.clear()
        designReview.mutate()
        measurementPending = canReview
      }
      const receipt = await executeBatch(prepared)
      if (name === AiActionNames.REVIEW_DESIGN) {
        updateMeasurementState(receipt)
        if (typeof operationArguments.elementId === 'string') {
          measurementPending = !receipt.actionResults.some(
            (entry) =>
              entry.actionName === name &&
              isRecord(entry.result) &&
              entry.result.complete === true
          )
          const measured = receipt.actionResults.find(
            (entry) => entry.actionName === name
          )
          measurementEvidence =
            !measurementPending && measured && isRecord(measured.result)
              ? inspectionStamp(measured.result.evidence)
              : undefined
          measuredTargets.set(operationArguments.elementId, measurementEvidence)
        }
      }
      if (signal.aborted) throw new Error('Backend operation cancelled')
      if ((canInspect || canReview) && affectsDrawingReview) {
        const submittedActions = new Map(
          prepared.actions.map((action) => [action.id, action])
        )
        for (const entry of receipt.actionResults) {
          const contract = getBasicApiContract(entry.actionName)
          const method = contract?.method
          const submitted = submittedActions.get(entry.actionId)
          const submittedArguments = isRecord(submitted?.arguments)
            ? submitted.arguments
            : {}
          if (
            method === 'deleteElement' &&
            isRecord(entry.result) &&
            entry.result.value === true &&
            typeof submittedArguments.elementId === 'string'
          )
            reviewScope.delete(submittedArguments.elementId)
          if (!isRecord(entry.result)) continue
          const receiptResult = entry.result
          const result =
            contract && isRecord(receiptResult.value)
              ? receiptResult.value
              : receiptResult
          if (
            contract?.result.kind === 'created-items' &&
            Array.isArray(receiptResult.appliedElementIds)
          ) {
            for (const id of receiptResult.appliedElementIds) {
              if (typeof id !== 'string') continue
              reviewScope.add(id)
              reviewTargetId ??= id
            }
          }
          if (
            contract?.effect === 'write' &&
            Array.isArray(receiptResult.reviewElementIds)
          ) {
            for (const id of receiptResult.reviewElementIds) {
              if (typeof id !== 'string' || id.length === 0) continue
              reviewScope.add(id)
              reviewTargetId ??= id
            }
          }
          let removed: unknown
          if (entry.actionName === AiActionNames.REMOVE_AI_COMPOSITION)
            removed = result.appliedElementIds
          else if (method === 'removeSubtree') removed = result.removed
          if (Array.isArray(removed)) {
            for (const item of removed) {
              const id = isRecord(item) ? item.elementId : item
              if (typeof id === 'string') reviewScope.delete(id)
            }
          }
          if (
            entry.actionName === AiActionNames.REPLACE_VECTOR_COMPOSITION &&
            result.status === 'complete' &&
            typeof submittedArguments.compositionId === 'string'
          )
            reviewScope.delete(submittedArguments.compositionId)
          const group =
            result.operation === 'group' || method === 'groupElements'
          const ungroup =
            result.operation === 'ungroup' || method === 'ungroupElement'
          if (
            typeof result.groupId === 'string' &&
            Array.isArray(result.elementIds)
          ) {
            const members = result.elementIds.filter(
              (id): id is string => typeof id === 'string'
            )
            if (group && members.some((id) => reviewScope.has(id))) {
              members.forEach((id) => reviewScope.delete(id))
              reviewScope.add(result.groupId)
              if (reviewTargetId && members.includes(reviewTargetId))
                reviewTargetId = result.groupId
            } else if (
              ungroup &&
              result.removed === true &&
              reviewScope.delete(result.groupId)
            ) {
              members.forEach((id) => reviewScope.add(id))
              if (reviewTargetId === result.groupId)
                reviewTargetId = [...reviewScope][0]
            }
          }
          const reportedElementId = receiptResult.elementId
          if (typeof result.compositionId === 'string') {
            reviewScope.add(result.compositionId)
            if (
              !reviewTargetId ||
              entry.actionName !== AiActionNames.UPDATE_DESIGN_ELEMENT
            )
              reviewTargetId = result.compositionId
          } else if (
            contract?.effect === 'write' &&
            typeof reportedElementId === 'string'
          ) {
            reviewScope.add(reportedElementId)
            reviewTargetId ??= reportedElementId
          }
        }
        if (reviewTargetId && !reviewScope.has(reviewTargetId))
          reviewTargetId = [...reviewScope][0]
        if (!reviewTargetId) inspectionUnavailable = true
        if (reviewTargetId) {
          if (args.inspection === 'defer' && canInspect)
            return serializeReceipt({
              ...receipt,
              inspectionDeferred: true,
              measurementDeferred: measurementPending
            })
          let measurement: AiBatchReceipt | undefined
          if (canReview && measurementPending) {
            measurement = await measure(reviewTargetId, signal)
            signal.throwIfAborted()
            if (
              unresolvedTextOverflow.size > 0 ||
              !canInspect ||
              measurementPending
            )
              return serializeReceipt({
                ...receipt,
                actionResults: [
                  ...receipt.actionResults,
                  ...measurement.actionResults
                ]
              })
          }
          const inspection = await inspect(
            reviewTargetId,
            true,
            undefined,
            undefined,
            signal
          )
          if (signal.aborted) throw new Error('Backend operation cancelled')
          return serializeReceipt({
            ...receipt,
            actionResults: [
              ...receipt.actionResults,
              ...(measurement?.actionResults ?? []),
              ...inspection.actionResults
            ]
          })
        }
      }
      return serializeReceipt(receipt)
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
