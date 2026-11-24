import type { DraftRepairTarget } from './design-source-recovery'

/** A rejected authored design value; no canvas operation has started. */
export class DesignInputError extends Error {}

/** Paths refer to editable authored rings, never expanded element indices. */
export class DesignVectorExtentError extends DesignInputError {
  constructor(
    message: string,
    readonly targets: DraftRepairTarget[]
  ) {
    super(message)
  }
}
