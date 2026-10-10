export const inspectionInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['elementId'],
  properties: {
    elementId: { type: 'string', minLength: 1 },
    view: { type: 'string', enum: ['overview', 'detail'] },
    region: {
      type: 'object',
      additionalProperties: false,
      required: ['x', 'y', 'width', 'height'],
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number', exclusiveMinimum: 0, maximum: 1024 },
        height: { type: 'number', exclusiveMinimum: 0, maximum: 1024 }
      }
    }
  }
}
