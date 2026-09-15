import * as greenhouse from '../../domain/greenhouse'
import { RenderMesh } from '@asyra/render'
import {
  SPATIAL_PROPERTY,
  type SpatialDescriptor
} from '../../engine/spatial-contract'
import { InstancedMesh, Quaternion, Vector3, type BufferGeometry } from 'three'
// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import * as crops from '../../domain/crop-models'
import * as robotModel from '../../domain/robot-model'
import { REST_JOINTS, transformRobotPoint } from '../../domain/robot-kinematics'
import * as projection from '../../render-app/site-projection'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import { bootstrap } from '../bootstrap'
import * as navigation from '../../render-app/camera-navigation'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import {
  DEFAULT_WALKING_RUNTIME_SELECTION,
  createWalkingRuntimeSelection
} from '../../domain/walking-runtime-selection'
import { SpatialLayer } from '../../render-app/spatial-layer'
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
    const beforeFarm = runtime.observeWalkingAction(request)
    if (beforeFarm.status !== 'available') throw new Error(beforeFarm.reason)
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: 2.3
    })
    expect(
      runtime.isCurrentWalkingActionObservation(beforeFarm.observation)
    ).toBe(false)
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
    await runtime.dispose()
    expect(runtime.isCurrentWalkingActionObservation(third.observation)).toBe(
      false
    )
    expect(() => runtime.observeWalkingAction(request)).toThrow()
  } finally {
    await runtime.dispose()
    vi.unstubAllGlobals()
  }
}, 15000)

it.each(['navigation', 'history', 'redo-branch', 'soil-edit'] as const)(
  'preserves runtime ownership and disposal for %s',
  async (mode) => {
    const structure = vi.spyOn(greenhouse, 'createStructure')
    const updates = vi.spyOn(RenderMesh.prototype, 'update')
    const build = vi.spyOn(projection, 'buildSiteMeshes')
    const cropBuild = vi.spyOn(crops, 'createCropModels')
    const robotBuild = vi.spyOn(robotModel, 'createRobotModel')
    const preset = vi.spyOn(projection, 'cameraPreset')
    let measurementMs = 0
    const measureScene = navigation.measureScene
    const measure = vi
      .spyOn(navigation, 'measureScene')
      .mockImplementation((...args) => {
        const started = performance.now()
        const result = measureScene(...args)
        measurementMs += performance.now() - started
        return result
      })
    const pan = vi.spyOn(navigation, 'panCamera')
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
    let pending: FrameRequestCallback | undefined
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        disconnect = disconnect
      }
    )
    const host = document.createElement('div')
    host.getBoundingClientRect = () => new DOMRect(0, 0, 640, 480)
    const runtime = await bootstrap(
      host,
      () =>
        new ThreeEngine({
          createDriver: () => driver,
          requestFrame: (cb) => {
            pending = cb
            return 1
          },
          cancelFrame: () => {
            pending = undefined
          }
        })
    )
    const flush = () => {
      const callback = pending
      pending = undefined
      callback?.(0)
    }
    try {
      flush()
      const initialScene = runtime.getScene()
      const initialSceneDemand = runtime.getSceneDemand()
      expect(runtime.getSceneDemand()).toBe(initialSceneDemand)
      expect(runtime.isCurrentSceneDemand(initialSceneDemand)).toBe(true)
      const dockSource = runtime.getDockSource()
      expect(runtime.isCurrentDockSource(dockSource)).toBe(true)
      const robotSource = runtime.getRobotSource()
      expect(runtime.isCurrentRobotSource(robotSource)).toBe(true)
      for (let i = 0; i < 3; i++) {
        expect(runtime.getDockSource() === dockSource).toBe(true)
        expect(runtime.getRobotSource()).toBe(robotSource)
        runtime.evaluateRobotPose(robotSource, REST_JOINTS)
      }
      expect(robotBuild).toHaveBeenCalledTimes(1)
      const notify = vi.fn(),
        unsubscribe = runtime.subscribe(notify)
      if (mode === 'navigation') {
        await runtime.setCamera('joint')
        runtime.pan(20, 10)
        const firstPan = pan.mock.results.at(-1)?.value
        const firstInput = pan.mock.calls.at(-1)?.[0]
        runtime.zoom(-10000)
        expect.soft(runtime.getZoom()).toBe(10000)
        runtime.pan(20, 10)
        const secondPan = pan.mock.results.at(-1)?.value
        const secondInput = pan.mock.calls.at(-1)?.[0]
        if (!firstInput || !secondInput)
          throw new Error('Missing camera commands')
        expect(secondInput.position).toEqual(firstPan.position)
        for (let axis = 0; axis < 3; axis++) {
          expect
            .soft(secondPan.target[axis] - secondInput.target[axis])
            .toBeCloseTo(firstPan.target[axis] - firstInput.target[axis], 8)
        }
        runtime.orbit(40, -12)
        runtime.pan(0, 0)
        const rotated = pan.mock.calls.at(-1)?.[0]
        expect(rotated?.target).toEqual(secondPan.target)
        expect(rotated?.position).not.toEqual(secondPan.position)
        runtime.actualSize()
        expect(runtime.getZoom()).toBe(100)
        await runtime.setCamera('overview')
        runtime.pan(0, 0)
        const beforeDolly = pan.mock.calls.at(-1)?.[0]
        runtime.dolly(-Math.log(2) * 1000)
        runtime.pan(0, 0)
        const afterDolly = pan.mock.calls.at(-1)?.[0]
        if (!beforeDolly || !afterDolly) throw new Error('Missing dolly camera')
        expect(runtime.getZoom()).toBe(200)
        expect(afterDolly.fov).toBe(beforeDolly.fov)
        expect(afterDolly.target).toEqual(beforeDolly.target)
        expect(navigation.cameraDistance(afterDolly)).toBeCloseTo(
          navigation.cameraDistance(beforeDolly) / 2
        )
        runtime.dolly(Math.log(2) * 1000)
        expect(runtime.getZoom()).toBe(100)
        runtime.dolly(-100000)
        expect(runtime.getZoom()).toBe(10000)
        runtime.actualSize()
        // World-space movement is independent of optical zoom and camera presets.
        const movementDistance = () => {
          runtime.pan(0, 0)
          const before = pan.mock.calls.at(-1)?.[0]
          runtime.move(0, 0, 1.5) // One second at the keyboard's base rate.
          runtime.pan(0, 0)
          const after = pan.mock.calls.at(-1)?.[0]
          if (!before || !after) throw new Error('Missing movement camera')
          expect(after.fov).toBe(before.fov)
          return Math.hypot(
            ...after.position.map((v, i) => v - before.position[i])
          )
        }
        const overviewSpeed = movementDistance()
        expect.soft(overviewSpeed).toBeCloseTo(6)
        runtime.zoom(-Math.log(4) / 0.001)
        expect.soft(movementDistance()).toBeCloseTo(overviewSpeed, 8)
        runtime.actualSize()
        runtime.zoom(-Math.log(15.21) / 0.001)
        expect(runtime.getZoom()).toBe(1521)
        const doorwaySpeed = movementDistance()
        expect.soft(doorwaySpeed).toBeGreaterThan(5)
        expect.soft(doorwaySpeed).toBeCloseTo(overviewSpeed, 8)
        runtime.zoom(-10000)
        const detailSpeed = movementDistance()
        expect.soft(detailSpeed).toBeCloseTo(overviewSpeed, 8)
        runtime.actualSize()
        expect.soft(movementDistance()).toBeCloseTo(overviewSpeed, 8)
        await runtime.setCamera('joint')
        const jointSpeed = movementDistance()
        expect.soft(jointSpeed).toBeCloseTo(overviewSpeed)
        runtime.zoom(-10000)
        expect.soft(movementDistance()).toBeCloseTo(jointSpeed, 8)
        const speedNotify = vi.fn()
        const stopSpeed = runtime.subscribeMovementSpeed(speedNotify)
        runtime.setMovementSpeed(0.1)
        expect(runtime.getMovementSpeed()).toBe(0.1)
        expect(movementDistance()).toBeCloseTo(0.1, 8)
        runtime.setMovementSpeed(0.1)
        expect(speedNotify).toHaveBeenCalledTimes(1)
        expect(() => runtime.setMovementSpeed(Number.NaN)).toThrow()
        expect(() => runtime.setMovementSpeed(0)).toThrow()
        expect(() => runtime.setMovementSpeed(61)).toThrow()
        expect(runtime.getMovementSpeed()).toBe(0.1)
        runtime.setMovementSpeed(6)
        stopSpeed()
        await runtime.setCamera('overview')
        notify.mockClear()
        const initial = runtime.getView()
        const presetCount = preset.mock.calls.length
        for (let i = 0; i < 20; i++) {
          runtime.move(0.01, -0.01, 0.02)
          runtime.dolly(1)
          runtime.look(1, -1)
          runtime.orbit(2, 1)
          runtime.zoom(1)
          runtime.pan(4, -2)
          flush()
        }
        runtime.fit()
        flush()
        runtime.actualSize()
        flush()
        expect(runtime.getZoom()).toBe(100)
        expect(preset).toHaveBeenCalledTimes(presetCount)
        expect(measure).toHaveBeenCalledTimes(1)
        expect(notify).not.toHaveBeenCalled()
        expect(runtime.getView()).toBe(initial)
        expect(runtime.getScene()).toBe(initialScene)
        expect(runtime.isCurrentScene(initialScene)).toBe(true)
        expect(build).toHaveBeenCalledTimes(1)
        await Promise.all([
          runtime.setLayer('film', false),
          runtime.setLayer('steel', false)
        ])
        flush()
        expect(runtime.getView().layers.film).toBe(false)
        expect(runtime.getView().layers.steel).toBe(false)
        await runtime.setOpacity(0.35)
        await runtime.setCamera('inside')
        flush()
        expect(runtime.getView().filmOpacity).toBe(0.35)
        expect(runtime.getView().camera).toBe('inside')
        await expect(runtime.setOpacity(Number.NaN)).rejects.toThrow()
        expect(runtime.getView().filmOpacity).toBe(0.35)
        expect(build).toHaveBeenCalledTimes(1)
        expect(pending).toBeUndefined()
      } else if (mode === 'soil-edit') {
        const initial = runtime.getConfiguration()
        const previous = build.mock.results[0].value as projection.SiteMesh[]
        const changed = {
          ...initial,
          strips: initial.strips.map((strip, i) =>
            i === 0 ? { ...strip, width: 1.1 } : strip
          )
        }
        const gpuGeometries = () => {
          const result = new Set<BufferGeometry>()
          const scene = vi.mocked(driver.render).mock.calls[0]?.[0]
          scene?.traverse((object) => {
            if (object instanceof InstancedMesh) result.add(object.geometry)
          })
          return result
        }
        const renderedInstances = () => {
          const result: string[] = []
          vi.mocked(driver.render).mock.calls[0]?.[0].traverse((object) => {
            if (object instanceof InstancedMesh)
              result.push(
                JSON.stringify([
                  object.geometry.uuid,
                  object.count,
                  object.matrixWorld.elements,
                  Array.from(object.instanceMatrix.array).slice(
                    0,
                    object.count * 16
                  )
                ])
              )
          })
          return result.sort().join('\n')
        }
        const originalRendered = renderedInstances()
        const originalGpu = gpuGeometries()
        expect(originalGpu.size).toBeGreaterThan(0)
        updates.mockClear()
        measurementMs = 0
        const started = performance.now()
        await runtime.setConfiguration(changed)
        const submitted = performance.now()
        flush()
        const flushed = performance.now()
        expect.soft(structure).toHaveBeenCalledTimes(1)
        const unchanged = previous.filter((mesh) =>
          ['steel', 'film', 'barriers', 'dimensions', 'base'].includes(mesh.id)
        )
        for (const mesh of unchanged) {
          expect
            .soft(
              updates.mock.calls.some(
                ([patch]) =>
                  (
                    patch?.[SPATIAL_PROPERTY] as
                      Extract<SpatialDescriptor, { kind: 'mesh' }> | undefined
                  )?.shape === mesh.descriptor.shape
              )
            )
            .toBe(false)
          expect
            .soft(
              (build.mock.results.at(-1)?.value as projection.SiteMesh[]).find(
                (next) => next.id === mesh.id
              )?.descriptor === mesh.descriptor
            )
            .toBe(true)
        }
        const nextGpu = gpuGeometries()
        expect(nextGpu.size).toBe(originalGpu.size)
        expect([...nextGpu].every((shape) => originalGpu.has(shape))).toBe(true)
        const next = build.mock.results.at(-1)?.value as projection.SiteMesh[]
        if (process.env.FIELDSCOPE_PROFILE === '1')
          // eslint-disable-next-line no-console -- Opt-in permanent timing evidence accompanies deterministic work assertions.
          console.log(
            JSON.stringify({
              updateMs: submitted - started,
              measurementMs,
              flushMs: flushed - submitted,
              cropBuilds: cropBuild.mock.calls.length
            })
          )
        expect.soft(cropBuild).toHaveBeenCalledTimes(1)
        const before = previous.find((mesh) =>
          mesh.id.startsWith('cucumber-1914')
        )?.descriptor
        const after = next.find(
          (mesh) =>
            mesh.id ===
            previous.find((item) => item.id.startsWith('cucumber-1914'))?.id
        )?.descriptor
        if (!before || !after)
          throw new Error('Missing planted crop descriptors')
        expect.soft(after.shape === before.shape).toBe(true)
        expect(after.instances).not.toEqual(before.instances)
        for (const layer of ['supports', 'net', 'ties', 'clips']) {
          const originals = previous.filter((mesh) => mesh.layer === layer)
          const updates = next.filter((mesh) => mesh.layer === layer)
          expect
            .soft(updates.every((mesh) => !!mesh.descriptor.instances))
            .toBe(true)
          expect
            .soft(
              updates.every(
                (mesh, i) =>
                  mesh.descriptor.shape === originals[i]?.descriptor.shape
              )
            )
            .toBe(true)
        }

        const changedRendered = renderedInstances()
        expect(changedRendered === originalRendered).toBe(false)
        await runtime.undo()
        flush()
        expect(renderedInstances() === originalRendered).toBe(true)
        await runtime.redo()
        flush()
        expect(renderedInstances() === changedRendered).toBe(true)
        expect(runtime.getConfiguration()).toEqual(changed)
        expect.soft(cropBuild).toHaveBeenCalledTimes(1)
      } else {
        const configNotify = vi.fn()
        const stopConfig = runtime.subscribeConfiguration(configNotify)
        const originalConfig = runtime.getConfiguration()
        const depth = runtime.getUndoDepth()
        const changedConfig = {
          ...originalConfig,
          width: 8,
          length: 12.7,
          height: 4.5,
          netTop: 2.6,
          netBottom: 0.5,
          topExtension: 0.3,
          soilInset: 0.12,
          startInset: 0.4,
          endInset: 0.8,
          strips: [
            { id: 'fixture-1', kind: 'drain' as const, width: 0.3 },
            { id: 'fixture-2', kind: 'soil' as const, width: 1 },
            { id: 'fixture-3', kind: 'drain' as const, width: 0.3 },
            { id: 'fixture-4', kind: 'soil' as const, width: 2 }
          ]
        }
        if (mode === 'history') {
          const configurationPresetCount = preset.mock.calls.length
          await runtime.setConfiguration(changedConfig)
          flush()
          expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 1)
          expect(runtime.getConfiguration()).toEqual(changedConfig)
          expect(runtime.isCurrentScene(initialScene)).toBe(false)
          expect(runtime.getScene().revision).not.toBe(initialScene.revision)
          expect(runtime.getUndoDepth()).toBe(depth + 1)
          expect(build).toHaveBeenCalledTimes(2)
          expect(measure).toHaveBeenCalledTimes(2)
          expect(configNotify).toHaveBeenCalledTimes(1)
          runtime.orbit(5, 2)
          runtime.zoom(5)
          flush()
          expect(build).toHaveBeenCalledTimes(2)
          await runtime.undo()
          flush()
          expect(runtime.getConfiguration()).toEqual(originalConfig)
          expect(runtime.getUndoDepth()).toBe(depth)
          expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 2)
          expect(build).toHaveBeenCalledTimes(3)
          await runtime.redo()
          flush()
          expect(runtime.getConfiguration()).toEqual(changedConfig)
          expect(runtime.isCurrentScene(initialScene)).toBe(false)
          expect(runtime.getScene().revision).not.toBe(initialScene.revision)
          expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 3)
          expect(build).toHaveBeenCalledTimes(4)
          await expect(
            runtime.setConfiguration({ ...changedConfig, netBottom: 4 })
          ).rejects.toThrow()
          expect(runtime.getConfiguration()).toEqual(changedConfig)
          expect(runtime.isCurrentScene(initialScene)).toBe(false)
          expect(runtime.getScene().revision).not.toBe(initialScene.revision)
          expect(build).toHaveBeenCalledTimes(4)
          expect(runtime.getUndoDepth()).toBe(depth + 1)
          await runtime.setConfiguration(changedConfig)
          expect(build).toHaveBeenCalledTimes(4)
        } else {
          await runtime.setConfiguration(changedConfig)
          await runtime.undo()
          flush()
          await runtime.setConfiguration({ ...originalConfig, length: 20 })
          await runtime.redo()
          flush()
          expect(runtime.getConfiguration().length).toBe(20)
        }
        stopConfig()
      }
      expect(runtime.getRobotSource()).toBe(robotSource)
      expect(robotBuild).toHaveBeenCalledTimes(1)
      unsubscribe()
    } finally {
      const staleSceneDemand = runtime.getSceneDemand()
      await runtime.dispose()
      expect(driver.dispose).toHaveBeenCalledTimes(1)
      expect(disconnect).toHaveBeenCalledTimes(1)
      expect(() => runtime.orbit(1, 1)).toThrow()
      expect(() => runtime.getScene()).toThrow()
      expect(runtime.isCurrentSceneDemand(staleSceneDemand)).toBe(false)
      expect(() => runtime.getSceneDemand()).toThrow()
      expect(() => runtime.getRobotSource()).toThrow()
      expect(() => runtime.getDockSource()).toThrow()
      await runtime.dispose()
      expect(cropBuild).toHaveBeenCalledTimes(
        mode === 'soil-edit' || mode === 'navigation' ? 1 : 2
      )
      structure.mockRestore()
      updates.mockRestore()
      cropBuild.mockRestore()
      robotBuild.mockRestore()
      build.mockRestore()
      preset.mockRestore()
      measure.mockRestore()
      pan.mockRestore()
      vi.unstubAllGlobals()
    }
  },
  15000
)

it('selects one walking runtime through Core history and keeps W2 work out of W1 and camera refreshes', async () => {
  const submissions = vi.spyOn(SpatialLayer.prototype, 'submit')
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
  let pending: FrameRequestCallback | undefined
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
        requestFrame: (callback) => {
          pending = callback
          return 1
        },
        cancelFrame: () => {
          pending = undefined
        }
      })
  )
  const flush = () => {
    const callback = pending
    pending = undefined
    callback?.(0)
  }
  try {
    flush()
    expect(runtime.getWalkingRuntimeSelection()).toBe(
      DEFAULT_WALKING_RUNTIME_SELECTION
    )
    expect(runtime.getWalkingOperatingReport().status).toBe('legacy-view')
    const selection = createWalkingRuntimeSelection(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'bootstrap-walking-runtime'
      })
    )
    await runtime.setWalkingRuntimeSelection(selection)
    flush()
    const active = runtime.getWalkingOperatingReport()
    expect(active.status).not.toBe('legacy-view')
    if (active.status === 'legacy-view' || !active.envelope)
      throw new Error('Missing active walking report')
    expect(active.selection).toEqual(selection)
    const source = active.source
    const envelope = active.envelope
    const demand = active.demand
    runtime.move(0.1, 0, 0)
    runtime.zoom(1)
    expect(runtime.getWalkingOperatingReport()).toBe(active)
    const currentnessDuringDemandNotification = vi.fn()
    const stopDemand = runtime.subscribeSceneDemand(() => {
      currentnessDuringDemandNotification(
        runtime.isCurrentWalkingOperatingReport(active)
      )
    })
    const farmFrames = submissions.mock.calls.length
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: runtime.getConfiguration().length + 0.1
    })
    expect(submissions).toHaveBeenCalledTimes(farmFrames + 1)
    const refreshed = runtime.getWalkingOperatingReport()
    if (refreshed.status === 'legacy-view' || !refreshed.envelope)
      throw new Error('Missing refreshed walking report')
    expect(refreshed.source).toBe(source)
    expect(refreshed.envelope).toBe(envelope)
    expect(refreshed.demand).not.toBe(demand)
    expect(currentnessDuringDemandNotification).toHaveBeenCalledWith(false)
    stopDemand()
    await runtime.undo()
    expect(runtime.getWalkingRuntimeSelection()).toEqual(selection)
    await runtime.undo()
    expect(runtime.getWalkingRuntimeSelection()).toBe(
      DEFAULT_WALKING_RUNTIME_SELECTION
    )
    expect(runtime.getWalkingOperatingReport().status).toBe('legacy-view')
    await runtime.redo()
    expect(runtime.getWalkingRuntimeSelection()).toEqual(selection)
    expect(runtime.getWalkingOperatingReport().status).not.toBe('legacy-view')
    const reportBeforeDemandOnlyRefresh = runtime.getWalkingOperatingReport()
    const demandOnlyFrames = submissions.mock.calls.length
    await runtime.setSceneDemandConfiguration({
      ...runtime.getSceneDemandConfiguration(),
      evidence: {
        kind: 'synthetic',
        id: 'bootstrap-report-only-refresh',
        label: 'Synthetic report-only refresh'
      }
    })
    const reportAfterDemandOnlyRefresh = runtime.getWalkingOperatingReport()
    expect(reportAfterDemandOnlyRefresh).not.toBe(reportBeforeDemandOnlyRefresh)
    expect(
      runtime.isCurrentWalkingOperatingReport(reportAfterDemandOnlyRefresh)
    ).toBe(true)
    expect(submissions).toHaveBeenCalledTimes(demandOnlyFrames)
    const stale = runtime.getWalkingOperatingReport()
    await runtime.dispose()
    expect(runtime.isCurrentWalkingOperatingReport(stale)).toBe(false)
  } finally {
    await runtime.dispose()
    submissions.mockRestore()
    vi.unstubAllGlobals()
  }
}, 15000)
