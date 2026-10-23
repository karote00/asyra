import { beforeAll, expect, it, vi } from 'vitest'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { RobotProjection } from '../../render-app/robot-projection'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import {
  DEFAULT_ROBOT,
  assessRobotDesign,
  validateRobot
} from '../../domain/robot-configuration'
import * as crops from '../../domain/crop-models'
import * as models from '../../domain/robot-model'
import * as lanes from '../../domain/harvest-assessment'
import type {
  CanonicalMission,
  DispatchEvidence,
  MovementRequest,
  MovementResult
} from '../contracts'
import type { ResumeRequest, ResumeDecision, ResumeEvidence } from '../session'

const geometry = new SiteGeometry(),
  projection = new RobotProjection()
const farm = { ...DEFAULT_CONFIGURATION, length: 2.2 }
const report = assessRobotDesign(
  validateRobot({ ...DEFAULT_ROBOT, end: 1.7, patrolMinutes: 1 }),
  farm
)
let receipt: CanonicalMission
beforeAll(() => {
  const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
  projection.update(report)
  receipt = Object.freeze({
    revision: 1,
    report,
    farm,
    scene,
    robot: projection.getSource()
  })
})
const dispatchEvidence = (): DispatchEvidence => ({
  id: 'dispatch',
  source: 'synthetic',
  missionRevision: 1,
  sceneRevision: receipt.scene.revision,
  robotRevision: receipt.robot.revision,
  observedAt: 0,
  validFrom: 0,
  validUntil: 1000,
  survey: {
    ground: 'prepared',
    entranceWidth: 2,
    entranceHeight: 3,
    frontHeadland: 2,
    rearHeadland: 2
  },
  battery: { soc: 0.8, socUncertainty: 0.05 },
  dock: 'available',
  stowed: true,
  crate: {
    id: 'crate-1',
    cultivar: 'cucumber',
    tareKg: 1,
    load: {
      baseMass: 30,
      payload: 0,
      nextFruit: 0,
      payloadLimit: 8,
      fill: 0,
      returnFill: 0.8,
      latched: true,
      scaleTrusted: true,
      track: 0.4,
      baseHeight: 0.25,
      payloadHeight: 0.5,
      baseOffset: 0,
      payloadOffset: 0,
      roll: 0,
      lateralAcceleration: 0,
      uncertainty: 0.01
    }
  },
  intervals: {
    dispatch: { from: 0, until: 10 },
    return: { from: 10, until: 20 }
  }
})
const clear = (requests: readonly MovementRequest[]): MovementResult[] =>
  requests.map((request) => ({
    request,
    status: 'clear',
    coverage: 'complete',
    reasons: []
  }))
const resumeClear = async (
  request: ResumeRequest
): Promise<ResumeDecision> => ({
  request,
  status: 'accepted',
  validFrom: request.now,
  validUntil: request.evidence.validUntil,
  reasons: []
})
async function setup(resume = resumeClear) {
  const { HarvestSession } = await import('../session')
  let current = true
  let canonical = receipt
  const owners = {
    isCurrentMission: (value: CanonicalMission) =>
      current && value === canonical,
    isCurrentScene: geometry.isCurrentScene.bind(geometry),
    isCurrentRobot: projection.isCurrentSource.bind(projection)
  }
  const query = vi.fn(clear)
  const resumeProvider = vi.fn(resume)
  const session = new HarvestSession(receipt, owners, {
    dispatch: query,
    resume: resumeProvider
  })
  return {
    session,
    query,
    resumeProvider,
    retire: () => {
      current = false
    },
    replace: (value: CanonicalMission) => {
      canonical = value
      session.replaceMission(value)
    }
  }
}
const resumeEvidence = (request: {
  runId: string
  generation: number
  now: number
}): ResumeEvidence => ({
  id: 'resume',
  source: 'synthetic',
  runId: request.runId,
  generation: request.generation,
  missionRevision: 1,
  sceneRevision: receipt.scene.revision,
  robotRevision: receipt.robot.revision,
  observedAt: request.now,
  validFrom: request.now,
  validUntil: request.now + 50
})

it('starts only through internal admission and never overlaps or consumes a borrowed result', async () => {
  const { session, query } = await setup()
  const initial = session.getSnapshot()
  expect(() =>
    session.start(initial.generation, {
      accepted: true
    } as unknown as DispatchEvidence)
  ).toThrow()
  expect(session.getSnapshot() === initial).toBe(true)
  session.start(initial.generation, dispatchEvidence())
  const started = session.getSnapshot()
  expect(started.lifecycle).toBe('running')
  expect(started.run?.pose.base).toEqual([
    report.settings.dockX,
    0,
    report.settings.dockZ
  ])
  expect(query).toHaveBeenCalledTimes(1)
  expect(() => session.start(started.generation, dispatchEvidence())).toThrow()
  expect(session.getSnapshot() === started).toBe(true)
})

it('coalesces exact crossed deadlines while pause excludes elapsed motion time', async () => {
  const { session, resumeProvider } = await setup()
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const generation = session.getSnapshot().generation
  session.advance(generation, 10)
  session.pause(generation)
  const paused = session.getSnapshot()
  session.advance(generation, 130)
  const later = session.getSnapshot()
  expect(later.pendingPatrol).toBe(true)
  expect(later.nextDeadline).toBe(180)
  expect(later.run?.activeSeconds).toBe(10)
  expect(later.run?.pose).toBe(paused.run?.pose)
  if (!later.run) throw new Error('Missing run')
  const input = resumeEvidence({
    runId: later.run.id,
    generation,
    now: later.now
  })
  await session.resume(generation, input)
  expect(resumeProvider).toHaveBeenCalledTimes(1)
  const request = resumeProvider.mock.calls[0][0]
  expect(request.snapshot).toBe(later)
  expect(request.run.pose).toBe(later.run.pose)
  expect(request.run.held).toBe(later.run.held)
  expect(request.run.remaining).toBe(later.run.remaining)
  expect(session.getSnapshot().run?.id).toBe(later.run.id)
  expect(session.getSnapshot().run?.pose).toBe(later.run.pose)
  session.advance(generation, 131)
  expect(session.getSnapshot().run?.activeSeconds).toBe(11)
  expect(session.getSnapshot().pendingPatrol).toBe(true)
})

it('rejects invalid clocks and closes queued generations on cancel, replace and disposal', async () => {
  const { session, replace } = await setup()
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const generation = session.getSnapshot().generation
  session.advance(generation, 1)
  const state = session.getSnapshot()
  for (const time of [0, -1, NaN, Infinity]) {
    expect(() => session.advance(generation, time)).toThrow()
    expect(session.getSnapshot() === state).toBe(true)
  }
  session.cancel(generation)
  expect(session.getSnapshot().lifecycle).toBe('cancelled')
  expect(session.getSnapshot().pendingPatrol).toBe(false)
  expect(() => session.advance(generation, 2)).toThrow()
  const cancelledGeneration = session.getSnapshot().generation
  replace(Object.freeze({ ...receipt, revision: 2 }))
  expect(() => session.pause(cancelledGeneration)).toThrow()
  expect(session.getSnapshot().lifecycle).toBe('idle')
  session.dispose()
  expect(() => session.advance(session.getSnapshot().generation, 3)).toThrow()
  session.dispose()
})

it('does no A, geometry or accumulated transition work during reads or clock changes', async () => {
  const { session } = await setup()
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const crop = vi.spyOn(crops, 'createCropModels'),
    robot = vi.spyOn(models, 'createRobotModel'),
    lane = vi.spyOn(lanes, 'assessHarvestLane')
  try {
    const initial = session.getSnapshot()
    for (let i = 0; i < 10; i++)
      expect(session.getSnapshot() === initial).toBe(true)
    session.advance(initial.generation, 60)
    const next = session.getSnapshot()
    expect(next.pendingPatrol).toBe(true)
    expect(next.transition?.previous).toBe(initial.transition)
    expect(Object.isFrozen(next)).toBe(true)
    expect(Object.isFrozen(next.run)).toBe(true)
    expect(crop).not.toHaveBeenCalled()
    expect(robot).not.toHaveBeenCalled()
    expect(lane).not.toHaveBeenCalled()
  } finally {
    crop.mockRestore()
    robot.mockRestore()
    lane.mockRestore()
  }
})

it('rejects wrong or expired resume evidence and keeps held decisions paused', async () => {
  const { session, resumeProvider } = await setup(async (request) => ({
    ...(await resumeClear(request)),
    status: 'held',
    reasons: ['leaf-motion-unknown']
  }))
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const generation = session.getSnapshot().generation
  session.pause(generation)
  const paused = session.getSnapshot()
  if (!paused.run) throw new Error('Missing run')
  const input = resumeEvidence({ runId: paused.run.id, generation, now: 0 })
  for (const patch of [
    { runId: 'old-run' },
    { generation: generation - 1 },
    { validUntil: 0 },
    { source: 'hardware' },
    { sceneRevision: -1 }
  ])
    await expect(
      session.resume(generation, { ...input, ...patch } as ResumeEvidence)
    ).rejects.toThrow()
  expect(resumeProvider).not.toHaveBeenCalled()
  await session.resume(generation, input)
  expect(session.getSnapshot().lifecycle).toBe('paused')
  expect(session.getSnapshot().reasons).toContain('leaf-motion-unknown')
})

it('cannot apply a late accepted Resume after cancel or an intervening clock', async () => {
  for (const change of ['cancel', 'clock'] as const) {
    let finish: ((value: ResumeDecision) => void) | undefined
    let request: ResumeRequest | undefined
    const { session } = await setup((input) => {
      request = input
      return new Promise((resolve) => {
        finish = resolve
      })
    })
    session.start(session.getSnapshot().generation, dispatchEvidence())
    const generation = session.getSnapshot().generation
    session.pause(generation)
    const paused = session.getSnapshot()
    if (!paused.run) throw new Error('Missing run')
    const pending = session.resume(
      generation,
      resumeEvidence({ runId: paused.run.id, generation, now: 0 })
    )
    if (!request || !finish) throw new Error('Missing pending provider')
    if (change === 'cancel') session.cancel(generation)
    else session.advance(generation, 1)
    const changed = session.getSnapshot()
    finish(await resumeClear(request))
    await pending
    expect(session.getSnapshot() === changed).toBe(true)
  }
})

it('requires fault acknowledgement and a fresh explicit Resume without automatic restart', async () => {
  let fault = true
  const { session } = await setup(async (request) => ({
    ...(await resumeClear(request)),
    status: fault ? 'fault' : 'accepted',
    reasons: fault ? ['contact-fault'] : []
  }))
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const generation = session.getSnapshot().generation
  session.pause(generation)
  const paused = session.getSnapshot()
  if (!paused.run) throw new Error('Missing run')
  const input = resumeEvidence({ runId: paused.run.id, generation, now: 0 })
  await session.resume(generation, input)
  expect(session.getSnapshot().lifecycle).toBe('faulted')
  fault = false
  await expect(session.resume(generation, input)).rejects.toThrow()
  session.acknowledgeFault(generation)
  expect(session.getSnapshot().lifecycle).toBe('paused')
  expect(session.getSnapshot().reasons).toContain('contact-fault')
  await session.resume(generation, { ...input, id: 'renewed-resume' })
  expect(session.getSnapshot().lifecycle).toBe('running')
  expect(session.getSnapshot().run?.pose).toBe(paused.run.pose)
})

it.each([false, true])(
  'closes retired sources while Resume is pending after clock change %s',
  async (clockChanged) => {
    let finish: ((value: ResumeDecision) => void) | undefined
    let request: ResumeRequest | undefined
    const { session, retire } = await setup((input) => {
      request = input
      return new Promise((resolve) => {
        finish = resolve
      })
    })
    session.start(session.getSnapshot().generation, dispatchEvidence())
    const generation = session.getSnapshot().generation
    session.pause(generation)
    const run = session.getSnapshot().run
    if (!run) throw new Error('Missing run')
    const pending = session.resume(
      generation,
      resumeEvidence({ runId: run.id, generation, now: 0 })
    )
    if (!request || !finish) throw new Error('Missing pending provider')
    if (clockChanged) session.advance(generation, 1)
    retire()
    finish(await resumeClear(request))
    await pending
    expect(session.getSnapshot().lifecycle).toBe('invalidated')
    expect(session.getSnapshot().generation).not.toBe(generation)
    expect(() => session.advance(generation, 1)).toThrow()
  }
)

it('rejects a forged replacement atomically without closing the valid active generation', async () => {
  const { session } = await setup()
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const before = session.getSnapshot()
  expect(() => session.replaceMission({ ...receipt })).toThrow()
  expect(session.getSnapshot() === before).toBe(true)
})

it('treats repeated current composition receipts as a lifecycle no-op', async () => {
  const { session } = await setup()
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const before = session.getSnapshot()
  session.replaceMission(receipt)
  expect(session.getSnapshot() === before).toBe(true)
})

it('closes retired sources even when the pending provider rejects', async () => {
  let reject: ((reason: Error) => void) | undefined
  const { session, retire } = await setup(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail
      })
  )
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const generation = session.getSnapshot().generation
  session.pause(generation)
  const run = session.getSnapshot().run
  if (!run) throw new Error('Missing run')
  const pending = session.resume(
    generation,
    resumeEvidence({ runId: run.id, generation, now: 0 })
  )
  if (!reject) throw new Error('Missing provider')
  retire()
  reject(new Error('query failed'))
  await expect(pending).rejects.toThrow('query failed')
  expect(session.getSnapshot().lifecycle).toBe('invalidated')
  expect(session.getSnapshot().generation).not.toBe(generation)
})

it('rejects copied or expired provider decisions and detaches caller resume input', async () => {
  for (const mode of ['copied', 'expired', 'extended', 'fresh'] as const) {
    const { session } = await setup(async (request) => {
      const result = await resumeClear(request)
      if (mode === 'copied') return { ...result, request: { ...request } }
      if (mode === 'expired') return { ...result, validUntil: request.now }
      if (mode === 'extended')
        return { ...result, validUntil: request.evidence.validUntil + 1 }
      return result
    })
    session.start(session.getSnapshot().generation, dispatchEvidence())
    const generation = session.getSnapshot().generation
    session.pause(generation)
    const run = session.getSnapshot().run
    if (!run) throw new Error('Missing run')
    const input = { ...resumeEvidence({ runId: run.id, generation, now: 0 }) }
    const pending = session.resume(generation, input)
    input.validUntil = 0
    await pending
    expect(session.getSnapshot().lifecycle).toBe(
      mode === 'fresh' ? 'running' : 'paused'
    )
  }
})

it('produces the same clock and ordered transition evidence from identical intents', async () => {
  const summaries = []
  for (let i = 0; i < 2; i++) {
    const { session } = await setup()
    session.start(session.getSnapshot().generation, dispatchEvidence())
    const generation = session.getSnapshot().generation
    session.advance(generation, 60)
    session.pause(generation)
    session.advance(generation, 180)
    const snapshot = session.getSnapshot()
    const events: string[] = []
    for (let node = snapshot.transition; node; node = node.previous)
      events.unshift(
        `${node.sequence}:${node.time}:${node.event}:${node.runId}`
      )
    summaries.push({
      generation,
      now: snapshot.now,
      lifecycle: snapshot.lifecycle,
      pending: snapshot.pendingPatrol,
      deadline: snapshot.nextDeadline,
      active: snapshot.run?.activeSeconds,
      pose: snapshot.run?.pose,
      events
    })
    session.dispose()
  }
  expect(summaries[0]).toEqual(summaries[1])
})

it('keeps finite active elapsed time when large admitted clock values are split', async () => {
  const { HarvestSession } = await import('../session')
  const longReport = assessRobotDesign(
    validateRobot({ ...report.settings, patrolMinutes: 2.9e306 }),
    farm
  )
  const canonical = Object.freeze({ ...receipt, report: longReport })
  const owners = {
    isCurrentMission: (value: CanonicalMission) => value === canonical,
    isCurrentScene: geometry.isCurrentScene.bind(geometry),
    isCurrentRobot: projection.isCurrentSource.bind(projection)
  }
  const session = new HarvestSession(canonical, owners, {
    dispatch: clear,
    resume: resumeClear
  })
  session.start(session.getSnapshot().generation, dispatchEvidence())
  const generation = session.getSnapshot().generation
  session.advance(generation, 8e307)
  session.advance(generation, 1.6e308)
  expect(session.getSnapshot().run?.activeSeconds).toBe(1.6e308)
  session.dispose()
})
