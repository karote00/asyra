import { expect, it } from 'vitest'
import { frameNightLight } from '../frame-night-light'
import { pantryNightLight } from '../pantry-night-light'
import { meshBounds } from '../../scene/room-furnishing-helpers'

it('retains the original lamp and constructs a distinct framed lamp with a bottom emitter', () => {
  const original = pantryNightLight()
  const parts = frameNightLight()
  expect(original.map((p) => p.id)).toContain('top-loop')
  expect(pantryNightLight()).toEqual(original)
  expect(parts.map((p) => p.id)).toEqual([
    'base',
    'reflector',
    'light-core',
    'glass-cylinder',
    'glass-top',
    'glass-rim',
    'width-frame',
    'depth-frame'
  ])
  const bounds = meshBounds(parts)
  for (const axis of [0, 1])
    expect(bounds[axis][1] - bounds[axis][0]).toBeCloseTo(0.148, 6)
  expect(bounds[2]).toEqual([0, 0.3])
  const core = parts.filter((p) => p.id === 'light-core')
  expect(meshBounds(core)[2][1]).toBeCloseTo(0.09, 6)
  expect(core[0].emissiveIntensity).toBe(1.75)
  expect(parts.filter((p) => p.emissiveIntensity).length).toBe(1)
  expect(parts.find((p) => p.id === 'glass-cylinder')?.opacity).toBe(0.13)
  // Two perpendicular straps place uprights on four sides and cross at the top.
  for (const [axis, id] of ['width-frame', 'depth-frame'].entries()) {
    const frame = parts.filter((p) => p.id === id)
    const b = meshBounds(frame)
    expect(b[axis]).toEqual([-0.06, 0.06])
    expect(b[2]).toEqual([0.059, axis === 0 ? 0.294 : 0.3])
    for (let i = 0; i < frame[0].mesh.positions.length; i += 3) {
      const position = frame[0].mesh.positions.slice(i, i + 3)
      if (position[2] < 0.27)
        expect(Math.abs(position[axis])).toBeGreaterThanOrEqual(0.051 - 1e-8)
    }
  }
  for (const p of parts) {
    expect(p.mesh.positions.every(Number.isFinite)).toBe(true)
    for (const index of p.mesh.indices)
      expect(index).toBeLessThan(p.mesh.positions.length / 3)
  }
})

it('replaces individual appearances without changing geometry or transparency', () => {
  const parts = frameNightLight()
  const changed = frameNightLight({
    'width-frame': 0x123456,
    'light-core': 0xffcc88
  })
  expect(changed.map((p) => p.mesh)).toEqual(parts.map((p) => p.mesh))
  expect(changed.map((p) => p.opacity)).toEqual(parts.map((p) => p.opacity))
  expect(changed.find((p) => p.id === 'width-frame')?.color).toBe(0x123456)
  expect(changed.find((p) => p.id === 'light-core')?.emissive).toBe(0xffcc88)
})
