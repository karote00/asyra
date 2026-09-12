// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { bootstrap } from '../bootstrap'
import { SpatialLayer } from '../../render-app/spatial-layer'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import * as farm from '../../render-app/site-projection'
import * as robot from '../../domain/robot-configuration'
import * as navigation from '../../render-app/camera-navigation'

it('owns robot patches, history and derived work without rebuilding the farm', async () => {
  const submissions = vi.spyOn(SpatialLayer.prototype, 'submit')
  const pan = vi.spyOn(navigation, 'panCamera')
  const builds = vi.spyOn(farm, 'buildSiteMeshes')
  const assessments = vi.spyOn(robot, 'assessRobotDesign')
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
    const notify = vi.fn()
    runtime.subscribeRobot(notify)
    runtime.focusRobot()
    runtime.pan(0, 0)
    expect(pan.mock.calls.at(-1)?.[0].position[2]).toBeLessThan(
      runtime.getRobot().settings.dockZ
    )
    const initial = runtime.getRobot()
    const depth = runtime.getUndoDepth()
    await expect(runtime.patchRobot({ width: 0 })).rejects.toThrow()
    await expect(
      runtime.patchRobot({ nextWorkWh: 1e308, returnWh: 1e308 })
    ).rejects.toThrow()
    expect(runtime.getUndoDepth()).toBe(depth)
    expect(runtime.getRobot()).toBe(initial)
    expect(runtime.getUndoDepth()).toBe(depth)
    await Promise.all([
      runtime.patchRobot({ width: 0.6 }),
      runtime.patchRobot({ patrolMinutes: 90 })
    ])
    expect(runtime.getRobot().settings.width).toBe(0.6)
    expect(runtime.getRobot().settings.patrolMinutes).toBe(90)
    expect(runtime.getUndoDepth()).toBe(depth + 2)
    await runtime.undo()
    expect(runtime.getRobot().settings.patrolMinutes).toBe(120)
    expect(runtime.getRobot().settings.width).toBe(0.6)
    await runtime.redo()
    expect(runtime.getRobot().settings.patrolMinutes).toBe(90)
    const count = assessments.mock.calls.length
    const notices = notify.mock.calls.length
    await runtime.patchRobot({ width: 0.6 })
    runtime.zoom(20)
    runtime.move(1, 0, 0)
    runtime.getRobot()
    runtime.getRobot()
    expect(assessments).toHaveBeenCalledTimes(count)
    expect(notify).toHaveBeenCalledTimes(notices)
    expect(builds).toHaveBeenCalledTimes(1)
    const frames = submissions.mock.calls.length
    await runtime.setConfiguration({
      ...runtime.getConfiguration(),
      length: 20
    })
    expect(submissions).toHaveBeenCalledTimes(frames + 1)
    expect(runtime.getRobot().lane).toBeNull()
    expect(runtime.getRobot().settings.end).toBe(49.5)
    await runtime.undo()
    expect(runtime.getRobot().lane?.status).toBe('unverified')
    expect(runtime.getRobot().settings.patrolMinutes).toBe(90)
  } finally {
    await runtime.dispose()
    expect(() => runtime.patchRobot({ width: 0.7 })).toThrow(/closed|retired/)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  }
}, 15000)
