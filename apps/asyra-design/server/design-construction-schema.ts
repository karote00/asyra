import { designFillSchema, designInlineFillSchema } from '../src/ai/design-fill'
import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'

const gradientSchema = designInlineFillSchema.anyOf.find(
  (schema) => 'properties' in schema
)
if (!gradientSchema) throw new Error('Native gradient schema is missing')

const scalar = {
  type: 'number',
  minimum: -limits.dimension,
  maximum: limits.dimension
}
const nonnegative = { type: 'number', minimum: 0, maximum: limits.dimension }
const key = { type: 'string', minLength: 1, maxLength: 160 }
const note = { type: 'string', minLength: 1, maxLength: 500, pattern: '\\S' }
const property = { enum: ['x', 'y', 'width', 'height'] }
export const surfaceMotifsSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['key', 'name', 'vertices'],
    properties: {
      key: { ...key, maxLength: 40 },
      name: { ...key, maxLength: 60 },
      fill: designFillSchema,
      fills: { type: 'array', minItems: 1, items: designFillSchema },
      offset: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'z'],
        properties: { x: scalar, y: scalar, z: scalar }
      },
      vertices: {
        type: 'array',
        minItems: 3,
        maxItems: limits.pathCommands,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['u', 'v'],
          properties: {
            u: { type: 'number', minimum: 0, maximum: 1 },
            v: { type: 'number', minimum: 0, maximum: 1 }
          }
        }
      }
    }
  }
}

export const designConstructionSchema = {
  motifTemplates: {
    type: 'object',
    propertyNames: key,
    additionalProperties: { $ref: '#/$defs/surfaceMotifs' },
    description:
      'Shared motifs via motifs:{template:key}, without overrides. Invalid definitions/references reject before writes.'
  },
  linearFields: {
    type: 'object',
    propertyNames: key,
    additionalProperties: {
      type: 'object',
      additionalProperties: false,
      required: ['frame', 'start', 'end', 'gradientStops'],
      properties: {
        frame: { const: 'world' },
        start: {
          type: 'object',
          additionalProperties: false,
          required: ['x', 'y', 'z'],
          properties: { x: scalar, y: scalar, z: scalar }
        },
        end: {
          type: 'object',
          additionalProperties: false,
          required: ['x', 'y', 'z'],
          properties: { x: scalar, y: scalar, z: scalar }
        },
        gradientStops: gradientSchema.properties.gradientStops
      }
    },
    description:
      'World phase=dot(p-start,end-start)/lengthSquared(end-start). Distinct endpoints use face-vertex units. Faces/pattern faces use materialField instead of fill/palettes. Owner normalizes gradients per face/instance; no live constraints/shared Fill IDs.'
  },
  brief: {
    type: 'object',
    additionalProperties: false,
    required: ['intent', 'viewpoint', 'sources', 'assumptions'],
    properties: {
      intent: note,
      viewpoint: note,
      sources: { type: 'array', maxItems: 16, items: note },
      assumptions: { type: 'array', maxItems: 16, items: note },
      checks: {
        type: 'array',
        description:
          'Optional numeric layout checks. Omitted means no requested checks, never a visual or mechanical pass.',
        maxItems: limits.checks,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['key', 'property', 'expected', 'tolerance'],
          anyOf: [
            { properties: { property: { enum: ['x', 'y'] } } },
            {
              properties: {
                property: { enum: ['width', 'height'] },
                expected: nonnegative
              }
            }
          ],
          properties: {
            key,
            property,
            expected: scalar,
            tolerance: nonnegative
          }
        }
      }
    },
    description:
      'Intent/viewpoint, real sources, unverified assumptions. Numeric checks use final parent-local native boxes, explicit keys and pixel tolerances; no invented evidence/visual approval.'
  },
  relations: {
    type: 'array',
    maxItems: limits.relations,
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['target', 'property', 'source', 'sourceProperty'],
      properties: {
        target: key,
        property,
        source: key,
        sourceProperty: {
          enum: [
            'x',
            'y',
            'width',
            'height',
            'right',
            'bottom',
            'centerX',
            'centerY'
          ]
        },
        factor: scalar,
        offset: scalar,
        targetAnchor: { type: 'number', minimum: 0, maximum: 1 }
      }
    },
    description:
      'Absolute native siblings only; no vectors. target.property=source.property*factor(default 1)+offset(default 0). $parent: zero-origin local box. For x/y, subtract targetAnchor*target size (0=start,.5=center,1=end). Order-independent; reject cycles/duplicate assignments. Use layout for row/column/grid. Not live.'
  },
  projection: {
    type: 'object',
    additionalProperties: false,
    required: ['azimuth', 'elevation', 'scale', 'originX', 'originY'],
    properties: {
      azimuth: { type: 'number', minimum: -360, maximum: 360 },
      elevation: { type: 'number', minimum: -90, maximum: 90 },
      scale: { type: 'number', exclusiveMinimum: 0, maximum: limits.dimension },
      originX: scalar,
      originY: scalar
    },
    description:
      'Orthographic; Z up; degrees; scale=pixels/world unit. x=originX+scale*(cos(a)*x-sin(a)*y); y=originY+scale*(sin(e)*(sin(a)*x+cos(a)*y)-cos(e)*z). Viewer=(sin(a)*cos(e),cos(a)*cos(e),sin(e)); angles 0..90 expose +X/+Y. Visible faces far-to-near; no auto-fit/invented depth/perspective/hidden-face removal.'
  }
}
const projectedFaceGeometrySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name'],
  oneOf: [
    { required: ['vertices'], properties: { ellipse: false } },
    { required: ['ellipse'], properties: { vertices: false } }
  ],
  anyOf: [
    { properties: { materialField: false } },
    { properties: { fill: false } }
  ],
  properties: {
    key,
    name: key,
    type: { const: 'projected-face' },
    fill: designFillSchema,
    materialField: key,
    ellipse: {
      type: 'object',
      additionalProperties: false,
      required: ['center', 'u', 'v'],
      properties: {
        center: {
          type: 'object',
          additionalProperties: false,
          required: ['x', 'y', 'z'],
          properties: { x: scalar, y: scalar, z: scalar }
        },
        u: {
          type: 'object',
          additionalProperties: false,
          required: ['x', 'y', 'z'],
          properties: { x: scalar, y: scalar, z: scalar }
        },
        v: {
          type: 'object',
          additionalProperties: false,
          required: ['x', 'y', 'z'],
          properties: { x: scalar, y: scalar, z: scalar }
        }
      },
      description:
        'Independent nonzero world radii set size/direction; equal perpendicular radii form a circle. Creates an editable oval with rotation/world material phase, without sampling. Node/extent limits apply; edge-on rejects.'
    },
    vertices: {
      type: 'array',
      minItems: 3,
      maxItems: limits.pathCommands,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'z'],
        properties: { x: scalar, y: scalar, z: scalar }
      }
    }
  },
  description:
    'Planar child/member in shared projection; owner computes editable polygon/oval geometry/rotation. Signed offsets allowed; Group preserves geometry, Frame reports overflow. Reject degenerate/nonplanar/excess geometry.'
}

export const projectedFaceSchema = {
  allOf: [projectedFaceGeometrySchema],
  required: ['type'],
  properties: { type: projectedFaceGeometrySchema.properties.type }
}

const worldPoint = projectedFaceGeometrySchema.properties.vertices.items
export const surfaceGridSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type',
    'key',
    'name',
    'boundary',
    'rows',
    'columns',
    'motifs',
    'order'
  ],
  properties: {
    type: { const: 'surface-grid' },
    key: { ...key, maxLength: 80 },
    name: { ...key, maxLength: 60 },
    boundary: {
      anyOf: [
        { type: 'array', minItems: 4, maxItems: 4, items: worldPoint },
        {
          type: 'object',
          additionalProperties: false,
          required: ['face'],
          properties: { face: key }
        }
      ],
      description:
        'Corners or {face:key}: unique same-scope 4-vertex face; distinct grid.key; display name. Forward OK; no ellipse.'
    },
    rows: { type: 'integer', minimum: 1, maximum: limits.expandedNodes },
    columns: { type: 'integer', minimum: 1, maximum: limits.expandedNodes },
    order: { enum: ['cell-major', 'motif-major'] },
    motifs: {
      anyOf: [
        { $ref: '#/$defs/surfaceMotifs' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['template'],
          properties: { template: key }
        }
      ]
    }
  },
  description:
    'Projected root child/member: convex planar corners (0,0),(1,0),(1,1),(0,1); uniform bilinear cells, local u/v, world offset. fills overrides fill cyclically in row-major order; irregular paint needs a list. cell-major=cells/motifs; motif-major=motifs/cells. Keys:gridKey-cellIndex-motifKey. Cost:rows*columns*resolved motifs+other nodes; budgets/windows apply. No clipping/lighting/hidden-face removal/approximation.'
}

export const designPatternSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name', 'type', 'origin', 'axes'],
  oneOf: [
    { required: ['faces'], properties: { members: false } },
    { required: ['members'], properties: { faces: false, fills: false } }
  ],
  anyOf: [
    { properties: { fills: false } },
    {
      properties: { faces: { items: { properties: { materialField: false } } } }
    }
  ],
  properties: {
    key: { ...key, maxLength: 80 },
    name: { ...key, maxLength: 60 },
    type: { const: 'pattern' },
    origin: worldPoint,
    axes: {
      type: 'array',
      minItems: 1,
      maxItems: 2,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['count', 'step'],
        properties: {
          count: { type: 'integer', minimum: 1, maximum: limits.expandedNodes },
          step: worldPoint
        }
      }
    },
    instanceRanges: {
      type: 'array',
      minItems: 1,
      description:
        'Sorted disjoint flat [start,end), zero-based, last axis fastest. Compute selected only; retain indices/palette phase across artifacts. Omit pattern for empty selection.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['start', 'end'],
        properties: {
          start: { type: 'integer', minimum: 0 },
          end: { type: 'integer', minimum: 1 }
        }
      }
    },
    members: {
      type: 'array',
      minItems: 1,
      items: {
        anyOf: [
          {
            ...projectedFaceSchema,
            properties: {
              ...projectedFaceSchema.properties,
              key: { ...key, maxLength: 80 },
              name: { ...key, maxLength: 60 }
            }
          },
          surfaceGridSchema
        ]
      },
      description:
        'Flat face/grid members with unique keys and root projection; no nesting/parent. instance/member/grid order; palettes restart, world fields translate per instance. Keys:patternKey-instanceIndex-memberOutputKey; keys/names <=160 chars.'
    },
    faces: {
      type: 'array',
      minItems: 1,
      items: {
        allOf: [projectedFaceGeometrySchema],
        properties: {
          type: false,
          key: { ...key, maxLength: 40 },
          name: { ...key, maxLength: 60 }
        }
      }
    },
    fills: {
      type: 'array',
      minItems: 1,
      items: projectedFaceGeometrySchema.properties.fill
    }
  },
  description:
    'Projected root: origin+axes translate, last axis fastest; instance/member/grid order. faces fills cycle by original index; other materials unchanged. No lighting/sorting/clipping/inference; explicit irregulars. Cost:root+selected instances*objects/points; absent ranges start at 0. Primitive limits apply; windows allow >1000 total.'
}
