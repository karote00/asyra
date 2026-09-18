import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { inspectionApis } from '../common-apis'
import { AiActionNames } from '../constants'

export const createAiInspectionAction = (
  inspect: (elementId: string) => unknown = inspectionApis.inspect
): AiActionDefinition<{ elementId: string }> => ({
  name: AiActionNames.INSPECT_DRAWING,
  description:
    'Inspect an existing drawing or composition using its actual rendered image and object summaries. Read-only; does not change the document. Use the returned image to compare the complete result with the original request/reference, then make supported corrections and inspect again.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['elementId'],
    properties: { elementId: { type: 'string', minLength: 1 } }
  },
  execute: async (args, { signal }) => {
    if (signal.aborted) throw new Error('Drawing inspection cancelled')
    return inspect(args.elementId)
  }
})
