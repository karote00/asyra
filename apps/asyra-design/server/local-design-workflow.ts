import { designRepresentationGuidance } from './design-preparation-examples'
import type { AiInvocationMiddleware } from '@asyra/ai-agent-runtime'
import {
  toolSemantics,
  toolResultObject,
  toolRequestReference
} from '../src/ai/tool-contract'
import {
  invokeLocalTool,
  observeLocalToolExecution,
  localToolOutcome,
  type LocalToolObservation
} from './local-tool-invocation'
import { designCheckSummarySchema } from './design-check-results'
import {
  reviewPlanSchema,
  reviewPlanExample,
  reviewCaptureChecksSchema,
  reviewJudgmentFieldsSchema
} from './local-design-review'
import {
  operationInputIssue,
  operationInputIssues,
  type OperationInputIssue
} from './operation-input-schema'
import { AiActionNames } from '../src/constants/ai-actions'
import { LocalToolAccess } from './local-tool-scheduler'
import { AiDesignToolIds } from '../src/constants/ai-design'
import type { createLocalDesignTools } from './local-design-tools'
import {
  LocalOperationPreparationError,
  localOperationNamespace,
  type createLocalOperationTools
} from './local-operation-tools'

const deferredReviewIssue =
  'reviewChecks requires immediate inspection; omit it to defer selection.'

/** Compose existing owners; never create a second preparation or execution path. */
export const createLocalDesignWorkflow = (
  designs: ReturnType<typeof createLocalDesignTools>,
  operations: ReturnType<typeof createLocalOperationTools>,
  observation: LocalToolObservation = {},
  executionEvidence?: () => unknown,
  executionScope?: AiInvocationMiddleware<string>
) => {
  const artifactPreparation = designs.definitions.find(
    (tool) => tool.name === AiDesignToolIds.PREPARE_DESIGN
  )
  const preparation = artifactPreparation
    ? {
        ...artifactPreparation,
        outputSchema: designs.capacityOutputSchema,
        description:
          'Prepare one artifact or retain a safe capacity plan for the main workflow; no canvas writes.'
      }
    : undefined
  const apply = operations.definitions.find(
    (tool) => tool.name === AiActionNames.APPLY_PREPARED_DESIGN
  )
  const review = operations.definitions.find(
    (tool) => tool.name === AiDesignToolIds.DEFINE_DESIGN_CRITERIA
  )
  const judgment = operations.definitions.find(
    (tool) => tool.name === AiDesignToolIds.REVIEW_DRAWING
  )
  const finishReview = async (
    value: Record<string, unknown>,
    selection: unknown,
    signal: AbortSignal
  ): Promise<Record<string, unknown>> => {
    if (selection === undefined || !judgment) return value
    // A partial block's last image may belong to an earlier part, not the intended target.
    const outcome = localToolOutcome(value)
    if (outcome.status !== 'success') {
      const targets = Array.isArray(value.inspectionIssues)
        ? [
            ...new Set(
              value.inspectionIssues.flatMap((issue) =>
                typeof issue.elementId === 'string' ? [issue.elementId] : []
              )
            )
          ]
        : []
      if (outcome.settlement !== 'completed' || targets.length !== 1)
        return value
      return {
        ...value,
        visualReview: {
          recordedChecks: [],
          recovery:
            'Retry only the failed capture and binding. Do not replay acknowledged writes.',
          recoveryInvocation: {
            namespace: localOperationNamespace,
            tool: judgment.name,
            arguments: {
              phase: 'visual',
              final: false,
              inspections: [{ elementId: targets[0], checks: selection }]
            }
          }
        }
      }
    }
    const entries = Array.isArray(value.actionResults)
      ? value.actionResults
      : []
    const inspectionIds = entries.flatMap((entry) =>
      entry.actionName === AiActionNames.INSPECT_DRAWING &&
      entry.result?.available === true &&
      typeof entry.result.inspectionId === 'string'
        ? [entry.result.inspectionId]
        : []
    )
    if (!inspectionIds.length) {
      const result = {
        ...value,
        inspectionIssues: [
          {
            message:
              'No usable automatic image was returned. Capture and bind the selected checks with review_drawing; do not replay writes.'
          }
        ]
      }
      return { ...result, toolOutcome: localToolOutcome(result) }
    }
    const arguments_ = {
      phase: 'visual',
      final: false,
      bindChecks: (selection as Record<string, unknown>[]).map((check) => ({
        ...check,
        inspectionIds
      }))
    }
    const raw = await observeLocalToolExecution(
      judgment.name,
      arguments_,
      async () =>
        (
          await invokeLocalTool(
            operations,
            judgment,
            arguments_,
            signal,
            executionEvidence
          )
        ).text,
      observation,
      judgment.description,
      executionScope ? [executionScope] : []
    )
    const visualReview = JSON.parse(raw)
    const execution = {
      kind: 'native-tool',
      namespace: localOperationNamespace,
      tool: judgment.name
    }
    if (visualReview.next?.arguments?.checks) {
      visualReview.next.execution = execution
      visualReview.next.fillSchema = reviewJudgmentFieldsSchema
    }
    const complete =
      localToolOutcome(visualReview).status === 'success' &&
      Array.isArray(visualReview.next?.arguments?.checks)
    if (!complete) {
      const invalidIds = visualReview.evidenceValidation?.invalidInspectionIds
      const invalidImages = entries.filter(
        (entry) =>
          Array.isArray(invalidIds) &&
          invalidIds.includes(entry.result?.inspectionId) &&
          typeof entry.result?.elementId === 'string'
      )
      visualReview.recoveryInvocation = {
        ...execution,
        arguments: invalidImages.length
          ? {
              phase: 'visual',
              final: false,
              inspections: invalidImages.map((entry) => ({
                elementId: entry.result.elementId,
                checks: selection
              }))
            }
          : arguments_
      }
      visualReview.recovery =
        'Recover only this review binding. Follow evidenceValidation for invalid images; retain successful images and all acknowledged writes. Never rerun the drawing workflow to recover review.'
    }
    const result = {
      ...value,
      visualReview,
      ...(!complete
        ? {
            inspectionIssues: [
              {
                message:
                  'Visual review binding is incomplete; follow visualReview recovery without replaying writes.'
              }
            ]
          }
        : {})
    }
    const toolOutcome = localToolOutcome(result)
    return {
      ...result,
      ...(value.status === 'complete' && toolOutcome.status !== 'success'
        ? {
            status: toolOutcome.status,
            complete: false,
            settlement: toolOutcome.settlement
          }
        : {}),
      toolOutcome
    }
  }
  // The wrapper exports child resources as well as their execution receipts.
  // Keep the preparation contract intact so call cleanup can transfer ownership.
  const partOutputSchema = {
    allOf: [
      artifactPreparation?.outputSchema ?? false,
      toolResultObject(
        {
          applicable: { const: true },
          actionResults: { type: 'array' },
          completedSteps: { type: 'array', items: { type: 'string' } },
          checks: designCheckSummarySchema
        },
        ['applicable', 'actionResults', 'completedSteps']
      )
    ]
  }
  const stoppedPartSchema = toolResultObject(
    {
      failedStep: { type: 'string' },
      completedSteps: { type: 'array', items: { type: 'string' } },
      artifactId: toolRequestReference
    },
    ['failedStep', 'completedSteps']
  )
  const stoppedOutputSchema = {
    anyOf: [
      stoppedPartSchema,
      toolResultObject(
        {
          checks: designCheckSummarySchema,
          status: { enum: ['partial', 'failed', 'unknown'] },
          parts: {
            type: 'array',
            items: { anyOf: [partOutputSchema, stoppedPartSchema] }
          }
        },
        ['status', 'parts']
      )
    ]
  }
  const semantics = toolSemantics(
    {
      anyOf: [
        partOutputSchema,
        toolResultObject(
          {
            status: { const: 'complete' },
            parts: { type: 'array', minItems: 1, items: partOutputSchema },
            checks: designCheckSummarySchema
          },
          ['status', 'parts']
        )
      ]
    },
    'mutation',
    ['document', 'request-artifacts'],
    'request-artifact'
  )
  const single = {
    rejectInput: (
      name: string,
      args: unknown,
      issues?: readonly OperationInputIssue[]
    ) => {
      if (
        name !== AiDesignToolIds.PREPARE_AND_APPLY_DESIGN ||
        !args ||
        typeof args !== 'object' ||
        Array.isArray(args)
      )
        return
      const details = designs.rejectInput(
        AiDesignToolIds.PREPARE_DESIGN,
        args,
        issues
      )
      if (!details?.repairGuide) return details
      const {
        draft: _draft,
        repair: _repair,
        materialSourceId: _materialSource,
        ...context
      } = args as Record<string, unknown>
      return {
        ...details,
        repairGuide: {
          ...details.repairGuide,
          tool: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
          arguments: { ...context, ...details.repairGuide.arguments }
        }
      }
    },
    explainInputIssue: (name: string, args: unknown) =>
      name === AiDesignToolIds.PREPARE_AND_APPLY_DESIGN
        ? designs.explainInputIssue(AiDesignToolIds.PREPARE_DESIGN, args)
        : undefined,
    definitions:
      preparation && apply
        ? [
            {
              ...preparation,
              ...semantics,
              revision: 4,
              partialOutputSchema: {
                anyOf: [semantics.partialOutputSchema, stoppedOutputSchema]
              },
              recoveryOutputSchema: stoppedOutputSchema,
              name: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
              executionAccess: LocalToolAccess.EXCLUSIVE,
              description:
                'Optional plan records request-linked review criteria in this same call. Omit it to draw a ready part immediately; record initial criteria with define_design_criteria before primary-agent result review. Established criteria cannot be rewritten after drawing. Prepare and apply one ready retained part, through existing validation and canvas operations. Call before generating later details or researching another part; do not accumulate a complete design first. Optional parentId attaches this part to an existing container in parent-local coordinates. The compact compositionId identifies the new part and is sufficient to attach later parts; no full ID map is needed for continuation. Invalid preparation never applies. Safe capacity plans execute through ordered retained parts in this call; only actual receipts prove writes. Returns preparation findings, actual root identity and review evidence. Default compact response omits duplicated context, ID maps and pure work/timing diagnostics; full retains them. Operation results, limitations and recovery remain complete. Use inspection=defer when no immediate visual decision is needed, then inspect at the next visual decision boundary. Does not replace existing objects or retry failures. ' +
                designRepresentationGuidance,
              inputSchema: {
                ...preparation.inputSchema,
                properties: {
                  ...preparation.inputSchema.properties,
                  ...(review ? { plan: reviewPlanSchema } : {}),
                  ...(judgment
                    ? {
                        reviewChecks: {
                          ...reviewCaptureChecksSchema,
                          description:
                            'Optional explicit checks for this call’s automatic image. Requires current or same-call criteria and immediate inspection. Omit to decide after viewing; no automatic judgment. Read visualReview.next, fill each check using fillSchema, then call next.execution with next.arguments.'
                        }
                      }
                    : {}),
                  parentId: {
                    type: 'string',
                    minLength: 1,
                    description:
                      'Existing editable container for this ready part; coordinates are parent-local. Omit for workspace insertion.'
                  },
                  message: { type: 'string', minLength: 1, maxLength: 1000 },
                  inspection: { type: 'string', enum: ['immediate', 'defer'] },
                  response: { type: 'string', enum: ['compact', 'full'] }
                }
              }
            }
          ]
        : [],
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal,
      part?: { key: string; index: number },
      inspectionTargets?: Set<string>
    ): Promise<string> => {
      signal.throwIfAborted()
      if (
        !preparation ||
        !apply ||
        name !== AiDesignToolIds.PREPARE_AND_APPLY_DESIGN ||
        !args ||
        typeof args !== 'object' ||
        Array.isArray(args)
      )
        throw new LocalOperationPreparationError(
          'Combined preparation/application is unavailable.'
        )
      const input = args as Record<string, unknown>
      if (
        'draft' in input === 'repair' in input ||
        Object.keys(input).some(
          (key) =>
            ![
              'draft',
              'repair',
              'materialSourceId',
              ...(review ? ['plan'] : []),
              ...(judgment ? ['reviewChecks'] : []),
              'message',
              'inspection',
              'response',
              'parentId'
            ].includes(key)
        ) ||
        (input.parentId !== undefined &&
          (typeof input.parentId !== 'string' || !input.parentId.trim())) ||
        (input.response !== undefined &&
          !['compact', 'full'].includes(String(input.response))) ||
        (input.inspection !== undefined &&
          !['immediate', 'defer'].includes(String(input.inspection))) ||
        (input.message !== undefined &&
          (typeof input.message !== 'string' ||
            !input.message.trim() ||
            input.message.length > 1000))
      )
        throw new LocalOperationPreparationError(
          'Provide draft or repair, and optional registered plan, reviewChecks, parentId, message, inspection, response only.'
        )
      if (input.reviewChecks !== undefined) {
        const issue = operationInputIssue(
          input.reviewChecks,
          reviewCaptureChecksSchema
        )
        if (issue) throw new LocalOperationPreparationError(issue)
        if (input.inspection === 'defer')
          throw new LocalOperationPreparationError(deferredReviewIssue)
      }
      if (input.plan !== undefined) {
        const issue = operationInputIssue(input.plan, reviewPlanSchema)
        if (issue) throw new LocalOperationPreparationError(issue)
      }
      const projectExecutionReceipt = (
        value: Record<string, unknown>
      ): Record<string, unknown> => {
        const delivered = { ...value }
        if (Array.isArray(value.actionResults))
          delivered.actionResults = value.actionResults.map((entry) => {
            if (
              entry?.actionName !== AiActionNames.APPLY_PREPARED_DESIGN ||
              !entry.result ||
              typeof entry.result !== 'object' ||
              Array.isArray(entry.result)
            )
              return entry
            const { timing: _timing, ...result } = entry.result
            return { ...entry, result }
          })
        const record = (entry: unknown): entry is Record<string, unknown> =>
          !!entry && typeof entry === 'object' && !Array.isArray(entry)
        // Only existing execution-protocol containers, never user/recovery data.
        if (record(value.executionResult))
          delivered.executionResult = projectExecutionReceipt(
            value.executionResult
          )
        if (Array.isArray(value.batches))
          delivered.batches = value.batches.map((batch) =>
            record(batch) ? projectExecutionReceipt(batch) : batch
          )
        return delivered
      }
      const deliver = (value: Record<string, unknown>) => {
        if (input.response === 'full') return JSON.stringify(value)
        // Inner owner observations already retained the original diagnostic values.
        const { reuse: _reuse, sourceWork: _sourceWork, ...delivered } = value
        return JSON.stringify(projectExecutionReceipt(delivered))
      }
      const completedSteps: string[] = []
      const runStep = async (
        owner: typeof designs | typeof operations,
        step: import('./local-tool-invocation').LocalToolDefinition,
        arguments_: unknown
      ) => {
        signal.throwIfAborted()
        const text = await observeLocalToolExecution(
          step.name,
          arguments_,
          async () => {
            const invocationOwner: typeof owner =
              owner === designs
                ? {
                    ...designs,
                    call: (name: string, args: unknown, signal: AbortSignal) =>
                      designs.call(name, args, signal, true)
                  }
                : owner
            const reply = await invokeLocalTool(
              owner === operations && inspectionTargets
                ? {
                    ...operations,
                    callInternal: (name, args, signal) =>
                      operations.callInternal(
                        name,
                        args,
                        signal,
                        inspectionTargets
                      ),
                    call: (name, args, signal) =>
                      operations.call(name, args, signal, inspectionTargets)
                  }
                : invocationOwner,
              step,
              arguments_,
              signal,
              executionEvidence
            )
            return reply.text
          },
          part
            ? {
                ...observation,
                trace: (stage, evidence) =>
                  observation.trace?.(stage, { ...evidence, part })
              }
            : observation,
          step.description,
          executionScope ? [executionScope] : []
        )
        const result = JSON.parse(text)
        if (localToolOutcome(result).status === 'success')
          completedSteps.push(step.name)
        return result
      }
      const preparationInput = {
        ...('repair' in input
          ? { repair: input.repair }
          : { draft: input.draft }),
        ...(input.materialSourceId === undefined
          ? {}
          : { materialSourceId: input.materialSourceId })
      }
      const prepared = await runStep(designs, preparation, preparationInput)
      const stoppedAt = (result: Record<string, unknown>, step: string) => ({
        ...result,
        ...(prepared.artifactId ? { artifactId: prepared.artifactId } : {}),
        completedSteps,
        failedStep: step
      })
      if (prepared.available && prepared.retainedDraft?.partitions)
        return deliver(prepared)
      if (!prepared.available || !prepared.applicable) {
        if (prepared.repairGuide) {
          const {
            draft: _draft,
            repair: _repair,
            materialSourceId: _materialSource,
            ...context
          } = input
          prepared.repairGuide = {
            ...prepared.repairGuide,
            tool: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
            arguments: { ...context, ...prepared.repairGuide.arguments }
          }
        }
        return deliver(stoppedAt(prepared, preparation.name))
      }
      signal.throwIfAborted()
      if (input.plan !== undefined && review) {
        const planned = await runStep(operations, review, input.plan)
        if (localToolOutcome(planned).status !== 'success')
          return deliver(stoppedAt(planned, review.name))
      }
      if (input.reviewChecks !== undefined)
        operations.validateReviewChecks(input.reviewChecks)
      const receipt = await runStep(operations, apply, {
        arguments: {
          artifactId: prepared.artifactId,
          response: input.response ?? 'compact',
          ...(input.parentId === undefined ? {} : { parentId: input.parentId })
        },
        ...(input.message === undefined ? {} : { message: input.message }),
        ...(input.inspection === undefined
          ? {}
          : { inspection: input.inspection })
      })
      const applicationOutcome = localToolOutcome(receipt)
      const appliedWithIncompleteFollowup =
        applicationOutcome.status === 'partial' &&
        applicationOutcome.settlement === 'completed' &&
        (receipt.measurementIssues?.length || receipt.inspectionIssues?.length)
      if (
        applicationOutcome.status !== 'success' &&
        !appliedWithIncompleteFollowup
      )
        return deliver(stoppedAt(receipt, apply.name))
      if (appliedWithIncompleteFollowup) completedSteps.push(apply.name)
      if (input.response !== 'full') {
        delete receipt.context
        for (const entry of receipt.actionResults ?? []) {
          if (entry.actionName !== AiActionNames.APPLY_PREPARED_DESIGN) continue
          const result = entry.result
          result.appliedElementCount =
            result.appliedElementIds?.length ?? prepared.elementCount
          delete result.appliedElementIds
          delete result.keyToId
          delete result.roleToElementIds
        }
        receipt.receiptScope = 'compact'
      }
      return deliver({ ...prepared, ...receipt, completedSteps })
    }
  }
  const definition = single.definitions[0]
  if (!definition) return single
  const partSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['key'],
    oneOf: [{ required: ['draft'] }, { required: ['repair'] }],
    properties: {
      key: { type: 'string', minLength: 1, maxLength: 160 },
      materialSourceId: definition.inputSchema.properties.materialSourceId,
      draft: { $ref: '#/$defs/readyDraft' },
      repair: { $ref: '#/$defs/draftRepair' },
      parentId: definition.inputSchema.properties.parentId,
      continueFromPart: {
        type: 'string',
        minLength: 1,
        description:
          'For returned partition recovery only: key of the acknowledged first partition. Continue its original root; never create a nested group.'
      },
      parentPart: {
        type: 'string',
        minLength: 1,
        description:
          'Local key of an earlier successful part whose actual composition ID becomes this parent. Not a canonical ID. Mutually exclusive with parentId.'
      }
    }
  }
  const orderedInputExample = {
    parts: [
      {
        key: 'body',
        draft: {
          type: 'group',
          name: 'Body',
          children: [
            {
              type: 'rect',
              name: 'Surface',
              key: 'surface',
              x: 0,
              y: 0,
              width: 40,
              height: 30,
              fill: '#123456'
            }
          ]
        }
      },
      {
        key: 'detail',
        parentPart: 'body',
        draft: {
          type: 'group',
          name: 'Detail',
          children: [
            {
              type: 'rect',
              name: 'Inset',
              key: 'inset',
              x: 4,
              y: 4,
              width: 6,
              height: 6,
              fill: '#abcdef'
            }
          ]
        }
      }
    ],
    inspection: 'defer'
  }
  const inputSchema = {
    'x-design-input-scope': {
      operations: '/oneOf',
      queryExample: { operation: 'draft', nodeTypes: ['pattern'] },
      nodes: '/$defs/node/anyOf',
      repetition: { type: 'pattern', memberField: 'members' },
      optionalInputs: [
        ...(review ? ['plan'] : []),
        ...(judgment ? ['reviewChecks'] : [])
      ],
      selection: `Choose component contents and painter order, then outer repetition and operation/nodeTypes for the next submitted part. Component order: one pattern of face/grid members. Layer order: sibling patterns, with independent nodes at their painter positions. For either, define members once; axes count/step set translation. Selecting projected-face/surface-grid includes pattern with members; no extra query is needed. Examples are optional; select types for independent siblings. inputScope usage gives complete parameters/results/recovery. draft creates an artifact within ${designs.expandedNodeLimit} expanded objects or continues a safely partitionable source through retained parts in this call; repair corrects retained preparation; parts submits independent artifacts exceeding that total together, each within limits, with partial receipts. Independent world-space planar faces in a shared orthographic projection: projected-face. Pattern-only queries include all face/grid members; content queries include only selected kinds. origin sets the start. For faces mode, explicitly select pattern. surface-grid repeats normalized motifs on a planar convex four-corner boundary using rows/columns and painter order. Select grid if this submission needs it; later grid details may be added separately when useful. Arbitrary or already-projected 2D outlines: vector; identical 2D curves: vector-pattern. Guides include root group/frame; nodeTypes selects children, including nested containers. Nest group for organization, frame for size; rect/oval/text for primitives. Root changes need no query. optionalInputs: plan for criteria, reviewChecks for image checks. Selection does not require sending either; omit plan without rereading. Select used types only. Size/rotation/irregular exceptions stay explicit. Templates reduce input, not output budgets; safe excess continues via retained parts. Use parts for independent layers or bounded complete-instance ranges; never replay acknowledged parts. No Knowledge or planning call is required. Known scopes can read directly; full schema/field queries remain available.`,
      usage: {
        instructions:
          'nodeTypes selects children, not root group/frame; root changes need no reread. Optional plan or define_design_criteria sets criteria before review; immutable after drawing. inspection=defer still writes; full adds maps. Layout: one-time; no live Auto Layout/clipping/frame borders/corner radii. Preserve supplied 2D; invent no hidden depth/faces. Resolve overflow; render text-metrics-required. AI judges visuals; edits target IDs only.',
        operations: {
          draft: `draft: ${designs.expandedNodeLimit} expanded objects/artifact; safe excess continues via retained parts. Authored keys are not canonical IDs.`,
          repair:
            'Supply repair only, not draft or parts. Use an owned current source artifact and exact repair operations; keep unaffected geometry and valid artifacts. Repair preparation does not authorize replay of an earlier application.',
          parts: `Independent sources: each part artifact fits ${designs.expandedNodeLimit} expanded objects; safe excess continues via retained partitions. Supply ordered key + draft/repair envelopes. parentPart links backward; parentId is exclusive. No top-level parentId/materialSourceId. Not atomic: keep successful parts and stop successors on failure; inspections defer.`
        },
        results:
          'Execution: toolOutcome.status/settlement and actionResults, not transport. success/no-op requires acknowledgement, not visual approval/durable save. partial preserves completed work; failed/cancelled keeps acknowledgements. Unknown settlement is not success. completedSteps/parts retain receipts. actionResults[].result.compositionId: continuation root; artifactId/applicable/findings: preparation only; failedStep: failure; checks/measurementIssues/inspectionIssues: follow-up. Use retained targets; keep visual failures.',
        recovery:
          'Never replay completed writes for output/check/part failures. Inspect unconfirmed settlement. Stale reads/credentials need fresh reads/preparation/binding. Invalid preparation writes nothing: fix findings. Safe excess retains source/root in parts; unsupported excess needs correction. After interruption follow remaining-only recoveryInvocation: retry confirmed unfinished work or failed checks/captures, never bypass or auto-retry. instanceRanges selects missing whole instances, not uncertain partial writes. '
      }
    },
    ...definition.inputSchema,
    $defs: {
      ...definition.inputSchema.$defs,
      readyDraft: definition.inputSchema.properties.draft,
      draftRepair: definition.inputSchema.properties.repair
    },
    oneOf: [
      { required: ['draft'], properties: { repair: false, parts: false } },
      { required: ['repair'], properties: { draft: false, parts: false } },
      {
        required: ['parts'],
        properties: {
          draft: false,
          repair: false,
          parentId: false,
          materialSourceId: false
        }
      }
    ],
    not: {
      description: deferredReviewIssue,
      required: ['reviewChecks', 'inspection'],
      properties: { inspection: { const: 'defer' } }
    },
    properties: {
      ...definition.inputSchema.properties,
      draft: { $ref: '#/$defs/readyDraft' },
      repair: { $ref: '#/$defs/draftRepair' },
      parts: {
        type: 'array',
        minItems: 1,
        items: partSchema,
        description:
          'Ordered ready parts. Each has a unique local key and an ordinary draft or repair. Each part is prepared and applied before the next is prepared. Use existing pattern/vector-pattern rules for repeated geometry. Send ready work now rather than gathering the whole design. Earlier successful parts remain applied on later failure; inspect receipts before explicitly submitting remaining work.'
      }
    }
  }
  const partitionParts = (
    prepared: { draftId: string; retainedDraft: { partitions: unknown[] } },
    key: string,
    reserved: Set<string>,
    parentId?: unknown
  ) =>
    prepared.retainedDraft.partitions.map(
      (_partition: unknown, index: number) => {
        let partKey = key
        if (index) {
          partKey = `${key}:partition-${index}`
          while (reserved.has(partKey)) partKey += ':'
          reserved.add(partKey)
        }
        return {
          key: partKey,
          repair: { draftId: prepared.draftId, partition: index },
          ...(index ? { continueFromPart: key } : {}),
          ...(parentId === undefined ? {} : { parentId })
        }
      }
    )
  const assertPartOrder = (
    parts: (Record<string, unknown> & { key: string })[]
  ) => {
    const keys = new Set<string>()
    for (const part of parts) {
      if (
        !part.key.trim() ||
        keys.has(part.key) ||
        (typeof part.parentId === 'string' && !part.parentId.trim()) ||
        (part.continueFromPart !== undefined &&
          (part.parentPart !== undefined ||
            !keys.has(String(part.continueFromPart)) ||
            !part.repair ||
            typeof part.repair !== 'object' ||
            !('partition' in part.repair) ||
            'continueFromArtifact' in part.repair)) ||
        (part.parentPart !== undefined &&
          (part.parentId !== undefined || !keys.has(String(part.parentPart))))
      )
        throw new LocalOperationPreparationError(
          'Parts require unique nonempty keys and either parentId or an earlier parentPart.'
        )
      keys.add(part.key)
    }
    return keys
  }
  return {
    ...single,
    definitions: [
      {
        ...definition,
        inputSchema: {
          ...inputSchema,
          examples: [
            ...(definition.inputSchema.examples ?? []),
            ...(review && judgment
              ? (definition.inputSchema.examples ?? []).flatMap((example) => {
                  const selected = {
                    ...example,
                    reviewChecks: [
                      {
                        criterionId: Object.keys(reviewPlanExample.criteria)[0]
                      }
                    ]
                  }
                  return [selected, { ...selected, plan: reviewPlanExample }]
                })
              : []),
            orderedInputExample
          ]
        },
        description:
          definition.description +
          ' Alternatively supply parts as envelopes, each requiring its own key and draft or repair; do not put bare drafts in parts. key is a local label, not an element ID. Put parentId on each part, never at the top level with parts; alternatively parentPart links an earlier part by its actual returned ID. Single-part draft/repair stays available. Parts are not one atomic batch: failures retain prior receipts and stop successors without retry. Intermediate inspections defer until the end of this block.'
      }
    ],
    resultIssue: (_name: string, value: unknown): string | undefined => {
      const record = (item: unknown): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && !Array.isArray(item)
      if (!record(value)) return 'Design workflow returned no result object'
      const parts = Array.isArray(value.parts) ? value.parts : [value]
      if (!parts.length && value.status === 'complete')
        return 'Design workflow omitted completed parts'
      for (const part of parts) {
        if (!record(part))
          return 'Design workflow returned an invalid part receipt'
        if (
          part.available === false ||
          part.applicable === false ||
          part.failedStep ||
          part.status === 'failed'
        )
          continue
        const issue = designs.resultIssue(AiDesignToolIds.PREPARE_DESIGN, part)
        if (issue) return issue
        if (
          !Array.isArray(part.completedSteps) ||
          !Array.isArray(part.actionResults)
        )
          return 'Design workflow omitted its completed steps or acknowledged actions'
        const applied = part.actionResults.find(
          (entry) =>
            record(entry) &&
            entry.actionName === AiActionNames.APPLY_PREPARED_DESIGN
        )
        if (
          !record(applied) ||
          !record(applied.result) ||
          typeof applied.result.compositionId !== 'string' ||
          !applied.result.compositionId
        )
          return 'Design workflow omitted the acknowledged composition identity; inspect state before retrying'
      }
    },
    rejectInput: (
      name: string,
      args: unknown,
      issues?: readonly OperationInputIssue[]
    ) => {
      if (
        name !== AiDesignToolIds.PREPARE_AND_APPLY_DESIGN ||
        !args ||
        typeof args !== 'object'
      )
        return
      if (!('parts' in args)) return single.rejectInput(name, args, issues)
      if (!Array.isArray(args.parts)) return
      const inputParts = args.parts
      const inputIssues =
        issues ?? operationInputIssues(args, inputSchema) ?? []
      let complete = inputIssues.every(
        (issue) =>
          ['anyOf', 'oneOf', 'allOf'].includes(issue.keyword) ||
          inputParts.some((_part, index) =>
            issue.instancePath.startsWith(`/parts/${index}/draft/`)
          )
      )
      if (complete) {
        try {
          assertPartOrder(args.parts)
        } catch {
          complete = false
        }
      }
      const rejectedParts: Record<string, unknown>[] = []
      const parts = args.parts.map((part, index) => {
        if (!part || typeof part !== 'object') {
          complete = false
          return part
        }
        if (!('draft' in part)) return part
        if (!preparation) {
          complete = false
          return part
        }
        const prefix = `/parts/${index}`
        const partIssues = inputIssues
          .filter((issue) => issue.instancePath.startsWith(prefix + '/draft/'))
          .map((issue) => ({
            ...issue,
            instancePath: issue.instancePath.slice(prefix.length)
          }))
        const details = designs.rejectInput(
          AiDesignToolIds.PREPARE_DESIGN,
          { draft: part.draft },
          partIssues
        )
        if (partIssues.length || !details?.draftId)
          rejectedParts.push({
            index,
            ...(typeof part.key === 'string' ? { key: part.key } : {}),
            ...details
          })
        const repair =
          details?.repairGuide?.arguments.repair ??
          (!partIssues.length && details?.draftId
            ? { draftId: details.draftId, replacements: [] }
            : undefined)
        if (!repair) {
          complete = false
          return part
        }
        const { draft: _draft, ...context } = part
        return { ...context, repair }
      })
      return rejectedParts.length
        ? {
            recovery: 'correct_input',
            rejectedParts,
            ...(complete
              ? {
                  repairGuide: {
                    tool: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
                    arguments: { ...args, parts },
                    instructions:
                      'Fill the returned replacement values and invoke these arguments. Empty replacements reuse validated retained source. Preserve part order, parents and workflow options. No part has executed; do not resend geometry. Expired references require fresh preparation.'
                  }
                }
              : {})
          }
        : undefined
    },
    explainInputIssue: (name: string, args: unknown) =>
      args && typeof args === 'object' && 'parts' in args
        ? undefined
        : single.explainInputIssue(name, args),
    call: async function call(
      name: string,
      args: unknown,
      signal: AbortSignal
    ): Promise<string> {
      signal.throwIfAborted()
      if (!args || typeof args !== 'object' || !('parts' in args)) {
        const result = JSON.parse(await single.call(name, args, signal))
        if (!result.available || !result.retainedDraft?.partitions)
          return JSON.stringify(
            await finishReview(
              result,
              (args as Record<string, unknown>)?.reviewChecks,
              signal
            )
          )
        const input = args as Record<string, unknown>
        return call(
          name,
          {
            parts: partitionParts(
              result,
              'partition-0',
              new Set(['partition-0']),
              input.parentId
            ),
            ...(input.plan === undefined ? {} : { plan: input.plan }),
            ...(input.reviewChecks === undefined
              ? {}
              : { reviewChecks: input.reviewChecks }),
            ...(input.message === undefined ? {} : { message: input.message }),
            inspection: input.inspection ?? 'immediate',
            response: input.response ?? 'compact'
          },
          signal
        )
      }
      if (name !== AiDesignToolIds.PREPARE_AND_APPLY_DESIGN)
        throw new LocalOperationPreparationError(
          'Combined preparation/application is unavailable.'
        )
      const issue = operationInputIssue(args, inputSchema)
      if (issue) throw new LocalOperationPreparationError(issue)
      const input = args as Record<string, unknown>
      const parts = [
        ...(input.parts as (Record<string, unknown> & { key: string })[])
      ]
      const keys = assertPartOrder(parts)
      const completed: Record<string, unknown>[] = []
      const inspectionTargets = new Set<string>()
      const finish = async (result: Record<string, unknown>) => {
        const captureTarget = [...inspectionTargets].at(-1)
        const followup = await operations.finishInspection(
          inspectionTargets,
          captureTarget,
          input.inspection === 'defer',
          signal,
          result.settlement === 'unknown' || result.status === 'unknown',
          input.response === 'full'
        )
        const delivered = {
          ...result,
          ...followup,
          parts: completed.map((part) => ({
            ...part,
            measurementDeferred: false
          }))
        }
        const outcome = localToolOutcome(delivered)
        return JSON.stringify(
          await finishReview(
            {
              ...delivered,
              ...(result.status === 'complete' && outcome.status !== 'success'
                ? {
                    status: outcome.status,
                    complete: false,
                    settlement: outcome.settlement
                  }
                : {})
            },
            input.reviewChecks,
            signal
          )
        )
      }
      const parentIds = new Map<string, string>()
      const artifactIds = new Map<string, string>()
      const recoveryInvocation = (start: number) => {
        // Only retained sources can continue without resending geometry.
        if (
          parts
            .slice(start)
            .some(
              (part) =>
                !part.repair ||
                typeof part.repair !== 'object' ||
                (!('partition' in part.repair) &&
                  !('replacements' in part.repair))
            )
        )
          return
        const pendingKeys = new Set(parts.slice(start).map((part) => part.key))
        const remaining = parts.slice(start).map((part) => {
          const failed = completed.find((entry) => entry.key === part.key)
          const guide = failed?.repairGuide as
            | { arguments?: { repair?: unknown; materialSourceId?: unknown } }
            | undefined
          const preparationRecovery =
            failed?.failedStep === preparation?.name &&
            failed?.settlement === 'not-started'
              ? guide?.arguments
              : undefined
          const repair = preparationRecovery?.repair ?? part.repair
          if (!repair || typeof repair !== 'object') return
          let restored: Record<string, unknown> & {
            key: string
            repair: object
          } = { ...part, repair }
          if (preparationRecovery?.repair) {
            const { materialSourceId: _materialSource, ...context } = restored
            restored = {
              ...context,
              ...(preparationRecovery.materialSourceId === undefined
                ? {}
                : { materialSourceId: preparationRecovery.materialSourceId })
            }
          }
          if (
            part.parentPart !== undefined &&
            !pendingKeys.has(String(part.parentPart))
          ) {
            const parentId = parentIds.get(String(part.parentPart))
            if (!parentId) return
            const { parentPart: _parentPart, ...rest } = restored
            restored = { ...rest, parentId }
          }
          if (part.continueFromPart === undefined) {
            if ('continueFromArtifact' in repair) {
              if (typeof repair.continueFromArtifact !== 'string') return
              try {
                designs.resolveRecipe(repair.continueFromArtifact)
              } catch {
                return
              }
            }
            return restored
          }
          const artifactId = artifactIds.get(String(part.continueFromPart))
          if (!artifactId)
            return pendingKeys.has(String(part.continueFromPart))
              ? restored
              : undefined
          try {
            designs.resolveRecipe(artifactId)
          } catch {
            return
          }
          const { continueFromPart: _reference, ...rest } = restored
          return {
            ...rest,
            repair: { ...repair, continueFromArtifact: artifactId }
          }
        })
        if (!remaining.length || remaining.some((part) => !part)) return
        return {
          name: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
          arguments: {
            parts: remaining,
            ...(start === 0 &&
            input.plan !== undefined &&
            !(
              Array.isArray(completed[0]?.completedSteps) &&
              completed[0].completedSteps.includes(review?.name)
            )
              ? { plan: input.plan }
              : {}),
            ...(input.message === undefined ? {} : { message: input.message }),
            ...(input.reviewChecks === undefined
              ? {}
              : { reviewChecks: input.reviewChecks }),
            inspection: input.inspection ?? 'defer',
            response: input.response ?? 'compact'
          }
        }
      }
      for (let index = 0; index < parts.length; index++) {
        const part = parts[index]
        signal.throwIfAborted()
        const parentId =
          part.parentPart === undefined
            ? part.parentId
            : parentIds.get(String(part.parentPart))
        if (part.parentPart !== undefined && parentId === undefined)
          return finish({
            status: 'partial',
            complete: false,
            parts: completed,
            failedPart: part.key,
            remainingParts: parts.slice(index).map((entry) => entry.key),
            message:
              'Earlier receipt did not supply a composition ID. Inspect acknowledged state before continuing; do not replay completed parts.'
          })
        const receipt = JSON.parse(
          await single.call(
            name,
            {
              ...('repair' in part
                ? {
                    repair:
                      part.continueFromPart === undefined
                        ? part.repair
                        : {
                            ...(part.repair as Record<string, unknown>),
                            continueFromArtifact: artifactIds.get(
                              String(part.continueFromPart)
                            )
                          }
                  }
                : { draft: part.draft }),
              ...(part.materialSourceId === undefined
                ? {}
                : { materialSourceId: part.materialSourceId }),
              ...(parentId === undefined ? {} : { parentId }),
              ...(index === 0 && input.reviewChecks !== undefined
                ? { reviewChecks: input.reviewChecks }
                : {}),
              ...(index === 0 && input.plan !== undefined
                ? { plan: input.plan }
                : {}),
              ...(input.message === undefined
                ? {}
                : { message: input.message }),
              ...(input.response === undefined
                ? {}
                : { response: input.response }),
              inspection:
                index === parts.length - 1 ||
                (index === 0 && input.reviewChecks !== undefined)
                  ? (input.inspection ?? 'immediate')
                  : 'defer'
            },
            signal,
            { key: part.key, index },
            inspectionTargets
          )
        )
        if (receipt.available && receipt.retainedDraft?.partitions) {
          parts.splice(
            index,
            1,
            ...partitionParts(receipt, part.key, keys, parentId)
          )
          index--
          continue
        }
        completed.push({ key: part.key, ...receipt })
        const outcome = localToolOutcome(receipt)
        if (
          typeof receipt.artifactId === 'string' &&
          receipt.completedSteps?.includes(apply?.name)
        )
          artifactIds.set(part.key, receipt.artifactId)
        const identity = receipt.actionResults?.find(
          (entry: { actionName: string }) =>
            entry.actionName === AiActionNames.APPLY_PREPARED_DESIGN
        )?.result?.compositionId
        if (typeof identity === 'string' && identity)
          parentIds.set(part.key, identity)
        if (outcome.status !== 'success') {
          let status =
            index || outcome.status === 'partial' ? 'partial' : 'failed'
          if (outcome.status === 'unknown') status = 'unknown'
          let settlement = index ? 'partial' : outcome.settlement
          if (outcome.settlement === 'unknown') settlement = 'unknown'
          return finish({
            status,
            settlement,
            parts: completed,
            failedPart: part.key,
            remainingParts: parts.slice(index + 1).map((entry) => entry.key),
            ...((outcome.settlement === 'not-started' &&
              receipt.failedStep === preparation?.name &&
              receipt.retainedDraft) ||
            outcome.settlement === 'completed'
              ? {
                  recoveryInvocation: recoveryInvocation(
                    outcome.settlement === 'completed' ? index + 1 : index
                  )
                }
              : {})
          })
        }
      }
      return finish({
        status: 'complete',
        complete: true,
        parts: completed
      })
    }
  }
}
