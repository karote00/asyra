/** Missing construction inputs stop admission rather than inventing geometry. */
export function requiredSpecValue<T>(
  value: T | undefined | null,
  field: string
): T {
  if (value === undefined || value === null) {
    throw new Error(`Missing asset specification: ${field}`)
  }
  return value
}
