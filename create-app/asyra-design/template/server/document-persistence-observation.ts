/** Domain measurements are supplied by the Runtime adapter; persistence owns no recorder. */
export interface DocumentPersistenceObservation {
  span(stage: string): () => void
  detail(values: Record<string, unknown>): void
}
export const persistenceSpan = (
  observer: DocumentPersistenceObservation | undefined,
  stage: string
) => {
  let end: (() => void) | undefined
  try {
    end = observer?.span(stage)
  } catch {
    /* Diagnostics cannot change durability. */
  }
  return () => {
    try {
      end?.()
    } catch {
      /* Non-authoritative observer. */
    }
  }
}
export const persistenceDetail = (
  observer: DocumentPersistenceObservation | undefined,
  values: Record<string, unknown>
) => {
  try {
    observer?.detail(values)
  } catch {
    /* Non-authoritative observer. */
  }
}
