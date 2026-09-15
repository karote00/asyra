import { Quaternion, Vector3 } from 'three'
// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { transformRobotPoint } from '../../domain/robot-kinematics'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import { bootstrap } from '../bootstrap'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { createWalkingRuntimeSelection } from '../../domain/walking-runtime-selection'
import { RayQueries } from '../../simulation/ray-query'

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
