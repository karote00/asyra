import {
  invokeLocalTool,
  observeLocalToolExecution,
  localToolOutcome,
  type LocalToolObservation
} from './local-tool-invocation'
import { reviewPlanSchema } from './local-design-review'
import { operationInputIssue } from './operation-input-schema'
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
  executionEvidence?: () => unknown
) => {
  const preparation = designs.definitions.find(
    (tool) => tool.name === AiDesignToolIds.PREPARE_DESIGN
  )
  const apply = operations.definitions.find(
    (tool) => tool.name === AiActionNames.APPLY_PREPARED_DESIGN
  )
  const review = operations.definitions.find(
    (tool) => tool.name === AiDesignToolIds.RECORD_DESIGN_REVIEW
  )
  const single = {
    explainInputIssue: (name: string, args: unknown) =>
      name === AiDesignToolIds.PREPARE_AND_APPLY_DESIGN
        ? designs.explainInputIssue(AiDesignToolIds.PREPARE_DESIGN, args)
        : undefined,
    definitions:
      preparation && apply
        ? [
            {
              ...preparation,
              name: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
              executionAccess: LocalToolAccess.EXCLUSIVE,
              description:
                'Optional plan records request-linked review criteria in this same call. Omit it to draw a ready part immediately; record initial criteria with record_design_review before semantic review. Established criteria cannot be rewritten after drawing. Prepare and apply one ready retained part, through existing validation and canvas operations. Call before generating later details or researching another part; do not accumulate a complete design first. Optional parentId attaches this part to an existing container in parent-local coordinates. The compact compositionId identifies the new part and is sufficient to attach later parts; no full ID map is needed for continuation. Invalid preparation never applies. Returns preparation findings, actual root identity and review evidence. Default compact response omits duplicated context and ID maps; response=full retains IDs for programmatic filtering. Use inspection=defer when no immediate visual decision is needed, then inspect at the next visual decision boundary. Does not replace existing objects or retry failures. ' +
                preparation.description,
              inputSchema: {
                ...preparation.inputSchema,
                properties: {
                  ...preparation.inputSchema.properties,
                  ...(review ? { plan: reviewPlanSchema } : {}),
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
      part?: { key: string; index: number }
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
              ...(review ? ['plan'] : []),
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
          'Provide draft or repair, and optional registered plan, parentId, message, inspection, response only.'
        )
      if (input.plan !== undefined) {
        const issue = operationInputIssue(input.plan, reviewPlanSchema)
        if (issue) throw new LocalOperationPreparationError(issue)
      }
      const completedSteps: string[] = []
      const runStep = async (
        owner: typeof designs | typeof operations,
        step: { name: string; inputSchema: unknown; description: string },
        arguments_: unknown
      ) => {
        signal.throwIfAborted()
        const text = await observeLocalToolExecution(
          step.name,
          arguments_,
          async () => {
            const reply = await invokeLocalTool(
              owner,
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
          step.description
        )
        const result = JSON.parse(text)
        if (localToolOutcome(result).status === 'usable')
          completedSteps.push(step.name)
        return result
      }
      const preparationInput =
        'repair' in input ? { repair: input.repair } : { draft: input.draft }
      const prepared = await runStep(designs, preparation, preparationInput)
      const stoppedAt = (result: Record<string, unknown>, step: string) => ({
        ...result,
        ...(prepared.artifactId ? { artifactId: prepared.artifactId } : {}),
        completedSteps,
        failedStep: step
      })
      if (!prepared.available || !prepared.applicable)
        return JSON.stringify(stoppedAt(prepared, preparation.name))
      signal.throwIfAborted()
      if (input.plan !== undefined && review) {
        const planned = await runStep(operations, review, input.plan)
        if (localToolOutcome(planned).status !== 'usable')
          return JSON.stringify(stoppedAt(planned, review.name))
      }
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
      if (localToolOutcome(receipt).status !== 'usable')
        return JSON.stringify(stoppedAt(receipt, apply.name))
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
      return JSON.stringify({ ...prepared, ...receipt, completedSteps })
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
      draft: { $ref: '#/$defs/readyDraft' },
      repair: { $ref: '#/$defs/draftRepair' },
      parentId: definition.inputSchema.properties.parentId,
      parentPart: {
        type: 'string',
        minLength: 1,
        description:
          'Local key of an earlier successful part whose actual composition ID becomes this parent. Not a canonical ID. Mutually exclusive with parentId.'
      }
    }
  }
  const inputSchema = {
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
        properties: { draft: false, repair: false, parentId: false }
      }
    ],
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
  return {
    ...single,
    definitions: [
      {
        ...definition,
        inputSchema,
        description:
          definition.description +
          ' Alternatively supply parts for an ordered responsibility block of ready geometry; optional parentPart links an earlier part by its actual returned ID. Single-part draft/repair stays available. Parts are not one atomic batch: failures retain prior receipts and stop successors without retry. Intermediate inspections defer until the end of this block.'
      }
    ],
    explainInputIssue: (name: string, args: unknown) =>
      args && typeof args === 'object' && 'parts' in args
        ? undefined
        : single.explainInputIssue(name, args),
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal
    ): Promise<string> => {
      signal.throwIfAborted()
      if (!args || typeof args !== 'object' || !('parts' in args))
        return single.call(name, args, signal)
      if (name !== AiDesignToolIds.PREPARE_AND_APPLY_DESIGN)
        throw new LocalOperationPreparationError(
          'Combined preparation/application is unavailable.'
        )
      const issue = operationInputIssue(args, inputSchema)
      if (issue) throw new LocalOperationPreparationError(issue)
      const input = args as Record<string, unknown>
      const parts = input.parts as (Record<string, unknown> & { key: string })[]
      const keys = new Set<string>()
      for (const part of parts) {
        if (
          !part.key.trim() ||
          keys.has(part.key) ||
          (typeof part.parentId === 'string' && !part.parentId.trim()) ||
          (part.parentPart !== undefined &&
            (part.parentId !== undefined || !keys.has(String(part.parentPart))))
        )
          throw new LocalOperationPreparationError(
            'Parts require unique nonempty keys and either parentId or an earlier parentPart.'
          )
        keys.add(part.key)
      }
      const completed: Record<string, unknown>[] = []
      const parentIds = new Map<string, string>()
      for (const [index, part] of parts.entries()) {
        signal.throwIfAborted()
        const parentId =
          part.parentPart === undefined
            ? part.parentId
            : parentIds.get(String(part.parentPart))
        if (part.parentPart !== undefined && parentId === undefined)
          return JSON.stringify({
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
                ? { repair: part.repair }
                : { draft: part.draft }),
              ...(parentId === undefined ? {} : { parentId }),
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
                index === parts.length - 1
                  ? (input.inspection ?? 'immediate')
                  : 'defer'
            },
            signal,
            { key: part.key, index }
          )
        )
        completed.push({ key: part.key, ...receipt })
        const outcome = localToolOutcome(receipt)
        if (outcome.status !== 'usable')
          return JSON.stringify({
            status:
              index || outcome.status === 'partial' ? 'partial' : 'failed',
            parts: completed,
            failedPart: part.key,
            remainingParts: parts.slice(index + 1).map((entry) => entry.key)
          })
        const identity = receipt.actionResults?.find(
          (entry: { actionName: string }) =>
            entry.actionName === AiActionNames.APPLY_PREPARED_DESIGN
        )?.result?.compositionId
        if (typeof identity === 'string' && identity)
          parentIds.set(part.key, identity)
      }
      return JSON.stringify({
        status: 'complete',
        complete: true,
        parts: completed
      })
    }
  }
}
