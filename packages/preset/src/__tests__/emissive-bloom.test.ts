import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  EmissiveBloom,
  requireBloomRenderer
} from '../spatial/emissive-bloom.js'

function setup() {
  let target: THREE.WebGLRenderTarget | null = null
  const color = new THREE.Color(0x334455)
  let alpha = 0.7
  const driver = {
    autoClear: true,
    shadowMap: { autoUpdate: true },
    getRenderTarget: () => target,
    setRenderTarget: vi.fn((value: THREE.WebGLRenderTarget | null) => {
      target = value
    }),
    getClearColor: (out: THREE.Color) => out.copy(color),
    getClearAlpha: () => alpha,
    setClearColor: (value: THREE.Color | number, nextAlpha: number) => {
      color.set(value)
      alpha = nextAlpha
    },
    clear: vi.fn(),
    render: vi.fn()
  }
  const bloom = new EmissiveBloom(requireBloomRenderer(driver), {
    strength: 0.65,
    radius: 8
  })
  const scene = new THREE.Scene()
  const background = new THREE.Color(0x123456)
  scene.background = background
  const source = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffb35c,
    emissiveIntensity: 2.5
  })
  const normal = new THREE.MeshStandardMaterial({ color: 0xffffff })
  const glass = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const lamp = new THREE.Mesh(geometry, source)
  const wall = new THREE.Mesh(geometry, normal)
  const shade = new THREE.Mesh(geometry, glass)
  scene.add(lamp, wall, shade)
  return {
    driver,
    bloom,
    scene,
    background,
    source,
    normal,
    glass,
    geometry,
    lamp,
    wall,
    shade,
    camera: new THREE.PerspectiveCamera()
  }
}

it('masks only emission, preserves occlusion alpha and restores all renderer and scene state', () => {
  const f = setup()
  f.bloom.setSize(100, 80, 2)
  let firstMask: THREE.MeshBasicMaterial | undefined
  f.driver.render.mockImplementationOnce(() => {
    firstMask = f.lamp.material as unknown as THREE.MeshBasicMaterial
    expect(firstMask.color.toArray()).toEqual(
      f.source.emissive.clone().multiplyScalar(2.5).toArray()
    )
    expect(
      (f.wall.material as unknown as THREE.MeshBasicMaterial).color.getHex()
    ).toBe(0)
    expect(f.shade.material.opacity).toBe(0.22)
    expect(f.shade.material.depthWrite).toBe(false)
    expect(f.scene.background).toBeNull()
    expect(f.driver.shadowMap.autoUpdate).toBe(false)
    const target = f.driver.getRenderTarget()
    expect([target?.width, target?.height]).toEqual([200, 160])
  })
  f.bloom.render(f.scene, f.camera)
  expect(f.driver.render).toHaveBeenCalledTimes(3)
  expect(f.lamp.material).toBe(f.source)
  expect(f.wall.material).toBe(f.normal)
  expect(f.shade.material).toBe(f.glass)
  expect(f.scene.background).toBe(f.background)
  expect(f.driver.getRenderTarget()).toBeNull()
  expect(f.driver.getClearColor(new THREE.Color()).getHex()).toBe(0x334455)
  expect(f.driver.getClearAlpha()).toBe(0.7)
  expect(f.driver.autoClear).toBe(true)
  expect(f.driver.shadowMap.autoUpdate).toBe(true)
  // Reuse the same mask material while changing its actual source emission.
  f.source.emissiveIntensity = 0
  f.driver.render.mockImplementationOnce(() => {
    expect(f.lamp.material).toBe(firstMask)
    expect(
      (f.lamp.material as unknown as THREE.MeshBasicMaterial).color.getHex()
    ).toBe(0)
  })
  f.bloom.render(f.scene, f.camera)
  if (!firstMask) {
    throw new Error('Missing emission mask')
  }
  const release = vi.spyOn(firstMask, 'dispose')
  f.source.dispose()
  expect(release).toHaveBeenCalledOnce()
  const targets = [
    ...new Set(
      f.driver.setRenderTarget.mock.calls
        .map(([t]) => t)
        .filter((t): t is THREE.WebGLRenderTarget => t !== null)
    )
  ]
  const targetReleases = targets.map((t) => vi.spyOn(t, 'dispose'))
  f.bloom.dispose()
  f.bloom.dispose()
  expect(release).toHaveBeenCalledOnce()
  for (const dispose of targetReleases) {
    expect(dispose).toHaveBeenCalledOnce()
  }
  f.geometry.dispose()
  f.normal.dispose()
  f.glass.dispose()
})

it('restores materials, target, background and clear state after a failed mask render', () => {
  const f = setup()
  f.driver.render.mockImplementationOnce(() => {
    throw new Error('GPU failure')
  })
  expect(() => f.bloom.render(f.scene, f.camera)).toThrow('GPU failure')
  expect(f.lamp.material).toBe(f.source)
  expect(f.scene.background).toBe(f.background)
  expect(f.driver.getRenderTarget()).toBeNull()
  expect(f.driver.getClearAlpha()).toBe(0.7)
  expect(f.driver.autoClear).toBe(true)
  expect(f.driver.shadowMap.autoUpdate).toBe(true)
  f.bloom.dispose()
  f.geometry.dispose()
  f.source.dispose()
  f.normal.dispose()
  f.glass.dispose()
})

it('rejects unsupported render drivers instead of silently omitting bloom', () => {
  expect(() => requireBloomRenderer({ render: vi.fn() })).toThrow(
    /requires renderer method/
  )
})
