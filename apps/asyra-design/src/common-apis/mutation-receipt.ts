import type { PropertyMutationReceipt } from '@asyra/core'

/** Ephemeral owner evidence, independent of visual inspection scope. */
export interface MutationReceipt<T> extends PropertyMutationReceipt {
  readonly value: T
  readonly unavailableIds: readonly string[]
}

export const mutationReceipt = <T>(
  value: T,
  evidence: PropertyMutationReceipt,
  unavailableIds: readonly string[] = []
): MutationReceipt<T> =>
  Object.freeze({
    value,
    acceptedIds: Object.freeze([...evidence.acceptedIds]),
    changed: evidence.changed,
    unavailableIds: Object.freeze([...unavailableIds])
  })
