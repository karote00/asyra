import { toolDocumentReference } from './tool-contract'
import {
  inspectionEvidenceSchema,
  preparedAttachmentEvidenceSchema,
  type InspectionEvidenceStamp,
  type PreparedAttachmentEvidence
} from './inspection-evidence'

export interface PrescribedPosition {
  elementId: string
  x: number
  y: number
  attachmentEvidence: PreparedAttachmentEvidence
}
export interface PrescribedPositionInput {
  evidence: InspectionEvidenceStamp[]
  positions: PrescribedPosition[]
}
export const prescribedPositionsSchema = {
  type: 'array',
  minItems: 1,
  uniqueItems: true,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['elementId', 'x', 'y', 'attachmentEvidence'],
    properties: {
      elementId: toolDocumentReference,
      x: { type: 'number', minimum: 0, maximum: 100000 },
      y: { type: 'number', minimum: 0, maximum: 100000 },
      attachmentEvidence: preparedAttachmentEvidenceSchema
    }
  }
}
export const prescribedPositionInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['evidence', 'positions'],
  properties: {
    evidence: { type: 'array', minItems: 1, items: inspectionEvidenceSchema },
    positions: prescribedPositionsSchema
  }
}
