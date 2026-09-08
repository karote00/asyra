import { expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { cameraPreset, buildSiteMeshes, fitCamera } from '../site-projection'
import {
  cameraDistance,
  measureScene,
  fitScene,
  panCamera,
  setCameraDistance
} from '../camera-navigation'

it.each([
  [1090, 610],
  [358, 440],
  [600, 900]
])(
  'fits all scene bounds with at least 24px on each side at %sx%s',
  (width, height) => {
    const bounds = measureScene(buildSiteMeshes())
    for (const mode of ['overview', 'front', 'top', 'inside'] as const) {
      const fitted = fitScene(cameraPreset(mode), bounds, width, height)
      const projected = fitCamera(fitted, width / height)
      const camera = new PerspectiveCamera(
        projected.fov,
        width / height,
        projected.near,
        projected.far
      )
      camera.position.fromArray(projected.position)
      camera.lookAt(...projected.target)
      camera.updateMatrixWorld(true)
      for (const x of [bounds.min[0], bounds.max[0]])
        for (const y of [bounds.min[1], bounds.max[1]])
          for (const z of [bounds.min[2], bounds.max[2]]) {
            const point = new Vector3(x, y, z).project(camera)
            const px = ((point.x + 1) * width) / 2,
              py = ((1 - point.y) * height) / 2
            expect(px).toBeGreaterThanOrEqual(24)
            expect(px).toBeLessThanOrEqual(width - 24)
            expect(py).toBeGreaterThanOrEqual(24)
            expect(py).toBeLessThanOrEqual(height - 24)
            expect(point.z).toBeGreaterThan(-1)
            expect(point.z).toBeLessThan(1)
          }
    }
  }
)

it('pans by screen pixels without rotating or zooming, and restores 100% while preserving pan', () => {
  const original = cameraPreset('overview')
  const moved = panCamera(original, 90, -40, 1090, 610)
  expect(cameraDistance(moved)).toBeCloseTo(cameraDistance(original))
  expect(moved.target).not.toEqual(original.target)
  const originalDirection = original.position.map(
    (value, i) => value - original.target[i]
  )
  moved.position.forEach((value, i) =>
    expect(value - moved.target[i]).toBeCloseTo(originalDirection[i])
  )
  const camera = new PerspectiveCamera(
    original.fov,
    1090 / 610,
    original.near,
    original.far
  )
  camera.position.fromArray(moved.position)
  camera.lookAt(...moved.target)
  camera.updateMatrixWorld(true)
  const point = new Vector3(...original.target).project(camera)
  expect(((point.x + 1) * 1090) / 2).toBeCloseTo(1090 / 2 + 90)
  expect(((1 - point.y) * 610) / 2).toBeCloseTo(610 / 2 - 40)
  const zoomed = setCameraDistance(moved, 20)
  const restored = setCameraDistance(zoomed, cameraDistance(original))
  expect(cameraDistance(restored)).toBeCloseTo(cameraDistance(original))
  expect(restored.target).toEqual(moved.target)
})
