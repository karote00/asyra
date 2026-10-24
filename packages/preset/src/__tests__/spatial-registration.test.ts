import { RecordingRenderEngine } from '@asyra/render-engine/testing'
import { expect, it, vi } from 'vitest'
import core, { runTransaction } from '@asyra/core'
import { RenderGraphics, RenderMesh } from '@asyra/render'
import {
  registerSpatialMesh,
  SPATIAL_MESH_COMPONENT,
  SPATIAL_MESH_PROPERTY,
  SPATIAL_MESH_RENDER_STRATEGY,
  SPATIAL_MESH_SCHEMA
} from '../spatial.js'
import { readSpatialDescriptor } from '../spatial-contract.js'
it('registers only on explicit request, rejects duplicate installation and cleans ordinary Core relations', () => {
  expect(core.getPropertySchema(SPATIAL_MESH_PROPERTY)).toBeUndefined()
  const dispose = registerSpatialMesh(core)
  expect(core.getPropertySchema(SPATIAL_MESH_PROPERTY)).toBeDefined()
  expect(
    core.getRegistration({ kind: 'component', key: SPATIAL_MESH_COMPONENT })
  ).toBeDefined()
  expect(() => registerSpatialMesh(core)).toThrow()
  dispose()
  dispose()
  expect(core.getPropertySchema(SPATIAL_MESH_PROPERTY)).toBeUndefined()
  expect(
    core.getRegistration({
      kind: 'render-strategy',
      key: SPATIAL_MESH_COMPONENT
    })
  ).toBeUndefined()
})
it('rolls back completed registrations after a strategy failure without retaining partial definitions', () => {
  const register = core.registerRenderStrategy
  core.registerRenderStrategy = vi.fn(() => {
    throw new Error('Rejected strategy')
  })
  try {
    expect(() => registerSpatialMesh(core)).toThrow('Rejected strategy')
  } finally {
    core.registerRenderStrategy = register
  }
  expect(core.getPropertySchema(SPATIAL_MESH_PROPERTY)).toBeUndefined()
  expect(
    core.getRegistration({ kind: 'component', key: SPATIAL_MESH_COMPONENT })
  ).toBeUndefined()
})
it('validates descriptor/visibility schema and retains one derived mesh with explicit identity', () => {
  const graphic = new RenderGraphics(),
    descriptor = readSpatialDescriptor({
      kind: 'mesh',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      shape: { kind: 'box', size: [1, 1, 1] },
      color: 0,
      opacity: 1,
      wireframe: false,
      selectable: true
    })
  if (descriptor.kind !== 'mesh') throw new Error('Expected mesh')
  const data = { id: 'entity', descriptor, visible: true } as Parameters<
    typeof SPATIAL_MESH_RENDER_STRATEGY
  >[1]
  expect(SPATIAL_MESH_SCHEMA.fields[0].validate?.(descriptor)).toBe(true)
  expect(
    SPATIAL_MESH_SCHEMA.fields[0].validate?.({
      ...descriptor,
      scale: [0, 1, 1]
    })
  ).toBe(false)
  SPATIAL_MESH_RENDER_STRATEGY(graphic, data)
  const mesh = graphic.children[0]
  expect(mesh).toBeInstanceOf(RenderMesh)
  expect(mesh.projectionIdentity).toEqual({
    visualId: 'entity',
    elementId: 'entity'
  })
  const update = vi.spyOn(mesh as RenderMesh, 'update')
  for (let i = 0; i < 5; i++)
    SPATIAL_MESH_RENDER_STRATEGY(graphic, { ...data, visible: false })
  expect(graphic.children).toHaveLength(1)
  expect(graphic.visible).toBe(false)
  expect(update).not.toHaveBeenCalled()
  SPATIAL_MESH_RENDER_STRATEGY(graphic, {
    ...data,
    descriptor: { ...descriptor, position: [1, 0, 0] }
  })
  expect(update).toHaveBeenCalledTimes(1)
  graphic.destroy()
})

it('rejects invalid runtime property writes and restores defaults on invalid load', () => {
  const cleanup = registerSpatialMesh(core)
  try {
    const Constructor = core.getPropertyComponent(SPATIAL_MESH_PROPERTY)
    if (!Constructor) throw new Error('Missing property component')
    const instance = new Constructor({
      id: 'spatial-prop',
      type: SPATIAL_MESH_PROPERTY
    })
    const before = instance.get('descriptor')
    instance.set('descriptor', { ...(before as object), scale: [0, 1, 1] })
    expect(instance.get('descriptor')).toEqual(before)
    instance.load({
      id: 'spatial-prop',
      type: SPATIAL_MESH_PROPERTY,
      descriptor: { invalid: true },
      visible: 'invalid'
    } as never)
    expect(instance.get('descriptor')).toEqual(before)
    expect(instance.get('visible')).toBe(true)
  } finally {
    cleanup()
  }
})

it('hands successful definition cleanup to the ordinary Core lifetime', async () => {
  const { getPropertyComponent } = await import('@asyra/core')
  registerSpatialMesh(core)
  expect(getPropertyComponent(SPATIAL_MESH_PROPERTY)).toBeDefined()
  core.setRenderEngineProvider(() => {
    const engine = new RecordingRenderEngine({ name: 'spatial-model-lifetime' })
    const initialize = engine.initialize.bind(engine)
    engine.initialize = (options) => ({
      ...initialize(options),
      surface: document.createElement('canvas')
    })
    return engine
  })
  core.load({
    version: '1.0.0',
    sceneTree: { workspace: '', workspaceList: [], elements: {} },
    props: {}
  })
  await core.start(document.createElement('div'), { width: 100, height: 100 })
  const id = runTransaction(() =>
    core.createElement({ type: SPATIAL_MESH_COMPONENT, name: 'Mesh test' })
  )
  expect(core.getElementData(id)?.type).toBe(SPATIAL_MESH_COMPONENT)
  const saved = await core.save()
  expect(saved.sceneTree.elements[id].type).toBe(SPATIAL_MESH_COMPONENT)
  await core.resetRuntime()
  expect(getPropertyComponent(SPATIAL_MESH_PROPERTY)).toBeUndefined()
})
