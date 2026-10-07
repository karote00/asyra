import { subscribeToDiagnosticCounters } from '@asyra/utils'
import { describe, expect, it, vi } from 'vitest'
import { RecordingRenderEngine } from '@asyra/render-engine/testing'
import {
  RenderContainer,
  RenderGraphics,
  RenderObjectRuntime
} from '../types/render-object.js'

const setup = () => {
  const engine = new RecordingRenderEngine({
    name: 'region-query',
    capabilities: ['objects', 'graphics', 'local-content-bounds']
  })
  const { root } = engine.initialize({ host: {}, width: 640, height: 480 })
  const runtime = new RenderObjectRuntime(engine, root)
  const viewport = new RenderContainer()
  const workspace = new RenderContainer()
  viewport.addChild(workspace)
  runtime.attachRoot(viewport)
  const queries = vi.fn(() => ({
    type: 'bounds' as const,
    bounds: { x: 0, y: 0, width: 10, height: 10 }
  }))
  engine.query = queries
  return { viewport, workspace, runtime, queries }
}
describe('workspace region query lifetime', () => {
  it('retains workspace extents through pan/zoom and only measures changed content', () => {
    const { workspace, viewport, queries } = setup()
    const children = Array.from(
      { length: 2000 },
      (_, i) => new RenderContainer({ x: i * 50, label: String(i) })
    )
    children.forEach((child) => workspace.addChild(child))
    expect(
      workspace.queryRegion({ x: 500, y: 0, width: 10, height: 10 })
    ).toEqual([children[10]])
    expect(queries).toHaveBeenCalledTimes(2000)
    queries.mockClear()
    for (let i = 1; i <= 20; i++) {
      viewport.x = i * 100
      viewport.scale.set(i)
      expect(
        workspace.queryRegion({ x: 500, y: 0, width: 10, height: 10 })
      ).toEqual([children[10]])
    }
    expect(queries).not.toHaveBeenCalled()
    children[10].x = 600
    expect(
      workspace.queryRegion({ x: 500, y: 0, width: 10, height: 10 })
    ).toEqual([])
    expect(queries).not.toHaveBeenCalled()
    const bounds = vi.spyOn(children[100], 'getPresentationLocalBounds')
    children[10].width = 20
    workspace.queryRegion({ x: 600, y: 0, width: 10, height: 10 })
    expect(bounds).not.toHaveBeenCalled()
  })
  it('updates transformed descendants, removal, reparent, order and visibility', () => {
    const { workspace } = setup()
    const group = new RenderContainer({ x: 100, label: 'group' })
    const a = new RenderContainer({ x: 20, label: 'a' })
    const b = new RenderContainer({ x: 20, label: 'b' })
    group.addChild(a)
    group.addChild(b)
    workspace.addChild(group)
    const region = { x: 120, y: 0, width: 10, height: 10 }
    expect(workspace.queryRegion(region)).toEqual([a, b])
    group.setChildIndex(b, 0)
    expect(workspace.queryRegion(region)).toEqual([b, a])
    group.rotation = Math.PI / 2
    expect(workspace.queryRegion(region)).toEqual([])
    expect(
      workspace.queryRegion({ x: 90, y: 20, width: 10, height: 10 })
    ).toEqual([b, a])
    group.visible = false
    expect(
      workspace.queryRegion({ x: 90, y: 20, width: 10, height: 10 })
    ).toEqual([])
    group.visible = true
    group.rotation = 0
    workspace.addChild(a)
    expect(workspace.queryRegion(region)).toEqual([b])
    b.destroy()
    expect(workspace.queryRegion(region)).toEqual([])
    workspace.removeChildren()
    expect(
      workspace.queryRegion({ x: -1000, y: -1000, width: 2000, height: 2000 })
    ).toEqual([])
  })
  it('indexes only requested document nodes while internal geometry invalidates their bounds', () => {
    const { workspace, queries } = setup()
    const element = new RenderContainer({ label: 'document' })
    const helper = new RenderContainer({ label: 'internal' })
    element.addChild(helper)
    workspace.addChild(element)
    const include = (node: import('../types/render-object.js').RenderNode) =>
      node === element
    const region = { x: 0, y: 0, width: 1, height: 1 }
    expect(workspace.queryRegion(region, include)).toEqual([element])
    expect(queries).toHaveBeenCalledTimes(1)
    queries.mockClear()
    helper.x = 10
    expect(workspace.queryRegion(region, include)).toEqual([element])
    expect(queries).toHaveBeenCalledTimes(1)
    queries.mockClear()
    workspace.queryRegion(region, include)
    expect(queries).not.toHaveBeenCalled()
    const counters: Record<string, number> = {}
    const dispose = subscribeToDiagnosticCounters((name, value) => {
      counters[name] = (counters[name] ?? 0) + value
    })
    try {
      element.addChild(new RenderContainer({ label: 'second-internal' }))
      workspace.queryRegion(region, include)
      expect(counters['region-query:order-visit'] ?? 0).toBe(0)
    } finally {
      dispose()
    }
  })
  it('retires the workspace index explicitly when document projection is cleared', () => {
    const { workspace } = setup()
    const child = new RenderContainer()
    workspace.addChild(child)
    const bounds = vi.spyOn(child, 'getBoundsRelativeTo')
    const region = { x: 0, y: 0, width: 1, height: 1 }
    workspace.queryRegion(region)
    workspace.queryRegion(region)
    expect(bounds).toHaveBeenCalledTimes(1)
    workspace.releaseRegionQuery()
    workspace.queryRegion(region)
    expect(bounds).toHaveBeenCalledTimes(2)
  })
  it('refreshes descendant extents when authored geometry changes dimension scaling', () => {
    const { workspace } = setup()
    const group = new RenderGraphics()
    const geometry = group as RenderGraphics & {
      __geometryLocalBounds: {
        x: number
        y: number
        width: number
        height: number
      }
    }
    geometry.__geometryLocalBounds = { x: 0, y: 0, width: 10, height: 10 }
    group.width = 20
    const child = new RenderContainer({ x: 10 })
    group.addChild(child)
    workspace.addChild(group)
    const region = { x: 25, y: 0, width: 1, height: 1 }
    expect(workspace.queryRegion(region)).toContain(child)
    geometry.__geometryLocalBounds = { x: 0, y: 0, width: 20, height: 10 }
    group.clear().rect(0, 0, 20, 10)
    expect(workspace.queryRegion(region)).not.toContain(child)
  })
  it('uses the same document coordinates as elementLocalToWorkspace for translated workspaces', () => {
    const { workspace, viewport } = setup()
    const child = new RenderContainer({ x: 10 })
    workspace.addChild(child)
    workspace.x = 100
    const documentPoint = viewport.toLocal(child.toGlobal({ x: 1, y: 1 }))
    expect(
      workspace.queryRegion({ ...documentPoint, width: 1, height: 1 })
    ).toContain(child)
    workspace.x = 200
    expect(
      workspace.queryRegion({ ...documentPoint, width: 1, height: 1 })
    ).not.toContain(child)
    expect(
      workspace.queryRegion({ x: 211, y: 1, width: 1, height: 1 })
    ).toContain(child)
  })
  it('rejects unavailable projection and malformed regions', () => {
    expect(() =>
      new RenderContainer().queryRegion({ x: 0, y: 0, width: 1, height: 1 })
    ).toThrow(/unavailable/)
    const { workspace } = setup()
    expect(() =>
      workspace.queryRegion({ x: 0, y: 0, width: -1, height: 1 })
    ).toThrow(/bounds/)
  })
})
