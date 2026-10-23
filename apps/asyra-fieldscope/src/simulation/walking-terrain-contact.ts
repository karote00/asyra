import type {
  WalkingContactAssessment,
  WalkingMotionRequest,
  WalkingStancePhase,
  WalkingTerrainRegion
} from '../domain/walking-motion-contract'
import type {
  WalkingPatchReference,
  WalkingRobotSource
} from '../domain/walking-robot-source'
import type { SceneDemand } from './scene-demand'

export interface WalkingTerrainContact {
  readonly chainId: string
  readonly patchReference: WalkingPatchReference
  readonly terrainRegion: WalkingTerrainRegion
  readonly assessment: WalkingContactAssessment
  readonly terrainRegionId: string
  readonly pathId: string
  readonly loadCaseId: string
  readonly from: number
  readonly until: number
  readonly status: 'admitted' | 'blocked' | 'unknown'
}

export interface WalkingTerrainContactResult {
  readonly status: 'clear' | 'blocked' | 'unknown'
  readonly reasons: readonly string[]
  readonly contacts: readonly WalkingTerrainContact[]
  readonly work: Readonly<{ phases: number; supportContacts: number }>
}

const addReason = (reasons: string[], reason: string) => {
  if (!reasons.includes(reason)) reasons.push(reason)
}
const hasUnknownRelation = (assessment: WalkingContactAssessment) =>
  [
    assessment.geometry,
    assessment.friction,
    assessment.bearing,
    assessment.sinkage
  ].some((relation) => 'kind' in relation && relation.kind === 'unknown')
const hasBlockedRelation = (assessment: WalkingContactAssessment) =>
  [
    assessment.geometry,
    assessment.friction,
    assessment.bearing,
    assessment.sinkage
  ].some((relation) => 'status' in relation && relation.status === 'blocked')

function contactStatus(
  demand: SceneDemand,
  request: WalkingMotionRequest,
  region: WalkingTerrainRegion,
  assessment: WalkingContactAssessment,
  reasons: string[]
) {
  if (region.classification === 'channel') {
    const binding = region.binding
    if (
      binding.kind === 'scene-channel' &&
      demand.channels.some(
        ({ bay, stripId }) => bay === binding.bay && stripId === binding.stripId
      )
    ) {
      addReason(reasons, 'support-on-authored-channel')
      return 'blocked' as const
    }
    addReason(reasons, 'terrain-channel-authority-mismatch')
    return 'unknown' as const
  }
  if (
    region.classification !== 'soil' ||
    region.binding.kind !== 'route-soil' ||
    !demand.route ||
    region.binding.bay !== demand.route.bay ||
    region.binding.stripId !== demand.route.stripId
  ) {
    addReason(reasons, 'support-region-not-admitted-soil')
    return 'unknown' as const
  }
  if (assessment.coverage !== 'complete') {
    addReason(reasons, 'contact-evidence-incomplete')
    return 'unknown' as const
  }
  if (hasBlockedRelation(assessment)) {
    addReason(reasons, 'contact-assessment-blocked')
    return 'blocked' as const
  }
  if (hasUnknownRelation(assessment)) {
    addReason(reasons, 'contact-evidence-incomplete')
    return 'unknown' as const
  }
  if (
    assessment.pathId !== request.path.id ||
    assessment.loadCaseId !== request.load.id
  ) {
    addReason(reasons, 'contact-identity-mismatch')
    return 'unknown' as const
  }
  return 'admitted' as const
}

function supportContact(
  demand: SceneDemand,
  source: WalkingRobotSource,
  request: WalkingMotionRequest,
  phase: WalkingStancePhase,
  chainId: string,
  assessmentId: string,
  reasons: string[]
): WalkingTerrainContact | null {
  const chain = source.rig.legChains.find(({ id }) => id === chainId),
    patchReference = source.rig.contacts.feet.find(
      ({ part }) => part.bodyId === chain?.footBodyId
    ),
    assessment = request.terrain.contactAssessments.find(
      ({ id }) => id === assessmentId
    ),
    region = request.terrain.regions.find(
      ({ id }) => id === assessment?.terrainRegionId
    )
  if (
    !chain ||
    !patchReference ||
    !assessment ||
    !region ||
    assessment.footPatchId !== patchReference.patch.id ||
    assessment.from > phase.from ||
    assessment.until < phase.until
  ) {
    addReason(reasons, 'contact-identity-mismatch')
    return null
  }
  return Object.freeze({
    chainId,
    patchReference,
    terrainRegion: region,
    assessment,
    terrainRegionId: region.id,
    pathId: request.path.id,
    loadCaseId: request.load.id,
    from: phase.from,
    until: phase.until,
    status: contactStatus(demand, request, region, assessment, reasons)
  })
}

export function evaluateWalkingTerrainContact(
  demand: SceneDemand,
  source: WalkingRobotSource,
  request: WalkingMotionRequest
): WalkingTerrainContactResult {
  const reasons: string[] = [],
    contacts: WalkingTerrainContact[] = []
  if (request.terrain.sceneRevision !== demand.scene.revision)
    addReason(reasons, 'terrain-scene-mismatch')
  if (
    !demand.route ||
    request.terrain.route.bay !== demand.route.bay ||
    request.terrain.route.stripId !== demand.route.stripId
  )
    addReason(reasons, 'terrain-route-mismatch')
  for (const [name, observation] of Object.entries(
    request.terrain.observations
  ))
    if ('kind' in observation || observation.coverage !== 'complete')
      addReason(reasons, `terrain-${name}-coverage-incomplete`)
  for (const phase of request.stance.phases) {
    if (phase.legs.every(({ state }) => state.kind === 'swing'))
      addReason(reasons, 'stance-contact-evidence-missing')
    for (const leg of phase.legs) {
      if (leg.state.kind !== 'support') continue
      const contact = supportContact(
        demand,
        source,
        request,
        phase,
        leg.chainId,
        leg.state.contactAssessmentId,
        reasons
      )
      if (contact) contacts.push(contact)
    }
  }
  const incompatible = reasons.some((reason) =>
    [
      'terrain-scene-mismatch',
      'terrain-route-mismatch',
      'terrain-channel-authority-mismatch'
    ].includes(reason)
  )
  let status: 'clear' | 'blocked' | 'unknown' = 'clear'
  if (
    incompatible ||
    reasons.length > 0 ||
    contacts.some(({ status: value }) => value === 'unknown')
  )
    status = 'unknown'
  if (
    !incompatible &&
    contacts.some(({ status: value }) => value === 'blocked')
  )
    status = 'blocked'
  return Object.freeze({
    status,
    reasons: Object.freeze(reasons),
    contacts: Object.freeze(contacts),
    work: Object.freeze({
      phases: request.stance.phases.length,
      supportContacts: contacts.length
    })
  })
}
