import { AiInspectionLimits } from '../constants'

export const inspectionInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['elementId'],
  properties: {
    elementId: {
      description:
        'Current scene element ID, or actual current workspace ID for overview of all roots without grouping. Workspace accepts overview only; choose a concrete child for detail/region. Overview never substitutes for required native detail.',
      'x-design-element-binding': 'each',
      type: 'string',
      minLength: 1
    },
    view: {
      type: 'string',
      enum: ['overview', 'detail'],
      description: `Default overview fits the whole target into a preview. Detail without a region captures the entire target at native resolution only when both dimensions are at most ${AiInspectionLimits.maxEdge} pixels. For larger targets, choose a smaller child or an explicit target-local region within that limit. Detail never automatically crops or scales down.`
    },
    region: {
      type: 'object',
      additionalProperties: false,
      required: ['x', 'y', 'width', 'height'],
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        width: {
          type: 'number',
          exclusiveMinimum: 0,
          maximum: AiInspectionLimits.maxEdge
        },
        height: {
          type: 'number',
          exclusiveMinimum: 0,
          maximum: AiInspectionLimits.maxEdge
        }
      }
    }
  }
}

/** Known failed reads are finished operations, never uncertain document writes. */
export const inspectionFailureSchema = {
  type: 'object',
  required: ['available', 'code', 'message', 'settlement'],
  properties: {
    available: { const: false },
    code: { type: 'string', minLength: 1 },
    message: { type: 'string', minLength: 1 },
    settlement: { const: 'completed' }
  },
  additionalProperties: true
}
