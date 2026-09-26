import {
  admitDispatch,
  prepareMission,
  DispatchAdmissionError,
  type CanonicalMission,
  type DispatchEvidence,
  type MovementProvider,
  type MovementRequest,
  type PreparedMission,
  type SourceOwners
} from './contracts'
import {
  REST_JOINTS,
  transformRobotPoint,
  type RigidTransform,
  type RobotJoints
} from '../domain/robot-kinematics'
import type { Point3 } from '../domain/greenhouse'

export interface ResumeEvidence {
  readonly id: string
  readonly source: 'synthetic'
  readonly runId: string
  readonly generation: number
  readonly missionRevision: number
  readonly sceneRevision: number
  readonly robotRevision: number
  readonly observedAt: number
  readonly validFrom: number
  readonly validUntil: number
}
export interface RunSnapshot {
  readonly id: string
  readonly startedAt: number
  readonly activeSeconds: number
  readonly operation: 'travel'
  readonly checkpoint: number
  readonly pose: {
    readonly base: Point3
    readonly joints: Readonly<RobotJoints>
    readonly tool: {
      readonly position: Point3
      readonly closing: Point3
      readonly approach: Point3
      readonly up: Point3
    }
  }
  readonly held: readonly {
    readonly targetId: string
    readonly fruitToTool: RigidTransform
  }[]
  readonly remaining: MovementRequest
  readonly clearanceUntil: number
}
type Lifecycle =
  | 'idle'
  | 'running'
  | 'paused'
  | 'faulted'
  | 'cancelled'
  | 'invalidated'
  | 'closed'
export interface Transition {
  readonly sequence: number
  readonly time: number
  readonly event: string
  readonly runId: string | null
  readonly previous: Transition | null
}
export interface SessionSnapshot {
  readonly revision: number
  readonly generation: number
  readonly now: number
  readonly lifecycle: Lifecycle
  readonly run: RunSnapshot | null
  readonly pendingPatrol: boolean
  readonly nextDeadline: number | null
  readonly reasons: readonly string[]
  readonly transition: Transition | null
}
export interface ResumeRequest {
  readonly snapshot: SessionSnapshot
  readonly run: RunSnapshot
  readonly mission: PreparedMission
  readonly now: number
  readonly evidence: ResumeEvidence
}
export interface ResumeDecision {
  readonly request: ResumeRequest
  readonly status: 'accepted' | 'held' | 'fault'
  readonly validFrom: number
  readonly validUntil: number
  readonly reasons: readonly string[]
}
interface Providers {
  dispatch: MovementProvider
  resume(request: ResumeRequest): Promise<ResumeDecision>
}
const finiteTime = (value: number) => Number.isFinite(value) && value >= 0
function fail(reason: string): never {
  throw new DispatchAdmissionError(reason)
}

/** Explicit domain clock. It holds no Core transaction or browser timer. */
export class HarvestSession {
  private mission: PreparedMission
  private runCounter = 0
  private resumeRequest?: ResumeRequest
  private state: SessionSnapshot = Object.freeze({
    revision: 0,
    generation: 1,
    now: 0,
    lifecycle: 'idle',
    run: null,
    pendingPatrol: false,
    nextDeadline: null,
    reasons: Object.freeze([]),
    transition: null
  })
  constructor(
    receipt: CanonicalMission,
    private readonly owners: SourceOwners,
    private readonly providers: Providers
  ) {
    if (
      typeof providers?.dispatch !== 'function' ||
      typeof providers?.resume !== 'function'
    )
      fail('Missing session admission provider')
    this.mission = prepareMission(receipt, owners)
  }
  getSnapshot(): SessionSnapshot {
    return this.state
  }
  private current() {
    const { receipt, scene, robot } = this.mission
    return (
      this.owners.isCurrentMission(receipt) &&
      this.owners.isCurrentScene(scene) &&
      this.owners.isCurrentRobot(robot)
    )
  }
  private publish(patch: Partial<SessionSnapshot>, event: string) {
    const revision = this.state.revision + 1
    if (!Number.isSafeInteger(revision))
      fail('Session revision exceeds finite range')
    const next = { ...this.state, ...patch, revision }
    this.state = Object.freeze({
      ...next,
      reasons: Object.freeze([...next.reasons]),
      transition: Object.freeze({
        sequence: revision,
        time: next.now,
        event,
        runId: next.run?.id ?? null,
        previous: this.state.transition
      })
    })
  }
  private retire(
    lifecycle: 'cancelled' | 'invalidated' | 'closed',
    reason: string
  ) {
    this.resumeRequest = undefined
    this.publish(
      {
        lifecycle,
        generation: this.state.generation + 1,
        pendingPatrol: false,
        nextDeadline: null,
        reasons: [reason]
      },
      lifecycle
    )
  }
  private check(generation: number) {
    if (this.state.lifecycle === 'closed') fail('Session is closed')
    if (generation !== this.state.generation) fail('Retired session generation')
    if (!this.current()) {
      this.retire('invalidated', 'canonical-source-changed')
      fail('Retired canonical source')
    }
  }
  start(generation: number, evidence: DispatchEvidence): boolean {
    this.check(generation)
    if (['running', 'paused', 'faulted'].includes(this.state.lifecycle))
      fail('Run already active')
    const before = this.state
    const period = this.mission.report.settings.patrolMinutes * 60
    const deadline = before.now + period
    if (
      !Number.isFinite(period) ||
      !Number.isFinite(deadline) ||
      deadline <= before.now
    )
      fail('Patrol deadline exceeds finite range')
    const result = admitDispatch(
      this.mission,
      evidence,
      before.now,
      this.owners,
      this.providers.dispatch
    )
    if (this.state !== before) return false
    if (!result.accepted) {
      this.publish({ reasons: result.reasons }, 'start-held')
      return false
    }
    const rig = this.mission.robot.rig
    if (!rig) return fail('Missing admitted rig')
    const settings = this.mission.report.settings
    const base: Point3 = Object.freeze([
      settings.dockX,
      0,
      settings.dockZ
    ] as const)
    const run: RunSnapshot = Object.freeze({
      id: `run-${this.mission.revision}-${++this.runCounter}`,
      startedAt: before.now,
      activeSeconds: 0,
      operation: 'travel',
      checkpoint: 0,
      pose: Object.freeze({
        base,
        joints: REST_JOINTS,
        tool: Object.freeze({
          ...rig.tool,
          position: transformRobotPoint(
            { position: base, rotation: [0, 0, 0, 1] },
            rig.tool.position
          )
        })
      }),
      held: Object.freeze([]),
      remaining: result.movements[0].request,
      clearanceUntil: Math.min(
        result.evidence.validUntil,
        result.movements[0].request.interval.until
      )
    })
    this.publish(
      {
        lifecycle: 'running',
        generation: generation + 1,
        run,
        nextDeadline: deadline,
        pendingPatrol: false,
        reasons: []
      },
      'start'
    )
    return true
  }
  advance(generation: number, now: number) {
    if (!finiteTime(now) || now < this.state.now)
      fail('Invalid simulation clock')
    this.check(generation)
    if (now === this.state.now) return
    let nextDeadline = this.state.nextDeadline
    let pendingPatrol = this.state.pendingPatrol
    if (nextDeadline !== null && now >= nextDeadline) {
      const period = this.mission.report.settings.patrolMinutes * 60
      nextDeadline += (Math.floor((now - nextDeadline) / period) + 1) * period
      if (!Number.isFinite(nextDeadline) || nextDeadline <= now)
        fail('Patrol deadline exceeds finite range')
      pendingPatrol = true
    }
    const previousRun = this.state.run
    const run =
      previousRun && this.state.lifecycle === 'running'
        ? Object.freeze({
            ...previousRun,
            activeSeconds: previousRun.activeSeconds + (now - this.state.now)
          })
        : previousRun
    const reasons = [...this.state.reasons]
    if (
      run &&
      ['running', 'paused'].includes(this.state.lifecycle) &&
      now >= run.clearanceUntil &&
      !reasons.includes('movement-query-expired')
    )
      reasons.push('movement-query-expired')
    this.publish({ now, nextDeadline, pendingPatrol, run, reasons }, 'clock')
  }
  pause(generation: number) {
    this.check(generation)
    if (this.state.lifecycle !== 'running')
      fail('Only a running session can pause')
    this.publish({ lifecycle: 'paused' }, 'pause')
  }
  async resume(generation: number, input: ResumeEvidence): Promise<boolean> {
    this.check(generation)
    const snapshot = this.state,
      run = snapshot.run
    if (snapshot.lifecycle !== 'paused' || !run || this.resumeRequest)
      fail('Session is not available for resume')
    if (
      !input ||
      typeof input.id !== 'string' ||
      !input.id.trim() ||
      input.source !== 'synthetic' ||
      input.runId !== run.id ||
      input.generation !== generation ||
      input.missionRevision !== this.mission.revision ||
      input.sceneRevision !== this.mission.scene.revision ||
      input.robotRevision !== this.mission.robot.revision ||
      ![input.observedAt, input.validFrom, input.validUntil].every(
        finiteTime
      ) ||
      input.validFrom > input.observedAt ||
      input.observedAt > snapshot.now ||
      snapshot.now >= input.validUntil
    )
      fail('Invalid or expired run-bound resume evidence')
    const evidence = Object.freeze(structuredClone(input))
    const request: ResumeRequest = Object.freeze({
      snapshot,
      run,
      mission: this.mission,
      now: snapshot.now,
      evidence
    })
    this.resumeRequest = request
    try {
      const result = await this.providers.resume(request)
      if (
        this.state !== snapshot ||
        this.resumeRequest !== request ||
        !this.current()
      )
        return false
      if (
        !result ||
        result.request !== request ||
        !['accepted', 'held', 'fault'].includes(result.status) ||
        ![result.validFrom, result.validUntil].every(finiteTime) ||
        result.validFrom > snapshot.now ||
        result.validUntil <= snapshot.now ||
        result.validUntil > evidence.validUntil ||
        !Array.isArray(result.reasons) ||
        result.reasons.some((reason) => typeof reason !== 'string') ||
        (result.status === 'accepted' && result.reasons.length)
      ) {
        this.publish(
          { reasons: ['resume-admission-unresolved'] },
          'resume-held'
        )
        return false
      }
      if (result.status !== 'accepted') {
        this.publish(
          {
            lifecycle: result.status === 'fault' ? 'faulted' : 'paused',
            reasons: result.reasons
          },
          result.status === 'fault' ? 'fault' : 'resume-held'
        )
        return false
      }
      this.publish(
        {
          lifecycle: 'running',
          run: Object.freeze({ ...run, clearanceUntil: result.validUntil }),
          reasons: []
        },
        'resume'
      )
      return true
    } finally {
      // Snapshot staleness blocks result acceptance. Source retirement is a
      // separate same-generation lifecycle obligation, even on provider failure.
      if (this.state.generation === snapshot.generation && !this.current())
        this.retire('invalidated', 'canonical-source-changed')
      if (this.resumeRequest === request) this.resumeRequest = undefined
    }
  }
  acknowledgeFault(generation: number) {
    this.check(generation)
    if (this.state.lifecycle !== 'faulted') fail('No fault to acknowledge')
    this.publish({ lifecycle: 'paused' }, 'acknowledge')
  }
  cancel(generation: number) {
    this.check(generation)
    this.retire('cancelled', 'cancelled')
  }
  /** Synchronous composition lifecycle notification, never an external queued intent. */
  replaceMission(receipt: CanonicalMission) {
    if (this.state.lifecycle === 'closed') fail('Session is closed')
    if (receipt === this.mission.receipt) {
      if (!this.current()) fail('Retired canonical source')
      return
    }
    const successor = prepareMission(receipt, this.owners)
    this.retire('invalidated', 'canonical-source-changed')
    this.mission = successor
    this.publish({ lifecycle: 'idle', run: null, reasons: [] }, 'replace')
  }
  dispose() {
    if (this.state.lifecycle !== 'closed') this.retire('closed', 'disposed')
  }
}
