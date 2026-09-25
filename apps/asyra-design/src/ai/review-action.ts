import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { reviewDesign } from '../common-apis/design-review'
import { AiActionNames } from '../constants'
export const createDesignReviewAction = (
  review: typeof reviewDesign = reviewDesign
): AiActionDefinition<{ elementId: string }> => ({
  name: AiActionNames.REVIEW_DESIGN,
  description:
    'Read-only deterministic review of the complete target subtree in cooperative chunks: measure real text content against its layout box and check unrotated child bounds. No screenshot. Fix concrete findings using current IDs, then review again before visual inspection. Complete means the supported checks ran, not that design quality or brief compliance passed. Truncation and unavailable checks must not be reported as full verification.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['elementId'],
    properties: { elementId: { type: 'string', minLength: 1, maxLength: 256 } }
  },
  execute: async ({ elementId }, { signal }) => {
    if (signal.aborted) throw new Error('Design review cancelled.')
    return review(elementId, signal)
  }
})
