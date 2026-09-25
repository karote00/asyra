import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import {
  organizeDesign,
  type DesignOrganizationRequest
} from '../common-apis/design-organization'
import { AiActionNames } from '../constants'

export const createOrganizationAction = (
  organize: typeof organizeDesign = organizeDesign
): AiActionDefinition<DesignOrganizationRequest> => ({
  name: AiActionNames.ORGANIZE_DESIGN,
  description:
    'Organize current layers after reading their hierarchy. Group siblings with an optional name, ungroup one official Group while preserving its children, or reorder siblings using an insertion index in the remaining sibling list. Uses native coordinate and stacking behavior. Structural receipt confirms the result; explicitly inspect if stacking changes need visual review. Does not delete artwork, reparent across containers or create reusable component instances.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['operation', 'elementIds'],
    properties: {
      operation: { type: 'string', enum: ['group', 'ungroup', 'reorder'] },
      elementIds: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: { type: 'string', minLength: 1, maxLength: 256 }
      },
      name: { type: 'string', minLength: 1, maxLength: 160 },
      index: { type: 'integer', minimum: 0 }
    }
  },
  execute: async (request, { signal }) => {
    if (signal.aborted) throw new Error('Design organization cancelled.')
    return organize(request)
  }
})
