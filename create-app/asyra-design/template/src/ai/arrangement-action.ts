import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import {
  arrangeDesign,
  type DesignArrangementRequest
} from '../common-apis/design-arrangement'
import { AiActionNames } from '../constants'

export const createArrangementAction = (
  arrange: typeof arrangeDesign = arrangeDesign
): AiActionDefinition<DesignArrangementRequest> => ({
  name: AiActionNames.ARRANGE_DESIGN,
  description:
    'Align or evenly distribute 2..200 current siblings after reading their context. Uses native projected bounds along parent-local horizontal/vertical axes. Align start/center/end within the selection bounds. Distribute in current spatial order: omit gap to preserve outer extent, or specify a nonnegative gap keeping the first edge fixed. Preserves sizes, styles and layer order. Inspect the result.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['operation', 'axis', 'elementIds'],
    properties: {
      operation: { type: 'string', enum: ['align', 'distribute'] },
      axis: { type: 'string', enum: ['horizontal', 'vertical'] },
      elementIds: {
        type: 'array',
        minItems: 2,
        maxItems: 200,
        uniqueItems: true,
        items: { type: 'string', minLength: 1, maxLength: 256 }
      },
      alignment: { type: 'string', enum: ['start', 'center', 'end'] },
      gap: { type: 'number', minimum: 0, maximum: 100000 }
    }
  },
  execute: async (request, { signal }) => {
    if (signal.aborted) throw new Error('Design arrangement cancelled.')
    return arrange(request)
  }
})
