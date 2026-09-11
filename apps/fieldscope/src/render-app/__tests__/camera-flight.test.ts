import { expect, it } from 'vitest'
import { Vector3 } from 'three'
import { cameraPreset } from '../site-projection'
import { cameraDistance } from '../camera-navigation'
import { lookCamera, moveCamera } from '../camera-flight'

it.each(['overview', 'front', 'inside', 'joint', 'top'] as const)(
  'moves along camera-local axes and preserves view at %s',
  (mode) => {
    const camera = cameraPreset(mode)
    const forward = new Vector3(...camera.target)
      .sub(new Vector3(...camera.position))
      .normalize()
    const right = forward
      .clone()
      .cross(new Vector3(0, 1, 0))
      .normalize()
    const up = right.clone().cross(forward)
    for (const [axis, vector] of [forward, right, up].entries()) {
      const moved = moveCamera(
        camera,
        axis === 1 ? 2 : 0,
        axis === 2 ? 2 : 0,
        axis === 0 ? 2 : 0
      )
      const offset = new Vector3(...moved.position).sub(
        new Vector3(...camera.position)
      )
      expect(offset.distanceTo(vector.clone().multiplyScalar(2))).toBeLessThan(
        1e-10
      )
      expect(cameraDistance(moved)).toBeCloseTo(cameraDistance(camera))
      expect(moved.fov).toBe(camera.fov)
      moved.target.forEach((v, i) =>
        expect(v - camera.target[i]).toBeCloseTo(
          moved.position[i] - camera.position[i]
        )
      )
    }
  }
)
it('looks around in place and then moves forward in the new direction', () => {
  const camera = cameraPreset('inside')
  const looked = lookCamera(camera, 120, -80)
  expect(looked.position).toEqual(camera.position)
  expect(looked.target).not.toEqual(camera.target)
  expect(cameraDistance(looked)).toBeCloseTo(cameraDistance(camera))
  const moved = moveCamera(looked, 0, 0, 1)
  const delta = new Vector3(...moved.position).sub(
    new Vector3(...looked.position)
  )
  const forward = new Vector3(...looked.target)
    .sub(new Vector3(...looked.position))
    .normalize()
  expect(delta.distanceTo(forward)).toBeLessThan(1e-10)
  expect(lookCamera(camera, 0, 100000).target.every(Number.isFinite)).toBe(true)
})

it('starts at eye level inside the greenhouse', async () => {
  const { INITIAL_VIEW } = await import('../site-projection')
  expect(INITIAL_VIEW.camera).toBe('inside')
  expect(cameraPreset(INITIAL_VIEW.camera).position[1]).toBe(1.65)
})
