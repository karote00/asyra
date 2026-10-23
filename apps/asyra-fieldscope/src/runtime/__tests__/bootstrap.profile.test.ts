import { configurationSite } from '../../domain/farm-configuration'
import { Quaternion, Vector3 } from 'three'
// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { transformRobotPoint } from '../../domain/robot-kinematics'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import { bootstrap } from '../bootstrap'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import {
  DEFAULT_WALKING_RUNTIME_SELECTION,
  createWalkingRuntimeSelection
} from '../../domain/walking-runtime-selection'
import { readWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { WalkingConstrainedCycleOwner } from '../../domain/walking-constrained-kinematics'
import { prepareWalkingSelectedActionSweep } from '../walking-local-action-workspace'
import {
  interval,
  subtract,
  multiply,
  divide,
  roundFraction
} from '../../domain/scalar-arithmetic'
import { evaluateExactPolynomialTrig } from '../../domain/kinematic-trigonometry'
import {
  exact,
  plus,
  minus,
  times,
  over,
  negate
} from '../../domain/__tests__/walking-constrained-kinematics-test-fixtures'
import type { WalkingConstrainedCycleRecipe } from '../../domain/walking-constrained-kinematics'
import { RayQueries } from '../../simulation/ray-query'

it('walking local action production prepares exact motion once and refreshes perception and monitors before completion', async () => {
  const driver: GraphicsDriver = {
    domElement: document.createElement('canvas'),
    autoClear: true,
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    clear: vi.fn(),
    clearDepth: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn()
  }
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
    }
  )
  const host = document.createElement('div')
  host.getBoundingClientRect = () => new DOMRect(0, 0, 640, 480)
  const runtime = await bootstrap(
    host,
    () =>
      new ThreeEngine({
        createDriver: () => driver,
        requestFrame: () => 1,
        cancelFrame: vi.fn()
      })
  )
  try {
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: 2.2
    })
    await runtime.setSceneDemandConfiguration({
      version: 1,
      route: {
        kind: 'soil-strip',
        bay: 0,
        stripId: 'strip-3',
        from: 0.25,
        until: 1.9
      },
      evidence: {
        kind: 'synthetic',
        id: 'local-action-survey',
        label: 'Synthetic local action survey'
      },
      growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
      clearanceMargin: { kind: 'bounded', metres: 0 }
    })
    const baseline = createSyntheticWalkingRobotDefinition({
      definitionId: 'local-action-source',
      sourceProfile: 'solid-articulation/2'
    })
    const stations = baseline.legs
      .filter((l) => l.side === 'left')
      .map((l) => l.mount.position[2])
      .sort((a, b) => a - b)
    const spacing = Math.min(
      ...stations.slice(1).map((z, i) => z - stations[i])
    )
    const alpha = Math.min(
      ...baseline.legs.map(
        (l) =>
          divide(
            subtract(interval(spacing), interval(l.foot.size[2])),
            multiply(interval(4), interval(l.upper.length))
          ).low
      )
    )
    const definition = readWalkingRobotDefinition({
      ...baseline,
      jointEvidence: {
        kind: 'synthetic',
        id: 'local-action-joints',
        label: 'Synthetic authored support arc'
      },
      legs: baseline.legs.map((l) => ({
        ...l,
        jointRanges: { ...l.jointRanges, knee: [-alpha, l.jointRanges.knee[1]] }
      }))
    })
    await runtime.setWalkingRuntimeSelection(
      createWalkingRuntimeSelection(definition)
    )
    const report = runtime.getWalkingOperatingReport()
    if (report.status === 'legacy-view' || !report.demand.route)
      throw new Error('Missing walking action source')
    expect(report.profile.kind).toBe('solid-articulation/2')
    const source = report.source,
      volume = report.demand.route.volume
    const x = (volume.min[0] + volume.max[0]) / 2
    const half = over(exact(alpha), exact(2)),
      sin = evaluateExactPolynomialTrig('sin', half).value,
      cos = evaluateExactPolynomialTrig('cos', half).value
    const norm = plus(times(sin, sin), times(cos, cos)),
      sigma = over(times(exact(2), times(sin, cos)), norm),
      cosine = over(minus(times(cos, cos), times(sin, sin)), norm)
    const groups = [true, false].map((side) =>
      source.rig.legChains
        .filter(
          (c) => ((c.side === 'left') !== (c.station === 'middle')) === side
        )
        .map((c) => c.id)
    ) as [string[], string[]]
    const anchors = source.rig.legChains.map((chain) => {
      const contact = source.rig.contacts.feet.find(
        (p) => p.part.bodyId === chain.footBodyId
      )
      const foot = source.rig.bodies.find(
        (b) => b.id === chain.footBodyId
      )?.fixedFrame
      const leg = source.definition.legs.find(
        (l) => l.side === chain.side && l.station === chain.station
      )
      if (!contact || !foot || !leg) throw new Error('Incomplete authored leg')
      const frames = chain.jointIds.map((id) => {
        const joint = source.rig.joints.find((j) => j.id === id)
        if (!joint) throw new Error('Missing joint')
        return joint.frame
      })
      const point = [0, 1, 2].map((axis) =>
        [...frames, foot, contact.localFrame].reduce(
          (sum, frame) => plus(sum, exact(frame.position[axis])),
          exact(0)
        )
      ) as [
        ReturnType<typeof exact>,
        ReturnType<typeof exact>,
        ReturnType<typeof exact>
      ]
      point[1] = plus(
        point[1],
        times(exact(leg.upper.length), minus(exact(1), cosine))
      )
      const delta = times(exact(leg.upper.length), sigma)
      point[2] = plus(
        point[2],
        groups[0].includes(chain.id) ? negate(delta) : delta
      )
      return {
        chainId: chain.id,
        part: contact.part,
        patch: contact.patch,
        anchorOrigin: point
      }
    })
    const ground = anchors[0].anchorOrigin[1]
    const recipe: WalkingConstrainedCycleRecipe = {
      format: 'walking-constrained-cycle/1',
      source,
      fixedJoints: source.rig.presets.stowed,
      baseOrientation: [exact(0), exact(0), exact(0), exact(1)],
      alpha: exact(alpha),
      groups,
      anchors: anchors.map((a) => ({
        ...a,
        anchorOrigin: [
          plus(a.anchorOrigin[0], exact(x - 0.4)),
          minus(a.anchorOrigin[1], ground),
          plus(a.anchorOrigin[2], exact(0.65))
        ]
      })),
      budget: { maxOperations: 10000000, maxBits: 24000 }
    }
    const planningOwner = new WalkingConstrainedCycleOwner()
    const planningCycle = planningOwner.prepare(source, recipe)
    const planningMotion = planningOwner.prepareSelectedChainMotion(
      planningCycle,
      {
        format: 'walking-selected-chain-root-motion/1',
        cycle: planningCycle,
        phase: 0,
        at: over(exact(1), exact(2)),
        chainId: 'right-front',
        targetAbduction: over(exact(alpha), exact(2))
      }
    )
    const planningSweep = prepareWalkingSelectedActionSweep(
      planningOwner,
      planningMotion
    )
    const nearest = (value: ReturnType<typeof exact>) =>
      roundFraction(value.numerator, value.denominator, 'nearest-even')
    const desiredWorldCamera = [x, 0.6, 0.3] as const
    const originalLocal = desiredWorldCamera.map((v, i) =>
      nearest(minus(exact(v), planningMotion.root.origin[i]))
    ) as [number, number, number]
    const mount = source.definition.base.inspectionHeads.right.centre
    const cameraWorld = mount.map((v, i) =>
      nearest(plus(planningMotion.root.origin[i], exact(v)))
    )
    const centre = [0, 1, 2].map((i) =>
      nearest(
        over(
          plus(
            exact(planningSweep.bounds.min[i]),
            exact(planningSweep.bounds.max[i])
          ),
          exact(2)
        )
      )
    )
    const direction = new Vector3(
      centre[0] - cameraWorld[0],
      centre[1] - cameraWorld[1],
      centre[2] - cameraWorld[2]
    ).normalize()
    const aim = new Quaternion()
      .setFromUnitVectors(new Vector3(0, 0, 1), direction)
      .normalize()
    const scenario = {
      format: 'walking-observation-scenario/1' as const,
      id: 'local-action-camera',
      assumption:
        'Explicit synthetic inspection-head action view, not hardware calibration',
      validFrom: 0,
      validUntil: 10,
      camera: {
        bodyId: 'base' as const,
        localPose: {
          position: mount,
          rotation: [aim.x, aim.y, aim.z, aim.w] as const
        },
        halfWidthSlope: 10,
        halfHeightSlope: 10,
        maxDistance: 3
      },
      optics: {
        illumination: 0.875,
        filmTransmission: 0.875,
        weatherTransmission: 0.875,
        shadowFraction: 0.125,
        glare: 0.0625
      },
      model: {
        format: 'synthetic-action-volume/1' as const,
        minSignal: 0.5,
        maxGlare: 0.125,
        maxCandidates: 4096,
        maxRays: 64,
        maxActors: 64
      },
      leaves: 'source-pose' as const,
      fruits: 'all-attached' as const
    }
    const sightDomain = (camera: readonly number[]) => ({
      min: planningSweep.bounds.min.map((v, i) => Math.min(v, camera[i])) as [
        number,
        number,
        number
      ],
      max: planningSweep.bounds.max.map((v, i) => Math.max(v, camera[i])) as [
        number,
        number,
        number
      ]
    })
    const tightDynamic = {
      format: 'synthetic-dynamic-scene/1' as const,
      assumption: 'Explicit covered local dynamic world',
      domain: sightDomain(cameraWorld),
      validFrom: 0,
      validUntil: 10,
      actors: []
    }
    const site = configurationSite(report.demand.farm)
    const dynamic = {
      ...tightDynamic,
      assumption:
        'Explicit finite current-site synthetic tracked area, declared before observation',
      domain: {
        min: [0, -site.height, 0] as const,
        max: [site.bays * site.width, site.eave, site.length] as const
      }
    }
    const originalScenario = {
      ...scenario,
      assumption:
        'Original desired-world synthetic camera, unchanged viewpoint',
      camera: {
        ...scenario.camera,
        localPose: { position: originalLocal, rotation: [0, 0, 0, 1] as const }
      }
    }
    runtime.configureWalkingObservationScenario(originalScenario, {
      ...dynamic,
      domain: sightDomain(desiredWorldCamera)
    })
    runtime.configureWalkingRuntimeMonitor({
      format: 'walking-runtime-monitor-profile/1',
      id: 'local-action-monitor',
      assumption: 'Synthetic force and orientation profile',
      validFrom: 0,
      validUntil: 10,
      limits: {
        maxTiltRadians: 0.2,
        maxAngularRateRadiansPerSecond: 0.5,
        minContactForce: 1,
        maxContactForce: 1000,
        maxSampleGap: 0.5
      },
      uncertainty: { orientationRadians: 0.001, contactForce: 0.1 }
    })
    const sample = (now: number) => ({
      format: 'synthetic-walking-runtime-sample/1' as const,
      assumption: 'Current synthetic local action readings',
      orientations: [
        { at: now - 0.1, rotation: [0, 0, 0, 1] as const },
        { at: now, rotation: [0, 0, 0, 1] as const }
      ],
      contacts: recipe.anchors
        .filter((a) => groups[0].includes(a.chainId))
        .map((a) => ({
          part: a.part,
          patch: a.patch,
          force: { low: 20, high: 21 }
        }))
    })
    const request = {
      format: 'synthetic-walking-local-action/1' as const,
      assumption: 'Explicit synthetic selected root proposal',
      actionId: 'local-root-half',
      now: 1,
      validUntil: 1.5,
      cycle: recipe,
      selected: {
        phase: 0,
        at: over(exact(1), exact(2)),
        chainId: 'right-front',
        targetAbduction: over(exact(alpha), exact(2))
      },
      relationBudget: {
        maxSubdivisions: 30,
        maxRegionPairs: 2000000,
        maxExactPredicates: 5000000,
        maxBits: 24000
      },
      monitor: sample(1)
    }
    const original = runtime.startWalkingLocalAction({
      ...request,
      actionId: 'original-world-view',
      now: 0.25,
      validUntil: 0.5,
      monitor: sample(0.25)
    })
    expect(original.status).toBe('held')
    expect(original.reasons).toContain('incomplete-frustum-or-range')
    expect(original.progress).toBe(0)
    expect(original.work.observation?.sourcePreparation.inventoryBuilds).toBe(1)
    expect(
      original.work.observation?.sourcePreparation.regionWorldBounds
    ).toBeGreaterThan(0)
    const originalComplete = runtime.completeWalkingLocalAction({
      actionId: 'original-world-view',
      now: 0.5,
      validUntil: 0.75,
      progress: 1,
      monitor: sample(0.5)
    })
    expect(originalComplete.status).toBe('held')
    expect(originalComplete.progress).toBe(0)
    runtime.configureWalkingObservationScenario(scenario, tightDynamic)
    const tight = runtime.startWalkingLocalAction({
      ...request,
      actionId: 'tight-domain-view',
      now: 0.75,
      validUntil: 0.875,
      monitor: sample(0.75)
    })
    expect(tight.status).toBe('held')
    expect(tight.reasons).toContain('outside-dynamic-domain')
    expect(tight.progress).toBe(0)
    runtime.configureWalkingObservationScenario(scenario, dynamic)
    const start = runtime.startWalkingLocalAction(request)
    expect(start.action?.sweep.bounds).toEqual(planningSweep.bounds)
    planningOwner.dispose()
    expect(
      start.status,
      JSON.stringify({
        reasons: start.reasons,
        observationReasons: start.observation?.reasons,
        coverage: start.observation?.coverage,
        sweep: start.action?.sweep.bounds,
        camera: start.observation?.input.camera.pose.position,
        sight: start.observation?.sightBounds,
        dynamicDomain: dynamic.domain
      })
    ).toBe('running')
    expect(start.relation?.status).toBe('clear')
    expect(start.observation?.coverage).toBe('complete-empty')
    if (!start.observation || !start.work.observation)
      throw new Error('Missing admitted start observation and work')
    expect(start.observation.reasons).not.toContain('outside-dynamic-domain')
    expect(
      start.observation.sightBounds.min.every(
        (v, i) => v >= dynamic.domain.min[i]
      )
    ).toBe(true)
    expect(
      start.observation.sightBounds.max.every(
        (v, i) => v <= dynamic.domain.max[i]
      )
    ).toBe(true)
    expect(start.monitor?.status).toBe('within-synthetic-profile')
    expect(start.work).toMatchObject({
      cyclePreparations: 1,
      motionPreparations: 1,
      sweepPreparations: 1,
      relationPreparations: 1,
      observationCalls: 1
    })
    expect(start.work.exactPredicates).toBeGreaterThan(0)
    expect(
      Object.values(start.work.observation.sourcePreparation).every(
        (value) => value === 0
      )
    ).toBe(true)
    const running = runtime.continueWalkingLocalAction({
      actionId: request.actionId,
      now: 2,
      validUntil: 2.5,
      progress: 0.5,
      monitor: sample(2)
    })
    expect(running.status, JSON.stringify(running.reasons)).toBe('running')
    expect(running.relation).toBe(start.relation)
    expect(running.work).toMatchObject({
      cyclePreparations: 0,
      motionPreparations: 0,
      sweepPreparations: 0,
      relationPreparations: 0,
      sourceCertifications: 0,
      exactPredicates: 0,
      observationCalls: 1
    })
    expect(running.work.observation).toMatchObject({
      farmMembershipBuilds: 0,
      indexBuilds: 0,
      cameraFrames: 1,
      sightQueries: 1
    })
    if (!running.work.observation)
      throw new Error('Missing continuation observation work')
    expect(
      Object.values(running.work.observation.sourcePreparation).every(
        (value) => value === 0
      )
    ).toBe(true)
    expect(running.monitor?.work).toMatchObject({
      orientationSamples: 2,
      stanceContacts: 3
    })
    expect(runtime.isCurrentWalkingLocalActionDecision(start)).toBe(false)
    const complete = runtime.completeWalkingLocalAction({
      actionId: request.actionId,
      now: 3,
      validUntil: 3.5,
      progress: 1,
      monitor: sample(3)
    })
    expect(complete.status, JSON.stringify(complete.reasons)).toBe('complete')
    expect(complete.work.exactPredicates).toBe(0)
    if (!complete.work.observation)
      throw new Error('Missing completion observation work')
    expect(
      Object.values(complete.work.observation.sourcePreparation).every(
        (value) => value === 0
      )
    ).toBe(true)
    expect(complete.monitor).not.toBe(running.monitor)
    expect(complete.observation).not.toBe(running.observation)
    expect(runtime.isCurrentWalkingLocalActionDecision(complete)).toBe(true)
    expect(runtime.getWalkingLocalActionDecision()).toBe(complete)
    if (!complete.action) throw new Error('Missing admitted action')
    const personBounds = complete.action.sweep.bounds
    const tracked = {
      ...dynamic,
      actors: [
        {
          trackId: 'local-action-person',
          kind: 'person' as const,
          states: [
            {
              from: 0,
              until: 5,
              motion: 'moving' as const,
              bounds: personBounds
            },
            {
              from: 5,
              until: 10,
              motion: 'stationary' as const,
              bounds: personBounds
            }
          ]
        }
      ]
    }
    runtime.configureWalkingObservationScenario(scenario, tracked)
    expect(runtime.isCurrentWalkingLocalActionDecision(complete)).toBe(false)
    const person = runtime.startWalkingLocalAction({
      ...request,
      actionId: 'person-policy',
      now: 4,
      validUntil: 4.5,
      monitor: sample(4)
    })
    expect(person.status).toBe('held')
    expect(person.reasons).toContain('person-policy-hold')
    const moving = person.observation?.detections.find(
      (d) => d.kind === 'dynamic'
    )
    if (!moving || moving.kind !== 'dynamic')
      throw new Error('Missing current person observation')
    expect(moving.motion).toBe('moving')
    const stopped = runtime.continueWalkingLocalAction({
      actionId: 'person-policy',
      now: 5,
      validUntil: 5.5,
      progress: 0.5,
      monitor: sample(5)
    })
    expect(stopped.status).toBe('held')
    expect(stopped.reasons).toContain('person-policy-hold')
    const stationary = stopped.observation?.detections.find(
      (d) => d.kind === 'dynamic'
    )
    if (!stationary || stationary.kind !== 'dynamic')
      throw new Error('Missing stationary person identity')
    expect(stationary.motion).toBe('stationary')
    expect(stationary.trackId).toBe(moving.trackId)
    expect(stationary.sourceIdentity).toBe(moving.sourceIdentity)
    expect(stopped.relation).toBe(person.relation)
    expect(stopped.work).toMatchObject({
      relationPreparations: 0,
      sourceCertifications: 0,
      exactPredicates: 0,
      observationCalls: 1
    })
    expect(stopped.monitor?.work).toMatchObject({
      orientationSamples: 2,
      stanceContacts: 3
    })
    runtime.configureWalkingObservationScenario(
      { ...scenario, optics: { ...scenario.optics, illumination: null } },
      dynamic
    )
    const insufficient = runtime.continueWalkingLocalAction({
      actionId: 'person-policy',
      now: 6,
      validUntil: 6.5,
      progress: 0.5,
      monitor: sample(6)
    })
    expect(insufficient.status).toBe('held')
    expect(insufficient.observation?.reliability.status).not.toBe('reliable')
    runtime.configureWalkingObservationScenario(scenario, dynamic)
    const force = sample(7)
    const unsupported = runtime.continueWalkingLocalAction({
      actionId: 'person-policy',
      now: 7,
      validUntil: 7.5,
      progress: 0.5,
      monitor: {
        ...force,
        contacts: force.contacts.map((c, i) =>
          i ? c : { ...c, force: { low: 0, high: 21 } }
        )
      }
    })
    expect(unsupported.status).toBe('held')
    expect(unsupported.reasons).toContain(
      'synthetic-contact-force-not-within-profile'
    )
    const exhausted = runtime.startWalkingLocalAction({
      ...request,
      actionId: 'bounded-unknown',
      now: 8,
      validUntil: 8.5,
      relationBudget: { ...request.relationBudget, maxExactPredicates: 1 },
      monitor: sample(8)
    })
    expect(exhausted.status).toBe('held')
    expect(exhausted.relation?.status).toBe('unknown')
    expect(exhausted.relation?.coverage.unvisited).toBeGreaterThan(0)
    expect(exhausted.reasons).toContain('local-relation-not-complete-clear')
    const repeated = runtime.continueWalkingLocalAction({
      actionId: 'bounded-unknown',
      now: 8,
      validUntil: 8.5,
      progress: 0.5,
      monitor: sample(8)
    })
    expect(repeated.status).toBe('held')
    expect(repeated.reasons).toContain('nonmonotonic-action-time')
    expect(runtime.isCurrentWalkingLocalActionDecision(exhausted)).toBe(false)
    await runtime.setWalkingRuntimeSelection(DEFAULT_WALKING_RUNTIME_SELECTION)
    const stale = runtime.continueWalkingLocalAction({
      actionId: 'bounded-unknown',
      now: 9,
      validUntil: 9.5,
      progress: 0.5,
      monitor: sample(9)
    })
    expect(stale.status).toBe('held')
    expect(stale.reasons).toContain(
      'stale-local-action-source-demand-load-or-motion'
    )
    expect(stale.work.observationCalls).toBe(0)
    await runtime.dispose()
    expect(runtime.isCurrentWalkingLocalActionDecision(complete)).toBe(false)
    expect(() =>
      runtime.continueWalkingLocalAction({
        actionId: request.actionId,
        now: 9.5,
        validUntil: 9.75,
        progress: 0.5,
        monitor: sample(9.5)
      })
    ).toThrow()
  } finally {
    await runtime.dispose()
    vi.unstubAllGlobals()
  }
}, 60000)
it('walking observation production bootstrap issues complete-empty and retires scenario and domain-time products', async () => {
  const driver: GraphicsDriver = {
    domElement: document.createElement('canvas'),
    autoClear: true,
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    clear: vi.fn(),
    clearDepth: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn()
  }
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
    }
  )
  const host = document.createElement('div')
  host.getBoundingClientRect = () => new DOMRect(0, 0, 640, 480)
  const runtime = await bootstrap(
    host,
    () =>
      new ThreeEngine({
        createDriver: () => driver,
        requestFrame: () => 1,
        cancelFrame: vi.fn()
      })
  )
  try {
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: 2.2
    })
    await runtime.setSceneDemandConfiguration({
      version: 1,
      route: {
        kind: 'soil-strip',
        bay: 0,
        stripId: 'strip-3',
        from: 0.25,
        until: 1.9
      },
      evidence: {
        kind: 'synthetic',
        id: 'walking-optical-survey',
        label: 'Synthetic optical survey'
      },
      growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
      clearanceMargin: { kind: 'bounded', metres: 0 }
    })
    await runtime.setWalkingRuntimeSelection(
      createWalkingRuntimeSelection(
        createSyntheticWalkingRobotDefinition({
          definitionId: 'walking-observation-production',
          sourceProfile: 'solid-articulation/2'
        })
      )
    )
    const report = runtime.getWalkingOperatingReport()
    if (report.status === 'legacy-view' || !report.demand.route)
      throw new Error('Missing walking route')
    expect(report.profile.kind).toBe('solid-articulation/2')
    const volume = report.demand.route.volume
    const x = (volume.min[0] + volume.max[0]) / 2
    const y = volume.min[1] + (volume.max[1] - volume.min[1]) / 24
    const z = (fraction: number) =>
      volume.min[2] + (volume.max[2] - volume.min[2]) * fraction
    const actionBounds = {
      min: [x - 0.01, y - 0.01, z(0.75)] as const,
      max: [x + 0.01, y + 0.01, z(0.8)] as const
    }
    const config = {
      format: 'walking-observation-scenario/1' as const,
      id: 'base-camera-scenario',
      assumption: 'Explicit synthetic base-mounted optical camera',
      validFrom: 0,
      validUntil: 10,
      camera: {
        bodyId: 'base' as const,
        localPose: {
          position: [x, y, z(0.4)] as const,
          rotation: [0, 0, 0, 1] as const
        },
        halfWidthSlope: 1,
        halfHeightSlope: 1,
        maxDistance: 2
      },
      optics: {
        illumination: 0.875,
        filmTransmission: 0.875,
        weatherTransmission: 0.875,
        shadowFraction: 0.125,
        glare: 0.0625
      },
      model: {
        format: 'synthetic-action-volume/1' as const,
        minSignal: 0.5,
        maxGlare: 0.125,
        maxCandidates: 64,
        maxRays: 16,
        maxActors: 64
      },
      leaves: 'source-pose' as const,
      fruits: 'all-attached' as const
    }
    const dynamics = {
      format: 'synthetic-dynamic-scene/1' as const,
      assumption: 'Explicit covered empty dynamic world',
      domain: volume,
      validFrom: 0,
      validUntil: 10,
      actors: []
    }
    runtime.configureWalkingObservationScenario(config, dynamics)
    const request = {
      actionId: 'bounded-route-action',
      actionBounds,
      now: 1,
      validUntil: 2
    }
    const first = runtime.observeWalkingAction(request)
    expect(first.status).toBe('available')
    if (first.status !== 'available') throw new Error(first.reason)
    expect(first.observation.coverage).toBe('complete-empty')
    expect(first.observation.reliability.status).toBe('reliable')
    expect(first.observation.context.report).toBe(report)
    expect(first.observation.context.demand).toBe(report.demand)
    expect(first.observation.context.source).toBe(report.source)
    expect(first.work.farmMembershipBuilds).toBe(1)
    expect(
      runtime.isCurrentWalkingActionObservation({ ...first.observation })
    ).toBe(false)
    expect(runtime.isCurrentWalkingActionObservation(first.observation)).toBe(
      true
    )
    const second = runtime.observeWalkingAction(request)
    if (second.status !== 'available') throw new Error(second.reason)
    expect(second.work.farmMembershipBuilds).toBe(0)
    expect(second.observation.work.indexBuilds).toBe(0)
    expect(second.observation.work.cameraFrames).toBe(1)
    expect(second.observation.work.sightQueries).toBe(1)
    runtime.configureWalkingObservationScenario(config, dynamics)
    expect(runtime.isCurrentWalkingActionObservation(first.observation)).toBe(
      false
    )
    const third = runtime.observeWalkingAction({ ...request, now: 1.5 })
    if (third.status !== 'available') throw new Error(third.reason)
    expect(third.work.farmMembershipBuilds).toBe(0)
    expect(third.observation.work.indexBuilds).toBe(0)
    expect(runtime.getWalkingActionObservation()).toBe(third.observation)
    const actorBounds = {
      min: [x - 0.005, y - 0.005, z(0.55)] as const,
      max: [x + 0.005, y + 0.005, z(0.6)] as const
    }
    expect(actorBounds.max[2]).toBeLessThan(actionBounds.min[2])
    const actor = {
      trackId: 'persistent-moving-object',
      kind: 'moving-object' as const,
      states: [
        {
          from: 0,
          until: 1.25,
          motion: 'moving' as const,
          bounds: actorBounds
        },
        {
          from: 1.25,
          until: 10,
          motion: 'stationary' as const,
          bounds: actorBounds
        }
      ]
    }
    runtime.configureWalkingObservationScenario(config, {
      ...dynamics,
      actors: [actor]
    })
    const moving = runtime.observeWalkingAction(request)
    if (moving.status !== 'available') throw new Error(moving.reason)
    const movingHit = moving.observation.detections.find(
      (d) => d.kind === 'dynamic'
    )
    if (!movingHit || movingHit.kind !== 'dynamic')
      throw new Error('Missing actual dynamic sight witness')
    expect(movingHit).toMatchObject({
      trackId: actor.trackId,
      actorKind: 'moving-object',
      motion: 'moving'
    })
    expect(moving.observation.coverage).toBe('partial')
    expect(moving.observation.work.sourceActorVisits).toBe(1)
    expect(moving.work.farmMembershipBuilds).toBe(0)
    const stopped = runtime.observeWalkingAction({ ...request, now: 1.5 })
    if (stopped.status !== 'available') throw new Error(stopped.reason)
    const stoppedHit = stopped.observation.detections.find(
      (d) => d.kind === 'dynamic'
    )
    expect(stoppedHit).toMatchObject({
      trackId: actor.trackId,
      actorKind: 'moving-object',
      motion: 'stationary',
      sourceIdentity: movingHit.sourceIdentity
    })
    if (!stoppedHit || stoppedHit.kind !== 'dynamic')
      throw new Error('Missing stationary tracked source')
    expect(stoppedHit.sourceIdentity).toBe(movingHit.sourceIdentity)
    expect(runtime.isCurrentWalkingActionObservation(moving.observation)).toBe(
      false
    )
    expect(stopped.observation.work.indexBuilds).toBe(0)
    runtime.configureWalkingObservationScenario(config, {
      ...dynamics,
      actors: [
        {
          ...actor,
          states: [
            { from: 0, until: 10, motion: 'stationary', bounds: actorBounds }
          ]
        }
      ]
    })
    expect(runtime.isCurrentWalkingActionObservation(stopped.observation)).toBe(
      false
    )
    const updated = runtime.observeWalkingAction(request)
    if (updated.status !== 'available') throw new Error(updated.reason)
    const updatedHit = updated.observation.detections.find(
      (d) => d.kind === 'dynamic'
    )
    expect(updatedHit?.kind === 'dynamic' && updatedHit.sourceIdentity).toBe(
      movingHit.sourceIdentity
    )
    expect(updated.work.farmMembershipBuilds).toBe(0)
    expect(updated.observation.work.indexBuilds).toBe(0)

    // Choose a real authored leaf face with a beyond-source action box inside W1.
    const leaf = report.demand.freePassage.exclusions.flatMap((item) => {
      if (item.kind !== 'source') return []
      const patch = item.mesh.sourceAnatomy?.patches.find(
        (p) => p.role === 'leaf-blade' && p.source.region === item.region
      )
      const descriptor = item.mesh.descriptor,
        shape = descriptor.shape
      if (!patch || shape.kind !== 'triangles') return []
      const placement = descriptor.instances?.[item.instance]
      const points = [0, 1, 2].map((i) => {
        const offset = shape.indices[patch.source.ranges[0].indexStart + i] * 3
        let local: readonly [number, number, number] = [
          shape.positions[offset],
          shape.positions[offset + 1],
          shape.positions[offset + 2]
        ]
        if (placement) {
          const c = Math.cos(placement.yaw),
            s = Math.sin(placement.yaw)
          local = [
            placement.position[0] + c * local[0] + s * local[2],
            placement.position[1] + local[1],
            placement.position[2] - s * local[0] + c * local[2]
          ]
        }
        return new Vector3(...transformRobotPoint(descriptor, local))
      })
      const centre = points[0]
        .clone()
        .add(points[1])
        .add(points[2])
        .multiplyScalar(1 / 3)
      const normal = points[1]
        .clone()
        .sub(points[0])
        .cross(points[2].clone().sub(points[0]))
        .normalize()
      if (!normal.length()) return []
      const distances = normal.toArray().map((v, axis) => {
        if (v > 0) return (centre.toArray()[axis] - item.bounds.min[axis]) / v
        if (v < 0) return (centre.toArray()[axis] - item.bounds.max[axis]) / v
        return Infinity
      })
      const beyond = Math.min(...distances.filter((v) => v >= 0)) + 0.02
      const origin = centre.clone().addScaledVector(normal, 0.02)
      const target = centre.clone().addScaledVector(normal, -beyond)
      if (
        ![origin, target].every((p) =>
          p
            .toArray()
            .every(
              (v, axis) =>
                v > volume.min[axis] + 0.001 && v < volume.max[axis] - 0.001
            )
        )
      )
        return []
      const bounds = {
        min: target.toArray().map((v) => v - 0.0001) as [
          number,
          number,
          number
        ],
        max: target.toArray().map((v) => v + 0.0001) as [number, number, number]
      }
      if (
        !bounds.min.some(
          (v, axis) =>
            v > item.bounds.max[axis] ||
            bounds.max[axis] < item.bounds.min[axis]
        )
      )
        return []
      return [{ item, patch, origin, normal, bounds }]
    })[0]
    if (!leaf) throw new Error('Missing actual source-separated leaf scenario')
    const leafConfig = {
      ...config,
      camera: {
        ...config.camera,
        localPose: {
          position: leaf.origin.toArray(),
          rotation: new Quaternion()
            .setFromUnitVectors(
              new Vector3(0, 0, 1),
              leaf.normal.clone().negate()
            )
            .toArray()
        },
        halfWidthSlope: 10,
        halfHeightSlope: 10
      },
      model: { ...config.model, maxCandidates: 4096, maxRays: 64 }
    }
    runtime.configureWalkingObservationScenario(leafConfig, dynamics)
    const seen = runtime.observeWalkingAction({
      ...request,
      actionBounds: leaf.bounds
    })
    if (seen.status !== 'available') throw new Error(seen.reason)
    expect(seen.observation.coverage).toBe('partial')
    const leafHit = seen.observation.detections.find(
      (d) => d.kind === 'static' && d.anatomy.includes(leaf.patch)
    )
    if (!leafHit || leafHit.kind !== 'static')
      throw new Error('Missing actual canonical crop hit')
    expect(leafHit.mesh.origin).toBe(leaf.item.mesh)
    expect(leafHit.region).toBe(leaf.item.region)
    expect(leafHit.instance).toBe(leaf.item.instance)
    expect(seen.observation.work.candidateVisits).toBeGreaterThan(0)
    expect(seen.observation.work.rayTriangles).toBeGreaterThan(0)
    expect(seen.work.farmMembershipBuilds).toBe(0)
    expect(seen.observation.work.indexBuilds).toBe(0)
    const seenAgain = runtime.observeWalkingAction({
      ...request,
      actionBounds: leaf.bounds
    })
    if (seenAgain.status !== 'available') throw new Error(seenAgain.reason)
    expect(seenAgain.observation.work.membershipBuilds).toBe(0)
    expect(seenAgain.observation.work.membershipVisits).toBe(0)
    expect(seenAgain.observation.work.rayTriangles).toBe(
      seen.observation.work.rayTriangles
    )
    const originalWorldQuery = RayQueries.prototype.queryWalkingWorld
    const uncertain = vi.spyOn(RayQueries.prototype, 'queryWalkingWorld')
    uncertain.mockImplementation(function (
      this: RayQueries,
      source,
      batch,
      candidates
    ) {
      const result = originalWorldQuery.call(this, source, batch, candidates)
      return {
        ...result,
        results: result.results.map(() => ({
          status: 'unknown' as const,
          reason: 'formal-unresolved-optical-ray'
        }))
      }
    })
    try {
      const unknown = runtime.observeWalkingAction({
        ...request,
        actionBounds: leaf.bounds
      })
      if (unknown.status !== 'available') throw new Error(unknown.reason)
      expect(unknown.observation.coverage).not.toBe('complete-empty')
      expect(unknown.observation.reasons).toContain('unresolved-ray')
      expect(unknown.observation.detections).toHaveLength(0)
    } finally {
      uncertain.mockRestore()
    }
    await runtime.setSceneDemandConfiguration({
      ...runtime.getSceneDemandConfiguration(),
      evidence: {
        kind: 'synthetic',
        id: 'successor-survey',
        label: 'Successor survey'
      }
    })
    expect(runtime.isCurrentWalkingActionObservation(seen.observation)).toBe(
      false
    )
    runtime.configureWalkingObservationScenario(config, dynamics)
    const beforeSelection = runtime.observeWalkingAction(request)
    if (beforeSelection.status !== 'available')
      throw new Error(beforeSelection.reason)
    await runtime.setWalkingRuntimeSelection(
      createWalkingRuntimeSelection(
        createSyntheticWalkingRobotDefinition({
          definitionId: 'successor-walking-source',
          sourceProfile: 'solid-articulation/2'
        })
      )
    )
    expect(
      runtime.isCurrentWalkingActionObservation(beforeSelection.observation)
    ).toBe(false)
    const beforeFarm = runtime.observeWalkingAction(request)
    if (beforeFarm.status !== 'available') throw new Error(beforeFarm.reason)
    expect(
      Object.values(beforeFarm.work.sourcePreparation).every(
        (value) => value === 0
      )
    ).toBe(true)
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: 2.3
    })
    expect(
      runtime.isCurrentWalkingActionObservation(beforeFarm.observation)
    ).toBe(false)
    await runtime.dispose()
    expect(runtime.isCurrentWalkingActionObservation(third.observation)).toBe(
      false
    )
    expect(() => runtime.observeWalkingAction(request)).toThrow()
  } finally {
    await runtime.dispose()
    vi.unstubAllGlobals()
  }
}, 45000)
