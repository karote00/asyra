import {
  toolInternalResult,
  toolResultBoolean,
  toolResultCount,
  toolResultObject,
  toolRequestReference,
  toolDocumentReference,
  toolDocumentReferences,
  actionToolSemantics
} from './tool-contract'
import {
  RetainedQueryError,
  type RetainedContextQuery
} from '../common-apis/retained-design-context'
import {
  AiActionExecutionError,
  type AiActionDefinition
} from '@asyra/ai-agent-runtime'
import {
  type DesignContextQuery,
  designContextFields,
  designContextCommonFields,
  designContextScopes,
  DesignContextQueryError,
  designContextPageLimit
} from '../common-apis/design-context'
import { AiActionNames } from '../constants'

const documentContextProperties = {
  expectedCount: { type: 'integer', minimum: 0 },
  delivery: { type: 'string', enum: ['page', 'reference', 'columns'] },
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

export const documentContextSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['scope'],
  properties: documentContextProperties,
  // Closed alternatives are consumable by both native validation and typed recipes.
  // Cross-cutting allOf constraints would leave recipe destinations opaque.
  oneOf: Object.entries(designContextScopes).flatMap(([scope, contract]) =>
    [
      { result: 'elements', complete: false },
      { result: 'ids', complete: false },
      ...(scope === 'region' ? [{ result: 'ids', complete: true }] : [])
    ].map(({ result, complete }) => ({
      additionalProperties: false,
      required: [
        'scope',
        ...contract.required,
        ...(result === 'ids' ? ['result'] : []),
        ...(complete ? ['allMatches'] : [])
      ],
      properties: {
        ...Object.fromEntries(
          ['delivery', ...designContextCommonFields, ...contract.fields].map(
            (key) => [key, key === 'scope' ? { const: scope } : {}]
          )
        ),
        result: { enum: [result] },
        ...(result === 'ids' ? { fields: { maxItems: 0 } } : {}),
        ...(scope === 'region' ? { allMatches: { const: complete } } : {}),
        ...(complete ? { offset: false, limit: false } : {})
      }
    }))
  )
}

const retainedContextSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['scope', 'snapshotId'],
  oneOf: [
    { properties: { delivery: { enum: ['page', 'reference', 'columns'] } } },
    {
      required: ['delivery'],
      properties: {
        delivery: { const: 'receipt' },
        filter: false,
        expectedCount: false,
        limit: false
      }
    }
  ],
  properties: {
    scope: { type: 'string', enum: ['snapshot'] },
    snapshotId: toolRequestReference,
    filter: documentContextSchema.properties.filter,
    expectedCount: documentContextSchema.properties.expectedCount,
    delivery: { enum: ['page', 'reference', 'columns', 'receipt'] },
    offset: documentContextSchema.properties.offset,
    limit: documentContextSchema.properties.limit
  }
}

export const createDocumentContextAction = (
  read: (query: RetainedContextQuery, signal?: AbortSignal) => unknown = () => {
    throw new Error('Retained context is unavailable.')
  }
): AiActionDefinition<RetainedContextQuery> => ({
  ...actionToolSemantics(AiActionNames.READ_DESIGN_CONTEXT, {
    ...toolResultObject(
      {
        available: { const: true },
        snapshotId: toolRequestReference,
        leaseId: toolRequestReference,
        total: toolResultCount,
        coordinateSpace: { const: 'parent-local' },
        elementIds: {
          ...toolDocumentReferences,
          'x-design-element-binding': 'all'
        },
        missingIds: toolDocumentReferences,
        elements: { type: 'array', items: { type: 'object' } },
        receipt: { type: 'object' },
        receiptPage: toolResultObject({
          encoding: { const: 'json-text' },
          offset: toolResultCount,
          total: toolResultCount,
          nextOffset: { type: ['integer', 'null'], minimum: 0 },
          text: { type: 'string' }
        }),
        current: { type: 'boolean' },
        scope: { type: 'string' },
        parentId: { type: ['string', 'null'] },
        offset: toolResultCount,
        limit: toolResultCount,
        nextOffset: { type: ['integer', 'null'], minimum: 0 },
        revision: toolResultCount,
        delivery: { enum: ['reference', 'page', 'columns', 'receipt'] },
        columns: { type: 'array', items: { type: 'object' } },
        missingCount: toolResultCount,
        observation: toolInternalResult({ type: 'object' })
      },
      [
        'available',
        'snapshotId',
        'leaseId',
        'total',
        'coordinateSpace',
        'missingIds',
        'elements'
      ]
    )
  }),
  revision: 5,
  composition: 'allowed',
  name: AiActionNames.READ_DESIGN_CONTEXT,
  description:
    'For a structural retained output, scope=snapshot and delivery=receipt reads immutable original evidence without re-executing writes. Large evidence returns receiptPage={encoding:json-text,text,offset,total,nextOffset}; concatenate text in exact offset order, passing offset=nextOffset until null. A small complete result uses receipt. Never infer new edit authority from historical readback; current=false means historical evidence only, not permission to edit. Default delivery=reference returns snapshotId, leaseId and count without rows. Bind those handles to later consumers; do not copy object lists into model text. Request delivery=page or columns only when inspecting actual values. All delivered snapshots remain pinned until explicit release_design_context, request settlement or cancellation; new capacity admission never evicts pending consumers. Borrowed consumers do not release caller-owned leases. Current canonical revision checks reject stale values; read again after a relevant change. Use scope=region with workspace bounds for a local correction, even under a broad parent. Candidates use bounds, not exact contours or occlusion; type, parentId, ancestorId, locked and literal name equals/prefix/suffix filters precede paging. Refine an existing current snapshot with scope=snapshot and filter without returning its rows; expectedCount rejects unintended match counts. Prefer execute_design_batch target.query for a whole-region edit resolved internally. Use scope=ids for known IDs, selection for selected objects, children only for hierarchy questions without filter or bounds; retain that result then use scope=snapshot with filter for explicit hierarchy refinement. fields lists the needed computed columns; x/y are parent-local. Explicit pages continue with nextOffset and the same selectors. No vector-point expansion or hierarchy reread for already known targets.',
  inputSchema: { oneOf: [documentContextSchema, retainedContextSchema] },
  execute: async (query, { signal }) => {
    if (signal.aborted) {
      throw new Error('Document context read cancelled.')
    }
    try {
      return read({ ...query, delivery: query.delivery ?? 'reference' }, signal)
    } catch (error) {
      if (
        error instanceof RetainedQueryError ||
        error instanceof DesignContextQueryError
      ) {
        throw new AiActionExecutionError(error.message)
      }
      throw error
    }
  }
})

/** Releasing retained state is a control operation, not a query producer. */
export const createDocumentContextReleaseAction = (
  read: (query: RetainedContextQuery, signal?: AbortSignal) => unknown
): AiActionDefinition<{ snapshotId: string }> => ({
  ...actionToolSemantics(
    AiActionNames.RELEASE_DESIGN_CONTEXT,
    toolResultObject({
      snapshotId: { type: 'string' },
      released: toolResultBoolean
    })
  ),
  name: AiActionNames.RELEASE_DESIGN_CONTEXT,
  composition: 'control-plane',
  description:
    'Release a retained query after its consumers finish. Returns release evidence, not a live query handle. Never releases another request or an actively borrowed query.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['snapshotId'],
    properties: { snapshotId: toolRequestReference }
  },
  execute: async ({ snapshotId }, { signal }) => {
    signal.throwIfAborted()
    const result = read(
      { scope: 'snapshot', snapshotId, release: true },
      signal
    )
    if (
      !result ||
      typeof result !== 'object' ||
      !('released' in result) ||
      typeof result.released !== 'boolean'
    ) {
      throw new AiActionExecutionError(
        'Retained query release was not acknowledged.'
      )
    }
    return { snapshotId, released: result.released }
  }
})

/** Complete region identities for one backend operation; no reusable resource is published. */
export const createRegionTargetsAction = (
  read: (query: RetainedContextQuery, signal?: AbortSignal) => unknown
): AiActionDefinition<
  Pick<DesignContextQuery, 'bounds' | 'filter' | 'expectedCount'> & {
    scope: 'region'
  }
> => ({
  ...actionToolSemantics(
    AiActionNames.RESOLVE_DESIGN_TARGETS,
    toolResultObject(
      {
        delivery: { const: 'transient' },
        available: { const: true },
        coordinateSpace: { const: 'parent-local' },
        total: toolResultCount,
        elementIds: {
          ...toolDocumentReferences,
          'x-design-element-binding': 'all'
        },
        missingIds: toolDocumentReferences,
        elements: { type: 'array', maxItems: 0 },
        nextOffset: { const: null },
        snapshotId: false,
        leaseId: false
      },
      [
        'delivery',
        'available',
        'coordinateSpace',
        'total',
        'elementIds',
        'missingIds',
        'elements',
        'nextOffset'
      ]
    )
  ),
  name: AiActionNames.RESOLVE_DESIGN_TARGETS,
  revision: 1,
  composition: 'allowed',
  description:
    'Resolve complete region identities once for an immediate backend operation. Prefer execute_design_batch target.query to avoid returning IDs to the model. No retained resource, snapshot or lease is created or released. Use read_design_context for reusable references. Ordinary canonical mutation admission remains required.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['scope', 'bounds'],
    properties: {
      scope: { const: 'region' },
      bounds: documentContextSchema.properties.bounds,
      filter: documentContextSchema.properties.filter,
      expectedCount: documentContextSchema.properties.expectedCount
    }
  },
  execute: async (query, { signal }) => {
    signal.throwIfAborted()
    try {
      return read(
        { ...query, result: 'ids', allMatches: true, delivery: 'transient' },
        signal
      )
    } catch (error) {
      if (
        error instanceof RetainedQueryError ||
        error instanceof DesignContextQueryError
      ) {
        throw new AiActionExecutionError(error.message)
      }
      throw error
    }
  }
})
