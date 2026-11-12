import { directResultDeliveryProperties } from './local-design-sequence'
import {
  designRepresentationGuidance,
  suppliedGeometryGuidance
} from './design-preparation-examples'
import type { AiInvocationMiddleware } from '@asyra/ai-agent-runtime'
import {
  toolInternalResult,
  toolSemantics,
  toolResultObject,
  toolDocumentReference,
  toolRequestReference
} from '../src/ai/tool-contract'
import {
  invokeLocalTool,
  observeLocalToolExecution,
  localToolOutcome,
  localToolDeliveryResult,
  type LocalToolObservation
} from './local-tool-invocation'
import { designCheckSummarySchema } from './design-check-results'
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
  type createLocalOperationTools
} from './local-operation-tools'

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
  // The wrapper exports child resources as well as their execution receipts.
  // Keep the preparation contract intact so call cleanup can transfer ownership.
  const createdTargetsSchema = {
    type: 'array',
    items: toolResultObject({
      compositionId: toolDocumentReference,
      keyToId: { type: 'object', additionalProperties: toolDocumentReference }
    })
  }
  const followupFields = {
    createdTargets: createdTargetsSchema,
    inspectionDeferred: { type: 'boolean' },
    executionIssues: { type: 'array', items: { type: 'object' } },
    inspectionIssues: { type: 'array', items: { type: 'object' } },
    batchFailure: { type: 'object' },
    executionResult: toolResultObject(
      {
        actionResults: { type: 'array' },
        batches: { type: 'array' },
        context: toolInternalResult({}),
        failure: { type: 'object' },
        checks: designCheckSummarySchema,
        inspectionDeferred: { type: 'boolean' },
        executionIssues: { type: 'array' },
        inspectionIssues: { type: 'array' }
      },
      []
    ),
    key: { type: 'string' },
    recoverable: { type: 'boolean' },
    stage: { type: 'string' },
    receiptScope: { enum: ['compact', 'full'] },
    context: toolInternalResult({}),
    status: { type: 'string' },
    settlement: { type: 'string' },
    complete: { type: 'boolean' },
    toolOutcome: { type: 'object' }
  }
  const followupSchema = toolResultObject(followupFields, [])
  const partOutputSchema = {
    allOf: [
      artifactPreparation?.outputSchema ?? false,
      followupSchema,
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
  const stoppedPartSchema = {
    allOf: [
      toolResultObject(designs.recoveryFields, []),
      followupSchema,
      toolResultObject(
        {
          actionResults: { type: 'array' },
          checks: designCheckSummarySchema,
          failedStep: { type: 'string' },
          completedSteps: { type: 'array', items: { type: 'string' } },
          artifactId: toolRequestReference
        },
        ['failedStep', 'completedSteps']
      )
    ]
  }
  const stoppedOutputSchema = {
    allOf: [followupSchema],
    anyOf: [
      stoppedPartSchema,
      toolResultObject(
        {
          checks: designCheckSummarySchema,
          actionResults: { type: 'array' },
          failedPart: { type: 'string' },
          message: { type: 'string' },
          remainingParts: { type: 'array' },
          recoveryInvocation: { type: 'object' },
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

  const acknowledgedRoot = (part: Record<string, unknown>) => {
    const entry =
      Array.isArray(part.actionResults) &&
      part.actionResults.find(
        (entry) => entry?.actionName === AiActionNames.APPLY_PREPARED_DESIGN
      )

    return typeof entry?.result?.compositionId === 'string' &&
      entry.result.compositionId
      ? (entry.result.compositionId as string)
      : undefined
  }

  const finishDelivery = (result: Record<string, unknown>) => {
    if (localToolOutcome(result).status !== 'success') {
      return result
    }

    const parts = Array.isArray(result.parts) ? result.parts : [result]
    const roots = parts.map(acknowledgedRoot)

    return roots.length && roots.every((id) => typeof id === 'string')
      ? {
          ...result,
          compositionIds: [...new Set(roots)],
          createdTargets: parts.flatMap((part) =>
            Array.isArray(part.createdTargets) ? part.createdTargets : []
          )
        }
      : result
  }

  const compositionIdsSchema = {
    type: 'array',
    minItems: 1,
    items: toolDocumentReference
  }
  const semantics = toolSemantics(
    {
      allOf: [followupSchema],
      anyOf: [
        partOutputSchema,
        toolResultObject(
          {
            actionResults: { type: 'array' },
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
    projectModelResult(name: string, args: unknown, value: unknown): unknown {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value
      }

      const source = value as Record<string, unknown>
      const projected = operations.projectModelResult(
        name,
        args,
        source
      ) as Record<string, unknown>

      return localToolDeliveryResult(source, {
        ...projected,
        ...(Array.isArray(source.parts)
          ? {
              parts: source.parts.map((part) =>
                single.projectModelResult(name, args, part)
              )
            }
          : {})
      })
    },

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
      ) {
        return
      }

      const details = designs.rejectInput(
        AiDesignToolIds.PREPARE_DESIGN,
        args,
        issues
      )

      if (!details?.repairGuide) {
        return details
      }

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
              revision: 9,
              partialOutputSchema: {
                anyOf: [semantics.partialOutputSchema, stoppedOutputSchema]
              },
              recoveryOutputSchema: stoppedOutputSchema,
              name: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
              executionAccess: LocalToolAccess.EXCLUSIVE,
              description:
                'Prepare and apply one ready retained part, through existing validation and canvas operations. Optional parentId attaches this part to an existing container in parent-local coordinates. The successful compositionIds list contains acknowledged roots in creation order. Bind /compositionIds/0 for a single created part; the same ID can anchor later parts; no full ID map is needed for continuation. Invalid preparation never applies. Safe capacity plans execute through ordered retained parts in this call; only actual receipts prove writes. Returns preparation findings, actual root identity and requested captures. Default compact response omits duplicated context, ID maps and pure work/timing diagnostics; full retains them. Operation results, limitations and recovery remain complete. Use inspection=defer when no immediate visual decision is needed, then inspect at the next visual decision boundary. Does not replace existing objects or retry failures. ' +
                designRepresentationGuidance,
              inputSchema: {
                ...preparation.inputSchema,
                properties: {
                  ...preparation.inputSchema.properties,
                  parentId: {
                    ...toolDocumentReference,
                    description:
                      'Existing editable container for this ready part; coordinates are parent-local. Omit for workspace insertion.'
                  },
                  message: { type: 'string', minLength: 1, maxLength: 1000 },
                  inspection: { type: 'string', enum: ['immediate', 'defer'] },
                  response: { type: 'string', enum: ['compact', 'full'] },
                  includeTargets: {
                    type: 'boolean',
                    description:
                      'Select portable source-key to applied-element mappings in createdTargets. For later edits retain /createdTargets with status delivery; no map is returned by default. Consumers revalidate current document IDs.'
                  }
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
      ) {
        throw new LocalOperationPreparationError(
          'Combined preparation/application is unavailable.'
        )
      }

      const input = args as Record<string, unknown>
      const hasExactlyOnePreparationSource =
        'draft' in input !== 'repair' in input

      if (
        !hasExactlyOnePreparationSource ||
        Object.keys(input).some(
          (key) =>
            ![
              'draft',
              'repair',
              'materialSourceId',
              'retain',
              'delivery',
              'message',
              'inspection',
              'response',
              'includeTargets',
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
      ) {
        throw new LocalOperationPreparationError(
          'Provide draft or repair, and optional parentId, message, inspection, response only.'
        )
      }

      const projectExecutionReceipt = (
        value: Record<string, unknown>
      ): Record<string, unknown> => {
        const delivered = { ...value }

        if (Array.isArray(value.actionResults)) {
          delivered.actionResults = value.actionResults.map((entry) => {
            if (
              entry?.actionName !== AiActionNames.APPLY_PREPARED_DESIGN ||
              !entry.result ||
              typeof entry.result !== 'object' ||
              Array.isArray(entry.result)
            ) {
              return entry
            }

            const { timing: _timing, ...result } = entry.result

            return { ...entry, result }
          })
        }

        const record = (entry: unknown): entry is Record<string, unknown> =>
          !!entry && typeof entry === 'object' && !Array.isArray(entry)

        // Only existing execution-protocol containers, never user/recovery data.
        if (record(value.executionResult)) {
          delivered.executionResult = projectExecutionReceipt(
            value.executionResult
          )
        }

        if (Array.isArray(value.batches)) {
          delivered.batches = value.batches.map((batch) =>
            record(batch) ? projectExecutionReceipt(batch) : batch
          )
        }

        return delivered
      }

      const deliver = (value: Record<string, unknown>) => {
        if (input.response === 'full') {
          return JSON.stringify(value)
        }

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

        if (localToolOutcome(result).status === 'success') {
          completedSteps.push(step.name)
        }

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

      if (prepared.available && prepared.retainedDraft?.partitions) {
        return deliver(prepared)
      }

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

      const receipt = await runStep(operations, apply, {
        arguments: {
          artifactId: prepared.artifactId,
          response:
            input.includeTargets === true
              ? 'full'
              : (input.response ?? 'compact'),
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
        (receipt.executionIssues?.length || receipt.inspectionIssues?.length)

      if (
        applicationOutcome.status !== 'success' &&
        !appliedWithIncompleteFollowup
      ) {
        return deliver(stoppedAt(receipt, apply.name))
      }

      if (appliedWithIncompleteFollowup) {
        completedSteps.push(apply.name)
      }

      receipt.createdTargets =
        input.includeTargets === true
          ? (receipt.actionResults ?? []).flatMap(
              (entry: {
                actionName: string
                result?: { compositionId?: unknown; keyToId?: unknown }
              }) =>
                entry.actionName === AiActionNames.APPLY_PREPARED_DESIGN &&
                entry.result?.keyToId
                  ? [
                      {
                        compositionId: entry.result.compositionId,
                        keyToId: entry.result.keyToId
                      }
                    ]
                  : []
            )
          : []

      if (input.response !== 'full') {
        delete receipt.context
        for (const entry of receipt.actionResults ?? []) {
          if (entry.actionName !== AiActionNames.APPLY_PREPARED_DESIGN) {
            continue
          }

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

  if (!definition) {
    return single
  }

  const partSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['key'],
    oneOf: [{ required: ['draft'] }, { required: ['repair'] }],
    properties: {
      key: { type: 'string', minLength: 1, maxLength: 160 },
      materialSourceId: definition.inputSchema.properties.materialSourceId,
      ...directResultDeliveryProperties,
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
      optionalInputs: ['retain', 'delivery'],
      optionalInputPaths: {
        layout: ['/$defs/readyDraft', '/$defs/node/anyOf/0'].flatMap((path) =>
          ['layout', 'padding', 'gap', 'columns', 'align'].map(
            (field) => `${path}/properties/${field}`
          )
        ),
        relations: ['/$defs/readyDraft/properties/relations'],
        sharedFills: ['/$defs/readyDraft/properties/sharedFills']
      },
      selection: `Choose component contents and painter order, then outer repetition and operation/nodeTypes for the next submitted part. Component order: one pattern of face/grid members. Layer order: sibling patterns, with independent nodes at their painter positions. For either, define members once; axes count/step set translation. Selecting projected-face/surface-grid includes pattern with members; no extra query is needed. Examples are optional; select types for independent siblings. inputScope usage gives complete parameters/results/recovery. draft creates an artifact within ${designs.expandedNodeLimit} expanded objects or continues a safely partitionable source through retained parts in this call; repair corrects retained preparation; parts submits independent artifacts exceeding that total together, each within limits, with partial receipts. Independent world-space planar faces in a shared orthographic projection: projected-face. Pattern-only queries include all face/grid members; content queries include only selected kinds. origin sets the start. For faces mode, explicitly select pattern. surface-grid repeats normalized motifs on a planar convex four-corner boundary using rows/columns and painter order. Select grid if this submission needs it; later grid details may be added separately when useful. Arbitrary or already-projected 2D outlines: vector; identical 2D curves: vector-pattern. Guides include root group/frame; nodeTypes selects children, including nested containers. Nest group for organization, frame for size; rect/oval/text for primitives. Root changes need no query. optionalInputs: retain, delivery. Preserve authored inputs with source:"input" or portable result fields by path; omit step. Request handles are not conversation values. Omit unused optional inputs without rereading. Select used types only. Size/rotation/irregular exceptions stay explicit. Templates reduce input, not output budgets; safe excess continues via retained parts. Use parts for independent layers or bounded complete-instance ranges; never replay acknowledged parts. No Knowledge or planning call is required. Known scopes can read directly; full schema/field queries remain available.`,
      usage: {
        resultPaths: ['/createdTargets'],
        instructions:
          'nodeTypes selects children; root group/frame needs no reread. ' +
          ' inspection=defer writes; full adds maps. Select optionalInputs layout/relations/sharedFills before using those authoring groups; templates and overrides remain available. No live Auto Layout/clipping/frame borders/radii. ' +
          suppliedGeometryGuidance +
          ' Resolve overflow; render text-metrics-required. AI judges visuals; edit target IDs only.',
        operations: {
          draft: `draft: ${designs.expandedNodeLimit} expanded objects/artifact; safe excess continues via retained parts. For ready drafts use execute_design.operations with the same draft arguments under each prepare_and_apply_design operation; no parts lookup is needed.`,
          repair:
            'Supply repair only, not draft or parts. Use an owned current source artifact and exact repair operations; keep unaffected geometry and valid artifacts. Repair preparation does not authorize replay of an earlier application.',
          parts: `Independent sources: each part artifact fits ${designs.expandedNodeLimit} expanded objects; safe excess continues via retained partitions. Supply ordered key + draft/repair envelopes. parentPart links backward; parentId is exclusive. No top-level parentId/materialSourceId. Not atomic: keep successful parts and stop successors on failure; inspections defer.`
        },
        results:
          'Check toolOutcome.status/settlement, actionResults, completedSteps/parts and follow-up issues. For decided edits or captures bind /compositionIds/0 in the same execute_design call; return after the evidence needed for a new decision. retain source:"input",path:"/draft" saves the authored stage; later arguments can bind its named subfields without reading the draft back. partial preserves completed work.',
        recovery:
          'Never replay completed writes. Inspect unknown settlement; refresh stale evidence. Correct invalid preparation before writing. Use recoveryInvocation for remaining parts or checks; instanceRanges selects missing whole instances.'
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
    properties: {
      ...definition.inputSchema.properties,
      ...directResultDeliveryProperties,
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
          while (reserved.has(partKey)) {
            partKey += ':'
          }

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
      const hasInvalidPartIdentity =
        !part.key.trim() ||
        keys.has(part.key) ||
        (typeof part.parentId === 'string' && !part.parentId.trim())
      const hasInvalidContinuation =
        !hasInvalidPartIdentity &&
        part.continueFromPart !== undefined &&
        (part.parentPart !== undefined ||
          !keys.has(String(part.continueFromPart)) ||
          !part.repair ||
          typeof part.repair !== 'object' ||
          !('partition' in part.repair) ||
          'continueFromArtifact' in part.repair)
      const hasInvalidParentReference =
        !hasInvalidPartIdentity &&
        !hasInvalidContinuation &&
        part.parentPart !== undefined &&
        (part.parentId !== undefined || !keys.has(String(part.parentPart)))

      if (
        hasInvalidPartIdentity ||
        hasInvalidContinuation ||
        hasInvalidParentReference
      ) {
        throw new LocalOperationPreparationError(
          'Parts require unique nonempty keys and either parentId or an earlier parentPart.'
        )
      }

      keys.add(part.key)
    }

    return keys
  }

  return {
    ...single,
    definitions: [
      {
        ...definition,
        outputSchema: {
          ...(semantics.outputSchema as Record<string, unknown>),
          ...toolResultObject({
            compositionIds: compositionIdsSchema,
            createdTargets: createdTargetsSchema
          })
        },
        inputSchema: {
          ...inputSchema,
          examples: [
            ...(definition.inputSchema.examples ?? []),
            orderedInputExample
          ]
        },
        description:
          definition.description +
          ' Direct retain/delivery use App context; omit step. Retain only saves selected portable values; omitted delivery preserves the final public result and images. Use delivery:status only when no work values or images are needed. Saving never replays writes. ' +
          ' Alternatively supply parts as envelopes, each requiring its own key and draft or repair; do not put bare drafts in parts. key is a local label, not an element ID. Put parentId on each part, never at the top level with parts; alternatively parentPart links an earlier part by its actual returned ID. Single-part draft/repair stays available. Parts are not one atomic batch: failures retain prior receipts and stop successors without retry. Intermediate inspections defer until the end of this block.'
      }
    ],

    resultIssue: (_name: string, value: unknown): string | undefined => {
      const record = (item: unknown): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && !Array.isArray(item)

      if (!record(value)) {
        return 'Design workflow returned no result object'
      }

      const parts = Array.isArray(value.parts) ? value.parts : [value]

      if (!parts.length && value.status === 'complete') {
        return 'Design workflow omitted completed parts'
      }

      for (const part of parts) {
        if (!record(part)) {
          return 'Design workflow returned an invalid part receipt'
        }

        if (
          part.available === false ||
          part.applicable === false ||
          part.failedStep ||
          part.status === 'failed'
        ) {
          continue
        }

        const issue = designs.resultIssue(AiDesignToolIds.PREPARE_DESIGN, part)

        if (issue) {
          return issue
        }

        if (
          !Array.isArray(part.completedSteps) ||
          !Array.isArray(part.actionResults)
        ) {
          return 'Design workflow omitted its completed steps or acknowledged actions'
        }

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
        ) {
          return 'Design workflow omitted the acknowledged composition identity; inspect state before retrying'
        }
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
      ) {
        return
      }

      if (!('parts' in args)) {
        return single.rejectInput(name, args, issues)
      }

      if (!Array.isArray(args.parts)) {
        return
      }

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

        if (!('draft' in part)) {
          return part
        }

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

        if (partIssues.length || !details?.draftId) {
          rejectedParts.push({
            index,
            ...(typeof part.key === 'string' ? { key: part.key } : {}),
            ...details
          })
        }

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
      if (
        args &&
        typeof args === 'object' &&
        ('retain' in args || 'delivery' in args)
      ) {
        throw new LocalOperationPreparationError(
          'Result delivery is handled at the host entry. Inside execute_design select retain/delivery on that enclosing call.'
        )
      }

      if (!args || typeof args !== 'object' || !('parts' in args)) {
        const result = JSON.parse(await single.call(name, args, signal))

        if (!result.available || !result.retainedDraft?.partitions) {
          return JSON.stringify(finishDelivery(result))
        }

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
            ...(input.message === undefined ? {} : { message: input.message }),
            inspection: input.inspection ?? 'immediate',
            response: input.response ?? 'compact',
            ...(input.includeTargets === undefined
              ? {}
              : { includeTargets: input.includeTargets })
          },
          signal
        )
      }

      if (name !== AiDesignToolIds.PREPARE_AND_APPLY_DESIGN) {
        throw new LocalOperationPreparationError(
          'Combined preparation/application is unavailable.'
        )
      }

      const issue = operationInputIssue(args, inputSchema)

      if (issue) {
        throw new LocalOperationPreparationError(issue)
      }

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
          captureTarget,
          input.inspection === 'defer',
          signal,
          result.settlement === 'unknown' || result.status === 'unknown'
        )
        const delivered = {
          ...result,
          ...followup,
          parts: completed
        }
        const outcome = localToolOutcome(delivered)

        return JSON.stringify(
          finishDelivery({
            ...delivered,
            ...(result.status === 'complete' && outcome.status !== 'success'
              ? {
                  status: outcome.status,
                  complete: false,
                  settlement: outcome.settlement
                }
              : {})
          })
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
        ) {
          return
        }

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

          if (!repair || typeof repair !== 'object') {
            return
          }

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

            if (!parentId) {
              return
            }

            const { parentPart: _parentPart, ...rest } = restored

            restored = { ...rest, parentId }
          }

          if (part.continueFromPart === undefined) {
            if ('continueFromArtifact' in repair) {
              if (typeof repair.continueFromArtifact !== 'string') {
                return
              }

              try {
                designs.resolveRecipe(repair.continueFromArtifact)
              } catch {
                return
              }
            }

            return restored
          }

          const artifactId = artifactIds.get(String(part.continueFromPart))

          if (!artifactId) {
            return pendingKeys.has(String(part.continueFromPart))
              ? restored
              : undefined
          }

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

        if (!remaining.length || remaining.some((part) => !part)) {
          return
        }

        return {
          name: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
          arguments: {
            parts: remaining,
            ...(input.message === undefined ? {} : { message: input.message }),
            inspection: input.inspection ?? 'defer',
            response: input.response ?? 'compact',
            ...(input.includeTargets === undefined
              ? {}
              : { includeTargets: input.includeTargets })
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

        if (part.parentPart !== undefined && parentId === undefined) {
          return finish({
            status: 'partial',
            complete: false,
            parts: completed,
            failedPart: part.key,
            remainingParts: parts.slice(index).map((entry) => entry.key),
            message:
              'Earlier receipt did not supply a composition ID. Inspect acknowledged state before continuing; do not replay completed parts.'
          })
        }

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
              ...(input.message === undefined
                ? {}
                : { message: input.message }),
              ...(input.includeTargets === undefined
                ? {}
                : { includeTargets: input.includeTargets }),
              ...(input.response === undefined
                ? {}
                : { response: input.response }),
              inspection:
                index === parts.length - 1
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
        ) {
          artifactIds.set(part.key, receipt.artifactId)
        }

        const identity = acknowledgedRoot(receipt)

        if (typeof identity === 'string' && identity) {
          parentIds.set(part.key, identity)
        }

        if (outcome.status !== 'success') {
          let status =
            index || outcome.status === 'partial' ? 'partial' : 'failed'

          if (outcome.status === 'unknown') {
            status = 'unknown'
          }

          let settlement = index ? 'partial' : outcome.settlement

          if (outcome.settlement === 'unknown') {
            settlement = 'unknown'
          }

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
