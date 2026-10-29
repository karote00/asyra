import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import {
  pantryPitcher,
  pantryTumbler,
  pantryBrush,
  pantryCounterPlant
} from '../pantry-counterware'
import { meshBounds } from '../../scene/room-furnishing-helpers'
it('constructs a hollow pitcher body with a pouring lip opposite its attached handle', () => {
  const p = pantryPitcher(),
    body = meshBounds(p.filter((p) => p.id === 'vessel')),
    handle = meshBounds(p.filter((p) => p.id === 'handle'))
  expect(body[2][0]).toBe(0)
  expect(body[2][1]).toBeCloseTo(0.255, 6)
  expect(-body[0][0]).toBeGreaterThan(body[0][1] + 0.015)
  expect(handle[0][0]).toBeLessThan(body[0][1])
  expect(handle[0][1]).toBeGreaterThan(body[0][1] + 0.045)
  // The rim must leave the centre open, with an inner wall below the top.
  const m = p[0].mesh
  for (let i = 0; i < m.positions.length; i += 3)
    if (m.positions[i + 2] > 0.22)
      expect(Math.hypot(m.positions[i], m.positions[i + 1])).toBeGreaterThan(
        0.078
      )
  expect(
    pantryPitcher(0xabcdef)
      .filter((p) => ['vessel', 'handle'].includes(p.id))
      .every((p) => p.color === 0xabcdef)
  ).toBe(true)
})
it('keeps the insulated tumbler closed and narrower than the pitcher', () => {
  const p = pantryTumbler(),
    b = meshBounds(p)
  expect(b[2][0]).toBe(0)
  expect(b[2][1]).toBeCloseTo(0.19, 6)
  expect(b[0][1] - b[0][0]).toBeLessThan(0.075)
  expect(p.map((p) => p.id)).toEqual(['body', 'lid-seam', 'lid'])
})
it('uses one brush and distinguishes the low preparation crown from the taller sink plant', () => {
  expect(pantryBrush().filter((p) => p.id === 'brush-head')).toHaveLength(1)
  const a = pantryCounterPlant('preparation'),
    b = pantryCounterPlant('sink')
  expect(meshBounds(a)[2][0]).toBeCloseTo(0, 6)
  expect(meshBounds(b)[2][1]).toBeGreaterThan(meshBounds(a)[2][1])
  expect(
    a.filter((p) => p.id.startsWith('leaf-')).length
  ).toBeGreaterThanOrEqual(10)
})

it('keeps the source pitcher nearly cylindrical and includes its recessed top insert', () => {
  const pieces = pantryPitcher()
  const mesh = requiredSpecValue(
    pieces.find((p) => p.id === 'vessel'),
    'pitcher vessel'
  ).mesh
  const radiusAt = (z: number) =>
    Math.max(
      ...mesh.positions
        .filter(
          (_, i) => i % 3 === 0 && Math.abs(mesh.positions[i + 2] - z) < 1e-6
        )
        .map(Math.abs)
    )
  expect(radiusAt(0) / radiusAt(0.255)).toBeGreaterThan(0.79)
  expect(pieces.some((p) => p.id === 'top-insert')).toBe(true)
})
