import { afterEach, describe, expect, it, vi } from 'vitest'
import { RenderContainer, RenderMesh } from '@asyra/render'
import { SPATIAL_PROPERTY } from '../spatial-contract.js'
import { SpatialLayer, type SpatialFrame } from '../spatial.js'

const frame: SpatialFrame = {
  camera: {
    kind: 'camera',
    position: [0, 0, 5],
    target: [0, 0, 0],
    fov: 60,
    near: 0.01,
    far: 100
  },
  meshes: [
    {
      id: 'body-a',
      visible: true,
      descriptor: {
        kind: 'mesh',
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        shape: { kind: 'box', size: [1, 1, 1] },
        color: 0x0088aa,
        opacity: 1,
        wireframe: false,
        selectable: true
      }
    }
  ]
}
afterEach(() => vi.restoreAllMocks())
describe('Spatial projection owner', () => {
  it('coalesces camera bursts without resubmitting meshes and preserves a pending model update', () => {
    const invalidate = vi.fn(),
      layer = new SpatialLayer(invalidate)
    layer.submit(frame)
    layer.registration.update?.()
    const update = vi.spyOn(RenderMesh.prototype, 'update')
    invalidate.mockClear()
    for (let i = 1; i <= 60; i++) {
      layer.submitCamera({ ...frame.camera, position: [i, 0, 5] })
    }
    expect(invalidate).toHaveBeenCalledTimes(1)
    layer.registration.update?.()
    expect(update).not.toHaveBeenCalled()
    const container = layer.registration.layer as RenderContainer
    if (!(container instanceof RenderContainer)) {
      throw new Error('Missing spatial container')
    }
    expect(
      container.children[0].getEngineProperties()[SPATIAL_PROPERTY]
    ).toMatchObject({ position: [60, 0, 5] })
    expect(layer.registration.shouldUpdate?.()).toBe(false)
    layer.submit({
      ...frame,
      meshes: [
        {
          ...frame.meshes[0],
          descriptor: { ...frame.meshes[0].descriptor, color: 123 }
        }
      ]
    })
    layer.submitCamera({ ...frame.camera, position: [2, 0, 5] })
    layer.registration.update?.()
    expect(update).toHaveBeenCalledTimes(1)
    expect(
      container.children[0].getEngineProperties()[SPATIAL_PROPERTY]
    ).toMatchObject({ position: [2, 0, 5] })
    layer.submitCamera({ ...frame.camera, position: [3, 0, 5] })
    expect(() =>
      layer.submit({ ...frame, meshes: [frame.meshes[0], frame.meshes[0]] })
    ).toThrow('unique')
    layer.registration.update?.()
    expect(
      container.children[0].getEngineProperties()[SPATIAL_PROPERTY]
    ).toMatchObject({ position: [3, 0, 5] })
    layer.submitCamera({ ...frame.camera, position: [4, 0, 5] })
    layer.submit({ ...frame, meshes: [] })
    layer.registration.update?.()
    expect(container.children).toHaveLength(1)
    expect(
      container.children[0].getEngineProperties()[SPATIAL_PROPERTY]
    ).toMatchObject(frame.camera)
    layer.dispose()
    expect(() => layer.submitCamera(frame.camera)).toThrow('disposed')
  })
  it('retains a pending complete frame and invalidates only accepted submissions', () => {
    const invalidate = vi.fn(),
      layer = new SpatialLayer(invalidate)
    layer.submit(frame)
    expect(layer.registration.shouldUpdate?.()).toBe(true)
    expect(layer.registration.update?.()).toBe(true)
    expect(layer.registration.shouldUpdate?.()).toBe(false)
    expect(invalidate).toHaveBeenCalledOnce()
    expect(() =>
      layer.submit({ ...frame, meshes: [...frame.meshes, ...frame.meshes] })
    ).toThrow('unique')
    expect(invalidate).toHaveBeenCalledOnce()
    layer.dispose()
    layer.dispose()
    expect(() => layer.submit(frame)).toThrow('disposed')
  })
})

it('rejects non-string visual identities before replacing accepted pending output', () => {
  const invalidate = vi.fn(),
    layer = new SpatialLayer(invalidate)
  layer.submit(frame)
  expect(() =>
    layer.submit({
      ...frame,
      meshes: [{ ...frame.meshes[0], id: 7 as unknown as string }]
    })
  ).toThrow()
  expect(invalidate).toHaveBeenCalledTimes(1)
  layer.registration.update?.()
  expect((layer.registration.layer as RenderContainer).children).toHaveLength(2)
  layer.dispose()
})

it('skips identical admitted submissions and changes only visibility and identity when required', async () => {
  const { readSpatialDescriptor } = await import('../spatial-contract.js')
  const descriptor = readSpatialDescriptor(frame.meshes[0].descriptor)
  if (descriptor.kind !== 'mesh') {
    throw new Error('Expected mesh')
  }
  const accepted = { ...frame, meshes: [{ ...frame.meshes[0], descriptor }] }
  const invalidate = vi.fn(),
    layer = new SpatialLayer(invalidate)
  layer.submit(accepted)
  layer.registration.update?.()
  const mesh = (layer.registration.layer as RenderContainer).children[1]
  const update = vi.spyOn(RenderMesh.prototype, 'update')
  const destroy = vi.spyOn(mesh, 'destroy')
  invalidate.mockClear()
  layer.submit(accepted)
  expect(invalidate).not.toHaveBeenCalled()
  expect(layer.registration.update?.()).toBe(false)
  layer.submit({
    ...accepted,
    meshes: [
      { ...accepted.meshes[0], visible: false, elementId: 'canonical-a' }
    ]
  })
  layer.registration.update?.()
  expect(update).not.toHaveBeenCalled()
  expect(mesh.visible).toBe(false)
  expect(mesh.interactionIdentity).toBe('canonical-a')
  expect(layer.getBounds()).toBeNull()
  layer.submit({ ...accepted, meshes: [] })
  layer.registration.update?.()
  layer.dispose()
  layer.dispose()
  expect(destroy).toHaveBeenCalledTimes(1)
  expect(() => layer.getBounds()).toThrow(/disposed/)
})

it('keeps ordered visual identities and isolates caller mutations and layer lifetimes', () => {
  const layer = new SpatialLayer(vi.fn()),
    other = new SpatialLayer(vi.fn())
  const a = { ...frame.meshes[0], id: 'a' },
    b = { ...frame.meshes[0], id: 'b' }
  layer.submit({ ...frame, meshes: [a, b] })
  a.id = 'mutated'
  layer.registration.update?.()
  const container = layer.registration.layer as RenderContainer
  const first = container.children[1],
    second = container.children[2]
  expect(first.projectionIdentity?.visualId).toBe('a')
  layer.submit({ ...frame, meshes: [b, { ...a, id: 'a' }] })
  layer.registration.update?.()
  expect(container.children.slice(1)).toEqual([second, first])
  expect(other.getBounds()).toBeNull()
  layer.dispose()
  other.dispose()
})

it('rejects sparse submissions without losing accepted camera and model work', () => {
  const layer = new SpatialLayer(vi.fn())
  layer.submit(frame)
  expect(() => layer.submit({ ...frame, meshes: Array(1) })).toThrow()
  layer.registration.update?.()
  expect((layer.registration.layer as RenderContainer).children).toHaveLength(2)
  layer.dispose()
})
