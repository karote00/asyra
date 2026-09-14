import { interval } from '../domain/scalar-arithmetic'
import type { Interval } from '../domain/scalar-arithmetic'
import {
  readWalkingQuasiStaticRequest,
  type WalkingQuasiStaticRequest
} from '../domain/walking-quasi-static-contract'
import {
  evaluateWalkingRobotPose,
  type WalkingRobotPoseResult
} from '../domain/walking-robot-kinematics'
import type { WalkingMotionAdmission } from './walking-motion'
import { walkingMotionPoseAt } from './walking-motion-interval'
import {
  mechanicsVector,
  mechanicsTransform,
  mechanicsCentreOfMass,
  mechanicsSupport,
  mechanicsHull,
  mechanicsTorque,
  mechanicsAdd,
  mechanicsMagnitude,
  type MechanicsVector,
  type MechanicsPlanePoint
} from './walking-quasi-static-arithmetic'

type Unknown = Readonly<{ kind: 'unknown' }>
type Centre =
  | Unknown
  | Readonly<{ kind: 'known'; totalMass: Interval; worldCoM: MechanicsVector }>
type Known<T> = Unknown | Readonly<{ kind: 'known'; value: T }>
interface MassEntry {
  readonly bodyId: string
  readonly loadId?: string
  readonly properties:
    | Unknown
    | Readonly<{ kind: 'known'; massKg: number; position: MechanicsVector }>
}
interface ArmMoment {
  readonly bodyIds: readonly string[]
  readonly loadIds: readonly string[]
  readonly kind: 'known' | 'unknown'
  readonly vector?: MechanicsVector
  readonly magnitude?: Interval
}
export interface WalkingQuasiStaticWork {
  readonly fk: number
  readonly bodyMassVisits: number
  readonly externalMassVisits: number
  readonly contactVisits: number
  readonly hullPreparations: number
  readonly momentMassVisits: number
}
type Support = ReturnType<typeof mechanicsSupport>
export interface WalkingQuasiStaticAssessment {
  readonly identity: Readonly<object>
  readonly revision: number
  readonly status: 'screened' | 'blocked' | 'unknown'
  readonly reasons: readonly string[]
  readonly motion: WalkingMotionAdmission
  readonly pose: WalkingRobotPoseResult
  readonly configuration: WalkingQuasiStaticRequest['configuration']
  readonly time: number
  readonly phase: WalkingQuasiStaticRequest['phase']
  readonly support: WalkingQuasiStaticRequest['support']
  readonly loadMasses: WalkingQuasiStaticRequest['loadMasses']
  readonly centreOfMass: Centre
  readonly supportPolygon: Known<
    readonly Readonly<{
      coordinates: MechanicsPlanePoint
      contacts: readonly WalkingQuasiStaticRequest['support']['contacts'][number][]
    }>[]
  >
  readonly projection: Known<Support['projection']>
  readonly supportMarginMetres: Known<Interval>
  readonly overturningEdges: Known<Support['edges']>
  readonly minimumMomentNm: Known<Interval>
  readonly armMoments: readonly Readonly<{
    chainId: string
    root: ArmMoment
    shoulder: ArmMoment
  }>[]
  readonly work: WalkingQuasiStaticWork
}
const unknown = (): Unknown => ({ kind: 'unknown' })
const known = <T>(value: T): Known<T> => ({ kind: 'known', value })
const finiteInterval = (value: Interval) =>
  Number.isFinite(value.low) && Number.isFinite(value.high)
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
function required<T>(value: T | undefined): T {
  if (value === undefined)
    throw Error('Walking mechanics source identity is incomplete')
  return value
}
const emptyWork = () => ({
  fk: 0,
  bodyMassVisits: 0,
  externalMassVisits: 0,
  contactVisits: 0,
  hullPreparations: 0,
  momentMassVisits: 0
})

/** Owns gravity-only arithmetic for one completed W2 pose bound to current W3. */
export class WalkingQuasiStaticOwner {
  private current: WalkingQuasiStaticAssessment | undefined
  private lastRequest: WalkingQuasiStaticRequest | undefined
  private revision = 0
  private totals = { preparations: 0, ...emptyWork() }
  constructor(
    private readonly dependencies: {
      readonly getCurrentWalkingMotion: () => WalkingMotionAdmission | undefined
    }
  ) {}
  get work() {
    return Object.freeze({ ...this.totals })
  }
  isCurrent(result: WalkingQuasiStaticAssessment) {
    return (
      result === this.current &&
      result.motion === this.dependencies.getCurrentWalkingMotion()
    )
  }
  read() {
    return this.current && this.isCurrent(this.current)
      ? this.current
      : undefined
  }
  clear() {
    this.current = undefined
    this.lastRequest = undefined
  }
  prepare(raw: unknown): WalkingQuasiStaticAssessment {
    const motion = this.dependencies.getCurrentWalkingMotion()
    if (!motion) throw Error('Walking motion owner is unavailable')
    const request = readWalkingQuasiStaticRequest(raw, motion)
    if (request === this.lastRequest && this.current?.motion === motion)
      return this.current
    const work = emptyWork(),
      reasons: string[] = [],
      source = motion.source,
      pose = evaluateWalkingRobotPose(
        source,
        walkingMotionPoseAt(motion.path, request.time)
      )
    work.fk++
    const frames = new Map(pose.bodyTransforms.map((b) => [b.id, b.transform])),
      entries: MassEntry[] = []
    const bodyFrame = (id: string) => required(frames.get(id))
    for (const mass of source.massProperties.bodies) {
      entries.push({
        bodyId: mass.bodyId,
        properties: {
          kind: 'known',
          massKg: mass.massKg,
          position: mechanicsTransform(
            bodyFrame(mass.bodyId),
            mechanicsVector(mass.localCoM)
          )
        }
      })
      work.bodyMassVisits++
    }
    const crate = request.loadMasses.crate
    entries.push({
      bodyId: 'base',
      loadId: 'crate',
      properties:
        crate.kind === 'known'
          ? {
              kind: 'known',
              massKg: crate.massKg,
              position: mechanicsTransform(
                bodyFrame('base'),
                mechanicsVector(crate.holderLocalCoM)
              )
            }
          : unknown()
    })
    work.externalMassVisits++
    const carried =
      motion.load.carried.kind === 'attached' ? motion.load.carried.items : []
    for (const load of request.loadMasses.carried) {
      const attachment = required(
          carried.find((item) => item.id === load.attachmentId)
        ),
        properties = load.properties
      entries.push({
        bodyId: attachment.holderBodyId,
        loadId: attachment.id,
        properties:
          properties.kind === 'known'
            ? {
                kind: 'known',
                massKg: properties.massKg,
                position: mechanicsTransform(
                  bodyFrame(attachment.holderBodyId),
                  mechanicsTransform(
                    attachment.localFrame,
                    mechanicsVector(properties.localCoM)
                  )
                )
              }
            : unknown()
      })
      work.externalMassVisits++
    }
    const completeMasses = entries.every(
      (entry) => entry.properties.kind === 'known'
    )
    let centreOfMass: Centre = completeMasses
      ? {
          kind: 'known',
          ...mechanicsCentreOfMass(
            entries.flatMap((entry) =>
              entry.properties.kind === 'known' ? [entry.properties] : []
            )
          )
        }
      : unknown()
    if (
      centreOfMass.kind === 'known' &&
      (!finiteInterval(centreOfMass.totalMass) ||
        !centreOfMass.worldCoM.every(finiteInterval))
    )
      centreOfMass = unknown()
    if (centreOfMass.kind === 'unknown')
      reasons.push('mass-or-centre-of-mass-unknown')
    const parent = new Map(
      source.rig.bodies.map((body) => [body.id, body.parentBodyId])
    )
    const descendant = (bodyId: string, rootId: string) => {
      let id: string | null | undefined = bodyId
      while (id) {
        if (id === rootId) return true
        id = parent.get(id)
      }
      return false
    }
    const moment = (jointId: string): ArmMoment => {
      const joint = required(
          source.rig.joints.find((item) => item.id === jointId)
        ),
        frame = bodyFrame(joint.parentBodyId),
        pivot = mechanicsTransform(
          frame,
          mechanicsVector(joint.frame.position)
        ),
        members = entries.filter((entry) =>
          descendant(entry.bodyId, joint.childBodyId)
        ),
        bodyIds = members
          .filter((entry) => entry.loadId === undefined)
          .map((entry) => entry.bodyId),
        loadIds = members.flatMap((entry) =>
          entry.loadId === undefined ? [] : [entry.loadId]
        )
      work.momentMassVisits += members.length
      if (members.some((entry) => entry.properties.kind === 'unknown'))
        return { kind: 'unknown', bodyIds, loadIds }
      let vector = mechanicsVector([0, 0, 0])
      for (const member of members)
        if (member.properties.kind === 'known')
          vector = mechanicsAdd(
            vector,
            mechanicsTorque(
              pivot,
              member.properties.position,
              interval(member.properties.massKg)
            ).vector
          )
      const magnitude = mechanicsMagnitude(vector)
      if (!vector.every(finiteInterval) || !finiteInterval(magnitude))
        return { kind: 'unknown', bodyIds, loadIds }
      return {
        kind: 'known',
        bodyIds,
        loadIds,
        vector,
        magnitude
      }
    }
    const armMoments = source.rig.armChains.map((chain) => ({
      chainId: chain.id,
      root: moment(required(chain.jointIds[0])),
      shoulder: moment(required(chain.jointIds[1]))
    }))
    if (
      armMoments.some(
        (arm) => arm.root.kind === 'unknown' || arm.shoulder.kind === 'unknown'
      )
    )
      reasons.push('arm-moment-unknown')
    const points: MechanicsPlanePoint[] = []
    let contactsComplete = request.support.contacts.length > 0
    for (const contact of request.support.contacts) {
      work.contactVisits++
      const bound = motion.contacts.find(
        (item) =>
          item.chainId === contact.chainId &&
          item.assessment.id === contact.contactAssessmentId &&
          item.from === request.phase.from &&
          item.until === request.phase.until
      )
      if (
        !bound ||
        bound.status !== 'admitted' ||
        bound.assessment.coverage !== 'complete' ||
        contact.position.kind === 'unknown'
      )
        contactsComplete = false
      if (contact.position.kind === 'plane-point')
        points.push(contact.position.coordinates)
    }
    if (!contactsComplete) reasons.push('support-contact-evidence-unknown')
    const slope = motion.terrain.observations.slope
    if ('kind' in slope || slope.coverage !== 'complete')
      reasons.push('slope-evidence-unknown')
    const plane = request.support.plane,
      reserve = request.support.lineOfActionReserve
    if (plane.kind === 'unknown') reasons.push('support-plane-unknown')
    if (reserve.kind === 'unknown')
      reasons.push('line-of-action-reserve-unknown')
    let supportResult: Support | undefined
    let hull: readonly MechanicsPlanePoint[] | undefined
    if (contactsComplete) {
      work.hullPreparations++
      if (centreOfMass.kind === 'known' && plane.kind === 'declared') {
        supportResult = mechanicsSupport(
          centreOfMass.worldCoM,
          centreOfMass.totalMass,
          plane.frame,
          points,
          reserve.kind === 'bounded' ? reserve.metres : undefined
        )
        hull = supportResult.hull
      } else hull = mechanicsHull(points)
    }
    const supportPolygon = hull
      ? known(
          hull.map((coordinates) => ({
            coordinates,
            contacts: request.support.contacts.filter(
              (contact) =>
                contact.position.kind === 'plane-point' &&
                contact.position.coordinates[0] === coordinates[0] &&
                contact.position.coordinates[1] === coordinates[1]
            )
          }))
        )
      : unknown()
    const status =
      reasons.length === 0 && supportResult ? supportResult.status : 'unknown'
    if (supportResult?.status === 'unknown')
      reasons.push('support-sign-unresolved')
    if (supportResult?.status === 'blocked')
      reasons.push('support-or-overturning-blocked')
    const result: WalkingQuasiStaticAssessment = freeze({
      identity: {},
      revision: ++this.revision,
      status,
      reasons,
      motion,
      pose,
      configuration: request.configuration,
      time: request.time,
      phase: request.phase,
      support: request.support,
      loadMasses: request.loadMasses,
      centreOfMass,
      supportPolygon,
      projection:
        supportResult && supportResult.projection.every(finiteInterval)
          ? known(supportResult.projection)
          : unknown(),
      supportMarginMetres:
        supportResult && finiteInterval(supportResult.supportMarginMetres)
          ? known(supportResult.supportMarginMetres)
          : unknown(),
      overturningEdges:
        supportResult &&
        supportResult.edges.every((edge) => finiteInterval(edge.momentNm))
          ? known(supportResult.edges)
          : unknown(),
      minimumMomentNm:
        supportResult && finiteInterval(supportResult.minimumMomentNm)
          ? known(supportResult.minimumMomentNm)
          : unknown(),
      armMoments,
      work
    })
    this.current = result
    this.lastRequest = request
    this.totals.preparations++
    for (const key of Object.keys(work) as (keyof WalkingQuasiStaticWork)[])
      this.totals[key] += work[key]
    return result
  }
}
