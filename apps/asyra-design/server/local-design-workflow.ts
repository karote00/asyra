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
  return {
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
      signal: AbortSignal
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
        !('draft' in input) ||
        Object.keys(input).some(
          (key) =>
            ![
              'draft',
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
          'Provide draft and optional registered plan, parentId, message, inspection, response only.'
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
          observation,
          step.description
        )
        const result = JSON.parse(text)
        if (localToolOutcome(result).status === 'usable')
          completedSteps.push(step.name)
        return result
      }
      const prepared = await runStep(designs, preparation, {
        draft: input.draft
      })
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
}
