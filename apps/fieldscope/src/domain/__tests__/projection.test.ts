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
  expect(Math.max(...points('drains').y)).toBeCloseTo(-0.05)
  expect(
    points('barriers').x.every((x) => x <= 0.020001 || x >= 27.979999)
  ).toBe(true)
  expect(Math.max(...points('barriers').y)).toBeCloseTo(0.35)
  const clips = meshes.filter((item) => item.layer === 'clips')
  expect(
    clips.reduce(
      (sum, clip) => sum + (clip.descriptor.instances?.length ?? 0),
      0
    )
  ).toBe(2256)
  for (const clip of clips) {
    const shape = clip.descriptor.shape
    if (shape.kind !== 'triangles')
      throw new Error('Expected batched wire geometry')
    expect(shape.positions.length).toBeLessThan(3_000_000)
    expect(shape.indices.length).toBeLessThan(3_000_000)
  }
  const hiddenClips = projectView(meshes, {
    ...INITIAL_VIEW,
    layers: { ...INITIAL_VIEW.layers, clips: false }
  })
  expect(hiddenClips.filter((item) => !item.visible)).toHaveLength(clips.length)
  expect(hiddenClips.find((item) => item.id === 'supports')?.visible).toBe(true)
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

it('covers every bay roof and exterior wall with a visible translucent film while keeping interior passages open', async () => {
  const {
    BufferGeometry,
    Float32BufferAttribute,
    Mesh,
    MeshBasicMaterial,
    DoubleSide,
    Raycaster,
    Vector3
  } = await import('three')
  const film = projectView(buildSiteMeshes(), INITIAL_VIEW).find(
    (item) => item.id === 'film'
  )
  expect(film?.visible).toBe(true)
  // Product default: a visibly covered greenhouse, not an X-ray view of the frame.
  expect(film?.descriptor.opacity).toBeGreaterThanOrEqual(0.55)
  expect(film?.descriptor.opacity).toBeLessThan(1)
  const shape = film?.descriptor.shape
  if (!shape || shape.kind !== 'triangles')
    throw new Error('Missing membrane surface')
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(shape.positions, 3)
  )
  geometry.setIndex([...shape.indices])
  const material = new MeshBasicMaterial({ side: DoubleSide })
  const surface = new Mesh(geometry, material)
  const hit = (
    origin: [number, number, number],
    direction: [number, number, number]
  ) =>
    new Raycaster(
      new Vector3(...origin),
      new Vector3(...direction)
    ).intersectObject(surface)
  try {
    for (let bay = 0; bay < 4; bay++) {
      for (const offset of [0.1, 1.75, 3.5, 5.25, 6.9]) {
        for (const z of [0.1, 25, 49.9])
          expect(
            hit([bay * 7 + offset, 10, z], [0, -1, 0]).length
          ).toBeGreaterThan(0)
      }
      for (const x of [bay * 7 + 1, bay * 7 + 6]) {
        expect(hit([x, 1, -1], [0, 0, 1])[0].point.z).toBeCloseTo(0)
        expect(hit([x, 1, 51], [0, 0, -1])[0].point.z).toBeCloseTo(50)
      }
      expect(hit([bay * 7 + 3.5, 1, -1], [0, 0, 1])).toHaveLength(0)
    }
    for (const z of [0.1, 25, 49.9]) {
      expect(hit([-1, 1, z], [1, 0, 0])[0].point.x).toBeCloseTo(0)
      expect(hit([29, 1, z], [-1, 0, 0])[0].point.x).toBeCloseTo(28)
      expect(hit([6.8, 1, z], [1, 0, 0])[0].point.x).toBeCloseTo(28)
    }
  } finally {
    geometry.dispose()
    material.dispose()
  }
})

it('composes all plants as shared variant instances and preserves them during view changes', () => {
  const meshes = buildSiteMeshes()
  for (const species of ['cucumber-1914', 'tomato-yu-nu']) {
    const variants = meshes.filter(
      (m) => m.id.startsWith(species) && m.id.endsWith('-0')
    )
    expect(variants).toHaveLength(20)
    expect(
      variants.reduce(
        (sum, m) => sum + (m.descriptor.instances?.length ?? 0),
        0
      )
    ).toBe(2976)
    for (const model of variants) {
      const siblings = meshes.filter((m) =>
        m.id.startsWith(model.id.slice(0, -1))
      )
      expect(siblings).toHaveLength(7)
      expect(
        siblings.every(
          (m) => m.descriptor.instances === model.descriptor.instances
        )
      ).toBe(true)
    }
  }
  const hidden = projectView(meshes, {
    ...INITIAL_VIEW,
    layers: { ...INITIAL_VIEW.layers, cucumbers: false }
  })
  expect(
    hidden
      .filter((m) => m.id.startsWith('cucumber-1914'))
      .every((m) => !m.visible)
  ).toBe(true)
  hidden.forEach((m, i) =>
    expect(m.descriptor.instances).toBe(meshes[i].descriptor.instances)
  )
})
