import { expect, it } from 'vitest'
import { SpatialPosePresentation } from '../spatial/pose.js'
const origin = { position: [0, 0, 0], rotation: [0, 0, 0, 1] } as const
it('interpolates complete poses, replaces and cancels targets without a clock or geometry', () => {
  const owner = new SpatialPosePresentation()
  owner.retarget({
    position: [10, 0, 0],
    rotation: [0, 1, 0, 0],
    scale: [2, 2, 2]
  })
  const next = owner.advance(origin, 0.5, {
    tolerance: 0,
    reducedMotion: false
  })
  expect(next.position).toEqual([5, 0, 0])
  expect(next.scale).toEqual([1.5, 1.5, 1.5])
  expect(next.rotation[1]).toBeCloseTo(Math.SQRT1_2)
  owner.retarget({ ...origin, position: [2, 0, 0] })
  expect(
    owner.advance(next, 0, { tolerance: 0, reducedMotion: true }).position
  ).toEqual([2, 0, 0])
  expect(owner.active).toBe(false)
  owner.retarget(origin)
  owner.cancel()
  expect(
    owner.advance(origin, 0.5, { tolerance: 0, reducedMotion: false })
  ).toBe(origin)
  owner.dispose()
  expect(() => owner.retarget(origin)).toThrow()
})
it('snapshots targets and rejects invalid updates without replacing the accepted target', () => {
  const owner = new SpatialPosePresentation(),
    position: [number, number, number] = [4, 0, 0]
  owner.retarget({ ...origin, position })
  position[0] = 99
  expect(() => owner.retarget({ ...origin, scale: [0, 1, 1] })).toThrow()
  expect(() =>
    owner.advance(origin, NaN, { tolerance: 0, reducedMotion: false })
  ).toThrow()
  expect(
    owner.advance(origin, 1, { tolerance: 0, reducedMotion: false }).position
  ).toEqual([4, 0, 0])
  owner.retarget({ ...origin, rotation: [0, 0, 0, -1] })
  expect(
    owner.advance(origin, 0.5, { tolerance: 0, reducedMotion: false }).rotation
  ).toEqual(origin.rotation)
})
