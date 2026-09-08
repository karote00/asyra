import { expect, it } from 'vitest'
import { createDrainProfile } from '../drain-profile'

it.each([0.05, 0.3, 0.6, 2])(
  'forms a semicircular channel with tangent rounded soil lips at width %s',
  (width) => {
    const { points, radius, lipRadius, depth } = createDrainProfile(width)
    expect(points[0]).toEqual([0, 0])
    expect(points.at(-1)).toEqual([width, 0])
    expect(Math.min(...points.map((p) => p[1]))).toBeCloseTo(-width / 2)
    expect(depth).toBe(width / 2)
    expect(lipRadius).toBeLessThanOrEqual(0.01)
    points.forEach(([x, y], i) => {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(width)
      expect(y).toBeLessThanOrEqual(1e-10)
      if (i) expect(x).toBeGreaterThan(points[i - 1][0])
      const mirror = points[points.length - 1 - i]
      expect(x + mirror[0]).toBeCloseTo(width)
      expect(y).toBeCloseTo(mirror[1])
      if (i <= 12) expect(Math.hypot(x, y + lipRadius)).toBeCloseTo(lipRadius)
      else if (i <= 76)
        expect(Math.hypot(x - width / 2, y + lipRadius)).toBeCloseTo(radius)
      else expect(Math.hypot(x - width, y + lipRadius)).toBeCloseTo(lipRadius)
    })
    // Tangents at the lip/main-circle joins are vertical on both sides.
    expect(points[12]).toEqual([lipRadius, -lipRadius])
    expect(points[76][0]).toBeCloseTo(width - lipRadius)
    expect(points[76][1]).toBeCloseTo(-lipRadius)
  }
)

it('projects an open rounded channel along its full length without a hidden flat bottom', async () => {
  const { buildSiteMeshes } = await import('../../render-app/site-projection')
  const { DEFAULT_CONFIGURATION, configurationSite } =
    await import('../farm-configuration')
  const { createLayout } = await import('../greenhouse')
  const {
    BufferGeometry,
    Float32BufferAttribute,
    Mesh,
    MeshBasicMaterial,
    DoubleSide,
    Raycaster,
    Vector3
  } = await import('three')
  for (const width of [0.3, 0.6, 1.2]) {
    const config = {
      ...DEFAULT_CONFIGURATION,
      length: 2,
      strips: [
        { kind: 'soil' as const, width: 0.9 },
        { kind: 'drain' as const, width },
        { kind: 'soil' as const, width: 0.9 }
      ]
    }
    const meshes = buildSiteMeshes(config)
    const shape = meshes.find((mesh) => mesh.id === 'drains')?.descriptor.shape
    const drain = createLayout(
      configurationSite(config),
      config.strips
    ).strips.find((strip) => strip.kind === 'drain')
    if (!drain || shape?.kind !== 'triangles') throw new Error('Missing drain')
    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(shape.positions, 3)
    )
    geometry.setIndex([...shape.indices])
    const material = new MeshBasicMaterial({ side: DoubleSide })
    const mesh = new Mesh(geometry, material)
    mesh.updateMatrixWorld()
    const ray = new Raycaster()
    for (const z of [0.01, 1, 1.99]) {
      ray.set(new Vector3(drain.x + width / 2, 1, z), new Vector3(0, -1, 0))
      expect(ray.intersectObject(mesh)[0]?.point.y).toBeCloseTo(-width / 2, 5)
      ray.set(new Vector3(drain.x + 0.005, 1, z), new Vector3(0, -1, 0))
      expect(ray.intersectObject(mesh)[0]?.point.y).toBeCloseTo(
        -0.01 + Math.sqrt(0.01 ** 2 - 0.005 ** 2),
        3
      )
    }
    ray.set(
      new Vector3(drain.x + width / 2, -width / 4, -1),
      new Vector3(0, 0, 1)
    )
    expect(ray.intersectObject(mesh)).toHaveLength(0)
    const base = meshes.find((mesh) => mesh.id === 'base')?.descriptor.shape
    if (base?.kind !== 'triangles') throw new Error('Missing ground base')
    expect(
      Math.max(...base.positions.filter((_, i) => i % 3 === 1))
    ).toBeLessThan(-width / 2)
    geometry.dispose()
    material.dispose()
  }
})
