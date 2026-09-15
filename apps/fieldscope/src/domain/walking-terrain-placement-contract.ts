import {
  readSourceRegions,
  type SourceRegion,
  type SourcePatch
} from './source-occupancy'
import { readSpatialShape } from '../engine/spatial-contract'
import type {
  WalkingRobotSource,
  WalkingRobotPart
} from './walking-robot-source'
import type {
  WalkingTerrainEvidence,
  WalkingTerrainRegion,
  WalkingContactAssessment
} from './walking-motion-contract'
import type {
  WalkingConstrainedRecipe,
  ConstrainedFraction
} from './walking-constrained-kinematics'
import type { SceneDemand } from '../simulation/scene-demand'

export const WALKING_TERRAIN_PLACEMENT_REQUEST_FORMAT =
  'walking-terrain-placement-request/1' as const
export interface WalkingTerrainPlacementSeed {
  readonly chainId: string
  readonly footPart: WalkingRobotPart
  readonly footPatch: SourcePatch
  readonly contactAssessmentId: string
  readonly terrainRegionId: string
  readonly sourceRegionId: string
  readonly triangleOffset: number
  readonly barycentric: readonly [
    ConstrainedFraction,
    ConstrainedFraction,
    ConstrainedFraction
  ]
}
export interface WalkingTerrainPlacementRequest {
  readonly format: typeof WALKING_TERRAIN_PLACEMENT_REQUEST_FORMAT
  readonly source: WalkingRobotSource
  readonly demand: SceneDemand
  readonly farm: SceneDemand['farm']
  readonly route: SceneDemand['route']
  readonly terrain: WalkingTerrainEvidence
  readonly partitions: readonly Readonly<{
    sourceId: string
    regions: readonly SourceRegion[] | null
  }>[]
  readonly seeds: readonly WalkingTerrainPlacementSeed[]
  readonly baseOrientation: WalkingConstrainedRecipe['baseOrientation']
  readonly fixedJoints: WalkingConstrainedRecipe['fixedJoints']
  readonly interval: WalkingConstrainedRecipe['interval']
  readonly budget: Readonly<{
    maxInputValues: number
    maxTrianglePairs: number
    maxPredicates: number
    maxBits: number
    maxProjectionOperations: number
  }>
  readonly inputValues: number
}
export class TerrainPlacementBudgetError extends Error {}
const admitted = new WeakSet<object>()
function invalid(): never {
  throw new Error('Invalid terrain placement request')
}
function record(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}
function keys(v: Record<string, unknown>, names: string[]) {
  return (
    Object.keys(v).length === names.length &&
    names.every((k) => Object.hasOwn(v, k))
  )
}
function id(v: unknown): v is string {
  return typeof v === 'string' && !!v.trim()
}
function finite(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}
function vector(v: unknown, length: number): v is number[] {
  return Array.isArray(v) && v.length === length && Array.from(v).every(finite)
}
function evidence(v: unknown): boolean {
  return (
    record(v) &&
    id(v.id) &&
    (v.kind === 'measured'
      ? keys(v, ['kind', 'id'])
      : v.kind === 'synthetic' &&
        keys(v, ['kind', 'id', 'label']) &&
        id(v.label))
  )
}
function relation(v: unknown): boolean {
  return (
    record(v) &&
    (v.kind === 'unknown'
      ? keys(v, ['kind'])
      : keys(v, ['status', 'evidence']) &&
        (v.status === 'admitted' || v.status === 'blocked') &&
        evidence(v.evidence))
  )
}
function observation(v: unknown): boolean {
  return (
    record(v) &&
    (v.kind === 'unknown'
      ? keys(v, ['kind'])
      : keys(v, ['coverage', 'evidence']) &&
        (v.coverage === 'complete' || v.coverage === 'sampled') &&
        evidence(v.evidence))
  )
}
function gcd(a: bigint, b: bigint): bigint {
  if (b) return gcd(b, a % b)
  return a < 0n ? -a : a
}
export function readWalkingTerrainPlacementRequest(
  input: unknown,
  current?: Readonly<{ source: WalkingRobotSource; demand: SceneDemand }>
): WalkingTerrainPlacementRequest {
  if (
    !record(input) ||
    !current ||
    input.source !== current.source ||
    input.demand !== current.demand
  )
    return invalid()
  if (admitted.has(input))
    return input as unknown as WalkingTerrainPlacementRequest
  if (
    !keys(input, [
      'format',
      'source',
      'demand',
      'farm',
      'route',
      'terrain',
      'partitions',
      'seeds',
      'baseOrientation',
      'fixedJoints',
      'interval',
      'budget'
    ]) ||
    input.format !== WALKING_TERRAIN_PLACEMENT_REQUEST_FORMAT ||
    input.farm !== current.demand.farm ||
    input.route !== current.demand.route ||
    !Object.isFrozen(current.source) ||
    !Object.isFrozen(current.demand) ||
    !record(input.budget) ||
    !keys(input.budget, [
      'maxInputValues',
      'maxTrianglePairs',
      'maxPredicates',
      'maxBits',
      'maxProjectionOperations'
    ])
  )
    return invalid()
  const budget = input.budget
  for (const [key, v] of Object.entries(budget))
    if (
      !Number.isSafeInteger(v) ||
      Number(v) < 1 ||
      Number(v) > (key === 'maxBits' ? 24000 : 10000000)
    )
      return invalid()
  let inputValues = 0
  const copy = (v: unknown): unknown => {
    if (++inputValues > Number(budget.maxInputValues))
      throw new TerrainPlacementBudgetError('terrain-input-budget')
    if (
      typeof v === 'bigint' &&
      (v < 0n ? -v : v).toString(2).length > Number(budget.maxBits)
    )
      throw new TerrainPlacementBudgetError('terrain-bit-budget')
    if (Array.isArray(v)) {
      if (v.length > Number(budget.maxInputValues) - inputValues)
        throw new TerrainPlacementBudgetError('terrain-input-budget')
      return Array.from(v, copy)
    }
    if (record(v))
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, copy(x)]))
    return v
  }
  const terrain = copy(input.terrain)
  if (
    !record(terrain) ||
    !keys(terrain, [
      'format',
      'id',
      'revision',
      'sceneRevision',
      'route',
      'provenance',
      'observations',
      'regions',
      'contactAssessments'
    ]) ||
    terrain.format !== 'walking-terrain/1' ||
    !id(terrain.id) ||
    !Number.isSafeInteger(terrain.revision) ||
    Number(terrain.revision) < 1 ||
    terrain.sceneRevision !== current.demand.scene.revision ||
    !record(terrain.route) ||
    !keys(terrain.route, ['bay', 'stripId']) ||
    !Number.isSafeInteger(terrain.route.bay) ||
    Number(terrain.route.bay) < 0 ||
    !id(terrain.route.stripId) ||
    !evidence(terrain.provenance) ||
    !record(terrain.observations) ||
    !keys(terrain.observations, ['height', 'slope', 'rut', 'debris']) ||
    !Object.values(terrain.observations).every(observation) ||
    !Array.isArray(terrain.regions) ||
    !Array.isArray(terrain.contactAssessments)
  )
    return invalid()
  const route = current.demand.route
  if (
    route &&
    (terrain.route.bay !== route.bay || terrain.route.stripId !== route.stripId)
  )
    return invalid()
  const regionIds = new Set<string>(),
    sourceIds = new Set<string>()
  for (const region of terrain.regions) {
    if (
      !record(region) ||
      !keys(region, [
        'id',
        'classification',
        'sourceId',
        'shape',
        'frame',
        'binding',
        'keepOut'
      ]) ||
      !id(region.id) ||
      regionIds.has(region.id) ||
      !id(region.sourceId) ||
      sourceIds.has(region.sourceId) ||
      !['soil', 'channel', 'debris'].includes(String(region.classification)) ||
      !record(region.shape) ||
      !keys(region.shape, ['kind', 'positions', 'indices']) ||
      region.shape.kind !== 'triangles' ||
      !record(region.frame) ||
      !keys(region.frame, ['position', 'rotation']) ||
      !vector(region.frame.position, 3) ||
      !vector(region.frame.rotation, 4) ||
      !region.frame.rotation.some((v) => v !== 0) ||
      !record(region.binding) ||
      !record(region.keepOut)
    )
      return invalid()
    region.shape = readSpatialShape(region.shape)
    if (region.classification === 'soil') {
      if (
        !keys(region.binding, ['kind', 'bay', 'stripId']) ||
        region.binding.kind !== 'route-soil' ||
        region.binding.bay !== terrain.route.bay ||
        region.binding.stripId !== terrain.route.stripId
      )
        return invalid()
    } else if (region.classification === 'channel') {
      const binding = region.binding
      if (
        !keys(binding, ['kind', 'bay', 'stripId']) ||
        binding.kind !== 'scene-channel' ||
        !current.demand.channels.some(
          (c) => c.bay === binding.bay && c.stripId === binding.stripId
        )
      )
        return invalid()
    } else if (
      !keys(region.binding, ['kind']) ||
      region.binding.kind !== 'debris'
    )
      return invalid()
    const keepOut = region.keepOut
    if (region.keepOut.kind === 'none') {
      if (!keys(region.keepOut, ['kind'])) return invalid()
    } else if (
      region.classification !== 'debris' ||
      !keys(region.keepOut, ['kind', 'min', 'max', 'evidence']) ||
      region.keepOut.kind !== 'bounded' ||
      !vector(region.keepOut.min, 3) ||
      !vector(region.keepOut.max, 3) ||
      !region.keepOut.min.every((v, i) => v <= (keepOut.max as number[])[i]) ||
      !evidence(region.keepOut.evidence)
    )
      return invalid()
    regionIds.add(region.id)
    sourceIds.add(region.sourceId)
  }
  const assessments = new Map<string, WalkingContactAssessment>()
  for (const a of terrain.contactAssessments) {
    if (
      !record(a) ||
      !keys(a, [
        'id',
        'footPatchId',
        'terrainRegionId',
        'pathId',
        'from',
        'until',
        'loadCaseId',
        'coverage',
        'geometry',
        'friction',
        'bearing',
        'sinkage'
      ]) ||
      !id(a.id) ||
      assessments.has(a.id) ||
      !id(a.footPatchId) ||
      !current.source.rig.contacts.feet.some(
        (contact) => contact.patch.id === a.footPatchId
      ) ||
      !id(a.terrainRegionId) ||
      !regionIds.has(a.terrainRegionId) ||
      !id(a.pathId) ||
      !id(a.loadCaseId) ||
      !finite(a.from) ||
      !finite(a.until) ||
      a.from >= a.until ||
      !['complete', 'sampled'].includes(String(a.coverage)) ||
      ![a.geometry, a.friction, a.bearing, a.sinkage].every(relation)
    )
      return invalid()
    assessments.set(a.id, a as unknown as WalkingContactAssessment)
  }
  const rawPartitions = copy(input.partitions)
  if (!Array.isArray(rawPartitions)) return invalid()
  const partitionIds = new Set<string>()
  const partitions = rawPartitions.map((entry) => {
    if (
      !record(entry) ||
      !keys(entry, ['sourceId', 'regions']) ||
      !id(entry.sourceId) ||
      partitionIds.has(entry.sourceId) ||
      !sourceIds.has(entry.sourceId) ||
      !Array.isArray(entry.regions)
    )
      return invalid()
    partitionIds.add(entry.sourceId)
    const source = (terrain.regions as WalkingTerrainRegion[]).find(
      (r) => r.sourceId === entry.sourceId
    )
    if (!source) return invalid()
    let regions: readonly SourceRegion[] | null = null
    try {
      regions = readSourceRegions(entry.regions, source.shape.indices.length)
    } catch {
      /* Incomplete source is valid unknown, never an invented partition. */
    }
    return { sourceId: entry.sourceId, regions }
  })
  const fraction = (v: unknown): ConstrainedFraction => {
    const value = copy(v)
    if (
      !record(value) ||
      !keys(value, ['numerator', 'denominator']) ||
      typeof value.numerator !== 'bigint' ||
      typeof value.denominator !== 'bigint' ||
      value.denominator <= 0n
    )
      return invalid()
    const divisor = gcd(value.numerator, value.denominator)
    return {
      numerator: value.numerator / divisor,
      denominator: value.denominator / divisor
    }
  }
  if (
    !Array.isArray(input.seeds) ||
    input.seeds.length !== 3 ||
    !Array.isArray(input.baseOrientation) ||
    input.baseOrientation.length !== 4 ||
    !Object.values(current.source.rig.presets).includes(
      input.fixedJoints as WalkingConstrainedRecipe['fixedJoints']
    )
  )
    return invalid()
  const seedIds = new Set<string>()
  const seeds = Array.from(input.seeds, (s) => {
    if (
      !record(s) ||
      !keys(s, [
        'chainId',
        'footPart',
        'footPatch',
        'contactAssessmentId',
        'terrainRegionId',
        'sourceRegionId',
        'triangleOffset',
        'barycentric'
      ]) ||
      !id(s.chainId) ||
      seedIds.has(s.chainId) ||
      !id(s.contactAssessmentId) ||
      !id(s.terrainRegionId) ||
      !id(s.sourceRegionId) ||
      !Number.isSafeInteger(s.triangleOffset) ||
      Number(s.triangleOffset) < 0 ||
      Number(s.triangleOffset) % 3 ||
      !Array.isArray(s.barycentric) ||
      s.barycentric.length !== 3
    )
      return invalid()
    const chain = current.source.rig.legChains.find((c) => c.id === s.chainId),
      contact = current.source.rig.contacts.feet.find(
        (c) => c.part === s.footPart && c.patch === s.footPatch
      )
    const region = (terrain.regions as WalkingTerrainRegion[]).find(
        (r) => r.id === s.terrainRegionId
      ),
      a = assessments.get(s.contactAssessmentId)
    if (
      !chain ||
      !contact ||
      contact.part.bodyId !== chain.footBodyId ||
      !region ||
      Number(s.triangleOffset) + 3 > region.shape.indices.length
    )
      return invalid()
    if (
      a &&
      (a.footPatchId !== contact.patch.id || a.terrainRegionId !== region.id)
    )
      return invalid()
    const partition = partitions.find(
      (p) => p.sourceId === region.sourceId
    )?.regions
    if (
      partition &&
      !partition.some(
        (p) =>
          p.id === s.sourceRegionId &&
          Number(s.triangleOffset) >= p.indexStart &&
          Number(s.triangleOffset) + 3 <= p.indexStart + p.indexCount
      )
    )
      return invalid()
    const bary = Array.from(s.barycentric, fraction)
    let n = 0n,
      d = 1n
    for (const v of bary) {
      if (v.numerator < 0n) return invalid()
      n = n * v.denominator + v.numerator * d
      d *= v.denominator
    }
    if (n !== d) return invalid()
    seedIds.add(s.chainId)
    return { ...s, barycentric: bary }
  })
  const orientation = Array.from(input.baseOrientation, fraction)
  if (!orientation.some((v) => v.numerator !== 0n)) return invalid()
  const span = copy(input.interval)
  if (
    !record(span) ||
    !keys(span, ['low', 'high']) ||
    !finite(span.low) ||
    !finite(span.high) ||
    span.low > span.high
  )
    return invalid()
  const result = {
    format: WALKING_TERRAIN_PLACEMENT_REQUEST_FORMAT,
    source: current.source,
    demand: current.demand,
    farm: current.demand.farm,
    route,
    terrain,
    partitions,
    seeds,
    baseOrientation: orientation,
    fixedJoints: input.fixedJoints,
    interval: span,
    budget: { ...budget },
    inputValues
  } as unknown as WalkingTerrainPlacementRequest
  const freeze = (v: unknown): void => {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.values(v).forEach(freeze)
      Object.freeze(v)
    }
  }
  freeze(result)
  admitted.add(result)
  return result
}
