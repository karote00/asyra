import type { Point3 } from '../domain/greenhouse'

export interface SyntheticSourceBounds {
  readonly min: Point3
  readonly max: Point3
}
export interface SyntheticActorState {
  readonly from: number
  readonly until: number
  readonly motion: 'moving' | 'stationary'
  readonly bounds: SyntheticSourceBounds
}
export interface SyntheticActorDefinition {
  readonly trackId: string
  readonly kind: 'person' | 'moving-object'
  readonly states: readonly SyntheticActorState[]
}
export interface SyntheticDynamicDefinition {
  readonly format: 'synthetic-dynamic-scene/1'
  readonly assumption: string
  readonly domain: SyntheticSourceBounds
  readonly validFrom: number
  readonly validUntil: number
  readonly actors: readonly SyntheticActorDefinition[]
}
export interface SyntheticActorSource {
  readonly identity: Readonly<object>
  readonly trackId: string
  readonly kind: SyntheticActorDefinition['kind']
  readonly motion: SyntheticActorState['motion']
  readonly bounds: SyntheticSourceBounds
}
export interface SyntheticDynamicSnapshot {
  readonly identity: Readonly<object>
  readonly revision: number
  readonly definitionIdentity: Readonly<object>
  readonly observedAt: number
  readonly domain: SyntheticSourceBounds
  readonly assumption: string
  readonly coverage: 'covered' | 'unknown'
  readonly candidates: readonly SyntheticActorSource[]
  readonly unvisited: number
  readonly reasons: readonly string[]
  readonly work: Readonly<{ sourceActorVisits: number }>
}
const reject = (): never => {
  throw new Error('Invalid synthetic dynamic source')
}
function keys(value: object, expected: string[]) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== expected.length ||
    Object.keys(value).some((key) => !expected.includes(key))
  )
    reject()
}
const point = (p: Point3) =>
  Array.isArray(p) &&
  p.length === 3 &&
  [0, 1, 2].every((axis) => Number.isFinite(p[axis]))
function validBounds(b: SyntheticSourceBounds): boolean {
  return (
    !!b &&
    point(b.min) &&
    point(b.max) &&
    b.min.every((v, axis) => v <= b.max[axis])
  )
}
const contains = (outer: SyntheticSourceBounds, inner: SyntheticSourceBounds) =>
  inner.min.every(
    (v, axis) => v >= outer.min[axis] && inner.max[axis] <= outer.max[axis]
  )
const overlaps = (a: SyntheticSourceBounds, b: SyntheticSourceBounds) =>
  a.min.every((v, axis) => v <= b.max[axis] && a.max[axis] >= b.min[axis])
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

/** Explicit finite simulator world. Its private sources are not observations. */
export class SyntheticDynamicSceneOwner {
  private definition?: SyntheticDynamicDefinition
  private definitionIdentity: Readonly<object> = Object.freeze({})
  private revision = 0
  private tracks = new Map<
    string,
    { kind: SyntheticActorDefinition['kind']; identity: Readonly<object> }
  >()
  private issued = new WeakSet<SyntheticDynamicSnapshot>()

  prepare(raw: SyntheticDynamicDefinition): void {
    const value = structuredClone(raw)
    keys(value, [
      'format',
      'assumption',
      'domain',
      'validFrom',
      'validUntil',
      'actors'
    ])
    if (
      value.format !== 'synthetic-dynamic-scene/1' ||
      typeof value.assumption !== 'string' ||
      !value.assumption.trim() ||
      !validBounds(value.domain) ||
      !Number.isFinite(value.validFrom) ||
      value.validFrom < 0 ||
      !Number.isFinite(value.validUntil) ||
      value.validUntil <= value.validFrom ||
      !Array.isArray(value.actors) ||
      value.actors.length > 4096
    )
      reject()
    keys(value.domain, ['min', 'max'])
    const seen = new Set<string>()
    const additions: SyntheticActorDefinition[] = []
    for (const actor of value.actors) {
      keys(actor, ['trackId', 'kind', 'states'])
      if (
        typeof actor.trackId !== 'string' ||
        !actor.trackId.trim() ||
        seen.has(actor.trackId) ||
        !['person', 'moving-object'].includes(actor.kind) ||
        !Array.isArray(actor.states) ||
        actor.states.length > 4096
      )
        reject()
      seen.add(actor.trackId)
      const previous = this.tracks.get(actor.trackId)
      if (previous && previous.kind !== actor.kind) reject()
      if (!previous) additions.push(actor)
      let until = value.validFrom
      for (const state of actor.states) {
        keys(state, ['from', 'until', 'motion', 'bounds'])
        if (
          !Number.isFinite(state.from) ||
          !Number.isFinite(state.until) ||
          state.from < until ||
          state.until <= state.from ||
          state.until > value.validUntil ||
          !['moving', 'stationary'].includes(state.motion) ||
          !validBounds(state.bounds) ||
          !contains(value.domain, state.bounds)
        )
          reject()
        keys(state.bounds, ['min', 'max'])
        until = state.until
      }
    }
    for (const actor of additions)
      this.tracks.set(actor.trackId, {
        kind: actor.kind,
        identity: Object.freeze({})
      })
    this.definition = freeze(value)
    this.definitionIdentity = Object.freeze({})
    this.revision++
    this.issued = new WeakSet()
  }

  isCurrent(snapshot: SyntheticDynamicSnapshot): boolean {
    return (
      this.issued.has(snapshot) &&
      snapshot.definitionIdentity === this.definitionIdentity
    )
  }

  readAt(
    time: number,
    volume: SyntheticSourceBounds,
    maxActors: number
  ): SyntheticDynamicSnapshot {
    if (
      !Number.isFinite(time) ||
      time < 0 ||
      !validBounds(volume) ||
      !Number.isSafeInteger(maxActors) ||
      maxActors < 0
    )
      reject()
    const definition = this.definition
    const candidates: SyntheticActorSource[] = []
    const reasons: string[] = []
    let visits = 0
    if (!definition) reasons.push('missing-synthetic-world')
    else {
      if (time < definition.validFrom || time >= definition.validUntil)
        reasons.push('outside-source-time')
      if (!contains(definition.domain, volume))
        reasons.push('outside-dynamic-domain')
      if (!reasons.length) {
        for (const actor of definition.actors) {
          if (visits >= maxActors) break
          visits++
          const state = actor.states.find(
            (s) => s.from <= time && time < s.until
          )
          if (!state) {
            reasons.push('actor-timeline-gap')
            continue
          }
          if (!overlaps(state.bounds, volume)) continue
          const track = this.tracks.get(actor.trackId)
          if (!track) return reject()
          candidates.push(
            Object.freeze({
              identity: track.identity,
              trackId: actor.trackId,
              kind: actor.kind,
              motion: state.motion,
              bounds: state.bounds
            })
          )
        }
      }
    }
    const unvisited = (definition?.actors.length ?? 0) - visits
    if (unvisited) reasons.push('unvisited-actor-source')
    const result: SyntheticDynamicSnapshot = Object.freeze({
      identity: Object.freeze({}),
      revision: this.revision,
      definitionIdentity: this.definitionIdentity,
      observedAt: time,
      domain: definition?.domain ?? freeze(structuredClone(volume)),
      assumption: definition?.assumption ?? 'Missing synthetic definition',
      coverage: reasons.length ? 'unknown' : 'covered',
      candidates: Object.freeze(candidates),
      unvisited,
      reasons: Object.freeze(reasons),
      work: Object.freeze({ sourceActorVisits: visits })
    })
    this.issued.add(result)
    return result
  }
}
