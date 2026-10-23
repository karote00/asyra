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

it('fits translated and rotated instances while reading model vertices only once', () => {
  let reads = 0
  const positions = new Proxy([0, 0, 0, 2, 0, 0, 0, 1, 3], {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) reads++
      return Reflect.get(target, key, receiver)
    }
  })
  const bounds = measureScene([
    {
      id: 'instances',
      visible: true,
      descriptor: {
        kind: 'mesh',
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        shape: { kind: 'triangles', positions, indices: [0, 1, 2] },
        color: 0,
        opacity: 1,
        wireframe: false,
        selectable: false,
        instances: Array.from({ length: 1000 }, (_, i) => ({
          position: [10, i, 20] as const,
          yaw: Math.PI / 2
        }))
      }
    }
  ])
  expect(bounds.min[0]).toBeCloseTo(10)
  expect(bounds.min[2]).toBeCloseTo(18)
  expect(bounds.max).toEqual([13, 1000, 20])
  expect(reads).toBe(9)
})

it('matches explicit box corners for arbitrary instance yaw and translations', () => {
  const points = [-2, -1, -3, 4, 5, 7, 0, 0, 0]
  const instances = [0, 0.37, -1.2, 2.4, Math.PI].map((yaw, i) => ({
    position: [i * 13, -i * 2, i * -17] as const,
    yaw
  }))
  const offset = [6, -4, 8] as const
  const corners: Vector3[] = []
  for (const instance of instances)
    for (const x of [-2, 4])
      for (const y of [-1, 5])
        for (const z of [-3, 7])
          corners.push(
            new Vector3(x, y, z)
              .applyAxisAngle(new Vector3(0, 1, 0), instance.yaw)
              .add(new Vector3(...instance.position))
              .add(new Vector3(...offset))
          )
  const bounds = measureScene([
    {
      id: 'rotated',
      visible: true,
      descriptor: {
        kind: 'mesh',
        position: offset,
        rotation: [0, 0, 0, 1],
        shape: { kind: 'triangles', positions: points, indices: [0, 1, 2] },
        color: 0,
        opacity: 1,
        wireframe: false,
        selectable: false,
        instances
      }
    }
  ])
  for (let axis = 0; axis < 3; axis++) {
    expect(bounds.min[axis]).toBeCloseTo(
      Math.min(...corners.map((p) => p.getComponent(axis))),
      10
    )
    expect(bounds.max[axis]).toBeCloseTo(
      Math.max(...corners.map((p) => p.getComponent(axis))),
      10
    )
  }
})

it('reuses immutable model extrema across placement edits while invalidating changed geometry', () => {
  let reads = 0
  const positions = new Proxy(Object.freeze([0, 0, 0, 2, 0, 0, 0, 1, 3]), {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) reads++
      return Reflect.get(target, key, receiver)
    }
  })
  const mesh = {
    id: 'bounds',
    visible: true,
    descriptor: {
      kind: 'mesh' as const,
      position: [0, 0, 0] as const,
      rotation: [0, 0, 0, 1] as const,
      shape: Object.freeze({
        kind: 'triangles' as const,
        positions,
        indices: [0, 1, 2]
      }),
      color: 0,
      opacity: 1,
      wireframe: false,
      selectable: false
    }
  }
  const cache = new WeakMap()
  measureScene([mesh], cache)
  expect(reads).toBe(9)
  const moved = {
    ...mesh,
    descriptor: { ...mesh.descriptor, position: [4, 0, 0] as const }
  }
  expect(measureScene([moved], cache)).toEqual({
    min: [4, 0, 0],
    max: [6, 1, 3]
  })
  expect(reads).toBe(9)
  const resized = {
    ...moved,
    descriptor: {
      ...moved.descriptor,
      shape: {
        ...mesh.descriptor.shape,
        positions: [0, 0, 0, 8, 0, 0, 0, 1, 3]
      }
    }
  }
  expect(measureScene([resized], cache)).toEqual(measureScene([resized]))
  resized.descriptor.shape.positions[3] = 10
  expect(measureScene([resized], cache).max[0]).toBe(14)
})
