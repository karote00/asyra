/** Accepted targets and actual canonical mutation evidence are distinct. */
export interface PropertyMutationReceipt {
  readonly acceptedIds: readonly string[]
  readonly changed: boolean
}
