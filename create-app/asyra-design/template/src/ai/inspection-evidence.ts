/** Ephemeral App-issued validity stamp. Never persisted in a document. */
export interface InspectionEvidenceStamp {
  readonly sessionId: string
  readonly revision: number
}
