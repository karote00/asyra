import type {
  WalkingEnvelopeBounds,
  WalkingStowedEnvelope
} from '../domain/walking-robot-envelopes'
import type { Point3 } from '../domain/greenhouse'
import { add, interval, subtract } from '../domain/scalar-arithmetic'
import { isSceneObservationSpace } from './scene-demand'
import type {
  SceneObservationSpace,
  SceneDemand,
  SceneDemandExclusion,
  SceneDemandSource
} from './scene-demand'

export interface WalkingTransitAction {
  readonly identity: Readonly<object>
  readonly from: Point3
  readonly to: Point3
}

export interface WalkingTransitWork {
  readonly upgrades: number
  readonly builds: number
  readonly nodeVisits: number
  readonly indexEntries: number
  readonly validationVisits: number
  readonly queries: number
  readonly axisCandidates: number
  readonly detailedOverlaps: number
  readonly contributors: number
}

export interface WalkingTransitResult {
  readonly format: 'walking-transit-screen/1'
  readonly status: 'ready-fast' | 'local-required' | 'unknown'
  readonly demand: SceneDemand
  readonly envelope: WalkingStowedEnvelope | WalkingEnvelopeBounds
  readonly action: WalkingTransitAction
  readonly affected: readonly SceneDemandExclusion[]
  readonly reasons: readonly string[]
  readonly work: WalkingTransitWork
}

export interface WalkingSceneCandidates {
  readonly format: 'walking-scene-candidates/1'
  readonly provenance: 'w1-canonical-obstacles/1'
  readonly demand: SceneDemand
  readonly inventory: SceneDemand['freePassage']['exclusions']
  readonly route: SceneDemand['route']
  readonly bounds: WalkingEnvelopeBounds
  readonly padding: number
  readonly scope: 'route' | 'observation'
  readonly observationSpace?: SceneObservationSpace
  readonly coverage:
    'covered' | 'outside-route' | 'outside-observation-domain' | 'unknown'
  readonly affected: readonly SceneDemandExclusion[]
  readonly reasons: readonly string[]
  readonly work: WalkingTransitWork
}

interface Entry {
  readonly exclusion: SceneDemandExclusion
  readonly min: number
  readonly max: number
  readonly ordinal: number
  readonly observationOrdinal: number
  readonly route?: SceneDemandExclusion
  readonly observation?: SceneDemandSource
}
interface Node extends Entry {
  readonly subtreeMax: number
  readonly left?: Node
  readonly right?: Node
}

const finitePoint = (value: readonly number[]) =>
  value.length === 3 && value.every(Number.isFinite)
const validBounds = (value: {
  readonly min: readonly number[]
  readonly max: readonly number[]
}) =>
  finitePoint(value.min) &&
  finitePoint(value.max) &&
  value.min.every((minimum, axis) => minimum <= value.max[axis])
const lowerDifference = (value: number, offset: number) =>
  subtract(interval(value), interval(offset)).low
const upperSum = (value: number, offset: number) =>
  add(interval(value), interval(offset)).high
const overlaps = (
  first: WalkingEnvelopeBounds,
  second: WalkingEnvelopeBounds
) =>
  first.min.every(
    (minimum, axis) =>
      minimum <= second.max[axis] && first.max[axis] >= second.min[axis]
  )
const resultWork = (before: WalkingTransitWork, after: WalkingTransitWork) =>
  Object.freeze({
    upgrades: after.upgrades - before.upgrades,
    builds: after.builds - before.builds,
    nodeVisits: after.nodeVisits - before.nodeVisits,
    indexEntries: after.indexEntries - before.indexEntries,
    validationVisits: after.validationVisits - before.validationVisits,
    queries: after.queries - before.queries,
    axisCandidates: after.axisCandidates - before.axisCandidates,
    detailedOverlaps: after.detailedOverlaps - before.detailedOverlaps,
    contributors: after.contributors - before.contributors
  })

/** Route-local broad phase only. Overlap requests bounded W3 local work. */
export class WalkingTransitScreen {
  readonly work = {
    upgrades: 0,
    builds: 0,
    nodeVisits: 0,
    indexEntries: 0,
    validationVisits: 0,
    queries: 0,
    axisCandidates: 0,
    detailedOverlaps: 0,
    contributors: 0,
    clears: 0
  }
  private observationValidation?: {
    space: SceneObservationSpace
    valid: boolean
  }
  private key?: Readonly<{
    observationSpace?: SceneObservationSpace
    demandIdentity: SceneDemand['identity']
    route: SceneDemand['route']
    exclusions: SceneDemand['freePassage']['exclusions']
  }>
  private validation?: Readonly<{
    demandIdentity: SceneDemand['identity']
    route: SceneDemand['route']
    coverage: SceneDemand['freePassage']['route']
    exclusions: SceneDemand['freePassage']['exclusions']
    reasons: SceneDemand['freePassage']['reasons']
    status: SceneDemand['freePassage']['status']
    valid: boolean
    unresolved: readonly string[]
  }>
  private root?: Node
  private issued = new WeakSet<WalkingSceneCandidates>()

  constructor(
    private readonly isCurrentDemand: (demand: SceneDemand) => boolean = () =>
      true
  ) {}

  private admitDemand(demand: SceneDemand) {
    const passage = demand.freePassage
    if (
      this.validation?.demandIdentity === demand.identity &&
      this.validation.route === demand.route &&
      this.validation.coverage === passage.route &&
      this.validation.exclusions === passage.exclusions &&
      this.validation.reasons === passage.reasons &&
      this.validation.status === passage.status
    )
      return this.validation
    let valid = passage.route !== null && validBounds(passage.route)
    for (const exclusion of passage.exclusions) {
      this.work.validationVisits++
      if (
        !validBounds(exclusion.bounds) ||
        !['source', 'growth', 'channel'].includes(exclusion.kind)
      )
        valid = false
    }
    this.validation = Object.freeze({
      demandIdentity: demand.identity,
      route: demand.route,
      coverage: passage.route,
      exclusions: passage.exclusions,
      reasons: passage.reasons,
      status: passage.status,
      valid,
      unresolved: Object.freeze(
        passage.reasons.filter(
          (reason) => reason !== 'exact-source-query-required'
        )
      )
    })
    return this.validation
  }

  private admitObservation(demand: SceneDemand, space?: SceneObservationSpace) {
    if (!space || !isSceneObservationSpace(demand, space)) return false
    if (
      this.observationValidation &&
      this.observationValidation.space === space
    )
      return this.observationValidation.valid
    let valid =
      !!space &&
      space.provenance === 'w1-canonical-obstacles/1' &&
      space.status === 'complete' &&
      !!space.domain &&
      validBounds(space.domain) &&
      Array.isArray(space.sources) &&
      space.reasons.length === 0
    if (space && Array.isArray(space.sources))
      for (const source of space.sources) {
        this.work.validationVisits++
        if (source.kind !== 'source' || !validBounds(source.bounds))
          valid = false
      }
    this.observationValidation = { space, valid }
    return valid
  }

  private prepare(demand: SceneDemand, space?: SceneObservationSpace) {
    if (
      this.key?.demandIdentity === demand.identity &&
      this.key.route === demand.route &&
      this.key.exclusions === demand.freePassage.exclusions &&
      (!space || this.key.observationSpace === space)
    )
      return
    if (
      space &&
      this.key?.demandIdentity === demand.identity &&
      !this.key.observationSpace
    )
      this.work.upgrades++
    const members = new Map<
      SceneDemandExclusion,
      {
        route?: SceneDemandExclusion
        observation?: SceneDemandSource
        ordinal: number
        observationOrdinal: number
      }
    >()
    if (space && this.admitObservation(demand, space))
      space.sources.forEach((source, ordinal) =>
        members.set(source, {
          observation: source,
          ordinal,
          observationOrdinal: ordinal
        })
      )
    demand.freePassage.exclusions.forEach((item, ordinal) => {
      const source =
        item.kind === 'source' ? (item.observationSource ?? item) : item
      const previous = members.get(source)
      members.set(source, {
        ...previous,
        route: item,
        ordinal,
        observationOrdinal: previous?.observationOrdinal ?? -1
      })
    })
    const entries: Entry[] = [...members.values()]
      .map((member) => {
        const exclusion = member.route ?? member.observation
        if (!exclusion) throw new Error('Missing indexed membership')
        return {
          ...member,
          exclusion,
          min: Math.min(
            exclusion.bounds.min[0],
            member.observation?.bounds.min[0] ?? Infinity
          ),
          max: Math.max(
            exclusion.bounds.max[0],
            member.observation?.bounds.max[0] ?? -Infinity
          )
        }
      })
      .sort((a, b) => a.min - b.min || a.ordinal - b.ordinal)
    const build = (from: number, until: number): Node | undefined => {
      if (from >= until) return undefined
      const middle = Math.floor((from + until) / 2)
      const entry = entries[middle]
      const left = build(from, middle),
        right = build(middle + 1, until)
      return Object.freeze({
        ...entry,
        subtreeMax: Math.max(
          entry.max,
          left?.subtreeMax ?? -Infinity,
          right?.subtreeMax ?? -Infinity
        ),
        ...(left ? { left } : {}),
        ...(right ? { right } : {})
      })
    }
    this.root = build(0, entries.length)
    this.key = Object.freeze({
      observationSpace: space,
      demandIdentity: demand.identity,
      route: demand.route,
      exclusions: demand.freePassage.exclusions
    })
    this.work.builds++
    this.work.indexEntries += entries.length
  }

  evaluate(
    demand: SceneDemand,
    envelope: WalkingStowedEnvelope | WalkingEnvelopeBounds,
    action: WalkingTransitAction,
    margin: number
  ): WalkingTransitResult {
    if (
      !Number.isFinite(margin) ||
      margin < 0 ||
      !finitePoint(action.from) ||
      !finitePoint(action.to)
    )
      throw new Error('Invalid walking transit screen input')
    const before = { ...this.work }
    const unknown = (reasons: readonly string[]): WalkingTransitResult =>
      Object.freeze({
        format: 'walking-transit-screen/1',
        status: 'unknown',
        demand,
        envelope,
        action,
        affected: Object.freeze([]),
        reasons: Object.freeze([...reasons]),
        work: resultWork(before, this.work)
      })
    const bounds = 'bounds' in envelope ? envelope.bounds : envelope
    const reference =
      'request' in envelope
        ? envelope.request.pose.base.position
        : ([0, 0, 0] as const)
    const current = this.isCurrentDemand(demand)
    if (!current || !demand.route || !demand.freePassage.route)
      return unknown([current ? 'missing-route' : 'stale-scene-demand'])
    if (!validBounds(bounds) || !finitePoint(reference))
      return unknown(['invalid-transit-bounds'])
    const admission = this.admitDemand(demand)
    if (!admission.valid) return unknown(['invalid-transit-bounds'])
    if (admission.unresolved.length) return unknown(admission.unresolved)
    if (admission.status === 'blocked') return unknown(['free-passage-blocked'])
    const localMin = bounds.min.map((value, axis) =>
      lowerDifference(value, reference[axis])
    )
    const localMax = bounds.max.map((value, axis) =>
      upperSum(value, -reference[axis])
    )
    const swept = {
      min: localMin.map((value, axis) =>
        lowerDifference(value, -Math.min(action.from[axis], action.to[axis]))
      ) as unknown as Point3,
      max: localMax.map((value, axis) =>
        upperSum(value, Math.max(action.from[axis], action.to[axis]))
      ) as unknown as Point3,
      size: localMax.map((_, axis) =>
        upperSum(localMax[axis], -localMin[axis])
      ) as unknown as Point3
    }
    if (!validBounds(swept)) return unknown(['invalid-transit-bounds'])
    const candidates = this.queryVolume(demand, swept, margin)
    if (candidates.coverage !== 'covered') return unknown(candidates.reasons)
    const affected = candidates.affected
    return Object.freeze({
      format: 'walking-transit-screen/1',
      status: affected.length ? 'local-required' : 'ready-fast',
      demand,
      envelope,
      action,
      affected: Object.freeze(affected),
      reasons: Object.freeze([]),
      work: resultWork(before, this.work)
    })
  }

  isCurrentVolume(result: WalkingSceneCandidates): boolean {
    return (
      this.issued.has(result) &&
      this.isCurrentDemand(result.demand) &&
      this.key?.demandIdentity === result.demand.identity &&
      this.key.route === result.route &&
      (result.scope === 'observation'
        ? this.key.observationSpace === result.observationSpace &&
          !!result.observationSpace &&
          isSceneObservationSpace(result.demand, result.observationSpace) &&
          result.inventory === result.observationSpace.sources
        : this.key.exclusions === result.inventory)
    )
  }

  queryVolume(
    demand: SceneDemand,
    bounds: WalkingEnvelopeBounds,
    margin = 0
  ): WalkingSceneCandidates {
    return this.query(demand, bounds, margin, 'route')
  }
  queryObservationVolume(
    demand: SceneDemand,
    space: SceneObservationSpace,
    bounds: WalkingEnvelopeBounds,
    margin = 0
  ): WalkingSceneCandidates {
    return this.query(demand, bounds, margin, 'observation', space)
  }
  private query(
    demand: SceneDemand,
    bounds: WalkingEnvelopeBounds,
    margin: number,
    scope: 'route' | 'observation',
    space?: SceneObservationSpace
  ): WalkingSceneCandidates {
    if (!Number.isFinite(margin) || margin < 0)
      throw new Error('Invalid source query padding')
    const before = { ...this.work }
    const swept = Object.freeze({
      min: Object.freeze([...bounds.min]) as Point3,
      max: Object.freeze([...bounds.max]) as Point3,
      size: Object.freeze([...bounds.size]) as Point3
    })
    const publish = (
      coverage: WalkingSceneCandidates['coverage'],
      affected: readonly SceneDemandExclusion[],
      reasons: readonly string[]
    ) => {
      const result: WalkingSceneCandidates = Object.freeze({
        format: 'walking-scene-candidates/1',
        provenance: 'w1-canonical-obstacles/1',
        demand,
        scope,
        ...(scope === 'observation' ? { observationSpace: space } : {}),
        inventory:
          (scope === 'observation'
            ? space?.sources
            : demand.freePassage?.exclusions) ?? Object.freeze([]),
        route: demand.route,
        bounds: swept,
        padding: margin,
        coverage,
        affected: Object.freeze([...affected]),
        reasons: Object.freeze([...reasons]),
        work: resultWork(before, this.work)
      })
      this.issued.add(result)
      return result
    }
    if (!this.isCurrentDemand(demand))
      return publish('unknown', [], ['stale-scene-demand'])
    if (!Array.isArray(demand.freePassage?.exclusions))
      return publish('unknown', [], ['missing-source-inventory'])
    if (!validBounds(swept))
      return publish('unknown', [], ['invalid-transit-bounds'])
    let coverage: SceneDemand['freePassage']['route']
    if (scope === 'observation') {
      if (!this.admitObservation(demand, space))
        return publish(
          'unknown',
          [],
          ['unknown-observation-inventory', ...(space?.reasons ?? [])]
        )
      coverage = space?.domain ?? null
    } else {
      if (!demand.route || !demand.freePassage.route)
        return publish('unknown', [], ['missing-route'])
      const admission = this.admitDemand(demand)
      if (!admission.valid)
        return publish('unknown', [], ['invalid-transit-bounds'])
      if (admission.unresolved.length)
        return publish('unknown', [], admission.unresolved)
      if (admission.status === 'blocked')
        return publish('unknown', [], ['free-passage-blocked'])
      coverage = demand.freePassage.route
    }
    if (!coverage) return publish('unknown', [], ['missing-observation-domain'])
    if (
      swept.min.some(
        (minimum, axis) => lowerDifference(minimum, margin) < coverage.min[axis]
      ) ||
      swept.max.some(
        (maximum, axis) => upperSum(maximum, margin) > coverage.max[axis]
      )
    )
      return scope === 'route'
        ? publish('outside-route', [], ['outside-route-coverage'])
        : publish(
            'outside-observation-domain',
            [],
            ['outside-observation-domain']
          )
    this.prepare(demand, space)
    this.work.queries++
    const candidates: Entry[] = []
    const query = (node?: Node) => {
      if (!node) return
      this.work.nodeVisits++
      if (node.subtreeMax < lowerDifference(swept.min[0], margin)) return
      query(node.left)
      if (
        (scope === 'route' ? !!node.route : !!node.observation) &&
        node.min <= upperSum(swept.max[0], margin) &&
        node.max >= lowerDifference(swept.min[0], margin)
      ) {
        candidates.push(node)
        this.work.axisCandidates++
      }
      if (node.min <= upperSum(swept.max[0], margin)) query(node.right)
    }
    query(this.root)
    const memberOf = (candidate: Entry) => {
      const member = scope === 'route' ? candidate.route : candidate.observation
      if (!member) throw new Error('Missing query membership')
      return member
    }
    const affected = candidates
      .filter((candidate) => {
        const member = memberOf(candidate)
        const min = member.bounds.min.map((value) =>
          lowerDifference(value, margin)
        ) as unknown as Point3
        const max = member.bounds.max.map((value) =>
          upperSum(value, margin)
        ) as unknown as Point3
        const expanded: WalkingEnvelopeBounds = {
          min,
          max,
          size: max.map((value, axis) =>
            upperSum(value, -min[axis])
          ) as unknown as Point3
        }
        if (!overlaps(swept, expanded)) return false
        this.work.detailedOverlaps++
        return true
      })
      .sort((a, b) =>
        scope === 'route'
          ? a.ordinal - b.ordinal
          : a.observationOrdinal - b.observationOrdinal
      )
      .map(memberOf)
    this.work.contributors += affected.length
    if (!this.isCurrentDemand(demand))
      return publish('unknown', [], ['stale-scene-demand'])
    return publish('covered', affected, [])
  }

  clear() {
    this.issued = new WeakSet()
    this.key = undefined
    this.validation = undefined
    this.observationValidation = undefined
    this.root = undefined
    this.work.clears++
  }
}
