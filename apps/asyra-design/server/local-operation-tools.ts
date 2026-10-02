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
import { randomUUID } from 'node:crypto'
import { AiActionNames } from '../src/constants/ai-actions'
import type {
  AiActionBatch,
  AiProviderInput,
  AiBatchReceipt
} from '../src/ai/action-batch-protocol'
export class LocalOperationPreparationError extends Error {
  constructor(message?: string) {
    super(
      message ??
        'Drawing preparation rejected these arguments before any canvas changes. Check the supplied operation schema, use a valid artifact from this request, valid target bounds and only supported fields. Component conversions require matching analysis receipts; omit optional mappings and analysisIds when no conversion is selected. Correct the arguments and reuse the prepared artifact; do not invent replacement paths or repeat unchanged arguments.'
    )
  }
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
  const designReview = createLocalDesignReview()
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
  const validateEvidence = async (ids?: unknown, signal?: AbortSignal) => {
    signal?.throwIfAborted()
    const evidence = designReview.evidenceFor(ids)
    if (
      !evidence ||
      !registered.some(
        (action) => action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      )
    )
      return false
    const actionId = randomUUID()
    const receipt = await executeBatch({
      batchId: randomUUID(),
      actions: [
        {
          id: actionId,
          name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
          arguments: {
            evidence,
            ...(reviewScope.size
              ? {
                  scope: {
                    requiredIds: [...reviewScope],
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
    const current = receipt.actionResults.some(
      (entry) =>
        entry.actionId === actionId &&
        entry.actionName === AiActionNames.VALIDATE_INSPECTION_EVIDENCE &&
        isRecord(entry.result) &&
        entry.result.current === true
    )
    if (!current) {
      designReview.mutate()
      return false
    }
    const validation = receipt.actionResults.find(
      (entry) => entry.actionId === actionId
    )?.result
    if (
      reviewScope.size &&
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
          if (evidence) Object.assign(entry.result, evidence)
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
      ...(registered.some((action) => getBasicApiContract(action.name))
        ? [
            {
              type: 'function',
              name: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              executionAccess: LocalToolAccess.INDEPENDENT,
              description:
                'Discover public Core and App APIs. With no arguments returns the complete compact API index. Supply query to search current names and descriptions by purpose, or names to retrieve exact input schemas and coordinate semantics, then call these actions in execute_design_batch. Do not combine query with names. No lexical match does not mean a capability is unavailable: use the complete index. Prefer plural APIs for ready data; basic vector APIs edit existing anchors/handles without replacing the vector.',
              inputSchema: {
                type: 'object',
                additionalProperties: false,
                properties: {
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
                'Submit an ordered batch of registered edits or narrow reads in one canvas exchange. Use each named operation schema. target optionally supplies artifactId with exact keys or keyPrefix and field=elementId (apply to each identity) or elementIds (one plural operation); omitted keys selects the prepared set. References identify original creation members, not current Group children. Current canonical permission/existence checks still apply. All inputs are checked before dispatch. Existing Runtime transaction, Undo and failure semantics remain; inspect once after the stage, not after each item. Use inspection=defer only when another stage follows. Read operations should use fields=[] or specific fields, never reread the hierarchy to recover known IDs.',
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
        .filter((action) => !getBasicApiContract(action.name))
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
        if (
          !isRecord(args) ||
          Object.keys(args).some((key) => !['names', 'query'].includes(key)) ||
          (args.query !== undefined &&
            (typeof args.query !== 'string' ||
              !args.query.trim() ||
              args.names !== undefined)) ||
          (args.names !== undefined &&
            (!Array.isArray(args.names) ||
              args.names.some((v) => typeof v !== 'string')))
        )
          throw new LocalOperationPreparationError(
            'Expected optional API names array or nonempty purpose query, not both'
          )
        const apis = registered.filter((action) =>
          getBasicApiContract(action.name)
        )
        if (Array.isArray(args.names)) {
          const names = args.names as string[]
          if (
            names.some(
              (requested) => !apis.some((api) => api.name === requested)
            )
          )
            throw new LocalOperationPreparationError(
              'Unknown or unavailable public API'
            )
          return JSON.stringify({
            apis: names.map((requested) =>
              apis.find((api) => api.name === requested)
            )
          })
        }
        const normalizeApiLookupText = (value: string) =>
          value
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .normalize('NFKC')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .trim()
        const terms =
          typeof args.query === 'string'
            ? normalizeApiLookupText(args.query).split(' ').filter(Boolean)
            : []
        const matches = terms.length
          ? apis.filter((api) => {
              const descriptor = normalizeApiLookupText(
                `${api.name} ${api.description}`
              )
              return terms.every((term) => descriptor.includes(term))
            })
          : apis
        return JSON.stringify({
          complete: true,
          count: matches.length,
          catalogSize: apis.length,
          ...(args.query !== undefined && matches.length === 0
            ? {
                message:
                  'No lexical match; this is not evidence of an unavailable capability. Read the complete compact catalog without arguments or try other terms.',
                recovery: {
                  tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                  arguments: {}
                }
              }
            : {}),
          apis: matches.map(({ name, description }) => {
            const contract = getBasicApiContract(name)
            if (!contract) throw new Error('Missing API contract')
            return {
              name,
              owner: contract.owner,
              method: contract.method,
              effect: contract.effect,
              ...(args.query !== undefined ? { description } : {})
            }
          })
        })
      }
      if (canInspect && name === AiDesignToolIds.RECORD_DESIGN_REVIEW) {
        const issue = operationInputIssue(
          args,
          designReviewDefinition.inputSchema
        )
        if (issue) throw new LocalOperationPreparationError(issue)
        try {
          if (
            isRecord(args) &&
            args.phase !== 'plan' &&
            !(await validateEvidence(args.inspectionIds, signal))
          ) {
            throw new Error(
              'The drawing changed or current inspection IDs have no valid App evidence. Inspect the current drawing again before assessment.'
            )
          }
          return JSON.stringify(designReview.record(args))
        } catch (error) {
          throw new LocalOperationPreparationError(
            error instanceof Error ? error.message : 'Invalid review evidence'
          )
        }
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
            Object.keys(item).some(
              (key) => !['status', 'value', 'elementId'].includes(key)
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
                    ([actionName, count]) => ({ actionName, count })
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
        return JSON.stringify(
          await inspect(
            operationArguments.elementId,
            !operationArguments.region &&
              (operationArguments.view === 'overview' ||
                operationArguments.elementId === reviewTargetId),
            operationArguments.region,
            operationArguments.view ??
              (operationArguments.region ||
              operationArguments.elementId === reviewTargetId
                ? undefined
                : 'detail'),
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
      } catch {
        signal.throwIfAborted()
        throw new LocalOperationPreparationError()
      }
      const affectsDrawingReview = batchActions.some(
        (action) =>
          requiresVisualReview(action.name) ||
          (action.name === AiActionNames.ORGANIZE_DESIGN && !!reviewTargetId)
      )
      if (affectsDrawingReview) {
        measuredTargets.clear()
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
            entry.result === true &&
            typeof submittedArguments.elementId === 'string'
          )
            reviewScope.delete(submittedArguments.elementId)
          if (!isRecord(entry.result)) continue
          const result = entry.result
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
          if (typeof result.compositionId === 'string') {
            reviewScope.add(result.compositionId)
            if (
              !reviewTargetId ||
              entry.actionName !== AiActionNames.UPDATE_DESIGN_ELEMENT
            )
              reviewTargetId = result.compositionId
          } else if (
            contract?.effect === 'write' &&
            typeof result.elementId === 'string'
          ) {
            reviewScope.add(result.elementId)
            reviewTargetId ??= result.elementId
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

/** Native image payloads are separated from text; only actual bounded PNG receipts are admitted. */
export const localToolContent = (
  text: string
): (
  { type: 'inputText'; text: string } | { type: 'inputImage'; imageUrl: string }
)[] => {
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
        snapshot.dataUrl.length > 8 * 1024 * 1024 ||
        !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(snapshot.dataUrl)
      )
        throw new Error('Invalid drawing snapshot')
      const bytes = Buffer.from(
        snapshot.dataUrl.slice('data:image/png;base64,'.length),
        'base64'
      )
      if (
        bytes.length < 24 ||
        !bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        bytes.readUInt32BE(16) !== snapshot.width ||
        bytes.readUInt32BE(20) !== snapshot.height ||
        Number(snapshot.width) < 1 ||
        Number(snapshot.height) < 1 ||
        (entry.actionName === AiReferenceToolIds.IMPORT_REFERENCE_IMAGE
          ? Number(snapshot.width) * Number(snapshot.height) > 4_000_000
          : Number(snapshot.width) > 1024 || Number(snapshot.height) > 1024)
      )
        throw new Error('Invalid drawing snapshot dimensions')
      images.push({ type: 'inputImage', imageUrl: snapshot.dataUrl })
      const { dataUrl: _dataUrl, ...metadata } = snapshot
      entry.result = { ...entry.result, image: metadata }
    }
  }
  return [{ type: 'inputText', text: JSON.stringify(value) }, ...images]
}
