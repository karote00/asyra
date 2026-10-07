import { describe, expect, it, vi } from 'vitest'
import { RecordingRenderEngine } from '@asyra/render-engine/testing'
import { RenderEngineCapabilities } from '@asyra/render-engine'
import {
  RenderContainer,
  RenderGraphics,
  RenderMesh,
  RenderObjectRuntime
} from '../types/render-object.js'

describe('lazy render presentation bounds', () => {
  const setup = () => {
    const engine = new RecordingRenderEngine({
      name: 'presentation-bounds',
      capabilities: [
        'objects',
        'graphics',
        RenderEngineCapabilities.LOCAL_CONTENT_BOUNDS
      ]
    })
    const { root } = engine.initialize({ host: {}, width: 640, height: 480 })
    const runtime = new RenderObjectRuntime(engine, root)
    const viewport = new RenderContainer()
    const group = new RenderGraphics()
    const child = new RenderGraphics().rect(0, 0, 80, 40).fill(0x123456)
    viewport.addChild(group)
    group.addChild(child)
    runtime.attachRoot(viewport)
    const query = vi.fn(() => ({
      type: 'bounds' as const,
      bounds: { x: 10, y: 20, width: 80, height: 40 }
    }))
    engine.query = query
    return { engine, runtime, viewport, group, child, query }
  }

  it('lazily measures descendants once and shares the retained bounds across local and world reads', () => {
    const { group, query } = setup()
    expect(query).not.toHaveBeenCalled()
    expect(group.getPresentationLocalBounds()).toEqual({
      x: 10,
      y: 20,
      width: 80,
      height: 40
    })
    expect(group.getBounds()).toEqual({ x: 10, y: 20, width: 80, height: 40 })
    expect(query).toHaveBeenCalledExactlyOnceWith({
      type: 'get-local-content-bounds',
      object: group.getEngineHandle()
    })
    group.getPresentationLocalBounds().width = 99
    expect(group.getPresentationLocalBounds().width).toBe(80)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('reuses local geometry during continuous viewport pan and zoom', () => {
    const { group, viewport, query } = setup()
    group.getBounds()
    for (let i = 1; i <= 20; i++) {
      viewport.position.set(i * 10, i * 20)
      viewport.scale.set(i, i)
      expect(group.getBounds()).toEqual({
        x: i * 20,
        y: i * 40,
        width: 80 * i,
        height: 40 * i
      })
    }
    expect(query).toHaveBeenCalledTimes(1)
  })

  it.each([
    'geometry',
    'position',
    'rotation',
    'visibility',
    'renderable',
    'dimension'
  ])(
    'invalidates affected ancestors lazily for a child %s change',
    (change) => {
      const { group, child, query } = setup()
      group.getBounds()
      if (change === 'geometry') child.clear().rect(0, 0, 20, 10).fill(0x123456)
      if (change === 'position') child.x = 30
      if (change === 'rotation') child.rotation = 0.4
      if (change === 'visibility') child.visible = false
      if (change === 'renderable') child.renderable = false
      if (change === 'dimension') child.width = 50
      expect(query).toHaveBeenCalledTimes(1)
      query.mockReturnValue({
        type: 'bounds',
        bounds: { x: 0, y: 0, width: 20, height: 10 }
      })
      expect(group.getBounds().width).toBe(20)
      group.getBounds()
      expect(query).toHaveBeenCalledTimes(2)
    }
  )

  it('coalesces descendant changes without invalidating unrelated sibling content', () => {
    const { viewport, group, child, query } = setup()
    const sibling = new RenderGraphics()
    viewport.addChild(sibling)
    group.getBounds()
    sibling.getBounds()
    child.x = 10
    child.y = 20
    child.rotation = 0.2
    expect(query).toHaveBeenCalledTimes(2)
    sibling.getBounds()
    expect(query).toHaveBeenCalledTimes(2)
    group.getBounds()
    group.getBounds()
    expect(query).toHaveBeenCalledTimes(3)
  })

  it('projects cached bounds through current rotation without remeasuring content', () => {
    const { group, query } = setup()
    group.getBounds()
    group.rotation = Math.PI / 2
    const bounds = group.getBounds()
    expect(bounds.x).toBeCloseTo(-60)
    expect(bounds.y).toBeCloseTo(10)
    expect(bounds.width).toBeCloseTo(40)
    expect(bounds.height).toBeCloseTo(80)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('starts a new measurement lifetime when an object is reattached', () => {
    const { group, query, runtime } = setup()
    group.getBounds()
    runtime.destroyObject(group)
    runtime.attachNode(group)
    group.getBounds()
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('invalidates old and new parents on reparent, removal and destruction', () => {
    const { viewport, group, child, query } = setup()
    const other = new RenderGraphics()
    viewport.addChild(other)
    group.getBounds()
    other.getBounds()
    other.addChild(child)
    expect(query).toHaveBeenCalledTimes(2)
    group.getBounds()
    other.getBounds()
    expect(query).toHaveBeenCalledTimes(4)
    child.destroy()
    other.getBounds()
    expect(query).toHaveBeenCalledTimes(5)
    group.getBounds()
    expect(query).toHaveBeenCalledTimes(5)
  })

  it('mesh geometry invalidates bounds while material-only changes reuse them', () => {
    const { group, query } = setup()
    const mesh = new RenderMesh()
    group.addChild(mesh)
    group.getBounds()
    mesh.update({ tint: 0xabcdef })
    group.getBounds()
    expect(query).toHaveBeenCalledTimes(1)
    mesh.update({
      geometry: {
        positions: new Float32Array([0, 0, 20, 0, 0, 10]),
        indices: new Uint32Array([0, 1, 2]),
        uvs: new Float32Array(6)
      }
    })
    group.getBounds()
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('delivers pending draws once before measuring, including a later geometry edit', () => {
    const { engine, group, child, query } = setup()
    const draws = () =>
      engine.getOperations().filter((op) => op.type === 'draw')
    query.mockImplementation(() => {
      expect(draws().length).toBeGreaterThan(0)
      return { type: 'bounds', bounds: { x: 0, y: 0, width: 80, height: 40 } }
    })
    group.getBounds()
    const firstDraws = draws().length
    group.getBounds()
    expect(draws()).toHaveLength(firstDraws)
    child.clear().rect(0, 0, 20, 10).fill(0x123456)
    group.getBounds()
    expect(draws()).toHaveLength(firstDraws + 1)
  })

  it('rejects invalid native results without caching substitute bounds', () => {
    const { group, query } = setup()
    query.mockReturnValue({
      type: 'bounds',
      bounds: { x: 0, y: 0, width: Number.NaN, height: 40 }
    })
    expect(() => group.getBounds()).toThrow(/bounds/i)
    query.mockReturnValue({
      type: 'bounds',
      bounds: { x: 0, y: 0, width: 80, height: 40 }
    })
    expect(group.getBounds().width).toBe(80)
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('uses the basic world query when the engine does not provide local content measurement', () => {
    const engine = new RecordingRenderEngine({ name: 'basic-world-bounds' })
    const { root } = engine.initialize({ host: {}, width: 640, height: 480 })
    const runtime = new RenderObjectRuntime(engine, root)
    const group = new RenderGraphics()
    runtime.attachRoot(group)
    engine.query = vi.fn(() => ({
      type: 'bounds',
      bounds: { x: 5, y: 6, width: 70, height: 80 }
    }))
    expect(group.getBounds()).toEqual({ x: 5, y: 6, width: 70, height: 80 })
    expect(engine.query).toHaveBeenCalledExactlyOnceWith({
      type: 'get-bounds',
      object: group.getEngineHandle()
    })
  })
})
