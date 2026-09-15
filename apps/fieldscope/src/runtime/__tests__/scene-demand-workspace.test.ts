// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import core from '@asyra/core'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import * as projection from '../../render-app/site-projection'
import * as sceneDemand from '../../simulation/scene-demand'
import type { SceneDemandConfiguration } from '../../domain/scene-demand-configuration'
import { bootstrap } from '../bootstrap'
import { createSceneDemandWorkspace } from '../scene-demand-workspace'
import * as sceneDemandWorkspaceModule from '../scene-demand-workspace'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../../domain/farm-configuration'

it('keeps lazy observation source work zero for the unknown route lifetime', () => {
  const farm = validateConfiguration(DEFAULT_CONFIGURATION)
  const scene = Object.freeze({
    revision: 1,
    meshes: Object.freeze([]),
    plants: Object.freeze([]),
    fruits: Object.freeze([])
  })
  const workspace = createSceneDemandWorkspace(
    () => farm,
    () => scene
  )
  try {
    const demand = workspace.get()
    for (let index = 0; index < 100; index++)
      expect(workspace.get()).toBe(demand)
    const observation = workspace.prepareObservationSpace()
    expect(observation.status).toBe('unknown')
    expect(workspace.prepareObservationSpace()).toBe(observation)
    expect(
      Object.values(workspace.getSourceWork()).every((value) => value === 0)
    ).toBe(true)
    expect(workspace.isCurrentObservationSpace(observation)).toBe(true)
    workspace.close()
    expect(workspace.isCurrentObservationSpace(observation)).toBe(false)
    expect(() => workspace.prepareObservationSpace()).toThrow()
  } finally {
    workspace.close()
    workspace.unregister()
    core.unregisterFeature('scene-demand.configuration.change')
  }
})

it('owns versioned scene demand history, invalidation, stable reads and disposal', async () => {
  const builds = vi.spyOn(projection, 'buildSiteMeshes')
  const preparations = vi.spyOn(sceneDemand, 'prepareSceneDemand')
  const workspaces = vi.spyOn(
    sceneDemandWorkspaceModule,
    'createSceneDemandWorkspace'
  )
  const sources = vi.spyOn(
    sceneDemand.SceneDemandSourceBoundsOwner.prototype,
    'source'
  )
  const wholeBounds = vi.spyOn(
    sceneDemand.SceneDemandSourceBoundsOwner.prototype,
    'wholeWorldBounds'
  )
  const inventories = vi.spyOn(
    sceneDemand.SceneDemandSourceBoundsOwner.prototype,
    'prepareInventory'
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
    }
  )
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
    const initial = runtime.getSceneDemand()
    const initialConfiguration = runtime.getSceneDemandConfiguration()
    expect(initial.status).toBe('unknown')
    expect(initial.configuration).toBe(initialConfiguration)
    expect(runtime.isCurrentSceneDemand(initial)).toBe(true)
    const first = vi.fn(),
      second = vi.fn()
    const stopFirst = runtime.subscribeSceneDemand(first)
    const stopSecond = runtime.subscribeSceneDemand(second)
    for (let index = 0; index < 100; index++)
      expect(runtime.getSceneDemand()).toBe(initial)
    expect(preparations).toHaveBeenCalledTimes(1)
    expect(sources).not.toHaveBeenCalled()
    expect(wholeBounds).not.toHaveBeenCalled()
    expect(inventories).not.toHaveBeenCalled()
    const sourceOwner = preparations.mock.calls[0][3]
    expect(sourceOwner).toBeInstanceOf(sceneDemand.SceneDemandSourceBoundsOwner)
    if (!sourceOwner) throw new Error('Missing shared source preparation owner')
    expect(Object.values(sourceOwner.work).every((value) => value === 0)).toBe(
      true
    )

    let draft: SceneDemandConfiguration = {
      ...initialConfiguration,
      evidence: {
        kind: 'synthetic' as const,
        id: 'runtime-survey',
        label: 'Synthetic runtime case'
      }
    }
    const fields = [
      () => draft,
      () => ({
        ...draft,
        growth: {
          kind: 'bounded' as const,
          coverage: 'complete' as const,
          volumes: []
        }
      }),
      () => ({
        ...draft,
        clearanceMargin: { kind: 'bounded' as const, metres: 0.03 }
      }),
      () => ({
        ...draft,
        route: {
          kind: 'soil-strip' as const,
          bay: 0,
          stripId: 'strip-3',
          from: 0.25,
          until: 0.45
        }
      })
    ]
    for (const change of fields) {
      draft = change()
      const beforeDemand = preparations.mock.calls.length
      const beforeScene = builds.mock.calls.length
      await runtime.setSceneDemandConfiguration(draft)
      expect(preparations).toHaveBeenCalledTimes(beforeDemand + 1)
      expect(preparations.mock.calls.at(-1)?.[3]).toBe(sourceOwner)
      expect(inventories).not.toHaveBeenCalled()
      expect(builds).toHaveBeenCalledTimes(beforeScene)
    }
    expect(first).toHaveBeenCalledTimes(4)
    expect(second).toHaveBeenCalledTimes(4)
    const completed = runtime.getSceneDemand()
    expect(completed).not.toBe(initial)
    expect(runtime.isCurrentSceneDemand(initial)).toBe(false)
    expect(runtime.getSceneDemandConfiguration()).toEqual(draft)

    const history = runtime.getUndoDepth()
    const beforeInvalid = preparations.mock.calls.length
    expect(() =>
      runtime.setSceneDemandConfiguration({ ...draft, version: 2 } as never)
    ).toThrow()
    expect(runtime.getUndoDepth()).toBe(history)
    expect(runtime.getSceneDemand()).toBe(completed)
    expect(preparations).toHaveBeenCalledTimes(beforeInvalid)
    await expect(
      runtime.setSceneDemandConfiguration({
        ...draft,
        route: {
          kind: 'soil-strip',
          bay: 0,
          stripId: 'missing-strip',
          from: 0.25,
          until: 0.45
        }
      })
    ).rejects.toThrow('Invalid scene demand configuration')
    await expect(
      runtime.setSceneDemandConfiguration({
        ...draft,
        route: {
          kind: 'soil-strip',
          bay: 0,
          stripId: 'strip-3',
          from: 0.25,
          until: runtime.getConfiguration().length + 1
        }
      })
    ).rejects.toThrow('Invalid scene demand configuration')
    expect(runtime.getUndoDepth()).toBe(history)
    expect(preparations).toHaveBeenCalledTimes(beforeInvalid)

    let before = preparations.mock.calls.length
    await runtime.undo()
    expect(preparations).toHaveBeenCalledTimes(before + 1)
    before = preparations.mock.calls.length
    await runtime.redo()
    expect(preparations).toHaveBeenCalledTimes(before + 1)

    const beforeFarmScene = builds.mock.calls.length
    before = preparations.mock.calls.length
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: 40
    })
    expect(builds).toHaveBeenCalledTimes(beforeFarmScene + 1)
    expect(preparations).toHaveBeenCalledTimes(before + 1)
    before = preparations.mock.calls.length
    runtime.getSceneDemand()
    runtime.getSceneDemandConfiguration()
    runtime.setMovementSpeed(5)
    await runtime.setCamera('top')
    await runtime.patchRobot({
      dockX: runtime.getRobot().settings.dockX + 0.1
    })
    expect(preparations).toHaveBeenCalledTimes(before)
    const workspace = workspaces.mock.results[0].value
    if (!workspace) throw new Error('Missing production scene demand workspace')
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: 2.2
    })
    expect(inventories).not.toHaveBeenCalled()
    const observation = workspace.prepareObservationSpace()
    expect(observation.status).toBe('complete')
    expect(observation.work.inventoryBuilds).toBe(1)
    expect(observation.demand).toBe(runtime.getSceneDemand())
    const preparedWork = workspace.getSourceWork()
    expect(workspace.prepareObservationSpace()).toBe(observation)
    expect(workspace.getSourceWork()).toEqual(preparedWork)
    await runtime.setSceneDemandConfiguration({
      ...runtime.getSceneDemandConfiguration(),
      clearanceMargin: { kind: 'bounded', metres: 0.04 }
    })
    expect(workspace.isCurrentObservationSpace(observation)).toBe(false)
    const routeRevision = workspace.prepareObservationSpace()
    expect(routeRevision.inventory).toBe(observation.inventory)
    expect(routeRevision.sources).toBe(observation.sources)
    expect(routeRevision.work.inventoryBuilds).toBe(0)
    expect(routeRevision.work.regionWorldBounds).toBe(0)
    expect(routeRevision.work.inventoryReuses).toBe(1)
    const inventoryBuilds = workspace.getSourceWork().inventoryBuilds
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: 2.3
    })
    expect(workspace.isCurrentObservationSpace(routeRevision)).toBe(false)
    expect(workspace.getSourceWork().inventoryBuilds).toBe(inventoryBuilds)
    const successor = workspace.prepareObservationSpace()
    expect(successor.inventory).not.toBe(observation.inventory)
    expect(successor.work.inventoryBuilds).toBe(1)
    expect(workspace.isCurrentObservationSpace(successor)).toBe(true)
    stopFirst()
    stopSecond()
  } finally {
    const stale = runtime.getSceneDemand()
    await runtime.dispose()
    expect(runtime.isCurrentSceneDemand(stale)).toBe(false)
    expect(() => runtime.getSceneDemand()).toThrow(/closed/)
    expect(() => runtime.getSceneDemandConfiguration()).toThrow(/closed/)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  }
}, 30000)
