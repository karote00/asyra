import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import {
  readDesignContext,
  type DesignContextQuery
} from '../common-apis/design-context'
import { AiActionNames } from '../constants'

export const createDocumentContextAction = (
  read: typeof readDesignContext = readDesignContext
): AiActionDefinition<DesignContextQuery> => ({
  name: AiActionNames.READ_DESIGN_CONTEXT,
  description:
    'Read current selected objects or a page of direct children. Returns editable names, parent IDs, bounds, text and styles, never vector points. Use nextOffset for more; descend containers by parentId. Restart pagination after hierarchy changes. Truncated text is a preview, not the complete content. Read before targeted edits or organization.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['scope'],
    properties: {
      scope: { type: 'string', enum: ['selection', 'children'] },
      parentId: { type: 'string', minLength: 1, maxLength: 256 },
      offset: { type: 'integer', minimum: 0 },
      limit: { type: 'integer', minimum: 1, maximum: 200 }
    }
  },
  execute: async (query, { signal }) => {
    if (signal.aborted) throw new Error('Document context read cancelled.')
    return read(query)
  }
})
