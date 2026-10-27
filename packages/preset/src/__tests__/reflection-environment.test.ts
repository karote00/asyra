import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { ReflectionEnvironment } from '../spatial/reflection-environment.js'

it('creates one shared reflection resource, refreshes intensity and reuses it after disable/re-enable', () => {
  const target = new THREE.WebGLRenderTarget(8, 8)
  const release = vi.spyOn(target, 'dispose')
  const create = vi.fn(() => target)
  const owner = new ReflectionEnvironment(create)
  const first = new THREE.MeshStandardMaterial()
  const second = new THREE.MeshStandardMaterial()
  owner.apply(first, 0, {})
  expect(create).not.toHaveBeenCalled()
  expect(first.envMap).toBeNull()
  owner.apply(first, 0.8, {})
  const version = first.version
  for (let i = 0; i < 20; i++) owner.apply(first, 1.2, {})
  owner.apply(second, 0.6, {})
  expect(create).toHaveBeenCalledOnce()
  expect(first.envMap).toBe(target.texture)
  expect(second.envMap).toBe(first.envMap)
  expect(first.envMapIntensity).toBe(1.2)
  expect(first.version).toBe(version)
  owner.apply(first, 0, {})
  expect(first.envMap).toBeNull()
  owner.apply(first, 0.5, {})
  expect(first.envMap).toBe(target.texture)
  expect(create).toHaveBeenCalledOnce()
  owner.dispose()
  owner.dispose()
  expect(release).toHaveBeenCalledOnce()
  expect(() => owner.apply(first, 1, {})).toThrow(/disposed/)
  first.dispose()
  second.dispose()
})

it('does not replace material state after failed environment construction', () => {
  const create = vi.fn(() => {
    throw new Error('GPU unavailable')
  })
  const owner = new ReflectionEnvironment(create)
  const material = new THREE.MeshStandardMaterial()
  expect(() => owner.apply(material, 1, {})).toThrow('GPU unavailable')
  expect(material.envMap).toBeNull()
  expect(material.envMapIntensity).toBe(1)
  owner.dispose()
  material.dispose()
})

it('rejects unsupported drivers instead of silently dropping requested reflections', () => {
  const owner = new ReflectionEnvironment()
  const material = new THREE.MeshStandardMaterial()
  expect(() => owner.apply(material, 1, {})).toThrow(
    /requires a WebGL renderer/
  )
  owner.dispose()
  material.dispose()
})
