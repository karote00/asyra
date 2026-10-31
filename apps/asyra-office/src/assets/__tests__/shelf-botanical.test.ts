import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import { shelfBotanical } from '../shelf-botanical'
import { botanicalSurface } from '../botanical-surface'

it.each(['fittonia', 'snake', 'succulent'] as const)(
  'builds complete finite %s geometry with an open vessel and grounded support',
  (form) => {
    const parts = shelfBotanical(form, 0xeee5d7)
    expect(shelfBotanical(form, 0xeee5d7)).toEqual(parts)
    const pot = requiredSpecValue(
      parts.find((p) => p.id === 'pot'),
      'pot'
    )
    const soil = requiredSpecValue(
      parts.find((p) => p.id === 'soil'),
      'soil'
    )
    const z = (p: typeof pot) => p.mesh.positions.filter((_, i) => i % 3 === 2)
    expect(Math.max(...z(soil))).toBeLessThan(Math.max(...z(pot)))
    expect(Math.min(...parts.flatMap(z))).toBeCloseTo(0, 6)
    expect(
      parts.reduce((sum, p) => sum + p.mesh.indices.length / 3, 0)
    ).toBeLessThan(48000)
    for (const p of parts) {
      expect(p.mesh.positions.every(Number.isFinite), p.id).toBe(true)
      for (let i = 0; i < p.mesh.indices.length; i += 3) {
        const [a, b, c] = p.mesh.indices
          .slice(i, i + 3)
          .map((j) => p.mesh.positions.slice(j * 3, j * 3 + 3))
        const u = b.map((v, j) => v - a[j]),
          v = c.map((n, j) => n - a[j])
        expect(
          Math.hypot(
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
          ),
          p.id
        ).toBeGreaterThan(1e-14)
      }
    }
  }
)

it('distinguishes veined broad foliage, banded swords and a thick spiral succulent', () => {
  const fittonia = shelfBotanical('fittonia', 1),
    snake = shelfBotanical('snake', 1),
    succulent = shelfBotanical('succulent', 1)
  expect(fittonia.filter((p) => p.material === 'veined-leaf')).toHaveLength(17)
  expect(snake.filter((p) => p.material === 'snake-leaf')).toHaveLength(5)
  expect(snake.some((p) => p.id === 'pebbles')).toBe(true)
  expect(succulent.filter((p) => p.id.startsWith('leaf-'))).toHaveLength(21)
  for (const id of ['cat-ears', 'cat-feet', 'cat-face']) {
    expect(succulent.some((p) => p.id === id)).toBe(true)
  }
  const ears = requiredSpecValue(
    succulent.find((p) => p.id === 'cat-ears'),
    'cat-ears'
  ).mesh.positions
  expect(Math.max(...ears.filter((_, i) => i % 3 === 2))).toBeCloseTo(0.113)
  expect(Math.max(...ears.filter((_, i) => i % 3 === 1))).toBeGreaterThan(0.05)
  expect(Math.min(...ears.filter((_, i) => i % 3 === 1))).toBeLessThan(-0.05)
  // A cat ear has a thin front-to-back section, not a circular cone.
  const firstEar = ears.slice(0, 9 * 21 * 3)
  const earWidth =
    Math.max(...firstEar.filter((_, i) => i % 3 === 1)) -
    Math.min(...firstEar.filter((_, i) => i % 3 === 1))
  const earDepth =
    Math.max(...firstEar.filter((_, i) => i % 3 === 0)) -
    Math.min(...firstEar.filter((_, i) => i % 3 === 0))
  expect(earWidth / earDepth).toBeGreaterThan(2)
  const blade = requiredSpecValue(
    succulent.find((p) => p.id === 'leaf-0'),
    'leaf-0'
  ).mesh
  // Opposed samples at the middle ring prove real fleshy thickness, not a flat card.
  const a = (1 + 11 * 12 + 3) * 3,
    b = (1 + 11 * 12 + 9) * 3
  expect(
    Math.hypot(
      ...blade.positions
        .slice(a, a + 3)
        .map((v, i) => v - blade.positions[b + i])
    )
  ).toBeGreaterThan(0.008)
})

it('preserves all geometry when replacing pot color and scales the complete assembly uniformly', () => {
  for (const form of ['fittonia', 'snake', 'succulent'] as const) {
    const a = shelfBotanical(form, 0xeee5d7),
      b = shelfBotanical(form, 0x9b6543)
    expect(a.map((p) => p.mesh)).toEqual(b.map((p) => p.mesh))
    expect(
      requiredSpecValue(
        b.find((p) => p.id === 'pot'),
        'pot'
      ).color
    ).toBe(0x9b6543)
    const scaled = shelfBotanical(form, 0xeee5d7, 0.8)
    a.forEach((p, i) =>
      p.mesh.positions.forEach((v, j) =>
        expect(scaled[i].mesh.positions[j]).toBeCloseTo(v * 0.8, 10)
      )
    )
  }
})

it('encodes light veins and yellow leaf borders as pigment with neutral lighting normals', () => {
  const veins = botanicalSurface('veined-leaf'),
    snake = botanicalSurface('snake-leaf')
  const sample = (s: typeof veins, x: number, y: number) =>
    s.albedo.slice((y * s.width + x) * 4, (y * s.width + x) * 4 + 3)
  expect(sample(veins, 240, 128)[0]).toBeGreaterThan(180)
  expect(sample(snake, 240, 0)[0]).toBeGreaterThan(150)
  expect(sample(snake, 240, 128)[0]).toBeLessThan(100)
  expect(veins.normals?.slice(0, 4)).toEqual([128, 128, 255, 255])
})
