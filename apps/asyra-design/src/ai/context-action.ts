import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import {
  readDesignContext,
  designContextFields,
  designContextPageLimit,
  type DesignContextQuery
} from '../common-apis/design-context'
import { AiActionNames } from '../constants'

export const createDocumentContextAction = (
  read: typeof readDesignContext = readDesignContext
): AiActionDefinition<DesignContextQuery> => ({
  name: AiActionNames.READ_DESIGN_CONTEXT,
  description:
    'For a localized correction, use scope=region with workspace bounds even when its parent spans a larger area. Spatial candidates use projected bounds, not exact contours or occlusion; optional type/parentId/ancestorId/locked filters apply before pagination. For an edit on the entire matching region, pass target={field:"elementIds",query:{scope:"region",bounds,filter}} to execute_design_batch; the backend resolves a complete identity snapshot and submits one plural operation. Use result=ids when you actually need to inspect target identities. Use scope=ids for known IDs, selection for selected objects, and children for hierarchy questions. Prefer retained artifact references and known IDs over another lookup. Default result=elements and fields=[] returns metadata; request only needed property fields, never vector points. Known IDs without limit are returned together. Continue with nextOffset and the same selectors; restart after hierarchy changes. Truncated text is only a preview. Read only when target identities or needed values are unknown.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['scope'],
    properties: {
      allMatches: {
        type: 'boolean',
        description:
          'Complete identity-only region query for backend target handoff. Requires scope=region and result=ids, no offset/limit or property fields. Prefer execute_design_batch target.query when these IDs are only needed for an edit.'
      },
      scope: {
        type: 'string',
        enum: ['selection', 'children', 'ids', 'region']
      },
      result: {
        type: 'string',
        enum: ['elements', 'ids'],
        description:
          'Use ids when only edit targets are needed; omit fields or use fields=[]. Default elements includes metadata and requested fields.'
      },
      bounds: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'width', 'height'],
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number', minimum: 0 },
          height: { type: 'number', minimum: 0 }
        }
      },
      filter: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', minLength: 1, maxLength: 256 },
          parentId: { type: 'string', minLength: 1, maxLength: 256 },
          ancestorId: { type: 'string', minLength: 1, maxLength: 256 },
          locked: { type: 'boolean' }
        }
      },
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
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: designContextPageLimit,
        description: `Maximum ${designContextPageLimit}. Continue only with returned nextOffset; preserve bounds and filters. Do not guess larger page sizes.`
      }
    }
  },
  execute: async (query, { signal }) => {
    if (signal.aborted) throw new Error('Document context read cancelled.')
    return read(query)
  }
})
