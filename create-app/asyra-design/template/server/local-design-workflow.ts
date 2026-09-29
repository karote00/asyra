import { AiActionNames } from '../src/constants/ai-actions'
import { AiDesignToolIds } from '../src/constants/ai-design'
import type { createLocalDesignTools } from './local-design-tools'
import {
  LocalOperationPreparationError,
  type createLocalOperationTools
} from './local-operation-tools'

/** Compose existing owners; never create a second preparation or execution path. */
export const createLocalDesignWorkflow = (
  designs: ReturnType<typeof createLocalDesignTools>,
  operations: ReturnType<typeof createLocalOperationTools>
) => {
  const preparation = designs.definitions.find(
    (tool) => tool.name === AiDesignToolIds.PREPARE_DESIGN
  )
  const apply = operations.definitions.find(
    (tool) => tool.name === AiActionNames.APPLY_PREPARED_DESIGN
  )
  return {
    definitions:
      preparation && apply
        ? [
            {
              ...preparation,
              name: AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
              description:
                'Prepare and apply one semantic draft in one call, through existing validation and canvas operations. Prefer this when the intended draft is ready to draw. Invalid preparation never applies. Returns preparation findings, actual root identity and review evidence. Default compact response omits duplicated context and ID maps; response=full retains IDs for programmatic filtering. Use inspection=defer only within a planned stage, then inspect its actual result. Does not replace existing objects or retry failures. ' +
                preparation.description,
              inputSchema: {
                ...preparation.inputSchema,
                properties: {
                  ...preparation.inputSchema.properties,
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
          (key) => !['draft', 'message', 'inspection', 'response'].includes(key)
        ) ||
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
          'Provide draft and optional message, inspection, response only.'
        )
      const prepared = JSON.parse(
        await designs.call(
          AiDesignToolIds.PREPARE_DESIGN,
          { draft: input.draft },
          signal
        )
      )
      if (!prepared.available || !prepared.applicable)
        return JSON.stringify(prepared)
      signal.throwIfAborted()
      const receipt = JSON.parse(
        await operations.call(
          AiActionNames.APPLY_PREPARED_DESIGN,
          {
            arguments: {
              artifactId: prepared.artifactId,
              response: input.response ?? 'compact'
            },
            ...(input.message === undefined ? {} : { message: input.message }),
            ...(input.inspection === undefined
              ? {}
              : { inspection: input.inspection })
          },
          signal
        )
      )
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
      return JSON.stringify({ ...prepared, ...receipt })
    }
  }
}
