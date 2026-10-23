import { walkingObservationWorkspaceFixture } from './walking-observation-workspace-test-fixtures'
import { expect, it } from 'vitest'
import { WalkingConstrainedCycleOwner } from '../../domain/walking-constrained-kinematics'
import {
  cycleFixture,
  exact,
  over,
  plus
} from '../../domain/__tests__/walking-constrained-kinematics-test-fixtures'
import { roundFraction } from '../../domain/scalar-arithmetic'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { createWalkingRuntimeSelection } from '../../domain/walking-runtime-selection'

it('walking observation selected action binds the issued non-stowed root and retires stale motion', () => {
  const fixture = cycleFixture({ sourceProfile: 'solid-articulation/2' })
  const f = walkingObservationWorkspaceFixture(
    'actual-site',
    fixture.source.definition
  )
  if (f.report.status === 'legacy-view')
    throw new Error('Missing walking report')
  const source = f.report.source
  const translation = [
    (f.request.actionBounds.min[0] + f.request.actionBounds.max[0]) / 2,
    (f.request.actionBounds.min[1] + f.request.actionBounds.max[1]) / 2,
    f.request.actionBounds.min[2] - 0.125
  ]
  const owner = new WalkingConstrainedCycleOwner()
  const cycle = owner.prepare(source, {
    ...fixture.raw,
    source,
    fixedJoints: source.rig.presets.stowed,
    anchors: fixture.raw.anchors.map((a) => {
      const chain = source.rig.legChains.find((c) => c.id === a.chainId)
      if (!chain) throw new Error('Missing authored chain')
      const contact = source.rig.contacts.feet.find(
        (c) => c.part.bodyId === chain.footBodyId
      )
      if (!contact) throw new Error('Missing authored contact')
      return {
        ...a,
        part: contact.part,
        patch: contact.patch,
        anchorOrigin: a.anchorOrigin.map((v, i) =>
          plus(v, exact(translation[i]))
        )
      }
    })
  })
  const motion = owner.prepareSelectedChainMotion(cycle, {
    format: 'walking-selected-chain-root-motion/1',
    cycle,
    phase: 0,
    at: over(exact(1), exact(2)),
    chainId: 'right-front',
    targetAbduction: over(cycle.recipe.alpha, exact(2))
  })
  f.workspace.configure(
    {
      ...f.config,
      camera: {
        ...f.config.camera,
        localPose: { position: [0, 0, 0], rotation: [0, 0, 0, 1] }
      }
    },
    f.world
  )
  const request = { ...f.request, binding: { owner, cycle, motion } }
  const result = f.workspace.observeSelectedAction(request)
  if (result.status !== 'available') throw new Error(result.reason)
  expect(result.observation.context.motion).toBe(motion)
  expect(result.observation.input.camera.pose.position).toEqual(
    motion.root.origin.map((v) =>
      roundFraction(v.numerator, v.denominator, 'nearest-even')
    )
  )
  expect(result.observation.input.camera.pose.position[0]).not.toBe(0)
  expect(f.workspace.isCurrent(result.observation)).toBe(true)
  expect(
    f.workspace.observeSelectedAction({
      ...request,
      binding: { owner, cycle, motion: { ...motion } }
    }).status
  ).toBe('unavailable')
  expect(
    f.workspace.observeSelectedAction({
      ...request,
      binding: { owner, cycle: { ...cycle }, motion }
    }).status
  ).toBe('unavailable')
  expect(
    f.workspace.observeSelectedAction({
      ...request,
      binding: { owner: new WalkingConstrainedCycleOwner(), cycle, motion }
    }).status
  ).toBe('unavailable')
  const rotatedOwner = new WalkingConstrainedCycleOwner()
  const rotatedCycle = rotatedOwner.prepare(source, {
    ...cycle.recipe,
    baseOrientation: [exact(0), exact(1), exact(0), exact(0)],
    anchors: cycle.recipe.anchors.map((a, index) => ({
      ...a,
      anchorOrigin: fixture.raw.anchors[index].anchorOrigin.map((v, i) =>
        plus(
          i === 1 ? v : { numerator: -v.numerator, denominator: v.denominator },
          exact(translation[i])
        )
      )
    }))
  })
  const rotatedMotion = rotatedOwner.prepareSelectedChainMotion(rotatedCycle, {
    ...motion.recipe,
    cycle: rotatedCycle
  })
  expect(
    f.workspace.observeSelectedAction({
      ...request,
      binding: {
        owner: rotatedOwner,
        cycle: rotatedCycle,
        motion: rotatedMotion
      }
    })
  ).toEqual({
    status: 'unavailable',
    reason: 'unsupported-selected-observation-orientation'
  })
  rotatedOwner.dispose()
  expect(f.workspace.isCurrent(result.observation)).toBe(true)
  f.operating.apply(
    createWalkingRuntimeSelection(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'replacement-selected-camera-source',
        sourceProfile: 'solid-articulation/2'
      })
    )
  )
  expect(f.workspace.isCurrent(result.observation)).toBe(false)
  expect(f.workspace.observeSelectedAction(request).status).toBe('unavailable')
  owner.dispose()
  expect(f.workspace.isCurrent(result.observation)).toBe(false)
  expect(f.workspace.observeSelectedAction(request).status).toBe('unavailable')
  f.workspace.close()
}, 30000)

it('walking observation workspace rejects missing and malformed scenarios before changing current admitted inputs', () => {
  const f = walkingObservationWorkspaceFixture('actual-site')
  const before = f.sourceOwner.work
  expect(f.workspace.observe(f.request)).toEqual({
    status: 'unavailable',
    reason: 'missing-walking-observation-scenario'
  })
  expect(f.sourceOwner.work).toEqual(before)
  f.workspace.configure(f.config, f.world)
  const normal = f.workspace.observe(f.request)
  if (normal.status !== 'available') throw new Error(normal.reason)
  expect(normal.observation.coverage).toBe('complete-empty')
  expect(normal.work.sourcePreparation.inventoryBuilds).toBe(1)
  expect(normal.work.sourcePreparation.regionWorldBounds).toBeGreaterThan(0)
  const repeat = f.workspace.observe(f.request)
  if (repeat.status !== 'available') throw new Error(repeat.reason)
  expect(
    Object.values(repeat.work.sourcePreparation).every((value) => value === 0)
  ).toBe(true)
  expect(repeat.work.farmMembershipBuilds).toBe(0)
  expect(repeat.observation.work.indexBuilds).toBe(0)
  expect(repeat.observation.work.cameraFrames).toBe(1)
  expect(() =>
    f.workspace.configure(
      { ...f.config, model: { ...f.config.model, maxRays: 65 } },
      f.world
    )
  ).toThrow()
  expect(f.workspace.isCurrent(normal.observation)).toBe(true)
  expect(() =>
    f.workspace.configure(
      {
        ...f.config,
        camera: {
          ...f.config.camera,
          localPose: { ...f.config.camera.localPose, rotation: [0, 0, 0, 2] }
        }
      },
      f.world
    )
  ).toThrow()
  expect(() =>
    f.workspace.configure(
      { ...f.config, safe: true } as typeof f.config,
      f.world
    )
  ).toThrow()
  expect(() =>
    f.workspace.configure(
      {
        ...f.config,
        camera: { ...f.config.camera, bodyId: 'foreign' }
      } as unknown as typeof f.config,
      f.world
    )
  ).toThrow()
  expect(f.workspace.isCurrent(normal.observation)).toBe(true)
  expect(Object.isFrozen(normal.observation.context.sensorIdentity)).toBe(true)
  const invalidDynamic = { ...f.world, validUntil: -1 }
  expect(() => f.workspace.configure(f.config, invalidDynamic)).toThrow()
  expect(f.workspace.isCurrent(normal.observation)).toBe(true)
  f.workspace.configure(f.config, {
    ...f.world,
    assumption: 'Explicit successor dynamic scenario'
  })
  const dynamicSuccessor = f.workspace.observe(f.request)
  if (dynamicSuccessor.status !== 'available')
    throw new Error(dynamicSuccessor.reason)
  expect(f.workspace.isCurrent(normal.observation)).toBe(false)
  expect(
    Object.values(dynamicSuccessor.work.sourcePreparation).every(
      (value) => value === 0
    )
  ).toBe(true)
  expect(dynamicSuccessor.work.farmMembershipBuilds).toBe(0)
  expect(dynamicSuccessor.observation.work.indexBuilds).toBe(0)
  expect(
    f.workspace.observe({ ...f.request, now: 11, validUntil: 12 }).status
  ).toBe('unavailable')
  expect(f.workspace.isCurrent(normal.observation)).toBe(false)
  f.workspace.close()
  expect(f.workspace.get()).toBeUndefined()
  expect(() => f.workspace.configure(f.config, f.world)).toThrow()
  expect(() => f.workspace.observe(f.request)).toThrow()
  f.operating.clear()
}, 30000)

it('walking observation workspace never promotes incomplete optics dynamics or bounded work into complete-empty', () => {
  const f = walkingObservationWorkspaceFixture('actual-site')
  const observe = () => {
    const result = f.workspace.observe(f.request)
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.observation.coverage).not.toBe('complete-empty')
    return result
  }
  for (const optics of [
    { ...f.config.optics, illumination: null },
    { ...f.config.optics, filmTransmission: null },
    { ...f.config.optics, weatherTransmission: null },
    { ...f.config.optics, shadowFraction: null },
    { ...f.config.optics, glare: null },
    { ...f.config.optics, illumination: 0 },
    { ...f.config.optics, glare: 1 }
  ]) {
    f.workspace.configure({ ...f.config, optics }, f.world)
    expect(observe().observation.reliability.status).not.toBe('reliable')
  }
  f.workspace.configure(f.config, { ...f.world, validFrom: 2 })
  expect(observe().observation.reasons).toContain('outside-source-time')
  f.workspace.configure(f.config, {
    ...f.world,
    domain: f.request.actionBounds
  })
  expect(observe().observation.reasons).toContain('outside-dynamic-domain')
  f.workspace.configure(f.config, {
    ...f.world,
    actors: [{ ...f.actor, states: [{ ...f.actor.states[0], from: 2 }] }]
  })
  expect(observe().observation.reasons).toContain('actor-timeline-gap')
  for (const budget of ['maxCandidates', 'maxRays', 'maxActors'] as const) {
    f.workspace.configure(
      { ...f.config, model: { ...f.config.model, [budget]: 0 } },
      { ...f.world, actors: [f.actor] }
    )
    expect(observe().observation.unvisited).toBeGreaterThan(0)
  }
  f.workspace.configure(
    { ...f.config, camera: { ...f.config.camera, maxDistance: 0.001 } },
    f.world
  )
  expect(observe().observation.reasons).toContain('incomplete-frustum-or-range')
  f.workspace.close()
  f.operating.clear()
}, 30000)
