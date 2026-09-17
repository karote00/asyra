import { randomUUID } from 'node:crypto'
import { AiActionNames } from '../src/constants/ai-actions'
import type {
  AiActionBatch,
  AiProviderInput,
  AiBatchReceipt
} from '../src/ai/action-batch-protocol'
import type { createLocalImageTools } from './local-image-tools'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Tool-specific preparation stays on the server; only canonical receipts return to the model. */
export const createLocalOperationTools = (
  actions: AiProviderInput['actions'],
  images: ReturnType<typeof createLocalImageTools>,
  executeBatch: (batch: AiActionBatch) => Promise<AiBatchReceipt>
) => {
  const allowed = new Set<string>(Object.values(AiActionNames))
  const registered = images
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
  return {
    definitions: registered.map((action) => ({
      type: 'function',
      name: action.name,
      description: action.description,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['arguments', 'message'],
        properties: {
          arguments: action.inputSchema,
          message: {
            type: 'string',
            minLength: 1,
            maxLength: 1000,
            description:
              'A short user-facing operational update, not private reasoning.'
          }
        }
      }
    })),
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal
    ): Promise<string> => {
      if (
        signal.aborted ||
        !registered.some((action) => action.name === name) ||
        !isRecord(args) ||
        !isRecord(args.arguments) ||
        typeof args.message !== 'string' ||
        !args.message.trim() ||
        args.message.length > 1000 ||
        Object.keys(args).some((key) => !['arguments', 'message'].includes(key))
      )
        throw new Error('Invalid backend operation')
      const prepared = images.resolveBatch({
        batchId: randomUUID(),
        explanation: args.message,
        actions: [
          {
            id: randomUUID(),
            name,
            arguments: args.arguments,
            summary: args.message
          }
        ]
      }) as unknown as AiActionBatch
      const receipt = await executeBatch(prepared)
      if (signal.aborted) throw new Error('Backend operation cancelled')
      return JSON.stringify(receipt)
    }
  }
}
