import { expect, it, vi } from 'vitest'
import { RecordingRenderEngine } from '@asyra/render-engine/testing'
import {
  RenderEngineCapabilities,
  type RenderEngineQuery,
  type RenderEngineQueryResult
} from '@asyra/render-engine'
import { Render } from '../render.js'
import { RenderContainer, RenderMesh } from '../types/render-object.js'
it('converts client coordinates once, maps explicit IDs and preserves overlay priority', async () => {
  const engine = new RecordingRenderEngine({ name: 'spatial-facade' })
  engine.capabilities.add(RenderEngineCapabilities.SPATIAL_QUERIES)
  const render = new Render({ engine })
  await render.init(640, 480, 0, {})
  let width = 320
  const rect = () => ({ left: 100, top: 50, width, height: 240 })
  if (!render.app?.canvas) throw new Error('Missing surface')
  render.app.canvas = { getBoundingClientRect: rect } as HTMLCanvasElement
  const layer = new RenderContainer(),
    mesh = new RenderMesh({}),
    overlay = new RenderContainer()
  mesh.projectionIdentity = { visualId: 'visual', elementId: 'entity' }
  mesh.label = 'Display name'
  overlay.label = 'overlay'
  layer.addChild(mesh)
  layer.addChild(overlay)
  render.registerLayer({ name: 'spatial', layer, zIndex: 0 })
  const meshHandle = mesh.getEngineHandle()
  if (!meshHandle) throw new Error('Missing mesh handle')
  let overlayHit = false
  engine.query = vi.fn((query: RenderEngineQuery): RenderEngineQueryResult => {
    if (query.type === 'spatial-pick')
      return {
        type: 'spatial-pick',
        overlay: overlayHit ? overlay.getEngineHandle() : null,
        hit: overlayHit
          ? null
          : {
              object: meshHandle,
              distance: 2,
              point: [0, 0, 0],
              instanceIndex: 3,
              instanceId: 'stable'
            }
      }
    if (query.type === 'spatial-raycast')
      return {
        type: 'spatial-hits',
        hits: [{ object: meshHandle, distance: 2, point: [0, 0, 0] }]
      }
    if (query.type === 'spatial-ray')
      return {
        type: 'spatial-ray',
        ray: {
          origin: [query.point.x, query.point.y, 0],
          direction: [0, 0, -1]
        }
      }
    if (query.type === 'spatial-bounds')
      return { type: 'spatial-bounds', bounds: null }
    if (query.type === 'spatial-convert')
      return { type: 'spatial-point', point: query.point }
    if (query.type === 'spatial-project')
      return {
        type: 'spatial-projection',
        point: { x: 320, y: 240 },
        depth: 0,
        inFrustum: true
      }
    throw new Error('Unexpected query')
  })
  expect(render.pickSpatialAtClientPoint({ x: 260, y: 170 })).toEqual({
    kind: 'spatial',
    hit: {
      visualId: 'visual',
      elementId: 'entity',
      distance: 2,
      point: [0, 0, 0],
      instanceIndex: 3,
      instanceId: 'stable'
    }
  })
  expect(engine.query).toHaveBeenLastCalledWith({
    type: 'spatial-pick',
    point: { x: 320, y: 240 }
  })
  overlayHit = true
  expect(render.pickSpatialAtClientPoint({ x: 260, y: 170 })).toEqual({
    kind: 'overlay',
    elementId: 'overlay'
  })
  expect(render.getSpatialRayAtClientPoint({ x: 420, y: 170 })).toBeNull()
  width = 0
  expect(render.pickSpatialAtClientPoint({ x: 100, y: 100 })).toBeNull()
  width = 320
  render.resize(1280, 960)
  expect(render.getSpatialRayAtClientPoint({ x: 260, y: 170 })?.origin).toEqual(
    [640, 480, 0]
  )
  expect(render.convertSpatialPoint('visual', [1, 2, 3], 'world')).toEqual([
    1, 2, 3
  ])
  expect(render.getSpatialBounds('visual', 'world')).toBeNull()
  expect(() => render.getSpatialBounds('unknown', 'world')).toThrow()
  expect(
    render.raycastSpatial({ origin: [0, 0, 1], direction: [0, 0, -1] })
  ).toEqual([
    { visualId: 'visual', elementId: 'entity', distance: 2, point: [0, 0, 0] }
  ])
  const duplicate = new RenderMesh({})
  duplicate.projectionIdentity = { visualId: 'visual' }
  layer.addChild(duplicate)
  expect(() => render.getSpatialBounds('visual', 'world')).toThrow(/ambiguous/)
  layer.removeChild(mesh)
  expect(() =>
    render.raycastSpatial({ origin: [0, 0, 1], direction: [0, 0, -1] })
  ).toThrow()
  duplicate.destroy()
  mesh.destroy()
  expect(() => render.getSpatialBounds('visual', 'world')).toThrow()
  render.dispose()
})
it('rejects unsupported engines before queries or coordinate conversion', async () => {
  const engine = new RecordingRenderEngine({ name: '2d' }),
    render = new Render({ engine })
  await render.init(10, 10, 0, {})
  engine.query = vi.fn()
  expect(() => render.getSpatialRayAtClientPoint({ x: -1, y: -1 })).toThrow(
    /spatial-queries/
  )
  expect(engine.query).not.toHaveBeenCalled()
  render.dispose()
})
