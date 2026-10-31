import { expect, it } from 'vitest'
import { teaChair } from '../tea-chair'
import { requiredSpecValue } from '../specification'

it('retains a broad tea-chair crown across the central half-width of the approved front sheet', () => {
  const positions = requiredSpecValue(
    teaChair().find((p) => p.id === 'shell'),
    'shell'
  ).mesh.positions
  for (const sign of [-1, 1]) {
    const heights: number[] = []
    for (let i = 0; i < positions.length; i += 3) {
      if (Math.abs(positions[i] - sign * 0.12) < 0.003) {
        heights.push(positions[i + 2])
      }
    }
    expect(Math.max(...heights)).toBeGreaterThan(0.64)
  }
})

it('keeps both prepared armchair panels closed at both detail levels and tied to their source', async () => {
  const { createHash } = await import('node:crypto')
  const { default: prepared } =
    await import('../generated/armchair-panels.json')
  const { default: specification } =
    await import('../../../../../assets/asyra-office/models/furniture/furniture-model-spec.json')
  const components = requiredSpecValue(
    specification.modules.find((m) => m.moduleId === 'lounge-armchair'),
    'armchair'
  ).components.filter((c) => c.primitive === 'upholstered-profile-panel')
  expect(
    createHash('sha256').update(JSON.stringify(components)).digest('hex')
  ).toBe(prepared.sourceSha256)
  for (const panel of Object.values(prepared.panels)) {
    expect(panel.certifiedUpperBound).toBeLessThanOrEqual(
      panel.distant.maxError
    )
    expect(panel.distant.mesh.indices.length).toBeLessThan(
      panel.mesh.indices.length
    )
    for (const mesh of [panel.mesh, panel.distant.mesh]) {
      const edges = new Map<string, number>()
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const tri = mesh.indices.slice(i, i + 3)
        expect(new Set(tri).size).toBe(3)
        for (let k = 0; k < 3; k++) {
          const a = tri[k],
            b = tri[(k + 1) % 3],
            key = a < b ? `${a}:${b}` : `${b}:${a}`
          edges.set(key, (edges.get(key) ?? 0) + 1)
        }
      }
      expect([...edges.values()].every((n) => n === 2)).toBe(true)
      expect(mesh.positions.every(Number.isFinite)).toBe(true)
    }
  }
})

it('keeps the complete armchair below twenty thousand master triangles', async () => {
  const { catalogAsset } = await import('../catalog')
  const parts = catalogAsset('lounge-armchair')
  expect(
    parts.reduce((total, p) => total + p.mesh.indices.length / 3, 0)
  ).toBeLessThanOrEqual(20000)
  expect(parts.filter((p) => p.id.startsWith('foot-'))).toHaveLength(4)
})
