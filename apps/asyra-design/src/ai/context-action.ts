import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import {
  readDesignContext,
  designContextFields,
  type DesignContextQuery
} from '../common-apis/design-context'
import { AiActionNames } from '../constants'

export const createDocumentContextAction = (
  read: typeof readDesignContext = readDesignContext
): AiActionDefinition<DesignContextQuery> => ({
  name: AiActionNames.READ_DESIGN_CONTEXT,
  description:
    'Read known elementIds with scope=ids in one request, current selection, or a page of direct children. Prefer existing artifact references or known IDs over hierarchy traversal. Default fields=[] returns identity/name/hierarchy only; request just the needed property fields. Known IDs without limit are returned together. Returns editable names, parent IDs, bounds, text and styles, never vector points. Use nextOffset for more; descend containers by parentId. Restart pagination after hierarchy changes. Truncated text is a preview, not the complete content. Read before targeted edits or organization.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['scope'],
    properties: {
      scope: { type: 'string', enum: ['selection', 'children', 'ids'] },
      elementIds: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: { type: 'string', minLength: 1, maxLength: 256 }
      },
      fields: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', enum: [...designContextFields] }
      },
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
