// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { ThreeEngine, type GraphicsDriver } from '../spatial-engine.js'
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
    if (!handle) {
      throw new Error('Expected an object handle')
    }
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

it('projects and unprojects logical surface coordinates independently of DPR and rejects legacy 3D conversion', () => {
  const f = setup(undefined, 2)
  const cam = f.add(camera)
  const object = f.add(box)
  expect(
    f.engine.query({ type: 'spatial-project', point: [0, 0, 0] })
  ).toMatchObject({
    type: 'spatial-projection',
    point: { x: 320, y: 240 },
    inFrustum: true
  })
  expect(
    f.engine.query({ type: 'spatial-project', point: [0, 0, 10] })
  ).toMatchObject({ inFrustum: false })
  expect(
    f.engine.query({ type: 'spatial-ray', point: { x: 320, y: 240 } })
  ).toEqual({
    type: 'spatial-ray',
    ray: { origin: [0, 0, 5], direction: [0, 0, -1] }
  })
  expect(
    f.engine.query({ type: 'spatial-ray', point: { x: 640, y: 240 } })
  ).toEqual({ type: 'spatial-ray', ray: null })
  expect(() =>
    f.engine.query({ type: 'to-local', object, point: { x: 0, y: 0 } })
  ).toThrow(/3D/)
  expect(() =>
    f.engine.query({ type: 'spatial-project', point: [NaN, 0, 0] })
  ).toThrow()
  f.engine.execute({ type: 'resize', width: 800, height: 400 })
  expect(
    f.engine.query({ type: 'spatial-project', point: [0, 0, 0] })
  ).toMatchObject({ point: { x: 400, y: 200 } })
  f.engine.execute({ type: 'destroy-object', object: cam })
  f.engine.destroy()
})
it('converts complete instance poses once and measures local/world full-shape bounds', () => {
  const f = setup()
  f.add(camera)
  const object = f.add({
    ...box,
    position: [3, 0, 0],
    instances: [
      {
        id: 'source-a',
        position: [2, 0, 0],
        rotation: [0, Math.sin(Math.PI / 2 / 2), 0, Math.cos(Math.PI / 2 / 2)]
      }
    ]
  })
  const world = f.engine.query({
    type: 'spatial-convert',
    object,
    point: [0, 0, 1],
    to: 'world',
    instanceIndex: 0
  })
  expect(world).toMatchObject({
    type: 'spatial-point',
    point: [6, 0, expect.closeTo(0, 10)]
  })
  expect(
    f.engine.query({
      type: 'spatial-convert',
      object,
      point: [6, 0, 0],
      to: 'local',
      instanceIndex: 0
    })
  ).toMatchObject({ point: [expect.closeTo(0, 10), 0, 1] })
  expect(
    f.engine.query({ type: 'spatial-bounds', object, space: 'local' })
  ).toMatchObject({
    bounds: {
      min: [1.5, -0.5, expect.closeTo(-0.5)],
      max: [2.5, 0.5, expect.closeTo(0.5)]
    }
  })
  expect(
    f.engine.query({ type: 'spatial-bounds', object, space: 'world' })
  ).toMatchObject({
    bounds: {
      min: [4.5, -0.5, expect.closeTo(-0.5)],
      max: [5.5, 0.5, expect.closeTo(0.5)]
    }
  })
  expect(() =>
    f.engine.query({
      type: 'spatial-convert',
      object,
      point: [0, 0, 0],
      to: 'world',
      instanceIndex: 1
    })
  ).toThrow()
  f.engine.execute({ type: 'destroy-object', object })
  expect(() =>
    f.engine.query({ type: 'spatial-bounds', object, space: 'world' })
  ).toThrow()
  f.engine.destroy()
})
it('returns full-shape source instance hits despite detail compaction, with stable submitted tie order', () => {
  const f = setup()
  f.add(camera)
  const object = f.add({
    ...box,
    opacity: 0,
    instances: [
      {
        id: 'offscreen',
        position: [100, 0, 0],
        rotation: [0, Math.sin(0 / 2), 0, Math.cos(0 / 2)]
      },
      {
        id: 'selected',
        position: [0, 0, 0],
        rotation: [0, Math.sin(0 / 2), 0, Math.cos(0 / 2)]
      }
    ],
    distant: {
      shape: { kind: 'box', size: [0.01, 0.01, 0.01] },
      maxError: 0.00001
    }
  })
  const second = f.add(box)
  f.engine.execute({ type: 'flush' })
  const query = {
    type: 'spatial-raycast',
    ray: { origin: [0.2, 0, 5], direction: [0, 0, -3] }
  } as const
  const result = f.engine.query(query)
  if (result.type !== 'spatial-hits') {
    throw new Error('Wrong query result')
  }
  expect(result.hits.map((h) => h.object)).toEqual([object, second])
  expect(result.hits[0]).toMatchObject({
    instanceIndex: 1,
    instanceId: 'selected',
    distance: 4.5
  })
  f.engine.execute({
    type: 'set-child-index',
    parent: f.root,
    child: second,
    index: 1
  })
  const reordered = f.engine.query(query)
  if (reordered.type !== 'spatial-hits') {
    throw new Error('Wrong query result')
  }
  expect(reordered.hits[0].object).toBe(second)
  f.engine.execute({
    type: 'update-object',
    object: second,
    properties: { visible: false }
  })
  const hidden = f.engine.query(query)
  if (hidden.type !== 'spatial-hits') {
    throw new Error('Wrong query result')
  }
  expect(hidden.hits).toHaveLength(1)
  f.engine.execute({
    type: 'update-object',
    object,
    properties: {
      [SPATIAL_PROPERTY]: {
        ...box,
        instances: [
          {
            id: 'selected',
            position: [0, 0, 0],
            rotation: [0, Math.sin(0 / 2), 0, Math.cos(0 / 2)]
          },
          {
            id: 'offscreen',
            position: [100, 0, 0],
            rotation: [0, Math.sin(0 / 2), 0, Math.cos(0 / 2)]
          }
        ]
      }
    }
  })
  const replaced = f.engine.query(query)
  if (replaced.type !== 'spatial-hits') {
    throw new Error('Wrong query result')
  }
  expect(replaced.hits[0]).toMatchObject({
    instanceIndex: 0,
    instanceId: 'selected'
  })
  expect(
    f.engine.query({ type: 'hit-test', point: { x: -1, y: 240 } })
  ).toMatchObject({ target: null })
  f.engine.destroy()
})

it('rejects invalid instance bounds and foreign or detached objects, and returns no bounds for empty content', () => {
  const f = setup(),
    other = setup()
  const cameraObject = f.add(camera),
    foreign = other.add(box),
    object = f.add(box)
  expect(() =>
    f.engine.query({
      type: 'spatial-bounds',
      object: cameraObject,
      space: 'local',
      instanceIndex: 0
    })
  ).toThrow(/instance/)
  expect(
    f.engine.query({
      type: 'spatial-bounds',
      object: cameraObject,
      space: 'local'
    })
  ).toEqual({ type: 'spatial-bounds', bounds: null })
  expect(() =>
    f.engine.query({ type: 'spatial-bounds', object: foreign, space: 'world' })
  ).toThrow()
  f.engine.execute({ type: 'remove-child', parent: f.root, child: object })
  expect(() =>
    f.engine.query({ type: 'spatial-bounds', object, space: 'world' })
  ).toThrow(/Detached/)
  expect(() =>
    f.engine.query({
      type: 'spatial-raycast',
      ray: { origin: [0, 0, 0], direction: [0, 0, 0] }
    })
  ).toThrow()
  expect(f.engine.query({ type: 'spatial-project', point: [0, 0, 5] })).toEqual(
    { type: 'spatial-projection', point: null, depth: null, inFrustum: false }
  )
  expect(
    f.engine.query({ type: 'spatial-project', point: [0, 0, 4.999] })
  ).toMatchObject({ inFrustum: false })
  expect(
    f.engine.query({ type: 'spatial-project', point: [0, 0, -100] })
  ).toMatchObject({ inFrustum: false })
  f.engine.destroy()
  other.engine.destroy()
})

it('prioritizes eligible screen overlays and reuses full geometry across repeated queries', () => {
  const f = setup()
  f.add(camera)
  const object = f.add(box)
  const overlay = f.engine.execute({
    type: 'create-object',
    objectType: 'graphics',
    requestId: 'overlay'
  }).object
  if (!overlay) {
    throw new Error('Missing overlay')
  }
  f.engine.execute({ type: 'append-child', parent: f.root, child: overlay })
  f.engine.execute({
    type: 'draw',
    object: overlay,
    operations: [
      { type: 'rect', x: 300, y: 220, width: 40, height: 40 },
      { type: 'fill', paint: { color: 0xff0000 } }
    ]
  })
  expect(
    f.engine.query({ type: 'spatial-pick', point: { x: 320, y: 240 } })
  ).toEqual({ type: 'spatial-pick', overlay, hit: null })
  f.engine.execute({
    type: 'update-object',
    object: overlay,
    properties: { eventMode: 'none' }
  })
  const cast = vi.spyOn(THREE.Mesh.prototype, 'raycast'),
    dispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose')
  for (let i = 0; i < 3; i++) {
    expect(
      f.engine.query({ type: 'spatial-pick', point: { x: 320, y: 240 } })
    ).toMatchObject({ overlay: null, hit: { object } })
  }
  expect(cast).toHaveBeenCalledTimes(3)
  const meshes = cast.mock.contexts as THREE.Mesh[]
  expect(meshes[1].geometry).toBe(meshes[0].geometry)
  expect(meshes[2].geometry).toBe(meshes[0].geometry)
  expect(dispose).not.toHaveBeenCalled()
  cast.mockRestore()
  dispose.mockRestore()
  f.engine.execute({
    type: 'update-object',
    object,
    properties: { [SPATIAL_PROPERTY]: { ...box, selectable: false } }
  })
  expect(
    f.engine.query({ type: 'spatial-pick', point: { x: 320, y: 240 } })
  ).toMatchObject({ hit: null })
  f.engine.destroy()
})

it('applies nonuniform mesh and instance scale to query conversion and full-shape bounds without baking geometry', () => {
  const f = setup()
  f.add(camera)
  const object = f.add({
    ...box,
    position: [10, 0, 0],
    scale: [2, 3, 4],
    instances: [
      {
        id: 'scaled',
        position: [1, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [2, 1, 1]
      }
    ]
  })
  expect(
    f.engine.query({
      type: 'spatial-convert',
      object,
      point: [1, 1, 1],
      to: 'world',
      instanceIndex: 0
    })
  ).toMatchObject({ point: [16, 3, 4] })
  expect(
    f.engine.query({ type: 'spatial-bounds', object, space: 'world' })
  ).toMatchObject({ bounds: { min: [10, -1.5, -2], max: [14, 1.5, 2] } })
  f.engine.destroy()
})
