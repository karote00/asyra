import { expect, it } from 'vitest'
import {
  buildSiteMeshes,
  projectView,
  INITIAL_VIEW,
  cameraPreset,
  fitCamera
} from '../../render-app/site-projection'

it('preserves exact recessed surfaces, exterior barriers and shared geometry across views', () => {
  const meshes = buildSiteMeshes()
  const points = (id: string) => {
    const shape = meshes.find((m) => m.id === id)?.descriptor.shape
    if (!shape || shape.kind !== 'triangles')
      throw new Error('Missing triangle projection')
    return {
      x: shape.positions.filter((_, i) => i % 3 === 0),
      y: shape.positions.filter((_, i) => i % 3 === 1)
    }
  }
  expect(Math.max(...points('soil').y)).toBeCloseTo(0)
  expect(Math.max(...points('drains').y)).toBeCloseTo(-0.25)
  expect(
    points('barriers').x.every((x) => x <= 0.020001 || x >= 27.979999)
  ).toBe(true)
  expect(Math.max(...points('barriers').y)).toBeCloseTo(0.35)
  const changed = projectView(meshes, {
    ...INITIAL_VIEW,
    filmOpacity: 0.5,
    layers: { ...INITIAL_VIEW.layers, steel: false }
  })
  expect(changed.find((m) => m.id === 'steel')?.visible).toBe(false)
  expect(changed.find((m) => m.id === 'film')?.descriptor.opacity).toBe(0.5)
  changed.forEach((m, i) =>
    expect(m.descriptor.shape).toBe(meshes[i].descriptor.shape)
  )
  for (const mode of ['overview', 'top', 'front', 'inside'] as const)
    expect(cameraPreset(mode).far).toBeGreaterThan(100)
})

it.each([358 / 440, 1090 / 610])(
  'fits the complete overview at aspect %s without changing geometry',
  async (aspect) => {
    const { PerspectiveCamera, Vector3 } = await import('three')
    const base = fitCamera(cameraPreset('overview'), aspect)
    const camera = new PerspectiveCamera(base.fov, aspect, base.near, base.far)
    camera.position.fromArray(base.position)
    camera.lookAt(...base.target)
    camera.updateMatrixWorld(true)
    for (const x of [-3, 31])
      for (const z of [-3, 53]) {
        const projected = new Vector3(x, -0.35, z).project(camera)
        expect(Math.abs(projected.x)).toBeLessThan(0.95)
        expect(Math.abs(projected.y)).toBeLessThan(0.95)
      }
  }
)
