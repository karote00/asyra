import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { inspectionApis } from '../common-apis'
import { AiActionNames } from '../constants'

export const createAiInspectionAction = (
  inspect: (
    elementId: string,
    region?: { x: number; y: number; width: number; height: number },
    view?: 'overview' | 'detail'
  ) => unknown = inspectionApis.inspect
): AiActionDefinition<{
  elementId: string
  region?: { x: number; y: number; width: number; height: number }
  view?: 'overview' | 'detail'
}> => ({
  name: AiActionNames.INSPECT_DRAWING,
  description:
    'Inspect an existing drawing or composition using its actual rendered image and object summaries. Default overview renders the entire subtree into a bounded composition preview without changing source images, vectors or dimensions. Use view=detail for native-resolution close-ups, or region in target-local coordinates at most 1024 per side. A region is always native detail, never an overview. elementsTruncated describes object summaries only, not image coverage. Read-only; does not change the document. Use the returned image to compare the complete result with the original request/reference, then make supported corrections and inspect again.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['elementId'],
    properties: {
      elementId: { type: 'string', minLength: 1 },
      view: { type: 'string', enum: ['overview', 'detail'] },
      region: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'width', 'height'],
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number', exclusiveMinimum: 0, maximum: 1024 },
          height: { type: 'number', exclusiveMinimum: 0, maximum: 1024 }
        }
      }
    }
  },
  execute: async (args, { signal }) => {
    if (signal.aborted) throw new Error('Drawing inspection cancelled')
    if (args.view) return inspect(args.elementId, args.region, args.view)
    return args.region
      ? inspect(args.elementId, args.region)
      : inspect(args.elementId)
  }
})
