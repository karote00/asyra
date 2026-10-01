import type { Point3 } from './greenhouse'
import type {
  WalkingEvidence,
  WalkingRigidTransform
} from './walking-robot-definition'
import type {
  WalkingRobotSource,
  WalkingPatchReference
} from './walking-robot-source'
import type {
  WalkingMotionPath,
  WalkingStanceSchedule,
  WalkingLoadCase,
  WalkingContactAssessment,
  WalkingTerrainEvidence
} from './walking-motion-contract'

export interface WalkingQuasiStaticMotionBinding {
  readonly identity: Readonly<object>
  readonly revision: number
  readonly source: WalkingRobotSource
  readonly path: Pick<WalkingMotionPath, 'id'>
  readonly stance: WalkingStanceSchedule
  readonly load: WalkingLoadCase
  readonly terrain: Pick<WalkingTerrainEvidence, 'id' | 'revision'>
  readonly evaluation: Readonly<{ from: number; until: number }>
  readonly contacts: readonly Readonly<{
    chainId: string
    assessment: WalkingContactAssessment
    patchReference: WalkingPatchReference
    terrainRegionId: string
    pathId: string
    loadCaseId: string
    from: number
    until: number
  }>[]
}

export const WALKING_QUASI_STATIC_REQUEST_FORMAT =
  'walking-quasi-static-request/1' as const
export type WalkingMechanicsUnknown = Readonly<{ kind: 'unknown' }>
export interface WalkingQuasiStaticContact {
  readonly chainId: string
  readonly contactAssessmentId: string
  readonly footPatchId: string
  readonly terrainRegionId: string
  readonly position:
    | WalkingMechanicsUnknown
    | Readonly<{
        kind: 'plane-point'
        coordinates: readonly [number, number]
        evidence: WalkingEvidence
      }>
}
export interface WalkingQuasiStaticRequest {
  readonly format: typeof WALKING_QUASI_STATIC_REQUEST_FORMAT
  readonly requestId: string
  readonly motion: Readonly<{
    revision: number
    sourceId: string
    sourceRevision: number
    terrainId: string
    terrainRevision: number
    pathId: string
    stanceId: string
    loadCaseId: string
  }>
  readonly configuration: Readonly<{
    id: string
    kind:
      | 'left-high-reach'
      | 'right-high-reach'
      | 'carried-load-return'
      | 'bilateral-working'
  }>
  readonly time: number
  readonly phase: Readonly<{ from: number; until: number }>
  readonly support: Readonly<{
    plane:
      | WalkingMechanicsUnknown
      | Readonly<{
          kind: 'declared'
          frame: WalkingRigidTransform
          evidence: WalkingEvidence
        }>
    contacts: readonly WalkingQuasiStaticContact[]
    lineOfActionReserve:
      | WalkingMechanicsUnknown
      | Readonly<{ kind: 'bounded'; metres: number; evidence: WalkingEvidence }>
  }>
  readonly loadMasses: Readonly<{
    sourceMassPropertiesId: string
    crate:
      | WalkingMechanicsUnknown
      | Readonly<{
          kind: 'known'
          massIdentity: string
          massKg: number
          holderLocalCoM: Point3
          evidence: WalkingEvidence
        }>
    carried: readonly Readonly<{
      attachmentId: string
      massPropertiesId: string
      properties:
        | WalkingMechanicsUnknown
        | Readonly<{
            kind: 'known'
            massKg: number
            localCoM: Point3
            evidence: WalkingEvidence
          }>
    }>[]
  }>
}

const admitted = new WeakMap<object, Readonly<object>>()
const fail = (): never => {
  throw new Error('Invalid walking quasi-static request')
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const exact = (v: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(v).length === keys.length && keys.every((k) => k in v)
const id = (v: unknown) => typeof v === 'string' && v.trim().length > 0
const finite = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v)
const point = (v: unknown, length = 3) =>
  Array.isArray(v) && v.length === length && v.every(finite)
const unknown = (v: unknown) =>
  record(v) && exact(v, ['kind']) && v.kind === 'unknown'
const evidence = (v: unknown) =>
  record(v) &&
  id(v.id) &&
  (v.kind === 'measured'
    ? exact(v, ['kind', 'id'])
    : v.kind === 'synthetic' &&
      exact(v, ['kind', 'id', 'label']) &&
      id(v.label))
function frame(v: unknown) {
  return (
    record(v) &&
    exact(v, ['position', 'rotation']) &&
    point(v.position) &&
    Array.isArray(v.rotation) &&
    point(v.rotation, 4) &&
    Math.abs(Math.hypot(...v.rotation) - 1) <= 1e-9
  )
}
function freeze<T>(v: T): T {
  if (v && typeof v === 'object') {
    for (const child of Object.values(v)) freeze(child)
    Object.freeze(v)
  }
  return v
}

/** W3 opaque identity binds this request; descriptors do not replace ownership. */
export function readWalkingQuasiStaticRequest(
  raw: unknown,
  motion: WalkingQuasiStaticMotionBinding
): WalkingQuasiStaticRequest {
  if (record(raw) && admitted.has(raw)) {
    if (admitted.get(raw) !== motion.identity) return fail()
    return raw as unknown as WalkingQuasiStaticRequest
  }
  const r: unknown = structuredClone(raw)
  if (
    !record(r) ||
    !exact(r, [
      'format',
      'requestId',
      'motion',
      'configuration',
      'time',
      'phase',
      'support',
      'loadMasses'
    ]) ||
    r.format !== WALKING_QUASI_STATIC_REQUEST_FORMAT ||
    !id(r.requestId) ||
    !record(r.motion) ||
    !exact(r.motion, [
      'revision',
      'sourceId',
      'sourceRevision',
      'terrainId',
      'terrainRevision',
      'pathId',
      'stanceId',
      'loadCaseId'
    ])
  )
    return fail()
  const descriptor = {
    revision: motion.revision,
    sourceId: motion.source.id,
    sourceRevision: motion.source.revision,
    terrainId: motion.terrain.id,
    terrainRevision: motion.terrain.revision,
    pathId: motion.path.id,
    stanceId: motion.stance.id,
    loadCaseId: motion.load.id
  }
  if (
    !Object.entries(descriptor).every(
      ([key, value]) =>
        r.motion && (r.motion as Record<string, unknown>)[key] === value
    )
  )
    return fail()
  if (
    !record(r.configuration) ||
    !exact(r.configuration, ['id', 'kind']) ||
    !id(r.configuration.id) ||
    ![
      'left-high-reach',
      'right-high-reach',
      'carried-load-return',
      'bilateral-working'
    ].includes(String(r.configuration.kind)) ||
    !finite(r.time) ||
    r.time < motion.evaluation.from ||
    r.time > motion.evaluation.until ||
    !record(r.phase) ||
    !exact(r.phase, ['from', 'until'])
  )
    return fail()
  const phase = motion.stance.phases.find(
    (p) =>
      record(r.phase) && p.from === r.phase.from && p.until === r.phase.until
  )
  if (!phase || r.time < phase.from || r.time > phase.until) return fail()
  const support = r.support
  if (
    !record(support) ||
    !exact(support, ['plane', 'contacts', 'lineOfActionReserve'])
  )
    return fail()
  const plane = support.plane,
    reserve = support.lineOfActionReserve
  if (
    !(
      unknown(plane) ||
      (record(plane) &&
        exact(plane, ['kind', 'frame', 'evidence']) &&
        plane.kind === 'declared' &&
        frame(plane.frame) &&
        evidence(plane.evidence))
    ) ||
    !(
      unknown(reserve) ||
      (record(reserve) &&
        exact(reserve, ['kind', 'metres', 'evidence']) &&
        reserve.kind === 'bounded' &&
        finite(reserve.metres) &&
        reserve.metres >= 0 &&
        evidence(reserve.evidence))
    )
  )
    return fail()
  const legs = phase.legs.filter((l) => l.state.kind === 'support')
  if (
    !Array.isArray(support.contacts) ||
    support.contacts.length !== legs.length
  )
    return fail()
  const chains = new Set<string>()
  for (const contact of support.contacts) {
    if (
      !record(contact) ||
      !exact(contact, [
        'chainId',
        'contactAssessmentId',
        'footPatchId',
        'terrainRegionId',
        'position'
      ]) ||
      !id(contact.chainId)
    )
      return fail()
    const leg = legs.find((l) => l.chainId === contact.chainId)
    if (
      !leg ||
      leg.state.kind !== 'support' ||
      chains.has(leg.chainId) ||
      contact.contactAssessmentId !== leg.state.contactAssessmentId
    )
      return fail()
    const bound = motion.contacts.find(
      (c) =>
        c.chainId === leg.chainId &&
        c.assessment.id === contact.contactAssessmentId &&
        c.from === phase.from &&
        c.until === phase.until
    )
    if (
      !bound ||
      bound.patchReference.patch.id !== contact.footPatchId ||
      bound.terrainRegionId !== contact.terrainRegionId ||
      bound.pathId !== motion.path.id ||
      bound.loadCaseId !== motion.load.id
    )
      return fail()
    const position = contact.position
    if (!(
      unknown(position) ||
      (record(position) &&
        exact(position, ['kind', 'coordinates', 'evidence']) &&
        position.kind === 'plane-point' &&
        point(position.coordinates, 2) &&
        evidence(position.evidence))
    ))
      return fail()
    chains.add(leg.chainId)
  }
  const load = r.loadMasses
  if (
    !record(load) ||
    !exact(load, ['sourceMassPropertiesId', 'crate', 'carried']) ||
    load.sourceMassPropertiesId !== motion.source.massProperties.id
  )
    return fail()
  const crate = load.crate
  if (!unknown(crate)) {
    if (
      !record(crate) ||
      !exact(crate, [
        'kind',
        'massIdentity',
        'massKg',
        'holderLocalCoM',
        'evidence'
      ]) ||
      crate.kind !== 'known' ||
      motion.load.crate.kind !== 'attached' ||
      crate.massIdentity !== motion.load.crate.massIdentity ||
      !finite(crate.massKg) ||
      crate.massKg <= 0 ||
      !point(crate.holderLocalCoM) ||
      !evidence(crate.evidence)
    )
      return fail()
  }
  const items =
    motion.load.carried.kind === 'attached' ? motion.load.carried.items : []
  if (!Array.isArray(load.carried) || load.carried.length !== items.length)
    return fail()
  const attachmentIds = new Set<string>()
  for (const entry of load.carried) {
    if (
      !record(entry) ||
      !exact(entry, ['attachmentId', 'massPropertiesId', 'properties'])
    )
      return fail()
    const item = items.find(
      (i) =>
        i.id === entry.attachmentId &&
        i.massPropertiesId === entry.massPropertiesId
    )
    if (!item || attachmentIds.has(item.id)) return fail()
    const properties = entry.properties
    if (!(
      unknown(properties) ||
      (record(properties) &&
        exact(properties, ['kind', 'massKg', 'localCoM', 'evidence']) &&
        properties.kind === 'known' &&
        finite(properties.massKg) &&
        properties.massKg > 0 &&
        point(properties.localCoM) &&
        evidence(properties.evidence))
    ))
      return fail()
    attachmentIds.add(item.id)
  }
  const result = freeze(r) as unknown as WalkingQuasiStaticRequest
  admitted.set(result, motion.identity)
  return result
}
