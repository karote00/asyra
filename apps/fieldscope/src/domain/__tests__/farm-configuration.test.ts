import { expect, it } from 'vitest'
import {
  DEFAULT_CONFIGURATION,
  configurationSite,
  validateConfiguration
} from '../farm-configuration'
import {
  createLayout,
  createStructure,
  memberStations,
  roofPoint
} from '../greenhouse'
import { createSupportAssembly } from '../planting-supports'
import { createPlantingNet } from '../planting-net'
import { buildSiteMeshes } from '../../render-app/site-projection'

const config = {
  ...DEFAULT_CONFIGURATION,
  length: 12.7,
  width: 8,
  height: 4.5,
  soilInset: 0.12,
  startInset: 0.4,
  endInset: 0.8,
  topExtension: 0.3,
  netTop: 2.6,
  netBottom: 0.5,
  strips: [
    { kind: 'drain' as const, width: 0.3 },
    { kind: 'soil' as const, width: 1 },
    { kind: 'drain' as const, width: 0.3 },
    { kind: 'soil' as const, width: 2 }
  ]
}
it('derives arches, final frames, typed strips, soil-side poles and net elevations from one configuration', () => {
  const accepted = validateConfiguration(config)
  const site = configurationSite(accepted)
  expect(site.margin).toBeCloseTo(2.2)
  expect(roofPoint(0, 0, 0, site)[0]).toBeCloseTo(0)
  expect(roofPoint(0, 0, 0, site)[1]).toBeCloseTo(2.7)
  expect(roofPoint(0, 0.5, 0, site)[1]).toBeCloseTo(4.5)
  expect(roofPoint(0, 1, 0, site)[0]).toBeCloseTo(8)
  expect(memberStations(12.7, 5)).toEqual([0, 5, 10, 12.7])
  expect(
    createStructure(site).filter(
      (m) => m.kind === 'arch' && m.points[0][2] === 12.7
    )
  ).toHaveLength(4)
  const layout = createLayout(site, accepted.strips)
  expect(layout.strips.slice(0, 4).map((s) => s.kind)).toEqual([
    'drain',
    'soil',
    'drain',
    'soil'
  ])
  const assembly = createSupportAssembly(accepted)
  expect(assembly.tubes).toHaveLength(4 * 3 * 20)
  expect(assembly.tubes[0].x).toBeCloseTo(2.62)
  for (const tube of assembly.tubes) {
    expect(tube.z).toBeGreaterThanOrEqual(0.4)
    expect(tube.z).toBeLessThanOrEqual(11.9)
    expect(tube.points[0][1]).toBe(-0.15)
    expect(tube.points[1][1]).toBeCloseTo(3)
  }
  const net = createPlantingNet(assembly, accepted)
  expect(net.ties).toHaveLength(assembly.tubes.length)
  expect(
    Math.min(...net.strands.flatMap((s) => s.points.map((p) => p[1])))
  ).toBe(0.5)
  expect(
    Math.max(...net.strands.flatMap((s) => s.points.map((p) => p[1])))
  ).toBe(2.6)
  expect(Object.isFrozen(accepted.strips[0])).toBe(true)
})
it('accepts soil-only layouts without generating phantom supports or empty meshes', () => {
  const accepted = validateConfiguration({
    ...config,
    strips: [{ kind: 'soil', width: 6 }]
  })
  expect(createSupportAssembly(accepted).tubes).toHaveLength(0)
  expect(
    buildSiteMeshes(accepted).every(
      (mesh) =>
        mesh.descriptor.shape.kind === 'triangles' &&
        mesh.descriptor.shape.positions.length > 0
    )
  ).toBe(true)
})
it.each([
  { width: 3 },
  { length: Number.NaN },
  { netBottom: 3 },
  { startInset: 12 },
  { soilInset: 1.1 },
  { topExtension: 2 }
])('rejects invalid dimensions before they reach geometry: %j', (patch) => {
  expect(() => validateConfiguration({ ...config, ...patch })).toThrow()
})

it('keeps both exterior barriers at the outer boundaries when side margins exceed two metres', () => {
  const meshes = buildSiteMeshes(validateConfiguration(config))
  const shape = meshes.find((mesh) => mesh.id === 'barriers')?.descriptor.shape
  if (shape?.kind !== 'triangles') throw new Error('Expected triangle geometry')
  const xs = shape.positions.filter((_, i) => i % 3 === 0)
  expect(Math.min(...xs)).toBeCloseTo(0)
  expect(Math.max(...xs)).toBeCloseTo(32)
  const film = meshes.find((mesh) => mesh.id === 'film')?.descriptor.shape
  if (film?.kind !== 'triangles') throw new Error('Expected film geometry')
  expect(Math.max(...film.positions.filter((_, i) => i % 3 === 1))).toBeCloseTo(
    4.5
  )
  expect(Math.max(...film.positions.filter((_, i) => i % 3 === 2))).toBeCloseTo(
    12.7
  )
})
