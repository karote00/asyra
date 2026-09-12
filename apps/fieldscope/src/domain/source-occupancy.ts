/** Source construction semantics, never a collision or clearance result. */
export interface SourceRegion {
  readonly id: string
  readonly kind: 'sheet' | 'closed-solid' | 'open-shell'
  readonly indexStart: number
  readonly indexCount: number
}

/** Admit a complete ordered partition; isolate mutable callers at the C boundary. */
export function readSourceRegions(
  input: readonly SourceRegion[],
  indexCount: number
): readonly SourceRegion[] {
  if (
    !Array.isArray(input) ||
    !Number.isSafeInteger(indexCount) ||
    indexCount < 0 ||
    indexCount % 3
  )
    throw new Error('Invalid source region coverage')
  let end = 0
  const identities = new Set<string>()
  for (const region of input) {
    if (
      !region ||
      typeof region.id !== 'string' ||
      !region.id.trim() ||
      identities.has(region.id) ||
      !['sheet', 'closed-solid', 'open-shell'].includes(region.kind) ||
      region.indexStart !== end ||
      !Number.isSafeInteger(region.indexCount) ||
      region.indexCount <= 0 ||
      region.indexCount % 3
    )
      throw new Error('Invalid source region')
    end += region.indexCount
    identities.add(region.id)
  }
  if (end !== indexCount) throw new Error('Incomplete source region coverage')
  if (Object.isFrozen(input) && input.every(Object.isFrozen)) return input
  return Object.freeze(
    input.map(({ id, kind, indexStart, indexCount }) =>
      Object.freeze({ id, kind, indexStart, indexCount })
    )
  )
}
