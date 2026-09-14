// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import * as projection from '../../render-app/site-projection'
import * as sceneDemand from '../../simulation/scene-demand'
import type { SceneDemandConfiguration } from '../../domain/scene-demand-configuration'
import { bootstrap } from '../bootstrap'

it('owns versioned scene demand history, invalidation, stable reads and disposal', async () => {
  const builds = vi.spyOn(projection, 'buildSiteMeshes')
  const preparations = vi.spyOn(sceneDemand, 'prepareSceneDemand')
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
