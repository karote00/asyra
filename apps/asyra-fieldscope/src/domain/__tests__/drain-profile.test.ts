import { expect, it } from 'vitest'
import { createDrainProfile } from '../drain-profile'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { DEFAULT_CONFIGURATION, configurationSite } from '../farm-configuration'
import { createLayout } from '../greenhouse'
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
  Raycaster,
  Vector3
} from 'three'

it.each([0.05, 0.3, 0.6, 2])(
  'forms a recessed semicircular soil trough at width %s',
  (width) => {
    const { points, radius, lipRadius, depth, waterLevel } =
      createDrainProfile(width)
    expect(waterLevel).toBe(-0.05)
    expect(points[0]).toEqual([0, 0])
    expect(points.at(-1)).toEqual([width, 0])
    expect(depth).toBeCloseTo(0.05 + radius)
    expect(Math.min(...points.map((p) => p[1]))).toBeCloseTo(-depth)
    expect(lipRadius).toBeLessThanOrEqual(0.01)
    for (const [i, [x, y]] of points.entries()) {
      expect(x).toBeGreaterThanOrEqual(-1e-10)
      expect(x).toBeLessThanOrEqual(width + 1e-10)
      expect(y).toBeLessThanOrEqual(1e-10)
      if (i) expect(x).toBeGreaterThanOrEqual(points[i - 1][0] - 1e-10)
      const mirror = points[points.length - 1 - i]
      expect(x + mirror[0]).toBeCloseTo(width)
      expect(y).toBeCloseTo(mirror[1])
      if (y < waterLevel - 1e-10)
        expect(Math.hypot(x - width / 2, y - waterLevel)).toBeCloseTo(radius)
    }
  }
)

it.each([0.3, 0.6, 1.2])(
  'renders flat water over a soil channel at width %s',
  (width) => {
    const config = {
      ...DEFAULT_CONFIGURATION,
      length: 2,
      strips: [
        { id: 'fixture-1', kind: 'soil' as const, width: 0.9 },
        { id: 'fixture-2', kind: 'drain' as const, width },
        { id: 'fixture-3', kind: 'soil' as const, width: 0.9 }
      ]
    }
    const meshes = buildSiteMeshes(config)
    const drain = createLayout(
      configurationSite(config),
      config.strips
    ).strips.find((s) => s.kind === 'drain')
    if (!drain) throw new Error('Missing drain')
    const ray = new Raycaster()
    for (const id of ['soil', 'drains']) {
      const shape = meshes.find((m) => m.id === id)?.descriptor.shape
      if (shape?.kind !== 'triangles')
        throw new Error('Expected triangle surface')
      const geometry = new BufferGeometry()
      geometry.setAttribute(
        'position',
        new Float32BufferAttribute(shape.positions, 3)
      )
      geometry.setIndex([...shape.indices])
      const material = new MeshBasicMaterial({ side: DoubleSide })
      const mesh = new Mesh(geometry, material)
      mesh.updateMatrixWorld()
      for (const z of [0.01, 1, 1.99]) {
        ray.set(new Vector3(drain.x + width / 2, 1, z), new Vector3(0, -1, 0))
        expect(ray.intersectObject(mesh)[0]?.point.y).toBeCloseTo(
          id === 'drains' ? -0.05 : -createDrainProfile(width).depth,
          5
        )
      }
      if (id === 'drains') {
        const ys = shape.positions.filter((_, i) => i % 3 === 1)
        expect(Math.max(...ys)).toBeCloseTo(-0.05)
        expect(Math.min(...ys)).toBeCloseTo(-createDrainProfile(width).depth)
        ray.set(
          new Vector3(
            drain.x + width / 2,
            -0.05 - createDrainProfile(width).radius / 2,
            -1
          ),
          new Vector3(0, 0, 1)
        )
        expect(ray.intersectObject(mesh)[0]?.point.z).toBeCloseTo(0)
      } else {
        ray.set(
          new Vector3(
            drain.x + width / 2,
            -createDrainProfile(width).depth - 0.01,
            -1
          ),
          new Vector3(0, 0, 1)
        )
        expect(ray.intersectObject(mesh).length).toBeGreaterThan(0)
      }
      geometry.dispose()
      material.dispose()
    }
  }
)
