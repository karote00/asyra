import type { Point3 } from './greenhouse'
import type { FarmConfiguration } from './farm-configuration'

export type SceneDemandRoute =
  | { readonly kind: 'unknown' }
  | {
      readonly kind: 'soil-strip'
      readonly bay: number
      readonly stripId: string
      readonly from: number
      readonly until: number
    }

export type SceneDemandEvidence =
  | { readonly kind: 'unknown' }
  | { readonly kind: 'measured'; readonly id: string }
  | {
      readonly kind: 'synthetic'
      readonly id: string
      readonly label: string
    }

export interface GrowthVolume {
  readonly id: string
  readonly anchor:
    | { readonly kind: 'world' }
    | { readonly kind: 'plant'; readonly plantId: string }
  readonly min: Point3
  readonly max: Point3
}

export type SceneDemandGrowth =
  | { readonly kind: 'unknown' }
  | {
      readonly kind: 'bounded'
      readonly coverage: 'complete' | 'discrete'
      readonly volumes: readonly GrowthVolume[]
    }

export type SceneDemandClearanceMargin =
  | { readonly kind: 'unknown' }
  | { readonly kind: 'bounded'; readonly metres: number }

export interface SceneDemandConfiguration {
  readonly version: 1
  readonly route: SceneDemandRoute
  readonly evidence: SceneDemandEvidence
  readonly growth: SceneDemandGrowth
  readonly clearanceMargin: SceneDemandClearanceMargin
}

const invalid = (): never => {
  throw new Error('Invalid scene demand configuration')
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actual = Object.keys(value)
  return actual.length === keys.length && keys.every((key) => key in value)
}

const identity = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0

const finitePoint = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)

function readRoute(value: unknown): SceneDemandRoute {
  if (!isRecord(value) || typeof value.kind !== 'string') return invalid()
  if (value.kind === 'unknown') {
    if (!exactKeys(value, ['kind'])) return invalid()
    return Object.freeze({ kind: 'unknown' })
  }
  if (
    value.kind !== 'soil-strip' ||
    !exactKeys(value, ['kind', 'bay', 'stripId', 'from', 'until']) ||
    !Number.isSafeInteger(value.bay) ||
    (value.bay as number) < 0 ||
    (value.bay as number) > 3 ||
    !identity(value.stripId) ||
    !Number.isFinite(value.from) ||
    (value.from as number) < 0 ||
    !Number.isFinite(value.until) ||
    (value.until as number) <= (value.from as number)
  )
    return invalid()
  return Object.freeze({
    kind: 'soil-strip',
    bay: value.bay as number,
    stripId: value.stripId as string,
    from: value.from as number,
    until: value.until as number
  })
}

function readEvidence(value: unknown): SceneDemandEvidence {
  if (!isRecord(value) || typeof value.kind !== 'string') return invalid()
  if (value.kind === 'unknown') {
    if (!exactKeys(value, ['kind'])) return invalid()
    return Object.freeze({ kind: 'unknown' })
  }
  if (value.kind === 'measured') {
    if (!exactKeys(value, ['kind', 'id']) || !identity(value.id))
      return invalid()
    return Object.freeze({ kind: 'measured', id: value.id as string })
  }
  if (
    value.kind !== 'synthetic' ||
    !exactKeys(value, ['kind', 'id', 'label']) ||
    !identity(value.id) ||
    !identity(value.label)
  )
    return invalid()
  return Object.freeze({
    kind: 'synthetic',
    id: value.id as string,
    label: value.label as string
  })
}

function readGrowth(value: unknown): SceneDemandGrowth {
  if (!isRecord(value) || typeof value.kind !== 'string') return invalid()
  if (value.kind === 'unknown') {
    if (!exactKeys(value, ['kind'])) return invalid()
    return Object.freeze({ kind: 'unknown' })
  }
  if (
    value.kind !== 'bounded' ||
    !exactKeys(value, ['kind', 'coverage', 'volumes']) ||
    !['complete', 'discrete'].includes(value.coverage as string) ||
    !Array.isArray(value.volumes)
  )
    return invalid()
  const ids = new Set<string>()
  const volumes = value.volumes.map((raw): GrowthVolume => {
    if (
      !isRecord(raw) ||
      !exactKeys(raw, ['id', 'anchor', 'min', 'max']) ||
      !identity(raw.id) ||
      ids.has(raw.id as string) ||
      !isRecord(raw.anchor) ||
      !finitePoint(raw.min) ||
      !finitePoint(raw.max)
    )
      return invalid()
    const min = raw.min
    const max = raw.max
    if (min.some((minimum, axis) => minimum >= max[axis])) return invalid()
    ids.add(raw.id as string)
    let anchor: GrowthVolume['anchor']
    if (raw.anchor.kind === 'world' && exactKeys(raw.anchor, ['kind']))
      anchor = Object.freeze({ kind: 'world' })
    else if (
      raw.anchor.kind === 'plant' &&
      exactKeys(raw.anchor, ['kind', 'plantId']) &&
      identity(raw.anchor.plantId)
    )
      anchor = Object.freeze({
        kind: 'plant',
        plantId: raw.anchor.plantId as string
      })
    else return invalid()
    return Object.freeze({
      id: raw.id as string,
      anchor,
      min: Object.freeze([...min]) as Point3,
      max: Object.freeze([...max]) as Point3
    })
  })
  return Object.freeze({
    kind: 'bounded',
    coverage: value.coverage as 'complete' | 'discrete',
    volumes: Object.freeze(volumes)
  })
}

function readMargin(value: unknown): SceneDemandClearanceMargin {
  if (!isRecord(value) || typeof value.kind !== 'string') return invalid()
  if (value.kind === 'unknown') {
    if (!exactKeys(value, ['kind'])) return invalid()
    return Object.freeze({ kind: 'unknown' })
  }
  if (
    value.kind !== 'bounded' ||
    !exactKeys(value, ['kind', 'metres']) ||
    !Number.isFinite(value.metres) ||
    (value.metres as number) < 0
  )
    return invalid()
  return Object.freeze({ kind: 'bounded', metres: value.metres as number })
}

export function validateSceneDemandConfiguration(
  value: unknown
): SceneDemandConfiguration {
  const snapshot: unknown = structuredClone(value)
  if (
    !isRecord(snapshot) ||
    !exactKeys(snapshot, [
      'version',
      'route',
      'evidence',
      'growth',
      'clearanceMargin'
    ]) ||
    snapshot.version !== 1
  )
    return invalid()
  return Object.freeze({
    version: 1,
    route: readRoute(snapshot.route),
    evidence: readEvidence(snapshot.evidence),
    growth: readGrowth(snapshot.growth),
    clearanceMargin: readMargin(snapshot.clearanceMargin)
  })
}

/** Reject a newly authored route that cannot resolve against the current farm. */
export function assertCurrentSceneDemandRoute(
  configuration: SceneDemandConfiguration,
  farm: FarmConfiguration
) {
  const route = configuration.route
  if (route.kind === 'unknown') return
  if (
    !farm.strips.some(({ id }) => id === route.stripId) ||
    route.until > farm.length
  )
    return invalid()
}

export const DEFAULT_SCENE_DEMAND_CONFIGURATION =
  validateSceneDemandConfiguration({
    version: 1,
    route: { kind: 'unknown' },
    evidence: { kind: 'unknown' },
    growth: { kind: 'unknown' },
    clearanceMargin: { kind: 'unknown' }
  })
