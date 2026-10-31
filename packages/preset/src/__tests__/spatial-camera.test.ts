// @vitest-environment node
import { expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import {
  spatialCameraDistance,
  moveSpatialCamera,
  panSpatialCamera,
  orbitSpatialCamera,
  lookSpatialCamera,
  dollySpatialCamera,
  projectSpatialCamera,
  fitSpatialCameraBounds,
  frameSpatialCameraPoints,
  SpatialCameraPresentation,
  type SpatialCamera
} from '../spatial.js'
const camera: SpatialCamera = {
  kind: 'camera',
  position: [4, 3, 8],
  target: [0, 0, 0],
  fov: 60,
  near: 0.1,
  far: 100
}
const project = (
  c: SpatialCamera,
  point: readonly number[],
  w: number,
  h: number
) => {
  const v = new PerspectiveCamera(c.fov, w / h, c.near, c.far)
  v.position.set(...c.position)
  v.lookAt(...c.target)
  v.updateMatrixWorld()
  return new Vector3(...point).project(v)
}
it('preserves local axes, distance and CSS pixel panning without a renderer', () => {
  const moved = moveSpatialCamera(camera, 2, -1, 3)
  expect(spatialCameraDistance(moved)).toBeCloseTo(
    spatialCameraDistance(camera)
  )
  expect(moved.fov).toBe(60)
  for (const height of [200, 800]) {
    const p = panSpatialCamera(camera, 30, -20, height, {
      distance: spatialCameraDistance(camera),
      fov: camera.fov
    })
    const v = project(p, camera.target, 600, height)
    expect((v.x + 1) * 300).toBeCloseTo(330)
    expect(((1 - v.y) * height) / 2).toBeCloseTo(height / 2 - 20)
  }
  expect(dollySpatialCamera(camera, 12).target).toEqual(camera.target)
  expect(spatialCameraDistance(dollySpatialCamera(camera, 12))).toBeCloseTo(12)
})
it('keeps caller angle/limit choices and rejects degenerate or unsupported operations', () => {
  const limits = { minPolar: 0.08, maxPolar: Math.PI - 0.08 }
  const a = orbitSpatialCamera(camera, 0.4, -0.2, limits)
  const b = lookSpatialCamera(camera, -0.6, 0.3, {
    minPolar: 0.01,
    maxPolar: Math.PI - 0.01
  })
  expect(a.target).toEqual(camera.target)
  expect(b.position).toEqual(camera.position)
  expect(spatialCameraDistance(a)).toBeCloseTo(spatialCameraDistance(camera))
  expect(a.position).not.toEqual(b.position)
  expect(() =>
    panSpatialCamera(camera, NaN, 0, 100, { distance: 1, fov: 60 })
  ).toThrow()
  expect(() =>
    moveSpatialCamera({ ...camera, target: camera.position }, 1, 0, 0)
  ).toThrow()
  expect(() => dollySpatialCamera(camera, 0)).toThrow()
  expect(() =>
    projectSpatialCamera(camera, 1, {
      projection: 'orthographic' as 'perspective',
      minimumAspect: 1.5,
      maxFov: 150
    })
  ).toThrow()
  expect(() =>
    orbitSpatialCamera(camera, 0, 0, { minPolar: 0, maxPolar: Math.PI })
  ).toThrow()
})
it.each([
  [320, 900],
  [1200, 400]
])(
  'fits bounds and points with clipping and caller aspect policy at %j',
  (width, height) => {
    const bounds = { min: [-2, -3, -4] as const, max: [5, 6, 7] as const }
    const points = []
    for (const x of [-2, 5]) {
      for (const y of [-3, 6]) {
        for (const z of [-4, 7]) {
          points.push([x, y, z] as const)
        }
      }
    }
    const projected = projectSpatialCamera(camera, width / height, {
      projection: 'perspective',
      minimumAspect: 1.5,
      maxFov: 150
    })
    const bound = fitSpatialCameraBounds(camera, bounds, width, height, {
      padding: 24,
      verticalFov: projected.fov
    })
    const point = frameSpatialCameraPoints(camera, points, width, height, {
      padding: 32,
      minDistance: 0.15,
      nearFraction: 0.5,
      minimumFarPadding: 1,
      farPaddingRatio: 0.01
    })
    for (const [c, pad] of [
      [{ ...bound, fov: projected.fov }, 24],
      [point, 32]
    ] as const) {
      for (const p of points) {
        const v = project(c, p, width, height)
        expect(((v.x + 1) * width) / 2).toBeGreaterThanOrEqual(pad - 1e-6)
        expect(((v.x + 1) * width) / 2).toBeLessThanOrEqual(width - pad + 1e-6)
        expect(((1 - v.y) * height) / 2).toBeGreaterThanOrEqual(pad - 1e-6)
        expect(((1 - v.y) * height) / 2).toBeLessThanOrEqual(
          height - pad + 1e-6
        )
        expect(v.z).toBeGreaterThanOrEqual(-1 - 1e-6)
        expect(v.z).toBeLessThanOrEqual(1 + 1e-6)
      }
    }
    expect(
      fitSpatialCameraBounds(camera, null, width, height, {
        padding: 24,
        verticalFov: 60
      })
    ).toBe(camera)
    expect(
      frameSpatialCameraPoints(camera, [], width, height, {
        padding: 32,
        minDistance: 0.15,
        nearFraction: 0.5,
        minimumFarPadding: 1,
        farPaddingRatio: 0.01
      })
    ).toBe(camera)
  }
)
it('replaces targets atomically, follows current poses, cancels and retires without a queue', () => {
  const owner = new SpatialCameraPresentation()
  const target = { ...camera, position: [8, 6, 16] as const }
  owner.retarget(target)
  const next = owner.advance(camera, 0.12, {
    tolerance: 0.005,
    reducedMotion: false
  })
  expect(next.position[0]).toBeCloseTo(4.48)
  expect(owner.active).toBe(true)
  expect(() => owner.retarget({ ...target, target: target.position })).toThrow()
  expect(() =>
    owner.advance(next, NaN, { tolerance: 0.005, reducedMotion: false })
  ).toThrow()
  expect(owner.active).toBe(true)
  const latest = { ...camera, position: [10, 8, 12] as const }
  owner.retarget(latest)
  expect(
    owner.advance(next, 0.12, { tolerance: 0.005, reducedMotion: true })
  ).toEqual(latest)
  expect(owner.active).toBe(false)
  owner.retarget(target)
  owner.cancel()
  expect(
    owner.advance(camera, 0.5, { tolerance: 0.005, reducedMotion: false })
  ).toBe(camera)
  owner.dispose()
  owner.dispose()
  expect(() => owner.retarget(target)).toThrow(/disposed/)
})

it('isolates target snapshots and preserves an accepted target after singular interpolation rejection', () => {
  const owner = new SpatialCameraPresentation(),
    other = new SpatialCameraPresentation()
  const from: SpatialCamera = { ...camera, position: [0, 0, 5] }
  const position: [number, number, number] = [0, 0, -5]
  owner.retarget({ ...from, position })
  position[0] = 20
  expect(() =>
    owner.advance(from, 0.5, { tolerance: 0, reducedMotion: false })
  ).toThrow()
  expect(owner.active).toBe(true)
  expect(other.active).toBe(false)
  expect(
    owner.advance(from, 1, { tolerance: 0, reducedMotion: false }).position
  ).toEqual([0, 0, -5])
  expect(owner.active).toBe(false)
  owner.dispose()
  other.dispose()
})

it('uses the admitted camera snapshot rather than rereading caller accessors', () => {
  let reads = 0
  const input = {
    ...camera,
    get position() {
      reads++
      return reads === 1 ? camera.position : ([100, 3, 8] as const)
    }
  }
  expect(moveSpatialCamera(input, 1, 2, 3)).toEqual(
    moveSpatialCamera(camera, 1, 2, 3)
  )
  expect(reads).toBe(1)
})

it('expands clipping around the accepted fit set and rejects invalid viewport or camera boundaries', () => {
  const clipped = { ...camera, near: 0.1, far: 0.2 }
  const bounds = {
    min: [-100, -200, -300] as const,
    max: [100, 200, 300] as const
  }
  const fitted = fitSpatialCameraBounds(clipped, bounds, 600, 400, {
    padding: 24,
    verticalFov: 60
  })
  expect(fitted.far).toBeGreaterThan(clipped.far)
  for (const x of [-100, 100]) {
    for (const y of [-200, 200]) {
      for (const z of [-300, 300]) {
        const p = project(fitted, [x, y, z], 600, 400)
        expect(p.z).toBeGreaterThanOrEqual(-1)
        expect(p.z).toBeLessThanOrEqual(1)
      }
    }
  }
  expect(() =>
    fitSpatialCameraBounds(camera, bounds, 48, 400, {
      padding: 24,
      verticalFov: 60
    })
  ).toThrow()
  expect(() =>
    moveSpatialCamera({ ...camera, position: [0, 3, 0] }, 1, 0, 0)
  ).toThrow()
  expect(() =>
    moveSpatialCamera({ ...camera, near: camera.far }, 1, 0, 0)
  ).toThrow()
})

it('leaves target-distance limits to the App instead of deriving them from clipping planes', () => {
  const next = dollySpatialCamera(camera, 0.05)
  expect(spatialCameraDistance(next)).toBeCloseTo(0.05)
  expect(next.near).toBe(camera.near)
})
