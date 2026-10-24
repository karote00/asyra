import { expect, it, vi } from 'vitest'
import { Core } from '../core.js'
it('delegates named spatial facades without converting coordinates or changing canonical state', () => {
  const render = {
    projectSpatialPoint: vi.fn(),
    getSpatialRayAtClientPoint: vi.fn(),
    raycastSpatial: vi.fn(),
    convertSpatialPoint: vi.fn(),
    getSpatialBounds: vi.fn(),
    pickSpatialAtClientPoint: vi.fn()
  }
  const core = new Core({ render } as never)
  const point = { x: 300, y: 200 },
    ray = { origin: [0, 0, 5], direction: [0, 0, -1] } as const
  core.pickSpatialAtClientPoint(point)
  expect(render.pickSpatialAtClientPoint).toHaveBeenCalledWith(point)
  core.getSpatialRayAtClientPoint(point)
  expect(render.getSpatialRayAtClientPoint).toHaveBeenCalledWith(point)
  core.projectSpatialPoint([1, 2, 3])
  expect(render.projectSpatialPoint).toHaveBeenCalledWith([1, 2, 3])
  core.raycastSpatial(ray)
  expect(render.raycastSpatial).toHaveBeenCalledWith(ray)
  core.convertSpatialPoint('visual', [1, 2, 3], 'world', 2)
  expect(render.convertSpatialPoint).toHaveBeenCalledWith(
    'visual',
    [1, 2, 3],
    'world',
    2
  )
  core.getSpatialBounds('visual', 'local')
  expect(render.getSpatialBounds).toHaveBeenCalledWith(
    'visual',
    'local',
    undefined
  )
})
