import { expect, it, vi } from 'vitest'
import { MeshStandardMaterial } from 'three'
import { readSpatialSurface, SurfaceTextureStore } from '../surface-textures'
import {
  CUCUMBER_LEAF_SURFACE,
  TOMATO_LEAF_SURFACE
} from '../../domain/leaf-surface'

it('detaches and validates surface pixels and shares accepted immutable values', () => {
  const source = {
    width: 2,
    height: 2,
    albedo: Array(16).fill(200),
    normals: Array(16).fill(128)
  }
  const accepted = readSpatialSurface(source)
  source.albedo[0] = 0
  expect(accepted.albedo[0]).toBe(200)
  expect(Object.isFrozen(accepted.albedo)).toBe(true)
  expect(readSpatialSurface(accepted)).toBe(accepted)
  for (const invalid of [
    { ...source, width: 513 },
    { ...source, albedo: [2] },
    { ...source, normals: Array(16).fill(NaN) }
  ])
    expect(() => readSpatialSurface(invalid)).toThrow()
})

it('shares one GPU texture pair across materials and releases it only after the last owner', () => {
  const store = new SurfaceTextureStore()
  const surface = readSpatialSurface(CUCUMBER_LEAF_SURFACE)
  const a = new MeshStandardMaterial(),
    b = new MeshStandardMaterial()
  store.apply(a, surface)
  store.apply(b, surface)
  expect(a.map).toBe(b.map)
  expect(a.normalMap).toBe(b.normalMap)
  if (!a.map || !a.normalMap) throw new Error('Missing maps')
  const colorDispose = vi.spyOn(a.map, 'dispose'),
    normalDispose = vi.spyOn(a.normalMap, 'dispose')
  a.dispose()
  expect(colorDispose).not.toHaveBeenCalled()
  b.dispose()
  expect(colorDispose).toHaveBeenCalledTimes(1)
  expect(normalDispose).toHaveBeenCalledTimes(1)
  const replacement = new MeshStandardMaterial()
  store.apply(replacement, surface)
  expect(replacement.map).not.toBe(a.map)
  replacement.dispose()
})

it('distinguishes palmate and pinnate venation and encodes real microrelief normals', () => {
  for (const surface of [CUCUMBER_LEAF_SURFACE, TOMATO_LEAF_SURFACE]) {
    expect(surface.albedo.length).toBe(256 * 256 * 4)
    expect(surface.normals.length).toBe(surface.albedo.length)
    let maximumNormalError = 0
    const colors = new Set<number>(),
      slopes = new Set<number>()
    for (let i = 0; i < surface.albedo.length; i += 4) {
      colors.add(surface.albedo[i])
      slopes.add(surface.normals[i])
      const vector = surface.normals
        .slice(i, i + 3)
        .map((v) => (v / 255) * 2 - 1)
      maximumNormalError = Math.max(
        maximumNormalError,
        Math.abs(Math.hypot(...vector) - 1)
      )
    }
    expect(maximumNormalError).toBeLessThan(0.02)
    expect(colors.size).toBeGreaterThan(50)
    expect(slopes.size).toBeGreaterThan(30)
    const green = (u: number, v: number) =>
      surface.albedo[(Math.round(v * 255) * 256 + Math.round(u * 255)) * 4 + 1]
    expect(green(0.5, 0.63)).toBeGreaterThan(green(0.46, 0.63) + 15)
  }
  expect(CUCUMBER_LEAF_SURFACE.albedo).not.toEqual(TOMATO_LEAF_SURFACE.albedo)
  expect(CUCUMBER_LEAF_SURFACE.normals).not.toEqual(TOMATO_LEAF_SURFACE.normals)
})
