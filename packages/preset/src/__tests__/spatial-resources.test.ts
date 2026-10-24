import { expect, it, vi } from 'vitest'
import { MeshStandardMaterial } from 'three'
import { SurfaceTextureStore } from '../spatial-engine.js'
import { readSpatialSurface } from '../spatial-contract.js'
it('shares one GPU texture pair across materials and releases it only after the last owner', () => {
  const store = new SurfaceTextureStore()
  const surface = readSpatialSurface({
    width: 2,
    height: 2,
    albedo: Array(16).fill(200),
    normals: Array(16).fill(128)
  })
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
