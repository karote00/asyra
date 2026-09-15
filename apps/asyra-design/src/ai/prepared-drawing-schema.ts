// Backend-facing JSON schema for the existing prepared-descriptor wire contract.
const text = { type: 'string', minLength: 1 }
const number = { type: 'number' }
const strings = { type: 'array', items: text }
const bounds = {
  type: 'object',
  required: ['x', 'y', 'width', 'height'],
  properties: {
    x: number,
    y: number,
    width: { type: 'number', minimum: 0 },
    height: { type: 'number', minimum: 0 }
  }
}
const fill = {
  type: 'object',
  required: [
    'id',
    'type',
    'kind',
    'color',
    'opacity',
    'visible',
    'colorFormat',
    'defaultColorFormat',
    'gradient'
  ],
  properties: {
    id: text,
    type: { const: 'fill' },
    kind: { const: 'solid' },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    opacity: { type: 'number', minimum: 0, maximum: 1 },
    visible: { type: 'boolean' },
    colorFormat: { const: 'hex' },
    defaultColorFormat: { const: 'hex' },
    gradient: { type: 'null' }
  }
}
const descriptor = {
  type: 'object',
  required: [
    'id',
    'name',
    'type',
    'props',
    'x',
    'y',
    'width',
    'height',
    'fills',
    'strokes',
    'visible',
    'lock'
  ],
  properties: {
    ...bounds.properties,
    id: text,
    name: text,
    type: { enum: ['group', 'rectangle', 'oval', 'vector'] },
    props: {
      type: 'object',
      required: ['position', 'dimension', 'fills', 'strokes'],
      additionalProperties: text,
      description:
        'Map each canonical property name to a globally unique property ID string, never a property value. Include position, dimension, fills, strokes; vectors also include points, segments, networks, closed, pointCoordinateSpace, fillRule.'
    },
    visible: { type: 'boolean' },
    lock: { type: 'boolean' },
    children: { type: 'array', maxItems: 0 },
    fills: { type: 'array', items: fill },
    strokes: {
      type: 'array',
      description: 'Use an empty array for fill-only drawings.'
    },
    pointCoordinateSpace: { const: 'workspace' },
    fillRule: { enum: ['nonzero', 'evenodd'] },
    closed: { type: 'boolean' },
    points: {
      type: 'object',
      description:
        'Vector nodes keyed by their ID. Coordinates are in workspace space.',
      additionalProperties: {
        type: 'object',
        required: ['id', 'kind', 'x', 'y'],
        properties: {
          id: text,
          kind: { enum: ['anchor', 'control'] },
          x: number,
          y: number,
          anchorType: { const: 'sharp' },
          handleMode: { const: 'none' },
          controlForId: text,
          controlRole: { enum: ['in', 'out'] }
        }
      }
    },
    segments: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['id', 'startId', 'endId', 'outControlId', 'inControlId'],
        properties: {
          id: text,
          startId: text,
          endId: text,
          outControlId: { type: ['string', 'null'] },
          inControlId: { type: ['string', 'null'] }
        }
      }
    },
    networks: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['id', 'pointIds', 'segmentIds', 'closed'],
        properties: {
          id: text,
          pointIds: strings,
          segmentIds: strings,
          closed: { type: 'boolean' }
        }
      }
    }
  },
  description:
    'Supply complete canonical descriptors with unique IDs. Groups have children:[] and no fills. Circle/ellipse uses type oval. Child x/y are relative to the parent group; vector points are workspace coordinates. Vectors require points, segments, networks, closed, pointCoordinateSpace and fillRule. Never use ellipse, fill, path d, or elements aliases.'
}
export const PREPARED_DRAWING_INPUT_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: [
    'artifactVersion',
    'compositionRole',
    'elementCount',
    'groupBounds',
    'groupDescriptor',
    'parent',
    'pointCount',
    'roleToElementIds',
    'skipped',
    'slices'
  ],
  properties: {
    artifactVersion: { const: 1, type: 'number' },
    compositionRole: text,
    elementCount: {
      type: 'integer',
      minimum: 1,
      description: 'Total child descriptors, excluding the group.'
    },
    groupBounds: bounds,
    groupDescriptor: {
      ...descriptor,
      description:
        'One complete group descriptor. type must be group, children:[], fills:[], strokes:[].',
      properties: { ...descriptor.properties, type: { const: 'group' } }
    },
    parent: { const: 'workspace', type: 'string' },
    pointCount: {
      type: 'integer',
      minimum: 0,
      description:
        'Total vector points across all slices; oval/rectangle contributes zero.'
    },
    roleToElementIds: { type: 'object', additionalProperties: strings },
    skipped: {
      type: 'array',
      items: {
        type: 'object',
        required: ['reason', 'role'],
        properties: { reason: { const: 'duplicate-role' }, role: text }
      }
    },
    slices: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['descriptors', 'pointCount', 'roles'],
        properties: {
          descriptors: {
            type: 'array',
            minItems: 1,
            maxItems: 32,
            items: descriptor
          },
          pointCount: { type: 'integer', minimum: 0 },
          roles: strings
        }
      }
    }
  }
})
