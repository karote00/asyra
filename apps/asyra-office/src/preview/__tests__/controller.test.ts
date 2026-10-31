import { describe, it, expect, vi } from 'vitest'
import { createWall } from '../../assets/wall'
import {
  createPreviewController,
  cameraForView,
  detailForError,
  REVIEW_VIEWS
} from '../controller'
import { SpatialLayer } from '@asyra/preset/spatial'

describe('asset preview work boundary', () => {
  it('builds once across five camera views and retains the same admitted bounds', () => {
    const invalidate = vi.fn(),
      layer = new SpatialLayer(invalidate),
      build = vi.fn(createWall)
    const submit = vi.spyOn(layer, 'submit'),
      camera = vi.spyOn(layer, 'submitCamera')
    const controller = createPreviewController(
      layer,
      { height: 800, pixelRatio: 1 },
      build
    )
    const original = layer.getBounds()
    for (const view of REVIEW_VIEWS.slice(0, 5)) {
      controller.setView(view)
    }
    expect(build).toHaveBeenCalledOnce()
    expect(submit).toHaveBeenCalledOnce()
    expect(camera).toHaveBeenCalledTimes(5)
    expect(layer.getBounds()).toEqual(original)
    controller.dispose()
    layer.dispose()
  })
  it('changes appearance and LoD without rebuilding topology, then restores the same geometry', () => {
    const layer = new SpatialLayer(vi.fn()),
      build = vi.fn(createWall),
      submit = vi.spyOn(layer, 'submit')
    const controller = createPreviewController(
      layer,
      { height: 800, pixelRatio: 1 },
      build
    )
    const near = submit.mock.calls[0][0].meshes[0].descriptor.shape
    controller.setView('Distant')
    expect(controller.getSnapshot()).toMatchObject({
      detail: 'distant',
      triangles: 32
    })
    controller.setView('Front')
    controller.setNeutral(true)
    const last = submit.mock.lastCall
    if (!last) {
      throw new Error('Expected submitted frame')
    }
    expect(last[0].meshes[0].descriptor.shape).toBe(near)
    expect(last[0].meshes[0].descriptor.color).toBe(0xb9b9b9)
    expect(build).toHaveBeenCalledOnce()
    controller.dispose()
    layer.dispose()
  })
  it('keeps depth precision below the 4 mm bevel at every review camera', () => {
    for (const view of REVIEW_VIEWS) {
      const camera = cameraForView(view)
      const depth = Math.hypot(
        ...camera.position.map((n, i) => n - camera.target[i])
      )
      const quantization =
        (depth * depth * (camera.far - camera.near)) /
        (camera.far * camera.near * 2 ** 24)
      expect(quantization).toBeLessThan(0.00001)
      expect(camera.near).toBeLessThan(depth)
      expect(camera.far).toBeGreaterThan(depth)
    }
  })
  it('uses hysteresis and rejects invalid camera or viewport inputs', () => {
    expect(detailForError('near', 0.5)).toBe('near')
    expect(detailForError('distant', 0.5)).toBe('distant')
    expect(detailForError('near', 0.39)).toBe('distant')
    expect(detailForError('distant', 0.61)).toBe('near')
    expect(() => detailForError('near', NaN)).toThrow()
    for (const view of REVIEW_VIEWS) {
      expect(cameraForView(view).kind).toBe('camera')
    }
    const layer = new SpatialLayer(vi.fn()),
      controller = createPreviewController(layer, {
        height: 800,
        pixelRatio: 1
      })
    expect(() => controller.resize(0, 1)).toThrow()
    controller.dispose()
    layer.dispose()
  })
  it('unsubscribes observers and rejects all work after disposal', () => {
    const layer = new SpatialLayer(vi.fn()),
      controller = createPreviewController(layer, {
        height: 800,
        pixelRatio: 1
      })
    const changed = vi.fn(),
      off = controller.subscribe(changed)
    controller.setView('Front')
    expect(changed).toHaveBeenCalledOnce()
    off()
    controller.setView('Back')
    expect(changed).toHaveBeenCalledOnce()
    controller.dispose()
    layer.dispose()
    expect(() => controller.setView('Front')).toThrow('disposed')
    expect(() => controller.setNeutral(true)).toThrow('disposed')
    expect(() => controller.resize(900, 1)).toThrow('disposed')
    expect(() => controller.subscribe(changed)).toThrow('disposed')
  })
})
