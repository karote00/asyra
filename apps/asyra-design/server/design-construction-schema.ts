import { designFillSchema } from '../src/ai/design-fill'
import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'

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
            expected: nonnegative,
            tolerance: nonnegative
          }
        }
      }
    },
    description:
      'Compact design intent, requested viewpoint, actual source notes and unverified assumptions. Numeric checks measure final parent-local native layout boxes ($root for root); tolerance is in drawing pixels. A pass is not visual fidelity approval. Do not invent source evidence.'
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
      originX: nonnegative,
      originY: nonnegative
    },
    description:
      'One orthographic camera for explicit 3D faces. World Z up; azimuth/elevation in degrees; scale in pixels/world unit. Screen x=originX+scale*(cos(a)*x-sin(a)*y); screen y=originY+scale*(sin(e)*(sin(a)*x+cos(a)*y)-cos(e)*z). Viewer direction from the object is (sin(a)*cos(e), cos(a)*cos(e), sin(e)); for positive 0..90 degree azimuth/elevation the positive-X and positive-Y sides face the viewer. Draw far surfaces before near ones. No auto-fit, invented depth, perspective or hidden-face removal. Choose visible faces and painter order.'
  }
}
export const projectedFaceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name', 'type', 'vertices'],
  properties: {
    key,
    name: key,
    type: { const: 'projected-face' },
    fill: designFillSchema,
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
    'An explicitly supplied planar 3D face; root child only with absolute root layout and shared projection. Emits a normal editable vector, preserves caller order. No width/height/x/y/rings: backend calculates those. World coordinates share one origin. Degenerate, nonplanar, out-of-canvas faces fail or block application.'
}

const worldPoint = projectedFaceSchema.properties.vertices.items
export const designPatternSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name', 'type', 'origin', 'axes', 'faces'],
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
      maxItems: limits.nodes,
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
    faces: {
      type: 'array',
      minItems: 1,
      maxItems: limits.nodes,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'name', 'vertices'],
        properties: {
          key: { ...key, maxLength: 40 },
          name: { ...key, maxLength: 60 },
          fill: projectedFaceSchema.properties.fill,
          vertices: projectedFaceSchema.properties.vertices
        }
      }
    },
    fills: {
      type: 'array',
      minItems: 1,
      maxItems: limits.nodes,
      items: projectedFaceSchema.properties.fill
    }
  },
  description:
    'Root child under shared projection only. Describe a repeated planar motif once as faces, then one/two translation axes; backend expands count products into editable vectors. Last axis varies fastest, each instance preserves face painter order. origin translates all instances; optional fills cycles by instance, otherwise face fills remain. No automatic lighting, depth sorting or clipping. Compact input is bounded to 1000 source nodes. The backend expands up to 10000 total objects including the root and 200000 total points per artifact; application automatically slices this ordered output. Do not manually split a valid stage at 1000 expanded objects. Selected instance counts times faces count expanded output; omitted ranges do not consume output budgets or get projected. Source guards remain unchanged. Each face requires both key and name. Use separate patterns/explicit geometry for genuinely different details; never simplify irregular details to fit a pattern.'
}
