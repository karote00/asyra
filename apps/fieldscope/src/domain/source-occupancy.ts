/** Source construction semantics, never a collision or clearance result. */
export interface SourceRegion {
  readonly id: string
  readonly kind: 'sheet' | 'closed-solid' | 'open-shell'
  readonly indexStart: number
  readonly indexCount: number
}

export interface SourceTriangleRange {
  readonly indexStart: number
  readonly indexCount: number
}

/** An exact source subset; its existence grants no contact permission. */
export interface SourcePatch {
  readonly id: string
  readonly region: SourceRegion
  readonly ranges: readonly SourceTriangleRange[]
}

/** Admit exact references and isolate every mutable input at the source boundary. */
export function readSourcePatches(
  input: readonly SourcePatch[],
  regions: readonly SourceRegion[],
  indexCount: number
): readonly SourcePatch[] {
  const admittedRegions = readSourceRegions(regions, indexCount)
  if (!Array.isArray(input)) throw new Error('Invalid source patches')
  const identities = new Set<string>()
  let reusable = admittedRegions === regions && Object.isFrozen(input)
  const admitted = Array.from(input, (patch: SourcePatch) => {
    const regionIndex = regions.indexOf(patch?.region)
    if (
      !patch ||
      typeof patch.id !== 'string' ||
      !patch.id.trim() ||
      identities.has(patch.id) ||
      regionIndex < 0 ||
      !Array.isArray(patch.ranges) ||
      patch.ranges.length === 0
    )
      throw new Error('Invalid source patch')
    identities.add(patch.id)
    const region = admittedRegions[regionIndex]
    const regionEnd = region.indexStart + region.indexCount
    let end = region.indexStart
    for (const range of patch.ranges) {
      if (
        !range ||
        !Number.isSafeInteger(range.indexStart) ||
        range.indexStart % 3 ||
        range.indexStart < end ||
        !Number.isSafeInteger(range.indexCount) ||
        range.indexCount <= 0 ||
        range.indexCount % 3 ||
        !Number.isSafeInteger(range.indexStart + range.indexCount) ||
        range.indexStart + range.indexCount > regionEnd ||
        range.indexStart + range.indexCount > indexCount
      )
        throw new Error('Invalid source patch range')
      end = range.indexStart + range.indexCount
    }
    const frozen =
      Object.isFrozen(patch) &&
      Object.isFrozen(patch.ranges) &&
      patch.ranges.every(Object.isFrozen)
    reusable &&= frozen
    if (frozen && patch.region === region) return patch
    return Object.freeze({
      id: patch.id,
      region,
      ranges: Object.freeze(
        patch.ranges.map(({ indexStart, indexCount }: SourceTriangleRange) =>
          Object.freeze({ indexStart, indexCount })
        )
      )
    })
  })
  if (reusable) return input
  return Object.freeze(admitted)
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
