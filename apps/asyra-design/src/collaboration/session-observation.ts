import type { CollaborationDebugHandle } from './lifecycle'

interface CollaborationSessionObservation {
  getHandle(): CollaborationDebugHandle | undefined
  getDocumentScope(): string | undefined
}

let observation: CollaborationSessionObservation | undefined

/** Lifecycle supplies reads; local-only consumers never import transport owners. */
export const registerCollaborationSessionObservation = (
  next: CollaborationSessionObservation
): (() => void) => {
  observation = next

  return () => {
    if (observation === next) {
      observation = undefined
    }
  }
}

export const getActiveCollaborationHandle = ():
  CollaborationDebugHandle | undefined => observation?.getHandle()

export const getActiveDocumentScope = (): string | undefined =>
  observation?.getDocumentScope()
