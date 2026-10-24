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
const note = { type: 'string', minLength: 1, maxLength: 500 }
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
      'Named motif arrays, shared across different grids via motifs:{template:key}, without overrides. Invalid definitions/references reject before writes.'
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
      'Optional common world-space linear fields. Distinct start/end points use the same units as face vertices: phase=dot(p-start,end-start)/lengthSquared(end-start). Projected faces or pattern faces select materialField instead of fill; no palette override. The backend converts phase to normalized native gradients per face/instance. Does not create live constraints or shared Fill identities. Other node kinds do not accept materialField.'
  },
  brief: {
    type: 'object',
    additionalProperties: false,
    required: ['intent', 'viewpoint', 'sources', 'assumptions', 'checks'],
    properties: {
      intent: note,
      viewpoint: note,
      sources: { type: 'array', maxItems: 16, items: note },
      assumptions: { type: 'array', maxItems: 16, items: note },
      checks: {
        type: 'array',
        maxItems: limits.checks,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['key', 'property', 'expected', 'tolerance'],
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
      'Compact design intent, requested viewpoint, actual source notes and unverified assumptions. Numeric checks measure final parent-local native layout boxes (use the explicit draft key of the node being checked); tolerance is in drawing pixels. A pass is not visual fidelity approval. Do not invent source evidence.'
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
      'Absolute-layout native siblings only; no vector targets or sources. target.property = source.property * factor(default 1) + offset(default 0). $parent uses local zero-origin parent box. Supports proportional sizing and exact alignment/spacing without manual coordinate arithmetic. For x/y only, targetAnchor (0=start, 0.5=center, 1=end) subtracts that fraction of target width/height; e.g. parent centerX with targetAnchor 0.5 centers a child. Dependencies resolve in any order; cycles and duplicate assignments fail. Flow layout handles row/column/grid. Relations are preparation instructions, not live constraints.'
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
export const projectedFaceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name', 'type'],
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
        'Analytic ellipse: independent nonzero world radii encode size/direction; equal perpendicular radii=circle. Creates an editable oval with rotation/world material phase; no segments/approximation. Node/extent budgets apply; edge-on rejects.'
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
    'Shared-projection planar root child/member: ordered editable polygon/oval. Owner computes x/y/width/height/rotation. Signed offsets valid; Group preserves workspace geometry, Frame reports overflow. Reject degenerate/nonplanar/excess geometry.'
}

const worldPoint = projectedFaceSchema.properties.vertices.items
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
        'Corners or {face:key}: unique same-scope four-vertex projected-face; forward references allowed, no ellipse.'
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
    'Shared-projection root child/member. Convex planar corners:(0,0),(1,0),(1,1),(0,1). Uniform cells; local u/v, world offset; bilinear vectors. fills overrides fill cyclically by row-major cell; full list for irregular paint. cell-major:cells/motifs; motif-major:motifs/cells; cells row-major. Keys:gridKey-cellIndex-motifKey. Cost:rows*columns*resolved motifs + other nodes. Budgets/windows apply; no approximation/clipping/lighting/hidden-face removal. Irregulars explicit.'
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
        'Flat face/grid members; unique keys, root projection, no nesting/new parent. Order:instance/member/grid; palettes restart per instance; world fields translate. Keys:patternKey-instanceIndex-memberOutputKey; keys/names <=160 chars.'
    },
    faces: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'name'],
        oneOf: projectedFaceSchema.oneOf,
        anyOf: [
          { properties: { materialField: false } },
          { properties: { fill: false } }
        ],
        properties: {
          key: { ...key, maxLength: 40 },
          name: { ...key, maxLength: 60 },
          fill: projectedFaceSchema.properties.fill,
          materialField: key,
          vertices: projectedFaceSchema.properties.vertices,
          ellipse: projectedFaceSchema.properties.ellipse
        }
      }
    },
    fills: {
      type: 'array',
      minItems: 1,
      items: projectedFaceSchema.properties.fill
    }
  },
  description:
    'Absolute root; shared projection. faces XOR members; members forbids fills. origin+axes translation, last axis fastest. Order:instance/member/grid. faces fills cycle by original instance index; otherwise retain materials. No lighting/sorting/clipping/inference; irregulars explicit. Cost:root+selected instances*objects/points; omitted ranges cost zero. Primitive limits apply; windows uncapped by 1000; automatic apply slices.'
}
