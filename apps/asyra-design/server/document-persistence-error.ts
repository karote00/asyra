export type DocumentPersistenceErrorCode =
  | 'invalid-request'
  | 'invalid-operation'
  | 'durable-conflict'
  | 'request-too-large'

const statusByCode: Record<DocumentPersistenceErrorCode, number> = {
  'invalid-request': 400,
  'invalid-operation': 422,
  'durable-conflict': 409,
  'request-too-large': 413
}

export class DocumentPersistenceError extends Error {
  readonly status: number
  constructor(
    readonly code: DocumentPersistenceErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'DocumentPersistenceError'
    this.status = statusByCode[code]
  }
}
