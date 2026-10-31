import { expect, it } from 'vitest'
import { pantryNightLight } from '../pantry-night-light'
import { meshBounds } from '../../scene/room-furnishing-helpers'

it('retains the source light envelope and separates the glass, diffuser and cap', () => {
  const parts = pantryNightLight()
  const bounds = meshBounds(parts)
  expect(bounds[2][0]).toBeCloseTo(0, 6)
  expect(bounds[2][1]).toBeCloseTo(0.3, 6)
  for (const axis of [0, 1]) {
    expect(bounds[axis][1] - bounds[axis][0]).toBeCloseTo(0.136, 6)
  }
  const shade = meshBounds(parts.filter((p) => p.id === 'glass-shade'))
  const core = meshBounds(parts.filter((p) => p.id === 'diffuser'))
  for (const axis of [0, 1, 2]) {
    expect(core[axis][0]).toBeGreaterThan(shade[axis][0])
    expect(core[axis][1]).toBeLessThan(shade[axis][1])
  }
  const cap = meshBounds(parts.filter((p) => p.id === 'cap'))
  const loop = meshBounds(parts.filter((p) => p.id === 'top-loop'))
  expect(loop[2][0]).toBeLessThan(cap[2][1])
  expect(loop[2][1]).toBeGreaterThan(cap[2][1])
  for (const p of parts) {
    expect(p.mesh.positions.every(Number.isFinite)).toBe(true)
    for (const index of p.mesh.indices) {
      expect(index).toBeLessThan(p.mesh.positions.length / 3)
    }
  }
})

it('changes a selected light region color without changing geometry or glass transparency', () => {
  const original = pantryNightLight()
  const replacement = pantryNightLight({ base: 0x123456 })
  for (let i = 0; i < original.length; i++) {
    expect(replacement[i].mesh).toEqual(original[i].mesh)
    expect(replacement[i].opacity).toBe(original[i].opacity)
    expect(replacement[i].color).toBe(
      original[i].id === 'base' ? 0x123456 : original[i].color
    )
  }
})

it('emits warm light only from the core while preserving transparent glass and dark housing', () => {
  const parts = pantryNightLight()
  const core = parts.find((p) => p.id === 'diffuser')
  expect(core).toMatchObject({ emissive: 0xffb35c, emissiveIntensity: 1.75 })
  for (const part of parts.filter((p) => p.id !== 'diffuser')) {
    expect(part).not.toHaveProperty('emissiveIntensity')
  }
  expect(parts.find((p) => p.id === 'glass-shade')?.opacity).toBe(0.22)
})
