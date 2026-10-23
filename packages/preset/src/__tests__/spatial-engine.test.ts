// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { runRenderEngineContract } from '@asyra/render-engine/testing'
import type {
  RenderEngineCommand,
  RenderEngineObjectHandle
} from '@asyra/render-engine'
import {
  ThreeEngine,
  createSpatialRenderEngine,
  type GraphicsDriver
} from '../spatial-engine.js'
import {
  SPATIAL_PROPERTY,
  type SpatialDescriptor
} from '../spatial-contract.js'

const camera: SpatialDescriptor = {
  kind: 'camera',
  position: [0, 0, 5],
  target: [0, 0, 0],
  fov: 60,
  near: 0.01,
  far: 100
}
const box: SpatialDescriptor = {
  kind: 'mesh',
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  shape: { kind: 'box', size: [1, 1, 1] },
  color: 0x00aaff,
  opacity: 1,
  wireframe: false,
  selectable: true
}
const hit = (engine: ThreeEngine, x = 320, y = 240) => {
  const result = engine.query({ type: 'hit-test', point: { x, y } })
  if (result.type !== 'hit') throw new Error('Expected a hit-query result')
  return result.target
}
const setup = (
  configureDriver?: (driver: GraphicsDriver) => void,
  resolution = 1
) => {
  const canvas = document.createElement('canvas')
  canvas.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 640,
    bottom: 480,
    width: 640,
    height: 480,
    toJSON: () => ({})
  })
  const driver: GraphicsDriver = {
    domElement: canvas,
    autoClear: true,
    shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap },
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    clear: vi.fn(),
    clearDepth: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn()
  }
  configureDriver?.(driver)
  let pending: FrameRequestCallback | undefined
  const engine = new ThreeEngine({
    createDriver: () => driver,
    requestFrame: (cb) => {
      pending = cb
      return 1
    },
    cancelFrame: () => {
      pending = undefined
    }
  })
  const root = engine.initialize({
    host: document.createElement('div'),
    width: 640,
    height: 480,
    resolution
  }).root
  const add = (spatial: SpatialDescriptor) => {
    const handle = engine.execute({
      type: 'create-object',
      requestId: 'test',
      objectType: spatial.kind === 'camera' ? 'container' : 'mesh',
      properties: { [SPATIAL_PROPERTY]: spatial }
    }).object
    if (!handle) throw new Error('Expected an object handle')
    engine.execute({ type: 'append-child', parent: root, child: handle })
    return handle
  }
  return {
    engine,
    driver,
    canvas,
    root,
    add,
    frame: () => {
      const cb = pending
      pending = undefined
      cb?.(1)
    }
  }
}

describe('CUSTOM Three engine', () => {
  it('disables shadow mapping for a detected software WebGL renderer', () => {
    const extension = { UNMASKED_RENDERER_WEBGL: 0x9246 }
    const getExtension = vi.fn((name: string) =>
      name === 'WEBGL_debug_renderer_info' ? extension : null
    )
    const getParameter = vi.fn(() => 'Google SwiftShader')
    let driver!: GraphicsDriver & {
      getContext: () => WebGLRenderingContext
    }
    const fixture = setup((value) => {
      driver = value as typeof driver
      driver.getContext = () =>
        ({ getExtension, getParameter }) as unknown as WebGLRenderingContext
    })

    fixture.engine.execute({ type: 'flush' })

    expect(getExtension).toHaveBeenCalledWith('WEBGL_debug_renderer_info')
    expect(getParameter).toHaveBeenCalledWith(extension.UNMASKED_RENDERER_WEBGL)
    expect(driver.shadowMap?.enabled).toBe(false)
    fixture.engine.destroy()
  })

  it('does not advertise or simulate unsupported subtree snapshots', () => {
    const { engine, driver, root } = setup()
    expect(engine.capabilities.has('snapshot')).toBe(false)
    expect(engine.capabilities.has('local-content-bounds')).toBe(false)
    expect(() =>
      engine.query({ type: 'get-local-content-bounds', object: root })
    ).toThrow(/does not support required capabilities: local-content-bounds/)
    expect(() =>
      engine.query({ type: 'snapshot', object: root, maxDimension: 1024 })
    ).toThrow(/does not support required capabilities: snapshot/)
    expect(driver.render).not.toHaveBeenCalled()
    engine.destroy()
  })

  it('bounds studio shadows, limits casters to solid selectable geometry and releases the light', () => {
    const { engine, driver, add } = setup()
    add(camera)
    add(box)
    engine.execute({ type: 'flush' })
    const scene = vi.mocked(driver.render).mock.calls[0][0]
    const key = scene.children.find(
      (value) => value instanceof THREE.DirectionalLight
    )
    if (!(key instanceof THREE.DirectionalLight))
      throw new Error('Missing key light')
    const ambient = scene.children.find(
      (value) => value instanceof THREE.HemisphereLight
    )
    if (!(ambient instanceof THREE.HemisphereLight))
      throw new Error('Missing ambient light')
    // Reflected daylight keeps the undersides of opaque leaves readable.
    expect(ambient.groundColor.g * ambient.intensity).toBeGreaterThan(0.5)
    expect(key.castShadow).toBe(true)
    expect(key.shadow.mapSize.toArray()).toEqual([1024, 1024])
    const mesh = scene.getObjectsByProperty('isMesh', true)[0]
    expect(mesh.castShadow).toBe(true)
    expect(mesh.receiveShadow).toBe(true)
    const dispose = vi.spyOn(key, 'dispose')
    engine.destroy()
    engine.destroy()
    expect(dispose).toHaveBeenCalledOnce()
  })
  it('retains live GPU resources for pose and appearance updates and replaces changed geometry', () => {
    const { engine, driver, add } = setup()
    add(camera)
    const handle = add(box)
    const renderedMesh = () => {
      engine.execute({ type: 'flush' })
      const scene = vi
        .mocked(driver.render)
        .mock.calls.find(([value]) =>
          value.children.some(
            (child) => child.getObjectsByProperty('isMesh', true).length
          )
        )?.[0]
      const mesh = scene?.getObjectsByProperty('isMesh', true)[0]
      if (!(mesh instanceof THREE.Mesh))
        throw new Error('Missing rendered mesh')
      return mesh as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshStandardMaterial
      >
    }
    const original = renderedMesh()
    const disposeGeometry = vi.spyOn(original.geometry, 'dispose')
    const disposeMaterial = vi.spyOn(original.material, 'dispose')
    for (let frame = 1; frame <= 120; frame++) {
      engine.execute({
        type: 'update-object',
        object: handle,
        properties: {
          [SPATIAL_PROPERTY]: {
            ...box,
            position: [frame / 120, 0, 0],
            color: 0xffffff,
            opacity: 0.5,
            wireframe: true
          }
        }
      })
      const mesh = renderedMesh()
      expect(mesh.geometry).toBe(original.geometry)
      expect(mesh.material).toBe(original.material)
      expect(mesh.material.opacity).toBe(0.5)
      expect(mesh.material.depthWrite).toBe(false)
      expect(mesh.material.color.getHex()).toBe(0xffffff)
    }
    expect(disposeGeometry).not.toHaveBeenCalled()
    expect(disposeMaterial).not.toHaveBeenCalled()
    engine.execute({
      type: 'update-object',
      object: handle,
      properties: {
        [SPATIAL_PROPERTY]: { ...box, shape: { kind: 'box', size: [2, 1, 1] } }
      }
    })
    expect(renderedMesh().geometry).not.toBe(original.geometry)
    expect(disposeGeometry).toHaveBeenCalledTimes(1)
    expect(disposeMaterial).toHaveBeenCalledTimes(1)
    engine.destroy()
  })
  it('rejects unsupported screen bridge properties and thick strokes instead of ignoring them', () => {
    const { engine, root } = setup()
    const create = (properties: Record<string, unknown> = {}) =>
      engine.execute({
        type: 'create-object',
        objectType: 'graphics',
        requestId: 'bridge',
        properties
      }).object
    for (const properties of [
      { skewX: 0.1 },
      { skewY: 0.1 },
      { alpha: 0.5 },
      { filters: [] }
    ])
      expect(() => create(properties)).toThrow('Unsupported screen')
    expect(() =>
      engine.execute({
        type: 'create-object',
        objectType: 'mesh',
        requestId: 'unimplemented-mesh',
        properties: {}
      })
    ).toThrow('spatial descriptor')
    const object = create()
    if (!object) throw new Error('Missing graphic')
    engine.execute({ type: 'append-child', parent: root, child: object })
    engine.execute({
      type: 'draw',
      object,
      operations: [
        { type: 'rect', x: 100, y: 100, width: 20, height: 20 },
        { type: 'fill', paint: { color: 0xffffff } }
      ]
    })
    expect(hit(engine, 110, 110)).toBe(object)
    expect(() =>
      engine.execute({
        type: 'draw',
        object,
        operations: [
          { type: 'move-to', x: 0, y: 0 },
          { type: 'line-to', x: 50, y: 50 },
          { type: 'stroke', width: 5, paint: { color: 0xffffff } }
        ]
      })
    ).toThrow('one device pixel')
    expect(hit(engine, 110, 110)).toBe(object)
    engine.destroy()
  })
  it('passes the shared engine lifecycle and opaque-handle contract', async () => {
    const fixture = setup()
    fixture.engine.destroy()
    const operations: string[] = []
    const report = await runRenderEngineContract({
      createEngine: () => {
        const engine = new ThreeEngine({ createDriver: () => fixture.driver })
        const execute = engine.execute.bind(engine)
        engine.execute = (command) => {
          operations.push(command.type)
          return execute(command)
        }
        return engine
      },
      emitInteraction: (engine, event) => engine.dispatchInteraction(event),
      getOperationTypes: () => operations
    })
    expect(report.interactions).toHaveLength(1)
    expect(report.operationTypes).toEqual([
      'create-resource',
      'create-object',
      'create-object',
      'append-child',
      'append-child',
      'draw',
      'update-object',
      'resize',
      'flush',
      'destroy-resource'
    ])
    expect(report.destroyResult.alreadyDestroyed).toBe(false)
    expect(report.engine.destroy().alreadyDestroyed).toBe(true)
  })

  it('uses perspective depth for selection and reflects complete pose updates', () => {
    const { engine, add } = setup()
    add(camera)
    const far = add({ ...box, position: [0, 0, -2] })
    const near = add(box)
    expect(hit(engine)).toBe(near)
    engine.execute({
      type: 'update-object',
      object: near,
      properties: { [SPATIAL_PROPERTY]: { ...box, position: [3, 0, 0] } }
    })
    expect(hit(engine)).toBe(far)
    engine.destroy()
  })

  it('projects camera changes and resize without changing geometry', () => {
    const { engine, add } = setup()
    const view = add(camera)
    const object = add(box)
    const first = engine.query({ type: 'get-bounds', object })
    expect(first.type).toBe('bounds')
    if (first.type !== 'bounds') throw new Error('Expected bounds')
    expect(first.bounds.x).toBeLessThan(320)
    expect(first.bounds.x + first.bounds.width).toBeGreaterThan(320)
    engine.execute({ type: 'resize', width: 1280, height: 960 })
    const resized = engine.query({ type: 'get-bounds', object })
    if (resized.type !== 'bounds') throw new Error('Expected bounds')
    expect(resized.bounds.width).toBeCloseTo(first.bounds.width * 2, 8)
    engine.execute({
      type: 'update-object',
      object: view,
      properties: { [SPATIAL_PROPERTY]: { ...camera, position: [0, 0, 10] } }
    })
    const distant = engine.query({ type: 'get-bounds', object })
    if (distant.type !== 'bounds') throw new Error('Expected bounds')
    expect(distant.bounds.width).toBeLessThan(resized.bounds.width)
    engine.destroy()
  })

  it('rejects invalid updates atomically and never accepts foreign handles', () => {
    const { engine, add } = setup()
    add(camera)
    const object = add(box)
    expect(() =>
      engine.execute({
        type: 'update-object',
        object,
        properties: { [SPATIAL_PROPERTY]: { ...box, rotation: [0, 0, 0, 0] } }
      })
    ).toThrow('Invalid spatial mesh')
    expect(hit(engine)).toBe(object)
    expect(() =>
      engine.query({
        type: 'get-bounds',
        object: {} as RenderEngineObjectHandle
      })
    ).toThrow('Foreign or destroyed')
    engine.destroy()
  })

  it('has one-shot scheduling and renders only on explicit flush', () => {
    const { engine, driver, frame } = setup()
    const callback = vi.fn()
    engine.requestFrame(callback)
    frame()
    frame()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(driver.render).not.toHaveBeenCalled()
    engine.execute({ type: 'flush' })
    expect(driver.render).toHaveBeenCalledTimes(2)
    engine.requestFrame(callback)
    engine.cancelFrame()
    frame()
    expect(callback).toHaveBeenCalledTimes(1)
    engine.destroy()
    expect(driver.dispose).toHaveBeenCalledOnce()
    expect(() => engine.execute({ type: 'flush' })).toThrow('not active')
  })

  it('preserves hierarchy on cycle errors and releases detached objects', () => {
    const { engine, root } = setup()
    const create = () => {
      const handle = engine.execute({
        type: 'create-object',
        objectType: 'container',
        requestId: 'group'
      }).object
      if (!handle) throw new Error('Expected an object handle')
      return handle
    }
    const parent = create(),
      child = create()
    engine.execute({ type: 'append-child', parent: root, child: parent })
    engine.execute({ type: 'append-child', parent, child })
    expect(() =>
      engine.execute({ type: 'append-child', parent: child, child: parent })
    ).toThrow('cycle')
    engine.execute({ type: 'remove-child', parent, child })
    engine.execute({ type: 'destroy-object', object: child })
    expect(engine.destroy().destroyedObjects).toBe(2)
  })

  it('keeps ordinary screen graphics selectable independently of spatial picking', () => {
    const { engine, root } = setup()
    const object = engine.execute({
      type: 'create-object',
      objectType: 'graphics',
      requestId: 'screen'
    }).object
    if (!object) throw new Error('Expected an object handle')
    engine.execute({ type: 'append-child', parent: root, child: object })
    engine.execute({
      type: 'draw',
      object,
      operations: [
        { type: 'rect', x: 0, y: 0, width: 20, height: 10 },
        { type: 'fill', paint: { color: 0xff0000 } }
      ]
    })
    engine.execute({
      type: 'update-object',
      object,
      properties: { x: 12, y: 24 }
    })
    expect(hit(engine, 20, 28)).toBe(object)
    expect(hit(engine, 40, 40)).toBeNull()
    engine.destroy()
  })

  it('suppresses stale callbacks even when a platform callback survives cancellation', () => {
    const fixture = setup()
    fixture.engine.destroy()
    const callbacks: FrameRequestCallback[] = []
    const engine = new ThreeEngine({
      createDriver: () => fixture.driver,
      requestFrame: (cb) => callbacks.push(cb),
      cancelFrame: () => undefined
    })
    engine.initialize({ host: {}, width: 10, height: 10 })
    const first = vi.fn(),
      second = vi.fn()
    engine.requestFrame(first)
    engine.requestFrame(second)
    callbacks[0](1)
    callbacks[1](2)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
    engine.destroy()
  })

  it('normalizes pointer coordinates and removes listeners on teardown', () => {
    const { engine, canvas, add } = setup()
    add(camera)
    const target = add(box)
    const listener = vi.fn()
    engine.subscribeToInteraction(listener)
    const event = new MouseEvent('pointerdown', {
      clientX: 320,
      clientY: 240,
      button: 0
    })
    canvas.dispatchEvent(event)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pointerdown',
        target,
        position: { x: 320, y: 240 }
      })
    )
    expect(listener.mock.calls[0][0].target).toBe(target)
    engine.destroy()
    canvas.dispatchEvent(event)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it.each([
    {
      type: 'create-resource',
      requestId: 'bad',
      descriptor: { kind: 'remote-url', data: 'https://invalid.example' }
    },
    { type: 'resize', width: 0, height: 2 }
  ] satisfies RenderEngineCommand[])(
    'rejects unsupported or invalid command $type',
    (command) => {
      const { engine } = setup()
      expect(() => engine.execute(command)).toThrow()
      engine.destroy()
    }
  )
})

it('cleans up a driver when initialization fails and rejects a second startup', () => {
  const fixture = setup()
  fixture.engine.destroy()
  const dispose = vi.mocked(fixture.driver.dispose)
  dispose.mockClear()
  fixture.driver.setSize = vi.fn(() => {
    throw new Error('Driver resize failed')
  })
  const engine = new ThreeEngine({ createDriver: () => fixture.driver })
  expect(() =>
    engine.initialize({
      host: document.createElement('div'),
      width: 640,
      height: 480
    })
  ).toThrow('Driver resize failed')
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(() =>
    engine.initialize({
      host: document.createElement('div'),
      width: 640,
      height: 480
    })
  ).toThrow()
  engine.destroy()
  expect(dispose).toHaveBeenCalledTimes(1)
})

it('rejects retired object handles while the runtime is still active', () => {
  const { engine, add } = setup()
  const object = add(box)
  engine.execute({ type: 'destroy-object', object })
  expect(() =>
    engine.execute({ type: 'update-object', object, properties: {} })
  ).toThrow()
  expect(() =>
    engine.query({ type: 'to-global', object, point: { x: 0, y: 0 } })
  ).toThrow()
  engine.destroy()
})

it('initializes the real deferred adapter and retains its resource lifetime', async () => {
  const fixture = setup()
  fixture.engine.destroy()
  vi.mocked(fixture.driver.dispose).mockClear()
  const engine = createSpatialRenderEngine({
    createDriver: () => fixture.driver
  })
  const { root } = await engine.initialize({
    host: document.createElement('div'),
    width: 640,
    height: 480
  })
  for (const descriptor of [camera, box]) {
    const object = engine.execute({
      type: 'create-object',
      requestId: 'deferred',
      objectType: descriptor.kind === 'mesh' ? 'mesh' : 'container',
      properties: { [SPATIAL_PROPERTY]: descriptor }
    }).object
    if (!object) throw new Error('Missing spatial object')
    engine.execute({ type: 'append-child', parent: root, child: object })
  }
  expect(
    engine.query({ type: 'hit-test', point: { x: 320, y: 240 } })
  ).toMatchObject({ type: 'hit', target: expect.any(Object) })
  engine.execute({ type: 'flush' })
  expect(fixture.driver.render).toHaveBeenCalled()
  engine.destroy()
  expect(fixture.driver.dispose).toHaveBeenCalledTimes(1)
})

it('rejects foreign and retired paint handles without consuming the owning resource', () => {
  const a = setup(),
    b = setup()
  const resource = a.engine.execute({
    type: 'create-resource',
    requestId: 'paint',
    descriptor: { kind: 'paint', data: { color: 0x123456 } }
  }).resource
  if (!resource) throw new Error('Missing paint resource')
  expect(() =>
    b.engine.execute({ type: 'destroy-resource', resource })
  ).toThrow(/Foreign/)
  expect(a.engine.execute({ type: 'destroy-resource', resource }).status).toBe(
    'applied'
  )
  expect(() =>
    a.engine.execute({ type: 'destroy-resource', resource })
  ).toThrow(/destroyed/)
  expect(a.engine.destroy().destroyedResources).toBe(0)
  b.engine.destroy()
})
