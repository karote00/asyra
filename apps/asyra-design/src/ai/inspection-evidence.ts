/** Ephemeral App-issued validity stamp. Never persisted in a document. */
export interface InspectionEvidenceStamp {
  readonly sessionId: string
  readonly revision: number
  readonly receiptId?: string
}

/** Reviewed attachment bound to one browser evidence lifetime, never saved to the document. */
export interface PreparedAttachmentEvidence {
  readonly parentId: string
  readonly workspaceId: string
  readonly evidence: InspectionEvidenceStamp
}

export const inspectionEvidenceSchema = {
  type: 'object',
  'x-runtime-value': 'request',
  additionalProperties: false,
  required: ['sessionId', 'revision'],
  properties: {
    sessionId: { type: 'string', minLength: 1 },
    revision: { type: 'integer', minimum: 0 },
    receiptId: { type: 'string', minLength: 1 }
  }
}
