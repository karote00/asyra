import {
  designContextFields,
  designContextPageLimit
} from '../common-apis/design-context-fields'
import { toolDocumentReference } from './tool-contract'

export const documentContextProperties = {
  expectedCount: { type: 'integer', minimum: 0 },
  delivery: { type: 'string', enum: ['page', 'reference', 'columns'] },
  allMatches: {
    type: 'boolean',
    description:
      'Complete identity-only region query for backend target handoff. Requires scope=region and result=ids, no offset/limit or property fields. Prefer execute_design target.query when these IDs are only needed for an edit.'
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
      name: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          equals: { type: 'string', minLength: 1, maxLength: 256 },
          prefix: { type: 'string', minLength: 1, maxLength: 256 },
          suffix: { type: 'string', minLength: 1, maxLength: 256 }
        }
      },
      type: { type: 'string', minLength: 1, maxLength: 256 },
      parentId: { ...toolDocumentReference, maxLength: 256 },
      ancestorId: { ...toolDocumentReference, maxLength: 256 },
      locked: { type: 'boolean' }
    }
  },
  elementIds: {
    'x-design-element-binding': 'all',
    type: 'array',
    minItems: 1,
    uniqueItems: true,
    items: { ...toolDocumentReference, maxLength: 256 }
  },
  fields: {
    type: 'array',
    uniqueItems: true,
    items: { type: 'string', enum: [...designContextFields] }
  },
  parentId: { ...toolDocumentReference, maxLength: 256 },
  offset: { type: 'integer', minimum: 0 },
  limit: {
    type: 'integer',
    minimum: 1,
    maximum: designContextPageLimit,
    description: `Maximum ${designContextPageLimit}. Continue only with returned nextOffset; preserve bounds and filters. Do not guess larger page sizes.`
  }
}
