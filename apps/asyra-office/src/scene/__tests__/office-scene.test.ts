import { afterEach, expect, it, vi } from 'vitest'
import { RenderContainer, RenderMesh } from '@asyra/render'
import { SPATIAL_PROPERTY } from '@asyra/preset/spatial-contract'
import { OfficeScene } from '../office-scene'
import { INITIAL_LAYOUT } from '../../domain/layout'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('retains static visuals across camera, motion and layout projection updates', () => {
  let tick: FrameRequestCallback | undefined
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback) => {
      tick = callback
      return 1
    })
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const scene = new OfficeScene(vi.fn())
  scene.setLayout(INITIAL_LAYOUT)
  const flush = () => scene.registration.update?.()
  flush()
  const root = scene.registration.layer as RenderContainer
  const meshes = root.children.filter(
    (node): node is RenderMesh => node instanceof RenderMesh
  )
  expect(meshes.length).toBeGreaterThan(40)
  expect(
    new Set(meshes.map((mesh) => mesh.projectionIdentity?.visualId)).size
  ).toBe(meshes.length)
  const update = vi.spyOn(RenderMesh.prototype, 'update')
  scene.setReducedMotion(true)
  tick?.(performance.now() + 50)
  flush()
  update.mockClear()
  scene.focus('park')
  tick?.(performance.now() + 50)
  flush()
  expect(update).not.toHaveBeenCalled()
  expect(
    root.children[0].getEngineProperties()[SPATIAL_PROPERTY]
  ).toMatchObject({ fov: 43, near: 0.1, far: 100, target: [5.5, 0, 2] })
  scene.visit('coffee')
  tick?.(performance.now() + 50)
  flush()
  expect(update).toHaveBeenCalledTimes(11)
  expect(root.children.filter((node) => node instanceof RenderMesh)).toEqual(
    meshes
  )
  scene.setLayout({
    ...INITIAL_LAYOUT,
    furniture: [...INITIAL_LAYOUT.furniture].reverse()
  })
  flush()
  expect(
    new Set(root.children.filter((node) => node instanceof RenderMesh))
  ).toEqual(new Set(meshes))
  scene.dispose()
  const calls = update.mock.calls.length
  tick?.(performance.now() + 50)
  flush()
  expect(update).toHaveBeenCalledTimes(calls)
  expect(root.children).toHaveLength(0)
})

it('uses only the latest focus or follow target with the existing interpolation policy', () => {
  let tick: FrameRequestCallback | undefined
  const request = vi.fn((callback: FrameRequestCallback) => {
    tick = callback
    return 1
  })
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const scene = new OfficeScene(vi.fn())
  scene.registration.update?.()
  const root = scene.registration.layer as RenderContainer
  const update = vi.spyOn(RenderMesh.prototype, 'update')
  const step = () => {
    tick?.(performance.now() + 50)
    scene.registration.update?.()
  }
  scene.focus('park')
  scene.focus('coffee')
  expect(request).toHaveBeenCalledTimes(1)
  step()
  expect(
    root.children[0].getEngineProperties()[SPATIAL_PROPERTY]
  ).toMatchObject({ position: [12.94, 11.4, 14.8], target: [1.54, 0, -0.36] })
  scene.setReducedMotion(true)
  scene.follow()
  step()
  expect(
    root.children[0].getEngineProperties()[SPATIAL_PROPERTY]
  ).toMatchObject({ position: [-1, 3, 5], target: [-1.5, 0.8, 0] })
  scene.focus('overview')
  step()
  expect(
    root.children[0].getEngineProperties()[SPATIAL_PROPERTY]
  ).toMatchObject({ position: [13, 12, 16], target: [1, 0, 0] })
  expect(update).not.toHaveBeenCalled()
  scene.dispose()
})
