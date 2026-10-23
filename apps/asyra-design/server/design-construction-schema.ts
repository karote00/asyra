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
export const designConstructionSchema = {
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
      'One orthographic camera for explicit 3D faces. World Z up; azimuth/elevation in degrees; scale in pixels/world unit. Screen x=originX+scale*(cos(a)*x-sin(a)*y); screen y=originY+scale*(sin(e)*(sin(a)*x+cos(a)*y)-cos(e)*z). Viewer direction from the object is (sin(a)*cos(e), cos(a)*cos(e), sin(e)); for positive 0..90 degree azimuth/elevation the positive-X and positive-Y sides face the viewer. Draw far surfaces before near ones. No auto-fit, invented depth, perspective or hidden-face removal. Choose visible faces and painter order.'
  }
}
export const projectedFaceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name', 'type', 'vertices'],
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
    'Explicit planar world face under shared projection and absolute root; root child or pattern member. Editable vector in caller order. Backend computes x/y/width/height/rings; do not supply them. Signed projected offsets allowed; Group normalization preserves workspace geometry, Frame overflow is reported. Reject degenerate/nonplanar/excess geometry.'
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
    boundary: { type: 'array', minItems: 4, maxItems: 4, items: worldPoint },
    rows: { type: 'integer', minimum: 1, maximum: limits.expandedNodes },
    columns: { type: 'integer', minimum: 1, maximum: limits.expandedNodes },
    order: { enum: ['cell-major', 'motif-major'] },
    motifs: {
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
          offset: worldPoint,
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
  },
  description:
    'Shared orthographic projection; root child or pattern member. Planar convex boundary corners: (0,0),(1,0),(1,1),(0,1). Uniform rows/columns; cell-local u/v motifs, optional world offset. fills cycles by row-major cell index, overriding fill; a full list preserves irregular materials. Compile boundary/motif offsets once; bilinear editable vectors. cell-major: row-major cells then motifs; motif-major: motifs then row-major cells. Keys: gridKey-cellIndex-motifKey. Objects = rows * columns * motifs.length; add all other nodes/containers. Shared path/depth limits apply; work windows do not split artifacts. Keep irregular geometry explicit; no approximation, clipping, lighting or hidden-face removal.'
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
        'Optional sorted nonoverlapping flat instance intervals [start,end), zero-based, last axis fastest. Only selected instances are computed. Keep original indices and palette phase when restoring deferred ranges in a later artifact. Omit a whole pattern rather than sending an empty selection.',
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
        'Ordered flat component under shared root projection. Repeat faces and grids together; no nested patterns or containers. Member keys must be unique. Instance-major, member-major, then grid painter order. Grid palettes restart per instance; face world fields follow translated positions. Output keys: patternKey-instanceIndex-memberOutputKey. Generated keys and names must fit 160 characters. No new parent is created.'
    },
    faces: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'name', 'vertices'],
        anyOf: [
          { properties: { materialField: false } },
          { properties: { fill: false } }
        ],
        properties: {
          key: { ...key, maxLength: 40 },
          name: { ...key, maxLength: 60 },
          fill: projectedFaceSchema.properties.fill,
          materialField: key,
          vertices: projectedFaceSchema.properties.vertices
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
    'Absolute root child with shared projection. Choose faces or members, never both; members forbids pattern fills. Translation only: origin + one/two axes, last axis fastest. Editable vector order: instance then member/face then grid order. faces-mode fills cycles by original instance index; otherwise member materials remain. No lighting, sorting or clipping. Selected count multiplies expanded component objects/points; include root in 10000 objects and 200000 points. Omitted ranges consume neither output budget nor projection. Each source primitive must fit its point limit; internal work windows handle larger valid templates, palettes and ranges without a separate 1000-item limit. Application slices output automatically. Keep irregular details explicit; no inferred geometry.'
}
